# konsupa.id — Sistem Informasi Pola Konsumsi Pangan Indonesia

Aplikasi web untuk menganalisis, memetakan, dan menjelajahi pola konsumsi pangan di **514 Kabupaten/Kota Indonesia** berbasis **8 kelompok pangan utama (standar Pola Pangan Harapan / PPH Bapanas)** serta rincian **26 jenis komoditas** Susenas BPS 2024–2025.

---

## Fitur & Arsitektur 2 Halaman

1. **Sebaran & Jelajah Wilayah** *(Halaman Utama)*
   - **Peta Klaster (PCA 2D):** Visualisasi grafik sebar interaktif 514 wilayah berdasarkan 4 tipe pola konsumsi, filter per klaster & provinsi, sorotan titik perbatasan, serta ringkasan profil tiap klaster.
   - **Jelajah Wilayah *(scroll ke bawah atau klik titik di peta)*:** Pencarian kabupaten/kota lintas provinsi, perbandingan 8 kelompok pangan terhadap standar PPH Bapanas (tabel & grafik), rincian 26 komoditas penyusun, dan 5 wilayah paling mirip berbasis jarak Euclidean.
2. **Cek Tipe Pola**
   - Simulasi interaktif dengan input 8 kelompok pangan (gram/kapita/hari), validasi real-time (minimal 4 kelompok terisi, tidak boleh negatif, tidak boleh bernilai 0 semua, batas atas wajar), imputasi median otomatis, serta klasifikasi klaster terdekat (*cluster assignment*) beserta deviasi terhadap centroid.

---

## Struktur Proyek

```text
konsupa.id/
├── backend/
│   ├── app.py                   # REST API Flask (routing & validasi input)
│   ├── model_service.py         # Logika model: muat artefak, prediksi (KMeans/GMM), wilayah mirip
│   ├── artifacts/
│   │   ├── kmeans_pangan_model.pkl
│   │   ├── model_metadata.json
│   │   ├── cluster_wilayah.csv
│   │   ├── komoditas_wilayah.csv
│   │   ├── profil_klaster.csv
│   │   └── standar_pph.csv
│   └── requirements.txt
├── frontend/
│   ├── public/
│   │   ├── logo.png             # Logo resmi konsupa.id
│   │   └── maskot.png           # Maskot Si Supa
│   ├── src/
│   │   ├── App.jsx              # Layout 2 halaman (header & footer Bapanas theme)
│   │   ├── api.js               # Klien HTTP API (/api/*)
│   │   ├── data/                # Data preloaded JSON 514 wilayah & komoditas
│   │   ├── components/
│   │   │   ├── PetaKlaster.jsx      # Visualisasi PCA 2D & profil klaster
│   │   │   ├── JelajahWilayah.jsx   # Profil PPH, 26 komoditas & wilayah mirip
│   │   │   └── CekTipePola.jsx      # Simulasi & prediksi tipe pola konsumsi
│   │   ├── App.css / index.css  # Gaya Claymorphism bertema Bapanas
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── docs/                        # Dokumentasi proyek, logo, dan maskot
└── jalankan_konsupa.bat         # Skrip cepat menjalankan backend & frontend (Windows)
```

---

## Cara Menjalankan

### Cara Cepat (Windows)
Klik ganda berkas `jalankan_konsupa.bat` di folder utama proyek untuk menjalankan Backend Flask (port `5000`) dan Frontend Vite (port `5173`) secara bersamaan, lalu buka `http://localhost:5173`.

### Cara Manual

#### 1. Backend (Flask)
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows (Linux/Mac: source .venv/bin/activate)
pip install -r requirements.txt
python app.py                   # API berjalan di http://localhost:5000
```

#### 2. Frontend (React + Vite)
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
| `GET` | `/api/features` | Daftar 8 fitur kelompok pangan model |
| `GET` | `/api/cluster-names` | Peta `cluster_id` → nama klaster resmi |
| `POST` | `/api/predict` | Prediksi klaster + jarak ke pusat klaster + wilayah mirip |
| `GET` | `/api/wilayah` | Daftar seluruh 514 wilayah |
| `GET` | `/api/wilayah/<nama>/komoditas` | Detail 26 komoditas satu wilayah |
| `GET` | `/api/klaster/<id>/profil` | Profil rata-rata klaster |
| `GET` | `/api/klaster/<id>/wilayah` | Daftar wilayah dalam klaster tertentu |
| `GET` | `/api/standar-pph` | Tabel standar Pola Pangan Harapan (PPH) |
| `POST` | `/api/reload` | Reload artefak model (dev only) |
