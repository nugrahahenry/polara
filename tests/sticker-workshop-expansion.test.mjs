import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  exclusiveStickers,
  stickers,
  universalStickers,
} from '../src/modules/stickers/index.js';
import {
  getStickerBenchView,
  getStickerCategoryLabel,
} from '../src/ui/decorate-workshop.js';


const NEW_STICKERS = new Map([
  ['mini-ribbon', 'prop'],
  ['cloud-note', 'charm'],
  ['ticket-stub', 'prop'],
  ['proof-tape', 'material'],
  ['confetti-pop', 'accent'],
  ['best-day', 'word'],
]);
const ALLOWED_CATEGORIES = new Set(['word', 'charm', 'prop', 'accent', 'material', 'exclusive']);


test('Sticker Workshop ships six purposeful additions and complete category metadata', () => {
  assert.equal(universalStickers.length, 19);
  assert.equal(exclusiveStickers.length, 7);
  assert.equal(stickers.length, 26);

  for (const asset of stickers) {
    assert.ok(ALLOWED_CATEGORIES.has(asset.category), `${asset.id}: ${asset.category}`);
  }
  for (const [id, category] of NEW_STICKERS) {
    const asset = universalStickers.find((item) => item.id === id);
    assert.ok(asset, id);
    assert.equal(asset.category, category, id);
    assert.ok(fs.existsSync(new URL(`../${asset.src}`, import.meta.url)), asset.src);
  }
});


test('Sticker bench exposes a human category label for the active asset', () => {
  assert.equal(getStickerCategoryLabel('material'), 'Proof material');
  const view = getStickerBenchView([{
    uid: 'tape-1',
    assetId: 'proof-tape',
    name: 'Proof Tape',
    category: 'material',
    src: 'assets/stickers/proof-tape.png',
  }], 'tape-1');
  assert.equal(view.active.categoryLabel, 'Proof material');
});


test('Decorate rail renders category copy without adding another scroll container', () => {
  const app = fs.readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
  const css = fs.readFileSync(new URL('../styles/proof-table.css', import.meta.url), 'utf8');
  assert.match(app, /className = 'sticker-kind'/);
  assert.match(css, /\.sticker-kind/);
  assert.doesNotMatch(css, /\.sticker-kind[^}]*overflow/);
});
