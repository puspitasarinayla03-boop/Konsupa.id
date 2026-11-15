# PRD — Product Requirements Document

**Produk:** SIPOKAN (nama kerja) · **Versi dokumen:** 0.1 (draf)

## 1. Ringkasan

SIPOKAN membantu pengguna memahami pola konsumsi pangan 514 kabupaten/kota. Sistem menampilkan tipe pola hasil clustering, kesenjangan tiap wilayah terhadap standar PPH, wilayah yang mirip, dan menetapkan tipe pola untuk data konsumsi baru.

## 2. Latar belakang dan masalah

- Pola konsumsi pangan antardaerah sangat beragam (pangan pokok, pangan hewani, sayur dan buah, dan lainnya).
- Membandingkan 514 wilayah × 8 kelompok pangan secara manual tidak praktis dan sulit konsisten.
- Pengelompokan wilayah berdasarkan kemiripan pola membantu perencanaan program yang tidak perlu dirancang satu per satu.

## 3. Tujuan dan non-tujuan

**Tujuan**
1. Menyajikan tipe pola konsumsi tiap kabupaten/kota dengan penjelasan yang mudah dipahami.
2. Menunjukkan kesenjangan tiap wilayah terhadap standar PPH per kelompok pangan.
3. Memungkinkan pencarian wilayah yang mirip, termasuk lintas provinsi.
4. Memperlihatkan model tersimpan dipakai langsung di sistem (penetapan tipe pola untuk masukan baru).
5. Menyampaikan metode, metrik, dan keterbatasan secara transparan.

**Non-tujuan**
- Meramal konsumsi atau kondisi pangan di masa depan.
- Menilai kecukupan gizi, kerawanan pangan, atau menentukan wilayah prioritas bantuan.
- Peta geografis, login pengguna, penyimpanan data pengguna, aplikasi seluler.
- Menggantikan sistem resmi seperti SKPG.

## 4. Pengguna

| Persona | Kebutuhan | Pertanyaan khas |
|---|---|---|
| Analis Dinas Pangan / Badan Pangan | Mengelompokkan wilayah untuk program diversifikasi | "Wilayah mana yang pola konsumsinya serupa dengan kabupaten kami?" |
| Perencana (Bappeda) | Membedakan program menurut tipe wilayah | "Apakah program perlu dibedakan per tipe?" |
| Dinas Kesehatan / gizi | Mengetahui kelompok pangan yang jauh dari komposisi ideal | "Kelompok pangan mana yang jauh di bawah PPH?" |
| Peneliti / mahasiswa | Memahami metode dan batasnya | "Seberapa kuat struktur klasternya?" |

Pengguna utama yang dipilih tim: **[ISI: tentukan]** (menentukan bahasa dan kedalaman tampilan).

## 5. Lingkup fitur (MoSCoW)

| Prioritas | Fitur |
|---|---|
| **Must** | Beranda (ringkasan tipe); Jelajah Wilayah (profil, rincian komoditas, wilayah mirip); Cek Tipe Pola; Metodologi |
| **Should** | Peta Klaster (grafik sebar PCA) |
| **Could** | Unduh hasil sebagai CSV; bandingkan dua wilayah; pilihan tahun (2024 atau 2025) |
| **Won't** | Peramalan, peta geografis, autentikasi, penyimpanan masukan pengguna |

## 6. User story

| ID | Sebagai | Saya ingin | Agar |
|---|---|---|---|
| US-01 | Analis | memilih kabupaten/kota dan melihat tipe polanya | tahu kelompok wilayah tempat daerah saya berada |
| US-02 | Analis | melihat 8 kelompok pangan dibanding standar PPH dan median antarwilayah | mengetahui kelompok yang jauh di bawah atau di atas |
| US-03 | Analis | melihat komoditas penyusun tiap kelompok | mengarahkan program ke komoditas yang memang dikonsumsi |
| US-04 | Perencana | melihat 5 wilayah paling mirip | membandingkan dan berbagi praktik antarwilayah |
| US-05 | Perencana | melihat sebaran semua wilayah dalam satu grafik | memahami gambaran umum tipe pola |
| US-06 | Peneliti | memasukkan angka konsumsi dan mendapat tipe polanya | menguji skenario atau data baru |
| US-07 | Peneliti | melihat tingkat keyakinan dan penanda perbatasan | tidak menganggap wilayah perbatasan sebagai anggota tegas |
| US-08 | Semua | melihat metrik dan keterbatasan model | menilai seberapa jauh hasil boleh dipercaya |

## 7. Metrik keberhasilan (untuk proyek ini)

| Metrik | Target |
|---|---|
| Label klaster dari model yang dimuat ulang sama dengan notebook | 100% dari 1.028 pengamatan |
| Seluruh endpoint pada kontrak API lulus uji | 100% |
| Waktu respons endpoint (lokal) | < 500 ms |
| Setiap halaman hasil menampilkan catatan batas klaim | 100% |
| Uji kegunaan sederhana: 3 penguji di luar tim menyelesaikan 3 tugas utama tanpa bantuan | [ISI: target, mis. 3 dari 3] |

Metrik kualitas model (silhouette, DBI, CHI) bukan target produk; nilainya dilaporkan apa adanya di `MODEL_CARD.md`.

## 8. Batas klaim dan risiko etis

- Label tipe pola dibuat otomatis dari profil statistik; bukan label gizi.
- Wilayah di perbatasan tipe tidak boleh disajikan sebagai anggota yang tegas.
- Kesenjangan terhadap PPH berbasis gram konsumsi, sedangkan standar PPH berbasis komposisi energi; sajikan sebagai hipotesis.
- Gula dan minyak adalah batas atas, bukan target yang dinaikkan.
- Tidak ada data pribadi yang diproses.

## 9. Asumsi dan ketergantungan

| Asumsi | Dampak bila salah |
|---|---|
| Satuan data asli adalah kg/kapita/tahun (dikonversi ke gram/hari) | Nilai gram dan perbandingan PPH berubah; satuan belum dikonfirmasi sumber |
| Standar PPH memakai edisi AKE 2.000 kkal (BKP 2013) | Persentase terhadap standar berubah bila edisi berbeda |
| Data 2024–2025 mewakili pola saat ini | Hasil bisa usang bila ada data baru |

## 10. Risiko

| Risiko | Mitigasi |
|---|---|
| Hasil dibaca sebagai penilaian kerawanan atau gizi | Catatan klaim di setiap halaman hasil; istilah "Cek Tipe Pola", bukan "prediksi" |
| Berkas model gagal dimuat karena beda versi scikit-learn | Kunci versi di `requirements.txt`; simpan versi di dalam berkas model |
| Struktur klaster lemah memicu pertanyaan penguji | Halaman Metodologi transparan; model card menjelaskan keterbatasan |
| Frontend terlambat | Backend dan kontrak API selesai lebih dulu; frontend minimal (tabel dan daftar) bila waktu mepet |

## 11. Pertanyaan terbuka

Lihat `DECISIONS.md` bagian keputusan terbuka.
