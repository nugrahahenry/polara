import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { clampStickerToCanvas, getStickerSafeBounds } from '../src/core/sticker-geometry.js';

test('sticker safe bounds account for rotation and keep the full asset inside the canvas', () => {
  const bounds = getStickerSafeBounds({ scale: 0.2, rotation: 45 });
  assert.ok(bounds.minX > 0.14);
  assert.ok(bounds.maxX < 0.86);
  assert.ok(bounds.minY > 0.12);
  assert.ok(bounds.maxY < 0.88);

  const sticker = { x: 0.99, y: 0.01, scale: 0.2, rotation: 45 };
  clampStickerToCanvas(sticker);
  assert.equal(sticker.x, bounds.maxX);
  assert.equal(sticker.y, bounds.minY);
});

test('already safe sticker positions stay stable', () => {
  const sticker = { x: 0.5, y: 0.5, scale: 0.14, rotation: -8 };
  const original = { ...sticker };
  clampStickerToCanvas(sticker);
  assert.deepEqual(sticker, original);
});

test('compositor applies the same safe geometry during render and edits', () => {
  const compositor = fs.readFileSync(new URL('../src/core/compositor.js', import.meta.url), 'utf8');
  assert.match(compositor, /sticker-geometry\.js/);
  assert.match(compositor, /clampStickerToCanvas\(item/);
});
