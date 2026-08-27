import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { getRevealDossier } from '../src/ui/reveal-dossier.js';


test('Reveal dossier reports exact format, selected frame, decoration count, and local-only truth', () => {
  assert.deepEqual(getRevealDossier({
    mode: 3,
    frameName: 'Cloud Picnic',
    stickerCount: 4,
  }), {
    format: 'Strip 3 · 720×1800',
    frame: 'Cloud Picnic',
    decorations: '4 stickers',
    privacy: 'Local-only session',
  });

  assert.deepEqual(getRevealDossier({ mode: 1, frameName: '', stickerCount: 0 }), {
    format: 'Single · 1080×1350',
    frame: 'Polara frame',
    decorations: 'No stickers',
    privacy: 'Local-only session',
  });
});


test('Reveal dossier is an authored UI layer and never part of the export canvas', () => {
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const css = fs.readFileSync(new URL('../styles/proof-table.css', import.meta.url), 'utf8');
  const canvasStage = html.match(/<section class="stage-view canvas-stage"[^]*?<\/section>/)?.[0] || '';
  const revealPanel = html.match(/<section class="control-panel reveal-panel"[^]*?<\/section>\s*<p class="privacy-note"[^]*?<\/section>/)?.[0] || '';
  assert.match(html, /class="reveal-dossier"/);
  assert.match(html, /id="revealDossierFormat"/);
  assert.doesNotMatch(canvasStage, /reveal-dossier/);
  assert.match(revealPanel, /reveal-dossier/);
  assert.match(css, /\.control-sheet\[data-reveal-state="processing"\] \.reveal-dossier/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});
