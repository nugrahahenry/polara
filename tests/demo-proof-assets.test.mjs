import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';


const cameraSource = await fs.readFile(new URL('../src/core/camera.js', import.meta.url), 'utf8');
const manifest = JSON.parse(await fs.readFile(new URL('../assets/media/demo-proofs/manifest.json', import.meta.url), 'utf8'));


test('demo mode uses three polished fictional proofs instead of synthetic stick figures', async () => {
  assert.equal(manifest.proofs.length, 3);
  assert.ok(manifest.proofs.every((proof) => proof.kind === 'fictional-synthetic'));
  assert.ok(manifest.proofs.every((proof) => proof.publicFigure === false));
  assert.ok(manifest.proofs.every((proof) => proof.collaborationClaim === false));
  assert.doesNotMatch(cameraSource, /ctx\.arc|DEMO PROOF/);
  assert.match(cameraSource, /assets\/media\/demo-proofs\/demo-proof-/);
  for (const proof of manifest.proofs) {
    const bytes = await fs.readFile(new URL(`../${proof.src}`, import.meta.url));
    assert.ok(bytes.length > 20_000);
    assert.deepEqual([proof.width, proof.height], [1024, 512]);
  }
});
