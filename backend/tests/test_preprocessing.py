"""Tests for image validation, preprocessing, and normalization."""

from __future__ import annotations

import io

import numpy as np
import pytest
from PIL import Image

from app.services.inference import InferenceService, validate_image_bytes
from tests.conftest import make_test_jpeg, make_test_png


class TestValidateImageBytes:
    """Unit tests for magic-byte file type validation and size checks."""

    def test_valid_jpeg(self) -> None:
        data = make_test_jpeg()
        ok, msg = validate_image_bytes(data, max_bytes=10 * 1024 * 1024)
        assert ok is True
        assert msg == "image/jpeg"

    def test_valid_png(self) -> None:
        data = make_test_png()
        ok, msg = validate_image_bytes(data, max_bytes=10 * 1024 * 1024)
        assert ok is True
        assert msg == "image/png"

    def test_too_large(self) -> None:
        data = make_test_jpeg()
        ok, msg = validate_image_bytes(data, max_bytes=100)
        assert ok is False
        assert "exceeds" in msg.lower()

    def test_too_small(self) -> None:
        ok, msg = validate_image_bytes(b"AB", max_bytes=10 * 1024 * 1024)
        assert ok is False
        assert "too small" in msg.lower()

    def test_unsupported_format(self) -> None:
        ok, msg = validate_image_bytes(b"\x00\x00\x00\x00\x00\x00\x00\x00", max_bytes=10 * 1024 * 1024)
        assert ok is False
        assert "unsupported" in msg.lower()

    def test_pdf_rejected(self) -> None:
        ok, msg = validate_image_bytes(b"%PDF-1.4 fake content padding", max_bytes=10 * 1024 * 1024)
        assert ok is False


class TestPreprocessing:
    """Test image decode, EXIF handling, resize, crop, and normalization."""

    def test_output_shape(self) -> None:
        svc = InferenceService()
        svc.image_size = 224
        svc.mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        svc.std = np.array([0.229, 0.224, 0.225], dtype=np.float32)

        data = make_test_jpeg(300, 400)
        tensor, rgb_np = svc.preprocess(data)
        assert tensor.shape == (1, 3, 224, 224)
        assert tensor.dtype == np.float32

    def test_exif_rotation_handled(self) -> None:
        """Verify that an EXIF-rotated image is transposed before preprocessing."""
        try:
            import piexif
        except ImportError:
            pytest.skip("piexif not installed; skipping EXIF rotation test.")

        img = Image.new("RGB", (400, 200), color=(0, 128, 0))
        exif_dict: dict = {"0th": {}, "Exif": {}, "GPS": {}, "1st": {}}
        exif_dict["0th"][piexif.ImageIFD.Orientation] = 6  # 90° CW rotation
        exif_bytes = piexif.dump(exif_dict)

        buf = io.BytesIO()
        img.save(buf, format="JPEG", exif=exif_bytes)
        data = buf.getvalue()

        svc = InferenceService()
        svc.image_size = 224
        svc.mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        svc.std = np.array([0.229, 0.224, 0.225], dtype=np.float32)

        tensor, rgb_np = svc.preprocess(data)
        assert tensor.shape == (1, 3, 224, 224)
        # EXIF transpose should make the "tall" dimension the height
        assert rgb_np.shape[0] > rgb_np.shape[1] or rgb_np.shape[0] == rgb_np.shape[1]

    def test_normalization_range(self) -> None:
        """Normalized values should be roughly in [-3, 3] for ImageNet stats."""
        svc = InferenceService()
        svc.image_size = 224
        svc.mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        svc.std = np.array([0.229, 0.224, 0.225], dtype=np.float32)

        data = make_test_jpeg()
        tensor, _ = svc.preprocess(data)
        assert tensor.min() > -5.0
        assert tensor.max() < 5.0
