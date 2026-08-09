from __future__ import annotations

import importlib.util
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).parents[1] / "scripts" / "verify-frame-overlays.py"
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


if __name__ == "__main__":
    unittest.main()
