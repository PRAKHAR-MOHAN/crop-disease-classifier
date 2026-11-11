"""Clean, validate, deduplicate, and merge crop disease & pest datasets.

Produces `data/processed/catalog.parquet` with standardized `Crop___Disease` labels,
exact SHA-256 deduplication, image integrity & resolution filtering, and pHash signatures.

Usage:
    python -m ml.data.clean_and_merge --config configs/datasets.yaml --base configs/base.yaml
    python -m ml.data.clean_and_merge --materialize  # saves standardized RGB copies in data/processed/images
"""

from __future__ import annotations

import argparse
import hashlib
import re
from collections import Counter
from pathlib import Path
from typing import Any

import imagehash
import pandas as pd
from PIL import Image, ImageOps
from tqdm import tqdm

from ml.utils.io import ensure_dir, load_config, load_json, save_json

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


def normalize_label(
    raw_label: str,
    canonical_map: dict[str, str],
    default_crop: str | None = None,
) -> str:
    """Map raw folder/CSV label strings into standardized `Crop___Disease` format."""
    cleaned = raw_label.strip()
    if cleaned in canonical_map:
        return canonical_map[cleaned]

    lowered_map = {k.lower(): v for k, v in canonical_map.items()}
    if cleaned.lower() in lowered_map:
        return lowered_map[cleaned.lower()]

    if "___" in cleaned:
        crop, disease = cleaned.split("___", 1)
    elif default_crop:
        crop, disease = default_crop, cleaned
    else:
        parts = cleaned.split(maxsplit=1)
        crop = parts[0] if parts else "Unknown"
        disease = parts[1] if len(parts) > 1 else "healthy"

    def _slug(text: str, keep_case: bool = True) -> str:
        t = re.sub(r"[(),]+", "", text.strip())
        t = re.sub(r"[\s\-/]+", "_", t)
        t = re.sub(r"_+", "_", t).strip("_")
        if not keep_case:
            return t
        return t

    crop_norm = _slug(crop).replace("__", "_")
    disease_norm = _slug(disease)
    if disease_norm.lower() == "healthy":
        disease_norm = "healthy"
    return f"{crop_norm}___{disease_norm}"


def _iter_folder_dataset(root: Path, canonical_map: dict[str, str], default_crop: str | None = None):
    """Yield `(image_path, canonical_label)` for `<root>/<class_name>/*` folder layouts."""
    if not root.exists():
        return
    for class_dir in sorted(p for p in root.iterdir() if p.is_dir()):
        label = normalize_label(class_dir.name, canonical_map, default_crop=default_crop)
        for img_path in sorted(class_dir.rglob("*")):
            if img_path.is_file() and img_path.suffix.lower() in IMAGE_EXTS:
                yield img_path, label


def _collect_plantvillage(raw_dir: Path, spec: dict[str, Any], canonical_map: dict[str, str]):
    pv_root = raw_dir / "plantvillage"
    if not pv_root.exists():
        return []
    subpath = spec.get("subpath", "raw/color")
    candidates = [
        pv_root / subpath,
        pv_root / "PlantVillage-Dataset" / subpath,
        pv_root / "PlantVillage",
        pv_root,
    ]
    data_root = next((c for c in candidates if c.exists() and any(c.iterdir())), None)
    if data_root is None:
        return []

    records = []
    for img_path, label in _iter_folder_dataset(data_root, canonical_map):
        records.append({"path": img_path, "label": label, "source": "plantvillage", "domain": "lab"})
    return records


def _collect_plantdoc(raw_dir: Path, spec: dict[str, Any], canonical_map: dict[str, str]):
    pd_root = raw_dir / "plantdoc"
    if not pd_root.exists():
        return []
    records = []
    for sub in spec.get("subpaths", ["train", "test"]):
        sub_dir = pd_root / sub
        if not sub_dir.exists():
            continue
        for img_path, label in _iter_folder_dataset(sub_dir, canonical_map):
            records.append({"path": img_path, "label": label, "source": "plantdoc", "domain": "field"})
    return records


def _collect_ip102(raw_dir: Path, spec: dict[str, Any], canonical_map: dict[str, str]):
    ip_root = raw_dir / "ip102"
    if not ip_root.exists():
        return []

    records: list[dict[str, Any]] = []
    # Case 1: Official IP102 structure with classes.txt + classification/<split>/<id>/
    classes_txt = next(ip_root.rglob("classes.txt"), None)
    id_to_name: dict[str, str] = {}
    if classes_txt is not None:
        with classes_txt.open("r", encoding="utf-8", errors="ignore") as f:
            for idx, line in enumerate(f):
                line = line.strip()
                if not line:
                    continue
                parts = re.split(r"\s{2,}|\t", line, maxsplit=1)
                if len(parts) == 2 and parts[0].isdigit():
                    id_to_name[str(int(parts[0]))] = parts[1].strip()
                else:
                    # Handle "1 rice leaf roller" or plain ordered lines
                    m = re.match(r"^(\d+)\s+(.+)$", line)
                    if m:
                        id_to_name[str(int(m.group(1)) - 1)] = m.group(2).strip()
                    else:
                        id_to_name[str(idx)] = line

    # Look for classification/{train,val,test} or direct class folders
    cls_roots = [p for p in [ip_root / "classification", ip_root] if p.exists()]
    split_dirs = []
    for r in cls_roots:
        for split_name in ("train", "val", "test"):
            sd = r / split_name
            if sd.exists():
                split_dirs.append(sd)

    if split_dirs:
        for sd in split_dirs:
            for class_dir in sorted(p for p in sd.iterdir() if p.is_dir()):
                key = str(int(class_dir.name)) if class_dir.name.isdigit() else class_dir.name
                raw_name = id_to_name.get(key, class_dir.name)
                label = normalize_label(raw_name, canonical_map, default_crop="Pest")
                for img_path in sorted(class_dir.rglob("*")):
                    if img_path.is_file() and img_path.suffix.lower() in IMAGE_EXTS:
                        records.append(
                            {"path": img_path, "label": label, "source": "ip102", "domain": "field"}
                        )
    else:
        # Case 2: Split txt manifests (train.txt / val.txt / test.txt) + images/
        images_dir = next((p for p in ip_root.rglob("images") if p.is_dir()), None)
        txt_files = [ip_root / f for f in ("train.txt", "val.txt", "test.txt") if (ip_root / f).exists()]
        if images_dir and txt_files:
            for tf in txt_files:
                with tf.open("r", encoding="utf-8", errors="ignore") as f:
                    for line in f:
                        parts = line.strip().split()
                        if len(parts) < 2:
                            continue
                        img_name, cls_id = parts[0], parts[1]
                        img_path = images_dir / img_name
                        if not img_path.exists():
                            continue
                        raw_name = id_to_name.get(str(int(cls_id)), f"Pest_{cls_id}")
                        label = normalize_label(raw_name, canonical_map, default_crop="Pest")
                        records.append(
                            {"path": img_path, "label": label, "source": "ip102", "domain": "field"}
                        )
        else:
            # Case 3: Plain class subdirectories under ip_root
            for img_path, label in _iter_folder_dataset(ip_root, canonical_map, default_crop="Pest"):
                records.append(
                    {"path": img_path, "label": label, "source": "ip102", "domain": "field"}
                )

    top_k = spec.get("top_k_classes")
    if top_k and records:
        counts = Counter(r["label"] for r in records)
        keep_labels = {lbl for lbl, _ in counts.most_common(int(top_k))}
        records = [r for r in records if r["label"] in keep_labels]

    return records


def _collect_rice(raw_dir: Path, canonical_map: dict[str, str]):
    rice_root = raw_dir / "rice"
    if not rice_root.exists():
        return []
    records = []
    for img_path, label in _iter_folder_dataset(rice_root, canonical_map, default_crop="Rice"):
        records.append({"path": img_path, "label": label, "source": "rice", "domain": "field"})
    return records


def _collect_cassava(raw_dir: Path, canonical_map: dict[str, str]):
    cass_root = raw_dir / "cassava"
    if not cass_root.exists():
        return []

    records = []
    train_csv = cass_root / "train.csv"
    images_dir = cass_root / "train_images"
    label_json = cass_root / "label_num_to_disease_map.json"
    if train_csv.exists() and images_dir.exists():
        df = pd.read_csv(train_csv)
        num_map = load_json(label_json) if label_json.exists() else {}
        for _, row in df.iterrows():
            img_path = images_dir / str(row["image_id"])
            if not img_path.exists():
                continue
            raw_lbl = str(num_map.get(str(row["label"]), f"Class_{row['label']}"))
            label = normalize_label(raw_lbl, canonical_map, default_crop="Cassava")
            records.append(
                {"path": img_path, "label": label, "source": "cassava", "domain": "field"}
            )
    else:
        for img_path, label in _iter_folder_dataset(cass_root, canonical_map, default_crop="Cassava"):
            records.append(
                {"path": img_path, "label": label, "source": "cassava", "domain": "field"}
            )
    return records


def _sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 64), b""):
            h.update(chunk)
    return h.hexdigest()


def _validate_and_fingerprint(
    path: Path,
    min_resolution: int,
    max_aspect_ratio: float,
    materialize_path: Path | None = None,
) -> dict[str, Any] | None:
    """Verify readability, EXIF-transpose to RGB, enforce size checks, and compute pHash."""
    try:
        with Image.open(path) as img_verify:
            img_verify.verify()
        with Image.open(path) as img_raw:
            img = ImageOps.exif_transpose(img_raw).convert("RGB")
            width, height = img.size
            if min(width, height) < min_resolution:
                return {"status": "too_small"}
            ratio = max(width / height, height / width)
            if ratio > max_aspect_ratio:
                return {"status": "bad_aspect"}
            phash_hex = str(imagehash.phash(img))
            sha256 = _sha256_file(path)

            final_path = path
            if materialize_path is not None:
                ensure_dir(materialize_path.parent)
                img_out = img.copy()
                img_out.thumbnail((512, 512), Image.Resampling.LANCZOS)
                img_out.save(materialize_path, format="JPEG", quality=92)
                final_path = materialize_path

            return {
                "status": "ok",
                "final_path": str(final_path.as_posix()),
                "width": width,
                "height": height,
                "sha256": sha256,
                "phash_hex": phash_hex,
            }
    except Exception:
        return {"status": "corrupt"}


def clean_and_merge(
    cfg: dict[str, Any],
    materialize: bool = False,
    max_per_class: int | None = None,
) -> pd.DataFrame:
    """Collect, validate, deduplicate, and catalog all enabled datasets."""
    raw_dir = Path(cfg["paths"]["raw_dir"])
    processed_dir = ensure_dir(cfg["paths"]["processed_dir"])
    manifests_dir = ensure_dir(cfg["paths"]["manifests_dir"])
    canonical_map: dict[str, str] = cfg.get("canonical_class_map", {})
    sources = cfg.get("sources", {})

    min_res = int(cfg["image"].get("min_resolution", 64))
    max_ratio = float(cfg["image"].get("max_aspect_ratio", 6.0))

    raw_records: list[dict[str, Any]] = []
    if sources.get("plantvillage", {}).get("enabled", False):
        raw_records.extend(_collect_plantvillage(raw_dir, sources["plantvillage"], canonical_map))
    if sources.get("plantdoc", {}).get("enabled", False):
        raw_records.extend(_collect_plantdoc(raw_dir, sources["plantdoc"], canonical_map))
    if sources.get("ip102", {}).get("enabled", False):
        raw_records.extend(_collect_ip102(raw_dir, sources["ip102"], canonical_map))
    if sources.get("rice", {}).get("enabled", False):
        raw_records.extend(_collect_rice(raw_dir, canonical_map))
    if sources.get("cassava", {}).get("enabled", False):
        raw_records.extend(_collect_cassava(raw_dir, canonical_map))

    if not raw_records:
        raise RuntimeError(
            f"No dataset images found under {raw_dir}. Run `python -m ml.data.download` first."
        )

    if max_per_class is not None and max_per_class > 0:
        per_class_counter: Counter[str] = Counter()
        capped = []
        for rec in raw_records:
            if per_class_counter[rec["label"]] < max_per_class:
                capped.append(rec)
                per_class_counter[rec["label"]] += 1
        raw_records = capped

    stats: Counter[str] = Counter()
    stats["total_scanned"] = len(raw_records)
    clean_rows: list[dict[str, Any]] = []

    mat_root = processed_dir / "images" if materialize else None
    for idx, rec in enumerate(tqdm(raw_records, desc="Validating & fingerprinting images")):
        src_path = Path(rec["path"])
        mat_path = (
            mat_root / rec["label"] / f"{rec['source']}_{idx:07d}.jpg"
            if mat_root is not None
            else None
        )
        res = _validate_and_fingerprint(
            src_path,
            min_resolution=min_res,
            max_aspect_ratio=max_ratio,
            materialize_path=mat_path,
        )
        status = res["status"] if res else "corrupt"
        if status != "ok":
            stats[f"dropped_{status}"] += 1
            continue

        clean_rows.append(
            {
                "image_path": res["final_path"],
                "raw_path": str(src_path.as_posix()),
                "label": rec["label"],
                "crop": rec["label"].split("___", 1)[0],
                "disease": rec["label"].split("___", 1)[1] if "___" in rec["label"] else "unknown",
                "source": rec["source"],
                "domain": rec["domain"],
                "width": res["width"],
                "height": res["height"],
                "sha256": res["sha256"],
                "phash_hex": res["phash_hex"],
            }
        )

    df = pd.DataFrame(clean_rows)
    if df.empty:
        raise RuntimeError("All scanned images failed validation.")

    # Prefer keeping real-field metadata when deduplicating exact SHA-256 duplicates
    domain_priority = {"field": 0, "lab": 1}
    df["_prio"] = df["domain"].map(lambda d: domain_priority.get(d, 2))
    df = df.sort_values(["_prio", "source", "image_path"]).drop(columns=["_prio"])
    before_dedup = len(df)
    df = df.drop_duplicates(subset=["sha256"], keep="first").reset_index(drop=True)
    stats["dropped_exact_duplicate"] = before_dedup - len(df)
    stats["final_clean_images"] = len(df)
    stats["num_classes"] = int(df["label"].nunique())

    catalog_path = processed_dir / "catalog.parquet"
    df.to_parquet(catalog_path, index=False)
    save_json(dict(stats), processed_dir / "cleaning_summary.json")

    # Index OOD non-plant images if downloaded
    ood_dir = raw_dir / "ood_non_plant"
    if ood_dir.exists():
        ood_rows = []
        for p in sorted(ood_dir.rglob("*")):
            if p.is_file() and p.suffix.lower() in IMAGE_EXTS:
                ood_rows.append({"image_path": str(p.as_posix()), "category": p.parent.name})
        if ood_rows:
            pd.DataFrame(ood_rows).to_parquet(manifests_dir / "ood_negatives.parquet", index=False)
            print(f"[clean] Indexed {len(ood_rows)} OOD non-plant negatives.")

    print(f"[clean] Saved catalog ({len(df)} clean images, {df['label'].nunique()} classes) -> {catalog_path}")
    print(f"[clean] Summary: {dict(stats)}")
    return df


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Clean, deduplicate, and merge datasets.")
    parser.add_argument("--config", default="configs/datasets.yaml", help="Datasets YAML path.")
    parser.add_argument("--base", default="configs/base.yaml", help="Base YAML path.")
    parser.add_argument(
        "--materialize",
        action="store_true",
        help="Write standardized RGB JPEGs (<=512px) into data/processed/images.",
    )
    parser.add_argument(
        "--max-per-class",
        type=int,
        default=None,
        help="Optional cap per class for fast smoke testing.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    cfg = load_config(args.config, base_path=args.base)
    clean_and_merge(cfg, materialize=args.materialize, max_per_class=args.max_per_class)


if __name__ == "__main__":
    main()

