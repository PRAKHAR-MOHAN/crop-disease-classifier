"""ONNX Runtime inference service with preprocessing, calibration, OOD, and Grad-CAM."""

from __future__ import annotations

import base64
import io
import os
import time
from pathlib import Path
from typing import Any

import cv2
import numpy as np
import onnxruntime as ort
from PIL import Image, ImageOps

from app.core import settings
from app.core.logging import logger

# Allowed MIME types & magic bytes for upload validation
ALLOWED_MIMES = {"image/jpeg", "image/png", "image/webp", "image/bmp"}
MAGIC_HEADERS = {
    b"\xff\xd8\xff": "image/jpeg",
    b"\x89PNG": "image/png",
    b"RIFF": "image/webp",  # WebP wraps in RIFF container
    b"BM": "image/bmp",
}


def validate_image_bytes(data: bytes, max_bytes: int) -> tuple[bool, str]:
    """Validate upload is an allowed image type and within size limits."""
    if len(data) > max_bytes:
        return False, f"File size ({len(data)} bytes) exceeds {max_bytes // (1024 * 1024)} MB limit."
    if len(data) < 8:
        return False, "File is too small to be a valid image."

    header = data[:8]
    detected = None
    for magic, mime in MAGIC_HEADERS.items():
        if header[: len(magic)] == magic:
            detected = mime
            break
    if detected is None:
        return False, "Unsupported image format. Upload JPEG, PNG, WebP, or BMP."
    return True, detected


class InferenceService:
    """Production inference engine backed by ONNX Runtime with dual-output CAM support."""

    def __init__(self) -> None:
        self.session: ort.InferenceSession | None = None
        self.gate_session: ort.InferenceSession | None = None
        self.meta: dict[str, Any] = {}
        self.classes: list[str] = []
        self.num_classes: int = 0
        self.image_size: int = 224
        self.mean: np.ndarray = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        self.std: np.ndarray = np.array([0.229, 0.224, 0.225], dtype=np.float32)
        self.temperature: float = 1.0
        self.conf_threshold: float = 0.55
        self.energy_threshold: float = -3.5
        self.plant_gate_threshold: float = 0.45

    @property
    def loaded(self) -> bool:
        return self.session is not None

    def load(self) -> None:
        """Load ONNX model, metadata, and optional plant gate."""
        settings.ensure_artifacts()
        onnx_path = Path(settings.model_onnx_path)
        meta_path = Path(settings.model_meta_path)

        if not onnx_path.exists():
            logger.warning("Model ONNX file not found at %s; inference disabled.", onnx_path)
            return

        sess_opts = ort.SessionOptions()
        sess_opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        sess_opts.intra_op_num_threads = min(4, max(1, os.cpu_count() or 1))
        sess_opts.inter_op_num_threads = 1

        self.session = ort.InferenceSession(
            str(onnx_path),
            sess_options=sess_opts,
            providers=["CPUExecutionProvider"],
        )
        logger.info("Loaded main ONNX model from %s", onnx_path)

        if meta_path.exists():
            import json

            with meta_path.open("r", encoding="utf-8") as f:
                self.meta = json.load(f)
            self.classes = list(self.meta.get("classes", []))
            self.num_classes = len(self.classes)
            self.image_size = int(self.meta.get("image_size", 224))
            self.mean = np.array(self.meta.get("mean", [0.485, 0.456, 0.406]), dtype=np.float32)
            self.std = np.array(self.meta.get("std", [0.229, 0.224, 0.225]), dtype=np.float32)
            self.temperature = float(self.meta.get("temperature", 1.0))
            self.conf_threshold = float(
                self.meta.get("confidence_threshold", settings.uncertainty_conf_threshold)
            )
            self.energy_threshold = float(
                self.meta.get("energy_threshold", settings.ood_energy_threshold)
            )
            self.plant_gate_threshold = float(
                self.meta.get("plant_gate_threshold", settings.plant_gate_threshold)
            )
        else:
            logger.warning("model_meta.json not found; using default thresholds.")

        # Load optional plant gate
        gate_path = Path(settings.plant_gate_onnx_path)
        if gate_path.exists():
            self.gate_session = ort.InferenceSession(
                str(gate_path),
                sess_options=sess_opts,
                providers=["CPUExecutionProvider"],
            )
            logger.info("Loaded plant gate ONNX from %s", gate_path)

    def preprocess(self, image_bytes: bytes) -> tuple[np.ndarray, np.ndarray]:
        """Decode, EXIF-transpose, resize, center-crop, normalize to `(1, 3, H, W)`."""
        img = Image.open(io.BytesIO(image_bytes))
        img = ImageOps.exif_transpose(img).convert("RGB")
        rgb_np = np.array(img)

        sz = self.image_size
        rsz = int(round(sz * 1.14))
        img_resized = img.resize((rsz, rsz), Image.Resampling.BILINEAR)
        arr = np.array(img_resized, dtype=np.float32)

        # Center crop
        h, w = arr.shape[:2]
        y0 = (h - sz) // 2
        x0 = (w - sz) // 2
        arr = arr[y0 : y0 + sz, x0 : x0 + sz]

        # Normalize to ImageNet stats
        arr = arr / 255.0
        arr = (arr - self.mean[None, None, :]) / self.std[None, None, :]
        tensor = arr.transpose(2, 0, 1).astype(np.float32)[np.newaxis]
        return tensor, rgb_np

    def _softmax(self, logits: np.ndarray) -> np.ndarray:
        x = logits - logits.max(axis=-1, keepdims=True)
        e = np.exp(x)
        return e / e.sum(axis=-1, keepdims=True)

    def _energy_score(self, logits: np.ndarray) -> float:
        return -float(np.log(np.sum(np.exp(logits - logits.max()))) + logits.max())

    def _render_gradcam_b64(
        self,
        cam_maps: np.ndarray,
        pred_idx: int,
        original_rgb: np.ndarray,
        alpha: float = 0.45,
    ) -> str:
        """Render Grad-CAM overlay from ONNX `cam_maps` output and return base64 PNG."""
        cam = cam_maps[0, pred_idx]  # (H_f, W_f)
        c_min, c_max = float(cam.min()), float(cam.max())
        if c_max - c_min > 1e-8:
            cam_norm = ((cam - c_min) / (c_max - c_min)).astype(np.float32)
        else:
            cam_norm = np.zeros_like(cam, dtype=np.float32)

        h, w = original_rgb.shape[:2]
        disp = cv2.resize(original_rgb, (224, 224), interpolation=cv2.INTER_LINEAR)
        cam_resized = cv2.resize(cam_norm, (224, 224), interpolation=cv2.INTER_LINEAR)
        heatmap = cv2.applyColorMap(np.uint8(cam_resized * 255), cv2.COLORMAP_JET)
        heatmap_rgb = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB)
        blended = np.clip(
            (1 - alpha) * disp.astype(np.float32) + alpha * heatmap_rgb.astype(np.float32),
            0,
            255,
        ).astype(np.uint8)

        pil_out = Image.fromarray(blended)
        buf = io.BytesIO()
        pil_out.save(buf, format="PNG", optimize=True)
        return base64.b64encode(buf.getvalue()).decode("ascii")

    def predict(self, image_bytes: bytes) -> dict[str, Any]:
        """Run full inference pipeline: preprocess → gate → classify → calibrate → OOD → CAM."""
        if self.session is None:
            raise RuntimeError("Model not loaded. Call load() during application startup.")

        t_start = time.perf_counter()
        tensor, rgb_np = self.preprocess(image_bytes)

        # Optional plant gate check
        is_ood_gate = False
        if self.gate_session is not None:
            gate_logit = self.gate_session.run(["plant_logit"], {"image": tensor})[0]
            gate_prob = float(1.0 / (1.0 + np.exp(-gate_logit.item())))
            if gate_prob < self.plant_gate_threshold:
                is_ood_gate = True

        # Main model inference
        logits, cam_maps = self.session.run(["logits", "cam_maps"], {"image": tensor})
        logits_1d = logits[0].astype(np.float64)

        # Calibrated probabilities via temperature scaling
        probs = self._softmax(logits_1d / max(self.temperature, 1e-6))
        pred_idx = int(np.argmax(probs))
        confidence = float(probs[pred_idx])

        # Energy-based OOD score
        energy = self._energy_score(logits_1d)
        is_uncertain = confidence < self.conf_threshold
        is_ood = is_ood_gate or (energy > self.energy_threshold)

        # Top-3
        top3_idx = np.argsort(probs)[::-1][:3]
        top3 = [
            {
                "rank": rank + 1,
                "class_id": self.classes[int(idx)] if int(idx) < self.num_classes else "Unknown",
                "confidence": round(float(probs[int(idx)]), 4),
            }
            for rank, idx in enumerate(top3_idx)
        ]

        label = self.classes[pred_idx] if pred_idx < self.num_classes else "Unknown"

        # Render Grad-CAM overlay
        gradcam_b64: str | None = None
        if cam_maps is not None:
            try:
                gradcam_b64 = self._render_gradcam_b64(cam_maps, pred_idx, rgb_np)
            except Exception as exc:
                logger.warning("Grad-CAM rendering failed: %s", exc)

        latency_ms = round((time.perf_counter() - t_start) * 1000.0, 2)
        return {
            "label": label,
            "confidence": round(confidence, 4),
            "top3": top3,
            "gradcam": gradcam_b64,
            "is_uncertain": is_uncertain,
            "is_ood": is_ood,
            "latency_ms": latency_ms,
        }


# Module-level singleton
inference_service = InferenceService()

