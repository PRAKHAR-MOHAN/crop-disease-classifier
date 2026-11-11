"""Budgeted Optuna hyperparameter search with MedianPruner.

Usage:
    python -m ml.training.tune_optuna --config configs/train_efficientnetv2_s.yaml --n-trials 8 --max-epochs 6
"""

from __future__ import annotations

import argparse
import copy
from pathlib import Path
from typing import Any

import optuna
import pandas as pd
import torch
import yaml
from dotenv import load_dotenv
from torch.utils.data import DataLoader

from ml.data.dataset import CropDiseaseDataset
from ml.models.factory import create_model
from ml.training.augmentations import build_eval_transforms, build_train_transforms
from ml.training.trainer import TwoStageTrainer
from ml.utils.io import ensure_dir, load_config, load_json, load_label_map
from ml.utils.seed import make_generator, seed_everything, seed_worker


def run_optuna_search(
    base_cfg: dict[str, Any],
    n_trials: int = 8,
    max_stage2_epochs: int = 6,
    study_name: str = "crop_disease_hpo",
) -> Path:
    """Tune LR, head multiplier, weight decay, dropout, label smoothing, and mixup prob."""
    seed = int(base_cfg.get("seed", 42))
    seed_everything(seed)

    manifests_dir = Path(base_cfg["paths"]["manifests_dir"])
    artifacts_dir = ensure_dir(base_cfg["paths"]["artifacts_dir"])
    _, class_to_idx, classes = load_label_map(manifests_dir / "label_map.json")
    cw_dict = load_json(manifests_dir / "class_weights.json")

    train_df = pd.read_parquet(manifests_dir / "train.parquet")
    val_df = pd.read_parquet(manifests_dir / "val.parquet")

    img_size = int(base_cfg["image"]["size"])
    mean = list(base_cfg["image"]["mean"])
    std = list(base_cfg["image"]["std"])

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

    batch_size = int(base_cfg["training"].get("batch_size", 32))
    num_workers = int(base_cfg["training"].get("num_workers", 2))
    pin_mem = torch.cuda.is_available()

    train_loader = DataLoader(
        train_ds,
        batch_size=batch_size,
        shuffle=True,
        num_workers=num_workers,
        pin_memory=pin_mem,
        worker_init_fn=seed_worker,
        generator=make_generator(seed),
    )
    val_loader = DataLoader(
        val_ds,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=pin_mem,
    )

    weights_tensor = torch.tensor(
        [float(cw_dict.get(c, 1.0)) for c in classes], dtype=torch.float32
    )

    def objective(trial: optuna.Trial) -> float:
        cfg = copy.deepcopy(base_cfg)
        backbone_lr = trial.suggest_float("backbone_lr", 3e-5, 3e-4, log=True)
        head_mult = trial.suggest_float("head_lr_mult", 3.0, 10.0)
        weight_decay = trial.suggest_float("weight_decay", 1e-3, 5e-2, log=True)
        drop_rate = trial.suggest_float("drop_rate", 0.1, 0.45)
        label_smoothing = trial.suggest_float("label_smoothing", 0.0, 0.15)
        mixup_prob = trial.suggest_float("mixup_prob", 0.2, 0.7)

        cfg["experiment_name"] = f"optuna_trial_{trial.number}"
        cfg["model"]["drop_rate"] = drop_rate
        cfg["training"]["label_smoothing"] = label_smoothing
        cfg["training"]["mixup"]["prob"] = mixup_prob
        cfg["training"]["stage1"]["epochs"] = 2
        cfg["training"]["stage2"]["backbone_lr"] = backbone_lr
        cfg["training"]["stage2"]["head_lr"] = backbone_lr * head_mult
        cfg["training"]["stage2"]["weight_decay"] = weight_decay
        cfg["training"]["stage2"]["early_stopping_patience"] = max_stage2_epochs

        model = create_model(
            backbone_name=str(cfg["model"]["backbone"]),
            num_classes=len(classes),
            pretrained=True,
            drop_rate=drop_rate,
            drop_path_rate=float(cfg["model"].get("drop_path_rate", 0.2)),
        )

        def _prune_cb(epoch: int, metrics: dict[str, float]) -> None:
            trial.report(metrics["val_macro_f1"], step=epoch)
            if trial.should_prune():
                raise optuna.TrialPruned()

        trainer = TwoStageTrainer(
            model=model,
            train_loader=train_loader,
            val_loader=val_loader,
            cfg=cfg,
            classes=classes,
            class_weights=weights_tensor,
            output_dir=artifacts_dir / "runs" / f"_optuna_trial_{trial.number}",
            epoch_callback=_prune_cb,
        )
        summary = trainer.fit(max_stage2_epochs=max_stage2_epochs)
        return float(summary["best_val_macro_f1"])

    sampler = optuna.samplers.TPESampler(seed=seed)
    pruner = optuna.pruners.MedianPruner(n_startup_trials=2, n_warmup_steps=3)
    study = optuna.create_study(
        study_name=study_name,
        direction="maximize",
        sampler=sampler,
        pruner=pruner,
    )
    study.optimize(objective, n_trials=n_trials, gc_after_trial=True)

    best_p = study.best_params
    override_cfg = {
        "model": {"drop_rate": round(float(best_p["drop_rate"]), 4)},
        "training": {
            "label_smoothing": round(float(best_p["label_smoothing"]), 4),
            "mixup": {"prob": round(float(best_p["mixup_prob"]), 4)},
            "stage2": {
                "backbone_lr": float(best_p["backbone_lr"]),
                "head_lr": float(best_p["backbone_lr"] * best_p["head_lr_mult"]),
                "weight_decay": float(best_p["weight_decay"]),
            },
        },
    }

    best_yaml = artifacts_dir / "optuna_best_params.yaml"
    with best_yaml.open("w", encoding="utf-8") as f:
        yaml.safe_dump(override_cfg, f, sort_keys=False)

    study.trials_dataframe().to_csv(artifacts_dir / "optuna_trials.csv", index=False)
    print(f"[optuna] Best val macro-F1 = {study.best_value:.4f}")
    print(f"[optuna] Saved override YAML -> {best_yaml}")
    return best_yaml


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Optuna HPO for Crop Disease classifier.")
    parser.add_argument("--base", default="configs/base.yaml")
    parser.add_argument("--config", default="configs/train_efficientnetv2_s.yaml")
    parser.add_argument("--n-trials", type=int, default=8)
    parser.add_argument("--max-epochs", type=int, default=6)
    return parser.parse_args()


def main() -> None:
    load_dotenv()
    args = parse_args()
    cfg = load_config(args.config, base_path=args.base)
    run_optuna_search(cfg, n_trials=args.n_trials, max_stage2_epochs=args.max_epochs)


if __name__ == "__main__":
    main()

