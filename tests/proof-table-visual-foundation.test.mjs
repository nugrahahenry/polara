import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const css = fs.readFileSync(new URL('../styles/proof-table.css', import.meta.url), 'utf8');
const tokens = fs.readFileSync(new URL('../styles/tokens.css', import.meta.url), 'utf8');
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('Proof Table shell exposes a unified desktop desk and authored browser surfaces', () => {
  assert.match(css, /POLARA \/ PROOF CONTROLS/);
  assert.match(css, /::selection/);
  assert.match(css, /scrollbar-color/);
  assert.match(css, /caret-color/);
  assert.match(tokens, /--proof-desk:/);
  assert.match(tokens, /--proof-shadow-low:/);
});

test('footer remains the canonical hnry.dev identity foundation', () => {
  assert.match(html, /href="https:\/\/hnry\.dev"/);
  assert.match(html, /instagram\.com\/hnry\.dev/);
  assert.match(html, /github\.com\/nugrahahenry/);
  assert.match(html, /wa\.me\/6289513595554/);
  assert.match(css, /POLARA PRINT ROOM · LOCAL FIRST SINCE 2026/);
});
