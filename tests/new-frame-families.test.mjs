import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import { frameOverlayTemplates } from '../src/modules/templates/frame-overlays.generated.js';
import { exclusiveStickers } from '../src/modules/stickers/index.js';

const manifest = JSON.parse(fs.readFileSync(new URL('../assets/frames/frame-overlay-manifest.json', import.meta.url), 'utf8'));

test('Cloud Picnic and Lucky Ticket ship complete Single, Strip, and exclusive sets', () => {
  assert.equal(manifest.frames.length, 16);
  assert.equal(frameOverlayTemplates.length, 16);
  for (const family of ['cloud-picnic', 'lucky-ticket']) {
    const frames = frameOverlayTemplates.filter((frame) => frame.familyId === family);
    assert.deepEqual(new Set(frames.map((frame) => frame.mode)), new Set(['single', 'strip']));
    assert.ok(frames.every((frame) => frame.characterPolicy === 'character-free'));
    assert.ok(frames.every((frame) => frame.assetVersion === 'frame-overlay-v5'));
    assert.equal(exclusiveStickers.filter((sticker) => sticker.exclusiveFamilyId === family).length, 1);
  }
});

test('new family provenance rejects public figures and collaboration claims', () => {
  const provenance = JSON.parse(fs.readFileSync(new URL('../assets/sticker-provenance.json', import.meta.url), 'utf8'));
  assert.equal(provenance.assets.length, 2);
  assert.ok(provenance.assets.every((asset) => asset.kind === 'original-fictional'));
  assert.ok(provenance.assets.every((asset) => asset.publicFigure === false));
  assert.ok(provenance.assets.every((asset) => asset.collaborationClaim === false));
});
