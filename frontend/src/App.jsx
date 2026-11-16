/**
 * App.jsx — konsupa.id
 * Layout terintegrasi dengan Header & Footer sesuai spesifikasi Figma
 */

import { useState } from "react";
import "./App.css";

import Beranda from "./components/Beranda.jsx";
import JelajahWilayah from "./components/JelajahWilayah.jsx";
import PetaKlaster from "./components/PetaKlaster.jsx";
import CekTipePola from "./components/CekTipePola.jsx";

const PAGES = [
  { id: "beranda", label: "Beranda" },
  { id: "jelajah", label: "Jelajah Wilayah" },
  { id: "peta", label: "Peta Klaster" },
  { id: "cek", label: "Cek Tipe Pola" },
];

export default function App() {
  const [page, setPage] = useState("beranda");
  const [selectedRegion, setSelectedRegion] = useState("Kabupaten Banyumas");

  const handleNavigate = (targetPage, region = null) => {
    if (region) setSelectedRegion(region);
    setPage(targetPage);
  };

  const renderPage = () => {
    switch (page) {
      case "beranda":
        return <Beranda onNavigate={handleNavigate} />;
      case "jelajah":
        return (
          <JelajahWilayah
            initialRegion={selectedRegion}
            onNavigate={handleNavigate}
          />
        );
      case "peta":
        return (
          <PetaKlaster
            onSelectRegion={(reg) => handleNavigate("jelajah", reg)}
            onNavigate={handleNavigate}
          />
        );
      case "cek":
        return <CekTipePola onNavigate={handleNavigate} />;
      default:
        return <Beranda onNavigate={handleNavigate} />;
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
            onClick={() => setPage("beranda")}
            style={{ cursor: "pointer" }}
            title="konsupa.id — Beranda"
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
