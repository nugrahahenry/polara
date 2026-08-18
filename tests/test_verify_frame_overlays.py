from __future__ import annotations

import json
import importlib.util
import tempfile
import unittest
from copy import deepcopy
from pathlib import Path

from PIL import Image


SCRIPT = Path(__file__).parents[1] / "scripts" / "verify-frame-overlays.py"
ROOT = SCRIPT.parents[1]
SPEC = importlib.util.spec_from_file_location("verify_frame_overlays", SCRIPT)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class ResolveAssetPathTests(unittest.TestCase):
    def test_path_normal_stays_inside_pack_root(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            self.assertEqual(
                MODULE.resolve_asset_path(root, "assets/frames/overlay.png"),
                root / "assets" / "frames" / "overlay.png",
            )

    def test_parent_traversal_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            with self.assertRaises(MODULE.VerificationError):
                MODULE.resolve_asset_path(root, "../outside.png")

    def test_absolute_path_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            outside = root.parent / "outside.png"
            with self.assertRaises(MODULE.VerificationError):
                MODULE.resolve_asset_path(root, str(outside))

    def test_absolute_path_inside_root_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            inside = root / "asset.png"
            with self.assertRaises(MODULE.VerificationError):
                MODULE.resolve_asset_path(root, str(inside))


class FrameContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        manifest_path = ROOT / "assets" / "frames" / "frame-overlay-manifest.json"
        cls.frames = {
            frame["id"]: frame
            for frame in json.loads(manifest_path.read_text(encoding="utf-8"))["frames"]
        }

    def test_wrong_mode_is_rejected_before_asset_shape_can_hide_it(self) -> None:
        frame = deepcopy(self.frames["polara-daily-single"])
        frame["mode"] = "strip"
        with self.assertRaisesRegex(MODULE.VerificationError, "Mode"):
            MODULE.verify_frame(ROOT, frame)

    def test_wrong_rounded_mask_type_is_rejected(self) -> None:
        frame = deepcopy(self.frames["polara-daily-strip"])
        frame["maskType"] = "rectangles"
        with self.assertRaisesRegex(MODULE.VerificationError, "Mask"):
            MODULE.verify_frame(ROOT, frame)

    def test_legacy_master_remains_required(self) -> None:
        frame = deepcopy(self.frames["poca-purikura.single"])
        frame.pop("masterSrc")
        with self.assertRaisesRegex(MODULE.VerificationError, "master"):
            MODULE.verify_frame(ROOT, frame)

    def test_new_frame_without_master_is_valid(self) -> None:
        result = MODULE.verify_frame(ROOT, deepcopy(self.frames["polara-daily-single"]))
        self.assertEqual(result, self.frames["polara-daily-single"]["sha256"])


class ImageVerificationTests(unittest.TestCase):
    def test_polygon_rejects_large_opaque_obstruction(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "blocked.png"
            Image.new("RGBA", (20, 20), (0, 0, 0, 255)).save(path)
            with self.assertRaisesRegex(MODULE.VerificationError, "transparan"):
                MODULE.verify_image(
                    path,
                    (20, 20),
                    [{"x": 0, "y": 0, "width": 20, "height": 20}],
                    [[0, 0], [19, 0], [19, 19], [0, 19]],
                    {"minimumTransparent": 0.95, "maximumOpaque": 0.01},
                )

    def test_truncated_png_is_rejected_by_full_decode(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "truncated.png"
            path.write_bytes(b"\x89PNG\r\n\x1a\n")
            with self.assertRaises(MODULE.VerificationError):
                MODULE.verify_png_asset(path, (20, 20), {"RGBA"}, "Thumbnail")


if __name__ == "__main__":
    unittest.main()
