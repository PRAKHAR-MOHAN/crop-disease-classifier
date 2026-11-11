"""Benchmark ONNX Runtime CPU inference latency (<300ms target) and PyTorch parity.

Usage:
    python -m ml.export.benchmark_cpu --onnx artifacts/model.onnx --checkpoint artifacts/best_model.pt
"""

from __future__ import annotations

import argparse
import os
import time
from pathlib import Path
from typing import Any

import numpy as np
import onnxruntime as ort
import torch

from ml.export.export_model import DualOutputOnnxWrapper
from ml.models.factory import load_checkpoint_model
from ml.utils.io import ensure_dir, load_json, save_json


def benchmark_onnx_cpu(
    onnx_path: str | Path,
    meta_path: str | Path = "artifacts/model_meta.json",
    checkpoint_path: str | Path | None = "artifacts/best_model.pt",
    plant_gate_path: str | Path | None = "artifacts/plant_gate.onnx",
    warmup: int = 10,
    runs: int = 80,
    num_threads: int = 4,
    report_out: str | Path = "reports/cpu_benchmark.json",
) -> dict[str, Any]:
    """Measure single-image CPU latency (p50/p95/p99) and verify PyTorch-to-ONNX parity."""
    meta = load_json(meta_path)
    img_size = int(meta.get("image_size", 224))

    sess_opts = ort.SessionOptions()
    sess_opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
    sess_opts.intra_op_num_threads = min(num_threads, max(1, os.cpu_count() or 1))
    sess_opts.inter_op_num_threads = 1

    session = ort.InferenceSession(
        str(onnx_path),
        sess_options=sess_opts,
        providers=["CPUExecutionProvider"],
    )

    rng = np.random.default_rng(42)
    dummy_np = rng.standard_normal((1, 3, img_size, img_size), dtype=np.float32)

    # Verify numerical parity against PyTorch if checkpoint is provided
    parity: dict[str, Any] | None = None
    if checkpoint_path and Path(checkpoint_path).exists():
        pt_model, _ = load_checkpoint_model(checkpoint_path, device="cpu")
        wrapper = DualOutputOnnxWrapper(pt_model).eval()
        with torch.no_grad():
            pt_logits, pt_cams = wrapper(torch.from_numpy(dummy_np))
        ort_logits, ort_cams = session.run(["logits", "cam_maps"], {"image": dummy_np})

        pt_l = pt_logits.numpy().ravel()
        ort_l = ort_logits.ravel()
        max_abs_diff = float(np.max(np.abs(pt_l - ort_l)))
        cos_sim = float(np.dot(pt_l, ort_l) / (np.linalg.norm(pt_l) * np.linalg.norm(ort_l) + 1e-12))
        cam_diff = float(np.max(np.abs(pt_cams.numpy() - ort_cams)))
        parity = {
            "logits_max_abs_diff": round(max_abs_diff, 6),
            "logits_cosine_sim": round(cos_sim, 6),
            "cam_max_abs_diff": round(cam_diff, 6),
            "cam_shape": list(ort_cams.shape),
        }

    # Optional PlantGate session
    gate_session = None
    if plant_gate_path and Path(plant_gate_path).exists():
        gate_session = ort.InferenceSession(
            str(plant_gate_path),
            sess_options=sess_opts,
            providers=["CPUExecutionProvider"],
        )

    for _ in range(warmup):
        session.run(["logits", "cam_maps"], {"image": dummy_np})
        if gate_session is not None:
            gate_session.run(["plant_logit"], {"image": dummy_np})

    latencies_ms: list[float] = []
    for _ in range(runs):
        t0 = time.perf_counter()
        session.run(["logits", "cam_maps"], {"image": dummy_np})
        if gate_session is not None:
            gate_session.run(["plant_logit"], {"image": dummy_np})
        latencies_ms.append((time.perf_counter() - t0) * 1000.0)

    arr = np.array(latencies_ms, dtype=np.float64)
    summary: dict[str, Any] = {
        "onnx_path": str(onnx_path),
        "backbone": meta.get("backbone"),
        "image_size": img_size,
        "threads": sess_opts.intra_op_num_threads,
        "includes_plant_gate": gate_session is not None,
        "runs": runs,
        "mean_ms": round(float(arr.mean()), 2),
        "p50_ms": round(float(np.percentile(arr, 50)), 2),
        "p95_ms": round(float(np.percentile(arr, 95)), 2),
        "p99_ms": round(float(np.percentile(arr, 99)), 2),
        "target_under_300ms": bool(np.percentile(arr, 95) < 300.0),
        "parity": parity,
    }

    ensure_dir(Path(report_out).parent)
    save_json(summary, report_out)

    print("\n==================== ONNX CPU Benchmark ====================")
    print(f"Model   : {summary['backbone']} ({onnx_path})")
    print(
        f"Latency : mean={summary['mean_ms']} ms | p50={summary['p50_ms']} ms | "
        f"p95={summary['p95_ms']} ms | Target (<300 ms): {summary['target_under_300ms']}"
    )
    if parity:
        print(f"Parity  : max_abs_diff={parity['logits_max_abs_diff']} | cos_sim={parity['logits_cosine_sim']}")
    return summary


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Benchmark ONNX CPU inference latency.")
    parser.add_argument("--onnx", default="artifacts/model.onnx")
    parser.add_argument("--meta", default="artifacts/model_meta.json")
    parser.add_argument("--checkpoint", default="artifacts/best_model.pt")
    parser.add_argument("--plant-gate", default="artifacts/plant_gate.onnx")
    parser.add_argument("--warmup", type=int, default=10)
    parser.add_argument("--runs", type=int, default=80)
    parser.add_argument("--threads", type=int, default=4)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    benchmark_onnx_cpu(
        onnx_path=args.onnx,
        meta_path=args.meta,
        checkpoint_path=args.checkpoint,
        plant_gate_path=args.plant_gate,
        warmup=args.warmup,
        runs=args.runs,
        num_threads=args.threads,
    )


if __name__ == "__main__":
    main()

