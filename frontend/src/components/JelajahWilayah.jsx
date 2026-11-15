/**
 * JelajahWilayah.jsx
 * ------------------
 * Profil lengkap satu wilayah:
 *  - dropdown pilih wilayah
 *  - badge tipe pola
 *  - 8 kelompok pangan vs standar PPH (bar chart)
 *  - rincian komoditas (expand)
 *  - 5 wilayah mirip dalam klaster
 */

import { useState, useEffect, useMemo } from "react";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine,
  ResponsiveContainer, Cell, Legend,
} from "recharts";
import {
  getAllWilayah,
  getClusterNames,
  getKomoditasWilayah,
  getWilayahKlaster,
  getProfilKlaster,
} from "../api.js";

const CLUSTER_COLORS = ["#16a34a", "#2563eb", "#ca8a04", "#9333ea", "#dc2626"];

export default function JelajahWilayah() {
  const [wilayahList,  setWilayahList]  = useState([]);
  const [clusterNames, setClusterNames] = useState({});
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  const [selected,     setSelected]     = useState("");
  const [profil,       setProfil]       = useState(null);
  const [komoditas,    setKomoditas]    = useState(null);
  const [mirip,        setMirip]        = useState([]);
  const [loadingDetail,setLoadingDetail]= useState(false);
  const [showKomoditas,setShowKomoditas]= useState(false);

  useEffect(() => {
    Promise.all([getAllWilayah(), getClusterNames()])
      .then(([wRes, cRes]) => {
        setWilayahList(wRes.data);
        setClusterNames(cRes.data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const cols = useMemo(() => {
    if (wilayahList.length === 0) return { wilayah: null, cluster: null };
    const keys = Object.keys(wilayahList[0]);
    return {
      wilayah: keys.find((k) => /wilayah|kabupaten|kab_kota|nama/i.test(k)) || keys[0],
      cluster: keys.find((k) => /cluster|klaster/i.test(k)) || keys[1],
    };
  }, [wilayahList]);

  const selectedRow = useMemo(
    () => wilayahList.find((r) => String(r[cols.wilayah]) === selected),
    [wilayahList, selected, cols]
  );
  const clusterId = selectedRow ? selectedRow[cols.cluster] : null;

  const handleSelect = async (nama) => {
    setSelected(nama);
    setShowKomoditas(false);
    setProfil(null);
    setKomoditas(null);
    setMirip([]);
    if (!nama) return;

    const row = wilayahList.find((r) => String(r[cols.wilayah]) === nama);
    if (!row) return;
    const cid = row[cols.cluster];

    setLoadingDetail(true);
    try {
      const [komRes, profilRes, miripRes] = await Promise.all([
        getKomoditasWilayah(nama),
        getProfilKlaster(cid),
        getWilayahKlaster(cid, 6),
      ]);
      setKomoditas(komRes.data);
      setProfil(profilRes.data);
      setMirip(
        (miripRes.data || []).filter((r) => String(r[cols.wilayah]) !== nama).slice(0, 5)
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Siapkan data chart PPH: bandingkan komoditas vs profil klaster (rata-rata)
  const chartData = useMemo(() => {
    if (!komoditas || !profil) return [];
    // Ambil key numerik non-id dari komoditas, kecuali kolom wilayah/klaster
    const skip = new Set([cols.wilayah, cols.cluster]);
    return Object.entries(komoditas)
      .filter(([k, v]) => !skip.has(k) && typeof v === "number")
      .slice(0, 20)
      .map(([k, v]) => ({
        name: k,
        wilayah: v,
        rataKlaster: typeof profil[k] === "number" ? profil[k] : null,
      }));
  }, [komoditas, profil, cols]);

  if (loading) {
    return (
      <div className="page" style={{ textAlign: "center", paddingTop: "4rem" }}>
        <Loader2 size={32} style={{ color: "var(--color-primary)", animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ marginTop: "0.75rem", color: "var(--color-muted)" }}>Memuat data wilayah…</p>
      </div>
    );
  }

  return (
    <div className="page">
      <h1 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "1.25rem" }}>
        Jelajah Wilayah
      </h1>

      {error && <div className="banner-error" style={{ marginBottom: "1rem" }}>{error}</div>}

      {/* Pilih wilayah */}
      <div className="card" style={{ marginBottom: "1.25rem" }}>
        <label style={{ fontWeight: 600, fontSize: "0.9rem", display: "block", marginBottom: "0.5rem" }}>
          Pilih Kabupaten/Kota
        </label>
        <select
          value={selected}
          onChange={(e) => handleSelect(e.target.value)}
          style={{
            width: "100%",
            maxWidth: 400,
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius)",
            padding: "0.45rem 0.75rem",
            fontSize: "0.875rem",
            background: "#fff",
          }}
        >
          <option value="">— Pilih wilayah —</option>
          {wilayahList.map((r, i) => (
            <option key={i} value={String(r[cols.wilayah])}>
              {r[cols.wilayah]}
            </option>
          ))}
        </select>
      </div>

      {loadingDetail && (
        <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-muted)" }}>
          <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {selected && !loadingDetail && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
          {/* Kolom kiri: identitas + chart */}
          <div>
            <div className="card" style={{ marginBottom: "1rem" }}>
              <p style={{ fontSize: "0.75rem", color: "var(--color-muted)", marginBottom: "0.25rem" }}>
                Wilayah
              </p>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>{selected}</h2>
              {clusterId !== null && (
                <span
                  className={`badge badge-${clusterId}`}
                  style={{ marginTop: "0.4rem", display: "inline-block" }}
                >
                  {clusterNames[clusterId] || `Klaster ${clusterId}`}
                </span>
              )}
            </div>

            {/* Batas klaim */}
            <div className="banner-info" style={{ marginBottom: "1rem", fontSize: "0.78rem" }}>
              Perbandingan ini menggambarkan <strong>pola konsumsi</strong>, bukan kecukupan gizi atau kerawanan pangan.
            </div>

            {chartData.length > 0 && (
              <div className="card">
                <h3 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.75rem" }}>
                  Profil vs Rata-Rata Klaster
                </h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 10 }}>
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} />
                    <Tooltip formatter={(v) => v?.toFixed(2)} />
                    <Legend />
                    <Bar dataKey="wilayah" name="Wilayah ini" fill={CLUSTER_COLORS[clusterId] || "#16a34a"} />
                    <Bar dataKey="rataKlaster" name="Rata-rata klaster" fill="#d1d5db" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Kolom kanan: komoditas + wilayah mirip */}
          <div>
            {/* Rincian komoditas */}
            {komoditas && (
              <div className="card" style={{ marginBottom: "1rem" }}>
                <button
                  onClick={() => setShowKomoditas((p) => !p)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                  }}
                >
                  Rincian Komoditas
                  {showKomoditas ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {showKomoditas && (
                  <div style={{ marginTop: "0.75rem", maxHeight: 220, overflowY: "auto" }}>
                    <table className="tbl">
                      <tbody>
                        {Object.entries(komoditas)
                          .filter(([k]) => k !== cols.wilayah && k !== cols.cluster)
                          .map(([k, v]) => (
                            <tr key={k}>
                              <td style={{ color: "var(--color-muted)" }}>{k}</td>
                              <td style={{ fontWeight: 500, textAlign: "right" }}>
                                {typeof v === "number" ? v.toFixed(2) : v}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Wilayah mirip */}
            <div className="card">
              <h3 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.75rem" }}>
                5 Wilayah dengan Pola Serupa
              </h3>
              {mirip.length === 0 ? (
                <p style={{ fontSize: "0.85rem", color: "var(--color-muted)" }}>
                  Tidak ada wilayah lain dalam klaster ini.
                </p>
              ) : (
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {mirip.map((r, i) => (
                    <li
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.35rem 0.5rem",
                        borderRadius: "0.375rem",
                        background: "#f9fafb",
                        fontSize: "0.85rem",
                      }}
                    >
                      <span
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          background: CLUSTER_COLORS[clusterId] || "#16a34a",
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {i + 1}
                      </span>
                      {r[cols.wilayah]}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {!selected && !loadingDetail && (
        <div
          style={{
            textAlign: "center",
            padding: "3rem",
            color: "var(--color-muted)",
            fontSize: "0.875rem",
          }}
        >
          Pilih wilayah di atas untuk melihat profilnya.
        </div>
      )}
    </div>
  );
}
