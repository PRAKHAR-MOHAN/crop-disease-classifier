"""Integration tests for all API endpoints."""

from __future__ import annotations

import io

import numpy as np
import pytest
from PIL import Image

from tests.conftest import make_test_jpeg, make_test_png


class TestHealthEndpoint:
    def test_health_returns_200(self, client) -> None:
        resp = client.get("/health")
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] in ("healthy", "degraded")
        assert isinstance(body["model_loaded"], bool)
        assert isinstance(body["num_classes"], int)


class TestClassesEndpoint:
    def test_classes_returns_list(self, client) -> None:
        resp = client.get("/classes")
        assert resp.status_code == 200
        body = resp.json()
        assert body["num_classes"] > 0
        assert isinstance(body["classes"], list)
        assert len(body["classes"]) == body["num_classes"]


class TestAdviceEndpoint:
    def test_known_class(self, client) -> None:
        resp = client.get("/advice/Tomato___Early_blight")
        assert resp.status_code == 200
        body = resp.json()
        assert "symptoms" in body
        assert "organic_treatment" in body

    def test_healthy_class(self, client) -> None:
        resp = client.get("/advice/Tomato___healthy")
        assert resp.status_code == 200
        body = resp.json()
        assert body["severity"] == "healthy"

    def test_unknown_class_fallback(self, client) -> None:
        resp = client.get("/advice/FakeClass___nothing")
        # Should return the default disease template fallback, not 404
        assert resp.status_code == 200


class TestPredictEndpoint:
    def test_predict_jpeg(self, client) -> None:
        data = make_test_jpeg()
        resp = client.post("/predict", files={"file": ("test.jpg", data, "image/jpeg")})
        assert resp.status_code == 200
        body = resp.json()
        assert "label" in body
        assert "confidence" in body
        assert 0.0 <= body["confidence"] <= 1.0
        assert len(body["top3"]) == 3
        assert "request_id" in body
        assert "latency_ms" in body
        assert isinstance(body["is_uncertain"], bool)
        assert isinstance(body["is_ood"], bool)

    def test_predict_png(self, client) -> None:
        data = make_test_png()
        resp = client.post("/predict", files={"file": ("test.png", data, "image/png")})
        assert resp.status_code == 200

    def test_predict_gradcam_returned(self, client) -> None:
        data = make_test_jpeg()
        resp = client.post("/predict", files={"file": ("leaf.jpg", data, "image/jpeg")})
        body = resp.json()
        # gradcam may be null if model marks as OOD, but if label != Unknown it should exist
        if not body["is_ood"]:
            assert body["gradcam"] is not None
            assert len(body["gradcam"]) > 10  # should be a non-trivial base64 string

    def test_predict_top3_ordered(self, client) -> None:
        data = make_test_jpeg()
        resp = client.post("/predict", files={"file": ("leaf.jpg", data, "image/jpeg")})
        top3 = resp.json()["top3"]
        confidences = [e["confidence"] for e in top3]
        assert confidences == sorted(confidences, reverse=True)

    def test_reject_non_image(self, client) -> None:
        resp = client.post(
            "/predict",
            files={"file": ("malware.exe", b"\x00" * 1000, "application/octet-stream")},
        )
        assert resp.status_code == 400

    def test_reject_oversized(self, client) -> None:
        # 15 MB of fake JPEG (valid header but too large)
        big = make_test_jpeg()
        big_padded = big + b"\x00" * (15 * 1024 * 1024)
        resp = client.post(
            "/predict",
            files={"file": ("huge.jpg", big_padded, "image/jpeg")},
        )
        assert resp.status_code == 400
        assert "exceeds" in resp.json()["detail"].lower()

    def test_request_id_in_header(self, client) -> None:
        data = make_test_jpeg()
        resp = client.post("/predict", files={"file": ("test.jpg", data, "image/jpeg")})
        assert "x-request-id" in resp.headers


class TestFeedbackEndpoint:
    def test_feedback_correct(self, client) -> None:
        # First, make a prediction to get a request_id
        data = make_test_jpeg()
        pred = client.post("/predict", files={"file": ("test.jpg", data, "image/jpeg")})
        rid = pred.json()["request_id"]

        resp = client.post(
            "/feedback",
            json={"request_id": rid, "is_correct": True},
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"

    def test_feedback_incorrect_with_correction(self, client) -> None:
        data = make_test_jpeg()
        pred = client.post("/predict", files={"file": ("test.jpg", data, "image/jpeg")})
        rid = pred.json()["request_id"]

        resp = client.post(
            "/feedback",
            json={
                "request_id": rid,
                "is_correct": False,
                "corrected_class": "Tomato___healthy",
                "comment": "Actually healthy",
            },
        )
        assert resp.status_code == 200

    def test_feedback_incorrect_missing_correction(self, client) -> None:
        resp = client.post(
            "/feedback",
            json={"request_id": "fake123", "is_correct": False},
        )
        assert resp.status_code == 400
        assert "corrected_class" in resp.json()["detail"].lower()

