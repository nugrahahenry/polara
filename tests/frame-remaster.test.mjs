import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const manifest = JSON.parse(fs.readFileSync(new URL('../assets/frames/frame-overlay-manifest.json', import.meta.url), 'utf8'));
const registry = fs.readFileSync(new URL('../src/modules/templates/frame-overlays.generated.js', import.meta.url), 'utf8');

test('runtime frame variants keep proof-edge profiles by format', () => {
  assert.equal(manifest.frames.length, 24);
  for (const frame of manifest.frames) {
    assert.match(frame.assetVersion, /^frame-overlay-v[567]$/);
    assert.equal(
      frame.qualityProfile,
      frame.mode === 'strip' ? 'polara-proof-edge-v3' : 'polara-proof-edge-v2',
    );
    assert.equal(frame.edgePalette.length, 3);
    assert.equal(frame.characterPolicy, 'character-free');
  }
  assert.equal(new Set(manifest.frames.map((frame) => frame.family)).size, 8);
  assert.equal((registry.match(/"assetVersion": "frame-overlay-v5"/g) || []).length, 12);
  assert.equal((registry.match(/"assetVersion": "frame-overlay-v6"/g) || []).length, 0);
  assert.equal((registry.match(/"assetVersion": "frame-overlay-v7"/g) || []).length, 12);
});
