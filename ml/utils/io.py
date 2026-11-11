"""Configuration, JSON, and label-map I/O helpers."""

from __future__ import annotations

import copy
import json
from pathlib import Path
from typing import Any

import yaml


def ensure_dir(path: str | Path) -> Path:
    """Create directory (and parents) if it does not exist and return Path."""
    p = Path(path)
    p.mkdir(parents=True, exist_ok=True)
    return p


def load_yaml(path: str | Path) -> dict[str, Any]:
    """Load a YAML file into a dictionary."""
    with Path(path).open("r", encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}
    if not isinstance(data, dict):
        raise ValueError(f"Expected dict at root of YAML file: {path}")
    return data


def deep_merge(base: dict[str, Any], override: dict[str, Any]) -> dict[str, Any]:
    """Recursively merge `override` dictionary into a copy of `base`."""
    result = copy.deepcopy(base)
    for key, value in override.items():
        if isinstance(value, dict) and isinstance(result.get(key), dict):
            result[key] = deep_merge(result[key], value)
        else:
            result[key] = copy.deepcopy(value)
    return result


def load_config(
    config_path: str | Path,
    base_path: str | Path | None = "configs/base.yaml",
) -> dict[str, Any]:
    """Load an experiment or dataset config merged over `base.yaml`."""
    override_cfg = load_yaml(config_path)
    if base_path is not None and Path(base_path).exists():
        base_cfg = load_yaml(base_path)
        if Path(config_path).resolve() == Path(base_path).resolve():
            return base_cfg
        return deep_merge(base_cfg, override_cfg)
    return override_cfg


def save_json(data: Any, path: str | Path, indent: int = 2) -> Path:
    """Serialize data as UTF-8 JSON with parent directory creation."""
    out_path = Path(path)
    ensure_dir(out_path.parent)
    with out_path.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=indent, ensure_ascii=False)
    return out_path


def load_json(path: str | Path) -> Any:
    """Load JSON file from disk."""
    with Path(path).open("r", encoding="utf-8") as f:
        return json.load(f)


def save_label_map(classes: list[str], path: str | Path) -> dict[str, Any]:
    """Persist canonical class ordering and bidirectional mappings."""
    ordered = sorted(set(classes))
    payload = {
        "num_classes": len(ordered),
        "classes": ordered,
        "class_to_idx": {cls_name: idx for idx, cls_name in enumerate(ordered)},
        "idx_to_class": {str(idx): cls_name for idx, cls_name in enumerate(ordered)},
    }
    save_json(payload, path)
    return payload


def load_label_map(path: str | Path) -> tuple[dict[int, str], dict[str, int], list[str]]:
    """Load label map into `(idx_to_class, class_to_idx, ordered_classes)`."""
    data = load_json(path)
    classes: list[str] = list(data["classes"])
    class_to_idx: dict[str, int] = {str(k): int(v) for k, v in data["class_to_idx"].items()}
    idx_to_class: dict[int, str] = {int(k): str(v) for k, v in data["idx_to_class"].items()}
    return idx_to_class, class_to_idx, classes

