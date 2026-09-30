import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { computeGuestGeometry, guestGeometryInvariant } from '../src/core/guest-geometry.js';


const root = new URL('../', import.meta.url);
const read = (path) => fs.readFile(new URL(path, root), 'utf8');
const readBytes = (path) => fs.readFile(new URL(path, root));


test('Pose Mate exposes an explicit opt-in while Regular Booth remains the default', async () => {
  const [html, app, css] = await Promise.all([read('index.html'), read('src/app.js'), read('styles/proof-table.css')]);

  assert.match(html, /id="experienceChoose"/);
  assert.match(html, /data-experience="regular"[^>]+aria-pressed="true"/);
  assert.match(html, /data-experience="pose-mate"/);
  assert.match(app, /experience:\s*'regular'/);
  assert.match(app, /guestId:\s*null/);
  assert.match(css, /data-experience="pose-mate"\]\[data-step="start"\] \.proof-buddy/);
  assert.match(css, /visibility:\s*hidden/);
});


test('Pose Mate exposes original fictional Juno and Mina guests without collaboration claims', async () => {
  const manifest = JSON.parse(await read('assets/guests/guest-manifest.json'));
  const guestModule = await import('../src/modules/guests/index.js');
  const options = guestModule.getGuestOptions();

  assert.deepEqual(options.map((guest) => [guest.id, guest.name]), [
    ['polara-pm-01', 'Juno'],
    ['polara-pm-02', 'Mina'],
  ]);
  for (const option of options) {
    const guest = manifest.guests.find((item) => item.id === option.id);
    assert.ok(guest);
    assert.equal(guest.kind, 'fictional-synthetic');
    assert.equal(guest.publicFigure, false);
    assert.equal(guest.collaborationClaim, false);
    assert.equal(option.src, guest.runtimeSrc);
    const digest = createHash('sha256').update(await readBytes(guest.runtimeSrc)).digest('hex');
    assert.equal(digest, guest.sha256);
  }
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


test('PM-02 female pose pack maps Single and every Strip proof to the same verified identity', async () => {
  const manifest = JSON.parse(await read('assets/guests/guest-manifest.json'));
  const guestModule = await import('../src/modules/guests/index.js');
  const assets = guestModule.getGuestAssets('polara-pm-02');

  assert.deepEqual(assets.map((asset) => asset.pose), ['neutral', 'peace', 'half-heart']);
  assert.equal(guestModule.poseForSlot(0, 1, 'polara-pm-02').pose, 'half-heart');
  assert.equal(guestModule.poseForSlot(0, 3, 'polara-pm-02').pose, 'neutral');
  assert.equal(guestModule.poseForSlot(1, 3, 'polara-pm-02').pose, 'peace');
  assert.equal(guestModule.poseForSlot(2, 3, 'polara-pm-02').pose, 'half-heart');

  for (const asset of assets) {
    const manifestAsset = manifest.guests.find((item) => item.id === asset.id);
    assert.ok(manifestAsset, `Missing manifest entry for ${asset.id}`);
    assert.equal(manifestAsset.guestId || manifestAsset.id, 'polara-pm-02');
    assert.equal(manifestAsset.runtimeSrc, asset.src);
    assert.equal(manifestAsset.publicFigure, false);
    assert.equal(manifestAsset.collaborationClaim, false);
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
    experience: 'pose-mate', guestId: 'polara-pm-01', layout: 'side-by-side', side: 'left', mode: 3, slotIndex: 0,
  });

  assert.equal(regular, null);
  assert.equal(matched.asset.id, 'polara-pm-01-neutral');
  assert.equal(matched.asset.pose, 'neutral');
  assert.equal(matched.layout, 'matched');
  assert.equal(matched.side, 'right');
  assert.deepEqual(matched.userRegion, { x: 0, y: 0, width: 1, height: 1 });
  assert.deepEqual(matched.guestRegion, { x: 0.54, y: 0, width: 0.46, height: 1 });
  assert.equal(sideBySide.flipGuest, true);
  assert.equal(sideBySide.asset.pose, 'seated');
  assert.equal(sideBySide.asset.src, 'assets/guests/polara-pm-01-seated.png');
  assert.deepEqual(sideBySide.guestRegion, { x: 0.02, y: 0.44, width: 0.48, height: 0.5 });
  assert.deepEqual(sideBySide.userRegion, { x: 0, y: 0, width: 1, height: 1 });
  assert.deepEqual(sideBySide.guestCrop, { x: 0.1, y: 0.04, width: 0.8, height: 0.71 });
  const cropRatio = sideBySide.guestCrop.width / sideBySide.guestCrop.height;
  const regionRatio = sideBySide.guestRegion.width / sideBySide.guestRegion.height;
  assert.ok(Math.abs(cropRatio - regionRatio) < 0.2, 'seated bust crop and render region should stay visually compatible');
  assert.equal(sideBySide.guestRegion.y + sideBySide.guestRegion.height, 0.94, 'seated guest should land on the lower camera baseline');
  assert.equal(guestModule.poseGuideForSlot(2, 3), 'Half-heart');
  assert.equal(guestModule.poseGuideForSlot(0, 3, 'side-by-side'), 'Relaxed');
  assert.equal(guestModule.poseGuideForSlot(1, 3, 'side-by-side'), 'Wave');
  assert.equal(guestModule.poseGuideForSlot(2, 3, 'side-by-side'), 'Half-heart');
  assert.equal(guestModule.createGuestComposition({
    experience: 'pose-mate', guestId: 'unknown-guest',
  }), null);
});

test('Pose Mate keeps source aspect ratio across portrait preview and export geometry', async () => {
  const guestModule = await import('../src/modules/guests/index.js');
  for (const layout of ['matched', 'side-by-side']) {
    for (const side of ['left', 'right']) {
      const composition = guestModule.createGuestComposition({
        experience: 'pose-mate', guestId: 'polara-pm-02', layout, side, mode: 3, slotIndex: 1,
      });
      const geometry = computeGuestGeometry(composition, 1254, 1254, 720, 600);
      assert.ok(guestGeometryInvariant(geometry), `${layout}/${side} geometry must stay proportional`);
      assert.equal(Math.round(geometry.region.y + geometry.region.height), layout === 'side-by-side' ? 564 : 600);
      assert.equal(Math.round(geometry.image.width / geometry.image.height * 1e6), 1e6);
    }
  }
  const review = computeGuestGeometry(
    guestModule.createGuestComposition({ experience: 'pose-mate', guestId: 'polara-pm-01', layout: 'side-by-side', side: 'right', mode: 3, slotIndex: 0 }),
    1254, 1254, 320, 240, 120, 80,
  );
  assert.deepEqual(review.viewport, { x: 120, y: 80, width: 320, height: 240 });
  assert.equal(review.region.x, 280);
  assert.equal(review.region.y, 185.6);
  assert.equal(review.region.y + review.region.height, 305.6);
});


test('seated Pose Mate assets are registered for both fictional guests', async () => {
  const manifest = JSON.parse(await read('assets/guests/guest-manifest.json'));
  const guestModule = await import('../src/modules/guests/index.js');
  for (const guestId of ['polara-pm-01', 'polara-pm-02']) {
    const asset = guestModule.getSeatedGuestAsset(guestId);
    const entry = manifest.guests.find((item) => item.id === asset.id);
    assert.equal(asset.pose, 'seated');
    assert.ok(entry);
    assert.equal(entry.width, 1254);
    assert.equal(entry.height, 1254);
    assert.equal(entry.publicFigure, false);
    assert.equal(entry.collaborationClaim, false);
    assert.equal(createHash('sha256').update(await readBytes(asset.src)).digest('hex'), entry.sha256);
  }
});


test('Sit together maps three seated poses across Strip and keeps Single relaxed', async () => {
  const manifest = JSON.parse(await read('assets/guests/guest-manifest.json'));
  const guestModule = await import('../src/modules/guests/index.js');
  for (const guestId of ['polara-pm-01', 'polara-pm-02']) {
    const stripAssets = [0, 1, 2].map((slotIndex) => guestModule.createGuestComposition({
      experience: 'pose-mate', guestId, layout: 'side-by-side', mode: 3, slotIndex,
    }).asset);
    assert.deepEqual(stripAssets.map((asset) => asset.pose), ['seated', 'seated-wave', 'seated-heart']);
    assert.equal(guestModule.createGuestComposition({
      experience: 'pose-mate', guestId, layout: 'side-by-side', mode: 1, slotIndex: 0,
    }).asset.pose, 'seated');
    assert.equal(guestModule.getGuestRuntimeAssets(guestId).length, 6);
    for (const asset of stripAssets.slice(1)) {
      const entry = manifest.guests.find((item) => item.id === asset.id);
      assert.ok(entry, `Missing seated variant ${asset.id}`);
      assert.equal(entry.pose, asset.pose);
      assert.equal(createHash('sha256').update(await readBytes(asset.src)).digest('hex'), entry.sha256);
    }
  }
});


test('camera, review, preview, and raw export all receive the same guest composition', async () => {
  const [html, app, compositor] = await Promise.all([
    read('index.html'), read('src/app.js'), read('src/core/compositor.js'),
  ]);

  assert.match(html, /id="poseGuestPreview"/);
  assert.match(html, /id="reviewGuest"/);
  assert.match(html, /id="reviewPoseWindow"[\s\S]*id="reviewPhotoRegion"[\s\S]*id="reviewGuest"/);
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
  assert.match(compositor, /computeGuestGeometry/);
  assert.match(compositor, /drawGuestGeometry/);
  assert.match(compositor, /pose-guest-layer/);
  assert.match(app, /applyGuestImageGeometry/);
  assert.match(app, /getReviewGuestViewport/);
  assert.match(app, /poseGuestLayer/);
  assert.doesNotMatch(app, /clipPath/);
  assert.doesNotMatch(app, /objectFit = 'fill'/);
});


test('Pose Mate release preserves exact Single and Strip output dimensions', async () => {
  const compositor = await read('src/core/compositor.js');
  assert.match(compositor, /mode === 3 \? 720 : 1080/);
  assert.match(compositor, /mode === 3 \? 1800 : 1350/);
});
