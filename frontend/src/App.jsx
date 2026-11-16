/**
 * App.jsx  — revisi sesuai PRD
 * Halaman:
 *   "beranda"     – ringkasan 4 tipe pola
 *   "jelajah"     – profil wilayah + komoditas + wilayah mirip
 *   "cek"         – Cek Tipe Pola (input 8 kelompok → klaster)
 *   "peta"        – Peta Klaster scatter PCA
 *   "metodologi"  – metrik evaluasi & keterbatasan
 */

import { useState } from "react";
import { Wheat, Map, Search, ScatterChart, Info, BookOpen } from "lucide-react";
import "./App.css";

import Beranda        from "./components/Beranda.jsx";
import JelajahWilayah from "./components/JelajahWilayah.jsx";
import PetaKlaster    from "./components/PetaKlaster.jsx";
import CekTipePola    from "./components/CekTipePola.jsx";

const PAGES = [
  { id: "beranda", label: "Beranda",         Icon: Wheat        },
  { id: "jelajah", label: "Jelajah Wilayah", Icon: Map          },
  { id: "peta",    label: "Peta Klaster",    Icon: ScatterChart },
  { id: "cek",     label: "Cek Tipe Pola",   Icon: Search       },
];

export default function App() {
  const [page, setPage] = useState("beranda");

  const renderPage = () => {
    switch (page) {
      case "beranda": return <Beranda        onNavigate={setPage} />;
      case "jelajah": return <JelajahWilayah />;
      case "peta":    return <PetaKlaster    />;
      case "cek":     return <CekTipePola    />;
      default:        return <Beranda        onNavigate={setPage} />;
    }
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-brand">
          <Wheat size={22} />
          konsupa.id
        </div>
        <div className="navbar-nav">
          {PAGES.map(({ id, label, Icon }) => (
            <button
              key={id}
              className={`nav-btn${page === id ? " active" : ""}`}
              onClick={() => setPage(id)}
            >
              <Icon size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />
              {label}
            </button>
          ))}
        </div>
      </nav>

      <main>{renderPage()}</main>
    </>
  );
}
