"""
model_service.py
~~~~~~~~~~~~~~~~
Semua logika bisnis model K-Means pangan:
- Memuat artefak (pkl + csv) sekali saat startup
- Menentukan klaster untuk input data baru
- Mencari wilayah-wilayah dengan profil mirip
- Mengembalikan rincian komoditas & profil klaster
"""

import os
import joblib
import pandas as pd
import numpy as np
from pathlib import Path

ARTIFACTS_DIR = Path(__file__).parent / "artifacts"

# ---------------------------------------------------------------------------
# Singleton: artefak dimuat sekali
# ---------------------------------------------------------------------------
_model_bundle   = None   # dict: scaler, kmeans, features, cluster_names, sklearn_version
_df_wilayah     = None   # DataFrame: cluster_wilayah.csv
_df_komoditas   = None   # DataFrame: komoditas_wilayah.csv
_df_profil      = None   # DataFrame: profil_klaster.csv
_df_standar     = None   # DataFrame: standar_pph.csv


def _load_artifacts():
    """Muat semua artefak ke memori (dipanggil sekali)."""
    global _model_bundle, _df_wilayah, _df_komoditas, _df_profil, _df_standar

    model_path = ARTIFACTS_DIR / "kmeans_pangan_model.pkl"
    if not model_path.exists():
        raise FileNotFoundError(
            f"Model belum ditemukan di {model_path}. "
            "Silakan upload kmeans_pangan_model.pkl ke folder artifacts/."
        )

    _model_bundle = joblib.load(model_path)

    _df_wilayah   = pd.read_csv(ARTIFACTS_DIR / "cluster_wilayah.csv")
    _df_komoditas = pd.read_csv(ARTIFACTS_DIR / "komoditas_wilayah.csv")
    _df_profil    = pd.read_csv(ARTIFACTS_DIR / "profil_klaster.csv")
    _df_standar   = pd.read_csv(ARTIFACTS_DIR / "standar_pph.csv")


def _ensure_loaded():
    if _model_bundle is None:
        _load_artifacts()


# ---------------------------------------------------------------------------
# Ekspektasi isi model_bundle (pkl):
#   {
#     "scaler":         StandardScaler,
#     "kmeans":         KMeans,
#     "features":       list[str],        # nama kolom fitur (urutan harus sama)
#     "cluster_names":  dict[int, str],   # {0: "Klaster A - ...", 1: ...}
#     "sklearn_version": str
#   }
# ---------------------------------------------------------------------------

DEFAULT_CLUSTER_NAMES = {
    0: "Pola Pangan Umbi Tradisional",
    1: "Pola Pangan Nabati & Serat Tinggi",
    2: "Pola Pangan Beras-Sentris",
    3: "Pola Pangan Hewani & Lemak Tinggi",
}

DEFAULT_MEDIANS = {
    "padi-padian": 289.0,
    "umbi-umbian": 38.4,
    "pangan hewani": 132.3,
    "minyak dan lemak": 28.0,
    "buah/biji berminyak": 2.7,
    "kacang-kacangan": 20.3,
    "gula": 21.6,
    "sayur dan buah": 242.4,
}


def get_features() -> list:
    """Kembalikan daftar fitur yang dipakai model."""
    _ensure_loaded()
    return _model_bundle.get("fitur") or _model_bundle.get("features", [
        "padi-padian", "umbi-umbian", "pangan hewani", "minyak dan lemak",
        "buah/biji berminyak", "kacang-kacangan", "gula", "sayur dan buah"
    ])


def get_cluster_names() -> dict:
    """Kembalikan peta {cluster_id: nama_klaster}."""
    try:
        _ensure_loaded()
        return _model_bundle.get("cluster_names") or _model_bundle.get("nama_klaster", DEFAULT_CLUSTER_NAMES)
    except FileNotFoundError:
        return DEFAULT_CLUSTER_NAMES


def predict_cluster(input_values: dict) -> dict:
    """
    Tentukan klaster untuk satu record input dengan validasi komprehensif.

    Validasi yang diterapkan:
    1. Input harus bertipe dictionary.
    2. Minimal 4 kelompok pangan harus diisi.
    3. Nilai konsumsi harus numerik, non-negatif (>= 0), dan tidak melebihi batas wajar (<= 5000 g/hari).
    4. Fitur yang kosong otomatis diisi nilai median nasional Susenas.

    Parameters
    ----------
    input_values : dict
        Pasangan {nama_fitur: nilai_float}.

    Returns
    -------
    dict berisi:
        cluster_id       : int
        cluster_name     : str
        distances        : dict {cluster_id: jarak_ke_centroid}
        confidence       : str
        margin           : float
        is_border        : bool
        imputed_features : dict
    """
    _ensure_loaded()

    if not isinstance(input_values, dict):
        raise ValueError("Parameter input harus berupa dictionary pasangan nama fitur dan nilai numerik.")

    features      = _model_bundle.get("fitur") or _model_bundle.get("features", [
        "padi-padian", "umbi-umbian", "pangan hewani", "minyak dan lemak",
        "buah/biji berminyak", "kacang-kacangan", "gula", "sayur dan buah"
    ])
    scaler        = _model_bundle["scaler"]
    kmeans        = _model_bundle.get("model") or _model_bundle.get("kmeans")
    cluster_names = _model_bundle.get("cluster_names") or _model_bundle.get("nama_klaster", DEFAULT_CLUSTER_NAMES)

    # 1. Validasi & parsing nilai
    parsed_values = {}
    imputed_features = {}
    invalid_errors = []

    for f in features:
        raw_val = input_values.get(f)
        if raw_val is not None and str(raw_val).strip() != "":
            try:
                num = float(raw_val)
                if num < 0:
                    invalid_errors.append(f"Fitur '{f}' tidak boleh bernilai negatif ({num}).")
                elif num > 5000:
                    invalid_errors.append(f"Fitur '{f}' ({num} g) melebihi batas konsumsi realistis (>5000 g/hari).")
                else:
                    parsed_values[f] = num
            except (ValueError, TypeError):
                invalid_errors.append(f"Nilai untuk fitur '{f}' ('{raw_val}') bukan angka yang valid.")

    if invalid_errors:
        raise ValueError(" | ".join(invalid_errors))

    # 2. Syarat minimal 4 fitur terisi
    if len(parsed_values) < 4:
        raise ValueError(
            f"Minimal 4 kelompok pangan harus diisi untuk menghasilkan klasifikasi yang valid "
            f"(saat ini hanya terisi {len(parsed_values)} kelompok pangan)."
        )

    # 3. Imputasi nilai median untuk fitur yang belum diisi
    for f in features:
        if f not in parsed_values:
            med = None
            if _df_wilayah is not None and f in _df_wilayah.columns:
                med = float(_df_wilayah[f].median())
            if med is None or np.isnan(med):
                med = DEFAULT_MEDIANS.get(f, 50.0)
            parsed_values[f] = med
            imputed_features[f] = round(med, 1)

    # 4. Standardisasi dan Prediksi
    X_df = pd.DataFrame([[float(parsed_values[f]) for f in features]], columns=features)
    X_scaled = scaler.transform(X_df)

    cluster_id = int(kmeans.predict(X_scaled)[0])
    cluster_name = cluster_names.get(cluster_id, f"Klaster {cluster_id}")

    # 5. Hitung jarak ke setiap centroid & margin keyakinan
    centroids = kmeans.cluster_centers_
    distances = {
        int(i): round(float(np.linalg.norm(X_scaled - centroids[i])), 2)
        for i in range(len(centroids))
    }

    sorted_dists = sorted(distances.values())
    margin = round(sorted_dists[1] - sorted_dists[0], 2) if len(sorted_dists) > 1 else 1.0
    is_border = margin < 0.10

    if margin >= 0.35:
        confidence = "Sangat Tinggi"
    elif margin >= 0.20:
        confidence = "Tinggi"
    elif margin >= 0.10:
        confidence = "Sedang"
    else:
        confidence = "Perbatasan (Tipis)"

    return {
        "cluster_id": cluster_id,
        "cluster_name": cluster_name,
        "distances": distances,
        "confidence": confidence,
        "margin": margin,
        "is_border": is_border,
        "imputed_features": imputed_features,
        "validated_inputs": parsed_values,
    }


def get_similar_regions(cluster_id: int, exclude_wilayah: str = None, top_n: int = 5) -> list:
    """
    Kembalikan wilayah-wilayah dalam klaster yang sama.

    Parameters
    ----------
    cluster_id       : int    - ID klaster target
    exclude_wilayah  : str    - nama wilayah yang ingin dikecualikan (opsional)
    top_n            : int    - maksimum wilayah yang dikembalikan

    Returns
    -------
    list[dict] berisi detail tiap wilayah mirip
    """
    _ensure_loaded()

    df = _df_wilayah.copy()

    # Kolom klaster bisa bernama "cluster" atau "klaster"
    cluster_col = next(
        (c for c in df.columns if c.lower() in ("cluster", "klaster", "cluster_id")),
        df.columns[1]  # fallback kolom kedua
    )

    same_cluster = df[df[cluster_col] == cluster_id]

    if exclude_wilayah:
        wilayah_col = next(
            (c for c in df.columns if c.lower() in ("wilayah", "kabupaten", "kab_kota", "kabupaten_kota", "nama")),
            df.columns[0]
        )
        target_row = df[df[wilayah_col].astype(str).str.lower() == exclude_wilayah.lower()]
        if target_row.empty:
            target_row = df[df[wilayah_col].astype(str).str.lower().str.contains(exclude_wilayah.lower(), regex=False)]

        same_cluster = same_cluster[
            same_cluster[wilayah_col].astype(str).str.lower() != exclude_wilayah.lower()
        ]

        # Hitung jarak Euclidean jika fitur tersedia
        features = _model_bundle.get("fitur") or _model_bundle.get("features", [])
        if not target_row.empty and all(f in same_cluster.columns for f in features):
            target_vec = target_row.iloc[0][features].values.astype(float)
            cluster_matrix = same_cluster[features].values.astype(float)
            dists = np.linalg.norm(cluster_matrix - target_vec, axis=1)
            same_cluster = same_cluster.assign(distance=np.round(dists, 2))
            same_cluster = same_cluster.sort_values("distance", ascending=True)

    return same_cluster.head(top_n).to_dict(orient="records")


def get_komoditas_detail(wilayah_name: str) -> dict:
    """
    Kembalikan data rincian 26 komoditas pelengkap untuk satu wilayah.

    Parameters
    ----------
    wilayah_name : str - nama wilayah atau kode wilayah yang dicari

    Returns
    -------
    dict berisi wilayah + data komoditas, atau None jika tidak ditemukan
    """
    _ensure_loaded()

    df_k = _df_komoditas.copy()
    df_w = _df_wilayah.copy()

    kode = None
    if str(wilayah_name).isdigit():
        kode = int(wilayah_name)
    else:
        # Cari di df_w berdasarkan Kabupaten_Kota
        if "Kabupaten_Kota" in df_w.columns:
            w_match = df_w[df_w["Kabupaten_Kota"].astype(str).str.lower() == str(wilayah_name).lower()]
            if w_match.empty:
                w_match = df_w[df_w["Kabupaten_Kota"].astype(str).str.lower().str.contains(str(wilayah_name).lower(), regex=False)]
            if not w_match.empty:
                kode = w_match.iloc[0]["Kode_Wilayah"]

    if kode is not None:
        row = df_k[df_k["Kode_Wilayah"] == kode]
        if not row.empty:
            res = row.iloc[0].to_dict()
            w_info = df_w[df_w["Kode_Wilayah"] == kode]
            if not w_info.empty:
                res["Kabupaten_Kota"] = w_info.iloc[0].get("Kabupaten_Kota", str(wilayah_name))
                res["Provinsi"] = w_info.iloc[0].get("Provinsi", "")
            return res

    return None


def get_profil_klaster(cluster_id: int) -> dict:
    """Kembalikan profil rata-rata klaster dari profil_klaster.csv."""
    _ensure_loaded()

    df = _df_profil.copy()
    cluster_col = next(
        (c for c in df.columns if c.lower() in ("cluster", "klaster", "cluster_id")),
        df.columns[0]
    )

    row = df[df[cluster_col] == cluster_id]
    if row.empty:
        return {}

    return row.iloc[0].to_dict()


def get_standar_pph() -> list:
    """Kembalikan semua baris standar PPH."""
    _ensure_loaded()
    return _df_standar.to_dict(orient="records")


def get_all_wilayah() -> list:
    """Kembalikan daftar seluruh wilayah beserta klasternya."""
    _ensure_loaded()
    return _df_wilayah.to_dict(orient="records")


def reload_artifacts():
    """Force reload semua artefak (berguna setelah upload model baru)."""
    global _model_bundle, _df_wilayah, _df_komoditas, _df_profil, _df_standar
    _model_bundle = _df_wilayah = _df_komoditas = _df_profil = _df_standar = None
    _load_artifacts()
