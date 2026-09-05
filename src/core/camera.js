// ─── core/camera.js ──────────────────────────────────────────────────────────
// Kelola webcam dan capture source-preserving. Preview boleh di-mirror, tetapi
// data capture selalu berupa frame penuh yang tidak di-crop permanen.
import { createPhotoRecord } from './photo-geometry.js';

let _stream = null;
let _videoEl = null;
let _pendingStream = null;
let _pendingVideoEl = null;
let _requestId = 0;
const _stoppedStreams = new WeakSet();

const MAX_CAPTURE_EDGE = 1920;
const CAPTURE_QUALITY = 0.92;

function stopStream(stream) {
  if (!stream || _stoppedStreams.has(stream)) return;
  _stoppedStreams.add(stream);
  stream.getTracks().forEach((track) => track.stop());
}

function abortError(message = 'Camera request was cancelled.') {
  const error = new Error(message);
  error.name = 'AbortError';
  return error;
}

export async function startCamera(videoEl, facingMode = 'user') {
  if (!navigator.mediaDevices?.getUserMedia) {
    const error = new Error('This browser does not provide camera access.');
    error.name = 'NotSupportedError';
    throw error;
  }

  stopCamera();
  const requestId = ++_requestId;
  const candidate = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: facingMode }, width: { ideal: 1920 }, height: { ideal: 1920 } },
    audio: false,
  });

  if (requestId !== _requestId) {
    stopStream(candidate);
    throw abortError();
  }

  _pendingStream = candidate;
  _pendingVideoEl = videoEl;
  try {
    videoEl.srcObject = candidate;
    await videoEl.play();
  } catch (error) {
    stopStream(candidate);
    if (videoEl.srcObject === candidate) videoEl.srcObject = null;
    if (_pendingStream === candidate) {
      _pendingStream = null;
      _pendingVideoEl = null;
    }
    throw error;
  }

  if (requestId !== _requestId) {
    stopStream(candidate);
    if (videoEl.srcObject === candidate) videoEl.srcObject = null;
    if (_pendingStream === candidate) {
      _pendingStream = null;
      _pendingVideoEl = null;
    }
    throw abortError();
  }

  _pendingStream = null;
  _pendingVideoEl = null;
  _stream = candidate;
  _videoEl = videoEl;
  return candidate;
}

export function stopCamera() {
  _requestId += 1;
  const stream = _stream;
  const pendingStream = _pendingStream;
  stopStream(stream);
  if (pendingStream !== stream) stopStream(pendingStream);
  if (_videoEl?.srcObject === stream) _videoEl.srcObject = null;
  if (_pendingVideoEl?.srcObject === pendingStream) _pendingVideoEl.srcObject = null;
  _stream = null;
  _videoEl = null;
  _pendingStream = null;
  _pendingVideoEl = null;
}

export function classifyCameraError(error) {
  if (error?.name === 'NotAllowedError' || error?.name === 'SecurityError') return 'denied';
  if (error?.name === 'NotFoundError' || error?.name === 'OverconstrainedError') return 'unavailable';
  if (error?.name === 'NotSupportedError' || !navigator.mediaDevices?.getUserMedia) return 'unavailable';
  return 'unavailable';
}

export function captureFrame(videoEl, { mirror = true } = {}) {
  if (!videoEl.videoWidth || !videoEl.videoHeight || videoEl.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    throw new Error('The camera has not delivered a frame yet. Wait a moment and try again.');
  }

  const sourceWidth = videoEl.videoWidth;
  const sourceHeight = videoEl.videoHeight;
  const resizeScale = Math.min(1, MAX_CAPTURE_EDGE / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * resizeScale));
  const height = Math.max(1, Math.round(sourceHeight * resizeScale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('The browser could not prepare the photo canvas.');

  if (mirror) {
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(videoEl, 0, 0, sourceWidth, sourceHeight, 0, 0, width, height);
  const src = canvas.toDataURL('image/jpeg', CAPTURE_QUALITY);
  if (!src || src === 'data:,') throw new Error('The browser could not save the camera frame.');
  return createPhotoRecord({ src, naturalWidth: width, naturalHeight: height });
}

// Fallback eksplisit untuk mencoba flow tanpa kamera. Raster rights-safe ini
// selalu membawa label DEMO dan tidak pernah menggantikan capture kamera user.
export async function createDemoCapture(slotIndex = 0) {
  const proofIndex = (slotIndex % 3) + 1;
  const src = `assets/media/demo-proofs/demo-proof-${proofIndex}.jpg`;
  const image = new Image();
  image.decoding = 'async';
  image.src = src;
  await image.decode();
  if (!image.naturalWidth || !image.naturalHeight) {
    throw new Error('The browser could not load the demo proof.');
  }
  return createPhotoRecord({ src, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight });
}
