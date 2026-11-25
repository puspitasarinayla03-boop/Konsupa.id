# konsupa.id — Sistem Informasi Pola Konsumsi Pangan Indonesia

Aplikasi web untuk menganalisis, memetakan, dan menjelajahi pola konsumsi pangan di **514 Kabupaten/Kota Indonesia** berbasis **8 kelompok pangan utama (standar Pola Pangan Harapan / PPH Bapanas)** serta rincian **26 jenis komoditas** Susenas BPS (data aktif Tahun 2025).

---

## Fitur & Arsitektur 2 Layar (Screen)

Aplikasi tetap menggunakan **2 layar utama** pada navigasi atas:

1. **Sebaran & Jelajah Wilayah** *(Layar Utama)*
   - **Peta Sebaran Pola Konsumsi Pangan:** Visualisasi interaktif 514 kabupaten/kota berdasarkan 4 tipe pola konsumsi pangan, filter per tipe pola & provinsi, sorotan wilayah pola konsumsi campuran, serta ringkasan karakteristik tiap tipe pola.
   - **Jelajah Wilayah *(scroll ke bawah atau klik titik di peta)*:** Pencarian kabupaten/kota lintas provinsi, perbandingan 8 kelompok pangan terhadap standar PPH Bapanas (tabel & grafik), rincian 26 komoditas penyusun, status kesesuaian pola, dan 5 wilayah dengan profil konsumsi paling mirip.
2. **Cek Tipe Pola** *(Layar Simulasi)*
   - **Form Input Pop-up (Modal):** Input 8 kelompok pangan (gram/kapita/hari) dengan validasi real-time (minimal 4 kelompok terisi, tidak boleh negatif, tidak boleh bernilai 0 semua) serta pengisian otomatis rata-rata nasional untuk kolom kosong.
   - **Layar Hasil:** Setelah form disubmit, pop-up tertutup dan menampilkan tipe pola konsumsi yang paling sesuai, tingkat kesesuaian terhadap ke-4 tipe pola pangan, indikator pola campuran (bila ada), ringkasan input, dan perbandingan terhadap rata-rata nasional.

---

## 4 Tipe Pola Konsumsi Pangan (GMM)

| Tipe | Nama Pola |
|---|---|
| `0` | **Pola Beras/Serealia Tinggi** |
| `1` | **Pola Kacang-kacangan & Sayur-Buah Tinggi** |
| `2` | **Pola Umbi-umbian Tinggi** |
| `3` | **Pola Hewani & Minyak-Lemak Tinggi** |

---

## Struktur Proyek

```text
konsupa.id/
├── backend/
│   ├── app.py                        # REST API Flask (routing & validasi input)
│   ├── model_service.py              # Inferensi GMM + transformasi Yeo-Johnson & wilayah mirip
│   ├── artifacts/
│   │   ├── gmm_pangan_bundle.pkl     # Bundle model GMM, PowerTransformer (Yeo-Johnson), fitur, cluster_names & PPH
│   │   ├── hasil_clustering_gmm.csv  # Hasil clustering wilayah (difilter Tahun == 2025 untuk 514 kab/kota)
│   │   └── komoditas_wilayah.csv     # Rincian 26 komoditas per wilayah
│   └── requirements.txt
├── frontend/
│   ├── public/
│   │   ├── logo.png                  # Logo resmi konsupa.id
│   │   └── maskot.png                # Maskot Si Supa
│   ├── src/
│   │   ├── App.jsx                   # Layout 2 layar (header & footer bertema Bapanas)
│   │   ├── api.js                    # Klien HTTP API (/api/*)
│   │   ├── clusterConfig.js          # Konfigurasi nama, deskripsi, dan warna 4 tipe pola pangan
│   │   ├── data/                     # Data preloaded JSON 514 wilayah (2025) & komoditas
│   │   ├── components/
│   │   │   ├── PetaKlaster.jsx       # Peta sebaran 514 wilayah & ringkasan 4 tipe pola
│   │   │   ├── JelajahWilayah.jsx    # Profil PPH, 26 komoditas & wilayah mirip
│   │   │   └── CekTipePola.jsx       # Pop-up form input 8 pangan & layar hasil tipe pola
│   │   ├── App.css / index.css       # Gaya tampilan bertema Bapanas
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── docs/                             # Dokumentasi proyek, logo, dan maskot
```

---

## Cara Menjalankan

### 1. Backend (Flask)
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows (Linux/Mac: source .venv/bin/activate)
pip install -r requirements.txt
python app.py                   # API berjalan di http://localhost:5000
```

### 2. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev                     # Aplikasi berjalan di http://localhost:5173
```

Vite otomatis mem-proxy seluruh request `/api/*` ke `http://localhost:5000`.

---

## API Endpoints

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/health` | Liveness check |
| `GET` | `/api/features` | Daftar & urutan 8 fitur kelompok pangan model GMM |
| `GET` | `/api/cluster-names` | Peta `cluster_id` → nama pola konsumsi |
| `POST` | `/api/predict` | Prediksi klaster GMM, distribusi probabilitas 4 klaster (`%`), `prob_max`, flag transisi, & wilayah mirip |
| `GET` | `/api/wilayah` | Daftar seluruh 514 wilayah (Tahun 2025) beserta klaster & `Prob_Max` |
| `GET` | `/api/wilayah/<nama>/komoditas` | Detail 26 komoditas satu wilayah (Tahun 2025) |
| `GET` | `/api/klaster/<id>/profil` | Profil rata-rata konsumsi tiap klaster |
| `GET` | `/api/klaster/<id>/wilayah` | Daftar wilayah dalam klaster tertentu |
| `GET` | `/api/standar-pph` | Standar Pola Pangan Harapan (PPH) dari bundle model |
| `POST` | `/api/reload` | Reload artefak model (dev only) |
