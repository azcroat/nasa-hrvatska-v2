import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

/**
 * CroatianKnight — LEGO Movie–quality minifigure mascot
 *
 * Authentic LEGO minifigure proportions:
 *  - Round stud on bucket visor helmet
 *  - T-visor with dual eye slits
 *  - Visible shoulder disk joints
 *  - Iconic C-clamp hands
 *  - H-shaped hip connector
 *  - Šahovnica shield — 5×5, WHITE (argent) first (correct Croatian heraldry)
 *  - LEGO sword with pommel/guard/blade
 *  - Red plume
 *  - Per-mood body + arm animations with LEGO stop-motion feel
 */

// ─── Palette ─────────────────────────────────────────────────────────────────
const C = {
  ar:    '#A4B4C8',  // armor (classic LEGO castle blue-gray)
  arHi:  '#D2E2F4',  // armor highlight
  arSh:  '#5A6A84',  // armor shadow
  arDk:  '#343C50',  // armor deep shadow
  red:   '#CC0022',  // Croatian red
  redHi: '#EE3042',
  gd:    '#D4A400',  // gold
  gdHi:  '#FFDC3C',
  sk:    '#F0CC70',  // LEGO classic yellow skin
  skHi:  '#FFE490',
  blk:   '#181828',  // near-black outline
  wht:   '#F4F0E2',  // parchment white (shield)
  brn:   '#5E3010',  // leather grip
  stl:   '#8898B0',  // blade steel
};

// ─── Mood → rim glow (CSS drop-shadow filter) ────────────────────────────────
const MOOD_RIM = {
  celebrating: 'drop-shadow(0 0 10px rgba(212,164,0,.8)) drop-shadow(0 0 20px rgba(212,164,0,.35))',
  victory:     'drop-shadow(0 0 12px rgba(180,83,9,.9)) drop-shadow(0 0 22px rgba(255,200,50,.45))',
  happy:       'drop-shadow(0 0 8px rgba(14,116,144,.5))',
  encouraged:  'drop-shadow(0 0 8px rgba(22,163,74,.48))',
  thinking:    'drop-shadow(0 0 8px rgba(124,58,237,.52))',
  ready:       'drop-shadow(0 0 10px rgba(29,78,216,.58))',
  marching:    'drop-shadow(0 0 10px rgba(29,78,216,.5))',
  sad:         'drop-shadow(0 0 7px rgba(220,38,38,.38))',
  confused:    null,
  neutral:     null,
};

// ─── Level-based visual evolution ────────────────────────────────────────────
function getLevelConfig(level) {
  if (level >= 100) return {
    eyeGlow: 'rgba(255,255,255,0.90)', eyeGlowAnim: 'lk-eye-legendary 1.2s ease-in-out infinite',
    crownColor: '#FFDC3C', crownAnim: 'lk-crown 1.0s ease-in-out infinite', crownWidth: 2.2,
    goldBands: true, aura: true,
  };
  if (level >= 76) return {
    eyeGlow: 'rgba(96,165,250,0.82)', eyeGlowAnim: 'lk-eye-master 1.8s ease-in-out infinite',
    crownColor: '#FFDC3C', crownAnim: 'lk-crown 1.6s ease-in-out infinite', crownWidth: 2.0,
    goldBands: true, aura: false,
  };
  if (level >= 51) return {
    eyeGlow: 'rgba(59,130,246,0.58)', eyeGlowAnim: 'lk-eye-expert 2.2s ease-in-out infinite',
    crownColor: '#FFDC3C', crownAnim: null, crownWidth: 1.6,
    goldBands: false, aura: false,
  };
  if (level >= 26) return {
    eyeGlow: null, eyeGlowAnim: null,
    crownColor: C.gdHi, crownAnim: null, crownWidth: 1.4,
    goldBands: false, aura: false,
  };
  if (level >= 11) return {
    eyeGlow: null, eyeGlowAnim: null,
    crownColor: C.gdHi, crownAnim: null, crownWidth: 1.0,
    goldBands: false, aura: false,
  };
  return { eyeGlow: null, eyeGlowAnim: null, crownColor: null, crownAnim: null, crownWidth: 0, goldBands: false, aura: false };
}

// ─── CSS Keyframes ────────────────────────────────────────────────────────────
// LEGO animations have a satisfying "plastic snap" quality — short, snappy timing
const KF = `
/* ── Body animations ── */
@keyframes lk-bounce {
  0%,100%{transform:translateY(0px)}
  25%{transform:translateY(-15px)}
  50%{transform:translateY(-10px)}
  75%{transform:translateY(-18px)}
}
@keyframes lk-float {
  0%,100%{transform:translateY(0px)}
  50%{transform:translateY(-7px)}
}
@keyframes lk-tilt {
  0%,100%{transform:rotate(0deg) translateY(0px)}
  50%{transform:rotate(-6deg) translateY(-2px)}
}
@keyframes lk-wobble {
  0%,100%{transform:rotate(0deg)}
  15%{transform:rotate(-7deg)}
  45%{transform:rotate(7deg)}
  75%{transform:rotate(-5deg)}
  90%{transform:rotate(3deg)}
}
@keyframes lk-droop {
  0%,100%{transform:translateY(0px) scaleY(1)}
  50%{transform:translateY(5px) scaleY(0.965)}
}
@keyframes lk-idle {
  0%,100%{transform:translateY(0px)}
  50%{transform:translateY(-3px)}
}
@keyframes lk-sheen {
  0%,100%{opacity:0.18}
  50%{opacity:0.42}
}
@keyframes lk-strut {
  0%,100%{transform:translateX(0px) rotate(0deg)}
  25%{transform:translateX(-6px) rotate(-3deg)}
  75%{transform:translateX(6px) rotate(3deg)}
}
@keyframes lk-pulse {
  0%,100%{transform:scale(1)}
  35%{transform:scale(1.09) translateY(-3px)}
  60%{transform:scale(1.04) translateY(-1px)}
}
@keyframes lk-spin {
  0%{transform:rotate(0deg) translateY(-4px)}
  100%{transform:rotate(360deg) translateY(-4px)}
}
@keyframes lk-march {
  0%,100%{transform:translateY(0px) rotate(0deg)}
  25%{transform:translateY(-10px) rotate(-2deg)}
  50%{transform:translateY(0px) rotate(0deg)}
  75%{transform:translateY(-10px) rotate(2deg)}
}
@keyframes lk-nod {
  0%,100%{transform:translateY(0px) rotate(0deg)}
  30%{transform:translateY(-6px) rotate(-5deg)}
  65%{transform:translateY(3px) rotate(2deg)}
}
@keyframes lk-cheer {
  0%,100%{transform:translateY(0px)}
  18%{transform:translateY(-22px)}
  36%{transform:translateY(-8px)}
  54%{transform:translateY(-26px)}
  72%{transform:translateY(-12px)}
  90%{transform:translateY(-20px)}
}
@keyframes lk-sway {
  0%,100%{transform:translateX(0px) rotate(0deg)}
  50%{transform:translateX(-9px) rotate(-5deg)}
}
@keyframes lk-stamp {
  0%,50%,100%{transform:translateY(0px) scaleY(1)}
  15%{transform:translateY(-14px) scaleY(1.03)}
  28%{transform:translateY(3px) scaleY(0.95)}
  65%{transform:translateY(-12px) scaleY(1.03)}
  78%{transform:translateY(2px) scaleY(0.96)}
}
@keyframes lk-rock {
  0%,100%{transform:rotate(0deg) translateY(0px)}
  25%{transform:rotate(-9deg) translateY(-2px)}
  75%{transform:rotate(9deg) translateY(-2px)}
}
@keyframes lk-glide {
  0%,100%{transform:translateY(0px) rotate(0deg)}
  33%{transform:translateY(-11px) rotate(-2deg)}
  66%{transform:translateY(-5px) rotate(2deg)}
}
@keyframes lk-parade {
  0%   {transform:translateY(0px)   translateX(0px)  rotate(0deg)   scaleX(1)   }
  12%  {transform:translateY(-7px)  translateX(-3px) rotate(-1.5deg) scaleX(1.01)}
  25%  {transform:translateY(-13px) translateX(-5px) rotate(-2.5deg) scaleX(1.02)}
  38%  {transform:translateY(-5px)  translateX(-2px) rotate(-0.8deg) scaleX(1)   }
  50%  {transform:translateY(0px)   translateX(0px)  rotate(0deg)   scaleX(1)   }
  62%  {transform:translateY(-7px)  translateX(3px)  rotate(1.5deg) scaleX(1.01)}
  75%  {transform:translateY(-13px) translateX(5px)  rotate(2.5deg) scaleX(1.02)}
  88%  {transform:translateY(-5px)  translateX(2px)  rotate(0.8deg) scaleX(1)   }
  100% {transform:translateY(0px)   translateX(0px)  rotate(0deg)   scaleX(1)   }
}

/* ── Arm animations — translate-rotate-translate encodes pivot ── */
@keyframes lk-aL-up {
  0%,100%{transform:translate(28px,75px) rotate(0deg) translate(-28px,-75px)}
  50%{transform:translate(28px,75px) rotate(-72deg) translate(-28px,-75px)}
}
@keyframes lk-aR-up {
  0%,100%{transform:translate(92px,75px) rotate(0deg) translate(-92px,-75px)}
  50%{transform:translate(92px,75px) rotate(72deg) translate(-92px,-75px)}
}
@keyframes lk-aL-think {
  0%,100%{transform:translate(28px,75px) rotate(0deg) translate(-28px,-75px)}
  50%{transform:translate(28px,75px) rotate(-44deg) translate(-28px,-75px)}
}
@keyframes lk-aL-encourage {
  0%,100%{transform:translate(28px,75px) rotate(0deg) translate(-28px,-75px)}
  50%{transform:translate(28px,75px) rotate(-55deg) translate(-28px,-75px)}
}
@keyframes lk-aL-droop {
  0%,100%{transform:translate(28px,75px) rotate(0deg) translate(-28px,-75px)}
  50%{transform:translate(28px,75px) rotate(16deg) translate(-28px,-75px)}
}
@keyframes lk-aR-droop {
  0%,100%{transform:translate(92px,75px) rotate(0deg) translate(-92px,-75px)}
  50%{transform:translate(92px,75px) rotate(-16deg) translate(-92px,-75px)}
}
@keyframes lk-aL-wave {
  0%,100%{transform:translate(28px,75px) rotate(0deg) translate(-28px,-75px)}
  25%{transform:translate(28px,75px) rotate(-65deg) translate(-28px,-75px)}
  75%{transform:translate(28px,75px) rotate(-25deg) translate(-28px,-75px)}
}
@keyframes lk-aR-wave {
  0%,100%{transform:translate(92px,75px) rotate(0deg) translate(-92px,-75px)}
  25%{transform:translate(92px,75px) rotate(65deg) translate(-92px,-75px)}
  75%{transform:translate(92px,75px) rotate(25deg) translate(-92px,-75px)}
}
@keyframes lk-aR-thrust {
  0%,100%{transform:translate(92px,75px) rotate(0deg) translate(-92px,-75px)}
  35%{transform:translate(92px,75px) rotate(-85deg) translate(-92px,-75px)}
  55%{transform:translate(92px,75px) rotate(-75deg) translate(-92px,-75px)}
}
@keyframes lk-aL-shield-high {
  0%,100%{transform:translate(28px,75px) rotate(-28deg) translate(-28px,-75px)}
  50%{transform:translate(28px,75px) rotate(-52deg) translate(-28px,-75px)}
}
@keyframes lk-aR-pump {
  0%,100%{transform:translate(92px,75px) rotate(0deg) translate(-92px,-75px)}
  30%{transform:translate(92px,75px) rotate(82deg) translate(-92px,-75px)}
  60%{transform:translate(92px,75px) rotate(48deg) translate(-92px,-75px)}
}
@keyframes lk-aR-sword-arc {
  0%   {transform:translate(92px,75px) rotate(18deg)   translate(-92px,-75px)}
  18%  {transform:translate(92px,75px) rotate(5deg)    translate(-92px,-75px)}
  44%  {transform:translate(92px,75px) rotate(-102deg) translate(-92px,-75px)}
  58%  {transform:translate(92px,75px) rotate(-115deg) translate(-92px,-75px)}
  75%  {transform:translate(92px,75px) rotate(-68deg)  translate(-92px,-75px)}
  90%  {transform:translate(92px,75px) rotate(10deg)   translate(-92px,-75px)}
  100% {transform:translate(92px,75px) rotate(18deg)   translate(-92px,-75px)}
}
@keyframes lk-aL-sword-guard {
  0%,100%{transform:translate(28px,75px) rotate(-30deg) translate(-28px,-75px)}
  30%    {transform:translate(28px,75px) rotate(-22deg) translate(-28px,-75px)}
  55%    {transform:translate(28px,75px) rotate(-48deg) translate(-28px,-75px)}
  75%    {transform:translate(28px,75px) rotate(-40deg) translate(-28px,-75px)}
}
@keyframes lk-confetti {
  0%  {transform:translateY(0px)  translateX(0px)  rotate(0deg)  scale(1);    opacity:1}
  30% {transform:translateY(-18px) translateX(6px)  rotate(120deg) scale(1.1); opacity:1}
  70% {transform:translateY(12px)  translateX(-4px) rotate(280deg) scale(0.85);opacity:0.7}
  100%{transform:translateY(40px)  translateX(8px)  rotate(420deg) scale(0.6); opacity:0}
}
/* ── Level-based eye glow animations ── */
@keyframes lk-eye-expert {
  0%,100%{opacity:0.45}
  50%{opacity:0.95}
}
@keyframes lk-eye-master {
  0%,100%{opacity:0.55}
  35%{opacity:1}
  65%{opacity:0.8}
}
@keyframes lk-eye-legendary {
  0%,100%{opacity:0.6; transform:scaleX(1)}
  40%{opacity:1; transform:scaleX(1.03)}
  80%{opacity:0.75}
}
/* ── Crown pulse (level 26+) ── */
@keyframes lk-crown {
  0%,100%{opacity:0.6}
  50%{opacity:1}
}
/* ── Legendary aura rings ── */
@keyframes lk-aura {
  0%,100%{opacity:0.12; r:58}
  50%{opacity:0.3; r:62}
}
`;

// ─── Mood variants ────────────────────────────────────────────────────────────
// Each mood has 3 animation variants — picked randomly on mount so the knight
// never does the exact same thing twice across different screens/pages.
const VARIANTS = {
  celebrating: [
    { body: 'lk-bounce 0.85s ease-in-out infinite', armL: 'lk-aL-up 0.85s ease-in-out infinite',   armR: 'lk-aR-up 0.85s ease-in-out infinite'   },
    { body: 'lk-cheer  0.60s ease-in-out infinite', armL: 'lk-aL-up 0.60s ease-in-out infinite',   armR: 'lk-aR-pump 0.60s ease-in-out infinite'  },
    { body: 'lk-pulse  1.20s ease-in-out infinite', armL: 'lk-aL-up 1.20s ease-in-out infinite',   armR: 'lk-aR-wave 1.20s ease-in-out infinite'  },
  ],
  happy: [
    { body: 'lk-float  2.40s ease-in-out infinite', armL: null,                                     armR: null                                      },
    { body: 'lk-strut  1.80s ease-in-out infinite', armL: 'lk-aL-wave 1.80s ease-in-out infinite', armR: null                                      },
    { body: 'lk-glide  2.20s ease-in-out infinite', armL: null,                                     armR: 'lk-aR-wave 2.20s ease-in-out infinite'   },
  ],
  encouraged: [
    { body: 'lk-float  2.00s ease-in-out infinite', armL: 'lk-aL-encourage 2.00s ease-in-out infinite', armR: null                                 },
    { body: 'lk-nod    2.20s ease-in-out infinite', armL: 'lk-aL-up 2.20s ease-in-out infinite',        armR: null                                 },
    { body: 'lk-march  1.60s ease-in-out infinite', armL: 'lk-aL-encourage 1.60s ease-in-out infinite', armR: null                                 },
  ],
  thinking: [
    { body: 'lk-tilt   3.00s ease-in-out infinite', armL: 'lk-aL-think 3.00s ease-in-out infinite', armR: null },
    { body: 'lk-sway   2.80s ease-in-out infinite', armL: 'lk-aL-think 2.80s ease-in-out infinite', armR: null },
    { body: 'lk-rock   3.50s ease-in-out infinite', armL: 'lk-aL-think 3.50s ease-in-out infinite', armR: null },
  ],
  confused: [
    { body: 'lk-wobble 0.70s ease-in-out 3',        armL: null,                                        armR: null                                     },
    { body: 'lk-rock   0.90s ease-in-out 3',        armL: null,                                        armR: null                                     },
    { body: 'lk-wobble 1.00s ease-in-out infinite', armL: 'lk-aL-droop 1.00s ease-in-out infinite',   armR: null                                     },
  ],
  sad: [
    { body: 'lk-droop  3.00s ease-in-out infinite', armL: 'lk-aL-droop 3.00s ease-in-out infinite', armR: 'lk-aR-droop 3.00s ease-in-out infinite' },
    { body: 'lk-sway   4.00s ease-in-out infinite', armL: 'lk-aL-droop 4.00s ease-in-out infinite', armR: 'lk-aR-droop 4.00s ease-in-out infinite' },
    { body: 'lk-stamp  3.50s ease-in-out infinite', armL: 'lk-aL-droop 3.50s ease-in-out infinite', armR: null                                      },
  ],
  neutral: [
    { body: 'lk-idle   4.00s ease-in-out infinite', armL: null, armR: null },
    { body: 'lk-sway   5.00s ease-in-out infinite', armL: null, armR: null },
    { body: 'lk-glide  4.50s ease-in-out infinite', armL: null, armR: null },
  ],
  victory: [
    { body: 'lk-bounce 0.60s ease-in-out infinite', armL: 'lk-aL-up 0.60s ease-in-out infinite',   armR: 'lk-aR-up 0.60s ease-in-out infinite'    },
    { body: 'lk-cheer  0.50s ease-in-out infinite', armL: 'lk-aL-up 0.50s ease-in-out infinite',   armR: 'lk-aR-thrust 0.50s ease-in-out infinite' },
    { body: 'lk-spin   2.00s linear infinite',      armL: 'lk-aL-up 2.00s ease-in-out infinite',   armR: 'lk-aR-up 2.00s ease-in-out infinite'    },
  ],
  ready: [
    { body: 'lk-tilt    4.00s ease-in-out infinite', armL: null,                                            armR: null                                       },
    { body: 'lk-march   2.00s ease-in-out infinite', armL: 'lk-aL-shield-high 2.00s ease-in-out infinite',  armR: null                                       },
    { body: 'lk-parade  0.96s ease-in-out infinite', armL: 'lk-aL-sword-guard 1.92s ease-in-out infinite',  armR: 'lk-aR-sword-arc 1.92s ease-in-out infinite'},
  ],
  marching: [
    // Parade march: weight-shifting body + elegant sword arc (sword period = 2× step period)
    { body: 'lk-parade  0.90s ease-in-out infinite', armL: 'lk-aL-sword-guard 1.80s ease-in-out infinite',  armR: 'lk-aR-sword-arc 1.80s ease-in-out infinite'},
    // Crisp march + high shield guard — ceremonial
    { body: 'lk-march   0.95s ease-in-out infinite', armL: 'lk-aL-shield-high 1.90s ease-in-out infinite',  armR: 'lk-aR-sword-arc 1.90s ease-in-out infinite'},
    // Faster parade with wave — relaxed march after victory
    { body: 'lk-parade  0.80s ease-in-out infinite', armL: 'lk-aL-wave       1.60s ease-in-out infinite',   armR: 'lk-aR-sword-arc 1.60s ease-in-out infinite'},
  ],
};

// ─── Šahovnica (Croatian checkerboard) ───────────────────────────────────────
// 5×5 grid, WHITE (argent) in top-left — the correct heraldic blazon:
// "checky of 25, argent and gules" (argent = white first)
function _Sahov({ x = 0, y = 0, sq = 6.8 }) {
  return (
    <>
      {Array.from({ length: 5 }).flatMap((_, r) =>
        Array.from({ length: 5 }).map((_, c) => (
          <rect
            key={`${r}-${c}`}
            x={x + c * sq} y={y + r * sq}
            width={sq} height={sq}
            fill={(r + c) % 2 === 0 ? C.wht : C.red}
          />
        ))
      )}
    </>
  );
}

// ─── SVG gradient / filter helpers ───────────────────────────────────────────
function Defs() {
  return (
    <defs>
      <style>{KF}</style>

      {/* Armor — LEGO plastic with sheen */}
      <linearGradient id="lk-ar" x1="15%" y1="0%" x2="85%" y2="100%">
        <stop offset="0%"   stopColor={C.arHi}/>
        <stop offset="35%"  stopColor={C.ar}/>
        <stop offset="100%" stopColor={C.arDk}/>
      </linearGradient>
      <linearGradient id="lk-arV" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%"   stopColor={C.arHi}/>
        <stop offset="45%"  stopColor={C.ar}/>
        <stop offset="100%" stopColor={C.arDk}/>
      </linearGradient>

      {/* Plastic sheen (overlay) */}
      <linearGradient id="lk-sh" x1="0%" y1="0%" x2="55%" y2="100%">
        <stop offset="0%"   stopColor="rgba(255,255,255,0.58)"/>
        <stop offset="28%"  stopColor="rgba(255,255,255,0.12)"/>
        <stop offset="100%" stopColor="rgba(0,0,0,0.20)"/>
      </linearGradient>

      {/* Red — Croatian red with depth */}
      <linearGradient id="lk-rd" x1="0%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%"   stopColor={C.redHi}/>
        <stop offset="55%"  stopColor={C.red}/>
        <stop offset="100%" stopColor="#860015"/>
      </linearGradient>

      {/* Gold */}
      <linearGradient id="lk-gd" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"   stopColor={C.gdHi}/>
        <stop offset="55%"  stopColor={C.gd}/>
        <stop offset="100%" stopColor="#7A5A00"/>
      </linearGradient>
      <linearGradient id="lk-gdV" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%"   stopColor={C.gdHi}/>
        <stop offset="100%" stopColor="#6A4C00"/>
      </linearGradient>

      {/* LEGO yellow skin */}
      <linearGradient id="lk-sk" x1="10%" y1="0%" x2="90%" y2="100%">
        <stop offset="0%"   stopColor={C.skHi}/>
        <stop offset="50%"  stopColor={C.sk}/>
        <stop offset="100%" stopColor="#A07020"/>
      </linearGradient>

      {/* Sword blade */}
      <linearGradient id="lk-bl" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%"   stopColor="#6A8898"/>
        <stop offset="38%"  stopColor="#E2EEF6"/>
        <stop offset="52%"  stopColor="#FFFFFF"/>
        <stop offset="100%" stopColor="#6A8898"/>
      </linearGradient>

      {/* Shield white */}
      <linearGradient id="lk-wh" x1="10%" y1="0%" x2="90%" y2="100%">
        <stop offset="0%"   stopColor="#FDFAF0"/>
        <stop offset="100%" stopColor="#C8C4B0"/>
      </linearGradient>

      {/* Drop shadow */}
      <filter id="lk-drop" x="-22%" y="-10%" width="155%" height="145%">
        <feDropShadow dx="2.5" dy="7" stdDeviation="5.5" floodColor="rgba(0,0,0,0.48)"/>
      </filter>

      {/* Subtle ambient shadow on side pieces */}
      <filter id="lk-soft" x="-10%" y="-10%" width="125%" height="125%">
        <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="rgba(0,0,0,0.3)"/>
      </filter>
    </defs>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
const CroatianKnight = React.memo(function CroatianKnight({ size = 80, mood = 'happy', variant, level = 1, className = '', style = {} }) {
  const variants = VARIANTS[mood] || VARIANTS.happy;
  // If a specific variant is provided, use it (purposeful); otherwise pick once on mount via time-of-day
  const [variantIdx] = useState(() =>
    (variant !== undefined && variant >= 0 && variant < variants.length)
      ? variant
      : new Date().getHours() % variants.length
  );
  // Idle rotation: cycle to a different animation variant every 8–10s
  const [activeVarIdx, setActiveVarIdx] = useState(variantIdx);
  const idleTimerRef = useRef(null);
  useEffect(() => {
    setActiveVarIdx(variantIdx);
    clearInterval(idleTimerRef.current);
    idleTimerRef.current = setInterval(
      () => setActiveVarIdx(v => (v + 1) % variants.length),
      8000 + Math.floor(Math.random() * 2000)
    );
    return () => clearInterval(idleTimerRef.current);
  }, [mood, variants.length, variantIdx]);
  const m = variants[Math.min(activeVarIdx, variants.length - 1)];
  const lvlCfg = getLevelConfig(level);
  const isCelebrating = mood === 'celebrating';

  // Confetti pieces for celebrating state
  const confetti = isCelebrating ? [
    { x: 4,   y: 26,  c: C.red,   r: 24  },
    { x: 110, y: 16,  c: C.gdHi,  r: -18 },
    { x: 2,   y: 72,  c: '#38bdf8', r: 40 },
    { x: 114, y: 66,  c: C.red,   r: -35 },
    { x: 6,   y: 118, c: C.gdHi,  r: 15  },
    { x: 113, y: 112, c: '#16a34a', r: -28 },
    { x: 1,   y: 94,  c: '#a78bfa', r: 52 },
    { x: 115, y: 88,  c: '#f59e0b', r: -44 },
    { x: 10,  y: 142, c: C.red,   r: 8   },
    { x: 108, y: 138, c: '#38bdf8', r: -22 },
  ] : [];

  // Entry spring: bigger pop for celebration, normal spring otherwise
  const entryTransition = isCelebrating
    ? { type: 'spring', stiffness: 520, damping: 16, mass: 0.7 }
    : { type: 'spring', stiffness: 380, damping: 22 };

  const rimFilter = MOOD_RIM[mood];
  return (
    <motion.div
      className={className}
      style={{ display: 'inline-block', lineHeight: 0, ...(rimFilter ? { filter: rimFilter } : {}), ...style }}
      initial={{ scale: 0.6, opacity: 0, y: 8 }}
      animate={isCelebrating
        ? { scale: [0.6, 1.22, 0.96, 1.06, 1], opacity: 1, y: 0 }
        : { scale: 1, opacity: 1, y: 0 }
      }
      transition={isCelebrating
        ? { duration: 0.55, ease: [0.22, 1.6, 0.36, 1], times: [0, 0.35, 0.55, 0.75, 1] }
        : entryTransition
      }
    >
    <svg
      width={size}
      height={Math.round(size * 1.56)}
      viewBox="0 0 120 188"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      overflow="visible"
      role="img"
      aria-label={`LEGO Croatian knight mascot, ${mood} expression`}
    >
      <Defs />

      {/* Confetti — drawn behind figure, staggered fly-out animation */}
      {confetti.map((p, i) => (
        <rect
          key={i}
          x={p.x} y={p.y} width="9" height="4.5" rx="1.5"
          fill={p.c} opacity="0.9"
          transform={`rotate(${p.r} ${p.x + 4.5} ${p.y + 2.25})`}
          style={{
            animation: `lk-confetti ${0.65 + (i % 3) * 0.12}s ease-out ${i * 0.07}s both`,
            transformOrigin: `${p.x + 4.5}px ${p.y + 2.25}px`,
          }}
        />
      ))}

      {/* Level 100+: Legendary aura rings (rendered behind figure) */}
      {lvlCfg.aura && (
        <>
          <ellipse cx="60" cy="95" rx="56" ry="72"
            fill="none" stroke="rgba(255,220,60,0.28)" strokeWidth="3"
            style={{ animation: 'lk-pulse 2.0s ease-in-out infinite' }}/>
          <ellipse cx="60" cy="95" rx="50" ry="65"
            fill="none" stroke="rgba(255,220,60,0.14)" strokeWidth="2"
            style={{ animation: 'lk-pulse 2.0s ease-in-out .5s infinite' }}/>
        </>
      )}

      {/* ══════════════════════════════════════════════════
          MAIN FIGURE — body bounce/float/droop animation
          transformOrigin at foot level keeps figure grounded
          ══════════════════════════════════════════════════ */}
      <g
        filter="url(#lk-drop)"
        style={{ animation: m.body, transformOrigin: '60px 186px' }}
      >

        {/* ───────────── GROUND SHADOW ───────────── */}
        <ellipse cx="60" cy="185" rx="28" ry="3.5"
          fill="rgba(0,0,0,0.28)" opacity="0.7"/>

        {/* ───────────── FEET ───────────── */}
        {/* Left foot */}
        <rect rx="7" x="18" y="164" width="38" height="20"
          fill="url(#lk-arV)" stroke={C.blk} strokeWidth="1.2"/>
        <rect rx="5" x="20" y="165" width="16" height="5"
          fill="url(#lk-sh)" opacity="0.55"/>
        {/* Right foot */}
        <rect rx="7" x="64" y="164" width="38" height="20"
          fill="url(#lk-arV)" stroke={C.blk} strokeWidth="1.2"/>
        <rect rx="5" x="66" y="165" width="16" height="5"
          fill="url(#lk-sh)" opacity="0.55"/>
        {/* Foot gold toe cap trim */}
        <rect rx="4" x="20" y="180" width="34" height="4" fill="url(#lk-gd)" opacity="0.6"/>
        <rect rx="4" x="66" y="180" width="34" height="4" fill="url(#lk-gd)" opacity="0.6"/>

        {/* ───────────── LEGS ───────────── */}
        {/* Left leg */}
        <rect rx="7" x="20" y="120" width="34" height="50"
          fill="url(#lk-arV)" stroke={C.blk} strokeWidth="1.2"/>
        <rect rx="4" x="22" y="122" width="14" height="22"
          fill="url(#lk-sh)" opacity="0.45"/>
        {/* Right leg */}
        <rect rx="7" x="66" y="120" width="34" height="50"
          fill="url(#lk-arV)" stroke={C.blk} strokeWidth="1.2"/>
        <rect rx="4" x="68" y="122" width="14" height="22"
          fill="url(#lk-sh)" opacity="0.45"/>
        {/* Knee plates (poleyne) — each leg */}
        <ellipse cx="37" cy="149" rx="10.5" ry="6.5"
          fill={C.arHi} stroke={C.blk} strokeWidth="1"/>
        <ellipse cx="83" cy="149" rx="10.5" ry="6.5"
          fill={C.arHi} stroke={C.blk} strokeWidth="1"/>
        {/* Knee boss (center rivet) */}
        <circle cx="37" cy="149" r="3.5" fill="url(#lk-gd)" stroke={C.blk} strokeWidth="0.8"/>
        <circle cx="83" cy="149" r="3.5" fill="url(#lk-gd)" stroke={C.blk} strokeWidth="0.8"/>
        {/* Leg gap groove */}
        <rect x="54" y="118" width="12" height="52" fill="rgba(0,0,0,0.3)"/>

        {/* ───────────── HIP / BELT PIECE ───────────── */}
        {/* LEGO H-piece hip connector */}
        <rect rx="5" x="20" y="114" width="80" height="12"
          fill="url(#lk-ar)" stroke={C.blk} strokeWidth="1.2"/>
        {/* Belt center buckle */}
        <rect rx="3" x="51" y="115" width="18" height="10"
          fill="url(#lk-gd)" stroke={C.blk} strokeWidth="0.9"/>
        <circle cx="60" cy="120" r="3" fill={C.gdHi} opacity="0.7"/>
        {/* Red surcoat hem at belt */}
        <rect rx="2" x="24" y="122" width="72" height="5"
          fill="url(#lk-rd)" opacity="0.75"/>

        {/* ───────────── TORSO ───────────── */}
        {/* Main torso block */}
        <rect rx="8" x="26" y="62" width="68" height="56"
          fill="url(#lk-ar)" stroke={C.blk} strokeWidth="1.3"/>

        {/* Breastplate center keel / ridge */}
        <rect rx="3" x="56" y="68" width="8" height="42"
          fill={C.arHi} stroke={C.arSh} strokeWidth="0.6" opacity="0.5"/>

        {/* ŠAHOVNICA on chest — 4×4 version (5×5 is too small at torso scale) */}
        {/* Croatian coat of arms: white (argent) first — row 0 starts W R W R */}
        {(() => {
          const sq = 7; const cols = 4; const rows = 4;
          const sx = 60 - (cols * sq) / 2;
          const sy = 72;
          return Array.from({ length: rows }).flatMap((_, r) =>
            Array.from({ length: cols }).map((_, c) => (
              <rect
                key={`chest-${r}-${c}`}
                x={sx + c * sq} y={sy + r * sq}
                width={sq} height={sq}
                fill={(r + c) % 2 === 0 ? C.wht : C.red}
                opacity="0.93"
              />
            ))
          );
        })()}

        {/* Torso gold trim — top pauldron line */}
        <rect rx="4" x="26" y="62" width="68" height="7"
          fill="url(#lk-gdV)" opacity="0.92"/>
        {/* Torso gold trim — bottom */}
        <rect rx="0" x="26" y="111" width="68" height="7"
          fill="url(#lk-gdV)" opacity="0.85"/>
        {/* Plastic sheen overlay on torso (left half highlight) */}
        <rect rx="8" x="26" y="62" width="34" height="56"
          fill="url(#lk-sh)" opacity="0.38"/>
        {/* Side seam lines (LEGO mold lines) */}
        <line x1="26" y1="68" x2="26" y2="116"
          stroke={C.arDk} strokeWidth="0.8" opacity="0.4"/>
        <line x1="94" y1="68" x2="94" y2="116"
          stroke={C.arDk} strokeWidth="0.8" opacity="0.4"/>

        {/* ───────────── LEFT ARM GROUP — shield arm ───────────── */}
        {/* Pivot point: (28, 75) — left shoulder joint */}
        <g style={{ animation: m.armL }}>
          {/* Shoulder disk joint (the visible circular pivot — very LEGO) */}
          <circle cx="28" cy="75" r="13"
            fill="url(#lk-ar)" stroke={C.blk} strokeWidth="1.2"/>
          <circle cx="28" cy="75" r="8"
            fill={C.arHi} stroke={C.arSh} strokeWidth="0.8"/>
          <circle cx="25" cy="72" r="2.5"
            fill="rgba(255,255,255,0.45)"/>

          {/* Upper arm */}
          <rect rx="7" x="5" y="65" width="23" height="38"
            fill="url(#lk-arV)" stroke={C.blk} strokeWidth="1.2"/>
          <rect rx="4" x="7" y="67" width="9" height="18"
            fill="url(#lk-sh)" opacity="0.48"/>

          {/* Elbow joint disk */}
          <circle cx="16.5" cy="105" r="9"
            fill="url(#lk-ar)" stroke={C.blk} strokeWidth="1"/>
          <circle cx="14" cy="103" r="3" fill="rgba(255,255,255,0.3)"/>

          {/* Forearm */}
          <rect rx="6" x="7" y="103" width="19" height="22"
            fill="url(#lk-arV)" stroke={C.blk} strokeWidth="1.1"/>

          {/* C-clamp hand — the most iconic LEGO element */}
          {/* Outer shell */}
          <rect rx="6" x="8" y="125" width="17" height="13"
            fill="url(#lk-sk)" stroke={C.blk} strokeWidth="1.1"/>
          {/* Grip hollow (shadow) */}
          <ellipse cx="16.5" cy="131.5" rx="4.5" ry="3.5"
            fill="rgba(0,0,0,0.18)"/>
          {/* Hand sheen */}
          <rect rx="3" x="10" y="126" width="7" height="4"
            fill="rgba(255,255,255,0.35)"/>

          {/* ══ SHIELD ══
              Heater-shape shield — pure 5×5 šahovnica, white (argent) first.
              This is the historic Croatian coat of arms: "checky of 25,
              argent and gules" — no added emblem, no boss.
              5 cols × 7.4px = 37px fills the shield width cleanly.
              7 rows shown; bottom point is red continuation of the pattern.
          */}
          <g transform="translate(-16, 76)">
            {/* Arm strap behind shield */}
            <rect rx="3" x="22" y="14" width="7" height="26"
              fill={C.brn} stroke={C.blk} strokeWidth="0.8" opacity="0.85"/>

            {/* Shield background — filled with šahovnica squares */}
            {/* 5 cols × 7.4px = 37px; 7 rows × 7.4px = 51.8px; sq=7.4 */}
            {Array.from({ length: 7 }).flatMap((_, r) =>
              Array.from({ length: 5 }).map((_, c) => (
                <rect
                  key={`sh-${r}-${c}`}
                  x={1 + c * 7.4} y={1 + r * 7.4}
                  width={7.4} height={7.4}
                  fill={(r + c) % 2 === 0 ? C.wht : C.red}
                />
              ))
            )}
            {/* Bottom point — red fill (continues the pattern) */}
            <path d="M 1,53 L 19,68 L 37,53 Z" fill={C.red}/>
            {/* White triangle for argent continuation in point */}
            <path d="M 8.4,53 L 19,64 L 29.6,53 Z" fill={C.wht}/>

            {/* Shield outline — drawn on top to frame the šahovnica cleanly */}
            <path d="M 19,0 Q 38,0 38,13 L 38,53 L 19,70 L 0,53 L 0,13 Q 0,0 19,0 Z"
              fill="none" stroke={C.blk} strokeWidth="2.0"/>
            {/* Gold trim border */}
            <path d="M 19,0 Q 38,0 38,13 L 38,53 L 19,70 L 0,53 L 0,13 Q 0,0 19,0 Z"
              fill="none" stroke="url(#lk-gd)" strokeWidth="1.4"/>

            {/* Surface highlight — top-left sheen (LEGO plastic quality) */}
            <path d="M 5,3 Q 9,3 9,7"
              stroke="rgba(255,255,255,0.6)" strokeWidth="2.2" strokeLinecap="round"/>
          </g>
        </g>

        {/* ───────────── RIGHT ARM GROUP — sword arm ───────────── */}
        {/* Pivot point: (92, 75) — right shoulder joint */}
        <g style={{ animation: m.armR }}>
          {/* Shoulder disk joint */}
          <circle cx="92" cy="75" r="13"
            fill="url(#lk-ar)" stroke={C.blk} strokeWidth="1.2"/>
          <circle cx="92" cy="75" r="8"
            fill={C.arHi} stroke={C.arSh} strokeWidth="0.8"/>
          <circle cx="89" cy="72" r="2.5"
            fill="rgba(255,255,255,0.45)"/>

          {/* Upper arm */}
          <rect rx="7" x="92" y="65" width="23" height="38"
            fill="url(#lk-arV)" stroke={C.blk} strokeWidth="1.2"/>
          <rect rx="4" x="94" y="67" width="9" height="18"
            fill="url(#lk-sh)" opacity="0.48"/>

          {/* Elbow joint disk */}
          <circle cx="103.5" cy="105" r="9"
            fill="url(#lk-ar)" stroke={C.blk} strokeWidth="1"/>
          <circle cx="101" cy="103" r="3" fill="rgba(255,255,255,0.3)"/>

          {/* Forearm */}
          <rect rx="6" x="94" y="103" width="19" height="22"
            fill="url(#lk-arV)" stroke={C.blk} strokeWidth="1.1"/>

          {/* C-clamp hand */}
          <rect rx="6" x="95" y="125" width="17" height="13"
            fill="url(#lk-sk)" stroke={C.blk} strokeWidth="1.1"/>
          <ellipse cx="103.5" cy="131.5" rx="4.5" ry="3.5"
            fill="rgba(0,0,0,0.18)"/>
          <rect rx="3" x="97" y="126" width="7" height="4"
            fill="rgba(255,255,255,0.35)"/>

          {/* ══ SWORD ══ */}
          {/* Pommel */}
          <circle cx="103.5" cy="138" r="7"
            fill="url(#lk-gd)" stroke={C.blk} strokeWidth="1.2"/>
          <circle cx="103.5" cy="138" r="4"
            fill={C.gdHi} opacity="0.55"/>
          <circle cx="101.5" cy="136" r="1.5"
            fill="rgba(255,255,255,0.7)"/>

          {/* Grip */}
          <rect rx="3" x="99.5" y="145" width="8" height="17"
            fill={C.brn} stroke={C.blk} strokeWidth="1"/>
          {/* Leather wrap */}
          <line x1="100" y1="149" x2="107" y2="149" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
          <line x1="100" y1="153" x2="107" y2="153" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
          <line x1="100" y1="157" x2="107" y2="157" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>

          {/* Crossguard */}
          <rect rx="3" x="91" y="162" width="25" height="7"
            fill="url(#lk-gd)" stroke={C.blk} strokeWidth="1.1"/>
          {/* Guard tips (knobs) */}
          <circle cx="91" cy="165.5" r="3.5"
            fill="url(#lk-gd)" stroke={C.blk} strokeWidth="0.9"/>
          <circle cx="116" cy="165.5" r="3.5"
            fill="url(#lk-gd)" stroke={C.blk} strokeWidth="0.9"/>

          {/* Blade */}
          <path
            d="M 100.5,169 L 100.5,179 L 103.5,188 L 106.5,179 L 106.5,169 Z"
            fill="url(#lk-bl)" stroke={C.stl} strokeWidth="0.9"/>
          <rect rx="0.5" x="101" y="169" width="5" height="19"
            fill="url(#lk-bl)" stroke={C.stl} strokeWidth="0.9"/>
          {/* Fuller (center mirror line on blade) */}
          <line x1="103.5" y1="171" x2="103.5" y2="184"
            stroke="rgba(255,255,255,0.72)" strokeWidth="1.4"/>
        </g>

        {/* ───────────── NECK CONNECTOR ───────────── */}
        <rect rx="5" x="50" y="54" width="20" height="10"
          fill={C.ar} stroke={C.blk} strokeWidth="1.2"/>
        {/* Neck seam line */}
        <line x1="52" y1="58" x2="68" y2="58"
          stroke={C.arDk} strokeWidth="0.7" opacity="0.4"/>

        {/* ───────────── HEAD + FACE + HELMET ───────────── */}

        {/* LEGO head (classic yellow cylinder) */}
        <rect rx="11" x="38" y="6" width="44" height="50"
          fill="url(#lk-sk)" stroke={C.blk} strokeWidth="1.3"/>

        {/* FACE (behind helmet — visible at chin gap) */}
        {/* Eyes */}
        <circle cx="52" cy="24" r="4.8" fill={C.blk}/>
        <circle cx="68" cy="24" r="4.8" fill={C.blk}/>
        {/* Eye highlights */}
        <circle cx="53.6" cy="22.5" r="1.6" fill="white" opacity="0.88"/>
        <circle cx="69.6" cy="22.5" r="1.6" fill="white" opacity="0.88"/>

        {/* Expressions */}
        {mood === 'celebrating' && (
          /* Big open LEGO smile */
          <path d="M 48,40 Q 60,54 72,40"
            stroke={C.blk} strokeWidth="2.8" fill="none" strokeLinecap="round"/>
        )}
        {(mood === 'happy' || mood === 'encouraged') && (
          <path d="M 49,39 Q 60,50 71,39"
            stroke={C.blk} strokeWidth="2.8" fill="none" strokeLinecap="round"/>
        )}
        {mood === 'thinking' && (
          <path d="M 50,41 Q 60,45 70,41"
            stroke={C.blk} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        )}
        {mood === 'confused' && (
          <path d="M 50,41 Q 55,37 60,41 Q 65,45 70,41"
            stroke={C.blk} strokeWidth="2.2" fill="none" strokeLinecap="round"/>
        )}
        {mood === 'sad' && (
          <path d="M 50,46 Q 60,37 70,46"
            stroke={C.blk} strokeWidth="2.8" fill="none" strokeLinecap="round"/>
        )}
        {mood === 'neutral' && (
          <line x1="51" y1="41" x2="69" y2="41"
            stroke={C.blk} strokeWidth="2.6" strokeLinecap="round"/>
        )}

        {/* ─────────────────────────────────────────────
            LEGO CASTLE BUCKET VISOR HELMET
            (classic part #2786 — the enclosed knight helmet)
            Covers head except chin gap where face shows
            ───────────────────────────────────────────── */}

        {/* Helmet body — covers top 60% of head */}
        <rect rx="11" x="38" y="6" width="44" height="36"
          fill="url(#lk-ar)" stroke={C.blk} strokeWidth="1.3"/>

        {/* Helmet crown bevel */}
        <rect rx="9" x="40" y="7" width="40" height="10"
          fill={C.arHi} opacity="0.5"/>

        {/* ── T-VISOR ── */}
        {/* Visor recess — dark rectangular inset */}
        <rect rx="4" x="40" y="22" width="40" height="22"
          fill={C.blk} stroke={C.arSh} strokeWidth="0.9"/>
        {/* Left eye slit */}
        <rect rx="2" x="42" y="27" width="15" height="7"
          fill="#0A1525" stroke="#283848" strokeWidth="0.5"/>
        {/* Right eye slit */}
        <rect rx="2" x="63" y="27" width="15" height="7"
          fill="#0A1525" stroke="#283848" strokeWidth="0.5"/>
        {/* Visor eye glow — appears at level 51+ */}
        {lvlCfg.eyeGlow && (
          <>
            <rect rx="2.5" x="43" y="28" width="13" height="5"
              fill={lvlCfg.eyeGlow}
              style={{ animation: lvlCfg.eyeGlowAnim }}
            />
            <rect rx="2.5" x="64" y="28" width="13" height="5"
              fill={lvlCfg.eyeGlow}
              style={{ animation: lvlCfg.eyeGlowAnim }}
            />
          </>
        )}
        {/* Nasal bar — vertical center piece of T */}
        <rect rx="2" x="57.5" y="22" width="5" height="22"
          fill="#141E30" opacity="0.92"/>
        {/* Visor surface highlights (plastic glint) */}
        <rect rx="2" x="42" y="23" width="11" height="3"
          fill="rgba(255,255,255,0.22)"/>
        <rect rx="2" x="63" y="23" width="11" height="3"
          fill="rgba(255,255,255,0.22)"/>

        {/* Cheek guards — side panels */}
        <rect rx="5" x="38" y="26" width="8" height="20"
          fill={C.arSh} stroke={C.blk} strokeWidth="1"/>
        <rect rx="5" x="74" y="26" width="8" height="20"
          fill={C.arSh} stroke={C.blk} strokeWidth="1"/>
        {/* Cheek guard highlights */}
        <rect rx="3" x="39" y="27" width="4" height="8"
          fill="rgba(255,255,255,0.2)"/>
        <rect rx="3" x="75" y="27" width="4" height="8"
          fill="rgba(255,255,255,0.2)"/>

        {/* Neck guard / aventail (covers lower face / neck) */}
        <rect rx="5" x="40" y="42" width="40" height="14"
          fill="url(#lk-ar)" stroke={C.blk} strokeWidth="1.1"/>
        <rect rx="3" x="42" y="43" width="17" height="5"
          fill="rgba(255,255,255,0.22)"/>

        {/* Gold trim lines on helmet */}
        <rect rx="2" x="38" y="20" width="44" height="4.5"
          fill="url(#lk-gdV)" opacity="0.88"/>
        <rect rx="2" x="38" y="40" width="44" height="4.5"
          fill="url(#lk-gdV)" opacity="0.82"/>

        {/* ── LEGO STUD ON HELMET TOP ── */}
        {/* Cylinder body */}
        <rect rx="6" x="54" y="-1" width="12" height="8"
          fill={C.ar} stroke={C.blk} strokeWidth="1"/>
        {/* Stud top cap (ellipse for 3D cylinder look) */}
        <ellipse cx="60" cy="-1" rx="6" ry="2.8"
          fill={C.arHi} stroke={C.blk} strokeWidth="0.9"/>
        {/* Stud highlight */}
        <ellipse cx="58" cy="-2" rx="2.5" ry="1"
          fill="rgba(255,255,255,0.5)"/>
        {/* Stud-to-head ring */}
        <ellipse cx="60" cy="7" rx="6" ry="2.5"
          fill={C.ar} stroke={C.blk} strokeWidth="0.8"/>

        {/* ── LEVEL VISUAL UPGRADES ── */}
        {/* Level 26+: Crown ring on helmet stud */}
        {lvlCfg.crownColor && (
          <ellipse cx="60" cy="-1" rx="7.2" ry="3.4"
            fill="none" stroke={lvlCfg.crownColor} strokeWidth={lvlCfg.crownWidth}
            opacity="0.88"
            style={lvlCfg.crownAnim ? { animation: lvlCfg.crownAnim } : undefined}
          />
        )}
        {/* Level 76+: Gold shoulder accent bands */}
        {lvlCfg.goldBands && (
          <>
            <rect rx="3" x="26" y="62" width="68" height="5" fill="url(#lk-gdV)" opacity="0.45"
              style={{ animation: 'lk-sheen 2.5s ease-in-out infinite' }}/>
            <rect rx="3" x="26" y="111" width="68" height="5" fill="url(#lk-gdV)" opacity="0.4"
              style={{ animation: 'lk-sheen 3.0s ease-in-out .8s infinite' }}/>
          </>
        )}
        {/* No plume — clean bucket helmet */}

      </g>
    </svg>
    </motion.div>
  );
});

export default CroatianKnight;
