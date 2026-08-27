export function getRevealDossier({ mode, frameName, stickerCount = 0 } = {}) {
  const strip = Number(mode) === 3;
  const count = Math.max(0, Number(stickerCount) || 0);
  return {
    format: strip ? 'Strip 3 · 720×1800' : 'Single · 1080×1350',
    frame: frameName || 'Polara frame',
    decorations: count ? `${count} sticker${count === 1 ? '' : 's'}` : 'No stickers',
    privacy: 'Local-only session',
  };
}
