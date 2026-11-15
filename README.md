# SIPOKAN – Sistem Informasi Pangan dan Klasterisasi

Aplikasi web untuk analisis klasterisasi ketahanan pangan 514 wilayah Indonesia
menggunakan K-Means clustering terhadap 26 komoditas pangan.

---

## Struktur Proyek

```
SIPOKAN/
├── backend/
│   ├── app.py              # REST API Flask (routing & validasi)
│   ├── model_service.py    # logika model: load, predict, cari wilayah mirip
│   ├── artifacts/          # ← upload file model & data di sini
│   │   ├── kmeans_pangan_model.pkl
│   │   ├── cluster_wilayah.csv
│   │   ├── komoditas_wilayah.csv
│   │   ├── profil_klaster.csv
│   │   └── standar_pph.csv
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── api.js
    │   ├── components/
    │   │   ├── Beranda.jsx
    │   │   ├── Prediksi.jsx
    │   │   ├── Eksplorasi.jsx
    │   │   └── StandarPPH.jsx
    │   ├── App.css / index.css
    │   └── main.jsx
    ├── index.html
    ├── package.json
    └── vite.config.js
```

---

## Setup & Menjalankan

### 1. Upload Artefak Model

Salin file berikut ke `backend/artifacts/`:
- `kmeans_pangan_model.pkl`
- `cluster_wilayah.csv`
- `komoditas_wilayah.csv`
- `profil_klaster.csv`
- `standar_pph.csv`

### Format `kmeans_pangan_model.pkl`

File pkl harus berisi dict dengan key:
```python
{
    "scaler":          StandardScaler,       # sklearn scaler yang sudah di-fit
    "kmeans":          KMeans,               # model KMeans yang sudah di-fit
    "features":        ["fitur1", ...],      # list nama kolom fitur (urutan harus konsisten)
    "cluster_names":   {0: "Klaster A ...", 1: ...},  # peta id → nama deskriptif
    "sklearn_version": "1.5.2"               # versi sklearn saat training
}
```

Simpan dengan:
```python
import joblib
joblib.dump(bundle, "artifacts/kmeans_pangan_model.pkl")
```

### 2. Backend (Flask)

```bash
cd backend

# Buat virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Jalankan server
python app.py
# API berjalan di http://localhost:5000
```

### 3. Frontend (React + Vite)

```bash
cd frontend
pnpm install      # atau npm install
pnpm dev          # atau npm run dev
# Buka http://localhost:5173
```

Vite akan mem-proxy semua request `/api/*` ke `http://localhost:5000`.

---

## API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/health` | Liveness check |
| GET | `/api/features` | Daftar fitur model |
| GET | `/api/cluster-names` | Peta cluster_id → nama |
| POST | `/api/predict` | Prediksi klaster + wilayah mirip |
| GET | `/api/wilayah` | Semua 514 wilayah |
| GET | `/api/wilayah/<nama>/komoditas` | Detail komoditas satu wilayah |
| GET | `/api/klaster/<id>/profil` | Profil rata-rata klaster |
| GET | `/api/klaster/<id>/wilayah` | Wilayah dalam klaster |
| GET | `/api/standar-pph` | Standar PPH |
| POST | `/api/reload` | Reload artefak (dev only) |

### Contoh Request Prediksi

```json
POST /api/predict
{
  "input": {
    "padi": 150.5,
    "jagung": 20.3,
    "... (26 fitur)": 0.0
  },
  "exclude_wilayah": "Kab. Bogor",
  "top_n": 5
}
```

---

## Halaman Frontend

| Halaman | Deskripsi |
|---------|-----------|
| **Beranda** | Landing page dengan ringkasan fitur |
| **Prediksi** | Form input data pangan → prediksi klaster + wilayah mirip |
| **Eksplorasi** | Tabel 514 wilayah dengan filter klaster & search |
| **Standar PPH** | Tabel referensi standar Pola Pangan Harapan |
