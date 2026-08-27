// ─── core/compositor.js ──────────────────────────────────────────────────────
// Render template + foto + sticker dan export PNG exact-size.
import { toPng } from 'https://esm.sh/html-to-image@1.11.11';
import { applyPhotoGeometry, drawPhotoGeometry } from './photo-geometry.js';

export function renderTemplate(containerEl, html) {
  containerEl.innerHTML = html;
  return containerEl.querySelector('.ph-canvas');
}

export function setPhotoSlot(canvasEl, slotNum, photo, { guestComposition = null, onGuestAssetError } = {}) {
  const slot = canvasEl.querySelector(`.ph-slot[data-slot="${slotNum}"]`)
    || canvasEl.querySelectorAll('.ph-slot')[slotNum - 1];
  if (!slot || !photo) return;

  const slotPosition = slot.ownerDocument.defaultView?.getComputedStyle(slot).position;
  if (!slotPosition || slotPosition === 'static') slot.style.position = 'relative';
  slot.style.overflow = 'hidden';
  slot.querySelectorAll(':scope > .ph-photo, :scope > .ph-photo-region, :scope > .ph-guest')
    .forEach((item) => item.remove());
  const image = document.createElement('img');
  image.className = 'ph-photo';
  image.src = photo.src;
  image.alt = '';
  image.draggable = false;
  image.dataset.slot = String(slotNum);
  const photoRegion = guestComposition ? document.createElement('div') : slot;
  if (guestComposition) {
    const region = guestComposition.userRegion;
    photoRegion.className = 'ph-photo-region';
    Object.assign(photoRegion.style, {
      position: 'absolute',
      left: `${region.x * 100}%`,
      top: `${region.y * 100}%`,
      width: `${region.width * 100}%`,
      height: `${region.height * 100}%`,
      overflow: 'hidden',
      zIndex: '1',
    });
    photoRegion.appendChild(image);
    slot.appendChild(photoRegion);
  }
  const apply = () => applyPhotoGeometry(photoRegion, image, photo);
  image.addEventListener('load', apply, { once: true });
  if (!guestComposition) slot.appendChild(image);
  if (image.complete) requestAnimationFrame(apply);

  if (guestComposition) {
    const guest = document.createElement('img');
    const region = guestComposition.guestRegion;
    guest.className = 'ph-guest';
    guest.src = guestComposition.asset.src;
    guest.alt = '';
    guest.draggable = false;
    Object.assign(guest.style, {
      position: 'absolute',
      left: `${region.x * 100}%`,
      top: `${region.y * 100}%`,
      width: `${region.width * 100}%`,
      height: `${region.height * 100}%`,
      display: 'block',
      maxWidth: 'none',
      objectFit: 'contain',
      objectPosition: 'center bottom',
      transform: guestComposition.flipGuest ? 'scaleX(-1)' : 'none',
      pointerEvents: 'none',
      zIndex: '2',
    });
    guest.addEventListener('error', () => onGuestAssetError?.(guestComposition.asset), { once: true });
    slot.appendChild(guest);
  }
}

export function refreshPhotoSlots(canvasEl, photos, options = {}) {
  photos.forEach((photo, index) => {
    if (photo) setPhotoSlot(canvasEl, index + 1, photo, options);
  });
}

export function setMeta(canvasEl, { caption, date, brand } = {}) {
  const set = (selector, value) => {
    const element = canvasEl.querySelector(selector);
    if (element && value != null) element.textContent = value;
  };
  set('.ph-caption', caption);
  set('.ph-date', date);
  set('.ph-brand', brand);
}

async function waitForImages(root) {
  const images = [...root.querySelectorAll('img')];
  await Promise.all(images.map(async (image) => {
    if (image.complete && image.naturalWidth) return;
    try { await image.decode(); } catch { /* error asset ditangani UI; export tetap dicoba */ }
  }));
}

export async function exportPng(canvasEl, attempt = 1) {
  const hideEls = canvasEl.querySelectorAll('[data-export-hide]');
  hideEls.forEach((element) => { element.dataset.previousDisplay = element.style.display; element.style.display = 'none'; });
  const selected = [...canvasEl.querySelectorAll('.placed-sticker.selected')];
  selected.forEach((element) => element.classList.remove('selected'));

  try {
    await waitForImages(canvasEl);
    const width = canvasEl.offsetWidth;
    const height = canvasEl.offsetHeight;
    return await toPng(canvasEl, {
      width,
      height,
      canvasWidth: width,
      canvasHeight: height,
      pixelRatio: 1,
      cacheBust: false,
      skipFonts: true,
      style: {
        position: 'relative',
        inset: 'auto',
        transform: 'none',
        transformOrigin: 'top left',
      },
    });
  } catch (error) {
    if (attempt < 3) {
      await new Promise((resolve) => setTimeout(resolve, 350 * attempt));
      return exportPng(canvasEl, attempt + 1);
    }
    throw new Error('PNG creation failed. Your proof remains safe; try again.', { cause: error });
  } finally {
    hideEls.forEach((element) => { element.style.display = element.dataset.previousDisplay || ''; delete element.dataset.previousDisplay; });
    selected.forEach((element) => element.classList.add('selected'));
  }
}

export async function dataUrlToBlob(dataUrl) {
  const response = await fetch(dataUrl);
  if (!response.ok) throw new Error('The result file could not be prepared.');
  return response.blob();
}

export async function download(source, filename = 'polara.png') {
  let objectUrl = null;
  const anchor = document.createElement('a');
  if (source instanceof Blob && URL.createObjectURL) {
    objectUrl = URL.createObjectURL(source);
    anchor.href = objectUrl;
  } else if (typeof source === 'string') {
    anchor.href = source;
  } else {
    throw new Error('This download format is unsupported.');
  }
  anchor.download = filename;
  anchor.rel = 'noopener';
  try {
    document.body.appendChild(anchor);
    anchor.click();
  } finally {
    anchor.remove();
    if (objectUrl) setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
  }
}

export function setStickerSelection(canvasEl, selectedId) {
  canvasEl.querySelectorAll('.placed-sticker').forEach((element) => {
    const selected = element.dataset.stickerId === selectedId;
    element.classList.toggle('selected', selected);
    element.setAttribute('aria-selected', String(selected));
    element.querySelectorAll('.sticker-handle').forEach((handle) => { handle.tabIndex = selected ? 0 : -1; });
  });
}

export function renderStickerLayer(canvasEl, stickers, options = {}) {
  const layer = canvasEl.querySelector('.ph-sticker-layer');
  if (!layer) return;
  ensureStickerStyles();
  layer.innerHTML = '';
  layer.style.pointerEvents = 'none';
  const interactive = options.interactive !== false;

  const canvasWidth = canvasEl.offsetWidth || 1080;
  const canvasHeight = canvasEl.offsetHeight || 1350;
  const displayScale = Number(canvasEl.dataset.displayScale) || 0.4;
  const handleSize = Math.max(76, 44 / displayScale);

  stickers.forEach((item) => {
    const size = canvasWidth * item.scale;
    const wrap = document.createElement('div');
    const selected = interactive && item.uid === options.selectedId;
    wrap.className = `placed-sticker${selected ? ' selected' : ''}`;
    wrap.dataset.stickerId = item.uid;
    wrap.tabIndex = interactive ? 0 : -1;
    wrap.setAttribute('role', interactive ? 'option' : 'img');
    wrap.setAttribute('aria-label', interactive
      ? `${item.name}. Gunakan tombol panah untuk geser, plus/minus untuk ukuran, kurung siku untuk memutar, Delete untuk hapus.`
      : `${item.name} sticker on proof.`);
    if (interactive) wrap.setAttribute('aria-selected', String(selected));
    Object.assign(wrap.style, {
      position: 'absolute',
      width: `${size}px`,
      height: `${size}px`,
      left: `${item.x * canvasWidth - size / 2}px`,
      top: `${item.y * canvasHeight - size / 2}px`,
      transform: `rotate(${item.rotation}deg)`,
      transformOrigin: 'center',
      touchAction: 'none',
      cursor: interactive ? 'grab' : 'default',
      pointerEvents: interactive ? 'auto' : 'none',
    });

    const image = document.createElement('img');
    image.src = item.src;
    image.alt = '';
    image.draggable = false;
    image.loading = 'lazy';
    image.style.cssText = 'display:block;width:100%;height:100%;object-fit:contain;pointer-events:none;filter:drop-shadow(0 8px 14px rgba(0,0,0,.22));';
    image.onerror = () => {
      image.hidden = true;
      wrap.classList.add('asset-error');
      options.onAssetError?.(item);
    };
    wrap.appendChild(image);

    const handleBase = `position:absolute;width:${handleSize}px;height:${handleSize}px;border:${Math.max(4, 2 / displayScale)}px solid #fff;border-radius:50%;padding:0;display:grid;place-items:center;font-size:${handleSize * .42}px;line-height:1;color:#fff;box-shadow:0 2px 8px rgba(0,0,0,.3);`;
    const makeHandle = (style, label, glyph) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'sticker-handle';
      button.setAttribute('aria-label', label);
      button.setAttribute('data-export-hide', '1');
      button.hidden = !interactive;
      button.setAttribute('aria-hidden', String(!interactive));
      button.tabIndex = selected ? 0 : -1;
      button.style.cssText = handleBase + style;
      button.textContent = glyph;
      wrap.appendChild(button);
      return button;
    };

    const removeButton = makeHandle(`top:${-handleSize / 2}px;right:${-handleSize / 2}px;background:#ff5f7a;cursor:pointer;`, 'Hapus sticker', '✕');
    const rotateButton = makeHandle(`top:${-handleSize * 1.35}px;left:50%;transform:translateX(-50%);background:#4eb7f8;cursor:grab;`, 'Putar sticker', '↻');
    const resizeButton = makeHandle(`bottom:${-handleSize / 2}px;right:${-handleSize / 2}px;background:#ffe26f;color:#4b2e1f;cursor:nwse-resize;`, 'Ubah ukuran sticker', '⤢');

    const select = () => {
      if (!interactive) return;
      options.onSelect?.(item.uid);
      setStickerSelection(canvasEl, item.uid);
    };
    const apply = () => {
      const nextSize = canvasWidth * item.scale;
      wrap.style.width = `${nextSize}px`;
      wrap.style.height = `${nextSize}px`;
      wrap.style.left = `${item.x * canvasWidth - nextSize / 2}px`;
      wrap.style.top = `${item.y * canvasHeight - nextSize / 2}px`;
      wrap.style.transform = `rotate(${item.rotation}deg)`;
      options.onChange?.(item);
    };
    const screenToCanvas = () => canvasWidth / (canvasEl.getBoundingClientRect().width || canvasWidth);
    const centerOnScreen = () => {
      const rect = wrap.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    };

    let dragging = false;
    let startX = 0;
    let startY = 0;
    let originX = 0;
    let originY = 0;
    wrap.addEventListener('pointerdown', (event) => {
      if (event.target.closest('.sticker-handle')) return;
      event.preventDefault();
      select();
      options.onInteractionStart?.();
      dragging = true;
      startX = event.clientX;
      startY = event.clientY;
      originX = item.x;
      originY = item.y;
      wrap.setPointerCapture(event.pointerId);
      wrap.style.cursor = 'grabbing';
    });
    wrap.addEventListener('pointermove', (event) => {
      if (!dragging) return;
      const scale = screenToCanvas();
      item.x = clamp(originX + ((event.clientX - startX) * scale) / canvasWidth, 0, 1);
      item.y = clamp(originY + ((event.clientY - startY) * scale) / canvasHeight, 0, 1);
      apply();
    });
    const stopDrag = () => { dragging = false; wrap.style.cursor = 'grab'; };
    wrap.addEventListener('pointerup', stopDrag);
    wrap.addEventListener('pointercancel', stopDrag);

    let rotating = false;
    let rotationOffset = 0;
    rotateButton.addEventListener('pointerdown', (event) => {
      event.preventDefault(); event.stopPropagation(); select(); options.onInteractionStart?.();
      rotating = true; rotateButton.setPointerCapture(event.pointerId);
      const center = centerOnScreen();
      rotationOffset = Math.atan2(event.clientY - center.y, event.clientX - center.x) * 180 / Math.PI - item.rotation;
    });
    rotateButton.addEventListener('pointermove', (event) => {
      if (!rotating) return;
      const center = centerOnScreen();
      item.rotation = Math.atan2(event.clientY - center.y, event.clientX - center.x) * 180 / Math.PI - rotationOffset;
      apply();
    });
    const stopRotate = () => { rotating = false; };
    rotateButton.addEventListener('pointerup', stopRotate);
    rotateButton.addEventListener('pointercancel', stopRotate);

    let resizing = false;
    resizeButton.addEventListener('pointerdown', (event) => {
      event.preventDefault(); event.stopPropagation(); select(); options.onInteractionStart?.();
      resizing = true; resizeButton.setPointerCapture(event.pointerId);
    });
    resizeButton.addEventListener('pointermove', (event) => {
      if (!resizing) return;
      const center = centerOnScreen();
      const sizePx = Math.hypot(event.clientX - center.x, event.clientY - center.y) * screenToCanvas() * 1.414;
      item.scale = clamp(sizePx / canvasWidth, item.minScale || .08, item.maxScale || .42);
      apply();
    });
    const stopResize = () => { resizing = false; };
    resizeButton.addEventListener('pointerup', stopResize);
    resizeButton.addEventListener('pointercancel', stopResize);

    removeButton.addEventListener('click', (event) => {
      event.stopPropagation();
      options.onInteractionStart?.();
      options.onDelete?.(item.uid);
    });

    wrap.addEventListener('focus', select);
    wrap.addEventListener('keydown', (event) => {
      const step = event.shiftKey ? .05 : .012;
      const handledKeys = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-', '_', '[', ']', 'Delete', 'Backspace']);
      if (!handledKeys.has(event.key)) return;
      event.preventDefault();
      options.onInteractionStart?.();

      if (event.key === 'ArrowLeft') item.x = clamp(item.x - step, 0, 1);
      else if (event.key === 'ArrowRight') item.x = clamp(item.x + step, 0, 1);
      else if (event.key === 'ArrowUp') item.y = clamp(item.y - step, 0, 1);
      else if (event.key === 'ArrowDown') item.y = clamp(item.y + step, 0, 1);
      else if (event.key === '+' || event.key === '=') item.scale = clamp(item.scale + step, item.minScale || .08, item.maxScale || .42);
      else if (event.key === '-' || event.key === '_') item.scale = clamp(item.scale - step, item.minScale || .08, item.maxScale || .42);
      else if (event.key === '[') item.rotation -= event.shiftKey ? 15 : 5;
      else if (event.key === ']') item.rotation += event.shiftKey ? 15 : 5;
      else if (event.key === 'Delete' || event.key === 'Backspace') {
        options.onDelete?.(item.uid);
        return;
      }
      apply();
    });

    layer.appendChild(wrap);
  });

  if (!layer.dataset.deselectReady) {
    layer.dataset.deselectReady = '1';
    canvasEl.addEventListener('pointerdown', (event) => {
      if (!event.target.closest('.placed-sticker')) {
        options.onSelect?.(null);
        setStickerSelection(canvasEl, null);
      }
    });
  }
}

export async function exportRawPng(photos, mode, { guestComposition = null } = {}) {
  const width = mode === 3 ? 720 : 1080;
  const height = mode === 3 ? 1800 : 1350;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff7ef';
  ctx.fillRect(0, 0, width, height);
  const slotHeight = height / photos.length;
  const images = await Promise.all(photos.map((photo) => loadImage(photo.src)));
  const guestImage = guestComposition ? await loadImage(guestComposition.asset.src, 'Pose Mate guest') : null;
  images.forEach((image, index) => {
    const slotY = index * slotHeight;
    if (guestComposition && guestImage) {
      drawGuestComposition(ctx, image, photos[index], guestImage, guestComposition, 0, slotY, width, slotHeight);
      return;
    }
    drawPhotoGeometry(ctx, image, photos[index], 0, slotY, width, slotHeight);
  });

  ctx.fillStyle = 'rgba(75,46,31,.72)';
  ctx.font = `700 ${Math.round(width * .026)}px Nunito, sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillText('made with Polara', width - 24, height - 24);
  return canvas.toDataURL('image/png');
}

function drawGuestComposition(ctx, photoImage, photo, guestImage, composition, x, y, width, height) {
  const user = composition.userRegion;
  const guest = composition.guestRegion;
  drawPhotoGeometry(
    ctx,
    photoImage,
    photo,
    x + user.x * width,
    y + user.y * height,
    user.width * width,
    user.height * height,
  );

  const regionX = x + guest.x * width;
  const regionY = y + guest.y * height;
  const regionWidth = guest.width * width;
  const regionHeight = guest.height * height;
  const scale = Math.min(regionWidth / guestImage.naturalWidth, regionHeight / guestImage.naturalHeight);
  const drawWidth = guestImage.naturalWidth * scale;
  const drawHeight = guestImage.naturalHeight * scale;
  ctx.save();
  ctx.beginPath();
  ctx.rect(regionX, regionY, regionWidth, regionHeight);
  ctx.clip();
  if (composition.flipGuest) {
    ctx.translate(regionX + regionWidth, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(guestImage, (regionWidth - drawWidth) / 2, regionY + regionHeight - drawHeight, drawWidth, drawHeight);
  } else {
    ctx.drawImage(guestImage, regionX + (regionWidth - drawWidth) / 2, regionY + regionHeight - drawHeight, drawWidth, drawHeight);
  }
  ctx.restore();
}

function loadImage(src, label = 'photo') {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => {
      const error = new Error(`The ${label} asset could not be read.`);
      error.code = label === 'Pose Mate guest' ? 'GUEST_ASSET_ERROR' : 'IMAGE_ASSET_ERROR';
      reject(error);
    };
    image.src = src;
  });
}

function ensureStickerStyles() {
  if (document.getElementById('polara-sticker-styles')) return;
  const style = document.createElement('style');
  style.id = 'polara-sticker-styles';
  style.textContent = `
    .placed-sticker .sticker-handle { opacity:0; pointer-events:none; transition:opacity .12s ease; }
    .placed-sticker.selected .sticker-handle { opacity:1; pointer-events:auto; }
    .placed-sticker.selected { outline:4px dashed rgba(255,143,189,.95); outline-offset:8px; }
    .placed-sticker:focus-visible { outline:6px solid #4eb7f8; outline-offset:10px; }
    .placed-sticker.asset-error::after { content:'!'; position:absolute; inset:20%; display:grid; place-items:center; border-radius:50%; background:#fff; color:#a62f6b; font:700 64px sans-serif; }
  `;
  document.head.appendChild(style);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
