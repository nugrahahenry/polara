#!/usr/bin/env python3
"""Verify Polara frame-overlay assets against the canonical manifest."""

from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path, PureWindowsPath
from typing import Any

from PIL import Image, ImageDraw, UnidentifiedImageError


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
    "polara-daily-single": (
        (1080, 1350),
        [{"x": 52, "y": 301, "width": 729, "height": 745}],
    ),
    "polara-daily-strip": (
        (720, 1800),
        [
            {"x": 35, "y": 241, "width": 483, "height": 428, "radius": 14},
            {"x": 35, "y": 681, "width": 483, "height": 387, "radius": 14},
            {"x": 35, "y": 1079, "width": 483, "height": 364, "radius": 14},
        ],
    ),
    "polara-midnight-club-single": (
        (1080, 1350),
        [{"x": 110, "y": 231, "width": 859, "height": 922}],
    ),
    "polara-midnight-club-strip": (
        (720, 1800),
        [
            {"x": 40, "y": 204, "width": 640, "height": 414, "radius": 14},
            {"x": 40, "y": 632, "width": 640, "height": 426, "radius": 14},
            {"x": 40, "y": 1074, "width": 640, "height": 412, "radius": 14},
        ],
    ),
}

EXPECTED_POLYGONS: dict[str, list[list[int]]] = {
    "polara-daily-single": [
        [80, 301], [747, 301], [781, 328], [781, 1046], [52, 1046], [52, 328]
    ],
    "polara-midnight-club-single": [
        [158, 231], [918, 231], [969, 282], [969, 1153], [110, 1153], [110, 282]
    ],
}

EXPECTED_CONTRACTS: dict[str, dict[str, Any]] = {
    "poca-purikura.single": {
        "family": "poca-purikura",
        "mode": "single",
        "maskType": "rectangles",
        "masterRequired": True,
    },
    "poca-purikura.strip": {
        "family": "poca-purikura",
        "mode": "strip",
        "maskType": "rectangles",
        "masterRequired": True,
    },
    "vintage-film-lofi.single": {
        "family": "vintage-film-lofi",
        "mode": "single",
        "maskType": "rectangles",
        "masterRequired": True,
    },
    "vintage-film-lofi.strip": {
        "family": "vintage-film-lofi",
        "mode": "strip",
        "maskType": "rectangles",
        "masterRequired": True,
    },
    "seoul-snap-y2k.single": {
        "family": "seoul-snap-y2k",
        "mode": "single",
        "maskType": "rectangles",
        "masterRequired": True,
    },
    "seoul-snap-y2k.strip": {
        "family": "seoul-snap-y2k",
        "mode": "strip",
        "maskType": "rectangles",
        "masterRequired": True,
    },
    "polara-daily-single": {
        "family": "polara-daily",
        "mode": "single",
        "maskType": "polygon",
        "masterRequired": False,
        "transparency": {
            "minimumTransparent": 0.971,
            "maximumPartial": 0.029,
            "maximumOpaque": 0.0,
        },
    },
    "polara-daily-strip": {
        "family": "polara-daily",
        "mode": "strip",
        "maskType": "rounded-rectangles",
        "masterRequired": False,
    },
    "polara-midnight-club-single": {
        "family": "polara-midnight-club",
        "mode": "single",
        "maskType": "polygon",
        "masterRequired": False,
        "transparency": {
            "minimumTransparent": 0.953,
            "maximumPartial": 0.046,
            "maximumOpaque": 0.0006,
        },
    },
    "polara-midnight-club-strip": {
        "family": "polara-midnight-club",
        "mode": "strip",
        "maskType": "rounded-rectangles",
        "masterRequired": False,
    },
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
    require(
        isinstance(raw_path, str) and raw_path.strip() != "",
        "Path aset manifest harus string non-kosong.",
    )
    path_value = Path(raw_path)
    require(
        not path_value.is_absolute()
        and not PureWindowsPath(raw_path).is_absolute()
        and not raw_path.startswith(("\\\\", "//")),
        f"Path aset harus relatif terhadap root pack: {raw_path}",
    )
    candidate = (root / raw_path).resolve()
    try:
        candidate.relative_to(root)
    except ValueError as error:
        raise VerificationError(
            f"Path aset keluar dari root pack: {raw_path}"
        ) from error
    return candidate


def verify_png_asset(
    path: Path,
    expected_size: tuple[int, int],
    expected_modes: set[str],
    label: str,
) -> None:
    require(path.is_file(), f"{label} tidak ditemukan: {path}")
    try:
        with Image.open(path) as image:
            require(image.format == "PNG", f"{label} {path.name} harus PNG.")
            require(
                image.mode in expected_modes,
                f"{label} {path.name} memakai mode {image.mode}; "
                f"seharusnya {sorted(expected_modes)}.",
            )
            require(
                image.size == expected_size,
                f"{label} {path.name} berukuran {image.size}; "
                f"seharusnya {expected_size}.",
            )
            image.load()
    except (OSError, UnidentifiedImageError) as error:
        raise VerificationError(
            f"{label} {path.name} tidak dapat didecode."
        ) from error


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
    require(
        data.get("version") == "frame-overlay-v1",
        "Versi manifest harus frame-overlay-v1.",
    )
    require(
        isinstance(data.get("frames"), list),
        "Manifest harus memiliki array frames.",
    )
    return data


def verify_image(
    path: Path,
    expected_size: tuple[int, int],
    windows: list[dict[str, int]],
    polygon: list[list[int]] | None = None,
    transparency: dict[str, float] | None = None,
) -> None:
    require(path.is_file(), f"File tidak ditemukan: {path}")
    try:
        image_context = Image.open(path)
    except (OSError, UnidentifiedImageError) as error:
        raise VerificationError(f"{path.name} tidak dapat didecode.") from error

    with image_context as image:
        require(
            image.format == "PNG",
            f"{path.name} harus PNG, ditemukan {image.format}.",
        )
        require(
            image.mode == "RGBA",
            f"{path.name} harus RGBA, ditemukan {image.mode}.",
        )
        require(
            image.size == expected_size,
            f"{path.name} berukuran {image.size}, seharusnya {expected_size}.",
        )
        try:
            image.load()
        except OSError as error:
            raise VerificationError(
                f"{path.name} tidak dapat didecode penuh."
            ) from error
        alpha = image.getchannel("A")
        mask = Image.new("L", image.size, 0)
        draw = ImageDraw.Draw(mask)
        if polygon:
            draw.polygon([tuple(point) for point in polygon], fill=255)
        for index, window in enumerate(windows, start=1):
            x = window["x"]
            y = window["y"]
            width = window["width"]
            height = window["height"]
            require(
                x >= 0 and y >= 0 and width > 0 and height > 0,
                f"Window {index} {path.name} invalid.",
            )
            require(
                x + width <= image.width and y + height <= image.height,
                f"Window {index} {path.name} keluar canvas.",
            )
            if not polygon:
                radius = window.get("radius", 0)
                draw.rounded_rectangle(
                    (x, y, x + width - 1, y + height - 1),
                    radius=radius,
                    fill=255,
                )
        histogram = alpha.histogram(mask)
        masked_pixels = sum(histogram)
        transparent_ratio = histogram[0] / masked_pixels if masked_pixels else 0
        partial_ratio = (
            sum(histogram[1:255]) / masked_pixels if masked_pixels else 0
        )
        opaque_ratio = histogram[255] / masked_pixels if masked_pixels else 0
        policy = transparency or {
            "minimumTransparent": 1.0,
            "maximumPartial": 0.0,
            "maximumOpaque": 0.0,
        }
        require(
            transparent_ratio >= policy["minimumTransparent"],
            f"Mask foto {path.name} hanya {transparent_ratio:.2%} transparan; "
            f"minimum {policy['minimumTransparent']:.2%}.",
        )
        require(
            partial_ratio <= policy["maximumPartial"],
            f"Mask foto {path.name} memiliki alpha parsial "
            f"{partial_ratio:.2%}; maksimum {policy['maximumPartial']:.2%}.",
        )
        require(
            opaque_ratio <= policy["maximumOpaque"],
            f"Mask foto {path.name} memiliki obstruction opaque "
            f"{opaque_ratio:.3%}; maksimum {policy['maximumOpaque']:.3%}.",
        )


def doubled_windows(windows: list[dict[str, int]]) -> list[dict[str, int]]:
    return [
        {key: value * 2 for key, value in window.items()}
        for window in windows
    ]


def verify_frame(root: Path, frame: dict[str, Any]) -> str:
    frame_id = frame.get("id")
    require(frame_id in EXPECTED_GEOMETRY, f"ID frame tidak dikenal: {frame_id!r}.")
    contract = EXPECTED_CONTRACTS[frame_id]
    expected_size, expected_windows = EXPECTED_GEOMETRY[frame_id]
    require(
        frame.get("mode") == contract["mode"],
        f"Mode {frame_id} berubah dari kontrak.",
    )
    require(
        frame.get("family") == contract["family"],
        f"Family {frame_id} berubah dari kontrak.",
    )
    require(
        frame.get("maskType", "rectangles") == contract["maskType"],
        f"Mask {frame_id} berubah dari kontrak.",
    )
    actual_size = (frame.get("canvasWidth"), frame.get("canvasHeight"))
    require(actual_size == expected_size, f"Canvas {frame_id} berubah: {actual_size}.")
    expected_polygon = EXPECTED_POLYGONS.get(frame_id)
    if expected_polygon:
        require(frame.get("maskType") == "polygon", f"Mask {frame_id} harus polygon.")
        require(
            frame.get("photoPolygon") == expected_polygon,
            f"Photo polygon {frame_id} berubah dari kontrak.",
        )
    else:
        require(
            frame.get("photoWindows") == expected_windows,
            f"Photo window {frame_id} berubah dari kontrak.",
        )
    require(
        frame.get("renderMode") == "png-overlay",
        f"renderMode {frame_id} bukan png-overlay.",
    )
    require(
        frame.get("characterPolicy") == "character-free",
        f"characterPolicy {frame_id} harus character-free.",
    )
    require(
        frame.get("mascotSrc") is None,
        f"mascotSrc {frame_id} dilarang; gunakan sticker exclusive atau mascot UI-only.",
    )
    require(frame.get("colorMode") == "RGBA", f"colorMode {frame_id} bukan RGBA.")
    require(frame.get("hasAlpha") is True, f"hasAlpha {frame_id} harus true.")
    expected_slots = 3 if contract["mode"] == "strip" else 1
    require(
        len(expected_windows) == expected_slots,
        f"Jumlah slot canonical {frame_id} invalid.",
    )

    overlay_path = resolve_asset_path(root, frame.get("overlaySrc"))
    thumbnail_path = resolve_asset_path(root, frame.get("thumbnailSrc"))
    verify_image(
        overlay_path,
        expected_size,
        expected_windows,
        expected_polygon,
        contract.get("transparency"),
    )

    master_src = frame.get("masterSrc")
    if contract["masterRequired"]:
        require(isinstance(master_src, str), f"masterSrc {frame_id} wajib tersedia.")
    else:
        require(
            master_src is None,
            f"masterSrc {frame_id} tidak boleh masuk runtime pack.",
        )
    if master_src:
        master_path = resolve_asset_path(root, master_src)
        doubled_polygon = (
            [[coordinate * 2 for coordinate in point] for point in expected_polygon]
            if expected_polygon
            else None
        )
        verify_image(
            master_path,
            (expected_size[0] * 2, expected_size[1] * 2),
            doubled_windows(expected_windows),
            doubled_polygon,
        )

    expected_thumbnail = (
        (240, 600) if contract["mode"] == "strip" else (360, 450)
    )
    verify_png_asset(thumbnail_path, expected_thumbnail, {"RGBA"}, "Thumbnail")
    picker_path = resolve_asset_path(root, frame.get("pickerThumbnailSrc"))
    require(
        "/composites/" in frame.get("pickerThumbnailSrc", "").replace("\\", "/"),
        f"pickerThumbnailSrc {frame_id} harus berada di composites.",
    )
    verify_png_asset(picker_path, expected_thumbnail, {"RGBA"}, "Picker composite")

    require(
        overlay_path.stat().st_size == frame.get("byteSize"),
        f"Byte size {frame_id} tidak cocok manifest.",
    )
    overlay_hash = sha256(overlay_path)
    require(
        overlay_hash == frame.get("sha256"),
        f"SHA-256 {frame_id} tidak cocok manifest.",
    )
    return overlay_hash


def verify(root: Path) -> None:
    root = root.resolve()
    manifest_path = resolve_manifest(root)
    manifest = load_manifest(manifest_path)
    frames = manifest["frames"]
    require(
        len(frames) == 10,
        f"Manifest harus berisi tepat 10 frame; ditemukan {len(frames)}.",
    )
    ids = [frame.get("id") for frame in frames]
    require(len(set(ids)) == len(ids), "Manifest memiliki ID duplikat.")
    require(
        set(ids) == set(EXPECTED_GEOMETRY),
        "Manifest tidak memuat tepat sepuluh ID Hero canonical.",
    )

    hashes = [verify_frame(root, frame) for frame in frames]
    require(len(set(hashes)) == 10, "Runtime overlay memiliki hash duplikat.")
    print("10/10 overlay passed")


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
