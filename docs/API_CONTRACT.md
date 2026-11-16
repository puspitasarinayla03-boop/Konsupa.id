# Kontrak API — konsupa.id

**Produk:** konsupa.id (*Sistem Informasi Pola Konsumsi Pangan*)  
**Versi API:** 1.0.0 (draf)  
**Acuan:** `PRD.md`, `SRS.md`, `DATA_DICTIONARY.md`

Dokumen ini mendefinisikan spesifikasi antarmuka pemrograman aplikasi (REST API) antara backend Flask dan frontend React pada sistem **konsupa.id**.

---

## 1. Konvensi Umum

### 1.1 Base URL & Format
* **Base URL:** `/api`
* **Format Payload:** `application/json` (UTF-8)
* **Kunci JSON:** Menggunakan `snake_case`.

### 1.2 Amplop Respons Seragam (*Uniform Response Envelope*)

#### Respons Sukses (HTTP 200, 201)
```json
{
  "status": "sukses",
  "data": { ... },
  "catatan": "Hasil menggambarkan pola konsumsi pangan wilayah, bukan penilaian kecukupan gizi atau kerawanan pangan."
}
```

#### Respons Galat (HTTP 4xx, 5xx)
```json
{
  "status": "galat",
  "pesan": "Penjelasan ringkas pesan galat untuk pengguna.",
  "rincian": {
    "bidang_bermasalah": "Pesan galat spesifik per kolom/properti"
  }
}
```

### 1.3 Kode Status HTTP

| Kode | Arti | Penggunaan |
|---|---|---|
| `200 OK` | Permintaan berhasil | Pengambilan data (GET) atau inferensi sukses (POST) |
| `400 Bad Request` | Permintaan tidak valid | Format JSON rusak atau query parameter tidak sesuai tipe |
| `404 Not Found` | Data tidak ditemukan | Kode wilayah tidak terdaftar pada dataset |
| `422 Unprocessable Entity` | Validasi gagal | Nilai negatif, kunci kelompok tidak dikenal, atau < 4 kelompok terisi |
| `500 Internal Server Error` | Galat internal server | Kesalahan tak terduga pada server |
| `503 Service Unavailable` | Layanan belum siap | Artefak model (`.pkl` atau `.csv`) belum dimuat atau hilang |

### 1.4 Standar 8 Kelompok Pangan (Fitur Utama Clustering)

Semua kunci kelompok pangan pada API menggunakan format *snake_case* berikut (satuan: **gram/kapita/hari**):

| Kunci API | Nama Kelompok Pangan | Standar PPH (g/hari) |
|---|---|---|
| `padi_padian` | Padi-padian | 275 |
| `umbi_umbian` | Umbi-umbian | 100 |
| `pangan_hewani` | Pangan hewani | 150 |
| `minyak_lemak` | Minyak dan lemak | 25 |
| `buah_biji_berminyak` | Buah / biji berminyak | 10 |
| `kacang_kacangan` | Kacang-kacangan | 35 |
| `gula` | Gula | 30 |
| `sayur_buah` | Sayur dan buah | 245 |
| **Total** | — | **870** |

---

## 2. Rincian Endpoint

### 2.1 Pemeriksaan Kesehatan Layanan (`GET /api/health`)
Memeriksa status hidup server, ketersediaan model, dan metadata dasar.

* **Metode:** `GET`
* **URL:** `/api/health`
* **Contoh Respons (200 OK):**
```json
{
  "status": "sukses",
  "data": {
    "layanan": "konsupa.id API",
    "versi_api": "1.0.0",
    "status_model": "aktif",
    "versi_model": "v1.0",
    "jumlah_wilayah": 514,
    "tahun_tersedia": [2024, 2025]
  }
}
```

---

### 2.2 Ringkasan 4 Tipe Klaster (`GET /api/ringkasan`)
Mengembalikan ringkasan profil makro untuk 4 tipe pola konsumsi (Screen Beranda).

* **Metode:** `GET`
* **URL:** `/api/ringkasan`
* **Contoh Respons (200 OK):**
```json
{
  "status": "sukses",
  "data": {
    "tahun_acuan": 2025,
    "total_wilayah": 514,
    "tipe": [
      {
        "id_tipe": 0,
        "nama": "Pola Pangan Umbi Tradisional",
        "jumlah_wilayah": 9,
        "persentase_wilayah": 1.5,
        "ciri_utama": "Konsumsi umbi-umbian sangat ekstrem dominan (812,07 g/hari), sayur dan buah tinggi (309,70 g/hari), padi-padian dan hewani terendah.",
        "profil_rata_rata": {
          "padi_padian": 120.03,
          "umbi_umbian": 812.07,
          "pangan_hewani": 58.18,
          "minyak_lemak": 23.16,
          "buah_biji_berminyak": 0.06,
          "kacang_kacangan": 6.66,
          "gula": 15.39,
          "sayur_buah": 309.70
        }
      },
      {
        "id_tipe": 1,
        "nama": "Pola Pangan Nabati & Serat Tinggi",
        "jumlah_wilayah": 194,
        "persentase_wilayah": 31.5,
        "ciri_utama": "Konsumsi kacang-kacangan tertinggi (31,71 g/hari), sayur dan buah tinggi (279,16 g/hari), konsumsi padi-padian tinggi.",
        "profil_rata_rata": {
          "padi_padian": 293.95,
          "umbi_umbian": 46.48,
          "pangan_hewani": 118.45,
          "minyak_lemak": 28.83,
          "buah_biji_berminyak": 3.14,
          "kacang_kacangan": 31.71,
          "gula": 20.88,
          "sayur_buah": 279.16
        }
      },
      {
        "id_tipe": 2,
        "nama": "Pola Pangan Beras-Sentris",
        "jumlah_wilayah": 175,
        "persentase_wilayah": 28.5,
        "ciri_utama": "Konsumsi padi-padian tertinggi (320,84 g/hari), buah/biji berminyak tertinggi (6,27 g/hari), asupan sayur dan umbi paling rendah.",
        "profil_rata_rata": {
          "padi_padian": 320.84,
          "umbi_umbian": 34.91,
          "pangan_hewani": 121.65,
          "minyak_lemak": 23.17,
          "buah_biji_berminyak": 6.27,
          "kacang_kacangan": 14.72,
          "gula": 19.05,
          "sayur_buah": 214.61
        }
      },
      {
        "id_tipe": 3,
        "nama": "Pola Pangan Hewani & Lemak Tinggi",
        "jumlah_wilayah": 237,
        "persentase_wilayah": 38.5,
        "ciri_utama": "Konsumsi pangan hewani tertinggi (156,93 g/hari melampaui PPH), minyak & lemak tertinggi (30,46 g/hari), gula tertinggi (24,55 g/hari).",
        "profil_rata_rata": {
          "padi_padian": 271.88,
          "umbi_umbian": 50.31,
          "pangan_hewani": 156.93,
          "minyak_lemak": 30.46,
          "buah_biji_berminyak": 3.42,
          "kacang_kacangan": 18.34,
          "gula": 24.55,
          "sayur_buah": 237.93
        }
      }
    ]
  },
  "catatan": "Klasifikasi tipe merupakan tipologi statistik (K-Means K=4), bukan acuan status gizi."
}
```

---

### 2.3 Daftar Provinsi (`GET /api/provinsi`)
Mengambil daftar seluruh provinsi untuk filter pada antarmuka.

* **Metode:** `GET`
* **URL:** `/api/provinsi`
* **Contoh Respons (200 OK):**
```json
{
  "status": "sukses",
  "data": [
    { "id_provinsi": "31", "nama_provinsi": "DKI Jakarta", "jumlah_wilayah": 6 },
    { "id_provinsi": "32", "nama_provinsi": "Jawa Barat", "jumlah_wilayah": 27 },
    { "id_provinsi": "33", "nama_provinsi": "Jawa Tengah", "jumlah_wilayah": 35 }
  ]
}
```

---

### 2.4 Eksplorasi & Filter Wilayah (`GET /api/wilayah`)
Mencari dan menyaring daftar 514 wilayah dengan filter dan paginasi.

* **Metode:** `GET`
* **URL:** `/api/wilayah`
* **Query Parameters:**
  * `cari` *(string, opsional)*: Pencarian nama wilayah (minimal 2 karakter).
  * `provinsi` *(string, opsional)*: Filter berdasarkan nama atau kode provinsi.
  * `tipe` *(int, opsional)*: Filter berdasarkan id klaster (0, 1, 2, 3).
  * `tahun` *(int, opsional)*: Tahun data acuan (default: `2025`).
  * `halaman` *(int, opsional)*: Nomor halaman paginasi (default: `1`).
  * `per_halaman` *(int, opsional)*: Jumlah data per halaman (default: `20`, maks: `100`).

* **Contoh Permintaan:**
  `GET /api/wilayah?provinsi=Jawa%20Barat&tipe=0&halaman=1&per_halaman=10`

* **Contoh Respons (200 OK):**
```json
{
  "status": "sukses",
  "data": {
    "total_data": 8,
    "halaman": 1,
    "per_halaman": 10,
    "total_halaman": 1,
    "daftar_wilayah": [
      {
        "kode_wilayah": "32.01",
        "nama_wilayah": "Kabupaten Bogor",
        "provinsi": "Jawa Barat",
        "id_tipe": 0,
        "nama_tipe": "Pola Pangan Umbi Tradisional",
        "status_perbatasan": false,
        "margin_relatif": 0.28
      }
    ]
  }
}
```

---

### 2.5 Profil Lengkap Wilayah (`GET /api/wilayah/{kode}`)
Menampilkan detail lengkap satu wilayah: tipe, 8 kelompok vs PPH, median nasional, penanda perbatasan, konsistensi 2024–2025, dan rincian 26 komoditas penyusun.

* **Metode:** `GET`
* **URL:** `/api/wilayah/{kode}` (contoh: `/api/wilayah/32.01` atau `/api/wilayah/kab-bogor`)
* **Query Parameters:**
  * `tahun` *(int, opsional)*: Tahun profil (default: `2025`).

* **Contoh Respons (200 OK):**
```json
{
  "status": "sukses",
  "data": {
    "identitas": {
      "kode_wilayah": "32.01",
      "nama_wilayah": "Kabupaten Bogor",
      "provinsi": "Jawa Barat",
      "tahun": 2025
    },
    "klaster": {
      "id_tipe_2025": 0,
      "nama_tipe_2025": "Pola Pangan Umbi Tradisional",
      "id_tipe_2024": 0,
      "konsistensi_antartahun": true,
      "jarak_ke_centroid": 1.42,
      "margin_relatif": 0.28,
      "status_perbatasan": false
    },
    "delapan_kelompok_pangan": [
      {
        "kelompok": "padi_padian",
        "nama_label": "Padi-padian",
        "konsumsi_gram": 290.5,
        "standar_pph": 275.0,
        "persen_pph": 105.6,
        "median_nasional": 280.0,
        "rasio_median": 1.04,
        "status": "di_atas_standar"
      },
      {
        "kelompok": "pangan_hewani",
        "nama_label": "Pangan Hewani",
        "konsumsi_gram": 125.0,
        "standar_pph": 150.0,
        "persen_pph": 83.3,
        "median_nasional": 115.0,
        "rasio_median": 1.09,
        "status": "di_bawah_standar"
      }
    ],
    "rincian_komoditas": [
      { "komoditas": "Beras", "kelompok": "padi_padian", "konsumsi": 270.0 },
      { "komoditas": "Jagung basah", "kelompok": "padi_padian", "konsumsi": 20.5 },
      { "komoditas": "Daging Ayam Ras", "kelompok": "pangan_hewani", "konsumsi": 45.0 },
      { "komoditas": "Telur Ayam Ras", "kelompok": "pangan_hewani", "konsumsi": 38.0 },
      { "komoditas": "Ikan Segar", "kelompok": "pangan_hewani", "konsumsi": 42.0 }
    ]
  },
  "catatan": "Kesenjangan terhadap PPH dihitung berbasis gram; gunakan sebagai hipotesis kebijakan."
}
```

* **Kasus Galat (404 Not Found):**
```json
{
  "status": "galat",
  "pesan": "Wilayah dengan kode '99.99' tidak ditemukan."
}
```

---

### 2.6 Pencarian Wilayah Serupa (`GET /api/wilayah/{kode}/mirip`)
Menampilkan 1 sampai 20 wilayah terdekat (default: 5) berdasarkan jarak Euclidean dalam ruang 8 kelompok pangan standar.

* **Metode:** `GET`
* **URL:** `/api/wilayah/{kode}/mirip`
* **Query Parameters:**
  * `k` *(int, opsional)*: Jumlah wilayah mirip yang dicari (default: `5`, maks: `20`).
  * `lintas_provinsi` *(bool, opsional)*: Apakah mencakup luar provinsi (default: `true`).

* **Contoh Respons (200 OK):**
```json
{
  "status": "sukses",
  "data": {
    "wilayah_acuan": "Kabupaten Bogor",
    "id_tipe": 0,
    "wilayah_serupa": [
      {
        "peringkat": 1,
        "kode_wilayah": "32.07",
        "nama_wilayah": "Kabupaten Ciamis",
        "provinsi": "Jawa Barat",
        "jarak_euclidean": 0.34
      },
      {
        "peringkat": 2,
        "kode_wilayah": "33.02",
        "nama_wilayah": "Kabupaten Banyumas",
        "provinsi": "Jawa Tengah",
        "jarak_euclidean": 0.41
      }
    ]
  }
}
```

---

### 2.7 Koordinat Sebaran PCA (`GET /api/sebaran`)
Menyediakan koordinat 2 dimensi hasil Principal Component Analysis (PCA) untuk grafik sebar (Scatter Plot) seluruh wilayah.

* **Metode:** `GET`
* **URL:** `/api/sebaran`
* **Query Parameters:**
  * `tipe` *(int, opsional)*: Filter klaster tertentu (0–3).
  * `provinsi` *(string, opsional)*: Filter provinsi.
  * `tahun` *(int, opsional)*: Tahun data (default: `2025`).

* **Contoh Respons (200 OK):**
```json
{
  "status": "sukses",
  "data": {
    "varians_dijelaskan": {
      "pc1": 0.384,
      "pc2": 0.215,
      "total_kumulatif": 0.599
    },
    "titik_sebaran": [
      {
        "kode_wilayah": "32.01",
        "nama_wilayah": "Kabupaten Bogor",
        "id_tipe": 0,
        "pca1": -1.245,
        "pca2": 0.432
      },
      {
        "kode_wilayah": "31.71",
        "nama_wilayah": "Kota Jakarta Selatan",
        "id_tipe": 1,
        "pca1": 2.150,
        "pca2": -0.871
      }
    ]
  },
  "catatan": "Grafik PCA mereduksi 8 dimensi ke 2 dimensi; overlap titik di perbatasan adalah karakteristik wajar pada sebaran kontinu."
}
```

---

### 2.8 Cek Tipe Pola / Cluster Assignment (`POST /api/cek-pola`)
Menetapkan klaster terdekat untuk vektor konsumsi baru yang diinputkan pengguna.

* **Metode:** `POST`
* **URL:** `/api/cek-pola`
* **Headers:** `Content-Type: application/json`

* **Aturan Validasi Masukan (FR-09):**
  1. Nilai harus berupa angka numerik $\ge 0$.
  2. Minimal 4 dari 8 kelompok pangan harus terisi.
  3. Kelompok yang dikosongkan (`null` atau tidak disertakan) otomatis diisi nilai **median nasional 2025**.
  4. Bila ada nilai $> 3 \times$ maksimum data nasional, respons mengembalikan penetapan disertai penanda `peringatan_outlier`.
  5. Jika terdapat nilai negatif atau bukan angka $\rightarrow$ kembalikan `422 Unprocessable Entity`.

* **Contoh Body Permintaan:**
```json
{
  "input": {
    "padi_padian": 320.0,
    "umbi_umbian": 50.0,
    "pangan_hewani": 100.0,
    "minyak_lemak": 25.0,
    "buah_biji_berminyak": 8.0,
    "kacang_kacangan": 30.0,
    "gula": 20.0,
    "sayur_buah": 250.0
  }
}
```

* **Contoh Respons (200 OK):**
```json
{
  "status": "sukses",
  "data": {
    "hasil_penetapan": {
      "id_tipe": 0,
      "nama_tipe": "Pola Pangan Umbi Tradisional",
      "jarak_ke_centroid_terpilih": 0.85,
      "tingkat_keyakinan": "tegas",
      "status_perbatasan": false,
      "margin_relatif": 0.32
    },
    "jarak_semua_centroid": {
      "0": 0.85,
      "1": 2.45,
      "2": 1.25,
      "3": 3.10
    },
    "selisih_terhadap_pusat": {
      "padi_padian": 9.8,
      "sayur_buah": -15.0
    },
    "wilayah_serupa": [
      { "nama_wilayah": "Kabupaten Ciamis", "provinsi": "Jawa Barat", "id_tipe": 0 },
      { "nama_wilayah": "Kabupaten Banyumas", "provinsi": "Jawa Tengah", "id_tipe": 0 }
    ],
    "peringatan": []
  },
  "catatan": "Hasil ini menetapkan jarak terdekat ke pusat klaster (cluster assignment), bukan meramalkan kondisi pangan masa depan."
}
```

* **Contoh Respons Gagal Validasi (422 Unprocessable Entity):**
```json
{
  "status": "galat",
  "pesan": "Validasi input gagal. Periksa kembali angka yang dimasukkan.",
  "rincian": {
    "pangan_hewani": "Nilai konsumsi tidak boleh negatif (-10).",
    "minimal_kolom": "Minimal 4 kelompok pangan harus terisi (hanya 2 yang terisi)."
  }
}
```

---

### 2.9 Metodologi & Transparansi (`GET /api/metodologi`)
Mengambil metrik evaluasi model, aturan penentuan perbatasan, dan keterbatasan algoritma.

* **Metode:** `GET`
* **URL:** `/api/metodologi`
* **Contoh Respons (200 OK):**
```json
{
  "status": "sukses",
  "data": {
    "model": {
      "algoritma": "K-Means",
      "pustaka": "scikit-learn 1.5.2",
      "jumlah_klaster_k": 4,
      "metode_skala": "StandardScaler (mean=0, std=1)"
    },
    "metrik_evaluasi": {
      "silhouette_score": 0.174,
      "davies_bouldin_index": 1.48,
      "calinski_harabasz_index": 210.5
    },
    "aturan_keputusan": {
      "ambang_perbatasan_margin_relatif": 0.10,
      "penjelasan": "Jika selisih jarak ke klaster ke-1 dan ke-2 < 10% dari jarak klaster ke-2, data ditandai sebagai zona perbatasan."
    },
    "standar_pph": {
      "edisi": "AKE 2.000 kkal (BKP Kementan 2013)",
      "total_target_gram": 870
    },
    "batas_klaim": [
      "Model mengelompokkan pola konsumsi, bukan status kerawanan pangan atau kelaparan.",
      "Struktur klaster bergradasi wajar; wilayah perbatasan tidak boleh diperlakukan kaku.",
      "Gula dan minyak adalah batas atas toleransi konsumsi, bukan target minimum yang harus dinaikkan."
    ]
  }
}
```

---

## 3. Matriks Keselarasan Endpoint terhadap Kebutuhan SRS

| Endpoint | Prioritas | Memenuhi SRS | Halaman Frontend |
|---|---|---|---|
| `GET /api/health` | Must | FR-13 | System / Dev |
| `GET /api/ringkasan` | Must | FR-01 | Beranda |
| `GET /api/provinsi` | Must | FR-02 | Jelajah Wilayah |
| `GET /api/wilayah` | Must | FR-03 | Jelajah Wilayah / Eksplorasi |
| `GET /api/wilayah/{kode}` | Must | FR-04, FR-05 | Jelajah Wilayah |
| `GET /api/wilayah/{kode}/mirip` | Must | FR-06 | Jelajah Wilayah |
| `GET /api/sebaran` | Should | FR-07 | Peta Klaster (PCA) |
| `POST /api/cek-pola` | Must | FR-08, FR-09, FR-10 | Cek Tipe Pola |
| `GET /api/metodologi` | Must | FR-11, FR-12 | Metodologi |
