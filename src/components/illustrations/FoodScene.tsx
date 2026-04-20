import React from 'react';

export default function FoodScene() {
  return (
    <svg
      width="280"
      height="180"
      viewBox="0 0 280 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Croatian dining table"
    >
      <defs>
        {/* Background warm kitchen */}
        <radialGradient id="vs-food-bg" cx="50%" cy="45%" r="65%">
          <stop offset="0%" stopColor="#FFF3E0" />
          <stop offset="60%" stopColor="#FFE0B2" />
          <stop offset="100%" stopColor="#FFCC80" />
        </radialGradient>
        {/* Wooden table */}
        <linearGradient id="vs-food-wood" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#A0522D" />
          <stop offset="40%" stopColor="#8B4513" />
          <stop offset="100%" stopColor="#6B3410" />
        </linearGradient>
        {/* Tablecloth */}
        <linearGradient id="vs-food-cloth" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFDF8" />
          <stop offset="100%" stopColor="#FFF0DC" />
        </linearGradient>
        {/* Peka clay */}
        <radialGradient id="vs-food-peka" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#7A3B1E" />
          <stop offset="50%" stopColor="#5C2A10" />
          <stop offset="100%" stopColor="#3E1A08" />
        </radialGradient>
        {/* Steam glow behind peka */}
        <radialGradient id="vs-food-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FF8C42" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#FF8C42" stopOpacity="0" />
        </radialGradient>
        {/* Wine */}
        <linearGradient id="vs-food-wine" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C62828" />
          <stop offset="100%" stopColor="#6A0000" />
        </linearGradient>
        {/* Bread */}
        <radialGradient id="vs-food-bread" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#F5C842" />
          <stop offset="50%" stopColor="#D4A017" />
          <stop offset="100%" stopColor="#A0700A" />
        </radialGradient>
        {/* Olive oil bottle */}
        <linearGradient id="vs-food-oil" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9DC43B" />
          <stop offset="50%" stopColor="#7A9E28" />
          <stop offset="100%" stopColor="#5A7B14" />
        </linearGradient>
        {/* Table legs */}
        <linearGradient id="vs-food-leg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6B3410" />
          <stop offset="100%" stopColor="#8B4513" />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width="280" height="180" fill="url(#vs-food-bg)" />

      {/* Warm glow behind peka */}
      <ellipse cx="140" cy="105" rx="55" ry="40" fill="url(#vs-food-glow)" />

      {/* Table legs */}
      <rect x="52" y="118" width="12" height="55" rx="3" fill="url(#vs-food-leg)" />
      <rect x="216" y="118" width="12" height="55" rx="3" fill="url(#vs-food-leg)" />

      {/* Wooden table top — trapezoid via polygon */}
      <polygon points="28,100 252,100 244,120 36,120" fill="url(#vs-food-wood)" />

      {/* Wood grain lines */}
      <path
        d="M 55 105 Q 120 102 190 106"
        stroke="#7A3B1E"
        strokeWidth="0.8"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M 45 110 Q 130 107 215 112"
        stroke="#7A3B1E"
        strokeWidth="0.8"
        fill="none"
        opacity="0.4"
      />
      <path
        d="M 50 116 Q 140 113 230 117"
        stroke="#7A3B1E"
        strokeWidth="0.7"
        fill="none"
        opacity="0.35"
      />
      <path
        d="M 70 103 Q 90 99 110 104"
        stroke="#9B5E3A"
        strokeWidth="0.5"
        fill="none"
        opacity="0.3"
      />

      {/* Tablecloth */}
      <polygon
        points="38,92 242,92 238,102 42,102"
        fill="url(#vs-food-cloth)"
        stroke="#EDE0CC"
        strokeWidth="0.8"
      />

      {/* ── Peka dish ── */}
      {/* Base ellipse (clay bottom rim) */}
      <ellipse cx="140" cy="97" rx="42" ry="9" fill="#3E1A08" opacity="0.9" />
      {/* Dome body */}
      <path d="M 98 97 Q 98 62 140 60 Q 182 62 182 97 Z" fill="url(#vs-food-peka)" />
      {/* Dome highlight */}
      <path
        d="M 110 85 Q 115 68 135 65"
        stroke="#A05530"
        strokeWidth="1.5"
        fill="none"
        opacity="0.6"
        strokeLinecap="round"
      />
      <path
        d="M 115 91 Q 118 78 130 74"
        stroke="#A05530"
        strokeWidth="1"
        fill="none"
        opacity="0.4"
        strokeLinecap="round"
      />
      {/* Handle knob on top */}
      <ellipse cx="140" cy="61" rx="7" ry="4" fill="#4A2010" />
      <ellipse cx="140" cy="59" rx="5" ry="2.5" fill="#6A3018" />

      {/* Steam wisps */}
      <path
        d="M 127 58 Q 123 50 127 42 Q 131 34 127 26"
        stroke="rgba(220,220,220,0.75)"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
      >
        <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
      </path>
      <path
        d="M 140 55 Q 136 47 140 39 Q 144 31 140 23"
        stroke="rgba(210,210,210,0.7)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      >
        <animate attributeName="opacity" values="1;0.5;1" dur="2.3s" repeatCount="indefinite" />
      </path>
      <path
        d="M 153 58 Q 157 50 153 42 Q 149 34 153 26"
        stroke="rgba(220,220,220,0.65)"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
      >
        <animate attributeName="opacity" values="0.7;1;0.7" dur="1.8s" repeatCount="indefinite" />
      </path>

      {/* ── Wine glass ── */}
      {/* Bowl */}
      <path
        d="M 55 65 Q 52 85 58 90 Q 63 94 70 94 Q 77 94 82 90 Q 88 85 85 65 Z"
        fill="url(#vs-food-wine)"
        opacity="0.88"
      />
      {/* Glass rim (transparent top) */}
      <ellipse
        cx="70"
        cy="66"
        rx="15"
        ry="3.5"
        fill="none"
        stroke="rgba(255,255,255,0.6)"
        strokeWidth="1.2"
      />
      {/* Wine surface glint */}
      <path d="M 58 72 Q 63 70 68 72" stroke="rgba(255,150,150,0.5)" strokeWidth="1" fill="none" />
      {/* Stem */}
      <rect x="68.5" y="94" width="3" height="18" fill="#CCCCCC" opacity="0.85" />
      {/* Base */}
      <ellipse cx="70" cy="112" rx="12" ry="3.5" fill="#BBBBBB" opacity="0.8" />
      {/* Glass sheen */}
      <path
        d="M 60 70 Q 57 80 59 88"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />

      {/* ── Bread loaf ── */}
      <ellipse cx="202" cy="91" rx="28" ry="13" fill="url(#vs-food-bread)" />
      {/* Crust edge */}
      <ellipse cx="202" cy="91" rx="28" ry="13" fill="none" stroke="#8B5E0A" strokeWidth="1.5" />
      {/* Score lines */}
      <path
        d="M 184 88 Q 190 82 198 86"
        stroke="#9B6B10"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 190 85 Q 196 79 204 83"
        stroke="#9B6B10"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 196 83 Q 202 77 210 82"
        stroke="#9B6B10"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 202 82 Q 208 77 216 82"
        stroke="#9B6B10"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
      />
      {/* Bread top highlight */}
      <ellipse cx="196" cy="85" rx="10" ry="5" fill="#F8D860" opacity="0.4" />

      {/* ── Olive oil bottle ── */}
      {/* Body */}
      <rect x="232" y="68" width="16" height="30" rx="3" fill="url(#vs-food-oil)" />
      {/* Neck */}
      <rect x="235" y="60" width="10" height="10" rx="2" fill="#6A8E20" />
      {/* Cork/cap */}
      <rect x="236" y="56" width="8" height="6" rx="2" fill="#C8A05A" />
      {/* Label */}
      <rect x="233" y="74" width="14" height="12" rx="1" fill="#F5F0DC" opacity="0.85" />
      <line x1="235" y1="78" x2="245" y2="78" stroke="#8B7A40" strokeWidth="0.8" />
      <line x1="235" y1="81" x2="245" y2="81" stroke="#8B7A40" strokeWidth="0.8" />
      {/* Bottle sheen */}
      <path
        d="M 235 70 L 235 95"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* ── Olive branch ── */}
      {/* Main stem */}
      <path
        d="M 20 75 Q 30 68 40 72 Q 50 76 58 70"
        stroke="#2D5A1B"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
      {/* Branch 1 */}
      <path d="M 30 71 Q 26 65 22 62" stroke="#2D5A1B" strokeWidth="1.2" fill="none" />
      {/* Branch 2 */}
      <path d="M 40 72 Q 38 66 35 62" stroke="#2D5A1B" strokeWidth="1.2" fill="none" />
      {/* Branch 3 */}
      <path d="M 50 70 Q 50 64 47 60" stroke="#2D5A1B" strokeWidth="1.2" fill="none" />
      {/* Leaves */}
      {[
        [21, 60, '-25'],
        [24, 63, '15'],
        [34, 60, '-20'],
        [37, 63, '20'],
        [46, 58, '-15'],
        [49, 61, '25'],
      ].map(([cx, cy, rot], i) => (
        <ellipse
          key={i}
          cx={cx}
          cy={cy}
          rx="5.5"
          ry="2.5"
          fill="#3A7A25"
          transform={`rotate(${rot} ${cx} ${cy})`}
        />
      ))}
      {/* Olive fruits */}
      <circle cx="26" cy="67" r="2.5" fill="#2D5A1B" />
      <circle cx="42" cy="69" r="2.5" fill="#4A8035" />
      <circle cx="54" cy="66" r="2.5" fill="#2D5A1B" />

      {/* ── Salt & Pepper ── */}
      {/* Salt */}
      <ellipse cx="16" cy="95" rx="6" ry="7" fill="#F5F5F5" stroke="#DDDDDD" strokeWidth="0.8" />
      <ellipse cx="16" cy="89" rx="6" ry="2.5" fill="#EEEEEE" />
      <circle cx="16" cy="89" r="1.5" fill="#AAAAAA" />
      {/* Pepper */}
      <ellipse cx="30" cy="95" rx="6" ry="7" fill="#333333" stroke="#222222" strokeWidth="0.8" />
      <ellipse cx="30" cy="89" rx="6" ry="2.5" fill="#2A2A2A" />
      <circle cx="30" cy="89" r="1.5" fill="#555555" />
    </svg>
  );
}
