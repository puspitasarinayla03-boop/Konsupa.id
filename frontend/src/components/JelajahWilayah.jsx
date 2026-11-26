/**
 * JelajahWilayah.jsx — konsupa.id
 * Halaman Jelajah Wilayah Interaktif dengan Real Data BPS 514 Daerah:
 * - Skor PPH Dinamis (Formula Bapanas WNPG)
 * - 26 Komoditas Riil per Daerah dengan Filter Kategori & Mode 6 Teratas / Semua
 * - Cross-Filtering: Klik baris kelompok pangan untuk memfilter komoditas penyusunnya
 * - Mode Tampilan: Tabel Rinci vs Grafik Bar Capaian
 * - Autocomplete Pencarian Wilayah tanpa pemotongan teks
 * - Modal Komparasi Berdampingan (Side-by-Side) untuk 5 Wilayah Paling Mirip
 * - Unduh & Cetak Lembar Profil Resmi
 */

import { useState, useEffect, useMemo } from "react";
import {
  Compass,
  Search,
    Wheat,
  Droplet,
  Fish,
  Egg,
  Sparkles,
  ChevronRight,
  MapPin,
  CheckCircle2,
  Filter,
  BarChart2,
  Table as TableIcon,
  Layers,
  ArrowRight,
  ArrowLeftRight,
  X,
    Info,
  Maximize2,
} from "lucide-react";
import { getAllWilayah, getKomoditasWilayah } from "../api.js";
import preloadedWilayah from "../data/data_wilayah.json";
import preloadedKomoditas from "../data/data_komoditas.json";
import { CLUSTER_CONFIG } from "../clusterConfig.js";
import { generateBapanasRecommendations } from "../pphRecommendations.js";

// -----------------------------------------------------------------------------
// KONFIGURASI STANDAR POLA PANGAN HARAPAN (BAPANAS / WNPG)
// Bobot & Skor Maksimal Acuan Energi 2.100 kkal
// -----------------------------------------------------------------------------
const PPH_CONFIG = {
  "padi-padian": { nama: "Padi-padian", target: 275, maxScore: 25.0, weight: 0.5, dotColor: "#EA580C" },
  "umbi-umbian": { nama: "Umbi-umbian", target: 100, maxScore: 2.5, weight: 0.5, dotColor: "#92400E" },
  "pangan hewani": { nama: "Pangan Hewani", target: 150, maxScore: 24.0, weight: 2.0, dotColor: "#7C3AED" },
  "minyak dan lemak": { nama: "Minyak & Lemak", target: 20, maxScore: 5.0, weight: 0.5, dotColor: "#D97706" },
  "buah/biji berminyak": { nama: "Buah/Biji Berminyak", target: 10, maxScore: 1.0, weight: 0.5, dotColor: "#0D9488" },
  "kacang-kacangan": { nama: "Kacang-kacangan", target: 35, maxScore: 10.0, weight: 2.0, dotColor: "#0D9488" },
  "gula": { nama: "Gula", target: 30, maxScore: 2.5, weight: 0.5, dotColor: "#0284C7" },
  "sayur dan buah": { nama: "Sayur & Buah", target: 250, maxScore: 30.0, weight: 2.0, dotColor: "#16A34A" },
};

// -----------------------------------------------------------------------------
// METADATA 26 KOMODITAS RIIL BAPANAS
// -----------------------------------------------------------------------------
const KOMODITAS_META = {
  beras: { label: "Beras", group: "padi-padian", category: "Padi & Umbi", color: "#166534", bg: "#DCFCE7" },
  jagung: { label: "Jagung", group: "padi-padian", category: "Padi & Umbi", color: "#854D0E", bg: "#FEF9C3" },
  terigu: { label: "Terigu & Olahan", group: "padi-padian", category: "Padi & Umbi", color: "#9A3412", bg: "#FFEDD5" },
  sagu: { label: "Sagu", group: "padi-padian", category: "Padi & Umbi", color: "#78350F", bg: "#FEF3C7" },
  singkong: { label: "Singkong / Ubi Kayu", group: "umbi-umbian", category: "Padi & Umbi", color: "#713F12", bg: "#FEF3C7" },
  "ubi jalar": { label: "Ubi Jalar", group: "umbi-umbian", category: "Padi & Umbi", color: "#92400E", bg: "#FDE68A" },
  kentang: { label: "Kentang", group: "umbi-umbian", category: "Padi & Umbi", color: "#78350F", bg: "#FEF3C7" },
  "umbi lainnya": { label: "Umbi-umbian Lain", group: "umbi-umbian", category: "Padi & Umbi", color: "#854D0E", bg: "#FEF9C3" },
  ikan: { label: "Ikan & Hasil Laut", group: "pangan hewani", category: "Hewani", color: "#0E7490", bg: "#CFFAFE" },
  "daging unggas": { label: "Daging Ayam / Unggas", group: "pangan hewani", category: "Hewani", color: "#B91C1C", bg: "#FEE2E2" },
  "daging ruminansia": { label: "Daging Sapi / Kambing", group: "pangan hewani", category: "Hewani", color: "#991B1B", bg: "#FEE2E2" },
  telur: { label: "Telur Ayam Ras", group: "pangan hewani", category: "Hewani", color: "#D97706", bg: "#FEF3C7" },
  susu: { label: "Susu & Olahan", group: "pangan hewani", category: "Hewani", color: "#1D4ED8", bg: "#DBEAFE" },
  "minyak sawit": { label: "Minyak Kelapa Sawit", group: "minyak dan lemak", category: "Minyak & Biji", color: "#C2410C", bg: "#FFEDD5" },
  "minyak kelapa": { label: "Minyak Kelapa", group: "minyak dan lemak", category: "Minyak & Biji", color: "#A16207", bg: "#FEF9C3" },
  "minyak lainnya": { label: "Minyak Lainnya", group: "minyak dan lemak", category: "Minyak & Biji", color: "#CA8A04", bg: "#FEF08A" },
  kelapa: { label: "Kelapa Butiran", group: "buah/biji berminyak", category: "Minyak & Biji", color: "#15803D", bg: "#DCFCE7" },
  kemiri: { label: "Kemiri", group: "buah/biji berminyak", category: "Minyak & Biji", color: "#4D7C0F", bg: "#ECFCCB" },
  kedelai: { label: "Kedelai (Tahu/Tempe)", group: "kacang-kacangan", category: "Kacang-kacangan", color: "#047857", bg: "#D1FAE5" },
  "kacang tanah": { label: "Kacang Tanah", group: "kacang-kacangan", category: "Kacang-kacangan", color: "#B45309", bg: "#FEF3C7" },
  "kacang hijau": { label: "Kacang Hijau", group: "kacang-kacangan", category: "Kacang-kacangan", color: "#065F46", bg: "#D1FAE5" },
  "kacang lain": { label: "Kacang Lainnya", group: "kacang-kacangan", category: "Kacang-kacangan", color: "#0F766E", bg: "#CCFBF1" },
  "gula pasir": { label: "Gula Pasir", group: "gula", category: "Gula", color: "#0369A1", bg: "#E0F2FE" },
  "gula merah": { label: "Gula Merah / Aren", group: "gula", category: "Gula", color: "#B45309", bg: "#FEF3C7" },
  sayur: { label: "Sayuran Segar", group: "sayur dan buah", category: "Sayur & Buah", color: "#15803D", bg: "#DCFCE7" },
  buah: { label: "Buah-buahan", group: "sayur dan buah", category: "Sayur & Buah", color: "#BE123C", bg: "#FFE4E6" },
};

// Konfigurasi klaster GMM diimpor dari ../clusterConfig.js

export default function JelajahWilayah({ initialRegion = "Kabupaten Banyumas", onNavigate }) {
  // ---------------------------------------------------------------------------
  // STATE MANAGEMENT
  // ---------------------------------------------------------------------------
  const [wilayahList, setWilayahList] = useState(preloadedWilayah || []);
  const [selectedProvinsi, setSelectedProvinsi] = useState("Jawa Tengah");
  const [selectedKabupaten, setSelectedKabupaten] = useState(initialRegion);
  const [selectedKode, setSelectedKode] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Komoditas riil per wilayah
  const [rawKomoditas, setRawKomoditas] = useState(null);
  const [selectedFoodGroupFilter, setSelectedFoodGroupFilter] = useState(null); // cross-filter dari tabel
  const [commodityCategoryFilter, setCommodityCategoryFilter] = useState("Semua");
  const [commodityViewMode, setCommodityViewMode] = useState("top6"); // 'top6' | 'all'
  const [benchmarkView, setBenchmarkView] = useState("table"); // 'table' | 'chart'

  // Modal State
  const [compareRegion, setCompareRegion] = useState(null); // untuk modal side-by-side
  const [showPphBreakdown, setShowPphBreakdown] = useState(false);
  

  // ---------------------------------------------------------------------------
  // DATA FETCHING & SYNCHRONIZATION
  // ---------------------------------------------------------------------------
  useEffect(() => {
    getAllWilayah()
      .then((res) => {
        const raw = res?.data || res || [];
        if (Array.isArray(raw) && raw.length > 0) {
          const hasTahun = raw.some((item) => item.Tahun != null);
          const filtered = hasTahun
            ? raw.filter((item) => item.Tahun == null || Number(item.Tahun) === 2025)
            : raw;
          const unique = [];
          const seen = new Set();
          for (const item of filtered) {
            const key = item.Kode_Wilayah ?? item.Kabupaten_Kota ?? item.wilayah ?? item.nama;
            if (key != null && !seen.has(String(key))) {
              seen.add(String(key));
              unique.push({
                ...item,
                cluster: Number(item.Cluster ?? item.cluster ?? 0) % 4,
              });
            }
          }
          if (unique.length > 0) setWilayahList(unique);
        }
      })
      .catch(() => {
        // Fallback memakai preloadedWilayah yang sudah siap 514 daerah
        setWilayahList(preloadedWilayah);
      });
  }, []);

  // Update selected region jika initialRegion berubah dari halaman lain
  useEffect(() => {
    if (initialRegion) {
      const q = initialRegion.toLowerCase();
      const match =
        wilayahList.find((w) => (w.Kabupaten_Kota || w.wilayah || "").toLowerCase() === q) ||
        wilayahList.find((w) => (w.Kabupaten_Kota || w.wilayah || "").toLowerCase().startsWith(q)) ||
        wilayahList.find((w) => (w.Kabupaten_Kota || w.wilayah || "").toLowerCase().includes(q));
      if (match) {
        setSelectedKode(match.Kode_Wilayah);
        setSelectedKabupaten(match.Kabupaten_Kota || match.wilayah);
        if (match.Provinsi) setSelectedProvinsi(match.Provinsi);
      } else {
        setSelectedKode(null);
        setSelectedKabupaten(initialRegion);
      }
    }
  }, [initialRegion, wilayahList]);

  // Active Territory Record (prioritaskan Kode_Wilayah unik, lalu exact match)
  const activeWilayah = useMemo(() => {
    if (!wilayahList.length) return preloadedWilayah[0];

    if (selectedKode != null) {
      const byKode = wilayahList.find((w) => Number(w.Kode_Wilayah) === Number(selectedKode));
      if (byKode) return byKode;
    }

    const q = (selectedKabupaten || "").toLowerCase();
    if (q && selectedProvinsi) {
      const exactBoth = wilayahList.find(
        (w) =>
          (w.Kabupaten_Kota || w.wilayah || "").toLowerCase() === q &&
          w.Provinsi === selectedProvinsi
      );
      if (exactBoth) return exactBoth;
    }

    if (q) {
      const exactName = wilayahList.find(
        (w) => (w.Kabupaten_Kota || w.wilayah || "").toLowerCase() === q
      );
      if (exactName) return exactName;

      const startsWith = wilayahList.find((w) =>
        (w.Kabupaten_Kota || w.wilayah || "").toLowerCase().startsWith(q)
      );
      if (startsWith) return startsWith;

      const includes = wilayahList.find((w) =>
        (w.Kabupaten_Kota || w.wilayah || "").toLowerCase().includes(q)
      );
      if (includes) return includes;
    }

    return wilayahList[0];
  }, [wilayahList, selectedKode, selectedKabupaten, selectedProvinsi]);

  // Fetch / Lookup Real 26 Komoditas untuk Wilayah Aktif
  useEffect(() => {
    if (!activeWilayah) return;
    const name = activeWilayah.Kabupaten_Kota || activeWilayah.wilayah;
    const kode = activeWilayah.Kode_Wilayah;

    // Coba panggil live API backend
    getKomoditasWilayah(name)
      .then((res) => {
        if (res?.data) {
          setRawKomoditas(res.data);
        } else {
          throw new Error("No live data");
        }
      })
      .catch(() => {
        // Fallback langsung ke dataset preloaded komoditas 514 daerah
        const match = preloadedKomoditas.find(
          (k) => Number(k.Kode_Wilayah) === Number(kode)
        );
        setRawKomoditas(match || null);
      });
  }, [activeWilayah]);

  // Daftar Provinsi
  const provinces = useMemo(() => {
    return Array.from(new Set(wilayahList.map((w) => w.Provinsi).filter(Boolean))).sort();
  }, [wilayahList]);

  // Filtered Kabupaten untuk Autocomplete (pencarian lintas provinsi saat mengetik)
  const filteredKabupatenList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return wilayahList
      .filter((w) => {
        const name = (w.Kabupaten_Kota || w.wilayah || "").toLowerCase();
        const prov = (w.Provinsi || "").toLowerCase();
        if (q) {
          return name.includes(q) || prov.includes(q);
        }
        return !selectedProvinsi || w.Provinsi === selectedProvinsi;
      })
      .sort((a, b) => {
        const aName = (a.Kabupaten_Kota || "").toLowerCase();
        const bName = (b.Kabupaten_Kota || "").toLowerCase();
        if (!q) return aName.localeCompare(bName);
        const aStripped = aName.replace(/^(kabupaten|kota)\s+/i, "");
        const bStripped = bName.replace(/^(kabupaten|kota)\s+/i, "");
        if (aStripped === q && bStripped !== q) return -1;
        if (bStripped === q && aStripped !== q) return 1;
        const aStarts = aStripped.startsWith(q) || aName.startsWith(q);
        const bStarts = bStripped.startsWith(q) || bName.startsWith(q);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return aName.localeCompare(bName);
      });
  }, [wilayahList, selectedProvinsi, searchQuery]);

  // ---------------------------------------------------------------------------
  // KALKULASI PPH RIIL (FORMULA STANDAR BAPANAS / WNPG)
  // ---------------------------------------------------------------------------
  const pphAnalysis = useMemo(() => {
    if (!activeWilayah) return { totalScore: 82.4, rating: "Baik", breakdown: [] };

    let totalScore = 0;
    const breakdown = Object.entries(PPH_CONFIG).map(([key, cfg]) => {
      const konsumsi = Number(activeWilayah[key]) || 0;
      const target = cfg.target;
      const capaianPct = Math.round((konsumsi / target) * 100);

      // Skor PPH dibatasi oleh maxScore
      const skorKelompok = Math.min(cfg.maxScore, (konsumsi / target) * cfg.maxScore);
      totalScore += skorKelompok;

      let status = "Memenuhi";
      let statusColor = "#065F46";
      let statusBg = "#ECFDF5";
      let barColor = "#10B981";

      if (capaianPct > 115) {
        status = "Di Atas Standar";
        statusColor = "#B45309";
        statusBg = "#FFFBEB";
        barColor = "#F59E0B";
      } else if (capaianPct < 85) {
        status = "Di Bawah Standar";
        statusColor = "#991B1B";
        statusBg = "#FEF2F2";
        barColor = "#EF4444";
      }

      return {
        key,
        nama: cfg.nama,
        konsumsi: Math.round(konsumsi),
        standar: target,
        capaianPct,
        skorKelompok: Number(skorKelompok.toFixed(1)),
        maxScore: cfg.maxScore,
        dotColor: cfg.dotColor,
        status,
        statusColor,
        statusBg,
        barColor,
      };
    });

    const roundedTotal = Number(totalScore.toFixed(1));
    let rating = "Sangat Baik";
    if (roundedTotal < 70) rating = "Kurang";
    else if (roundedTotal < 80) rating = "Cukup";
    else if (roundedTotal < 90) rating = "Baik";

    return { totalScore: roundedTotal, rating, breakdown };
  }, [activeWilayah]);

  const bapanasRecs = useMemo(() => {
    return generateBapanasRecommendations(activeWilayah);
  }, [activeWilayah]);

  // ---------------------------------------------------------------------------
  // KOMODITAS RIIL DAERAH (DISORTIR & DIFILTER SECARA DINAMIS)
  // ---------------------------------------------------------------------------
  const parsedCommodities = useMemo(() => {
    if (!rawKomoditas) {
      // Default jika belum selesai load
      return [];
    }

    const list = [];
    Object.entries(KOMODITAS_META).forEach(([id, meta]) => {
      const gram = Number(rawKomoditas[id]) || 0;
      list.push({
        id,
        label: meta.label,
        gram: Number(gram.toFixed(1)),
        group: meta.group,
        category: meta.category,
        icon: meta.icon,
        color: meta.color,
        bg: meta.bg,
      });
    });

    // Urutkan berdasarkan konsumsi tertinggi
    return list.sort((a, b) => b.gram - a.gram);
  }, [rawKomoditas]);

  // Komoditas yang ditampilkan setelah filter cross-table & category
  const visibleCommodities = useMemo(() => {
    let list = parsedCommodities;

    // Filter 1: Dari klik tabel kelompok pangan (cross-filter)
    if (selectedFoodGroupFilter) {
      list = list.filter((c) => c.group === selectedFoodGroupFilter);
    }

    // Filter 2: Dari tombol kategori
    if (commodityCategoryFilter !== "Semua") {
      list = list.filter((c) => c.category === commodityCategoryFilter);
    }

    // Mode tampilan 6 teratas vs semua
    if (commodityViewMode === "top6" && !selectedFoodGroupFilter && commodityCategoryFilter === "Semua") {
      return list.slice(0, 6);
    }

    return list;
  }, [parsedCommodities, selectedFoodGroupFilter, commodityCategoryFilter, commodityViewMode]);

  // ---------------------------------------------------------------------------
  // 5 WILAYAH PALING MIRIP (DISTANCE EUCLIDEAN DINAMIS)
  // ---------------------------------------------------------------------------
  const nearestNeighbors = useMemo(() => {
    if (!wilayahList.length || !activeWilayah) return [];

    const feats = Object.keys(PPH_CONFIG);
    const targetVec = feats.map((f) => Number(activeWilayah[f]) || 0);

    return wilayahList
      .filter((w) => {
        const name = w.Kabupaten_Kota || w.wilayah || "";
        const actName = activeWilayah.Kabupaten_Kota || activeWilayah.wilayah || "";
        return name.toLowerCase() !== actName.toLowerCase();
      })
      .map((w) => {
        let sumSq = 0;
        feats.forEach((f, idx) => {
          const diff = (Number(w[f]) || 0) - targetVec[idx];
          sumSq += diff * diff;
        });
        const dist = Math.sqrt(sumSq);
        const sim = Math.max(70, Math.min(99, Math.round(100 - dist * 0.15)));
        return {
          raw: w,
          name: w.Kabupaten_Kota || w.wilayah,
          prov: w.Provinsi,
          cluster: w.cluster,
          dist: Number(dist.toFixed(2)),
          score: sim,
        };
      })
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 5);
  }, [wilayahList, activeWilayah]);

  const clusterId = Number(activeWilayah?.Cluster ?? activeWilayah?.cluster ?? 0) % 4;
  const clusterMeta = CLUSTER_CONFIG[clusterId] || CLUSTER_CONFIG[0];
  const probMax = Number(activeWilayah?.Prob_Max ?? activeWilayah?.prob_max ?? 1);
  const isTransition = probMax < 0.7;
  const keyakinanLabel =
    probMax >= 0.9 ? "Sangat Tinggi" : probMax >= 0.75 ? "Tinggi" : probMax >= 0.7 ? "Sedang" : "Campuran";
  const regionComposition = [0, 1, 2, 3]
    .map((cid) => ({
      id: cid,
      pct: Number(activeWilayah?.[`prob_${cid}`] ?? (cid === clusterId ? probMax * 100 : 0)),
      cfg: CLUSTER_CONFIG[cid],
    }))
    .sort((a, b) => b.pct - a.pct);

  // Handler Pilih Wilayah
  const handleSelectWilayah = (w) => {
    if (!w) return;
    const name = w.Kabupaten_Kota || w.wilayah;
    setSelectedKode(w.Kode_Wilayah);
    setSelectedKabupaten(name);
    setSelectedProvinsi(w.Provinsi);
    setSearchQuery("");
    setIsDropdownOpen(false);
    setSelectedFoodGroupFilter(null); // reset cross filter
  };

  return (
    <div style={{ padding: "8px 24px 40px", display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Divider & Section Header Jelajah Wilayah */}
      <div
        style={{
          borderTop: "1px solid #DDE7E0",
          paddingTop: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        {/* Breadcrumb Interaktif */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
          <span
            style={{ color: "#4B6354", cursor: "pointer", fontWeight: 600 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            Nasional (Peta PCA)
          </span>
          <ChevronRight size={13} color="#9DB2A5" />
          <span
            style={{ color: "#4B6354", cursor: "pointer", fontWeight: 600 }}
            onClick={() => {
              setSearchQuery("");
              setIsDropdownOpen(true);
            }}
          >
            {activeWilayah.Provinsi || "Provinsi"}
          </span>
          <ChevronRight size={13} color="#9DB2A5" />
          <span
            style={{
              background: "#ECFDF5",
              border: "1px solid rgba(167, 243, 208, 0.7)",
              borderRadius: 6,
              padding: "2px 8px",
              color: "#0F5238",
              fontWeight: 700,
            }}
          >
            {activeWilayah.Kabupaten_Kota || "Kabupaten"}
          </span>
        </div>

        {/* Status BAPANAS & Tombol Cetak / Unduh Profil */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              background: "#ECFDF5",
              border: "1px solid rgba(167, 243, 208, 0.7)",
              borderRadius: 9999,
              padding: "4px 12px",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              fontWeight: 700,
              color: "#064E3B",
            }}
          >
            <span style={{ width: 6, height: 6, background: "#DC2626", borderRadius: 9999 }} />
            Basis BAPANAS 2025 (PPH 2100 kkal)
          </div>


        </div>
      </div>

      {/* =========================================================================
          2-COLUMN ANALYTICAL LAYOUT
      ========================================================================= */}
      <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: 16, alignItems: "start" }}>
        {/* -----------------------------------------------------------------------
            LEFT COLUMN: SELECTOR, ACTIVE PROFILE & 5 NEAREST NEIGHBORS
        ----------------------------------------------------------------------- */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Card 1: Interactive Search & Autocomplete Selector */}
          <div
            style={{
              background: "linear-gradient(135deg, #FFFFFF 0%, rgba(236, 253, 245, 0.3) 100%)",
              border: "1px solid rgba(6, 78, 59, 0.12)",
              borderRadius: 12,
              padding: "16px",
              boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.04)",
              position: "relative",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Compass size={16} color="#006C48" />
                <span style={{ fontSize: 14, fontWeight: 700, color: "#0F5238" }}>
                  Pilih Wilayah Pantauan
                </span>
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#065F46",
                  background: "#D1FAE5",
                  border: "1px solid #A7F3D0",
                  borderRadius: 9999,
                  padding: "2px 8px",
                }}
              >
                Aktif
              </span>
            </div>

            {/* Filter Provinsi */}
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#4A6354", marginBottom: 3, letterSpacing: 0.3 }}>
                PROVINSI
              </label>
              <select
                value={selectedProvinsi}
                onChange={(e) => {
                  const newProv = e.target.value;
                  setSelectedProvinsi(newProv);
                  setSearchQuery("");
                  const inProv = wilayahList.find((w) => w.Provinsi === newProv);
                  if (inProv) handleSelectWilayah(inProv);
                }}
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  borderRadius: 8,
                  border: "1px solid #CADED2",
                  background: "#FFFFFF",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#191C1C",
                  outline: "none",
                }}
              >
                {provinces.map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input dengan Autocomplete Bebas Truncate */}
            <div style={{ position: "relative" }}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#4A6354", marginBottom: 3, letterSpacing: 0.3 }}>
                KABUPATEN / KOTA
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  value={isDropdownOpen ? searchQuery : (activeWilayah.Kabupaten_Kota || "")}
                  onFocus={() => {
                    setIsDropdownOpen(true);
                    setSearchQuery("");
                  }}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ketik untuk mencari kabupaten/kota..."
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "7px 30px 7px 10px",
                    borderRadius: 8,
                    border: "1px solid #16A34A",
                    background: "#FFFFFF",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#0F5238",
                    outline: "none",
                  }}
                />
                <Search size={14} color="#16A34A" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)" }} />
              </div>

              {/* Floating Autocomplete Dropdown List */}
              {isDropdownOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    maxHeight: 220,
                    overflowY: "auto",
                    background: "#FFFFFF",
                    border: "1px solid #CFE3D6",
                    borderRadius: 8,
                    marginTop: 4,
                    boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
                    zIndex: 50,
                  }}
                >
                  {filteredKabupatenList.length > 0 ? (
                    filteredKabupatenList.map((w) => {
                      const name = w.Kabupaten_Kota || w.wilayah;
                      const isSel = name === activeWilayah.Kabupaten_Kota;
                      return (
                        <div
                          key={name}
                          onClick={() => handleSelectWilayah(w)}
                          style={{
                            padding: "8px 12px",
                            cursor: "pointer",
                            borderBottom: "1px solid #F1F5F2",
                            background: isSel ? "#ECFDF5" : "#FFFFFF",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#F4FAF6")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = isSel ? "#ECFDF5" : "#FFFFFF")}
                        >
                          <div>
                            <div style={{ fontSize: 12, fontWeight: isSel ? 800 : 600, color: isSel ? "#065F46" : "#191C1C" }}>
                              {name}
                            </div>
                            <div style={{ fontSize: 10, color: "#64748B" }}>{w.Provinsi}</div>
                          </div>
                          <span style={{ fontSize: 10, fontWeight: 700, background: "#E2ECE6", color: "#1C553D", padding: "1px 6px", borderRadius: 4 }}>
                            Tipe {w.cluster}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ padding: "12px", fontSize: 11, color: "#991B1B", textAlign: "center" }}>
                      Tidak ditemukan wilayah dengan kata kunci "{searchQuery}".
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Active Territory Profile Card (Bold Bapanas Deep Green) */}
          <div
            style={{
              background: "linear-gradient(135deg, #166520 0%, #134E18 100%)",
              border: "none",
              borderRadius: 16,
              padding: "18px 20px",
              boxShadow: "0 10px 24px rgba(19, 78, 24, 0.18)",
              color: "#FFFFFF",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {/* Header: Title + Badge */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
              <div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                  <h1 style={{ fontSize: 19, fontWeight: 800, color: "#FFFFFF", margin: 0 }}>
                    {activeWilayah.Kabupaten_Kota || "Kabupaten"}
                  </h1>
                  <span style={{ fontSize: 12, color: "#D1FAE5", fontWeight: 500 }}>
                    {activeWilayah.Provinsi}
                  </span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#EAF5EC", marginTop: 4 }}>
                  {clusterMeta.name}: {clusterMeta.sub}
                </div>
              </div>

              {/* Cluster + Pola Status Badges */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                <span
                  style={{
                    background: "#E5B324",
                    borderRadius: 9999,
                    padding: "4px 12px",
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#134E18",
                    whiteSpace: "nowrap",
                  }}
                >
                  Tipe {clusterId}
                </span>
                {isTransition && (
                  <span
                    style={{
                      background: "rgba(255, 255, 255, 0.16)",
                      borderRadius: 9999,
                      padding: "4px 10px",
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: "#FDE68A",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Pola Campuran
                  </span>
                )}
              </div>
            </div>

            {/* Komposisi Kecenderungan 4 Tipe Pola Pangan */}
            <div
              style={{
                background: "#FFFFFF",
                border: "none",
                borderRadius: 12,
                padding: "11px 14px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#134E18" }}>
                  Komposisi Kecenderungan Pola Pangan
                </span>
                <span style={{ fontSize: 10, color: "#546E60", fontWeight: 600 }}>Total 100%</span>
              </div>
              <div style={{ display: "flex", height: 8, borderRadius: 9999, overflow: "hidden", background: "#E5E7EB", gap: 1 }}>
                {regionComposition
                  .filter((item) => item.pct > 0.5)
                  .map((item) => (
                    <div
                      key={item.id}
                      title={`Tipe ${item.id} (${item.cfg.short}): ${item.pct.toFixed(1)}%`}
                      style={{
                        width: `${item.pct}%`,
                        height: "100%",
                        background: item.cfg.color,
                      }}
                    />
                  ))}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px", marginTop: 7 }}>
                {regionComposition
                  .filter((item) => item.pct >= 1)
                  .map((item) => (
                    <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10.5 }}>
                      <span style={{ width: 7, height: 7, borderRadius: 9999, background: item.cfg.color }} />
                      <span style={{ fontWeight: 700, color: "#143224" }}>{item.pct.toFixed(1)}%</span>
                      <span style={{ color: "#546E60" }}>Tipe {item.id} ({item.cfg.short})</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Card 3: 5 Wilayah Paling Mirip (FR-06) dengan Tombol Bandingkan */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid rgba(6, 78, 59, 0.1)",
              borderRadius: 12,
              padding: "16px",
              boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.03)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Sparkles size={16} color="#006C48" />
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#191C1C", margin: 0 }}>
                  5 Wilayah Paling Mirip
                </h3>
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#065F46",
                  background: "#ECFDF5",
                  border: "1px solid rgba(167, 243, 208, 0.6)",
                  borderRadius: 4,
                  padding: "2px 6px",
                }}
              >
                Tingkat Kemiripan Profil
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {nearestNeighbors.map((nb, i) => (
                <div
                  key={nb.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "1px solid #EDF3EF",
                    background: "#FAFCFA",
                    transition: "all 0.15s",
                  }}
                >
                  {/* Left: Rank + Name + Prov (Click to switch) */}
                  <div
                    onClick={() => handleSelectWilayah(nb.raw)}
                    style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", flex: 1 }}
                  >
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 9999,
                        background: "#D1FAE5",
                        border: "1px solid #A7F3D0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#064E3B",
                      }}
                    >
                      {i + 1}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#191C1C" }}>
                        {nb.name}
                      </div>
                      <div style={{ fontSize: 10, color: "#546E60" }}>
                        {nb.prov}
                      </div>
                    </div>
                  </div>

                  {/* Right: Progress bar + Compare Button */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 50, height: 5, background: "#E5EFE9", borderRadius: 9999, overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${nb.score}%`,
                          height: "100%",
                          background: "#10B981",
                          borderRadius: 9999,
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#064E3B", width: 28, textAlign: "right" }}>
                      {nb.score}%
                    </span>

                    {/* Tombol Bandingkan Berdampingan */}
                    <button
                      type="button"
                      title="Bandingkan berdampingan dengan wilayah ini"
                      onClick={() => setCompareRegion(nb.raw)}
                      style={{
                        background: "#F1F5F3",
                        border: "1px solid #D1E5D8",
                        borderRadius: 4,
                        padding: "3px 6px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 3,
                        fontSize: 10,
                        fontWeight: 600,
                        color: "#065F46",
                      }}
                    >
                      <ArrowLeftRight size={11} />
                      Bandingkan
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* -----------------------------------------------------------------------
            RIGHT COLUMN: PPH BENCHMARK TABLE & KEY COMMODITIES (FR-05)
        ----------------------------------------------------------------------- */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Card 1: Benchmark Table with Live PPH Score & View Toggle */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid rgba(6, 78, 59, 0.1)",
              borderRadius: 12,
              padding: "16px 20px",
              boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.03)",
            }}
          >
            {/* Table Header with Dynamic PPH Score Badge */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 8, height: 8, background: "#DC2626", borderRadius: 9999 }} />
                <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0F5238", margin: 0 }}>
                  Komparasi 8 Kelompok Pangan vs Standar PPH
                </h2>
              </div>

              {/* PPH Score Badge (Clickable for Detail Breakdown) */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ display: "flex", background: "#F1F5F3", borderRadius: 6, padding: 2 }}>
                  <button
                    type="button"
                    onClick={() => setBenchmarkView("table")}
                    style={{
                      border: "none",
                      background: benchmarkView === "table" ? "#FFFFFF" : "transparent",
                      borderRadius: 4,
                      padding: "3px 8px",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      color: benchmarkView === "table" ? "#065F46" : "#64748B",
                      boxShadow: benchmarkView === "table" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                    }}
                  >
                    <TableIcon size={12} />
                    Tabel
                  </button>
                  <button
                    type="button"
                    onClick={() => setBenchmarkView("chart")}
                    style={{
                      border: "none",
                      background: benchmarkView === "chart" ? "#FFFFFF" : "transparent",
                      borderRadius: 4,
                      padding: "3px 8px",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      color: benchmarkView === "chart" ? "#065F46" : "#64748B",
                      boxShadow: benchmarkView === "chart" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                    }}
                  >
                    <BarChart2 size={12} />
                    Grafik
                  </button>
                </div>

                <div
                  onClick={() => setShowPphBreakdown(true)}
                  title="Klik untuk melihat rincian kalkulasi skor PPH"
                  style={{
                    background: "#ECFDF5",
                    border: "1px solid rgba(167, 243, 208, 0.7)",
                    borderRadius: 9999,
                    padding: "4px 12px",
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#064E3B",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <span>Nilai PPH: {pphAnalysis.totalScore}</span>
                  <span style={{ fontSize: 10, color: "#047857", fontWeight: 600 }}>({pphAnalysis.rating})</span>
                </div>
              </div>
            </div>

            {/* Cross-Filter Hint Banner */}
            {selectedFoodGroupFilter && (
              <div
                style={{
                  background: "#EEF9EE",
                  border: "1px solid #BBF7D0",
                  borderRadius: 6,
                  padding: "5px 10px",
                  fontSize: 11,
                  color: "#166534",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <span>Filter aktif kelompok pangan: <strong>{PPH_CONFIG[selectedFoodGroupFilter]?.nama}</strong></span>
                <span
                  onClick={() => setSelectedFoodGroupFilter(null)}
                  style={{ cursor: "pointer", textDecoration: "underline", fontWeight: 700 }}
                >
                  Tampilkan Semua Komoditas
                </span>
              </div>
            )}

            {/* TABEL VIEW ATAU GRAFIK BAR VIEW */}
            {benchmarkView === "table" ? (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #E2EEE6", color: "#4A6354", fontSize: 11, textAlign: "left" }}>
                      <th style={{ padding: "8px 6px", fontWeight: 600 }}>Kelompok Pangan (Klik Filter)</th>
                      <th style={{ padding: "8px 6px", fontWeight: 600 }}>Konsumsi</th>
                      <th style={{ padding: "8px 6px", fontWeight: 600 }}>Standar</th>
                      <th style={{ padding: "8px 6px", fontWeight: 600, width: 130 }}>Capaian</th>
                      <th style={{ padding: "8px 6px", fontWeight: 600, textAlign: "right" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pphAnalysis.breakdown.map((row) => {
                      const isRowSelected = selectedFoodGroupFilter === row.key;
                      return (
                        <tr
                          key={row.key}
                          onClick={() => {
                            // Toggle cross-filter
                            setSelectedFoodGroupFilter(isRowSelected ? null : row.key);
                          }}
                          style={{
                            borderBottom: "1px solid #F2F7F4",
                            background: isRowSelected ? "#EFFCF5" : "transparent",
                            cursor: "pointer",
                            transition: "background 0.15s",
                          }}
                          onMouseEnter={(e) => {
                            if (!isRowSelected) e.currentTarget.style.background = "#F9FBF9";
                          }}
                          onMouseLeave={(e) => {
                            if (!isRowSelected) e.currentTarget.style.background = "transparent";
                          }}
                        >
                          <td style={{ padding: "9px 6px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ width: 6, height: 6, background: row.dotColor, borderRadius: 9999 }} />
                              <span style={{ fontWeight: isRowSelected ? 800 : 600, color: isRowSelected ? "#065F46" : "#191C1C" }}>
                                {row.nama}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: "9px 6px", fontWeight: 700, color: "#143224" }}>
                            {row.konsumsi} g
                          </td>
                          <td style={{ padding: "9px 6px", color: "#546E60" }}>
                            {row.standar} g
                          </td>
                          <td style={{ padding: "9px 6px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ width: 75, height: 6, background: "#EAEFEA", borderRadius: 9999, overflow: "hidden" }}>
                                <div
                                  style={{
                                    width: `${Math.min(100, row.capaianPct)}%`,
                                    height: "100%",
                                    background: row.barColor,
                                    borderRadius: 9999,
                                  }}
                                />
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 700, color: "#143224" }}>
                                {row.capaianPct}%
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: "9px 6px", textAlign: "right" }}>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                background: row.statusBg,
                                color: row.statusColor,
                                border: `1px solid ${row.statusColor}33`,
                                borderRadius: 4,
                                padding: "2px 8px",
                              }}
                            >
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Grafik Horizontal Bars View */
              <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "8px 0" }}>
                {pphAnalysis.breakdown.map((row) => (
                  <div key={row.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 130, fontSize: 11, fontWeight: 600, color: "#191C1C", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {row.nama}
                    </div>
                    <div style={{ flex: 1, position: "relative", height: 16, background: "#F1F5F2", borderRadius: 4, overflow: "hidden" }}>
                      {/* Target 100% Marker Line */}
                      <div style={{ position: "absolute", left: "75%", top: 0, bottom: 0, width: 2, background: "#94A3B8", zIndex: 2 }} />
                      <div
                        style={{
                          width: `${Math.min(100, (row.capaianPct / 130) * 100)}%`,
                          height: "100%",
                          background: row.barColor,
                          borderRadius: 4,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          paddingRight: 6,
                          color: "#FFFFFF",
                          fontSize: 9,
                          fontWeight: 700,
                        }}
                      >
                        {row.konsumsi}g
                      </div>
                    </div>
                    <div style={{ width: 50, fontSize: 11, fontWeight: 700, color: "#143224", textAlign: "right" }}>
                      {row.capaianPct}%
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Harmonized Legend / Note */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 12,
                paddingTop: 10,
                borderTop: "1px solid #EDF4F0",
                fontSize: 11,
                color: "#546E60",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 6, height: 6, background: "#10B981", borderRadius: 9999 }} />
                  Memenuhi Standar
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 6, height: 6, background: "#F59E0B", borderRadius: 9999 }} />
                  Di Atas Standar
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 6, height: 6, background: "#EF4444", borderRadius: 9999 }} />
                  Di Bawah Standar
                </span>
              </div>
              <div style={{ fontStyle: "italic", color: "#3B614E" }}>
                Standar Pola Pangan Harapan (PPH) 2025
              </div>
            </div>
          </div>

          {/* Card 1B: Rekomendasi Kebijakan Bapanas & Pemerintah Daerah */}
          <div
            style={{
              background: "#FFFFFF",
              border: "none",
              borderRadius: 14,
              padding: "16px 20px",
              boxShadow: "0 2px 10px rgba(19, 78, 24, 0.06)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Sparkles size={16} color="#134E18" />
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#134E18", margin: 0 }}>
                  Rekomendasi Tindakan Bapanas &amp; Pemda
                </h3>
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  background: bapanasRecs.deficits.length > 0 ? "#DC2626" : "#134E18",
                  color: "#FFFFFF",
                  padding: "3px 10px",
                  borderRadius: 9999,
                }}
              >
                {bapanasRecs.deficits.length > 0
                  ? `${bapanasRecs.deficits.length} Perlu Diperhatikan`
                  : "Aman / Seimbang"}
              </span>
            </div>

            {bapanasRecs.allBalanced ? (
              <div
                style={{
                  background: "#F4F8F5",
                  borderLeft: "5px solid #134E18",
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontSize: 11.5,
                  color: "#134E18",
                  fontWeight: 600,
                  lineHeight: "17px",
                }}
              >
                Seluruh 8 kelompok pangan di wilayah ini sudah aman dan sesuai standar PPH.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {bapanasRecs.deficits.map((rec) => (
                  <div
                    key={`def-${rec.key}`}
                    style={{
                      background: "#F9FAFB",
                      borderLeft: "5px solid #DC2626",
                      borderRadius: 8,
                      padding: "10px 14px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: "#991B1B" }}>
                        {rec.nama} ({rec.konsumsi} g vs {rec.target} g)
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 800, background: "#DC2626", color: "#FFFFFF", padding: "2px 9px", borderRadius: 9999 }}>
                        Perlu Diperhatikan
                      </span>
                    </div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: "#143224", marginBottom: 2 }}>
                      {rec.title}
                    </div>
                    <div style={{ fontSize: 11, color: "#374151", lineHeight: "16px" }}>
                      {rec.action}
                    </div>
                  </div>
                ))}

                {bapanasRecs.surpluses.slice(0, 2).map((rec) => (
                  <div
                    key={`sur-${rec.key}`}
                    style={{
                      background: "#F9FAFB",
                      borderLeft: "5px solid #2563EB",
                      borderRadius: 8,
                      padding: "10px 14px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: "#1E40AF" }}>
                        {rec.nama} ({rec.konsumsi} g vs {rec.target} g)
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 800, background: "#2563EB", color: "#FFFFFF", padding: "2px 9px", borderRadius: 9999 }}>
                        Melebihi Standar
                      </span>
                    </div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: "#143224", marginBottom: 2 }}>
                      {rec.title}
                    </div>
                    <div style={{ fontSize: 11, color: "#374151", lineHeight: "16px" }}>
                      {rec.action}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card 2: Komoditas Utama Penyusun (Warna Status Bapanas: Merah/Kuning/Hijau) */}
          <div
            style={{
              background: "#FFFFFF",
              border: "none",
              borderRadius: 14,
              padding: "16px 20px",
              boxShadow: "0 2px 10px rgba(19, 78, 24, 0.06)",
            }}
          >
            {/* Header dengan Kontrol Interaktif */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Wheat size={16} color="#006C48" />
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0F5238", margin: 0 }}>
                  Komoditas Utama Penyusun
                </h3>
              </div>

              {/* View Mode Toggle: 6 Teratas vs Semua 26 */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button
                  type="button"
                  onClick={() => setCommodityViewMode(commodityViewMode === "top6" ? "all" : "top6")}
                  style={{
                    background: "#ECFDF5",
                    border: "1px solid rgba(167, 243, 208, 0.7)",
                    borderRadius: 9999,
                    padding: "3px 10px",
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#065F46",
                    cursor: "pointer",
                  }}
                >
                  {commodityViewMode === "top6" ? "Tampilkan Semua 26 Komoditas" : "Tampilkan 6 Teratas"}
                </button>
              </div>
            </div>

            {/* Kategori Filter Tabs */}
            <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 6, marginBottom: 10 }}>
              {["Semua", "Padi & Umbi", "Hewani", "Sayur & Buah", "Minyak & Biji", "Kacang-kacangan", "Gula"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setCommodityCategoryFilter(cat);
                    setSelectedFoodGroupFilter(null);
                  }}
                  style={{
                    padding: "3px 8px",
                    borderRadius: 6,
                    fontSize: 10,
                    fontWeight: 600,
                    border: "none",
                    cursor: "pointer",
                    background: commodityCategoryFilter === cat && !selectedFoodGroupFilter ? "#1B4D36" : "#F1F5F3",
                    color: commodityCategoryFilter === cat && !selectedFoodGroupFilter ? "#FFFFFF" : "#4A6354",
                    whiteSpace: "nowrap",
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Keterangan Warna Status */}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 14px", marginBottom: 10, fontSize: 10.5, color: "#4B5563" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: 9999, background: "#134E18" }} />
                Memenuhi Standar
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: 9999, background: "#2563EB" }} />
                Melebihi Standar (Overachieve)
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: 9999, background: "#DC2626" }} />
                Di Bawah Standar
              </span>
              <span style={{ color: "#6B7280", fontStyle: "italic" }}>
                (status mengacu pada kelompok pangan induknya)
              </span>
            </div>

            {/* Komoditas Grid Riil Dinamis (Tegas: Merah / Biru / Hijau Bapanas, tanpa border tipis) */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(195px, 1fr))", gap: 10 }}>
              {visibleCommodities.length > 0 ? (
                visibleCommodities.map((item) => {
                  const groupInfo = pphAnalysis.breakdown.find((b) => b.key === item.group);
                  const status = groupInfo?.status || "Memenuhi";
                  const theme =
                    status === "Di Bawah Standar"
                      ? { bg: "#F9FAFB", bar: "#DC2626", pillBg: "#DC2626", pillText: "#FFFFFF" }
                      : status === "Di Atas Standar"
                        ? { bg: "#F9FAFB", bar: "#2563EB", pillBg: "#2563EB", pillText: "#FFFFFF" }
                        : { bg: "#F4F8F5", bar: "#134E18", pillBg: "#134E18", pillText: "#FFFFFF" };

                  return (
                    <div
                      key={item.id}
                      style={{
                        background: theme.bg,
                        border: "none",
                        borderLeft: `4px solid ${theme.bar}`,
                        borderRadius: 8,
                        padding: "9px 11px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 11.5, fontWeight: 700, color: "#143224", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {item.label}
                        </div>
                        <div style={{ fontSize: 9.5, color: "#546E60" }}>{item.category}</div>
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: theme.pillText,
                          background: theme.pillBg,
                          border: "none",
                          borderRadius: 6,
                          padding: "3px 8px",
                          whiteSpace: "nowrap",
                          marginLeft: 6,
                        }}
                      >
                        {item.gram} g
                      </span>
                    </div>
                  );
                })
              ) : (
                <div style={{ gridColumn: "1 / -1", padding: "16px", textAlign: "center", fontSize: 11, color: "#64748B" }}>
                  Tidak ada komoditas pada kategori yang dipilih.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODAL: RINCIAN SKOR PPH BAPANAS
      ========================================================================= */}
      {showPphBreakdown && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 14,
              padding: "20px 24px",
              width: "90%",
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#143224", margin: 0 }}>
                  Rincian Skor PPH: {activeWilayah.Kabupaten_Kota}
                </h3>
                <span style={{ fontSize: 11, color: "#546E60" }}>
                  Total Skor PPH Aktual: <strong>{pphAnalysis.totalScore} / 100</strong> ({pphAnalysis.rating})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowPphBreakdown(false)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748B" }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ maxHeight: 320, overflowY: "auto" }}>
              <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #E2EEE6", color: "#4A6354", fontSize: 11, textAlign: "left" }}>
                    <th style={{ padding: "6px" }}>Kelompok Pangan</th>
                    <th style={{ padding: "6px" }}>Konsumsi</th>
                    <th style={{ padding: "6px" }}>Target</th>
                    <th style={{ padding: "6px" }}>Skor Didapat</th>
                    <th style={{ padding: "6px", textAlign: "right" }}>Maksimal</th>
                  </tr>
                </thead>
                <tbody>
                  {pphAnalysis.breakdown.map((b) => (
                    <tr key={b.key} style={{ borderBottom: "1px solid #F1F5F2" }}>
                      <td style={{ padding: "6px", fontWeight: 600 }}>{b.nama}</td>
                      <td style={{ padding: "6px" }}>{b.konsumsi} g</td>
                      <td style={{ padding: "6px" }}>{b.standar} g</td>
                      <td style={{ padding: "6px", fontWeight: 800, color: "#065F46" }}>{b.skorKelompok}</td>
                      <td style={{ padding: "6px", textAlign: "right", color: "#64748B" }}>{b.maxScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 14, paddingTop: 10, borderTop: "1px solid #E2EEE6", display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setShowPphBreakdown(false)}
                style={{
                  background: "#064E3B",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 6,
                  padding: "6px 16px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: KOMPARASI BERDAMPINGAN DUA WILAYAH (SIDE-BY-SIDE)
      ========================================================================= */}
      {compareRegion && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 14,
              padding: "20px 24px",
              width: "90%",
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ArrowLeftRight size={18} color="#006C48" />
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#143224", margin: 0 }}>
                  Komparasi Pola Konsumsi Berdampingan
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCompareRegion(null)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748B" }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
              {/* Box Wilayah 1 */}
              <div style={{ background: "#EFF9F3", border: "1px solid #BBF7D0", borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#15803D" }}>WILAYAH UTAMA</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#143224" }}>{activeWilayah.Kabupaten_Kota}</div>
                <div style={{ fontSize: 11, color: "#546E60" }}>{activeWilayah.Provinsi} • Tipe {clusterId}</div>
              </div>

              {/* Box Wilayah 2 */}
              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#64748B" }}>WILAYAH PEMBANDING</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#143224" }}>{compareRegion.Kabupaten_Kota || compareRegion.wilayah}</div>
                <div style={{ fontSize: 11, color: "#546E60" }}>{compareRegion.Provinsi} • Tipe {compareRegion.cluster}</div>
              </div>
            </div>

            <div style={{ maxHeight: 280, overflowY: "auto" }}>
              <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #E2EEE6", color: "#4A6354", fontSize: 11, textAlign: "left" }}>
                    <th style={{ padding: "6px" }}>Kelompok Pangan</th>
                    <th style={{ padding: "6px", textAlign: "right" }}>{activeWilayah.Kabupaten_Kota}</th>
                    <th style={{ padding: "6px", textAlign: "right" }}>{compareRegion.Kabupaten_Kota || compareRegion.wilayah}</th>
                    <th style={{ padding: "6px", textAlign: "right" }}>Selisih</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(PPH_CONFIG).map(([key, cfg]) => {
                    const val1 = Math.round(Number(activeWilayah[key]) || 0);
                    const val2 = Math.round(Number(compareRegion[key]) || 0);
                    const diff = val1 - val2;
                    return (
                      <tr key={key} style={{ borderBottom: "1px solid #F1F5F2" }}>
                        <td style={{ padding: "6px", fontWeight: 600 }}>{cfg.nama}</td>
                        <td style={{ padding: "6px", textAlign: "right", fontWeight: 700, color: "#065F46" }}>{val1} g</td>
                        <td style={{ padding: "6px", textAlign: "right", fontWeight: 700, color: "#1E293B" }}>{val2} g</td>
                        <td style={{ padding: "6px", textAlign: "right", fontWeight: 700, color: diff > 0 ? "#16A34A" : (diff < 0 ? "#DC2626" : "#64748B") }}>
                          {diff > 0 ? `+${diff}` : diff} g
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 14, paddingTop: 10, borderTop: "1px solid #E2EEE6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                type="button"
                onClick={() => {
                  handleSelectWilayah(compareRegion);
                  setCompareRegion(null);
                }}
                style={{
                  background: "#ECFDF5",
                  border: "1px solid #A7F3D0",
                  color: "#065F46",
                  borderRadius: 6,
                  padding: "6px 14px",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Pindah ke Wilayah Ini →
              </button>

              <button
                type="button"
                onClick={() => setCompareRegion(null)}
                style={{
                  background: "#064E3B",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 6,
                  padding: "6px 16px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      
    </div>
  );
}
