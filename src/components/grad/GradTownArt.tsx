import React from 'react';

/**
 * GradTownArt — the flat-vector Adriatic town, rendered inline (not via <img>)
 * so the ambient layers can animate via CSS. Converted from the former
 * public/images/grad-town.svg. Animatable layers carry stable ids:
 *   #km-waves  — sea foam lines (shimmer)
 *   #km-glint  — warm sun glints on the water
 *   #km-boat-1 / #km-boat-2 — sailboats (gentle bob)
 * Motion is defined + reduced-motion-gated by GradMap's inline <style>.
 */
export default function GradTownArt() {
  return (
    <svg
      data-testid="grad-town-art"
      viewBox="0 0 392 690"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe7c2" />
          <stop offset="0.55" stopColor="#ffd49a" />
          <stop offset="1" stopColor="#ffe9cf" />
        </linearGradient>
        <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9fd6db" />
          <stop offset="0.35" stopColor="#5cb3bf" />
          <stop offset="0.75" stopColor="#1f8c9c" />
          <stop offset="1" stopColor="#0e6f80" />
        </linearGradient>
        <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff3c4" />
          <stop offset="0.5" stopColor="#ffd166" />
          <stop offset="1" stopColor="#ffd166" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="land" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f3ead6" />
          <stop offset="1" stopColor="#e3d3b3" />
        </linearGradient>
        <symbol id="hs" viewBox="0 0 40 52">
          <rect x="4" y="16" width="32" height="36" rx="1.5" fill="#f6efe1" />
          <rect x="24" y="16" width="12" height="36" fill="#000" opacity="0.07" />
          <polygon points="2,18 20,4 38,18" fill="#c2410c" />
          <polygon points="20,4 38,18 2,18" fill="#fff" opacity="0.10" />
          <line x1="2" y1="18" x2="38" y2="18" stroke="#9c3411" strokeWidth="1.2" />
          <rect x="9" y="23" width="7" height="9" rx="1" fill="#8fb7c0" />
          <rect
            x="9"
            y="23"
            width="7"
            height="9"
            rx="1"
            fill="none"
            stroke="#5d7f88"
            strokeWidth="0.8"
          />
          <rect x="23" y="23" width="7" height="9" rx="1" fill="#7da7b0" />
          <rect x="9" y="38" width="7" height="9" rx="1" fill="#8fb7c0" />
          <rect x="17" y="40" width="6" height="12" rx="1" fill="#9c6b3f" />
        </symbol>
        <symbol id="hs2" viewBox="0 0 40 52">
          <rect x="5" y="16" width="30" height="36" rx="1.5" fill="#efe6d2" />
          <rect x="22" y="16" width="13" height="36" fill="#000" opacity="0.08" />
          <polygon points="3,18 20,5 37,18" fill="#d6753f" />
          <line x1="3" y1="18" x2="37" y2="18" stroke="#a85426" strokeWidth="1.2" />
          <rect x="10" y="24" width="6" height="8" rx="1" fill="#86b0b9" />
          <rect x="24" y="24" width="6" height="8" rx="1" fill="#6f9aa3" />
          <rect x="16" y="40" width="7" height="12" rx="1" fill="#8a5e37" />
        </symbol>
        <symbol id="cyp" viewBox="0 0 20 56">
          <ellipse cx="10" cy="26" rx="7" ry="26" fill="#3f6b46" />
          <ellipse cx="8" cy="24" rx="4" ry="22" fill="#4f7c54" />
        </symbol>
      </defs>

      <rect x="0" y="0" width="392" height="250" fill="url(#sky)" />
      <circle cx="312" cy="70" r="70" fill="url(#sun)" />
      <circle cx="312" cy="70" r="26" fill="#ffdf85" />
      <path
        d="M60 60 q8 -7 16 0 q8 -7 16 0"
        stroke="#b98a55"
        strokeWidth="2"
        fill="none"
        opacity="0.6"
      />
      <path
        d="M110 44 q6 -5 12 0 q6 -5 12 0"
        stroke="#b98a55"
        strokeWidth="2"
        fill="none"
        opacity="0.5"
      />

      <path
        d="M0 150 q70 -46 150 -20 q60 20 130 -6 q60 -22 112 6 L392 250 L0 250 Z"
        fill="#a9c6a2"
        opacity="0.85"
      />
      <path
        d="M0 178 q90 -34 180 -8 q90 26 212 -6 L392 250 L0 250 Z"
        fill="#8db886"
        opacity="0.9"
      />

      <rect x="0" y="226" width="392" height="464" fill="url(#sea)" />
      <ellipse cx="320" cy="250" rx="64" ry="9" fill="#2c7e8a" opacity="0.55" />
      <g id="km-waves" stroke="#ffffff" strokeWidth="1.4" opacity="0.30" strokeLinecap="round">
        <line x1="30" y1="300" x2="70" y2="300" />
        <line x1="120" y1="330" x2="168" y2="330" />
        <line x1="250" y1="320" x2="300" y2="320" />
        <line x1="60" y1="470" x2="120" y2="470" />
        <line x1="220" y1="500" x2="290" y2="500" />
        <line x1="300" y1="430" x2="350" y2="430" />
        <line x1="40" y1="560" x2="110" y2="560" />
        <line x1="250" y1="600" x2="330" y2="600" />
      </g>
      <g id="km-glint" fill="#ffe9b0" opacity="0.5">
        <rect x="305" y="258" width="20" height="3" rx="1.5" />
        <rect x="300" y="270" width="30" height="3" rx="1.5" />
        <rect x="308" y="282" width="16" height="3" rx="1.5" />
      </g>

      <path
        d="M70 250 Q60 360 120 470 Q196 540 280 460 Q336 360 322 250 Q196 214 70 250 Z"
        fill="url(#land)"
      />
      <path
        d="M70 250 Q196 214 322 250 Q320 262 196 258 Q90 258 70 250 Z"
        fill="#fff"
        opacity="0.25"
      />
      <path
        d="M104 452 Q196 520 290 448"
        stroke="#cdb083"
        strokeWidth="9"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M104 452 Q196 520 290 448"
        stroke="#b8995f"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        opacity="0.6"
      />

      <use href="#cyp" x="78" y="300" width="16" height="46" />
      <use href="#cyp" x="300" y="300" width="16" height="46" />
      <use href="#cyp" x="150" y="430" width="14" height="40" />

      <use href="#hs2" x="96" y="300" width="40" height="52" />
      <use href="#hs" x="132" y="296" width="40" height="52" />
      <use href="#hs2" x="170" y="300" width="40" height="52" />
      <use href="#hs" x="208" y="296" width="40" height="52" />
      <use href="#hs2" x="244" y="302" width="40" height="52" />
      <use href="#hs" x="86" y="346" width="40" height="52" />
      <use href="#hs2" x="124" y="350" width="40" height="52" />
      <use href="#hs" x="200" y="350" width="40" height="52" />
      <use href="#hs2" x="240" y="350" width="40" height="52" />
      <use href="#hs" x="120" y="398" width="38" height="50" />
      <use href="#hs2" x="216" y="398" width="38" height="50" />

      <g>
        <rect x="178" y="250" width="26" height="74" rx="2" fill="#f3e8d2" />
        <rect x="192" y="250" width="12" height="74" fill="#000" opacity="0.07" />
        <rect x="184" y="268" width="14" height="16" rx="2" fill="#6f9aa3" />
        <circle cx="191" cy="262" r="3.2" fill="#cdb083" stroke="#9c7b45" strokeWidth="0.8" />
        <polygon points="174,250 191,228 208,250" fill="#c2410c" />
        <polygon points="191,228 208,250 174,250" fill="#fff" opacity="0.10" />
        <rect x="189" y="219" width="4" height="11" fill="#9c7b45" />
        <circle cx="191" cy="218" r="2.4" fill="#e6c463" />
      </g>

      <g transform="translate(96,406)">
        <g id="km-boat-1">
          <polygon points="0,18 26,18 20,26 6,26" fill="#e9e2d2" />
          <line x1="13" y1="18" x2="13" y2="-4" stroke="#7a5a32" strokeWidth="2" />
          <polygon points="13,-3 13,15 1,15" fill="#ffffff" />
          <polygon points="14,-1 14,14 25,14" fill="#cfe3e6" />
        </g>
      </g>
      <g transform="translate(252,498) scale(0.8)">
        <g id="km-boat-2">
          <polygon points="0,18 26,18 20,26 6,26" fill="#e9e2d2" />
          <line x1="13" y1="18" x2="13" y2="-4" stroke="#7a5a32" strokeWidth="2" />
          <polygon points="13,-3 13,15 1,15" fill="#ffffff" />
          <polygon points="14,-1 14,14 25,14" fill="#f6c9b0" />
        </g>
      </g>
    </svg>
  );
}
