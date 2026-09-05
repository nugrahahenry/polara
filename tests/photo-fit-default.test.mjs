import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createPhotoRecord,
  initializePhotoForFrame,
  patchPhotoTransform,
  resetPhotoTransform,
} from '../src/core/photo-geometry.js';


test('a fresh proof fills the frame on its first Frames entry', () => {
  const source = createPhotoRecord({ src: 'photo', naturalWidth: 1600, naturalHeight: 900 });
  const initialized = initializePhotoForFrame(source);

  assert.equal(source.fit, 'contain');
  assert.equal(source.frameFitInitialized, false);
  assert.equal(initialized.fit, 'cover');
  assert.equal(initialized.frameFitInitialized, true);
});


test('returning to Frames preserves a manual Full photo choice', () => {
  const initialized = initializePhotoForFrame(
    createPhotoRecord({ src: 'photo', naturalWidth: 1600, naturalHeight: 900 }),
  );
  const manual = patchPhotoTransform(initialized, { fit: 'contain' });

  assert.equal(initializePhotoForFrame(manual), manual);
  assert.equal(initializePhotoForFrame(manual).fit, 'contain');
});


test('Reset proof keeps the first-entry marker while restoring Full photo', () => {
  const initialized = initializePhotoForFrame(
    createPhotoRecord({ src: 'photo', naturalWidth: 1600, naturalHeight: 900 }),
  );
  const reset = resetPhotoTransform(initialized);

  assert.equal(reset.fit, 'contain');
  assert.equal(reset.frameFitInitialized, true);
  assert.equal(initializePhotoForFrame(reset).fit, 'contain');
});
