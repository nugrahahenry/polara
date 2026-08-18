import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

import { frameOverlayTemplates } from '../src/modules/templates/frame-overlays.generated.js';
import { mascots } from '../src/modules/stickers/index.js';


const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);


test('setiap Hero memakai picker runtime tetapi overlay export tetap terpisah', async () => {
  assert.equal(frameOverlayTemplates.length, 10);

  for (const frame of frameOverlayTemplates) {
    assert.match(frame.pickerThumbnailSrc, /^assets\/frames\/(?:composites|thumbnails)\/[a-z0-9-]+-thumbnail\.png$/);
    assert.match(frame.overlaySrc, /^assets\/frames\/[a-z0-9-]+-overlay\.png$/);
    assert.notEqual(frame.pickerThumbnailSrc, frame.overlaySrc);

    const thumbnail = await fs.readFile(new URL(`../${frame.pickerThumbnailSrc}`, import.meta.url));
    assert.deepEqual(thumbnail.subarray(0, 8), PNG_SIGNATURE, frame.id);
  }
});


test('empat Hero baru hanya merujuk overlay, thumbnail, dan Poca runtime produksi', async () => {
  const added = frameOverlayTemplates.filter((frame) => (
    ['polara-daily', 'polara-midnight-club'].includes(frame.familyId)
  ));
  assert.equal(added.length, 4);

  for (const frame of added) {
    assert.equal(frame.pickerThumbnailSrc, frame.thumbnailSrc);
    assert.doesNotMatch(JSON.stringify(frame), /(?:true-composite|review|_originals|\.zip)/i);
    assert.match(frame.mascotSrc, /^assets\/mascot\/[a-z0-9-]+\.png$/);
    for (const src of [frame.overlaySrc, frame.thumbnailSrc, frame.mascotSrc]) {
      const png = await fs.readFile(new URL(`../${src}`, import.meta.url));
      assert.deepEqual(png.subarray(0, 8), PNG_SIGNATURE, `${frame.id}: ${src}`);
    }
  }
});


test('registry Poca memuat choreography v2.1 sebagai UI-only dan melarang pointing-down', async () => {
  const required = [
    'poca-camera',
    'poca-decorate-guide',
    'poca-excited-jump',
    'poca-holding-photo-frame',
    'poca-peeking',
    'poca-privacy-guardian',
    'poca-proof-approved',
    'poca-sleepy-loading',
  ];

  assert.deepEqual(required.filter((id) => !mascots.some((asset) => asset.id === id)), []);
  assert.equal(mascots.some((asset) => asset.id === 'poca-pointing-down'), false);
  assert.ok(mascots.every((asset) => asset.exportPolicy === 'ui-only'));

  for (const id of ['poca-decorate-guide', 'poca-privacy-guardian', 'poca-proof-approved']) {
    const asset = mascots.find((item) => item.id === id);
    const png = await fs.readFile(new URL(`../${asset.src}`, import.meta.url));
    assert.deepEqual(png.subarray(0, 8), PNG_SIGNATURE, id);
  }
});
