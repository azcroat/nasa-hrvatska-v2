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

// ─── Brand colours (matches app design tokens exactly) ────────────────────
// Header gradient: #0c4a6e → #0891b2 (from home-mobile.svg)
// Brand gradient:  #0e7490 → #164e63 (from index.css --brand)
// Croatian red:    #D40030 (from index.css --color-croatian)

// ─── Šahovnica (Croatian coat-of-arms checkerboard) ──────────────────────
// 5×5 grid of alternating red/white squares, top-left = red.
// Shield shape: rectangular grid + heraldic pointed bottom.
// Shield position: right side of canvas, slightly inset.
//
// Shield metrics:
//   Grid origin:   x=700, y=66
//   Cell size:     53×53 px
//   Grid size:     265×265 px  (5×53)
//   Grid bottom:   y=331
//   Shield right:  x=965
//   Shield tip:    x=832, y=450
//   Crown banner:  y=35–65 above grid

function shieldSquares() {
  const ox = 700; // grid origin x
  const oy = 66;  // grid origin y
  const sz = 53;  // cell size
  const RED   = '#D40030';
  const WHITE = '#ffffff';

  let rects = '';
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      const x = ox + col * sz;
      const y = oy + row * sz;
      // Top-left (0,0) is red; alternates by (row+col) % 2
      const fill = (row + col) % 2 === 0 ? RED : WHITE;
      rects += `<rect x="${x}" y="${y}" width="${sz}" height="${sz}" fill="${fill}"/>`;
    }
  }
  return rects;
}

// Feature chips — two rows of 3
function chip(x, y, w, label) {
  const cx = x + w / 2;
  return `
    <rect x="${x}" y="${y}" width="${w}" height="34" rx="17"
          fill="rgba(255,255,255,0.13)" stroke="rgba(255,255,255,0.22)" stroke-width="1"/>
    <text x="${cx}" y="${y + 22}" font-family="'Segoe UI','Helvetica Neue',Arial,sans-serif"
          font-size="13" font-weight="600" fill="white" text-anchor="middle">${label}</text>`;
}

const svg = `<svg width="1024" height="500" viewBox="0 0 1024 500"
     xmlns="http://www.w3.org/2000/svg">
  <defs>

    <!-- Background: app header gradient (dark navy → bright teal) -->
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#0a3d55"/>
      <stop offset="50%"  stop-color="#0e7490"/>
      <stop offset="100%" stop-color="#0891b2"/>
    </linearGradient>

    <!-- Ambient glow behind shield -->
    <radialGradient id="glowR" cx="85%" cy="50%" r="50%">
      <stop offset="0%"   stop-color="#22d3ee" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="#0a3d55"  stop-opacity="0"/>
    </radialGradient>

    <!-- Ambient glow behind title text -->
    <radialGradient id="glowL" cx="25%" cy="50%" r="45%">
      <stop offset="0%"   stop-color="#0ea5e9" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#0a3d55"  stop-opacity="0"/>
    </radialGradient>

    <!-- Chip gradient (subtle top-highlight) -->
    <linearGradient id="chipGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="rgba(255,255,255,0.22)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0.06)"/>
    </linearGradient>

    <!-- Shield clip: rounded-top rectangle + heraldic pointed bottom -->
    <clipPath id="shieldClip">
      <path d="M 700 72 Q 700 60 712 60 L 953 60 Q 965 60 965 72
               L 965 331 L 832 450 L 700 331 Z"/>
    </clipPath>

  </defs>

  <!-- ── BACKGROUND ─────────────────────────────────────────────────── -->
  <rect width="1024" height="500" fill="url(#bg)"/>
  <rect width="1024" height="500" fill="url(#glowR)"/>
  <rect width="1024" height="500" fill="url(#glowL)"/>

  <!-- Decorative concentric rings behind shield (depth / premium feel) -->
  <circle cx="832" cy="250" r="340" fill="none"
          stroke="rgba(255,255,255,0.035)" stroke-width="110"/>
  <circle cx="832" cy="250" r="210" fill="none"
          stroke="rgba(255,255,255,0.04)"  stroke-width="70"/>

  <!-- ── CROATIAN FLAG ACCENT — vertical stripe on left edge ─────── -->
  <!-- Blue / White / Red, each 1/3 of 500px height -->
  <rect x="0" y="0"   width="7" height="167" fill="#003DA5" opacity="0.85"/>
  <rect x="0" y="167" width="7" height="166" fill="#ffffff"  opacity="0.85"/>
  <rect x="0" y="333" width="7" height="167" fill="#D40030"  opacity="0.85"/>

  <!-- ── ŠAHOVNICA SHIELD ───────────────────────────────────────────── -->

  <!-- Shield drop-shadow / depth layer -->
  <path d="M 704 76 Q 704 64 716 64 L 957 64 Q 969 64 969 76
           L 969 334 L 836 453 L 704 334 Z"
        fill="rgba(0,0,0,0.22)"/>

  <!-- Crown banner above checkerboard -->
  <rect x="700" y="34" width="265" height="32" rx="9"
        fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.18)" stroke-width="1"/>
  <text x="832" y="55"
        font-family="'Segoe UI','Helvetica Neue',Arial,sans-serif"
        font-size="12" font-weight="700" fill="rgba(255,255,255,0.90)"
        text-anchor="middle" letter-spacing="4">H R V A T S K A</text>

  <!-- Checkerboard squares clipped to shield shape -->
  <g clip-path="url(#shieldClip)">
    ${shieldSquares()}
    <!-- Heraldic pointed bottom: red triangle with white central lozenge -->
    <polygon points="700,331 965,331 832,450" fill="#D40030"/>
    <polygon points="748,331 850,331 832,365" fill="#ffffff"/>
  </g>

  <!-- Shield outline border -->
  <path d="M 700 72 Q 700 60 712 60 L 953 60 Q 965 60 965 72
           L 965 331 L 832 450 L 700 331 Z"
        fill="none" stroke="rgba(255,255,255,0.38)" stroke-width="2.5"/>

  <!-- ── LEFT SIDE TEXT ─────────────────────────────────────────────── -->

  <!-- Overline badge: "FREE · NO ADS · OFFLINE" -->
  <rect x="60" y="108" width="250" height="30" rx="15"
        fill="rgba(255,255,255,0.11)" stroke="rgba(255,255,255,0.20)" stroke-width="1"/>
  <text x="185" y="128"
        font-family="'Segoe UI','Helvetica Neue',Arial,sans-serif"
        font-size="12" font-weight="700" fill="rgba(186,230,253,0.92)"
        text-anchor="middle" letter-spacing="1.8">FREE  ·  NO ADS  ·  OFFLINE</text>

  <!-- App name: "Naša" line 1 -->
  <text x="60" y="213"
        font-family="'Segoe UI','Helvetica Neue',Arial,sans-serif"
        font-size="80" font-weight="700" fill="white" letter-spacing="-2">
    Na&#x161;a
  </text>

  <!-- App name: "Hrvatska" line 2 -->
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
  ${chip(248, 412, 118, '7 Cases')}
  ${chip(376, 412, 164, 'Cultural Stories')}

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
