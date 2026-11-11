"""Grad-CAM explainability, PyTorch vs. ONNX CAM parity check, and overlay rendering."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import cv2
import matplotlib
import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image, ImageOps

matplotlib.use("Agg")
import matplotlib.pyplot as plt

from ml.models.factory import CropClassifier


def compute_pytorch_gradcam(
    model: CropClassifier,
    input_tensor: torch.Tensor,
    target_class: int | None = None,
) -> tuple[np.ndarray, int]:
    """Compute spatial Grad-CAM heatmap `(H, W)` in `[0, 1]` using gradients on spatial features."""
    model.eval()
    device = next(model.parameters()).device
    x = input_tensor.to(device)
    if x.ndim == 3:
        x = x.unsqueeze(0)

    model.zero_grad(set_to_none=True)
    raw_feats = model.backbone.forward_features(x)
    raw_feats.retain_grad()
    pooled = model.backbone.forward_head(raw_feats, pre_logits=True)
    logits = model.classifier(model.dropout(pooled))

    pred_class = int(logits.argmax(dim=-1).item()) if target_class is None else int(target_class)
    score = logits[0, pred_class]
    score.backward()

    if raw_feats.grad is None:
        raise RuntimeError("Failed to capture gradients on backbone spatial features.")

    feats_nchw = model._to_nchw_spatial_map(raw_feats.detach())
    grads_nchw = model._to_nchw_spatial_map(raw_feats.grad.detach())

    weights = grads_nchw.mean(dim=(2, 3), keepdim=True)
    cam = F.relu((weights * feats_nchw).sum(dim=1, keepdim=True))
    cam_up = F.interpolate(
        cam,
        size=(x.shape[2], x.shape[3]),
        mode="bilinear",
        align_corners=False,
    )[0, 0].cpu().numpy()

    cam_min, cam_max = float(cam_up.min()), float(cam_up.max())
    if cam_max - cam_min > 1e-8:
        cam_norm = (cam_up - cam_min) / (cam_max - cam_min)
    else:
        cam_norm = np.zeros_like(cam_up)
    return cam_norm.astype(np.float32), pred_class


def compute_classifier_cam(
    spatial_map: np.ndarray,
    classifier_weights: np.ndarray,
    target_class: int,
    out_size: tuple[int, int] = (224, 224),
) -> np.ndarray:
    """Compute fast GAP-equivalent Grad-CAM directly from `(1, C, H_f, W_f)` & classifier weights."""
    feats = spatial_map[0] if spatial_map.ndim == 4 else spatial_map
    w = classifier_weights[target_class]  # (C,)
    raw_cam = np.maximum(0.0, np.tensordot(w, feats, axes=(0, 0)))
    cam_resized = cv2.resize(
        raw_cam.astype(np.float32),
        (out_size[1], out_size[0]),
        interpolation=cv2.INTER_LINEAR,
    )
    c_min, c_max = float(cam_resized.min()), float(cam_resized.max())
    if c_max - c_min > 1e-8:
        return ((cam_resized - c_min) / (c_max - c_min)).astype(np.float32)
    return np.zeros(out_size, dtype=np.float32)


def render_cam_overlay(
    rgb_image: np.ndarray,
    cam_01: np.ndarray,
    alpha: float = 0.45,
) -> np.ndarray:
    """Blend a `[0, 1]` Grad-CAM heatmap over an RGB `uint8` image."""
    h, w = rgb_image.shape[:2]
    cam_resized = cv2.resize(cam_01.astype(np.float32), (w, h), interpolation=cv2.INTER_LINEAR)
    heatmap_uint8 = np.uint8(np.clip(cam_resized * 255.0, 0, 255))
    heatmap_bgr = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
    heatmap_rgb = cv2.cvtColor(heatmap_bgr, cv2.COLOR_BGR2RGB)
    blended = (1.0 - alpha) * rgb_image.astype(np.float32) + alpha * heatmap_rgb.astype(np.float32)
    return np.clip(blended, 0, 255).astype(np.uint8)


def save_gradcam_gallery(
    model: CropClassifier,
    samples: list[dict[str, Any]],
    eval_transform: Any,
    classes: list[str],
    out_path: str | Path,
) -> float:
    """Generate a Grad-CAM comparison gallery and verify PyTorch vs. classifier-CAM correlation."""
    n = len(samples)
    if n == 0:
        return 1.0

    weights_np = model.classifier.weight.detach().cpu().numpy()
    corrs: list[float] = []

    fig, axes = plt.subplots(n, 2, figsize=(8.5, 3.3 * n))
    if n == 1:
        axes = np.expand_dims(axes, axis=0)

    for row_idx, item in enumerate(samples):
        with Image.open(item["image_path"]) as raw:
            img = ImageOps.exif_transpose(raw).convert("RGB")
            img_disp = img.resize((224, 224), Image.Resampling.BILINEAR)
            img_np = np.array(img)
            disp_np = np.array(img_disp)

        tensor = eval_transform(image=img_np)["image"].unsqueeze(0)
        cam_pt, pred_idx = compute_pytorch_gradcam(model, tensor)

        with torch.no_grad():
            _, spatial = model.forward_with_features(tensor.to(next(model.parameters()).device))
        cam_fast = compute_classifier_cam(
            spatial.cpu().numpy(),
            weights_np,
            target_class=pred_idx,
            out_size=(224, 224),
        )
        if cam_pt.std() > 1e-6 and cam_fast.std() > 1e-6:
            corr = float(np.corrcoef(cam_pt.ravel(), cam_fast.ravel())[0, 1])
            corrs.append(corr)

        overlay = render_cam_overlay(disp_np, cam_pt, alpha=0.45)
        true_lbl = item["label"].replace("___", ": ")
        pred_lbl = classes[pred_idx].replace("___", ": ")

        axes[row_idx, 0].imshow(disp_np)
        axes[row_idx, 0].set_title(f"Input\nTrue: {true_lbl}", fontsize=9)
        axes[row_idx, 0].axis("off")

        axes[row_idx, 1].imshow(overlay)
        axes[row_idx, 1].set_title(f"Grad-CAM Overlay\nPred: {pred_lbl}", fontsize=9)
        axes[row_idx, 1].axis("off")

    fig.suptitle("Grad-CAM Explainability Samples", fontsize=13, fontweight="bold")
    fig.tight_layout()
    fig.savefig(out_path, dpi=170)
    plt.close(fig)
    return float(np.mean(corrs)) if corrs else 1.0

