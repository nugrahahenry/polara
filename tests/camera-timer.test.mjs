import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { selectShotTimer } from '../src/ui/shot-timer.js';

test('shot timer changes only before a Camera capture, including a retake', () => {
  const photos = Object.freeze([{ src: 'keep-me.jpg' }, null, null]);
  const state = Object.freeze({ step: 'camera', timer: 3, shooting: false, busy: false, retakeSlot: 0, photos });
  for (const seconds of [3, 5, 10]) assert.equal(selectShotTimer(state, seconds), seconds);
  for (const seconds of [0, 4, 11, NaN, 'not-a-timer']) assert.equal(selectShotTimer(state, seconds), null);
  assert.equal(selectShotTimer({ ...state, shooting: true }, 10), null);
  assert.equal(selectShotTimer({ ...state, busy: true }, 10), null);
  for (const step of ['start', 'review', 'frame', 'decorate', 'reveal']) {
    assert.equal(selectShotTimer({ ...state, step }, 5), null);
  }
  assert.equal(state.photos, photos);
  assert.equal(state.timer, 3);
});

test('timer belongs to Camera, not Start, and receives capture locking', async () => {
  const html = await fs.readFile(new URL('../index.html', import.meta.url), 'utf8');
  const app = await fs.readFile(new URL('../src/app.js', import.meta.url), 'utf8');
  const start = html.slice(html.indexOf('data-panel="start"'), html.indexOf('data-panel="camera"'));
  const camera = html.slice(html.indexOf('data-panel="camera"'), html.indexOf('data-panel="review"'));
  assert.doesNotMatch(start, /id="timerChoose"/);
  assert.match(camera, /id="timerChoose"/);
  assert.match(camera, /Choose before each photo/);
  assert.match(app, /selectShotTimer\(state, button.dataset.timer\)/);
  assert.match(app, /button.disabled = state.shooting \|\| state.busy/);
  assert.match(app, /function updateActions\(\)[\s\S]*?syncTimerControls\(\);\s*\n}/);
});
