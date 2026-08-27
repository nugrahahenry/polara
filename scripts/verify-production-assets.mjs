#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { decodeRgbaPng, countTransparentRgb } from './lib/png-rgba.mjs';
import { frameOverlayTemplates } from '../src/modules/templates/frame-overlays.generated.js';
import { exclusiveStickers, mascots, stickers } from '../src/modules/stickers/index.js';


const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = async (relativePath) => JSON.parse(await fs.readFile(path.join(root, relativePath), 'utf8'));
const requireQuality = (condition, message) => {
  if (!condition) throw new Error(message);
};

function resolveAsset(relativePath) {
  requireQuality(typeof relativePath === 'string' && relativePath.length > 0, 'Asset path must be a non-empty string.');
  requireQuality(!path.isAbsolute(relativePath), `Asset path must be relative: ${relativePath}`);
  const resolved = path.resolve(root, relativePath);
  requireQuality(resolved.startsWith(`${root}${path.sep}`), `Asset escaped project root: ${relativePath}`);
  return resolved;
}

async function inspectPng(relativePath, dimensions, maximumBytes, { requireTransparent = false } = {}) {
  const absolutePath = resolveAsset(relativePath);
  const bytes = await fs.readFile(absolutePath);
  requireQuality(bytes.length <= maximumBytes, `${relativePath} exceeds ${maximumBytes} bytes.`);
  const decoded = decodeRgbaPng(bytes);
  requireQuality(decoded.width === dimensions[0] && decoded.height === dimensions[1], `${relativePath} has ${decoded.width}x${decoded.height}.`);
  const alpha = countTransparentRgb(decoded.pixels);
  requireQuality(alpha.transparentPixelsWithRgb === 0, `${relativePath} retains hidden RGB under alpha 0.`);
  if (requireTransparent) requireQuality(alpha.transparentPixels > 0, `${relativePath} must preserve transparency.`);
  return { bytes: bytes.length, ...alpha };
}

async function listPng(relativeDirectory) {
  const entries = await fs.readdir(resolveAsset(relativeDirectory));
  return entries.filter((entry) => entry.endsWith('.png')).map((entry) => `${relativeDirectory}/${entry}`).sort();
}

function unique(values) {
  return [...new Set(values)].sort();
}

async function verify() {
  const policy = await readJson('assets/asset-quality-policy.json');
  const manifest = await readJson('assets/frames/frame-overlay-manifest.json');
  const guestManifest = await readJson('assets/guests/guest-manifest.json');
  requireQuality(policy.schemaVersion === 1 && policy.profile === 'polara-asset-quality-v1', 'Unknown asset-quality policy.');
  requireQuality(manifest.frames.length === 10 && frameOverlayTemplates.length === 10, 'Frame registry must contain 10 variants.');

  for (const frame of frameOverlayTemplates) {
    const canvas = frame.mode === 'strip' ? policy.frames.stripCanvas : policy.frames.singleCanvas;
    const thumb = frame.mode === 'strip' ? policy.frames.stripThumbnail : policy.frames.singleThumbnail;
    requireQuality(frame.characterPolicy === 'character-free', `${frame.id} is not character-free.`);
    requireQuality(!frame.mascotSrc, `${frame.id} couples a mascot to a frame.`);
    requireQuality(/^assets\/frames\/composites\//.test(frame.pickerThumbnailSrc), `${frame.id} picker is not a composite.`);
    requireQuality(frame.pickerThumbnailSrc !== frame.thumbnailSrc, `${frame.id} picker and fallback are coupled.`);
    await inspectPng(frame.overlaySrc, canvas, policy.frames.maximumOverlayBytes, { requireTransparent: true });
    await inspectPng(frame.thumbnailSrc, thumb, policy.frames.maximumThumbnailBytes, { requireTransparent: true });
    await inspectPng(frame.pickerThumbnailSrc, thumb, policy.frames.maximumThumbnailBytes);
  }

  for (const sticker of stickers) {
    const bytes = await fs.readFile(resolveAsset(sticker.src));
    const decoded = decodeRgbaPng(bytes);
    requireQuality(policy.stickers.allowedDimensions.some(([w, h]) => w === decoded.width && h === decoded.height), `${sticker.id} has unsupported dimensions.`);
    requireQuality(bytes.length <= policy.stickers.maximumBytes, `${sticker.id} exceeds sticker byte budget.`);
    const alpha = countTransparentRgb(decoded.pixels);
    requireQuality(alpha.transparentPixels > 0 && alpha.transparentPixelsWithRgb === 0, `${sticker.id} has invalid transparency.`);
  }
  requireQuality(exclusiveStickers.length === policy.stickers.exclusiveFamilyCount, 'Exclusive family count drifted.');
  requireQuality(new Set(exclusiveStickers.map((item) => item.exclusiveFamilyId)).size === policy.stickers.exclusiveFamilyCount, 'Exclusive families must be unique.');

  for (const mascot of mascots) {
    requireQuality(!policy.mascots.forbiddenRuntimeIds.includes(mascot.id), `${mascot.id} is forbidden at runtime.`);
    const bytes = await fs.readFile(resolveAsset(mascot.src));
    const decoded = decodeRgbaPng(bytes);
    requireQuality(policy.mascots.allowedDimensions.some(([w, h]) => w === decoded.width && h === decoded.height), `${mascot.id} has unsupported dimensions.`);
    requireQuality(bytes.length <= policy.mascots.maximumBytes, `${mascot.id} exceeds mascot byte budget.`);
    const alpha = countTransparentRgb(decoded.pixels);
    requireQuality(alpha.transparentPixels > 0 && alpha.transparentPixelsWithRgb === 0, `${mascot.id} has invalid transparency.`);
  }

  for (const guest of guestManifest.guests) {
    requireQuality(guest.publicFigure === false && guest.collaborationClaim === false, `${guest.id} rights metadata is unsafe.`);
    await inspectPng(guest.runtimeSrc, policy.guests.dimensions, policy.guests.maximumBytes, { requireTransparent: true });
  }

  const expected = {
    'assets/frames': unique(frameOverlayTemplates.map((frame) => frame.overlaySrc)),
    'assets/frames/thumbnails': unique(frameOverlayTemplates.map((frame) => frame.thumbnailSrc)),
    'assets/frames/composites': unique(frameOverlayTemplates.map((frame) => frame.pickerThumbnailSrc)),
    'assets/stickers': unique(stickers.map((asset) => asset.src)),
    'assets/mascot': unique(mascots.map((asset) => asset.src)),
    'assets/guests': unique(guestManifest.guests.map((asset) => asset.runtimeSrc)),
  };
  for (const [directory, paths] of Object.entries(expected)) {
    requireQuality(JSON.stringify(await listPng(directory)) === JSON.stringify(paths), `${directory} contains missing or orphan PNG assets.`);
  }

  requireQuality(policy.pickerFixture.kind === 'fictional-synthetic', 'Picker fixture must be fictional-synthetic.');
  requireQuality(policy.pickerFixture.publicFigure === false && policy.pickerFixture.collaborationClaim === false, 'Picker fixture rights metadata is unsafe.');
  requireQuality(/^assets\/_originals\/fixtures\/[a-z0-9-]+\.png$/.test(policy.pickerFixture.source), 'Picker fixture source policy is invalid.');
  requireQuality(/^assets\/_originals\/fixtures\/[a-z0-9-]+\.prompt\.txt$/.test(policy.pickerFixture.promptSource), 'Picker prompt source policy is invalid.');
  console.log(`ASSET QUALITY PASS: frames=${frameOverlayTemplates.length} stickers=${stickers.length} mascots=${mascots.length} guests=${guestManifest.guests.length}`);
}

verify().catch((error) => {
  console.error(`ASSET QUALITY FAIL: ${error.message}`);
  process.exitCode = 1;
});
