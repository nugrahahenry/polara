import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  clearTransparentRgb,
  countTransparentRgb,
  decodeRgbaPng,
  encodeRgbaPng,
} from './lib/png-rgba.mjs';


const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(projectRoot, 'assets', 'frames', 'frame-overlay-manifest.json');
const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
const requestedFiles = process.argv.slice(2);
const stickerDirectory = path.join(projectRoot, 'assets', 'stickers');
const stickerFiles = (await fs.readdir(stickerDirectory))
  .filter((file) => path.extname(file).toLowerCase() === '.png')
  .sort()
  .map((file) => path.posix.join('assets', 'stickers', file));
const overlayFiles = requestedFiles.length > 0
  ? requestedFiles
  : [...manifest.frames.map((frame) => frame.overlaySrc), ...stickerFiles];

for (const relativeFile of overlayFiles) {
  if (path.extname(relativeFile).toLowerCase() !== '.png') {
    throw new Error(`Target bukan PNG: ${relativeFile}`);
  }

  const absoluteFile = path.resolve(projectRoot, relativeFile);
  const relativeToProject = path.relative(projectRoot, absoluteFile);
  if (relativeToProject.startsWith('..') || path.isAbsolute(relativeToProject)) {
    throw new Error(`Target berada di luar project: ${relativeFile}`);
  }

  const original = await fs.readFile(absoluteFile);
  const decoded = decodeRgbaPng(original);
  const before = countTransparentRgb(decoded.pixels);
  const changedPixels = clearTransparentRgb(decoded.pixels);

  if (changedPixels === 0) {
    console.log(`${relativeFile}: clean`);
    continue;
  }

  const sanitized = encodeRgbaPng(decoded);
  const verified = decodeRgbaPng(sanitized);
  const after = countTransparentRgb(verified.pixels);
  if (after.transparentPixelsWithRgb !== 0) {
    throw new Error(`Sanitasi gagal untuk ${relativeFile}.`);
  }

  await fs.writeFile(absoluteFile, sanitized);
  const sizeDelta = sanitized.length <= original.length
    ? `${((1 - sanitized.length / original.length) * 100).toFixed(1)}% smaller`
    : `${((sanitized.length / original.length - 1) * 100).toFixed(1)}% larger`;
  console.log(
    `${relativeFile}: ${before.transparentPixelsWithRgb} hidden RGB pixels cleared, `
    + `${original.length} -> ${sanitized.length} bytes (${sizeDelta})`,
  );
}
