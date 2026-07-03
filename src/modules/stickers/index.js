// ─── modules/stickers/index.js ────────────────────────────────────────────────
// Registry stiker per kategori template. Tiap kategori (lihat templates/index.js)
// bisa punya pack stiker sendiri — kosong = tray nggak muncul buat template itu.
// Aset: mascot Poca di assets/mascot/, kata-stiker di assets/stickers/.
// Tambah pack baru: taruh PNG transparan, daftarin di sini.
const MASCOT = 'assets/mascot/';
const STICKER = 'assets/stickers/';

const packs = {
  purikura: [
    { id: 'poca-wink', name: 'Poca Wink', file: MASCOT + 'poca-wink.png' },
    { id: 'poca-camera', name: 'Poca Kamera', file: MASCOT + 'poca-camera.png' },
    { id: 'poca-peeking', name: 'Poca Ngintip', file: MASCOT + 'poca-peeking.png' },
    { id: 'sticker-cute', name: 'Cute!', file: STICKER + 'sticker-cute.png' },
    { id: 'sticker-snap', name: 'Snap!', file: STICKER + 'sticker-snap.png' },
    { id: 'sticker-purrfect', name: 'Purr-fect!', file: STICKER + 'sticker-purrfect.png' },
  ],
};

export const getStickerPack = (category) => packs[category] || [];
