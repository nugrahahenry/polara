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


test('release metadata records the v0.25.0 frame remaster checkpoint', () => {
  assert.equal(packageJson.version, '0.25.0');
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
  assert.match(indexHtml, /src\/app\.js\?v=25/);
  assert.match(indexHtml, /styles\/proof-table\.css\?v=24/);
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
    /<img id="reviewPhoto" src="assets\/brand\/logo-polara\.png" alt="Active proof under review" \/>/,
  );
});

test('shell loads the verified Inter endpoint without the broken combined variable-font response', () => {
  assert.match(
    indexHtml,
    /https:\/\/fonts\.googleapis\.com\/css\?family=Inter:500,600,700,800&amp;display=swap/,
  );
  assert.doesNotMatch(indexHtml, /family=Inter:wght@500;600;700;800&amp;family=Nunito/);
});
