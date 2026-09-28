#!/usr/bin/env python3
"""Generate a second, character-free Postcard Club print treatment."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFont, PngImagePlugin


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "assets" / "frames" / "frame-overlay-manifest.json"
FONT_BOLD = Path("C:/Windows/Fonts/seguisb.ttf")
FONT_REGULAR = Path("C:/Windows/Fonts/segoeui.ttf")
PROFILE = "polara-proof-edge-v2"


def font(path: Path, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(path), size=size)


def clear_windows(image: Image.Image, windows: list[dict[str, int]]) -> None:
    mask = Image.new("L", image.size, 0)
    draw = ImageDraw.Draw(mask)
    for window in windows:
        x, y = window["x"], window["y"]
        w, h, radius = window["width"], window["height"], window["radius"]
        draw.rounded_rectangle((x, y, x + w - 1, y + h - 1), radius=radius, fill=255)
    image.putalpha(ImageChops.subtract(image.getchannel("A"), mask))
    image.putdata([
        (0, 0, 0, 0) if alpha == 0 else (red, green, blue, alpha)
        for red, green, blue, alpha in image.getdata()
    ])


def save(image: Image.Image, path: Path, prompt: str) -> bytes:
    info = PngImagePlugin.PngInfo()
    info.add_text("impeccable:prompt", prompt)
    info.add_text("polara:quality-profile", PROFILE)
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, format="PNG", optimize=True, compress_level=9, pnginfo=info)
    return path.read_bytes()


def make_variant(mode: str) -> tuple[Image.Image, list[dict[str, int]]]:
    width, height = ((1080, 1350) if mode == "single" else (720, 1800))
    paper = "#f7f2e9"
    navy = "#21324a"
    coral = "#d88968"
    cream = "#fffaf2"
    image = Image.new("RGBA", (width, height), paper)
    draw = ImageDraw.Draw(image)
    draw.rectangle((0, 0, width, height), fill=paper)

    # A quiet paper grid keeps the new treatment related to Postcard Club.
    for x in range(28, width - 28, 36 if mode == "single" else 24):
        draw.line((x, 36, x, height - 36), fill=(33, 50, 74, 18), width=1)
    for y in range(36, height - 36, 36 if mode == "single" else 24):
        draw.line((28, y, width - 28, y), fill=(33, 50, 74, 18), width=1)

    inset = 34 if mode == "single" else 26
    draw.rounded_rectangle((inset, inset, width - inset, height - inset), radius=30, fill=cream, outline=navy, width=5)
    draw.line((inset + 32, 148 if mode == "single" else 118, width - inset - 32, 148 if mode == "single" else 118), fill=coral, width=4)
    title_size = 52 if mode == "single" else 36
    small_size = 16 if mode == "single" else 12
    draw.text((width // 2, 82 if mode == "single" else 66), "POSTCARD CLUB", anchor="mm", fill=navy, font=font(FONT_BOLD, title_size))
    draw.text((width // 2, 116 if mode == "single" else 94), "INK EDITION · POLARA MEMORY SERVICE", anchor="mm", fill=coral, font=font(FONT_REGULAR, small_size))

    if mode == "single":
        windows = [{"x": 170, "y": 210, "width": 740, "height": 870, "radius": 26}]
        footer_y = 1180
        draw.text((84, footer_y), "POST / 01", fill=navy, font=font(FONT_BOLD, 20))
        draw.text((width - 84, footer_y), "KEEP THE FRAME", anchor="ra", fill=coral, font=font(FONT_BOLD, 20))
        draw.text((width // 2, 1240), "A SMALL PRINT FOR A BIG DAY", anchor="mm", fill=navy, font=font(FONT_REGULAR, 20))
    else:
        windows = [
            {"x": 76, "y": 174, "width": 568, "height": 394, "radius": 22},
            {"x": 76, "y": 606, "width": 568, "height": 394, "radius": 22},
            {"x": 76, "y": 1038, "width": 568, "height": 394, "radius": 22},
        ]
        for index, window in enumerate(windows, 1):
            draw.text((42, window["y"] + 28), f"0{index}", fill=coral, font=font(FONT_BOLD, 15))
        draw.text((width // 2, 1548), "POSTCARD CLUB / STRIP THREE", anchor="mm", fill=navy, font=font(FONT_BOLD, 25))
        draw.text((width // 2, 1588), "three notes from the same afternoon", anchor="mm", fill=coral, font=font(FONT_REGULAR, 16))

    for index, window in enumerate(windows):
        x, y, w, h, radius = window["x"], window["y"], window["width"], window["height"], window["radius"]
        draw.rounded_rectangle((x - 9, y - 9, x + w + 9, y + h + 9), radius=radius + 9, fill=coral if index % 2 == 0 else navy)
        draw.rounded_rectangle((x, y, x + w - 1, y + h - 1), radius=radius, fill=(0, 0, 0, 0))

    # Proof marks stay outside every photo window and remain export-safe.
    for x, y, color in ((54, 54, coral), (width - 54, 54, navy), (54, height - 54, navy), (width - 54, height - 54, coral)):
        draw.line((x - 14, y, x + 14, y), fill=color, width=3)
        draw.line((x, y - 14, x, y + 14), fill=color, width=3)

    clear_windows(image, windows)
    return image, windows


def main() -> None:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    manifest["frames"] = [
        frame for frame in manifest["frames"]
        if frame["id"] not in {"postcard-club-ink.single", "postcard-club-ink.strip"}
    ]
    generated = []
    for mode in ("single", "strip"):
        image, windows = make_variant(mode)
        suffix = mode
        relative = f"assets/frames/postcard-club-ink-{suffix}-overlay.png"
        payload = save(image, ROOT / relative, f"Polara Postcard Club Ink {mode} overlay; character-free; canonical geometry.")
        generated.append({
            "id": f"postcard-club-ink.{suffix}",
            "family": "postcard-club",
            "name": "Postcard Club Ink",
            "category": "editorial-postcard",
            "mode": mode,
            "renderMode": "png-overlay",
            "characterPolicy": "character-free",
            "maskType": "rounded-rectangles",
            "photoWindows": windows,
            "overlaySrc": relative,
            "thumbnailSrc": f"assets/frames/thumbnails/postcard-club-ink-{suffix}-thumbnail.png",
            "pickerThumbnailSrc": f"assets/frames/composites/postcard-club-ink-{suffix}-thumbnail.png",
            "canvasWidth": 1080 if mode == "single" else 720,
            "canvasHeight": 1350 if mode == "single" else 1800,
            "sha256": hashlib.sha256(payload).hexdigest(),
            "byteSize": len(payload),
            "colorMode": "RGBA",
            "hasAlpha": True,
            "assetVersion": "frame-overlay-v5",
            "slotBackground": "#f7f2e9",
            "supportsDynamicText": False,
            "metadataZones": {"caption": None, "date": None, "brand": None},
            "metadataAreaNote": "Ink edition copy is baked into the character-free overlay; geometry remains manifest-owned.",
            "decorativeElements": ["paper grid", "ink registration marks", "coral and navy print blocks", "character-free postcard proof"],
            "qualityProfile": PROFILE,
            "edgePalette": ["#d88968", "#1f2f4f", "#f7f2e9"],
        })
    manifest["frames"].extend(generated)
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"[postcard-ink] generated {len(generated)} overlays")


if __name__ == "__main__":
    main()
