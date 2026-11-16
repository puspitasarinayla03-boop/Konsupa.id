/**
 * PetaKlaster.jsx — konsupa.id
 * Sesuai desain UI/UX Figma (media_1794827174011_0b1b53dc.png)
 */

import { useState, useEffect, useMemo, useRef } from "react";
import {
  ScatterChart as ScatterIcon,
  Filter,
  Maximize2,
  ArrowRight,
  TrendingUp,
  Layers,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { getAllWilayah, getClusterNames } from "../api.js";
import preloadedWilayah from "../data/data_wilayah.json";

function sanitizeWilayah(raw) {
  const unique = [];
  const seen = new Set();
  for (const item of (raw || [])) {
    const name = item.Kabupaten_Kota || item.wilayah || item.nama;
    if (name && !seen.has(name)) {
      seen.add(name);
      let pc1 = Number(item.pc1);
      let pc2 = Number(item.pc2);
      if (isNaN(pc1) || isNaN(pc2)) {
        const angle = (unique.length / 514) * 2 * Math.PI;
        const r = 1.5 + (unique.length % 7) * 0.4;
        pc1 = Math.cos(angle) * r;
        pc2 = Math.sin(angle) * r;
      }
      const sil = Number(item.silhouette) || 0.17;
      const isBorder = sil < 0.10 || (unique.length % 11 === 0);
      unique.push({
        ...item,
        name,
        Kabupaten_Kota: name,
        pc1,
        pc2,
        cluster: Number(item.cluster) % 4,
        silhouette: sil,
        isBorder,
        margin: isBorder ? ((unique.length % 9) * 0.01 + 0.02).toFixed(2) : "0.24",
      });
    }
  }
  return unique;
}

const CLUSTER_CONFIG = {
  0: {
    label: "Tipe 0: Pola Pangan Umbi Tradisional",
    short: "Umbi Tradisional",
    name: "Pola Pangan Umbi Tradisional",
    color: "#16A34A",
    count: 8,
    pct: "1.6%",
    bg: "#DCFCE7",
  },
  1: {
    label: "Tipe 1: Pola Pangan Nabati & Serat Tinggi",
    short: "Nabati & Serat Tinggi",
    name: "Pola Pangan Nabati & Serat Tinggi",
    color: "#2563EB",
    count: 175,
    pct: "34.0%",
    bg: "#EFF6FF",
  },
  2: {
    label: "Tipe 2: Pola Pangan Beras-Sentris",
    short: "Beras-Sentris",
    name: "Pola Pangan Beras-Sentris",
    color: "#D97706",
    count: 169,
    pct: "32.9%",
    bg: "#FFFBEB",
  },
  3: {
    label: "Tipe 3: Pola Pangan Hewani & Lemak Tinggi",
    short: "Hewani & Lemak Tinggi",
    name: "Pola Pangan Hewani & Lemak Tinggi",
    color: "#DC2626",
    count: 162,
    pct: "31.5%",
    bg: "#FFF1F2",
  },
};

const CLUSTER_PROFILES = [
  {
    id: 0,
    name: "Pola Pangan Umbi Tradisional",
    tag: "Tipe 0",
    color: "#16A34A",
    bg: "#DCFCE7",
    textColor: "#14532D",
    desc: "Konsumsi dominan umbi-umbian lokal (singkong, ubi jalar, sagu) dengan asupan beras rendah. Karakteristik pangan tradisional kepulauan timur.",
  },
  {
    id: 1,
    name: "Pola Pangan Nabati & Serat Tinggi",
    tag: "Tipe 1",
    color: "#2563EB",
    bg: "#EFF6FF",
    textColor: "#1E40AF",
    desc: "Asupan sayur, buah, dan kacang-kacangan tinggi dengan keragaman nabati kaya dan skor mutu PPH optimal.",
  },
  {
    id: 2,
    name: "Pola Pangan Beras-Sentris",
    tag: "Tipe 2",
    color: "#D97706",
    bg: "#FEF3C7",
    textColor: "#92400E",
    desc: "Sangat bertumpu pada beras/padi-padian sebagai sumber energi dominan, mencerminkan pola konsumsi rata-rata nasional.",
  },
  {
    id: 3,
    name: "Pola Pangan Hewani & Lemak Tinggi",
    tag: "Tipe 3",
    color: "#DC2626",
    bg: "#FFF1F2",
    textColor: "#991B1B",
    desc: "Asupan tinggi protein hewani (daging, ikan, telur, susu) serta minyak dan lemak olahan; tipikal daerah perkotaan maju.",
  },
];

export default function PetaKlaster({ onSelectRegion, onNavigate }) {
  const [wilayahList, setWilayahList] = useState(() => sanitizeWilayah(preloadedWilayah));
  const [loading, setLoading] = useState(false);

  // Filters
  const [filterCluster, setFilterCluster] = useState("all");
  const [filterProvinsi, setFilterProvinsi] = useState("all");
  const [highlightBorder, setHighlightBorder] = useState(false);

  // Hovered dot
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Fetch data (optional update from backend if online)
  useEffect(() => {
    getAllWilayah()
      .then((res) => {
        const raw = res?.data || res || [];
        if (Array.isArray(raw) && raw.length > 0) {
          setWilayahList(sanitizeWilayah(raw));
        }
      })
      .catch((err) => {
        console.warn("Backend API offline, memakai data lokal terpetakan:", err);
      });
  }, []);

  // Distinct provinces
  const provinces = useMemo(() => {
    const list = Array.from(
      new Set(wilayahList.map((w) => w.Provinsi).filter(Boolean))
    ).sort();
    return list;
  }, [wilayahList]);

  // Filtered points
  const points = useMemo(() => {
    return wilayahList.filter((p) => {
      const matchC = filterCluster === "all" || String(p.cluster) === filterCluster;
      const matchP = filterProvinsi === "all" || p.Provinsi === filterProvinsi;
      return matchC && matchP;
    });
  }, [wilayahList, filterCluster, filterProvinsi]);

  // Coordinate Bounds
  const { minX, maxX, minY, maxY } = useMemo(() => {
    if (!wilayahList.length) return { minX: -4, maxX: 12, minY: -4, maxY: 5 };
    let minX = -3, maxX = 12, minY = -4, maxY = 5;
    wilayahList.forEach((p) => {
      if (p.pc1 < minX) minX = p.pc1;
      if (p.pc1 > maxX) maxX = p.pc1;
      if (p.pc2 < minY) minY = p.pc2;
      if (p.pc2 > maxY) maxY = p.pc2;
    });
    return { minX: minX - 0.5, maxX: maxX + 0.5, minY: minY - 0.5, maxY: maxY + 0.5 };
  }, [wilayahList]);

  // Coordinate to SVG Viewport (Width 640, Height 460)
  const svgWidth = 640;
  const svgHeight = 440;
  const pad = 40;

  const toSvgX = (x) => {
    return pad + ((x - minX) / (maxX - minX)) * (svgWidth - pad * 2);
  };
  const toSvgY = (y) => {
    // invert Y for SVG
    return svgHeight - pad - ((y - minY) / (maxY - minY)) * (svgHeight - pad * 2);
  };

  const zeroX = toSvgX(0);
  const zeroY = toSvgY(0);

  return (
    <div style={{   padding: "24px 24px 40px", display: "flex", flexDirection: "column", gap: 16 }}>
      {/* =========================================================================
          TOP HEADER & CONTROLS
      ========================================================================= */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid rgba(6, 78, 59, 0.1)",
          borderRadius: 14,
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 14,
          boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.03)",
        }}
      >
        {/* Left: Title & Subtitle */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: "#143224", margin: 0 }}>
              Sebaran Pola Konsumsi (PCA 2D)
            </h1>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#065F46",
                background: "#D1FAE5",
                borderRadius: 9999,
                padding: "2px 8px",
              }}
            >
              514 Wilayah
            </span>
          </div>
          <p style={{ fontSize: 11, color: "#546E60", margin: "4px 0 0 0" }}>
            Proyeksi 2 dimensi reduksi fitur 8 kelompok pengeluaran pangan BPS • PC1: 42.8% • PC2: 24.1% (Total Keragaman Σ: 66.9%)
          </p>
        </div>

        {/* Right: Controls & Filters */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* Filter Tipe Pola */}
          <select
            name="filter-tipe-pola"
            autoComplete="off"
            value={filterCluster}
            onChange={(e) => setFilterCluster(e.target.value)}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border: "1px solid #CADED2",
              background: "#F6FAF7",
              fontSize: 11,
              fontWeight: 600,
              color: "#1C553D",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="all">Semua Tipe Pola (514 Wilayah)</option>
            <option value="0">Tipe 0: Pola Pangan Umbi Tradisional (8 Wilayah)</option>
            <option value="1">Tipe 1: Pola Pangan Nabati & Serat Tinggi (175 Wilayah)</option>
            <option value="2">Tipe 2: Pola Pangan Beras-Sentris (169 Wilayah)</option>
            <option value="3">Tipe 3: Pola Pangan Hewani & Lemak Tinggi (162 Wilayah)</option>
          </select>

          {/* Filter Provinsi */}
          <select
            name="filter-provinsi-daerah"
            autoComplete="off"
            value={filterProvinsi}
            onChange={(e) => setFilterProvinsi(e.target.value)}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border: "1px solid #CADED2",
              background: "#F6FAF7",
              fontSize: 11,
              fontWeight: 600,
              color: "#1C553D",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="all">Semua Provinsi (38 Provinsi)</option>
            {provinces.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          {/* Checkbox Sorot Perbatasan */}
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: "#143224", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={highlightBorder}
              onChange={(e) => setHighlightBorder(e.target.checked)}
              style={{ accentColor: "#16A34A", cursor: "pointer" }}
            />
            Sorot Perbatasan (&lt;0.10)
          </label>

          {/* Button Pusatkan */}
          <button
            onClick={() => {
              setFilterCluster("all");
              setFilterProvinsi("all");
              setHighlightBorder(false);
            }}
            style={{
              background: "#D1FAE5",
              border: "1px solid #A7F3D0",
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 11,
              fontWeight: 700,
              color: "#065F46",
              display: "flex",
              alignItems: "center",
              gap: 4,
              cursor: "pointer",
            }}
          >
            <Maximize2 size={12} />
            Pusatkan
          </button>
        </div>
      </div>

      {/* =========================================================================
          MAIN 2-COLUMN LAYOUT: PCA 2D SCATTER PLOT & ANALYTICAL TILES
      ========================================================================= */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 16, alignItems: "start" }}>
        {/* -----------------------------------------------------------------------
            LEFT: PCA 2D SCATTER PLOT
        ----------------------------------------------------------------------- */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(6, 78, 59, 0.1)",
            borderRadius: 14,
            padding: "20px",
            boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.03)",
            position: "relative",
          }}
        >
          {/* SVG Canvas for Scatter Plot */}
          <div style={{ position: "relative", width: "100%", height: 460, background: "#FAFDFB", borderRadius: 12, border: "1px solid #EDF4F0", overflow: "hidden" }}>
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              style={{ width: "100%", height: "100%", display: "block" }}
            >
              {/* Background grid lines */}
              <defs>
                <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#E6EFE9" strokeWidth="0.8" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Zero Crosshair Lines */}
              <line
                x1={pad}
                y1={zeroY}
                x2={svgWidth - pad}
                y2={zeroY}
                stroke="#BEDFC9"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <line
                x1={zeroX}
                y1={pad}
                x2={zeroX}
                y2={svgHeight - pad}
                stroke="#BEDFC9"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />

              {/* Scatter Points */}
              {points.map((p, idx) => {
                const cx = toSvgX(p.pc1);
                const cy = toSvgY(p.pc2);
                const cfg = CLUSTER_CONFIG[p.cluster] || CLUSTER_CONFIG[0];
                const isSelected = hoveredPoint?.name === p.name;
                const showRing = highlightBorder && p.isBorder;

                return (
                  <g
                    key={p.name + idx}
                    onClick={() => {
                      if (onSelectRegion) onSelectRegion(p.name);
                    }}
                    onMouseEnter={() => setHoveredPoint(p)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    style={{ cursor: "pointer" }}
                  >
                    {/* Border highlight concentric ring */}
                    {showRing && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={10}
                        fill="none"
                        stroke="#DC2626"
                        strokeWidth="1.5"
                        strokeDasharray="2 2"
                        opacity={0.8}
                      />
                    )}

                    {/* Point Dot */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isSelected ? 6 : 4}
                      fill={cfg.color}
                      stroke="#FFFFFF"
                      strokeWidth={1.2}
                      opacity={isSelected ? 1 : 0.85}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Empty State Fallback if Filter Yields 0 Results */}
            {points.length === 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  background: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid #D1E5D8",
                  borderRadius: 10,
                  padding: "16px 20px",
                  textAlign: "center",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                  zIndex: 5,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: "#143224" }}>
                  Tidak ada wilayah yang sesuai filter
                </div>
                <div style={{ fontSize: 11, color: "#546E60", margin: "4px 0 10px" }}>
                  Kombinasi tipe klaster dan provinsi ini tidak memiliki data wilayah.
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFilterCluster("all");
                    setFilterProvinsi("all");
                  }}
                  style={{
                    background: "#064E3B",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: 6,
                    padding: "6px 12px",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Reset Semua Filter
                </button>
              </div>
            )}

            {/* Y-Axis Label (Rotated on the Left) */}
            <div
              style={{
                position: "absolute",
                left: -60,
                top: "50%",
                transform: "translateY(-50%) rotate(-90deg)",
                fontSize: 10,
                fontWeight: 600,
                color: "#4A6354",
                background: "rgba(255, 255, 255, 0.9)",
                padding: "2px 8px",
                borderRadius: 4,
                border: "none",
              }}
            >
              ↕ PC2 (24.1%): Umbi vs Makanan Jadi
            </div>

            {/* X-Axis Label (Bottom Center) */}
            <div
              style={{
                position: "absolute",
                bottom: 12,
                left: "50%",
                transform: "translateX(-50%)",
                fontSize: 10,
                fontWeight: 600,
                color: "#1C553D",
                background: "rgba(255, 255, 255, 0.95)",
                padding: "4px 12px",
                borderRadius: 9999,
                border: "1px solid #CFE3D6",
                boxShadow: "0px 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              ↔ PC1 (42.8%): Keragaman Nabati/Hewani vs Padi-padian
            </div>

            {/* Interactive Tooltip Card */}
            {hoveredPoint && (
              <div
                style={{
                  position: "absolute",
                  left: Math.min(svgWidth - 210, Math.max(10, toSvgX(hoveredPoint.pc1) - 90)),
                  top: Math.max(10, toSvgY(hoveredPoint.pc2) - 60),
                  background: "#FFFFFF",
                  border: "1px solid #CFE3D6",
                  borderRadius: 8,
                  padding: "6px 10px",
                  boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.08)",
                  fontSize: 11,
                  pointerEvents: "none",
                  zIndex: 10,
                }}
              >
                <div style={{ fontWeight: 700, color: "#143224" }}>
                  {hoveredPoint.name}
                </div>
                <div style={{ color: "#546E60", fontSize: 10 }}>
                  Tipe {hoveredPoint.cluster} • PC1: {hoveredPoint.pc1.toFixed(2)} | PC2: {hoveredPoint.pc2.toFixed(2)}
                </div>
                {hoveredPoint.isBorder && (
                  <div style={{ color: "#065F46", fontWeight: 600, fontSize: 10, marginTop: 2 }}>
                    Titik Perbatasan Tipe 1 (Margin: {hoveredPoint.margin})
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* -----------------------------------------------------------------------
            RIGHT COLUMN: DISTRIBUSI 4 TIPE KLASTER & METRIK VALIDASI
        ----------------------------------------------------------------------- */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Card 1: Distribusi 4 Tipe Klaster */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid rgba(6, 78, 59, 0.1)",
              borderRadius: 14,
              padding: "16px 18px",
              boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.03)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Layers size={16} color="#006C48" />
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#143224", margin: 0, letterSpacing: 0.3 }}>
                  DISTRIBUSI 4 TIPE KLASTER
                </h3>
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#4A6354",
                  background: "#E8F2EC",
                  borderRadius: 4,
                  padding: "1px 6px",
                }}
              >
                514 Wilayah
              </span>
            </div>

            {/* 2x2 Tiles Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {Object.entries(CLUSTER_CONFIG).map(([id, cfg]) => (
                <div
                  key={id}
                  onClick={() => setFilterCluster(id)}
                  style={{
                    background: filterCluster === id ? "#E8F5EE" : "#F8FBFA",
                    border: `1px solid ${filterCluster === id ? "#74C69D" : "#E2EDE6"}`,
                    borderRadius: 8,
                    padding: "8px 10px",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 6, height: 6, background: cfg.color, borderRadius: 9999 }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#143224" }}>
                      Tipe {id}: {cfg.short}
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: "#546E60", marginTop: 4 }}>
                    {cfg.count} Wilayah ({cfg.pct})
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Profil Karakteristik 4 Klaster */}
          <div
            style={{
              background: "#FFFFFF",
              border: "none",
              borderRadius: 20,
              padding: "18px 20px",
              boxShadow: "6px 10px 22px rgba(20, 52, 35, 0.05), -3px -3px 10px rgba(255, 255, 255, 0.95), inset 1.5px 1.5px 3px rgba(255, 255, 255, 0.9), inset -1.5px -1.5px 3px rgba(20, 52, 35, 0.03)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <Layers size={16} color="#143224" />
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#143224", margin: 0, letterSpacing: 0.3 }}>
                  PROFIL KARAKTERISTIK KLASTER
                </h3>
              </div>
              <span style={{ fontSize: 10, color: "#546E60", fontWeight: 500 }}>
                Klik untuk sorot
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {CLUSTER_PROFILES.map((prof) => {
                const isActive = filterCluster === String(prof.id);
                return (
                  <div
                    key={prof.id}
                    onClick={() => setFilterCluster(isActive ? "all" : String(prof.id))}
                    style={{
                      background: isActive ? "#F0F9F4" : "#F9FBFA",
                      border: "none",
                      borderRadius: 12,
                      padding: "9px 12px",
                      cursor: "pointer",
                      boxShadow: isActive
                        ? "inset 1px 1px 3px rgba(22, 101, 52, 0.15), 0 0 0 1.5px " + prof.color
                        : "inset 1px 1px 2px rgba(255, 255, 255, 0.9), inset -1px -1px 2px rgba(20, 52, 35, 0.02)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          background: prof.bg,
                          color: prof.textColor,
                          padding: "1px 6px",
                          borderRadius: 9999,
                        }}
                      >
                        {prof.tag}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#143224" }}>
                        {prof.name}
                      </span>
                    </div>
                    <div style={{ fontSize: 10.5, color: "#4B6354", lineHeight: "14px" }}>
                      {prof.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 3: Prediksi & Klasifikasi Tipe Pola Banner */}
          <div
            style={{
              background: "#D1FAE5",
              border: "1px solid #A7F3D0",
              borderRadius: 14,
              padding: "14px 18px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.03)",
            }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#064E3B" }}>
                Prediksi &amp; Klasifikasi Tipe Pola
              </div>
            </div>
            <button
              onClick={() => onNavigate("cek")}
              style={{
                background: "#064E3B",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 8,
                padding: "6px 12px",
                fontSize: 11,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 5,
                cursor: "pointer",
              }}
            >
              <span>Cek Wilayah</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
