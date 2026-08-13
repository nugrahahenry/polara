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


test('release metadata records the v0.15.1 portfolio link patch and prior line', () => {
  assert.equal(packageJson.version, '0.15.1');
  assert.match(changelog, /## \[0\.15\.1\] - 2026-08-13/);
  assert.match(changelog, /hnry\.dev/);
  assert.match(changelog, /## \[0\.15\.0\] - 2026-08-13/);
  assert.match(changelog, /Proof Inspection Deck/);
  assert.match(changelog, /## \[0\.14\.1\] - 2026-08-13/);
  assert.match(changelog, /## \[0\.14\.0\] - 2026-08-13/);
});
