"""Loss functions supporting class imbalance weights, soft MixUp/CutMix targets, and KD."""

from __future__ import annotations

import torch
import torch.nn as nn
import torch.nn.functional as F


class WeightedSoftTargetCrossEntropy(nn.Module):
    """Cross-entropy loss for soft MixUp/CutMix probability targets with optional class weights."""

    def __init__(self, class_weights: torch.Tensor | None = None) -> None:
        super().__init__()
        if class_weights is not None:
            self.register_buffer("class_weights", class_weights.float())
        else:
            self.class_weights = None

    def forward(self, logits: torch.Tensor, target_probs: torch.Tensor) -> torch.Tensor:
        log_probs = F.log_softmax(logits, dim=-1)
        if self.class_weights is not None:
            # Weight each sample by its soft-target mixture of class weights
            sample_w = (target_probs * self.class_weights.unsqueeze(0)).sum(dim=-1)
            per_sample_loss = -(target_probs * log_probs).sum(dim=-1)
            return (per_sample_loss * sample_w).sum() / sample_w.sum().clamp_min(1e-8)
        return -(target_probs * log_probs).sum(dim=-1).mean()


class DistillationLoss(nn.Module):
    """Knowledge distillation combining ground-truth CE and KL divergence against teacher logits."""

    def __init__(
        self,
        temperature: float = 4.0,
        alpha_kd: float = 0.5,
        class_weights: torch.Tensor | None = None,
        label_smoothing: float = 0.05,
    ) -> None:
        super().__init__()
        self.temperature = temperature
        self.alpha_kd = alpha_kd
        self.ce = nn.CrossEntropyLoss(
            weight=class_weights.float() if class_weights is not None else None,
            label_smoothing=label_smoothing,
        )

    def forward(
        self,
        student_logits: torch.Tensor,
        teacher_logits: torch.Tensor,
        targets: torch.Tensor,
    ) -> torch.Tensor:
        hard_loss = self.ce(student_logits, targets)
        t = self.temperature
        student_log_probs = F.log_softmax(student_logits / t, dim=-1)
        teacher_probs = F.softmax(teacher_logits / t, dim=-1)
        kd_loss = F.kl_div(student_log_probs, teacher_probs, reduction="batchmean") * (t * t)
        return (1.0 - self.alpha_kd) * hard_loss + self.alpha_kd * kd_loss


def build_loss_fn(
    class_weights: torch.Tensor | None = None,
    label_smoothing: float = 0.1,
    soft_targets: bool = False,
) -> nn.Module:
    """Create hard-label or soft-target cross-entropy loss with optional class weights."""
    if soft_targets:
        return WeightedSoftTargetCrossEntropy(class_weights=class_weights)
    return nn.CrossEntropyLoss(
        weight=class_weights.float() if class_weights is not None else None,
        label_smoothing=label_smoothing,
    )

