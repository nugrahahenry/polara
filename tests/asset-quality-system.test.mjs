import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

import { frameOverlayTemplates } from '../src/modules/templates/frame-overlays.generated.js';
import { exclusiveStickers, mascots, stickers } from '../src/modules/stickers/index.js';


const projectRoot = new URL('../', import.meta.url);
const readJson = async (relativePath) => JSON.parse(await fs.readFile(new URL(relativePath, projectRoot), 'utf8'));
const listPng = async (relativeDirectory) => {
  const directory = new URL(relativeDirectory, projectRoot);
  return (await fs.readdir(directory))
    .filter((file) => file.endsWith('.png'))
    .map((file) => `${relativeDirectory}${file}`)
    .sort();
};


test('asset quality policy locks production budgets and fictional picker provenance', async () => {
  const policy = await readJson('assets/asset-quality-policy.json');
  assert.equal(policy.schemaVersion, 1);
  assert.equal(policy.profile, 'polara-asset-quality-v1');
  assert.equal(policy.frames.requireCharacterFreeOverlay, true);
  assert.equal(policy.frames.requirePickerComposite, true);
  assert.equal(policy.pickerFixture.kind, 'fictional-synthetic');
  assert.equal(policy.pickerFixture.publicFigure, false);
  assert.equal(policy.pickerFixture.collaborationClaim, false);
  assert.match(policy.pickerFixture.source, /^assets\/_originals\/fixtures\/[a-z0-9-]+\.png$/);
});

test('all frame families separate character-free overlay, fallback thumbnail, and picker composite', async () => {
  const manifest = await readJson('assets/frames/frame-overlay-manifest.json');
  assert.equal(manifest.frames.length, 10);

  for (const frame of manifest.frames) {
    assert.equal(frame.characterPolicy, 'character-free', frame.id);
    assert.equal('mascotSrc' in frame, false, frame.id);
    assert.match(frame.thumbnailSrc, /^assets\/frames\/thumbnails\/[a-z0-9-]+-thumbnail\.png$/);
    assert.match(frame.pickerThumbnailSrc, /^assets\/frames\/composites\/[a-z0-9-]+-thumbnail\.png$/);
    assert.notEqual(frame.thumbnailSrc, frame.pickerThumbnailSrc, frame.id);
  }

  assert.ok(frameOverlayTemplates.every((frame) => frame.characterPolicy === 'character-free'));
  assert.ok(frameOverlayTemplates.every((frame) => !frame.mascotSrc));
});


test('runtime PNG directories contain only registry assets and one exclusive Poca per family', async () => {
  const guestManifest = await readJson('assets/guests/guest-manifest.json');
  const framePaths = frameOverlayTemplates.flatMap((frame) => [
    frame.overlaySrc,
    frame.thumbnailSrc,
    frame.pickerThumbnailSrc,
  ]).sort();
  const stickerPaths = stickers.map((asset) => asset.src).sort();
  const mascotPaths = mascots.map((asset) => asset.src).sort();
  const guestPaths = guestManifest.guests.map((asset) => asset.runtimeSrc).sort();

  assert.deepEqual(await listPng('assets/frames/'), framePaths.filter((asset) => path.dirname(asset) === 'assets/frames'));
  assert.deepEqual(await listPng('assets/frames/thumbnails/'), framePaths.filter((asset) => path.dirname(asset) === 'assets/frames/thumbnails'));
  assert.deepEqual(await listPng('assets/frames/composites/'), framePaths.filter((asset) => path.dirname(asset) === 'assets/frames/composites'));
  assert.deepEqual(await listPng('assets/stickers/'), stickerPaths);
  assert.deepEqual(await listPng('assets/mascot/'), mascotPaths);
  assert.deepEqual(await listPng('assets/guests/'), guestPaths);
  assert.equal(exclusiveStickers.length, 5);
  assert.equal(new Set(exclusiveStickers.map((asset) => asset.exclusiveFamilyId)).size, 5);
  assert.ok(!mascotPaths.some((asset) => asset.endsWith('/poca-pointing-down.png')));
});
