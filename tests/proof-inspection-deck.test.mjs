import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';


const css = await fs.readFile(
  new URL('../styles/proof-table.css', import.meta.url),
  'utf8',
);
const tokens = await fs.readFile(
  new URL('../styles/tokens.css', import.meta.url),
  'utf8',
);
const app = await fs.readFile(
  new URL('../src/app.js', import.meta.url),
  'utf8',
);


test('frame picker is a single horizontal proof rail without nested vertical scrolling', () => {
  assert.match(css, /#templateList\s*\{[^}]*grid-auto-flow:\s*column;/s);
  assert.match(css, /#templateList\s*\{[^}]*grid-auto-columns:/s);
  assert.match(css, /#templateList\s*\{[^}]*overflow-x:\s*auto;/s);
  assert.match(css, /#templateList\s*\{[^}]*overflow-y:\s*hidden;/s);
  assert.match(css, /#templateList\s*\{[^}]*scroll-snap-type:\s*x\s+proximity;/s);
  assert.doesNotMatch(css, /#templateList\s*\{[^}]*grid-template-columns:\s*repeat\(2/s);
  assert.doesNotMatch(css, /#templateList\s*\{[^}]*max-height:\s*180px/s);
});


test('frame rail persists its horizontal position per collection across steps', () => {
  assert.match(app, /scroll:\s*\{\s*frameX:\s*0,/);
  assert.match(app, /state\.scroll\.frameX\s*=\s*refs\.templateList\.scrollLeft/);
  assert.match(app, /state\.scroll\.frameByCollection\[state\.frameCollectionId\]\s*=\s*refs\.templateList\.scrollLeft/);
  assert.match(app, /state\.scroll\.frameByCollection\[state\.frameCollectionId\]\s*\?\?/);
  assert.doesNotMatch(app, /state\.scroll\.frame\s*=\s*refs\.templateList\.scrollTop/);
});


test('inspection deck is UI-only and follows the active proof mode', () => {
  assert.match(tokens, /--proof-mat:/);
  assert.match(tokens, /--proof-registration:/);
  assert.match(app, /refs\.canvasView\.dataset\.proofMode\s*=\s*template\.mode/);
  assert.match(
    css,
    /\.canvas-stage\[data-proof-mode\]::before,\s*\.canvas-stage\[data-proof-mode\]::after\s*\{[^}]*pointer-events:\s*none;/s,
  );
  assert.match(css, /\.canvas-stage\[data-proof-mode\]::before\s*\{/);
  assert.match(css, /\.canvas-stage\[data-proof-mode="strip"\]\s*\{/);
  assert.match(css, /\.canvas-stage\[data-proof-mode="single"\]\s*\{/);
  assert.match(css, /#canvasScale\s*\{[^}]*z-index:\s*3;/s);
});
