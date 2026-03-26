import React from 'react';

/**
 * Croatian Knight Mascot — Naša Hrvatska app mascot
 * Bold geometric flat-design character with full mood system.
 * ViewBox: 0 0 100 120
 */
export default function CroatianKnight({ size = 80, mood = 'neutral', className = '', style = {} }) {

  // ── MOOD LOGIC ────────────────────────────────────────────────────────────
  const isConfused = mood === 'confused';
  const isCelebrating = mood === 'celebrating';

  // Eye elements rendered above visor — keyed by mood
  const renderEyes = () => {
    switch (mood) {
      case 'happy':
        // Curved happy arcs (upward squint)
        return (
          <>
            <path d="M 41 22 Q 44 19 47 22" stroke="#1e3a5f" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M 53 22 Q 56 19 59 22" stroke="#1e3a5f" strokeWidth="2" fill="none" strokeLinecap="round" />
            <circle cx="43" cy="24" r="1.2" fill="#f87171" opacity="0.45" />
            <circle cx="57" cy="24" r="1.2" fill="#f87171" opacity="0.45" />
          </>
        );
      case 'celebrating':
        return (
          <>
            {/* Wide-open circle eyes */}
            <circle cx="44" cy="21" r="3" fill="#1e3a5f" />
            <circle cx="56" cy="21" r="3" fill="#1e3a5f" />
            <circle cx="44.9" cy="20.1" r="1" fill="white" />
            <circle cx="56.9" cy="20.1" r="1" fill="white" />
            {/* Star sparkles at eye corners */}
            <text x="38" y="19" fontSize="4" fill="#FFE070" textAnchor="middle">★</text>
            <text x="62" y="19" fontSize="4" fill="#FFE070" textAnchor="middle">★</text>
            {/* Rosy cheeks */}
            <circle cx="41" cy="25" r="2.5" fill="#f87171" opacity="0.4" />
            <circle cx="59" cy="25" r="2.5" fill="#f87171" opacity="0.4" />
          </>
        );
      case 'thinking':
        // One eye slightly larger
        return (
          <>
            <circle cx="44" cy="21" r="2.5" fill="#1e3a5f" />
            <circle cx="56" cy="21" r="3.2" fill="#1e3a5f" />
            <circle cx="44.7" cy="20.3" r="0.9" fill="white" />
            <circle cx="56.9" cy="20.3" r="1.1" fill="white" />
            {/* Hand-to-chin: small rect at jaw */}
            <rect x="46" y="30" width="8" height="3" rx="1.5" fill="#b8cce4" opacity="0.7" />
          </>
        );
      case 'sad':
        // Drooping inner-corner eyes
        return (
          <>
            <path d="M 41 23 Q 44 21 47 20" stroke="#1e3a5f" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M 53 20 Q 56 21 59 23" stroke="#1e3a5f" strokeWidth="2" fill="none" strokeLinecap="round" />
            {/* Downward mouth */}
            <path d="M 44 30 Q 50 27 56 30" stroke="#1e3a5f" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            {/* Tear drops */}
            <ellipse cx="43" cy="26" rx="1" ry="1.5" fill="#93c5fd" opacity="0.7" />
          </>
        );
      case 'encouraged':
        return (
          <>
            <circle cx="44" cy="21" r="2.5" fill="#1e3a5f" />
            <circle cx="56" cy="21" r="2.5" fill="#1e3a5f" />
            <circle cx="44.7" cy="20.3" r="0.9" fill="white" />
            <circle cx="56.7" cy="20.3" r="0.9" fill="white" />
            {/* Raised brows */}
            <rect x="41" y="16" width="6" height="1.5" rx="0.75" fill="#1e3a5f" />
            <rect x="53" y="16" width="6" height="1.5" rx="0.75" fill="#1e3a5f" />
            {/* Half-smile */}
            <path d="M 44 29 Q 50 33 56 29" stroke="#1e3a5f" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </>
        );
      case 'confused':
        return (
          <>
            {/* One eye larger */}
            <circle cx="44" cy="21" r="2" fill="#1e3a5f" />
            <circle cx="56" cy="21" r="3.2" fill="#1e3a5f" />
            <circle cx="44.6" cy="20.4" r="0.7" fill="white" />
            <circle cx="56.9" cy="20.3" r="1.1" fill="white" />
            {/* Wavy confused mouth */}
            <path d="M 44 29 Q 47 31 50 29 Q 53 27 56 29" stroke="#1e3a5f" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            {/* ? near helmet */}
            <text x="68" y="18" fontSize="8" fill="#FFE070" fontWeight="900" textAnchor="middle">?</text>
          </>
        );
      default:
        // neutral
        return (
          <>
            <circle cx="44" cy="21" r="2.5" fill="#1e3a5f" />
            <circle cx="56" cy="21" r="2.5" fill="#1e3a5f" />
            <circle cx="44.7" cy="20.3" r="0.9" fill="white" />
            <circle cx="56.7" cy="20.3" r="0.9" fill="white" />
          </>
        );
    }
  };

  // ── CONFETTI (celebrating) ────────────────────────────────────────────────
  const confettiPieces = [
    { x: 10, y: 18, w: 5, h: 3, color: '#D40030', rotate: 20 },
    { x: 22, y: 10, w: 3, h: 5, color: '#FFE070', rotate: -15 },
    { x: 70, y: 12, w: 5, h: 3, color: '#38bdf8', rotate: 30 },
    { x: 80, y: 24, w: 3, h: 5, color: '#16a34a', rotate: -10 },
    { x: 14, y: 36, w: 4, h: 3, color: '#38bdf8', rotate: 45 },
    { x: 82, y: 40, w: 3, h: 4, color: '#D40030', rotate: -35 },
    { x: 6,  y: 55, w: 4, h: 3, color: '#FFE070', rotate: 10 },
    { x: 88, y: 60, w: 3, h: 4, color: '#16a34a', rotate: 25 },
  ];

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <svg
      width={size}
      height={size * 1.5}
      viewBox="0 0 100 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      role="img"
      aria-label={`Croatian knight mascot, ${mood} expression`}
      transform={isConfused ? 'rotate(-4)' : undefined}
    >
      <defs>
        {/* Steel armor — metallic blue-steel */}
        <linearGradient id="ck-steelArmor" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#b8cce4" />
          <stop offset="100%" stopColor="#5c7a9e" />
        </linearGradient>
        {/* Deep armor shadow */}
        <linearGradient id="ck-deepArmor" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4a6080" />
          <stop offset="100%" stopColor="#2d3d52" />
        </linearGradient>
        {/* Croatian gold trim */}
        <linearGradient id="ck-goldTrim" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFE070" />
          <stop offset="100%" stopColor="#C8980A" />
        </linearGradient>
        {/* Warm skin tone */}
        <linearGradient id="ck-skinTone" x1="0%" y1="0%" x2="30%" y2="100%">
          <stop offset="0%" stopColor="#fad4b0" />
          <stop offset="100%" stopColor="#e8a87c" />
        </linearGradient>
        {/* Crimson plume */}
        <linearGradient id="ck-plume" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#7f1d1d" />
        </linearGradient>
        {/* Dark red cape */}
        <linearGradient id="ck-cape" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#7f1d1d" />
          <stop offset="100%" stopColor="#450a0a" />
        </linearGradient>
        {/* Šahovnica shield clip */}
        <clipPath id="ck-shieldClip">
          <path d="M 8 50 L 8 76 Q 8 88 20 94 L 26 88 L 26 50 Z" />
        </clipPath>
      </defs>

      {/* ── GROUND SHADOW ─────────────────────────────────── */}
      <ellipse cx="50" cy="118" rx="28" ry="3" fill="rgba(0,0,0,0.15)" />

      {/* ── CELEBRATING CONFETTI (behind knight) ─────────── */}
      {isCelebrating && confettiPieces.map((p, i) => (
        <rect
          key={i}
          x={p.x} y={p.y}
          width={p.w} height={p.h}
          rx="0.5"
          fill={p.color}
          opacity="0.9"
          transform={`rotate(${p.rotate} ${p.x + p.w / 2} ${p.y + p.h / 2})`}
        />
      ))}

      <g filter="drop-shadow(0px 2px 5px rgba(0,0,0,0.22))">

        {/* ── CAPE (behind body — render first) ────────────── */}
        <path d="M 28 46 Q 18 60 20 90 L 30 86 L 30 80 L 28 46" fill="url(#ck-cape)" />
        <path d="M 72 46 Q 82 60 80 90 L 70 86 L 70 80 L 72 46" fill="url(#ck-cape)" />

        {/* ── LEGS ──────────────────────────────────────────── */}
        {/* Left leg */}
        <rect x="32" y="84" width="14" height="28" rx="3" fill="url(#ck-steelArmor)" />
        {/* Right leg */}
        <rect x="54" y="84" width="14" height="28" rx="3" fill="url(#ck-steelArmor)" />
        {/* Gold shin stripes */}
        <rect x="38" y="86" width="2" height="20" rx="1" fill="url(#ck-goldTrim)" opacity="0.55" />
        <rect x="60" y="86" width="2" height="20" rx="1" fill="url(#ck-goldTrim)" opacity="0.55" />
        {/* Knee guards */}
        <rect x="30" y="95" width="18" height="6" rx="2" fill="url(#ck-deepArmor)" />
        <rect x="52" y="95" width="18" height="6" rx="2" fill="url(#ck-deepArmor)" />
        {/* Boots */}
        <rect x="31" y="108" width="16" height="8" rx="2" fill="#1a1a2e" />
        <rect x="53" y="108" width="16" height="8" rx="2" fill="#1a1a2e" />

        {/* ── BODY / TORSO ──────────────────────────────────── */}
        {/* Chest armor trapezoid */}
        <path d="M 28 46 L 72 46 L 68 80 L 32 80 Z" fill="url(#ck-steelArmor)" />
        {/* Chest center gold stripe */}
        <rect x="48.5" y="46" width="3" height="34" rx="1" fill="url(#ck-goldTrim)" opacity="0.7" />
        {/* Chest highlight sheen */}
        <ellipse cx="44" cy="58" rx="5" ry="8" fill="rgba(255,255,255,0.12)" />

        {/* ── PAULDRONS (shoulders) ─────────────────────────── */}
        <path d="M 22 44 Q 18 42 20 54 Q 22 58 30 56 L 30 44 Z" fill="url(#ck-steelArmor)" />
        <path d="M 78 44 Q 82 42 80 54 Q 78 58 70 56 L 70 44 Z" fill="url(#ck-steelArmor)" />
        {/* Gold shoulder edge highlights */}
        <path d="M 22 44 Q 18 42 20 54" stroke="url(#ck-goldTrim)" strokeWidth="1.2" fill="none" />
        <path d="M 78 44 Q 82 42 80 54" stroke="url(#ck-goldTrim)" strokeWidth="1.2" fill="none" />

        {/* ── BELT ──────────────────────────────────────────── */}
        <rect x="30" y="78" width="40" height="6" rx="2" fill="url(#ck-deepArmor)" />
        {/* Belt buckle */}
        <rect x="46" y="79" width="8" height="4" rx="1" fill="url(#ck-goldTrim)" />

        {/* ── SHIELD (left arm) ─────────────────────────────── */}
        {/* Left arm holding shield */}
        <rect x="26" y="56" width="8" height="24" rx="3" fill="url(#ck-steelArmor)" />
        {/* Shield body — heater shape */}
        <path
          d="M 8 50 L 8 76 Q 8 88 20 94 L 26 88 L 26 50 Z"
          fill="#D40030"
          stroke="url(#ck-goldTrim)"
          strokeWidth="1.5"
        />
        {/* Šahovnica — 2×3 checkerboard clipped to shield */}
        <g clipPath="url(#ck-shieldClip)">
          {[0, 1].map(col =>
            [0, 1, 2].map(row => (
              <rect
                key={`shd-${col}-${row}`}
                x={8 + col * 9}
                y={52 + row * 13}
                width={9}
                height={13}
                fill={(col + row) % 2 === 0 ? '#D40030' : 'white'}
              />
            ))
          )}
        </g>
        {/* Shield border overlay (on top of šahovnica) */}
        <path
          d="M 8 50 L 8 76 Q 8 88 20 94 L 26 88 L 26 50 Z"
          fill="none"
          stroke="url(#ck-goldTrim)"
          strokeWidth="1.5"
        />

        {/* ── SWORD (right arm, pointing upward) ────────────── */}
        {/* Right arm */}
        <rect x="68" y="56" width="8" height="20" rx="3" fill="url(#ck-steelArmor)" />
        {/* Blade */}
        <rect x="72" y="16" width="4" height="56" rx="2" fill="#d1d5db" />
        {/* Blade shine */}
        <rect x="73" y="16" width="2" height="56" fill="white" opacity="0.6" />
        {/* Sword tip */}
        <polygon points="72,16 76,16 74,8" fill="#d1d5db" />
        {/* Crossguard */}
        <rect x="66" y="60" width="16" height="5" rx="2" fill="url(#ck-goldTrim)" />
        {/* Grip */}
        <rect x="73" y="65" width="4" height="12" rx="2" fill="#92400e" />
        {/* Pommel */}
        <circle cx="75" cy="80" r="4" fill="url(#ck-goldTrim)" />

        {/* ── NECK & GORGET ─────────────────────────────────── */}
        <rect x="45" y="34" width="10" height="6" rx="2" fill="url(#ck-skinTone)" />
        {/* Gorget (collar armor) */}
        <rect x="40" y="38" width="20" height="8" rx="3" fill="url(#ck-steelArmor)" />
        {/* Gold gorget rim */}
        <rect x="40" y="38" width="20" height="2" rx="1" fill="url(#ck-goldTrim)" opacity="0.8" />

        {/* ── HEAD & HELMET ──────────────────────────────────── */}
        {/* Face ellipse */}
        <ellipse cx="50" cy="26" rx="12" ry="13" fill="url(#ck-skinTone)" />

        {/* Helmet dome — curved path over the head */}
        <path d="M 38 26 Q 36 12 50 10 Q 64 12 62 26" fill="url(#ck-steelArmor)" />

        {/* Cheek guards */}
        <rect x="35" y="22" width="6" height="12" rx="3" fill="url(#ck-steelArmor)" />
        <rect x="59" y="22" width="6" height="12" rx="3" fill="url(#ck-steelArmor)" />

        {/* Helmet gold rim */}
        <rect x="36" y="21" width="28" height="3" rx="1" fill="url(#ck-goldTrim)" />

        {/* Visor/brow — dark covering the upper eye zone when helmeted */}
        <rect x="37" y="22" width="26" height="8" rx="3" fill="url(#ck-deepArmor)" />

        {/* Visor slit — eye opening */}
        <rect x="38" y="25" width="24" height="3" rx="1" fill="rgba(0,0,0,0.8)" />

        {/* ── MOOD EYES (float above/in visor) ─────────────── */}
        {renderEyes()}

        {/* ── HELMET PLUME ──────────────────────────────────── */}
        <path
          d="M 58 12 Q 72 8 74 4 Q 72 2 68 4 Q 72 6 62 14"
          fill="url(#ck-plume)"
          stroke="#991b1b"
          strokeWidth="0.5"
        />

        {/* Helmet top crest ridge */}
        <rect x="47.5" y="10" width="5" height="14" rx="2.5" fill="url(#ck-steelArmor)" />

      </g>
    </svg>
  );
}
