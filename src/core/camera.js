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

// Ambil 1 frame dari video → dataURL PNG.
// WYSIWYG: kamera native sering lebih lebar/beda rasio dari kotak preview (object-fit:
// cover). Dulu kita capture full native → yang ke-foto beda dari yang keliatan, orang
// kepotong pas masuk slot. Sekarang kita CROP persis kayak preview (center-crop ke rasio
// kotak video), jadi hasil = apa yang kamu lihat. Preview di-mirror via CSS → un-mirror.
export function captureFrame(videoEl) {
  const vw = videoEl.videoWidth || 1280, vh = videoEl.videoHeight || 1600;
  const boxW = videoEl.clientWidth || vw, boxH = videoEl.clientHeight || vh;
  const targetAR = boxW / boxH, srcAR = vw / vh;
  let sw, sh, sx, sy;
  if (srcAR > targetAR) { sh = vh; sw = vh * targetAR; sx = (vw - sw) / 2; sy = 0; }   // native lebih lebar → crop kiri-kanan
  else { sw = vw; sh = vw / targetAR; sx = 0; sy = (vh - sh) / 2; }                     // native lebih tinggi → crop atas-bawah

  const c = document.createElement('canvas');
  c.width = Math.round(sw); c.height = Math.round(sh);
  const ctx = c.getContext('2d');
  ctx.translate(c.width, 0); ctx.scale(-1, 1);                                          // un-mirror
  ctx.drawImage(videoEl, sx, sy, sw, sh, 0, 0, c.width, c.height);
  return c.toDataURL('image/png');
}
