#!/usr/bin/env python3
"""Generate deterministic frame-only fallbacks and fictional picker composites."""

from __future__ import annotations

import argparse
import io
import json
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageOps, PngImagePlugin


ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "assets" / "frames" / "frame-overlay-manifest.json"
POLICY_PATH = ROOT / "assets" / "asset-quality-policy.json"


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def resolve_project_path(raw_path: str) -> Path:
    candidate = (ROOT / raw_path).resolve()
    candidate.relative_to(ROOT)
    return candidate


def png_bytes(image: Image.Image, prompt: str) -> bytes:
    metadata = PngImagePlugin.PngInfo()
    metadata.add_text("impeccable:prompt", prompt)
    output = io.BytesIO()
    image.save(output, format="PNG", optimize=True, compress_level=9, pnginfo=metadata)
    return output.getvalue()


def fit_cover(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    return ImageOps.fit(image, size, method=Image.Resampling.LANCZOS, centering=(0.5, 0.48))


def clear_hidden_rgb(image: Image.Image) -> Image.Image:
    cleaned = image.copy().convert("RGBA")
    cleaned.putdata([
        (0, 0, 0, 0) if alpha == 0 else (red, green, blue, alpha)
        for red, green, blue, alpha in cleaned.get_flattened_data()
    ])
    return cleaned


def photo_panels(fixture: Image.Image) -> list[Image.Image]:
    if fixture.height % 3 != 0:
        raise ValueError("Picker fixture height must be divisible into three equal panels.")
    panel_height = fixture.height // 3
    return [fixture.crop((0, index * panel_height, fixture.width, (index + 1) * panel_height)) for index in range(3)]


def paste_window(canvas: Image.Image, photo: Image.Image, window: dict[str, int]) -> None:
    size = (window["width"], window["height"])
    fitted = fit_cover(photo, size)
    mask = Image.new("L", size, 255)
    radius = int(window.get("radius", 0))
    if radius:
        mask = Image.new("L", size, 0)
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, size[0] - 1, size[1] - 1), radius=radius, fill=255)
    canvas.paste(fitted, (window["x"], window["y"]), mask)


def paste_polygon(canvas: Image.Image, photo: Image.Image, polygon: list[list[int]]) -> None:
    xs = [point[0] for point in polygon]
    ys = [point[1] for point in polygon]
    bounds = (min(xs), min(ys), max(xs), max(ys))
    size = (bounds[2] - bounds[0], bounds[3] - bounds[1])
    fitted = fit_cover(photo, size)
    mask = Image.new("L", size, 0)
    local_polygon = [(x - bounds[0], y - bounds[1]) for x, y in polygon]
    ImageDraw.Draw(mask).polygon(local_polygon, fill=255)
    canvas.paste(fitted, (bounds[0], bounds[1]), mask)


def build_preview(frame: dict[str, Any], panels: list[Image.Image]) -> tuple[Image.Image, Image.Image]:
    canvas_size = (frame["canvasWidth"], frame["canvasHeight"])
    thumb_size = (360, 450) if frame["mode"] == "single" else (240, 600)
    overlay = Image.open(resolve_project_path(frame["overlaySrc"])).convert("RGBA")
    if overlay.size != canvas_size:
        raise ValueError(f"Overlay geometry mismatch for {frame['id']}: {overlay.size}")

    frame_only = clear_hidden_rgb(overlay.resize(thumb_size, Image.Resampling.LANCZOS))
    composite = Image.new("RGBA", canvas_size, frame.get("slotBackground", "#fff7ef"))
    if frame.get("maskType") == "polygon":
        paste_polygon(composite, panels[0], frame["photoPolygon"])
    else:
        for index, window in enumerate(frame["photoWindows"]):
            paste_window(composite, panels[min(index, len(panels) - 1)], window)
    composite.alpha_composite(overlay)
    return frame_only, clear_hidden_rgb(composite.resize(thumb_size, Image.Resampling.LANCZOS))


def write_or_check(path: Path, content: bytes, check: bool) -> None:
    if check:
        if not path.is_file() or path.read_bytes() != content:
            raise RuntimeError(f"Preview drift: {path.relative_to(ROOT).as_posix()}")
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(content)


def generate(check: bool = False) -> None:
    manifest = load_json(MANIFEST_PATH)
    policy = load_json(POLICY_PATH)
    fixtures = {}
    for fixture_policy in policy["pickerFixtures"]:
        fixture_path = resolve_project_path(fixture_policy["source"])
        prompt_path = resolve_project_path(fixture_policy["promptSource"])
        fixtures[fixture_policy["id"]] = {
            "panels": photo_panels(Image.open(fixture_path).convert("RGB")),
            "prompt": prompt_path.read_text(encoding="utf-8").strip(),
        }
    families = {family["id"]: family for family in manifest["families"]}

    for frame in manifest["frames"]:
        fixture_id = families[frame["family"]]["pickerFixtureId"]
        fixture = fixtures[fixture_id]
        panels = fixture["panels"]
        prompt = fixture["prompt"]
        frame_only, composite = build_preview(frame, panels)
        fallback_prompt = f"Deterministic frame-only thumbnail derived from {frame['overlaySrc']}; no generated subject."
        composite_prompt = f"{prompt}\n\nDerived picker use: composited under {frame['overlaySrc']} using canonical photo geometry."
        write_or_check(resolve_project_path(frame["thumbnailSrc"]), png_bytes(frame_only, fallback_prompt), check)
        write_or_check(resolve_project_path(frame["pickerThumbnailSrc"]), png_bytes(composite, composite_prompt), check)

    action = "verified" if check else "generated"
    print(f"[picker-previews] {action} {len(manifest['frames'])} frame-only + {len(manifest['frames'])} composite thumbnails")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="Fail when committed previews drift from generated output.")
    arguments = parser.parse_args()
    generate(check=arguments.check)
