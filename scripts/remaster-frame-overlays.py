#!/usr/bin/env python3
"""Apply Polara's deterministic proof-edge finish to every runtime frame."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

from PIL import Image, ImageDraw, PngImagePlugin


ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "assets" / "frames" / "frame-overlay-manifest.json"
PROFILE = "polara-proof-edge-v1"
PALETTES = {
    "poca-purikura": ("#ec5e9e", "#8fd3ff", "#ffe26f"),
    "vintage-film-lofi": ("#e3b67a", "#342824", "#f7eee5"),
    "seoul-snap-y2k": ("#ff8fbd", "#8fd3ff", "#cab8ff"),
    "polara-daily": ("#df6d57", "#40312a", "#f5e3c4"),
    "polara-midnight-club": ("#5f8cff", "#ff8fbd", "#d8e8ff"),
}


def project_path(relative_path: str) -> Path:
    path = (ROOT / relative_path).resolve()
    path.relative_to(ROOT)
    return path


def draw_edge_signature(image: Image.Image, palette: tuple[str, str, str]) -> None:
    draw = ImageDraw.Draw(image)
    width, height = image.size
    unit = max(2, round(min(width, height) / 360))
    inset = unit * 5
    arm = unit * 14
    primary, secondary, tertiary = palette

    # Four crop-safe registration corners unify the collection without entering photo windows.
    for color, x, y, dx, dy in (
        (primary, inset, inset, 1, 1),
        (secondary, width - inset - 1, inset, -1, 1),
        (tertiary, inset, height - inset - 1, 1, -1),
        (primary, width - inset - 1, height - inset - 1, -1, -1),
    ):
        draw.line((x, y, x + dx * arm, y), fill=color, width=unit)
        draw.line((x, y, x, y + dy * arm), fill=color, width=unit)

    # Three small proof swatches become the shared studio signature across all families.
    swatch = unit * 4
    gap = unit * 2
    start_x = width - inset - (swatch * 3 + gap * 2)
    start_y = height - inset - swatch
    for index, color in enumerate(palette):
        x = start_x + index * (swatch + gap)
        draw.rounded_rectangle((x, start_y, x + swatch, start_y + swatch), radius=unit, fill=color)


def save_png(image: Image.Image, path: Path, source_info: dict[str, object]) -> bytes:
    metadata = PngImagePlugin.PngInfo()
    for key, value in source_info.items():
        if key != "polara:quality-profile" and isinstance(value, str):
            metadata.add_text(key, value)
    metadata.add_text("polara:quality-profile", PROFILE)
    image.save(path, format="PNG", optimize=True, compress_level=9, pnginfo=metadata)
    return path.read_bytes()


def main() -> None:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    if len(manifest.get("frames", [])) != 10:
        raise RuntimeError("v0.25 remaster expects exactly ten existing runtime variants.")

    for frame in manifest["frames"]:
        palette = PALETTES[frame["family"]]
        overlay_path = project_path(frame["overlaySrc"])
        with Image.open(overlay_path) as source:
            image = source.convert("RGBA")
            source_info = dict(source.info)
        draw_edge_signature(image, palette)
        image.putdata([
            (0, 0, 0, 0) if alpha == 0 else (red, green, blue, alpha)
            for red, green, blue, alpha in image.get_flattened_data()
        ])
        payload = save_png(image, overlay_path, source_info)
        frame["sha256"] = hashlib.sha256(payload).hexdigest()
        frame["byteSize"] = len(payload)
        frame["assetVersion"] = "frame-overlay-v5"
        frame["qualityProfile"] = PROFILE
        frame["edgePalette"] = list(palette)

    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"[frame-remaster] applied {PROFILE} to {len(manifest['frames'])} variants")


if __name__ == "__main__":
    main()
