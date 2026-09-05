import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

import { frameOverlayTemplates } from '../src/modules/templates/frame-overlays.generated.js';
import { exclusiveStickers } from '../src/modules/stickers/index.js';


const projectRoot = new URL('../', import.meta.url);
const readText = (relativePath) => fs.readFile(new URL(relativePath, projectRoot), 'utf8');
const readJson = async (relativePath) => JSON.parse(await readText(relativePath));


test('manifest defines seven complete frame family profiles', async () => {
  const manifest = await readJson('assets/frames/frame-overlay-manifest.json');
  assert.equal(manifest.familyProfileVersion, 'frame-family-v2');
  assert.equal(manifest.families.length, 7);

  const familyIds = new Set(manifest.frames.map((frame) => frame.family));
  assert.deepEqual(new Set(manifest.families.map((family) => family.id)), familyIds);

  for (const family of manifest.families) {
    assert.match(family.story, /^.{24,120}$/);
    assert.match(family.material, /^.{3,32}$/);
    assert.equal(family.palette.length, 3);
    assert.ok(family.palette.every((color) => /^#[a-f0-9]{6}$/i.test(color)));
    assert.match(family.exclusiveStickerId, /^[a-z0-9-]+-exclusive$/);
  }
});


test('generated templates carry the same family profile for Single and Strip', () => {
  assert.equal(frameOverlayTemplates.length, 16);
  const byFamily = Map.groupBy(frameOverlayTemplates, (frame) => frame.familyId);
  assert.equal(byFamily.size, 7);

  for (const [familyId, variants] of byFamily) {
    assert.ok(variants.length >= 2, familyId);
    assert.deepEqual(new Set(variants.map((frame) => frame.mode)), new Set(['single', 'strip']));
    assert.ok(variants.every((frame) => frame.familyProfile?.id === familyId));
    assert.deepEqual(variants[0].familyProfile, variants[1].familyProfile);
    assert.ok(exclusiveStickers.some((sticker) => sticker.id === variants[0].familyProfile.exclusiveStickerId));
  }
});


test('Frames exposes an accessible selected edition dossier', async () => {
  const [html, app, css] = await Promise.all([
    readText('index.html'),
    readText('src/app.js'),
    readText('styles/proof-table.css'),
  ]);

  assert.match(html, /id="frameEditionDossier"/);
  assert.match(html, /id="frameEditionName"/);
  assert.match(html, /id="frameEditionStory"/);
  assert.match(html, /id="frameEditionPalette"/);
  assert.match(html, /id="frameEditionExclusive"/);
  assert.match(app, /function renderFrameEditionDossier\(/);
  assert.match(app, /familyProfile\.exclusiveStickerId/);
  assert.match(css, /\.frame-edition-dossier/);
  assert.match(css, /\.frame-edition-palette/);
});


test('picker and sticker bench communicate family quality without changing export surfaces', async () => {
  const [app, css] = await Promise.all([
    readText('src/app.js'),
    readText('styles/proof-table.css'),
  ]);

  assert.match(app, /tpl-family-material/);
  assert.match(app, /sticker-family-match/);
  assert.match(app, /Poca match for/);
  assert.match(css, /\.tpl-family-material/);
  assert.match(css, /\.sticker-family-match/);
  assert.doesNotMatch(app, /canvasScale\.append.*frameEdition/s);
});
