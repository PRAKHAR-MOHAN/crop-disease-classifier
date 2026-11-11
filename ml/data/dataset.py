"""PyTorch Dataset and weighted sampler utilities."""

from __future__ import annotations

from collections.abc import Callable
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
import torch
from PIL import Image, ImageOps
from torch.utils.data import Dataset, WeightedRandomSampler


class CropDiseaseDataset(Dataset):
    """PyTorch Dataset backed by Parquet manifests with EXIF-safe RGB loading."""

    def __init__(
        self,
        manifest: str | Path | pd.DataFrame,
        class_to_idx: dict[str, int] | None = None,
        transform: Callable[..., dict[str, Any]] | None = None,
        return_meta: bool = False,
    ) -> None:
        if isinstance(manifest, pd.DataFrame):
            self.df = manifest.reset_index(drop=True)
        else:
            self.df = pd.read_parquet(manifest).reset_index(drop=True)

        self.transform = transform
        self.return_meta = return_meta

        if "target" in self.df.columns:
            self.targets = self.df["target"].astype(int).tolist()
        elif class_to_idx is not None:
            self.targets = [int(class_to_idx[lbl]) for lbl in self.df["label"]]
        else:
            self.targets = [0] * len(self.df)

        self.paths = self.df["image_path"].astype(str).tolist()
        self.labels = (
            self.df["label"].astype(str).tolist()
            if "label" in self.df.columns
            else ["unknown"] * len(self.df)
        )
        self.domains = (
            self.df["domain"].astype(str).tolist()
            if "domain" in self.df.columns
            else ["unknown"] * len(self.df)
        )

    def __len__(self) -> int:
        return len(self.paths)

    def __getitem__(self, idx: int) -> tuple[Any, ...] | tuple[torch.Tensor, int]:
        path = self.paths[idx]
        with Image.open(path) as img_raw:
            img = ImageOps.exif_transpose(img_raw).convert("RGB")
            img_np = np.array(img)

        if self.transform is not None:
            tensor = self.transform(image=img_np)["image"]
        else:
            tensor = torch.from_numpy(img_np).permute(2, 0, 1).float() / 255.0

        target = self.targets[idx]
        if self.return_meta:
            return tensor, target, {
                "path": path,
                "label": self.labels[idx],
                "domain": self.domains[idx],
            }
        return tensor, target


def build_weighted_sampler(
    df: pd.DataFrame,
    class_weights: dict[str, float],
) -> WeightedRandomSampler:
    """Create a PyTorch WeightedRandomSampler aligned with per-class imbalance weights."""
    sample_weights = np.array(
        [float(class_weights.get(lbl, 1.0)) for lbl in df["label"]],
        dtype=np.float64,
    )
    return WeightedRandomSampler(
        weights=torch.from_numpy(sample_weights),
        num_samples=len(sample_weights),
        replacement=True,
    )

