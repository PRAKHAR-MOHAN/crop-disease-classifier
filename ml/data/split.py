"""Leak-free stratified group splitting (70/15/15) using perceptual-hash clustering.

Near-duplicate images (pHash Hamming distance <= threshold) are grouped into atomic clusters
so augmented variants or burst photos never leak across train/val/test or lab/field splits.

Usage:
    python -m ml.data.split --base configs/base.yaml
"""

from __future__ import annotations

import argparse
from collections import defaultdict
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

from ml.utils.io import ensure_dir, load_yaml, save_json, save_label_map
from ml.utils.seed import seed_everything

# Precomputed 8-bit popcount lookup table for ultra-fast vectorized Hamming distances
_POPCOUNT_LUT = np.array([bin(i).count("1") for i in range(256)], dtype=np.uint8)


class _UnionFind:
    def __init__(self, n: int) -> None:
        self.parent = list(range(n))
        self.rank = [0] * n

    def find(self, x: int) -> int:
        while self.parent[x] != x:
            self.parent[x] = self.parent[self.parent[x]]
            x = self.parent[x]
        return x

    def union(self, a: int, b: int) -> None:
        ra, rb = self.find(a), self.find(b)
        if ra == rb:
            return
        if self.rank[ra] < self.rank[rb]:
            ra, rb = rb, ra
        self.parent[rb] = ra
        if self.rank[ra] == self.rank[rb]:
            self.rank[ra] += 1


def _phash_hex_to_uint64(hex_series: pd.Series) -> np.ndarray:
    return np.array([int(str(h), 16) for h in hex_series], dtype=np.uint64)


def _hamming_matrix_block(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    """Compute pairwise 64-bit Hamming distances between uint64 vectors `a` (M,) and `b` (N,)."""
    xor = np.bitwise_xor(a[:, None], b[None, :])
    xor_bytes = xor.view(np.uint8).reshape(a.shape[0], b.shape[0], 8)
    return _POPCOUNT_LUT[xor_bytes].sum(axis=-1)


def cluster_near_duplicates(
    phash_uint64: np.ndarray,
    threshold: int = 6,
    chunk_size: int = 1024,
) -> np.ndarray:
    """Assign a connected-component group ID to near-duplicate images via pHash Hamming distance."""
    n = len(phash_uint64)
    uf = _UnionFind(n)
    if n <= 1 or threshold < 0:
        return np.arange(n, dtype=np.int64)

    for start in range(0, n, chunk_size):
        end = min(start + chunk_size, n)
        block_a = phash_uint64[start:end]
        # Only compare with indices >= start to avoid redundant work
        block_b = phash_uint64[start:]
        dists = _hamming_matrix_block(block_a, block_b)
        rows, cols = np.where(dists <= threshold)
        for r, c in zip(rows.tolist(), cols.tolist(), strict=True):
            i = start + r
            j = start + c
            if i < j:
                uf.union(i, j)

    roots = np.array([uf.find(i) for i in range(n)], dtype=np.int64)
    _, compact_ids = np.unique(roots, return_inverse=True)
    return compact_ids


def _stratified_group_assign(
    df: pd.DataFrame,
    ratios: tuple[float, float, float] = (0.70, 0.15, 0.15),
    seed: int = 42,
) -> pd.Series:
    """Assign each `dup_group_id` atomically to train/val/test while preserving class ratios."""
    rng = np.random.default_rng(seed)
    split_names = ("train", "val", "test")

    # Build atomic groups; majority label defines stratification bucket if group spans classes
    group_info: list[tuple[int, str, int]] = []
    for gid, grp in df.groupby("dup_group_id", sort=False):
        maj_label = str(grp["label"].mode().iloc[0])
        group_info.append((int(gid), maj_label, len(grp)))

    # Shuffle within equal sizes for randomness, then sort largest groups first per label
    rng.shuffle(group_info)
    label_totals = df["label"].value_counts().to_dict()
    groups_by_label: dict[str, list[tuple[int, int]]] = defaultdict(list)
    for gid, lbl, size in group_info:
        groups_by_label[lbl].append((gid, size))

    group_to_split: dict[int, str] = {}
    split_class_counts: dict[str, dict[str, int]] = {
        s: defaultdict(int) for s in split_names
    }

    for lbl, grp_list in sorted(groups_by_label.items()):
        grp_list.sort(key=lambda x: x[1], reverse=True)
        total_lbl = label_totals[lbl]
        targets = [r * total_lbl for r in ratios]

        for gid, size in grp_list:
            # Choose split with largest positive deficit relative to target count
            deficits = [
                targets[idx] - split_class_counts[s][lbl]
                for idx, s in enumerate(split_names)
            ]
            best_idx = int(np.argmax(deficits))
            chosen = split_names[best_idx]
            group_to_split[gid] = chosen
            split_class_counts[chosen][lbl] += size

    return df["dup_group_id"].map(group_to_split)


def _compute_class_weights(
    counts: dict[str, int],
    strategy: str = "inverse_sqrt",
    min_w: float = 0.25,
    max_w: float = 5.0,
) -> dict[str, float]:
    if strategy == "none":
        return {k: 1.0 for k in counts}

    total = sum(counts.values())
    raw: dict[str, float] = {}
    if strategy == "effective_num":
        beta = 0.999
        for cls_name, cnt in counts.items():
            eff = 1.0 - (beta**cnt)
            raw[cls_name] = (1.0 - beta) / max(eff, 1e-8)
    else:  # inverse_sqrt (smooth balance without exploding on tail classes)
        for cls_name, cnt in counts.items():
            raw[cls_name] = np.sqrt(total / max(cnt, 1))

    mean_w = float(np.mean(list(raw.values())))
    normed = {k: float(np.clip(v / max(mean_w, 1e-8), min_w, max_w)) for k, v in raw.items()}
    return normed


def _audit_leakage(
    train_df: pd.DataFrame,
    val_df: pd.DataFrame,
    test_df: pd.DataFrame,
    field_df: pd.DataFrame,
    threshold: int,
) -> dict[str, Any]:
    """Verify zero exact or near-duplicate leakage across splits."""
    splits = {"train": train_df, "val": val_df, "test": test_df}
    sha_sets = {k: set(v["sha256"]) for k, v in splits.items()}
    grp_sets = {k: set(v["dup_group_id"]) for k, v in splits.items()}

    sha_overlaps = {
        "train_val": len(sha_sets["train"] & sha_sets["val"]),
        "train_test": len(sha_sets["train"] & sha_sets["test"]),
        "val_test": len(sha_sets["val"] & sha_sets["test"]),
    }
    group_overlaps = {
        "train_val": len(grp_sets["train"] & grp_sets["val"]),
        "train_test": len(grp_sets["train"] & grp_sets["test"]),
        "val_test": len(grp_sets["val"] & grp_sets["test"]),
    }

    # Check cross-split pHash leakage against train (sampled exact check if huge, full if <=50k)
    def _cross_phash_hits(df_a: pd.DataFrame, df_b: pd.DataFrame) -> int:
        if df_a.empty or df_b.empty:
            return 0
        ha = _phash_hex_to_uint64(df_a["phash_hex"])
        hb = _phash_hex_to_uint64(df_b["phash_hex"])
        hits = 0
        for s in range(0, len(ha), 1024):
            dists = _hamming_matrix_block(ha[s : s + 1024], hb)
            hits += int((dists <= threshold).sum())
        return hits

    phash_cross_hits = {
        "train_val": _cross_phash_hits(train_df, val_df),
        "train_test": _cross_phash_hits(train_df, test_df),
        "val_test": _cross_phash_hits(val_df, test_df),
        "train_field": _cross_phash_hits(train_df, field_df) if not field_df.empty else 0,
    }

    return {
        "phash_threshold": threshold,
        "sha256_overlaps": sha_overlaps,
        "dup_group_overlaps": group_overlaps,
        "cross_split_phash_hits": phash_cross_hits,
        "leakage_free": (
            sum(sha_overlaps.values()) == 0
            and sum(group_overlaps.values()) == 0
            and sum(phash_cross_hits.values()) == 0
        ),
    }


def create_splits(cfg: dict[str, Any]) -> dict[str, Any]:
    """Run near-duplicate clustering, leak-free 70/15/15 split, and class weight computation."""
    seed = int(cfg.get("seed", 42))
    seed_everything(seed)

    processed_dir = Path(cfg["paths"]["processed_dir"])
    manifests_dir = ensure_dir(cfg["paths"]["manifests_dir"])
    split_cfg = cfg["split"]
    imb_cfg = cfg["imbalance"]

    catalog_path = processed_dir / "catalog.parquet"
    if not catalog_path.exists():
        raise FileNotFoundError(
            f"Catalog not found at {catalog_path}. Run `python -m ml.data.clean_and_merge` first."
        )

    df = pd.read_parquet(catalog_path)
    threshold = int(split_cfg.get("phash_hamming_threshold", 6))
    min_samples = int(split_cfg.get("min_samples_per_class", 15))
    plantdoc_eval_only = bool(split_cfg.get("plantdoc_eval_only", True))

    print(f"[split] Clustering near-duplicates across {len(df)} images (pHash <= {threshold})...")
    phashes = _phash_hex_to_uint64(df["phash_hex"])
    df["dup_group_id"] = cluster_near_duplicates(phashes, threshold=threshold)
    num_groups = int(df["dup_group_id"].nunique())
    print(f"[split] Found {num_groups} unique visual clusters from {len(df)} images.")

    if plantdoc_eval_only and (df["source"] == "plantdoc").any():
        field_df = df[df["source"] == "plantdoc"].copy().reset_index(drop=True)
        main_df = df[df["source"] != "plantdoc"].copy().reset_index(drop=True)
        # Drop any PlantDoc sample whose pHash cluster overlaps main_df to avoid lab-to-field leakage
        main_groups = set(main_df["dup_group_id"])
        before_field = len(field_df)
        field_df = field_df[~field_df["dup_group_id"].isin(main_groups)].reset_index(drop=True)
        removed_cross = before_field - len(field_df)
        if removed_cross > 0:
            print(f"[split] Removed {removed_cross} PlantDoc images overlapping main visual clusters.")
    else:
        main_df = df.copy().reset_index(drop=True)
        field_df = df[df["domain"] == "field"].copy().reset_index(drop=True)

    # Filter extremely rare classes that cannot form valid train/val/test splits
    cls_counts = main_df["label"].value_counts()
    dropped_classes = cls_counts[cls_counts < min_samples].index.tolist()
    if dropped_classes:
        print(f"[split] Dropping {len(dropped_classes)} classes with < {min_samples} images: {dropped_classes}")
        main_df = main_df[~main_df["label"].isin(dropped_classes)].reset_index(drop=True)

    ratios = (
        float(split_cfg.get("train_ratio", 0.70)),
        float(split_cfg.get("val_ratio", 0.15)),
        float(split_cfg.get("test_ratio", 0.15)),
    )
    main_df["split"] = _stratified_group_assign(main_df, ratios=ratios, seed=seed)

    train_df = main_df[main_df["split"] == "train"].reset_index(drop=True)
    val_df = main_df[main_df["split"] == "val"].reset_index(drop=True)
    test_df = main_df[main_df["split"] == "test"].reset_index(drop=True)

    # Build canonical label map strictly from training classes
    classes = sorted(train_df["label"].unique().tolist())
    label_payload = save_label_map(classes, manifests_dir / "label_map.json")
    class_to_idx: dict[str, int] = label_payload["class_to_idx"]

    for split_df in (train_df, val_df, test_df):
        split_df["target"] = split_df["label"].map(class_to_idx)

    if not field_df.empty:
        field_df = field_df[field_df["label"].isin(class_to_idx)].copy().reset_index(drop=True)
        field_df["target"] = field_df["label"].map(class_to_idx)
        field_df["split"] = "test_field"

    train_counts = train_df["label"].value_counts().to_dict()
    class_weights = _compute_class_weights(
        counts={c: int(train_counts.get(c, 1)) for c in classes},
        strategy=str(imb_cfg.get("weight_strategy", "inverse_sqrt")),
        min_w=float(imb_cfg.get("min_weight", 0.25)),
        max_w=float(imb_cfg.get("max_weight", 5.0)),
    )
    save_json(class_weights, manifests_dir / "class_weights.json")

    train_df.to_parquet(manifests_dir / "train.parquet", index=False)
    val_df.to_parquet(manifests_dir / "val.parquet", index=False)
    test_df.to_parquet(manifests_dir / "test.parquet", index=False)
    field_df.to_parquet(manifests_dir / "test_field.parquet", index=False)

    audit = _audit_leakage(train_df, val_df, test_df, field_df, threshold=threshold)
    audit["counts"] = {
        "train": len(train_df),
        "val": len(val_df),
        "test": len(test_df),
        "test_field": len(field_df),
        "num_classes": len(classes),
        "num_visual_clusters": num_groups,
        "dropped_tiny_classes": dropped_classes,
        "plantdoc_eval_only": plantdoc_eval_only,
    }
    save_json(audit, manifests_dir / "split_audit.json")

    print(
        f"[split] Done -> train={len(train_df)}, val={len(val_df)}, "
        f"test={len(test_df)}, test_field={len(field_df)} | leakage_free={audit['leakage_free']}"
    )
    return audit


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create leak-free stratified 70/15/15 splits.")
    parser.add_argument("--base", default="configs/base.yaml", help="Base config YAML path.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    cfg = load_yaml(args.base)
    create_splits(cfg)


if __name__ == "__main__":
    main()

