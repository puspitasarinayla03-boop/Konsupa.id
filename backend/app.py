"""
app.py
~~~~~~
REST API Flask untuk konsupa.id — Sistem Informasi Pola Konsumsi Pangan.
Hanya mengandung routing, validasi input, dan penanganan error.
Semua logika model ada di model_service.py.

Endpoint:
  GET  /api/health                        – liveness check
  GET  /api/features                      – daftar fitur model
  GET  /api/cluster-names                 – peta cluster_id → nama klaster
  POST /api/predict                       – prediksi klaster + wilayah mirip
  GET  /api/wilayah                       – seluruh 514 wilayah + klaster
  GET  /api/wilayah/<nama>/komoditas      – rincian 26 komoditas pelengkap satu wilayah
  GET  /api/klaster/<int:cid>/profil      – profil rata-rata klaster
  GET  /api/klaster/<int:cid>/wilayah     – daftar wilayah dalam klaster
  GET  /api/standar-pph                   – standar PPH per kelompok
  POST /api/reload                        – reload artefak (dev only)
"""

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import model_service as ms

# ---------------------------------------------------------------------------
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})
# ---------------------------------------------------------------------------


def _ok(data, status=200):
    return jsonify({"status": "ok", "data": data}), status


def _err(message, status=400):
    return jsonify({"status": "error", "message": message}), status


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------
@app.route("/api/health", methods=["GET"])
def health():
    return _ok({"message": "konsupa.id API berjalan", "version": "1.0.0"})


# ---------------------------------------------------------------------------
# Metadata model
# ---------------------------------------------------------------------------
@app.route("/api/features", methods=["GET"])
def get_features():
    try:
        return _ok(ms.get_features())
    except FileNotFoundError as e:
        return _err(str(e), 503)
    except Exception as e:
        return _err(str(e), 500)


@app.route("/api/cluster-names", methods=["GET"])
def get_cluster_names():
    try:
        return _ok(ms.get_cluster_names())
    except FileNotFoundError as e:
        return _err(str(e), 503)
    except Exception as e:
        return _err(str(e), 500)


# ---------------------------------------------------------------------------
# Prediksi
# ---------------------------------------------------------------------------
@app.route("/api/predict", methods=["POST"])
def predict():
    """
    Body JSON:
    {
      "input": { "fitur1": 0.5, "fitur2": 1.2, ... },
      "exclude_wilayah": "Kab. Bogor",   // opsional
      "top_n": 5                          // opsional, default 5
    }
    """
    body = request.get_json(silent=True)
    if not body or "input" not in body:
        return _err("Body harus berisi key 'input' dengan nilai dict fitur.")

    input_values    = body["input"]
    exclude_wilayah = body.get("exclude_wilayah")
    top_n           = int(body.get("top_n", 5))

    try:
        prediction = ms.predict_cluster(input_values)
        cluster_id = prediction["cluster_id"]

        similar    = ms.get_similar_regions(cluster_id, exclude_wilayah, top_n)
        profil     = ms.get_profil_klaster(cluster_id)

        return _ok({
            "prediction": prediction,
            "profil_klaster": profil,
            "wilayah_mirip":  similar,
        })

    except ValueError as e:
        return _err(str(e), 422)
    except FileNotFoundError as e:
        return _err(str(e), 503)
    except Exception as e:
        return _err(str(e), 500)


# ---------------------------------------------------------------------------
# Wilayah
# ---------------------------------------------------------------------------
@app.route("/api/wilayah", methods=["GET"])
def get_all_wilayah():
    try:
        return _ok(ms.get_all_wilayah())
    except FileNotFoundError as e:
        return _err(str(e), 503)
    except Exception as e:
        return _err(str(e), 500)


@app.route("/api/wilayah/<string:nama>/komoditas", methods=["GET"])
def get_komoditas(nama):
    try:
        data = ms.get_komoditas_detail(nama)
        if data is None:
            return _err(f"Wilayah '{nama}' tidak ditemukan.", 404)
        return _ok(data)
    except FileNotFoundError as e:
        return _err(str(e), 503)
    except Exception as e:
        return _err(str(e), 500)


# ---------------------------------------------------------------------------
# Klaster
# ---------------------------------------------------------------------------
@app.route("/api/klaster/<int:cid>/profil", methods=["GET"])
def get_profil(cid):
    try:
        return _ok(ms.get_profil_klaster(cid))
    except FileNotFoundError as e:
        return _err(str(e), 503)
    except Exception as e:
        return _err(str(e), 500)


@app.route("/api/klaster/<int:cid>/wilayah", methods=["GET"])
def get_wilayah_klaster(cid):
    top_n = request.args.get("top_n", default=None, type=int)
    try:
        data = ms.get_similar_regions(cid, top_n=top_n or 9999)
        return _ok(data)
    except FileNotFoundError as e:
        return _err(str(e), 503)
    except Exception as e:
        return _err(str(e), 500)


# ---------------------------------------------------------------------------
# Standar PPH
# ---------------------------------------------------------------------------
@app.route("/api/standar-pph", methods=["GET"])
def get_standar_pph():
    try:
        return _ok(ms.get_standar_pph())
    except FileNotFoundError as e:
        return _err(str(e), 503)
    except Exception as e:
        return _err(str(e), 500)


# ---------------------------------------------------------------------------
# Dev utility: reload artefak
# ---------------------------------------------------------------------------
@app.route("/api/reload", methods=["POST"])
def reload():
    if os.getenv("FLASK_ENV") == "production":
        return _err("Endpoint ini hanya tersedia di mode development.", 403)
    try:
        ms.reload_artifacts()
        return _ok({"message": "Artefak berhasil dimuat ulang."})
    except Exception as e:
        return _err(str(e), 500)


# ---------------------------------------------------------------------------
if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_ENV", "development") != "production"
    app.run(host="0.0.0.0", port=port, debug=debug)
