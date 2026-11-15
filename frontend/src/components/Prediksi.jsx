/**
 * Prediksi.jsx
 * ------------
 * Halaman prediksi klaster: form dinamis (fitur dari API),
 * tampilkan hasil klaster + profil + wilayah mirip.
 */

import { useState, useEffect } from "react";
import { Loader2, Search } from "lucide-react";
import { getFeatures, predictCluster } from "../api.js";

export default function Prediksi() {
  const [features,  setFeatures]  = useState([]);
  const [values,    setValues]    = useState({});
  const [loading,   setLoading]   = useState(false);
  const [fetching,  setFetching]  = useState(true);
  const [result,    setResult]    = useState(null);
  const [error,     setError]     = useState(null);

  // Muat daftar fitur dari API
  useEffect(() => {
    getFeatures()
      .then((res) => {
        const feats = res.data;
        setFeatures(feats);
        setValues(Object.fromEntries(feats.map((f) => [f, ""])));
      })
      .catch((e) => setError(e.message))
      .finally(() => setFetching(false));
  }, []);

  const handleChange = (feat, val) =>
    setValues((prev) => ({ ...prev, [feat]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    // Validasi semua terisi
    const empty = features.filter((f) => values[f] === "");
    if (empty.length > 0) {
      setError(`Isi semua fitur. Belum diisi: ${empty.slice(0, 3).join(", ")}${empty.length > 3 ? "..." : ""}`);
      return;
    }

    const numValues = Object.fromEntries(
      Object.entries(values).map(([k, v]) => [k, parseFloat(v)])
    );

    setLoading(true);
    try {
      const res = await predictCluster(numValues);
      setResult(res.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="page" style={{ textAlign: "center", paddingTop: "4rem" }}>
        <Loader2 size={32} className="spin" style={{ color: "var(--color-primary)" }} />
        <p style={{ marginTop: "0.75rem", color: "var(--color-muted)" }}>
          Memuat daftar fitur dari server…
        </p>
      </div>
    );
  }

  return (
    <div className="page">
      <h1 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "1.5rem" }}>
        Prediksi Klaster Wilayah
      </h1>

      {error && <div className="banner-error" style={{ marginBottom: "1rem" }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* Form */}
        <div className="card">
          <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>
            Input Data Pangan
          </h2>
          {features.length === 0 ? (
            <div className="banner-info">
              Model belum tersedia. Upload artefak terlebih dahulu.
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.75rem",
                  marginBottom: "1.25rem",
                }}
              >
                {features.map((feat) => (
                  <label key={feat} style={{ fontSize: "0.8rem" }}>
                    <span style={{ display: "block", marginBottom: "0.2rem", fontWeight: 500 }}>
                      {feat}
                    </span>
                    <input
                      type="number"
                      step="any"
                      value={values[feat]}
                      onChange={(e) => handleChange(feat, e.target.value)}
                      style={{
                        width: "100%",
                        border: "1px solid var(--color-border)",
                        borderRadius: "0.375rem",
                        padding: "0.35rem 0.5rem",
                        fontSize: "0.85rem",
                      }}
                    />
                  </label>
                ))}
              </div>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                {loading ? (
                  <Loader2 size={14} className="spin" />
                ) : (
                  <Search size={14} />
                )}
                {loading ? "Memproses…" : "Prediksi Klaster"}
              </button>
            </form>
          )}
        </div>

        {/* Hasil */}
        <div>
          {result ? (
            <>
              <div className="card" style={{ marginBottom: "1rem" }}>
                <p style={{ fontSize: "0.75rem", color: "var(--color-muted)", marginBottom: "0.3rem" }}>
                  Hasil Prediksi
                </p>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-primary)" }}>
                  {result.prediction.cluster_name}
                </h2>
                <p style={{ fontSize: "0.8rem", color: "var(--color-muted)", marginTop: "0.25rem" }}>
                  ID Klaster: {result.prediction.cluster_id}
                </p>
              </div>

              {/* Profil klaster */}
              {result.profil_klaster && Object.keys(result.profil_klaster).length > 0 && (
                <div className="card" style={{ marginBottom: "1rem" }}>
                  <h3 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.75rem" }}>
                    Profil Rata-Rata Klaster
                  </h3>
                  <div style={{ maxHeight: 180, overflowY: "auto" }}>
                    <table className="tbl">
                      <tbody>
                        {Object.entries(result.profil_klaster).map(([k, v]) => (
                          <tr key={k}>
                            <td style={{ color: "var(--color-muted)" }}>{k}</td>
                            <td style={{ fontWeight: 500 }}>
                              {typeof v === "number" ? v.toFixed(2) : v}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Wilayah mirip */}
              <div className="card">
                <h3 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.75rem" }}>
                  Wilayah dengan Profil Serupa
                </h3>
                {result.wilayah_mirip.length === 0 ? (
                  <p style={{ color: "var(--color-muted)", fontSize: "0.85rem" }}>
                    Tidak ada data wilayah.
                  </p>
                ) : (
                  <table className="tbl">
                    <thead>
                      <tr>
                        {Object.keys(result.wilayah_mirip[0]).map((col) => (
                          <th key={col}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.wilayah_mirip.map((row, i) => (
                        <tr key={i}>
                          {Object.values(row).map((val, j) => (
                            <td key={j}>
                              {typeof val === "number" ? val.toFixed(2) : val}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          ) : (
            <div
              className="card"
              style={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-muted)",
                fontSize: "0.875rem",
                minHeight: 200,
              }}
            >
              Hasil prediksi akan muncul di sini.
            </div>
          )}
        </div>
      </div>

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
