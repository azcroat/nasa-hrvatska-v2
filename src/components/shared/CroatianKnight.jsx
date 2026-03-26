import React from 'react';

/**
 * Croatian Knight Mascot — Naša Hrvatska app mascot
 * A medieval Croatian knight in armor with the šahovnica (checkerboard) shield
 * Used throughout the app for empty states, celebrations, and onboarding
 */
export default function CroatianKnight({ size = 120, mood = 'neutral', className = '', style = {} }) {
  const s = size;
  const w = s * 0.8;
  const h = s;

  // Mood variants: neutral, happy, celebrating, thinking, sad, encouraged, confused
  const moodFace = {
    neutral:     { mouth: 'M 32 58 Q 38 62 44 58', eyeL: 'M 29 50 Q 32 47 35 50', eyeR: 'M 41 50 Q 44 47 47 50' },
    happy:       { mouth: 'M 30 56 Q 38 64 46 56', eyeL: 'M 29 50 Q 32 45 35 50', eyeR: 'M 41 50 Q 44 45 47 50' },
    celebrating: { mouth: 'M 30 54 Q 38 65 46 54', eyeL: 'M 28 49 Q 32 44 36 49', eyeR: 'M 40 49 Q 44 44 48 49' },
    thinking:    { mouth: 'M 32 59 Q 38 60 44 59', eyeL: 'M 29 50 Q 32 47 35 50', eyeR: 'M 44 48 Q 47 51 50 48' },
    sad:         { mouth: 'M 30 62 Q 38 56 46 62', eyeL: 'M 29 52 Q 32 49 35 52', eyeR: 'M 41 52 Q 44 49 47 52' },
    encouraged: (
      <>
        <ellipse cx="32" cy="51" rx="3.5" ry="3" fill="#2d3748"/>
        <ellipse cx="44" cy="51" rx="3.5" ry="3" fill="#2d3748"/>
        <path d="M 25,62 Q 32,69 39,62" stroke="#2d3748" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <circle cx="29" cy="57" r="3" fill="#fca5a5" opacity="0.5"/>
        <circle cx="47" cy="57" r="3" fill="#fca5a5" opacity="0.5"/>
        <text x="36" y="46" fontSize="6" fill="#f59e0b" fontWeight="900" textAnchor="middle">▲</text>
      </>
    ),
    confused: (
      <>
        <circle cx="32" cy="50" r="3.5" fill="#2d3748"/>
        <ellipse cx="44" cy="51" rx="3.5" ry="1.5" fill="#2d3748"/>
        <path d="M 26,63 Q 29,61 32,63 Q 35,65 38,63" stroke="#2d3748" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
        <text x="53" y="35" fontSize="9" fill="#f59e0b" fontWeight="900">?</text>
      </>
    ),
  };
  const face = moodFace[mood] || moodFace.neutral;
  const isFaceJSX = React.isValidElement(face);

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 80 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      role="img"
      aria-label={`Croatian knight mascot, ${mood} expression`}
    >
      {/* ── GRADIENT & FILTER DEFINITIONS ─────────────── */}
      <defs>
        {/* Metallic armor gradient — steel with highlight */}
        <linearGradient id="knightArmor" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d0d8e8" />
          <stop offset="35%" stopColor="#8da0bc" />
          <stop offset="65%" stopColor="#6b80a0" />
          <stop offset="100%" stopColor="#4a5d7a" />
        </linearGradient>
        {/* Helmet gradient */}
        <linearGradient id="knightHelmet" x1="0%" y1="0%" x2="60%" y2="100%">
          <stop offset="0%" stopColor="#b8c8dc" />
          <stop offset="50%" stopColor="#7a90a8" />
          <stop offset="100%" stopColor="#556070" />
        </linearGradient>
        {/* Gold trim gradient */}
        <linearGradient id="knightGold" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFE070" />
          <stop offset="50%" stopColor="#C8980A" />
          <stop offset="100%" stopColor="#FFE070" />
        </linearGradient>
        {/* Skin tone gradient — subtle warmth */}
        <linearGradient id="knightSkin" x1="0%" y1="0%" x2="30%" y2="100%">
          <stop offset="0%" stopColor="#fde8d0" />
          <stop offset="100%" stopColor="#f5c8a8" />
        </linearGradient>
        {/* Plume gradient */}
        <linearGradient id="knightPlume" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#7f1d1d" />
        </linearGradient>
        {/* Shadow overlay for depth */}
        <radialGradient id="knightShadow" cx="50%" cy="100%" r="40%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.2)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>

      {/* ── KNIGHT BODY (with drop shadow) ────────────── */}
      <g filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.2))">

        {/* Body armor — metallic gradient */}
        <rect x="22" y="60" width="36" height="30" rx="4" fill="url(#knightArmor)" />
        <rect x="22" y="60" width="36" height="8" rx="2" fill="url(#knightHelmet)" />

        {/* Shoulder pauldrons */}
        <ellipse cx="19" cy="63" rx="9" ry="6" fill="url(#knightArmor)" />
        <ellipse cx="61" cy="63" rx="9" ry="6" fill="url(#knightArmor)" />
        <ellipse cx="19" cy="63" rx="7" ry="4" fill="url(#knightHelmet)" />
        <ellipse cx="61" cy="63" rx="7" ry="4" fill="url(#knightHelmet)" />

        {/* Arms */}
        <rect x="10" y="64" width="10" height="20" rx="4" fill="url(#knightArmor)" />
        <rect x="60" y="64" width="10" height="20" rx="4" fill="url(#knightArmor)" />

        {/* Gauntlets */}
        <rect x="9" y="82" width="12" height="8" rx="3" fill="#374151" />
        <rect x="59" y="82" width="12" height="8" rx="3" fill="#374151" />

        {/* Legs */}
        <rect x="25" y="88" width="12" height="10" rx="3" fill="#374151" />
        <rect x="43" y="88" width="12" height="10" rx="3" fill="#374151" />

        {/* Boots */}
        <rect x="24" y="96" width="13" height="4" rx="2" fill="#1f2937" />
        <rect x="43" y="96" width="13" height="4" rx="2" fill="#1f2937" />

        {/* Armor chest detail — šahovnica mini */}
        <rect x="28" y="66" width="24" height="18" rx="2" fill="url(#knightArmor)" />
        {/* Šahovnica on chest (4x3 grid) — DO NOT change these colors */}
        {[0,1,2,3].map(col => [0,1,2].map(row => (
          <rect
            key={`${col}-${row}`}
            x={29 + col * 6}
            y={67 + row * 6}
            width={6} height={6}
            fill={(col + row) % 2 === 0 ? '#b61800' : 'white'}
            opacity={0.9}
          />
        )))}

        {/* ── SHIELD (held in left hand) ──────────────── */}
        <ellipse cx="7" cy="78" rx="6" ry="8" fill="#b61800" />
        <ellipse cx="7" cy="78" rx="6" ry="8" fill="none" stroke="#7f1d1d" strokeWidth="1" />
        {/* Shield šahovnica — DO NOT change these colors */}
        {[0,1].map(col => [0,1,2].map(row => (
          <rect
            key={`s-${col}-${row}`}
            x={3 + col * 4}
            y={71 + row * 5}
            width={4} height={5}
            fill={(col + row) % 2 === 0 ? '#b61800' : 'white'}
          />
        )))}
        <ellipse cx="7" cy="78" rx="6" ry="8" fill="none" stroke="url(#knightGold)" strokeWidth="0.8" />

        {/* ── SWORD (held in right hand) ───────────────── */}
        {/* Blade */}
        <rect x="70" y="55" width="3" height="34" rx="1" fill="#d1d5db" />
        <rect x="70" y="55" width="3" height="34" rx="1" fill="none" stroke="#9ca3af" strokeWidth="0.5" />
        {/* Crossguard */}
        <rect x="65" y="81" width="13" height="4" rx="2" fill="url(#knightGold)" />
        {/* Pommel */}
        <circle cx="71.5" cy="90" r="3" fill="url(#knightGold)" />
        {/* Sword tip */}
        <polygon points="70,55 73,55 71.5,48" fill="#d1d5db" />

        {/* ── NECK ─────────────────────────────────────── */}
        <rect x="32" y="52" width="16" height="12" rx="3" fill="url(#knightSkin)" />

        {/* ── HEAD / HELMET ────────────────────────────── */}
        {/* Helmet main */}
        <ellipse cx="40" cy="40" rx="18" ry="20" fill="url(#knightHelmet)" />
        {/* Visor area — open to show face */}
        <ellipse cx="40" cy="45" rx="13" ry="12" fill="url(#knightSkin)" />
        {/* Face */}
        <ellipse cx="40" cy="47" rx="11" ry="10" fill="url(#knightSkin)" />

        {/* Eyes / Mouth — path-data moods vs JSX moods */}
        {isFaceJSX ? face : (
          <>
            <path d={face.eyeL} stroke="#1f2937" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d={face.eyeR} stroke="#1f2937" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            {/* Eye pupils */}
            <circle cx="32" cy="50" r="1.5" fill="#1f2937" />
            <circle cx="44" cy="50" r="1.5" fill="#1f2937" />
            {/* Eye shine */}
            <circle cx="32.8" cy="49.3" r="0.6" fill="white" />
            <circle cx="44.8" cy="49.3" r="0.6" fill="white" />

            {/* Nose */}
            <path d="M 38 53 Q 40 56 42 53" stroke="#c0917a" strokeWidth="1" fill="none" strokeLinecap="round" />

            {/* Mouth */}
            <path d={face.mouth} stroke="#8b4513" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </>
        )}

        {/* Cheeks (happy/celebrating) */}
        {(mood === 'happy' || mood === 'celebrating') && (
          <>
            <circle cx="28" cy="56" r="4" fill="#f87171" opacity="0.35" />
            <circle cx="52" cy="56" r="4" fill="#f87171" opacity="0.35" />
          </>
        )}

        {/* ── HELMET DETAILS ───────────────────────────── */}
        {/* Helmet top ridge */}
        <rect x="37" y="20" width="6" height="18" rx="3" fill="url(#knightHelmet)" />
        {/* Helmet plume — gradient red */}
        <path d="M 40 20 Q 35 10 38 5 Q 40 2 42 5 Q 45 10 40 20" fill="url(#knightPlume)" />
        <path d="M 40 20 Q 42 12 39 7" stroke="#7f1d1d" strokeWidth="0.8" fill="none" opacity="0.6" />

        {/* Visor slots */}
        <rect x="27" y="41" width="8" height="2" rx="1" fill="#374151" opacity="0.6" />
        <rect x="27" y="45" width="8" height="2" rx="1" fill="#374151" opacity="0.6" />

        {/* Helmet ear guards */}
        <path d="M 22 38 Q 18 40 20 48 Q 22 52 26 50" fill="url(#knightArmor)" />
        <path d="M 58 38 Q 62 40 60 48 Q 58 52 54 50" fill="url(#knightArmor)" />

        {/* Helmet chin strap */}
        <path d="M 26 52 Q 40 58 54 52" stroke="#374151" strokeWidth="1.5" fill="none" strokeLinecap="round" />

        {/* Gold helmet trim */}
        <path d="M 24 38 Q 40 32 56 38" stroke="url(#knightGold)" strokeWidth="1.5" fill="none" />
        <ellipse cx="40" cy="38" rx="16" ry="2" fill="none" stroke="url(#knightGold)" strokeWidth="1" opacity="0.7" />

        {/* ── BELT/SASH ────────────────────────────────── */}
        <rect x="22" y="82" width="36" height="6" rx="2" fill="#b61800" />
        <rect x="36" y="81" width="8" height="8" rx="2" fill="url(#knightGold)" />

        {/* Chest metallic highlight — subtle sheen */}
        <ellipse
          cx={40 * 0.88} cy={100 * 0.45}
          rx={80 * 0.06} ry={100 * 0.04}
          fill="rgba(255,255,255,0.35)"
        />

        {/* Celebrating extras */}
        {mood === 'celebrating' && (
          <>
            <circle cx="15" cy="20" r="3" fill="#fbbf24" opacity="0.9" />
            <circle cx="65" cy="15" r="2" fill="#b61800" opacity="0.9" />
            <circle cx="70" cy="30" r="2.5" fill="#0e7490" opacity="0.9" />
            <circle cx="10" cy="35" r="2" fill="#16a34a" opacity="0.9" />
            <path d="M 12 18 L 14 12 L 16 18" stroke="#fbbf24" strokeWidth="1.5" fill="none" />
            <path d="M 62 12 L 64 6 L 66 12" stroke="#b61800" strokeWidth="1.5" fill="none" />
          </>
        )}

      </g>

      {/* Ground shadow ellipse */}
      <ellipse
        cx={80 / 2} cy={100 * 0.96}
        rx={80 * 0.3} ry={100 * 0.025}
        fill="rgba(0,0,0,0.12)"
      />
    </svg>
  );
}
