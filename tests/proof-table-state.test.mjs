import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PROOF_STEPS,
  getProofStepStatus,
  getPocaForState,
  selectActiveProof,
} from '../src/ui/proof-table.js';


test('rail membedakan tahap complete, current, dan upcoming tanpa centang teks', () => {
  assert.deepEqual(PROOF_STEPS.map((step) => step.label), [
    'Start', 'Camera', 'Review', 'Frames', 'Decorate', 'Reveal',
  ]);

  assert.equal(getProofStepStatus({ step: 'review', revealReady: false }, 'camera'), 'complete');
  assert.equal(getProofStepStatus({ step: 'review', revealReady: false }, 'review'), 'current');
  assert.equal(getProofStepStatus({ step: 'review', revealReady: false }, 'frame'), 'upcoming');
  assert.equal(getProofStepStatus({ step: 'reveal', revealReady: true }, 'reveal'), 'complete');
});


test('memilih active proof tidak menghapus atau memutasi isi slot lain', () => {
  const photos = [
    { src: 'one', transform: { scale: 1.1, x: 0.2, y: 0.3 } },
    { src: 'two', transform: { scale: 1.2, x: 0.4, y: 0.5 } },
    { src: 'three', transform: { scale: 1.3, x: 0.6, y: 0.7 } },
  ];
  const stickers = [{ uid: 'heart-1', assetId: 'heart-pink' }];
  const original = {
    mode: 3,
    activeSlot: 2,
    selectedSlot: 2,
    photos,
    frameId: 'poca-purikura.strip',
    stickers,
  };

  const next = selectActiveProof(original, 0);

  assert.notEqual(next, original);
  assert.equal(next.activeSlot, 0);
  assert.equal(next.selectedSlot, 0);
  assert.equal(next.photos, photos);
  assert.equal(next.stickers, stickers);
  assert.equal(next.frameId, 'poca-purikura.strip');
  assert.equal(original.activeSlot, 2);
  assert.equal(original.selectedSlot, 2);
});


test('active proof dibatasi oleh mode sehingga Single tidak memilih slot tersembunyi', () => {
  assert.equal(selectActiveProof({ mode: 1, activeSlot: 0, selectedSlot: 0 }, 2).selectedSlot, 0);
  assert.equal(selectActiveProof({ mode: 3, activeSlot: 0, selectedSlot: 0 }, -1).selectedSlot, 0);
  assert.equal(selectActiveProof({ mode: 3, activeSlot: 0, selectedSlot: 0 }, 99).selectedSlot, 2);
});


test('Poca mengikuti state produksi dan processing selalu memakai Sleepy Loading', () => {
  const cases = [
    [{ step: 'start' }, 'poca-excited-jump'],
    [{ step: 'camera' }, 'poca-camera'],
    [{ step: 'review' }, 'poca-peeking'],
    [{ step: 'frame' }, 'poca-holding-photo-frame'],
    [{ step: 'decorate', stickerCount: 0 }, 'poca-decorate-guide'],
    [{ step: 'decorate', stickerCount: 1 }, 'poca-peeking'],
    [{ step: 'reveal', processing: true, revealReady: false }, 'poca-sleepy-loading'],
    [{ step: 'reveal', processing: false, revealReady: true }, 'poca-proof-approved'],
  ];

  cases.forEach(([state, expected]) => {
    assert.equal(getPocaForState(state).id, expected, JSON.stringify(state));
    assert.equal(getPocaForState(state).exportPolicy, 'ui-only', JSON.stringify(state));
  });
});
