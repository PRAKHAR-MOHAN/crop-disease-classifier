"""Lightweight binary Plant/Pest vs. Non-Plant gate for out-of-distribution rejection.

Trains a compact MobileNetV3-Small classifier distinguishing agricultural crop/pest images
from non-plant negatives (data/manifests/ood_negatives.parquet), and exports `plant_gate.onnx`.

Usage:
    python -m ml.models.plant_gate --base configs/base.yaml --epochs 4
"""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
import timm
import torch
import torch.nn as nn
from PIL import Image, ImageOps
from sklearn.metrics import roc_auc_score
from torch.utils.data import DataLoader, Dataset
from tqdm import tqdm

from ml.training.augmentations import build_eval_transforms, build_train_transforms
from ml.utils.io import ensure_dir, load_yaml, save_json
from ml.utils.seed import get_default_device, seed_everything


class PlantGateNet(nn.Module):
    """Compact binary classifier returning scalar logit for `is_plant_or_pest`."""

    def __init__(
        self,
        backbone_name: str = "mobilenetv3_small_100.lamb_in1k",
        pretrained: bool = True,
    ) -> None:
        super().__init__()
        self.backbone_name = backbone_name
        self.model = timm.create_model(
            backbone_name,
            pretrained=pretrained,
            num_classes=1,
            drop_rate=0.2,
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.model(x).squeeze(-1)


class _BinaryImageDataset(Dataset):
    def __init__(self, paths: list[str], labels: list[float], transform: Any) -> None:
        self.paths = paths
        self.labels = labels
        self.transform = transform

    def __len__(self) -> int:
        return len(self.paths)

    def __getitem__(self, idx: int) -> tuple[torch.Tensor, torch.Tensor]:
        with Image.open(self.paths[idx]) as raw:
            img = ImageOps.exif_transpose(raw).convert("RGB")
            arr = np.array(img)
        tensor = self.transform(image=arr)["image"]
        return tensor, torch.tensor(self.labels[idx], dtype=torch.float32)


def train_plant_gate(
    cfg: dict[str, Any],
    epochs: int = 4,
    batch_size: int = 64,
    max_pos_samples: int = 4000,
) -> Path | None:
    """Train and export a fast binary Plant-vs-NonPlant gate to `artifacts/plant_gate.onnx`."""
    seed = int(cfg.get("seed", 42))
    seed_everything(seed)

    manifests_dir = Path(cfg["paths"]["manifests_dir"])
    artifacts_dir = ensure_dir(cfg["paths"]["artifacts_dir"])
    ood_path = manifests_dir / "ood_negatives.parquet"
    train_path = manifests_dir / "train.parquet"
    val_path = manifests_dir / "val.parquet"

    if not ood_path.exists() or not train_path.exists():
        print("[plant_gate] Missing train.parquet or ood_negatives.parquet; skipping gate training.")
        return None

    train_df = pd.read_parquet(train_path)
    val_df = pd.read_parquet(val_path)
    ood_df = pd.read_parquet(ood_path).sample(frac=1.0, random_state=seed).reset_index(drop=True)

    # Split OOD negatives 80/20 into gate train/val
    n_ood_val = max(100, int(0.2 * len(ood_df)))
    ood_val = ood_df.iloc[:n_ood_val]
    ood_train = ood_df.iloc[n_ood_val:]

    pos_train = train_df.sample(n=min(max_pos_samples, len(train_df)), random_state=seed)
    pos_val = val_df.sample(n=min(max(300, n_ood_val), len(val_df)), random_state=seed)

    img_size = int(cfg["image"].get("size", 224))
    mean = list(cfg["image"]["mean"])
    std = list(cfg["image"]["std"])

    tr_paths = pos_train["image_path"].tolist() + ood_train["image_path"].tolist()
    tr_labels = [1.0] * len(pos_train) + [0.0] * len(ood_train)
    va_paths = pos_val["image_path"].tolist() + ood_val["image_path"].tolist()
    va_labels = [1.0] * len(pos_val) + [0.0] * len(ood_val)

    tr_ds = _BinaryImageDataset(tr_paths, tr_labels, build_train_transforms(img_size, mean, std))
    va_ds = _BinaryImageDataset(va_paths, va_labels, build_eval_transforms(img_size, mean, std))

    tr_loader = DataLoader(tr_ds, batch_size=batch_size, shuffle=True, num_workers=2)
    va_loader = DataLoader(va_ds, batch_size=batch_size, shuffle=False, num_workers=2)

    device = get_default_device()
    model = PlantGateNet(pretrained=True).to(device)
    pos_weight = torch.tensor([len(ood_train) / max(len(pos_train), 1)], device=device)
    criterion = nn.BCEWithLogitsLoss(pos_weight=pos_weight)
    optimizer = torch.optim.AdamW(model.parameters(), lr=3e-4, weight_decay=1e-2)

    best_auc = 0.0
    best_state: dict[str, Any] | None = None

    for epoch in range(1, epochs + 1):
        model.train()
        for x, y in tqdm(tr_loader, desc=f"PlantGate Epoch {epoch}/{epochs}", leave=False):
            x, y = x.to(device), y.to(device)
            optimizer.zero_grad()
            loss = criterion(model(x), y)
            loss.backward()
            optimizer.step()

        model.eval()
        probs, targets = [], []
        with torch.no_grad():
            for x, y in va_loader:
                p = torch.sigmoid(model(x.to(device))).cpu().numpy()
                probs.extend(p.tolist())
                targets.extend(y.numpy().tolist())
        auc = float(roc_auc_score(targets, probs))
        print(f"[plant_gate] Epoch {epoch}: val ROC-AUC = {auc:.4f}")
        if auc >= best_auc:
            best_auc = auc
            best_state = {k: v.cpu().clone() for k, v in model.state_dict().items()}

    if best_state is not None:
        model.load_state_dict(best_state)
    model.cpu().eval()

    ckpt_path = artifacts_dir / "plant_gate.pt"
    torch.save({"model_state_dict": model.state_dict(), "val_auc": best_auc}, ckpt_path)

    onnx_path = artifacts_dir / "plant_gate.onnx"
    dummy = torch.randn(1, 3, img_size, img_size)
    torch.onnx.export(
        model,
        dummy,
        str(onnx_path),
        input_names=["image"],
        output_names=["plant_logit"],
        dynamic_axes={"image": {0: "batch"}, "plant_logit": {0: "batch"}},
        opset_version=17,
    )
    save_json({"val_auc": best_auc, "onnx_path": str(onnx_path)}, artifacts_dir / "plant_gate_meta.json")
    print(f"[plant_gate] Exported {onnx_path} (val AUC={best_auc:.4f}).")
    return onnx_path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train binary Plant/Pest vs. Non-Plant OOD gate.")
    parser.add_argument("--base", default="configs/base.yaml", help="Base config YAML.")
    parser.add_argument("--epochs", type=int, default=4)
    parser.add_argument("--batch-size", type=int, default=64)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    cfg = load_yaml(args.base)
    train_plant_gate(cfg, epochs=args.epochs, batch_size=args.batch_size)


if __name__ == "__main__":
    main()

