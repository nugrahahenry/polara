import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

import {
  getFamilyProofTheme,
  getRailWindow,
} from '../src/ui/asset-rail.js';


const projectRoot = new URL('../', import.meta.url);
const readText = (relativePath) => fs.readFile(new URL(relativePath, projectRoot), 'utf8');


test('rail window reports visible items and physical scroll edges', () => {
  const items = [
    { start: 0, end: 140 },
    { start: 150, end: 290 },
    { start: 300, end: 440 },
    { start: 450, end: 590 },
  ];

  assert.deepEqual(getRailWindow({
    scrollLeft: 0,
    scrollWidth: 590,
    clientWidth: 300,
    items,
  }), {
    first: 0,
    last: 1,
    total: 4,
    atStart: true,
    atEnd: false,
  });

  assert.deepEqual(getRailWindow({
    scrollLeft: 290,
    scrollWidth: 590,
    clientWidth: 300,
    items,
  }), {
    first: 2,
    last: 3,
    total: 4,
    atStart: false,
    atEnd: true,
  });
});


test('family proof theme creates a bounded UI-only wash from manifest colors', () => {
  assert.deepEqual(getFamilyProofTheme({
    palette: ['#ec5e9e', '#8fd3ff', '#ffe26f'],
  }), {
    accent: '#ec5e9e',
    secondary: '#8fd3ff',
    wash: '#ec5e9e18',
  });

  assert.deepEqual(getFamilyProofTheme(null), {
    accent: '#ff8fbd',
    secondary: '#8fd3ff',
    wash: '#ff8fbd18',
  });
});


test('Frames and Decorate expose visible rail wayfinding without new export surfaces', async () => {
  const [html, app, css] = await Promise.all([
    readText('index.html'),
    readText('src/app.js'),
    readText('styles/proof-table.css'),
  ]);

  assert.match(html, /id="frameRailPosition"/);
  assert.match(html, /id="frameRailProgress"/);
  assert.match(html, /id="frameRailShell"[^>]*class="asset-rail-shell"/);
  assert.match(html, /id="stickerRailPosition"/);
  assert.match(html, /id="stickerRailProgress"/);
  assert.match(html, /id="stickerRailShell"[^>]*class="asset-rail-shell"/);
  assert.match(app, /function syncRailWayfinding\(/);
  assert.match(app, /aria-posinset/);
  assert.match(app, /--frame-family-accent/);
  assert.match(css, /\.asset-rail-shell/);
  assert.match(css, /--frame-family-accent/);
  assert.doesNotMatch(app, /canvasScale\.append.*Rail/s);
});


test('sticker cards reserve readable space for two-line names and family match copy', async () => {
  const css = await readText('styles/proof-table.css');
  assert.match(css, /\.sticker-label\s*\{[^}]*-webkit-line-clamp:\s*2;/s);
  assert.match(css, /\.sticker-family-match\s*\{[^}]*white-space:\s*normal;/s);
  assert.match(css, /\.sticker-btn\s*\{[^}]*min-height:\s*148px;/s);
});
