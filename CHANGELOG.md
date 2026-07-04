# Changelog — Polara (Photobooth Digital)

Format: [Keep a Changelog](https://keepachangelog.com/id/1.1.0/) · Versi: [SemVer](https://semver.org/lang/id/).
Lihat aturan lengkap di `../KONVENSI-VERSI.md`.

## [Unreleased]
> **⏳ NUNGGU ASET TRANSPARAN dari Henry** (regenerate GPT, PNG transparan ~2000px, acuan `assets/Polara Final Brand Kit.png`). Yang UDAH bener: `assets/brand/logo-polara.png`. Yang MASIH no-alpha (background putih ke-bake — muncul sbg kotak putih di frame, sticker tray, & thumbnail preview):
> - `assets/mascot/`: `poca-wink` · `poca-camera` · `poca-peeking` · `mascot-poca-hero`
> - `assets/stickers/`: `sticker-cute` · `sticker-snap` · `sticker-purrfect`
> - `assets/brand/`: `app-icon` · `watermark-made-with-polara` · `secondary-app-icon`
- Backlog: export GIF/video buat **Live Frame** (diferensiasi utama, lihat RISET.md).
- Sticker tray cuma buat kategori `purikura` — kategori lain butuh set stiker sendiri.
- Catatan code-review (low, keputusan Henry): `.tpl-btn` (`<button>`) memuat `<iframe>` thumbnail — teknis "interactive content" di dalam button = HTML kurang valid, TAPI fungsional aman & keyboard OK (iframe `tabindex=-1` + `pointer-events:none`, verified). Strict-valid = ganti ke `div[role=button]` + keydown handler.
- Placed sticker cuma bisa digeser pakai pointer (belum keyboard) — WCAG 2.1.1 minor; penempatan & hapus udah keyboard-OK.
- Catatan code-review (low, PRE-EXISTING bukan regresi): pas `exportPng`, console kebanjiran `SecurityError: cssRules` dari `html-to-image` yang coba baca stylesheet cross-origin (Google Fonts). NON-FATAL — export tetap hasilin PNG benar. Kalau mau bersihin: embed font sendiri / pakai opsi `skipFonts`+`fontEmbedCSS` di html-to-image (task terpisah).

## [0.6.0] - 2026-07-04
### Added
- **Preview frame di picker** (jawab keluhan "nggak ada preview"): tiap template nampil thumbnail live-nya — render via `<iframe srcdoc>` (isolasi CSS penuh, nggak perlu scoping), di-scale pas tinggi kotak + center horizontal. Dimensi single 1080×1350 / strip 720×1800 (`templateDims`). Additive & aman: kalau gagal, kotak kosong tapi tombol tetap jalan. `loader.js` +`loadTemplateDoc`/`buildTemplateDoc`; `templates/index.js` +`resolveTemplateDoc`/`templateDims`.
- **Empty-state kamera**: pas kamera loading/ditolak, tampil mascot Poca + pesan ramah (bukan kotak kosong). Tombol Jepret di-disable kalau kamera nggak aktif (cegah capture kosong).
- **`serve.py`** — dev server no-cache + multi-thread; ganti `python -m http.server`. Fix DUA masalah lama: (1) browser nyimpen CSS/JS lama (nggak perlu hard-refresh terus), (2) single-thread bikin gambar gede kadang gagal load bareng. `run-polara.bat` diupdate.
### Fixed (accessibility — audit WCAG 2.1 AA)
- Kontras teks lolos AA: kategori `.cat` (`--muted` #9c8577→#6b4a37 = 3.35→7.61) & tagline "share the fun" (#ec5e9e→#a62f6b = 3.15→6.48).
- `#status` +`role="status"`+`aria-live="polite"` → update/error dibacain screen reader (4.1.3).
- Tombol hapus stiker ✕: `<span>`→`<button>`+`aria-label` → keyboard-accessible (2.1.1/4.1.2).
- Focus indicator +`outline` solid (2.4.7/1.4.11); `<aside>` +`aria-label`; judul dobel `<h3>Template` dihapus; thumbnail iframe `aria-hidden`.
### Changed
- Picker dibangun sekali (klik = update active class, bukan rebuild) → thumbnail nggak regenerate/flicker.

## [0.5.0] - 2026-07-04
### Added
- **Redesign brand "Polara Purr / Sticker Pop"** (skill `/ui-ux-pro-max`): `styles/tokens.css` (palet warm-cream + bubblegum pink dari brand kit, font Fredoka/Nunito) + `index.html` di-reskin total — header logo transparan, layout "studio" 3-kolom responsif (mobile: picker jadi strip horizontal), tombol emoji → inline **SVG**, kartu gaya stiker (outline cozy-brown + shadow), info card + mascot Poca, tagline "share the fun", favicon. Kontrak template (`.ph-canvas` dst) & engine (camera/compositor) TIDAK disentuh. Terverifikasi: tema cream/pink kepakai, 11 template render ter-scope (nggak bocor), export PNG jalan.
- **Struktur aset dirapiin** (ikut saran GPT): `assets/brand/` (logo, app-icon, watermark) · `assets/mascot/` (poca-hero + 3 pose) · `assets/stickers/` (3 kata-stiker). Path diupdate di `src/modules/stickers/index.js` + 2 template (`poca-purikura`, `seoul-snap-y2k`).
### Fixed
- `sticker-cute.png` yang hilang direstore (dari `_originals/`) ke `assets/stickers/`.
### Catatan
- ⚠️ **Cache browser**: kalau habis update file keliatan "nggak berubah / banyak bug", **hard-refresh (Ctrl+Shift+R)** — `python http.server` nggak kirim header no-cache, jadi browser suka nyimpen CSS/JS lama.

## [0.4.1] - 2026-07-03
### Fixed
- **BUG BESAR: CSS template bocor ke seluruh app.** File template GPT itu dokumen HTML utuh dengan CSS level-halaman (`html`/`body`/`*`/`:root`). Loader v0.3.0 ambil `<style>` mentah-mentah → aturan `body{display:grid;padding:40px}` & `html,body{background:pink}` ke-apply ke app → tema gelap & layout rusak tiap kali pilih template. `loader.js` sekarang SCOPE semua CSS template ke `.ph-canvas` pakai CSSOM (`:root`→`.ph-canvas`, `*`→`.ph-canvas *`, rule `html`/`body` dibuang, sisanya di-prefix `.ph-canvas `). Handle `@media`/`@keyframes` dengan benar. Terverifikasi: `body` app nggak berubah lagi pas render template.

## [0.4.0] - 2026-07-03
### Added
- **Fitur sticker picker** (photobooth-style): `src/modules/stickers/index.js` (registry pack stiker per kategori template) + `placeSticker()`/`makeDraggable()` di `compositor.js`. Setelah jepret, tray stiker muncul (kalau kategori template punya pack) — tap stiker → nempel di tengah kanvas, bisa digeser (drag, pointer events, ada koreksi skala buat `transform:scale()` di stage), ada tombol ✕ buat hapus. Ikut ke-export ke PNG final (tombol ✕ disembunyikan pas export).
- `run-polara.bat` — shortcut buka app (jalanin `python -m http.server 5510` + auto-buka browser). Udah ke-cover `.gitignore` (`*.bat` udah di-ignore).
### Fixed
- `exportPng()` sekarang retry otomatis 3x kalau fetch gambar gagal (misal koneksi lemot pas embed banyak gambar sekaligus) + `cacheBust` dimatikan (gambar udah ke-load di DOM, nggak perlu fetch ulang paksa ke jaringan tiap export).
### Changed
- 7 PNG di `assets/poca/poca-porikura/` di-resize 1254px→600px, ~1.1MB→~300KB (original di-backup di `_originals/`) — biar export lebih ringan & cepat.

## [0.3.0] - 2026-07-03
### Added
- **10 template baru dari GPT diregistrasi ke app** (`src/modules/templates/index.js`): 5 prioritas viral 🔴 (Polara Daily/Newspaper, Seoul Snap Y2K, Vintage Film Lo-Fi, Poca Purikura, Live Frame Cinemagraph) + 5 sekunder 🟠🟡 (Cyber Y2K Neon, Aura Gradient, Dark Romantic, Cottagecore, Trading Card) — total 11 template termasuk Kosmik lama. Semua 10 kategori riset di `RISET.md` sudah punya template.
- `src/modules/templates/loader.js` — loader lazy-fetch: file HTML standalone dari GPT (punya `<head>`+`<style>`+`<body>`) di-fetch & di-parse (DOMParser), diambil cuma `<style>`+`.ph-canvas`-nya, plus Google Fonts `<link>` disuntik otomatis ke document. File asli GPT nggak perlu dipotong manual.
### Fixed
- Path & nama file asset salah di 2 template (`poca-purikura.single.v2.html`, `seoul-snap-y2k.single.html`) — GPT nebak nama file (`kucing_lucu_dengan_kamera_pink.png` dst) yang beda dari nama asli di `assets/poca/poca-porikura/` (`poca-camera.png` dst), dan pakai path relatif `../../../assets/...` yang salah arah (app inject HTML via `innerHTML` ke `index.html` di root, bukan buka file template langsung, jadi path harus relatif ke root: `assets/...`).
- 7 PNG di `assets/poca/poca-porikura/` di-resize dari 1254px/~1.1MB ke 600px/~300KB (originalnya ke-backup di `assets/poca/poca-porikura/_originals/`) — ukuran raw jauh lebih besar dari display size (~150-290px), bikin export PNG lemot/kadang gagal pas load bareng.
### Changed
- `renderTemplate()` (compositor.js) sekarang terima HTML string langsung (bukan objek template) — resolusi lazy-load dipisah ke `resolveTemplateHtml()` (index.js templates), dipanggil `await` sebelum render di `app.js`.

## [0.2.0] - 2026-06-28
### Added
- **Scaffold engine Fase 1** (modular vanilla per `docs/DESIGN.md`): `index.html` shell kosmik, `src/core/camera.js` (webcam + capture un-mirror), `src/core/compositor.js` (inject foto ke `.ph-slot` + export PNG via `html-to-image`), `src/modules/templates/` (registry + template Kosmik), `styles/tokens.css`. Verified load bersih (no JS error, shell+template render, camera-error ke-handle). Dijalanin via `launch.json` config "polara" (port 5510).

## [0.1.0] - 2026-06-28
### Added
- Riset pasar + strategi (`docs/RISET.md`): 10 template viral 2026 + analisis Blok M. Insight kunci: **Live Frame/GIF = diferensiasi** (booth fisik nggak punya), B2B kiosk = paling scalable.
- Spec produk (Henry): `docs/PRD.md`, `docs/DESIGN.md` (arsitektur modular vanilla), `docs/TEMPLATE-SPEC.md` (brief GPT bikin template HTML/CSS).
### Removed
- Draf awal salah-asumsi (`docs/KONSEP.md` React + `public/frames/` PNG) → diganti pendekatan resmi **vanilla HTML/JS/CSS + template HTML** sesuai PRD/DESIGN.
