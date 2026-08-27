import test from 'node:test';
import assert from 'node:assert/strict';

import {
  exclusiveStickers,
  getStickerPack,
  stickers,
} from '../src/modules/stickers/index.js';


const FAMILIES = [
  'poca-purikura',
  'vintage-film-lofi',
  'seoul-snap-y2k',
  'polara-daily',
  'polara-midnight-club',
  'cloud-picnic',
  'lucky-ticket',
];


test('setiap keluarga memiliki tepat satu Poca exclusive tanpa menggandakan katalog universal', () => {
  assert.equal(stickers.length, 20);
  assert.equal(exclusiveStickers.length, 7);
  assert.deepEqual(
    new Set(exclusiveStickers.map((asset) => asset.exclusiveFamilyId)),
    new Set(FAMILIES),
  );

  FAMILIES.forEach((familyId) => {
    const pack = getStickerPack(familyId);
    assert.equal(pack.length, 14, familyId);
    assert.equal(pack[0].exclusiveFamilyId, familyId, familyId);
    assert.equal(pack[0].pickerBadge, 'Exclusive', familyId);
    assert.ok(pack.slice(1).every((asset) => !asset.exclusiveFamilyId), familyId);
  });
});


test('keluarga tak dikenal hanya menerima katalog universal', () => {
  const pack = getStickerPack('unknown-family');
  assert.equal(pack.length, 13);
  assert.ok(pack.every((asset) => !asset.exclusiveFamilyId));
});


test('exclusive adalah opsi katalog dan instance tidak menyimpan pembatas keluarga', () => {
  exclusiveStickers.forEach((asset) => {
    assert.match(asset.src, /^assets\/stickers\/[a-z0-9-]+-exclusive\.png$/);
    assert.equal(asset.exportPolicy, 'preview-and-export');
  });
});
