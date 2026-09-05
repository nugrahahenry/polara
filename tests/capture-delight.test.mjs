import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

import { getCaptureMomentCopy } from '../src/ui/capture-delight.js';


const projectRoot = new URL('../', import.meta.url);
const readText = (relativePath) => fs.readFile(new URL(relativePath, projectRoot), 'utf8');


test('capture moment copy stays factual for a new proof and a safe retake', () => {
  assert.deepEqual(getCaptureMomentCopy({ slotIndex: 1, mode: 3, retake: false }), {
    proofLabel: 'Proof 2 of 3',
    countdownCue: 'Hold this pose',
    receipt: 'Proof 2 saved',
  });
  assert.deepEqual(getCaptureMomentCopy({ slotIndex: 0, mode: 1, retake: true }), {
    proofLabel: 'Proof 1 of 1',
    countdownCue: 'The original stays safe',
    receipt: 'Proof 1 replaced',
  });
});


test('Camera exposes one structured countdown and a live capture receipt', async () => {
  const html = await readText('index.html');
  assert.match(html, /id="countdown"[^>]*data-phase="idle"/);
  assert.match(html, /id="countdownProof"/);
  assert.match(html, /id="countdownValue"/);
  assert.match(html, /id="countdownCue"/);
  assert.match(html, /id="countdownProgress"/);
  assert.match(html, /id="shotBadge"[^>]*aria-live="polite"/);
});


test('capture choreography connects countdown, shutter, recent slot, and Review arrival', async () => {
  const [app, css] = await Promise.all([
    readText('src/app.js'),
    readText('styles/proof-table.css'),
  ]);

  assert.match(app, /function setCaptureMoment\(/);
  assert.match(app, /recentCaptureSlot/);
  assert.match(app, /dataset\.captureMoment/);
  assert.match(app, /dataset\.proofArrival/);
  assert.match(css, /#cameraWrap\[data-capture-moment="shutter"\]/);
  assert.match(css, /\.slot-card\[data-capture-recent="true"\]/);
  assert.match(css, /\.review-photo-wrap\[data-proof-arrival="fresh"\]/);
});


test('capture delight has an intentional reduced-motion path', async () => {
  const [app, css] = await Promise.all([
    readText('src/app.js'),
    readText('styles/proof-table.css'),
  ]);
  assert.match(app, /reducedMotion\.matches\s*\?\s*1200\s*:\s*1400/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*#cameraWrap::before[\s\S]*animation:\s*none/s);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.slot-card\[data-capture-recent="true"\][\s\S]*animation:\s*none/s);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.review-photo-wrap\[data-proof-arrival="fresh"\][\s\S]*animation:\s*none/s);
});
