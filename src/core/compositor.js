// ─── core/compositor.js ──────────────────────────────────────────────────────
// Gabung foto + template HTML → export PNG.
// Template = HTML (punya .ph-slot, .ph-caption, dst — lihat docs/TEMPLATE-SPEC.md).
// Foto di-inject ke .ph-slot, lalu .ph-canvas di-render ke PNG via html-to-image
// (DOM → canvas → PNG). Pakai ESM CDN → tetap no-build (konsisten gaya Gesture).
import { toPng } from 'https://esm.sh/html-to-image@1.11.11';

// Render markup template ke container, balikin elemen .ph-canvas-nya.
// html = fragment siap-pakai dari resolveTemplateHtml() (index.js templates).
export function renderTemplate(containerEl, html) {
  containerEl.innerHTML = html;
  return containerEl.querySelector('.ph-canvas');
}

// Inject foto ke SEMUA slot (dipakai kalau cuma 1 foto buat semua slot).
export function setPhoto(canvasEl, photoDataUrl) {
  canvasEl.querySelectorAll('.ph-slot').forEach(slot => fillSlot(slot, photoDataUrl));
}

// Inject foto ke SATU slot (buat multi-capture strip: slot 1/2/3 foto beda).
// Cari by data-slot dulu, fallback ke urutan ke-n (1-based).
export function setPhotoSlot(canvasEl, slotNum, photoDataUrl) {
  const slot = canvasEl.querySelector(`.ph-slot[data-slot="${slotNum}"]`)
            || canvasEl.querySelectorAll('.ph-slot')[slotNum - 1];
  if (slot) fillSlot(slot, photoDataUrl);
}

function fillSlot(slot, url) {
  slot.innerHTML = `<img src="${url}" alt="foto" style="width:100%;height:100%;object-fit:cover;" />`;
}

// Isi caption / tanggal / brand kalau template punya elemennya.
export function setMeta(canvasEl, { caption, date, brand } = {}) {
  const set = (sel, val) => { const el = canvasEl.querySelector(sel); if (el && val != null) el.textContent = val; };
  set('.ph-caption', caption);
  set('.ph-date', date);
  set('.ph-brand', brand);
}

// Export .ph-canvas → dataURL PNG, di ukuran ASLI template (lepas dari scale display).
// Tombol ✕ hapus stiker disembunyikan sementara biar nggak ikut ke-export.
// Retry ringan: kalau banyak gambar (template + stiker) di-embed bareng, koneksi
// lokal/wifi yang lemot kadang bikin satu fetch gagal — coba lagi 2x sebelum nyerah.
export async function exportPng(canvasEl, attempt = 1) {
  const hideEls = canvasEl.querySelectorAll('[data-export-hide]');
  hideEls.forEach(el => (el.style.display = 'none'));
  // outline seleksi stiker jangan ikut ke foto
  const selected = [...canvasEl.querySelectorAll('.placed-sticker.selected')];
  selected.forEach(el => el.classList.remove('selected'));
  try {
    return await toPng(canvasEl, {
      width: canvasEl.offsetWidth,    // ukuran ASLI (1080 / 720), bukan yang di-scale buat display
      height: canvasEl.offsetHeight,
      pixelRatio: 2,                  // hasil 2x lebih tajam
      cacheBust: false,               // gambar udah ke-load di DOM, nggak perlu fetch ulang
      // PENTING: fitStage() nge-scale .ph-canvas biar pas di layar. Kalau transform itu
      // ikut ke-export, hasilnya frame mungil di kanvas gede. `style` di-apply ke CLONE
      // html-to-image -> export full-size, elemen di layar nggak keganggu.
      style: { transform: 'none', transformOrigin: 'top left' },
    });
  } catch (e) {
    if (attempt < 3) {
      await new Promise(r => setTimeout(r, 400 * attempt));
      return exportPng(canvasEl, attempt + 1);
    }
    throw new Error('Gagal simpan. Coba lagi ya.');
  } finally {
    hideEls.forEach(el => (el.style.display = ''));
    selected.forEach(el => el.classList.add('selected'));
  }
}

export function download(dataUrl, filename = 'polara.png') {
  const a = document.createElement('a');
  a.href = dataUrl; a.download = filename; a.click();
}

// Tempel stiker ke .ph-sticker-layer. Bisa GESER (drag body), RESIZE (handle kuning
// pojok), ROTATE (handle biru atas), HAPUS (✕ merah). Handle cuma muncul pas stiker
// dipilih; semua handle + outline seleksi disembunyikan pas export PNG.
export function placeSticker(canvasEl, stickerFile) {
  const layer = canvasEl.querySelector('.ph-sticker-layer');
  if (!layer) return null;
  ensureStickerStyles();
  ensureDeselectHandler(canvasEl);

  const size = Math.round(canvasEl.offsetWidth * 0.24) || 180;
  const cx = canvasEl.offsetWidth / 2, cy = canvasEl.offsetHeight / 2;
  const state = { rot: 0 };

  const wrap = document.createElement('div');
  wrap.className = 'placed-sticker';
  wrap.style.cssText = `position:absolute;width:${size}px;height:${size}px;left:${cx - size / 2}px;top:${cy - size / 2}px;touch-action:none;cursor:grab;`;
  const applyRot = () => { wrap.style.transform = `rotate(${state.rot}deg)`; };
  applyRot();

  const img = document.createElement('img');
  img.src = stickerFile; img.draggable = false;
  img.style.cssText = 'display:block;width:100%;height:100%;object-fit:contain;pointer-events:none;filter:drop-shadow(0 8px 14px rgba(0,0,0,.28));';
  wrap.appendChild(img);

  const H = 'position:absolute;width:28px;height:28px;border:2px solid #fff;border-radius:50%;padding:0;display:grid;place-items:center;font-size:14px;line-height:1;color:#fff;box-shadow:0 2px 6px rgba(0,0,0,.3);';
  const mkHandle = (extra, label, glyph) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'sticker-handle'; b.setAttribute('aria-label', label);
    b.setAttribute('data-export-hide', '1'); b.style.cssText = H + extra; b.textContent = glyph;
    wrap.appendChild(b); return b;
  };
  const removeBtn = mkHandle('top:-14px;right:-14px;background:#ff5f7a;cursor:pointer;', 'Hapus stiker', '✕');
  const rotateBtn = mkHandle('top:-42px;left:50%;transform:translateX(-50%);background:#4eb7f8;cursor:grab;', 'Putar stiker', '↻');
  const resizeBtn = mkHandle('bottom:-14px;right:-14px;background:#ffe26f;color:#4b2e1f;cursor:nwse-resize;', 'Ubah ukuran stiker', '⤢');
  removeBtn.onclick = (e) => { e.stopPropagation(); wrap.remove(); };

  const k = () => (canvasEl.offsetWidth / (canvasEl.getBoundingClientRect().width || canvasEl.offsetWidth)); // screen->canvas px
  const center = () => { const r = wrap.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };

  // ── geser ──
  let dragging = false, sx, sy, sl, st;
  wrap.addEventListener('pointerdown', (e) => {
    if (e.target !== wrap && e.target.tagName !== 'IMG') return;
    selectSticker(wrap); dragging = true; wrap.setPointerCapture(e.pointerId); wrap.style.cursor = 'grabbing';
    sx = e.clientX; sy = e.clientY; sl = wrap.offsetLeft; st = wrap.offsetTop;
  });
  wrap.addEventListener('pointermove', (e) => {
    if (!dragging) return; const s = k();
    wrap.style.left = (sl + (e.clientX - sx) * s) + 'px';
    wrap.style.top = (st + (e.clientY - sy) * s) + 'px';
  });
  const endDrag = () => { dragging = false; wrap.style.cursor = 'grab'; };
  wrap.addEventListener('pointerup', endDrag); wrap.addEventListener('pointercancel', endDrag);

  // ── rotate ──
  let rotating = false, rotOff = 0;
  rotateBtn.addEventListener('pointerdown', (e) => {
    e.stopPropagation(); selectSticker(wrap); rotating = true; rotateBtn.setPointerCapture(e.pointerId);
    const c = center(); rotOff = Math.atan2(e.clientY - c.y, e.clientX - c.x) * 180 / Math.PI - state.rot;
  });
  rotateBtn.addEventListener('pointermove', (e) => {
    if (!rotating) return; const c = center();
    state.rot = Math.atan2(e.clientY - c.y, e.clientX - c.x) * 180 / Math.PI - rotOff; applyRot();
  });
  const endRot = () => { rotating = false; };
  rotateBtn.addEventListener('pointerup', endRot); rotateBtn.addEventListener('pointercancel', endRot);

  // ── resize (jaga titik tengah tetap) ──
  let resizing = false;
  resizeBtn.addEventListener('pointerdown', (e) => { e.stopPropagation(); selectSticker(wrap); resizing = true; resizeBtn.setPointerCapture(e.pointerId); });
  resizeBtn.addEventListener('pointermove', (e) => {
    if (!resizing) return; const c = center();
    let ns = Math.hypot(e.clientX - c.x, e.clientY - c.y) * k() * 1.414;
    ns = Math.max(44, Math.min(canvasEl.offsetWidth, ns));
    const mx = wrap.offsetLeft + wrap.offsetWidth / 2, my = wrap.offsetTop + wrap.offsetHeight / 2;
    wrap.style.width = ns + 'px'; wrap.style.height = ns + 'px';
    wrap.style.left = (mx - ns / 2) + 'px'; wrap.style.top = (my - ns / 2) + 'px';
  });
  const endResize = () => { resizing = false; };
  resizeBtn.addEventListener('pointerup', endResize); resizeBtn.addEventListener('pointercancel', endResize);

  layer.appendChild(wrap);
  selectSticker(wrap);
  return wrap;
}

function selectSticker(wrap) {
  const layer = wrap.parentElement;
  if (layer) layer.querySelectorAll('.placed-sticker.selected').forEach(w => w.classList.remove('selected'));
  wrap.classList.add('selected');
}
function ensureDeselectHandler(canvasEl) {
  if (canvasEl.dataset.stickerInit) return;
  canvasEl.dataset.stickerInit = '1';
  canvasEl.addEventListener('pointerdown', (e) => {
    if (!e.target.closest('.placed-sticker')) {
      canvasEl.querySelectorAll('.placed-sticker.selected').forEach(w => w.classList.remove('selected'));
    }
  });
}
function ensureStickerStyles() {
  if (document.getElementById('polara-sticker-styles')) return;
  const st = document.createElement('style');
  st.id = 'polara-sticker-styles';
  st.textContent = `
    .placed-sticker .sticker-handle { opacity: 0; pointer-events: none; transition: opacity .12s; }
    .placed-sticker.selected .sticker-handle { opacity: 1; pointer-events: auto; }
    .placed-sticker.selected { outline: 2px dashed rgba(255,143,189,.95); outline-offset: 3px; }`;
  document.head.appendChild(st);
}
