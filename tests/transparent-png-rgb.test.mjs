import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

import {
  countTransparentRgb,
  decodeRgbaPng,
} from '../scripts/lib/png-rgba.mjs';


const manifest = JSON.parse(
  await fs.readFile(new URL('../assets/frames/frame-overlay-manifest.json', import.meta.url), 'utf8'),
);

test('runtime overlays do not retain source RGB inside fully transparent pixels', async () => {
  assert.equal(manifest.frames.length, 16);
  const contaminatedOverlays = [];

  for (const frame of manifest.frames) {
    const png = await fs.readFile(new URL(`../${frame.overlaySrc}`, import.meta.url));
    const decoded = decodeRgbaPng(png);
    const { transparentPixels, transparentPixelsWithRgb } = countTransparentRgb(decoded.pixels);

    assert.ok(transparentPixels > 0, `${frame.id} harus memiliki photo window transparan.`);
    if (transparentPixelsWithRgb > 0) {
      contaminatedOverlays.push(`${frame.id}: ${transparentPixelsWithRgb}`);
    }
  }

  assert.deepEqual(
    contaminatedOverlays,
    [],
    `Overlay menyimpan piksel RGB tersembunyi di bawah alpha 0:\n${contaminatedOverlays.join('\n')}`,
  );
});

test('runtime stickers do not retain RGB inside fully transparent pixels', async () => {
  const stickerDirectory = new URL('../assets/stickers/', import.meta.url);
  const stickerFiles = (await fs.readdir(stickerDirectory))
    .filter((file) => path.extname(file).toLowerCase() === '.png')
    .sort();
  assert.equal(stickerFiles.length, 26);

  const contaminatedStickers = [];
  for (const file of stickerFiles) {
    const png = await fs.readFile(new URL(file, stickerDirectory));
    const decoded = decodeRgbaPng(png);
    const { transparentPixels, transparentPixelsWithRgb } = countTransparentRgb(decoded.pixels);
    assert.ok(transparentPixels > 0, `${file} harus memiliki background transparan.`);
    if (transparentPixelsWithRgb > 0) {
      contaminatedStickers.push(`${file}: ${transparentPixelsWithRgb}`);
    }
  }

  assert.deepEqual(
    contaminatedStickers,
    [],
    `Sticker menyimpan piksel RGB tersembunyi di bawah alpha 0:\n${contaminatedStickers.join('\n')}`,
  );
});

test('runtime Pose Mate guests have clean transparent backgrounds', async () => {
  const guestDirectory = new URL('../assets/guests/', import.meta.url);
  const guestFiles = (await fs.readdir(guestDirectory))
    .filter((file) => file.endsWith('.png'))
    .sort();
  assert.deepEqual(guestFiles, [
    'polara-pm-01-half-heart.png',
    'polara-pm-01-neutral.png',
    'polara-pm-01-peace.png',
    'polara-pm-02-half-heart.png',
    'polara-pm-02-neutral.png',
    'polara-pm-02-peace.png',
  ]);

  const contaminatedGuests = [];
  for (const file of guestFiles) {
    const png = await fs.readFile(new URL(file, guestDirectory));
    const decoded = decodeRgbaPng(png);
    const { transparentPixels, transparentPixelsWithRgb } = countTransparentRgb(decoded.pixels);
    assert.equal(decoded.width, 1254);
    assert.equal(decoded.height, 1254);
    assert.ok(transparentPixels > 1_000_000, `${file} harus mempertahankan background transparan dominan.`);
    if (transparentPixelsWithRgb > 0) contaminatedGuests.push(`${file}: ${transparentPixelsWithRgb}`);
  }

  assert.deepEqual(
    contaminatedGuests,
    [],
    `Guest menyimpan RGB tersembunyi di bawah alpha 0:\n${contaminatedGuests.join('\n')}`,
  );
});
