# SRS — Software Requirements Specification

**Produk:** SIPOKAN (nama kerja) · **Versi dokumen:** 0.1 (draf) · Acuan: `PRD.md`, `API_CONTRACT.md`, `DATA_DICTIONARY.md`

## 1. Pendahuluan

### 1.1 Tujuan
Dokumen ini menetapkan kebutuhan fungsional dan non-fungsional SIPOKAN: aplikasi web untuk menjelajahi dan membandingkan pola konsumsi pangan 514 kabupaten/kota berdasarkan hasil clustering K-Means.

### 1.2 Lingkup
Termasuk: API Flask, modul model, antarmuka React, artefak data hasil pelatihan. Tidak termasuk: peramalan, penilaian gizi atau kerawanan, peta geografis, autentikasi, penyimpanan masukan pengguna (lihat `PRD.md` bagian non-tujuan).

### 1.3 Definisi

| Istilah | Arti |
|---|---|
| Tipe / klaster | Satu dari 4 kelompok pola konsumsi (id 0 sampai 3, diurutkan dari yang terbesar) |
| Pengamatan | Satu baris data (wilayah × tahun); total 1.028 |
| Tahun acuan | 2025; dipakai untuk tampilan profil, median, dan pencarian wilayah mirip |
| PPH | Pola Pangan Harapan; standar gram per kelompok (total 870 g/hari, AKE 2.000 kkal) |
| Penetapan klaster | Menentukan klaster terdekat bagi vektor konsumsi baru (bukan peramalan) |
| Margin relatif | (jarak ke klaster kedua − jarak ke klaster terdekat) ÷ jarak ke klaster kedua |

## 2. Deskripsi umum

- **Arsitektur:** frontend React memanggil REST API Flask; API memakai `model_service.py` yang memuat artefak sekali saat start.
- **Pengguna:** analis dinas pangan, perencana, dinas kesehatan/gizi, peneliti (lihat PRD).
- **Lingkungan:** Python 3.10+ dan Node 20+ (lokal); browser modern.
- **Batasan:** tanpa database server; model statis (tidak dilatih ulang oleh aplikasi); data 2024–2025.
- **Asumsi:** satuan data kg/kapita/tahun (dugaan); standar PPH edisi AKE 2.000 kkal.

## 3. Kebutuhan fungsional

| ID | Kebutuhan | Endpoint | Prioritas |
|---|---|---|---|
| FR-01 | Menampilkan ringkasan 4 tipe: nama, jumlah pengamatan dan wilayah, persentase, ciri utama, persentase terhadap PPH | `GET /api/ringkasan` | Must |
| FR-02 | Menampilkan daftar provinsi beserta jumlah wilayahnya | `GET /api/provinsi` | Must |
| FR-03 | Mencari dan menyaring wilayah menurut provinsi, nama (≥ 2 huruf), dan tipe, dengan paginasi | `GET /api/wilayah` | Must |
| FR-04 | Menampilkan profil wilayah: tipe pada 2025 dan 2024, konsistensi antartahun, silhouette, penanda perbatasan, dan 8 kelompok pangan (gram/hari, standar PPH, % PPH, median antarwilayah, rasio median, status) | `GET /api/wilayah/{kode}` | Must |
| FR-05 | Menampilkan rincian komoditas per kelompok pangan untuk wilayah terpilih | `GET /api/wilayah/{kode}` | Must |
| FR-06 | Menampilkan 1 sampai 20 wilayah paling mirip (default 5), termasuk lintas provinsi, berdasarkan jarak Euclidean pada gram terstandarisasi 2025 | `GET /api/wilayah/{kode}/mirip` | Must |
| FR-07 | Menyediakan koordinat PCA 2 dimensi tiap wilayah untuk grafik sebar, dengan filter tipe dan provinsi | `GET /api/sebaran` | Should |
| FR-08 | Menetapkan tipe pola bagi masukan konsumsi pengguna: tipe, jarak ke tiap tipe, selisih terhadap pusat tipe | `POST /api/cek-pola` | Must |
| FR-09 | Memvalidasi masukan Cek Pola: kunci dikenal, nilai angka ≥ 0, minimal 4 dari 8 kelompok terisi; kelompok kosong diisi median 2025; nilai di atas 3× maksimum data memicu peringatan (bukan penolakan) | `POST /api/cek-pola` | Must |
| FR-10 | Menyertakan tingkat keyakinan (tegas, sedang, perbatasan) berdasarkan margin relatif pada setiap penetapan klaster dan profil wilayah | `POST /api/cek-pola`, `GET /api/wilayah/{kode}` | Must |
| FR-11 | Menampilkan metodologi: model, data, metrik evaluasi, aturan keputusan, keterbatasan, standar PPH, dan status satuan | `GET /api/metodologi` | Must |
| FR-12 | Menyertakan catatan batas klaim pada setiap respons data dan menampilkannya di setiap halaman hasil | semua | Must |
| FR-13 | Menyediakan pemeriksaan kesehatan layanan: status, versi API, versi model, jumlah wilayah | `GET /api/health` | Must |
| FR-14 | Mengunduh hasil wilayah (daftar) sebagai CSV | tambahan | Could |
| FR-15 | Memilih tahun tampilan (2024 atau 2025) | tambahan | Could |

## 4. Kebutuhan non-fungsional

| ID | Kategori | Kebutuhan | Cara verifikasi |
|---|---|---|---|
| NFR-01 | Kinerja | Waktu respons < 500 ms untuk semua endpoint (lokal, 514 wilayah); `POST /api/cek-pola` < 200 ms | Uji waktu pada `TESTING.md` |
| NFR-02 | Keandalan | Artefak dimuat sekali saat server menyala; server menolak start dan memberi pesan jelas bila berkas hilang, kolom tidak lengkap, atau versi scikit-learn berbeda | Uji start gagal terkontrol |
| NFR-03 | Reprodusibilitas | Model yang dimuat menghasilkan label identik dengan pelatihan untuk seluruh 1.028 pengamatan | `train_model.py` (verifikasi) dan uji unit |
| NFR-04 | Kegunaan | Seluruh teks antarmuka berbahasa Indonesia; istilah "Cek Tipe Pola"; tidak memakai "prediksi", "rawan", atau "defisit gizi" | Tinjauan teks |
| NFR-05 | Keamanan | Semua masukan divalidasi di server; masukan pengguna tidak disimpan; mode debug nonaktif di luar lokal; CORS dibatasi ke origin yang diizinkan; tidak ada kredensial di repositori | Tinjauan kode dan uji |
| NFR-06 | Kompatibilitas | Chrome, Edge, dan Firefox versi terbaru; tampilan terbaca pada lebar ≥ 360 px | Uji manual |
| NFR-07 | Portabilitas | Dependensi dikunci; menjalankan cukup dengan `pip install` dan `npm install` | Uji pada mesin bersih |
| NFR-08 | Keterpeliharaan | Logika model dipisah dari routing; uji otomatis backend; konfigurasi lewat variabel lingkungan | Tinjauan struktur |
| NFR-09 | Transparansi | Metrik, aturan keputusan, dan keterbatasan dapat diakses dari antarmuka | FR-11 |
| NFR-10 | Privasi | Tidak memproses data pribadi | Tinjauan data |

## 5. Kebutuhan data

| Berkas | Isi | Rincian |
|---|---|---|
| `kmeans_pangan_model.pkl` | Scaler, K-Means, PCA, pemetaan label, nama tipe, median dan maksimum, metrik, versi pustaka | `DATA_DICTIONARY.md` |
| `cluster_wilayah.csv` | 1.028 baris (tahun × wilayah): tipe, gram 8 kelompok, PCA, silhouette | `DATA_DICTIONARY.md` |
| `komoditas_wilayah.csv` | 26.728 baris format long: 26 komoditas per pengamatan | `DATA_DICTIONARY.md` |
| `profil_klaster.csv` | 4 baris: profil tiap tipe | `DATA_DICTIONARY.md` |
| `standar_pph.csv` | 8 baris: standar PPH | `DATA_DICTIONARY.md` |
| `metadata_model.json` | Metrik, aturan keputusan, keterbatasan, versi pustaka | `DATA_DICTIONARY.md` |

Kunci kelompok pangan pada API memakai `snake_case`: `padi_padian`, `umbi_umbian`, `pangan_hewani`, `minyak_lemak`, `buah_biji_berminyak`, `kacang_kacangan`, `gula`, `sayur_buah`.

## 6. Antarmuka eksternal

- **API:** REST JSON, awalan `/api`, amplop respons seragam (`status`, `data`, `catatan`); kontrak lengkap di `API_CONTRACT.md`.
- **Antarmuka pengguna:** lima halaman (Beranda, Jelajah Wilayah, Peta Klaster, Cek Tipe Pola, Metodologi). Rancangan tampilan visual menyusul; konsep halaman ada di `DESIGN.md`.
- **Berkas:** artefak dibaca dari folder `artifacts/` (diatur lewat `SIPOKAN_ARTIFACT_DIR`).

## 7. Kriteria penerimaan

| Kebutuhan | Kriteria diterima |
|---|---|
| FR-01 sampai FR-13 | Setiap endpoint mengembalikan respons sesuai kontrak (kunci, tipe, kode status) untuk kasus normal dan kasus galat |
| FR-08, FR-09 | Masukan negatif, bukan angka, kunci tak dikenal, atau kurang dari 4 kelompok ditolak dengan kode 422 dan pesan per kolom |
| FR-10 | Wilayah dengan margin relatif < 0,10 ditandai "perbatasan" (contoh: Aceh Selatan 2025) |
| FR-12 | Setiap respons data memuat `catatan`; setiap halaman hasil menampilkan teks batas klaim |
| NFR-03 | 1.028 label hasil muat ulang sama dengan pelatihan |
| NFR-01 | 95% permintaan uji selesai < 500 ms (lokal) |

## 8. Matriks keterlacakan

| Kebutuhan | Endpoint | Halaman | Uji (`TESTING.md`) |
|---|---|---|---|
| FR-01 | `/api/ringkasan` | Beranda | API-02 |
| FR-02, FR-03 | `/api/provinsi`, `/api/wilayah` | Jelajah Wilayah | API-03, API-04 |
| FR-04, FR-05 | `/api/wilayah/{kode}` | Jelajah Wilayah | API-05, SVC-03 |
| FR-06 | `/api/wilayah/{kode}/mirip` | Jelajah Wilayah | API-06, SVC-04 |
| FR-07 | `/api/sebaran` | Peta Klaster | API-07 |
| FR-08, FR-09, FR-10 | `/api/cek-pola` | Cek Tipe Pola | API-08, API-09, SVC-05 |
| FR-11 | `/api/metodologi` | Metodologi | API-10 |
| FR-12 | semua | semua | API-11, UI-02 |
| FR-13 | `/api/health` | (internal) | API-01 |
| NFR-02 | — | — | SVC-01 |
| NFR-03 | — | — | SVC-02 |
