"""CLI entrypoint to train and compare EfficientNetV2-S, ConvNeXt-Tiny, and Swin-Tiny.

Usage:
    # Train a single backbone
    python -m ml.training.train --config configs/train_efficientnetv2_s.yaml

    # Train and compare all 3 candidate architectures
    python -m ml.training.train --compare configs/train_efficientnetv2_s.yaml configs/train_convnext_tiny.yaml configs/train_swin_tiny.yaml
"""

from __future__ import annotations

import argparse
import shutil
from pathlib import Path
from typing import Any

import pandas as pd
import torch
from dotenv import load_dotenv
from torch.utils.data import DataLoader

from ml.data.dataset import CropDiseaseDataset, build_weighted_sampler
from ml.models.factory import create_model
from ml.training.augmentations import build_eval_transforms, build_train_transforms
from ml.training.trainer import TwoStageTrainer
from ml.utils.io import ensure_dir, load_config, load_json, load_label_map, save_json
from ml.utils.seed import make_generator, seed_everything, seed_worker
from ml.utils.tracking import ExperimentTracker


def train_from_config(cfg: dict[str, Any], output_dir: str | Path | None = None) -> dict[str, Any]:
    """Build datasets, model, and trainer from merged config and execute two-stage training."""
    seed = int(cfg.get("seed", 42))
    seed_everything(seed)

    manifests_dir = Path(cfg["paths"]["manifests_dir"])
    _, class_to_idx, classes = load_label_map(manifests_dir / "label_map.json")
    cw_dict = load_json(manifests_dir / "class_weights.json")

    train_df = pd.read_parquet(manifests_dir / "train.parquet")
    val_df = pd.read_parquet(manifests_dir / "val.parquet")

    img_size = int(cfg["image"]["size"])
    mean = list(cfg["image"]["mean"])
    std = list(cfg["image"]["std"])

    train_ds = CropDiseaseDataset(
        train_df,
        class_to_idx=class_to_idx,
        transform=build_train_transforms(img_size, mean, std),
    )
    val_ds = CropDiseaseDataset(
        val_df,
        class_to_idx=class_to_idx,
        transform=build_eval_transforms(img_size, mean, std),
    )

    tr_cfg = cfg["training"]
    batch_size = int(tr_cfg.get("batch_size", 32))
    num_workers = int(tr_cfg.get("num_workers", 4))
    use_sampler = bool(cfg.get("imbalance", {}).get("use_weighted_sampler", False))
    sampler = build_weighted_sampler(train_df, cw_dict) if use_sampler else None

    pin_mem = torch.cuda.is_available()
    train_loader = DataLoader(
        train_ds,
        batch_size=batch_size,
        shuffle=(sampler is None),
        sampler=sampler,
        num_workers=num_workers,
        pin_memory=pin_mem,
        worker_init_fn=seed_worker,
        generator=make_generator(seed),
        persistent_workers=num_workers > 0,
    )
    val_loader = DataLoader(
        val_ds,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=pin_mem,
        persistent_workers=num_workers > 0,
    )

    class_weights_tensor: torch.Tensor | None = None
    if bool(tr_cfg.get("use_class_weights", True)) and not use_sampler:
        weights_list = [float(cw_dict.get(cls_name, 1.0)) for cls_name in classes]
        class_weights_tensor = torch.tensor(weights_list, dtype=torch.float32)

    m_cfg = cfg["model"]
    model = create_model(
        backbone_name=str(m_cfg["backbone"]),
        num_classes=len(classes),
        pretrained=bool(m_cfg.get("pretrained", True)),
        drop_rate=float(m_cfg.get("drop_rate", 0.3)),
        drop_path_rate=float(m_cfg.get("drop_path_rate", 0.2)),
    )

    exp_name = str(cfg.get("experiment_name", m_cfg["backbone"]))
    track_cfg = cfg.get("tracking", {})
    with ExperimentTracker(
        run_name=exp_name,
        backend=str(track_cfg.get("backend", "none")),
        project=str(track_cfg.get("wandb_project", "crop-disease-classifier")),
        run_dir=Path(cfg["paths"]["artifacts_dir"]) / "runs",
        config=cfg,
    ) as tracker:
        trainer = TwoStageTrainer(
            model=model,
            train_loader=train_loader,
            val_loader=val_loader,
            cfg=cfg,
            classes=classes,
            class_weights=class_weights_tensor,
            output_dir=output_dir,
            tracker=tracker,
        )
        summary = trainer.fit()

    return summary


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train Crop Disease & Pest classifier.")
    parser.add_argument("--base", default="configs/base.yaml", help="Base YAML config.")
    parser.add_argument(
        "--config",
        default="configs/train_efficientnetv2_s.yaml",
        help="Single experiment config YAML.",
    )
    parser.add_argument(
        "--compare",
        nargs="+",
        default=None,
        help="List of experiment YAML configs to train and compare.",
    )
    parser.add_argument(
        "--optuna-override",
        default=None,
        help="Optional YAML file with tuned hyperparameters from tune_optuna.py.",
    )
    return parser.parse_args()


def main() -> None:
    load_dotenv()
    args = parse_args()
    configs_to_run = args.compare if args.compare else [args.config]

    summaries: list[dict[str, Any]] = []
    for cfg_path in configs_to_run:
        print(f"\n==================== Training: {cfg_path} ====================")
        cfg = load_config(cfg_path, base_path=args.base)
        if args.optuna_override and Path(args.optuna_override).exists():
            from ml.utils.io import deep_merge, load_yaml

            cfg = deep_merge(cfg, load_yaml(args.optuna_override))
        summaries.append(train_from_config(cfg))

    summaries.sort(key=lambda s: s["best_val_macro_f1"], reverse=True)
    best = summaries[0]

    artifacts_dir = ensure_dir("artifacts")
    best_dest = artifacts_dir / "best_model.pt"
    shutil.copy2(best["checkpoint_path"], best_dest)

    reports_dir = ensure_dir("reports")
    comp_df = pd.DataFrame(summaries)
    comp_df.to_csv(reports_dir / "backbone_comparison.csv", index=False)
    save_json({"runs": summaries, "winner": best}, reports_dir / "backbone_comparison.json")

    print("\n==================== Backbone Comparison ====================")
    print(comp_df.to_string(index=False))
    print(f"\n[train] Winner '{best['experiment_name']}' copied to {best_dest}")


if __name__ == "__main__":
    main()
