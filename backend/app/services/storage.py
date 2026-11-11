"""Persist prediction logs and user feedback to the database for analytics & retraining."""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.core.logging import logger
from app.db.models import PredictionLog, UserFeedback


def save_prediction_log(
    db: Session,
    request_id: str,
    result: dict[str, Any],
    filename: str | None = None,
    file_size: int | None = None,
) -> PredictionLog:
    """Write a prediction result to the database."""
    record = PredictionLog(
        request_id=request_id,
        predicted_class=str(result.get("label", "Unknown")),
        confidence=float(result.get("confidence", 0.0)),
        top3=result.get("top3"),
        is_uncertain=bool(result.get("is_uncertain", False)),
        is_ood=bool(result.get("is_ood", False)),
        filename=filename,
        file_size_bytes=file_size,
        latency_ms=float(result.get("latency_ms", 0.0)),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    logger.info(
        "Prediction logged",
        extra={"prediction_id": record.id, "class": record.predicted_class},
    )
    return record


def save_user_feedback(
    db: Session,
    request_id: str,
    predicted_class: str,
    is_correct: bool,
    corrected_class: str | None = None,
    comment: str | None = None,
) -> UserFeedback:
    """Save user correction or confirmation for a prior prediction."""
    record = UserFeedback(
        request_id=request_id,
        predicted_class=predicted_class,
        is_correct=is_correct,
        corrected_class=corrected_class,
        comment=comment,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    logger.info(
        "Feedback saved",
        extra={"feedback_id": record.id, "correct": is_correct, "corrected": corrected_class},
    )
    return record

