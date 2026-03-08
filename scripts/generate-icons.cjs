// Generates apple-touch-icon.png (180x180) and icon-192.png / icon-512.png from icon.svg
const path = require('path');
const fs = require('fs');

async function generate() {
  try {
    const sharp = require('sharp');
    const svgPath = path.join(__dirname, '../public/icon.svg');
    const svg = fs.readFileSync(svgPath);

    await sharp(svg).resize(180, 180).png().toFile(
      path.join(__dirname, '../public/apple-touch-icon.png')
    );
    await sharp(svg).resize(192, 192).png().toFile(
      path.join(__dirname, '../public/icon-192.png')
    );
    await sharp(svg).resize(512, 512).png().toFile(
      path.join(__dirname, '../public/icon-512.png')
    );
    console.log('Icons generated: apple-touch-icon.png, icon-192.png, icon-512.png');
  } catch (e) {
    console.warn('Icon generation skipped (sharp unavailable):', e.message);
  }
}

generate();
