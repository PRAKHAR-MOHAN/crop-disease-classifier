"""Classification metrics and confusion-matrix / per-class visualization utilities."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import matplotlib
import numpy as np
import pandas as pd
from scipy.special import softmax
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_recall_fscore_support,
    roc_auc_score,
)
from sklearn.preprocessing import label_binarize

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns


def compute_classification_metrics(
    targets: np.ndarray,
    logits: np.ndarray,
    classes: list[str],
    temperature: float = 1.0,
) -> dict[str, Any]:
    """Compute accuracy, macro/weighted F1, precision/recall, macro ROC-AUC, and confusion matrix."""
    probs = softmax(logits / max(temperature, 1e-6), axis=-1)
    preds = np.argmax(probs, axis=-1)
    num_classes = len(classes)
    labels_idx = list(range(num_classes))

    acc = float(accuracy_score(targets, preds))
    macro_f1 = float(f1_score(targets, preds, average="macro", zero_division=0))
    weighted_f1 = float(f1_score(targets, preds, average="weighted", zero_division=0))
    macro_p, macro_r, _, _ = precision_recall_fscore_support(
        targets, preds, average="macro", zero_division=0
    )

    # Compute macro OvR ROC-AUC across classes present in `targets`
    present_classes = sorted(set(targets.tolist()))
    roc_auc_macro: float | None = None
    if len(present_classes) >= 2:
        try:
            y_bin = label_binarize(targets, classes=labels_idx)
            per_cls_aucs = []
            for c in present_classes:
                if 0 < y_bin[:, c].sum() < len(targets):
                    per_cls_aucs.append(float(roc_auc_score(y_bin[:, c], probs[:, c])))
            if per_cls_aucs:
                roc_auc_macro = float(np.mean(per_cls_aucs))
        except Exception:
            roc_auc_macro = None

    report_dict = classification_report(
        targets,
        preds,
        labels=labels_idx,
        target_names=classes,
        output_dict=True,
        zero_division=0,
    )
    per_class = {
        cls_name: {
            "precision": float(report_dict[cls_name]["precision"]),
            "recall": float(report_dict[cls_name]["recall"]),
            "f1": float(report_dict[cls_name]["f1-score"]),
            "support": int(report_dict[cls_name]["support"]),
        }
        for cls_name in classes
        if cls_name in report_dict
    }

    cm = confusion_matrix(targets, preds, labels=labels_idx)

    return {
        "num_samples": int(len(targets)),
        "accuracy": acc,
        "macro_f1": macro_f1,
        "weighted_f1": weighted_f1,
        "macro_precision": float(macro_p),
        "macro_recall": float(macro_r),
        "roc_auc_macro": roc_auc_macro,
        "per_class": per_class,
        "confusion_matrix": cm.tolist(),
    }


def plot_confusion_matrix(
    cm: np.ndarray,
    classes: list[str],
    out_path: str | Path,
    title: str = "Normalized Confusion Matrix",
) -> None:
    """Plot row-normalized confusion matrix scaled cleanly to class count."""
    cm_arr = np.asarray(cm, dtype=np.float64)
    row_sums = cm_arr.sum(axis=1, keepdims=True)
    cm_norm = np.divide(cm_arr, np.maximum(row_sums, 1.0))

    n = len(classes)
    short_names = [c.replace("___", ": ") for c in classes]
    fig_dim = max(8.0, min(22.0, 0.36 * n))
    font_sz = 9 if n <= 20 else 6.5

    fig, ax = plt.subplots(figsize=(fig_dim, fig_dim * 0.88))
    sns.heatmap(
        cm_norm,
        xticklabels=short_names,
        yticklabels=short_names,
        cmap="YlGn",
        vmin=0.0,
        vmax=1.0,
        annot=(n <= 18),
        fmt=".2f" if n <= 18 else "",
        cbar_kws={"label": "Recall"},
        ax=ax,
    )
    ax.set_title(title, fontsize=13, fontweight="bold")
    ax.set_xlabel("Predicted Class")
    ax.set_ylabel("True Class")
    ax.tick_params(axis="x", rotation=90, labelsize=font_sz)
    ax.tick_params(axis="y", rotation=0, labelsize=font_sz)
    fig.tight_layout()
    fig.savefig(out_path, dpi=180)
    plt.close(fig)


def save_per_class_csv(per_class: dict[str, dict[str, Any]], out_path: str | Path) -> Path:
    """Save per-class precision/recall/F1 table as CSV sorted by F1 ascending."""
    rows = [{"class": cls_name, **vals} for cls_name, vals in per_class.items()]
    df = pd.DataFrame(rows).sort_values("f1", ascending=True)
    p = Path(out_path)
    df.to_csv(p, index=False)
    return p

