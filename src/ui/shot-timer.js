const SHOT_TIMERS = Object.freeze([3, 5, 10]);

export function selectShotTimer(state, value) {
  if (!state || state.step !== 'camera' || state.shooting || state.busy) return null;
  const seconds = Number(value);
  return SHOT_TIMERS.includes(seconds) ? seconds : null;
}
