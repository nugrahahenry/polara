"""Render the small, repeatable print label on existing Purikura artwork."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


FONT_PATH = Path("C:/Windows/Fonts/seguisb.ttf")
FOOTER_PROFILE = "polara-purikura-footer-v1"
ASSET_VERSION = "frame-overlay-v8"
CANVAS_SIZES = {"single": (1080, 1350), "strip": (720, 1800)}


def footer_bounds(size: tuple[int, int]) -> tuple[int, int, int, int]:
    """Inclusive bounds, including old descenders below the registration line."""
    width, height = size
    unit = max(2, round(min(size) / 360))
    return (unit * 5 - unit // 2, height - unit * 16, round(width * 0.37), height - 1)


def draw_purikura_footer(
    image: Image.Image,
    mode: str,
    *,
    font: ImageFont.ImageFont | ImageFont.FreeTypeFont | None = None,
    font_path: Path = FONT_PATH,
) -> None:
    """Replace the old label, never sample or layer previously rendered glyphs.

    The cream ticket is confined to the lower-left print margin. It cannot
    touch the photo windows, center charms, or three color swatches.
    """
    if CANVAS_SIZES.get(mode) != image.size or image.mode != "RGBA":
        raise ValueError("Purikura footer requires its exact RGBA Single or Strip canvas.")
    unit = max(2, round(min(image.size) / 360))
    label_font = font or ImageFont.truetype(str(font_path), size=unit * 6)
    label = f"POLARA / {'SINGLE' if mode == 'single' else 'STRIP 3'}"
    position = (unit * 34, image.height - unit * 6)
    bounds = footer_bounds(image.size)
    draw = ImageDraw.Draw(image)
    text_bounds = draw.textbbox(position, label, font=label_font, anchor="ls")
    if not (
        bounds[0] <= text_bounds[0] < text_bounds[2] <= bounds[2]
        and bounds[1] <= text_bounds[1] < text_bounds[3] < image.height - unit * 5
    ):
        raise ValueError("Purikura footer text exceeds its reserved print margin.")

    original_alpha = image.getchannel("A")
    draw.rectangle(bounds, fill="#fff7ef")
    # Restore only the registration corner covered by the ticket.
    inset, arm = unit * 5, unit * 14
    baseline = image.height - inset - 1
    draw.line((inset, bounds[1], inset, baseline), fill="#ffe26f", width=unit)
    draw.line((inset, baseline, inset + arm, baseline), fill="#ffe26f", width=unit)
    draw.text(position, label, font=label_font, anchor="ls", fill="#4b2e1f")
    image.putalpha(original_alpha)
