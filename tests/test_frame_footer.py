from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFont


SCRIPT = Path(__file__).parents[1] / "scripts" / "frame_footer.py"
SPEC = importlib.util.spec_from_file_location("frame_footer", SCRIPT)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class PurikuraFooterTests(unittest.TestCase):
    def test_replaces_old_glyphs_including_pixels_below_the_baseline(self) -> None:
        for mode, size in (("single", (1080, 1350)), ("strip", (720, 1800))):
            with self.subTest(mode=mode):
                font = ImageFont.load_default(size=18)
                clean = Image.new("RGBA", size, "#ffd8e8")
                dirty = clean.copy()
                ImageDraw.Draw(dirty).rectangle(
                    MODULE.footer_bounds(size), fill="#111111"
                )
                MODULE.draw_purikura_footer(clean, mode, font=font)
                MODULE.draw_purikura_footer(dirty, mode, font=font)
                self.assertEqual(clean.tobytes(), dirty.tobytes())

    def test_rerender_is_pixel_identical_and_changes_only_the_reserved_footer(self) -> None:
        for mode, size in (("single", (1080, 1350)), ("strip", (720, 1800))):
            with self.subTest(mode=mode):
                font = ImageFont.load_default(size=18)
                source = Image.new("RGBA", size, "#ffd8e8")
                ImageDraw.Draw(source).rectangle((124, 270, 600, 1000), fill=(0, 0, 0, 0))
                left, top, _, _ = MODULE.footer_bounds(size)
                source.putpixel((left, top), (255, 216, 232, 96))
                image = source.copy()
                MODULE.draw_purikura_footer(image, mode, font=font)
                once = image.tobytes()
                difference = ImageChops.difference(source, image)
                ImageDraw.Draw(difference).rectangle(
                    MODULE.footer_bounds(size), fill=(0, 0, 0, 0)
                )
                self.assertTrue(all(channel.getbbox() is None for channel in difference.split()))
                self.assertEqual(source.getchannel("A").tobytes(), image.getchannel("A").tobytes())
                MODULE.draw_purikura_footer(image, mode, font=font)
                self.assertEqual(once, image.tobytes())

    def test_rejects_wrong_canvas_or_mode_before_modifying_pixels(self) -> None:
        for mode, size in (("single", (720, 1800)), ("strip", (100, 100)), ("other", (1080, 1350))):
            image = Image.new("RGBA", size, "#ffd8e8")
            before = image.tobytes()
            with self.assertRaises(ValueError):
                MODULE.draw_purikura_footer(image, mode)
            self.assertEqual(before, image.tobytes())

    def test_missing_font_does_not_silently_ship_a_blank_footer(self) -> None:
        image = Image.new("RGBA", (1080, 1350), "#ffd8e8")
        before = image.tobytes()
        with self.assertRaises(OSError):
            MODULE.draw_purikura_footer(image, "single", font_path=Path("missing-font.ttf"))
        self.assertEqual(before, image.tobytes())


if __name__ == "__main__":
    unittest.main()
