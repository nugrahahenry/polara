export const SHOT_TIMERS = Object.freeze([3, 5, 10]);

export function selectShotTimer(state, value) {
  if (!state || state.step !== 'camera' || state.shooting || state.busy) return null;
  const seconds = Number(value);
  return SHOT_TIMERS.includes(seconds) ? seconds : null;
}

export function getShotTimerFeedback({ timer = 3, shooting = false, busy = false } = {}) {
  if (shooting) return 'Taking photo. Timer changes are paused.';
  if (busy) return 'Getting ready. Timer choices will be available shortly.';
  return String(timer) + '-second delay. Ready when you are.';
}

export async function runShotCountdown(seconds, {
  now = () => Date.now(),
  wait = (duration) => new Promise((resolve) => setTimeout(resolve, duration)),
  onTick = () => {},
  isCancelled = () => false,
} = {}) {
  const duration = Number(seconds);
  if (!SHOT_TIMERS.includes(duration)) throw new RangeError('Unsupported shot timer.');

  const startedAt = now();
  let lastRemaining = null;
  while (true) {
    if (isCancelled()) {
      const error = new Error('Countdown was cancelled.');
      error.name = 'AbortError';
      throw error;
    }

    const elapsed = Math.max(0, now() - startedAt);
    const remaining = duration - Math.floor(elapsed / 1000);
    if (remaining <= 0) return;
    if (remaining !== lastRemaining) {
      lastRemaining = remaining;
      onTick(remaining);
    }

    const nextBoundary = (Math.floor(elapsed / 1000) + 1) * 1000;
    await wait(Math.max(1, nextBoundary - elapsed));
  }
}
