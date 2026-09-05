import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

import { frameOverlayTemplates, frameCollections } from '../src/modules/templates/frame-overlays.generated.js';
import {
  ALL_FRAME_COLLECTION_ID,
  buildFrameCollectionOptions,
  filterFramesByCollection,
  getFrameFamilyEditionCount,
} from '../src/ui/frame-collections.js';


const projectRoot = new URL('../', import.meta.url);
const readText = (relativePath) => fs.readFile(new URL(relativePath, projectRoot), 'utf8');
const readJson = async (relativePath) => JSON.parse(await readText(relativePath));


test('every frame family resolves to exactly one canonical collection', async () => {
  const manifest = await readJson('assets/frames/frame-overlay-manifest.json');
  assert.equal(manifest.collectionProfileVersion, 'frame-collection-v1');
  assert.equal(manifest.familyProfileVersion, 'frame-family-v3');
  assert.equal(manifest.collections.length, 3);
  assert.equal(frameCollections.length, 3);

  const collectionIds = new Set(manifest.collections.map((collection) => collection.id));
  for (const family of manifest.families) {
    assert.ok(collectionIds.has(family.collectionId), family.id);
  }
});


test('collection options and filters keep All editions complete for each format', () => {
  const single = frameOverlayTemplates.filter((frame) => frame.mode === 'single');
  const strip = frameOverlayTemplates.filter((frame) => frame.mode === 'strip');
  const singleOptions = buildFrameCollectionOptions(frameCollections, single);

  assert.equal(singleOptions[0].id, ALL_FRAME_COLLECTION_ID);
  assert.equal(singleOptions[0].count, 8);
  assert.equal(filterFramesByCollection(single, ALL_FRAME_COLLECTION_ID).length, 8);
  assert.equal(filterFramesByCollection(strip, ALL_FRAME_COLLECTION_ID).length, 8);
  assert.deepEqual(singleOptions.slice(1).map((option) => option.count), [4, 3, 1]);
});


test('family edition count follows the active format', () => {
  const blueberrySingle = frameOverlayTemplates.find((frame) => frame.id === 'poca-purikura-blue.single');
  const dailySingle = frameOverlayTemplates.find((frame) => frame.id === 'polara-daily-single');
  assert.equal(getFrameFamilyEditionCount(frameOverlayTemplates, blueberrySingle), 2);
  assert.equal(getFrameFamilyEditionCount(frameOverlayTemplates, dailySingle), 1);
});


test('Frames exposes UI-only collection navigation and selected edition context', async () => {
  const [html, app, css] = await Promise.all([
    readText('index.html'),
    readText('src/app.js'),
    readText('styles/proof-table.css'),
  ]);

  assert.match(html, /id="frameCollectionFilters"/);
  assert.match(html, /id="frameEditionCollection"/);
  assert.match(html, /id="frameEditionShelfState"/);
  assert.match(app, /frameCollectionId:\s*ALL_FRAME_COLLECTION_ID/);
  assert.match(app, /scroll:\s*\{[^}]*frameByCollection:/s);
  assert.match(app, /filterFramesByCollection/);
  assert.match(css, /\.frame-collection-filters/);
  assert.doesNotMatch(app, /canvasScale\.append.*frameCollection/s);
});
