import { deflateSync, inflateSync } from 'node:zlib';


const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);
const BYTES_PER_PIXEL = 4;

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
  }
  return value >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function paeth(left, above, upperLeft) {
  const prediction = left + above - upperLeft;
  const leftDistance = Math.abs(prediction - left);
  const aboveDistance = Math.abs(prediction - above);
  const upperLeftDistance = Math.abs(prediction - upperLeft);
  if (leftDistance <= aboveDistance && leftDistance <= upperLeftDistance) return left;
  if (aboveDistance <= upperLeftDistance) return above;
  return upperLeft;
}

function makeChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const size = Buffer.alloc(4);
  size.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([size, typeBuffer, data, checksum]);
}

function filterByte(filter, current, left, above, upperLeft) {
  if (filter === 0) return current;
  if (filter === 1) return (current - left + 256) & 0xff;
  if (filter === 2) return (current - above + 256) & 0xff;
  if (filter === 3) return (current - Math.floor((left + above) / 2) + 256) & 0xff;
  return (current - paeth(left, above, upperLeft) + 256) & 0xff;
}

function filterScore(row) {
  let score = 0;
  for (const byte of row) score += Math.min(byte, 256 - byte);
  return score;
}

export function decodeRgbaPng(buffer) {
  if (!buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
    throw new Error('File bukan PNG yang valid.');
  }

  let offset = PNG_SIGNATURE.length;
  let width;
  let height;
  const idatChunks = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    offset += 12 + length;

    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      const [bitDepth, colorType, compression, filter, interlace] = data.subarray(8, 13);
      if (bitDepth !== 8 || colorType !== 6 || compression !== 0 || filter !== 0 || interlace !== 0) {
        throw new Error('Sanitizer hanya mendukung PNG RGBA 8-bit non-interlaced.');
      }
    } else if (type === 'IDAT') {
      idatChunks.push(data);
    } else if (type === 'IEND') {
      break;
    }
  }

  if (!width || !height || idatChunks.length === 0) {
    throw new Error('PNG kehilangan IHDR atau IDAT.');
  }

  const stride = width * BYTES_PER_PIXEL;
  const inflated = inflateSync(Buffer.concat(idatChunks));
  if (inflated.length !== height * (stride + 1)) {
    throw new Error('Ukuran scanline PNG tidak cocok dengan IHDR.');
  }

  const pixels = Buffer.alloc(width * height * BYTES_PER_PIXEL);
  for (let y = 0; y < height; y += 1) {
    const inputOffset = y * (stride + 1);
    const filter = inflated[inputOffset];
    if (filter > 4) throw new Error(`Filter PNG ${filter} tidak didukung.`);
    const outputOffset = y * stride;
    const previousOffset = outputOffset - stride;

    for (let x = 0; x < stride; x += 1) {
      const encoded = inflated[inputOffset + 1 + x];
      const left = x >= BYTES_PER_PIXEL ? pixels[outputOffset + x - BYTES_PER_PIXEL] : 0;
      const above = y > 0 ? pixels[previousOffset + x] : 0;
      const upperLeft = y > 0 && x >= BYTES_PER_PIXEL
        ? pixels[previousOffset + x - BYTES_PER_PIXEL]
        : 0;
      let value = encoded;
      if (filter === 1) value += left;
      else if (filter === 2) value += above;
      else if (filter === 3) value += Math.floor((left + above) / 2);
      else if (filter === 4) value += paeth(left, above, upperLeft);
      pixels[outputOffset + x] = value & 0xff;
    }
  }

  return { width, height, pixels };
}

export function encodeRgbaPng({ width, height, pixels }) {
  const stride = width * BYTES_PER_PIXEL;
  if (pixels.length !== stride * height) {
    throw new Error('Jumlah byte RGBA tidak cocok dengan dimensi PNG.');
  }

  const scanlines = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * stride;
    const previousOffset = rowOffset - stride;
    let bestFilter = 0;
    let bestRow;
    let bestScore = Number.POSITIVE_INFINITY;

    for (let filter = 0; filter <= 4; filter += 1) {
      const candidate = Buffer.allocUnsafe(stride);
      for (let x = 0; x < stride; x += 1) {
        const current = pixels[rowOffset + x];
        const left = x >= BYTES_PER_PIXEL ? pixels[rowOffset + x - BYTES_PER_PIXEL] : 0;
        const above = y > 0 ? pixels[previousOffset + x] : 0;
        const upperLeft = y > 0 && x >= BYTES_PER_PIXEL
          ? pixels[previousOffset + x - BYTES_PER_PIXEL]
          : 0;
        candidate[x] = filterByte(filter, current, left, above, upperLeft);
      }
      const score = filterScore(candidate);
      if (score < bestScore) {
        bestFilter = filter;
        bestRow = candidate;
        bestScore = score;
      }
    }

    const outputOffset = y * (stride + 1);
    scanlines[outputOffset] = bestFilter;
    bestRow.copy(scanlines, outputOffset + 1);
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  return Buffer.concat([
    PNG_SIGNATURE,
    makeChunk('IHDR', header),
    makeChunk('IDAT', deflateSync(scanlines, { level: 9 })),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

export function countTransparentRgb(pixels) {
  let transparentPixels = 0;
  let transparentPixelsWithRgb = 0;
  for (let offset = 0; offset < pixels.length; offset += BYTES_PER_PIXEL) {
    if (pixels[offset + 3] !== 0) continue;
    transparentPixels += 1;
    if (pixels[offset] || pixels[offset + 1] || pixels[offset + 2]) {
      transparentPixelsWithRgb += 1;
    }
  }
  return { transparentPixels, transparentPixelsWithRgb };
}

export function clearTransparentRgb(pixels) {
  let changedPixels = 0;
  for (let offset = 0; offset < pixels.length; offset += BYTES_PER_PIXEL) {
    if (pixels[offset + 3] !== 0) continue;
    if (pixels[offset] || pixels[offset + 1] || pixels[offset + 2]) changedPixels += 1;
    pixels[offset] = 0;
    pixels[offset + 1] = 0;
    pixels[offset + 2] = 0;
  }
  return changedPixels;
}
