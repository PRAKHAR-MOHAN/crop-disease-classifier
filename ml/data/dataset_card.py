"""Generate a comprehensive Dataset Card (`reports/dataset_card.md`) and exploratory figures.

Usage:
    python -m ml.data.dataset_card --base configs/base.yaml
"""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any

import matplotlib
import numpy as np
import pandas as pd
from PIL import Image, ImageOps

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns

from ml.utils.io import ensure_dir, load_json, load_yaml


def _plot_class_distribution(
    train_df: pd.DataFrame,
    val_df: pd.DataFrame,
    test_df: pd.DataFrame,
    out_path: Path,
) -> None:
    combined = pd.concat(
        [
            train_df.assign(split="train"),
            val_df.assign(split="val"),
            test_df.assign(split="test"),
        ],
        ignore_index=True,
    )
    counts = combined.groupby(["label", "split"]).size().unstack(fill_value=0)
    for col in ("train", "val", "test"):
        if col not in counts.columns:
            counts[col] = 0
    counts["total"] = counts[["train", "val", "test"]].sum(axis=1)
    counts = counts.sort_values("total", ascending=True).drop(columns=["total"])

    fig_h = max(6.0, 0.28 * len(counts))
    fig, ax = plt.subplots(figsize=(12, fig_h))
    counts[["train", "val", "test"]].plot(
        kind="barh",
        stacked=True,
        ax=ax,
        color=["#2d6a4f", "#52b788", "#95d5b2"],
    )
    ax.set_title("Class Distribution Across Train / Val / Test Splits", fontsize=13, fontweight="bold")
    ax.set_xlabel("Number of Images")
    ax.set_ylabel("Standardized Class (Crop___Disease)")
    ax.grid(axis="x", linestyle="--", alpha=0.4)
    fig.tight_layout()
    fig.savefig(out_path, dpi=180)
    plt.close(fig)


def _plot_domain_breakdown(catalog_df: pd.DataFrame, out_path: Path) -> None:
    fig, axes = plt.subplots(1, 2, figsize=(12, 4.5))
    sns.countplot(data=catalog_df, x="source", hue="domain", ax=axes[0], palette="viridis")
    axes[0].set_title("Images by Dataset Source & Domain")
    axes[0].set_xlabel("Dataset Source")
    axes[0].set_ylabel("Count")
    axes[0].tick_params(axis="x", rotation=20)

    crop_counts = catalog_df["crop"].value_counts().head(15)
    sns.barplot(x=crop_counts.values, y=crop_counts.index, ax=axes[1], color="#40916c")
    axes[1].set_title("Top Crops / Pest Groups")
    axes[1].set_xlabel("Count")
    axes[1].set_ylabel("Crop / Group")

    fig.tight_layout()
    fig.savefig(out_path, dpi=180)
    plt.close(fig)


def _plot_resolution_stats(catalog_df: pd.DataFrame, out_path: Path) -> None:
    sample = catalog_df.sample(n=min(4000, len(catalog_df)), random_state=42)
    fig, axes = plt.subplots(1, 2, figsize=(12, 4.5))
    sns.scatterplot(
        data=sample,
        x="width",
        y="height",
        hue="domain",
        alpha=0.45,
        s=18,
        ax=axes[0],
    )
    axes[0].set_title("Image Dimensions (Width vs. Height)")
    axes[0].set_xlabel("Width (px)")
    axes[0].set_ylabel("Height (px)")

    aspect = sample["width"] / sample["height"]
    sns.histplot(aspect, bins=30, kde=True, ax=axes[1], color="#2d6a4f")
    axes[1].set_title("Aspect Ratio Distribution (W / H)")
    axes[1].set_xlabel("Aspect Ratio")

    fig.tight_layout()
    fig.savefig(out_path, dpi=180)
    plt.close(fig)


def _plot_sample_grid(train_df: pd.DataFrame, out_path: Path, n_samples: int = 16) -> None:
    unique_classes = sorted(train_df["label"].unique().tolist())
    rng = np.random.default_rng(42)
    chosen_classes = rng.choice(
        unique_classes,
        size=min(n_samples, len(unique_classes)),
        replace=False,
    )
    cols = 4
    rows = int(np.ceil(len(chosen_classes) / cols))
    fig, axes = plt.subplots(rows, cols, figsize=(14, 3.4 * rows))
    axes_flat = np.atleast_1d(axes).ravel()

    for ax in axes_flat:
        ax.axis("off")

    for idx, cls_name in enumerate(chosen_classes):
        cls_rows = train_df[train_df["label"] == cls_name]
        row = cls_rows.sample(n=1, random_state=42 + idx).iloc[0]
        try:
            with Image.open(row["image_path"]) as img_raw:
                img = ImageOps.exif_transpose(img_raw).convert("RGB")
                img.thumbnail((256, 256))
                axes_flat[idx].imshow(img)
        except Exception:
            pass
        title = cls_name.replace("___", "\n")
        axes_flat[idx].set_title(f"{title}\n[{row['source']}]", fontsize=8.5)

    fig.suptitle("Representative Samples Across Standardized Classes", fontsize=13, fontweight="bold")
    fig.tight_layout()
    fig.savefig(out_path, dpi=170)
    plt.close(fig)


def generate_dataset_card(cfg: dict[str, Any]) -> Path:
    """Create dataset summary plots and `reports/dataset_card.md`."""
    processed_dir = Path(cfg["paths"]["processed_dir"])
    manifests_dir = Path(cfg["paths"]["manifests_dir"])
    reports_dir = ensure_dir(cfg["paths"]["reports_dir"])
    figures_dir = ensure_dir(cfg["paths"]["figures_dir"])

    catalog_df = pd.read_parquet(processed_dir / "catalog.parquet")
    train_df = pd.read_parquet(manifests_dir / "train.parquet")
    val_df = pd.read_parquet(manifests_dir / "val.parquet")
    test_df = pd.read_parquet(manifests_dir / "test.parquet")
    field_path = manifests_dir / "test_field.parquet"
    field_df = pd.read_parquet(field_path) if field_path.exists() else pd.DataFrame()

    clean_summary = load_json(processed_dir / "cleaning_summary.json")
    split_audit = load_json(manifests_dir / "split_audit.json")

    _plot_class_distribution(train_df, val_df, test_df, figures_dir / "class_distribution.png")
    _plot_domain_breakdown(catalog_df, figures_dir / "domain_breakdown.png")
    _plot_resolution_stats(catalog_df, figures_dir / "image_resolution_dist.png")
    _plot_sample_grid(train_df, figures_dir / "sample_grid.png")

    cls_counts = train_df["label"].value_counts()
    imbalance_ratio = float(cls_counts.max() / max(cls_counts.min(), 1))

    class_table_rows = []
    val_counts = val_df["label"].value_counts().to_dict()
    test_counts = test_df["label"].value_counts().to_dict()
    field_counts = field_df["label"].value_counts().to_dict() if not field_df.empty else {}

    for cls_name in sorted(cls_counts.index.tolist()):
        tr = int(cls_counts.get(cls_name, 0))
        va = int(val_counts.get(cls_name, 0))
        te = int(test_counts.get(cls_name, 0))
        fi = int(field_counts.get(cls_name, 0))
        class_table_rows.append(f"| `{cls_name}` | {tr} | {va} | {te} | {fi} | {tr + va + te} |")

    md = f"""# Dataset Card — Crop Disease & Pest Classifier

## 1. Overview
- **Standardized Label Format**: `Crop___Disease` (or `Crop___healthy`, `Pest___<Name>`)
- **Total Scanned Raw Files**: {clean_summary.get("total_scanned", len(catalog_df)):,}
- **Removed (Corrupt / Too Small / Bad Aspect)**: {clean_summary.get("dropped_corrupt", 0) + clean_summary.get("dropped_too_small", 0) + clean_summary.get("dropped_bad_aspect", 0):,}
- **Removed Exact Duplicates (SHA-256)**: {clean_summary.get("dropped_exact_duplicate", 0):,}
- **Clean Catalog Size**: {len(catalog_df):,} images across **{split_audit["counts"]["num_classes"]}** training classes
- **Unique Visual Clusters (pHash Hamming <= {split_audit["phash_threshold"]})**: {split_audit["counts"]["num_visual_clusters"]:,}
- **Train Imbalance Ratio (max / min class)**: {imbalance_ratio:.2f}x

## 2. Split Summary & Leakage Audit
| Split | Images | Domain Notes |
| --- | ---: | --- |
| `train` | {len(train_df):,} | Stratified group split (70% target) |
| `val` | {len(val_df):,} | Stratified group split (15% target) |
| `test` | {len(test_df):,} | Stratified group split (15% target) |
| `test_field` | {len(field_df):,} | Real-field PlantDoc evaluation set |

- **Leakage-Free Verification**: `{split_audit["leakage_free"]}`
  - SHA-256 overlaps: `{split_audit["sha256_overlaps"]}`
  - Near-duplicate visual group overlaps: `{split_audit["dup_group_overlaps"]}`
  - Cross-split pHash hits: `{split_audit["cross_split_phash_hits"]}`

## 3. Exploratory Visualizations
![Class Distribution](figures/class_distribution.png)

![Dataset Sources and Crop Breakdown](figures/domain_breakdown.png)

![Resolution and Aspect Ratio](figures/image_resolution_dist.png)

![Sample Images](figures/sample_grid.png)

## 4. Per-Class Counts
| Class (`Crop___Disease`) | Train | Val | Test | Field (`PlantDoc`) | In-Domain Total |
| --- | ---: | ---: | ---: | ---: | ---: |
{chr(10).join(class_table_rows)}
"""
    out_md = reports_dir / "dataset_card.md"
    out_md.write_text(md, encoding="utf-8")
    print(f"[dataset_card] Generated {out_md} and figures in {figures_dir}.")
    return out_md


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate Dataset Card markdown and EDA plots.")
    parser.add_argument("--base", default="configs/base.yaml", help="Base config YAML path.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    cfg = load_yaml(args.base)
    generate_dataset_card(cfg)


if __name__ == "__main__":
    main()
