// scripts/optimize-images.js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { globby } from 'globby';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IMAGES_DIR = path.join(__dirname, '..', 'images');
const ORIGINALS_DIR = path.join(__dirname, '..', 'images_original');

// Dynamic size: ~0.5 bytes per pixel, clamped
const BYTES_PER_PIXEL = 0.5;
const MIN_SIZE_BYTES = 25 * 1024;       // 25 KB
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const MAX_DIMENSION = 4000;              // longest edge
const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp'];

function getMaxBytesForImage(width, height) {
  const area = width * height;
  const target = area * BYTES_PER_PIXEL;
  return Math.max(MIN_SIZE_BYTES, Math.min(MAX_SIZE_BYTES, target));
}

async function main() {
  if (!fs.existsSync(IMAGES_DIR)) {
    console.log('No images/ folder found – nothing to do.');
    return;
  }

  const patterns = IMAGE_EXTENSIONS.map(ext => `images/**/*.${ext}`);
  const files = await globby(patterns, { cwd: path.join(__dirname, '..') });

  if (files.length === 0) {
    console.log('No images found to process.');
    return;
  }

  console.log(`Found ${files.length} image(s) to process.\n`);

  const stats = [];

  for (const file of files) {
    const result = await processImage(file);
    stats.push(result);
  }

  await updateJsonReferences();

  printComparisonTable(stats);
  writeComparisonCsv(stats);

  console.log('\nDone! All images optimized and references updated.');
  console.log('Size comparison saved to: image-comparison.csv');
}

async function processImage(relativePath) {
  const repoRoot = path.join(__dirname, '..');
  const inputPath = path.join(repoRoot, relativePath);

  console.log(`Processing: ${relativePath}`);

  const relativeInImages = relativePath.replace(/^images[\\/]/, '');

  const originalPath = path.join(ORIGINALS_DIR, relativeInImages);
  const originalDir = path.dirname(originalPath);
  if (!fs.existsSync(originalDir)) {
    fs.mkdirSync(originalDir, { recursive: true });
  }

  // Get original size before moving
  const originalSize = fs.statSync(inputPath).size;

  if (!fs.existsSync(originalPath)) {
    fs.renameSync(inputPath, originalPath);
  }

  const sourcePath = originalPath;

  const webpRelative = relativeInImages.replace(/\.[^.]+$/, '.webp');
  const webpPath = path.join(repoRoot, 'images', webpRelative);

  const webpDir = path.dirname(webpPath);
  if (!fs.existsSync(webpDir)) {
    fs.mkdirSync(webpDir, { recursive: true });
  }

  let sharpInstance = sharp(sourcePath);

  const metadata = await sharpInstance.metadata();
  let width = metadata.width || 0;
  let height = metadata.height || 0;
  const longest = Math.max(width, height);

  if (longest > MAX_DIMENSION) {
    const scale = MAX_DIMENSION / longest;
    width = Math.round(width * scale);
    height = Math.round(height * scale);

    sharpInstance = sharpInstance.resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  const maxBytes = getMaxBytesForImage(width, height);

  let quality = 80;
  let outputBuffer;

  while (quality >= 20) {
    outputBuffer = await sharpInstance
      .toFormat('webp', { quality })
      .toBuffer();

    if (outputBuffer.length <= maxBytes) {
      break;
    }
    quality -= 5;
  }

  if (outputBuffer.length > maxBytes) {
    console.warn(
      `Warning: Could not get ${relativePath} under target size ` +
      `(target: ${(maxBytes / 1024).toFixed(1)} KB, actual: ${(outputBuffer.length / 1024).toFixed(1)} KB).`
    );
  }

  fs.writeFileSync(webpPath, outputBuffer);
  const newSize = outputBuffer.length;

  console.log(
    `  Created: ${path.relative(repoRoot, webpPath)} ` +
    `(${(newSize / 1024).toFixed(1)} KB, max: ${(maxBytes / 1024).toFixed(1)} KB)`
  );

  return {
    path: relativePath,
    originalSize,
    newSize,
    outputPath: path.relative(repoRoot, webpPath),
  };
}

async function updateJsonReferences() {
  const repoRoot = path.join(__dirname, '..');

  const jsonFiles = await globby(['**/*.json'], {
    cwd: repoRoot,
    ignore: ['node_modules/**', 'package-lock.json'],
  });

  for (const file of jsonFiles) {
    const filePath = path.join(repoRoot, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    const updated = content.replace(
      /(["'])(images\/[^"'\s]+?)\.(png|jpe?g|webp)(["'])/gi,
      (match, q1, base, ext, q2) => {
        changed = true;
        return `${q1}${base}.webp${q2}`;
      }
    );

    if (changed) {
      fs.writeFileSync(filePath, updated, 'utf8');
      console.log(`Updated image references in: ${file}`);
    }
  }
}

function printComparisonTable(stats) {
  console.log('\n=== Image Size Comparison ===\n');

  // Header
  console.log(
    'File'.padEnd(50),
    'Original'.padStart(10),
    'New'.padStart(10),
    'Saved'.padStart(10)
  );
  console.log('-'.repeat(90));

  let totalOriginal = 0;
  let totalNew = 0;

  for (const s of stats) {
    const originalKB = (s.originalSize / 1024).toFixed(1);
    const newKB = (s.newSize / 1024).toFixed(1);
    const savedKB = ((s.originalSize - s.newSize) / 1024).toFixed(1);
    const savedPercent =
      s.originalSize > 0
        ? ((s.originalSize - s.newSize) / s.originalSize) * 100
        : 0;

    console.log(
      s.path.padEnd(50),
      originalKB.padStart(10),
      newKB.padStart(10),
      `${savedKB} KB (${savedPercent.toFixed(1)}%)`.padStart(10)
    );

    totalOriginal += s.originalSize;
    totalNew += s.newSize;
  }

  console.log('-'.repeat(90));
  const totalOriginalKB = (totalOriginal / 1024).toFixed(1);
  const totalNewKB = (totalNew / 1024).toFixed(1);
  const totalSavedKB = ((totalOriginal - totalNew) / 1024).toFixed(1);
  const totalSavedPercent =
    totalOriginal > 0
      ? ((totalOriginal - totalNew) / totalOriginal) * 100
      : 0;

  console.log(
    'TOTAL'.padEnd(50),
    totalOriginalKB.padStart(10),
    totalNewKB.padStart(10),
    `${totalSavedKB} KB (${totalSavedPercent.toFixed(1)}%)`.padStart(10)
  );
}

function writeComparisonCsv(stats) {
  const repoRoot = path.join(__dirname, '..');
  const csvPath = path.join(repoRoot, 'image-comparison.csv');

  const header = 'File,OriginalBytes,NewBytes,OriginalKB,NewKB,SavedKB,SavedPercent\n';
  const lines = stats.map(s => {
    const originalKB = s.originalSize / 1024;
    const newKB = s.newSize / 1024;
    const savedKB = (s.originalSize - s.newSize) / 1024;
    const savedPercent =
      s.originalSize > 0
        ? ((s.originalSize - s.newSize) / s.originalSize) * 100
        : 0;

    return [
      s.path,
      s.originalSize,
      s.newSize,
      originalKB.toFixed(2),
      newKB.toFixed(2),
      savedKB.toFixed(2),
      savedPercent.toFixed(2),
    ].join(',');
  });

  const csvContent = header + lines.join('\n');
  fs.writeFileSync(csvPath, csvContent, 'utf8');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});