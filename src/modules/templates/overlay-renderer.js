const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

function metadataZone(className, zone) {
  if (!zone) return '';
  return `<div class="${className}" style="position:absolute;left:${zone.x}px;top:${zone.y}px;width:${zone.width}px;height:${zone.height}px;display:grid;place-items:center;overflow:hidden;z-index:25;pointer-events:none;"></div>`;
}

export function buildOverlayTemplateHtml(template) {
  if (template.renderMode !== 'png-overlay') {
    throw new Error(`Template ${template.id} bukan png-overlay.`);
  }

  const expectedSlots = template.mode === 'strip' ? 3 : 1;
  if (template.photoWindows.length !== expectedSlots) {
    throw new Error(`Template ${template.id} memiliki jumlah photo window yang salah.`);
  }

  const slots = template.photoWindows.map((window, index) => `
    <div class="ph-slot" data-slot="${index + 1}" style="position:absolute;left:${window.x}px;top:${window.y}px;width:${window.width}px;height:${window.height}px;overflow:hidden;background:${escapeHtml(template.slotBackground)};z-index:10;"></div>
  `).join('');
  const zones = template.supportsDynamicText ? template.metadataZones : {};
  const overlayUrl = `${template.overlaySrc}?v=${encodeURIComponent(template.assetVersion)}`;

  return `
    <div class="ph-canvas ph-canvas-overlay" data-frame-id="${escapeHtml(template.id)}" data-render-mode="png-overlay" style="position:relative;width:${template.canvas.width}px;height:${template.canvas.height}px;overflow:hidden;isolation:isolate;background:${escapeHtml(template.slotBackground)};">
      ${slots}
      <img class="ph-frame-overlay" src="${escapeHtml(overlayUrl)}" alt="" aria-hidden="true" draggable="false" decoding="async" style="position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:fill;pointer-events:none;user-select:none;z-index:20;" />
      <div class="ph-metadata-layer" style="position:absolute;inset:0;z-index:25;pointer-events:none;">
        ${metadataZone('ph-caption', zones.caption)}
        ${metadataZone('ph-date', zones.date)}
        ${metadataZone('ph-brand', zones.brand)}
      </div>
      <div class="ph-sticker-layer" style="position:absolute;inset:0;z-index:30;pointer-events:none;"></div>
    </div>
  `;
}


export async function waitForOverlayImage(canvasEl) {
  const image = canvasEl.querySelector('.ph-frame-overlay');
  if (!image) return;

  if (image.complete) {
    if (image.naturalWidth > 0) return;
    throw new Error('Overlay frame gagal dimuat.');
  }

  await new Promise((resolve, reject) => {
    let settled = false;
    const cleanup = () => {
      image.removeEventListener('load', onLoad);
      image.removeEventListener('error', onError);
      clearTimeout(timeout);
    };
    const settle = (callback) => {
      if (settled) return;
      settled = true;
      cleanup();
      callback();
    };
    const onLoad = () => settle(resolve);
    const onError = () => settle(() => reject(new Error('Overlay frame gagal dimuat.')));
    const timeout = setTimeout(() => {
      settle(() => reject(new Error('Overlay frame terlalu lama dimuat.')));
    }, 8000);
    image.addEventListener('load', onLoad, { once: true });
    image.addEventListener('error', onError, { once: true });
  });
}
