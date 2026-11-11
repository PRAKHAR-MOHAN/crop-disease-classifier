"""Export calibrated model to dual-output ONNX (logits + per-class CAM), TorchScript, and INT8 ONNX.

Usage:
    python -m ml.export.export_model --checkpoint artifacts/best_model.pt --torchscript --quantize-int8
"""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any

import onnx
import torch
import torch.nn as nn
import torch.nn.functional as F

from ml.models.factory import CropClassifier, load_checkpoint_model
from ml.utils.io import ensure_dir, load_json, load_yaml, save_json


class DualOutputOnnxWrapper(nn.Module):
    """Wraps CropClassifier so ONNX emits both `(logits, cam_maps)` in a single forward pass.

    `cam_maps` has shape `(B, num_classes, H_f, W_f)`, computed via a 1x1 convolution initialized
    with the classifier linear weights, giving pure-ONNX GAP-Grad-CAM maps in <0.1 ms on CPU.
    """

    def __init__(self, model: CropClassifier) -> None:
        super().__init__()
        self.model = model
        num_classes = model.num_classes
        num_features = model.num_features
        self.cam_conv = nn.Conv2d(num_features, num_classes, kernel_size=1, bias=False)
        with torch.no_grad():
            w = model.classifier.weight.detach().clone().view(num_classes, num_features, 1, 1)
            self.cam_conv.weight.copy_(w)

    def forward(self, x: torch.Tensor) -> tuple[torch.Tensor, torch.Tensor]:
        logits, spatial_map = self.model.forward_with_features(x)
        cam_maps = F.relu(self.cam_conv(spatial_map))
        return logits, cam_maps


def export_artifacts(
    checkpoint_path: str | Path,
    base_cfg: dict[str, Any],
    output_dir: str | Path | None = None,
    calibration_path: str | Path | None = None,
    export_torchscript: bool = True,
    quantize_int8: bool = False,
    opset: int = 17,
) -> dict[str, Path]:
    """Export dual-output ONNX, `model_meta.json`, and optional TorchScript / INT8 ONNX."""
    artifacts_dir = ensure_dir(output_dir or base_cfg["paths"]["artifacts_dir"])
    cal_file = Path(calibration_path) if calibration_path else (artifacts_dir / "calibration_report.json")

    model, ckpt = load_checkpoint_model(checkpoint_path, device="cpu")
    model.eval()
    wrapper = DualOutputOnnxWrapper(model).eval()

    img_size = int(ckpt.get("image_size", base_cfg["image"]["size"]))
    dummy = torch.randn(1, 3, img_size, img_size, dtype=torch.float32)

    onnx_path = artifacts_dir / "model.onnx"
    torch.onnx.export(
        wrapper,
        dummy,
        str(onnx_path),
        input_names=["image"],
        output_names=["logits", "cam_maps"],
        dynamic_axes={
            "image": {0: "batch"},
            "logits": {0: "batch"},
            "cam_maps": {0: "batch"},
        },
        opset_version=opset,
        do_constant_folding=True,
    )

    onnx_model = onnx.load(str(onnx_path))
    onnx.checker.check_model(onnx_model)
    exported: dict[str, Path] = {"onnx": onnx_path}
    print(f"[export] Verified ONNX graph saved -> {onnx_path} ({onnx_path.stat().st_size / 1e6:.2f} MB)")

    if export_torchscript:
        ts_path = artifacts_dir / "model_ts.pt"
        with torch.no_grad():
            traced = torch.jit.trace(wrapper, dummy)
            traced.save(str(ts_path))
        exported["torchscript"] = ts_path
        print(f"[export] Saved TorchScript -> {ts_path}")

    if quantize_int8:
        try:
            from onnxruntime.quantization import QuantType, quantize_dynamic

            int8_path = artifacts_dir / "model_int8.onnx"
            quantize_dynamic(
                model_input=str(onnx_path),
                model_output=str(int8_path),
                weight_type=QuantType.QInt8,
            )
            exported["onnx_int8"] = int8_path
            print(f"[export] Saved INT8 ONNX -> {int8_path} ({int8_path.stat().st_size / 1e6:.2f} MB)")
        except Exception as exc:
            print(f"[export] INT8 quantization skipped ({exc}).")

    # Assemble production metadata (temperature + OOD thresholds + classes)
    cal_data = load_json(cal_file) if cal_file.exists() else {}
    ood_data = cal_data.get("ood", {})
    default_ood = base_cfg.get("ood", {})

    meta = {
        "model_version": "1.0.0",
        "backbone": ckpt["backbone"],
        "num_classes": int(ckpt["num_classes"]),
        "classes": list(ckpt["classes"]),
        "image_size": img_size,
        "mean": list(ckpt.get("mean", base_cfg["image"]["mean"])),
        "std": list(ckpt.get("std", base_cfg["image"]["std"])),
        "temperature": float(cal_data.get("temperature", 1.0)),
        "confidence_threshold": float(
            ood_data.get("confidence_threshold", default_ood.get("confidence_threshold", 0.55))
        ),
        "energy_threshold": float(
            ood_data.get("energy_threshold", default_ood.get("energy_threshold", -3.5))
        ),
        "plant_gate_threshold": float(default_ood.get("plant_gate_threshold", 0.45)),
        "outputs": ["logits", "cam_maps"],
    }
    meta_path = save_json(meta, artifacts_dir / "model_meta.json")
    exported["meta"] = meta_path
    print(f"[export] Saved inference metadata -> {meta_path}")
    return exported


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Export Crop Disease model to ONNX & TorchScript.")
    parser.add_argument("--checkpoint", default="artifacts/best_model.pt")
    parser.add_argument("--base", default="configs/base.yaml")
    parser.add_argument("--output-dir", default=None)
    parser.add_argument("--torchscript", action="store_true", help="Also export TorchScript.")
    parser.add_argument("--quantize-int8", action="store_true", help="Also export INT8 dynamic ONNX.")
    parser.add_argument("--opset", type=int, default=17)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    base_cfg = load_yaml(args.base)
    export_artifacts(
        checkpoint_path=args.checkpoint,
        base_cfg=base_cfg,
        output_dir=args.output_dir,
        export_torchscript=args.torchscript,
        quantize_int8=args.quantize_int8,
        opset=args.opset,
    )


if __name__ == "__main__":
    main()

