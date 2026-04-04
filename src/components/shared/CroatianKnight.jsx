import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

/**
 * CroatianKnight — LEGO Movie–quality minifigure mascot (v3)
 *
 * LEGO Movie animation principles implemented:
 *  1. Stop-motion jitter — sub-pixel steps(1) displacement at 12fps
 *  2. Squash & stretch — scaleY/scaleX on bounce landing/peak
 *  3. Anticipation — slight dip before jumps
 *  4. Independent head group — nods, shakes, bobs separately from body
 *  5. Secondary plume motion — follow-through with phase delay
 *  6. Dynamic ground shadow — shrinks as figure rises
 *  7. Mood eye-slit glow — all moods (not level-gated)
 *  8. Blink — stepped, natural cadence
 *  9. Hold poses — stepped() timing on key frames for snap feel
 * 10. Arm secondary motion — shield/sword lag follow-through
 */

// ─── Palette ─────────────────────────────────────────────────────────────────
const C = {
  ar:    '#A4B4C8',
  arHi:  '#D2E2F4',
  arSh:  '#5A6A84',
  arDk:  '#343C50',
  red:   '#CC0022',
  redHi: '#EE3042',
  gd:    '#D4A400',
  gdHi:  '#FFDC3C',
  sk:    '#F0CC70',
  skHi:  '#FFE490',
  blk:   '#181828',
  wht:   '#F4F0E2',
  brn:   '#5E3010',
  stl:   '#8898B0',
  plumeR:'#C8001A',     // plume red
  plumeP:'#FF2040',     // plume highlight
};

// ─── Mood → rim glow ─────────────────────────────────────────────────────────
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

// ─── Mood → eye slit color + animation ───────────────────────────────────────
const MOOD_EYE = {
  celebrating: { fill: '#FFDC3C', anim: 'lk-eye-gold 0.35s ease-in-out infinite',    op: 0.90 },
  victory:     { fill: '#FF9800', anim: 'lk-eye-gold 0.28s ease-in-out infinite',    op: 0.92 },
  happy:       { fill: '#38BDF8', anim: 'lk-eye-soft 2.0s ease-in-out infinite',     op: 0.78 },
  encouraged:  { fill: '#4ADE80', anim: 'lk-eye-soft 2.2s ease-in-out infinite',     op: 0.72 },
  thinking:    { fill: '#A78BFA', anim: 'lk-eye-think 3.0s ease-in-out infinite',    op: 0.68 },
  ready:       { fill: '#93C5FD', anim: 'lk-eye-soft 2.5s ease-in-out infinite',     op: 0.70 },
  marching:    { fill: '#60A5FA', anim: 'lk-eye-march 0.92s ease-in-out infinite',   op: 0.72 },
  sad:         { fill: '#FCA5A5', anim: 'lk-eye-sad 3.8s ease-in-out infinite',      op: 0.52 },
  confused:    { fill: '#FDE68A', anim: 'lk-eye-confused 0.6s steps(1) infinite',    op: 0.60 },
  neutral:     { fill: '#CBD5E1', anim: 'lk-eye-idle 4.5s ease-in-out infinite',     op: 0.42 },
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
const KF = `

/* ═══════════════════════════════════════════════════
   LEGO MOVIE PRINCIPLE 1: STOP-MOTION JITTER
   steps(1) = frame-snapping, not smooth vibration
   12fps cadence (0.083s) — sub-pixel displacement
   Creates the "physically moved between frames" feel
═══════════════════════════════════════════════════ */
@keyframes lk-jitter {
  0%   { transform: translate( 0px,  0px)  }
  8%   { transform: translate( 0.4px,-0.3px) }
  17%  { transform: translate(-0.3px, 0.4px) }
  25%  { transform: translate( 0px,  0.3px) }
  33%  { transform: translate(-0.4px,-0.3px) }
  42%  { transform: translate( 0.3px, 0px) }
  50%  { transform: translate( 0px,  0px)  }
  58%  { transform: translate(-0.3px, 0.4px) }
  67%  { transform: translate( 0.4px,-0.4px) }
  75%  { transform: translate( 0px, -0.3px) }
  83%  { transform: translate(-0.4px, 0px) }
  92%  { transform: translate( 0.3px, 0.3px) }
  100% { transform: translate( 0px,  0px)  }
}

/* ═══════════════════════════════════════════════════
   LEGO MOVIE PRINCIPLE 2: SQUASH & STRETCH
   Body animations with proper weight physics
═══════════════════════════════════════════════════ */
@keyframes lk-bounce {
  /* Anticipation dip → stretch up → squash on land */
  0%   { transform: translateY(0px)   scaleY(1.00) scaleX(1.00) }
  8%   { transform: translateY(2px)   scaleY(0.96) scaleX(1.03) }
  22%  { transform: translateY(-12px) scaleY(1.09) scaleX(0.94) }
  38%  { transform: translateY(-8px)  scaleY(1.06) scaleX(0.96) }
  52%  { transform: translateY(-19px) scaleY(1.12) scaleX(0.91) }
  70%  { transform: translateY(-9px)  scaleY(1.07) scaleX(0.95) }
  84%  { transform: translateY(-1px)  scaleY(0.90) scaleX(1.08) }
  92%  { transform: translateY(0px)   scaleY(1.02) scaleX(0.99) }
  100% { transform: translateY(0px)   scaleY(1.00) scaleX(1.00) }
}
@keyframes lk-cheer {
  0%   { transform: translateY(0px)   scaleY(1.00) scaleX(1.00) }
  6%   { transform: translateY(3px)   scaleY(0.94) scaleX(1.05) }
  20%  { transform: translateY(-22px) scaleY(1.11) scaleX(0.92) }
  34%  { transform: translateY(-3px)  scaleY(0.91) scaleX(1.07) }
  40%  { transform: translateY(2px)   scaleY(0.94) scaleX(1.04) }
  52%  { transform: translateY(-26px) scaleY(1.13) scaleX(0.90) }
  68%  { transform: translateY(-4px)  scaleY(0.89) scaleX(1.09) }
  76%  { transform: translateY(1px)   scaleY(0.95) scaleX(1.03) }
  84%  { transform: translateY(-20px) scaleY(1.10) scaleX(0.93) }
  94%  { transform: translateY(-2px)  scaleY(0.92) scaleX(1.06) }
  100% { transform: translateY(0px)   scaleY(1.00) scaleX(1.00) }
}
@keyframes lk-stamp {
  0%,100% { transform: translateY(0px)   scaleY(1.00) scaleX(1.00) }
  14%     { transform: translateY(-14px) scaleY(1.07) scaleX(0.95) }
  26%     { transform: translateY(0px)   scaleY(0.91) scaleX(1.08) }
  34%     { transform: translateY(2px)   scaleY(0.94) scaleX(1.05) }
  60%     { transform: translateY(-12px) scaleY(1.06) scaleX(0.96) }
  74%     { transform: translateY(0px)   scaleY(0.92) scaleX(1.07) }
  82%     { transform: translateY(1px)   scaleY(0.95) scaleX(1.04) }
}
@keyframes lk-pulse {
  0%,100% { transform: scale(1)    translateY(0px) }
  30%     { transform: scale(1.10) translateY(-4px) }
  60%     { transform: scale(1.05) translateY(-2px) }
}
@keyframes lk-float {
  0%,100% { transform: translateY(0px) }
  50%     { transform: translateY(-7px) }
}
@keyframes lk-tilt {
  0%,100% { transform: rotate(0deg)  translateY(0px) }
  50%     { transform: rotate(-6deg) translateY(-2px) }
}
@keyframes lk-wobble {
  0%,100% { transform: rotate(0deg) }
  15%     { transform: rotate(-7deg) }
  45%     { transform: rotate(7deg) }
  75%     { transform: rotate(-5deg) }
  90%     { transform: rotate(3deg) }
}
@keyframes lk-droop {
  0%,100% { transform: translateY(0px) scaleY(1) }
  50%     { transform: translateY(5px) scaleY(0.965) }
}
@keyframes lk-idle {
  0%,100% { transform: translateY(0px) }
  50%     { transform: translateY(-3px) }
}
@keyframes lk-sheen {
  0%,100% { opacity: 0.18 }
  50%     { opacity: 0.42 }
}
@keyframes lk-strut {
  0%,100% { transform: translateX(0px) rotate(0deg) }
  25%     { transform: translateX(-6px) rotate(-3deg) }
  75%     { transform: translateX(6px)  rotate(3deg) }
}
@keyframes lk-spin {
  0%   { transform: rotate(0deg)   translateY(-4px) }
  100% { transform: rotate(360deg) translateY(-4px) }
}
@keyframes lk-march {
  0%,100% { transform: translateY(0px)   rotate(0deg) }
  25%     { transform: translateY(-10px) rotate(-2deg) }
  50%     { transform: translateY(0px)   rotate(0deg) }
  75%     { transform: translateY(-10px) rotate(2deg) }
}
@keyframes lk-nod {
  0%,100% { transform: translateY(0px)  rotate(0deg) }
  30%     { transform: translateY(-6px) rotate(-5deg) }
  65%     { transform: translateY(3px)  rotate(2deg) }
}
@keyframes lk-sway {
  0%,100% { transform: translateX(0px)  rotate(0deg) }
  50%     { transform: translateX(-9px) rotate(-5deg) }
}
@keyframes lk-rock {
  0%,100% { transform: rotate(0deg)  translateY(0px) }
  25%     { transform: rotate(-9deg) translateY(-2px) }
  75%     { transform: rotate(9deg)  translateY(-2px) }
}
@keyframes lk-glide {
  0%,100% { transform: translateY(0px)   rotate(0deg) }
  33%     { transform: translateY(-11px) rotate(-2deg) }
  66%     { transform: translateY(-5px)  rotate(2deg) }
}
@keyframes lk-parade {
  0%   { transform: translateY(0px)   translateX(0px)  rotate(0deg)    scaleX(1)    }
  12%  { transform: translateY(-7px)  translateX(-3px) rotate(-1.5deg) scaleX(1.01) }
  25%  { transform: translateY(-13px) translateX(-5px) rotate(-2.5deg) scaleX(1.02) }
  38%  { transform: translateY(-5px)  translateX(-2px) rotate(-0.8deg) scaleX(1)    }
  50%  { transform: translateY(0px)   translateX(0px)  rotate(0deg)    scaleX(1)    }
  62%  { transform: translateY(-7px)  translateX(3px)  rotate(1.5deg)  scaleX(1.01) }
  75%  { transform: translateY(-13px) translateX(5px)  rotate(2.5deg)  scaleX(1.02) }
  88%  { transform: translateY(-5px)  translateX(2px)  rotate(0.8deg)  scaleX(1)    }
  100% { transform: translateY(0px)   translateX(0px)  rotate(0deg)    scaleX(1)    }
}

/* ═══════════════════════════════════════════════════
   LEGO MOVIE PRINCIPLE 3: HEAD INDEPENDENT MOTION
   Head group pivots at neck (cx 60, cy 62)
═══════════════════════════════════════════════════ */
@keyframes lk-hd-bob {
  0%,100% { transform: translateY(0px)   rotate(0deg) }
  50%     { transform: translateY(-2.5px) rotate(0.5deg) }
}
@keyframes lk-hd-nod {
  /* Deliberate, encouraging nod */
  0%,100% { transform: translateY(0px)  rotate(0deg) }
  18%     { transform: translateY(-3px) rotate(-8deg) }
  36%     { transform: translateY(1px)  rotate(4deg) }
  54%     { transform: translateY(-2px) rotate(-5deg) }
  72%     { transform: translateY(1px)  rotate(2deg) }
}
@keyframes lk-hd-happy {
  /* Gentle happy tilt side to side */
  0%,100% { transform: rotate(0deg) }
  30%     { transform: rotate(-6deg) }
  65%     { transform: rotate(4deg) }
}
@keyframes lk-hd-think {
  /* Head tilts left — the classic thinker pose */
  0%,100% { transform: rotate(0deg) }
  50%     { transform: rotate(-10deg) translateX(-2px) }
}
@keyframes lk-hd-shake {
  /* Fast confused head shake */
  0%,100% { transform: rotate(0deg) }
  12%     { transform: rotate(-12deg) }
  24%     { transform: rotate(12deg) }
  36%     { transform: rotate(-10deg) }
  48%     { transform: rotate(10deg) }
  60%     { transform: rotate(-6deg) }
  72%     { transform: rotate(6deg) }
  86%     { transform: rotate(-2deg) }
}
@keyframes lk-hd-droop {
  /* Sad slow hang */
  0%,100% { transform: rotate(0deg)   translateY(0px) }
  50%     { transform: rotate(9deg)  translateY(2px) }
}
@keyframes lk-hd-victory {
  /* Head back + snap forward — triumphant */
  0%,100% { transform: rotate(0deg)   translateY(0px) }
  20%     { transform: rotate(-12deg) translateY(-4px) }
  40%     { transform: rotate(-8deg)  translateY(-3px) }
  60%     { transform: rotate(-14deg) translateY(-5px) }
  80%     { transform: rotate(-5deg)  translateY(-2px) }
}
@keyframes lk-hd-march {
  /* Rhythmic head bob in sync with march step */
  0%,50%,100% { transform: translateY(0px)  rotate(0deg) }
  25%         { transform: translateY(-4px) rotate(-2deg) }
  75%         { transform: translateY(-4px) rotate(2deg) }
}
@keyframes lk-hd-lookup {
  /* Ready/battle stance — scanning the horizon */
  0%,100% { transform: rotate(0deg) }
  50%     { transform: rotate(-5deg) }
}

/* ═══════════════════════════════════════════════════
   LEGO MOVIE PRINCIPLE 4: BLINK
   Stepped timing = instant close, not smooth
   Natural cadence: 1 blink every ~4 seconds
═══════════════════════════════════════════════════ */
@keyframes lk-blink {
  0%, 90%, 100%  { transform: scaleY(1) }
  92%            { transform: scaleY(0.08) }
  94%            { transform: scaleY(1) }
  96%            { transform: scaleY(0.15) }
  98%            { transform: scaleY(1) }
}

/* ═══════════════════════════════════════════════════
   LEGO MOVIE PRINCIPLE 5: SECONDARY PLUME MOTION
   Plume lags behind head with 0.15s phase delay
   Follow-through — keep moving after head stops
   IMPORTANT: transform-origin is NOT animatable —
   set it on the element style, not inside keyframes
═══════════════════════════════════════════════════ */
@keyframes lk-plume-idle {
  0%,100% { transform: rotate(0deg) }
  30%     { transform: rotate(-4deg) }
  70%     { transform: rotate(2deg) }
}
@keyframes lk-plume-bounce {
  0%,100% { transform: rotate(0deg)   scaleY(1) }
  22%     { transform: rotate(-8deg)  scaleY(1.06) }
  52%     { transform: rotate(-12deg) scaleY(1.10) }
  70%     { transform: rotate(5deg)   scaleY(0.94) }
  88%     { transform: rotate(-3deg)  scaleY(1.02) }
}
@keyframes lk-plume-shake {
  0%,100% { transform: rotate(0deg) }
  15%     { transform: rotate(14deg) }
  30%     { transform: rotate(-14deg) }
  45%     { transform: rotate(10deg) }
  60%     { transform: rotate(-8deg) }
  80%     { transform: rotate(4deg) }
}
@keyframes lk-plume-march {
  0%,50%,100% { transform: rotate(0deg) }
  25%         { transform: rotate(-9deg) }
  75%         { transform: rotate(9deg) }
}
@keyframes lk-plume-think {
  0%,100% { transform: rotate(0deg) }
  50%     { transform: rotate(14deg) }
}
@keyframes lk-plume-droop {
  0%,100% { transform: rotate(0deg) }
  50%     { transform: rotate(-14deg) translateX(-2px) }
}

/* ═══════════════════════════════════════════════════
   LEGO MOVIE PRINCIPLE 6: DYNAMIC GROUND SHADOW
   Shadow is INVERSE of body height (shrinks when up)
═══════════════════════════════════════════════════ */
@keyframes lk-shadow-bounce {
  0%   { transform: scaleX(1.00) scaleY(1.00); opacity: 0.60 }
  22%  { transform: scaleX(0.72) scaleY(0.68); opacity: 0.28 }
  52%  { transform: scaleX(0.60) scaleY(0.55); opacity: 0.22 }
  84%  { transform: scaleX(1.10) scaleY(1.15); opacity: 0.80 }
  100% { transform: scaleX(1.00) scaleY(1.00); opacity: 0.60 }
}
@keyframes lk-shadow-cheer {
  0%   { transform: scaleX(1.00) scaleY(1.00); opacity: 0.60 }
  20%  { transform: scaleX(0.62) scaleY(0.50); opacity: 0.20 }
  35%  { transform: scaleX(1.12) scaleY(1.18); opacity: 0.85 }
  52%  { transform: scaleX(0.55) scaleY(0.42); opacity: 0.18 }
  68%  { transform: scaleX(1.14) scaleY(1.20); opacity: 0.88 }
  84%  { transform: scaleX(0.60) scaleY(0.48); opacity: 0.22 }
  100% { transform: scaleX(1.00) scaleY(1.00); opacity: 0.60 }
}
@keyframes lk-shadow-idle {
  0%,100% { transform: scaleX(1.00) scaleY(1.00); opacity: 0.55 }
  50%     { transform: scaleX(0.88) scaleY(0.82); opacity: 0.38 }
}
@keyframes lk-shadow-march {
  0%,50%,100% { transform: scaleX(1.00); opacity: 0.55 }
  25%         { transform: scaleX(0.80); opacity: 0.38 }
  75%         { transform: scaleX(0.80); opacity: 0.38 }
}
@keyframes lk-shadow-stamp {
  0%,100%  { transform: scaleX(1.00) scaleY(1.00); opacity: 0.55 }
  26%      { transform: scaleX(1.18) scaleY(1.25); opacity: 0.88 }
  74%      { transform: scaleX(1.16) scaleY(1.22); opacity: 0.85 }
}

/* ═══════════════════════════════════════════════════
   ARM ANIMATIONS — translate-rotate-translate pivot
═══════════════════════════════════════════════════ */
@keyframes lk-aL-up {
  0%,100% { transform: translate(28px,75px) rotate(0deg)   translate(-28px,-75px) }
  50%     { transform: translate(28px,75px) rotate(-72deg) translate(-28px,-75px) }
}
@keyframes lk-aR-up {
  0%,100% { transform: translate(92px,75px) rotate(0deg)  translate(-92px,-75px) }
  50%     { transform: translate(92px,75px) rotate(72deg) translate(-92px,-75px) }
}
@keyframes lk-aL-think {
  0%,100% { transform: translate(28px,75px) rotate(0deg)   translate(-28px,-75px) }
  50%     { transform: translate(28px,75px) rotate(-44deg) translate(-28px,-75px) }
}
@keyframes lk-aL-encourage {
  0%,100% { transform: translate(28px,75px) rotate(0deg)   translate(-28px,-75px) }
  50%     { transform: translate(28px,75px) rotate(-55deg) translate(-28px,-75px) }
}
@keyframes lk-aL-droop {
  0%,100% { transform: translate(28px,75px) rotate(0deg)  translate(-28px,-75px) }
  50%     { transform: translate(28px,75px) rotate(16deg) translate(-28px,-75px) }
}
@keyframes lk-aR-droop {
  0%,100% { transform: translate(92px,75px) rotate(0deg)   translate(-92px,-75px) }
  50%     { transform: translate(92px,75px) rotate(-16deg) translate(-92px,-75px) }
}
@keyframes lk-aL-wave {
  0%,100% { transform: translate(28px,75px) rotate(0deg)   translate(-28px,-75px) }
  25%     { transform: translate(28px,75px) rotate(-65deg) translate(-28px,-75px) }
  75%     { transform: translate(28px,75px) rotate(-25deg) translate(-28px,-75px) }
}
@keyframes lk-aR-wave {
  0%,100% { transform: translate(92px,75px) rotate(0deg)  translate(-92px,-75px) }
  25%     { transform: translate(92px,75px) rotate(65deg) translate(-92px,-75px) }
  75%     { transform: translate(92px,75px) rotate(25deg) translate(-92px,-75px) }
}
@keyframes lk-aR-thrust {
  0%,100% { transform: translate(92px,75px) rotate(0deg)   translate(-92px,-75px) }
  35%     { transform: translate(92px,75px) rotate(-85deg) translate(-92px,-75px) }
  55%     { transform: translate(92px,75px) rotate(-75deg) translate(-92px,-75px) }
}
@keyframes lk-aL-shield-high {
  0%,100% { transform: translate(28px,75px) rotate(-28deg) translate(-28px,-75px) }
  50%     { transform: translate(28px,75px) rotate(-52deg) translate(-28px,-75px) }
}
@keyframes lk-aR-pump {
  0%,100% { transform: translate(92px,75px) rotate(0deg)  translate(-92px,-75px) }
  30%     { transform: translate(92px,75px) rotate(82deg) translate(-92px,-75px) }
  60%     { transform: translate(92px,75px) rotate(48deg) translate(-92px,-75px) }
}
@keyframes lk-aR-sword-arc {
  0%   { transform: translate(92px,75px) rotate(18deg)    translate(-92px,-75px) }
  18%  { transform: translate(92px,75px) rotate(5deg)     translate(-92px,-75px) }
  44%  { transform: translate(92px,75px) rotate(-102deg)  translate(-92px,-75px) }
  58%  { transform: translate(92px,75px) rotate(-115deg)  translate(-92px,-75px) }
  75%  { transform: translate(92px,75px) rotate(-68deg)   translate(-92px,-75px) }
  90%  { transform: translate(92px,75px) rotate(10deg)    translate(-92px,-75px) }
  100% { transform: translate(92px,75px) rotate(18deg)    translate(-92px,-75px) }
}
@keyframes lk-aL-sword-guard {
  0%,100% { transform: translate(28px,75px) rotate(-30deg) translate(-28px,-75px) }
  30%     { transform: translate(28px,75px) rotate(-22deg) translate(-28px,-75px) }
  55%     { transform: translate(28px,75px) rotate(-48deg) translate(-28px,-75px) }
  75%     { transform: translate(28px,75px) rotate(-40deg) translate(-28px,-75px) }
}

/* ═══════════════════════════════════════════════════
   MOOD EYE SLIT ANIMATIONS
═══════════════════════════════════════════════════ */
@keyframes lk-eye-gold    { 0%,100%{opacity:0.80} 40%{opacity:1.0} 80%{opacity:0.88} }
@keyframes lk-eye-soft    { 0%,100%{opacity:0.60} 50%{opacity:0.90} }
@keyframes lk-eye-think   { 0%,100%{opacity:0.50} 35%{opacity:0.85} 70%{opacity:0.55} }
@keyframes lk-eye-sad     { 0%,100%{opacity:0.45} 50%{opacity:0.20} }
@keyframes lk-eye-confused{ 0%,50%,100%{opacity:0.65} 25%,75%{opacity:0.20} }
@keyframes lk-eye-idle    { 0%,100%{opacity:0.35} 50%{opacity:0.55} }
@keyframes lk-eye-march   { 0%,50%,100%{opacity:0.55} 25%{opacity:0.82} 75%{opacity:0.82} }
@keyframes lk-confetti    {
  0%  { transform:translateY(0px)   translateX(0px)   rotate(0deg)   scale(1);    opacity:1 }
  30% { transform:translateY(-18px) translateX(6px)   rotate(120deg) scale(1.1);  opacity:1 }
  70% { transform:translateY(12px)  translateX(-4px)  rotate(280deg) scale(0.85); opacity:0.7 }
  100%{ transform:translateY(40px)  translateX(8px)   rotate(420deg) scale(0.6);  opacity:0 }
}

/* ─── Impact dust — puffs on landing squash (celebrating/victory) ── */
@keyframes lk-dust {
  0%   { transform: translate(0px,0px) scale(0);    opacity: 0 }
  18%  { transform: translate(-8px,-3px) scale(1);  opacity: 0.52 }
  100% { transform: translate(-18px,-5px) scale(0.4); opacity: 0 }
}
@keyframes lk-dust-r {
  0%   { transform: translate(0px,0px) scale(0);    opacity: 0 }
  18%  { transform: translate(8px,-3px) scale(1);   opacity: 0.52 }
  100% { transform: translate(18px,-5px) scale(0.4); opacity: 0 }
}

/* ─── Sword sparkle — gleam on blade tip for combat/active moods ── */
@keyframes lk-sparkle {
  0%,65%,100% { opacity: 0;    transform: scale(0)    rotate(0deg) }
  32%         { opacity: 0.95; transform: scale(1)    rotate(45deg) }
  48%         { opacity: 0.55; transform: scale(0.65) rotate(90deg) }
}

/* ─── Level-based eye glow ── */
@keyframes lk-eye-expert    { 0%,100%{opacity:0.45} 50%{opacity:0.95} }
@keyframes lk-eye-master    { 0%,100%{opacity:0.55} 35%{opacity:1} 65%{opacity:0.8} }
@keyframes lk-eye-legendary { 0%,100%{opacity:0.6; transform:scaleX(1)} 40%{opacity:1; transform:scaleX(1.03)} 80%{opacity:0.75} }
@keyframes lk-crown         { 0%,100%{opacity:0.6} 50%{opacity:1} }
@keyframes lk-aura          { 0%,100%{opacity:0.12} 50%{opacity:0.3} }
`;

// ─── Mood variants (body + armL + armR + head + plume + shadow) ───────────────
const VARIANTS = {
  celebrating: [
    { body: 'lk-bounce 0.80s ease-in-out infinite', armL: 'lk-aL-up 0.80s ease-in-out infinite',   armR: 'lk-aR-up 0.80s ease-in-out infinite',
      head: 'lk-hd-victory 0.80s ease-in-out infinite', plume: 'lk-plume-bounce 0.80s 0.12s ease-in-out infinite', shadow: 'lk-shadow-bounce 0.80s ease-in-out infinite' },
    { body: 'lk-cheer 0.58s ease-in-out infinite',  armL: 'lk-aL-up 0.58s ease-in-out infinite',   armR: 'lk-aR-pump 0.58s ease-in-out infinite',
      head: 'lk-hd-victory 0.58s ease-in-out infinite', plume: 'lk-plume-bounce 0.58s 0.10s ease-in-out infinite', shadow: 'lk-shadow-cheer 0.58s ease-in-out infinite' },
    { body: 'lk-pulse 1.20s ease-in-out infinite',  armL: 'lk-aL-up 1.20s ease-in-out infinite',   armR: 'lk-aR-wave 1.20s ease-in-out infinite',
      head: 'lk-hd-happy 1.20s ease-in-out infinite', plume: 'lk-plume-bounce 1.20s 0.18s ease-in-out infinite', shadow: 'lk-shadow-idle 1.20s ease-in-out infinite' },
  ],
  happy: [
    { body: 'lk-float 2.40s ease-in-out infinite',  armL: null, armR: null,
      head: 'lk-hd-happy 2.40s ease-in-out infinite', plume: 'lk-plume-idle 2.40s 0.30s ease-in-out infinite', shadow: 'lk-shadow-idle 2.40s ease-in-out infinite' },
    { body: 'lk-strut 1.80s ease-in-out infinite',  armL: 'lk-aL-wave 1.80s ease-in-out infinite', armR: null,
      head: 'lk-hd-happy 1.80s ease-in-out infinite', plume: 'lk-plume-idle 1.80s 0.25s ease-in-out infinite', shadow: 'lk-shadow-idle 1.80s ease-in-out infinite' },
    { body: 'lk-glide 2.20s ease-in-out infinite',  armL: null, armR: 'lk-aR-wave 2.20s ease-in-out infinite',
      head: 'lk-hd-bob 2.20s ease-in-out infinite',   plume: 'lk-plume-idle 2.20s 0.28s ease-in-out infinite', shadow: 'lk-shadow-idle 2.20s ease-in-out infinite' },
  ],
  encouraged: [
    { body: 'lk-float 2.00s ease-in-out infinite',  armL: 'lk-aL-encourage 2.00s ease-in-out infinite', armR: null,
      head: 'lk-hd-nod 2.00s ease-in-out infinite', plume: 'lk-plume-idle 2.00s 0.22s ease-in-out infinite', shadow: 'lk-shadow-idle 2.00s ease-in-out infinite' },
    { body: 'lk-nod 2.20s ease-in-out infinite',    armL: 'lk-aL-up 2.20s ease-in-out infinite', armR: null,
      head: 'lk-hd-nod 2.20s ease-in-out infinite', plume: 'lk-plume-idle 2.20s 0.28s ease-in-out infinite', shadow: 'lk-shadow-idle 2.20s ease-in-out infinite' },
    { body: 'lk-march 1.60s ease-in-out infinite',  armL: 'lk-aL-encourage 1.60s ease-in-out infinite', armR: null,
      head: 'lk-hd-nod 1.60s ease-in-out infinite', plume: 'lk-plume-march 1.60s 0.20s ease-in-out infinite', shadow: 'lk-shadow-march 1.60s ease-in-out infinite' },
  ],
  thinking: [
    { body: 'lk-tilt 3.00s ease-in-out infinite',   armL: 'lk-aL-think 3.00s ease-in-out infinite', armR: null,
      head: 'lk-hd-think 3.00s ease-in-out infinite', plume: 'lk-plume-think 3.00s 0.40s ease-in-out infinite', shadow: 'lk-shadow-idle 3.00s ease-in-out infinite' },
    { body: 'lk-sway 2.80s ease-in-out infinite',   armL: 'lk-aL-think 2.80s ease-in-out infinite', armR: null,
      head: 'lk-hd-think 2.80s ease-in-out infinite', plume: 'lk-plume-think 2.80s 0.38s ease-in-out infinite', shadow: 'lk-shadow-idle 2.80s ease-in-out infinite' },
    { body: 'lk-rock 3.50s ease-in-out infinite',   armL: 'lk-aL-think 3.50s ease-in-out infinite', armR: null,
      head: 'lk-hd-think 3.50s ease-in-out infinite', plume: 'lk-plume-think 3.50s 0.45s ease-in-out infinite', shadow: 'lk-shadow-idle 3.50s ease-in-out infinite' },
  ],
  confused: [
    { body: 'lk-wobble 0.70s ease-in-out 3', armL: null, armR: null,
      head: 'lk-hd-shake 0.70s ease-in-out 3', plume: 'lk-plume-shake 0.70s 0.08s ease-in-out 3', shadow: 'lk-shadow-idle 2.0s ease-in-out infinite' },
    { body: 'lk-rock 0.90s ease-in-out 3',   armL: null, armR: null,
      head: 'lk-hd-shake 0.90s ease-in-out 3', plume: 'lk-plume-shake 0.90s 0.10s ease-in-out 3', shadow: 'lk-shadow-idle 2.0s ease-in-out infinite' },
    { body: 'lk-wobble 1.00s ease-in-out infinite', armL: 'lk-aL-droop 1.00s ease-in-out infinite', armR: null,
      head: 'lk-hd-shake 0.90s ease-in-out infinite', plume: 'lk-plume-shake 0.90s 0.10s ease-in-out infinite', shadow: 'lk-shadow-idle 1.80s ease-in-out infinite' },
  ],
  sad: [
    { body: 'lk-droop 3.00s ease-in-out infinite', armL: 'lk-aL-droop 3.00s ease-in-out infinite', armR: 'lk-aR-droop 3.00s ease-in-out infinite',
      head: 'lk-hd-droop 3.00s ease-in-out infinite', plume: 'lk-plume-droop 3.00s 0.40s ease-in-out infinite', shadow: 'lk-shadow-idle 3.00s ease-in-out infinite' },
    { body: 'lk-sway 4.00s ease-in-out infinite',  armL: 'lk-aL-droop 4.00s ease-in-out infinite', armR: 'lk-aR-droop 4.00s ease-in-out infinite',
      head: 'lk-hd-droop 4.00s ease-in-out infinite', plume: 'lk-plume-droop 4.00s 0.50s ease-in-out infinite', shadow: 'lk-shadow-idle 4.00s ease-in-out infinite' },
    { body: 'lk-stamp 3.50s ease-in-out infinite', armL: 'lk-aL-droop 3.50s ease-in-out infinite', armR: null,
      head: 'lk-hd-droop 3.50s ease-in-out infinite', plume: 'lk-plume-droop 3.50s 0.45s ease-in-out infinite', shadow: 'lk-shadow-stamp 3.50s ease-in-out infinite' },
  ],
  neutral: [
    { body: 'lk-idle 4.00s ease-in-out infinite',  armL: null, armR: null,
      head: 'lk-hd-bob 4.00s ease-in-out infinite', plume: 'lk-plume-idle 4.00s 0.50s ease-in-out infinite', shadow: 'lk-shadow-idle 4.00s ease-in-out infinite' },
    { body: 'lk-sway 5.00s ease-in-out infinite',  armL: null, armR: null,
      head: 'lk-hd-bob 5.00s ease-in-out infinite', plume: 'lk-plume-idle 5.00s 0.65s ease-in-out infinite', shadow: 'lk-shadow-idle 5.00s ease-in-out infinite' },
    { body: 'lk-glide 4.50s ease-in-out infinite', armL: null, armR: null,
      head: 'lk-hd-bob 4.50s ease-in-out infinite', plume: 'lk-plume-idle 4.50s 0.58s ease-in-out infinite', shadow: 'lk-shadow-idle 4.50s ease-in-out infinite' },
  ],
  victory: [
    { body: 'lk-bounce 0.60s ease-in-out infinite', armL: 'lk-aL-up 0.60s ease-in-out infinite', armR: 'lk-aR-up 0.60s ease-in-out infinite',
      head: 'lk-hd-victory 0.60s ease-in-out infinite', plume: 'lk-plume-bounce 0.60s 0.10s ease-in-out infinite', shadow: 'lk-shadow-bounce 0.60s ease-in-out infinite' },
    { body: 'lk-cheer 0.50s ease-in-out infinite',  armL: 'lk-aL-up 0.50s ease-in-out infinite', armR: 'lk-aR-thrust 0.50s ease-in-out infinite',
      head: 'lk-hd-victory 0.50s ease-in-out infinite', plume: 'lk-plume-bounce 0.50s 0.08s ease-in-out infinite', shadow: 'lk-shadow-cheer 0.50s ease-in-out infinite' },
    { body: 'lk-spin 2.00s linear infinite',        armL: 'lk-aL-up 2.00s ease-in-out infinite', armR: 'lk-aR-up 2.00s ease-in-out infinite',
      head: 'lk-hd-bob 2.00s ease-in-out infinite',    plume: 'lk-plume-bounce 2.00s 0.25s ease-in-out infinite', shadow: 'lk-shadow-idle 2.00s ease-in-out infinite' },
  ],
  ready: [
    { body: 'lk-tilt 4.00s ease-in-out infinite',   armL: null, armR: null,
      head: 'lk-hd-lookup 4.00s ease-in-out infinite', plume: 'lk-plume-idle 4.00s 0.50s ease-in-out infinite', shadow: 'lk-shadow-idle 4.00s ease-in-out infinite' },
    { body: 'lk-march 2.00s ease-in-out infinite',  armL: 'lk-aL-shield-high 2.00s ease-in-out infinite', armR: null,
      head: 'lk-hd-march 2.00s ease-in-out infinite', plume: 'lk-plume-march 2.00s 0.24s ease-in-out infinite', shadow: 'lk-shadow-march 2.00s ease-in-out infinite' },
    { body: 'lk-parade 0.96s ease-in-out infinite', armL: 'lk-aL-sword-guard 1.92s ease-in-out infinite', armR: 'lk-aR-sword-arc 1.92s ease-in-out infinite',
      head: 'lk-hd-march 0.96s ease-in-out infinite', plume: 'lk-plume-march 0.96s 0.12s ease-in-out infinite', shadow: 'lk-shadow-march 0.96s ease-in-out infinite' },
  ],
  marching: [
    { body: 'lk-parade 0.90s ease-in-out infinite', armL: 'lk-aL-sword-guard 1.80s ease-in-out infinite', armR: 'lk-aR-sword-arc 1.80s ease-in-out infinite',
      head: 'lk-hd-march 0.90s ease-in-out infinite', plume: 'lk-plume-march 0.90s 0.11s ease-in-out infinite', shadow: 'lk-shadow-march 0.90s ease-in-out infinite' },
    { body: 'lk-march 0.95s ease-in-out infinite',  armL: 'lk-aL-shield-high 1.90s ease-in-out infinite', armR: 'lk-aR-sword-arc 1.90s ease-in-out infinite',
      head: 'lk-hd-march 0.95s ease-in-out infinite', plume: 'lk-plume-march 0.95s 0.12s ease-in-out infinite', shadow: 'lk-shadow-march 0.95s ease-in-out infinite' },
    { body: 'lk-parade 0.80s ease-in-out infinite', armL: 'lk-aL-wave 1.60s ease-in-out infinite',        armR: 'lk-aR-sword-arc 1.60s ease-in-out infinite',
      head: 'lk-hd-march 0.80s ease-in-out infinite', plume: 'lk-plume-march 0.80s 0.10s ease-in-out infinite', shadow: 'lk-shadow-march 0.80s ease-in-out infinite' },
  ],
};

// ─── SVG gradient + filter defs ──────────────────────────────────────────────
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

      {/* Plastic sheen overlay */}
      <linearGradient id="lk-sh" x1="0%" y1="0%" x2="55%" y2="100%">
        <stop offset="0%"   stopColor="rgba(255,255,255,0.60)"/>
        <stop offset="28%"  stopColor="rgba(255,255,255,0.13)"/>
        <stop offset="100%" stopColor="rgba(0,0,0,0.18)"/>
      </linearGradient>

      {/* Red — Croatian red with depth */}
      <linearGradient id="lk-rd" x1="0%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%"   stopColor={C.redHi}/>
        <stop offset="55%"  stopColor={C.red}/>
        <stop offset="100%" stopColor="#860015"/>
      </linearGradient>

      {/* Plume red gradient */}
      <linearGradient id="lk-plume" x1="50%" y1="100%" x2="50%" y2="0%">
        <stop offset="0%"   stopColor={C.plumeR}/>
        <stop offset="40%"  stopColor={C.plumeP}/>
        <stop offset="100%" stopColor="#FF6080"/>
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

      {/* Drop shadow filter */}
      <filter id="lk-drop" x="-22%" y="-10%" width="155%" height="145%">
        <feDropShadow dx="2.5" dy="7" stdDeviation="5.5" floodColor="rgba(0,0,0,0.48)"/>
      </filter>

      {/* Subtle side-piece ambient shadow */}
      <filter id="lk-soft" x="-10%" y="-10%" width="125%" height="125%">
        <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="rgba(0,0,0,0.3)"/>
      </filter>
    </defs>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
const CroatianKnight = React.memo(function CroatianKnight({ size = 80, mood = 'happy', variant, level = 1, className = '', style = {} }) {
  const variants = VARIANTS[mood] || VARIANTS.happy;

  // Variant is driven by the mood prop only — no auto-cycling.
  // When a caller passes an explicit variant index, use it.
  // Otherwise pick deterministically from the hour so the same user
  // sees consistent animation within a session but variety across days.
  const activeVarIdx = useMemo(() => {
    if (variant !== undefined && variant >= 0 && variant < variants.length) return variant;
    return new Date().getHours() % variants.length;
  }, [mood, variant, variants.length]);

  const m = variants[Math.min(activeVarIdx, variants.length - 1)];
  const lvlCfg = getLevelConfig(level);
  const isCelebrating = mood === 'celebrating';
  const eyeSlit = MOOD_EYE[mood] || MOOD_EYE.neutral;

  // Is this an active (not calm idle) mood?
  const isActive = !['neutral', 'sad', 'thinking'].includes(mood);

  // Confetti for celebrating
  const confetti = isCelebrating ? [
    { x:4,   y:26,  c:C.red,     r:24  },
    { x:110, y:16,  c:C.gdHi,    r:-18 },
    { x:2,   y:72,  c:'#38bdf8', r:40  },
    { x:114, y:66,  c:C.red,     r:-35 },
    { x:6,   y:118, c:C.gdHi,    r:15  },
    { x:113, y:112, c:'#16a34a', r:-28 },
    { x:1,   y:94,  c:'#a78bfa', r:52  },
    { x:115, y:88,  c:'#f59e0b', r:-44 },
    { x:10,  y:142, c:C.red,     r:8   },
    { x:108, y:138, c:'#38bdf8', r:-22 },
  ] : [];

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
    {/* ── LEGO MOVIE PRINCIPLE 1: Stop-motion jitter wrapper ── */}
    {/* steps(1) snaps between positions — no smooth interpolation */}
    {/* NOTE: must be a <div>, not <g> — <g> is SVG-only and invalid as HTML */}
    <div style={{ display: 'inline-block', lineHeight: 0, ...(isActive ? { animation: 'lk-jitter 0.083s steps(1) infinite' } : {}) }}>
    <svg
      width={size}
      height={Math.round(size * 1.56)}
      viewBox="0 0 120 192"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      overflow="visible"
      role="img"
      aria-label={`LEGO Croatian knight mascot, ${mood} expression`}
    >
      <Defs />

      {/* Confetti — drawn behind figure */}
      {confetti.map((p, i) => (
        <rect
          key={i} x={p.x} y={p.y} width="9" height="4.5" rx="1.5"
          fill={p.c} opacity="0.9"
          transform={`rotate(${p.r} ${p.x + 4.5} ${p.y + 2.25})`}
          style={{
            animation: `lk-confetti ${0.65 + (i % 3) * 0.12}s ease-out ${i * 0.07}s both`,
            transformOrigin: `${p.x + 4.5}px ${p.y + 2.25}px`,
          }}
        />
      ))}

      {/* Level 100+: Legendary aura rings */}
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

      {/* ═══════════════════════════════════════════════════
          MAIN FIGURE — body squash+stretch animation
          transformOrigin at foot level keeps figure grounded
          ═══════════════════════════════════════════════════ */}
      <g
        filter="url(#lk-drop)"
        style={{ animation: m.body, transformOrigin: '60px 188px' }}
      >

        {/* ── LEGO MOVIE PRINCIPLE 6: Dynamic ground shadow ── */}
        {/* Shadow is its own animation — inversely scaled to body height */}
        <ellipse cx="60" cy="188" rx="28" ry="3.5"
          fill="rgba(0,0,0,0.30)"
          style={{
            animation: m.shadow || 'lk-shadow-idle 3s ease-in-out infinite',
            transformOrigin: '60px 188px',
          }}
        />

        {/* Impact dust puffs — sync'd to landing squash on celebrating/victory */}
        {(mood === 'celebrating' || mood === 'victory') && (
          <>
            <ellipse cx="30" cy="186" rx="7" ry="3.5" fill="rgba(180,200,220,0.50)"
              style={{ animation: 'lk-dust 0.82s ease-out 0.68s infinite', transformOrigin: '30px 186px' }}/>
            <ellipse cx="90" cy="186" rx="7" ry="3.5" fill="rgba(180,200,220,0.50)"
              style={{ animation: 'lk-dust-r 0.82s ease-out 0.68s infinite', transformOrigin: '90px 186px' }}/>
          </>
        )}

        {/* ───────────── FEET ───────────── */}
        <rect rx="7" x="18" y="166" width="38" height="20"
          fill="url(#lk-arV)" stroke={C.blk} strokeWidth="1.2"/>
        <rect rx="5" x="20" y="167" width="16" height="5"
          fill="url(#lk-sh)" opacity="0.55"/>
        <rect rx="7" x="64" y="166" width="38" height="20"
          fill="url(#lk-arV)" stroke={C.blk} strokeWidth="1.2"/>
        <rect rx="5" x="66" y="167" width="16" height="5"
          fill="url(#lk-sh)" opacity="0.55"/>
        {/* Foot gold toe cap */}
        <rect rx="4" x="20" y="182" width="34" height="4" fill="url(#lk-gd)" opacity="0.6"/>
        <rect rx="4" x="66" y="182" width="34" height="4" fill="url(#lk-gd)" opacity="0.6"/>

        {/* ───────────── LEGS ───────────── */}
        <rect rx="7" x="20" y="122" width="34" height="50"
          fill="url(#lk-arV)" stroke={C.blk} strokeWidth="1.2"/>
        <rect rx="4" x="22" y="124" width="14" height="22"
          fill="url(#lk-sh)" opacity="0.45"/>
        <rect rx="7" x="66" y="122" width="34" height="50"
          fill="url(#lk-arV)" stroke={C.blk} strokeWidth="1.2"/>
        <rect rx="4" x="68" y="124" width="14" height="22"
          fill="url(#lk-sh)" opacity="0.45"/>
        {/* Knee plates */}
        <ellipse cx="37" cy="151" rx="10.5" ry="6.5"
          fill={C.arHi} stroke={C.blk} strokeWidth="1"/>
        <ellipse cx="83" cy="151" rx="10.5" ry="6.5"
          fill={C.arHi} stroke={C.blk} strokeWidth="1"/>
        <circle cx="37" cy="151" r="3.5" fill="url(#lk-gd)" stroke={C.blk} strokeWidth="0.8"/>
        <circle cx="83" cy="151" r="3.5" fill="url(#lk-gd)" stroke={C.blk} strokeWidth="0.8"/>
        <rect x="54" y="120" width="12" height="52" fill="rgba(0,0,0,0.3)"/>

        {/* ───────────── HIP / BELT ───────────── */}
        <rect rx="5" x="20" y="116" width="80" height="12"
          fill="url(#lk-ar)" stroke={C.blk} strokeWidth="1.2"/>
        <rect rx="3" x="51" y="117" width="18" height="10"
          fill="url(#lk-gd)" stroke={C.blk} strokeWidth="0.9"/>
        <circle cx="60" cy="122" r="3" fill={C.gdHi} opacity="0.7"/>
        <rect rx="2" x="24" y="124" width="72" height="5"
          fill="url(#lk-rd)" opacity="0.75"/>

        {/* ───────────── TORSO ───────────── */}
        <rect rx="8" x="26" y="64" width="68" height="56"
          fill="url(#lk-ar)" stroke={C.blk} strokeWidth="1.3"/>
        <rect rx="3" x="56" y="70" width="8" height="42"
          fill={C.arHi} stroke={C.arSh} strokeWidth="0.6" opacity="0.5"/>

        {/* ŠAHOVNICA on chest */}
        {(() => {
          const sq = 7; const cols = 4; const rows = 4;
          const sx = 60 - (cols * sq) / 2;
          const sy = 74;
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

        {/* Torso gold trim */}
        <rect rx="4" x="26" y="64" width="68" height="7"
          fill="url(#lk-gdV)" opacity="0.92"/>
        <rect rx="0" x="26" y="113" width="68" height="7"
          fill="url(#lk-gdV)" opacity="0.85"/>
        {/* Plastic sheen overlay */}
        <rect rx="8" x="26" y="64" width="34" height="56"
          fill="url(#lk-sh)" opacity="0.38"/>
        {/* LEGO mold seam lines */}
        <line x1="26" y1="70" x2="26" y2="118"
          stroke={C.arDk} strokeWidth="0.8" opacity="0.4"/>
        <line x1="94" y1="70" x2="94" y2="118"
          stroke={C.arDk} strokeWidth="0.8" opacity="0.4"/>

        {/* ───────────── LEFT ARM — shield arm ───────────── */}
        <g style={{ animation: m.armL }}>
          <circle cx="28" cy="77" r="13"
            fill="url(#lk-ar)" stroke={C.blk} strokeWidth="1.2"/>
          <circle cx="28" cy="77" r="8"
            fill={C.arHi} stroke={C.arSh} strokeWidth="0.8"/>
          <circle cx="25" cy="74" r="2.5"
            fill="rgba(255,255,255,0.45)"/>
          <rect rx="7" x="5" y="67" width="23" height="38"
            fill="url(#lk-arV)" stroke={C.blk} strokeWidth="1.2"/>
          <rect rx="4" x="7" y="69" width="9" height="18"
            fill="url(#lk-sh)" opacity="0.48"/>
          <circle cx="16.5" cy="107" r="9"
            fill="url(#lk-ar)" stroke={C.blk} strokeWidth="1"/>
          <circle cx="14" cy="105" r="3" fill="rgba(255,255,255,0.3)"/>
          <rect rx="6" x="7" y="105" width="19" height="22"
            fill="url(#lk-arV)" stroke={C.blk} strokeWidth="1.1"/>
          {/* C-clamp hand */}
          <rect rx="6" x="8" y="127" width="17" height="13"
            fill="url(#lk-sk)" stroke={C.blk} strokeWidth="1.1"/>
          <ellipse cx="16.5" cy="133.5" rx="4.5" ry="3.5"
            fill="rgba(0,0,0,0.18)"/>
          <rect rx="3" x="10" y="128" width="7" height="4"
            fill="rgba(255,255,255,0.35)"/>

          {/* ══ SHIELD ══ */}
          <g transform="translate(-16, 78)">
            <rect rx="3" x="22" y="14" width="7" height="26"
              fill={C.brn} stroke={C.blk} strokeWidth="0.8" opacity="0.85"/>
            {Array.from({ length: 7 }).flatMap((_, r) =>
              Array.from({ length: 5 }).map((_, c) => (
                <rect key={`sh-${r}-${c}`}
                  x={1 + c * 7.4} y={1 + r * 7.4}
                  width={7.4} height={7.4}
                  fill={(r + c) % 2 === 0 ? C.wht : C.red}
                />
              ))
            )}
            <path d="M 1,53 L 19,68 L 37,53 Z" fill={C.red}/>
            <path d="M 8.4,53 L 19,64 L 29.6,53 Z" fill={C.wht}/>
            <path d="M 19,0 Q 38,0 38,13 L 38,53 L 19,70 L 0,53 L 0,13 Q 0,0 19,0 Z"
              fill="none" stroke={C.blk} strokeWidth="2.0"/>
            <path d="M 19,0 Q 38,0 38,13 L 38,53 L 19,70 L 0,53 L 0,13 Q 0,0 19,0 Z"
              fill="none" stroke="url(#lk-gd)" strokeWidth="1.4"/>
            <path d="M 5,3 Q 9,3 9,7"
              stroke="rgba(255,255,255,0.6)" strokeWidth="2.2" strokeLinecap="round"/>
          </g>
        </g>

        {/* ───────────── RIGHT ARM — sword arm ───────────── */}
        <g style={{ animation: m.armR }}>
          <circle cx="92" cy="77" r="13"
            fill="url(#lk-ar)" stroke={C.blk} strokeWidth="1.2"/>
          <circle cx="92" cy="77" r="8"
            fill={C.arHi} stroke={C.arSh} strokeWidth="0.8"/>
          <circle cx="89" cy="74" r="2.5"
            fill="rgba(255,255,255,0.45)"/>
          <rect rx="7" x="92" y="67" width="23" height="38"
            fill="url(#lk-arV)" stroke={C.blk} strokeWidth="1.2"/>
          <rect rx="4" x="94" y="69" width="9" height="18"
            fill="url(#lk-sh)" opacity="0.48"/>
          <circle cx="103.5" cy="107" r="9"
            fill="url(#lk-ar)" stroke={C.blk} strokeWidth="1"/>
          <circle cx="101" cy="105" r="3" fill="rgba(255,255,255,0.3)"/>
          <rect rx="6" x="94" y="105" width="19" height="22"
            fill="url(#lk-arV)" stroke={C.blk} strokeWidth="1.1"/>
          {/* C-clamp hand */}
          <rect rx="6" x="95" y="127" width="17" height="13"
            fill="url(#lk-sk)" stroke={C.blk} strokeWidth="1.1"/>
          <ellipse cx="103.5" cy="133.5" rx="4.5" ry="3.5"
            fill="rgba(0,0,0,0.18)"/>
          <rect rx="3" x="97" y="128" width="7" height="4"
            fill="rgba(255,255,255,0.35)"/>

          {/* ══ SWORD ══ */}
          <circle cx="103.5" cy="140" r="7"
            fill="url(#lk-gd)" stroke={C.blk} strokeWidth="1.2"/>
          <circle cx="103.5" cy="140" r="4"
            fill={C.gdHi} opacity="0.55"/>
          <circle cx="101.5" cy="138" r="1.5"
            fill="rgba(255,255,255,0.7)"/>
          <rect rx="3" x="99.5" y="147" width="8" height="17"
            fill={C.brn} stroke={C.blk} strokeWidth="1"/>
          <line x1="100" y1="151" x2="107" y2="151" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
          <line x1="100" y1="155" x2="107" y2="155" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
          <line x1="100" y1="159" x2="107" y2="159" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
          <rect rx="3" x="91" y="164" width="25" height="7"
            fill="url(#lk-gd)" stroke={C.blk} strokeWidth="1.1"/>
          <circle cx="91"  cy="167.5" r="3.5"
            fill="url(#lk-gd)" stroke={C.blk} strokeWidth="0.9"/>
          <circle cx="116" cy="167.5" r="3.5"
            fill="url(#lk-gd)" stroke={C.blk} strokeWidth="0.9"/>
          <path d="M 100.5,171 L 100.5,181 L 103.5,190 L 106.5,181 L 106.5,171 Z"
            fill="url(#lk-bl)" stroke={C.stl} strokeWidth="0.9"/>
          <rect rx="0.5" x="101" y="171" width="5" height="19"
            fill="url(#lk-bl)" stroke={C.stl} strokeWidth="0.9"/>
          <line x1="103.5" y1="173" x2="103.5" y2="186"
            stroke="rgba(255,255,255,0.72)" strokeWidth="1.4"/>

          {/* Sword blade gleam — star sparkle on tip for active/combat moods */}
          {(mood === 'ready' || mood === 'marching' || mood === 'victory' || mood === 'celebrating') && (
            <>
              <path
                d="M 103.5,178 L 104.4,182 L 108,182.8 L 104.4,183.6 L 103.5,187 L 102.6,183.6 L 99,182.8 L 102.6,182 Z"
                fill="rgba(255,255,255,0.92)"
                style={{ animation: 'lk-sparkle 2.2s ease-in-out 0.5s infinite', transformOrigin: '103.5px 182.8px' }}
              />
              <circle cx="103.5" cy="182.8" r="1.5"
                fill="rgba(200,235,255,0.88)"
                style={{ animation: 'lk-sparkle 2.2s ease-in-out 0.9s infinite', transformOrigin: '103.5px 182.8px' }}
              />
            </>
          )}
        </g>

        {/* ───────────── NECK CONNECTOR ───────────── */}
        <rect rx="5" x="50" y="56" width="20" height="10"
          fill={C.ar} stroke={C.blk} strokeWidth="1.2"/>
        <line x1="52" y1="60" x2="68" y2="60"
          stroke={C.arDk} strokeWidth="0.7" opacity="0.4"/>

        {/* ═══════════════════════════════════════════════════
            LEGO MOVIE PRINCIPLE 3: HEAD GROUP
            Animates independently from body.
            transformOrigin at neck connection point (60, 62).
            ═══════════════════════════════════════════════════ */}
        <g
          style={{
            animation: m.head,
            transformOrigin: '60px 62px',
          }}
        >
          {/* ═══════════════════════════════════════════════════
              LEGO MOVIE PRINCIPLE 5: PLUME — drawn behind helmet
              Secondary animation pivots at the helmet stud (60,2).
              transformOrigin on element — NOT inside @keyframes
              (transform-origin is not a CSS-animatable property)
              ═══════════════════════════════════════════════════ */}
          <g style={{ animation: m.plume, transformOrigin: '60px 2px' }}>
            {/* Plume body — back-swept feathered crest */}
            <path
              d="M 55,3 Q 44,-8 42,-28 Q 40,-50 54,-60 Q 64,-68 76,-54 Q 84,-40 78,-22 Q 74,-8 68,3 Z"
              fill="url(#lk-plume)" stroke={C.plumeR} strokeWidth="1.4" opacity="0.94"
            />
            {/* Central spine / quill */}
            <path d="M 60,3 Q 58,-18 60,-42 Q 62,-56 66,-58"
              stroke={C.plumeP} strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.68"/>
            {/* Left feather ribs */}
            <path d="M 56,2 Q 48,-12 50,-32"
              stroke="rgba(255,96,128,0.45)" strokeWidth="1.1" fill="none" strokeLinecap="round"/>
            {/* Right feather ribs */}
            <path d="M 64,2 Q 72,-12 70,-32"
              stroke="rgba(255,96,128,0.45)" strokeWidth="1.1" fill="none" strokeLinecap="round"/>
            {/* Plastic sheen highlight */}
            <path d="M 54,3 Q 48,-10 50,-32 Q 52,-50 56,-58"
              stroke="rgba(255,255,255,0.38)" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
          </g>

          {/* LEGO head (classic yellow cylinder) */}
          <rect rx="11" x="38" y="6" width="44" height="50"
            fill="url(#lk-sk)" stroke={C.blk} strokeWidth="1.3"/>

          {/* Face — visible in chin gap */}
          <circle cx="52" cy="24" r="4.8" fill={C.blk}/>
          <circle cx="68" cy="24" r="4.8" fill={C.blk}/>
          <circle cx="53.6" cy="22.5" r="1.6" fill="white" opacity="0.88"/>
          <circle cx="69.6" cy="22.5" r="1.6" fill="white" opacity="0.88"/>

          {/* Mouth expressions */}
          {mood === 'celebrating' && (
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
          {mood === 'victory' && (
            <path d="M 47,40 Q 60,56 73,40"
              stroke={C.blk} strokeWidth="3.0" fill="none" strokeLinecap="round"/>
          )}
          {mood === 'neutral' && (
            <line x1="51" y1="41" x2="69" y2="41"
              stroke={C.blk} strokeWidth="2.6" strokeLinecap="round"/>
          )}
          {(mood === 'ready' || mood === 'marching') && (
            /* Determined smirk — slightly upturned corners for battle-ready look */
            <path d="M 51,42 Q 60,46 69,42"
              stroke={C.blk} strokeWidth="2.6" fill="none" strokeLinecap="round"/>
          )}

          {/* ─── LEGO CASTLE BUCKET VISOR HELMET ─── */}
          <rect rx="11" x="38" y="6" width="44" height="36"
            fill="url(#lk-ar)" stroke={C.blk} strokeWidth="1.3"/>
          <rect rx="9" x="40" y="7" width="40" height="10"
            fill={C.arHi} opacity="0.5"/>

          {/* T-VISOR */}
          <rect rx="4" x="40" y="22" width="40" height="22"
            fill={C.blk} stroke={C.arSh} strokeWidth="0.9"/>

          {/* Eye slits */}
          <rect rx="2" x="42" y="27" width="15" height="7"
            fill="#0A1525" stroke="#283848" strokeWidth="0.5"/>
          <rect rx="2" x="63" y="27" width="15" height="7"
            fill="#0A1525" stroke="#283848" strokeWidth="0.5"/>

          {/* ══ LEGO MOVIE PRINCIPLE 7: MOOD EYE SLIT GLOW ══ */}
          {/* All moods get colored visor glow — expressiveness without face change */}
          <rect rx="2.5" x="43" y="28" width="13" height="5"
            fill={eyeSlit.fill}
            opacity={eyeSlit.op}
            style={{ animation: eyeSlit.anim }}
          />
          <rect rx="2.5" x="64" y="28" width="13" height="5"
            fill={eyeSlit.fill}
            opacity={eyeSlit.op}
            style={{ animation: eyeSlit.anim }}
          />

          {/* ══ LEGO MOVIE PRINCIPLE 8: BLINK ══ */}
          {/* Stepped timing — snaps closed, doesn't ease */}
          <rect rx="2" x="42" y="27" width="15" height="7"
            fill="#0A1525"
            style={{
              animation: 'lk-blink 3.8s steps(1) infinite',
              transformOrigin: '49.5px 30.5px',
            }}
          />
          <rect rx="2" x="63" y="27" width="15" height="7"
            fill="#0A1525"
            style={{
              animation: 'lk-blink 3.8s steps(1) 0.04s infinite',
              transformOrigin: '70.5px 30.5px',
            }}
          />

          {/* Level-gated enhanced eye glow (on top of mood glow) */}
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

          {/* Nasal bar */}
          <rect rx="2" x="57.5" y="22" width="5" height="22"
            fill="#141E30" opacity="0.92"/>

          {/* Visor glint highlights */}
          <rect rx="2" x="42" y="23" width="11" height="3"
            fill="rgba(255,255,255,0.22)"/>
          <rect rx="2" x="63" y="23" width="11" height="3"
            fill="rgba(255,255,255,0.22)"/>

          {/* Cheek guards */}
          <rect rx="5" x="38" y="26" width="8" height="20"
            fill={C.arSh} stroke={C.blk} strokeWidth="1"/>
          <rect rx="5" x="74" y="26" width="8" height="20"
            fill={C.arSh} stroke={C.blk} strokeWidth="1"/>
          <rect rx="3" x="39" y="27" width="4" height="8"
            fill="rgba(255,255,255,0.2)"/>
          <rect rx="3" x="75" y="27" width="4" height="8"
            fill="rgba(255,255,255,0.2)"/>

          {/* Aventail (neck guard) */}
          <rect rx="5" x="40" y="42" width="40" height="14"
            fill="url(#lk-ar)" stroke={C.blk} strokeWidth="1.1"/>
          <rect rx="3" x="42" y="43" width="17" height="5"
            fill="rgba(255,255,255,0.22)"/>

          {/* Gold trim lines on helmet */}
          <rect rx="2" x="38" y="20" width="44" height="4.5"
            fill="url(#lk-gdV)" opacity="0.88"/>
          <rect rx="2" x="38" y="40" width="44" height="4.5"
            fill="url(#lk-gdV)" opacity="0.82"/>

          {/* LEGO stud on helmet top */}
          <rect rx="6" x="54" y="-1" width="12" height="8"
            fill={C.ar} stroke={C.blk} strokeWidth="1"/>
          <ellipse cx="60" cy="-1" rx="6" ry="2.8"
            fill={C.arHi} stroke={C.blk} strokeWidth="0.9"/>
          <ellipse cx="58" cy="-2" rx="2.5" ry="1"
            fill="rgba(255,255,255,0.5)"/>
          <ellipse cx="60" cy="7" rx="6" ry="2.5"
            fill={C.ar} stroke={C.blk} strokeWidth="0.8"/>

          {/* Level 26+: Crown ring */}
          {lvlCfg.crownColor && (
            <ellipse cx="60" cy="-1" rx="7.2" ry="3.4"
              fill="none" stroke={lvlCfg.crownColor} strokeWidth={lvlCfg.crownWidth}
              opacity="0.88"
              style={lvlCfg.crownAnim ? { animation: lvlCfg.crownAnim } : undefined}
            />
          )}

        </g>
        {/* ── end head group ── */}

        {/* Level 76+: Gold shoulder accent bands — on torso, not in head group */}
        {lvlCfg.goldBands && (
          <>
            <rect rx="3" x="26" y="64" width="68" height="5" fill="url(#lk-gdV)" opacity="0.45"
              style={{ animation: 'lk-sheen 2.5s ease-in-out infinite' }}/>
            <rect rx="3" x="26" y="113" width="68" height="5" fill="url(#lk-gdV)" opacity="0.4"
              style={{ animation: 'lk-sheen 3.0s ease-in-out .8s infinite' }}/>
          </>
        )}

      </g>
      {/* ── end main figure group ── */}

    </svg>
    </div>
    {/* ── end jitter wrapper ── */}
    </motion.div>
  );
});

export default CroatianKnight;
