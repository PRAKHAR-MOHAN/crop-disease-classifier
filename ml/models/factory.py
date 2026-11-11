"""Backbone factory wrapping timm models (EfficientNetV2-S, ConvNeXt-Tiny, Swin-Tiny, ViT-Small).

Every wrapped model exposes:
- `forward(x) -> logits` for standard training and calibration
- `forward_with_features(x) -> (logits, spatial_feature_map_nchw)` for ONNX export & Grad-CAM
- Two-stage freeze/unfreeze and discriminative learning-rate parameter groups
"""

from __future__ import annotations

import math
from pathlib import Path
from typing import Any

import timm
import torch
import torch.nn as nn


class CropClassifier(nn.Module):
    """Unified classifier wrapper over timm CNN and Transformer backbones."""

    def __init__(
        self,
        backbone_name: str,
        num_classes: int,
        pretrained: bool = True,
        drop_rate: float = 0.3,
        drop_path_rate: float = 0.2,
    ) -> None:
        super().__init__()
        self.backbone_name = backbone_name
        self.num_classes = num_classes

        self.backbone = timm.create_model(
            backbone_name,
            pretrained=pretrained,
            num_classes=0,
            drop_rate=drop_rate,
            drop_path_rate=drop_path_rate,
        )
        self.num_features: int = int(self.backbone.num_features)
        self.dropout = nn.Dropout(p=drop_rate) if drop_rate > 0 else nn.Identity()
        self.classifier = nn.Linear(self.num_features, num_classes)

        nn.init.trunc_normal_(self.classifier.weight, std=0.02)
        if self.classifier.bias is not None:
            nn.init.zeros_(self.classifier.bias)

    def _to_nchw_spatial_map(self, feats: torch.Tensor) -> torch.Tensor:
        """Convert backbone features (NCHW, NHWC for Swin, or BLC tokens for ViT) to NCHW."""
        if feats.ndim == 4:
            # Swin returns (B, H, W, C); CNNs & ConvNeXt return (B, C, H, W)
            if feats.shape[1] != self.num_features and feats.shape[-1] == self.num_features:
                return feats.permute(0, 3, 1, 2).contiguous()
            return feats

        if feats.ndim == 3:
            num_prefix = int(getattr(self.backbone, "num_prefix_tokens", 1))
            patch_tokens = feats[:, num_prefix:, :]
            n_tokens = patch_tokens.shape[1]
            side = int(math.isqrt(n_tokens))
            if side * side != n_tokens:
                # Fallback to 1x1 pooled spatial map if non-square tokens occur
                return patch_tokens.mean(dim=1).unsqueeze(-1).unsqueeze(-1)
            return (
                patch_tokens.reshape(feats.shape[0], side, side, self.num_features)
                .permute(0, 3, 1, 2)
                .contiguous()
            )

        # Fallback for 2D (B, C) tensors
        return feats.unsqueeze(-1).unsqueeze(-1)

    def forward_with_features(self, x: torch.Tensor) -> tuple[torch.Tensor, torch.Tensor]:
        """Return `(logits, spatial_feature_map_nchw)` for dual-output ONNX export and Grad-CAM."""
        raw_feats = self.backbone.forward_features(x)
        pooled = self.backbone.forward_head(raw_feats, pre_logits=True)
        logits = self.classifier(self.dropout(pooled))
        spatial_map = self._to_nchw_spatial_map(raw_feats)
        return logits, spatial_map

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """Forward pass returning classification logits."""
        logits, _ = self.forward_with_features(x)
        return logits

    def freeze_backbone(self) -> None:
        """Freeze all backbone weights so only the classifier head trains (Stage 1)."""
        for param in self.backbone.parameters():
            param.requires_grad = False
        for param in self.classifier.parameters():
            param.requires_grad = True

    def unfreeze_backbone(self) -> None:
        """Unfreeze the entire model for end-to-end discriminative fine-tuning (Stage 2)."""
        for param in self.parameters():
            param.requires_grad = True

    def get_param_groups(
        self,
        backbone_lr: float,
        head_lr: float,
        weight_decay: float,
    ) -> list[dict[str, Any]]:
        """Build AdamW parameter groups with discriminative LRs and no-decay on norms/biases."""
        no_decay_keywords = ("bias", "norm", "bn", "ln", "gamma", "beta")

        groups: dict[tuple[str, str], list[nn.Parameter]] = {
            ("backbone", "decay"): [],
            ("backbone", "no_decay"): [],
            ("head", "decay"): [],
            ("head", "no_decay"): [],
        }

        for name, param in self.backbone.named_parameters():
            if not param.requires_grad:
                continue
            is_no_decay = param.ndim <= 1 or any(k in name.lower() for k in no_decay_keywords)
            bucket = "no_decay" if is_no_decay else "decay"
            groups[("backbone", bucket)].append(param)

        for name, param in self.classifier.named_parameters():
            if not param.requires_grad:
                continue
            is_no_decay = param.ndim <= 1 or name.endswith("bias")
            bucket = "no_decay" if is_no_decay else "decay"
            groups[("head", bucket)].append(param)

        param_groups: list[dict[str, Any]] = []
        lr_map = {"backbone": backbone_lr, "head": head_lr}
        for (part, decay_kind), params in groups.items():
            if params:
                param_groups.append(
                    {
                        "params": params,
                        "lr": lr_map[part],
                        "weight_decay": 0.0 if decay_kind == "no_decay" else weight_decay,
                        "group_name": f"{part}_{decay_kind}",
                    }
                )
        return param_groups


def create_model(
    backbone_name: str,
    num_classes: int,
    pretrained: bool = True,
    drop_rate: float = 0.3,
    drop_path_rate: float = 0.2,
) -> CropClassifier:
    """Instantiate a CropClassifier from config parameters."""
    return CropClassifier(
        backbone_name=backbone_name,
        num_classes=num_classes,
        pretrained=pretrained,
        drop_rate=drop_rate,
        drop_path_rate=drop_path_rate,
    )


def load_checkpoint_model(
    checkpoint_path: str | Path,
    device: torch.device | str = "cpu",
) -> tuple[CropClassifier, dict[str, Any]]:
    """Load a saved training checkpoint (`best.pt`) and return `(model, metadata)`."""
    ckpt = torch.load(Path(checkpoint_path), map_location=device, weights_only=False)
    model = create_model(
        backbone_name=ckpt["backbone"],
        num_classes=int(ckpt["num_classes"]),
        pretrained=False,
        drop_rate=float(ckpt.get("drop_rate", 0.0)),
        drop_path_rate=0.0,
    )
    model.load_state_dict(ckpt["model_state_dict"], strict=True)
    model.to(device)
    model.eval()
    return model, ckpt

