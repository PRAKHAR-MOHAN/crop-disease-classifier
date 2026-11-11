"""Unified experiment tracking wrapper (Weights & Biases, MLflow, and local JSONL)."""

from __future__ import annotations

import json
import os
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from ml.utils.io import ensure_dir, save_json


def _flatten_dict(d: dict[str, Any], prefix: str = "") -> dict[str, Any]:
    flat: dict[str, Any] = {}
    for k, v in d.items():
        key = f"{prefix}.{k}" if prefix else str(k)
        if isinstance(v, dict):
            flat.update(_flatten_dict(v, prefix=key))
        else:
            flat[key] = v
    return flat


class ExperimentTracker:
    """Fault-tolerant experiment logger supporting W&B, MLflow, and local JSONL logs."""

    def __init__(
        self,
        run_name: str,
        backend: str | None = None,
        project: str = "crop-disease-classifier",
        run_dir: str | Path = "artifacts/runs",
        config: dict[str, Any] | None = None,
    ) -> None:
        env_backend = os.getenv("TRACKING_BACKEND")
        self.backend = (env_backend or backend or "none").strip().lower()
        self.run_name = run_name
        self.project = os.getenv("WANDB_PROJECT", project)
        self.run_dir = ensure_dir(Path(run_dir) / run_name)
        self.metrics_file = self.run_dir / "metrics.jsonl"
        self.config = config or {}

        self._wandb_run: Any = None
        self._mlflow_active = False

    def __enter__(self) -> ExperimentTracker:
        self.start()
        return self

    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        self.finish()

    def start(self) -> None:
        """Initialize the configured tracking backend and persist local params."""
        save_json(self.config, self.run_dir / "params.json")

        if self.backend == "wandb":
            try:
                import wandb

                mode = "online" if os.getenv("WANDB_API_KEY") else "offline"
                self._wandb_run = wandb.init(
                    project=self.project,
                    entity=os.getenv("WANDB_ENTITY") or None,
                    name=self.run_name,
                    config=self.config,
                    mode=mode,
                    reinit=True,
                )
            except Exception as exc:  # pragma: no cover - optional runtime dependency
                print(f"[Tracker] W&B init failed ({exc}); falling back to local JSONL.")
                self.backend = "none"

        elif self.backend == "mlflow":
            try:
                import mlflow

                tracking_uri = os.getenv("MLFLOW_TRACKING_URI", "./mlruns")
                mlflow.set_tracking_uri(tracking_uri)
                mlflow.set_experiment(self.project)
                mlflow.start_run(run_name=self.run_name)
                flat_cfg = {k: str(v)[:250] for k, v in _flatten_dict(self.config).items()}
                mlflow.log_params(flat_cfg)
                self._mlflow_active = True
            except Exception as exc:  # pragma: no cover
                print(f"[Tracker] MLflow init failed ({exc}); falling back to local JSONL.")
                self.backend = "none"

    def log_metrics(self, metrics: dict[str, float | int], step: int | None = None) -> None:
        """Log scalar metrics to local JSONL and active remote tracker."""
        clean = {k: float(v) for k, v in metrics.items()}
        record: dict[str, Any] = {
            "timestamp": datetime.now(UTC).isoformat(),
            "step": step,
            **clean,
        }
        with self.metrics_file.open("a", encoding="utf-8") as f:
            f.write(json.dumps(record) + "\n")

        if self._wandb_run is not None:
            self._wandb_run.log(clean, step=step)

        if self._mlflow_active:
            import mlflow

            mlflow.log_metrics(clean, step=step)

    def log_artifact(self, path: str | Path, artifact_type: str = "file") -> None:
        """Register an output file (checkpoint, plot, report) with the active tracker."""
        p = Path(path)
        if not p.exists():
            return

        if self._wandb_run is not None:
            try:
                import wandb

                art = wandb.Artifact(name=f"{self.run_name}-{p.stem}", type=artifact_type)
                art.add_file(str(p))
                self._wandb_run.log_artifact(art)
            except Exception as exc:
                print(f"[Tracker] W&B log_artifact warning: {exc}")

        if self._mlflow_active:
            try:
                import mlflow

                mlflow.log_artifact(str(p))
            except Exception as exc:
                print(f"[Tracker] MLflow log_artifact warning: {exc}")

    def finish(self) -> None:
        """Flush and close active tracking sessions."""
        if self._wandb_run is not None:
            try:
                self._wandb_run.finish()
            except Exception:
                pass
            self._wandb_run = None

        if self._mlflow_active:
            try:
                import mlflow

                mlflow.end_run()
            except Exception:
                pass
            self._mlflow_active = False

