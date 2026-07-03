// ─── modules/stickers/index.js ────────────────────────────────────────────────
// Registry stiker per kategori template. Tiap kategori (lihat templates/index.js)
// bisa punya pack stiker sendiri — kosong = tray nggak muncul buat template itu.
// Tambah pack baru: taruh PNG transparan di assets/<kategori>/, daftarin di sini.
const PURIKURA_DIR = 'assets/poca/poca-porikura/';

const packs = {
  purikura: [
    { id: 'poca-camera', name: 'Poca Kamera', file: PURIKURA_DIR + 'poca-camera.png' },
    { id: 'poca-peeking', name: 'Poca Ngintip', file: PURIKURA_DIR + 'poca-peeking.png' },
    { id: 'poca-wink', name: 'Poca Wink', file: PURIKURA_DIR + 'poca-wink.png' },
    { id: 'sticker-cute', name: 'Cute!', file: PURIKURA_DIR + 'sticker-cute.png' },
    { id: 'sticker-snap', name: 'Snap!', file: PURIKURA_DIR + 'sticker-snap.png' },
    { id: 'sticker-purrfect', name: 'Purr-fect!', file: PURIKURA_DIR + 'sticker-purrfect.png' },
  ],
};

export const getStickerPack = (category) => packs[category] || [];
