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
  try {
    return await toPng(canvasEl, {
      width: canvasEl.offsetWidth,    // 1080 (transform parent nggak ngubah offsetWidth)
      height: canvasEl.offsetHeight,  // 1350
      pixelRatio: 2,                  // hasil 2x lebih tajam
      cacheBust: false,               // gambar udah ke-load di DOM — nggak perlu fetch ulang paksa
    });
  } catch (e) {
    if (attempt < 3) {
      await new Promise(r => setTimeout(r, 400 * attempt));
      return exportPng(canvasEl, attempt + 1);
    }
    throw new Error('Export gagal setelah beberapa percobaan — cek koneksi.');
  } finally {
    hideEls.forEach(el => (el.style.display = ''));
  }
}

export function download(dataUrl, filename = 'polara.png') {
  const a = document.createElement('a');
  a.href = dataUrl; a.download = filename; a.click();
}

// Tempel stiker ke .ph-sticker-layer, posisi default tengah kanvas, bisa digeser (drag).
// wrap = div pembungkus (posisi+drag) supaya tombol hapus nggak ikut ke-drag/ke-export ganda.
export function placeSticker(canvasEl, stickerFile) {
  const layer = canvasEl.querySelector('.ph-sticker-layer');
  if (!layer) return null;

  const size = Math.round(canvasEl.offsetWidth * 0.22) || 180;
  const wrap = document.createElement('div');
  wrap.className = 'placed-sticker';
  wrap.style.cssText = `position:absolute;width:${size}px;height:${size}px;
    left:calc(50% - ${size / 2}px);top:calc(50% - ${size / 2}px);
    pointer-events:auto;touch-action:none;cursor:grab;`;

  const img = document.createElement('img');
  img.src = stickerFile;
  img.draggable = false;
  img.style.cssText = 'display:block;width:100%;height:100%;object-fit:contain;pointer-events:none;filter:drop-shadow(0 8px 14px rgba(0,0,0,.28));';
  wrap.appendChild(img);

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.textContent = '✕';
  removeBtn.setAttribute('aria-label', 'Hapus stiker');       // a11y: keyboard + screen reader
  removeBtn.setAttribute('data-export-hide', '1');            // disembunyikan pas export PNG (lihat exportPng)
  removeBtn.style.cssText = 'position:absolute;top:-11px;right:-11px;width:26px;height:26px;border:0;padding:0;border-radius:50%;' +
    'background:#ff5f7a;color:#fff;font-size:14px;line-height:26px;text-align:center;cursor:pointer;' +
    'box-shadow:0 2px 6px rgba(0,0,0,.3);';
  removeBtn.onclick = (e) => { e.stopPropagation(); wrap.remove(); };
  wrap.appendChild(removeBtn);

  makeDraggable(wrap, canvasEl);
  layer.appendChild(wrap);
  return wrap;
}

function makeDraggable(el, boundsEl) {
  let dragging = false, startX, startY, startLeft, startTop;
  el.addEventListener('pointerdown', (e) => {
    if (e.target !== el && e.target.tagName !== 'IMG') return; // biar klik ✕ nggak mulai drag
    dragging = true;
    el.setPointerCapture(e.pointerId);
    el.style.cursor = 'grabbing';
    startX = e.clientX; startY = e.clientY;
    startLeft = el.offsetLeft; startTop = el.offsetTop;
  });
  el.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const scale = boundsEl.offsetWidth / boundsEl.getBoundingClientRect().width; // koreksi transform:scale() di stage
    el.style.left = (startLeft + (e.clientX - startX) * scale) + 'px';
    el.style.top = (startTop + (e.clientY - startY) * scale) + 'px';
  });
  const stop = () => { dragging = false; el.style.cursor = 'grab'; };
  el.addEventListener('pointerup', stop);
  el.addEventListener('pointercancel', stop);
}
