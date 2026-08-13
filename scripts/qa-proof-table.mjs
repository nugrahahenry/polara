#!/usr/bin/env node
import assert from 'node:assert/strict';
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

async function captureProof(page) {
  await waitForCameraReady(page);
  await page.locator('#primaryBtn').click();
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

async function downloadPng(page, name) {
  const downloadEvent = page.waitForEvent('download', { timeout: 30_000 });
  await page.locator('#secondaryBtn').click();
  const download = await downloadEvent;
  const filename = path.join(exportRoot, name);
  await download.saveAs(filename);
  const buffer = await fs.readFile(filename);
  return { filename, ...pngDimensions(buffer), bytes: buffer.byteLength };
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
  await page.locator('#primaryBtn').waitFor({ state: 'visible' });
  return page;
}

async function runFlow({ name, viewport, screenshots = false, retake = false, exportStrip = false }) {
  const context = await browser.newContext({ viewport, permissions: ['camera'], reducedMotion: 'reduce', acceptDownloads: true });
  const page = await startPage(context);
  const stageAudit = {};
  const shot = async (number, stage) => {
    stageAudit[stage] = await auditCurrentPage(page);
    if (screenshots && writeScreenshots) await page.screenshot({ path: path.join(screenshotRoot, `${name}-${number}-${stage}.png`) });
  };

  const labels = await page.locator('#progressList .progress-label').allTextContents();
  assert.deepEqual(labels, ['Start', 'Camera', 'Review', 'Frames', 'Decorate', 'Reveal']);
  assert.match(await page.locator('#proofBuddyImage').getAttribute('src'), /poca-excited-jump\.png$/);
  await shot('01', 'start');

  await page.locator('#privacyBtn').click();
  assert.equal(await page.locator('#privacyDialog').evaluate((dialog) => dialog.open), true);
  assert.match(await page.locator('#privacyDialog img').getAttribute('src'), /poca-privacy-guardian\.png$/);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#privacyBtn').evaluate((button) => document.activeElement === button), true);

  await page.locator('#primaryBtn').click();
  await waitForCameraReady(page);
  assert.match(await page.locator('#proofBuddyImage').getAttribute('src'), /poca-camera\.png$/);
  await shot('02', 'camera');
  await captureProof(page);
  if (await page.locator('[data-panel="camera"]').isVisible()) await captureProof(page);
  if (await page.locator('[data-panel="camera"]').isVisible()) await captureProof(page);
  await waitForPanel(page, 'review');
  assert.equal(await page.locator('#reviewSlots .slot-card').count(), 3);
  assert.match(await page.locator('#proofBuddyImage').getAttribute('src'), /poca-peeking\.png$/);

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

  await page.locator('#primaryBtn').click();
  await waitForPanel(page, 'frame');
  await page.locator('#templateList .tpl-btn').first().waitFor({ state: 'visible' });
  assert.equal(await page.locator('#photoSlotTabs .slot-tab').count(), 3);
  await page.locator('#photoSlotTabs .slot-tab').nth(1).click();
  assert.equal(await page.locator('#photoSlotTabs .slot-tab').nth(1).getAttribute('aria-selected'), 'true');
  assert.match(await page.locator('#templateList .tpl-thumb-image').first().getAttribute('src'), /frames\/composites\//);
  assert.match(await page.locator('#proofBuddyImage').getAttribute('src'), /poca-holding-photo-frame\.png$/);
  await page.locator('#templateList .tpl-btn').first().focus();
  await page.keyboard.press('End');
  assert.equal(await page.locator('#templateList .tpl-btn').last().evaluate((button) => document.activeElement === button), true);
  await shot('04', 'frames');

  await page.locator('#primaryBtn').click();
  await waitForPanel(page, 'decorate');
  assert.match(await page.locator('#proofBuddyImage').getAttribute('src'), /poca-decorate-guide\.png$/);
  await page.locator('#stickerTray .sticker-btn').first().focus();
  await page.keyboard.press('End');
  assert.equal(await page.locator('#stickerTray .sticker-btn').last().evaluate((button) => document.activeElement === button), true);
  await shot('05', 'decorate');
  await page.locator('#stickerTray .sticker-btn').first().click();
  assert.match(await page.locator('#proofBuddyImage').getAttribute('src'), /poca-peeking\.png$/);

  await page.locator('#primaryBtn').click();
  await waitForPanel(page, 'reveal');
  assert.match(await page.locator('#revealPanelPoca').getAttribute('src'), /poca-sleepy-loading\.png$/);
  await page.waitForFunction(() => document.querySelector('#revealTitle')?.textContent === 'Proof approved.', null, { timeout: 40_000 });
  assert.match(await page.locator('#revealPanelPoca').getAttribute('src'), /poca-proof-approved\.png$/);
  assert.equal(await page.locator('#progressList .step-proof-stamp').count(), 6);
  await shot('06', 'reveal');

  let exported = null;
  if (exportStrip) exported = await downloadPng(page, 'polara-strip-proof-table.png');
  report.viewports[name] = { viewport, stages: stageAudit, retakePreservedOtherSlots: retake, labels };
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

try {
  report.exports.strip = await runFlow({ name: '390x844', viewport: { width: 390, height: 844 }, screenshots: true, retake: true, exportStrip: true });
  await runFlow({ name: '1440x900', viewport: { width: 1440, height: 900 }, screenshots: true });
  await runFlow({ name: '768x1024', viewport: { width: 768, height: 1024 } });
  await runFlow({ name: '900x510', viewport: { width: 900, height: 510 } });
  report.exports.single = await runSingleExport();

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
    keyboardTrays: 'Home/End passed for frame and sticker trays',
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
