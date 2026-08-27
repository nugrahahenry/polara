#!/usr/bin/env python3
"""Generate the Polara v0.27 universal sticker workshop expansion."""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, PngImagePlugin


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "stickers"
FONT_BOLD = Path("C:/Windows/Fonts/arialbd.ttf")
FONT_REGULAR = Path("C:/Windows/Fonts/arial.ttf")
INK = "#4b2e1f"
CREAM = "#fffaf2"
PINK = "#ff8fbd"
PINK_DEEP = "#ec5e9e"
BLUE = "#8fd3ff"
BLUE_DEEP = "#368cbd"
YELLOW = "#ffe26f"
LILAC = "#cab8ff"
PROFILE = "polara-sticker-workshop-v2"


def font(path: Path, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(path), size=size)


def sanitized(image: Image.Image) -> Image.Image:
    result = image.convert("RGBA")
    result.putdata([
        (0, 0, 0, 0) if alpha == 0 else (red, green, blue, alpha)
        for red, green, blue, alpha in result.get_flattened_data()
    ])
    return result


def save(image: Image.Image, name: str, description: str) -> None:
    runtime = image.resize((512, 512), Image.Resampling.LANCZOS)
    metadata = PngImagePlugin.PngInfo()
    metadata.add_text("polara:quality-profile", PROFILE)
    metadata.add_text("impeccable:prompt", description)
    sanitized(runtime).save(
        OUTPUT / name,
        format="PNG",
        optimize=True,
        compress_level=9,
        pnginfo=metadata,
    )


def centered_text(draw: ImageDraw.ImageDraw, xy: tuple[int, int], text: str, size: int, fill: str = INK, stroke: int = 0) -> None:
    draw.text(xy, text, anchor="mm", font=font(FONT_BOLD, size), fill=fill, stroke_width=stroke, stroke_fill=CREAM)


def star(draw: ImageDraw.ImageDraw, center: tuple[int, int], outer: int, fill: str) -> None:
    cx, cy = center
    points = []
    for index in range(10):
        angle = math.radians(-90 + index * 36)
        radius = outer if index % 2 == 0 else outer * .44
        points.append((cx + int(math.cos(angle) * radius), cy + int(math.sin(angle) * radius)))
    draw.polygon(points, fill=fill, outline=INK, width=max(8, outer // 8))


def mini_ribbon() -> Image.Image:
    image = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    tails = [(270, 600), (205, 900), (430, 805), (512, 930), (594, 805), (819, 900), (754, 600)]
    draw.polygon(tails, fill=CREAM)
    draw.line(tails + [tails[0]], fill=CREAM, width=92, joint="curve")
    draw.polygon(tails, fill=BLUE)
    draw.line(tails + [tails[0]], fill=INK, width=24, joint="curve")
    draw.ellipse((95, 120, 929, 760), fill=CREAM)
    draw.ellipse((130, 155, 894, 725), fill=INK)
    draw.ellipse((157, 182, 867, 698), fill=PINK)
    draw.ellipse((196, 221, 828, 659), outline=CREAM, width=14)
    centered_text(draw, (512, 390), "GOOD", 122, CREAM)
    centered_text(draw, (512, 525), "DAY", 150, YELLOW)
    draw.ellipse((470, 82, 554, 166), fill=YELLOW, outline=INK, width=18)
    return image


def cloud_note() -> Image.Image:
    image = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    outer = [(165, 690, 859, 820), (84, 434, 384, 738), (200, 220, 552, 704), (420, 120, 806, 680), (648, 286, 942, 746)]
    for box in outer:
        draw.ellipse(box, fill=CREAM)
    inner = [(185, 676, 839, 790), (118, 452, 392, 716), (224, 246, 548, 688), (442, 150, 790, 670), (648, 316, 910, 720)]
    for box in inner:
        draw.ellipse(box, fill=BLUE, outline=INK, width=18)
    draw.rounded_rectangle((190, 470, 834, 785), radius=126, fill=BLUE, outline=INK, width=18)
    draw.ellipse((680, 174, 852, 346), fill=YELLOW, outline=INK, width=18)
    for angle in range(0, 360, 45):
        x1 = 766 + int(math.cos(math.radians(angle)) * 106)
        y1 = 260 + int(math.sin(math.radians(angle)) * 106)
        x2 = 766 + int(math.cos(math.radians(angle)) * 142)
        y2 = 260 + int(math.sin(math.radians(angle)) * 142)
        draw.line((x1, y1, x2, y2), fill=INK, width=16)
    centered_text(draw, (500, 570), "DAY", 122, CREAM)
    centered_text(draw, (500, 692), "DREAM", 112, INK)
    return image


def ticket_stub() -> Image.Image:
    image = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((86, 220, 938, 820), radius=92, fill=CREAM)
    draw.rounded_rectangle((124, 258, 900, 782), radius=64, fill=YELLOW, outline=INK, width=24)
    draw.ellipse((68, 454, 174, 560), fill=(0, 0, 0, 0))
    draw.ellipse((850, 454, 956, 560), fill=(0, 0, 0, 0))
    draw.line((665, 282, 665, 758), fill=INK, width=14)
    for y in range(305, 750, 56):
        draw.ellipse((652, y, 678, y + 26), fill=CREAM)
    centered_text(draw, (392, 415), "KEEP", 108, INK)
    centered_text(draw, (392, 548), "THIS", 126, PINK_DEEP)
    centered_text(draw, (392, 675), "MOMENT", 62, INK)
    centered_text(draw, (785, 455), "01", 118, BLUE_DEEP)
    draw.ellipse((730, 580, 840, 690), fill=PINK, outline=INK, width=15)
    star(draw, (785, 635), 46, YELLOW)
    return image


def proof_tape() -> Image.Image:
    image = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    plate = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    draw = ImageDraw.Draw(plate)
    polygon = [(78, 330), (136, 276), (112, 220), (902, 188), (878, 244), (946, 298), (912, 716), (858, 760), (888, 826), (104, 846), (132, 784), (74, 742)]
    draw.line(polygon + [polygon[0]], fill=CREAM, width=84, joint="curve")
    draw.polygon(polygon, fill="#fff0c9")
    draw.line(polygon + [polygon[0]], fill=INK, width=20, joint="curve")
    for x in range(180, 875, 64):
        draw.line((x, 262, x + 28, 262), fill=PINK, width=12)
        draw.line((x, 774, x + 28, 774), fill=BLUE_DEEP, width=12)
    centered_text(draw, (512, 485), "PROOF", 160, PINK_DEEP)
    centered_text(draw, (512, 625), "KEEPER", 80, INK)
    draw.line((190, 360, 250, 360), fill=INK, width=12)
    draw.line((220, 330, 220, 390), fill=INK, width=12)
    draw.line((774, 655, 834, 655), fill=INK, width=12)
    draw.line((804, 625, 804, 685), fill=INK, width=12)
    return plate.rotate(-6, resample=Image.Resampling.BICUBIC)


def confetti_pop() -> Image.Image:
    image = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    draw.polygon([(328, 846), (442, 410), (748, 716)], fill=CREAM)
    draw.line([(328, 846), (442, 410), (748, 716), (328, 846)], fill=CREAM, width=90, joint="curve")
    draw.polygon([(328, 846), (442, 410), (748, 716)], fill=PINK)
    draw.line([(328, 846), (442, 410), (748, 716), (328, 846)], fill=INK, width=24, joint="curve")
    draw.line((385, 636, 588, 779), fill=YELLOW, width=54)
    draw.line((414, 522, 676, 695), fill=BLUE, width=52)
    bits = [
        ((250, 226, 308, 324), BLUE, -12), ((380, 120, 438, 220), PINK, 18),
        ((526, 174, 604, 248), YELLOW, 0), ((702, 152, 758, 256), LILAC, -18),
        ((786, 304, 874, 370), PINK, 12), ((210, 390, 294, 452), YELLOW, -8),
        ((604, 322, 666, 396), BLUE, 0), ((760, 492, 840, 560), YELLOW, 16),
    ]
    for box, color, _rotation in bits:
        draw.rounded_rectangle(box, radius=18, fill=color, outline=INK, width=14)
    for x, y, radius, color in ((322, 152, 30, YELLOW), (654, 104, 34, PINK), (864, 204, 26, BLUE), (178, 300, 25, LILAC)):
        draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=color, outline=INK, width=12)
    return image


def best_day() -> Image.Image:
    image = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((82, 226, 942, 790), radius=164, fill=CREAM)
    draw.rounded_rectangle((118, 262, 906, 754), radius=134, fill=LILAC, outline=INK, width=24)
    draw.rounded_rectangle((150, 294, 874, 722), radius=110, outline=CREAM, width=14)
    centered_text(draw, (512, 426), "BEST", 154, CREAM)
    centered_text(draw, (512, 590), "DAY!", 180, INK)
    draw.ellipse((154, 328, 222, 396), fill=YELLOW, outline=INK, width=12)
    draw.ellipse((796, 632, 864, 700), fill=PINK, outline=INK, width=12)
    return image


def speech_bubble() -> Image.Image:
    image = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((90, 164, 934, 732), radius=210, fill=CREAM)
    draw.polygon([(218, 688), (142, 878), (354, 736)], fill=CREAM)
    draw.rounded_rectangle((126, 200, 898, 696), radius=176, fill=BLUE, outline=INK, width=24)
    draw.polygon([(242, 654), (180, 820), (338, 690)], fill=BLUE)
    draw.line([(180, 820), (242, 654), (338, 690)], fill=INK, width=24, joint="curve")
    centered_text(draw, (512, 405), "SAY", 152, CREAM)
    centered_text(draw, (512, 560), "HI!", 176, PINK_DEEP)
    draw.ellipse((744, 266, 820, 342), fill=YELLOW, outline=INK, width=12)
    return image


def photo_buddy_badge() -> Image.Image:
    image = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    draw.ellipse((92, 92, 932, 932), fill=CREAM)
    draw.ellipse((132, 132, 892, 892), fill=YELLOW, outline=INK, width=26)
    draw.ellipse((184, 184, 840, 840), fill=PINK, outline=CREAM, width=18)
    centered_text(draw, (512, 360), "PHOTO", 124, CREAM)
    centered_text(draw, (512, 506), "BUDDY", 128, INK)
    centered_text(draw, (512, 642), "CLUB", 92, CREAM)
    draw.ellipse((438, 710, 586, 858), fill=BLUE, outline=INK, width=18)
    star(draw, (512, 782), 55, YELLOW)
    return image


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    assets = [
        ("mini-ribbon.png", mini_ribbon(), "Original Polara Good Day mini ribbon prop sticker."),
        ("cloud-note.png", cloud_note(), "Original Polara Day Dream cloud charm sticker."),
        ("ticket-stub.png", ticket_stub(), "Original Polara Keep This Moment ticket stub prop sticker."),
        ("proof-tape.png", proof_tape(), "Original Polara Proof Keeper paper tape material sticker."),
        ("confetti-pop.png", confetti_pop(), "Original Polara celebratory confetti accent sticker."),
        ("best-day.png", best_day(), "Original Polara Best Day word sticker."),
        ("speech-bubble.png", speech_bubble(), "Remastered Polara Say Hi speech bubble sticker."),
        ("photo-buddy-badge.png", photo_buddy_badge(), "Remastered Polara Photo Buddy Club badge sticker."),
    ]
    for name, asset, description in assets:
        save(asset, name, description)
    print(f"[sticker-workshop] generated {len(assets)} runtime stickers with {PROFILE}")


if __name__ == "__main__":
    main()
