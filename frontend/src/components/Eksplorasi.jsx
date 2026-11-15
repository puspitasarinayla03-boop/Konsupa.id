/**
 * Eksplorasi.jsx
 * --------------
 * Jelajahi 514 wilayah: filter per klaster, cari nama, lihat detail komoditas.
 */

import { useState, useEffect, useMemo } from "react";
import { Loader2, Search, ChevronDown, ChevronUp } from "lucide-react";
import { getAllWilayah, getKomoditasWilayah, getClusterNames } from "../api.js";

export default function Eksplorasi() {
  const [wilayah,       setWilayah]       = useState([]);
  const [clusterNames,  setClusterNames]  = useState({});
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [search,        setSearch]        = useState("");
  const [filterCluster, setFilterCluster] = useState("all");
  const [expanded,      setExpanded]      = useState(null);  // nama wilayah yg dibuka
  const [komoditas,     setKomoditas]     = useState({});    // cache { nama: data }
  const [loadingKom,    setLoadingKom]    = useState(false);

  useEffect(() => {
    Promise.all([getAllWilayah(), getClusterNames()])
      .then(([wRes, cRes]) => {
        setWilayah(wRes.data);
        setClusterNames(cRes.data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Kolom wilayah dan klaster (auto-detect)
  const cols = useMemo(() => {
    if (wilayah.length === 0) return { wilayah: null, cluster: null };
    const keys = Object.keys(wilayah[0]);
    return {
      wilayah: keys.find((k) => /wilayah|kabupaten|kab_kota|nama/i.test(k)) || keys[0],
      cluster: keys.find((k) => /cluster|klaster/i.test(k)) || keys[1],
    };
  }, [wilayah]);

  const filtered = useMemo(() => {
    return wilayah.filter((row) => {
      const matchSearch =
        !search ||
        String(row[cols.wilayah] || "").toLowerCase().includes(search.toLowerCase());
      const matchCluster =
        filterCluster === "all" || String(row[cols.cluster]) === filterCluster;
      return matchSearch && matchCluster;
    });
  }, [wilayah, search, filterCluster, cols]);

  const uniqueClusters = useMemo(() => {
    const ids = [...new Set(wilayah.map((r) => String(r[cols.cluster])))].sort();
    return ids;
  }, [wilayah, cols]);

  const toggleRow = async (namaWilayah) => {
    if (expanded === namaWilayah) {
      setExpanded(null);
      return;
    }
    setExpanded(namaWilayah);
    if (!komoditas[namaWilayah]) {
      setLoadingKom(true);
      try {
        const res = await getKomoditasWilayah(namaWilayah);
        setKomoditas((prev) => ({ ...prev, [namaWilayah]: res.data }));
      } catch {
        setKomoditas((prev) => ({ ...prev, [namaWilayah]: null }));
      } finally {
        setLoadingKom(false);
      }
    }
  };

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
        Eksplorasi Wilayah
      </h1>

      {error && <div className="banner-error" style={{ marginBottom: "1rem" }}>{error}</div>}

      {/* Filter bar */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 220px" }}>
          <Search
            size={15}
            style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--color-muted)" }}
          />
          <input
            type="text"
            placeholder="Cari wilayah…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius)",
              padding: "0.45rem 0.5rem 0.45rem 2rem",
              fontSize: "0.875rem",
            }}
          />
        </div>
        <select
          value={filterCluster}
          onChange={(e) => setFilterCluster(e.target.value)}
          style={{
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius)",
            padding: "0.45rem 0.75rem",
            fontSize: "0.875rem",
            background: "#fff",
          }}
        >
          <option value="all">Semua Klaster</option>
          {uniqueClusters.map((cid) => (
            <option key={cid} value={cid}>
              {clusterNames[cid] || `Klaster ${cid}`}
            </option>
          ))}
        </select>
        <span style={{ fontSize: "0.8rem", color: "var(--color-muted)", alignSelf: "center" }}>
          {filtered.length} wilayah
        </span>
      </div>

      {/* Tabel */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Wilayah</th>
              <th>Klaster</th>
              <th style={{ width: 80 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ textAlign: "center", color: "var(--color-muted)", padding: "2rem" }}>
                  Tidak ada wilayah yang cocok.
                </td>
              </tr>
            ) : (
              filtered.map((row, i) => {
                const nama = row[cols.wilayah];
                const cid  = row[cols.cluster];
                const isOpen = expanded === nama;

                return (
                  <>
                    <tr key={i}>
                      <td style={{ fontWeight: 500 }}>{nama}</td>
                      <td>
                        <span className={`badge badge-${cid}`}>
                          {clusterNames[cid] || `Klaster ${cid}`}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => toggleRow(nama)}
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--color-primary)",
                            display: "flex",
                            alignItems: "center",
                            gap: 3,
                          }}
                        >
                          {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          Detail
                        </button>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr key={`${i}-detail`}>
                        <td colSpan={3} style={{ background: "#f9fafb", padding: "0.75rem 1rem" }}>
                          {loadingKom && !komoditas[nama] ? (
                            <span style={{ color: "var(--color-muted)", fontSize: "0.8rem" }}>Memuat…</span>
                          ) : komoditas[nama] ? (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                              {Object.entries(komoditas[nama])
                                .filter(([k]) => k !== cols.wilayah && k !== cols.cluster)
                                .map(([k, v]) => (
                                  <div
                                    key={k}
                                    style={{
                                      background: "#fff",
                                      border: "1px solid var(--color-border)",
                                      borderRadius: "0.375rem",
                                      padding: "0.25rem 0.6rem",
                                      fontSize: "0.75rem",
                                    }}
                                  >
                                    <span style={{ color: "var(--color-muted)" }}>{k}:</span>{" "}
                                    <strong>{typeof v === "number" ? v.toFixed(2) : v}</strong>
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <span style={{ color: "var(--color-muted)", fontSize: "0.8rem" }}>
                              Data komoditas tidak tersedia.
                            </span>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
