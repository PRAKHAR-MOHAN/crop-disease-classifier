"""Deterministic random seed utilities for reproducible PyTorch training."""

from __future__ import annotations

import os
import random

import numpy as np
import torch


def seed_everything(seed: int = 42, deterministic: bool = False) -> None:
    """Seed Python, NumPy, and PyTorch RNGs for reproducible runs.

    Args:
        seed: Integer random seed.
        deterministic: If True, forces deterministic cuDNN kernels (slightly slower).
    """
    os.environ["PYTHONHASHSEED"] = str(seed)
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)

    if deterministic:
        torch.backends.cudnn.deterministic = True
        torch.backends.cudnn.benchmark = False
    else:
        torch.backends.cudnn.deterministic = False
        torch.backends.cudnn.benchmark = True


def seed_worker(worker_id: int) -> None:
    """DataLoader worker initialization function to ensure per-worker determinism."""
    worker_seed = torch.initial_seed() % (2**32)
    np.random.seed(worker_seed)
    random.seed(worker_seed)


def make_generator(seed: int = 42) -> torch.Generator:
    """Create a seeded PyTorch CPU RNG generator for DataLoaders and samplers."""
    generator = torch.Generator()
    generator.manual_seed(seed)
    return generator


def get_default_device() -> torch.device:
    """Select the best available device, safely handling uncompiled CUDA architectures."""
    forced = os.getenv("DEVICE")
    if forced:
        return torch.device(forced)

    if torch.cuda.is_available():
        try:
            major, minor = torch.cuda.get_device_capability()
            # sm_90 or lower is supported by cu118; newer sm_120 (Blackwell) requires cu128+
            if major <= 9:
                return torch.device("cuda")
        except Exception:
            pass

    return torch.device("cpu")


