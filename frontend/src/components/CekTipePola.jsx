/**
 * CekTipePola.jsx — konsupa.id
 * Simulasi Penentuan Tipe Pola Konsumsi Pangan untuk Stakeholder Bapanas:
 * - Form input 8 kelompok pangan disajikan dalam bentuk Pop-up (Modal)
 * - Setelah submit, pop-up menutup dan menampilkan hasil tipe pola konsumsi
 * - Bahasa non-teknis yang mudah dipahami pemangku kebijakan pangan
 */

import { useState, useMemo } from "react";
import {
  SlidersHorizontal,
  Wand2,
  RotateCcw,
  Trash2,
  Search,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  X,
} from "lucide-react";
import { predictCluster } from "../api.js";
import { CLUSTER_CONFIG } from "../clusterConfig.js";
import { generateBapanasRecommendations } from "../pphRecommendations.js";

const FITUR_DEFAULT = [
  { id: "padi-padian", num: 1, name: "Padi-padian", med: 275, minReal: 41, maxReal: 450, defVal: "290", maxVal: 2000 },
  { id: "umbi-umbian", num: 2, name: "Umbi-umbian", med: 100, minReal: 3, maxReal: 1202, defVal: "30", maxVal: 2000 },
  { id: "pangan hewani", num: 3, name: "Pangan Hewani", med: 150, minReal: 41, maxReal: 247, defVal: "140", maxVal: 2000 },
  { id: "minyak dan lemak", num: 4, name: "Minyak & Lemak", med: 20, minReal: 10, maxReal: 50, defVal: "40", maxVal: 1000 },
  { id: "buah/biji berminyak", num: 5, name: "Buah/Biji Berminyak", med: 10, minReal: 0, maxReal: 27, defVal: "10", maxVal: 500 },
  { id: "kacang-kacangan", num: 6, name: "Kacang-kacangan", med: 35, minReal: 1, maxReal: 51, defVal: "35", maxVal: 1000 },
  { id: "gula", num: 7, name: "Gula & Pemanis", med: 30, minReal: 8, maxReal: 46, defVal: "25", maxVal: 800 },
  { id: "sayur dan buah", num: 8, name: "Sayur & Buah", med: 250, minReal: 118, maxReal: 445, defVal: "195", maxVal: 2500 },
];

const DEFAULT_MATCH_SCORES = {
  0: 84.13,
  1: 0.01,
  2: 1.65,
  3: 14.2,
};

const CLUSTER_COVERAGE = {
  0: "95 kabupaten/kota",
  1: "152 kabupaten/kota",
  2: "33 kabupaten/kota",
  3: "234 kabupaten/kota",
};

function getQualitativeLevel(score, isWinner) {
  if (isWinner) return "Pola Utama";
  if (score >= 30) return "Cukup Dekat";
  if (score >= 10) return "Sedikit Kemiripan";
  return "Rendah";
}

export default function CekTipePola({ onNavigate }) {
  const [inputs, setInputs] = useState({
    "padi-padian": "290",
    "umbi-umbian": "30",
    "pangan hewani": "140",
    "minyak dan lemak": "40",
    "buah/biji berminyak": "10",
    "kacang-kacangan": "35",
    gula: "25",
    "sayur dan buah": "195",
  });

  const [isModalOpen, setIsModalOpen] = useState(true);
  const [activeCluster, setActiveCluster] = useState(0);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [serverResult, setServerResult] = useState(null);

  // Validasi input 8 kelompok pangan (wajib terisi semua 8/8, boleh 0, tidak boleh negatif)
  const validation = useMemo(() => {
    const fieldErrors = {};
    const fieldWarnings = {};
    let filled = 0;

    FITUR_DEFAULT.forEach((f) => {
      const raw = inputs[f.id];
      if (raw !== undefined && String(raw).trim() !== "") {
        const val = Number(raw);
        if (isNaN(val)) {
          fieldErrors[f.id] = "Harus berupa angka";
        } else if (val < 0) {
          fieldErrors[f.id] = "Nilai tidak boleh negatif";
        } else if (val > f.maxVal) {
          fieldErrors[f.id] = `Melebihi batas wajar (maks. ${f.maxVal} g)`;
        } else {
          filled++;
          if (val < f.minReal || val > f.maxReal) {
            fieldWarnings[f.id] = `Di luar rentang umum kab/kota (${f.minReal}–${f.maxReal} g/hari)`;
          }
        }
      }
    });

    const hasErrors = Object.keys(fieldErrors).length > 0;
    const hasWarnings = Object.keys(fieldWarnings).length > 0;
    const isAllFilled = filled === FITUR_DEFAULT.length;

    return {
      fieldErrors,
      fieldWarnings,
      hasWarnings,
      filled,
      hasErrors,
      isAllFilled,
      canSubmit: isAllFilled && !hasErrors,
    };
  }, [inputs]);

  const handleChange = (id, val) => {
    setServerError(null);
    setInputs((prev) => ({ ...prev, [id]: val }));
  };

  const fillSampleDefault = () => {
    const vals = {};
    FITUR_DEFAULT.forEach((f) => (vals[f.id] = f.defVal));
    setInputs(vals);
    setServerError(null);
  };

  const fillMedian = () => {
    const vals = {};
    FITUR_DEFAULT.forEach((f) => (vals[f.id] = String(f.med)));
    setInputs(vals);
    setServerError(null);
  };

  const clearInputs = () => {
    const vals = {};
    FITUR_DEFAULT.forEach((f) => (vals[f.id] = ""));
    setInputs(vals);
    setServerError(null);
  };

  const handlePredict = async () => {
    if (!validation.canSubmit) {
      if (validation.hasErrors) {
        setServerError("Terdapat input yang tidak valid. Periksa kolom bertanda merah.");
      } else if (!validation.isAllFilled) {
        setServerError(`Semua 8 kelompok pangan wajib diisi (saat ini terisi ${validation.filled}/8).`);
      }
      return;
    }

    setLoading(true);
    setServerError(null);

    const payload = {};
    FITUR_DEFAULT.forEach((f) => {
      payload[f.id] = Number(inputs[f.id]);
    });

    try {
      const res = await predictCluster(payload);
      if (res?.data?.prediction) {
        const pred = res.data.prediction;
        setActiveCluster(pred.cluster_id % 4);
        setServerResult(pred);
        setIsModalOpen(false);
      } else {
        throw new Error("Format respons tidak sesuai");
      }
    } catch (err) {
      setServerError(err.message || "Gagal menghubungi layanan analisis pola pangan.");
    } finally {
      setLoading(false);
    }
  };

  const currentMeta = CLUSTER_CONFIG[activeCluster] || CLUSTER_CONFIG[0];
  const matchScores = serverResult?.probabilities || DEFAULT_MATCH_SCORES;
  const topScore =
    serverResult?.prob_max_pct ??
    Number(matchScores[activeCluster] ?? Math.max(...Object.values(matchScores)));
  const isMixedPattern = serverResult?.is_transition ?? topScore < 70;

  const suitabilityLabel = isMixedPattern
    ? "Pola Campuran"
    : topScore >= 90
      ? "Sangat Sesuai"
      : topScore >= 75
        ? "Sesuai"
        : "Cukup Sesuai";

  const topDeviations = useMemo(() => {
    return FITUR_DEFAULT.map((f) => {
      const raw = inputs[f.id];
      const val = raw !== "" && !isNaN(Number(raw)) ? Number(raw) : f.med;
      const diff = Math.round(val - f.med);
      return {
        name: f.name,
        absDiff: Math.abs(diff),
        diff: `${diff >= 0 ? "+" : ""}${diff} g`,
        isPos: diff >= 0,
      };
    })
      .sort((a, b) => b.absDiff - a.absDiff)
      .slice(0, 3);
  }, [inputs]);

  const bapanasRecs = useMemo(() => {
    const valuesMap = {};
    FITUR_DEFAULT.forEach((f) => {
      const raw = inputs[f.id];
      valuesMap[f.id] = raw !== "" && !isNaN(Number(raw)) ? Number(raw) : f.med;
    });
    return generateBapanasRecommendations(valuesMap);
  }, [inputs]);

  return (
    <div style={{ padding: "24px 24px 40px", display: "flex", flexDirection: "column", gap: 16 }}>
      {/* =========================================================================
          TOP BANNER + TOMBOL BUKA POP-UP INPUT
      ========================================================================= */}
      <div
        style={{
          background: "#FFFFFF",
          border: "none",
          borderRadius: 14,
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          boxShadow: "0 2px 10px rgba(19, 78, 24, 0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img
            src="/maskot.png"
            alt="Si Supa - Maskot konsupa.id"
            style={{ width: 44, height: 44, objectFit: "contain", flexShrink: 0 }}
          />
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: "#134E18", margin: 0 }}>
              Cek Tipe Pola Konsumsi
            </h1>
            <p style={{ fontSize: 11.5, color: "#546E60", margin: "2px 0 0 0" }}>
              Ringkasan tipe pola konsumsi dan kesesuaian terhadap standar PPH Bapanas 2025.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          style={{
            background: "linear-gradient(135deg, #167D26 0%, #134E18 100%)",
            color: "#FFFFFF",
            border: "none",
            borderRadius: 9999,
            padding: "9px 18px",
            fontSize: 12,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 7,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(19, 78, 24, 0.22)",
          }}
        >
          <SlidersHorizontal size={14} />
          Input / Ubah Data Konsumsi
        </button>
      </div>

      {/* =========================================================================
          LAYAR UTAMA HASIL TIPE POLA (RINGKAS & MUDAH DIPAHAMI)
      ========================================================================= */}
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 16, alignItems: "start" }}>
        {/* KOLOM KIRI: KARTU HASIL UTAMA & KOMPOSISI 4 POLA */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Main Result Card (Tanpa badge tingkat kepercayaan) */}
          <div
            style={{
              background: "linear-gradient(135deg, #166520 0%, #134E18 100%)",
              borderRadius: 18,
              padding: "22px 24px",
              color: "#FFFFFF",
              boxShadow: "0 10px 24px rgba(19, 78, 24, 0.18)",
            }}
          >
            <div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  background: "#E5B324",
                  padding: "3px 10px",
                  borderRadius: 9999,
                  color: "#134E18",
                }}
              >
                {serverResult ? "Hasil Analisis" : "Contoh Profil"}
              </span>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: "10px 0 4px 0", color: "#FFFFFF" }}>
                Tipe {activeCluster} – {currentMeta.name}
              </h2>
              <div style={{ fontSize: 12.5, color: "#EAF5EC", lineHeight: "18px" }}>
                {currentMeta.sub}
              </div>
            </div>

            <div
              style={{
                marginTop: 12,
                paddingTop: 12,
                borderTop: "1px solid rgba(255, 255, 255, 0.16)",
                fontSize: 11.5,
                color: "#DCFCE7",
                lineHeight: "17px",
              }}
            >
              {currentMeta.desc}
            </div>
          </div>

          {/* Peringatan Pola Campuran jika tidak dominan tunggal */}
          {isMixedPattern && (
            <div
              style={{
                background: "#FEFCE8",
                border: "none",
                borderRadius: 12,
                padding: "11px 14px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 11.5,
                color: "#854D0E",
              }}
            >
              <AlertTriangle size={16} color="#CA8A04" style={{ flexShrink: 0 }} />
              <span>
                <strong>Pola Campuran:</strong> Profil ini memiliki kemiripan pada lebih dari satu tipe pola konsumsi.
              </span>
            </div>
          )}

          {/* Komposisi Kecenderungan 4 Tipe Pola */}
          <div
            style={{
              background: "#FFFFFF",
              border: "none",
              borderRadius: 14,
              padding: "18px 20px",
              boxShadow: "0 2px 10px rgba(19, 78, 24, 0.06)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#134E18" }}>
                Komposisi Kecenderungan Pola Pangan
              </div>
              <span style={{ fontSize: 10.5, color: "#546E60" }}>Total 100%</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {[0, 1, 2, 3].map((cid) => {
                const cfg = CLUSTER_CONFIG[cid];
                const score = Number(matchScores[cid] ?? matchScores[String(cid)] ?? 0);
                const isWinner = activeCluster === cid;

                return (
                  <div key={cid} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11.5 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: isWinner ? 800 : 600, color: "#143224" }}>
                        <span style={{ width: 9, height: 9, borderRadius: 9999, background: cfg.color }} />
                        <span>Tipe {cid}: {cfg.name}</span>
                        {isWinner && (
                          <span
                            style={{
                              fontSize: 9.5,
                              fontWeight: 700,
                              background: "#DCFCE7",
                              color: "#134E18",
                              padding: "1px 7px",
                              borderRadius: 9999,
                            }}
                          >
                            Utama
                          </span>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          color: isWinner ? "#134E18" : "#4B5563",
                        }}
                      >
                        {score.toFixed(1)}%
                      </span>
                    </div>
                    <div style={{ width: "100%", height: 8, background: "#EEF2EF", borderRadius: 9999, overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${Math.max(4, Math.min(100, score))}%`,
                          height: "100%",
                          background: isWinner ? "#166520" : "#9CA3AF",
                          borderRadius: 9999,
                          transition: "width 0.35s ease",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: DATA INPUT & REKOMENDASI BAPANAS */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Ringkasan 8 Input Konsumsi */}
          <div
            style={{
              background: "#FFFFFF",
              border: "none",
              borderRadius: 14,
              padding: "16px 18px",
              boxShadow: "0 2px 10px rgba(19, 78, 24, 0.06)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: "#134E18" }}>
                Data Konsumsi yang Dianalisis
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                style={{
                  background: "#F0FDF4",
                  border: "none",
                  borderRadius: 6,
                  padding: "4px 10px",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#134E18",
                  cursor: "pointer",
                }}
              >
                Ubah Nilai
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {FITUR_DEFAULT.map((f) => {
                const raw = inputs[f.id];
                const isImputed = raw === "" || raw === undefined;
                const displayVal = isImputed ? f.med : Number(raw);
                return (
                  <div
                    key={f.id}
                    style={{
                      background: "#F7FAF8",
                      border: "none",
                      borderRadius: 8,
                      padding: "8px 10px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#374151" }}>{f.name}</span>
                    <span style={{ fontSize: 11.5, fontWeight: 800, color: "#143224" }}>
                      {displayVal} <span style={{ fontSize: 10, fontWeight: 500, color: "#6A8374" }}>g/hari</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rekomendasi Kebijakan Bapanas berdasarkan Standar PPH */}
          <div
            style={{
              background: "#FFFFFF",
              border: "none",
              borderRadius: 14,
              padding: "16px 18px",
              boxShadow: "0 2px 10px rgba(19, 78, 24, 0.06)",
            }}
          >
            <div style={{ fontSize: 12.5, fontWeight: 800, color: "#134E18", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
              <Sparkles size={14} color="#166520" />
              Hal yang Perlu Diperhatikan (Standar PPH)
            </div>

            {bapanasRecs.allBalanced ? (
              <div style={{ background: "#F0FDF4", border: "none", borderRadius: 10, padding: "10px 12px", fontSize: 11.5, color: "#134E18" }}>
                Aman: seluruh 8 kelompok pangan sudah sesuai standar PPH.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {bapanasRecs.deficits.slice(0, 3).map((rec) => (
                  <div
                    key={`sim-def-${rec.key}`}
                    style={{
                      background: "#FEF2F2",
                      border: "none",
                      borderRadius: 10,
                      padding: "9px 12px",
                    }}
                  >
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: "#B91C1C" }}>
                      {rec.nama}: {rec.konsumsi} g (di bawah acuan {rec.target} g)
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#143224", marginTop: 2 }}>
                      {rec.title}
                    </div>
                    <div style={{ fontSize: 11, color: "#374151", marginTop: 1, lineHeight: "15px" }}>
                      {rec.action}
                    </div>
                  </div>
                ))}
                {bapanasRecs.surpluses.slice(0, 2).map((rec) => (
                  <div
                    key={`sim-sur-${rec.key}`}
                    style={{
                      background: "#EFF6FF",
                      border: "none",
                      borderRadius: 10,
                      padding: "9px 12px",
                    }}
                  >
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: "#1E40AF" }}>
                      {rec.nama}: {rec.konsumsi} g (melebihi acuan {rec.target} g)
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#143224", marginTop: 2 }}>
                      {rec.title}
                    </div>
                    <div style={{ fontSize: 11, color: "#374151", marginTop: 1, lineHeight: "15px" }}>
                      {rec.action}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cakupan Wilayah */}
          <div
            style={{
              background: "#F0FDF4",
              border: "none",
              borderRadius: 10,
              padding: "12px 14px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: 11.5, color: "#134E18" }}>
              Pola ini ditemukan pada <strong>{CLUSTER_COVERAGE[activeCluster]}</strong> di Indonesia (2025).
            </div>
            <button
              type="button"
              onClick={() => onNavigate("peta")}
              style={{
                background: "transparent",
                border: "none",
                color: "#134E18",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Lihat Peta →
            </button>
          </div>

          {validation.hasWarnings && (
            <div
              style={{
                background: "#FEFCE8",
                border: "none",
                borderRadius: 10,
                padding: "10px 12px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 11,
                color: "#854D0E",
              }}
            >
              <AlertTriangle size={15} color="#CA8A04" style={{ flexShrink: 0 }} />
              <span>Sebagian input berada di luar rentang umum kabupaten/kota Indonesia (Bapanas 2025).</span>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          POP-UP MODAL FORM INPUT 8 KELOMPOK PANGAN
      ========================================================================= */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 35, 24, 0.55)",
            backdropFilter: "blur(3px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 18,
              width: "100%",
              maxWidth: 740,
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "20px 24px",
              boxShadow: "0 20px 45px rgba(0, 0, 0, 0.22)",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 800, color: "#143224", margin: 0 }}>
                  Input Konsumsi 8 Kelompok Pangan
                </h2>
                <p style={{ fontSize: 11.5, color: "#546E60", margin: "3px 0 0 0" }}>
                  Masukkan rata-rata konsumsi (gram/kapita/hari). Semua 8 kelompok pangan wajib diisi (nilai 0 diperbolehkan, tidak boleh negatif).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Tutup form"
                style={{
                  background: "#F3F4F6",
                  border: "none",
                  borderRadius: 9999,
                  width: 30,
                  height: 30,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#374151",
                  flexShrink: 0,
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Quick Actions & Status Counter */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    background: validation.canSubmit ? "#16A34A" : validation.hasErrors ? "#DC2626" : "#D97706",
                    borderRadius: 9999,
                  }}
                />
                <span style={{ fontSize: 12, fontWeight: 700, color: "#143224" }}>
                  Kelengkapan Data
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: validation.isAllFilled ? "#065F46" : "#B45309",
                  }}
                >
                  ({validation.filled}/8 Terisi)
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button
                  type="button"
                  onClick={fillSampleDefault}
                  style={{
                    background: "#F0FDF4",
                    border: "none",
                    borderRadius: 6,
                    padding: "5px 10px",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#134E18",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    cursor: "pointer",
                  }}
                >
                  <Wand2 size={11} />
                  Contoh Data
                </button>

                <button
                  type="button"
                  onClick={fillMedian}
                  style={{
                    background: "#F0FDF4",
                    border: "none",
                    borderRadius: 6,
                    padding: "5px 10px",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#134E18",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    cursor: "pointer",
                  }}
                >
                  <RotateCcw size={11} />
                  Rata-rata Nasional
                </button>

                <button
                  type="button"
                  onClick={clearInputs}
                  style={{
                    background: "#FEE2E2",
                    border: "none",
                    borderRadius: 6,
                    padding: "5px 10px",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#991B1B",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    cursor: "pointer",
                  }}
                >
                  <Trash2 size={11} />
                  Kosongkan
                </button>
              </div>
            </div>

            {/* 8 Inputs Grid (Tanpa border tipis warna-warni) */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {FITUR_DEFAULT.map((f) => {
                const err = validation.fieldErrors[f.id];
                const warn = !err ? validation.fieldWarnings[f.id] : null;

                return (
                  <div
                    key={f.id}
                    style={{
                      background: err ? "#FEF2F2" : warn ? "#FEFCE8" : "#F4F8F5",
                      border: "none",
                      borderRadius: 10,
                      padding: "10px 12px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span
                          style={{
                            width: 17,
                            height: 17,
                            borderRadius: 9999,
                            background: err ? "#DC2626" : warn ? "#E5B324" : "#134E18",
                            color: err ? "#FFFFFF" : warn ? "#134E18" : "#FFFFFF",
                            fontSize: 10,
                            fontWeight: 800,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {f.num}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: err ? "#991B1B" : "#143224" }}>
                          {f.name}
                        </span>
                      </div>
                      <span style={{ fontSize: 10, color: "#546E60" }}>
                        Nasional: {f.med} g
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <input
                        type="number"
                        min="0"
                        max={f.maxVal}
                        step="any"
                        value={inputs[f.id] ?? ""}
                        onChange={(e) => handleChange(f.id, e.target.value)}
                        placeholder={String(f.med)}
                        style={{
                          flex: 1,
                          padding: "7px 10px",
                          borderRadius: 6,
                          border: err ? "1.5px solid #DC2626" : "none",
                          background: "#FFFFFF",
                          fontSize: 13.5,
                          fontWeight: 700,
                          color: err ? "#991B1B" : "#134E18",
                          outline: "none",
                        }}
                      />
                      <span style={{ fontSize: 11, color: "#546E60", fontWeight: 500 }}>
                        g/hari
                      </span>
                    </div>

                    {err && (
                      <div style={{ fontSize: 10, fontWeight: 600, color: "#DC2626", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                        <AlertCircle size={10} />
                        {err}
                      </div>
                    )}
                    {warn && (
                      <div style={{ fontSize: 10, fontWeight: 600, color: "#B45309", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                        <AlertTriangle size={10} />
                        {warn}; hasil bisa kurang representatif.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {serverError && (
              <div
                style={{
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#991B1B",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <AlertCircle size={14} />
                {serverError}
              </div>
            )}

            {/* Modal Footer */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: 10,
                borderTop: "1px solid #EDF4F0",
              }}
            >
              <div style={{ fontSize: 11, color: "#546E60", display: "flex", alignItems: "center", gap: 5 }}>
                <Info size={13} color="#16A34A" />
                <span>Data acuan: Bapanas 2025</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    background: "#F3F4F6",
                    color: "#374151",
                    border: "none",
                    borderRadius: 9999,
                    padding: "9px 16px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handlePredict}
                  disabled={!validation.canSubmit || loading}
                  style={{
                    background: validation.canSubmit
                      ? "linear-gradient(135deg, #167D26 0%, #134E18 100%)"
                      : "#94A3B8",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: 9999,
                    padding: "9px 20px",
                    fontSize: 12,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    cursor: validation.canSubmit ? "pointer" : "not-allowed",
                    boxShadow: validation.canSubmit
                      ? "4px 6px 14px rgba(19, 78, 24, 0.22), inset 1px 1px 2px rgba(255, 255, 255, 0.25)"
                      : "none",
                  }}
                >
                  <Search size={14} />
                  {loading ? "Menganalisis..." : "Cek Tipe Pola"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
