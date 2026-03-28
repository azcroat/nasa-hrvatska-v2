import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join, extname, basename } from 'path';

const IMAGE_DIRS = [
  'public/images/scenes',
  'public/images/portraits',
  'public/images/knights',
  'public/images',
];

async function convertDir(dir) {
  let files;
  try {
    files = await readdir(dir);
  } catch {
    return; // Directory doesn't exist
  }

  for (const file of files) {
    const ext = extname(file).toLowerCase();
    if (!['.jpg', '.jpeg', '.png'].includes(ext)) continue;

    const inputPath = join(dir, file);
    const outputPath = join(dir, basename(file, ext) + '.webp');

    // Skip if WebP already exists and is newer
    try {
      const [inStat, outStat] = await Promise.all([stat(inputPath), stat(outputPath)]);
      if (outStat.mtimeMs >= inStat.mtimeMs) {
        console.log(`  SKIP (up to date): ${outputPath}`);
        continue;
      }
    } catch {
      // Output doesn't exist yet — proceed
    }

    try {
      const info = await sharp(inputPath)
        .webp({ quality: 82, effort: 4 })
        .toFile(outputPath);

      const inStat = await stat(inputPath);
      const savings = Math.round((1 - info.size / inStat.size) * 100);
      console.log(`  OK ${file} -> ${basename(outputPath)} (${savings}% smaller, ${Math.round(info.size/1024)}KB)`);
    } catch (err) {
      console.error(`  FAIL ${file}:`, err.message);
    }
  }
}

console.log('Converting images to WebP...');
for (const dir of IMAGE_DIRS) {
  console.log(`\n${dir}/`);
  await convertDir(dir);
}
console.log('\nDone.');
