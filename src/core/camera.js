// ─── core/camera.js ──────────────────────────────────────────────────────────
// Kelola webcam dan capture source-preserving. Preview boleh di-mirror, tetapi
// data capture selalu berupa frame penuh yang tidak di-crop permanen.
import { createPhotoRecord } from './photo-geometry.js';

let _stream = null;

export async function startCamera(videoEl, facingMode = 'user') {
  if (!navigator.mediaDevices?.getUserMedia) {
    const error = new Error('Browser ini tidak menyediakan akses kamera.');
    error.name = 'NotSupportedError';
    throw error;
  }

  stopCamera();
  _stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1920 } },
    audio: false,
  });
  videoEl.srcObject = _stream;
  await videoEl.play();
  return _stream;
}

export function stopCamera() {
  if (!_stream) return;
  _stream.getTracks().forEach((track) => track.stop());
  _stream = null;
}

export function classifyCameraError(error) {
  if (error?.name === 'NotAllowedError' || error?.name === 'SecurityError') return 'denied';
  if (error?.name === 'NotFoundError' || error?.name === 'OverconstrainedError') return 'unavailable';
  if (error?.name === 'NotSupportedError' || !navigator.mediaDevices?.getUserMedia) return 'unavailable';
  return 'unavailable';
}

export function captureFrame(videoEl, { mirror = true } = {}) {
  const width = videoEl.videoWidth || 1280;
  const height = videoEl.videoHeight || 960;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (mirror) {
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(videoEl, 0, 0, width, height);
  return createPhotoRecord({ src: canvas.toDataURL('image/png'), naturalWidth: width, naturalHeight: height });
}

// Fallback eksplisit untuk mencoba flow tanpa kamera. Ini bukan foto user dan
// selalu diberi label DEMO agar tidak membingungkan saat QA.
export function createDemoCapture(slotIndex = 0, mode = 3) {
  const width = mode === 3 ? 1200 : 1440;
  const height = mode === 3 ? 900 : 1800;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const palettes = [
    ['#ffd4e6', '#8fd3ff'],
    ['#cab8ff', '#ffe26f'],
    ['#8fd3ff', '#ff8fbd'],
  ];
  const [from, to] = palettes[slotIndex % palettes.length];
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, from);
  gradient.addColorStop(1, to);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(255,255,255,.72)';
  ctx.beginPath();
  ctx.arc(width * .5, height * .42, Math.min(width, height) * .19, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#4b2e1f';
  ctx.font = `700 ${Math.round(Math.min(width, height) * .08)}px Fredoka, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(`FOTO DEMO ${slotIndex + 1}`, width / 2, height * .76);
  ctx.font = `600 ${Math.round(Math.min(width, height) * .035)}px Nunito, sans-serif`;
  ctx.fillText('Ganti dengan kamera saat siap', width / 2, height * .84);

  return createPhotoRecord({ src: canvas.toDataURL('image/png'), naturalWidth: width, naturalHeight: height });
}
