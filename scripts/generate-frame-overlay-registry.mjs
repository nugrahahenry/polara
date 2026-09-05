#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const inputPath = process.argv[2] || 'assets/frames/frame-overlay-manifest.json';
const outputPath = process.argv[3] || 'src/modules/templates/frame-overlays.generated.js';

function fail(message) {
  console.error(`[frame-overlay-registry] ${message}`);
  process.exit(1);
}

function assertInteger(value, label) {
  if (!Number.isInteger(value) || value < 0) fail(`${label} harus integer non-negatif.`);
}

function validateWindow(window, label, canvasWidth, canvasHeight) {
  for (const key of ['x', 'y', 'width', 'height']) assertInteger(window[key], `${label}.${key}`);
  if (window.width < 1 || window.height < 1) fail(`${label} harus punya ukuran positif.`);
  if (window.x + window.width > canvasWidth || window.y + window.height > canvasHeight) {
    fail(`${label} keluar dari canvas ${canvasWidth}x${canvasHeight}.`);
  }
}

function validatePolygon(points, label, canvasWidth, canvasHeight) {
  if (!Array.isArray(points) || points.length < 3) fail(`${label} harus punya minimal tiga titik.`);
  points.forEach((point, index) => {
    if (!Array.isArray(point) || point.length !== 2) fail(`${label}[${index}] harus berupa [x, y].`);
    const [x, y] = point;
    assertInteger(x, `${label}[${index}][0]`);
    assertInteger(y, `${label}[${index}][1]`);
    if (x > canvasWidth || y > canvasHeight) fail(`${label}[${index}] keluar dari canvas.`);
  });
}

function polygonBounds(points) {
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
}

function validateFrame(frame, ids) {
  const required = [
    'id', 'family', 'name', 'category', 'mode', 'renderMode',
    'characterPolicy', 'overlaySrc', 'thumbnailSrc', 'pickerThumbnailSrc', 'canvasWidth', 'canvasHeight',
    'assetVersion', 'slotBackground',
    'supportsDynamicText', 'metadataZones'
  ];
  for (const key of required) {
    if (frame[key] == null) fail(`${frame.id || 'frame'} kehilangan field ${key}.`);
  }
  if (ids.has(frame.id)) fail(`ID duplikat: ${frame.id}.`);
  ids.add(frame.id);
  if (frame.renderMode !== 'png-overlay') fail(`${frame.id}.renderMode harus png-overlay.`);
  if (frame.characterPolicy !== 'character-free') fail(`${frame.id}.characterPolicy harus character-free.`);
  if (!/^assets\/frames\/composites\/[a-z0-9-]+-thumbnail\.png$/.test(frame.pickerThumbnailSrc)) {
    fail(`${frame.id}.pickerThumbnailSrc harus menunjuk composite picker produksi.`);
  }
  if (frame.mascotSrc != null) fail(`${frame.id}.mascotSrc dilarang; Poca harus menjadi sticker exclusive atau UI-only.`);
  if (!['single', 'strip'].includes(frame.mode)) fail(`${frame.id}.mode invalid.`);
  const expectedSlots = frame.mode === 'strip' ? 3 : 1;
  assertInteger(frame.canvasWidth, `${frame.id}.canvasWidth`);
  assertInteger(frame.canvasHeight, `${frame.id}.canvasHeight`);
  const maskType = frame.maskType || 'rectangles';
  if (!['rectangles', 'rounded-rectangles', 'polygon'].includes(maskType)) fail(`${frame.id}.maskType invalid.`);
  if (maskType === 'polygon') {
    if (expectedSlots !== 1) fail(`${frame.id} polygon hanya didukung untuk Single.`);
    validatePolygon(frame.photoPolygon, `${frame.id}.photoPolygon`, frame.canvasWidth, frame.canvasHeight);
  } else if (!Array.isArray(frame.photoWindows) || frame.photoWindows.length !== expectedSlots) {
    fail(`${frame.id} harus punya ${expectedSlots} photo window.`);
  }
  (frame.photoWindows || []).forEach((window, index) => {
    validateWindow(window, `${frame.id}.photoWindows[${index}]`, frame.canvasWidth, frame.canvasHeight);
    if (maskType === 'rounded-rectangles' && (!Number.isInteger(window.radius) || window.radius < 0)) {
      fail(`${frame.id}.photoWindows[${index}].radius harus integer non-negatif.`);
    }
  });
  if (!/^#[a-fA-F0-9]{6}$/.test(frame.slotBackground)) {
    fail(`${frame.id}.slotBackground harus hex 6 digit.`);
  }
}

const raw = await fs.readFile(inputPath, 'utf8');
const manifest = JSON.parse(raw);
if (!Array.isArray(manifest.frames)) fail('Manifest harus memiliki array frames.');
if (manifest.frames.length !== 16) fail(`Manifest produksi harus berisi tepat 16 frame Hero; ditemukan ${manifest.frames.length}.`);
if (manifest.familyProfileVersion !== 'frame-family-v2') fail('Manifest harus memakai frame-family-v2.');
if (!Array.isArray(manifest.families) || manifest.families.length !== 7) {
  fail('Manifest harus memiliki tepat tujuh family profile.');
}

const familyProfiles = new Map();
for (const family of manifest.families) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(family.id || '')) fail('Family profile memiliki id invalid.');
  if (familyProfiles.has(family.id)) fail(`Family profile duplikat: ${family.id}.`);
  if (typeof family.story !== 'string' || family.story.length < 24 || family.story.length > 120) {
    fail(`${family.id}.story harus 24-120 karakter.`);
  }
  if (typeof family.material !== 'string' || family.material.length < 3 || family.material.length > 32) {
    fail(`${family.id}.material harus 3-32 karakter.`);
  }
  if (!Array.isArray(family.palette) || family.palette.length !== 3 || !family.palette.every((color) => /^#[a-fA-F0-9]{6}$/.test(color))) {
    fail(`${family.id}.palette harus berisi tiga warna hex.`);
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*-exclusive$/.test(family.exclusiveStickerId || '')) {
    fail(`${family.id}.exclusiveStickerId invalid.`);
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(family.pickerFixtureId || '')) {
    fail(`${family.id}.pickerFixtureId invalid.`);
  }
  familyProfiles.set(family.id, family);
}

const ids = new Set();
manifest.frames.forEach((frame) => validateFrame(frame, ids));
for (const frame of manifest.frames) {
  if (!familyProfiles.has(frame.family)) fail(`${frame.id} tidak memiliki family profile.`);
}
for (const familyId of familyProfiles.keys()) {
  const variants = manifest.frames.filter((frame) => frame.family === familyId);
  if (variants.length < 2 || new Set(variants.map((frame) => frame.mode)).size !== 2) {
    fail(`${familyId} harus memiliki sedikitnya satu variant Single dan Strip.`);
  }
}

const runtimeFields = manifest.frames.map((frame) => ({
  id: frame.id,
  familyId: frame.family,
  name: frame.name,
  category: frame.category,
  mode: frame.mode,
  tone: frame.family === 'poca-purikura'
    ? 'brand-hero'
    : frame.family === 'vintage-film-lofi'
      ? 'nostalgia'
      : frame.family === 'polara-daily'
        ? 'editorial'
      : frame.family === 'polara-midnight-club'
        ? 'night-studio'
        : frame.family === 'cloud-picnic'
          ? 'weekend-airy'
          : frame.family === 'lucky-ticket'
            ? 'club-ticket'
            : 'statement',
  premium: false,
  status: 'runtime-overlay',
  pickerBadge: 'Hero',
  pickerDetail: frame.mode === 'strip' ? 'Strip 3 · 720 × 1800' : 'Single · 1080 × 1350',
  renderMode: frame.renderMode,
  characterPolicy: frame.characterPolicy,
  overlaySrc: frame.overlaySrc,
  thumbnailSrc: frame.thumbnailSrc,
  pickerThumbnailSrc: frame.pickerThumbnailSrc,
  familyProfile: familyProfiles.get(frame.family),
  canvas: { width: frame.canvasWidth, height: frame.canvasHeight },
  maskType: frame.maskType || 'rectangles',
  photoWindows: frame.maskType === 'polygon' ? [polygonBounds(frame.photoPolygon)] : frame.photoWindows,
  ...(frame.photoPolygon ? { photoPolygon: frame.photoPolygon } : {}),
  assetVersion: frame.assetVersion,
  slotBackground: frame.slotBackground,
  supportsDynamicText: frame.supportsDynamicText,
  metadataZones: frame.metadataZones,
}));

const banner = `// GENERATED FILE. DO NOT EDIT.\n// Source: ${path.basename(inputPath)}\n`;
const output = `${banner}export const frameOverlayTemplates = ${JSON.stringify(runtimeFields, null, 2)};\n`;

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, output, 'utf8');
console.log(`[frame-overlay-registry] wrote ${runtimeFields.length} entries to ${outputPath}`);
