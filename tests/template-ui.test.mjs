import test from 'node:test';
import assert from 'node:assert/strict';

import {
  findAvailableTemplate,
  isRequestedFrameStillSelected,
  getTemplatePreviewConfig,
  selectFramePreservingEditorState,
  templateSupportsDynamicText,
} from '../src/modules/templates/template-ui.js';


test('thumbnail overlay memakai PNG versioned sedangkan legacy tetap iframe', () => {
  assert.deepEqual(
    getTemplatePreviewConfig({
      thumbnailSrc: 'assets/frames/thumbnails/poca-thumbnail.png',
      assetVersion: 'frame overlay/v1',
    }),
    {
      kind: 'image',
      src: 'assets/frames/thumbnails/poca-thumbnail.png?v=frame%20overlay%2Fv1',
    },
  );
  assert.deepEqual(getTemplatePreviewConfig({ file: 'legacy.html' }), { kind: 'iframe' });
});


test('memilih frame hanya mengubah frameId dan menjaga semua state editor', () => {
  const photo = { src: 'photo', fit: 'cover', zoom: 1.4, offsetX: 0.2, offsetY: -0.15 };
  const sticker = { uid: 'paw-1', x: 0.5, y: 0.5, rotation: 13 };
  const state = { frameId: 'old', photos: [photo], caption: 'Henry', stickers: [sticker] };

  const result = selectFramePreservingEditorState(state, 'poca-purikura.single');

  assert.equal(result, state);
  assert.equal(state.frameId, 'poca-purikura.single');
  assert.equal(state.photos[0], photo);
  assert.equal(state.stickers[0], sticker);
  assert.equal(state.caption, 'Henry');
  assert.deepEqual(state.photos[0], photo);
});


test('dukungan caption mengikuti kontrak supportsDynamicText', () => {
  assert.equal(templateSupportsDynamicText({ supportsDynamicText: false }), false);
  assert.equal(templateSupportsDynamicText({ supportsDynamicText: true }), true);
  assert.equal(templateSupportsDynamicText({}), true);
});


test('fallback memilih Hero sehat dalam mode sama lalu legacy bila perlu', () => {
  const candidates = [
    { id: 'hero-a', mode: 'strip', renderMode: 'png-overlay' },
    { id: 'hero-b', mode: 'strip', renderMode: 'png-overlay' },
    { id: 'legacy', mode: 'strip' },
    { id: 'single', mode: 'single', renderMode: 'png-overlay' },
  ];

  assert.equal(
    findAvailableTemplate(candidates, 'strip', new Set(['hero-a']))?.id,
    'hero-b',
  );
  assert.equal(
    findAvailableTemplate(candidates, 'strip', new Set(['hero-a', 'hero-b']))?.id,
    'legacy',
  );
  assert.equal(findAvailableTemplate(candidates, 'single', new Set(['single'])), null);
});


test('pesan sukses frame tidak diumumkan setelah renderer berpindah ke fallback', () => {
  assert.equal(isRequestedFrameStillSelected('seoul-snap-y2k.single', 'seoul-snap-y2k.single'), true);
  assert.equal(isRequestedFrameStillSelected('seoul-snap-y2k.single', 'vintage-film-lofi.single'), false);
});
