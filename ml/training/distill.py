"""Knowledge distillation from one or more teacher checkpoints into a lightweight student.

Usage:
    python -m ml.training.distill \
        --config configs/distill_mobilenetv3.yaml \
        --teachers artifacts/best_model.pt
"""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any

import pandas as pd
import torch
from dotenv import load_dotenv
from timm.utils import ModelEmaV2
from torch.utils.data import DataLoader
from tqdm import tqdm

from ml.data.dataset import CropDiseaseDataset
from ml.models.factory import create_model, load_checkpoint_model
from ml.models.losses import DistillationLoss
from ml.training.augmentations import build_eval_transforms, build_train_transforms
from ml.training.trainer import build_cosine_warmup_scheduler, evaluate_epoch
from ml.utils.io import ensure_dir, load_config, load_json, load_label_map, save_json
from ml.utils.seed import get_default_device, make_generator, seed_everything, seed_worker


def distill_student(cfg: dict[str, Any], teacher_paths: list[str | Path]) -> Path:
    """Train a fast student model via logit distillation from 1+ frozen teacher models."""
    seed = int(cfg.get("seed", 42))
    seed_everything(seed)

    manifests_dir = Path(cfg["paths"]["manifests_dir"])
    artifacts_dir = ensure_dir(cfg["paths"]["artifacts_dir"])
    exp_name = str(cfg.get("experiment_name", "distill_student"))
    out_dir = ensure_dir(artifacts_dir / "runs" / exp_name)

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
    batch_size = int(tr_cfg.get("batch_size", 48))
    num_workers = int(tr_cfg.get("num_workers", 4))
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

    device = get_default_device()
    teachers = []
    for tp in teacher_paths:
        t_model, _ = load_checkpoint_model(tp, device=device)
        for p in t_model.parameters():
            p.requires_grad = False
        teachers.append(t_model)

    st_cfg = cfg["student"]
    student = create_model(
        backbone_name=str(st_cfg["backbone"]),
        num_classes=len(classes),
        pretrained=bool(st_cfg.get("pretrained", True)),
        drop_rate=float(st_cfg.get("drop_rate", 0.2)),
        drop_path_rate=float(st_cfg.get("drop_path_rate", 0.0)),
    ).to(device)

    class_weights = torch.tensor(
        [float(cw_dict.get(c, 1.0)) for c in classes], dtype=torch.float32, device=device
    )
    kd_cfg = cfg["distillation"]
    kd_loss_fn = DistillationLoss(
        temperature=float(kd_cfg.get("temperature", 4.0)),
        alpha_kd=float(kd_cfg.get("alpha_kd", 0.5)),
        class_weights=class_weights,
    ).to(device)
    val_loss_fn = torch.nn.CrossEntropyLoss().to(device)

    epochs = int(tr_cfg.get("epochs", 20))
    lr = float(tr_cfg.get("lr", 3e-4))
    min_lr = float(tr_cfg.get("min_lr", 1e-6))
    optimizer = torch.optim.AdamW(
        student.get_param_groups(backbone_lr=lr, head_lr=lr * 2.0, weight_decay=float(tr_cfg.get("weight_decay", 1e-2)))
    )
    scheduler = build_cosine_warmup_scheduler(
        optimizer,
        warmup_epochs=int(tr_cfg.get("warmup_epochs", 2)),
        total_epochs=epochs,
        steps_per_epoch=len(train_loader),
        min_lr_ratio=min_lr / max(lr, 1e-9),
    )

    amp_enabled = bool(tr_cfg.get("amp", True)) and device.type == "cuda"
    device_type = "cuda" if device.type == "cuda" else "cpu"
    scaler = torch.amp.GradScaler(device_type, enabled=amp_enabled)
    ema = ModelEmaV2(student, decay=0.999)

    best_f1 = -1.0
    no_improve = 0
    patience = int(tr_cfg.get("early_stopping_patience", 5))
    best_ckpt = out_dir / "best.pt"
    history = []

    for epoch in range(1, epochs + 1):
        student.train()
        total_loss = 0.0
        total_n = 0

        for images, targets in tqdm(train_loader, desc=f"Distill E{epoch}/{epochs}", leave=False):
            images = images.to(device, non_blocking=True)
            targets = targets.to(device, non_blocking=True)

            with torch.no_grad(), torch.amp.autocast(device_type=device_type, enabled=amp_enabled):
                teacher_logits = sum(t(images) for t in teachers) / float(len(teachers))

            optimizer.zero_grad(set_to_none=True)
            with torch.amp.autocast(device_type=device_type, enabled=amp_enabled):
                student_logits = student(images)
                loss = kd_loss_fn(student_logits, teacher_logits, targets)

            scaler.scale(loss).backward()
            torch.nn.utils.clip_grad_norm_(student.parameters(), float(tr_cfg.get("grad_clip_norm", 1.0)))
            scaler.step(optimizer)
            scaler.update()
            scheduler.step()
            ema.update(student)

            total_loss += float(loss.item()) * images.shape[0]
            total_n += images.shape[0]

        val_metrics = evaluate_epoch(ema.module, val_loader, device, val_loss_fn, amp_enabled)
        tr_loss = total_loss / max(total_n, 1)
        history.append({"epoch": epoch, "train_loss": tr_loss, **val_metrics})
        print(
            f"  [Distill E{epoch:02d}] train_loss={tr_loss:.4f} | "
            f"val_acc={val_metrics['acc']:.4f} | val_macro_f1={val_metrics['macro_f1']:.4f}"
        )

        if val_metrics["macro_f1"] > best_f1:
            best_f1 = val_metrics["macro_f1"]
            no_improve = 0
            torch.save(
                {
                    "epoch": epoch,
                    "backbone": student.backbone_name,
                    "num_classes": len(classes),
                    "classes": classes,
                    "image_size": img_size,
                    "mean": mean,
                    "std": std,
                    "drop_rate": float(st_cfg.get("drop_rate", 0.2)),
                    "val_macro_f1": val_metrics["macro_f1"],
                    "val_acc": val_metrics["acc"],
                    "model_state_dict": ema.module.state_dict(),
                },
                best_ckpt,
            )
        else:
            no_improve += 1
            if no_improve >= patience:
                print(f"[distill] Early stopping at epoch {epoch}.")
                break

    save_json({"best_val_macro_f1": best_f1, "history": history}, out_dir / "distill_history.json")
    print(f"[distill] Saved distilled student checkpoint -> {best_ckpt} (val_macro_f1={best_f1:.4f})")
    return best_ckpt


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Knowledge distillation to lightweight student.")
    parser.add_argument("--base", default="configs/base.yaml")
    parser.add_argument("--config", default="configs/distill_mobilenetv3.yaml")
    parser.add_argument(
        "--teachers",
        nargs="+",
        required=True,
        help="Path(s) to trained teacher checkpoint(s) (.pt).",
    )
    return parser.parse_args()


def main() -> None:
    load_dotenv()
    args = parse_args()
    cfg = load_config(args.config, base_path=args.base)
    distill_student(cfg, teacher_paths=args.teachers)


if __name__ == "__main__":
    main()
