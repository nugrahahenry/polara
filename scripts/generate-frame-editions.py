#!/usr/bin/env python3
"""Create deterministic alternate color editions without changing canonical photo geometry."""

from __future__ import annotations

import colorsys
import hashlib
import json
from copy import deepcopy
from pathlib import Path

from PIL import Image, PngImagePlugin


ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "assets" / "frames" / "frame-overlay-manifest.json"
BASE_IDS = ("poca-purikura.single", "poca-purikura.strip")


def recolor_blueberry(image: Image.Image) -> Image.Image:
    output = image.convert("RGBA")
    converted = []
    for red, green, blue, alpha in output.get_flattened_data():
        if alpha == 0:
            converted.append((0, 0, 0, 0))
            continue
        hue, saturation, value = colorsys.rgb_to_hsv(red / 255, green / 255, blue / 255)
        is_pink = saturation > .18 and (hue >= .88 or hue <= .06)
        if is_pink:
            hue = .62
            saturation = min(.62, saturation * .82 + .12)
            red_f, green_f, blue_f = colorsys.hsv_to_rgb(hue, saturation, value)
            red, green, blue = round(red_f * 255), round(green_f * 255), round(blue_f * 255)
        converted.append((red, green, blue, alpha))
    output.putdata(converted)
    return output


def save_overlay(source: Path, target: Path) -> bytes:
    with Image.open(source) as original:
        image = recolor_blueberry(original)
        source_info = dict(original.info)
    metadata = PngImagePlugin.PngInfo()
    for key, value in source_info.items():
        if isinstance(value, str):
            metadata.add_text(key, value)
    metadata.add_text("polara:edition", "Poca Purikura Blueberry")
    image.save(target, format="PNG", optimize=True, compress_level=9, pnginfo=metadata)
    return target.read_bytes()


def main() -> None:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    frames_by_id = {frame["id"]: frame for frame in manifest["frames"]}
    generated = []
    for base_id in BASE_IDS:
        base = frames_by_id[base_id]
        mode = base["mode"]
        slug = f"poca-purikura-blue-{mode}"
        target_path = ROOT / "assets" / "frames" / f"{slug}-overlay.png"
        payload = save_overlay(ROOT / base["overlaySrc"], target_path)
        frame = deepcopy(base)
        frame.update({
            "id": f"poca-purikura-blue.{mode}",
            "name": "Poca Purikura Blueberry",
            "overlaySrc": f"assets/frames/{slug}-overlay.png",
            "thumbnailSrc": f"assets/frames/thumbnails/{slug}-thumbnail.png",
            "pickerThumbnailSrc": f"assets/frames/composites/{slug}-thumbnail.png",
            "sha256": hashlib.sha256(payload).hexdigest(),
            "byteSize": len(payload),
            "assetVersion": "frame-overlay-v5",
            "edgePalette": ["#7087ed", "#8fd3ff", "#ffe26f"],
        })
        frame.pop("masterSrc", None)
        frame["decorativeElements"] = [
            item.replace("pink", "blueberry").replace("Pink", "Blueberry")
            for item in frame.get("decorativeElements", [])
        ]
        generated.append(frame)

    generated_ids = {frame["id"] for frame in generated}
    manifest["frames"] = [frame for frame in manifest["frames"] if frame["id"] not in generated_ids]
    insert_at = max(index for index, frame in enumerate(manifest["frames"]) if frame["family"] == "poca-purikura") + 1
    manifest["frames"][insert_at:insert_at] = generated
    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("[frame-editions] generated Poca Purikura Blueberry Single and Strip")


if __name__ == "__main__":
    main()
