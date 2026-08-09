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

function validateFrame(frame, ids) {
  const required = [
    'id', 'family', 'name', 'category', 'mode', 'renderMode',
    'overlaySrc', 'thumbnailSrc', 'canvasWidth', 'canvasHeight',
    'photoWindows', 'assetVersion', 'slotBackground',
    'supportsDynamicText', 'metadataZones'
  ];
  for (const key of required) {
    if (frame[key] == null) fail(`${frame.id || 'frame'} kehilangan field ${key}.`);
  }
  if (ids.has(frame.id)) fail(`ID duplikat: ${frame.id}.`);
  ids.add(frame.id);
  if (frame.renderMode !== 'png-overlay') fail(`${frame.id}.renderMode harus png-overlay.`);
  if (!['single', 'strip'].includes(frame.mode)) fail(`${frame.id}.mode invalid.`);
  const expectedSlots = frame.mode === 'strip' ? 3 : 1;
  if (frame.photoWindows.length !== expectedSlots) {
    fail(`${frame.id} harus punya ${expectedSlots} photo window.`);
  }
  assertInteger(frame.canvasWidth, `${frame.id}.canvasWidth`);
  assertInteger(frame.canvasHeight, `${frame.id}.canvasHeight`);
  frame.photoWindows.forEach((window, index) => {
    validateWindow(window, `${frame.id}.photoWindows[${index}]`, frame.canvasWidth, frame.canvasHeight);
  });
  if (!/^#[a-fA-F0-9]{6}$/.test(frame.slotBackground)) {
    fail(`${frame.id}.slotBackground harus hex 6 digit.`);
  }
}

const raw = await fs.readFile(inputPath, 'utf8');
const manifest = JSON.parse(raw);
if (!Array.isArray(manifest.frames)) fail('Manifest harus memiliki array frames.');
if (manifest.frames.length !== 6) fail(`Manifest produksi harus berisi tepat 6 frame Hero; ditemukan ${manifest.frames.length}.`);

const ids = new Set();
manifest.frames.forEach((frame) => validateFrame(frame, ids));

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
      : 'statement',
  premium: false,
  status: 'runtime-overlay',
  pickerBadge: 'Hero',
  pickerDetail: frame.mode === 'strip' ? '3 foto' : '1 foto',
  renderMode: frame.renderMode,
  overlaySrc: frame.overlaySrc,
  thumbnailSrc: frame.thumbnailSrc,
  canvas: { width: frame.canvasWidth, height: frame.canvasHeight },
  photoWindows: frame.photoWindows,
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
