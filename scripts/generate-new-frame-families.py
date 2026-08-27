#!/usr/bin/env python3
"""Generate Polara v0.26 Cloud Picnic and Lucky Ticket runtime assets."""

from __future__ import annotations

import hashlib
import json
from collections import deque
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFont, PngImagePlugin


ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "assets" / "frames" / "frame-overlay-manifest.json"
FONT_BOLD = Path("C:/Windows/Fonts/segoeuib.ttf")
FONT_REGULAR = Path("C:/Windows/Fonts/segoeui.ttf")
PROFILE = "polara-proof-edge-v1"


def font(path: Path, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(path), size=size)


def sanitize(image: Image.Image) -> Image.Image:
    output = image.convert("RGBA")
    output.putdata([
        (0, 0, 0, 0) if alpha == 0 else (red, green, blue, alpha)
        for red, green, blue, alpha in output.get_flattened_data()
    ])
    return output


def save_png(image: Image.Image, path: Path, prompt: str) -> bytes:
    path.parent.mkdir(parents=True, exist_ok=True)
    metadata = PngImagePlugin.PngInfo()
    metadata.add_text("impeccable:prompt", prompt)
    metadata.add_text("polara:quality-profile", PROFILE)
    sanitize(image).save(path, format="PNG", optimize=True, compress_level=9, pnginfo=metadata)
    return path.read_bytes()


def draw_edge_signature(draw: ImageDraw.ImageDraw, width: int, height: int, palette: tuple[str, str, str]) -> None:
    unit = max(2, round(min(width, height) / 360))
    inset = unit * 5
    arm = unit * 14
    for color, x, y, dx, dy in (
        (palette[0], inset, inset, 1, 1),
        (palette[1], width - inset - 1, inset, -1, 1),
        (palette[2], inset, height - inset - 1, 1, -1),
        (palette[0], width - inset - 1, height - inset - 1, -1, -1),
    ):
        draw.line((x, y, x + dx * arm, y), fill=color, width=unit)
        draw.line((x, y, x, y + dy * arm), fill=color, width=unit)
    swatch, gap = unit * 4, unit * 2
    start_x = width - inset - (swatch * 3 + gap * 2)
    start_y = height - inset - swatch
    for index, color in enumerate(palette):
        x = start_x + index * (swatch + gap)
        draw.rounded_rectangle((x, start_y, x + swatch, start_y + swatch), radius=unit, fill=color)


def cloud(draw: ImageDraw.ImageDraw, x: int, y: int, scale: int, fill: str, outline: str) -> None:
    circles = [
        (x, y + scale, x + scale * 2, y + scale * 3),
        (x + scale, y, x + scale * 4, y + scale * 3),
        (x + scale * 3, y + scale, x + scale * 5, y + scale * 3),
    ]
    for box in circles:
        draw.ellipse(box, fill=fill, outline=outline, width=max(2, scale // 5))


def daisy(draw: ImageDraw.ImageDraw, x: int, y: int, radius: int) -> None:
    for dx, dy in ((0, -1), (1, 0), (0, 1), (-1, 0), (.72, -.72), (.72, .72), (-.72, .72), (-.72, -.72)):
        cx, cy = x + int(dx * radius), y + int(dy * radius)
        draw.ellipse((cx - radius // 2, cy - radius // 2, cx + radius // 2, cy + radius // 2), fill="#fffdf9", outline="#4b2e1f", width=max(2, radius // 8))
    draw.ellipse((x - radius // 2, y - radius // 2, x + radius // 2, y + radius // 2), fill="#ffe26f", outline="#4b2e1f", width=max(2, radius // 8))


def ticket_notch(draw: ImageDraw.ImageDraw, width: int, y: int, radius: int, fill: str) -> None:
    draw.ellipse((-radius, y - radius, radius, y + radius), fill=fill)
    draw.ellipse((width - radius, y - radius, width + radius, y + radius), fill=fill)


def make_cloud_picnic(mode: str) -> tuple[Image.Image, dict[str, Any]]:
    width, height = ((1080, 1350) if mode == "single" else (720, 1800))
    image = Image.new("RGBA", (width, height), "#eaf7ff")
    draw = ImageDraw.Draw(image)
    draw.rectangle((0, 0, width, height), fill="#eaf7ff")
    stripe = 26 if mode == "single" else 18
    for x in range(0, width, stripe * 2):
        draw.rectangle((x, 0, x + stripe, height), fill="#d8f0ff")
    draw.rounded_rectangle((28, 28, width - 28, height - 28), radius=34, fill="#fffaf2", outline="#4b2e1f", width=4)
    draw.rounded_rectangle((43, 43, width - 43, height - 43), radius=28, outline="#8fd3ff", width=4)

    title_size = 48 if mode == "single" else 34
    draw.text((width // 2, 84), "CLOUD PICNIC", anchor="mm", fill="#4b2e1f", font=font(FONT_BOLD, title_size))
    draw.text((width // 2, 128 if mode == "single" else 118), "POLARA WEEKEND EDITION", anchor="mm", fill="#70584b", font=font(FONT_BOLD, 16 if mode == "single" else 12))
    cloud(draw, 48, 62, 12 if mode == "single" else 8, "#ffffff", "#8fd3ff")
    cloud(draw, width - (124 if mode == "single" else 88), 72, 10 if mode == "single" else 7, "#ffffff", "#8fd3ff")

    if mode == "single":
        windows = [{"x": 90, "y": 190, "width": 900, "height": 960, "radius": 34}]
        footer_y = 1218
        daisy(draw, 118, footer_y, 28)
        daisy(draw, width - 120, footer_y, 22)
        draw.text((width // 2, footer_y - 12), "blue skies · good light · best company", anchor="mm", fill="#4b2e1f", font=font(FONT_REGULAR, 24))
        draw.text((width // 2, footer_y + 34), "A LITTLE DAY TO KEEP", anchor="mm", fill="#ec5e9e", font=font(FONT_BOLD, 17))
    else:
        windows = [
            {"x": 68, "y": 170, "width": 584, "height": 420, "radius": 24},
            {"x": 68, "y": 625, "width": 584, "height": 420, "radius": 24},
            {"x": 68, "y": 1080, "width": 584, "height": 420, "radius": 24},
        ]
        for index, window in enumerate(windows, 1):
            draw.text((38, window["y"] + 26), f"{index}", anchor="mm", fill="#ec5e9e", font=font(FONT_BOLD, 20))
        daisy(draw, 110, 1608, 24)
        daisy(draw, width - 110, 1608, 20)
        draw.text((width // 2, 1600), "CLOUD PICNIC", anchor="mm", fill="#4b2e1f", font=font(FONT_BOLD, 30))
        draw.text((width // 2, 1642), "three little moments under one sky", anchor="mm", fill="#70584b", font=font(FONT_REGULAR, 17))

    for window in windows:
        x, y, w, h, radius = window["x"], window["y"], window["width"], window["height"], window["radius"]
        draw.rounded_rectangle((x - 8, y - 8, x + w + 8, y + h + 8), radius=radius + 8, fill="#8fd3ff", outline="#4b2e1f", width=3)
        draw.rounded_rectangle((x, y, x + w, y + h), radius=radius, fill=(0, 0, 0, 0))
    palette = ("#8fd3ff", "#ff8fbd", "#ffe26f")
    draw_edge_signature(draw, width, height, palette)
    return image, {
        "family": "cloud-picnic", "name": "Cloud Picnic", "category": "weekend-pastel", "mode": mode,
        "maskType": "rounded-rectangles", "photoWindows": windows, "slotBackground": "#eaf7ff",
        "decorativeElements": ["sky gingham", "paper clouds", "daisy marks", "weekend proof label"],
        "edgePalette": list(palette),
    }


def make_lucky_ticket(mode: str) -> tuple[Image.Image, dict[str, Any]]:
    width, height = ((1080, 1350) if mode == "single" else (720, 1800))
    image = Image.new("RGBA", (width, height), "#202f66")
    draw = ImageDraw.Draw(image)
    draw.rectangle((0, 0, width, height), fill="#202f66")
    ticket_notch(draw, width, height // 3, 22 if mode == "single" else 16, "#f7eee5")
    ticket_notch(draw, width, height * 2 // 3, 22 if mode == "single" else 16, "#f7eee5")
    draw.rounded_rectangle((30, 30, width - 30, height - 30), radius=28, outline="#ffe26f", width=5)
    draw.line((52, 52, width - 52, 52), fill="#ff8fbd", width=4)
    draw.line((52, height - 52, width - 52, height - 52), fill="#8fd3ff", width=4)
    for y in range(88, height - 88, 28):
        draw.ellipse((34, y, 42, y + 8), fill="#f7eee5")
        draw.ellipse((width - 42, y, width - 34, y + 8), fill="#f7eee5")
    draw.text((width // 2, 98), "LUCKY TICKET", anchor="mm", fill="#fffaf2", font=font(FONT_BOLD, 46 if mode == "single" else 34))
    draw.text((width // 2, 138 if mode == "single" else 128), "ONE SESSION · ALL GOOD MOMENTS", anchor="mm", fill="#ffe26f", font=font(FONT_BOLD, 15 if mode == "single" else 11))

    if mode == "single":
        polygon = [[154, 188], [926, 188], [966, 228], [966, 1082], [926, 1122], [154, 1122], [114, 1082], [114, 228]]
        draw.line(polygon + [polygon[0]], fill="#ff8fbd", width=9, joint="curve")
        draw.polygon(polygon, fill=(0, 0, 0, 0))
        draw.text((132, 1218), "ADMIT / 01", fill="#ffe26f", font=font(FONT_BOLD, 24))
        draw.text((width - 132, 1218), "KEEP THIS", anchor="ra", fill="#8fd3ff", font=font(FONT_BOLD, 24))
        draw.text((width // 2, 1268), "POLARA PHOTO CLUB", anchor="mm", fill="#fffaf2", font=font(FONT_BOLD, 18))
        geometry: dict[str, Any] = {"maskType": "polygon", "photoPolygon": polygon}
    else:
        windows = [
            {"x": 74, "y": 172, "width": 572, "height": 422, "radius": 20},
            {"x": 74, "y": 628, "width": 572, "height": 422, "radius": 20},
            {"x": 74, "y": 1084, "width": 572, "height": 422, "radius": 20},
        ]
        for index, window in enumerate(windows, 1):
            x, y, w, h, radius = window["x"], window["y"], window["width"], window["height"], window["radius"]
            draw.rounded_rectangle((x - 8, y - 8, x + w + 8, y + h + 8), radius=radius + 8, fill="#ff8fbd" if index % 2 else "#8fd3ff")
            draw.rounded_rectangle((x, y, x + w, y + h), radius=radius, fill=(0, 0, 0, 0))
            draw.text((34, y + 24), f"0{index}", anchor="mm", fill="#ffe26f", font=font(FONT_BOLD, 15))
        draw.text((width // 2, 1605), "LUCKY TICKET / STRIP THREE", anchor="mm", fill="#fffaf2", font=font(FONT_BOLD, 25))
        draw.text((width // 2, 1644), "KEEP THE STUB · KEEP THE STORY", anchor="mm", fill="#ffe26f", font=font(FONT_BOLD, 14))
        geometry = {"maskType": "rounded-rectangles", "photoWindows": windows}
    palette = ("#ff8fbd", "#8fd3ff", "#ffe26f")
    draw_edge_signature(draw, width, height, palette)
    return image, {
        "family": "lucky-ticket", "name": "Lucky Ticket", "category": "ticket-club", "mode": mode,
        **geometry, "slotBackground": "#202f66",
        "decorativeElements": ["ticket perforations", "cobalt stock", "admit marks", "three-color proof signature"],
        "edgePalette": list(palette),
    }


def extract_chroma(source_path: Path, output_path: Path, prompt: str) -> bytes:
    source = Image.open(source_path).convert("RGB")
    width, height = source.size
    pixels = source.load()
    visited = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()

    def background_candidate(x: int, y: int) -> bool:
        red, green, blue = pixels[x, y]
        return green > 145 and green - max(red, blue) > 45

    for x in range(width):
        for y in (0, height - 1):
            if background_candidate(x, y): queue.append((x, y))
    for y in range(height):
        for x in (0, width - 1):
            if background_candidate(x, y): queue.append((x, y))

    while queue:
        x, y = queue.popleft()
        index = y * width + x
        if visited[index] or not background_candidate(x, y):
            continue
        visited[index] = 1
        if x: queue.append((x - 1, y))
        if x + 1 < width: queue.append((x + 1, y))
        if y: queue.append((x, y - 1))
        if y + 1 < height: queue.append((x, y + 1))

    rgba = source.convert("RGBA")
    rgba.putdata([
        (0, 0, 0, 0) if visited[index] else (*color, 255)
        for index, color in enumerate(source.get_flattened_data())
    ])
    alpha = rgba.getchannel("A")
    box = alpha.getbbox()
    if not box:
        raise RuntimeError(f"Chroma extraction removed the full subject: {source_path.name}")
    cropped = rgba.crop(box)
    cropped.thumbnail((452, 452), Image.Resampling.LANCZOS)
    output = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    output.alpha_composite(cropped, ((512 - cropped.width) // 2, (512 - cropped.height) // 2))
    edge_source = output.copy()
    edge_pixels = edge_source.load()
    output_pixels = output.load()
    for y in range(output.height):
        for x in range(output.width):
            red, green, blue, alpha_value = edge_pixels[x, y]
            if alpha_value == 0:
                continue
            touches_transparency = alpha_value < 250 or any(
                0 <= x + dx < output.width
                and 0 <= y + dy < output.height
                and edge_pixels[x + dx, y + dy][3] == 0
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))
            )
            color_floor = max(red, blue)
            if touches_transparency and green > color_floor + 10:
                if alpha_value <= 8 and green > 180 and green - color_floor > 45:
                    output_pixels[x, y] = (0, 0, 0, 0)
                else:
                    output_pixels[x, y] = (red, color_floor, blue, alpha_value)
    return save_png(output, output_path, prompt)


def frame_entry(base: dict[str, Any], payload: bytes, overlay_path: str) -> dict[str, Any]:
    slug = base["family"]
    mode = base["mode"]
    suffix = "single" if mode == "single" else "strip"
    return {
        "id": f"{slug}.{suffix}", "family": slug, "name": base["name"], "category": base["category"], "mode": mode,
        "renderMode": "png-overlay", "characterPolicy": "character-free", **({key: base[key] for key in ("maskType", "photoWindows", "photoPolygon") if key in base}),
        "overlaySrc": overlay_path,
        "thumbnailSrc": f"assets/frames/thumbnails/{slug}-{suffix}-thumbnail.png",
        "pickerThumbnailSrc": f"assets/frames/composites/{slug}-{suffix}-thumbnail.png",
        "canvasWidth": 1080 if mode == "single" else 720, "canvasHeight": 1350 if mode == "single" else 1800,
        "sha256": hashlib.sha256(payload).hexdigest(), "byteSize": len(payload), "colorMode": "RGBA", "hasAlpha": True,
        "assetVersion": "frame-overlay-v5", "qualityProfile": PROFILE, "edgePalette": base["edgePalette"],
        "slotBackground": base["slotBackground"], "supportsDynamicText": False,
        "metadataZones": {"caption": None, "date": None, "brand": None},
        "metadataAreaNote": "Family copy is baked into the character-free overlay; geometry remains manifest-owned.",
        "decorativeElements": base["decorativeElements"],
    }


def main() -> None:
    generated_entries: list[dict[str, Any]] = []
    for family, maker in (("cloud-picnic", make_cloud_picnic), ("lucky-ticket", make_lucky_ticket)):
        for mode in ("single", "strip"):
            image, base = maker(mode)
            suffix = "single" if mode == "single" else "strip"
            relative = f"assets/frames/{family}-{suffix}-overlay.png"
            prompt = f"Deterministic Polara {base['name']} {suffix} overlay; character-free; manifest-owned geometry."
            payload = save_png(image, ROOT / relative, prompt)
            generated_entries.append(frame_entry(base, payload, relative))

    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    generated_ids = {entry["id"] for entry in generated_entries}
    manifest["frames"] = [frame for frame in manifest["frames"] if frame["id"] not in generated_ids] + generated_entries
    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    sources = ROOT / "assets" / "_originals" / "stickers" / "v0.26.0"
    sticker_specs = [
        ("poca-cloud-picnic-exclusive.png", "poca-cloud-picnic-chroma.png", "Original fictional Poca Cloud Picnic sticker generated with built-in ImageGen; chroma extracted locally."),
        ("poca-lucky-ticket-exclusive.png", "poca-lucky-ticket-chroma.png", "Original fictional Poca Lucky Ticket sticker generated with built-in ImageGen; chroma extracted locally."),
    ]
    provenance = {"schemaVersion": 1, "assets": []}
    for runtime_name, source_name, prompt in sticker_specs:
        runtime_path = ROOT / "assets" / "stickers" / runtime_name
        payload = extract_chroma(sources / source_name, runtime_path, prompt)
        provenance["assets"].append({
            "runtimeSrc": f"assets/stickers/{runtime_name}", "sha256": hashlib.sha256(payload).hexdigest(),
            "kind": "original-fictional", "sourceMode": "built-in-imagegen-plus-local-chroma-extraction",
            "publicFigure": False, "collaborationClaim": False, "background": "transparent", "hiddenRgbPolicy": "zero-at-alpha-0",
        })
    (ROOT / "assets" / "sticker-provenance.json").write_text(json.dumps(provenance, indent=2) + "\n", encoding="utf-8")
    print("[new-frame-families] generated 4 overlays and 2 transparent exclusive stickers")


if __name__ == "__main__":
    main()
