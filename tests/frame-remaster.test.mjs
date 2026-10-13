import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const manifest = JSON.parse(fs.readFileSync(new URL('../assets/frames/frame-overlay-manifest.json', import.meta.url), 'utf8'));
const registry = fs.readFileSync(new URL('../src/modules/templates/frame-overlays.generated.js', import.meta.url), 'utf8');

test('runtime frame variants keep proof-edge profiles by format', () => {
  assert.equal(manifest.frames.length, 26);
  for (const frame of manifest.frames) {
    assert.equal(frame.assetVersion, frame.family === 'poca-purikura'
      ? 'frame-overlay-v8' : frame.mode === 'strip' ? 'frame-overlay-v7' : 'frame-overlay-v5');
    assert.equal(
      frame.qualityProfile,
      frame.mode === 'strip' ? 'polara-proof-edge-v3' : 'polara-proof-edge-v2',
    );
    assert.equal(frame.edgePalette.length, 3);
    assert.equal(frame.characterPolicy, 'character-free');
  }
  assert.equal(new Set(manifest.frames.map((frame) => frame.family)).size, 9);
  assert.equal((registry.match(/"assetVersion": "frame-overlay-v5"/g) || []).length, 11);
  assert.equal((registry.match(/"assetVersion": "frame-overlay-v6"/g) || []).length, 0);
  assert.equal((registry.match(/"assetVersion": "frame-overlay-v7"/g) || []).length, 11);
  assert.equal((registry.match(/"assetVersion": "frame-overlay-v8"/g) || []).length, 4);
});

test('Purikura asset revision is reachable through versioned production imports', () => {
  const app = fs.readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
  const index = fs.readFileSync(new URL('../src/modules/templates/index.js', import.meta.url), 'utf8');
  assert.match(app, /modules\/templates\/index\.js\?v=19/);
  assert.match(index, /frame-overlays\.generated\.js\?v=8/);
});
