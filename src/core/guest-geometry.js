// Shared Pose Mate geometry for the live camera, Review, template preview, and
// pixel export. The guest source stays proportional; only the declared crop
// is used to cover the guest region.

export function computeGuestGeometry(composition, sourceWidth, sourceHeight, viewportWidth, viewportHeight, viewportX = 0, viewportY = 0) {
  if (!composition) return null;
  const sw = Math.max(1, Number(sourceWidth) || 1);
  const sh = Math.max(1, Number(sourceHeight) || 1);
  const vw = Math.max(1, Number(viewportWidth) || 1);
  const vh = Math.max(1, Number(viewportHeight) || 1);
  const region = composition.guestRegion;
  const regionX = viewportX + region.x * vw;
  const regionY = viewportY + region.y * vh;
  const regionWidth = region.width * vw;
  const regionHeight = region.height * vh;
  const crop = composition.guestCrop;
  const sourceX = crop ? crop.x * sw : 0;
  const sourceY = crop ? crop.y * sh : 0;
  const sourceCropWidth = crop ? crop.width * sw : sw;
  const sourceCropHeight = crop ? crop.height * sh : sh;
  const scale = crop
    ? Math.max(regionWidth / sourceCropWidth, regionHeight / sourceCropHeight)
    : Math.min(regionWidth / sourceCropWidth, regionHeight / sourceCropHeight);
  const imageWidth = sw * scale;
  const imageHeight = sh * scale;
  const imageX = crop
    ? regionX + regionWidth / 2 - (crop.x + crop.width / 2) * imageWidth
    : regionX + (regionWidth - imageWidth) / 2;
  const imageY = crop
    ? regionY + regionHeight - (crop.y + crop.height) * imageHeight
    : regionY + regionHeight - imageHeight;

  return Object.freeze({
    viewport: Object.freeze({ x: viewportX, y: viewportY, width: vw, height: vh }),
    region: Object.freeze({ x: regionX, y: regionY, width: regionWidth, height: regionHeight }),
    natural: Object.freeze({ width: sw, height: sh }),
    source: Object.freeze({ x: sourceX, y: sourceY, width: sourceCropWidth, height: sourceCropHeight }),
    image: Object.freeze({ x: imageX, y: imageY, width: imageWidth, height: imageHeight }),
    scale,
    mirrored: Boolean(composition.flipGuest),
  });
}

function elementSize(element) {
  return {
    width: element?.clientWidth || element?.offsetWidth || 0,
    height: element?.clientHeight || element?.offsetHeight || 0,
  };
}

export function applyGuestImageGeometry(image, composition, { container = image?.parentElement, viewport = null } = {}) {
  if (!image || !composition || !container) return null;
  const size = elementSize(container);
  const target = viewport || { x: 0, y: 0, width: size.width, height: size.height };
  if (!target.width || !target.height) return null;
  const geometry = computeGuestGeometry(
    composition,
    image.naturalWidth,
    image.naturalHeight,
    target.width,
    target.height,
    target.x,
    target.y,
  );
  if (!geometry) return null;

  // The layer is the exact clip window used by the canvas path. Keeping the
  // image inside the layer avoids percentage width/height distortion on a
  // portrait slot and keeps the crop identical in preview and export.
  const layer = image.parentElement;
  if (layer && layer !== container && layer.classList.contains('pose-guest-layer')) {
    Object.assign(layer.style, {
      position: 'absolute',
      left: `${geometry.region.x}px`,
      top: `${geometry.region.y}px`,
      width: `${geometry.region.width}px`,
      height: `${geometry.region.height}px`,
      overflow: 'hidden',
      pointerEvents: 'none',
    });
    Object.assign(image.style, {
      position: 'absolute',
      display: 'block',
      maxWidth: 'none',
      width: `${geometry.image.width}px`,
      height: `${geometry.image.height}px`,
      left: `${geometry.image.x - geometry.region.x}px`,
      top: `${geometry.image.y - geometry.region.y}px`,
      objectFit: 'fill',
      objectPosition: 'center',
      transform: geometry.mirrored ? 'scaleX(-1)' : 'none',
      transformOrigin: 'center center',
      pointerEvents: 'none',
    });
  } else {
    Object.assign(image.style, {
      position: 'absolute',
      display: 'block',
      maxWidth: 'none',
      width: `${geometry.image.width}px`,
      height: `${geometry.image.height}px`,
      left: `${geometry.image.x}px`,
      top: `${geometry.image.y}px`,
      objectFit: 'fill',
      objectPosition: 'center',
      transform: geometry.mirrored ? 'scaleX(-1)' : 'none',
      transformOrigin: 'center center',
      pointerEvents: 'none',
    });
  }
  return geometry;
}

export function drawGuestGeometry(ctx, image, geometry) {
  if (!ctx || !image || !geometry) return;
  const { region, image: destination } = geometry;
  ctx.save();
  ctx.beginPath();
  ctx.rect(region.x, region.y, region.width, region.height);
  ctx.clip();
  if (geometry.mirrored) {
    ctx.translate(destination.x * 2 + destination.width, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight, destination.x, destination.y, destination.width, destination.height);
  ctx.restore();
}

export function guestGeometryInvariant(geometry) {
  if (!geometry) return false;
  const sourceRatio = geometry.image.width / geometry.image.height;
  const naturalRatio = geometry.natural.width / geometry.natural.height;
  return Number.isFinite(sourceRatio) && Number.isFinite(naturalRatio)
    && Math.abs(sourceRatio - naturalRatio) < 1e-9
    && geometry.region.width > 0
    && geometry.region.height > 0;
}
