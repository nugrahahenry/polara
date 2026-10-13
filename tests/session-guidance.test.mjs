import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = (file) => fs.readFile(new URL(`../${file}`, import.meta.url), 'utf8');

test('decorative local labels are removed while demo and privacy stay explicit', async () => {
  const [html, app] = await Promise.all([read('index.html'), read('src/app.js')]);
  assert.doesNotMatch(html, /Local photos|Local session|LOCAL SESSION 06|Studio note 06/);
  assert.match(html, /id="privacyDialog"/);
  assert.match(html, /Nothing is uploaded, and no account is needed/);
  assert.match(app, /Demo mode uses sample photos, not your camera\./);
  assert.match(app, /cameraBayLabel\.textContent = demo \? 'Demo photos' : 'Live camera'/);
});

test('Start guidance does not offer a timer before Camera', async () => {
  const [html, app] = await Promise.all([read('index.html'), read('src/app.js')]);
  for (const source of [html, app]) {
    assert.match(source, /Choose a format, then open the camera when ready\./);
    assert.doesNotMatch(source, /Choose a format and timer/);
  }
  assert.match(app, /New session ready\. Choose a format to get started\./);
});

test('Decorate entry guidance works for frames without captions', async () => {
  const app = await read('src/app.js');
  assert.match(app, /goToStep\('decorate', 'Add stickers to your print\. Photos and frame stay as they are when you go back\.'\)/);
  assert.doesNotMatch(app, /Add a caption and stickers/);
});

test('sticker handles use the same language as their editing instructions', async () => {
  const compositor = await read('src/core/compositor.js');
  for (const label of ['Remove sticker', 'Rotate sticker', 'Resize sticker']) {
    assert.ok(compositor.includes(`'${label}'`));
  }
  assert.doesNotMatch(compositor, /Hapus sticker|Putar sticker|Ubah ukuran sticker/);
});
