// ─── core/photo-geometry.js ─────────────────────────────────────────────────
// Satu kontrak geometry untuk preview DOM dan export canvas.
// Foto disimpan utuh; contain/cover, zoom, dan pan selalu non-destruktif.

export const DEFAULT_PHOTO_TRANSFORM = Object.freeze({
  fit: 'contain',
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
});

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function createPhotoRecord({ src, naturalWidth, naturalHeight }) {
  return {
    src,
    naturalWidth: Math.max(1, Number(naturalWidth) || 1),
    naturalHeight: Math.max(1, Number(naturalHeight) || 1),
    ...DEFAULT_PHOTO_TRANSFORM,
  };
}

export function patchPhotoTransform(photo, patch = {}) {
  if (!photo) return photo;
  return {
    ...photo,
    fit: patch.fit === 'cover' ? 'cover' : (patch.fit === 'contain' ? 'contain' : photo.fit),
    zoom: patch.zoom == null ? photo.zoom : clamp(Number(patch.zoom) || 1, 1, 3),
    offsetX: patch.offsetX == null ? photo.offsetX : clamp(Number(patch.offsetX) || 0, -1, 1),
    offsetY: patch.offsetY == null ? photo.offsetY : clamp(Number(patch.offsetY) || 0, -1, 1),
  };
}

export function resetPhotoTransform(photo) {
  return photo ? { ...photo, ...DEFAULT_PHOTO_TRANSFORM } : photo;
}

export function computePhotoGeometry(photo, slotWidth, slotHeight) {
  if (!photo) return null;
  const sw = Math.max(1, Number(photo.naturalWidth) || 1);
  const sh = Math.max(1, Number(photo.naturalHeight) || 1);
  const dw = Math.max(1, Number(slotWidth) || 1);
  const dh = Math.max(1, Number(slotHeight) || 1);
  const fitScale = photo.fit === 'cover'
    ? Math.max(dw / sw, dh / sh)
    : Math.min(dw / sw, dh / sh);
  const scale = fitScale * clamp(Number(photo.zoom) || 1, 1, 3);
  const width = sw * scale;
  const height = sh * scale;
  const panX = Math.max(0, (width - dw) / 2);
  const panY = Math.max(0, (height - dh) / 2);
  const left = (dw - width) / 2 + clamp(Number(photo.offsetX) || 0, -1, 1) * panX;
  const top = (dh - height) / 2 + clamp(Number(photo.offsetY) || 0, -1, 1) * panY;

  return { left, top, width, height, scale };
}

export function applyPhotoGeometry(slotEl, imageEl, photo) {
  const geometry = computePhotoGeometry(photo, slotEl.offsetWidth, slotEl.offsetHeight);
  if (!geometry) return null;
  Object.assign(imageEl.style, {
    position: 'absolute',
    display: 'block',
    maxWidth: 'none',
    width: `${geometry.width}px`,
    height: `${geometry.height}px`,
    left: `${geometry.left}px`,
    top: `${geometry.top}px`,
    transform: 'none',
    objectFit: 'fill',
    pointerEvents: 'none',
  });
  return geometry;
}

export function drawPhotoGeometry(ctx, image, photo, x, y, width, height) {
  const geometry = computePhotoGeometry(photo, width, height);
  if (!geometry) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();
  ctx.drawImage(image, x + geometry.left, y + geometry.top, geometry.width, geometry.height);
  ctx.restore();
}
