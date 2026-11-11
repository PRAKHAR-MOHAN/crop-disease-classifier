"""API route definitions for the Crop Disease & Pest Classifier."""

from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.logging import logger, request_id_var
from app.db import get_db
from app.schemas import (
    AdviceEntry,
    ClassListResponse,
    ErrorResponse,
    FeedbackRequest,
    FeedbackResponse,
    HealthResponse,
    PredictionResponse,
    Top3Entry,
)
from app.services.advice import advice_service
from app.services.inference import InferenceService, inference_service, validate_image_bytes
from app.services.storage import save_prediction_log, save_user_feedback
from app.core import settings

router = APIRouter()


@router.get("/health", response_model=HealthResponse, tags=["System"])
def health_check() -> HealthResponse:
    """Liveness & readiness probe."""
    return HealthResponse(
        status="healthy" if inference_service.loaded else "degraded",
        model_loaded=inference_service.loaded,
        num_classes=inference_service.num_classes,
    )


@router.get("/classes", response_model=ClassListResponse, tags=["System"])
def list_classes() -> ClassListResponse:
    """Return the canonical ordered list of disease/pest classes the model recognises."""
    return ClassListResponse(
        num_classes=inference_service.num_classes,
        classes=inference_service.classes,
    )


@router.get(
    "/advice/{class_id}",
    response_model=AdviceEntry | None,
    responses={404: {"model": ErrorResponse}},
    tags=["Advice"],
)
def get_advice(class_id: str) -> AdviceEntry:
    """Retrieve treatment & prevention advice for a specific disease/pest class."""
    entry = advice_service.get_advice(class_id)
    if entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No advice found for class '{class_id}'.",
        )
    return AdviceEntry(**entry)


@router.post(
    "/predict",
    response_model=PredictionResponse,
    responses={
        400: {"model": ErrorResponse},
        422: {"model": ErrorResponse},
        503: {"model": ErrorResponse},
    },
    tags=["Prediction"],
)
async def predict(
    file: UploadFile = File(..., description="Crop leaf / pest image (JPEG, PNG, WebP, BMP, ≤10 MB)"),
    db: Session = Depends(get_db),
) -> PredictionResponse:
    """Upload a crop image and receive a calibrated disease/pest prediction with Grad-CAM."""
    rid = request_id_var.get("-")

    if not inference_service.loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model is not loaded. The server is starting or misconfigured.",
        )

    # Read and validate upload
    data = await file.read()
    ok, msg = validate_image_bytes(data, settings.max_upload_bytes)
    if not ok:
        logger.warning("Upload rejected: %s", msg)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)

    # Run inference
    try:
        result = inference_service.predict(data)
    except Exception as exc:
        logger.error("Inference failed: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Could not process image: {exc}",
        ) from exc

    # Look up advice
    advice_entry: AdviceEntry | None = None
    if not result["is_ood"]:
        raw_advice = advice_service.get_advice(result["label"])
        if raw_advice:
            advice_entry = AdviceEntry(**raw_advice)

    # Persist prediction log
    try:
        save_prediction_log(
            db,
            request_id=rid,
            result=result,
            filename=file.filename,
            file_size=len(data),
        )
    except Exception as exc:
        logger.warning("Failed to persist prediction log: %s", exc)

    return PredictionResponse(
        request_id=rid,
        label=result["label"],
        confidence=result["confidence"],
        top3=[Top3Entry(**e) for e in result["top3"]],
        gradcam=result.get("gradcam"),
        advice=advice_entry,
        is_uncertain=result["is_uncertain"],
        is_ood=result["is_ood"],
        latency_ms=result["latency_ms"],
    )


@router.post(
    "/feedback",
    response_model=FeedbackResponse,
    responses={400: {"model": ErrorResponse}},
    tags=["Feedback"],
)
def submit_feedback(
    body: FeedbackRequest,
    db: Session = Depends(get_db),
) -> FeedbackResponse:
    """Submit user correction or confirmation for a prior prediction."""
    if not body.is_correct and not body.corrected_class:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="corrected_class is required when is_correct is false.",
        )

    # Look up the original prediction to record the predicted class
    from app.db.models import PredictionLog

    log = db.query(PredictionLog).filter(PredictionLog.request_id == body.request_id).first()
    predicted_class = log.predicted_class if log else "Unknown"

    save_user_feedback(
        db,
        request_id=body.request_id,
        predicted_class=predicted_class,
        is_correct=body.is_correct,
        corrected_class=body.corrected_class,
        comment=body.comment,
    )
    return FeedbackResponse()

