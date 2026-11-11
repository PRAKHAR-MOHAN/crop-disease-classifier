"""Out-of-distribution (OOD) detection via Energy Score, calibrated max-softmax, and PlantGate."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import matplotlib
import numpy as np
from scipy.special import logsumexp, softmax
from sklearn.metrics import roc_auc_score, roc_curve

matplotlib.use("Agg")
import matplotlib.pyplot as plt


def compute_energy_score(logits: np.ndarray, temperature: float = 1.0) -> np.ndarray:
    """Compute Helmholtz free-energy score E(x) = -T * logsumexp(z / T).

    More negative values indicate strong in-distribution certainty; values closer to 0
    (or positive) indicate out-of-distribution / uncertain inputs.
    """
    t = max(float(temperature), 1e-6)
    return -t * logsumexp(logits / t, axis=-1)


def _fpr_at_tpr(y_true_id: np.ndarray, id_scores: np.ndarray, target_tpr: float = 0.95) -> tuple[float, float]:
    """Compute FPR and threshold at `target_tpr` (where 1 = In-Distribution, 0 = OOD)."""
    fpr, tpr, thresholds = roc_curve(y_true_id, id_scores, pos_label=1)
    idx = int(np.searchsorted(tpr, target_tpr, side="left"))
    idx = min(idx, len(thresholds) - 1)
    return float(fpr[idx]), float(thresholds[idx])


def plot_ood_distributions(
    id_conf: np.ndarray,
    ood_conf: np.ndarray,
    id_energy: np.ndarray,
    ood_energy: np.ndarray,
    conf_thresh: float,
    energy_thresh: float,
    out_path: str | Path,
) -> None:
    """Plot ID vs. OOD distributions for calibrated max-softmax and Energy Score."""
    fig, axes = plt.subplots(1, 2, figsize=(12, 4.5))

    axes[0].hist(id_conf, bins=30, density=True, alpha=0.6, color="#2d6a4f", label="In-Distribution (Val)")
    axes[0].hist(ood_conf, bins=30, density=True, alpha=0.6, color="#e63946", label="OOD (Non-Plant)")
    axes[0].axvline(conf_thresh, color="#1d3557", linestyle="--", linewidth=1.8, label=f"Threshold={conf_thresh:.2f}")
    axes[0].set_title("Calibrated Max-Softmax Confidence")
    axes[0].set_xlabel("Max Probability")
    axes[0].set_ylabel("Density")
    axes[0].legend(fontsize=8.5)

    axes[1].hist(id_energy, bins=30, density=True, alpha=0.6, color="#2d6a4f", label="In-Distribution (Val)")
    axes[1].hist(ood_energy, bins=30, density=True, alpha=0.6, color="#e63946", label="OOD (Non-Plant)")
    axes[1].axvline(energy_thresh, color="#1d3557", linestyle="--", linewidth=1.8, label=f"Threshold={energy_thresh:.2f}")
    axes[1].set_title("Energy Score E(x)  [Lower = More Certain]")
    axes[1].set_xlabel("Energy Score")
    axes[1].legend(fontsize=8.5)

    fig.tight_layout()
    fig.savefig(out_path, dpi=180)
    plt.close(fig)


def tune_ood_thresholds(
    id_logits: np.ndarray,
    ood_logits: np.ndarray | None,
    temperature: float = 1.0,
    default_conf_threshold: float = 0.55,
    default_energy_threshold: float = -3.5,
    plot_path: str | Path | None = None,
) -> dict[str, Any]:
    """Tune confidence & energy thresholds separating in-distribution crops from OOD images."""
    id_probs = softmax(id_logits / max(temperature, 1e-6), axis=-1)
    id_conf = np.max(id_probs, axis=-1)
    id_energy = compute_energy_score(id_logits, temperature=1.0)

    if ood_logits is None or len(ood_logits) == 0:
        # Quantile-based fallback when OOD negatives were not provided
        conf_t = float(np.clip(np.quantile(id_conf, 0.05), 0.35, 0.75))
        energy_t = float(np.quantile(id_energy, 0.95))
        return {
            "has_ood_eval": False,
            "confidence_threshold": round(conf_t, 4),
            "energy_threshold": round(energy_t, 4),
            "default_conf_threshold": default_conf_threshold,
            "default_energy_threshold": default_energy_threshold,
            "id_conf_p05": round(float(np.quantile(id_conf, 0.05)), 4),
            "id_energy_p95": round(float(np.quantile(id_energy, 0.95)), 4),
        }

    ood_probs = softmax(ood_logits / max(temperature, 1e-6), axis=-1)
    ood_conf = np.max(ood_probs, axis=-1)
    ood_energy = compute_energy_score(ood_logits, temperature=1.0)

    y_true = np.concatenate([np.ones(len(id_conf)), np.zeros(len(ood_conf))])
    conf_scores = np.concatenate([id_conf, ood_conf])
    neg_energy_scores = np.concatenate([-id_energy, -ood_energy])  # higher = more ID

    conf_auroc = float(roc_auc_score(y_true, conf_scores))
    energy_auroc = float(roc_auc_score(y_true, neg_energy_scores))

    conf_fpr95, conf_thresh_95 = _fpr_at_tpr(y_true, conf_scores, target_tpr=0.95)
    energy_fpr95, neg_energy_thresh_95 = _fpr_at_tpr(y_true, neg_energy_scores, target_tpr=0.95)

    conf_thresh = float(np.clip(conf_thresh_95, 0.40, 0.80))
    energy_thresh = float(-neg_energy_thresh_95)

    if plot_path is not None:
        plot_ood_distributions(
            id_conf, ood_conf, id_energy, ood_energy, conf_thresh, energy_thresh, plot_path
        )

    return {
        "has_ood_eval": True,
        "confidence_threshold": round(conf_thresh, 4),
        "energy_threshold": round(energy_thresh, 4),
        "conf_auroc": round(conf_auroc, 4),
        "conf_fpr_at_95tpr": round(conf_fpr95, 4),
        "energy_auroc": round(energy_auroc, 4),
        "energy_fpr_at_95tpr": round(energy_fpr95, 4),
    }

