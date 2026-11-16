/**
 * Beranda.jsx — konsupa.id
 * Sesuai desain UI/UX Figma (media_1794827174061_6fdd4bd5.png)
 */

import { useState } from "react";
import {
  LayoutGrid,
  MapPin,
  Share2,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Compass,
  ScatterChart,
  Search,
  ShieldAlert,
} from "lucide-react";

const INITIAL_CLUSTERS = [
  {
    id: 0,
    type: "TIPE 0",
    name: "Pola Pangan Umbi Tradisional",
    proporsi: 1.6,
    kabCount: 8,
    skorPPH: 65.7,
    color: "#16A34A",
    bgBadge: "#D8EEDF",
    textBadge: "#1C553D",
    barColor: "#16A34A",
  },
  {
    id: 1,
    type: "TIPE 1",
    name: "Pola Pangan Nabati & Serat Tinggi",
    proporsi: 34.0,
    kabCount: 175,
    skorPPH: 86.5,
    color: "#2563EB",
    bgBadge: "#DBEAFE",
    textBadge: "#1E40AF",
    barColor: "#3B82F6",
  },
  {
    id: 2,
    type: "TIPE 2",
    name: "Pola Pangan Beras-Sentris",
    proporsi: 32.9,
    kabCount: 169,
    skorPPH: 81.1,
    color: "#D97706",
    bgBadge: "#FEF3C7",
    textBadge: "#92400E",
    barColor: "#F59E0B",
  },
  {
    id: 3,
    type: "TIPE 3",
    name: "Pola Pangan Hewani & Lemak Tinggi",
    proporsi: 31.5,
    kabCount: 162,
    skorPPH: 88.9,
    color: "#DC2626",
    bgBadge: "#FEE2E2",
    textBadge: "#991B1B",
    barColor: "#EF4444",
  },
];

export default function Beranda({ onNavigate }) {
  const [sortBy, setSortBy] = useState("dominansi"); // 'dominansi' | 'pph'

  const sortedClusters = [...INITIAL_CLUSTERS].sort((a, b) => {
    if (sortBy === "dominansi") return b.proporsi - a.proporsi;
    return b.skorPPH - a.skorPPH;
  });

  return (
    <div style={{ width: "100%", boxSizing: "border-box", padding: "28px 32px 40px", display: "flex", flexDirection: "column", gap: 20 }}>
      {/* =========================================================================
          1. HERO CARD (Claymorphism)
      ========================================================================= */}
      <div
        style={{
          position: "relative",
          padding: "26px 30px",
          background: "#FFFFFF",
          border: "none",
          borderRadius: 22,
          boxShadow: "8px 14px 28px rgba(20, 52, 35, 0.05), -5px -5px 16px rgba(255, 255, 255, 0.95), inset 2px 2px 4px rgba(255, 255, 255, 0.9), inset -2px -2px 4px rgba(20, 52, 35, 0.03)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 20,
          flexWrap: "wrap",
        }}
      >

        {/* Left: Title & Subtitle */}
        <div style={{ position: "relative", zIndex: 1, maxWidth: 540 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 12px",
              background: "#D8EEDF",
              border: "1px solid #BEDFC9",
              borderRadius: 9999,
              marginBottom: 10,
            }}
          >
            <span style={{ width: 6, height: 6, background: "#16A34A", borderRadius: 9999 }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#1C553D", letterSpacing: 0.2 }}>
              Statistik Konsumsi Pangan Nasional
            </span>
          </div>

          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              lineHeight: "32px",
              letterSpacing: "-0.5px",
              color: "#143224",
              margin: "0 0 8px 0",
            }}
          >
            Pola Konsumsi Pangan Indonesia
          </h1>

          <p
            style={{
              fontSize: 13,
              fontWeight: 500,
              lineHeight: "20px",
              color: "#466050",
              margin: 0,
            }}
          >
            Pemetaan klaster pola makan 514 Kabupaten/Kota berbasis 8 kelompok pangan Susenas 2024–2025 dengan standar Pola Pangan Harapan (PPH).
          </p>
        </div>

        {/* Right: 3 Summary Stat Tiles */}
        <div style={{ position: "relative", zIndex: 1, display: "flex", gap: 12, flexWrap: "wrap" }}>
          {/* Card 1 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 18px",
              background: "#FFFFFF",
              border: "1px solid rgba(0, 0, 0, 0.0)",
              borderRadius: 16,
              boxShadow: "4px 6px 14px rgba(20, 52, 35, 0.04), -2px -2px 6px rgba(255, 255, 255, 0.9), inset 1.5px 1.5px 2px rgba(255, 255, 255, 0.9), inset -1px -1px 2px rgba(20, 52, 35, 0.02)",
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                background: "#E8F5EE",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#1C553D",
              }}
            >
              <LayoutGrid size={20} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#143224", lineHeight: "24px" }}>
                1.028
              </div>
              <div style={{ fontSize: 11, fontWeight: 500, color: "#466050" }}>Pengamatan</div>
            </div>
          </div>

          {/* Card 2 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 18px",
              background: "#FFFFFF",
              border: "1px solid rgba(0, 0, 0, 0.0)",
              borderRadius: 16,
              boxShadow: "4px 6px 14px rgba(20, 52, 35, 0.04), -2px -2px 6px rgba(255, 255, 255, 0.9), inset 1.5px 1.5px 2px rgba(255, 255, 255, 0.9), inset -1px -1px 2px rgba(20, 52, 35, 0.02)",
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                background: "#E8F5EE",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#1C553D",
              }}
            >
              <MapPin size={20} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#143224", lineHeight: "24px" }}>
                514
              </div>
              <div style={{ fontSize: 11, fontWeight: 500, color: "#466050" }}>Kab/Kota (100%)</div>
            </div>
          </div>

          {/* Card 3 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 18px",
              background: "#FFFFFF",
              border: "1px solid rgba(0, 0, 0, 0.0)",
              borderRadius: 16,
              boxShadow: "4px 6px 14px rgba(20, 52, 35, 0.04), -2px -2px 6px rgba(255, 255, 255, 0.9), inset 1.5px 1.5px 2px rgba(255, 255, 255, 0.9), inset -1px -1px 2px rgba(20, 52, 35, 0.02)",
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                background: "#E8F5EE",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#1C553D",
              }}
            >
              <Share2 size={20} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#143224", lineHeight: "24px" }}>
                4 Tipe
              </div>
              <div style={{ fontSize: 11, fontWeight: 500, color: "#466050" }}>Klaster PPH</div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. KARAKTERISTIK 4 KLASTER KONSUMSI PANGAN
      ========================================================================= */}
      <div>
        {/* Section Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#143224", margin: 0 }}>
              Karakteristik 4 Klaster Konsumsi Pangan
            </h2>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#1C553D",
                background: "#DDF0E4",
                border: "1px solid #BFE2CD",
                borderRadius: 9999,
                padding: "2px 8px",
              }}
            >
              K-Means Optimum (k=4)
            </span>
          </div>

          {/* Sort Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#466050", letterSpacing: 0.5 }}>
              URUTKAN:
            </span>
            <button
              onClick={() => setSortBy("dominansi")}
              style={{
                padding: "4px 10px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                border: "none",
                background: sortBy === "dominansi" ? "#1B4D36" : "#E2ECE6",
                color: sortBy === "dominansi" ? "#FFFFFF" : "#325040",
                transition: "all 0.15s",
              }}
            >
              Dominansi
            </button>
            <button
              onClick={() => setSortBy("pph")}
              style={{
                padding: "4px 10px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                border: "none",
                background: sortBy === "pph" ? "#1B4D36" : "#E2ECE6",
                color: sortBy === "pph" ? "#FFFFFF" : "#325040",
                transition: "all 0.15s",
              }}
            >
              Skor PPH
            </button>
          </div>
        </div>

        {/* 4 Cards Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
          {sortedClusters.map((c) => (
            <div
              key={c.id}
              onClick={() => onNavigate("peta")}
              style={{
                background: "#FFFFFF",
                border: "1px solid rgba(0, 0, 0, 0.0)",
                borderRadius: 20,
                padding: "18px 20px",
                boxShadow: "6px 10px 22px rgba(20, 52, 35, 0.05), -3px -3px 10px rgba(255, 255, 255, 0.95), inset 1.5px 1.5px 3px rgba(255, 255, 255, 0.9), inset -1.5px -1.5px 3px rgba(20, 52, 35, 0.03)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 14,
                cursor: "pointer",
                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "8px 16px 28px rgba(20, 52, 35, 0.09), -4px -4px 12px rgba(255, 255, 255, 0.95), inset 1.5px 1.5px 3px rgba(255, 255, 255, 0.95)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "6px 10px 22px rgba(20, 52, 35, 0.05), -3px -3px 10px rgba(255, 255, 255, 0.95), inset 1.5px 1.5px 3px rgba(255, 255, 255, 0.9), inset -1.5px -1.5px 3px rgba(20, 52, 35, 0.03)";
              }}
            >
              {/* Card Top: Type badge & Arrow */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "3px 8px",
                    borderRadius: 6,
                    background: c.bgBadge,
                    color: c.textBadge,
                  }}
                >
                  {c.type}
                </span>
                <span style={{ color: "#7A9E8A" }}>
                  <ArrowRight size={14} />
                </span>
              </div>

              {/* Proportion & Title */}
              <div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span style={{ fontSize: 26, fontWeight: 800, color: "#143224" }}>
                    {c.proporsi}%
                  </span>
                  <span style={{ fontSize: 12, color: "#6A8374", fontWeight: 500 }}>
                    proporsi
                  </span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#193B2B", marginTop: 2 }}>
                  {c.name}
                </div>
                <div style={{ fontSize: 11, color: "#6A8374", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                  <MapPin size={11} /> {c.kabCount} Kab/Kota
                </div>
              </div>

              {/* Progress Bar & Skor PPH */}
              <div style={{ borderTop: "1px solid #EBF2ED", paddingTop: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#466050" }}>Skor PPH</span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#1C553D",
                      background: "#E8F5EE",
                      padding: "1px 6px",
                      borderRadius: 4,
                    }}
                  >
                    {c.skorPPH}
                  </span>
                </div>
                {/* Mini progress bar */}
                <div style={{ width: "100%", height: 4, background: "#E5EFE9", borderRadius: 9999, overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${(c.skorPPH / 100) * 100}%`,
                      height: "100%",
                      background: c.barColor,
                      borderRadius: 9999,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* =========================================================================
          3. DUA KOLOM: SOROTAN POLA NASIONAL & ALUR EKSPLORASI
      ========================================================================= */}
      <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1.3fr", gap: 16, alignItems: "stretch" }}>
        {/* Kolom Kiri: Sorotan Pola Nasional & Dinamika Konsumsi */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(0, 0, 0, 0.0)",
            borderRadius: 22,
            padding: "22px 24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "7px 12px 24px rgba(20, 52, 35, 0.05), -4px -4px 14px rgba(255, 255, 255, 0.95), inset 1.5px 1.5px 3px rgba(255, 255, 255, 0.9), inset -1.5px -1.5px 4px rgba(20, 52, 35, 0.03)",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <TrendingUp size={16} color="#1C553D" />
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#143224", margin: 0 }}>
                Sorotan Pola Nasional & Dinamika Konsumsi
              </h3>
            </div>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "#1C553D",
                background: "#E8F5EE",
                border: "1px solid #CFE3D6",
                borderRadius: 4,
                padding: "2px 6px",
              }}
            >
              Rangkuman Analitik
            </span>
          </div>

          {/* 3 Metric Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {/* Box 1 */}
            <div style={{ background: "#F7FAF8", borderRadius: 14, padding: "12px 14px", border: "1px solid #DCE8E1", boxShadow: "inset 1.5px 2px 4px rgba(20, 52, 35, 0.04), inset -1px -1px 3px rgba(255, 255, 255, 0.85)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#547363", letterSpacing: 0.5 }}>
                KONSENTRASI
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#143224", margin: "2px 0 4px" }}>
                38.5%
              </div>
              <div style={{ fontSize: 10, color: "#4A6657", lineHeight: "14px" }}>
                Dominansi karbohidrat padi-padian masih menjadi pola utama di sebagian besar wilayah Jawa & Sumatera.
              </div>
            </div>

            {/* Box 2 */}
            <div style={{ background: "#F7FAF8", borderRadius: 14, padding: "12px 14px", border: "1px solid #DCE8E1", boxShadow: "inset 1.5px 2px 4px rgba(20, 52, 35, 0.04), inset -1px -1px 3px rgba(255, 255, 255, 0.85)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#547363", letterSpacing: 0.5 }}>
                TANTANGAN
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#B45309", margin: "2px 0 4px" }}>
                62.8 g
              </div>
              <div style={{ fontSize: 10, color: "#4A6657", lineHeight: "14px" }}>
                Asupan sayur & buah per kapita masih di bawah target kecukupan gizi optimal 250 g/hari.
              </div>
            </div>

            {/* Box 3 */}
            <div style={{ background: "#F7FAF8", borderRadius: 14, padding: "12px 14px", border: "1px solid #DCE8E1", boxShadow: "inset 1.5px 2px 4px rgba(20, 52, 35, 0.04), inset -1px -1px 3px rgba(255, 255, 255, 0.85)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#547363", letterSpacing: 0.5 }}>
                STABILITAS
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#1C553D", margin: "2px 0 4px" }}>
                89.2%
              </div>
              <div style={{ fontSize: 10, color: "#4A6657", lineHeight: "14px" }}>
                Konsistensi tipe pola antar-tahun (2024–2025) menunjukkan ketahanan struktur konsumsi.
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div
            style={{
              marginTop: 14,
              paddingTop: 10,
              borderTop: "1px solid #EDF4F0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 11,
              color: "#5C786A",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span>● Standar PPH: 870 g/kapita/hari</span>
              <span>● Energi Acuan: 2.100 kkal</span>
            </div>
            <div style={{ fontStyle: "italic", color: "#3B614E" }}>
              Algoritma K-Means terstandarisasi z-score
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Alur Eksplorasi Data */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(0, 0, 0, 0.0)",
            borderRadius: 22,
            padding: "22px 24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "7px 12px 24px rgba(20, 52, 35, 0.05), -4px -4px 14px rgba(255, 255, 255, 0.95), inset 1.5px 1.5px 3px rgba(255, 255, 255, 0.9), inset -1.5px -1.5px 4px rgba(20, 52, 35, 0.03)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Compass size={16} color="#1C553D" />
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#143224", margin: 0 }}>
                Alur Eksplorasi Data
              </h3>
            </div>
            <p style={{ fontSize: 11, color: "#5C786A", margin: "0 0 12px 0" }}>
              Pilih modul analitik untuk melihat detail sebaran geografis dan karakteristik tiap wilayah.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {/* Row 1 */}
              <div
                onClick={() => onNavigate("jelajah")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  borderRadius: 14,
                  border: "1px solid #DCE8E1",
                  background: "#F8FAF9",
                  boxShadow: "3px 4px 10px rgba(20, 52, 35, 0.03), inset 1px 1px 2px rgba(255, 255, 255, 0.9)",
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#EFF7F2")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#F9FCFA")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Compass size={16} color="#1C553D" />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#143224" }}>
                      Jelajah Wilayah
                    </div>
                    <div style={{ fontSize: 10, color: "#5C786A" }}>
                      Profil per kabupaten/kota lengkap
                    </div>
                  </div>
                </div>
                <ArrowRight size={14} color="#7A9E8A" />
              </div>

              {/* Row 2 */}
              <div
                onClick={() => onNavigate("peta")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  borderRadius: 14,
                  border: "1px solid #DCE8E1",
                  background: "#F8FAF9",
                  boxShadow: "3px 4px 10px rgba(20, 52, 35, 0.03), inset 1px 1px 2px rgba(255, 255, 255, 0.9)",
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#EFF7F2")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#F9FCFA")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <ScatterChart size={16} color="#1C553D" />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#143224" }}>
                      Peta Klaster
                    </div>
                    <div style={{ fontSize: 10, color: "#5C786A" }}>
                      Sebaran spasial 514 daerah
                    </div>
                  </div>
                </div>
                <ArrowRight size={14} color="#7A9E8A" />
              </div>

              {/* Row 3 */}
              <div
                onClick={() => onNavigate("cek")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  borderRadius: 14,
                  border: "1px solid #DCE8E1",
                  background: "#F8FAF9",
                  boxShadow: "3px 4px 10px rgba(20, 52, 35, 0.03), inset 1px 1px 2px rgba(255, 255, 255, 0.9)",
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#EFF7F2")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#F9FCFA")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Search size={16} color="#1C553D" />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#143224" }}>
                      Cek Tipe Pola
                    </div>
                    <div style={{ fontSize: 10, color: "#5C786A" }}>
                      Simulasi & prediksi klaster wilayah
                    </div>
                  </div>
                </div>
                <ArrowRight size={14} color="#7A9E8A" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. FOOTER BANNER / BATAS KLAIM ANALITIK
      ========================================================================= */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid rgba(0, 0, 0, 0.0)",
          borderRadius: 16,
          padding: "12px 20px",
          boxShadow: "5px 8px 18px rgba(20, 52, 35, 0.04), -2px -2px 8px rgba(255, 255, 255, 0.9), inset 1px 1px 2px rgba(255, 255, 255, 0.9)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", fontSize: 11, color: "#466050" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontWeight: 700, color: "#143224" }}>
            <ShieldAlert size={14} color="#1C553D" />
            BATAS KLAIM ANALITIK:
          </div>
          <span>● Data agregat makro non-klinis</span>
          <span>● Tidak mengukur alokasi bansos spesifik</span>
          <span>● Sumber resmi BPS Susenas 2024–2025</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "#1C553D",
              background: "#E8F5EE",
              border: "1px solid #BEDFC9",
              borderRadius: 4,
              padding: "2px 8px",
            }}
          >
            Bapanas Framework
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "#1C553D",
              background: "#E8F5EE",
              border: "1px solid #BEDFC9",
              borderRadius: 4,
              padding: "2px 8px",
            }}
          >
            514 Wilayah Terpetakan
          </span>
        </div>
      </div>
    </div>
  );
}
