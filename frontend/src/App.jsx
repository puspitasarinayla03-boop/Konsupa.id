/**
 * App.jsx — konsupa.id
 * Layout terintegrasi dengan Header & Footer sesuai spesifikasi Figma
 */

import { useState, useRef } from "react";
import "./App.css";

import JelajahWilayah from "./components/JelajahWilayah.jsx";
import PetaKlaster from "./components/PetaKlaster.jsx";
import CekTipePola from "./components/CekTipePola.jsx";

const PAGES = [
  { id: "peta", label: "Sebaran & Jelajah Wilayah" },
  { id: "cek", label: "Cek Tipe Pola" },
];

export default function App() {
  const [page, setPage] = useState("peta");
  const [selectedRegion, setSelectedRegion] = useState("Kabupaten Banyumas");
  const jelajahRef = useRef(null);

  const handleNavigate = (targetPage, region = null) => {
    if (region) setSelectedRegion(region);
    setPage(targetPage);
    if (targetPage === "peta" && region) {
      setTimeout(() => {
        jelajahRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 60);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSelectRegionFromMap = (region) => {
    setSelectedRegion(region);
    jelajahRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const renderPage = () => {
    switch (page) {
      case "cek":
        return <CekTipePola onNavigate={handleNavigate} />;
      case "peta":
      default:
        return (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <PetaKlaster
              onSelectRegion={handleSelectRegionFromMap}
              onNavigate={handleNavigate}
            />
            <div
              ref={jelajahRef}
              id="jelajah-wilayah-section"
              style={{ scrollMarginTop: 72 }}
            >
              <JelajahWilayah
                initialRegion={selectedRegion}
                onNavigate={handleNavigate}
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="app-viewport">
      {/* Top Navbar Figma */}
      <header className="header-wrapper">
        <div className="header-container">
          {/* Brand Logo & Title */}
          <div 
            className="header-brand-group" 
            onClick={() => {
              setPage("peta");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            style={{ cursor: "pointer" }}
            title="konsupa.id — Sebaran & Jelajah Wilayah"
          >
            <div 
              style={{
                height: 34,
                padding: "2px 8px",
                background: "#FFFFFF",
                borderRadius: 9,
                display: "flex",
                alignItems: "center",
                boxShadow: "0 2px 6px rgba(0,0,0,0.18)",
              }}
            >
              <img 
                src="/logo.png" 
                alt="Logo konsupa.id" 
                style={{ height: 26, width: "auto", objectFit: "contain", display: "block" }} 
              />
            </div>
            <span className="header-brand-title">konsupa.id</span>
          </div>

          {/* Navigation Pills */}
          <nav className="nav-pill-container">
            {PAGES.map(({ id, label }) => (
              <button
                key={id}
                className={`nav-pill-btn${page === id ? " active" : ""}`}
                onClick={() => setPage(id)}
              >
                <span>{label}</span>
              </button>
            ))}
          </nav>

          {/* Right Controls */}
          <div className="header-meta-group">
            <div className="header-status-badge">
              <span className="header-pulse-dot" />
              <strong style={{ color: "#FFFFFF" }}>514</strong>
              <span style={{ color: "#B6F0D3" }}>Kab/Kota</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="app-content">{renderPage()}</main>

      {/* Footer Figma */}
      <footer className="footer-wrapper">
        <div className="footer-container">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <strong style={{ color: "#143B29" }}>konsupa.id</strong>
            <span>•</span>
            <span>Sistem Informasi Pola Konsumsi Pangan Indonesia</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span>Badan Pangan Nasional (Bapanas) & BPS</span>
            <span>© 2025 Hak Cipta Dilindungi</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
