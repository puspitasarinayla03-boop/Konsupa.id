/**
 * StandarPPH.jsx
 * --------------
 * Tampilkan standar Pola Pangan Harapan dari API.
 */

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { getStandarPPH } from "../api.js";

export default function StandarPPH() {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    getStandarPPH()
      .then((res) => setData(res.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="page" style={{ textAlign: "center", paddingTop: "4rem" }}>
        <Loader2 size={32} style={{ color: "var(--color-primary)", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ marginTop: "0.75rem", color: "var(--color-muted)" }}>Memuat standar PPH…</p>
      </div>
    );
  }

  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <div className="page">
      <h1 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        Standar Pola Pangan Harapan (PPH)
      </h1>
      <p style={{ color: "var(--color-muted)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
        Referensi standar PPH yang digunakan sebagai acuan analisis ketahanan dan
        keberagaman konsumsi pangan di setiap wilayah.
      </p>

      {error && <div className="banner-error" style={{ marginBottom: "1rem" }}>{error}</div>}

      {data.length === 0 && !error ? (
        <div className="banner-info">
          Data standar PPH belum tersedia. Upload <code>standar_pph.csv</code> ke folder artifacts/.
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "auto" }}>
          <table className="tbl">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col}>
                      {typeof row[col] === "number" ? row[col].toFixed(2) : row[col]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
