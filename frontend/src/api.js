/**
 * api.js
 * ------
 * Semua fungsi pemanggil API ke backend Flask.
 * Base URL diproxy oleh Vite saat dev; saat produksi set VITE_API_BASE_URL.
 */

import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Interceptor: lempar error.message dari respons backend
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message =
      err.response?.data?.message || err.message || "Terjadi kesalahan jaringan";
    return Promise.reject(new Error(message));
  }
);

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------
export const checkHealth = () => api.get("/health");

// ---------------------------------------------------------------------------
// Metadata model
// ---------------------------------------------------------------------------
export const getFeatures     = () => api.get("/features");
export const getClusterNames = () => api.get("/cluster-names");

// ---------------------------------------------------------------------------
// Prediksi klaster
// ---------------------------------------------------------------------------
/**
 * @param {Object} inputValues    - { fitur1: nilai, fitur2: nilai, ... }
 * @param {string} [excludeWilayah] - nama wilayah yang dikecualikan
 * @param {number} [topN=5]       - jumlah wilayah mirip
 */
export const predictCluster = (inputValues, excludeWilayah = null, topN = 5) =>
  api.post("/predict", {
    input: inputValues,
    exclude_wilayah: excludeWilayah,
    top_n: topN,
  });

// ---------------------------------------------------------------------------
// Wilayah
// ---------------------------------------------------------------------------
export const getAllWilayah       = () => api.get("/wilayah");
export const getKomoditasWilayah = (nama) =>
  api.get(`/wilayah/${encodeURIComponent(nama)}/komoditas`);

// ---------------------------------------------------------------------------
// Klaster
// ---------------------------------------------------------------------------
export const getProfilKlaster   = (clusterId) => api.get(`/klaster/${clusterId}/profil`);
export const getWilayahKlaster  = (clusterId, topN) =>
  api.get(`/klaster/${clusterId}/wilayah`, { params: topN ? { top_n: topN } : {} });

// ---------------------------------------------------------------------------
// Standar PPH
// ---------------------------------------------------------------------------
export const getStandarPPH = () => api.get("/standar-pph");

// ---------------------------------------------------------------------------
// Dev utility
// ---------------------------------------------------------------------------
export const reloadArtifacts = () => api.post("/reload");
