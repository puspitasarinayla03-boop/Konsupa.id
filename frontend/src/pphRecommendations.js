/**
 * pphRecommendations.js
 * ---------------------
 * Generator rekomendasi kebijakan pangan untuk Bapanas & Pemerintah Daerah
 * berdasarkan capaian konsumsi 8 kelompok pangan terhadap standar PPH.
 */

export const PPH_STANDARDS = {
  "padi-padian": { nama: "Padi-padian", target: 275 },
  "umbi-umbian": { nama: "Umbi-umbian", target: 100 },
  "pangan hewani": { nama: "Pangan Hewani", target: 150 },
  "minyak dan lemak": { nama: "Minyak & Lemak", target: 20 },
  "buah/biji berminyak": { nama: "Buah/Biji Berminyak", target: 10 },
  "kacang-kacangan": { nama: "Kacang-kacangan", target: 35 },
  gula: { nama: "Gula & Pemanis", target: 30 },
  "sayur dan buah": { nama: "Sayur & Buah", target: 250 },
};

const POLICY_PLAYBOOK = {
  "padi-padian": {
    low: {
      title: "Perkuat Stabilisasi & Pasokan Beras/Serealia Pokok",
      action:
        "Salurkan beras SPHP dan cadangan pangan pemerintah daerah (CPPD), serta pastikan kelancaran distribusi ke wilayah 3T dan pasar rakyat.",
    },
    high: {
      title: "Dorong Diversifikasi Pangan Pokok Non-Beras (B2SA)",
      action:
        "Kurangi ketergantungan berlebih pada beras melalui promosi pangan lokal (jagung, sagu, umbi) dan gerakan konsumsi Beragam, Bergizi Seimbang, dan Aman (B2SA).",
    },
  },
  "umbi-umbian": {
    low: {
      title: "Gerakan Konsumsi & Hilirisasi Umbi Lokal",
      action:
        "Dorong pemanfaatan singkong, ubi jalar, talas, dan sagu sebagai sumber karbohidrat pendamping beras melalui program Gerakan Pangan Lokal Bapanas dan UMKM olahan.",
    },
    high: {
      title: "Imbangi Umbi Lokal dengan Asupan Protein & Sayur",
      action:
        "Jaga kesinambungan produksi umbi lokal sembari mengedukasi rumah tangga agar melengkapi porsi lauk hewani, kacang-kacangan, dan sayur.",
    },
  },
  "pangan hewani": {
    low: {
      title: "Intervensi Protein Hewani & Penguatan Rantai Dingin",
      action:
        "Perluas bantuan pangan protein hewani (telur & daging ayam) bagi keluarga rentan stunting, gencarkan Gemarikan, dan perkuat cold chain distribusi ikan/daging.",
    },
    high: {
      title: "Jaga Stabilitas Harga & Keseimbangan Serat",
      action:
        "Pantau kestabilan harga daging/ikan/telur di pasar dan dorong pola makan seimbang dengan menambah porsi sayur dan buah.",
    },
  },
  "minyak dan lemak": {
    low: {
      title: "Operasi Pasar Minyak Goreng Rakyat (GPM)",
      action:
        "Pastikan kelancaran distribusi dan harga eceran Minyakita/minyak goreng kemasan rakyat melalui Gerakan Pangan Murah (GPM) dan pemantauan stok distributor.",
    },
    high: {
      title: "Edukasi Pembatasan Lemak & Gorengan Berlebih",
      action:
        "Kampanyekan pola masak rendah minyak (kukus/rebus/panggang) bersama Dinas Kesehatan untuk menekan risiko penyakit tidak menular (kolesterol & hipertensi).",
    },
  },
  "buah/biji berminyak": {
    low: {
      title: "Optimalkan Pemanfaatan Kelapa & Biji Berminyak Lokal",
      action:
        "Fasilitasi akses bahan pangan berlemak nabati sehat (kelapa, kemiri) di pasar tradisional untuk mendukung kebutuhan energi dan bumbu rumah tangga.",
    },
  },
  "kacang-kacangan": {
    low: {
      title: "Stabilkan Pasokan Kedelai & Penguatan Protein Nabati",
      action:
        "Jaga stabilitas harga kedelai bagi perajin tahu-tempe serta dorong budidaya kacang tanah/kacang hijau melalui program Pekarangan Pangan Lestari (P2L).",
    },
  },
  gula: {
    low: {
      title: "Stabilisasi Pasokan & Harga Gula Konsumsi (GPM)",
      action:
        "Gelar Gerakan Pangan Murah (GPM) untuk komoditas gula pasir dan fasilitasi pemasaran gula aren/gula kelapa produksi petani lokal.",
    },
    high: {
      title: "Edukasi Pembatasan Gula Tambahan Harian",
      action:
        "Sosialisasikan batas aman konsumsi gula (maks. 4 sendok makan/hari sesuai pedoman G4-G1-L5) untuk mencegah risiko diabetes di masyarakat.",
    },
  },
  "sayur dan buah": {
    low: {
      title: "Perluas Pekarangan Pangan Lestari (P2L) & Logistik Hortikultura",
      action:
        "Perbanyak kebun bibit/pekarangan sayur-buah keluarga (P2L), perkuat kerja sama pasokan antar-daerah untuk menekan harga sayur/buah, dan kampanyekan isi piringku B2SA.",
    },
  },
};

/**
 * Menghasilkan daftar rekomendasi kebijakan Bapanas dari nilai konsumsi 8 kelompok pangan.
 * @param {Object} valuesMap - { "padi-padian": number, ... }
 * @returns {{ deficits: Array, surpluses: Array, allBalanced: boolean }}
 */
export function generateBapanasRecommendations(valuesMap) {
  const deficits = [];
  const surpluses = [];

  Object.entries(PPH_STANDARDS).forEach(([key, std]) => {
    const val = Number(valuesMap?.[key]) || 0;
    const pct = Math.round((val / std.target) * 100);
    const playbook = POLICY_PLAYBOOK[key];

    if (pct < 85 && playbook?.low) {
      deficits.push({
        key,
        nama: std.nama,
        konsumsi: Math.round(val),
        target: std.target,
        pct,
        type: "deficit",
        ...playbook.low,
      });
    } else if (pct > 115 && playbook?.high) {
      surpluses.push({
        key,
        nama: std.nama,
        konsumsi: Math.round(val),
        target: std.target,
        pct,
        type: "surplus",
        ...playbook.high,
      });
    }
  });

  deficits.sort((a, b) => a.pct - b.pct);
  surpluses.sort((a, b) => b.pct - a.pct);

  return {
    deficits,
    surpluses,
    allBalanced: deficits.length === 0 && surpluses.length === 0,
  };
}
