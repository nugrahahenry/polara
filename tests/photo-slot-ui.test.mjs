import test from 'node:test';
import assert from 'node:assert/strict';

import { getPhotoSlotPresentation } from '../src/modules/templates/photo-slot-ui.js';

test('slot kosong tetap terlihat tetapi tidak selectable', () => {
  assert.deepEqual(
    getPhotoSlotPresentation({ photo: null, index: 1, selectedSlot: 0, interactive: true }),
    {
      state: 'empty', selectable: false, current: false, tabIndex: -1,
      label: 'Photo 2 waiting for capture',
    },
  );
});

test('slot terisi hanya aktif di editor dan satu slot current', () => {
  const active = getPhotoSlotPresentation({ photo: { src: 'photo' }, index: 0, selectedSlot: 0, interactive: true });
  const filled = getPhotoSlotPresentation({ photo: { src: 'photo' }, index: 1, selectedSlot: 0, interactive: true });
  const preview = getPhotoSlotPresentation({ photo: { src: 'photo' }, index: 0, selectedSlot: 0, interactive: false });
  assert.equal(active.state, 'active');
  assert.equal(active.current, true);
  assert.equal(filled.state, 'filled');
  assert.equal(filled.current, false);
  assert.equal(preview.selectable, false);
});
