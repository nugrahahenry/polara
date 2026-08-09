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
};


test('registry generated memuat tepat enam Hero PNG dengan geometry canonical', () => {
  assert.equal(frameOverlayTemplates.length, 6);
  assert.equal(new Set(frameOverlayTemplates.map((template) => template.id)).size, 6);
  assert.deepEqual(new Set(frameOverlayTemplates.map((template) => template.id)), new Set(Object.keys(EXPECTED)));

  frameOverlayTemplates.forEach((template) => {
    const expected = EXPECTED[template.id];
    assert.equal(template.renderMode, 'png-overlay', template.id);
    assert.equal(template.mode, expected.mode, template.id);
    assert.deepEqual(template.canvas, expected.canvas, template.id);
    assert.deepEqual(template.photoWindows, expected.windows, template.id);
    assert.equal(template.photoWindows.length, template.mode === 'strip' ? 3 : 1, template.id);
  });
});


test('registry generated menunjuk overlay dan thumbnail runtime versioned', () => {
  frameOverlayTemplates.forEach((template) => {
    assert.match(template.overlaySrc, /^assets\/frames\/[a-z0-9-]+-overlay\.png$/);
    assert.match(template.thumbnailSrc, /^assets\/frames\/thumbnails\/[a-z0-9-]+-thumbnail\.png$/);
    assert.equal(template.assetVersion, 'frame-overlay-v1');
    assert.equal(template.status, 'runtime-overlay');
  });
});
