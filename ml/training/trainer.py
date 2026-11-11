"""Two-stage trainer with AMP, cosine LR + warmup, EMA, gradient clipping, and early stopping."""

from __future__ import annotations

import math
import time
from collections.abc import Callable
from pathlib import Path
from typing import Any

import numpy as np
import torch
import torch.nn as nn
from sklearn.metrics import accuracy_score, f1_score
from timm.utils import ModelEmaV2
from torch.utils.data import DataLoader
from tqdm import tqdm

from ml.models.factory import CropClassifier
from ml.models.losses import build_loss_fn
from ml.training.augmentations import MixupCutmixCollator
from ml.utils.io import ensure_dir, save_json
from ml.utils.seed import get_default_device
from ml.utils.tracking import ExperimentTracker


def build_cosine_warmup_scheduler(
    optimizer: torch.optim.Optimizer,
    warmup_epochs: int,
    total_epochs: int,
    steps_per_epoch: int,
    min_lr_ratio: float = 0.01,
) -> torch.optim.lr_scheduler.LambdaLR:
    """Create step-level linear warmup followed by cosine decay LR scheduler."""
    total_steps = max(1, total_epochs * steps_per_epoch)
    warmup_steps = max(0, warmup_epochs * steps_per_epoch)

    def lr_lambda(current_step: int) -> float:
        if warmup_steps > 0 and current_step < warmup_steps:
            return float(current_step + 1) / float(warmup_steps)
        progress = float(current_step - warmup_steps) / float(max(1, total_steps - warmup_steps))
        progress = min(max(progress, 0.0), 1.0)
        cosine = 0.5 * (1.0 + math.cos(math.pi * progress))
        return min_lr_ratio + (1.0 - min_lr_ratio) * cosine

    return torch.optim.lr_scheduler.LambdaLR(optimizer, lr_lambda=lr_lambda)


@torch.no_grad()
def evaluate_epoch(
    model: nn.Module,
    loader: DataLoader,
    device: torch.device,
    criterion: nn.Module,
    amp_enabled: bool = True,
) -> dict[str, float]:
    """Run validation pass and return loss, accuracy, and macro-F1."""
    model.eval()
    total_loss = 0.0
    total_samples = 0
    all_preds: list[int] = []
    all_targets: list[int] = []
    device_type = "cuda" if device.type == "cuda" else "cpu"

    for images, targets in loader:
        images = images.to(device, non_blocking=True)
        targets = targets.to(device, non_blocking=True)
        with torch.amp.autocast(device_type=device_type, enabled=amp_enabled and device.type == "cuda"):
            logits = model(images)
            loss = criterion(logits, targets)

        bs = images.shape[0]
        total_loss += float(loss.item()) * bs
        total_samples += bs
        preds = logits.argmax(dim=-1).cpu().tolist()
        all_preds.extend(preds)
        all_targets.extend(targets.cpu().tolist())

    acc = float(accuracy_score(all_targets, all_preds))
    macro_f1 = float(f1_score(all_targets, all_preds, average="macro", zero_division=0))
    return {
        "loss": total_loss / max(total_samples, 1),
        "acc": acc,
        "macro_f1": macro_f1,
    }


class TwoStageTrainer:
    """Two-stage supervised trainer: frozen-head warmup followed by discriminative fine-tuning."""

    def __init__(
        self,
        model: CropClassifier,
        train_loader: DataLoader,
        val_loader: DataLoader,
        cfg: dict[str, Any],
        classes: list[str],
        class_weights: torch.Tensor | None = None,
        output_dir: str | Path | None = None,
        tracker: ExperimentTracker | None = None,
        epoch_callback: Callable[[int, dict[str, float]], None] | None = None,
    ) -> None:
        self.model = model
        self.train_loader = train_loader
        self.val_loader = val_loader
        self.cfg = cfg
        self.classes = classes
        self.num_classes = len(classes)
        self.tracker = tracker
        self.epoch_callback = epoch_callback

        self.device = get_default_device()
        self.model.to(self.device)
        self.class_weights = class_weights.to(self.device) if class_weights is not None else None

        exp_name = str(cfg.get("experiment_name", model.backbone_name))
        artifacts_dir = Path(cfg["paths"]["artifacts_dir"])
        self.output_dir = ensure_dir(output_dir or (artifacts_dir / "runs" / exp_name))

        tr_cfg = cfg["training"]
        self.amp_enabled = bool(tr_cfg.get("amp", True)) and self.device.type == "cuda"
        self.grad_clip_norm = float(tr_cfg.get("grad_clip_norm", 1.0))
        self.label_smoothing = float(tr_cfg.get("label_smoothing", 0.1))

        mix_cfg = tr_cfg.get("mixup", {})
        self.mixup_enabled = bool(mix_cfg.get("enabled", True))
        self.mixup = (
            MixupCutmixCollator(
                num_classes=self.num_classes,
                mixup_alpha=float(mix_cfg.get("mixup_alpha", 0.2)),
                cutmix_alpha=float(mix_cfg.get("cutmix_alpha", 1.0)),
                prob=float(mix_cfg.get("prob", 0.5)),
                switch_prob=float(mix_cfg.get("switch_prob", 0.5)),
                label_smoothing=self.label_smoothing,
            )
            if self.mixup_enabled
            else None
        )

        self.train_criterion = build_loss_fn(
            class_weights=self.class_weights,
            label_smoothing=self.label_smoothing,
            soft_targets=self.mixup_enabled,
        ).to(self.device)
        self.val_criterion = build_loss_fn(
            class_weights=None,
            label_smoothing=0.0,
            soft_targets=False,
        ).to(self.device)

        amp_device = "cuda" if self.device.type == "cuda" else "cpu"
        self.scaler = torch.amp.GradScaler(amp_device, enabled=self.amp_enabled)
        self.ema_cfg = tr_cfg.get("ema", {})
        self.ema: ModelEmaV2 | None = None

    def _run_train_epoch(
        self,
        optimizer: torch.optim.Optimizer,
        scheduler: torch.optim.lr_scheduler.LambdaLR,
        epoch_label: str,
    ) -> float:
        self.model.train()
        running_loss = 0.0
        total_samples = 0
        device_type = "cuda" if self.device.type == "cuda" else "cpu"

        pbar = tqdm(self.train_loader, desc=epoch_label, leave=False)
        for images, targets in pbar:
            images = images.to(self.device, non_blocking=True)
            targets = targets.to(self.device, non_blocking=True)

            if self.mixup is not None:
                images, batch_targets = self.mixup(images, targets)
            else:
                batch_targets = targets

            optimizer.zero_grad(set_to_none=True)
            with torch.amp.autocast(device_type=device_type, enabled=self.amp_enabled):
                logits = self.model(images)
                loss = self.train_criterion(logits, batch_targets)

            self.scaler.scale(loss).backward()
            if self.grad_clip_norm > 0:
                self.scaler.unscale_(optimizer)
                torch.nn.utils.clip_grad_norm_(self.model.parameters(), self.grad_clip_norm)

            self.scaler.step(optimizer)
            self.scaler.update()
            scheduler.step()

            if self.ema is not None:
                self.ema.update(self.model)

            bs = images.shape[0]
            running_loss += float(loss.item()) * bs
            total_samples += bs
            pbar.set_postfix(loss=f"{running_loss / max(total_samples, 1):.4f}")

        return running_loss / max(total_samples, 1)

    def _save_checkpoint(
        self,
        path: Path,
        eval_model: nn.Module,
        epoch: int,
        val_metrics: dict[str, float],
    ) -> None:
        torch.save(
            {
                "epoch": epoch,
                "backbone": self.model.backbone_name,
                "num_classes": self.num_classes,
                "classes": self.classes,
                "image_size": int(self.cfg["image"]["size"]),
                "mean": list(self.cfg["image"]["mean"]),
                "std": list(self.cfg["image"]["std"]),
                "drop_rate": float(self.cfg["model"].get("drop_rate", 0.3)),
                "val_macro_f1": val_metrics["macro_f1"],
                "val_acc": val_metrics["acc"],
                "val_loss": val_metrics["loss"],
                "model_state_dict": eval_model.state_dict(),
            },
            path,
        )

    def fit(self, max_stage2_epochs: int | None = None) -> dict[str, Any]:
        """Execute Stage 1 (frozen head) + Stage 2 (unfrozen fine-tune) training."""
        start_time = time.time()
        tr_cfg = self.cfg["training"]
        s1_cfg = tr_cfg["stage1"]
        s2_cfg = tr_cfg["stage2"]

        best_f1 = -1.0
        best_acc = 0.0
        best_epoch = 0
        global_epoch = 0
        history: list[dict[str, Any]] = []
        best_ckpt_path = self.output_dir / "best.pt"

        # --- Stage 1: Frozen backbone head warmup ---
        s1_epochs = int(s1_cfg.get("epochs", 4))
        if s1_epochs > 0:
            print(f"[trainer] Stage 1: Training classifier head ({s1_epochs} epochs, backbone frozen)")
            self.model.freeze_backbone()
            s1_opt = torch.optim.AdamW(
                self.model.get_param_groups(
                    backbone_lr=0.0,
                    head_lr=float(s1_cfg["lr"]),
                    weight_decay=float(s1_cfg.get("weight_decay", 1e-2)),
                )
            )
            s1_sched = build_cosine_warmup_scheduler(
                s1_opt,
                warmup_epochs=int(s1_cfg.get("warmup_epochs", 1)),
                total_epochs=s1_epochs,
                steps_per_epoch=len(self.train_loader),
                min_lr_ratio=0.1,
            )

            for ep in range(1, s1_epochs + 1):
                global_epoch += 1
                tr_loss = self._run_train_epoch(s1_opt, s1_sched, f"Stage1 {ep}/{s1_epochs}")
                val_metrics = evaluate_epoch(
                    self.model, self.val_loader, self.device, self.val_criterion, self.amp_enabled
                )
                row = {
                    "epoch": global_epoch,
                    "stage": 1,
                    "train_loss": tr_loss,
                    "val_loss": val_metrics["loss"],
                    "val_acc": val_metrics["acc"],
                    "val_macro_f1": val_metrics["macro_f1"],
                }
                history.append(row)
                if self.tracker:
                    self.tracker.log_metrics(row, step=global_epoch)

                print(
                    f"  [S1 E{ep:02d}] train_loss={tr_loss:.4f} | "
                    f"val_loss={val_metrics['loss']:.4f} | val_acc={val_metrics['acc']:.4f} | "
                    f"val_macro_f1={val_metrics['macro_f1']:.4f}"
                )
                if val_metrics["macro_f1"] > best_f1:
                    best_f1 = val_metrics["macro_f1"]
                    best_acc = val_metrics["acc"]
                    best_epoch = global_epoch
                    self._save_checkpoint(best_ckpt_path, self.model, global_epoch, val_metrics)

                if self.epoch_callback is not None:
                    self.epoch_callback(global_epoch, row)

        # --- Stage 2: Unfreeze all layers with discriminative learning rates + EMA ---
        s2_epochs = int(max_stage2_epochs or s2_cfg.get("epochs", 16))
        patience = int(s2_cfg.get("early_stopping_patience", 5))
        no_improve = 0

        print(
            f"[trainer] Stage 2: Fine-tuning full model ({s2_epochs} epochs, "
            f"backbone_lr={s2_cfg['backbone_lr']}, head_lr={s2_cfg['head_lr']})"
        )
        self.model.unfreeze_backbone()
        s2_opt = torch.optim.AdamW(
            self.model.get_param_groups(
                backbone_lr=float(s2_cfg["backbone_lr"]),
                head_lr=float(s2_cfg["head_lr"]),
                weight_decay=float(s2_cfg.get("weight_decay", 1e-2)),
            )
        )
        min_lr_ratio = float(s2_cfg.get("min_lr", 1e-6)) / max(float(s2_cfg["head_lr"]), 1e-9)
        s2_sched = build_cosine_warmup_scheduler(
            s2_opt,
            warmup_epochs=int(s2_cfg.get("warmup_epochs", 2)),
            total_epochs=s2_epochs,
            steps_per_epoch=len(self.train_loader),
            min_lr_ratio=min_lr_ratio,
        )

        if bool(self.ema_cfg.get("enabled", True)):
            self.ema = ModelEmaV2(self.model, decay=float(self.ema_cfg.get("decay", 0.999)))

        for ep in range(1, s2_epochs + 1):
            global_epoch += 1
            tr_loss = self._run_train_epoch(s2_opt, s2_sched, f"Stage2 {ep}/{s2_epochs}")
            eval_model = self.ema.module if self.ema is not None else self.model
            val_metrics = evaluate_epoch(
                eval_model, self.val_loader, self.device, self.val_criterion, self.amp_enabled
            )
            row = {
                "epoch": global_epoch,
                "stage": 2,
                "train_loss": tr_loss,
                "val_loss": val_metrics["loss"],
                "val_acc": val_metrics["acc"],
                "val_macro_f1": val_metrics["macro_f1"],
                "backbone_lr": float(s2_opt.param_groups[0]["lr"]),
            }
            history.append(row)
            if self.tracker:
                self.tracker.log_metrics(row, step=global_epoch)

            print(
                f"  [S2 E{ep:02d}] train_loss={tr_loss:.4f} | "
                f"val_loss={val_metrics['loss']:.4f} | val_acc={val_metrics['acc']:.4f} | "
                f"val_macro_f1={val_metrics['macro_f1']:.4f}"
            )

            if val_metrics["macro_f1"] > best_f1:
                best_f1 = val_metrics["macro_f1"]
                best_acc = val_metrics["acc"]
                best_epoch = global_epoch
                no_improve = 0
                self._save_checkpoint(best_ckpt_path, eval_model, global_epoch, val_metrics)
            else:
                no_improve += 1

            self._save_checkpoint(self.output_dir / "last.pt", eval_model, global_epoch, val_metrics)

            if self.epoch_callback is not None:
                self.epoch_callback(global_epoch, row)

            if no_improve >= patience:
                print(f"[trainer] Early stopping triggered after {patience} epochs without F1 improvement.")
                break

        duration = time.time() - start_time
        summary = {
            "experiment_name": str(self.cfg.get("experiment_name", self.model.backbone_name)),
            "backbone": self.model.backbone_name,
            "best_epoch": best_epoch,
            "best_val_macro_f1": round(best_f1, 6),
            "best_val_acc": round(best_acc, 6),
            "checkpoint_path": str(best_ckpt_path.as_posix()),
            "duration_sec": round(duration, 2),
        }
        save_json({"summary": summary, "history": history}, self.output_dir / "train_history.json")
        if self.tracker:
            self.tracker.log_artifact(best_ckpt_path, artifact_type="model")
        return summary
