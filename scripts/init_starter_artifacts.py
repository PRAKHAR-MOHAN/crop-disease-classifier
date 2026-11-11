"""Initialize baseline starter ONNX artifacts and metadata for instant local testing.

Creates `artifacts/model.onnx`, `artifacts/model_meta.json`, and `artifacts/plant_gate.onnx`
using the classes defined in `configs/advice_kb.json` so the FastAPI backend and React frontend
can be run immediately out of the box.

Usage:
    python scripts/init_starter_artifacts.py
"""

from __future__ import annotations

import json
from pathlib import Path
import numpy as np

def init_starter():
    artifacts_dir = Path("artifacts")
    artifacts_dir.mkdir(parents=True, exist_ok=True)

    kb_path = Path("configs/advice_kb.json")
    if kb_path.exists():
        with open(kb_path, encoding="utf-8") as f:
            raw_kb = json.load(f)
        classes = sorted([k for k in raw_kb.keys() if not k.startswith("_")])
    else:
        classes = ["Tomato___Early_blight", "Tomato___healthy", "Tomato___Late_blight"]

    num_classes = len(classes)
    num_features = 16
    img_size = 224

    # Build tiny valid dual-output ONNX model with pure Python
    try:
        import onnx
        from onnx import helper, TensorProto, numpy_helper

        rng = np.random.default_rng(42)

        # Input: (batch, 3, 224, 224)
        X = helper.make_tensor_value_info("image", TensorProto.FLOAT, [None, 3, img_size, img_size])

        # Feature extractor weights: Conv(3 -> 16, 32x32, stride=32)
        cw = rng.standard_normal((num_features, 3, 32, 32)).astype(np.float32) * 0.05
        cb = np.zeros(num_features, dtype=np.float32)

        # Classifier weights: Linear(16 -> num_classes)
        fc_w = rng.standard_normal((num_classes, num_features)).astype(np.float32) * 0.1
        fc_b = np.zeros(num_classes, dtype=np.float32)

        # CAM 1x1 conv weights
        cam_w = fc_w.reshape(num_classes, num_features, 1, 1)
        cam_b = np.zeros(num_classes, dtype=np.float32)

        conv = helper.make_node("Conv", ["image", "cw", "cb"], ["feat"], kernel_shape=[32, 32], strides=[32, 32], pads=[0,0,0,0])
        relu1 = helper.make_node("Relu", ["feat"], ["feat_relu"])
        gap = helper.make_node("GlobalAveragePool", ["feat_relu"], ["pooled"])
        flat = helper.make_node("Flatten", ["pooled"], ["flat"], axis=1)
        fc = helper.make_node("Gemm", ["flat", "fc_w", "fc_b"], ["logits"], transB=1)

        cam_conv = helper.make_node("Conv", ["feat_relu", "cam_w", "cam_b"], ["cam_raw"], kernel_shape=[1, 1])
        cam_relu = helper.make_node("Relu", ["cam_raw"], ["cam_maps"])

        logits_out = helper.make_tensor_value_info("logits", TensorProto.FLOAT, [None, num_classes])
        cam_out = helper.make_tensor_value_info("cam_maps", TensorProto.FLOAT, [None, num_classes, None, None])

        graph = helper.make_graph(
            [conv, relu1, gap, flat, fc, cam_conv, cam_relu],
            "crop_disease_starter_model",
            [X],
            [logits_out, cam_out],
            initializer=[
                numpy_helper.from_array(cw, "cw"),
                numpy_helper.from_array(cb, "cb"),
                numpy_helper.from_array(fc_w, "fc_w"),
                numpy_helper.from_array(fc_b, "fc_b"),
                numpy_helper.from_array(cam_w, "cam_w"),
                numpy_helper.from_array(cam_b, "cam_b"),
            ],
        )

        model = helper.make_model(graph, opset_imports=[helper.make_opsetid("", 17)])
        model.ir_version = 8
        onnx_path = artifacts_dir / "model.onnx"
        onnx.save(model, str(onnx_path))
        print(f"[starter] Created starter ONNX model with {num_classes} classes -> {onnx_path}")

        # Gate model
        gw = rng.standard_normal((4, 3, 32, 32)).astype(np.float32) * 0.01
        gb = np.zeros(4, dtype=np.float32)
        g_fc_w = rng.standard_normal((1, 4)).astype(np.float32) * 0.1
        g_fc_b = np.array([2.5], dtype=np.float32)

        g_graph = helper.make_graph(
            [
                helper.make_node("Conv", ["image", "gw", "gb"], ["g_feat"], kernel_shape=[32, 32], strides=[32, 32], pads=[0,0,0,0]),
                helper.make_node("Relu", ["g_feat"], ["g_feat_r"]),
                helper.make_node("GlobalAveragePool", ["g_feat_r"], ["g_gap"]),
                helper.make_node("Flatten", ["g_gap"], ["g_flat"], axis=1),
                helper.make_node("Gemm", ["g_flat", "g_fc_w", "g_fc_b"], ["plant_logit"], transB=1),
            ],
            "plant_gate_starter",
            [X],
            [helper.make_tensor_value_info("plant_logit", TensorProto.FLOAT, [None, 1])],
            initializer=[
                numpy_helper.from_array(gw, "gw"),
                numpy_helper.from_array(gb, "gb"),
                numpy_helper.from_array(g_fc_w, "g_fc_w"),
                numpy_helper.from_array(g_fc_b, "g_fc_b"),
            ],
        )
        g_model = helper.make_model(g_graph, opset_imports=[helper.make_opsetid("", 17)])
        g_model.ir_version = 8
        gate_path = artifacts_dir / "plant_gate.onnx"
        onnx.save(g_model, str(gate_path))
        print(f"[starter] Created starter PlantGate ONNX -> {gate_path}")

    except ImportError:
        print("[starter] onnx not installed yet. Skipping binary ONNX generation.")

    # Save model metadata
    meta = {
        "model_version": "1.0.0-starter",
        "backbone": "tf_efficientnetv2_s.in21k_ft_in1k",
        "num_classes": num_classes,
        "classes": classes,
        "image_size": img_size,
        "mean": [0.485, 0.456, 0.406],
        "std": [0.229, 0.224, 0.225],
        "temperature": 1.0,
        "confidence_threshold": 0.55,
        "energy_threshold": -3.5,
        "plant_gate_threshold": 0.45,
        "outputs": ["logits", "cam_maps"],
    }
    meta_path = artifacts_dir / "model_meta.json"
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)
    print(f"[starter] Saved model metadata -> {meta_path}")

if __name__ == "__main__":
    init_starter()

