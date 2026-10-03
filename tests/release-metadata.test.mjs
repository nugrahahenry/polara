import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';


const packageJson = JSON.parse(
  await fs.readFile(new URL('../package.json', import.meta.url), 'utf8'),
);
const changelog = await fs.readFile(
  new URL('../CHANGELOG.md', import.meta.url),
  'utf8',
);
const indexHtml = await fs.readFile(
  new URL('../index.html', import.meta.url),
  'utf8',
);


test('release metadata records the Polara v1.0.0 launch checkpoint', () => {
  assert.equal(packageJson.version, '1.0.0');
  assert.match(changelog, /## \[1\.0\.0\] - 2026-10-04/);
  assert.match(changelog, /rilis publik pertama/i);
  assert.match(changelog, /Validasi perangkat fisik Android\/iPhone/i);
  assert.match(changelog, /Tidak ada backend, database, akun, upload, cloud gallery, payment, atau AI/i);
  assert.match(changelog, /## \[0\.47\.1\] - 2026-10-03/);
  assert.match(changelog, /## \[0\.47\.1\] - 2026-10-03/);
  assert.match(changelog, /terkunci selama aset guest Pose Mate sedang dimuat/i);
  assert.match(changelog, /## \[0\.47\.0\] - 2026-10-03/);
  assert.match(changelog, /Byun Woo-seok.*Wonyoung.*Yeji/i);
  assert.match(changelog, /PNG RGBA 1254×1254/i);
  assert.match(changelog, /schemaVersion 3/i);
  assert.match(changelog, /detail hak.*sumber lisensi privat/i);
  assert.match(indexHtml, /src\/app\.js\?v=53/);
  assert.match(indexHtml, /styles\/proof-table\.css\?v=361/);
  assert.match(changelog, /## \[0\.46\.1\] - 2026-10-03/);
  assert.match(changelog, /## \[0\.46\.1\] - 2026-10-03/);
  assert.match(changelog, /Poca Soft Archive exclusive/i);
  assert.match(changelog, /glossy chibi/i);
  assert.match(changelog, /## \[0\.46\.0\] - 2026-10-03/);
  assert.match(changelog, /## \[0\.46\.0\] - 2026-10-03/);
  assert.match(changelog, /Soft Archive/i);
  assert.match(changelog, /Archive Bouquet/i);
  assert.match(changelog, /9 keluarga dan 26 variant/i);
  assert.match(changelog, /parity preview dan export/i);
  assert.match(changelog, /## \[0\.45\.7\] - 2026-10-02/);
  assert.match(changelog, /timer selection state/i);
  assert.match(changelog, /focus-safe scroll/i);
  assert.match(changelog, /touch feedback/i);
  assert.match(changelog, /helper bersama/i);
  assert.match(changelog, /layer clip/i);
  assert.match(changelog, /Review mengikuti bounds foto/i);
  assert.match(changelog, /bust crop yang lebih lebar/i);
  assert.match(changelog, /countdown Camera kembali aktif/i);
  assert.match(changelog, /1080×1350/);
  assert.match(changelog, /720×1800/);
  assert.match(changelog, /## \[0\.45\.4\] - 2026-09-30/);
  assert.match(changelog, /Footer maker label.*hnry\.dev/i);
  assert.match(changelog, /camera readiness.*fake device/i);
  assert.match(changelog, /demo proof lokal/i);
  assert.match(changelog, /tidak menambah backend, database/i);
  assert.match(changelog, /## \[0\.45\.3\] - 2026-09-29/);
  assert.match(changelog, /## \[0\.45\.3\] - 2026-09-29/);
  assert.match(changelog, /tipografi utility.*Strip/i);
  assert.match(changelog, /sans condensed/i);
  assert.match(changelog, /serif editorial/i);
  assert.match(changelog, /frame-overlay-v7/i);
  assert.match(changelog, /polara-proof-edge-v3/i);
  assert.match(changelog, /preview dan export/i);
  assert.match(changelog, /## \[0\.45\.2\] - 2026-09-29/);
  assert.match(changelog, /## \[0\.45\.2\] - 2026-09-29/);
  assert.match(changelog, /Vintage Film Lo-Fi dan Postcard Club Strip/i);
  assert.match(changelog, /jendela foto yang lebih lebar/i);
  assert.match(changelog, /area foto minimum sekitar 40%/i);
  assert.match(changelog, /## \[0\.45\.1\] - 2026-09-29/);
  assert.match(changelog, /Sit together/i);
  assert.match(changelog, /rasio visual yang sama/i);
  assert.match(changelog, /Proof deck Strip/i);
  assert.match(changelog, /UI-only/i);
  assert.match(changelog, /1080×1350/);
  assert.match(changelog, /720×1800/);
  assert.match(changelog, /## \[0\.45\.0\] - 2026-09-29/);
  assert.match(changelog, /premium sticker/i);
  assert.match(changelog, /Paper Bow/i);
  assert.match(changelog, /Love Letter/i);
  assert.match(changelog, /Botanical Sprig/i);
  assert.match(changelog, /Sent With Love/i);
  assert.match(changelog, /26 .*universal/i);
  assert.match(changelog, /safe inset/i);
  assert.match(changelog, /## \[0\.43\.0\] - 2026-09-29/);
  assert.match(changelog, /Postcard Club character-free/);
  assert.match(changelog, /Ready to keep/);
  assert.match(changelog, /## \[0\.39\.0\] - 2026-09-29/);
  assert.match(changelog, /## \[0\.39\.0\] - 2026-09-29/);
  assert.match(changelog, /fallback preview/i);
  assert.match(changelog, /unavailable/i);
  assert.match(changelog, /## \[0\.38\.0\] - 2026-09-28/);
  assert.match(changelog, /Postcard Club Ink/i);
  assert.match(changelog, /inactive/);
  assert.match(changelog, /20 variant/i);
  assert.match(changelog, /## \[0\.37\.0\] - 2026-09-28/);
  assert.match(changelog, /perimeter proof/i);
  assert.match(changelog, /POLARA \/ PROOF/i);
  assert.match(changelog, /proof-edge-v2/i);
  assert.match(changelog, /## \[0\.36\.0\] - 2026-09-28/);
  assert.match(changelog, /Postcard Club/i);
  assert.match(changelog, /proof-edge-v2/i);
  assert.match(changelog, /## \[0\.35\.4\] - 2026-09-27/);
  assert.match(changelog, /global Poca buddy/i);
  assert.match(changelog, /## \[0\.35\.3\] - 2026-09-27/);
  assert.match(changelog, /Camera timer/i);
  assert.match(changelog, /Poca/i);
  assert.match(changelog, /## \[0\.35\.2\] - 2026-09-27/);
  assert.match(changelog, /seated bust/i);
  assert.match(changelog, /## \[0\.35\.1\] - 2026-09-27/);
  assert.match(changelog, /inside that same photo window/i);
  assert.match(changelog, /selected photo controls/i);
  assert.match(changelog, /Active proof/i);
  assert.match(changelog, /Photo 1 of 3/i);
  assert.match(changelog, /## \[0\.35\.0\] - 2026-09-27/);
  assert.match(changelog, /Asset Expansion/i);
  assert.match(changelog, /asset-expansion-v1/i);
  assert.match(changelog, /Ready kit/i);
  assert.match(changelog, /## \[0\.34\.0\] - 2026-09-05/);
  assert.match(changelog, /## \[0\.34\.0\] - 2026-09-05/);
  assert.match(changelog, /Collection Room/i);
  assert.match(changelog, /frame-collection-v1/i);
  assert.match(changelog, /posisi rail per koleksi/i);
  assert.match(changelog, /## \[0\.33\.0\] - 2026-09-05/);
  assert.match(changelog, /Frame and Guest Editions/i);
  assert.match(changelog, /Poca Purikura Blueberry/i);
  assert.match(changelog, /Juno dan Mina/i);
  assert.match(changelog, /Fill frame/i);
  assert.match(changelog, /## \[0\.32\.0\] - 2026-08-31/);
  assert.match(changelog, /Capture Delight/i);
  assert.match(changelog, /proof card/i);
  assert.match(changelog, /capture receipt/i);
  assert.match(changelog, /## \[0\.31\.0\] - 2026-08-31/);
  assert.match(changelog, /Asset Rail Wayfinding/i);
  assert.match(changelog, /Family Proof Tint/i);
  assert.match(changelog, /nama hingga dua baris/i);
  assert.match(changelog, /## \[0\.30\.0\] - 2026-08-28/);
  assert.match(changelog, /Asset Quality System v2/i);
  assert.match(changelog, /Selected Edition Dossier/i);
  assert.match(changelog, /frame-family-v2/i);
  assert.match(changelog, /## \[0\.29\.0\] - 2026-08-28/);
  assert.match(changelog, /Poca Print Room Opening/i);
  assert.match(changelog, /proof ticket/i);
  assert.match(changelog, /## \[0\.28\.1\] - 2026-08-27/);
  assert.match(changelog, /14 variant/i);
  assert.match(changelog, /## \[0\.28\.0\] - 2026-08-27/);
  assert.match(changelog, /Approval Dossier/i);
  assert.match(changelog, /local-only/i);
  assert.match(changelog, /## \[0\.27\.0\] - 2026-08-27/);
  assert.match(changelog, /Sticker Workshop/i);
  assert.match(changelog, /Proof Keeper Tape/i);
  assert.match(changelog, /Photo Buddy Club/i);
  assert.match(changelog, /## \[0\.26\.0\] - 2026-08-27/);
  assert.match(changelog, /Cloud Picnic/i);
  assert.match(changelog, /Lucky Ticket/i);
  assert.match(changelog, /## \[0\.25\.0\] - 2026-08-27/);
  assert.match(changelog, /proof-edge-v1/i);
  assert.match(changelog, /## \[0\.24\.0\] - 2026-08-27/);
  assert.match(changelog, /Unified Proof Desk/i);
  assert.match(changelog, /## \[0\.23\.0\] - 2026-08-27/);
  assert.match(changelog, /Asset Quality System/i);
  assert.match(changelog, /character-free/i);
  assert.match(changelog, /composite picker/i);
  assert.match(changelog, /## \[0\.22\.0\] - 2026-08-27/);
  assert.match(changelog, /Neutral/i);
  assert.match(changelog, /Peace/i);
  assert.match(changelog, /per-slot/i);
  assert.match(changelog, /## \[0\.21\.0\] - 2026-08-27/);
  assert.match(changelog, /Pose Mate/i);
  assert.match(changelog, /fiktif-sintetis/i);
  assert.match(changelog, /Regular Booth/i);
  assert.match(changelog, /720×1800/);
  assert.match(changelog, /1080×1350/);
  assert.match(indexHtml, /src\/app\.js\?v=53/);
  assert.match(indexHtml, /data-guest-layout="side-by-side"[^>]*>Sit together</);
  assert.match(indexHtml, /styles\/proof-table\.css\?v=361/);
  assert.match(changelog, /## \[0\.20\.0\] - 2026-08-19/);
  assert.match(changelog, /sticker Poca eksklusif/i);
  assert.match(changelog, /character-free/i);
  assert.match(changelog, /preview picker/i);
  assert.match(changelog, /## \[0\.19\.1\] - 2026-08-18/);
  assert.match(changelog, /alpha 0/i);
  assert.match(changelog, /visible pixel/i);
  assert.match(changelog, /## \[0\.19\.0\] - 2026-08-18/);
  assert.match(changelog, /Polara Daily/);
  assert.match(changelog, /Midnight Club/);
  assert.match(changelog, /polygon/i);
  assert.match(changelog, /rounded-rectangles/i);
  assert.match(changelog, /## \[0\.18\.2\] - 2026-08-18/);
  assert.match(changelog, /stage docket/i);
  assert.match(changelog, /footer foundation/i);
  assert.match(changelog, /## \[0\.18\.1\] - 2026-08-17/);
  assert.match(changelog, /presentation-only/i);
  assert.match(changelog, /accessibility tree/i);
  assert.match(changelog, /## \[0\.18\.0\] - 2026-08-14/);
  assert.match(changelog, /Proof Sticker Bench/);
  assert.match(changelog, /sticker rail/i);
  assert.match(changelog, /## \[0\.17\.0\] - 2026-08-14/);
  assert.match(changelog, /Capture Bay/);
  assert.match(changelog, /Contact Sheet Inspection/);
  assert.match(changelog, /## \[0\.16\.0\] - 2026-08-14/);
  assert.match(changelog, /chapter continuity/i);
  assert.match(changelog, /Reveal theatre/i);
  assert.match(changelog, /## \[0\.15\.1\] - 2026-08-13/);
  assert.match(changelog, /hnry\.dev/);
  assert.match(changelog, /## \[0\.15\.0\] - 2026-08-13/);
  assert.match(changelog, /Proof Inspection Deck/);
  assert.match(changelog, /## \[0\.14\.1\] - 2026-08-13/);
  assert.match(changelog, /## \[0\.14\.0\] - 2026-08-13/);
});

test('review proof image has a valid initial source before JavaScript hydration', () => {
  assert.match(
    indexHtml,
    /<img id="reviewPhoto" src="assets\/brand\/logo-polara\.png" alt="Selected photo" \/>/,
  );
});

test('shell loads the verified Inter endpoint without the broken combined variable-font response', () => {
  assert.match(
    indexHtml,
    /https:\/\/fonts\.googleapis\.com\/css\?family=Inter:500,600,700,800&amp;display=swap/,
  );
  assert.doesNotMatch(indexHtml, /family=Inter:wght@500;600;700;800&amp;family=Nunito/);
});
