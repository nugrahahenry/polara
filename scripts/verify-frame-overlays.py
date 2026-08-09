#!/usr/bin/env python3
"""Verify Polara frame-overlay assets against the canonical manifest."""

from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path
from typing import Any

from PIL import Image


EXPECTED_GEOMETRY: dict[str, tuple[tuple[int, int], list[dict[str, int]]]] = {
    "poca-purikura.single": (
        (1080, 1350),
        [{"x": 124, "y": 270, "width": 832, "height": 840}],
    ),
    "poca-purikura.strip": (
        (720, 1800),
        [
            {"x": 76, "y": 214, "width": 568, "height": 388},
            {"x": 76, "y": 640, "width": 568, "height": 388},
            {"x": 76, "y": 1066, "width": 568, "height": 388},
        ],
    ),
    "vintage-film-lofi.single": (
        (1080, 1350),
        [{"x": 96, "y": 174, "width": 888, "height": 960}],
    ),
    "vintage-film-lofi.strip": (
        (720, 1800),
        [
            {"x": 159, "y": 255, "width": 402, "height": 384},
            {"x": 159, "y": 702, "width": 402, "height": 384},
            {"x": 159, "y": 1149, "width": 402, "height": 384},
        ],
    ),
    "seoul-snap-y2k.single": (
        (1080, 1350),
        [{"x": 279, "y": 311, "width": 726, "height": 774}],
    ),
    "seoul-snap-y2k.strip": (
        (720, 1800),
        [
            {"x": 76, "y": 214, "width": 568, "height": 388},
            {"x": 76, "y": 640, "width": 568, "height": 388},
            {"x": 76, "y": 1066, "width": 568, "height": 388},
        ],
    ),
}


class VerificationError(RuntimeError):
    """Raised when an overlay package breaks the runtime contract."""


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def require(condition: bool, message: str) -> None:
    if not condition:
        raise VerificationError(message)

def resolve_asset_path(root: Path, raw_path: Any) -> Path:
    require(isinstance(raw_path, str) and raw_path.strip() != "", "Path aset manifest harus string non-kosong.")
    candidate = (root / raw_path).resolve()
    try:
        candidate.relative_to(root)
    except ValueError as error:
        raise VerificationError(f"Path aset keluar dari root pack: {raw_path}") from error
    return candidate



def resolve_manifest(root: Path) -> Path:
    candidates = (
        root / "frame-overlay-manifest.json",
        root / "assets" / "frames" / "frame-overlay-manifest.json",
    )
    for candidate in candidates:
        if candidate.is_file():
            return candidate
    raise VerificationError(
        "frame-overlay-manifest.json tidak ditemukan di root pack atau assets/frames."
    )


def load_manifest(path: Path) -> dict[str, Any]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise VerificationError(f"Manifest tidak dapat dibaca: {error}") from error
    require(isinstance(data, dict), "Manifest harus berupa object JSON.")
    require(data.get("version") == "frame-overlay-v1", "Versi manifest harus frame-overlay-v1.")
    require(isinstance(data.get("frames"), list), "Manifest harus memiliki array frames.")
    return data


def verify_image(
    path: Path,
    expected_size: tuple[int, int],
    windows: list[dict[str, int]],
) -> None:
    require(path.is_file(), f"File tidak ditemukan: {path}")
    with Image.open(path) as image:
        require(image.format == "PNG", f"{path.name} harus PNG, ditemukan {image.format}.")
        require(image.mode == "RGBA", f"{path.name} harus RGBA, ditemukan {image.mode}.")
        require(image.size == expected_size, f"{path.name} berukuran {image.size}, seharusnya {expected_size}.")
        alpha = image.getchannel("A")
        for index, window in enumerate(windows, start=1):
            x = window["x"]
            y = window["y"]
            width = window["width"]
            height = window["height"]
            require(x >= 0 and y >= 0 and width > 0 and height > 0, f"Window {index} {path.name} invalid.")
            require(x + width <= image.width and y + height <= image.height, f"Window {index} {path.name} keluar canvas.")
            extrema = alpha.crop((x, y, x + width, y + height)).getextrema()
            require(extrema == (0, 0), f"Window {index} {path.name} tidak alpha 0 penuh: {extrema}.")


def doubled_windows(windows: list[dict[str, int]]) -> list[dict[str, int]]:
    return [
        {key: value * 2 for key, value in window.items()}
        for window in windows
    ]


def verify_frame(root: Path, frame: dict[str, Any]) -> str:
    frame_id = frame.get("id")
    require(frame_id in EXPECTED_GEOMETRY, f"ID frame tidak dikenal: {frame_id!r}.")
    expected_size, expected_windows = EXPECTED_GEOMETRY[frame_id]
    actual_size = (frame.get("canvasWidth"), frame.get("canvasHeight"))
    require(actual_size == expected_size, f"Canvas {frame_id} berubah: {actual_size}.")
    require(frame.get("photoWindows") == expected_windows, f"Photo window {frame_id} berubah dari kontrak.")
    require(frame.get("renderMode") == "png-overlay", f"renderMode {frame_id} bukan png-overlay.")
    require(frame.get("colorMode") == "RGBA", f"colorMode {frame_id} bukan RGBA.")
    require(frame.get("hasAlpha") is True, f"hasAlpha {frame_id} harus true.")

    overlay_path = resolve_asset_path(root, frame.get("overlaySrc"))
    master_path = resolve_asset_path(root, frame.get("masterSrc"))
    thumbnail_path = resolve_asset_path(root, frame.get("thumbnailSrc"))
    verify_image(overlay_path, expected_size, expected_windows)
    verify_image(
        master_path,
        (expected_size[0] * 2, expected_size[1] * 2),
        doubled_windows(expected_windows),
    )

    expected_thumbnail = (240, 600) if frame.get("mode") == "strip" else (360, 450)
    require(thumbnail_path.is_file(), f"Thumbnail tidak ditemukan: {thumbnail_path}")
    with Image.open(thumbnail_path) as thumbnail:
        require(thumbnail.format == "PNG", f"{thumbnail_path.name} harus PNG.")
        require(thumbnail.size == expected_thumbnail, f"{thumbnail_path.name} berukuran {thumbnail.size}, seharusnya {expected_thumbnail}.")

    require(overlay_path.stat().st_size == frame.get("byteSize"), f"Byte size {frame_id} tidak cocok manifest.")
    overlay_hash = sha256(overlay_path)
    require(overlay_hash == frame.get("sha256"), f"SHA-256 {frame_id} tidak cocok manifest.")
    return overlay_hash


def verify(root: Path) -> None:
    root = root.resolve()
    manifest_path = resolve_manifest(root)
    manifest = load_manifest(manifest_path)
    frames = manifest["frames"]
    require(len(frames) == 6, f"Manifest harus berisi tepat 6 frame; ditemukan {len(frames)}.")
    ids = [frame.get("id") for frame in frames]
    require(len(set(ids)) == len(ids), "Manifest memiliki ID duplikat.")
    require(set(ids) == set(EXPECTED_GEOMETRY), "Manifest tidak memuat tepat enam ID Hero canonical.")

    hashes = [verify_frame(root, frame) for frame in frames]
    require(len(set(hashes)) == 6, "Runtime overlay memiliki hash duplikat.")
    print("6/6 overlay passed")


def main() -> int:
    root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.cwd()
    try:
        verify(root)
    except (KeyError, TypeError, VerificationError) as error:
        print(f"frame overlay verification failed: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
