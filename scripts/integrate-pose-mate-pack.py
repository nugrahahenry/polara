#!/usr/bin/env python3
"""Derive clean, deterministic Pose Mate runtime cutouts from a three-panel chroma source."""

from __future__ import annotations

import hashlib
import io
import json
from pathlib import Path

from PIL import Image, ImageFilter, PngImagePlugin


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "_originals" / "guests" / "pose-pack-v0.33.0" / "polara-pm-02-source-chroma.png"
PROMPT = ROOT / "assets" / "_originals" / "guests" / "pose-pack-v0.33.0" / "polara-pm-02.prompt.txt"
MANIFEST = ROOT / "assets" / "guests" / "guest-manifest.json"
OUTPUT_SIZE = (1254, 1254)
POSES = ("neutral", "peace", "half-heart")


def chroma_alpha(red: int, green: int, blue: int) -> int:
    dominance = green - max(red, blue)
    if green > 125 and dominance >= 56:
        return 0
    if green > 105 and dominance >= 12:
        return round(255 * (56 - dominance) / 44)
    return 255


def clear_hidden_rgb(image: Image.Image) -> Image.Image:
    cleaned = image.convert("RGBA")
    cleaned.putdata([
        (0, 0, 0, 0) if alpha == 0 else (red, green, blue, alpha)
        for red, green, blue, alpha in cleaned.get_flattened_data()
    ])
    return cleaned


def extract_panel(panel: Image.Image) -> Image.Image:
    rgba = panel.convert("RGBA")
    pixels = []
    for red, green, blue, _ in rgba.get_flattened_data():
        alpha = chroma_alpha(red, green, blue)
        if green > max(red, blue):
            green = max(red, blue)
        pixels.append((red, green, blue, alpha))
    rgba.putdata(pixels)
    rgba.putalpha(rgba.getchannel("A").filter(ImageFilter.MinFilter(3)))
    bounds = rgba.getchannel("A").getbbox()
    if not bounds:
        raise RuntimeError("Chroma extraction produced an empty pose.")
    subject = rgba.crop(bounds)
    target_box = (1070, 1170)
    scale = min(target_box[0] / subject.width, target_box[1] / subject.height)
    subject = subject.resize(
        (max(1, round(subject.width * scale)), max(1, round(subject.height * scale))),
        Image.Resampling.LANCZOS,
    )
    output = Image.new("RGBA", OUTPUT_SIZE, (0, 0, 0, 0))
    x = (OUTPUT_SIZE[0] - subject.width) // 2
    y = OUTPUT_SIZE[1] - subject.height - 28
    output.alpha_composite(subject, (x, y))
    return clear_hidden_rgb(output)


def png_bytes(image: Image.Image, prompt: str) -> bytes:
    metadata = PngImagePlugin.PngInfo()
    metadata.add_text("polara:guest-id", "polara-pm-02")
    metadata.add_text("polara:rights", "original-fictional; public-figure=false; collaboration-claim=false")
    metadata.add_text("impeccable:prompt", prompt)
    output = io.BytesIO()
    image.save(output, format="PNG", optimize=True, compress_level=9, pnginfo=metadata)
    return output.getvalue()


def main() -> None:
    source = Image.open(SOURCE).convert("RGB")
    if source.height % 3:
        raise RuntimeError("Pose source must divide into three equal horizontal panels.")
    prompt = PROMPT.read_text(encoding="utf-8").strip()
    panel_height = source.height // 3
    derived = []
    for index, pose in enumerate(POSES):
        panel = source.crop((0, index * panel_height, source.width, (index + 1) * panel_height))
        payload = png_bytes(extract_panel(panel), prompt)
        path = ROOT / "assets" / "guests" / f"polara-pm-02-{pose}.png"
        path.write_bytes(payload)
        derived.append((pose, path, payload))

    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    manifest["guests"] = [item for item in manifest["guests"] if not item["id"].startswith("polara-pm-02")]
    for item in manifest["guests"]:
        if (item.get("guestId") or item["id"]) == "polara-pm-01":
            item["name"] = "Juno"
    for pose, path, payload in derived:
        item_id = "polara-pm-02" if pose == "half-heart" else f"polara-pm-02-{pose}"
        item = {
            "id": item_id,
            "name": "Mina",
            "runtimeSrc": path.relative_to(ROOT).as_posix(),
            "pose": pose,
            "kind": "fictional-synthetic",
            "publicFigure": False,
            "collaborationClaim": False,
            "rightsScope": "Original Polara production runtime",
            "provenance": "Original fictional ImageGen source, then deterministic local chroma extraction",
            "generationPromptEmbedded": True,
            "width": OUTPUT_SIZE[0],
            "height": OUTPUT_SIZE[1],
            "sha256": hashlib.sha256(payload).hexdigest(),
        }
        if pose != "half-heart":
            item["guestId"] = "polara-pm-02"
        manifest["guests"].append(item)
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("[pose-mate] derived PM-02 neutral, peace, and half-heart runtime assets")


if __name__ == "__main__":
    main()
