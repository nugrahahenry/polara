"""Derive polished, rights-safe demo captures from Polara's local fixture source."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets/_originals/fixtures/polara-picker-besties-v1.png"
OUTPUT = ROOT / "assets/media/demo-proofs"
MANIFEST = OUTPUT / "manifest.json"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def label_proof(image: Image.Image, index: int) -> None:
    draw = ImageDraw.Draw(image, "RGBA")
    text = f"POLARA DEMO / {index:02d}"
    font = ImageFont.load_default(size=18)
    bounds = draw.textbbox((0, 0), text, font=font)
    width = bounds[2] - bounds[0]
    height = bounds[3] - bounds[1]
    padding_x, padding_y = 15, 9
    right, bottom = image.width - 24, image.height - 22
    left = right - width - padding_x * 2
    top = bottom - height - padding_y * 2
    draw.rounded_rectangle((left, top, right, bottom), radius=12, fill=(255, 252, 247, 226), outline=(75, 46, 31, 210), width=2)
    draw.text((left + padding_x, top + padding_y), text, font=font, fill=(75, 46, 31, 255))


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f"Missing local source fixture: {SOURCE}")
    OUTPUT.mkdir(parents=True, exist_ok=True)
    source = Image.open(SOURCE).convert("RGB")
    band_height = source.height // 3
    entries = []
    for zero_index in range(3):
        index = zero_index + 1
        top = zero_index * band_height
        bottom = source.height if index == 3 else top + band_height
        proof = source.crop((0, top, source.width, bottom))
        label_proof(proof, index)
        filename = f"demo-proof-{index}.jpg"
        path = OUTPUT / filename
        proof.save(path, "JPEG", quality=88, optimize=True, progressive=True, subsampling=1)
        entries.append({
            "id": f"polara-demo-proof-{index}",
            "src": f"assets/media/demo-proofs/{filename}",
            "width": proof.width,
            "height": proof.height,
            "sha256": sha256(path),
            "kind": "fictional-synthetic",
            "publicFigure": False,
            "collaborationClaim": False,
            "runtimeUse": "explicit demo mode only",
        })
    MANIFEST.write_text(json.dumps({"version": 1, "proofs": entries}, indent=2) + "\n", encoding="utf-8")
    print("[demo-proofs] generated three polished demo captures")


if __name__ == "__main__":
    main()
