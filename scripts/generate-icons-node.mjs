// generate-icons-node.mjs
// Generates all required Android launcher icon densities from public/icon-1024.png
// using Sharp (already installed as a project dependency).
//
// Outputs:
//   android/app/src/main/res/mipmap-{mdpi,hdpi,xhdpi,xxhdpi,xxxhdpi}/
//     ic_launcher.png         — standard square icon
//     ic_launcher_round.png   — circular masked icon
//     ic_launcher_foreground.png — foreground layer for adaptive icon (108dp canvas)
//   public/icon-512.png       — Play Store high-res icon (512×512)
//
// Run: node scripts/generate-icons-node.mjs

import sharp from 'sharp';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SRC = resolve(ROOT, 'public', 'icon-1024.png');
const RES = resolve(ROOT, 'android', 'app', 'src', 'main', 'res');

// Icon sizes per density bucket (launcher icon = 48dp base)
const DENSITIES = [
  { name: 'mipmap-mdpi',    px: 48 },
  { name: 'mipmap-hdpi',    px: 72 },
  { name: 'mipmap-xhdpi',   px: 96 },
  { name: 'mipmap-xxhdpi',  px: 144 },
  { name: 'mipmap-xxxhdpi', px: 192 },
];

if (!existsSync(SRC)) {
  console.error(`ERROR: ${SRC} not found`);
  process.exit(1);
}

// Build circular mask SVG for round icons
function circleMask(size) {
  const r = size / 2;
  return Buffer.from(
    `<svg width="${size}" height="${size}">` +
    `<circle cx="${r}" cy="${r}" r="${r}" fill="white"/>` +
    `</svg>`
  );
}

async function generatePlayStoreIcon() {
  // 512×512 for Play Store upload (high-res icon)
  const dest = resolve(ROOT, 'public', 'icon-512-playstore.png');
  await sharp(SRC).resize(512, 512).toFile(dest);
  console.log(`  Play Store icon (512×512): public/icon-512-playstore.png`);
}

async function generateDensity({ name, px }) {
  const dir = resolve(RES, name);
  mkdirSync(dir, { recursive: true });

  // Adaptive foreground canvas: 108dp at this density = px * (108/48)
  const adaptivePx = Math.round(px * 108 / 48);
  // Icon occupies the inner safe zone (~66dp of 108dp = ~61%)
  const safePx = Math.round(px * 66 / 48);

  // ── ic_launcher.png — square icon on white background ──────────────────
  await sharp(SRC)
    .resize(px, px)
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .png()
    .toFile(resolve(dir, 'ic_launcher.png'));

  // ── ic_launcher_round.png — circular mask ───────────────────────────────
  const mask = circleMask(px);
  await sharp(SRC)
    .resize(px, px)
    .composite([{ input: mask, blend: 'dest-in' }])
    .flatten({ background: { r: 14, g: 116, b: 144 } }) // brand teal background
    .png()
    .toFile(resolve(dir, 'ic_launcher_round.png'));

  // ── ic_launcher_foreground.png — adaptive icon foreground layer ─────────
  // Icon is centred on a transparent 108dp canvas
  // The safe zone (inner 66dp) is where the icon should sit to avoid clipping
  const topPad = Math.floor((adaptivePx - safePx) / 2);
  await sharp(SRC)
    .resize(safePx, safePx)
    .extend({
      top: topPad,
      bottom: adaptivePx - safePx - topPad,
      left: topPad,
      right: adaptivePx - safePx - topPad,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(resolve(dir, 'ic_launcher_foreground.png'));

  console.log(`  ${name}: ${px}px launcher, ${adaptivePx}px foreground ✓`);
}

console.log(`Generating Android icons from: ${SRC}`);
console.log('');

try {
  await generatePlayStoreIcon();
  for (const density of DENSITIES) {
    await generateDensity(density);
  }
  console.log('');
  console.log('Done. All icon densities written to android/app/src/main/res/');
  console.log('Play Store icon written to public/icon-512-playstore.png');
} catch (err) {
  console.error('Error generating icons:', err.message);
  process.exit(1);
}
