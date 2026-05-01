// generate-feature-graphic.mjs
// Generates the Google Play Store feature graphic (1024×500 px PNG).
// Uses Sharp + inline SVG — no external tools required.
//
// Run: node scripts/generate-feature-graphic.mjs
// Output: public/feature-graphic-1024x500.png

import sharp from 'sharp';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ── Shield geometry ────────────────────────────────────────────────────────────
// Derived from icon.svg by the mapping:  x_here = x_icon + 576,  y_here = y_icon − 25
//
// icon clip : M 256 100 L 371 124 L 371 282 Q 371 348 256 373 Q 141 348 141 282 L 141 124 Z
// here clip : M 832  75 L 947  99 L 947 257 Q 947 323 832 348 Q 717 323 717 257 L 717  99 Z
//
// icon gold : M 256  90 L 381 116 L 381 286 Q 381 358 256 385 Q 131 358 131 286 L 131 116 Z
// here gold : M 832  65 L 957  91 L 957 261 Q 957 333 832 360 Q 707 333 707 261 L 707  91 Z
//
// Cell size: 46 w × 54.6 h  →  (y=75→348 = 273px) / 5 rows = 54.6px
// Identical proportion to icon (both 273px tall, 230px wide, cells 46×54.6)

const SHIELD_CLIP   = 'M 832 75 L 947 99 L 947 257 Q 947 323 832 348 Q 717 323 717 257 L 717 99 Z';
const SHIELD_GOLD   = 'M 832 65 L 957 91 L 957 261 Q 957 333 832 360 Q 707 333 707 261 L 707 91 Z';
const SHIELD_SHADOW = 'M 837 70 L 962 96 L 962 266 Q 962 338 837 365 Q 712 338 712 266 L 712 96 Z';

function shieldSquares() {
  const ox    = 717;   // left edge (x_icon 141 + 576)
  const oy    = 75;    // top of grid (y_icon 100 − 25)
  const cellW = 46;    // 5 × 46 = 230 = shield width
  const cellH = 54.6;  // 273 / 5 — identical proportion to icon
  const RED   = '#D40030';
  const WHITE = '#ffffff';

  let rects = '';
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      const x    = ox + col * cellW;
      const y    = oy + row * cellH;
      const fill = (row + col) % 2 === 0 ? WHITE : RED;
      rects += `<rect x="${x}" y="${y}" width="${cellW}" height="${cellH}" fill="${fill}"/>`;
    }
  }
  return rects;
}

// Feature chips
function chip(x, y, w, label) {
  const cx = x + w / 2;
  return `
    <rect x="${x}" y="${y}" width="${w}" height="34" rx="17"
          fill="rgba(255,255,255,0.13)" stroke="rgba(255,255,255,0.22)" stroke-width="1"/>
    <text x="${cx}" y="${y + 22}" font-family="'Segoe UI','Helvetica Neue',Arial,sans-serif"
          font-size="13" font-weight="600" fill="white" text-anchor="middle">${label}</text>`;
}

// Crown — base sits at y=65, matching gold border top (same as icon)
const crown = `
  <g transform="translate(832, 65)" fill="url(#gold)">
    <rect x="-34" y="0" width="68" height="15" rx="3.5"/>
    <polygon points="-34,0 -27,-24 -17,-11 0,-30 17,-11 27,-24 34,0"/>
    <circle cx="-27" cy="-22" r="5"   fill="#D40030" opacity="0.9"/>
    <circle cx="0"   cy="-28" r="5.5" fill="#D40030" opacity="0.9"/>
    <circle cx="27"  cy="-22" r="5"   fill="#D40030" opacity="0.9"/>
  </g>`;

const svg = `<svg width="1024" height="500" viewBox="0 0 1024 500"
     xmlns="http://www.w3.org/2000/svg">
  <defs>

    <!-- Background: dark navy → bright teal -->
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#0a3d55"/>
      <stop offset="50%"  stop-color="#0e7490"/>
      <stop offset="100%" stop-color="#0891b2"/>
    </linearGradient>

    <!-- Gold — matches icon.svg exactly -->
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#FFE070"/>
      <stop offset="40%"  stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#C8980A"/>
    </linearGradient>

    <!-- Ambient glow behind shield -->
    <radialGradient id="glowR" cx="85%" cy="50%" r="50%">
      <stop offset="0%"   stop-color="#22d3ee" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="#0a3d55"  stop-opacity="0"/>
    </radialGradient>

    <!-- Ambient glow behind title -->
    <radialGradient id="glowL" cx="25%" cy="50%" r="45%">
      <stop offset="0%"   stop-color="#0ea5e9" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#0a3d55"  stop-opacity="0"/>
    </radialGradient>

    <!-- Shield inner highlight -->
    <radialGradient id="shieldGlow" cx="50%" cy="25%" r="60%">
      <stop offset="0%"   stop-color="rgba(255,255,255,0.15)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
    </radialGradient>

    <clipPath id="shieldClip">
      <path d="${SHIELD_CLIP}"/>
    </clipPath>

  </defs>

  <!-- ── BACKGROUND ──────────────────────────────────────────────────────── -->
  <rect width="1024" height="500" fill="url(#bg)"/>
  <rect width="1024" height="500" fill="url(#glowR)"/>
  <rect width="1024" height="500" fill="url(#glowL)"/>

  <!-- Atmosphere rings behind shield -->
  <circle cx="832" cy="210" r="310" fill="none"
          stroke="rgba(255,255,255,0.035)" stroke-width="110"/>
  <circle cx="832" cy="210" r="190" fill="none"
          stroke="rgba(255,255,255,0.04)"  stroke-width="70"/>


  <!-- ── ŠAHOVNICA SHIELD ───────────────────────────────────────────────── -->

  <!-- Drop shadow -->
  <path d="${SHIELD_SHADOW}" fill="rgba(0,0,0,0.22)"/>

  <!-- Gold border -->
  <path d="${SHIELD_GOLD}" fill="url(#gold)" opacity="0.88"/>

  <!-- Checkerboard clipped to shield -->
  <g clip-path="url(#shieldClip)">
    ${shieldSquares()}
    <path d="${SHIELD_CLIP}" fill="url(#shieldGlow)"/>
  </g>

  <!-- Thin white inner outline -->
  <path d="${SHIELD_CLIP}" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="1.5"/>

  <!-- ── CROWN ──────────────────────────────────────────────────────────── -->
  ${crown}

  <!-- HRVATSKA label below shield -->
  <text x="832" y="378"
        font-family="'Segoe UI','Helvetica Neue',Arial,sans-serif"
        font-size="11" font-weight="700" fill="url(#gold)"
        text-anchor="middle" letter-spacing="5" opacity="0.72">H R V A T S K A</text>

  <!-- ── LEFT SIDE TEXT ──────────────────────────────────────────────────── -->

  <!-- Overline badge -->
  <rect x="60" y="108" width="250" height="30" rx="15"
        fill="rgba(255,255,255,0.11)" stroke="rgba(255,255,255,0.20)" stroke-width="1"/>
  <text x="185" y="128"
        font-family="'Segoe UI','Helvetica Neue',Arial,sans-serif"
        font-size="12" font-weight="700" fill="rgba(186,230,253,0.92)"
        text-anchor="middle" letter-spacing="1.8">FREE  ·  NO ADS  ·  OFFLINE</text>

  <!-- App name line 1 -->
  <text x="60" y="213"
        font-family="'Segoe UI','Helvetica Neue',Arial,sans-serif"
        font-size="80" font-weight="700" fill="white" letter-spacing="-2">
    Na&#x161;a
  </text>

  <!-- App name line 2 -->
  <text x="60" y="298"
        font-family="'Segoe UI','Helvetica Neue',Arial,sans-serif"
        font-size="80" font-weight="700" fill="white" letter-spacing="-2">
    Hrvatska
  </text>

  <!-- Tagline -->
  <text x="62" y="342"
        font-family="'Segoe UI','Helvetica Neue',Arial,sans-serif"
        font-size="25" font-weight="300" fill="rgba(186,230,253,0.88)"
        letter-spacing="0.3">
    Learn Croatian. Really.
  </text>

  <!-- Feature chips — row 1 -->
  ${chip(60,  368, 158, '1,000+ Words')}
  ${chip(228, 368, 128, 'AI Tutor')}
  ${chip(366, 368, 142, 'CEFR A1\u2013B2')}

  <!-- Feature chips — row 2 -->
  ${chip(60,  412, 178, 'Spaced Repetition')}
  ${chip(248, 412, 138, 'All 7 Cases')}
  ${chip(396, 412, 154, 'Cultural Stories')}

  <!-- Bottom sign-off -->
  <text x="60" y="478"
        font-family="'Segoe UI','Helvetica Neue',Arial,sans-serif"
        font-size="13" font-weight="400" fill="rgba(255,255,255,0.42)"
        letter-spacing="0.3">
    U&#x10D;imo zajedno \u2014 Let\u2019s learn together.
  </text>

</svg>`;

const outPath = resolve(ROOT, 'public', 'feature-graphic-1024x500.png');

console.log('Generating Play Store feature graphic...');
await sharp(Buffer.from(svg))
  .png()
  .toFile(outPath);

console.log('Done: public/feature-graphic-1024x500.png');
