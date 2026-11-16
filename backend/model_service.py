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

def get_features() -> list:
    """Kembalikan daftar fitur yang dipakai model."""
    _ensure_loaded()
    return _model_bundle["features"]


def get_cluster_names() -> dict:
    """Kembalikan peta {cluster_id: nama_klaster}."""
    _ensure_loaded()
    return _model_bundle["cluster_names"]


def predict_cluster(input_values: dict) -> dict:
    """
    Tentukan klaster untuk satu record input.

    Parameters
    ----------
    input_values : dict
        Pasangan {nama_fitur: nilai_float}. Harus memuat semua fitur model.

    Returns
    -------
    dict berisi:
        cluster_id   : int
        cluster_name : str
        distances    : dict {cluster_id: jarak_ke_centroid}
    """
    _ensure_loaded()

    features      = _model_bundle["features"]
    scaler        = _model_bundle["scaler"]
    kmeans        = _model_bundle["kmeans"]
    cluster_names = _model_bundle["cluster_names"]

    # Validasi fitur
    missing = [f for f in features if f not in input_values]
    if missing:
        raise ValueError(f"Fitur tidak lengkap, missing: {missing}")

    X = np.array([[float(input_values[f]) for f in features]])
    X_scaled = scaler.transform(X)

    cluster_id   = int(kmeans.predict(X_scaled)[0])
    cluster_name = cluster_names.get(cluster_id, f"Klaster {cluster_id}")

    # Hitung jarak ke setiap centroid
    centroids = kmeans.cluster_centers_
    distances = {
        int(i): float(np.linalg.norm(X_scaled - centroids[i]))
        for i in range(len(centroids))
    }

    return {
        "cluster_id":   cluster_id,
        "cluster_name": cluster_name,
        "distances":    distances,
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
        # Kolom wilayah bisa bernama "wilayah", "kabupaten", dll.
        wilayah_col = next(
            (c for c in df.columns if c.lower() in ("wilayah", "kabupaten", "kab_kota", "nama")),
            df.columns[0]
        )
        same_cluster = same_cluster[
            same_cluster[wilayah_col].str.lower() != exclude_wilayah.lower()
        ]

    return same_cluster.head(top_n).to_dict(orient="records")


def get_komoditas_detail(wilayah_name: str) -> dict:
    """
    Kembalikan data rincian 26 komoditas pelengkap untuk satu wilayah.

    Parameters
    ----------
    wilayah_name : str - nama wilayah yang dicari

    Returns
    -------
    dict berisi wilayah + data komoditas, atau None jika tidak ditemukan
    """
    _ensure_loaded()

    df = _df_komoditas.copy()
    wilayah_col = next(
        (c for c in df.columns if c.lower() in ("wilayah", "kabupaten", "kab_kota", "nama")),
        df.columns[0]
    )

    row = df[df[wilayah_col].str.lower() == wilayah_name.lower()]
    if row.empty:
        return None

    return row.iloc[0].to_dict()


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
