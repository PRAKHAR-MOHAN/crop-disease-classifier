"""Strict Pydantic v2 request/response schemas for the prediction API."""

from __future__ import annotations

from pydantic import BaseModel, Field


class Top3Entry(BaseModel):
    """Single entry in the Top-3 prediction list."""

    rank: int = Field(..., ge=1, le=3, description="Rank 1–3 (1 = most likely)")
    class_id: str = Field(..., description="Canonical class label (Crop___Disease)")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Calibrated probability")


class PredictionResponse(BaseModel):
    """Successful prediction result."""

    request_id: str = Field(..., description="Unique request trace ID")
    label: str = Field(..., description="Predicted class (Crop___Disease or 'Unknown')")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Calibrated top-1 probability")
    top3: list[Top3Entry] = Field(..., description="Top-3 ranked predictions")
    gradcam: str | None = Field(None, description="Base64-encoded PNG Grad-CAM overlay")
    advice: AdviceEntry | None = Field(None, description="Treatment & prevention advice card")
    is_uncertain: bool = Field(False, description="True when model confidence is below threshold")
    is_ood: bool = Field(False, description="True when input is likely out-of-distribution")
    latency_ms: float = Field(..., description="Server-side inference latency in milliseconds")


class AdviceEntry(BaseModel):
    """Structured advice card returned alongside predictions."""

    severity: str = Field("moderate", description="low | moderate | high | critical | healthy")
    symptoms: str = Field(..., description="Visible symptom description")
    organic_treatment: list[str] = Field(default_factory=list)
    chemical_treatment: list[str] = Field(default_factory=list)
    prevention: list[str] = Field(default_factory=list)


# Rebuild PredictionResponse now that AdviceEntry is defined
PredictionResponse.model_rebuild()


class FeedbackRequest(BaseModel):
    """User-submitted label correction for a prior prediction."""

    request_id: str = Field(..., min_length=1, description="Request ID of the prediction to correct")
    is_correct: bool = Field(..., description="Whether the prediction was correct")
    corrected_class: str | None = Field(None, description="Correct label if is_correct is False")
    comment: str | None = Field(None, max_length=500, description="Optional free-text comment")


class FeedbackResponse(BaseModel):
    """Acknowledgement of saved feedback."""

    status: str = "ok"
    message: str = "Feedback recorded. Thank you!"


class HealthResponse(BaseModel):
    """Health-check response."""

    status: str = "healthy"
    model_loaded: bool = False
    num_classes: int = 0
    backend_version: str = "1.0.0"


class ClassListResponse(BaseModel):
    """List of all known classes."""

    num_classes: int
    classes: list[str]


class ErrorResponse(BaseModel):
    """Structured API error format."""

    error: str
    detail: str = ""
    request_id: str | None = None

