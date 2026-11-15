/**
 * Metodologi.jsx
 * --------------
 * Halaman transparansi: metrik evaluasi, proses, dan keterbatasan model.
 * Konten statis (teks) + placeholder untuk nilai metrik dari MODEL_CARD.
 */

export default function Metodologi() {
  return (
    <div className="page">
      <h1 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        Metodologi
      </h1>
      <p style={{ color: "var(--color-muted)", fontSize: "0.875rem", marginBottom: "2rem" }}>
        Halaman ini menjelaskan cara kerja model, metrik evaluasinya, dan batas klaim yang berlaku.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* Data */}
        <section className="card">
          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem" }}>📊 Data</h2>
          <table className="tbl">
            <tbody>
              <tr><td style={{ color: "var(--color-muted)", width: 180 }}>Sumber</td><td>Susenas BPS 2024–2025 (atau sesuai sumber tim)</td></tr>
              <tr><td style={{ color: "var(--color-muted)" }}>Cakupan</td><td>514 kabupaten/kota di Indonesia</td></tr>
              <tr><td style={{ color: "var(--color-muted)" }}>Fitur input</td><td>26 komoditas pangan (dikelompokkan ke 8 kelompok PPH)</td></tr>
              <tr><td style={{ color: "var(--color-muted)" }}>Satuan</td><td>Gram/kapita/hari (konversi dari kg/kapita/tahun ÷ 365)</td></tr>
              <tr><td style={{ color: "var(--color-muted)" }}>Pra-pemrosesan</td><td>StandardScaler (mean=0, std=1) per fitur</td></tr>
            </tbody>
          </table>
        </section>

        {/* Model */}
        <section className="card">
          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem" }}>🤖 Model</h2>
          <table className="tbl">
            <tbody>
              <tr><td style={{ color: "var(--color-muted)", width: 180 }}>Algoritma</td><td>K-Means (scikit-learn 1.5.2)</td></tr>
              <tr><td style={{ color: "var(--color-muted)" }}>Jumlah klaster</td><td>K = 4 (dipilih berdasarkan Elbow + Silhouette)</td></tr>
              <tr><td style={{ color: "var(--color-muted)" }}>Inisialisasi</td><td>k-means++ (10 kali ulang, random_state = [isi])</td></tr>
              <tr><td style={{ color: "var(--color-muted)" }}>Versi model</td><td>v1.0 — ekspor dari notebook training</td></tr>
            </tbody>
          </table>
        </section>

        {/* Metrik */}
        <section className="card">
          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem" }}>📐 Metrik Evaluasi</h2>
          <table className="tbl">
            <thead>
              <tr>
                <th>Metrik</th>
                <th>Nilai</th>
                <th>Interpretasi</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Silhouette Score</td>
                <td style={{ fontFamily: "monospace" }}>≈ 0.17</td>
                <td>Struktur lemah; klaster bergradasi dan saling tumpang tindih</td>
              </tr>
              <tr>
                <td>Davies–Bouldin Index</td>
                <td style={{ fontFamily: "monospace" }}>[isi]</td>
                <td>Makin kecil makin baik (kompak dan terpisah)</td>
              </tr>
              <tr>
                <td>Calinski–Harabasz Index</td>
                <td style={{ fontFamily: "monospace" }}>[isi]</td>
                <td>Makin besar makin baik</td>
              </tr>
              <tr>
                <td>Inertia</td>
                <td style={{ fontFamily: "monospace" }}>[isi]</td>
                <td>Total kuadrat jarak titik ke centroid</td>
              </tr>
            </tbody>
          </table>
          <p style={{ fontSize: "0.78rem", color: "var(--color-muted)", marginTop: "0.5rem" }}>
            Nilai [isi] akan diperbarui setelah model final diekspor. Metrik ini bukan target produk;
            dilaporkan apa adanya untuk transparansi.
          </p>
        </section>

        {/* Batas klaim */}
        <section className="card">
          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem" }}>⚠️ Batas Klaim</h2>
          <ul style={{ fontSize: "0.875rem", lineHeight: 1.8, paddingLeft: "1.25rem" }}>
            <li>Label tipe pola dibuat otomatis dari profil statistik; <strong>bukan label gizi</strong>.</li>
            <li>Wilayah di perbatasan klaster <strong>tidak boleh</strong> ditafsirkan sebagai anggota yang tegas.</li>
            <li>
              Kesenjangan terhadap PPH berbasis gram konsumsi; standar PPH berbasis komposisi energi.
              Sajikan sebagai <strong>hipotesis</strong>, bukan kesimpulan.
            </li>
            <li>Gula dan minyak adalah <strong>batas atas</strong>, bukan target yang perlu dinaikkan.</li>
            <li>Sistem <strong>tidak meramal</strong> kondisi pangan di masa depan.</li>
            <li>Tidak ada data pribadi yang diproses.</li>
          </ul>
        </section>

        {/* Standar PPH */}
        <section className="card">
          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.75rem" }}>📋 Standar PPH</h2>
          <p style={{ fontSize: "0.875rem", lineHeight: 1.7 }}>
            Standar Pola Pangan Harapan yang digunakan mengacu pada{" "}
            <strong>AKE 2.000 kkal — Badan Ketahanan Pangan, 2013</strong>.
            Bila edisi berbeda digunakan, persentase terhadap standar akan berubah.
            Lihat tab <em>Standar PPH</em> untuk tabel lengkap.
          </p>
        </section>
      </div>
    </div>
  );
}
