"""End-to-end model evaluation, calibration, OOD tuning, and lab-to-field gap report.

Usage:
    python -m ml.evaluation.evaluate --checkpoint artifacts/best_model.pt --base configs/base.yaml
"""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
import torch
from torch.utils.data import DataLoader
from tqdm import tqdm

from ml.data.dataset import CropDiseaseDataset
from ml.evaluation.calibrate import fit_temperature_scaling
from ml.evaluation.gradcam import save_gradcam_gallery
from ml.evaluation.metrics import (
    compute_classification_metrics,
    plot_confusion_matrix,
    save_per_class_csv,
)
from ml.evaluation.ood import tune_ood_thresholds
from ml.models.factory import load_checkpoint_model
from ml.training.augmentations import build_eval_transforms
from ml.utils.io import ensure_dir, load_label_map, load_yaml, save_json
from ml.utils.seed import get_default_device


@torch.no_grad()
def _collect_logits(
    model: torch.nn.Module,
    loader: DataLoader,
    device: torch.device,
) -> tuple[np.ndarray, np.ndarray]:
    model.eval()
    logits_list = []
    targets_list = []
    amp_enabled = device.type == "cuda"
    device_type = "cuda" if amp_enabled else "cpu"

    for images, targets in tqdm(loader, desc="Extracting logits", leave=False):
        images = images.to(device, non_blocking=True)
        with torch.amp.autocast(device_type=device_type, enabled=amp_enabled):
            out = model(images)
        logits_list.append(out.float().cpu().numpy())
        targets_list.append(targets.numpy())

    return np.concatenate(logits_list, axis=0), np.concatenate(targets_list, axis=0)


def evaluate_model(
    checkpoint_path: str | Path,
    cfg: dict[str, Any],
    batch_size: int = 48,
    num_workers: int = 2,
) -> dict[str, Any]:
    """Run full evaluation: ID test, PlantDoc real-field test, calibration, OOD, and Grad-CAM."""
    manifests_dir = Path(cfg["paths"]["manifests_dir"])
    artifacts_dir = ensure_dir(cfg["paths"]["artifacts_dir"])
    reports_dir = ensure_dir(cfg["paths"]["reports_dir"])
    figures_dir = ensure_dir(cfg["paths"]["figures_dir"])

    device = get_default_device()
    model, ckpt = load_checkpoint_model(checkpoint_path, device=device)
    _, class_to_idx, classes = load_label_map(manifests_dir / "label_map.json")

    img_size = int(ckpt.get("image_size", cfg["image"]["size"]))
    mean = list(ckpt.get("mean", cfg["image"]["mean"]))
    std = list(ckpt.get("std", cfg["image"]["std"]))
    eval_tf = build_eval_transforms(img_size, mean, std)

    def _make_loader(parquet_path: Path, is_ood: bool = False) -> DataLoader | None:
        if not parquet_path.exists():
            return None
        df = pd.read_parquet(parquet_path)
        if df.empty:
            return None
        ds = CropDiseaseDataset(
            df,
            class_to_idx=None if is_ood else class_to_idx,
            transform=eval_tf,
        )
        return DataLoader(ds, batch_size=batch_size, shuffle=False, num_workers=num_workers)

    val_loader = _make_loader(manifests_dir / "val.parquet")
    test_loader = _make_loader(manifests_dir / "test.parquet")
    field_loader = _make_loader(manifests_dir / "test_field.parquet")
    ood_loader = _make_loader(manifests_dir / "ood_negatives.parquet", is_ood=True)

    if val_loader is None or test_loader is None:
        raise FileNotFoundError("Missing val.parquet or test.parquet under manifests directory.")

    val_logits, val_targets = _collect_logits(model, val_loader, device)
    test_logits, test_targets = _collect_logits(model, test_loader, device)

    # 1. Calibration (Temperature Scaling + ECE)
    cal_report = fit_temperature_scaling(
        val_logits,
        val_targets,
        plot_path=figures_dir / "reliability_diagram.png",
    )
    temperature = float(cal_report["temperature"])

    # 2. OOD threshold tuning
    ood_logits: np.ndarray | None = None
    if ood_loader is not None:
        ood_logits, _ = _collect_logits(model, ood_loader, device)
    ood_report = tune_ood_thresholds(
        id_logits=val_logits,
        ood_logits=ood_logits,
        temperature=temperature,
        default_conf_threshold=float(cfg["ood"].get("confidence_threshold", 0.55)),
        default_energy_threshold=float(cfg["ood"].get("energy_threshold", -3.5)),
        plot_path=figures_dir / "ood_score_distributions.png",
    )

    # 3. In-Domain Test Metrics
    test_metrics = compute_classification_metrics(
        test_targets, test_logits, classes, temperature=temperature
    )
    plot_confusion_matrix(
        np.array(test_metrics["confusion_matrix"]),
        classes,
        figures_dir / "confusion_matrix_test.png",
        title="Confusion Matrix — In-Domain Test Split",
    )
    save_per_class_csv(test_metrics["per_class"], reports_dir / "per_class_metrics_test.csv")

    # 4. Real-Field (PlantDoc) Generalization Gap
    field_metrics: dict[str, Any] | None = None
    lab_to_field_gap: dict[str, float] | None = None
    if field_loader is not None:
        field_logits, field_targets = _collect_logits(model, field_loader, device)
        field_metrics = compute_classification_metrics(
            field_targets, field_logits, classes, temperature=temperature
        )
        plot_confusion_matrix(
            np.array(field_metrics["confusion_matrix"]),
            classes,
            figures_dir / "confusion_matrix_field.png",
            title="Confusion Matrix — Real-Field PlantDoc Test",
        )
        save_per_class_csv(field_metrics["per_class"], reports_dir / "per_class_metrics_field.csv")
        lab_to_field_gap = {
            "accuracy_gap": round(test_metrics["accuracy"] - field_metrics["accuracy"], 4),
            "macro_f1_gap": round(test_metrics["macro_f1"] - field_metrics["macro_f1"], 4),
        }

    # 5. Grad-CAM gallery + parity check
    test_df = pd.read_parquet(manifests_dir / "test.parquet")
    gallery_df = test_df.sample(n=min(6, len(test_df)), random_state=int(cfg.get("seed", 42)))
    cam_parity_corr = save_gradcam_gallery(
        model=model,
        samples=gallery_df.to_dict(orient="records"),
        eval_transform=eval_tf,
        classes=classes,
        out_path=figures_dir / "gradcam_samples.png",
    )

    calibration_bundle = {
        "backbone": ckpt["backbone"],
        "temperature": temperature,
        "calibration": cal_report,
        "ood": ood_report,
        "gradcam_pytorch_vs_cam_corr": round(cam_parity_corr, 4),
    }
    save_json(calibration_bundle, artifacts_dir / "calibration_report.json")

    eval_report = {
        "checkpoint": str(checkpoint_path),
        "backbone": ckpt["backbone"],
        "calibration": cal_report,
        "ood": ood_report,
        "test_in_domain": {k: v for k, v in test_metrics.items() if k != "confusion_matrix"},
        "test_real_field": (
            {k: v for k, v in field_metrics.items() if k != "confusion_matrix"}
            if field_metrics is not None
            else None
        ),
        "lab_to_field_gap": lab_to_field_gap,
        "gradcam_parity_corr": round(cam_parity_corr, 4),
    }
    save_json(eval_report, reports_dir / "evaluation_report.json")

    print("\n==================== Evaluation Summary ====================")
    print(f"Backbone           : {ckpt['backbone']}")
    print(f"Temperature (T)    : {temperature:.4f} | ECE: {cal_report['ece_before']:.4f} -> {cal_report['ece_after']:.4f}")
    print(f"In-Domain Test     : Acc={test_metrics['accuracy']:.4f} | Macro-F1={test_metrics['macro_f1']:.4f} | OvR AUC={test_metrics['roc_auc_macro']}")
    if field_metrics is not None and lab_to_field_gap is not None:
        print(
            f"Real-Field PlantDoc: Acc={field_metrics['accuracy']:.4f} | "
            f"Macro-F1={field_metrics['macro_f1']:.4f} | "
            f"Gap(Acc={lab_to_field_gap['accuracy_gap']:+.4f}, F1={lab_to_field_gap['macro_f1_gap']:+.4f})"
        )
    print(f"OOD Thresholds     : conf < {ood_report['confidence_threshold']} OR energy > {ood_report['energy_threshold']}")
    print(f"Grad-CAM Parity    : r = {cam_parity_corr:.4f}")
    return eval_report


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Evaluate trained Crop Disease model.")
    parser.add_argument("--checkpoint", default="artifacts/best_model.pt")
    parser.add_argument("--base", default="configs/base.yaml")
    parser.add_argument("--batch-size", type=int, default=48)
    parser.add_argument("--num-workers", type=int, default=2)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    cfg = load_yaml(args.base)
    evaluate_model(
        checkpoint_path=args.checkpoint,
        cfg=cfg,
        batch_size=args.batch_size,
        num_workers=args.num_workers,
    )


if __name__ == "__main__":
    main()

