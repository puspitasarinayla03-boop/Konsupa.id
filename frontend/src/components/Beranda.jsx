/**
 * Beranda.jsx – Landing page konsupa.id (sesuai PRD)
 * Ringkasan 4 tipe pola + batas klaim + navigasi cepat.
 */
import { useState, useEffect } from "react";
import { Map, Search, ScatterChart, Info, ArrowRight, Loader2 } from "lucide-react";
import { getClusterNames } from "../api.js";

const CLUSTER_COLORS = [
  { bg: "#dcfce7", text: "#15803d", border: "#86efac" },
  { bg: "#dbeafe", text: "#1d4ed8", border: "#93c5fd" },
  { bg: "#fef9c3", text: "#a16207", border: "#fde047" },
  { bg: "#fce7f3", text: "#9d174d", border: "#f9a8d4" },
];

const DEFAULT_CLUSTER_NAMES = {
  0: "Pola Pangan Umbi Tradisional",
  1: "Pola Pangan Nabati & Serat Tinggi",
  2: "Pola Pangan Beras-Sentris",
  3: "Pola Pangan Hewani & Lemak Tinggi",
};

const QUICK_LINKS = [
  { page: "jelajah",    Icon: Map,          label: "Jelajah Wilayah",   desc: "Profil, PPH, komoditas, wilayah mirip" },
  { page: "cek",        Icon: Search,       label: "Cek Tipe Pola",     desc: "Input 8 kelompok → tipe pola instan"   },
  { page: "peta",       Icon: ScatterChart, label: "Peta Klaster",      desc: "Scatter plot PCA seluruh wilayah"      },
  { page: "metodologi", Icon: Info,         label: "Metodologi",        desc: "Metrik, keterbatasan, batas klaim"     },
];

export default function Beranda({ onNavigate }) {
  const [clusterNames, setClusterNames] = useState({});
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    getClusterNames()
      .then((res) => setClusterNames(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      {/* Hero */}
      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.75rem" }}>
          konsupa.id
        </h1>
        <p style={{ fontSize: "1.05rem", color: "var(--color-muted)", maxWidth: 580, margin: "0 auto 0.5rem" }}>
          Sistem Informasi Pola Konsumsi Pangan
        </p>
        <p style={{ fontSize: "0.875rem", color: "var(--color-muted)", maxWidth: 640, margin: "0 auto" }}>
          Memahami dan membandingkan pola konsumsi pangan 514 kabupaten/kota di Indonesia
          berdasarkan hasil klasterisasi K-Means terhadap 8 kelompok pangan utama (standar PPH),
          dilengkapi data rincian 26 komoditas pangan sebagai pelengkap.
        </p>
      </div>

      {/* Batas klaim */}
      <div className="banner-info" style={{ marginBottom: "2rem", fontSize: "0.82rem" }}>
        <strong>Batas klaim:</strong> Hasil sistem menggambarkan <em>pola konsumsi</em>, bukan kecukupan gizi atau kerawanan pangan.
        Silhouette ≈ 0.17 — struktur klaster bergradasi; gunakan sebagai pengelompokan awal, bukan batas tegas.
      </div>

      {/* 4 Tipe Pola */}
      <h2 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "1rem" }}>
        4 Tipe Pola Konsumsi
      </h2>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "1.5rem" }}>
          <Loader2 size={24} style={{ color: "var(--color-primary)", animation: "spin 1s linear infinite" }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1rem",
            marginBottom: "2.5rem",
          }}
        >
          {[0, 1, 2, 3].map((cid) => {
            const c = CLUSTER_COLORS[cid];
            const name = clusterNames[cid] || DEFAULT_CLUSTER_NAMES[cid] || `Klaster ${cid}`;
            return (
              <div
                key={cid}
                style={{
                  background: c.bg,
                  border: `1px solid ${c.border}`,
                  borderRadius: "var(--radius)",
                  padding: "1rem 1.25rem",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    background: c.text,
                    color: "#fff",
                    borderRadius: 999,
                    padding: "0.15rem 0.6rem",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    marginBottom: "0.5rem",
                  }}
                >
                  Tipe {cid}
                </span>
                <p style={{ fontWeight: 600, fontSize: "0.9rem", color: c.text }}>
                  {name}
                </p>
                <button
                  onClick={() => onNavigate("jelajah")}
                  style={{
                    marginTop: "0.6rem",
                    fontSize: "0.75rem",
                    color: c.text,
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                    fontWeight: 600,
                  }}
                >
                  Lihat wilayah <ArrowRight size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick links */}
      <h2 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "1rem" }}>
        Fitur Utama
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
        }}
      >
        {QUICK_LINKS.map(({ page, Icon, label, desc }) => (
          <div key={page} className="card" style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <Icon size={20} color="var(--color-primary)" />
            <div>
              <p style={{ fontWeight: 600, fontSize: "0.9rem" }}>{label}</p>
              <p style={{ fontSize: "0.8rem", color: "var(--color-muted)" }}>{desc}</p>
            </div>
            <button
              className="btn-primary"
              style={{ alignSelf: "flex-start", fontSize: "0.8rem", padding: "0.35rem 0.9rem" }}
              onClick={() => onNavigate(page)}
            >
              Buka
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
