import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { selectShotTimer, runShotCountdown, getShotTimerFeedback } from '../src/ui/shot-timer.js';

test('3, 5, and 10 second countdowns preserve the actual time to pose', async () => {
  for (const seconds of [3, 5, 10]) {
    let elapsed = 0;
    const ticks = [];
    await runShotCountdown(seconds, {
      now: () => elapsed,
      wait: async (duration) => { elapsed += duration; },
      onTick: (value) => ticks.push(value),
    });
    assert.equal(elapsed, seconds * 1000);
    assert.deepEqual(ticks, Array.from({ length: seconds }, (_, i) => seconds - i));
  }
});

test('countdown uses elapsed time when a browser callback arrives late', async () => {
  let elapsed = 0;
  const ticks = [];
  await runShotCountdown(5, {
    now: () => elapsed,
    wait: async (duration) => { elapsed += duration + 1200; },
    onTick: (value) => ticks.push(value),
  });
  assert.deepEqual(ticks, [5, 3, 1]);
  assert.ok(elapsed >= 5000);
  assert.ok(elapsed < 7000);
});

test('countdown aborts before capture, even when cancelled during its final wait', async () => {
  for (const cancelAt of [0, 1000, 3000]) {
    let elapsed = 0;
    await assert.rejects(runShotCountdown(3, {
      now: () => elapsed,
      wait: async (duration) => { elapsed += duration; },
      onTick: () => {},
      isCancelled: () => elapsed >= cancelAt,
    }), { name: 'AbortError' });
    assert.equal(elapsed, cancelAt);
  }
  await assert.rejects(runShotCountdown(4), { name: 'RangeError' });
});

test('timer feedback distinguishes a selected delay, capture lock, and transition', () => {
  assert.equal(getShotTimerFeedback({ timer: 5 }), '5-second delay. Ready when you are.');
  assert.equal(getShotTimerFeedback({ timer: 10, shooting: true }), 'Taking photo. Timer changes are paused.');
  assert.equal(getShotTimerFeedback({ timer: 3, busy: true }), 'Getting ready. Timer choices will be available shortly.');
});

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
  assert.match(camera, /id="timerSelection"/);
  assert.match(camera, /aria-describedby="timerHelp timerSelection"/);
  assert.match(camera, /Choose before each photo/);
  assert.match(app, /selectShotTimer\(state, button.dataset.timer\)/);
  assert.match(app, /button.disabled = state.shooting \|\| state.busy/);
  assert.match(app, /await runShotCountdown\(seconds,/);
  const countdown = app.slice(app.indexOf('async function runCountdown'), app.indexOf('function flash'));
  assert.doesNotMatch(countdown, /reducedMotion/);
  assert.match(app, /function updateActions\(\)[\s\S]*?syncTimerControls\(\);\s*\n}/);
});
