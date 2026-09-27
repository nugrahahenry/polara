import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = (file) => fs.readFile(new URL(`../${file}`, import.meta.url), 'utf8');

test('frame preview lets users select a photo directly from the center canvas', async () => {
  const app = await read('src/app.js');
  const html = await read('index.html');

  assert.match(app, /bindCanvasPhotoSelection\(phCanvas\)/);
  assert.match(app, /slot\.addEventListener\('click', select\)/);
  assert.match(app, /slot\.addEventListener\('keydown'/);
  assert.match(app, /Choose Full photo or Fill frame/);
  assert.match(html, /You can also click a photo in the preview\./);
});

test('direct photo selection stays UI-only and updates the selected photo controls', async () => {
  const app = await read('src/app.js');

  assert.match(app, /setActiveProof\(index\);[\s\S]*renderPhotoTabs\(\);[\s\S]*syncPhotoControls\(\);/);
  assert.match(app, /slot\.setAttribute\('role', 'button'\)/);
  assert.match(app, /slot\.setAttribute\('aria-label', `Select photo/);
});
