// Generates all required icons and iOS splash screens from icon.svg
//   - apple-touch-icon.png (180x180) — iOS home screen
//   - icon-192.png / icon-512.png   — PWA / Play Store
//   - icon-1024.png                 — App Store Connect (required)
//   - public/splash/*.png           — iOS launch screens for all major devices
const path = require('path');
const fs   = require('fs');

// iOS splash screen sizes: [width, height, devicePixelRatio, label]
// Portrait only — covers all modern iPhones + iPads
const SPLASH_SIZES = [
  [750,  1334, 2, 'iphone-se'],
  [828,  1792, 2, 'iphone-xr'],
  [1170, 2532, 3, 'iphone-14'],
  [1179, 2556, 3, 'iphone-14-pro'],
  [1284, 2778, 3, 'iphone-14-plus'],
  [1290, 2796, 3, 'iphone-14-pro-max'],
  [1536, 2048, 2, 'ipad-9'],
  [1668, 2388, 2, 'ipad-pro-11'],
  [2048, 2732, 2, 'ipad-pro-12'],
];

// App background colour (#fffbeb) as sharp-compatible RGBA
const BG = { r: 255, g: 251, b: 235, alpha: 1 };
// Icon occupies 25% of the shorter dimension, centred
const ICON_RATIO = 0.25;

async function generate() {
  try {
    const sharp = require('sharp');
    const svgPath = path.join(__dirname, '../public/icon.svg');
    const svg = fs.readFileSync(svgPath);

    // ── Standard PWA / store icons ─────────────────────────────────────────
    await sharp(svg).resize(180, 180).png().toFile(
      path.join(__dirname, '../public/apple-touch-icon.png')
    );
    await sharp(svg).resize(192, 192).png().toFile(
      path.join(__dirname, '../public/icon-192.png')
    );
    await sharp(svg).resize(512, 512).png().toFile(
      path.join(__dirname, '../public/icon-512.png')
    );
    // 1024×1024 required for Apple App Store Connect submission
    await sharp(svg).resize(1024, 1024).png().toFile(
      path.join(__dirname, '../public/icon-1024.png')
    );
    console.log('Icons generated: apple-touch-icon.png, icon-192.png, icon-512.png, icon-1024.png');

    // ── iOS splash screens ─────────────────────────────────────────────────
    const splashDir = path.join(__dirname, '../public/splash');
    if (!fs.existsSync(splashDir)) fs.mkdirSync(splashDir, { recursive: true });

    for (const [w, h, , label] of SPLASH_SIZES) {
      const iconSize = Math.round(Math.min(w, h) * ICON_RATIO);
      const iconBuf  = await sharp(svg).resize(iconSize, iconSize).png().toBuffer();
      const left     = Math.round((w - iconSize) / 2);
      const top      = Math.round((h - iconSize) / 2);
      await sharp({ create: { width: w, height: h, channels: 4, background: BG } })
        .composite([{ input: iconBuf, left, top }])
        .png()
        .toFile(path.join(splashDir, `${label}.png`));
    }
    console.log(`Splash screens generated: ${SPLASH_SIZES.map(s => s[3]).join(', ')}`);
  } catch (e) {
    console.warn('Icon/splash generation skipped (sharp unavailable):', e.message);
  }
}

generate();
