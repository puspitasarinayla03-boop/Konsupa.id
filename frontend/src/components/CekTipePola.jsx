/**
 * CekTipePola.jsx  (sebelumnya Prediksi.jsx, sesuai PRD: "Cek Tipe Pola")
 * --------------------------------------------------------------------------
 * Input 8 kelompok pangan → tetapkan tipe pola + jarak ke tiap centroid +
 * tingkat keyakinan (apakah wilayah perbatasan) + 5 wilayah mirip.
 */

import { useState, useEffect } from "react";
import { Loader2, Search } from "lucide-react";
import { getFeatures, predictCluster, getClusterNames } from "../api.js";

const CLUSTER_COLORS = ["#16a34a", "#2563eb", "#ca8a04", "#9333ea", "#dc2626"];

export default function CekTipePola() {
  const [features,     setFeatures]     = useState([]);
  const [clusterNames, setClusterNames] = useState({});
  const [values,       setValues]       = useState({});
  const [loading,      setLoading]      = useState(false);
  const [fetching,     setFetching]     = useState(true);
  const [result,       setResult]       = useState(null);
  const [error,        setError]        = useState(null);

  useEffect(() => {
    Promise.all([getFeatures(), getClusterNames()])
      .then(([fRes, cRes]) => {
        const feats = fRes.data;
        setFeatures(feats);
        setValues(Object.fromEntries(feats.map((f) => [f, ""])));
        setClusterNames(cRes.data);
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

    const empty = features.filter((f) => values[f] === "");
    if (empty.length > 0) {
      setError(`Isi semua kolom. Belum diisi: ${empty.slice(0, 3).join(", ")}${empty.length > 3 ? ` + ${empty.length - 3} lainnya` : ""}`);
      return;
    }

    const numValues = Object.fromEntries(
      Object.entries(values).map(([k, v]) => [k, parseFloat(v)])
    );

    setLoading(true);
    try {
      const res = await predictCluster(numValues, null, 5);
      setResult(res.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Hitung "keyakinan": rasio jarak terpendek ke kedua-terpendek
  // Makin kecil angkanya, makin "perbatasan"
  const confidence = (() => {
    if (!result?.prediction?.distances) return null;
    const dists = Object.values(result.prediction.distances).sort((a, b) => a - b);
    if (dists.length < 2 || dists[1] === 0) return null;
    const ratio = dists[0] / dists[1]; // 0 = sangat yakin, 1 = perbatasan
    return Math.round((1 - ratio) * 100); // ubah ke persen keyakinan
  })();

  if (fetching) {
    return (
      <div className="page" style={{ textAlign: "center", paddingTop: "4rem" }}>
        <Loader2 size={32} style={{ color: "var(--color-primary)", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ marginTop: "0.75rem", color: "var(--color-muted)" }}>Memuat daftar fitur dari server…</p>
      </div>
    );
  }

  return (
    <div className="page">
      <h1 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        Cek Tipe Pola Konsumsi
      </h1>
      <p style={{ color: "var(--color-muted)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
        Masukkan angka konsumsi per kelompok pangan untuk menetapkan tipe pola klaster terdekat.
      </p>

      {/* Batas klaim */}
      <div className="banner-info" style={{ marginBottom: "1.25rem", fontSize: "0.8rem" }}>
        Fitur ini hanya <strong>menetapkan klaster terdekat</strong>, bukan meramalkan kondisi pangan masa depan.
        Wilayah di perbatasan klaster tidak boleh ditafsirkan sebagai anggota yang tegas.
      </div>

      {error && <div className="banner-error" style={{ marginBottom: "1rem" }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* Form */}
        <div className="card">
          <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>
            Input Kelompok Pangan
          </h2>
          {features.length === 0 ? (
            <div className="banner-info">
              Model belum tersedia. Upload artefak terlebih dahulu.
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "1.25rem" }}>
                {features.map((feat) => (
                  <label key={feat} style={{ fontSize: "0.85rem" }}>
                    <span style={{ display: "block", marginBottom: "0.2rem", fontWeight: 500 }}>
                      {feat}
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="gram/kap/hari"
                      value={values[feat]}
                      onChange={(e) => handleChange(feat, e.target.value)}
                      style={{
                        width: "100%",
                        border: "1px solid var(--color-border)",
                        borderRadius: "0.375rem",
                        padding: "0.4rem 0.6rem",
                        fontSize: "0.875rem",
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
                {loading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Search size={14} />}
                {loading ? "Memproses…" : "Cek Tipe Pola"}
              </button>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </form>
          )}
        </div>

        {/* Hasil */}
        <div>
          {result ? (
            <>
              {/* Tipe pola */}
              <div className="card" style={{ marginBottom: "1rem" }}>
                <p style={{ fontSize: "0.75rem", color: "var(--color-muted)", marginBottom: "0.3rem" }}>
                  Tipe Pola yang Ditetapkan
                </p>
                <h2
                  style={{
                    fontSize: "1.3rem",
                    fontWeight: 700,
                    color: CLUSTER_COLORS[result.prediction.cluster_id] || "var(--color-primary)",
                  }}
                >
                  {result.prediction.cluster_name}
                </h2>

                {confidence !== null && (
                  <div style={{ marginTop: "0.75rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", marginBottom: "0.2rem" }}>
                      <span style={{ color: "var(--color-muted)" }}>Keyakinan penetapan</span>
                      <span style={{ fontWeight: 600 }}>{confidence}%</span>
                    </div>
                    <div style={{ background: "#e5e7eb", borderRadius: 999, height: 6 }}>
                      <div
                        style={{
                          width: `${confidence}%`,
                          height: "100%",
                          borderRadius: 999,
                          background: confidence > 60 ? "#16a34a" : confidence > 35 ? "#ca8a04" : "#dc2626",
                          transition: "width 0.4s",
                        }}
                      />
                    </div>
                    {confidence < 40 && (
                      <p style={{ fontSize: "0.75rem", color: "#dc2626", marginTop: "0.3rem" }}>
                        ⚠ Wilayah ini berada di perbatasan klaster; interpretasikan dengan hati-hati.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Jarak ke centroid */}
              <div className="card" style={{ marginBottom: "1rem" }}>
                <h3 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.75rem" }}>
                  Jarak ke Tiap Centroid
                </h3>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Klaster</th>
                      <th>Jarak</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(result.prediction.distances)
                      .sort(([, a], [, b]) => a - b)
                      .map(([cid, dist]) => (
                        <tr key={cid}>
                          <td>
                            <span className={`badge badge-${cid}`}>
                              {clusterNames[cid] || `Klaster ${cid}`}
                            </span>
                          </td>
                          <td style={{ fontFamily: "monospace" }}>
                            {Number(dist).toFixed(4)}
                            {String(cid) === String(result.prediction.cluster_id) && (
                              <span style={{ marginLeft: 6, fontSize: "0.7rem", color: "var(--color-primary)" }}>✓ terdekat</span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Wilayah mirip */}
              {result.wilayah_mirip?.length > 0 && (
                <div className="card">
                  <h3 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.75rem" }}>
                    Wilayah dengan Pola Serupa
                  </h3>
                  <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                    {result.wilayah_mirip.map((r, i) => {
                      const namaCol = Object.keys(r).find((k) => /wilayah|kabupaten|kab_kota|nama/i.test(k)) || Object.keys(r)[0];
                      return (
                        <li
                          key={i}
                          style={{
                            padding: "0.35rem 0.6rem",
                            background: "#f9fafb",
                            borderRadius: "0.375rem",
                            fontSize: "0.85rem",
                          }}
                        >
                          {r[namaCol]}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
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
                minHeight: 220,
              }}
            >
              Hasil penetapan tipe pola akan muncul di sini.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
