import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

const root = process.cwd();
const manifestPath = path.join(root, 'assets', 'guests', 'guest-manifest.json');
const guests = [
  { id: 'polara-pm-03', name: 'Byun Woo-seok' },
  { id: 'polara-pm-04', name: 'Wonyoung' },
  { id: 'polara-pm-05', name: 'Yeji' },
];
const poses = ['neutral', 'peace', 'half-heart', 'seated', 'seated-wave', 'seated-heart'];

const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
manifest.schemaVersion = 3;
manifest.guests = manifest.guests.filter((asset) => !guests.some((guest) => (asset.guestId || asset.id) === guest.id));

for (const guest of guests) {
  for (const pose of poses) {
    const runtimeName = `polara-${guest.id.slice('polara-'.length)}-${pose}.png`;
    const runtimeSrc = `assets/guests/${runtimeName}`;
    const payload = await fs.readFile(path.join(root, runtimeSrc));
    const id = pose === 'half-heart' ? guest.id : `${guest.id}-${pose}`;
    manifest.guests.push({
      id,
      guestId: guest.id,
      name: guest.name,
      runtimeSrc,
      pose,
      kind: 'licensed-public-figure',
      publicFigure: true,
      collaborationClaim: false,
      rightsScope: 'Polara runtime pack; rights record kept outside repository',
      provenance: 'Owner-authorized local generated pack, then deterministic local alpha cleanup',
      generationPromptEmbedded: false,
      width: 1254,
      height: 1254,
      sha256: createHash('sha256').update(payload).digest('hex'),
    });
  }
}

await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`[pose-mate] manifest updated with ${guests.length} owner-authorized guest packs`);
