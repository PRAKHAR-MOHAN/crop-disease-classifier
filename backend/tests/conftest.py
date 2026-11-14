"""Shared pytest fixtures: test client, temp SQLite DB, and a synthetic dual-output ONNX model."""

from __future__ import annotations

import io
import json
import os
import struct
import tempfile
from pathlib import Path

import numpy as np
import pytest
from PIL import Image

# Set test environment variables BEFORE importing app modules
_tmp_dir_obj = tempfile.TemporaryDirectory()
_tmp_dir = _tmp_dir_obj.name

os.environ["DATABASE_URL"] = f"sqlite:///{_tmp_dir}/test.sqlite3"
os.environ["APP_ENV"] = "test"
os.environ["LOG_LEVEL"] = "WARNING"
os.environ["MODEL_META_PATH"] = f"{_tmp_dir}/model_meta.json"
os.environ["MODEL_ONNX_PATH"] = f"{_tmp_dir}/model.onnx"
os.environ["PLANT_GATE_ONNX_PATH"] = f"{_tmp_dir}/plant_gate.onnx"
os.environ["ADVICE_KB_PATH"] = str(
    Path(__file__).resolve().parents[2] / "configs" / "advice_kb.json"
)


def _build_test_onnx_model(
    onnx_path: str,
    num_classes: int = 3,
    spatial_h: int = 7,
    spatial_w: int = 7,
    num_features: int = 8,
) -> str:
    """Build a tiny, valid ONNX model that returns (logits, cam_maps) for testing.

    Uses onnxruntime's lightweight API to build a model with random fixed weights.
    """
    try:
        import onnx
        from onnx import TensorProto, helper, numpy_helper
    except ImportError:
        pytest.skip("onnx package required for conftest fixture.")

    rng = np.random.default_rng(42)

    # Input: (batch, 3, 224, 224)
    X = helper.make_tensor_value_info("image", TensorProto.FLOAT, [None, 3, 224, 224])

    # Fixed conv weights for feature extraction: Conv(3→num_features, 32x32, stride=32)
    conv_w = rng.standard_normal((num_features, 3, 32, 32)).astype(np.float32) * 0.01
    conv_b = np.zeros(num_features, dtype=np.float32)
    conv_w_init = numpy_helper.from_array(conv_w, name="conv_w")
    conv_b_init = numpy_helper.from_array(conv_b, name="conv_b")

    # Classifier weights: Linear(num_features → num_classes)
    cls_w = rng.standard_normal((num_classes, num_features)).astype(np.float32) * 0.1
    cls_b = np.zeros(num_classes, dtype=np.float32)
    cls_w_init = numpy_helper.from_array(cls_w, name="cls_w")
    cls_b_init = numpy_helper.from_array(cls_b, name="cls_b")

    # CAM conv weights: Conv1x1(num_features → num_classes)
    cam_w = cls_w.reshape(num_classes, num_features, 1, 1)
    cam_w_init = numpy_helper.from_array(cam_w.astype(np.float32), name="cam_w")
    cam_b_init = numpy_helper.from_array(np.zeros(num_classes, dtype=np.float32), name="cam_b")

    # Nodes
    conv_node = helper.make_node("Conv", ["image", "conv_w", "conv_b"], ["features"], name="conv1",
                                  kernel_shape=[32, 32], strides=[32, 32], pads=[0, 0, 0, 0])
    relu_node = helper.make_node("Relu", ["features"], ["features_relu"], name="relu1")

    # Global Average Pooling for logits
    gap_node = helper.make_node("GlobalAveragePool", ["features_relu"], ["pooled"], name="gap")
    flat_node = helper.make_node("Flatten", ["pooled"], ["flat"], axis=1, name="flatten")
    fc_node = helper.make_node("Gemm", ["flat", "cls_w", "cls_b"], ["logits"], name="fc",
                                transB=1)

    # CAM maps via 1x1 convolution
    cam_conv_node = helper.make_node("Conv", ["features_relu", "cam_w", "cam_b"], ["cam_raw"],
                                      name="cam_conv", kernel_shape=[1, 1])
    cam_relu_node = helper.make_node("Relu", ["cam_raw"], ["cam_maps"], name="cam_relu")

    # Outputs
    logits_info = helper.make_tensor_value_info("logits", TensorProto.FLOAT, [None, num_classes])
    cam_info = helper.make_tensor_value_info("cam_maps", TensorProto.FLOAT, [None, num_classes, None, None])

    graph = helper.make_graph(
        [conv_node, relu_node, gap_node, flat_node, fc_node, cam_conv_node, cam_relu_node],
        "test_crop_model",
        [X],
        [logits_info, cam_info],
        initializer=[conv_w_init, conv_b_init, cls_w_init, cls_b_init, cam_w_init, cam_b_init],
    )
    model = helper.make_model(graph, opset_imports=[helper.make_opsetid("", 17)])
    model.ir_version = 8
    onnx.save(model, onnx_path)
    return onnx_path


def _build_test_gate_onnx(onnx_path: str) -> str:
    """Build a tiny binary gate ONNX that returns a scalar logit (always positive = plant)."""
    try:
        import onnx
        from onnx import TensorProto, helper, numpy_helper
    except ImportError:
        pytest.skip("onnx package required.")

    rng = np.random.default_rng(99)
    X = helper.make_tensor_value_info("image", TensorProto.FLOAT, [None, 3, 224, 224])

    conv_w = rng.standard_normal((4, 3, 32, 32)).astype(np.float32) * 0.01
    conv_b = np.zeros(4, dtype=np.float32)
    fc_w = rng.standard_normal((1, 4)).astype(np.float32) * 0.1
    fc_b = np.array([2.0], dtype=np.float32)  # Bias high → sigmoid > 0.5 → "is plant"

    graph = helper.make_graph(
        [
            helper.make_node("Conv", ["image", "cw", "cb"], ["feat"], kernel_shape=[32, 32], strides=[32, 32], pads=[0,0,0,0]),
            helper.make_node("Relu", ["feat"], ["feat_r"]),
            helper.make_node("GlobalAveragePool", ["feat_r"], ["gap"]),
            helper.make_node("Flatten", ["gap"], ["flat"], axis=1),
            helper.make_node("Gemm", ["flat", "fw", "fb"], ["plant_logit"], transB=1),
        ],
        "test_gate",
        [X],
        [helper.make_tensor_value_info("plant_logit", TensorProto.FLOAT, [None, 1])],
        initializer=[
            numpy_helper.from_array(conv_w, "cw"),
            numpy_helper.from_array(conv_b, "cb"),
            numpy_helper.from_array(fc_w, "fw"),
            numpy_helper.from_array(fc_b, "fb"),
        ],
    )
    model = helper.make_model(graph, opset_imports=[helper.make_opsetid("", 17)])
    model.ir_version = 8
    onnx.save(model, onnx_path)
    return onnx_path


@pytest.fixture(scope="session", autouse=True)
def _setup_test_artifacts():
    """Create synthetic test ONNX models and metadata before any test runs."""
    test_classes = ["Tomato___Early_blight", "Tomato___healthy", "Tomato___Late_blight"]
    meta = {
        "model_version": "test",
        "backbone": "test_conv",
        "num_classes": len(test_classes),
        "classes": test_classes,
        "image_size": 224,
        "mean": [0.485, 0.456, 0.406],
        "std": [0.229, 0.224, 0.225],
        "temperature": 1.0,
        "confidence_threshold": 0.55,
        "energy_threshold": -3.5,
        "plant_gate_threshold": 0.45,
        "outputs": ["logits", "cam_maps"],
    }
    with open(os.environ["MODEL_META_PATH"], "w") as f:
        json.dump(meta, f)

    _build_test_onnx_model(os.environ["MODEL_ONNX_PATH"], num_classes=len(test_classes))
    _build_test_gate_onnx(os.environ["PLANT_GATE_ONNX_PATH"])

    # Now import and reload services with test artifacts
    from app.services.inference import inference_service
    from app.services.advice import advice_service
    from app.db import engine
    from app.db.models import Base

    Base.metadata.create_all(bind=engine)
    inference_service.load()
    advice_service.load()

    yield

    engine.dispose()
    try:
        _tmp_dir_obj.cleanup()
    except PermissionError:
        pass


@pytest.fixture()
def client():
    """Provide an HTTPX TestClient for the FastAPI app."""
    from httpx import ASGITransport, AsyncClient
    from fastapi.testclient import TestClient
    from app.main import app

    with TestClient(app, raise_server_exceptions=False) as c:
        yield c


def make_test_jpeg(width: int = 256, height: int = 256) -> bytes:
    """Generate a synthetic RGB JPEG image for upload testing."""
    rng = np.random.default_rng(42)
    arr = rng.integers(0, 255, (height, width, 3), dtype=np.uint8)
    img = Image.fromarray(arr)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    return buf.getvalue()


def make_test_png(width: int = 64, height: int = 64) -> bytes:
    """Generate a synthetic RGB PNG image."""
    rng = np.random.default_rng(7)
    arr = rng.integers(0, 255, (height, width, 3), dtype=np.uint8)
    img = Image.fromarray(arr)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()

