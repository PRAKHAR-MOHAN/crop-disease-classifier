"""Albumentations field-realistic image augmentations and batch MixUp/CutMix collator."""

from __future__ import annotations

from typing import Sequence

import albumentations as A
import numpy as np
import torch
from albumentations.pytorch import ToTensorV2


def _make_random_resized_crop(image_size: int) -> A.BasicTransform:
    try:
        return A.RandomResizedCrop(
            size=(image_size, image_size),
            scale=(0.65, 1.0),
            ratio=(0.8, 1.25),
            p=1.0,
        )
    except TypeError:
        return A.RandomResizedCrop(
            height=image_size,
            width=image_size,
            scale=(0.65, 1.0),
            ratio=(0.8, 1.25),
            p=1.0,
        )


def _make_coarse_dropout(image_size: int) -> A.BasicTransform:
    max_hole = max(12, int(image_size * 0.14))
    try:
        return A.CoarseDropout(
            num_holes_range=(1, 4),
            hole_height_range=(8, max_hole),
            hole_width_range=(8, max_hole),
            p=0.25,
        )
    except TypeError:
        return A.CoarseDropout(p=0.25)


def build_train_transforms(
    image_size: int = 224,
    mean: Sequence[float] = (0.485, 0.456, 0.406),
    std: Sequence[float] = (0.229, 0.224, 0.225),
) -> A.Compose:
    """Build Albumentations training pipeline simulating real-field lighting, noise, and angles."""
    return A.Compose(
        [
            _make_random_resized_crop(image_size),
            A.HorizontalFlip(p=0.5),
            A.VerticalFlip(p=0.3),
            A.RandomRotate90(p=0.5),
            A.Affine(
                scale=(0.90, 1.10),
                translate_percent=(-0.05, 0.05),
                rotate=(-25, 25),
                p=0.6,
            ),
            A.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.05, p=0.6),
            A.RandomBrightnessContrast(brightness_limit=0.2, contrast_limit=0.2, p=0.4),
            A.RandomShadow(p=0.2),
            A.OneOf(
                [
                    A.GaussianBlur(blur_limit=(3, 5), p=1.0),
                    A.MotionBlur(blur_limit=(3, 5), p=1.0),
                ],
                p=0.25,
            ),
            A.OneOf(
                [
                    A.GaussNoise(p=1.0),
                    A.ISONoise(p=1.0),
                ],
                p=0.25,
            ),
            _make_coarse_dropout(image_size),
            A.Normalize(mean=list(mean), std=list(std)),
            ToTensorV2(),
        ]
    )


def build_eval_transforms(
    image_size: int = 224,
    mean: Sequence[float] = (0.485, 0.456, 0.406),
    std: Sequence[float] = (0.229, 0.224, 0.225),
) -> A.Compose:
    """Build deterministic validation/test preprocessing pipeline."""
    resize_dim = int(round(image_size * 1.14))
    return A.Compose(
        [
            A.Resize(resize_dim, resize_dim),
            A.CenterCrop(image_size, image_size),
            A.Normalize(mean=list(mean), std=list(std)),
            ToTensorV2(),
        ]
    )


class MixupCutmixCollator:
    """Batch-level MixUp and CutMix producing soft label distributions safely for any batch size."""

    def __init__(
        self,
        num_classes: int,
        mixup_alpha: float = 0.2,
        cutmix_alpha: float = 1.0,
        prob: float = 0.5,
        switch_prob: float = 0.5,
        label_smoothing: float = 0.1,
    ) -> None:
        self.num_classes = num_classes
        self.mixup_alpha = mixup_alpha
        self.cutmix_alpha = cutmix_alpha
        self.prob = prob
        self.switch_prob = switch_prob
        self.label_smoothing = label_smoothing

    def _one_hot_smooth(self, targets: torch.Tensor) -> torch.Tensor:
        off_value = self.label_smoothing / self.num_classes
        on_value = 1.0 - self.label_smoothing + off_value
        soft = torch.full(
            (targets.shape[0], self.num_classes),
            fill_value=off_value,
            dtype=torch.float32,
            device=targets.device,
        )
        soft.scatter_(1, targets.unsqueeze(1).long(), on_value)
        return soft

    def __call__(self, images: torch.Tensor, targets: torch.Tensor) -> tuple[torch.Tensor, torch.Tensor]:
        soft_targets = self._one_hot_smooth(targets)
        batch_size, _, height, width = images.shape
        if batch_size < 2 or np.random.rand() > self.prob:
            return images, soft_targets

        perm = torch.randperm(batch_size, device=images.device)
        use_cutmix = self.cutmix_alpha > 0 and (
            self.mixup_alpha <= 0 or np.random.rand() < self.switch_prob
        )

        if use_cutmix:
            lam = float(np.random.beta(self.cutmix_alpha, self.cutmix_alpha))
            cut_rat = np.sqrt(1.0 - lam)
            cut_w = int(width * cut_rat)
            cut_h = int(height * cut_rat)
            cx = int(np.random.randint(width))
            cy = int(np.random.randint(height))
            x1 = int(np.clip(cx - cut_w // 2, 0, width))
            x2 = int(np.clip(cx + cut_w // 2, 0, width))
            y1 = int(np.clip(cy - cut_h // 2, 0, height))
            y2 = int(np.clip(cy + cut_h // 2, 0, height))

            mixed = images.clone()
            mixed[:, :, y1:y2, x1:x2] = images[perm, :, y1:y2, x1:x2]
            lam_adj = 1.0 - ((x2 - x1) * (y2 - y1) / float(width * height))
            mixed_targets = lam_adj * soft_targets + (1.0 - lam_adj) * soft_targets[perm]
            return mixed, mixed_targets

        lam = float(np.random.beta(self.mixup_alpha, self.mixup_alpha))
        mixed = lam * images + (1.0 - lam) * images[perm]
        mixed_targets = lam * soft_targets + (1.0 - lam) * soft_targets[perm]
        return mixed, mixed_targets

