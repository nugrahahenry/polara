// ─── modules/stickers/index.js ────────────────────────────────────────────────
// Registry stiker. Sekarang UNIVERSAL — pack yang sama muncul di semua frame
// (dulu cuma purikura). Aset: mascot Poca di assets/mascot/, kata-stiker di
// assets/stickers/. Tambah stiker: taruh PNG transparan, daftarin di array.
const MASCOT = 'assets/mascot/';
const STICKER = 'assets/stickers/';

const universal = [
  { id: 'sticker-cute', name: 'Cute!', file: STICKER + 'sticker-cute.png' },
  { id: 'sticker-snap', name: 'Snap!', file: STICKER + 'sticker-snap.png' },
  { id: 'sticker-purrfect', name: 'Purr-fect!', file: STICKER + 'sticker-purrfect.png' },
  { id: 'poca-wink', name: 'Poca Wink', file: MASCOT + 'poca-wink.png' },
  { id: 'poca-camera', name: 'Poca Kamera', file: MASCOT + 'poca-camera.png' },
  { id: 'poca-peeking', name: 'Poca Ngintip', file: MASCOT + 'poca-peeking.png' },
];

// category diabaikan buat sekarang (pack universal); nanti bisa per-kategori.
export const getStickerPack = (_category) => universal;
