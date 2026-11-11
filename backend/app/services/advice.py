"""Advice lookup service backed by configs/advice_kb.json."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from app.core import settings
from app.core.logging import logger


class AdviceService:
    """Load and query the agronomic advice knowledge base."""

    def __init__(self) -> None:
        self.kb: dict[str, Any] = {}
        self._default_disease: dict[str, Any] = {}
        self._default_pest: dict[str, Any] = {}
        self._healthy_template: dict[str, Any] = {}

    def load(self) -> None:
        kb_path = Path(settings.advice_kb_path)
        if not kb_path.exists():
            logger.warning("Advice KB not found at %s", kb_path)
            return
        with kb_path.open("r", encoding="utf-8") as f:
            raw = json.load(f)
        self._healthy_template = raw.pop("_healthy_template", {})
        self._default_disease = raw.pop("_default_disease_template", {})
        self._default_pest = raw.pop("_default_pest_template", {})
        self.kb = raw
        logger.info("Loaded advice KB with %d disease/pest entries.", len(self.kb))

    def get_advice(self, class_id: str) -> dict[str, Any] | None:
        """Look up advice for a canonical class label, falling back to templates."""
        if class_id in self.kb:
            return dict(self.kb[class_id])

        lower_map = {k.lower(): v for k, v in self.kb.items()}
        if class_id.lower() in lower_map:
            return dict(lower_map[class_id.lower()])

        if "healthy" in class_id.lower():
            return dict(self._healthy_template) if self._healthy_template else None

        if class_id.startswith("Pest"):
            return dict(self._default_pest) if self._default_pest else None

        return dict(self._default_disease) if self._default_disease else None


# Module-level singleton
advice_service = AdviceService()

