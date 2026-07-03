// ─── core/camera.js ──────────────────────────────────────────────────────────
// Kelola webcam. Logika murni & lepas dari DOM app (gampang dites/diganti).
let _stream = null;

export async function startCamera(videoEl, facingMode = 'user') {
  stopCamera();
  _stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode, width: { ideal: 1280 }, height: { ideal: 1600 } },
    audio: false,
  });
  videoEl.srcObject = _stream;
  await videoEl.play().catch(() => {});
  return _stream;
}

export function stopCamera() {
  if (_stream) { _stream.getTracks().forEach(t => t.stop()); _stream = null; }
}

// Ambil 1 frame dari video → dataURL PNG. Preview di-mirror via CSS, jadi di sini
// kita normalkan (un-mirror) biar hasil sesuai aslinya (teks nggak kebalik, dll).
export function captureFrame(videoEl) {
  const w = videoEl.videoWidth || 1280;
  const h = videoEl.videoHeight || 1600;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.translate(w, 0); ctx.scale(-1, 1);
  ctx.drawImage(videoEl, 0, 0, w, h);
  return c.toDataURL('image/png');
}
