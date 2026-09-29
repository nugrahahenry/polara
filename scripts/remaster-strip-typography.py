#!/usr/bin/env python3
"""Unify the shared proof label on Polara Strip overlays.

Family artwork keeps its own display voice. Only the cross-family proof label
is remastered so every Strip shares one quiet, readable utility treatment.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

from PIL import Image, ImageColor, ImageDraw, ImageFont, PngImagePlugin


ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "assets" / "frames" / "frame-overlay-manifest.json"
FONT_PATH = Path("C:/Windows/Fonts/seguisb.ttf")
PROFILE = "polara-proof-edge-v3"
VERSION = "frame-overlay-v7"


def project_path(relative_path: str) -> Path:
    path = (ROOT / relative_path).resolve()
    path.relative_to(ROOT)
    return path


def rgba(hex_color: str, alpha: int = 255) -> tuple[int, int, int, int]:
    return (*ImageColor.getrgb(hex_color), alpha)


def footer_label_zone(
    image: Image.Image,
    width: int,
    height: int,
    unit: int,
    inset: int,
    left: int,
    right: int,
) -> None:
    """Replace the old label area with a nearby texture sample.

    A flat fill would leave a visible patch on gingham, paper grain, and dark
    film stock. Sampling the immediately preceding strip keeps each family
    intact while removing the old handwritten glyphs.
    """

    top = height - inset - unit * 10
    bottom = height - inset + 1
    sample_height = bottom - top
    sample_top = max(0, top - sample_height)
    patch = image.crop((left, sample_top, right, top))
    image.paste(patch, (left, top))


def draw_edge_signature(image: Image.Image, palette: tuple[str, str, str], frame_id: str) -> None:
    draw = ImageDraw.Draw(image)
    width, height = image.size
    unit = max(2, round(min(width, height) / 360))
    inset = unit * 5
    arm = unit * 14
    primary, secondary, tertiary = palette

    left = inset
    right = min(width - inset, round(width * 0.46))
    footer_label_zone(image, width, height, unit, inset, left, right)
    label_x = inset * 4 + arm
    if frame_id == "polara-daily-strip":
        # The editorial footer already owns the barcode and archive notes on
        # the left. Use its quiet lower-right margin instead.
        footer_label_zone(image, width, height, unit, inset, 480, 666)
        label_x = 500
    draw = ImageDraw.Draw(image)

    border = rgba(primary, 178)
    draw.rectangle((inset, inset, width - inset - 1, height - inset - 1), outline=border, width=unit)

    for color, x, y, dx, dy in (
        (rgba(primary), inset, inset, 1, 1),
        (rgba(secondary), width - inset - 1, inset, -1, 1),
        (rgba(tertiary), inset, height - inset - 1, 1, -1),
        (rgba(primary), width - inset - 1, height - inset - 1, -1, -1),
    ):
        draw.line((x, y, x + dx * arm, y), fill=color, width=unit)
        draw.line((x, y, x, y + dy * arm), fill=color, width=unit)

    swatch = unit * 4
    gap = unit * 2
    start_x = width - inset - (swatch * 3 + gap * 2)
    start_y = height - inset - swatch
    for index, color in enumerate(palette):
        x = start_x + index * (swatch + gap)
        draw.rounded_rectangle((x, start_y, x + swatch, start_y + swatch), radius=unit, fill=rgba(color))

    if FONT_PATH.is_file():
        label_font = ImageFont.truetype(str(FONT_PATH), size=max(11, unit * 6))
        label = "POLARA / PROOF  |  STRIP 3"
        draw.text(
            (label_x, height - inset - 1),
            label,
            font=label_font,
            anchor="ls",
            fill=rgba(primary, 232),
        )


def sanitize(image: Image.Image) -> Image.Image:
    output = image.convert("RGBA")
    output.putdata([
        (0, 0, 0, 0) if alpha == 0 else (red, green, blue, alpha)
        for red, green, blue, alpha in output.get_flattened_data()
    ])
    return output


def save_png(image: Image.Image, path: Path, source_info: dict[str, object]) -> bytes:
    metadata = PngImagePlugin.PngInfo()
    for key, value in source_info.items():
        if key != "polara:quality-profile" and isinstance(value, str):
            metadata.add_text(key, value)
    metadata.add_text("polara:quality-profile", PROFILE)
    sanitized = sanitize(image)
    sanitized.save(path, format="PNG", optimize=True, compress_level=9, pnginfo=metadata)
    return path.read_bytes()


def main() -> None:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    strips = [frame for frame in manifest["frames"] if frame.get("mode") == "strip"]
    if len(strips) != 12:
        raise RuntimeError(f"Expected 12 Strip variants, found {len(strips)}.")

    for frame in strips:
        palette = tuple(frame["edgePalette"])
        overlay_path = project_path(frame["overlaySrc"])
        with Image.open(overlay_path) as source:
            image = source.convert("RGBA")
            source_info = dict(source.info)
        draw_edge_signature(image, palette, frame["id"])
        payload = save_png(image, overlay_path, source_info)
        frame["sha256"] = hashlib.sha256(payload).hexdigest()
        frame["byteSize"] = len(payload)
        frame["assetVersion"] = VERSION
        frame["qualityProfile"] = PROFILE

    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"[strip-typography] applied {PROFILE} to {len(strips)} Strip overlays")


if __name__ == "__main__":
    main()
