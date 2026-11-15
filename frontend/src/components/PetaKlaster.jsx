/**
 * PetaKlaster.jsx
 * ---------------
 * Scatter plot 2D PCA semua wilayah, berwarna per klaster.
 * Koordinat PCA harus tersedia di cluster_wilayah.csv (kolom pca1, pca2)
 * atau di endpoint /api/wilayah. Bila kolom tidak ada, tampilkan pesan informatif.
 */

import { useState, useEffect, useMemo } from "react";
import { Loader2 } from "lucide-react";
import {
  ScatterChart, Scatter, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, Legend,
} from "recharts";
import { getAllWilayah, getClusterNames } from "../api.js";

const CLUSTER_COLORS = ["#16a34a", "#2563eb", "#ca8a04", "#9333ea", "#dc2626"];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "0.375rem",
        padding: "0.5rem 0.75rem",
        fontSize: "0.8rem",
        boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
      }}
    >
      <strong>{d.nama}</strong>
      <br />
      PCA1: {d.x?.toFixed(3)} · PCA2: {d.y?.toFixed(3)}
    </div>
  );
};

export default function PetaKlaster() {
  const [wilayah,      setWilayah]      = useState([]);
  const [clusterNames, setClusterNames] = useState({});
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  useEffect(() => {
    Promise.all([getAllWilayah(), getClusterNames()])
      .then(([wRes, cRes]) => {
        setWilayah(wRes.data);
        setClusterNames(cRes.data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const cols = useMemo(() => {
    if (wilayah.length === 0) return {};
    const keys = Object.keys(wilayah[0]);
    return {
      wilayah: keys.find((k) => /wilayah|kabupaten|kab_kota|nama/i.test(k)) || keys[0],
      cluster: keys.find((k) => /cluster|klaster/i.test(k)) || keys[1],
      pca1:    keys.find((k) => /pca.?1|pc1|dim.?1|comp.?1/i.test(k)),
      pca2:    keys.find((k) => /pca.?2|pc2|dim.?2|comp.?2/i.test(k)),
    };
  }, [wilayah]);

  const hasPCA = cols.pca1 && cols.pca2;

  const byCluster = useMemo(() => {
    if (!hasPCA) return {};
    return wilayah.reduce((acc, r) => {
      const cid = String(r[cols.cluster]);
      if (!acc[cid]) acc[cid] = [];
      acc[cid].push({ x: r[cols.pca1], y: r[cols.pca2], nama: r[cols.wilayah] });
      return acc;
    }, {});
  }, [wilayah, cols, hasPCA]);

  if (loading) {
    return (
      <div className="page" style={{ textAlign: "center", paddingTop: "4rem" }}>
        <Loader2 size={32} style={{ color: "var(--color-primary)", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div className="page">
      <h1 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        Peta Klaster
      </h1>
      <p style={{ color: "var(--color-muted)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
        Sebaran 514 wilayah dalam ruang 2 dimensi (PCA). Setiap titik adalah satu kabupaten/kota.
      </p>

      {error && <div className="banner-error" style={{ marginBottom: "1rem" }}>{error}</div>}

      {!hasPCA ? (
        <div className="banner-info">
          <strong>Kolom PCA belum tersedia.</strong> Tambahkan kolom <code>pca1</code> dan <code>pca2</code> ke
          file <code>cluster_wilayah.csv</code> (koordinat komponen utama dari notebook) agar grafik ini
          dapat ditampilkan.
          <br /><br />
          Contoh dari notebook:
          <pre style={{ marginTop: "0.5rem", background: "#e0f2fe", padding: "0.5rem", borderRadius: "0.375rem", fontSize: "0.78rem" }}>
{`from sklearn.decomposition import PCA
pca = PCA(n_components=2)
coords = pca.fit_transform(X_scaled)
df["pca1"] = coords[:, 0]
df["pca2"] = coords[:, 1]`}
          </pre>
        </div>
      ) : (
        <div className="card">
          <ResponsiveContainer width="100%" height={520}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
              <XAxis type="number" dataKey="x" name="PCA 1" tick={{ fontSize: 11 }} label={{ value: "PC 1", position: "insideBottomRight", offset: -5, fontSize: 11 }} />
              <YAxis type="number" dataKey="y" name="PCA 2" tick={{ fontSize: 11 }} label={{ value: "PC 2", angle: -90, position: "insideLeft", fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {Object.entries(byCluster).map(([cid, points]) => (
                <Scatter
                  key={cid}
                  name={clusterNames[cid] || `Klaster ${cid}`}
                  data={points}
                  fill={CLUSTER_COLORS[Number(cid)] || "#888"}
                  opacity={0.75}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
          <p style={{ fontSize: "0.75rem", color: "var(--color-muted)", marginTop: "0.75rem" }}>
            Silhouette ≈ 0.17 — struktur klaster bergradasi; gunakan sebagai pengelompokan awal.
          </p>
        </div>
      )}
    </div>
  );
}
