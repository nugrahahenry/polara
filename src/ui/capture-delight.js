function normalizedMode(mode) {
  return Number(mode) === 3 ? 3 : 1;
}


export function getCaptureMomentCopy({ slotIndex = 0, mode = 1, retake = false } = {}) {
  const total = normalizedMode(mode);
  const photo = Math.min(total, Math.max(1, Number(slotIndex) + 1 || 1));
  return {
    proofLabel: `Photo ${photo} of ${total}`,
    countdownCue: retake ? 'The original stays safe' : 'Hold this pose',
    receipt: retake ? `Photo ${photo} replaced` : `Photo ${photo} saved`,
  };
}
