import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';


const html = await fs.readFile(new URL('../index.html', import.meta.url), 'utf8');
const app = await fs.readFile(new URL('../src/app.js', import.meta.url), 'utf8');
const css = await fs.readFile(new URL('../styles/proof-table.css', import.meta.url), 'utf8');


test('Polara opens with a bounded Poca print room sequence', () => {
  assert.match(html, /id="bootScreen"/);
  assert.match(html, /class="boot-poca"[^>]*poca-excited-jump\.png/);
  assert.match(html, /role="status"/);
  assert.match(html, /Poca is opening the print room/);
  assert.match(app, /startBootScreen/);
  assert.match(app, /finishBootScreen/);
  assert.match(css, /\.boot-screen\.is-opening/);
});


test('opening sequence protects focus and respects reduced motion', () => {
  assert.match(app, /setAppInert\(true\)/);
  assert.match(app, /setAppInert\(false\)/);
  assert.match(app, /querySelectorAll\('\.skip-link, \.app-header/);
  assert.match(app, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /@media \(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.boot-screen/);
});


test('boot fail safe remains armed until initialization finishes', () => {
  const start = app.slice(app.indexOf('function startBootScreen'), app.indexOf('async function finishBootScreen'));
  const finish = app.slice(app.indexOf('async function finishBootScreen'), app.indexOf('const bootState'));
  assert.doesNotMatch(start, /clearTimeout\(window\.__polaraBootFallback\)/);
  assert.match(finish, /clearTimeout\(window\.__polaraBootFallback\)/);
});


test('public application copy contains no em dash or en dash', () => {
  for (const [name, source] of [['index.html', html], ['src/app.js', app]]) {
    assert.doesNotMatch(source, /[\u2013\u2014]/, `${name} contains a long dash`);
  }
});
