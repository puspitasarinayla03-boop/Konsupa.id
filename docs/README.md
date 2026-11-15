# SIPOKAN — Sistem Informasi Pola Konsumsi Pangan

> Nama kerja. Nama final belum diputuskan (lihat `docs/DECISIONS.md`, bagian keputusan terbuka).

Aplikasi web untuk **memahami dan membandingkan pola konsumsi pangan 514 kabupaten/kota di Indonesia**. Sistem mengelompokkan wilayah ke 4 tipe pola konsumsi (K-Means), menjelaskan tiap wilayah terhadap standar Pola Pangan Harapan (PPH), mencari wilayah yang mirip, dan menetapkan tipe pola untuk data konsumsi baru yang dimasukkan pengguna.

**Status dokumen:** draf 0.1 (perancangan). Kode backend dan frontend belum ditulis.

## Batas klaim (wajib dibaca)

- Hasil sistem menggambarkan **pola konsumsi**, bukan kecukupan gizi, kerawanan pangan, atau kebutuhan bantuan.
- Sistem **tidak meramal** kondisi masa depan. Fitur "Cek Tipe Pola" hanya menetapkan klaster terdekat (*cluster assignment*).
- Struktur klaster lemah (silhouette ≈ 0,17). Tiga tipe utama bergradasi dan saling tumpang tindih; gunakan sebagai pengelompokan awal, bukan batas tegas.
- Perbandingan dengan standar PPH adalah **hipotesis** yang perlu diverifikasi dengan data gizi dan ekonomi.

## Fitur

| Halaman | Fungsi |
|---|---|
| Beranda | Ringkasan 4 tipe pola |
| Jelajah Wilayah | Profil wilayah: tipe, 8 kelompok pangan vs standar PPH, rincian komoditas, 5 wilayah mirip |
| Peta Klaster | Grafik sebar 2 dimensi (PCA) berwarna per tipe |
| Cek Tipe Pola | Masukan 8 angka konsumsi → tipe pola, jarak, dan tingkat keyakinan |
| Metodologi | Metrik evaluasi, keterbatasan, dan sumber standar |

## Stack

Flask (REST API) + React 19 + Vite, mengikuti struktur praktikum. Model scikit-learn disimpan sebagai berkas `.pkl`. Tanpa database server.

## Struktur repositori

```
Clustering-Pangan-2026/
├── backend/
│   ├── app.py                        # REST API Flask (routing dan validasi)
│   ├── model_service.py              # logika model (muat artefak, klaster, wilayah mirip)
│   ├── artifacts/
│   │   ├── kmeans_pangan_model.pkl
│   │   ├── cluster_wilayah.csv
│   │   ├── komoditas_wilayah.csv
│   │   ├── profil_klaster.csv
│   │   └── standar_pph.csv
│   ├── tests/
│   └── requirements.txt
├── frontend/
│   ├── src/ (App.jsx, api.js, components/, main.jsx, App.css, index.css)
│   ├── package.json
│   └── vite.config.js
└── docs/                             # dokumen di folder ini
```

## Cara menjalankan (setelah kode tersedia)

```bash
# Backend (terminal 1)
cd backend
python -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python app.py                                          # http://localhost:5000

# Frontend (terminal 2)
cd frontend
npm install
npm run dev                                            # http://localhost:5173 (proxy /api ke :5000)
```

Bila port 5000 bentrok (mis. macOS), jalankan backend di port 5001 dan sesuaikan proxy di `vite.config.js`.

## Daftar dokumen

| Dokumen | Isi |
|---|---|
| [`docs/PRD.md`](docs/PRD.md) | Kebutuhan produk: masalah, pengguna, lingkup, user story, metrik |
| [`docs/SRS.md`](docs/SRS.md) | Spesifikasi kebutuhan perangkat lunak: FR, NFR, keterlacakan |
| [`docs/STACK.md`](docs/STACK.md) | Teknologi, versi, perintah, alasan pemilihan |
| [`docs/DESIGN.md`](docs/DESIGN.md) | Arsitektur, desain modul, alur, penanganan error |
| [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md) | Kontrak API: endpoint, JSON permintaan dan respons, kode error |
| [`docs/DATA_DICTIONARY.md`](docs/DATA_DICTIONARY.md) | Kamus artefak data dan isi berkas model |
| [`docs/MODEL_CARD.md`](docs/MODEL_CARD.md) | Ringkasan model, metrik, dan keterbatasan |
| [`docs/TESTING.md`](docs/TESTING.md) | Rencana pengujian dan kriteria penerimaan |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Log keputusan dan daftar keputusan terbuka |

## Tim dan peran (usulan)

| Anggota | Bagian |
|---|---|
| Nayla | `model_service.py`, ekspor artefak model, uji kesetaraan dengan notebook |
| Zilfa | Berkas data di `artifacts/`, `app.py` (endpoint dan validasi), uji endpoint |
| Adinda | Frontend (setelah rancangan tampilan disepakati) |

Pembagian ini usulan; sesuaikan dengan kesepakatan tim.
