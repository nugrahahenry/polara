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


test('release metadata records the v0.18.0 Proof Sticker Bench release', () => {
  assert.equal(packageJson.version, '0.18.0');
  assert.match(changelog, /## \[0\.18\.0\] - 2026-08-14/);
  assert.match(changelog, /Proof Sticker Bench/);
  assert.match(changelog, /sticker rail/i);
  assert.match(indexHtml, /styles\/proof-table\.css\?v=19/);
  assert.match(indexHtml, /src\/app\.js\?v=18/);
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
