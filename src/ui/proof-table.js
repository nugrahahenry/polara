export const PROOF_STEPS = Object.freeze([
  { id: 'start', label: 'Start' },
  { id: 'camera', label: 'Camera' },
  { id: 'review', label: 'Review' },
  { id: 'frame', label: 'Frames' },
  { id: 'decorate', label: 'Decorate' },
  { id: 'reveal', label: 'Reveal' },
]);

const POCA = Object.freeze({
  start: { id: 'poca-excited-jump', src: 'assets/mascot/poca-excited-jump.png', alt: 'Poca jumps excitedly.' },
  camera: { id: 'poca-camera', src: 'assets/mascot/poca-camera.png', alt: 'Poca is ready with a camera.' },
  review: { id: 'poca-peeking', src: 'assets/mascot/poca-peeking.png', alt: 'Poca peeks at your proofs.' },
  frame: { id: 'poca-holding-photo-frame', src: 'assets/mascot/poca-holding-photo-frame.png', alt: 'Poca holds a photo frame.' },
  decorateEmpty: { id: 'poca-decorate-guide', src: 'assets/mascot/poca-decorate-guide.png', alt: 'Poca shows where to decorate.' },
  decorateReady: { id: 'poca-peeking', src: 'assets/mascot/poca-peeking.png', alt: 'Poca peeks at your decorated proof.' },
  processing: { id: 'poca-sleepy-loading', src: 'assets/mascot/poca-sleepy-loading.png', alt: 'Poca waits while your print develops.' },
  revealReady: { id: 'poca-proof-approved', src: 'assets/mascot/poca-proof-approved.png', alt: 'Poca approves your finished proof.' },
});

export const PRIVACY_POCA = Object.freeze({
  id: 'poca-privacy-guardian',
  src: 'assets/mascot/poca-privacy-guardian.png',
  alt: 'Poca guards your private photos.',
  exportPolicy: 'ui-only',
});

export function getProofStepStatus(state, stepId) {
  const activeIndex = PROOF_STEPS.findIndex((step) => step.id === state.step);
  const itemIndex = PROOF_STEPS.findIndex((step) => step.id === stepId);
  if (itemIndex < 0 || activeIndex < 0) return 'upcoming';
  if (state.step === 'reveal' && state.revealReady) return 'complete';
  if (itemIndex < activeIndex) return 'complete';
  if (itemIndex === activeIndex) return 'current';
  return 'upcoming';
}

export function selectActiveProof(state, requestedIndex) {
  const lastIndex = state.mode === 3 ? 2 : 0;
  const numericIndex = Number.isFinite(Number(requestedIndex)) ? Math.trunc(Number(requestedIndex)) : 0;
  const selectedSlot = Math.min(lastIndex, Math.max(0, numericIndex));
  return { ...state, activeSlot: selectedSlot, selectedSlot };
}

export function getPocaForState(state) {
  let asset;
  if (state.processing) asset = POCA.processing;
  else if (state.step === 'start') asset = POCA.start;
  else if (state.step === 'camera') asset = POCA.camera;
  else if (state.step === 'review') asset = POCA.review;
  else if (state.step === 'frame') asset = POCA.frame;
  else if (state.step === 'decorate') asset = state.stickerCount > 0 ? POCA.decorateReady : POCA.decorateEmpty;
  else if (state.step === 'reveal') asset = state.revealReady ? POCA.revealReady : POCA.processing;
  else asset = POCA.start;
  return { ...asset, exportPolicy: 'ui-only' };
}
