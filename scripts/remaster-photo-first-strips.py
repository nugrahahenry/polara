#!/usr/bin/env python3
"""Remaster the two airy Strip overlays with wider photo-first windows."""

from __future__ import annotations

import hashlib
import json
from copy import deepcopy
from pathlib import Path

from PIL import Image, ImageChops, ImageColor, ImageDraw, PngImagePlugin


ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "assets" / "frames" / "frame-overlay-manifest.json"
TARGETS = {
    "vintage-film-lofi.strip": {
        "outline": "#f7eee5",
        "shadow": "#342824",
        "radius": 34,
        "outer_width": 12,
        "inner_width": 5,
    },
    "postcard-club.strip": {
        "outline": "#d88968",
        "shadow": "#f4d7bc",
        "radius": 28,
        "outer_width": 12,
        "inner_width": 5,
    },
}


def project_path(relative_path: str) -> Path:
    path = (ROOT / relative_path).resolve()
    path.relative_to(ROOT)
    return path


def rgba(hex_color: str, alpha: int = 255) -> tuple[int, int, int, int]:
    return (*ImageColor.getrgb(hex_color), alpha)


def clear_photo_windows(image: Image.Image, frame: dict[str, object]) -> None:
    mask = Image.new("L", image.size, 0)
    draw = ImageDraw.Draw(mask)
    for window in frame["photoWindows"]:
        x = int(window["x"])
        y = int(window["y"])
        width = int(window["width"])
        height = int(window["height"])
        radius = int(window.get("radius", 0))
        box = (x, y, x + width - 1, y + height - 1)
        if radius:
            draw.rounded_rectangle(box, radius=radius, fill=255)
        else:
            draw.rectangle(box, fill=255)
    image.putalpha(ImageChops.subtract(image.getchannel("A"), mask))


def redraw_photo_window_frames(image: Image.Image, frame: dict[str, object], style: dict[str, object]) -> None:
    draw = ImageDraw.Draw(image)
    radius = int(style["radius"])
    outer_width = int(style["outer_width"])
    inner_width = int(style["inner_width"])
    border_margin = 13
    for window in frame["photoWindows"]:
        x = int(window["x"])
        y = int(window["y"])
        width = int(window["width"])
        height = int(window["height"])
        # Keep every painted border outside the manifest window. The overlay
        # verifier treats the photo window as a fully transparent mask.
        box = (
            x - border_margin,
            y - border_margin,
            x + width - 1 + border_margin,
            y + height - 1 + border_margin,
        )
        if frame["id"] == "postcard-club.strip":
            draw.rounded_rectangle(box, radius=radius + border_margin, outline=rgba(str(style["shadow"])), width=outer_width)
            draw.rounded_rectangle(box, radius=radius + border_margin, outline=rgba(str(style["outline"])), width=inner_width)
        else:
            draw.rounded_rectangle(box, radius=radius + border_margin, outline=rgba(str(style["shadow"])), width=outer_width)
            draw.rounded_rectangle(box, radius=radius + border_margin, outline=rgba(str(style["outline"])), width=inner_width)


def save_png(image: Image.Image, path: Path, source_info: dict[str, object]) -> bytes:
    metadata = PngImagePlugin.PngInfo()
    for key, value in source_info.items():
        if key != "polara:quality-profile" and isinstance(value, str):
            metadata.add_text(key, value)
    metadata.add_text("polara:quality-profile", "polara-proof-edge-v2")
    image.save(path, format="PNG", optimize=True, compress_level=9, pnginfo=metadata)
    return path.read_bytes()


def scaled_frame(frame: dict[str, object], scale: int) -> dict[str, object]:
    result = deepcopy(frame)
    result["photoWindows"] = [
        {
            **window,
            "x": int(window["x"]) * scale,
            "y": int(window["y"]) * scale,
            "width": int(window["width"]) * scale,
            "height": int(window["height"]) * scale,
            **({"radius": int(window["radius"]) * scale} if "radius" in window else {}),
        }
        for window in frame["photoWindows"]
    ]
    result["id"] = frame["id"]
    return result


def scaled_style(style: dict[str, object], scale: int) -> dict[str, object]:
    return {
        **style,
        "radius": int(style["radius"]) * scale,
        "outer_width": int(style["outer_width"]) * scale,
        "inner_width": int(style["inner_width"]) * scale,
    }


def main() -> None:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    frames = {frame["id"]: frame for frame in manifest["frames"]}
    missing = sorted(set(TARGETS) - set(frames))
    if missing:
        raise RuntimeError(f"Target frame tidak ditemukan: {', '.join(missing)}")

    for frame_id, style in TARGETS.items():
        frame = frames[frame_id]
        overlay_path = project_path(frame["overlaySrc"])
        with Image.open(overlay_path) as source:
            image = source.convert("RGBA")
            source_info = dict(source.info)
        clear_photo_windows(image, frame)
        redraw_photo_window_frames(image, frame, style)
        # The drawing API centers strokes on the path. Clear the canonical
        # interior once more so no border pixel enters the photo mask.
        clear_photo_windows(image, frame)
        image.putdata([
            (0, 0, 0, 0) if alpha == 0 else (red, green, blue, alpha)
            for red, green, blue, alpha in image.get_flattened_data()
        ])
        payload = save_png(image, overlay_path, source_info)
        frame["sha256"] = hashlib.sha256(payload).hexdigest()
        frame["byteSize"] = len(payload)
        frame["assetVersion"] = "frame-overlay-v5"
        frame["qualityProfile"] = "polara-proof-edge-v2"

        master_src = frame.get("masterSrc")
        if master_src:
            master_path = project_path(master_src)
            master_frame = scaled_frame(frame, 2)
            with Image.open(master_path) as source:
                master_image = source.convert("RGBA")
                master_info = dict(source.info)
            clear_photo_windows(master_image, master_frame)
            redraw_photo_window_frames(master_image, master_frame, scaled_style(style, 2))
            clear_photo_windows(master_image, master_frame)
            master_image.putdata([
                (0, 0, 0, 0) if alpha == 0 else (red, green, blue, alpha)
                for red, green, blue, alpha in master_image.get_flattened_data()
            ])
            save_png(master_image, master_path, master_info)

    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"[photo-first-strip] remastered {len(TARGETS)} Strip overlays")


if __name__ == "__main__":
    main()
