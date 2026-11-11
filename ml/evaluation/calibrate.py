"""Post-hoc temperature scaling calibration and Expected Calibration Error (ECE)."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import matplotlib
import numpy as np
import torch
import torch.nn as nn
from scipy.special import softmax

matplotlib.use("Agg")
import matplotlib.pyplot as plt


class TemperatureScaler(nn.Module):
    """Positive scalar temperature T fitted via NLL minimization on validation logits."""

    def __init__(self, init_temp: float = 1.0) -> None:
        super().__init__()
        self.log_temperature = nn.Parameter(torch.tensor([np.log(init_temp)], dtype=torch.float32))

    @property
    def temperature(self) -> float:
        return float(torch.exp(self.log_temperature).clamp(0.1, 10.0).item())

    def forward(self, logits: torch.Tensor) -> torch.Tensor:
        temp = torch.exp(self.log_temperature).clamp(0.1, 10.0)
        return logits / temp


def compute_ece(
    probs: np.ndarray,
    targets: np.ndarray,
    n_bins: int = 15,
) -> tuple[float, dict[str, Any]]:
    """Compute Expected Calibration Error (ECE) and bin statistics for reliability diagrams."""
    confidences = np.max(probs, axis=-1)
    predictions = np.argmax(probs, axis=-1)
    accuracies = (predictions == targets).astype(np.float64)

    bin_edges = np.linspace(0.0, 1.0, n_bins + 1)
    bin_acc = []
    bin_conf = []
    bin_counts = []
    ece = 0.0
    n = max(len(targets), 1)

    for idx in range(n_bins):
        low, high = bin_edges[idx], bin_edges[idx + 1]
        if idx == 0:
            mask = (confidences >= low) & (confidences <= high)
        else:
            mask = (confidences > low) & (confidences <= high)
        cnt = int(mask.sum())
        bin_counts.append(cnt)
        if cnt > 0:
            acc_b = float(accuracies[mask].mean())
            conf_b = float(confidences[mask].mean())
            ece += (cnt / n) * abs(acc_b - conf_b)
        else:
            acc_b = 0.0
            conf_b = float((low + high) / 2.0)
        bin_acc.append(acc_b)
        bin_conf.append(conf_b)

    return float(ece), {
        "bin_edges": bin_edges.tolist(),
        "bin_acc": bin_acc,
        "bin_conf": bin_conf,
        "bin_counts": bin_counts,
    }


def plot_reliability_diagram(
    before_stats: dict[str, Any],
    after_stats: dict[str, Any],
    ece_before: float,
    ece_after: float,
    temperature: float,
    out_path: str | Path,
) -> None:
    """Render before/after temperature scaling reliability diagrams."""
    edges = np.array(before_stats["bin_edges"])
    centers = 0.5 * (edges[:-1] + edges[1:])
    width = (edges[1] - edges[0]) * 0.85

    fig, axes = plt.subplots(1, 2, figsize=(11, 4.6), sharey=True)
    panels = [
        (axes[0], before_stats, f"Uncalibrated (T=1.00, ECE={ece_before:.4f})"),
        (axes[1], after_stats, f"Temperature Scaled (T={temperature:.2f}, ECE={ece_after:.4f})"),
    ]

    for ax, stats, title in panels:
        ax.bar(centers, stats["bin_acc"], width=width, color="#2d6a4f", alpha=0.82, edgecolor="#1b4332", label="Empirical Accuracy")
        ax.plot([0, 1], [0, 1], "--", color="#d62828", linewidth=1.6, label="Perfect Calibration")
        ax.set_title(title, fontsize=11, fontweight="bold")
        ax.set_xlabel("Predicted Confidence")
        ax.set_xlim(0.0, 1.0)
        ax.set_ylim(0.0, 1.0)
        ax.grid(alpha=0.3, linestyle="--")
        ax.legend(loc="upper left", fontsize=8.5)

    axes[0].set_ylabel("Accuracy")
    fig.tight_layout()
    fig.savefig(out_path, dpi=180)
    plt.close(fig)


def fit_temperature_scaling(
    val_logits: np.ndarray,
    val_targets: np.ndarray,
    plot_path: str | Path | None = None,
) -> dict[str, Any]:
    """Fit scalar temperature T on validation logits via L-BFGS and compute ECE."""
    logits_t = torch.tensor(val_logits, dtype=torch.float32)
    targets_t = torch.tensor(val_targets, dtype=torch.long)
    nll_criterion = nn.CrossEntropyLoss()

    with torch.no_grad():
        nll_before = float(nll_criterion(logits_t, targets_t).item())

    probs_before = softmax(val_logits, axis=-1)
    ece_before, stats_before = compute_ece(probs_before, val_targets)

    scaler = TemperatureScaler(init_temp=1.0)
    optimizer = torch.optim.LBFGS([scaler.log_temperature], lr=0.05, max_iter=80)

    def _closure() -> torch.Tensor:
        optimizer.zero_grad()
        loss = nll_criterion(scaler(logits_t), targets_t)
        loss.backward()
        return loss

    optimizer.step(_closure)
    temperature = scaler.temperature

    with torch.no_grad():
        nll_after = float(nll_criterion(scaler(logits_t), targets_t).item())

    probs_after = softmax(val_logits / temperature, axis=-1)
    ece_after, stats_after = compute_ece(probs_after, val_targets)

    if plot_path is not None:
        plot_reliability_diagram(
            stats_before,
            stats_after,
            ece_before,
            ece_after,
            temperature,
            plot_path,
        )

    return {
        "temperature": round(temperature, 6),
        "nll_before": round(nll_before, 6),
        "nll_after": round(nll_after, 6),
        "ece_before": round(ece_before, 6),
        "ece_after": round(ece_after, 6),
    }

