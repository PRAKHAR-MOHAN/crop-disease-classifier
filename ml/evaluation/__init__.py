"""Evaluation, calibration, out-of-distribution detection, and Grad-CAM explainability."""

from ml.evaluation.calibrate import compute_ece, fit_temperature_scaling
from ml.evaluation.gradcam import compute_pytorch_gradcam, render_cam_overlay
from ml.evaluation.metrics import compute_classification_metrics
from ml.evaluation.ood import compute_energy_score, tune_ood_thresholds

__all__ = [
    "compute_classification_metrics",
    "compute_ece",
    "compute_energy_score",
    "compute_pytorch_gradcam",
    "fit_temperature_scaling",
    "render_cam_overlay",
    "tune_ood_thresholds",
]

