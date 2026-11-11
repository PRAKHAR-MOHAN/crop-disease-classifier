"""Standalone Gradio demo for local exploration or lightweight Hugging Face Spaces deployment.

Usage:
    python -m demo.app_gradio
"""

from __future__ import annotations

import base64
import io
import json
import os
from pathlib import Path

import cv2
import gradio as gr
import numpy as np
import onnxruntime as ort
from PIL import Image, ImageOps

MODEL_PATH = os.getenv("MODEL_ONNX_PATH", "artifacts/model.onnx")
META_PATH = os.getenv("MODEL_META_PATH", "artifacts/model_meta.json")
ADVICE_PATH = os.getenv("ADVICE_KB_PATH", "configs/advice_kb.json")


class GradioClassifier:
    def __init__(self) -> None:
        self.session: ort.InferenceSession | None = None
        self.meta: dict = {}
        self.classes: list[str] = []
        self.advice_kb: dict = {}
        self.load()

    def load(self) -> None:
        if Path(MODEL_PATH).exists():
            opts = ort.SessionOptions()
            opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
            self.session = ort.InferenceSession(
                MODEL_PATH, sess_options=opts, providers=["CPUExecutionProvider"]
            )
            print(f"[gradio] Loaded ONNX model from {MODEL_PATH}")

        if Path(META_PATH).exists():
            with open(META_PATH, encoding="utf-8") as f:
                self.meta = json.load(f)
            self.classes = self.meta.get("classes", [])

        if Path(ADVICE_PATH).exists():
            with open(ADVICE_PATH, encoding="utf-8") as f:
                self.advice_kb = json.load(f)

    def predict(self, img_pil: Image.Image | None):
        if img_pil is None or self.session is None:
            return {}, None, "Please upload an image."

        img = ImageOps.exif_transpose(img_pil).convert("RGB")
        rgb_np = np.array(img)

        # Preprocess
        sz = int(self.meta.get("image_size", 224))
        mean = np.array(self.meta.get("mean", [0.485, 0.456, 0.406]), dtype=np.float32)
        std = np.array(self.meta.get("std", [0.229, 0.224, 0.225]), dtype=np.float32)

        rsz = int(round(sz * 1.14))
        img_resized = img.resize((rsz, rsz), Image.Resampling.BILINEAR)
        arr = np.array(img_resized, dtype=np.float32)

        h, w = arr.shape[:2]
        y0, x0 = (h - sz) // 2, (w - sz) // 2
        arr = arr[y0 : y0 + sz, x0 : x0 + sz]
        arr = (arr / 255.0 - mean[None, None, :]) / std[None, None, :]
        tensor = arr.transpose(2, 0, 1).astype(np.float32)[np.newaxis]

        # Run ONNX inference
        logits, cam_maps = self.session.run(["logits", "cam_maps"], {"image": tensor})
        logits_1d = logits[0]

        temp = float(self.meta.get("temperature", 1.0))
        shifted = (logits_1d / max(temp, 1e-6)) - np.max(logits_1d / max(temp, 1e-6))
        probs = np.exp(shifted) / np.sum(np.exp(shifted))

        conf_thresh = float(self.meta.get("confidence_threshold", 0.55))
        energy = -float(np.log(np.sum(np.exp(logits_1d - np.max(logits_1d)))) + np.max(logits_1d))
        energy_thresh = float(self.meta.get("energy_threshold", -3.5))

        is_ood = energy > energy_thresh
        top_idx = int(np.argmax(probs))
        top_conf = float(probs[top_idx])

        # Confidence dictionary for Gradio Label component
        sorted_indices = np.argsort(probs)[::-1][:5]
        label_probs = {
            self.classes[i].replace("___", ": "): float(probs[i])
            for i in sorted_indices
            if i < len(self.classes)
        }

        # Render Grad-CAM overlay
        cam = cam_maps[0, top_idx]
        c_min, c_max = float(cam.min()), float(cam.max())
        cam_norm = (cam - c_min) / (c_max - c_min + 1e-8)

        disp = cv2.resize(rgb_np, (350, 350))
        cam_resized = cv2.resize(cam_norm, (350, 350))
        heatmap = cv2.applyColorMap(np.uint8(cam_resized * 255), cv2.COLORMAP_JET)
        heatmap_rgb = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB)
        overlay = np.clip(0.55 * disp.astype(np.float32) + 0.45 * heatmap_rgb.astype(np.float32), 0, 255).astype(np.uint8)

        # Advice markdown
        label_raw = self.classes[top_idx] if top_idx < len(self.classes) else "Unknown"
        advice = self.advice_kb.get(label_raw, self.advice_kb.get("_default_disease_template", {}))

        status_msg = ""
        if is_ood:
            status_msg = "⚠️ **Warning: Out-of-Distribution Input** — Input image does not appear to be a recognized crop leaf/fruit or pest."
        elif top_conf < conf_thresh:
            status_msg = "❓ **Uncertain Diagnosis** — Model confidence is low. Please confirm symptoms in field."

        advice_md = f"""### {label_raw.replace('___', ': ')} ({top_conf*100:.1f}%)
{status_msg}

**Symptoms**: {advice.get('symptoms', 'N/A')}

**Organic Treatment**:
{chr(10).join(f"- {item}" for item in advice.get('organic_treatment', []))}

**Chemical Treatment**:
{chr(10).join(f"- {item}" for item in advice.get('chemical_treatment', []))}

**Prevention**:
{chr(10).join(f"- {item}" for item in advice.get('prevention', []))}
"""
        return label_probs, overlay, advice_md


def build_app() -> gr.Blocks:
    clf = GradioClassifier()

    with gr.Blocks(title="Crop Disease & Pest Classifier", theme=gr.themes.Soft()) as demo:
        gr.Markdown(
            """# 🌱 Crop Disease & Pest Classifier
Upload a photo of a crop leaf, fruit, or pest to identify diseases, view a Grad-CAM attention heatmap, and read agronomic treatment advice.
"""
        )

        with gr.Row():
            with gr.Column():
                input_img = gr.Image(type="pil", label="Upload Crop Image")
                btn = gr.Button("Analyze Crop", variant="primary")

            with gr.Column():
                out_label = gr.Label(num_top_classes=3, label="Top Predictions")
                out_cam = gr.Image(label="Grad-CAM Attention Heatmap")

        out_advice = gr.Markdown(label="Agronomic Advice")

        btn.click(
            fn=clf.predict,
            inputs=[input_img],
            outputs=[out_label, out_cam, out_advice],
        )

    return demo


if __name__ == "__main__":
    app = build_app()
    app.launch(server_name="0.0.0.0", server_port=7860)

