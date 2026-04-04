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

// ─── Šahovnica (Croatian coat-of-arms checkerboard) ──────────────────────────
// Matches the app icon exactly:
//   • Heraldic shield shape: angled shoulders, curved sides, pointed bottom
//   • Top-left square = WHITE (consistent with icon.svg)
//   • Gold gradient border (matching icon #FFE070 → #f59e0b → #C8980A)
//   • Gold crown with red gems above the shield
//
// Shield geometry (centered at x=832):
//   Shoulder x range: 717 → 947  (230 px wide)
//   Angled top:       (832, 55)  center → (947, 75) right / (717, 75) left
//   Straight sides:   y=75 → y=295
//   Curved bottom:    Q(940,375) and Q(724,375) to tip (832,438)
//   Checkerboard:     5×5 grid, cell=46 px, origin (717,75), top-left WHITE

function shieldSquares() {
  const ox = 717; // grid origin x (left edge of shield at shoulder)
  const oy = 75;  // grid origin y (top of straight sides)
  const sz = 46;  // cell size — 5×46 = 230 = full shield width
  const RED   = '#D40030';
  const WHITE = '#ffffff';

  let rects = '';
  // Render 8 rows so the curved lower half is fully painted before clipping
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 5; col++) {
      const x = ox + col * sz;
      const y = oy + row * sz;
      // Top-left (0,0) = WHITE — matches icon.svg exactly
      const fill = (row + col) % 2 === 0 ? WHITE : RED;
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

// ─── Crown: mirrors the gold crown in icon.svg ────────────────────────────────
// Translated so the base sits at (832, 40) — just above the shield's angled tip.
const crown = `
  <g transform="translate(832, 40)" fill="url(#gold)">
    <!-- Crown base bar -->
    <rect x="-34" y="0" width="68" height="15" rx="3.5"/>
    <!-- Three crown peaks -->
    <polygon points="-34,0 -27,-24 -17,-11 0,-30 17,-11 27,-24 34,0"/>
    <!-- Red gem accents -->
    <circle cx="-27" cy="-22" r="5"   fill="#D40030" opacity="0.9"/>
    <circle cx="0"   cy="-28" r="5.5" fill="#D40030" opacity="0.9"/>
    <circle cx="27"  cy="-22" r="5"   fill="#D40030" opacity="0.9"/>
  </g>`;

const svg = `<svg width="1024" height="500" viewBox="0 0 1024 500"
     xmlns="http://www.w3.org/2000/svg">
  <defs>

    <!-- Background: app header gradient (dark navy → bright teal) -->
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#0a3d55"/>
      <stop offset="50%"  stop-color="#0e7490"/>
      <stop offset="100%" stop-color="#0891b2"/>
    </linearGradient>

    <!-- Gold gradient — matches icon.svg exactly -->
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

    <!-- Ambient glow behind title text -->
    <radialGradient id="glowL" cx="25%" cy="50%" r="45%">
      <stop offset="0%"   stop-color="#0ea5e9" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#0a3d55"  stop-opacity="0"/>
    </radialGradient>

    <!-- Shield inner highlight (top-down, matches icon) -->
    <radialGradient id="shieldGlow" cx="50%" cy="25%" r="60%">
      <stop offset="0%"   stop-color="rgba(255,255,255,0.15)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
    </radialGradient>

    <!-- Clip path: heraldic shield — angled shoulders + curved pointed bottom -->
    <!-- Matches the shape from icon.svg scaled to the feature graphic canvas  -->
    <clipPath id="shieldClip">
      <path d="M 832 59
               L 947 79
               L 947 295
               Q 937 375 832 438
               Q 727 375 717 295
               L 717 79
               Z"/>
    </clipPath>

  </defs>

  <!-- ── BACKGROUND ──────────────────────────────────────────────────────── -->
  <rect width="1024" height="500" fill="url(#bg)"/>
  <rect width="1024" height="500" fill="url(#glowR)"/>
  <rect width="1024" height="500" fill="url(#glowL)"/>

  <!-- Decorative concentric rings behind shield (depth / premium feel) -->
  <circle cx="832" cy="250" r="340" fill="none"
          stroke="rgba(255,255,255,0.035)" stroke-width="110"/>
  <circle cx="832" cy="250" r="210" fill="none"
          stroke="rgba(255,255,255,0.04)"  stroke-width="70"/>

  <!-- ── CROATIAN FLAG ACCENT — vertical stripe on left edge ─────────────── -->
  <rect x="0" y="0"   width="7" height="167" fill="#003DA5" opacity="0.85"/>
  <rect x="0" y="167" width="7" height="166" fill="#ffffff"  opacity="0.85"/>
  <rect x="0" y="333" width="7" height="167" fill="#D40030"  opacity="0.85"/>

  <!-- ── ŠAHOVNICA SHIELD ─────────────────────────────────────────────────── -->

  <!-- Shield drop-shadow / depth layer (same shape, offset +5,+5) -->
  <path d="M 837 64
           L 952 84
           L 952 300
           Q 942 380 837 443
           Q 732 380 722 300
           L 722 84
           Z"
        fill="rgba(0,0,0,0.22)"/>

  <!-- Gold border: slightly larger path rendered behind the clip area -->
  <path d="M 832 55
           L 951 75
           L 951 299
           Q 941 379 832 442
           Q 723 379 713 299
           L 713 75
           Z"
        fill="url(#gold)" opacity="0.88"/>

  <!-- Checkerboard squares clipped to heraldic shield shape -->
  <g clip-path="url(#shieldClip)">
    ${shieldSquares()}
    <!-- Inner highlight overlay matching icon.svg shieldGlow -->
    <path d="M 832 59 L 947 79 L 947 295 Q 937 375 832 438 Q 727 375 717 295 L 717 79 Z"
          fill="url(#shieldGlow)"/>
  </g>

  <!-- Thin white outline on inner shield edge (subtle finish) -->
  <path d="M 832 59 L 947 79 L 947 295 Q 937 375 832 438 Q 727 375 717 295 L 717 79 Z"
        fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="1.5"/>

  <!-- ── GOLD CROWN — matches icon.svg crown exactly ──────────────────────── -->
  ${crown}

  <!-- Subtle "HRVATSKA" below shield tip — small gold lettering -->
  <text x="832" y="460"
        font-family="'Segoe UI','Helvetica Neue',Arial,sans-serif"
        font-size="11" font-weight="700" fill="url(#gold)"
        text-anchor="middle" letter-spacing="5" opacity="0.72">H R V A T S K A</text>

  <!-- ── LEFT SIDE TEXT ──────────────────────────────────────────────────── -->

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
