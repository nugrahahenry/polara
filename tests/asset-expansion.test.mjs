import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

import { frameOverlayTemplates } from '../src/modules/templates/frame-overlays.generated.js';

const projectRoot = new URL('../', import.meta.url);
const readJson = async (relativePath) => JSON.parse(await fs.readFile(new URL(relativePath, projectRoot), 'utf8'));

test('asset expansion profile exposes a complete ready kit for every family', async () => {
  const manifest = await readJson('assets/frames/frame-overlay-manifest.json');
  assert.equal(manifest.assetExpansionProfileVersion, 'asset-expansion-v1');
  assert.equal(manifest.families.length, 7);

  for (const family of manifest.families) {
    assert.match(family.assetKit?.id || '', /^[a-z0-9-]+-kit-v1$/);
    assert.equal(family.assetKit.status, 'ready');
    assert.deepEqual(family.assetKit.formats, ['single', 'strip']);
    assert.equal(family.assetKit.preview, 'composite');
    assert.equal(family.assetKit.stickerCompanion, family.exclusiveStickerId);
  }
});

test('runtime frame families carry kit metadata without entering export surfaces', async () => {
  const families = new Map(frameOverlayTemplates.map((frame) => [frame.familyId, frame.familyProfile]));
  assert.equal(families.size, 7);
  for (const profile of families.values()) {
    assert.equal(profile.assetKit.status, 'ready');
    assert.deepEqual(profile.assetKit.formats, ['single', 'strip']);
  }
  const appSource = await fs.readFile(new URL('src/app.js', projectRoot), 'utf8');
  assert.doesNotMatch(appSource, /canvasScale\.append.*assetKit/s);
});
