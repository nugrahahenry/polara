const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function rotatedHalfExtent(size, rotation) {
  const radians = (Number(rotation) || 0) * Math.PI / 180;
  return (size * (Math.abs(Math.cos(radians)) + Math.abs(Math.sin(radians))) / 2);
}

export function getStickerSafeBounds({
  scale,
  rotation = 0,
  canvasWidth = 1080,
  canvasHeight = 1350,
  inset = 0.012,
} = {}) {
  const size = canvasWidth * (Number(scale) || 0);
  const halfExtent = rotatedHalfExtent(size, rotation);
  const halfWidth = halfExtent / canvasWidth;
  const halfHeight = halfExtent / canvasHeight;
  return {
    minX: clamp(halfWidth + inset, 0, 0.5),
    maxX: clamp(1 - halfWidth - inset, 0.5, 1),
    minY: clamp(halfHeight + inset, 0, 0.5),
    maxY: clamp(1 - halfHeight - inset, 0.5, 1),
  };
}

export function clampStickerToCanvas(item, canvasWidth = 1080, canvasHeight = 1350, inset = 0.012) {
  if (!item) return item;
  const bounds = getStickerSafeBounds({
    scale: item.scale,
    rotation: item.rotation,
    canvasWidth,
    canvasHeight,
    inset,
  });
  item.x = clamp(Number(item.x) || 0.5, bounds.minX, bounds.maxX);
  item.y = clamp(Number(item.y) || 0.5, bounds.minY, bounds.maxY);
  return item;
}
