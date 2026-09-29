#!/usr/bin/env python3
"""Give selected Strip families a type voice that matches their material.

This pass is intentionally narrow. It only replaces the baked title block on
the generated Ticket and Postcard editions. Photo windows, frame decoration,
and the shared proof label remain untouched.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

from PIL import Image, ImageColor, ImageDraw, ImageFont, PngImagePlugin


ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "assets" / "frames" / "frame-overlay-manifest.json"
FONT_UI = Path("C:/Windows/Fonts/segoeui.ttf")
FONT_UI_BOLD = Path("C:/Windows/Fonts/segoeuib.ttf")
FONT_TICKET = Path("C:/Windows/Fonts/bahnschrift.ttf")
FONT_EDITORIAL = Path("C:/Windows/Fonts/georgiab.ttf")
PROFILE = "polara-proof-edge-v3"
VERSION = "frame-overlay-v7"

TARGETS = {
    "lucky-ticket.strip": {
        "background": "#202f66",
        "ink": "#fffaf2",
        "accent": "#ffe26f",
        "title": "LUCKY TICKET",
        "subtitle": "ONE SESSION · ALL GOOD MOMENTS",
        "font": FONT_TICKET,
    },
    "postcard-club-ink.strip": {
        "background": "#fffaf2",
        "ink": "#21324a",
        "accent": "#d88968",
        "title": "POSTCARD CLUB",
        "subtitle": "INK EDITION · POLARA MEMORY SERVICE",
        "font": FONT_EDITORIAL,
    },
    "postcard-club-sage.strip": {
        "background": "#fbfaf2",
        "ink": "#243b36",
        "accent": "#799b83",
        "title": "POSTCARD CLUB",
        "subtitle": "SAGE EDITION · POLARA MEMORY SERVICE",
        "font": FONT_EDITORIAL,
    },
    "postcard-club-night.strip": {
        "background": "#f7f6f0",
        "ink": "#15263e",
        "accent": "#c18b49",
        "title": "POSTCARD CLUB",
        "subtitle": "NIGHT EDITION · POLARA MEMORY SERVICE",
        "font": FONT_EDITORIAL,
    },
}


def project_path(relative_path: str) -> Path:
    path = (ROOT / relative_path).resolve()
    path.relative_to(ROOT)
    return path


def font(path: Path, size: int) -> ImageFont.FreeTypeFont:
    if not path.is_file():
        raise RuntimeError(f"Missing required Windows font: {path}")
    return ImageFont.truetype(str(path), size=size)


def rgba(hex_color: str, alpha: int = 255) -> tuple[int, int, int, int]:
    return (*ImageColor.getrgb(hex_color), alpha)


def remaster_title(image: Image.Image, frame_id: str, spec: dict[str, object]) -> None:
    draw = ImageDraw.Draw(image)
    width, _ = image.size
    background = str(spec["background"])
    ink = str(spec["ink"])
    accent = str(spec["accent"])
    if frame_id == "lucky-ticket.strip":
        # Preserve the ticket rule lines while giving the title a condensed
        # utilitarian face that reads at picker size.
        draw.rectangle((132, 70, width - 132, 151), fill=background)
        draw.text((width // 2, 98), str(spec["title"]), anchor="mm", fill=ink, font=font(FONT_TICKET, 38))
        draw.text((width // 2, 135), str(spec["subtitle"]), anchor="mm", fill=accent, font=font(FONT_UI_BOLD, 11))
        return

    # Postcard keeps the same calm paper block, but replaces the script-like
    # display face with a readable editorial serif and a compact utility line.
    draw.rectangle((104, 42, width - 104, 112), fill=background)
    draw.text((width // 2, 66), str(spec["title"]), anchor="mm", fill=ink, font=font(spec["font"], 37))
    draw.text((width // 2, 94), str(spec["subtitle"]), anchor="mm", fill=accent, font=font(FONT_UI, 11))


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
    metadata.add_text("polara:typography-profile", "strip-title-roles-v1")
    sanitized = sanitize(image)
    sanitized.save(path, format="PNG", optimize=True, compress_level=9, pnginfo=metadata)
    return path.read_bytes()


def main() -> None:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    frames = {frame["id"]: frame for frame in manifest["frames"]}
    missing = sorted(set(TARGETS) - set(frames))
    if missing:
        raise RuntimeError(f"Target Strip tidak ditemukan: {', '.join(missing)}")

    for frame_id, spec in TARGETS.items():
        frame = frames[frame_id]
        overlay_path = project_path(frame["overlaySrc"])
        with Image.open(overlay_path) as source:
            image = source.convert("RGBA")
            source_info = dict(source.info)
        remaster_title(image, frame_id, spec)
        payload = save_png(image, overlay_path, source_info)
        frame["sha256"] = hashlib.sha256(payload).hexdigest()
        frame["byteSize"] = len(payload)
        frame["assetVersion"] = VERSION
        frame["qualityProfile"] = PROFILE

    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"[strip-titles] remastered {len(TARGETS)} family title blocks")


if __name__ == "__main__":
    main()
