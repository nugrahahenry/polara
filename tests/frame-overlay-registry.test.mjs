import test from 'node:test';
import assert from 'node:assert/strict';

import { frameOverlayTemplates } from '../src/modules/templates/frame-overlays.generated.js';


const EXPECTED = {
  'poca-purikura.single': {
    mode: 'single', canvas: { width: 1080, height: 1350 },
    windows: [{ x: 124, y: 270, width: 832, height: 840 }],
  },
  'poca-purikura.strip': {
    mode: 'strip', canvas: { width: 720, height: 1800 },
    windows: [
      { x: 76, y: 214, width: 568, height: 388 },
      { x: 76, y: 640, width: 568, height: 388 },
      { x: 76, y: 1066, width: 568, height: 388 },
    ],
  },
  'vintage-film-lofi.single': {
    mode: 'single', canvas: { width: 1080, height: 1350 },
    windows: [{ x: 96, y: 174, width: 888, height: 960 }],
  },
  'vintage-film-lofi.strip': {
    mode: 'strip', canvas: { width: 720, height: 1800 },
    windows: [
      { x: 159, y: 255, width: 402, height: 384 },
      { x: 159, y: 702, width: 402, height: 384 },
      { x: 159, y: 1149, width: 402, height: 384 },
    ],
  },
  'seoul-snap-y2k.single': {
    mode: 'single', canvas: { width: 1080, height: 1350 },
    windows: [{ x: 279, y: 311, width: 726, height: 774 }],
  },
  'seoul-snap-y2k.strip': {
    mode: 'strip', canvas: { width: 720, height: 1800 },
    windows: [
      { x: 76, y: 214, width: 568, height: 388 },
      { x: 76, y: 640, width: 568, height: 388 },
      { x: 76, y: 1066, width: 568, height: 388 },
    ],
  },
  'polara-daily-single': {
    mode: 'single', canvas: { width: 1080, height: 1350 }, maskType: 'polygon',
    polygon: [[80, 301], [747, 301], [781, 328], [781, 1046], [52, 1046], [52, 328]],
  },
  'polara-daily-strip': {
    mode: 'strip', canvas: { width: 720, height: 1800 }, maskType: 'rounded-rectangles',
    windows: [
      { x: 35, y: 241, width: 483, height: 428, radius: 14 },
      { x: 35, y: 681, width: 483, height: 387, radius: 14 },
      { x: 35, y: 1079, width: 483, height: 364, radius: 14 },
    ],
  },
  'polara-midnight-club-single': {
    mode: 'single', canvas: { width: 1080, height: 1350 }, maskType: 'polygon',
    polygon: [[158, 231], [918, 231], [969, 282], [969, 1153], [110, 1153], [110, 282]],
  },
  'polara-midnight-club-strip': {
    mode: 'strip', canvas: { width: 720, height: 1800 }, maskType: 'rounded-rectangles',
    windows: [
      { x: 40, y: 204, width: 640, height: 414, radius: 14 },
      { x: 40, y: 632, width: 640, height: 426, radius: 14 },
      { x: 40, y: 1074, width: 640, height: 412, radius: 14 },
    ],
  },
};


test('registry generated memuat tepat sepuluh Hero PNG dari lima keluarga dengan geometry canonical', () => {
  assert.equal(frameOverlayTemplates.length, 10);
  assert.equal(new Set(frameOverlayTemplates.map((template) => template.familyId)).size, 5);
  assert.equal(new Set(frameOverlayTemplates.map((template) => template.id)).size, 10);
  assert.deepEqual(new Set(frameOverlayTemplates.map((template) => template.id)), new Set(Object.keys(EXPECTED)));

  frameOverlayTemplates.forEach((template) => {
    const expected = EXPECTED[template.id];
    assert.equal(template.renderMode, 'png-overlay', template.id);
    assert.equal(template.mode, expected.mode, template.id);
    assert.deepEqual(template.canvas, expected.canvas, template.id);
    if (expected.maskType) assert.equal(template.maskType, expected.maskType, template.id);
    if (expected.polygon) assert.deepEqual(template.photoPolygon, expected.polygon, template.id);
    if (expected.windows) assert.deepEqual(template.photoWindows, expected.windows, template.id);
    assert.equal(template.photoWindows.length, template.mode === 'strip' ? 3 : 1, template.id);
  });
});


test('registry generated memisahkan overlay export dari picker thumbnail runtime', () => {
  frameOverlayTemplates.forEach((template) => {
    assert.match(template.overlaySrc, /^assets\/frames\/[a-z0-9-]+-overlay\.png$/);
    assert.match(template.thumbnailSrc, /^assets\/frames\/thumbnails\/[a-z0-9-]+-thumbnail\.png$/);
    assert.match(template.pickerThumbnailSrc, /^assets\/frames\/composites\/[a-z0-9-]+-thumbnail\.png$/);
    assert.notEqual(template.pickerThumbnailSrc, template.overlaySrc);
    assert.notEqual(template.pickerThumbnailSrc, template.thumbnailSrc);
    assert.equal(template.characterPolicy, 'character-free');
    assert.equal('mascotSrc' in template, false);
    assert.match(template.assetVersion, /^frame-overlay-v\d+$/);
    assert.equal(template.status, 'runtime-overlay');
    assert.match(template.pickerDetail, /^(Single|Strip 3) · \d+ × \d+$/);
  });

  assert.equal(new Set(frameOverlayTemplates.map((template) => template.pickerThumbnailSrc)).size, 10);
});
