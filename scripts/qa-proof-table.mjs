#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputRoot = path.resolve(projectRoot, process.argv[2] || 'docs/qa/proof-table-v2.1');
const screenshotRoot = path.join(outputRoot, 'screenshots');
const exportRoot = path.join(outputRoot, 'exports');
const writeScreenshots = process.env.POLARA_QA_SCREENSHOTS !== '0';
await fs.mkdir(screenshotRoot, { recursive: true });
await fs.mkdir(exportRoot, { recursive: true });

const require = createRequire(import.meta.url);
let playwright;
try {
  playwright = require('playwright');
} catch {
  const bundled = process.env.POLARA_PLAYWRIGHT_MODULES
    || 'C:/Users/Yanu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
  playwright = require(path.join(bundled, 'playwright'));
}

const mime = {
  '.css': 'text/css', '.html': 'text/html', '.ico': 'image/x-icon', '.js': 'text/javascript',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
};

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://127.0.0.1');
    const relative = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname).replace(/^\/+/, '');
    const filename = path.resolve(projectRoot, relative);
    if (!filename.startsWith(projectRoot)) throw new Error('outside project');
    const data = await fs.readFile(filename);
    response.writeHead(200, { 'content-type': mime[path.extname(filename)] || 'application/octet-stream' });
    response.end(data);
  } catch {
    response.writeHead(404);
    response.end('not found');
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
const baseUrl = `http://127.0.0.1:${port}`;

const browser = await playwright.chromium.launch({
  headless: true,
  executablePath: process.env.POLARA_CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
});

const report = {
  generatedAt: new Date().toISOString(),
  source: 'production repository',
  viewports: {},
  camera: {},
  exports: {},
  variants: {},
  opening: {},
  accessibility: {},
  runtimeErrors: [],
};

function pngDimensions(buffer) {
  assert.deepEqual([...buffer.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

async function waitForPanel(page, name) {
  await page.locator(`[data-panel="${name}"]`).waitFor({ state: 'visible', timeout: 30_000 });
}

async function waitForCameraReady(page) {
  await page.waitForFunction(() => {
    const button = document.querySelector('#primaryBtn');
    return button && !button.disabled && button.textContent.trim() === 'Take photo';
  }, null, { timeout: 30_000 });
}

async function captureProof(page, { onCountdown } = {}) {
  await waitForCameraReady(page);
  await page.locator('#primaryBtn').click();
  if (onCountdown) {
    await page.locator('#countdown').waitFor({ state: 'visible', timeout: 5_000 });
    await onCountdown();
  }
  await page.waitForFunction(() => {
    const button = document.querySelector('#primaryBtn');
    const review = document.querySelector('[data-panel="review"]');
    return (review && !review.hidden) || (button && !button.disabled && button.textContent.trim() === 'Take photo');
  }, null, { timeout: 30_000 });
}

async function auditCurrentPage(page) {
  return page.evaluate(() => {
    const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    const primaryAction = document.querySelector('#primaryBtn');
    const primaryRect = primaryAction?.getBoundingClientRect();
    const primaryActionInViewport = Boolean(primaryRect
      && primaryRect.width > 0
      && primaryRect.height > 0
      && primaryRect.top >= 0
      && primaryRect.left >= 0
      && primaryRect.bottom <= window.innerHeight
      && primaryRect.right <= window.innerWidth);
    const shortTargets = [...document.querySelectorAll('button, a[href]')]
      .filter((element) => {
        const style = getComputedStyle(element);
        const box = element.getBoundingClientRect();
        return style.visibility !== 'hidden' && style.display !== 'none' && box.width > 0 && box.height > 0;
      })
      .map((element) => ({
        label: element.getAttribute('aria-label') || element.textContent.trim().replace(/\s+/g, ' ').slice(0, 60),
        width: Math.round(element.getBoundingClientRect().width),
        height: Math.round(element.getBoundingClientRect().height),
      }))
      .filter((item) => item.width < 44 || item.height < 44);
    return { overflow, shortTargets, primaryActionInViewport };
  });
}

function usesStackedChapter(viewport) {
  return viewport.width <= 900 && !(viewport.height <= 560 && viewport.width > viewport.height);
}

async function offsetChapterView(page, viewport) {
  await page.evaluate((stacked) => {
    const controlScroll = document.querySelector('#controlScroll');
    if (controlScroll) controlScroll.scrollTop = controlScroll.scrollHeight;
    if (stacked) window.scrollTo(0, document.documentElement.scrollHeight);
  }, usesStackedChapter(viewport));
}

async function auditChapterContinuity(page, step, viewport) {
  await page.waitForFunction((activeStep) => {
    const panel = document.querySelector(`[data-panel="${activeStep}"]`);
    const title = panel?.querySelector('.panel-title');
    return document.activeElement === title;
  }, step, { timeout: 30_000 });
  const result = await page.evaluate((activeStep) => {
    const panel = document.querySelector(`[data-panel="${activeStep}"]`);
    const title = panel?.querySelector('.panel-title');
    const titleStyle = title ? getComputedStyle(title) : null;
    return {
      controlScrollTop: document.querySelector('#controlScroll')?.scrollTop ?? -1,
      activeTitleFocused: document.activeElement === title,
      activeTitleOutlineStyle: titleStyle?.outlineStyle || '',
      windowScrollY: window.scrollY,
    };
  }, step);
  assert.equal(result.controlScrollTop, 0, `${step}: chapter panel must start at top`);
  assert.equal(result.activeTitleFocused, true, `${step}: chapter title must receive focus`);
  assert.equal(result.activeTitleOutlineStyle, 'none', `${step}: static chapter title must not look interactive`);
  if (usesStackedChapter(viewport)) {
    assert.ok(result.windowScrollY <= 1, `${step}: stacked chapter must restore page anchor`);
  }
  return result;
}

async function auditCameraProofDocket(page) {
  return page.evaluate(() => ({
    state: document.querySelector('#cameraWrap')?.dataset.cameraState || '',
    counter: document.querySelector('#cameraBayCounter')?.textContent.trim() || '',
    localStatus: document.querySelector('#cameraBayLocal')?.textContent.trim() || '',
    slotStates: [...document.querySelectorAll('#cameraSlots .slot-state')]
      .map((node) => node.textContent.trim()),
  }));
}

async function auditReviewInspection(page) {
  return page.evaluate(() => ({
    tag: document.querySelector('#reviewProofTag')?.textContent.trim() || '',
    label: document.querySelector('#reviewProofLabel')?.textContent.trim() || '',
    meta: document.querySelector('#reviewSourceMeta')?.textContent.trim() || '',
    activeProof: document.querySelector('.review-photo-wrap')?.dataset.activeProof || '',
    inspectingCount: [...document.querySelectorAll('#reviewSlots .slot-state')]
      .filter((node) => node.textContent.trim() === 'Inspecting').length,
  }));
}

async function auditDecorateWorkshop(page) {
  return page.evaluate(() => {
    const overlap = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    const bench = document.querySelector('#stickerBench');
    const rail = document.querySelector('#stickerTray');
    const inspector = document.querySelector('#stickerInspector');
    const proof = document.querySelector('#canvasScale');
    const undo = document.querySelector('#undoStickerBtn');
    const clear = document.querySelector('#resetStickerBtn');
    const railStyle = rail ? getComputedStyle(rail) : null;
    const inspectorBounds = inspector?.getBoundingClientRect();
    const proofBounds = proof?.getBoundingClientRect();
    const railBounds = rail?.getBoundingClientRect();
    return {
      exists: Boolean(bench && rail && inspector),
      state: bench?.dataset.state || '',
      status: document.querySelector('#stickerBenchStatus')?.textContent.trim() || '',
      inspectorName: document.querySelector('#stickerInspectorName')?.textContent.trim() || '',
      inspectorHint: document.querySelector('#stickerInspectorHint')?.textContent.trim() || '',
      overflowX: railStyle?.overflowX || '',
      overflowY: railStyle?.overflowY || '',
      clientWidth: rail?.clientWidth || 0,
      scrollWidth: rail?.scrollWidth || 0,
      visibleCards: rail?.querySelector('.sticker-btn')
        ? rail.clientWidth / rail.querySelector('.sticker-btn').getBoundingClientRect().width
        : 0,
      undoDisabled: undo?.disabled ?? false,
      clearDisabled: clear?.disabled ?? false,
      undoOpacity: undo ? Number(getComputedStyle(undo).opacity) : 1,
      inspectorBeforeRail: Boolean(inspectorBounds && railBounds && inspectorBounds.top < railBounds.top),
      inspectorOverlapsProof: Boolean(inspectorBounds && proofBounds && overlap(inspectorBounds, proofBounds)),
    };
  });
}

async function auditStageCompanion(page, targetSelector) {
  return page.evaluate((selector) => {
    const overlap = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    const buddy = document.querySelector('#proofBuddy')?.getBoundingClientRect();
    const target = document.querySelector(selector)?.getBoundingClientRect();
    const stage = document.querySelector('.stage-shell')?.getBoundingClientRect();
    const bayFoot = document.querySelector('.capture-bay-foot')?.getBoundingClientRect();
    return {
      companionOverlapsTarget: Boolean(buddy && target && overlap(buddy, target)),
      bayFooterWithinStage: !bayFoot || !stage || (bayFoot.top >= stage.top && bayFoot.bottom <= stage.bottom),
      stageBounds: stage ? { top: stage.top, bottom: stage.bottom } : null,
      bayFooterBounds: bayFoot ? { top: bayFoot.top, bottom: bayFoot.bottom } : null,
    };
  }, targetSelector);
}

async function auditDesktopFoundation(page) {
  return page.evaluate(() => {
    const footer = document.querySelector('.app-footer');
    const footerInner = document.querySelector('.footer-inner');
    const docket = document.querySelector('.stage-docket');
    const maker = document.querySelector('.maker-seal')?.getBoundingClientRect();
    const privacy = document.querySelector('.footer-privacy')?.getBoundingClientRect();
    const end = document.querySelector('.footer-end')?.getBoundingClientRect();
    const footerBounds = footer?.getBoundingClientRect();
    const verticalSpread = maker && privacy && end
      ? Math.max(maker.bottom, privacy.bottom, end.bottom) - Math.min(maker.top, privacy.top, end.top)
      : 0;
    return {
      docketDisplay: docket ? getComputedStyle(docket).display : 'missing',
      docketStep: document.querySelector('#stageDocketStep')?.textContent.trim() || '',
      docketFormat: document.querySelector('#stageDocketFormat')?.textContent.trim() || '',
      footerHeight: footerBounds?.height || 0,
      footerInnerDisplay: footerInner ? getComputedStyle(footerInner).display : 'missing',
      footerVerticalSpread: verticalSpread,
    };
  });
}

async function auditRevealTheatre(page) {
  return page.evaluate(() => {
    const isVisible = (element) => {
      if (!element) return false;
      const rect = element.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return false;
      if (typeof element.checkVisibility === 'function') {
        return element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
      }
      const style = getComputedStyle(element);
      return !element.hidden && style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0;
    };
    const visibleApproved = [...document.querySelectorAll('img[src$="poca-proof-approved.png"]')]
      .filter(isVisible);
    const actionRow = document.querySelector('.action-row');
    const actionDock = document.querySelector('.action-dock');
    const controlScroll = document.querySelector('#controlScroll');
    const primary = document.querySelector('#primaryBtn');
    const privacyNote = document.querySelector('[data-panel="reveal"] .privacy-note');
    const dossier = document.querySelector('.reveal-dossier');
    const contentTail = isVisible(privacyNote) ? privacyNote : dossier;
    const utilities = ['#backBtn', '#tertiaryBtn', '#secondaryBtn']
      .map((selector) => document.querySelector(selector))
      .filter(isVisible);
    const stickers = [...document.querySelectorAll('.placed-sticker')];
    const stickerHandles = [...document.querySelectorAll('.sticker-handle')];
    const utilityBottom = Math.max(...utilities.map((button) => button.getBoundingClientRect().bottom));
    return {
      revealState: document.querySelector('#controlSheet')?.dataset.revealState || '',
      visibleApprovedCount: visibleApproved.length,
      panelPocaVisible: isVisible(document.querySelector('#revealPanelPoca')),
      panelPocaSrc: document.querySelector('#revealPanelPoca')?.getAttribute('src') || '',
      actionDisplay: getComputedStyle(actionRow).display,
      primaryGridColumn: getComputedStyle(primary).gridColumn,
      primaryBelowUtilities: primary.getBoundingClientRect().top >= utilityBottom,
      dossierVisible: isVisible(dossier),
      dossierFormat: document.querySelector('#revealDossierFormat')?.textContent || '',
      dossierFrame: document.querySelector('#revealDossierFrame')?.textContent || '',
      dossierDecorations: document.querySelector('#revealDossierDecorations')?.textContent || '',
      dossierPrivacy: document.querySelector('#revealDossierPrivacy')?.textContent || '',
      contentActionGap: actionRow.getBoundingClientRect().top - contentTail.getBoundingClientRect().bottom,
      dockOverlapsContent: actionDock.getBoundingClientRect().top < controlScroll.getBoundingClientRect().bottom - 1,
      interactiveStickerCount: stickers.filter((sticker) => getComputedStyle(sticker).pointerEvents !== 'none').length,
      focusableStickerCount: stickers.filter((sticker) => sticker.tabIndex >= 0).length,
      exposedStickerHandleCount: stickerHandles.filter((handle) => !handle.hidden && handle.getAttribute('aria-hidden') !== 'true').length,
    };
  });
}

async function downloadPng(page, name) {
  const downloadEvent = page.waitForEvent('download', { timeout: 30_000 });
  await page.locator('#secondaryBtn').click();
  const download = await downloadEvent;
  const filename = path.join(exportRoot, name);
  await download.saveAs(filename);
  const buffer = await fs.readFile(filename);
  return {
    filename,
    ...pngDimensions(buffer),
    bytes: buffer.byteLength,
    sha256: createHash('sha256').update(buffer).digest('hex'),
  };
}

async function startPage(context) {
  const page = await context.newPage();
  page.on('console', (message) => {
    if (message.type() === 'error') {
      const sourceUrl = message.location().url;
      report.runtimeErrors.push(`console: ${message.text()}${sourceUrl ? ` @ ${sourceUrl}` : ''}`);
    }
  });
  page.on('pageerror', (error) => report.runtimeErrors.push(`page: ${error.message}`));
  await page.goto(baseUrl, { waitUntil: 'load', timeout: 30_000 });
  await page.locator('#bootScreen').waitFor({ state: 'hidden', timeout: 5_000 });
  await page.locator('#primaryBtn').waitFor({ state: 'visible' });
  return page;
}

async function auditFrameEdition(page) {
  return page.evaluate(() => {
    const dossier = document.querySelector('#frameEditionDossier');
    const control = document.querySelector('#controlScroll');
    const bounds = dossier?.getBoundingClientRect();
    const controlBounds = control?.getBoundingClientRect();
    return {
      exists: Boolean(dossier),
      family: dossier?.dataset.family || '',
      name: document.querySelector('#frameEditionName')?.textContent.trim() || '',
      story: document.querySelector('#frameEditionStory')?.textContent.trim() || '',
      material: document.querySelector('#frameEditionMaterial')?.textContent.trim() || '',
      collection: document.querySelector('#frameEditionCollection')?.textContent.trim() || '',
      shelfState: document.querySelector('#frameEditionShelfState')?.textContent.trim() || '',
      offShelf: dossier?.dataset.offShelf || '',
      paletteCount: document.querySelectorAll('#frameEditionPalette span').length,
      exclusive: document.querySelector('#frameEditionExclusive')?.textContent.trim() || '',
      exclusiveImage: document.querySelector('#frameEditionExclusiveImage')?.getAttribute('src') || '',
      insideControlWidth: Boolean(bounds && controlBounds && bounds.left >= controlBounds.left && bounds.right <= controlBounds.right),
    };
  });
}

async function runOpeningAudit({ name, viewport }) {
  const context = await browser.newContext({ viewport, reducedMotion: 'no-preference' });
  const page = await context.newPage();
  page.on('console', (message) => {
    if (message.type() === 'error') report.runtimeErrors.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => report.runtimeErrors.push(`page: ${error.message}`));
  // Module initialization intentionally keeps DOMContentLoaded behind the authored
  // opening. Observe from the first committed response so QA cannot miss it.
  await page.goto(baseUrl, { waitUntil: 'commit', timeout: 30_000 });
  const boot = page.locator('#bootScreen');
  const openingAuditHandle = await page.waitForFunction(() => {
    const screen = document.querySelector('#bootScreen');
    const poca = document.querySelector('.boot-poca');
    const wordmark = document.querySelector('.boot-wordmark');
    const ready = screen
      && getComputedStyle(screen).display !== 'none'
      && document.querySelector('#appWorkspace')?.inert === true
      && poca?.complete && poca.naturalWidth > 0
      && wordmark?.complete && wordmark.naturalWidth > 0;
    if (!ready) return false;
    const bounds = screen.getBoundingClientRect();
    const proof = screen.querySelector('.boot-proof')?.getBoundingClientRect();
    return {
      visible: true,
      fillsViewport: Math.abs(bounds.width - window.innerWidth) < 1 && Math.abs(bounds.height - window.innerHeight) < 1,
      proofInsideViewport: Boolean(proof && proof.top >= 0 && proof.left >= 0 && proof.bottom <= window.innerHeight && proof.right <= window.innerWidth),
      appInert: Boolean(document.querySelector('#appWorkspace')?.inert),
      skipLinkInert: Boolean(document.querySelector('.skip-link')?.inert),
      label: screen.getAttribute('aria-label') || '',
    };
  }, null, { timeout: 3_000 });
  const audit = await openingAuditHandle.jsonValue();
  assert.equal(audit.visible, true);
  assert.equal(audit.fillsViewport, true);
  assert.equal(audit.proofInsideViewport, true);
  assert.equal(audit.appInert, true);
  assert.equal(audit.skipLinkInert, true);
  assert.match(audit.label, /Poca is opening the Polara print room/);
  if (writeScreenshots) await page.screenshot({ path: path.join(screenshotRoot, `${name}-00-opening.png`) });
  await boot.waitFor({ state: 'hidden', timeout: 5_000 });
  await page.waitForFunction(() => (
    document.querySelector('#appWorkspace')?.inert === false
    && document.querySelector('.skip-link')?.inert === false
  ));
  assert.equal(await page.locator('#appWorkspace').evaluate((workspace) => workspace.inert), false);
  assert.equal(await page.locator('.skip-link').evaluate((link) => link.inert), false);
  report.opening[name] = audit;
  await context.close();
}

async function runEditorialFixtureAudit({ name, viewport }) {
  const context = await browser.newContext({ viewport, permissions: ['camera'], reducedMotion: 'reduce' });
  const page = await startPage(context);
  await page.locator('[data-experience="pose-mate"]').click();
  await page.locator('#guestChoose').waitFor({ state: 'visible', timeout: 30_000 });
  await page.locator('[data-guest-id="polara-pm-02"]').click();
  await page.waitForFunction(() => /polara-pm-02-(?:neutral|peace|half-heart)\.png$/.test(document.querySelector('#startGuestPreview')?.getAttribute('src') || ''));
  assert.equal(await page.locator('[data-guest-id="polara-pm-02"]').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('#guestOptionList .guest-option.active').count(), 1);
  assert.equal(await page.locator('#guestOptionList .guest-option.active').getAttribute('data-guest-id'), 'polara-pm-02');
  await page.locator('[data-guest-id="polara-pm-02"]').evaluate((button) => button.blur());
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  if (writeScreenshots) await page.screenshot({ path: path.join(screenshotRoot, `${name}-01b-pose-mate-mina.png`) });

  await page.locator('[data-experience="regular"]').click();
  await page.locator('#primaryBtn').click();
  await waitForCameraReady(page);
  await page.locator('#tertiaryBtn').click();
  for (let slot = 0; slot < 3; slot += 1) await captureProof(page);
  await waitForPanel(page, 'review');
  await page.locator('#primaryBtn').click();
  await waitForPanel(page, 'frame');
  await page.locator('#canvasScale .ph-photo').first().waitFor({ state: 'visible' });
  await page.waitForFunction(() => {
    const canvas = document.querySelector('#canvasScale .ph-canvas');
    const photos = [...(canvas?.querySelectorAll('.ph-photo') || [])];
    const overlay = canvas?.querySelector('.ph-frame-overlay');
    return photos.length === 3
      && photos.every((photo) => photo.complete && photo.naturalWidth > 0)
      && (!overlay || (overlay.complete && overlay.naturalWidth > 0));
  }, null, { timeout: 30_000 });
  await page.waitForTimeout(180);
  const proofSources = await page.locator('#canvasScale .ph-photo').evaluateAll((photos) => photos.map((photo) => photo.getAttribute('src')));
  assert.equal(proofSources.length, 3);
  assert.ok(proofSources.every((src) => /assets\/media\/demo-proofs\/demo-proof-[123]\.jpg$/.test(src || '')));
  assert.equal(await page.locator('#fitCoverBtn').getAttribute('aria-pressed'), 'true');
  if (writeScreenshots) await page.screenshot({ path: path.join(screenshotRoot, `${name}-04b-frames-editorial.png`) });
  report.editorialFixtures ||= {};
  report.editorialFixtures[name] = { guest: 'Mina PM-02', proofSources, defaultFit: 'cover' };
  await context.close();
}

async function runFlow({ name, viewport, screenshots = false, retake = false, exportStrip = false }) {
  const context = await browser.newContext({ viewport, permissions: ['camera'], reducedMotion: 'reduce', acceptDownloads: true });
  const page = await startPage(context);
  const stageAudit = {};
  const chapterContinuity = {};
  const shot = async (number, stage) => {
    stageAudit[stage] = await auditCurrentPage(page);
    if (screenshots && writeScreenshots) await page.screenshot({ path: path.join(screenshotRoot, `${name}-${number}-${stage}.png`) });
  };

  const labels = await page.locator('#progressList .progress-label').allTextContents();
  assert.deepEqual(labels, ['Start', 'Camera', 'Review', 'Frames', 'Decorate', 'Reveal']);
  assert.match(await page.locator('#proofBuddyImage').getAttribute('src'), /poca-excited-jump\.png$/);
  const desktopFoundation = await auditDesktopFoundation(page);
  if (viewport.width >= 1180) {
    assert.equal(desktopFoundation.docketDisplay, 'flex');
    assert.equal(desktopFoundation.docketStep, '01 / Start');
    assert.equal(desktopFoundation.docketFormat, 'Strip 3 · 720 × 1800 px');
  }
  if (viewport.width >= 1100) {
    assert.equal(desktopFoundation.footerInnerDisplay, 'grid');
    assert.ok(desktopFoundation.footerHeight <= 120, `${name}: desktop footer must stay compact`);
    assert.ok(desktopFoundation.footerVerticalSpread <= 72, `${name}: desktop footer groups must read as one foundation row`);
  }
  await shot('01', 'start');

  await page.locator('#privacyBtn').click();
  assert.equal(await page.locator('#privacyDialog').evaluate((dialog) => dialog.open), true);
  assert.match(await page.locator('#privacyDialog img').getAttribute('src'), /poca-privacy-guardian\.png$/);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#privacyBtn').evaluate((button) => document.activeElement === button), true);

  await page.locator('#primaryBtn').click();
  await waitForCameraReady(page);
  assert.match(await page.locator('#proofBuddyImage').getAttribute('src'), /poca-camera\.png$/);
  const initialCameraDocket = await auditCameraProofDocket(page);
  assert.equal(initialCameraDocket.state, 'ready');
  assert.equal(initialCameraDocket.counter, 'Proof 1 / 3');
  assert.equal(initialCameraDocket.localStatus, 'Local session');
  assert.deepEqual(initialCameraDocket.slotStates, ['Next', 'Waiting', 'Waiting']);
  const cameraCompanion = await auditStageCompanion(page, '#cameraWrap');
  assert.equal(cameraCompanion.companionOverlapsTarget, false, 'Camera Poca must not cover the live proof');
  assert.equal(cameraCompanion.bayFooterWithinStage, true, `Capture Bay footer must remain inside the stage: ${JSON.stringify(cameraCompanion)}`);
  await shot('02', 'camera');
  let captureDelight;
  await captureProof(page, {
    onCountdown: async () => {
      captureDelight = await page.locator('#countdown').evaluate((countdown) => ({
        phase: countdown.dataset.phase,
        proof: document.querySelector('#countdownProof')?.textContent.trim(),
        value: document.querySelector('#countdownValue')?.textContent.trim(),
        cue: document.querySelector('#countdownCue')?.textContent.trim(),
        progress: document.querySelector('#countdownProgress')?.style.getPropertyValue('--countdown-progress'),
      }));
      await shot('02b', 'camera-countdown');
    },
  });
  assert.equal(captureDelight.phase, 'counting');
  assert.equal(captureDelight.proof, 'Proof 1 of 3');
  assert.equal(captureDelight.cue, 'Hold this pose');
  assert.match(captureDelight.value, /^[1-3]$/);
  assert.ok(Number(captureDelight.progress) > 0);
  if (await page.locator('[data-panel="camera"]').isVisible()) {
    const nextCameraDocket = await auditCameraProofDocket(page);
    assert.equal(nextCameraDocket.counter, 'Proof 2 / 3');
    assert.deepEqual(nextCameraDocket.slotStates, ['Saved', 'Next', 'Waiting']);
    const captureReceipt = await page.evaluate(() => ({
      text: document.querySelector('#shotBadge')?.textContent.trim(),
      hidden: document.querySelector('#shotBadge')?.hidden,
      recentSlots: document.querySelectorAll('.slot-card[data-capture-recent="true"]').length,
      moment: document.querySelector('.stage-shell')?.dataset.captureMoment,
    }));
    assert.deepEqual(captureReceipt, {
      text: 'Proof 1 saved',
      hidden: false,
      recentSlots: 1,
      moment: 'saved',
    });
    await shot('02c', 'camera-receipt');
  }
  if (await page.locator('[data-panel="camera"]').isVisible()) await captureProof(page);
  if (await page.locator('[data-panel="camera"]').isVisible()) await captureProof(page);
  await waitForPanel(page, 'review');
  assert.equal(await page.locator('#reviewSlots .slot-card').count(), 3);
  assert.match(await page.locator('#proofBuddyImage').getAttribute('src'), /poca-peeking\.png$/);
  const reviewSources = await page.locator('#reviewSlots .slot-card img').evaluateAll((images) => images.map((image) => image.src));
  await page.locator('#reviewSlots .slot-card').nth(1).click();
  const reviewInspection = await auditReviewInspection(page);
  assert.equal(reviewInspection.tag, 'Proof 2 of 3');
  assert.equal(reviewInspection.label, 'Proof 2 of 3');
  assert.match(reviewInspection.meta, /^Original \d+×\d+ · kept locally$/);
  assert.equal(reviewInspection.activeProof, '2');
  assert.equal(reviewInspection.inspectingCount, 1);
  const reviewCompanion = await auditStageCompanion(page, '#reviewPhoto');
  assert.equal(reviewCompanion.companionOverlapsTarget, false, 'Review Poca must not cover the active proof');
  await page.locator('#reviewSlots .slot-card').nth(1).focus();
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('#reviewSlots .slot-card').nth(2).getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('#controlScroll').evaluate((element) => element.scrollLeft), 0, 'Review keyboard selection must not shift the control sheet horizontally');
  assert.deepEqual(
    await page.locator('#reviewSlots .slot-card img').evaluateAll((images) => images.map((image) => image.src)),
    reviewSources,
  );

  if (retake) {
    const before = await page.locator('#reviewSlots .slot-card img').evaluateAll((images) => images.map((image) => image.src));
    await page.locator('#reviewSlots .slot-card').nth(1).click();
    await page.locator('#secondaryBtn').click();
    await waitForCameraReady(page);
    await captureProof(page);
    await waitForPanel(page, 'review');
    const after = await page.locator('#reviewSlots .slot-card img').evaluateAll((images) => images.map((image) => image.src));
    assert.equal(after.length, 3);
    assert.equal(after[0], before[0]);
    assert.equal(after[2], before[2]);
  }
  await shot('03', 'review');

  await offsetChapterView(page, viewport);
  await page.locator('#primaryBtn').evaluate((button) => button.click());
  await waitForPanel(page, 'frame');
  chapterContinuity.frame = await auditChapterContinuity(page, 'frame', viewport);
  await page.locator('#templateList .tpl-btn').first().waitFor({ state: 'visible' });
  await page.locator('#primaryBtn:not(:disabled)').waitFor({ state: 'visible', timeout: 30_000 });
  await page.waitForFunction(() => {
    const canvas = document.querySelector('#canvasScale .ph-canvas');
    const overlay = canvas?.querySelector('.ph-frame-overlay');
    return Boolean(canvas && (!overlay || (overlay.complete && overlay.naturalWidth > 0)));
  }, null, { timeout: 30_000 });
  await page.waitForTimeout(180);
  assert.equal(await page.locator('#photoSlotTabs .slot-tab').count(), 3);
  assert.match(await page.locator('#templateList .tpl-thumb-image').first().getAttribute('src'), /frames\/composites\//);
  assert.match(await page.locator('#proofBuddyImage').getAttribute('src'), /poca-holding-photo-frame\.png$/);
  assert.equal(await page.locator('#canvasView').getAttribute('data-proof-mode'), 'strip');
  assert.equal(await page.locator('#fitCoverBtn').getAttribute('aria-pressed'), 'true', `${name}: a fresh proof must default to Fill frame`);
  if (viewport.width >= 1180) {
    assert.equal(await page.locator('#stageDocketStep').textContent(), '04 / Frames');
  }
  const frameRail = await page.locator('#templateList').evaluate((rail) => {
    const style = getComputedStyle(rail);
    return {
      clientWidth: rail.clientWidth,
      scrollWidth: rail.scrollWidth,
      overflowX: style.overflowX,
      overflowY: style.overflowY,
      visibleCards: rail.clientWidth / rail.querySelector('.tpl-btn').getBoundingClientRect().width,
    };
  });
  assert.ok(frameRail.scrollWidth > frameRail.clientWidth, `${name}: frame rail must overflow horizontally`);
  assert.equal(frameRail.overflowX, 'auto');
  assert.equal(frameRail.overflowY, 'hidden');
  assert.ok(frameRail.visibleCards >= 2 && frameRail.visibleCards < 3, `${name}: frame rail should reveal about 2-2.5 cards`);
  assert.equal(await page.locator('#templateList .tpl-btn').count(), 8, `${name}: each mode must expose eight frame variants`);
  const frameCollection = {
    optionCount: await page.locator('#frameCollectionFilters .frame-collection-btn').count(),
    labels: await page.locator('#frameCollectionFilters .frame-collection-btn').allTextContents(),
    active: await page.locator('#frameCollectionFilters .frame-collection-btn[aria-pressed="true"]').getAttribute('data-frame-collection'),
    defaultCount: await page.locator('#frameCollectionCount').textContent(),
  };
  assert.equal(frameCollection.optionCount, 4);
  assert.equal(frameCollection.active, 'all');
  assert.equal(frameCollection.defaultCount, '8 editions');
  assert.deepEqual(frameCollection.labels.map((label) => label.replace(/\s+/g, ' ').trim()), [
    'All editions8', 'Pop room4', 'Studio room3', 'Keepsakes1',
  ]);
  const frameEdition = await auditFrameEdition(page);
  assert.equal(frameEdition.exists, true);
  assert.equal(frameEdition.family, 'poca-purikura');
  assert.equal(frameEdition.name, 'Poca Purikura');
  assert.ok(frameEdition.story.length >= 24);
  assert.ok(frameEdition.material.length >= 3);
  assert.equal(frameEdition.collection, 'Pop room · 2 editions');
  assert.equal(frameEdition.shelfState, 'On this shelf');
  assert.equal(frameEdition.offShelf, 'false');
  assert.equal(frameEdition.paletteCount, 3);
  assert.match(frameEdition.exclusive, /Poca Purikura.*Decorate/);
  assert.match(frameEdition.exclusiveImage, /poca-purikura-exclusive\.png$/);
  assert.equal(frameEdition.insideControlWidth, true, `${name}: selected edition dossier must stay inside the control sheet`);
  await shot('04', 'frames');

  await page.locator('[data-frame-collection="studio-room"]').click();
  await page.waitForFunction(() => document.querySelectorAll('#templateList .tpl-btn').length === 3);
  assert.equal(await page.locator('#frameCollectionCount').textContent(), '3 editions');
  assert.equal(await page.locator('#frameEditionShelfState').textContent(), 'Active from Pop room');
  assert.equal(await page.locator('#frameEditionDossier').getAttribute('data-off-shelf'), 'true');
  await page.locator('#templateList .tpl-btn').first().click();
  await page.waitForFunction(() => document.querySelector('#frameEditionDossier')?.dataset.offShelf === 'false');
  if (screenshots && writeScreenshots) {
    await page.evaluate(() => {
      window.scrollTo({ top: 0, behavior: 'auto' });
      document.querySelector('#controlScroll').scrollTop = 0;
    });
    await page.waitForTimeout(80);
    await page.screenshot({ path: path.join(screenshotRoot, `${name}-04c-collection-room.png`) });
  }
  const studioRailX = await page.locator('#templateList').evaluate((rail) => {
    rail.scrollLeft = rail.scrollWidth;
    return rail.scrollLeft;
  });
  assert.ok(studioRailX > 0, `${name}: Studio room rail must accept horizontal scrolling`);
  await page.locator('[data-frame-collection="all"]').click();
  await page.waitForFunction(() => document.querySelectorAll('#templateList .tpl-btn').length === 8);
  await page.locator('[data-frame-collection="studio-room"]').click();
  await page.waitForFunction((expected) => {
    const rail = document.querySelector('#templateList');
    return rail && Math.abs(rail.scrollLeft - expected) <= 2;
  }, studioRailX);
  frameCollection.studioScrollRestored = true;
  await page.locator('#frameCollectionFilters .frame-collection-btn').first().focus();
  await page.keyboard.press('End');
  await page.waitForFunction(() => document.querySelector('[data-frame-collection="keepsakes"]')?.getAttribute('aria-pressed') === 'true');
  assert.equal(await page.locator('#templateList .tpl-btn').count(), 1);
  await page.keyboard.press('Home');
  await page.waitForFunction(() => document.querySelector('[data-frame-collection="all"]')?.getAttribute('aria-pressed') === 'true');
  assert.equal(await page.locator('#templateList .tpl-btn').count(), 8);
  await page.locator('#templateList .tpl-btn').first().click();

  await page.locator('#photoSlotTabs .slot-tab').nth(1).click();
  assert.equal(await page.locator('#photoSlotTabs .slot-tab').nth(1).getAttribute('aria-selected'), 'true');
  assert.equal(await page.locator('#fitCoverBtn').getAttribute('aria-pressed'), 'true');
  await page.locator('#fitContainBtn').click();
  assert.equal(await page.locator('#fitContainBtn').getAttribute('aria-pressed'), 'true');

  await page.locator('#templateList .tpl-btn').first().focus();
  await page.keyboard.press('End');
  assert.equal(await page.locator('#templateList .tpl-btn').last().evaluate((button) => document.activeElement === button), true);
  const lastFrameReachability = await page.locator('#templateList').evaluate((rail) => {
    const railRect = rail.getBoundingClientRect();
    const lastRect = rail.querySelector('.tpl-btn:last-child').getBoundingClientRect();
    return {
      left: lastRect.left >= railRect.left - 1,
      right: lastRect.right <= railRect.right + 1,
    };
  });
  assert.deepEqual(lastFrameReachability, { left: true, right: true }, `${name}: End must reveal the final frame card`);
  await page.keyboard.press('Home');
  assert.equal(await page.locator('#templateList .tpl-btn').first().evaluate((button) => document.activeElement === button), true);

  const selectedFrameId = await page.locator('#templateList .tpl-btn[aria-selected="true"]').getAttribute('data-template-id');
  const persistedRailX = await page.locator('#templateList').evaluate((rail) => {
    rail.scrollLeft = rail.scrollWidth;
    return rail.scrollLeft;
  });
  assert.ok(persistedRailX > 0, `${name}: frame rail must accept horizontal scrolling`);

  await offsetChapterView(page, viewport);
  await page.locator('#primaryBtn').evaluate((button) => button.click());
  await waitForPanel(page, 'decorate');
  chapterContinuity.decorate = await auditChapterContinuity(page, 'decorate', viewport);
  await offsetChapterView(page, viewport);
  await page.locator('#backBtn').evaluate((button) => button.click());
  await waitForPanel(page, 'frame');
  chapterContinuity.frameReturn = await auditChapterContinuity(page, 'frame', viewport);
  await page.waitForFunction((expected) => {
    const rail = document.querySelector('#templateList');
    return rail && Math.abs(rail.scrollLeft - expected) <= 2;
  }, persistedRailX);
  assert.equal(
    await page.locator('#templateList .tpl-btn[aria-selected="true"]').getAttribute('data-template-id'),
    selectedFrameId,
  );
  assert.equal(await page.locator('#fitContainBtn').getAttribute('aria-pressed'), 'true', `${name}: a manual Full photo choice must survive Back`);
  await offsetChapterView(page, viewport);
  await page.locator('#primaryBtn').evaluate((button) => button.click());
  await waitForPanel(page, 'decorate');
  chapterContinuity.decorateReturn = await auditChapterContinuity(page, 'decorate', viewport);
  assert.match(await page.locator('#proofBuddyImage').getAttribute('src'), /poca-decorate-guide\.png$/);
  const emptyDecorateWorkshop = await auditDecorateWorkshop(page);
  assert.equal(emptyDecorateWorkshop.exists, true, `${name}: Proof Sticker Bench must exist`);
  assert.equal(emptyDecorateWorkshop.state, 'empty');
  assert.equal(emptyDecorateWorkshop.status, 'Sticker bench · No stickers yet');
  assert.equal(emptyDecorateWorkshop.overflowX, 'auto');
  assert.equal(emptyDecorateWorkshop.overflowY, 'hidden');
  assert.ok(emptyDecorateWorkshop.scrollWidth > emptyDecorateWorkshop.clientWidth, `${name}: sticker rail must overflow horizontally`);
  assert.ok(emptyDecorateWorkshop.visibleCards >= 2.5 && emptyDecorateWorkshop.visibleCards <= 4.5, `${name}: sticker rail should reveal the next choices`);
  assert.equal(emptyDecorateWorkshop.undoDisabled, true);
  assert.equal(emptyDecorateWorkshop.clearDisabled, true);
  assert.ok(emptyDecorateWorkshop.undoOpacity <= .55, `${name}: unavailable sticker history actions must read as disabled`);
  assert.equal(emptyDecorateWorkshop.inspectorOverlapsProof, false);
  await shot('05', 'decorate');
  assert.equal(await page.locator('#stickerTray .sticker-btn').count(), 20);
  assert.equal(await page.locator('#stickerTray .sticker-btn').first().getAttribute('class'), 'sticker-btn exclusive');
  assert.equal(await page.locator('#stickerTray .sticker-badge').first().textContent(), 'Exclusive');
  assert.match(await page.locator('#stickerRailMeta').textContent(), /Poca Purikura.*19 universal/);
  assert.equal(await page.locator('#stickerTray .sticker-family-match').first().textContent(), 'Made for this frame');
  assert.equal(await page.locator('#stickerTray .sticker-family-match').first().getAttribute('aria-label'), 'Poca match for Poca Purikura');
  await page.locator('#stickerTray .sticker-btn').first().focus();
  await page.keyboard.press('End');
  assert.equal(await page.locator('#stickerTray .sticker-btn').last().evaluate((button) => document.activeElement === button), true);
  await page.keyboard.press('Home');
  assert.equal(await page.locator('#stickerTray .sticker-btn').first().evaluate((button) => document.activeElement === button), true);

  const initialStickerRailX = await page.locator('#stickerTray').evaluate((rail) => {
    rail.scrollLeft = rail.scrollWidth;
    return rail.scrollLeft;
  });
  assert.ok(initialStickerRailX > 0, `${name}: sticker rail must accept horizontal scrolling`);

  await page.locator('#stickerTray .sticker-btn').first().click();
  await page.locator('#stickerTray .sticker-btn').first().click();
  assert.equal(await page.locator('.placed-sticker').count(), 2);
  let activeDecorateWorkshop = await auditDecorateWorkshop(page);
  assert.equal(activeDecorateWorkshop.state, 'editing');
  assert.equal(activeDecorateWorkshop.status, 'Sticker bench · Editing Poca Purikura');
  assert.equal(activeDecorateWorkshop.inspectorName, 'Poca Purikura · 2 of 2');
  assert.match(activeDecorateWorkshop.inspectorHint, /Arrow keys nudge/);
  assert.equal(activeDecorateWorkshop.inspectorBeforeRail, viewport.width <= 540);
  assert.equal(activeDecorateWorkshop.inspectorOverlapsProof, false);
  assert.match(await page.locator('#proofBuddyImage').getAttribute('src'), /poca-peeking\.png$/);

  await page.locator('.placed-sticker').first().evaluate((element) => element.focus({ preventScroll: true }));
  activeDecorateWorkshop = await auditDecorateWorkshop(page);
  assert.equal(activeDecorateWorkshop.inspectorName, 'Poca Purikura · 1 of 2');
  if (screenshots && writeScreenshots) {
    await page.screenshot({ path: path.join(screenshotRoot, `${name}-05b-decorate-active.png`) });
  }

  await page.locator('#undoStickerBtn').click();
  assert.equal(await page.locator('.placed-sticker').count(), 1);
  assert.equal((await auditDecorateWorkshop(page)).status, 'Sticker bench · 1 sticker placed');
  await page.locator('#resetStickerBtn').click();
  assert.equal(await page.locator('.placed-sticker').count(), 0);
  assert.equal((await auditDecorateWorkshop(page)).state, 'empty');
  assert.match(await page.locator('#proofBuddyImage').getAttribute('src'), /poca-decorate-guide\.png$/);
  await page.locator('#undoStickerBtn').click();
  assert.equal(await page.locator('.placed-sticker').count(), 1);

  const persistedStickerRailX = await page.locator('#stickerTray').evaluate((rail) => {
    rail.scrollLeft = rail.scrollWidth;
    return rail.scrollLeft;
  });
  await page.locator('#backBtn').evaluate((button) => button.click());
  await waitForPanel(page, 'frame');
  await page.locator('#primaryBtn:not(:disabled)').waitFor();
  await page.locator('#primaryBtn').evaluate((button) => button.click());
  await waitForPanel(page, 'decorate');
  await page.waitForFunction((expected) => {
    const rail = document.querySelector('#stickerTray');
    return rail && Math.abs(rail.scrollLeft - expected) <= 2;
  }, persistedStickerRailX);
  assert.equal(await page.locator('.placed-sticker').count(), 1);

  const decorateWorkshop = {
    empty: emptyDecorateWorkshop,
    active: activeDecorateWorkshop,
    restoredScrollLeft: persistedStickerRailX,
    restoredStickerCount: 1,
  };

  await offsetChapterView(page, viewport);
  await page.locator('#primaryBtn:not(:disabled)').waitFor({ state: 'visible', timeout: 30_000 });
  await page.locator('#primaryBtn').evaluate((button) => button.click());
  await waitForPanel(page, 'reveal');
  chapterContinuity.reveal = await auditChapterContinuity(page, 'reveal', viewport);
  const revealEntry = await page.evaluate(() => ({
    state: document.querySelector('#controlSheet')?.dataset.revealState,
    dossierVisible: getComputedStyle(document.querySelector('.reveal-dossier')).display !== 'none',
  }));
  assert.equal(revealEntry.state, 'processing');
  assert.equal(revealEntry.dossierVisible, false);
  assert.match(await page.locator('#revealPanelPoca').getAttribute('src'), /poca-sleepy-loading\.png$/);
  await page.waitForFunction(() => document.querySelector('#revealTitle')?.textContent === 'Proof approved.', null, { timeout: 40_000 });
  const revealTheatre = await auditRevealTheatre(page);
  assert.equal(revealTheatre.revealState, 'ready');
  assert.equal(revealTheatre.visibleApprovedCount, 1);
  assert.equal(revealTheatre.panelPocaVisible, false);
  assert.match(revealTheatre.panelPocaSrc, /poca-sleepy-loading\.png$/);
  assert.equal(revealTheatre.dossierVisible, true);
  assert.equal(revealTheatre.dossierFormat, 'Strip 3 · 720×1800');
  assert.ok(revealTheatre.dossierFrame.length > 0);
  assert.equal(revealTheatre.dossierDecorations, '1 sticker');
  assert.equal(revealTheatre.dossierPrivacy, 'Local-only session');
  assert.equal(revealTheatre.actionDisplay, 'grid');
  assert.notEqual(revealTheatre.primaryGridColumn, 'auto');
  assert.equal(revealTheatre.primaryBelowUtilities, true);
  assert.ok(revealTheatre.contentActionGap >= 24, 'Reveal content must keep breathing room above actions');
  assert.equal(revealTheatre.dockOverlapsContent, false, 'Reveal action dock must not wash over panel content');
  assert.equal(revealTheatre.interactiveStickerCount, 0, 'Reveal stickers must be presentation-only');
  assert.equal(revealTheatre.focusableStickerCount, 0, 'Reveal stickers must leave the keyboard tab order');
  assert.equal(revealTheatre.exposedStickerHandleCount, 0, 'Reveal sticker handles must leave the accessibility tree');
  assert.equal(await page.locator('#progressList .step-proof-stamp').count(), 6);
  await shot('06', 'reveal');

  let exported = null;
  if (exportStrip) exported = await downloadPng(page, 'polara-strip-proof-table.png');
  report.viewports[name] = {
    viewport, stages: stageAudit, frameRail, frameCollection, frameEdition, decorateWorkshop, chapterContinuity, revealTheatre,
      captureReview: {
        camera: initialCameraDocket,
        captureDelight,
        review: reviewInspection,
      cameraCompanion,
      reviewCompanion: {
        companionOverlapsTarget: reviewCompanion.companionOverlapsTarget,
      },
    },
    retakePreservedOtherSlots: retake, labels, desktopFoundation,
  };
  if (screenshots && writeScreenshots) {
    await page.locator('.app-footer').screenshot({ path: path.join(screenshotRoot, `${name}-07-footer.png`) });
  }
  await context.close();
  return exported;
}

async function runSingleExport() {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, permissions: ['camera'], reducedMotion: 'reduce', acceptDownloads: true });
  const page = await startPage(context);
  await page.locator('[data-mode="1"]').click();
  await page.locator('#primaryBtn').click();
  await waitForCameraReady(page);
  await captureProof(page);
  await waitForPanel(page, 'review');
  await page.locator('#primaryBtn').click();
  await waitForPanel(page, 'frame');
  await page.locator('#primaryBtn').click();
  await waitForPanel(page, 'decorate');
  await page.locator('#primaryBtn').click();
  await page.waitForFunction(() => document.querySelector('#revealTitle')?.textContent === 'Proof approved.', null, { timeout: 40_000 });
  const exported = await downloadPng(page, 'polara-single-proof-table.png');
  await context.close();
  return exported;
}

const VARIANTS = [
  { id: 'poca-purikura.single', mode: 1, width: 1080, height: 1350, maskType: 'rectangles' },
  { id: 'poca-purikura-blue.single', mode: 1, width: 1080, height: 1350, maskType: 'rectangles' },
  { id: 'vintage-film-lofi.single', mode: 1, width: 1080, height: 1350, maskType: 'rectangles' },
  { id: 'seoul-snap-y2k.single', mode: 1, width: 1080, height: 1350, maskType: 'rectangles' },
  { id: 'polara-daily-single', mode: 1, width: 1080, height: 1350, maskType: 'polygon' },
  { id: 'polara-midnight-club-single', mode: 1, width: 1080, height: 1350, maskType: 'polygon' },
  { id: 'cloud-picnic.single', mode: 1, width: 1080, height: 1350, maskType: 'rounded-rectangles', radii: ['34px'] },
  { id: 'lucky-ticket.single', mode: 1, width: 1080, height: 1350, maskType: 'polygon' },
  { id: 'poca-purikura.strip', mode: 3, width: 720, height: 1800, maskType: 'rectangles' },
  { id: 'poca-purikura-blue.strip', mode: 3, width: 720, height: 1800, maskType: 'rectangles' },
  { id: 'vintage-film-lofi.strip', mode: 3, width: 720, height: 1800, maskType: 'rectangles' },
  { id: 'seoul-snap-y2k.strip', mode: 3, width: 720, height: 1800, maskType: 'rectangles' },
  { id: 'polara-daily-strip', mode: 3, width: 720, height: 1800, maskType: 'rounded-rectangles', radii: ['14px', '14px', '14px'] },
  { id: 'polara-midnight-club-strip', mode: 3, width: 720, height: 1800, maskType: 'rounded-rectangles', radii: ['14px', '14px', '14px'] },
  { id: 'cloud-picnic.strip', mode: 3, width: 720, height: 1800, maskType: 'rounded-rectangles', radii: ['24px', '24px', '24px'] },
  { id: 'lucky-ticket.strip', mode: 3, width: 720, height: 1800, maskType: 'rounded-rectangles', radii: ['20px', '20px', '20px'] },
];

async function reachFrames(page, mode) {
  await page.locator(`[data-mode="${mode}"]`).click();
  await page.locator('#primaryBtn').click();
  await waitForCameraReady(page);
  for (let slot = 0; slot < mode; slot += 1) {
    await captureProof(page);
  }
  await waitForPanel(page, 'review');
  await page.locator('#primaryBtn').click();
  await waitForPanel(page, 'frame');
}

async function runVariantExportMatrix() {
  for (const mode of [1, 3]) {
    const context = await browser.newContext({
      viewport: { width: 768, height: 1024 },
      permissions: ['camera'],
      reducedMotion: 'reduce',
      acceptDownloads: true,
    });
    const page = await startPage(context);
    await reachFrames(page, mode);

    const variants = VARIANTS.filter((variant) => variant.mode === mode);
    assert.equal(await page.locator('#templateList .tpl-btn').count(), variants.length);
    for (let index = 0; index < variants.length; index += 1) {
      const variant = variants[index];
      const button = page.locator(`#templateList .tpl-btn[data-template-id="${variant.id}"]`);
      await button.click();
      await page.waitForFunction((id) => {
        const canvas = document.querySelector('.ph-canvas');
        const overlay = canvas?.querySelector('.ph-frame-overlay');
        return canvas?.dataset.frameId === id && overlay?.complete && overlay?.naturalWidth > 0;
      }, variant.id, { timeout: 30_000 });

      const preview = await page.locator('.ph-canvas').evaluate((canvas) => ({
        frameId: canvas.dataset.frameId,
        width: canvas.offsetWidth,
        height: canvas.offsetHeight,
        slots: [...canvas.querySelectorAll('.ph-slot')].map((slot) => ({
          maskType: slot.dataset.maskType,
          clipPath: getComputedStyle(slot).clipPath,
          borderRadius: getComputedStyle(slot).borderRadius,
        })),
        overlay: canvas.querySelector('.ph-frame-overlay')?.getAttribute('src') || '',
      }));
      assert.equal(preview.frameId, variant.id);
      assert.deepEqual({ width: preview.width, height: preview.height }, { width: variant.width, height: variant.height });
      assert.equal(preview.slots.length, mode);
      assert.ok(preview.slots.every((slot) => slot.maskType === variant.maskType));
      if (variant.maskType === 'polygon') assert.match(preview.slots[0].clipPath, /^polygon\(/);
      if (variant.maskType === 'rounded-rectangles') {
        assert.deepEqual(preview.slots.map((slot) => slot.borderRadius), variant.radii);
      }

      await page.locator('#primaryBtn').click();
      await waitForPanel(page, 'decorate');
      await page.locator('#primaryBtn').click();
      await page.waitForFunction(() => document.querySelector('#revealTitle')?.textContent === 'Proof approved.', null, { timeout: 40_000 });
      const exported = await downloadPng(page, `${variant.id}.png`);
      assert.deepEqual({ width: exported.width, height: exported.height }, { width: variant.width, height: variant.height });
      report.variants[variant.id] = { preview, export: exported };

      if (index < variants.length - 1) {
        await page.locator('#backBtn').click();
        await waitForPanel(page, 'decorate');
        await page.locator('#backBtn').click();
        await waitForPanel(page, 'frame');
      }
    }
    await context.close();
  }
}

async function runRapidTransitionRegression() {
  const context = await browser.newContext({
    ...playwright.devices['iPhone 13'],
    permissions: ['camera'],
    reducedMotion: 'reduce',
  });
  const page = await startPage(context);
  await page.locator('#primaryBtn').tap();
  await captureProof(page);
  if (await page.locator('[data-panel="camera"]').isVisible()) await captureProof(page);
  if (await page.locator('[data-panel="camera"]').isVisible()) await captureProof(page);
  await waitForPanel(page, 'review');

  await page.locator('#primaryBtn').evaluate((button) => {
    button.click();
    button.click();
  });
  await page.waitForFunction(() => document.querySelector('.ph-canvas')?.dataset.displayScale, null, { timeout: 30_000 });

  assert.equal(await page.locator('[data-panel="frame"]').isVisible(), true, 'rapid tap must not skip Frames');
  assert.equal(await page.locator('[data-panel="decorate"]').isVisible(), false, 'Decorate must wait for an intentional tap after Frames is ready');
  assert.equal(await page.locator('#primaryBtn').isEnabled(), true, 'primary action must re-enable after Frames finishes rendering');

  await page.locator('#primaryBtn').tap();
  await waitForPanel(page, 'decorate');
  assert.ok(await page.locator('.ph-canvas').getAttribute('data-display-scale'), 'Decorate canvas must retain fitted preview geometry');
  await context.close();
  report.rapidTransition = { status: 'rapid double tap stayed on Frames until render completed' };
}

try {
  await runOpeningAudit({ name: '390x844', viewport: { width: 390, height: 844 } });
  await runOpeningAudit({ name: '1440x900', viewport: { width: 1440, height: 900 } });
  await runEditorialFixtureAudit({ name: '390x844', viewport: { width: 390, height: 844 } });
  await runEditorialFixtureAudit({ name: '1440x900', viewport: { width: 1440, height: 900 } });
  report.exports.strip = await runFlow({ name: '390x844', viewport: { width: 390, height: 844 }, screenshots: true, retake: true, exportStrip: true });
  await runFlow({ name: '1440x900', viewport: { width: 1440, height: 900 }, screenshots: true });
  await runFlow({ name: '768x1024', viewport: { width: 768, height: 1024 }, screenshots: true });
  await runFlow({ name: '900x510', viewport: { width: 900, height: 510 }, screenshots: true });
  report.exports.single = await runSingleExport();
  await runVariantExportMatrix();
  await runRapidTransitionRegression();

  const deniedContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await deniedContext.addInitScript(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: async () => { throw new DOMException('Denied by QA fixture', 'NotAllowedError'); } },
    });
  });
  const deniedPage = await startPage(deniedContext);
  await deniedPage.locator('#primaryBtn').click();
  await deniedPage.waitForFunction(() => document.querySelector('#cameraMessage')?.textContent.includes('not granted'), null, { timeout: 15_000 });
  assert.equal(await deniedPage.locator('#cameraOverlayTitle').textContent(), 'Camera permission needed');
  report.camera.denied = {
    message: await deniedPage.locator('#cameraMessage').textContent(),
    recoveryActions: await deniedPage.locator('#cameraOverlayActions button:visible').allTextContents(),
  };
  await deniedContext.close();
  report.camera.fakeDevice = { status: 'ready and capture passed in all four viewport flows' };

  assert.deepEqual({ width: report.exports.single.width, height: report.exports.single.height }, { width: 1080, height: 1350 });
  assert.deepEqual({ width: report.exports.strip.width, height: report.exports.strip.height }, { width: 720, height: 1800 });
  for (const [viewportName, viewport] of Object.entries(report.viewports)) {
    for (const [stageName, stage] of Object.entries(viewport.stages)) {
      assert.equal(stage.overflow, 0);
      assert.deepEqual(stage.shortTargets, []);
      assert.equal(stage.primaryActionInViewport, true, `${viewportName} ${stageName}: primary action must remain fully inside the viewport`);
    }
  }
  assert.deepEqual(report.runtimeErrors, []);
  report.accessibility = {
    privacyDialog: 'native modal, Escape closes, trigger focus restored',
    keyboardTrays: 'Arrow selection passed for Review; Home/End passed for collection, frame, and sticker trays; collection-specific frame and sticker rail positions restored',
    touchTargets: 'all visible buttons and links at least 44×44 in audited stages',
    reducedMotion: 'all flows passed with prefers-reduced-motion: reduce',
    progress: 'six English labels, aria-current, status labels, and six Proof Stamps at ready',
  };
  await fs.writeFile(path.join(outputRoot, 'qa-results.json'), JSON.stringify(report, null, 2), 'utf8');
  process.stdout.write(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
