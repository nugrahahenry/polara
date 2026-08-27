import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';


const root = new URL('../', import.meta.url);
const read = (path) => fs.readFile(new URL(path, root), 'utf8');
const readBytes = (path) => fs.readFile(new URL(path, root));


test('Pose Mate exposes an explicit opt-in while Regular Booth remains the default', async () => {
  const [html, app] = await Promise.all([read('index.html'), read('src/app.js')]);

  assert.match(html, /id="experienceChoose"/);
  assert.match(html, /data-experience="regular"[^>]+aria-pressed="true"/);
  assert.match(html, /data-experience="pose-mate"/);
  assert.match(app, /experience:\s*'regular'/);
  assert.match(app, /guestId:\s*null/);
});


test('PM-01 is a fictional synthetic runtime asset with no collaboration claim', async () => {
  const manifest = JSON.parse(await read('assets/guests/guest-manifest.json'));
  const guest = manifest.guests.find((item) => item.id === 'polara-pm-01');
  const guestModule = await import('../src/modules/guests/index.js');
  const runtimeGuest = guestModule.getGuest(guest.id);

  assert.ok(guest);
  assert.equal(guest.kind, 'fictional-synthetic');
  assert.equal(guest.publicFigure, false);
  assert.equal(guest.collaborationClaim, false);
  assert.match(guest.runtimeSrc, /^assets\/guests\/[a-z0-9-]+\.png$/);
  assert.equal(runtimeGuest.id, guest.id);
  assert.equal(runtimeGuest.src, guest.runtimeSrc);
  assert.equal(runtimeGuest.kind, guest.kind);
  const digest = createHash('sha256').update(await readBytes(guest.runtimeSrc)).digest('hex');
  assert.equal(digest, guest.sha256);
});


test('PM-01 pose pack maps Single and every Strip proof to a verified runtime asset', async () => {
  const manifest = JSON.parse(await read('assets/guests/guest-manifest.json'));
  const guestModule = await import('../src/modules/guests/index.js');
  const assets = guestModule.getGuestAssets('polara-pm-01');

  assert.deepEqual(assets.map((asset) => asset.pose), ['neutral', 'peace', 'half-heart']);
  assert.equal(guestModule.poseForSlot(0, 1).pose, 'half-heart');
  assert.equal(guestModule.poseForSlot(0, 3).pose, 'neutral');
  assert.equal(guestModule.poseForSlot(1, 3).pose, 'peace');
  assert.equal(guestModule.poseForSlot(2, 3).pose, 'half-heart');

  for (const asset of assets) {
    const manifestAsset = manifest.guests.find((item) => item.id === asset.id);
    assert.ok(manifestAsset, `Missing manifest entry for ${asset.id}`);
    assert.equal(manifestAsset.guestId || manifestAsset.id, 'polara-pm-01');
    assert.equal(manifestAsset.runtimeSrc, asset.src);
    assert.equal(manifestAsset.pose, asset.pose);
    assert.equal(manifestAsset.publicFigure, false);
    assert.equal(manifestAsset.collaborationClaim, false);
    const digest = createHash('sha256').update(await readBytes(asset.src)).digest('hex');
    assert.equal(digest, manifestAsset.sha256);
  }
});


test('Regular intent wins when an older Pose Mate preload resolves late', async () => {
  const guestModule = await import('../src/modules/guests/index.js');
  const gate = guestModule.createLatestSelectionGate();
  const slowPoseMateRequest = gate.begin();
  const newerRegularRequest = gate.begin();

  assert.equal(gate.isCurrent(slowPoseMateRequest), false);
  assert.equal(gate.isCurrent(newerRegularRequest), true);
  gate.cancel();
  assert.equal(gate.isCurrent(newerRegularRequest), false);
});


test('guest export failure falls back once while ordinary photo failure stays visible', async () => {
  const guestModule = await import('../src/modules/guests/index.js');
  const calls = [];
  const guestError = Object.assign(new Error('guest unavailable'), { code: 'GUEST_ASSET_ERROR' });
  const result = await guestModule.retryWithoutGuestOnFailure({
    guestComposition: { asset: { id: 'polara-pm-01' } },
    create: async (composition) => {
      calls.push(composition);
      if (composition) throw guestError;
      return 'regular-export';
    },
    isGuestError: (error) => error.code === 'GUEST_ASSET_ERROR',
    onGuestFailure: async () => calls.push('fallback'),
  });

  assert.equal(result, 'regular-export');
  assert.deepEqual(calls, [{ asset: { id: 'polara-pm-01' } }, 'fallback', null]);
  await assert.rejects(
    guestModule.retryWithoutGuestOnFailure({
      guestComposition: { asset: { id: 'polara-pm-01' } },
      create: async () => { throw Object.assign(new Error('photo unavailable'), { code: 'IMAGE_ASSET_ERROR' }); },
      isGuestError: (error) => error.code === 'GUEST_ASSET_ERROR',
      onGuestFailure: async () => assert.fail('ordinary photo failures must not trigger guest fallback'),
    }),
    /photo unavailable/,
  );
});


test('guest registry keeps matched gesture and side-by-side geometry pure and deterministic', async () => {
  const guestModule = await import('../src/modules/guests/index.js');
  const regular = guestModule.createGuestComposition({ experience: 'regular' });
  const matched = guestModule.createGuestComposition({
    experience: 'pose-mate', guestId: 'polara-pm-01', layout: 'matched', side: 'right', mode: 3, slotIndex: 0,
  });
  const sideBySide = guestModule.createGuestComposition({
    experience: 'pose-mate', guestId: 'polara-pm-01', layout: 'side-by-side', side: 'left', mode: 3, slotIndex: 1,
  });

  assert.equal(regular, null);
  assert.equal(matched.asset.id, 'polara-pm-01-neutral');
  assert.equal(matched.asset.pose, 'neutral');
  assert.equal(matched.layout, 'matched');
  assert.equal(matched.side, 'right');
  assert.deepEqual(matched.userRegion, { x: 0, y: 0, width: 0.68, height: 1 });
  assert.deepEqual(matched.guestRegion, { x: 0.54, y: 0, width: 0.46, height: 1 });
  assert.equal(sideBySide.flipGuest, true);
  assert.equal(sideBySide.asset.pose, 'peace');
  assert.equal(guestModule.poseGuideForSlot(2, 3), 'Half-heart');
  assert.equal(guestModule.createGuestComposition({
    experience: 'pose-mate', guestId: 'unknown-guest',
  }), null);
});


test('camera, review, preview, and raw export all receive the same guest composition', async () => {
  const [html, app, compositor] = await Promise.all([
    read('index.html'), read('src/app.js'), read('src/core/compositor.js'),
  ]);

  assert.match(html, /id="poseGuestPreview"/);
  assert.match(html, /id="reviewGuest"/);
  assert.match(html, /id="poseMateControls"/);
  assert.doesNotMatch(html, /id="startGuestPreview"[^>]+src=/);
  assert.doesNotMatch(html, /id="poseGuestPreview"[^>]+src=/);
  assert.doesNotMatch(html, /id="reviewGuest"[^>]+src=/);
  assert.match(app, /currentGuestComposition\([^)]*slotIndex/);
  assert.match(app, /guestCompositionForSlot/);
  assert.match(app, /refreshPhotoSlots\([^;]+guestCompositionForSlot/s);
  assert.match(app, /exportRawPng\([^;]+guestCompositionForSlot/s);
  assert.match(compositor, /className\s*=\s*'ph-guest'/);
  assert.match(compositor, /drawGuestComposition/);
  assert.match(compositor, /resolveGuestComposition/);
});


test('Pose Mate release preserves exact Single and Strip output dimensions', async () => {
  const compositor = await read('src/core/compositor.js');
  assert.match(compositor, /mode === 3 \? 720 : 1080/);
  assert.match(compositor, /mode === 3 \? 1800 : 1350/);
});
