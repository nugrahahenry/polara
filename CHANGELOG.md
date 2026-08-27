# Changelog — Polara (Photobooth Digital)

Format: [Keep a Changelog](https://keepachangelog.com/id/1.1.0/) · Versi: [SemVer](https://semver.org/lang/id/).
Lihat aturan lengkap di `../../KONVENSI-VERSI.md`.

## [Unreleased]

## [0.30.0] - 2026-08-28

### Added
- Tambahkan **Asset Quality System v2** dengan profil canonical `frame-family-v2` untuk tujuh keluarga dan empat belas variant produksi.
- Tambahkan **Selected Edition Dossier** pada tahap Frame untuk menampilkan cerita, material, palette, serta Poca Exclusive yang cocok dengan frame aktif.
- Tambahkan regression contract untuk kelengkapan profil keluarga, parity Single/Strip, pasangan exclusive sticker, dan batas UI-only dossier.

### Changed
- Ringkas kartu picker dengan menghapus badge Hero yang berulang, mempertahankan label format, dan menambahkan material tiap keluarga sebagai informasi pembanding.
- Perjelas Sticker Bench dengan nama Poca Exclusive aktif, jumlah sticker universal, serta label pasangan frame tanpa auto-add atau mengubah sticker yang sudah ditempatkan.
- Naikkan asset quality policy ke `polara-asset-quality-v2` dan selaraskan schema manifest dengan tujuh keluarga, geometry produksi, composite picker, quality profile, serta edge palette.

### Validation
- Node 73/73, Python 10/10, overlay 14/14, preview derivative 28/28, Asset Quality 14 frame/26 sticker/11 mascot/3 guest, source syntax, dan JSON parse lulus.
- QA produksi lulus pada 390×844, 768×1024, 1440×900, serta 900×510 untuk enam tahap dengan overflow 0, target pendek 0, primary action terlihat, dan runtime error 0.
- Selected Edition Dossier tetap berada di dalam control sheet pada empat viewport; frame rail menampilkan sekitar 2,05 sampai 2,58 kartu, mendukung Home/End, dan memulihkan scroll horizontal setelah Back.
- Seluruh 14 variant lulus preview/export parity. Output tepat Single 1080×1350 dan Strip 720×1800; camera denied recovery, fake-device capture, retake satu slot, Poca choreography, reduced motion, focus return, serta rapid transition lock lulus.
- Review screenshot mobile dan desktop menghasilkan satu fix wave untuk kepadatan dossier dan timing evidence overlay. Konfirmasi akhir lulus; detector Impeccable berjalan sekali dan mengembalikan daftar kosong dalam mode regex-degraded.

## [0.29.0] - 2026-08-28

### Added
- Tambahkan **Poca Print Room Opening** sebagai pembuka singkat dan fail safe yang memakai aset Poca produksi sebelum meja foto siap digunakan.
- Tambahkan regression contract untuk urutan pembuka, focus protection, reduced motion, footer responsif, serta larangan em dash dan en dash pada copy aplikasi publik.

### Changed
- Humanize copy pada Start, Camera, Frames, Reveal, dialog sesi, status export, dan privasi tanpa mengubah product truth atau flow enam tahap.
- Susun ulang footer sebagai proof ticket ringkas dengan tautan canonical `hnry.dev`, WhatsApp, Instagram, dan GitHub pada desktop, tablet, mobile, serta short landscape.
- Hubungkan bukaan kertas pembuka ke satu transisi meja proof, dengan jalur instan untuk reduced motion dan safe area pada perangkat berponi.

### Validation
- Node 69/69, Python 10/10, overlay 14/14, Asset Quality 14 frame/26 sticker/11 mascot/3 guest, dan source syntax lulus.
- QA produksi final lulus pada 390×844, 768×1024, 1440×900, serta 900×510 untuk enam tahap dengan overflow 0, target pendek 0, primary action terlihat, dan runtime error 0.
- Opening audit membuktikan proof berada penuh di viewport, workspace serta skip link inert selama boot, fail safe tetap aktif sampai inisialisasi selesai, dan interaksi pulih setelah shutter terbuka.
- Seluruh 14 variant lulus preview/export parity; output tepat Single 1080×1350 dan Strip 720×1800. Camera denied recovery, fake-device capture, retake satu slot, keyboard rail, reduced motion, dialog focus return, serta rapid transition lock lulus.
- Finish review menutup fail-safe boot, fokus skip link, dan evidence footer sempit dengan disposition **SHIP**. Detector Impeccable berjalan sekali dan mengembalikan 0 finding dalam mode regex-degraded karena parser HTML/CSS tidak tersedia.

## [0.28.1] - 2026-08-27

### Fixed
- Ringkas copy Reveal ready yang redundan pada seluruh viewport agar Approval Dossier menjaga ruang aman di atas action dock, sementara processing explanation tetap tersedia.
- Buat harness menunggu operation lock Decorate selesai sebelum masuk Reveal dan validasi radius rounded-rectangle exact per keluarga (Daily/Midnight 14 px, Cloud Picnic 34/24 px, Lucky Ticket 20 px).

### Validation
- QA produksi lulus pada 390×844, 768×1024, 1440×900, dan 900×510 untuk semua enam tahap tanpa horizontal overflow, target pendek, action terpotong, overlap companion, atau runtime error.
- Seluruh 14 variant lulus preview/export geometry; exact output lulus Single 1080×1350 dan Strip 720×1800.
- Camera denied recovery, fake-device capture, retake satu slot, tray Home/End, scroll restoration, dialog focus return, reduced motion, Reveal presentation-only, rapid transition lock, serta enam Proof Stamp lulus.

## [0.28.0] - 2026-08-27

### Added
- Reveal **Approval Dossier** sebagai UI-only receipt yang merangkum format exact, frame aktif, jumlah sticker, dan local-only truth dari state sesi nyata.
- Pure dossier contract serta regression guard agar detail Reveal tidak pernah menjadi bagian export canvas dan tetap konsisten untuk Single maupun Strip.

### Changed
- Ubah Reveal ready dari panel success yang kosong menjadi hasil studio terarah dengan Proof Approved seal, fact grid, paper perforation detail, serta layout ringkas untuk mobile dan short landscape.
- Dossier hanya masuk setelah processing Sleepy Loading selesai; reduced motion menghapus entrance motion tanpa menyembunyikan informasi atau aksi.

### Validation
- Reveal dossier regression direkam RED sebelum implementasi; contract Single/Strip, local-only copy, UI/export boundary, dan reduced-motion surface kemudian lulus.
- Node 64/64, Asset Quality 14 frame/26 sticker/11 mascot/3 guest, source syntax, dan diff check lulus. Impeccable detector berjalan sekali setelah UI selesai; tiga warning regex-degraded adalah gambar Pose Mate hidden yang diberi source tervalidasi sebelum ditampilkan, bukan broken runtime images.

## [0.27.0] - 2026-08-27

### Added
- Enam sticker universal original dengan fungsi berbeda: Good Day Ribbon, Day Dream Cloud, Keep This Ticket, Proof Keeper Tape, Confetti Pop, dan Best Day.
- Metadata kategori `word`, `charm`, `prop`, `accent`, `material`, dan `exclusive` untuk seluruh library, ditampilkan sebagai secondary label pada rail dan inspector Hias.
- Generator deterministik `polara-sticker-workshop-v2` serta regression contract untuk jumlah aset, kategori, transparansi, dan tray tanpa nested scroll.

### Changed
- Remaster Balon Kata menjadi **Say Hi!** serta Photo Buddy menjadi badge **Photo Buddy Club** dengan copy yang tetap terbaca pada ukuran picker.
- Perluas setiap family pack dari 14 menjadi 20 pilihan tanpa mengubah posisi Poca Exclusive sebagai opsi pertama atau memindahkannya ke overlay frame.

### Validation
- Focused Sticker Workshop regression direkam RED sebelum implementasi; audit raster delapan aset baru/remaster dan pemeriksaan bintang vektor lulus sebelum quality gate penuh.
- Generator lulus idempotensi 8/8; Asset Quality gate lulus untuk 14 frame/26 sticker/11 mascot/3 guest, hidden RGB nol, source syntax, dan Node 62/62.

## [0.26.0] - 2026-08-27

### Added
- Dua keluarga original baru: **Cloud Picnic** dan **Lucky Ticket**, masing-masing memiliki Single 1080×1350 serta Strip 720×1800.
- Dua Poca Exclusive original-fictional: Cloud Picnic dan Lucky Ticket, dengan alpha lokal, hidden RGB nol, dan provenance tanpa figur publik maupun klaim kolaborasi.
- Deterministic generator serta regression contract untuk kelengkapan keluarga, geometry, registry, exclusive sticker, dan rights metadata.

### Changed
- Perluas frame rail produksi dari lima keluarga/sepuluh variant menjadi tujuh keluarga/empat belas variant tanpa mengubah default Strip 3 atau flow canonical.

### Validation
- Pipeline aset lulus idempotensi 9/9; preview 28/28, overlay verifier 14/14, Asset Quality gate untuk 14 frame/20 sticker/11 mascot/3 guest, transparent hidden RGB, provenance, geometry polygon/rounded-rectangle, dan Node 59/59 lulus.
- Audit raster menghapus fringe chroma pada kedua Poca Exclusive sampai nol piksel tepi hijau mencurigakan, tanpa mengubah kiss-cut outline atau warna subjek.

## [0.25.0] - 2026-08-27

### Added
- Deterministic `polara-proof-edge-v1` remaster pipeline untuk seluruh lima keluarga dan sepuluh variant produksi.
- Shared registration corners serta family-coded proof swatches yang berada di luar photo windows dan tetap character-free.
- Regression contract untuk asset version, quality profile, palette, family count, dan generated registry.

### Changed
- Seluruh overlay, fallback frame-only, dan composite picker diregenerasi dari geometry canonical dengan profile `frame-overlay-v5`.

### Validation
- Remaster idempotent 10/10; preview check 20/20, overlay verifier 10/10, Asset Quality gate, hidden RGB, byte budget, registry parity, dan Node 57/57 lulus.

## [0.24.0] - 2026-08-27

### Added
- Komposisi **Unified Proof Desk** yang menyatukan stage dan control sheet pada desktop tanpa mengubah flow canonical.
- Browser surfaces terarah untuk selection, caret, focus, scrollbar, dan label produksi ringkas pada control sheet.
- Regression coverage untuk visual foundation serta tujuan footer canonical `hnry.dev`.

### Changed
- Rapikan density desktop, registration marks, material Start, dan hierarchy footer sambil mempertahankan mobile stacking, safe area, serta target 44×44 px.

### Validation
- Focused Node regression dan pemeriksaan metadata versi wajib lulus sebelum checkpoint v0.24.0 di-commit.

## [0.23.0] - 2026-08-27

### Added
- Tambahkan **Asset Quality System** lokal untuk memverifikasi path, registry, dimensi, alpha, hidden RGB, budget byte, provenance, orphan PNG, dan hak penggunaan aset produksi.
- Tambahkan generator deterministik untuk 10 thumbnail frame-only dan 10 composite picker dari geometry canonical serta fixture pasangan teman fiktif-sintetis orisinal.

### Changed
- Seluruh 10 variant kini memakai composite picker yang konsisten; `thumbnailSrc` kembali menjadi fallback frame-only dan tidak pernah dipakai sebagai hasil export.
- Kunci seluruh overlay sebagai `character-free`, hapus coupling mascot dari manifest frame, dan pertahankan Poca hanya sebagai exclusive sticker pilihan pengguna atau choreography UI-only.
- Pindahkan empat PNG mascot orphan/retired—termasuk `poca-pointing-down.png`—keluar dari bundle runtime ke source lokal `_originals`.

### Validation
- Regression Asset Quality direkam RED 3/3 lalu GREEN 3/3 sebelum integrasi penuh.
- Quality gate lulus untuk 10 frame, 18 sticker, 11 mascot, dan 3 guest; generator preview idempotent 20/20 serta overlay verifier 10/10.
- Suite final lulus Node 54/54, Python 10/10, provenance 21/21, exact Single/Strip, empat viewport tanpa overflow, accessibility runtime, console 0, finish review SHIP, dan security review PASS.

## [0.22.0] - 2026-08-27

### Added
- Tambahkan pose PM-01 **Neutral** dan **Peace** sebagai PNG RGBA 1254×1254 yang mempertahankan identitas, outfit, crop, serta pencahayaan guest fiktif existing.
- Tambahkan resolver pose deterministik: Single memakai Half-heart, sedangkan Strip 3 memakai Natural, Peace, dan Half-heart secara per-slot.

### Changed
- Preload seluruh pose hanya setelah opt-in Pose Mate, lalu gunakan composition per-slot yang sama pada Camera, Review, Frame, Hias, Reveal, framed export, dan Photo only.
- Perluas manifest provenance guest dengan parent `guestId`, pose, checksum, identity reference, dan status prompt embedded tanpa menambah figur publik atau klaim kolaborasi.

### Validation
- Regression pose pack direkam RED untuk mapping Single/Strip, manifest/hash, DOM preview, raw export, dan metadata sebelum implementasi.
- Neutral dan Peace lolos gate RGBA 1254×1254, alpha corner transparan, hidden RGB nol pada alpha 0, prompt embedded, dan ukuran runtime di bawah 1,2 MB.
- Suite final lulus: Node 51/51, Python 10/10, overlay 10/10, provenance 3/3, console 0, serta QA 390×844, 768×1024, 1440×900, dan 900×510 tanpa overflow horizontal material.
- Browser membuktikan Camera dan Review beralih Natural → Peace → Half-heart, Frame/Reveal memuat tiga aset per-slot, dan exact export tetap Strip 720×1800 serta Single 1080×1350.

## [0.21.0] - 2026-08-27

### Added
- Tambahkan **Pose Mate** sebagai pengalaman opt-in pada Start dengan guest PM-01 “Mina” yang fiktif-sintetis; Regular Booth tetap menjadi default.
- Tambahkan Matched Gesture, Side by Side, posisi guest kiri/kanan, pose cue per slot, manifest provenance, dan regression guard khusus Pose Mate.

### Changed
- Gunakan satu normalized guest composition untuk Review, Frame, Hias, Reveal, Save, Share, dan Photo only; capture kamera sumber tetap utuh dan tidak diberi guest.
- Render guest sebagai photo-layer di bawah PNG frame overlay, bukan sticker; aset baru dimuat setelah opt-in dan kegagalan guest mengembalikan sesi ke Regular Booth tanpa menghapus foto.
- Pastikan intent pengalaman terakhir selalu menang ketika preload masih berjalan, dan coba ulang Photo only tepat sekali tanpa guest jika hanya aset Pose Mate yang gagal.
- Perbarui privacy copy agar local processing Pose Mate dinyatakan eksplisit tanpa menambah akun, backend, cloud, AI runtime, atau fitur pembayaran.

### Validation
- Regression Pose Mate direkam RED 4/5 sebelum implementasi, lalu GREEN 7/7; suite Node 49/49, Python 10/10, overlay registry 10/10, syntax, whitespace, dan asset provenance dijalankan pada checkpoint.
- Alur Regular/Pose Mate, Matched/Side by Side, guest kiri/kanan, retake satu slot, Frame/Hias/Reveal, dan fallback demo diuji pada 390×844, 768×1024, 1440×900, serta 900×510.
- Preview, framed export, dan Photo only tetap exact: Strip 720×1800 dengan tiga guest layer dan Single 1080×1350 dengan satu guest layer; fresh browser review menghasilkan 0 error/warning.
- PM-01 memiliki prompt embedded dan manifest `fictional-synthetic`, `publicFigure:false`, serta `collaborationClaim:false`; scan menemukan 1 raster dan 0 provenance prompt hilang.

## [0.20.0] - 2026-08-19

### Added
- Tambahkan satu sticker Poca eksklusif untuk masing-masing keluarga Poca Purikura, Vintage Film Lo-Fi, Seoul Snap Y2K, Polara Daily, dan Midnight Club.
- Tampilkan sticker eksklusif sebagai pilihan pertama dengan badge dan nama aksesibel, diikuti tiga belas sticker universal yang tetap tersedia.

### Changed
- Bersihkan Poca yang sebelumnya menyatu ke enam overlay Poca Purikura, Polara Daily, dan Midnight Club; Poca sekarang opsional dan hanya masuk hasil ketika pengguna menambahkannya sebagai sticker.
- Perbarui preview picker character-free, label format Single/Strip 3, ukuran export, proof mat, dan proporsi kartu agar perbedaan frame lebih mudah dinilai di mobile maupun desktop.
- Pertahankan sticker yang sudah ditempatkan ketika frame berganti, tetapi katalog selalu menampilkan exclusive milik keluarga frame aktif.

### Validation
- Regression sticker pack direkam RED sebelum registry exclusive tersedia, lalu GREEN untuk lima keluarga, fallback universal, dan delapan belas PNG sticker runtime.
- Verifikasi final lulus: Node 42/42, Python 10/10, overlay 10/10, hidden-RGB 0, detector Impeccable 0 temuan, dan runtime browser error 0.
- QA alur lengkap lulus pada 390×844, 768×1024, 1440×900, serta short landscape 900×510; frame dan sticker rail tetap horizontal, item terakhir terjangkau, target sentuh minimum 44×44 px, keyboard, safe area, dan reduced motion tetap terjaga.
- Seluruh sepuluh variant dirender dan diekspor dengan geometry preview/export yang sama: Single tepat 1080×1350 dan Strip tepat 720×1800.

## [0.19.1] - 2026-08-18

### Fixed
- Hapus RGB foto sumber yang masih dapat dipulihkan dari piksel ber-alpha 0 pada overlay Polara Daily, Midnight Club, dan dua overlay Vintage Film Lo-Fi.
- Bersihkan RGB tersembunyi pada sebelas sticker produksi dan tambahkan regression guard agar overlay maupun sticker baru ditolak ketika area transparannya masih menyimpan data warna.

### Changed
- Kurangi ukuran empat overlay baru sekitar 43–73% tanpa mengubah visible pixel, alpha, dimensi, crop, mask, atau geometry preview/export.
- Tambahkan sanitizer PNG RGBA deterministik untuk seluruh overlay dan sticker runtime, lalu perbarui checksum, byte size, asset version, serta generated registry canonical.

### Validation
- Regression hidden-RGB direkam RED pada 6/10 overlay dan 11/13 sticker sebelum sanitasi, lalu kembali GREEN pada seluruh aset sesudahnya.
- Ketujuh belas PNG yang berubah dibandingkan per piksel dengan Git HEAD: alpha identik, seluruh RGB pada visible pixel identik, dan perubahan hanya terjadi pada RGB di bawah alpha 0.

## [0.19.0] - 2026-08-18

### Added
- Tambahkan keluarga **Polara Daily** dan **Midnight Club**, masing-masing dalam variant Single 1080×1350 dan Strip 720×1800.
- Tambahkan geometry registry `polygon` untuk Single serta `rounded-rectangles` dengan radius per-slot untuk Strip.
- Tambahkan empat overlay, empat thumbnail picker, Poca Press Reporter, dan Poca Midnight Photographer sebagai runtime asset terverifikasi.

### Changed
- Batasi picker produksi menjadi tepat lima keluarga dan sepuluh variant Hero; implementasi picker lama tetap tersedia sebagai rollback source selama acceptance checkpoint.
- Turunkan polygon menjadi bounding photo slot dengan `clip-path` deterministik, sehingga Preview, Decorate, Reveal, Save, dan Share memakai geometry DOM yang sama.
- Izinkan thumbnail runtime final untuk keluarga baru tanpa memasukkan true composite, review board, source photo, master mascot, `_originals`, atau arsip ZIP ke bundle produksi.
- Perluas schema, generator registry, serta verifier aset dari enam menjadi sepuluh overlay tanpa mengubah flow, default Strip 3, retake per-slot, atau pemrosesan lokal.

### Validation
- Regression direkam RED untuk jumlah variant, lima keluarga, polygon, rounded-rectangles, runtime-only asset, dan metadata rilis sebelum implementasi kembali GREEN.
- Verifikasi final lulus: Node 37/37, Python 10/10, overlay 10/10, detector Impeccable 0 temuan, dan runtime browser error 0.
- QA alur lengkap lulus pada 390×844, 768×1024, 1440×900, serta short landscape 900×510; rail terakhir reachable, overflow horizontal 0, target sentuh minimum 44×44 px, reduced motion, camera denied recovery, dan retake preservation tetap lulus.
- Seluruh sepuluh variant dirender di preview dan diekspor: lima Single tepat 1080×1350 serta lima Strip tepat 720×1800, dengan mask dan overlay aktif yang sama.

## [0.18.2] - 2026-08-18

### Changed
- Tambahkan stage docket dan format footline UI-only pada desktop agar ruang proof terasa seperti meja kerja yang disengaja tanpa mengembalikan synthetic scene selector prototype.
- Ubah maker footer desktop menjadi footer foundation horizontal: identitas maker, jaminan privasi lokal, kanal sosial, dan metadata kini membentuk satu bar yang ringkas.
- Pertahankan struktur bertumpuk pada tablet/mobile serta seluruh target sentuh 44×44 px.

### Validation
- Regression footer direkam RED sebelum stage context dan layout horizontal tersedia, lalu kembali GREEN setelah implementasi.
- Flow produksi tetap memakai enam tahap, Strip 3 default, Single, timer 3/5/10, retake per-slot, dan export geometry yang sama pada 390×844, 768×1024, 1440×900, serta 900×510.
- Pada 1440×900, stage docket tampil dengan step/format yang sinkron; footer foundation setinggi 101 px, vertical spread 64 px, dan overflow horizontal 0.
- Verifikasi final lulus: Node 34/34, Python 3/3, overlay 6/6, runtime error 0, serta detector Impeccable 0 temuan.
- Export final tetap tepat Single 1080×1350 (492110 byte) dan Strip 720×1800 (389897 byte).

## [0.18.1] - 2026-08-17

### Fixed
- Jadikan sticker di luar tahap Decorate sebagai presentational-only: tidak dapat di-drag, tidak masuk keyboard tab order, dan tidak membawa kontrol editor ke Reveal.
- Sembunyikan handle hapus/putar/resize dari accessibility tree ketika proof sedang ditampilkan sebagai hasil final.

### Validation
- Live smoke v0.18.0 mereproduksi sticker Reveal yang masih interaktif meski handle transparan; regression browser baru gagal tepat pada kontrak presentation-only sebelum perbaikan.
- Setelah perbaikan, Reveal memiliki 0 sticker interaktif, 0 sticker focusable, dan 0 handle editor terekspos pada 390x844, 768x1024, 1440x900, serta 900x510.
- QA 24 kombinasi tahap/viewport lulus dengan runtime error 0; exact export final tetap Single 1080x1350 (490631 byte) dan Strip 720x1800 (391497 byte).

## [0.18.0] - 2026-08-14

### Added
- Tambahkan **Proof Sticker Bench** dengan status empty/placed/editing dan active sticker inspector UI-only yang memakai nama asset canonical serta ordinal untuk instance berulang.
- Tambahkan view-model murni untuk menjaga count, selected instance, dan fallback stale-selection tetap konsisten.

### Changed
- Ubah picker sticker menjadi satu sticker rail horizontal tanpa nested vertical scroll, dengan sekitar tiga sampai empat pilihan terlihat pada mobile, tablet, desktop, dan short landscape.
- Simpan posisi horizontal sticker rail ketika pengguna kembali ke Frames lalu melanjutkan Decorate.
- Prioritaskan inspector aktif sebelum rail pada mobile; empty state tetap mendahulukan katalog sticker.
- Perjelas disabled state Undo/Clear serta kelompokkan caption sebagai Proof note tanpa mengubah persistence maupun dukungan dynamic text tiap frame.
- Pisahkan font UI Inter ke endpoint Google Fonts yang tervalidasi agar shell tidak menerima URL variable-font Inter/Nunito yang mengembalikan 404; fallback sistem tetap tersedia.

### Validation
- Regression unit direkam RED pada view-model kosong, count, ordinal instance berulang, dan stale selection lalu GREEN setelah implementasi.
- Regression browser direkam RED pada struktur Proof Sticker Bench, disabled-state, active inspector, rail horizontal, dan tablet card density lalu GREEN pada empat viewport.
- Add dua instance, selection lewat canvas focus, Undo, Clear, undo-clear, Back/Continue, Poca choreography, dan horizontal scroll restoration terverifikasi tanpa mengubah compositor.
- Verifikasi final lulus: Node 33/33, Python 3/3, overlay 6/6, QA 24 kombinasi tahap/viewport, runtime error 0, dan detector Impeccable 0 temuan.
- Exact export tetap tepat Single 1080x1350 (492110 byte) dan Strip 720x1800 (382380 byte); inspector, rail, status, serta Poca tetap berada di UI layer.

## [0.17.0] - 2026-08-14

### Added
- Tambahkan **Capture Bay** UI-only dengan label live proof, counter proof aktif, status kamera eksplisit, dan penanda sesi lokal tanpa mengubah sumber atau algoritma capture.
- Tambahkan **Contact Sheet Inspection** pada Review dengan registration marks, label proof aktif, metadata ukuran asli, dan status `Inspecting`/`Saved` yang terbaca.

### Changed
- Selaraskan proof docket Camera dan Review melalui state `Next`, `Waiting`, `Saved`, `Retake safe`, dan `Inspecting`; retake tetap baru mengganti proof setelah capture pengganti berhasil.
- Jadikan Arrow keys pada selector Review memindahkan sekaligus mengaktifkan proof tanpa menggeser control sheet atau mengubah isi foto.
- Tempatkan Poca Camera dan Review pada sidecar responsif agar tidak menutupi live proof maupun active proof.
- Ubah label tindakan menjadi `Retake proof X` agar konsisten dengan bahasa proof pada seluruh tahap.

### Validation
- Regression Camera dan Review direkam RED sebelum markup/state baru, lalu GREEN pada 390x844, 768x1024, 1440x900, dan 900x510.
- Capture Bay footer, state ready/denied, recovery action, proof counter, proof docket, keyboard Review, active inspection, dan Poca no-overlap terverifikasi melalui browser QA.
- Flow enam tahap, retake per-slot, rapid transition lock, reduced motion, target minimum 44×44 px, dan runtime error kosong tetap lulus.
- Verifikasi final lulus: Node 28/28, Python 3/3, dan overlay 6/6.
- Detector Impeccable menemukan satu initial `src` kosong pada foto Review; warning diperbaiki dengan source lokal dan regression test RED→GREEN.
- Export tetap tepat Single 1080x1350 dan Strip 720x1800; seluruh Capture Bay, inspection mat, label, dan Poca UI tetap di luar canvas.

## [0.16.0] - 2026-08-14

### Added
- Tambahkan chapter continuity pada seluruh perpindahan tahap: panel tujuan kembali ke awal, judul aktif menerima fokus programatis tanpa scroll tambahan, dan layout mobile bertumpuk kembali ke anchor halaman yang stabil.
- Tambahkan kontrak state eksplisit untuk Reveal theatre agar processing dan ready dapat ditata serta diuji tanpa bergantung pada flex wrapping atau timing visual.

### Changed
- Pertahankan posisi horizontal frame rail dan scroll tray sticker saat kembali ke tahap sebelumnya, tetapi jangan mewariskan scroll vertikal panel lama ke chapter baru.
- Ringkas Reveal ready menjadi satu Poca Proof Approved pada stage; Poca Sleepy Loading tetap khusus panel processing.
- Susun action Reveal sebagai grid dua tingkat yang eksplisit: Back, Photo only, dan Save PNG sebagai utilitas, lalu Share sebagai aksi utama selebar panel.

### Validation
- Regression browser chapter continuity direkam RED pada fokus judul Frames dan pada posisi panel Reveal selama processing, lalu GREEN pada 390x844, 768x1024, 1440x900, serta 900x510.
- Reveal theatre terverifikasi memiliki tepat satu Poca Approved yang terlihat, state `processing`/`ready`, grid action stabil, target minimum 44×44 px, dan runtime error kosong.
- Camera denied recovery, fake-device capture, retake per-slot, frame rail persistence, rapid transition lock, serta reduced motion tetap lulus.
- Verifikasi final lulus: Node 27/27, Python 3/3, overlay 6/6, dan detector Impeccable 0 temuan.
- Export tetap tepat Single 1080x1350 (492110 byte) dan Strip 720x1800 (385754 byte); Poca dan UI Reveal tidak masuk canvas.

## [0.15.1] - 2026-08-13

### Fixed
- Arahkan nama maker `Henry Nugraha` pada footer ke portofolio canonical `https://hnry.dev`, sementara tombol GitHub tetap menuju profil GitHub.

### Validation
- Live audit v0.15.0 membuktikan shell, kamera, tiga capture, Review, frame rail, state Back, sticker tray, Reveal, serta Save PNG Strip berjalan tanpa runtime error pada desktop dan mobile 390x844.
- Regression footer mengunci target portofolio agar tidak kembali memakai GitHub sebagai fallback.

## [0.15.0] - 2026-08-13

### Added
- Tambahkan Proof Inspection Deck UI-only di belakang preview: material mat hangat, registration marks, dan komposisi yang mengikuti mode Single/Strip tanpa masuk export canvas.
- Tambahkan regression test untuk kontrak inspection deck, horizontal frame rail, mode presentasional stage, dan persistensi posisi rail.

### Changed
- Ubah frame picker 2x2 dengan nested vertical scroll menjadi rail horizontal responsif yang memperlihatkan sekitar 2-2,5 kartu, mendukung touch, scroll snap ringan, serta keyboard Home/End.
- Perlebar panel kontrol desktop secara terukur dan pertahankan satu vertical scroll container pada mobile, tablet, dan short landscape.
- Ambil screenshot QA Frames sebelum simulasi tombol End agar bukti visual selalu merepresentasikan posisi rail normal.

### Validation
- Flow produksi lulus pada 390x844, 768x1024, 1440x900, dan 900x510 tanpa overflow horizontal, target pendek, atau runtime error.
- Posisi rail dan frame aktif bertahan setelah Frames -> Decorate -> Frames; camera denied recovery, fake-device capture, retake per-slot, dan rapid transition regression tetap lulus.
- Export tetap tepat Single 1080x1350 dan Strip 720x1800.

## [0.14.1] - 2026-08-13

### Fixed
- Selaraskan metadata versi paket dengan lini rilis v0.14 setelah Maker Footer terintegrasi.

### Validation
- Tambahkan regression test agar versi paket dan riwayat changelog tidak tertinggal dari rilis aktif.

## [0.14.0] - 2026-08-13

### Added
- Tambahkan Maker Footer premium berisi identitas Henry Nugraha, jaminan privasi lokal, serta tautan WhatsApp, Instagram `@hnry.dev`, dan GitHub.

### Fixed
- Pertahankan footer tetap dapat dijangkau pada short landscape tanpa mengganggu workspace dan action dock.

### Validation
- Regression footer memverifikasi identitas, keamanan tautan eksternal, target sentuh 44×44 px, dan layout short landscape.
- QA Proof Table tetap lulus pada seluruh kombinasi tahap dan viewport; geometri export Single 1080×1350 serta Strip 720×1800 tidak berubah.

## [0.13.2] - 2026-08-13

### Fixed
- Cegah rapid double-tap melompati tahap Frames atau menjalankan dua render kanvas bersamaan dengan mengunci seluruh action selama transisi async berlangsung.
- Pastikan action tahap baru baru aktif kembali setelah frame, sticker tray, dan geometri preview selesai dirender.

### Validation
- Regression baru direkam RED pada pesan `rapid tap must not skip Frames`, lalu GREEN setelah transition lock diterapkan.
- QA Proof Table tetap lulus pada 24 kombinasi tahap/viewport tanpa overflow, target pendek, atau runtime error; export tetap tepat Single 1080×1350 dan Strip 720×1800.

### Validation pending
- Emulasi mobile membuktikan descriptor touch dan drag sticker pertama saat render-ready, tetapi matriks native Share/cancel dan sticker bawah belum cukup stabil sebagai bukti acceptance. Dogfooding Android Chrome dan iPhone Safari fisik tetap wajib.

## [0.13.1] - 2026-08-13

### Fixed
- Jaga action dock tetap terlihat pada seluruh tahap mobile dengan membatasi tinggi control sheet dan memindahkan scroll panjang ke area kontrol internal.
- Pulihkan Fredoka pada Chrome dengan memisahkannya dari endpoint CSS2 Google Fonts yang sedang mengirim URL WOFF2 404; template legacy memakai endpoint Fredoka yang sehat.

### Validation
- Regression browser membuktikan kondisi lama gagal pada `390x844 frames`, lalu seluruh primary action lulus pada enam tahap dan empat viewport setelah perbaikan.
- Tidak ada overflow horizontal, target pendek, atau runtime error; export tetap tepat Single 1080x1350 dan Strip 720x1800.

## [0.13.0] - 2026-08-13

### Added
- Tambahkan shell produksi Proof Table v2.1, rail enam tahap berbahasa Inggris, Proof Stamp PNG untuk tahap selesai, dialog Privacy native, active proof 1/2/3, proof stack Reveal, dan choreography Poca berbasis state.
- Tambahkan tiga aset Poca produksi: Privacy Guardian, Decorate Guide, dan Proof Approved; tambahkan Proof Stamp serta enam composite picker thumbnail.
- Tambahkan regression test state/aset/picker dan QA Playwright untuk 390×844, 768×1024, 1440×900, serta short landscape 900×510.

### Changed
- Adaptasi visual Light Table Studio + Proof Desk dari prototype terpilih tanpa membawa scene selector, simulasi share/save, localStorage fixture, atau portal workaround.
- Gunakan composite hanya untuk thumbnail picker; preview dan export tetap memakai PNG overlay, photo window, transform, dan compositor produksi yang sama.
- Gunakan Poca Excited pada Start, Camera pada Camera, Peeking pada Review/decorated state, Holding Frame pada Frames, Decorate Guide hanya saat kosong, Sleepy Loading saat processing, serta Proof Approved saat Reveal ready.
- Ubah copy UI menjadi bahasa Inggris sesuai direction lock; dokumentasi dan laporan internal tetap berbahasa Indonesia.
- Naikkan cache bust modul/UI menjadi v13 dan versi paket menjadi 0.13.0.

### Fixed
- Pertahankan proof lain saat retake satu slot dan sinkronkan active proof pada Review serta Frames.
- Pertahankan tombol Privacy sebagai kontrol mengambang pada short landscape dan pastikan seluruh target interaktif yang terlihat minimal 44×44 px.
- Hentikan percobaan embedding Google Fonts pada html-to-image agar export exact-size tidak menulis SecurityError lintas-origin ke console.

### Validation
- 20/20 tes Node, 3/3 tes Python, dan 6/6 verifier overlay lulus.
- Flow penuh lulus tanpa overflow/runtime error pada empat viewport; Home/End tray, Escape/focus restore dialog, reduced motion, dan camera denied recovery lulus.
- Download nyata terukur tepat Single 1080×1350 dan Strip 720×1800; retake proof 2 mempertahankan proof 1 dan 3.

### Validation pending
- Camera, safe-area/keyboard virtual, rotasi, native share/cancel, dan download perlu dogfooding ulang pada Android/iPhone fisik setelah branch diintegrasikan dan dideploy oleh Henry.

## [0.12.0] - 2026-08-09

### Added
- Tambahkan enam overlay Hero PNG transparan beserta thumbnail: Poca Purikura, Vintage Film Lo-Fi, dan Seoul Snap Y2K untuk Single serta Strip 3.
- Tambahkan manifest geometry canonical, schema JSON, generator registry, verifier aset Python, 13 tes Node, dan 3 tes Python untuk registry, renderer, z-order, thumbnail, state editor, caption contract, fallback, serta path traversal manifest.
- Simpan source HTML enam Hero selama satu release sebagai rollback internal tanpa memasukkannya lagi ke registry runtime.

### Changed
- Alihkan enam Hero dari frame HTML/CSS ke renderer PNG-first: photo slot pada z-index 10, overlay pada 20, metadata opsional pada 25, dan sticker pada 30.
- Gunakan thumbnail PNG final pada picker Hero; frame legacy tetap memakai preview iframe.
- Sembunyikan input caption pada enam Hero final karena manifest tidak menyediakan zona teks dinamis; nilai caption tetap tersimpan dan muncul kembali saat frame yang mendukung teks dipilih.
- Tambahkan cache bust modul v12 dan jadikan Poca Purikura sebagai Hero default sehat untuk masing-masing format.

### Fixed
- Bila overlay gagal dimuat, tandai frame tersebut tidak tersedia dan pindah ke Hero sehat atau frame legacy dalam mode yang sama tanpa mereset foto, transform, caption, atau sticker.
- Jangan menimpa pesan fallback dengan pesan sukses dari frame yang sebenarnya gagal dipilih.

### Removed
- Hapus ZIP context, asset handoff, architecture handoff, folder ekstraksi audit, dan artefak preview sementara setelah source serta evidence tersimpan di lokasi canonical.

### Validation pending
- Dogfooding enam Hero pada Android Chrome dan iPhone Safari nyata, termasuk kamera depan/belakang, touch, safe-area, keyboard virtual, share sheet/cancel, serta hasil download.
- QA headless Windows membuktikan fallback, preservasi state, sticker, dan reveal Strip 720×1800, tetapi koneksi localhost sesekali me-reset dua PNG saat banyak resource picker dimuat bersamaan. Integritas keenam file tetap lolos; validasi visual akhir lintas-browser/perangkat nyata masih wajib.

## [0.11.0] - 2026-08-08

### Added
- Tambahkan metadata picker untuk jumlah foto, status Hero, dan status Eksperimental yang ikut membentuk nama aksesibel setiap frame.
- Tambahkan penjelasan langsung bahwa Live Frame saat ini menghasilkan PNG statis, bukan GIF atau video.

### Changed
- Perbesar thumbnail Strip dari preview penuh yang sempit menjadi crop detail selebar kartu agar gaya frame lebih mudah dibandingkan.
- Selaraskan tiga keluarga hero lintas format: Poca Strip memakai Sticker Pop, Seoul Strip memakai kamera digital Y2K, dan Vintage Single memakai bahasa film analog.
- Ganti font fallback Kosmik menjadi Fredoka/Nunito agar konsisten dengan design system Polara.
- Tambahkan cache bust modul v11 untuk shell dan registry template.

### Fixed
- Pertahankan layout picker dua kolom dan akses item terakhir pada desktop/mobile tanpa membuat overflow horizontal.

## [0.10.2] - 2026-08-08

### Added
- Tambahkan social preview 1200×630 beserta metadata Open Graph dan Twitter Card untuk halaman publik Polara.
- Simpan master Poca Wave 1024×1024 secara lokal di pohon source aset yang di-ignore.

### Changed
- Ganti runtime Poca Wave dengan hotfix transparan 512×512 yang memulihkan lengan terangkat dan tetap terbaca pada ukuran kecil.
- Posisikan kanvas preview di dalam panggung berskala tanpa membiarkan ukuran layout mentah menciptakan area scroll kosong.

### Fixed
- Pertahankan posisi absolut slot bawaan template saat foto dipasang, sehingga foto ketiga pada Poca Purikura Strip dan Seoul Snap Strip tidak lagi terpotong di luar kanvas.

## [0.10.1] - 2026-08-04

### Added
- Pasang Web Icon Pack v3 berbasis RC2: favicon 16/32/48, multi-frame ICO, Apple Touch icon, ikon 192/512, maskable icon, Safari pinned tab, dan web app manifest.
- Tambahkan cache bust `?v=3` pada metadata `<head>` dan seluruh sumber ikon manifest.

### Changed
- Gunakan bubblegum pink sebagai `theme-color` browser agar konsisten dengan ikon dan identitas Polara.
- Layani seluruh file web icon dari root aplikasi vanilla agar URL absolut bekerja sama pada server lokal dan Vercel.

### Removed
- Keluarkan `app-icon.png` dan `secondary-app-icon.png` lama yang tidak lagi direferensikan dari runtime publik; salinan source tetap disimpan lokal di `assets/_originals/legacy-brand/`.

### Validation pending
- Add to Home Screen, Safari pinned tab, serta cache refresh ikon pada iPhone dan Android nyata setelah deploy.

## [0.10.0] - 2026-08-02

### Added
- Integrasikan dua maskot UI P1: Poca memegang frame untuk tahap pemilihan frame dan Poca melompat untuk perayaan Reveal.
- Tambahkan enam stiker P1 yang dapat diedit dan ikut export: Paw Pink, Sparkle Kuning, Kamera, Bintang Poca, Balon Kata, dan Photo Buddy.
- Tampilkan label eksternal pada seluruh item tray agar aset berteks kecil seperti Photo Buddy tetap dapat dikenali.

### Changed
- Rapikan pohon aset produksi: reference sheet, master sheet, dan source legacy dipindahkan ke `assets/_originals/` lokal dengan penamaan lowercase-kebab-case.
- Simpan evidence QA gabungan serta handoff P1 pada dokumentasi internal, lalu aktifkan registry setelah 29/29 file handoff terverifikasi identik.

### Fixed
- Bersihkan selection sticker saat masuk Reveal sehingga outline dan handle editor tidak mengganggu tampilan hasil akhir; handle tetap dikeluarkan dari PNG export.

### Removed
- Keluarkan mascot hero lama yang opaque serta 12 sheet review/master yang tidak dipakai runtime dari pohon aset publik.
- Hapus seluruh archive ZIP yang sudah selesai diekstrak dan diverifikasi; source/master serta evidence tetap tersimpan di lokasi canonical lokal.

### Validation pending
- Kamera, touch gesture, safe-area/keyboard, dan native share sheet/cancel pada Android Chrome serta iPhone Safari nyata.
- `html-to-image` masih menulis log `SecurityError: cssRules` saat membaca Google Fonts cross-origin; non-fatal dan PNG exact-size tetap berhasil.

## [0.9.2] - 2026-08-02
### Changed
- Capture kamera disimpan sebagai JPEG kualitas tinggi dengan sisi maksimum 1920 px agar tiga slot lebih hemat memori pada HP tanpa mengubah rasio sumber atau ukuran PNG export.
- Reveal menyiapkan dan memvalidasi file ber-frame sebelum tombol share aktif, sehingga native file share dapat dipanggil saat user activation masih tersedia.
- Download framed/raw memakai Blob Object URL dan selalu menjadwalkan `revokeObjectURL` setelah file dipicu.

### Fixed
- Cegah race dan kebocoran stream ketika permission kamera masih menggantung lalu user memilih demo, keluar dari camera room, atau memulai request baru.
- Bersihkan stream bila `video.play()` gagal, kamera terputus, halaman disembunyikan, atau sesi ditutup.
- Jeda dan batalkan countdown dengan aman saat Polara tidak terlihat tanpa mengubah foto yang sudah tersimpan.
- Deteksi facing mode aktual; bila pergantian kamera gagal, pulihkan kamera sebelumnya serta state mirror yang benar.
- Native share cancel mempertahankan sesi, sedangkan share yang tidak didukung atau gagal membuka sheet jatuh ke download PNG yang sama.

### Validation pending
- Kamera/switch camera, touch gesture, safe-area/keyboard, dan native share sheet/cancel pada Android Chrome serta iPhone Safari nyata.

## [0.9.1] - 2026-08-01
### Changed
- Sinkronkan metadata rilis dan handoff setelah checkpoint P0 `v0.9.0` masuk ke `main` dan `origin/main`.
- Tegaskan positioning Polara sebagai photobooth digital tanpa klaim AI pada konteks workspace global.
- Daftarkan Polara pada tabel konvensi versi workspace agar checkpoint berikutnya memakai format commit canonical.
- Perbaiki tautan changelog ke dokumen konvensi versi setelah seluruh project pindah ke `HenryLabs/`.

## [0.9.0] - 2026-08-01

### Added — P0 prototype integration
- Flow enam tahap: **Start → Kamera → Review → Frame → Hias → Reveal**, dengan Strip 3 sebagai mode hero/default.
- Camera state untuk requesting, ready, denied, unavailable, switching, dan fallback demo yang tetap dapat dipilih saat permintaan izin menggantung.
- Review dan retake per slot; foto lama baru diganti setelah capture pengganti berhasil.
- Shared photo geometry: **Foto utuh** (`contain`) sebagai default, **Penuhi frame** (`cover`) opt-in, zoom/pan per slot, dan transform tetap tersimpan saat ganti frame/back.
- Registry P0: 5 mascot UI-only dan 4 sticker exportable transparan, ditambah fallback aman bila asset gagal dimuat.
- Editor sticker berbasis state: select, drag, resize, rotate, delete, reset, undo, touch/pointer, dan keyboard.
- Tiga keluarga frame hero tersedia untuk single dan strip: Vintage Film Lo-Fi, Poca Purikura, dan Seoul Snap Y2K. Existing frame tidak dihapus.
- Reveal sebagai tahap khusus, reset-session dialog native, safe-area mobile, short-landscape split view, serta koleksi frame/sticker scroll-safe.

### Changed
- Capture menyimpan frame penuh beserta dimensi natural; crop tidak lagi dibakar permanen saat jepret.
- Preview, reveal, dan export memakai geometry foto yang sama.
- Export kembali ke dimensi exact produk: single **1080×1350**, strip **720×1800**, dengan validasi ukuran sebelum share/download.
- Poca dipisahkan dari sticker editor agar maskot tidak otomatis ikut export.

### Fixed
- Mode demo tetap tersedia ketika prompt izin kamera belum memberi respons.
- Kanvas strip tidak lagi memaksa panggung desktop memanjang; hasil diskalakan ke viewport.
- Overflow horizontal pada viewport 320 px dihilangkan.
- Handle sticker yang tidak terlihat tidak lagi ikut urutan Tab.

### Validation pending
- Kamera/switch camera, touch gesture, safe-area, download, dan native share sheet pada Android Chrome serta iPhone Safari nyata.
- Dogfooding 3–5 teman dan pencatatan actual share.
- Log `SecurityError: cssRules` dari `html-to-image` saat membaca Google Fonts masih non-fatal; PNG tetap berhasil dibuat.

## [0.8.5] - 2026-07-05
### Fixed
- **Frame nggak ke-center** (desktop & HP): `.capture-area` (width 100%) masih makan tempat pas fase hasil → frame kedorong ke kanan. Sekarang `.capture-area` disembunyiin pas showResultPhase → frame ke-center. Verified (gap kiri=kanan).
### Added
- **Download 2 versi**: tombol **"Foto Aja"** simpan foto MENTAH (tanpa frame). Single = foto langsung; strip = 3 foto ditumpuk vertikal. (Yang pakai frame tetap ada via Simpan.)
### Changed
- **Deploy live**: `POLARA_URL` = `polara.vercel.app` (di-import dari GitHub ke Vercel, auto-redeploy tiap push). Link ke-bake di foto + share sekarang beneran kebuka.
- **Instagram** dibetulin: `@hnry.dev` (bukan @hnrydev).
### Notes
- Belum: (2) rapiin garis Daily/Trading yang masih "gak lurus" (butuh Henry tunjuk bagian spesifik), (3) perbanyak frame strip 3-foto, (spec aset variasi stiker udah dikasih ke Henry buat GPT).

## [0.8.4] - 2026-07-05
### Changed — Trading Card dirapiin (#3)
- Buang **pola garis grid** yang bikin "garis-garis nggak rapi" (di `.ph-canvas::before` + `.card-inner::before`) → sekarang cuma starfield titik halus, nggak ada garis kotak-kotak. Streak holografik (`::after`) dihaluskan (stop gradient lebih lebar, opacity 0.72→0.6) biar lebih smooth. Verified render + export.

## [0.8.3] - 2026-07-05
### Changed — kembangin frame batch 2 (#3)
- **Poca Purikura di-declutter**: buang semua hiasan bawaan (3 blob, 3 mascot Poca, sparkle/heart/paw, 3 kata-stiker, watermark img). Sekarang cuma frame + slot bersih, biar user hias sendiri pakai tray. `.ph-brand` dibikin keliatan (tadinya `font-size:0`, pakai watermark img yang udah dibuang). Verified: 0 dekorasi bawaan.
- **Polara Daily dirapiin + foto nggak kepotong**: buang kolom kiri (3 artikel koran palsu + mini-photo box) yang bikin sempit & berantakan. Content-grid 3-kolom → 2-kolom (foto `1fr` + 1 kolom kanan). Slot foto dari aspek **~0.64 (kesempitan → orang kepotong) jadi ~0.78 (≈4:5)**. Verified.
### Notes
- **Trading Card DITAHAN** — feedback "belum rapih" masih umum + layout kartu holografik rumit, ngubah tanpa lihat hasil visual berisiko bikin makin berantakan. Butuh Henry spesifikin bagian mana yang kurang rapi. (Slot ~1:1, foto 4:5 kepotong atas-bawah — bisa dibenerin sekalian nanti.)

## [0.8.2] - 2026-07-05
### Added — rework capture strip (#1) + link di foto
- **Mode 3: jepret MANUAL per-slot** (bukan auto 3x beruntun). Muncul strip 3 slot (atas/tengah/bawah) di samping kamera: klik slot → aktif → klik Jepret → countdown (timer pilihan) → foto masuk slot itu → auto lanjut slot berikutnya. Bisa **silang ✕** buat foto ulang slot tertentu. Tombol **"Lanjut ke Frame"** muncul pas 3 slot keisi. Verified: strip toggle per mode, slot selection, ✕. Loop kamera per-slot perlu test device.
- **Link Polara ke-bake di foto** (biar orang langsung nyoba): `.ph-brand` semua frame diisi `Polara · polara.app`, jadi walau platform (IG dll) strip teks pas share file, link tetap kelihatan DI gambar. Pesan share juga nyebut link.
### Notes
- ⚠️ `POLARA_URL='polara.app'` masih PLACEHOLDER (`src/app.js`) — ganti ke URL asli setelah app di-deploy biar link beneran kebuka.
- Frame batch 2 (Poca Purikura declutter, Polara Daily, Trading Card dirapiin) belum — next.

## [0.8.1] - 2026-07-05
### Added
- **Stiker bisa RESIZE + ROTATE + hapus** (bukan cuma geser). Handle muncul pas stiker dipilih: ✕ merah (hapus), ↻ biru (putar), ⤢ kuning (ubah ukuran). Titik tengah dijaga pas resize. Outline seleksi + handle otomatis disembunyiin pas export. (#4)
### Fixed
- **Foto kepotong (2 orang) → `captureFrame` sekarang WYSIWYG.** Dulu capture full-native (lebih lebar dari preview) → yang ke-foto beda dari yang keliatan, orang kepotong pas masuk slot. Sekarang center-crop persis ke rasio kotak preview. Hasil = apa yang kamu lihat. (#3)
- **Title jadi "Polara - Photobooth"** (strip, bukan em-dash). (#2)
### Changed — kembangin frame (#3, batch 1)
- **Kosmik** dirombak: aurora + planet glow + sparkles + slot foto **4:5** (800×1000, cocok sama hasil capture → nggak kepotong) + buang em-dash placeholder. (dulu terlalu polos)
### Notes
- Sisa kembangin frame (batch 2, next): Poca Purikura declutter (biar user hias sendiri), Polara Daily dirapiin, Trading Card dirapiin.
- **RENCANA #1 (rework capture strip, next):** preview strip live pas jepret + jepret MANUAL per-slot (klik kamera tiap foto biar siap pose, atas→bawah) + jepret ulang per-foto (silang). Butuh test device.

## [0.8.0] - 2026-07-05
### Changed — REWORK BESAR: flow "jepret dulu"
- Flow dibalik: `Mode + Timer` → **JEPRET** → `Pilih Frame` (preview-nya udah ada fotomu) → `Hias` → `Simpan / Bagikan`. Frame nggak dipilih di awal lagi (dulu bikin bingung + preview kosong). Stepper baru: Foto → Frame → Hias → Simpan.
- Panel KIRI morph: setup (mode + timer) → frame picker (grid **2 kolom**, scroll internal) setelah jepret. Mode-3 → cuma nampilin strip frame.
- Panel KANAN morph: greeter Poca → panel **Hias** (stiker + input **Nama/Kampus** live).
### Added
- **Timer pilihan 3 / 5 / 10 detik** (default 3). Mode-3 ada badge "Foto x dari 3".
- **Jepret Ulang**: balik ke kamera buat re-shoot (mode + timer tetap).
- **Tombol Bagikan** (Web Share API): share PNG langsung — di HP muncul share sheet, di browser yang nggak support fallback ke download. Pesan default di-humanize.
### Fixed
- **Kamera & hasil sekarang KE-CENTER** di kartu (`.stage-card` align+justify center, `#cameraWrap` aspect-ratio 4:5). (#3)
- **Mascot di greeter + overlay kamera pakai `poca-wink.png` (transparan)** — ganti `mascot-poca-hero` opaque yang kotak putihnya ganggu pas loading/ganti kamera. (#3)
### Notes
- Loop jepret 1×/3× dari kamera asli + share sheet di HP: perlu test device Henry (nggak bisa dites headless).

## [0.7.2] - 2026-07-05
### Fixed
- **BUG hasil download aneh (frame mungil di pojok kanvas gede).** `fitStage` nge-scale `.ph-canvas` buat pas di layar, tapi `exportPng` ikut nangkep transform itu. Fix: kasih `style:{transform:'none'}` ke html-to-image (di-apply ke CLONE, elemen layar aman) → export selalu ukuran asli. Verified: single 2160×2700, strip 1440×3600 @2x.
- **Copy di-humanize**: buang semua em-dash, `…`, dan `✦` dari teks status/privasi. Bahasa dibikin natural/casual (`app.js` + `index.html`).
### Added
- **Footer**: privasi dipindah ke bawah + "Dibikin sama Henry" + link GitHub/LinkedIn (mirip catmoji).
### Changed
- Daftar frame (`#templateList`) scroll INTERNAL (max-height 64vh) — bukan nge-scroll seluruh layar.
- Panel kanan jadi kartu sapaan Poca (teks privasi udah pindah ke footer).
- Project dipindah Henry ke `C:\HenryDev\1HenryDev\HenryLabs\polara`.

## [0.7.0] - 2026-07-04
### Added
- **Mode 1× / 3× + filter frame (#1)**: pilih mode dulu (1 Foto / 3 Strip) di atas picker → frame otomatis difilter (single 1080×1350 vs strip 720×1800). `templateDims` +`slots` (1/3). Segmented control.
- **Multi-capture strip (#1)**: mode 3× jepret 3× berurutan (countdown tiap shot, jeda 700ms), tiap foto masuk slot 1/2/3 lewat `setPhotoSlot`. Slot-filling VERIFIED (3 slot beda foto); loop kamera 3× perlu test device asli.
- **Stepper (#5)**: indikator tahap **Mode → Frame → Jepret → Stiker → Simpan** di atas panggung, update tiap tahap.
### Fixed
- **Frame nggak muncul bener di hasil (#4)**: `fitStage` dulu pakai `window.innerWidth*0.42` (sisa layout lama) → frame kecil/nyangkut di kartu putih, banyak ruang kosong. Sekarang scale container-based (fit lebar kartu × maxH 560; `.ph-canvas` di-`transform`, `#canvasScale` di-size + overflow hidden) → frame ngepas & ke-center. **Preview = persis hasil download.**
- **Logo kekecilan (#3)**: `logo-polara.png` di-crop dari 2000×2000 (padding transparan 666px atas-bawah bikin wordmark cuma ~15px di header) → 1686×716 ngepas. Header height 50px (42px mobile).
- **Sticker cuma di purikura (#2)**: tray sekarang **universal** — muncul di semua frame abis jepret.
### Changed
- Compositor: `setPhoto` (isi semua slot) + `setPhotoSlot` baru (per-slot, buat strip). Picker difilter per mode.

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
