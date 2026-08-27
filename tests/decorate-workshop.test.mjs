import test from 'node:test';
import assert from 'node:assert/strict';

import { getStickerBenchView } from '../src/ui/decorate-workshop.js';


const poseOne = {
  uid: 'pose-1',
  assetId: 'text-pose',
  name: 'POSE!',
  category: 'word',
  src: 'assets/stickers/text-pose.png',
};
const poseTwo = { ...poseOne, uid: 'pose-2' };
const sparkle = {
  uid: 'sparkle-1',
  assetId: 'sparkle-blue',
  name: 'Sparkle Biru',
  src: 'assets/stickers/sparkle-blue.png',
};


test('empty sticker bench has a stable invitation state', () => {
  assert.deepEqual(getStickerBenchView([], null), {
    count: 0,
    state: 'empty',
    status: 'Sticker bench · No stickers yet',
    active: null,
  });
});


test('placed sticker count remains useful when nothing is selected', () => {
  assert.deepEqual(getStickerBenchView([poseOne], null), {
    count: 1,
    state: 'placed',
    status: 'Sticker bench · 1 sticker placed',
    active: null,
  });
  assert.equal(
    getStickerBenchView([poseOne, sparkle], null).status,
    'Sticker bench · 2 stickers placed',
  );
});


test('active repeated sticker receives an ordinal derived from current instances', () => {
  const view = getStickerBenchView([poseOne, sparkle, poseTwo], poseTwo.uid);

  assert.equal(view.count, 3);
  assert.equal(view.state, 'editing');
  assert.equal(view.status, 'Sticker bench · Editing POSE!');
  assert.deepEqual(view.active, {
    uid: 'pose-2',
    name: 'POSE!',
    src: 'assets/stickers/text-pose.png',
    categoryLabel: 'Word sticker',
    instanceLabel: 'POSE! · 2 of 2',
  });
});


test('stale selection falls back to placed state without exposing stale data', () => {
  const view = getStickerBenchView([poseOne], 'deleted-sticker');

  assert.equal(view.state, 'placed');
  assert.equal(view.status, 'Sticker bench · 1 sticker placed');
  assert.equal(view.active, null);
});
