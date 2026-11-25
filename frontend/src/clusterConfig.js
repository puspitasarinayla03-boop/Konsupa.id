/**
 * clusterConfig.js
 * ----------------
 * Konfigurasi terpusat untuk 4 klaster Gaussian Mixture Model (GMM)
 * sesuai gmm_pangan_bundle.pkl -> cluster_names.
 */

export const CLUSTER_CONFIG = {
  0: {
    id: 0,
    tag: "Tipe 0",
    label: "Tipe 0: Pola Beras/Serealia Tinggi",
    short: "Beras/Serealia Tinggi",
    name: "Pola Beras/Serealia Tinggi",
    sub: "Dominan beras dan padi-padian sebagai sumber karbohidrat utama",
    desc: "Konsumsi padi-padian (beras, jagung, terigu) mendominasi asupan energi harian dengan ketergantungan tinggi pada sumber serealia.",
    color: "#D97706",
    bg: "#FEF3C7",
    textColor: "#92400E",
  },
  1: {
    id: 1,
    tag: "Tipe 1",
    label: "Tipe 1: Pola Kacang-kacangan & Sayur-Buah Tinggi",
    short: "Kacang & Sayur-Buah",
    name: "Pola Kacang-kacangan & Sayur-Buah Tinggi",
    sub: "Dominan protein nabati (kacang-kacangan) serta sayur & buah tinggi",
    desc: "Asupan kacang-kacangan (tahu/tempe), sayur, dan buah yang tinggi dengan keragaman pangan nabati dan serat yang baik.",
    color: "#16A34A",
    bg: "#DCFCE7",
    textColor: "#14532D",
  },
  2: {
    id: 2,
    tag: "Tipe 2",
    label: "Tipe 2: Pola Umbi-umbian Tinggi",
    short: "Umbi-umbian Tinggi",
    name: "Pola Umbi-umbian Tinggi",
    sub: "Dominan umbi-umbian lokal (singkong, ubi jalar, keladi, sagu)",
    desc: "Konsumsi umbi-umbian lokal yang tinggi sebagai pangan pokok pendamping atau pengganti beras, khas wilayah kepulauan timur.",
    color: "#2563EB",
    bg: "#EFF6FF",
    textColor: "#1E40AF",
  },
  3: {
    id: 3,
    tag: "Tipe 3",
    label: "Tipe 3: Pola Hewani & Minyak-Lemak Tinggi",
    short: "Hewani & Minyak-Lemak",
    name: "Pola Hewani & Minyak-Lemak Tinggi",
    sub: "Asupan tinggi protein hewani (ikan, daging, telur, susu) & minyak/lemak",
    desc: "Konsumsi protein hewani serta minyak dan lemak yang tinggi, mencerminkan pola konsumsi masyarakat pesisir maupun urban.",
    color: "#DC2626",
    bg: "#FFF1F2",
    textColor: "#991B1B",
  },
};

export const CLUSTER_PROFILES = Object.values(CLUSTER_CONFIG);
