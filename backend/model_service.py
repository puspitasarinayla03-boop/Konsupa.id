"""
model_service.py
~~~~~~~~~~~~~~~~
Semua logika bisnis model Gaussian Mixture Model (GMM) pangan:
- Memuat artefak (gmm_pangan_bundle.pkl + hasil_clustering_gmm.csv + komoditas_wilayah.csv) sekali saat startup
- Transformasi Yeo-Johnson & inferensi soft-clustering GMM (predict_proba) untuk input data baru
- Mencari wilayah-wilayah dengan profil mirip (data Tahun 2025)
- Mengembalikan rincian komoditas, profil klaster, dan standar PPH
"""

import json
import joblib
import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.decomposition import PCA

ARTIFACTS_DIR = Path(__file__).parent / "artifacts"
FRONTEND_WILAYAH_JSON = Path(__file__).resolve().parent.parent / "frontend" / "src" / "data" / "data_wilayah.json"

# ---------------------------------------------------------------------------
# Singleton: artefak dimuat sekali
# ---------------------------------------------------------------------------
_model_bundle = None   # dict: model, transformer, features, cluster_names, pph, n_components, transformer_name
_df_wilayah   = None   # DataFrame: hasil_clustering_gmm.csv (difilter Tahun == 2025 + metadata wilayah)
_df_komoditas = None   # DataFrame: komoditas_wilayah.csv (difilter Tahun == 2025)
_df_profil    = None   # DataFrame: profil rata-rata tiap klaster (dihitung dari _df_wilayah)
_df_standar   = None   # DataFrame: standar PPH dari bundle['pph']
_pca_variance = None   # tuple: (pc1_var_pct, pc2_var_pct)

DEFAULT_FEATURES = [
    "padi-padian",
    "umbi-umbian",
    "pangan hewani",
    "minyak dan lemak",
    "buah/biji berminyak",
    "kacang-kacangan",
    "gula",
    "sayur dan buah",
]

DEFAULT_CLUSTER_NAMES = {
    0: "Pola Beras/Serealia Tinggi",
    1: "Pola Kacang-kacangan & Sayur-Buah Tinggi",
    2: "Pola Umbi-umbian Tinggi",
    3: "Pola Hewani & Minyak-Lemak Tinggi",
}

DEFAULT_PPH = {
    "padi-padian": 275,
    "umbi-umbian": 100,
    "pangan hewani": 150,
    "minyak dan lemak": 20,
    "buah/biji berminyak": 10,
    "kacang-kacangan": 35,
    "gula": 30,
    "sayur dan buah": 250,
}

DEFAULT_MEDIANS = {
    "padi-padian": 289.0,
    "umbi-umbian": 38.4,
    "pangan hewani": 132.3,
    "minyak dan lemak": 28.0,
    "buah/biji berminyak": 2.7,
    "kacang-kacangan": 20.3,
    "gula": 21.6,
    "sayur dan buah": 242.4,
}


def _load_wilayah_metadata() -> dict:
    """Muat mapping Kode_Wilayah -> {Kabupaten_Kota, Provinsi} dari data_wilayah.json jika tersedia."""
    if not FRONTEND_WILAYAH_JSON.exists():
        return {}
    try:
        with open(FRONTEND_WILAYAH_JSON, "r", encoding="utf-8") as f:
            records = json.load(f)
        return {
            int(r["Kode_Wilayah"]): {
                "Kabupaten_Kota": r.get("Kabupaten_Kota", ""),
                "Provinsi": r.get("Provinsi", ""),
            }
            for r in records
            if "Kode_Wilayah" in r
        }
    except Exception:
        return {}


def _load_artifacts():
    """Muat semua artefak GMM ke memori (dipanggil sekali)."""
    global _model_bundle, _df_wilayah, _df_komoditas, _df_profil, _df_standar, _pca_variance

    bundle_path = ARTIFACTS_DIR / "gmm_pangan_bundle.pkl"
    if not bundle_path.exists():
        raise FileNotFoundError(
            f"Bundle model GMM belum ditemukan di {bundle_path}. "
            "Pastikan file gmm_pangan_bundle.pkl berada di folder artifacts/."
        )

    _model_bundle = joblib.load(bundle_path)
    features = _model_bundle.get("features", DEFAULT_FEATURES)
    transformer = _model_bundle["transformer"]

    # Muat hasil clustering GMM dan filter ke Tahun == 2025 agar tiap Kode_Wilayah tampil 1 kali
    gmm_csv_path = ARTIFACTS_DIR / "hasil_clustering_gmm.csv"
    if not gmm_csv_path.exists():
        raise FileNotFoundError(f"File hasil clustering tidak ditemukan di {gmm_csv_path}.")

    df_gmm = pd.read_csv(gmm_csv_path)
    if "Tahun" in df_gmm.columns:
        df_2025 = df_gmm[df_gmm["Tahun"] == 2025].copy()
        if not df_2025.empty:
            df_gmm = df_2025

    df_gmm = df_gmm.drop_duplicates(subset=["Kode_Wilayah"]).reset_index(drop=True)

    # Perkaya dengan Kabupaten_Kota & Provinsi jika belum ada di CSV
    meta_map = _load_wilayah_metadata()
    if "Kabupaten_Kota" not in df_gmm.columns:
        df_gmm["Kabupaten_Kota"] = df_gmm["Kode_Wilayah"].map(
            lambda k: meta_map.get(int(k), {}).get("Kabupaten_Kota", f"Wilayah {k}")
        )
    if "Provinsi" not in df_gmm.columns:
        df_gmm["Provinsi"] = df_gmm["Kode_Wilayah"].map(
            lambda k: meta_map.get(int(k), {}).get("Provinsi", "")
        )

    # Normalisasi kolom klaster & probabilitas untuk kompatibilitas API
    df_gmm["Cluster"] = df_gmm["Cluster"].astype(int)
    df_gmm["cluster"] = df_gmm["Cluster"]
    if "Prob_Max" in df_gmm.columns:
        df_gmm["Prob_Max"] = df_gmm["Prob_Max"].astype(float)
        df_gmm["prob_max"] = df_gmm["Prob_Max"]

    # Hitung proyeksi PCA 2D & distribusi probabilitas 4 klaster pada ruang Yeo-Johnson
    if all(f in df_gmm.columns for f in features):
        X_scaled = transformer.transform(df_gmm[features])

        model = _model_bundle["model"]
        probas = model.predict_proba(X_scaled)
        for cid in range(probas.shape[1]):
            df_gmm[f"prob_{cid}"] = np.round(probas[:, cid] * 100, 1)

        pca = PCA(n_components=2, random_state=42)
        coords = pca.fit_transform(X_scaled)
        df_gmm["pc1"] = np.round(coords[:, 0], 4)
        df_gmm["pc2"] = np.round(coords[:, 1], 4)
        _pca_variance = (
            round(float(pca.explained_variance_ratio_[0]) * 100, 1),
            round(float(pca.explained_variance_ratio_[1]) * 100, 1),
        )

    _df_wilayah = df_gmm

    # Muat data 26 komoditas dan filter ke Tahun == 2025
    komoditas_path = ARTIFACTS_DIR / "komoditas_wilayah.csv"
    df_kom = pd.read_csv(komoditas_path)
    if "Tahun" in df_kom.columns:
        df_kom_2025 = df_kom[df_kom["Tahun"] == 2025].copy()
        if not df_kom_2025.empty:
            df_kom = df_kom_2025
    _df_komoditas = df_kom.drop_duplicates(subset=["Kode_Wilayah"]).reset_index(drop=True)

    # Hitung profil rata-rata tiap klaster dari hasil clustering 2025
    cluster_names = _model_bundle.get("cluster_names", DEFAULT_CLUSTER_NAMES)
    profil_rows = []
    total_wilayah = len(_df_wilayah)
    for cid in sorted(cluster_names.keys()):
        sub = _df_wilayah[_df_wilayah["Cluster"] == cid]
        row = {
            "Cluster": int(cid),
            "cluster_name": cluster_names[cid],
            "jumlah_wilayah": int(len(sub)),
            "persentase": round((len(sub) / total_wilayah) * 100, 1) if total_wilayah else 0.0,
        }
        for f in features:
            row[f] = round(float(sub[f].mean()), 2) if not sub.empty and f in sub.columns else 0.0
        if "Prob_Max" in sub.columns and not sub.empty:
            row["avg_prob_max"] = round(float(sub["Prob_Max"].mean()), 4)
        profil_rows.append(row)
    _df_profil = pd.DataFrame(profil_rows)

    # Standar PPH dari bundle['pph']
    pph_dict = _model_bundle.get("pph", DEFAULT_PPH)
    _df_standar = pd.DataFrame([
        {"kelompok_pangan": k, "standar_gram": v}
        for k, v in pph_dict.items()
    ])


def _ensure_loaded():
    if _model_bundle is None:
        _load_artifacts()


def get_features() -> list:
    """Kembalikan daftar & urutan 8 fitur yang dipakai model GMM."""
    _ensure_loaded()
    return list(_model_bundle.get("features", DEFAULT_FEATURES))


def get_cluster_names() -> dict:
    """Kembalikan peta {cluster_id: nama_pola}."""
    try:
        _ensure_loaded()
        raw = _model_bundle.get("cluster_names", DEFAULT_CLUSTER_NAMES)
        return {int(k): v for k, v in raw.items()}
    except FileNotFoundError:
        return DEFAULT_CLUSTER_NAMES


def predict_cluster(input_values: dict) -> dict:
    """
    Tentukan klaster GMM & distribusi probabilitas keanggotaan untuk satu record input.

    Alur inferensi:
    1. Validasi 8 kelompok pangan (minimal 4 terisi, numerik, 0 <= val <= 5000).
    2. Imputasi median nasional Tahun 2025 untuk fitur yang kosong.
    3. Susun ke DataFrame sesuai urutan bundle['features'].
    4. Transformasi menggunakan bundle['transformer'].transform(x_new) (Yeo-Johnson).
    5. Hitung probabilitas soft-clustering via bundle['model'].predict_proba(x_scaled)[0].
    6. Tandai is_transition = True jika prob_max < 0.7.
    """
    _ensure_loaded()

    if not isinstance(input_values, dict):
        raise ValueError("Parameter input harus berupa dictionary pasangan nama fitur dan nilai numerik.")

    features = _model_bundle.get("features", DEFAULT_FEATURES)
    transformer = _model_bundle["transformer"]
    model = _model_bundle["model"]
    cluster_names = get_cluster_names()

    # 1. Validasi & parsing nilai
    parsed_values = {}
    imputed_features = {}
    invalid_errors = []

    for f in features:
        raw_val = input_values.get(f)
        if raw_val is not None and str(raw_val).strip() != "":
            try:
                num = float(raw_val)
                if num < 0:
                    invalid_errors.append(f"Fitur '{f}' tidak boleh bernilai negatif ({num}).")
                elif num > 5000:
                    invalid_errors.append(f"Fitur '{f}' ({num} g) melebihi batas konsumsi realistis (>5000 g/hari).")
                else:
                    parsed_values[f] = num
            except (ValueError, TypeError):
                invalid_errors.append(f"Nilai untuk fitur '{f}' ('{raw_val}') bukan angka yang valid.")

    if invalid_errors:
        raise ValueError(" | ".join(invalid_errors))

    # 2. Syarat minimal 4 fitur terisi
    if len(parsed_values) < 4:
        raise ValueError(
            f"Minimal 4 kelompok pangan harus diisi untuk menghasilkan klasifikasi yang valid "
            f"(saat ini hanya terisi {len(parsed_values)} kelompok pangan)."
        )

    # 3. Imputasi nilai median untuk fitur yang belum diisi
    for f in features:
        if f not in parsed_values:
            med = None
            if _df_wilayah is not None and f in _df_wilayah.columns:
                med = float(_df_wilayah[f].median())
            if med is None or np.isnan(med):
                med = DEFAULT_MEDIANS.get(f, 50.0)
            parsed_values[f] = med
            imputed_features[f] = round(med, 1)

    # 4. Susun DataFrame sesuai urutan bundle['features'] & transformasi Yeo-Johnson
    x_new = pd.DataFrame([[float(parsed_values[f]) for f in features]], columns=features)
    x_scaled = transformer.transform(x_new)

    # 5. Prediksi soft-clustering GMM
    proba = model.predict_proba(x_scaled)[0]
    cluster_id = int(np.argmax(proba))
    nama_pola = cluster_names.get(cluster_id, f"Klaster {cluster_id}")
    prob_max = float(proba[cluster_id])

    # Distribusi probabilitas ke semua 4 cluster dalam persen (%)
    probabilities = {
        int(i): round(float(proba[i]) * 100, 2)
        for i in range(len(proba))
    }

    # Flag transisi jika prob_max < 0.7 (pola campuran)
    is_transition = bool(prob_max < 0.7)

    if prob_max >= 0.90:
        confidence = "Sangat Tinggi"
    elif prob_max >= 0.75:
        confidence = "Tinggi"
    elif prob_max >= 0.70:
        confidence = "Sedang"
    else:
        confidence = "Transisi (Pola Campuran)"

    # Jarak ke mean komponen GMM pada ruang Yeo-Johnson (informatif)
    means = getattr(model, "means_", None)
    distances = {}
    if means is not None:
        distances = {
            int(i): round(float(np.linalg.norm(x_scaled[0] - means[i])), 2)
            for i in range(len(means))
        }

    return {
        "cluster_id": cluster_id,
        "cluster_name": nama_pola,
        "prob_max": round(prob_max, 4),
        "prob_max_pct": round(prob_max * 100, 2),
        "probabilities": probabilities,
        "is_transition": is_transition,
        "is_border": is_transition,
        "confidence": confidence,
        "distances": distances,
        "transformer_name": _model_bundle.get("transformer_name", "YeoJohnson"),
        "imputed_features": imputed_features,
        "validated_inputs": parsed_values,
    }


def get_similar_regions(cluster_id: int, exclude_wilayah: str = None, top_n: int = 5) -> list:
    """Kembalikan wilayah-wilayah Tahun 2025 dalam klaster GMM yang sama."""
    _ensure_loaded()

    df = _df_wilayah.copy()
    same_cluster = df[df["Cluster"] == int(cluster_id)]

    if exclude_wilayah:
        wilayah_col = "Kabupaten_Kota" if "Kabupaten_Kota" in df.columns else "Kode_Wilayah"
        target_row = df[df[wilayah_col].astype(str).str.lower() == exclude_wilayah.lower()]
        if target_row.empty:
            target_row = df[df[wilayah_col].astype(str).str.lower().str.contains(exclude_wilayah.lower(), regex=False)]

        same_cluster = same_cluster[
            same_cluster[wilayah_col].astype(str).str.lower() != exclude_wilayah.lower()
        ]

        features = get_features()
        if not target_row.empty and all(f in same_cluster.columns for f in features):
            target_vec = target_row.iloc[0][features].values.astype(float)
            cluster_matrix = same_cluster[features].values.astype(float)
            dists = np.linalg.norm(cluster_matrix - target_vec, axis=1)
            same_cluster = same_cluster.assign(distance=np.round(dists, 2))
            same_cluster = same_cluster.sort_values("distance", ascending=True)

    return same_cluster.head(top_n).to_dict(orient="records")


def get_komoditas_detail(wilayah_name: str) -> dict:
    """Kembalikan data rincian 26 komoditas pelengkap Tahun 2025 untuk satu wilayah."""
    _ensure_loaded()

    df_k = _df_komoditas
    df_w = _df_wilayah

    kode = None
    if str(wilayah_name).isdigit():
        kode = int(wilayah_name)
    elif "Kabupaten_Kota" in df_w.columns:
        w_match = df_w[df_w["Kabupaten_Kota"].astype(str).str.lower() == str(wilayah_name).lower()]
        if w_match.empty:
            w_match = df_w[df_w["Kabupaten_Kota"].astype(str).str.lower().str.contains(str(wilayah_name).lower(), regex=False)]
        if not w_match.empty:
            kode = int(w_match.iloc[0]["Kode_Wilayah"])

    if kode is not None:
        row = df_k[df_k["Kode_Wilayah"] == kode]
        if not row.empty:
            res = row.iloc[0].to_dict()
            w_info = df_w[df_w["Kode_Wilayah"] == kode]
            if not w_info.empty:
                res["Kabupaten_Kota"] = w_info.iloc[0].get("Kabupaten_Kota", str(wilayah_name))
                res["Provinsi"] = w_info.iloc[0].get("Provinsi", "")
            return res

    return None


def get_profil_klaster(cluster_id: int) -> dict:
    """Kembalikan profil rata-rata klaster GMM Tahun 2025."""
    _ensure_loaded()
    row = _df_profil[_df_profil["Cluster"] == int(cluster_id)]
    if row.empty:
        return {}
    return row.iloc[0].to_dict()


def get_standar_pph() -> list:
    """Kembalikan standar PPH dari bundle['pph']."""
    _ensure_loaded()
    return _df_standar.to_dict(orient="records")


def get_all_wilayah() -> list:
    """Kembalikan daftar seluruh 514 wilayah (Tahun 2025) beserta klaster GMM dan Prob_Max."""
    _ensure_loaded()
    return _df_wilayah.to_dict(orient="records")


def reload_artifacts():
    """Force reload semua artefak (berguna setelah upload model baru)."""
    global _model_bundle, _df_wilayah, _df_komoditas, _df_profil, _df_standar, _pca_variance
    _model_bundle = _df_wilayah = _df_komoditas = _df_profil = _df_standar = _pca_variance = None
    _load_artifacts()
