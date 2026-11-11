"""Pydantic v2 application settings with `.env` loading and optional HF Hub auto-download."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Backend configuration loaded from `.env`, environment variables, or defaults."""

    # --- General ---
    project_name: str = "Crop Disease & Pest Classifier"
    app_env: str = "development"
    log_level: str = "INFO"

    # --- Server ---
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    cors_origins: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"
    rate_limit: str = "60/minute"

    # --- Upload Validation ---
    max_upload_mb: int = 10

    # --- Model Paths ---
    model_onnx_path: str = "artifacts/model.onnx"
    model_meta_path: str = "artifacts/model_meta.json"
    plant_gate_onnx_path: str = "artifacts/plant_gate.onnx"
    advice_kb_path: str = "configs/advice_kb.json"

    # --- Hugging Face Hub (optional cloud artifact download) ---
    hf_token: str = ""
    hf_model_repo: str = ""

    # --- Calibration & OOD Thresholds (fallbacks; overridden by model_meta.json if present) ---
    uncertainty_conf_threshold: float = 0.55
    ood_energy_threshold: float = -3.5
    plant_gate_threshold: float = 0.45

    # --- Database ---
    database_url: str = "sqlite:///./backend_data.sqlite3"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _parse_cors(cls, v: Any) -> str:
        if isinstance(v, list):
            return ",".join(str(x) for x in v)
        return str(v)

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_mb * 1024 * 1024

    def ensure_artifacts(self) -> None:
        """Download model artifacts from Hugging Face Hub if they are missing locally."""
        if not self.hf_model_repo:
            return

        needed_files = [
            (self.model_onnx_path, "model.onnx"),
            (self.model_meta_path, "model_meta.json"),
        ]
        # Optionally fetch plant gate
        if not Path(self.plant_gate_onnx_path).exists():
            needed_files.append((self.plant_gate_onnx_path, "plant_gate.onnx"))

        missing = [(local, remote) for local, remote in needed_files if not Path(local).exists()]
        if not missing:
            return

        try:
            from huggingface_hub import hf_hub_download

            token = self.hf_token or None
            for local_path, filename in missing:
                dest_dir = str(Path(local_path).parent)
                os.makedirs(dest_dir, exist_ok=True)
                downloaded = hf_hub_download(
                    repo_id=self.hf_model_repo,
                    filename=filename,
                    local_dir=dest_dir,
                    token=token,
                )
                print(f"[config] Downloaded {filename} from HF Hub -> {downloaded}")
        except Exception as exc:
            print(f"[config] HF Hub download failed: {exc}")


# Singleton
settings = Settings()

