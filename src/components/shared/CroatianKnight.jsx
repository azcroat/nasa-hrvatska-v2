import React, { useState, useEffect, useRef } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// CroatianKnight — Naša Hrvatska Mascot (v4)
//
// Flat-design cartoon in the Duolingo tradition:
//   • Large round head — the dominant feature at every size
//   • Big expressive eyes with reflective highlights
//   • Bold, readable eyebrows — the primary expression driver
//   • Croatian identity: royal blue armour + šahovnica shield + red plume
//   • Smooth organic curves — no LEGO blocks
//   • CSS-only idle animations — no Framer Motion (avoids Android WebView opacity bug)
//
// Props: { size, mood, variant, level, className, style }
// Moods: happy, thinking, celebrating, victory, sad, encouraged,
//        ready, marching, glancing, neutral
// Levels: 1-10 standard │ 11+ gold trim │ 26+ gold sword │ 51+ crown │ 76+ aura
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Colour palette ──────────────────────────────────────────────────────────
const C = {
  // Skin
  skin:    '#FFCB8E',
  skinDk:  '#E8A75E',
  skinMd:  '#F4B870',
  // Armour — Croatian royal blue
  blue:    '#1B4FD8',
  blueDk:  '#1239A8',
  blueLt:  '#4A74F0',
  // Croatian red (plume + šahovnica)
  red:     '#DC1C1C',
  redLt:   '#F04040',
  // White
  white:   '#FFFFFF',
  // Gold (level-gated)
  gold:    '#F5C230',
  goldDk:  '#D4A010',
  goldLt:  '#FFE06A',
  // Silver (sword default)
  silver:  '#C0CDD8',
  silverLt:'#E4EEF8',
  silverDk:'#8A9AAA',
  // Misc
  outline: '#1A1A2E',
  blush:   '#FF8888',
  mouth:   '#9B2A18',
};

// ─── Mood rim-glow ────────────────────────────────────────────────────────────
const MOOD_GLOW = {
  celebrating: 'drop-shadow(0 0 8px rgba(245,194,48,.85)) drop-shadow(0 0 20px rgba(245,194,48,.45))',
  victory:     'drop-shadow(0 0 10px rgba(212,160,16,.9)) drop-shadow(0 0 24px rgba(255,200,50,.5))',
  happy:       'drop-shadow(0 0 6px rgba(27,79,216,.45))',
  encouraged:  'drop-shadow(0 0 7px rgba(22,163,74,.48))',
  thinking:    'drop-shadow(0 0 7px rgba(124,58,237,.48))',
  ready:       'drop-shadow(0 0 9px rgba(27,79,216,.62))',
  marching:    'drop-shadow(0 0 8px rgba(27,79,216,.52))',
  sad:         'drop-shadow(0 0 6px rgba(220,38,38,.35))',
  glancing:    'drop-shadow(0 0 5px rgba(0,0,0,.18))',
  neutral:     'none',
};

// ─── CSS keyframe animations ──────────────────────────────────────────────────
const ANIM_CSS = `
  @keyframes kn-breathe {
    0%,100% { transform: translateY(0); }
    50%      { transform: translateY(-1.8px); }
  }
  @keyframes kn-celebrate-sword {
    0%,100% { transform: rotate(0deg); }
    25%     { transform: rotate(-14deg); }
    75%     { transform: rotate(14deg); }
  }
  @keyframes kn-march-left {
    0%,100% { transform: rotate(-8deg) translateX(-1px); }
    50%     { transform: rotate(4deg) translateX(1px); }
  }
  @keyframes kn-march-right {
    0%,100% { transform: rotate(8deg) translateX(1px); }
    50%     { transform: rotate(-4deg) translateX(-1px); }
  }
  @keyframes kn-aura-pulse {
    0%,100% { opacity: 0.38; }
    50%     { opacity: 0.65; }
  }
  @keyframes kn-star-orbit {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes kn-sparkle-fade {
    0%   { opacity:1; transform: scale(1) translateY(0); }
    100% { opacity:0; transform: scale(1.6) translateY(-8px); }
  }
`;

// ─── Mood table ───────────────────────────────────────────────────────────────
// browL  : rotation on left  eyebrow (positive = inner-DOWN / stern; negative = inner-UP / sad)
// browR  : rotation on right eyebrow — same convention (mirror is handled by scale(-1,1))
// browLY : vertical shift for left  brow (negative = raised)
// browRY : vertical shift for right brow (negative = raised)
// mouth  : mouth shape key
// px/py  : pupil offset from eye centre
// eScale : vertical eye scale (0 = closed line; 1 = fully open)
// wink   : true → draw closed-eye line regardless of eScale
const MOOD = {
  happy:       { browL:  0, browLY:  0, browR:  0, browRY:  0, mouth:'happy',      px: 0, py: 0, eScale:1.00         },
  thinking:    { browL: -3, browLY:  0, browR: 10, browRY: -3, mouth:'hmm',        px: 3, py:-2, eScale:0.85         },
  celebrating: { browL: -6, browLY: -2, browR: -6, browRY: -2, mouth:'big_smile',  px: 0, py:-1, eScale:1.00         },
  victory:     { browL: -5, browLY: -1, browR: -5, browRY: -1, mouth:'victory',    px: 0, py: 0, eScale:0.00, wink:true },
  sad:         { browL: -8, browLY:  2, browR:  8, browRY:  2, mouth:'sad',        px: 0, py: 2, eScale:0.88         },
  encouraged:  { browL: -3, browLY: -1, browR: -3, browRY: -1, mouth:'smile_sm',   px: 0, py: 0, eScale:1.00         },
  ready:       { browL:  7, browLY:  0, browR:  7, browRY:  0, mouth:'determined', px: 0, py: 1, eScale:0.70         },
  marching:    { browL:  0, browLY:  0, browR:  0, browRY:  0, mouth:'smile_sm',   px:-2, py: 0, eScale:0.90         },
  glancing:    { browL:  0, browLY:  0, browR:  0, browRY:  0, mouth:'neutral',    px: 5, py: 0, eScale:0.95         },
  neutral:     { browL:  0, browLY:  0, browR:  0, browRY:  0, mouth:'neutral',    px: 0, py: 0, eScale:1.00         },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Single eye with pupil and reflective highlights. */
function Eye({ cx, cy, pxOff = 0, pyOff = 0, scaleY = 1, wink = false }) {
  const RX = 10, RY = 11;
  const sRY = Math.max(RY * scaleY, 0.5);
  if (wink || scaleY <= 0.03) {
    return (
      <line
        x1={cx - RX} y1={cy} x2={cx + RX} y2={cy}
        stroke={C.outline} strokeWidth="2.8" strokeLinecap="round"
      />
    );
  }
  const pupilR   = Math.min(5.8, RX - 1.5);
  const pupilRY  = Math.min(pupilR * scaleY, sRY - 0.5);
  const pxc = cx + pxOff * 0.65;
  const pyc = cy + pyOff * 0.65;
  return (
    <g>
      {/* White sclera */}
      <ellipse cx={cx} cy={cy} rx={RX} ry={sRY}
        fill={C.white} stroke={C.outline} strokeWidth="1.6" />
      {/* Pupil */}
      <ellipse cx={pxc} cy={pyc} rx={pupilR} ry={pupilRY}
        fill={C.outline} />
      {/* Primary highlight */}
      <circle cx={pxc + 2.2} cy={pyc - 3} r={2.2} fill={C.white} />
      {/* Secondary highlight */}
      <circle cx={pxc - 2}   cy={pyc + 2} r={1.1} fill={C.white} opacity="0.55" />
    </g>
  );
}

/** Single eyebrow arc. Mirror the right one with scale(-1,1). */
function BrowPath() {
  return (
    <path
      d="M-8 0 Q0 -4.5 8 0"
      stroke={C.outline} strokeWidth="3.2"
      fill="none" strokeLinecap="round"
    />
  );
}

/** Mouth shape — centred at (0,0), caller wraps in a translate group. */
function Mouth({ type }) {
  switch (type) {
    case 'happy':
      return <path d="M-7 0 Q0 7.5 7 0" stroke={C.outline} strokeWidth="2.4" fill="none" strokeLinecap="round" />;
    case 'big_smile':
      return (
        <>
          <path d="M-9 0 Q0 12 9 0 Z" stroke={C.outline} strokeWidth="2.2" fill={C.mouth} />
          <path d="M-6 4 Q0 9 6 4"   stroke="none"        fill={C.white}    opacity="0.30" />
        </>
      );
    case 'victory':
      return (
        <>
          <path d="M-9 2 Q0 13 9 2 Z" stroke={C.outline} strokeWidth="2.2" fill={C.mouth} />
          <path d="M-6 6 Q0 11 6 6"   stroke="none"       fill={C.white}    opacity="0.28" />
        </>
      );
    case 'sad':
      return <path d="M-7 5 Q0 -1 7 5" stroke={C.outline} strokeWidth="2.4" fill="none" strokeLinecap="round" />;
    case 'smile_sm':
      return <path d="M-5 0 Q0 5.5 5 0" stroke={C.outline} strokeWidth="2.2" fill="none" strokeLinecap="round" />;
    case 'determined':
      return <path d="M-6.5 0 L6.5 0" stroke={C.outline} strokeWidth="2.6" strokeLinecap="round" />;
    case 'hmm':
      return <path d="M-4 0 Q0 3 4 0" stroke={C.outline} strokeWidth="2.2" fill="none" strokeLinecap="round" />;
    case 'neutral':
    default:
      return <path d="M-5 0 L5 0" stroke={C.outline} strokeWidth="2" strokeLinecap="round" opacity="0.7" />;
  }
}

/** Croatian šahovnica (checkerboard) shield. */
function Shield({ cx, cy, r = 13, goldTrim = false }) {
  const clipId = `kn-sh-${Math.round(cx)}-${Math.round(cy)}`;
  const h = r * 0.65;
  const trim = goldTrim ? C.gold : C.silver;
  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <circle cx={cx} cy={cy} r={r - 1.2} />
        </clipPath>
      </defs>
      {/* Base */}
      <circle cx={cx} cy={cy} r={r} fill={C.white} stroke={C.outline} strokeWidth="1.6" />
      {/* 2×2 šahovnica */}
      <g clipPath={`url(#${clipId})`}>
        <rect x={cx - h} y={cy - h} width={h} height={h} fill={C.red}   />
        <rect x={cx}     y={cy - h} width={h} height={h} fill={C.white} />
        <rect x={cx - h} y={cy}     width={h} height={h} fill={C.white} />
        <rect x={cx}     y={cy}     width={h} height={h} fill={C.red}   />
      </g>
      {/* Outline */}
      <circle cx={cx} cy={cy} r={r}     fill="none" stroke={C.outline} strokeWidth="1.6" />
      {/* Trim ring */}
      <circle cx={cx} cy={cy} r={r + 2} fill="none" stroke={trim}      strokeWidth="2"   />
    </g>
  );
}

/** Sword — blade points downward from (x, y1) to (x, y2). */
function Sword({ x, y1, y2, golden = false }) {
  const blade    = golden ? C.gold    : C.silver;
  const bladeLt  = golden ? C.goldLt  : C.silverLt;
  const bladeDk  = golden ? C.goldDk  : C.silverDk;
  const handle   = golden ? C.goldDk  : '#6B3E18';
  const guardLen = 14;
  return (
    <g>
      {/* Blade */}
      <polygon
        points={`${x - 3},${y1} ${x + 3},${y1} ${x},${y2}`}
        fill={blade} stroke={C.outline} strokeWidth="1.3"
      />
      {/* Blade centre shine */}
      <line x1={x} y1={y1 + 3} x2={x} y2={y2 - 7}
        stroke={bladeLt} strokeWidth="1" opacity="0.55" />
      {/* Blade edge shadow */}
      <line x1={x + 2} y1={y1 + 3} x2={x + 1} y2={y2 - 10}
        stroke={bladeDk} strokeWidth="0.8" opacity="0.4" />
      {/* Guard */}
      <rect
        x={x - guardLen / 2} y={y1 - 3.5}
        width={guardLen} height={5} rx={2.2}
        fill={handle} stroke={C.outline} strokeWidth="1.3"
      />
      {/* Handle */}
      <rect x={x - 2.8} y={y1 - 16} width={5.6} height={13} rx={2}
        fill={handle} stroke={C.outline} strokeWidth="1.3"
      />
      {/* Pommel */}
      <circle cx={x} cy={y1 - 16} r={3.8}
        fill={blade} stroke={C.outline} strokeWidth="1.3"
      />
      {golden && (
        <circle cx={x} cy={y1 - 16} r={1.8} fill={C.goldLt} opacity="0.6" />
      )}
    </g>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
const CroatianKnight = React.memo(function CroatianKnight({
  size = 80,
  mood = 'happy',
  variant,  // reserved for future colour variants; not yet used
  level = 1,
  className = '',
  style = {},
}) {
  const cfg = MOOD[mood] || MOOD.happy;

  // Level-gated visuals
  const goldTrim  = level >= 11;
  const goldSword = level >= 26;
  const hasCrown  = level >= 51;
  const hasAura   = level >= 76;

  // Auto-blink (random interval: 2.5–6 s)
  const [blink, setBlink]       = useState(false);
  const blinkRef                = useRef(null);
  useEffect(() => {
    function schedule() {
      blinkRef.current = setTimeout(() => {
        setBlink(true);
        setTimeout(() => { setBlink(false); schedule(); }, 130);
      }, 2500 + Math.random() * 3500);
    }
    schedule();
    return () => clearTimeout(blinkRef.current);
  }, []);

  const eyeScaleY = (cfg.wink || blink) ? 0.0 : cfg.eScale;
  const isWink    =  cfg.wink || blink;

  // ─── Layout constants (viewBox 0 0 100 130) ────────────────────────────────
  // Head
  const HX = 50, HY = 55, HR = 33;
  // Eye centres (relative to head)
  const ELX = HX - 13, ERX = HX + 13, EY = HY + 3;
  // Brow centres
  const BLX = HX - 13, BRX = HX + 13, BY = HY - 11;
  // Nose & mouth
  const NX = HX, NY = HY + 15;
  const MX = HX, MY = HY + 23;
  // Helmet plume base sits on top of head dome
  const plumeBase = HY - HR - 8;
  // Body
  const bodyTop = HY + HR - 2;

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        filter: MOOD_GLOW[mood] || 'none',
        ...style,
      }}
    >
      <svg
        viewBox="0 0 100 130"
        width={size}
        height={Math.round(size * 1.3)}
        style={{ display: 'block', overflow: 'visible' }}
        aria-label={`Hrvoje, mascot — ${mood}`}
      >
        <defs>
          <style>{ANIM_CSS}</style>
          {hasAura && (
            <radialGradient id="kn-aura-g" cx="50%" cy="55%" r="50%">
              <stop offset="0%"   stopColor="#818CF8" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#818CF8" stopOpacity="0"    />
            </radialGradient>
          )}
        </defs>

        {/* ── Aura (level 76+) ── */}
        {hasAura && (
          <ellipse
            cx={HX} cy={HY + 18} rx={52} ry={56}
            fill="url(#kn-aura-g)"
            style={{ animation: 'kn-aura-pulse 2.4s ease-in-out infinite' }}
          />
        )}

        {/* ── Ground shadow ── */}
        <ellipse cx={HX} cy={126} rx={24} ry={4.5} fill="rgba(0,0,0,0.09)" />

        {/* ── Main figure — idle breathing ── */}
        <g style={{ animation: 'kn-breathe 3.4s ease-in-out infinite', transformOrigin: `${HX}px ${HY}px` }}>

          {/* ══ LOWER BODY ══ */}

          {/* Boots */}
          <rect x={34} y={114} width={13} height={11} rx={4.5}
            fill={C.blueDk} stroke={C.outline} strokeWidth="1.6" />
          <rect x={53} y={114} width={13} height={11} rx={4.5}
            fill={C.blueDk} stroke={C.outline} strokeWidth="1.6" />
          {/* Boot toe highlight */}
          <rect x={36} y={115} width={5} height={3} rx={1.5} fill={C.blueLt} opacity="0.35" />
          <rect x={55} y={115} width={5} height={3} rx={1.5} fill={C.blueLt} opacity="0.35" />

          {/* Legs */}
          <rect x={34.5} y={101} width={12} height={14} rx={3.5}
            fill={C.blue} stroke={C.outline} strokeWidth="1.6" />
          <rect x={53.5} y={101} width={12} height={14} rx={3.5}
            fill={C.blue} stroke={C.outline} strokeWidth="1.6" />
          {/* Kneecap */}
          <ellipse cx={40.5} cy={101} rx={4} ry={3} fill={C.blueLt} opacity="0.4" />
          <ellipse cx={59.5} cy={101} rx={4} ry={3} fill={C.blueLt} opacity="0.4" />

          {/* ══ TORSO ══ */}
          <path
            d={`M 25,${bodyTop} Q 24,${bodyTop} 24,${bodyTop + 8}
                L 24,${bodyTop + 18} Q 24,${bodyTop + 22} 28,${bodyTop + 23}
                L 72,${bodyTop + 23} Q 76,${bodyTop + 22} 76,${bodyTop + 18}
                L 76,${bodyTop + 8} Q 76,${bodyTop} 75,${bodyTop} Z`}
            fill={C.blue} stroke={C.outline} strokeWidth="1.8"
          />
          {/* Breastplate centre highlight */}
          <path
            d={`M 38,${bodyTop + 1} Q 50,${bodyTop + 5} 62,${bodyTop + 1}
               L 62,${bodyTop + 21} Q 50,${bodyTop + 18} 38,${bodyTop + 21} Z`}
            fill={C.blueLt} opacity="0.22"
          />
          {/* Centre ridge */}
          <line x1={50} y1={bodyTop + 1} x2={50} y2={bodyTop + 22}
            stroke={C.blueDk} strokeWidth="1.1" opacity="0.55" />
          {/* Horizontal armour band */}
          <path d={`M 24,${bodyTop + 11} Q 50,${bodyTop + 14} 76,${bodyTop + 11}`}
            stroke={C.blueDk} fill="none" strokeWidth="1" opacity="0.5" />
          {/* Gold trim on torso (level 11+) */}
          {goldTrim && (
            <>
              <path d={`M 25,${bodyTop} Q 50,${bodyTop + 3} 75,${bodyTop}`}
                stroke={C.gold} fill="none" strokeWidth="1.8" />
              <line x1={24} y1={bodyTop + 11} x2={24} y2={bodyTop + 18}
                stroke={C.gold} strokeWidth="1.5" />
              <line x1={76} y1={bodyTop + 11} x2={76} y2={bodyTop + 18}
                stroke={C.gold} strokeWidth="1.5" />
            </>
          )}

          {/* ══ LEFT ARM + SHIELD ══ */}
          <g
            style={
              mood === 'marching'
                ? { animation: 'kn-march-left 0.55s ease-in-out infinite', transformOrigin: `25px ${bodyTop + 4}px` }
                : {}
            }
          >
            <path
              d={`M 25,${bodyTop + 4} Q 16,${bodyTop + 4} 14,${bodyTop + 12}
                 Q 12,${bodyTop + 19} 16,${bodyTop + 22} L 24,${bodyTop + 20}`}
              fill={C.blue} stroke={C.outline} strokeWidth="1.6"
            />
            <Shield cx={13} cy={bodyTop + 26} r={13} goldTrim={goldTrim} />
          </g>

          {/* ══ RIGHT ARM + SWORD ══ */}
          <g
            style={
              mood === 'marching'
                ? { animation: 'kn-march-right 0.55s ease-in-out infinite', transformOrigin: `75px ${bodyTop + 4}px` }
                : mood === 'celebrating'
                ? { animation: 'kn-celebrate-sword 0.6s ease-in-out infinite', transformOrigin: `75px ${bodyTop + 4}px` }
                : {}
            }
          >
            <path
              d={`M 75,${bodyTop + 4} Q 84,${bodyTop + 4} 86,${bodyTop + 12}
                 Q 88,${bodyTop + 19} 84,${bodyTop + 22} L 76,${bodyTop + 20}`}
              fill={C.blue} stroke={C.outline} strokeWidth="1.6"
            />
            <Sword x={86} y1={bodyTop + 8} y2={bodyTop + 45} golden={goldSword} />
          </g>

          {/* ══ HEAD ══ */}

          {/* Drop shadow */}
          <ellipse cx={HX + 2} cy={HY + 5} rx={HR - 1} ry={HR - 3}
            fill="rgba(0,0,0,0.09)" />

          {/* Face */}
          <circle cx={HX} cy={HY} r={HR}
            fill={C.skin} stroke={C.outline} strokeWidth="1.9" />

          {/* Face highlight (top-left) */}
          <ellipse cx={HX - 9} cy={HY - 11} rx={12} ry={10}
            fill={C.white} opacity="0.11" />

          {/* ── Ears (sit behind cheek guards) ── */}
          <ellipse cx={HX - HR + 2} cy={HY + 5} rx={5.5} ry={7.5}
            fill={C.skin} stroke={C.outline} strokeWidth="1.4" />
          <ellipse cx={HX + HR - 2} cy={HY + 5} rx={5.5} ry={7.5}
            fill={C.skin} stroke={C.outline} strokeWidth="1.4" />
          <ellipse cx={HX - HR + 2} cy={HY + 5} rx={2.8} ry={4.5}
            fill={C.skinMd} opacity="0.55" />
          <ellipse cx={HX + HR - 2} cy={HY + 5} rx={2.8} ry={4.5}
            fill={C.skinMd} opacity="0.55" />

          {/* ── Helmet dome ── */}
          <path
            d={`M ${HX - HR + 2},${HY - 8}
                C ${HX - HR - 4},${HY - 20} ${HX - 24},${HY - 38} ${HX - 9},${HY - HR - 9}
                Q ${HX},${HY - HR - 14} ${HX + 9},${HY - HR - 9}
                C ${HX + 24},${HY - 38} ${HX + HR + 4},${HY - 20} ${HX + HR - 2},${HY - 8} Z`}
            fill={C.blue} stroke={C.outline} strokeWidth="1.9"
          />
          {/* Helmet inner highlight (left facet) */}
          <path
            d={`M ${HX - 18},${HY - HR - 5} C ${HX - 10},${HY - HR - 12} ${HX - 4},${HY - HR - 14} ${HX},${HY - HR - 13}`}
            fill="none" stroke={C.white} strokeWidth="2" opacity="0.22" strokeLinecap="round"
          />
          {/* Helmet rim strip — covers head/dome seam */}
          <path
            d={`M ${HX - HR + 2},${HY - 8}
               Q ${HX},${HY - 5} ${HX + HR - 2},${HY - 8}
               Q ${HX},${HY - 12} ${HX - HR + 2},${HY - 8} Z`}
            fill={C.blue} stroke="none"
          />
          {/* Helmet rim outline */}
          <path
            d={`M ${HX - HR + 2},${HY - 8} Q ${HX},${HY - 5} ${HX + HR - 2},${HY - 8}`}
            fill="none" stroke={C.outline} strokeWidth="2.2" strokeLinecap="round"
          />
          {/* Helmet rim gold trim (level 11+) */}
          {goldTrim && (
            <path
              d={`M ${HX - HR + 2},${HY - 8} Q ${HX},${HY - 5} ${HX + HR - 2},${HY - 8}`}
              fill="none" stroke={C.gold} strokeWidth="2" strokeLinecap="round"
            />
          )}

          {/* Cheek guards */}
          <rect x={HX - HR - 2} y={HY - 10} width={8} height={15} rx={3}
            fill={C.blue} stroke={C.outline} strokeWidth="1.4" />
          <rect x={HX + HR - 6} y={HY - 10} width={8} height={15} rx={3}
            fill={C.blue} stroke={C.outline} strokeWidth="1.4" />
          {/* Cheek guard highlight */}
          <rect x={HX - HR - 1} y={HY - 9} width={3} height={5} rx={1}
            fill={C.blueLt} opacity="0.3" />
          <rect x={HX + HR - 5} y={HY - 9} width={3} height={5} rx={1}
            fill={C.blueLt} opacity="0.3" />

          {/* ── Plume / Crest ── */}
          <path
            d={`M ${HX},${plumeBase}
                C ${HX - 11},${plumeBase - 14} ${HX - 6},${plumeBase - 28} ${HX - 1},${plumeBase - 32}
                C ${HX + 4},${plumeBase - 28} ${HX + 11},${plumeBase - 14} ${HX},${plumeBase} Z`}
            fill={C.red} stroke={C.outline} strokeWidth="1.4"
          />
          {/* Plume highlight streak */}
          <path
            d={`M ${HX - 2},${plumeBase - 4}
               C ${HX - 7},${plumeBase - 15} ${HX - 4},${plumeBase - 26} ${HX - 1},${plumeBase - 30}`}
            fill="none" stroke={C.redLt} strokeWidth="1.8" opacity="0.55" strokeLinecap="round"
          />

          {/* ── Crown (level 51+) ── */}
          {hasCrown && (
            <g transform={`translate(${HX},${plumeBase})`}>
              <path
                d="M -11,0 L -11,-9 L -6,-4 L 0,-11 L 6,-4 L 11,-9 L 11,0 Z"
                fill={C.gold} stroke={C.outline} strokeWidth="1.3"
              />
              <circle cx={-11} cy={-9} r={2}   fill={C.red}  />
              <circle cx={  0} cy={-11} r={2.5} fill={C.red}  />
              <circle cx={ 11} cy={-9} r={2}   fill={C.red}  />
              <circle cx={-11} cy={-9} r={0.8} fill={C.goldLt} />
              <circle cx={  0} cy={-11} r={1}  fill={C.goldLt} />
              <circle cx={ 11} cy={-9} r={0.8} fill={C.goldLt} />
            </g>
          )}

          {/* ── Cheek blush ── */}
          <ellipse cx={HX - 21} cy={HY + 14} rx={7.5} ry={5.5}
            fill={C.blush} opacity="0.28" />
          <ellipse cx={HX + 21} cy={HY + 14} rx={7.5} ry={5.5}
            fill={C.blush} opacity="0.28" />

          {/* ── Eyes ── */}
          <Eye
            cx={ELX} cy={EY}
            pxOff={cfg.px} pyOff={cfg.py}
            scaleY={eyeScaleY} wink={isWink}
          />
          <Eye
            cx={ERX} cy={EY}
            pxOff={cfg.px} pyOff={cfg.py}
            scaleY={eyeScaleY} wink={isWink}
          />

          {/* ── Eyebrows ── */}
          {/* Left brow: rotate by browL around its centre */}
          <g transform={`translate(${BLX},${BY + cfg.browLY}) rotate(${cfg.browL})`}>
            <BrowPath />
          </g>
          {/* Right brow: mirror via scale(-1,1) on the path, then rotate by browR */}
          <g transform={`translate(${BRX},${BY + cfg.browRY})`}>
            <path
              d="M-8 0 Q0 -4.5 8 0"
              stroke={C.outline} strokeWidth="3.2"
              fill="none" strokeLinecap="round"
              transform={`scale(-1,1) rotate(${cfg.browR})`}
            />
          </g>

          {/* ── Nose ── */}
          <ellipse cx={NX} cy={NY} rx={2.4} ry={1.7}
            fill={C.skinDk} opacity="0.5" />

          {/* ── Mouth ── */}
          <g transform={`translate(${MX},${MY})`}>
            <Mouth type={cfg.mouth} />
          </g>

          {/* ── Thinking dots ── */}
          {mood === 'thinking' && (
            <g opacity="0.85">
              <circle cx={HX + 30} cy={HY - 18} r={2.2} fill={C.gold} />
              <circle cx={HX + 36} cy={HY - 24} r={1.7} fill={C.gold} />
              <circle cx={HX + 41} cy={HY - 31} r={3.0} fill={C.gold} />
            </g>
          )}

          {/* ── Celebrating stars ── */}
          {mood === 'celebrating' && (
            <>
              {/* Left star */}
              <g
                style={{ animation: 'kn-sparkle-fade 0.9s ease-in-out infinite', transformOrigin: '20px 30px' }}
              >
                <polygon
                  points="20,24 21.5,28.5 26,28.5 22.5,31 23.5,36 20,33 16.5,36 17.5,31 14,28.5 18.5,28.5"
                  fill={C.gold} stroke={C.goldDk} strokeWidth="0.5"
                />
              </g>
              {/* Right star */}
              <g
                style={{ animation: 'kn-sparkle-fade 1.1s ease-in-out 0.35s infinite', transformOrigin: '80px 26px' }}
              >
                <polygon
                  points="80,20 81.2,24 85.5,24 82.2,26.5 83.3,31 80,28.5 76.7,31 77.8,26.5 74.5,24 78.8,24"
                  fill={C.gold} stroke={C.goldDk} strokeWidth="0.5"
                />
              </g>
            </>
          )}

        </g>
        {/* ── end main figure ── */}

      </svg>
    </div>
  );
});

export default CroatianKnight;
