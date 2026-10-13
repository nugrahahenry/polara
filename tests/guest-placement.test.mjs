import test from 'node:test';
import assert from 'node:assert/strict';
import { createGuestComposition } from '../src/modules/guests/index.js';
import { computeGuestGeometry, drawGuestGeometry, guestGeometryInvariant } from '../src/core/guest-geometry.js';
import { resolveGuestPlacement, patchGuestPlacements } from '../src/core/guest-placement.js';

const composition = (layout, placement) => createGuestComposition({
  experience: 'pose-mate', guestId: 'polara-pm-02', layout, placement,
});
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-7, `${actual} != ${expected}`);

test('neutral placement preserves the default composition exactly', () => {
  for (const layout of ['matched', 'side-by-side']) {
    const original = composition(layout);
    const before = computeGuestGeometry(original, 1254, 1254, 720, 600);
    const neutral = composition(layout, before.placement);
    const after = computeGuestGeometry(neutral, 1254, 1254, 720, 600);
    for (const key of ['x', 'y', 'width', 'height']) close(after.image[key], before.image[key]);
  }
});

test('position and size remain proportional and clipped at every edge', () => {
  for (const layout of ['matched', 'side-by-side']) {
    for (const [width, height] of [[320, 240], [648, 366], [1080, 1350], [720, 600]]) {
      for (const scale of [0.6, 1, 1.4]) {
        for (const x of [0, 0.5, 1]) {
          for (const y of [0, 0.5, 1]) {
            const geometry = computeGuestGeometry(composition(layout, { x, y, scale }), 1254, 1254, width, height, 13, 27);
            assert.ok(guestGeometryInvariant(geometry));
            assert.ok(geometry.region.x >= 13 && geometry.region.y >= 27);
            assert.ok(geometry.region.x + geometry.region.width <= 13 + width + 1e-7);
            assert.ok(geometry.region.y + geometry.region.height <= 27 + height + 1e-7);
            close(geometry.image.width / geometry.image.height, 1);
          }
        }
      }
    }
  }
});

test('movement changes the guest only and scales with the output viewport', () => {
  const moved = composition('side-by-side', { x: 0.2, y: 1, scale: 1.2 });
  assert.deepEqual(moved.userRegion, { x: 0, y: 0, width: 1, height: 1 });
  const preview = computeGuestGeometry(moved, 1254, 1254, 360, 300);
  const output = computeGuestGeometry(moved, 1254, 1254, 720, 600);
  const original = computeGuestGeometry(composition('side-by-side'), 1254, 1254, 360, 300);
  assert.ok(preview.image.x < original.image.x);
  close(preview.image.width / original.image.width, 1.2);
  for (const key of ['x', 'y', 'width', 'height']) {
    close(output.image[key], preview.image[key] * 2);
    close(output.region[key], preview.region[key] * 2);
  }
  const calls = [];
  const ctx = Object.fromEntries(['save', 'beginPath', 'rect', 'clip', 'translate', 'scale', 'drawImage', 'restore']
    .map((method) => [method, (...args) => calls.push([method, ...args])]));
  drawGuestGeometry(ctx, 'image', output);
  assert.deepEqual(calls.find(([method]) => method === 'rect'), ['rect', output.region.x, output.region.y, output.region.width, output.region.height]);
  assert.deepEqual(calls.find(([method]) => method === 'drawImage').slice(-4), Object.values(output.image));
});

test('invalid placement inputs are bounded and cannot produce NaN geometry', () => {
  const resolved = resolveGuestPlacement(composition('matched', { x: Infinity, y: -5, scale: 999 }));
  assert.equal(resolved.x, 1);
  assert.equal(resolved.y, 0);
  assert.equal(resolved.scale, 1.4);
  const invalid = resolveGuestPlacement(composition('side-by-side', { x: NaN, y: 'bad', scale: null }));
  assert.ok(Object.values(invalid).every(Number.isFinite));
  assert.equal(invalid.scale, 1);
});

test('standing guest can move vertically without first changing its size', () => {
  const top = computeGuestGeometry(composition('matched', { x: 1, y: 0, scale: 1 }), 1254, 1254, 720, 600);
  const bottom = computeGuestGeometry(composition('matched', { x: 1, y: 1, scale: 1 }), 1254, 1254, 720, 600);
  assert.ok(top.image.y < bottom.image.y);
  close(bottom.image.y + bottom.image.height, 600);
});

test('wide Strip windows preserve the entire authored seated bust crop', () => {
  for (const placement of [null, { x: 0.21, y: 1, scale: 1.15 }]) {
    const guest = composition('side-by-side', placement);
    const geometry = computeGuestGeometry(guest, 1254, 1254, 568, 374);
    close(geometry.region.y, geometry.image.y + guest.guestCrop.y * geometry.image.height);
    close(geometry.region.height, guest.guestCrop.height * geometry.image.height);
    close(geometry.region.width, guest.guestCrop.width * geometry.image.width);
  }
});

test('first edit is stable for height-limited standing guests on either side', () => {
  for (const side of ['left', 'right']) {
    const guest = createGuestComposition({ experience: 'pose-mate', layout: 'matched', side });
    const original = computeGuestGeometry(guest, 1254, 1254, 1080, 300);
    const neutral = computeGuestGeometry({ ...guest, placement: original.placement }, 1254, 1254, 1080, 300);
    close(neutral.image.x, original.image.x);
    close(neutral.image.y, original.image.y);
    const verticalEdit = computeGuestGeometry({ ...guest, placement: { y: 0.99 } }, 1254, 1254, 1080, 300);
    close(verticalEdit.image.x, original.image.x);
    const sizeEdit = computeGuestGeometry({ ...guest, placement: { scale: 0.8 } }, 1254, 1254, 1080, 300);
    close(sizeEdit.image.x / (1080 - sizeEdit.image.width), original.image.x / (1080 - original.image.width));
  }
});

test('editing and resetting one slot leaves other slots and the other layout unchanged', () => {
  const initial = [{ matched: { x: 0.1, y: 1, scale: 1 } }, {}, {}];
  const changed = patchGuestPlacements(initial, 1, 'side-by-side', { x: 0.3, y: 0.9, scale: 0.8 });
  assert.deepEqual(initial, [{ matched: { x: 0.1, y: 1, scale: 1 } }, {}, {}]);
  assert.equal(changed[0], initial[0]);
  assert.equal(changed[2], initial[2]);
  const standing = patchGuestPlacements(changed, 1, 'matched', { x: 0.7, y: 1, scale: 1 });
  const reset = patchGuestPlacements(standing, 1, 'side-by-side', null);
  assert.deepEqual(reset[1].matched, standing[1].matched);
  assert.equal(reset[1]['side-by-side'], undefined);
  assert.equal(reset[0], initial[0]);
});
