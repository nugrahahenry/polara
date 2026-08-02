// ─── modules/stickers/index.js ────────────────────────────────────────────────
// Registry tunggal untuk asset UI dan asset editor. Mascot tidak pernah masuk
// export otomatis; hanya item type=sticker yang dapat dibuat menjadi objek editor.
const MASCOT = 'assets/mascot/';
const STICKER = 'assets/stickers/';

export const mascots = [
  { id: 'poca-wave', type: 'mascot', name: 'Poca melambai', src: MASCOT + 'poca-wave.png', usage: 'start', loading: 'preload', exportPolicy: 'ui-only' },
  { id: 'poca-sleepy-loading', type: 'mascot', name: 'Poca menunggu', src: MASCOT + 'poca-sleepy-loading.png', usage: 'processing', loading: 'preload', exportPolicy: 'ui-only' },
  { id: 'poca-pointing-down', type: 'mascot', name: 'Poca menunjuk', src: MASCOT + 'poca-pointing-down.png', usage: 'guidance', loading: 'lazy', exportPolicy: 'ui-only' },
  { id: 'poca-peace', type: 'mascot', name: 'Poca peace', src: MASCOT + 'poca-peace.png', usage: 'reveal', loading: 'lazy-before-reveal', exportPolicy: 'ui-only' },
  { id: 'poca-face', type: 'mascot', name: 'Wajah Poca', src: MASCOT + 'poca-face.png', usage: 'tray', loading: 'lazy', exportPolicy: 'ui-only' },
  { id: 'poca-holding-photo-frame', type: 'mascot', name: 'Poca membawa frame', src: MASCOT + 'poca-holding-photo-frame.png', usage: 'frame-guidance', loading: 'lazy', exportPolicy: 'ui-only' },
  { id: 'poca-excited-jump', type: 'mascot', name: 'Poca melompat', src: MASCOT + 'poca-excited-jump.png', usage: 'reveal-celebration', loading: 'lazy-before-reveal', exportPolicy: 'ui-only' },
];

export const stickers = [
  {
    id: 'text-pose', type: 'sticker', name: 'POSE!', src: STICKER + 'text-pose.png',
    exportPolicy: 'preview-and-export', defaultTransform: { x: .5, y: .72, scale: .22, rotation: -6 }, minScale: .08, maxScale: .38,
  },
  {
    id: 'sparkle-blue', type: 'sticker', name: 'Sparkle Biru', src: STICKER + 'sparkle-blue.png',
    exportPolicy: 'preview-and-export', defaultTransform: { x: .17, y: .18, scale: .14, rotation: -8 }, minScale: .08, maxScale: .38,
  },
  {
    id: 'heart-pink', type: 'sticker', name: 'Hati Pink', src: STICKER + 'heart-pink.png',
    exportPolicy: 'preview-and-export', defaultTransform: { x: .83, y: .18, scale: .14, rotation: 9 }, minScale: .08, maxScale: .38,
  },
  {
    id: 'paw-purple', type: 'sticker', name: 'Paw Ungu', src: STICKER + 'paw-purple.png',
    exportPolicy: 'preview-and-export', defaultTransform: { x: .18, y: .8, scale: .14, rotation: -8 }, minScale: .08, maxScale: .38,
  },
  {
    id: 'paw-pink', type: 'sticker', name: 'Paw Pink', src: STICKER + 'paw-pink.png',
    exportPolicy: 'preview-and-export', defaultTransform: { x: .82, y: .8, scale: .14, rotation: 8 }, minScale: .08, maxScale: .38,
  },
  {
    id: 'sparkle-yellow', type: 'sticker', name: 'Sparkle Kuning', src: STICKER + 'sparkle-yellow.png',
    exportPolicy: 'preview-and-export', defaultTransform: { x: .82, y: .18, scale: .14, rotation: 8 }, minScale: .08, maxScale: .38,
  },
  {
    id: 'camera-doodle', type: 'sticker', name: 'Kamera', src: STICKER + 'camera-doodle.png',
    exportPolicy: 'preview-and-export', defaultTransform: { x: .18, y: .5, scale: .17, rotation: -5 }, minScale: .08, maxScale: .4,
  },
  {
    id: 'star-charm', type: 'sticker', name: 'Bintang Poca', src: STICKER + 'star-charm.png',
    exportPolicy: 'preview-and-export', defaultTransform: { x: .82, y: .5, scale: .15, rotation: 7 }, minScale: .08, maxScale: .4,
  },
  {
    id: 'speech-bubble', type: 'sticker', name: 'Balon Kata', src: STICKER + 'speech-bubble.png',
    exportPolicy: 'preview-and-export', defaultTransform: { x: .5, y: .82, scale: .2, rotation: -3 }, minScale: .1, maxScale: .42,
  },
  {
    id: 'photo-buddy-badge', type: 'sticker', name: 'Photo Buddy', src: STICKER + 'photo-buddy-badge.png',
    exportPolicy: 'preview-and-export', defaultTransform: { x: .5, y: .18, scale: .18, rotation: 3 }, minScale: .1, maxScale: .42,
  },
  // Aset lama tetap dipertahankan setelah audit karena masih konsisten sebagai word sticker.
  {
    id: 'sticker-cute', type: 'sticker', name: 'Cute!', src: STICKER + 'sticker-cute.png',
    exportPolicy: 'preview-and-export', legacy: true, defaultTransform: { x: .5, y: .32, scale: .2, rotation: -4 }, minScale: .08, maxScale: .4,
  },
  {
    id: 'sticker-snap', type: 'sticker', name: 'Snap!', src: STICKER + 'sticker-snap.png',
    exportPolicy: 'preview-and-export', legacy: true, defaultTransform: { x: .76, y: .78, scale: .2, rotation: 6 }, minScale: .08, maxScale: .4,
  },
  {
    id: 'sticker-purrfect', type: 'sticker', name: 'Purr-fect!', src: STICKER + 'sticker-purrfect.png',
    exportPolicy: 'preview-and-export', legacy: true, defaultTransform: { x: .5, y: .84, scale: .22, rotation: -3 }, minScale: .08, maxScale: .42,
  },
];

export const getStickerPack = () => stickers;
export const getMascot = (id) => mascots.find((asset) => asset.id === id) || null;

export function createStickerInstance(asset) {
  const transform = asset.defaultTransform || { x: .5, y: .5, scale: .2, rotation: 0 };
  const uid = globalThis.crypto?.randomUUID?.() || `${asset.id}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return {
    uid,
    assetId: asset.id,
    name: asset.name,
    src: asset.src,
    x: transform.x,
    y: transform.y,
    scale: transform.scale,
    rotation: transform.rotation,
    minScale: asset.minScale || .08,
    maxScale: asset.maxScale || .42,
  };
}

export function preloadMascots() {
  mascots.filter((asset) => asset.loading === 'preload').forEach((asset) => {
    const image = new Image();
    image.src = asset.src;
  });
}
