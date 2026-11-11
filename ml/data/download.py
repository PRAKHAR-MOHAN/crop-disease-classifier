"""Download public crop disease, pest, and OOD datasets.

Usage:
    python -m ml.data.download --datasets plantvillage plantdoc ood_non_plant
    python -m ml.data.download --all
"""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import tempfile
import zipfile
from pathlib import Path
from typing import Any

import requests
from dotenv import load_dotenv
from PIL import Image
from tqdm import tqdm

from ml.utils.io import ensure_dir, load_config


def _dir_has_files(path: Path) -> bool:
    return path.exists() and any(path.rglob("*.*"))


def _download_file(url: str, dest_file: Path) -> None:
    resp = requests.get(url, stream=True, timeout=60)
    resp.raise_for_status()
    total = int(resp.headers.get("content-length", 0))
    with dest_file.open("wb") as f, tqdm(
        total=total if total > 0 else None,
        unit="B",
        unit_scale=True,
        desc=f"Downloading {dest_file.name}",
    ) as pbar:
        for chunk in resp.iter_content(chunk_size=1024 * 256):
            if chunk:
                f.write(chunk)
                pbar.update(len(chunk))


def _download_git_or_zip(
    name: str,
    repo_url: str | None,
    archive_url: str | None,
    dest_dir: Path,
    force: bool = False,
) -> bool:
    if _dir_has_files(dest_dir) and not force:
        print(f"[download] '{name}' already exists at {dest_dir}; skipping.")
        return True

    if force and dest_dir.exists():
        shutil.rmtree(dest_dir)
    ensure_dir(dest_dir.parent)

    if repo_url and shutil.which("git"):
        print(f"[download] Cloning '{name}' from {repo_url}...")
        res = subprocess.run(
            ["git", "clone", "--depth", "1", repo_url, str(dest_dir)],
            capture_output=True,
            text=True,
        )
        if res.returncode == 0 and _dir_has_files(dest_dir):
            print(f"[download] Cloned '{name}' successfully.")
            return True
        print(f"[download] git clone failed ({res.stderr.strip()}); trying archive URL...")
        if dest_dir.exists():
            shutil.rmtree(dest_dir, ignore_errors=True)

    if archive_url:
        with tempfile.TemporaryDirectory() as tmp:
            tmp_zip = Path(tmp) / f"{name}.zip"
            print(f"[download] Downloading '{name}' archive from {archive_url}...")
            _download_file(archive_url, tmp_zip)
            extract_dir = Path(tmp) / "extracted"
            with zipfile.ZipFile(tmp_zip, "r") as zf:
                zf.extractall(extract_dir)
            subdirs = [p for p in extract_dir.iterdir() if p.is_dir()]
            src_root = subdirs[0] if len(subdirs) == 1 else extract_dir
            shutil.move(str(src_root), str(dest_dir))
        print(f"[download] Extracted '{name}' to {dest_dir}.")
        return True

    return False


def _has_kaggle_credentials() -> bool:
    has_env = bool(os.getenv("KAGGLE_USERNAME") and os.getenv("KAGGLE_KEY"))
    kaggle_json = Path.home() / ".kaggle" / "kaggle.json"
    return has_env or kaggle_json.exists()


def _download_kaggle(
    name: str,
    dest_dir: Path,
    dataset_slug: str | None = None,
    competition_slug: str | None = None,
    force: bool = False,
) -> bool:
    if _dir_has_files(dest_dir) and not force:
        print(f"[download] '{name}' already exists at {dest_dir}; skipping.")
        return True

    if not _has_kaggle_credentials():
        slug = dataset_slug or competition_slug or "<dataset-slug>"
        print(
            f"[download] Skipping '{name}': Kaggle credentials not configured.\n"
            f"           Set KAGGLE_USERNAME & KAGGLE_KEY in .env (or ~/.kaggle/kaggle.json) "
            f"to download '{slug}', or place files manually in {dest_dir}."
        )
        return False

    if not shutil.which("kaggle"):
        print("[download] 'kaggle' CLI not found. Install via `pip install kaggle`.")
        return False

    ensure_dir(dest_dir)
    if dataset_slug:
        cmd = [
            "kaggle",
            "datasets",
            "download",
            "-d",
            dataset_slug,
            "-p",
            str(dest_dir),
            "--unzip",
        ]
    elif competition_slug:
        cmd = [
            "kaggle",
            "competitions",
            "download",
            "-c",
            competition_slug,
            "-p",
            str(dest_dir),
        ]
    else:
        return False

    print(f"[download] Running Kaggle download for '{name}'...")
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"[download] Kaggle download failed for '{name}': {res.stderr.strip()}")
        return False

    # Unzip competition archives if needed
    for zip_path in dest_dir.glob("*.zip"):
        with zipfile.ZipFile(zip_path, "r") as zf:
            zf.extractall(dest_dir)
        zip_path.unlink()

    print(f"[download] Downloaded '{name}' to {dest_dir}.")
    return True


def _download_ood_non_plant(
    dest_dir: Path,
    max_samples: int = 1500,
    seed: int = 42,
    force: bool = False,
) -> bool:
    """Download non-plant images from CIFAR-10 via torchvision for OOD calibration & plant gate."""
    if _dir_has_files(dest_dir) and not force:
        print(f"[download] 'ood_non_plant' already exists at {dest_dir}; skipping.")
        return True

    if force and dest_dir.exists():
        shutil.rmtree(dest_dir)
    ensure_dir(dest_dir)

    try:
        import numpy as np
        from torchvision.datasets import CIFAR10
    except Exception as exc:
        print(f"[download] torchvision unavailable for OOD dataset ({exc}); skipping.")
        return False

    cache_dir = dest_dir.parent / "_cifar10_cache"
    ds = CIFAR10(root=str(cache_dir), train=False, download=True)
    rng = np.random.default_rng(seed)
    indices = rng.choice(len(ds), size=min(max_samples, len(ds)), replace=False)

    for out_idx, ds_idx in enumerate(tqdm(indices, desc="Exporting OOD non-plant samples")):
        img, label_id = ds[int(ds_idx)]
        cls_name = ds.classes[label_id]
        # Upscale cleanly from 32x32 so downstream filters treat them consistently as RGB JPEGs
        img_resized = img.resize((96, 96), Image.Resampling.BICUBIC)
        cls_dir = ensure_dir(dest_dir / cls_name)
        img_resized.save(cls_dir / f"ood_{out_idx:05d}.jpg", quality=92)

    print(f"[download] Saved {len(indices)} non-plant OOD images to {dest_dir}.")
    return True


def download_datasets(
    dataset_names: list[str],
    cfg: dict[str, Any],
    force: bool = False,
) -> dict[str, bool]:
    """Download requested public datasets into `paths.raw_dir`."""
    raw_dir = ensure_dir(cfg["paths"]["raw_dir"])
    sources = cfg["sources"]
    seed = int(cfg.get("seed", 42))
    results: dict[str, bool] = {}

    for name in dataset_names:
        if name not in sources:
            print(f"[download] Unknown dataset '{name}'; skipping.")
            results[name] = False
            continue

        spec = sources[name]
        dest_dir = raw_dir / name

        if name in {"plantvillage", "plantdoc"}:
            ok = _download_git_or_zip(
                name=name,
                repo_url=spec.get("repo_url"),
                archive_url=spec.get("archive_url"),
                dest_dir=dest_dir,
                force=force,
            )
            if not ok and spec.get("kaggle_dataset"):
                ok = _download_kaggle(
                    name=name,
                    dest_dir=dest_dir,
                    dataset_slug=spec.get("kaggle_dataset"),
                    force=force,
                )
            results[name] = ok

        elif name in {"ip102", "rice", "cassava"}:
            results[name] = _download_kaggle(
                name=name,
                dest_dir=dest_dir,
                dataset_slug=spec.get("kaggle_dataset"),
                competition_slug=spec.get("kaggle_competition"),
                force=force,
            )

        elif name == "ood_non_plant":
            results[name] = _download_ood_non_plant(
                dest_dir=dest_dir,
                max_samples=int(spec.get("max_samples", 1500)),
                seed=seed,
                force=force,
            )
        else:
            results[name] = False

    return results


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Download public crop disease & pest datasets.")
    parser.add_argument("--config", default="configs/datasets.yaml", help="Datasets YAML path.")
    parser.add_argument("--base", default="configs/base.yaml", help="Base YAML path.")
    parser.add_argument(
        "--datasets",
        nargs="+",
        default=None,
        help="Datasets to download (e.g. plantvillage plantdoc ip102 ood_non_plant).",
    )
    parser.add_argument("--all", action="store_true", help="Download all sources in datasets.yaml.")
    parser.add_argument("--force", action="store_true", help="Re-download even if files exist.")
    return parser.parse_args()


def main() -> None:
    load_dotenv()
    args = parse_args()
    cfg = load_config(args.config, base_path=args.base)

    if args.all:
        targets = list(cfg["sources"].keys())
    elif args.datasets:
        targets = args.datasets
    else:
        targets = [k for k, v in cfg["sources"].items() if v.get("enabled", False)]

    print(f"[download] Target datasets: {targets}")
    outcomes = download_datasets(targets, cfg=cfg, force=args.force)
    print(f"[download] Summary: {outcomes}")


if __name__ == "__main__":
    main()

