import React from 'react';
import type { PlaceId } from './places';
import type { PlaceLife } from './gradModel';

/**
 * GradTownArt — animated golden-hour harbour hero for the Karta.
 *
 * Ambient layers are always on (CSS-driven, reduced-motion-gated by GradMap's
 * <style>): #km-clouds drift, #km-waves shimmer, #km-glint sun-glint,
 * #km-boat-1 bob, #km-ferry crossing, #km-gulls gliding, #km-flag flutter,
 * .km-cyp cypress sway, .km-twk twinkling windows.
 *
 * Per-district life groups <g data-place data-life> reveal each place's life as
 * it is mastered (dormant = hidden, partial/full = shown): café umbrellas ←
 * Kavana, chimney smoke ← Kuhinja, market awning ← Tržnica, lit church/figures
 * ← Trg, street taxi ← Ulica, warm window ← Soba. Pure presentational.
 *
 * Art ported from the approved mockup karta-hero-list-v5.html (viewBox 400x275).
 */
export default function GradTownArt({ lifeByPlace }: { lifeByPlace: Record<PlaceId, PlaceLife> }) {
  return (
    <svg
      data-testid="grad-town-art"
      viewBox="0 0 400 275"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
    >
      <defs>
        <linearGradient id="sky5" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe9c6" />
          <stop offset=".55" stopColor="#ffd6a2" />
          <stop offset="1" stopColor="#ffe2c6" />
        </linearGradient>
        <radialGradient id="sun5" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#fff6d4" />
          <stop offset=".45" stopColor="#ffdc7e" />
          <stop offset="1" stopColor="#ffdc7e" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="sea5" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#69c4cf" />
          <stop offset=".45" stopColor="#2ea3bb" />
          <stop offset="1" stopColor="#0c6373" />
        </linearGradient>
        <linearGradient id="st5" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6efe0" />
          <stop offset="1" stopColor="#e7d8bd" />
        </linearGradient>
        <g id="hh">
          <rect x="0" y="6" width="38" height="40" rx="1.5" fill="url(#st5)" />
          <rect x="25" y="6" width="13" height="40" fill="#000" opacity=".08" />
          <polygon points="-3,7 19,-7 41,7" fill="#c2410c" />
          <rect x="7" y="15" width="6" height="8" rx="1" fill="#7ea7b0" />
          <rect x="24" y="15" width="6" height="8" rx="1" fill="#6b96a0" />
        </g>
        <g id="hh2">
          <rect x="0" y="6" width="34" height="40" rx="1.5" fill="#efe4cf" />
          <rect x="22" y="6" width="12" height="40" fill="#000" opacity=".09" />
          <polygon points="-3,7 17,-6 37,7" fill="#b8390b" />
          <rect x="6" y="15" width="6" height="8" rx="1" fill="#86b0b9" />
        </g>
      </defs>

      <rect width="400" height="200" fill="url(#sky5)" />
      <circle cx="306" cy="60" r="90" fill="url(#sun5)" />
      <circle cx="306" cy="60" r="30" fill="#ffe49a" />

      <g id="km-clouds" opacity=".85">
        <ellipse cx="70" cy="44" rx="38" ry="12" fill="#fff7ea" />
        <ellipse cx="102" cy="38" rx="26" ry="10" fill="#fff7ea" />
      </g>

      {/* headland */}
      <path d="M0 150 Q120 116 250 142 Q340 162 400 140 L400 180 L0 180 Z" fill="#bcd3c2" />
      <path d="M0 162 Q160 132 320 154 Q380 164 400 154 L400 190 L0 190 Z" fill="#a3c4ae" />

      {/* town tiers */}
      <use href="#hh2" x="70" y="120" width="32" height="38" />
      <use href="#hh" x="108" y="116" width="36" height="42" />
      <g>
        <rect x="200" y="120" width="34" height="38" fill="#efe6d2" />
        <path d="M200 120 q17 -28 34 0 Z" fill="#7c9ba2" />
      </g>
      <g>
        <rect x="242" y="96" width="22" height="62" rx="1.5" fill="#eee2cb" />
        <rect x="255" y="96" width="9" height="62" fill="#000" opacity=".08" />
        <rect x="246" y="120" width="6" height="12" rx="3" fill="#6f9aa3" />
        <polygon points="238,96 253,78 268,96" fill="#b8390b" />
        <line x1="253" y1="78" x2="253" y2="69" stroke="#9c7b45" strokeWidth="2.4" />
        {/* Pennant attached along the top of the pole (staff edge on x=253, pole top y=69). */}
        <polygon id="km-flag" points="253,69 270,73 253,77" fill="#D40030" />
      </g>
      <use href="#hh" x="284" y="120" width="36" height="42" />
      <use href="#hh2" x="150" y="124" width="32" height="38" />
      <use href="#hh" x="92" y="150" width="40" height="46" />
      <use href="#hh2" x="278" y="150" width="36" height="42" />

      <g className="km-cyp">
        <ellipse cx="58" cy="146" rx="6" ry="20" fill="#3f6b46" />
      </g>
      <g className="km-cyp" style={{ animationDelay: '1.5s' }}>
        <ellipse cx="190" cy="144" rx="6" ry="20" fill="#46734c" />
      </g>

      {/* ambient twinkling windows */}
      <g className="km-twk" fill="#ffce5a">
        <rect x="104" y="166" width="5" height="8" />
      </g>
      <g className="km-twk" style={{ animationDelay: '1.6s' }} fill="#ffce5a">
        <rect x="292" y="166" width="5" height="8" />
      </g>

      {/* ── Per-district life ─────────────────────────────────────────── */}

      {/* Tržnica — market awning by the quay */}
      <g data-place="trznica" data-life={lifeByPlace.trznica}>
        <rect x="150" y="180" width="30" height="3" fill="#8a5a2b" />
        <path d="M148 180 q4 -7 8 0 q4 -7 8 0 q4 -7 8 0 q4 -7 8 0 z" fill="#c2410c" opacity=".9" />
        <rect x="153" y="183" width="3" height="7" fill="#6b5b3e" />
        <rect x="174" y="183" width="3" height="7" fill="#6b5b3e" />
      </g>

      {/* Trg — lit church windows + two figures on the square */}
      <g data-place="trg" data-life={lifeByPlace.trg}>
        <rect x="248" y="122" width="4" height="8" fill="#ffd66b" />
        <rect x="212" y="132" width="6" height="9" rx="1" fill="#ffd66b" />
        <circle cx="196" cy="186" r="2.4" fill="#5b4a6b" />
        <circle cx="204" cy="187" r="2.4" fill="#7c3a4a" />
      </g>

      {/* Kuhinja — chimney smoke */}
      <g data-place="kuhinja" data-life={lifeByPlace.kuhinja}>
        <circle className="km-smoke" cx="128" cy="112" r="5" fill="#dfe5e7" />
        <circle
          className="km-smoke"
          style={{ animationDelay: '2s' }}
          cx="132"
          cy="112"
          r="4"
          fill="#eaeef0"
        />
      </g>

      {/* waterfront */}
      <rect x="0" y="190" width="400" height="11" fill="#e3d4b6" />

      {/* Kavana — café umbrellas on the waterfront */}
      <g data-place="kavana" data-life={lifeByPlace.kavana}>
        <path d="M82 190 l0 -11" stroke="#6b5b3e" strokeWidth="2" />
        <path d="M71 179 q11 -9 22 0 z" fill="#0e7490" />
        <path d="M102 190 l0 -11" stroke="#6b5b3e" strokeWidth="2" />
        <path d="M91 179 q11 -9 22 0 z" fill="#D40030" />
      </g>

      {/* Ulica — a little taxi on the street */}
      <g data-place="ulica" data-life={lifeByPlace.ulica}>
        <rect x="298" y="184" width="20" height="6" rx="2" fill="#e8b923" />
        <rect x="302" y="180" width="11" height="5" rx="1.5" fill="#f3d24a" />
        <circle cx="303" cy="190" r="2" fill="#3a3a3a" />
        <circle cx="314" cy="190" r="2" fill="#3a3a3a" />
      </g>

      {/* Soba — one warm lit window */}
      <g data-place="soba" data-life={lifeByPlace.soba}>
        <rect x="300" y="133" width="6" height="9" rx="1" fill="#ffce5a" />
      </g>

      {/* sea */}
      <rect x="0" y="201" width="400" height="74" fill="url(#sea5)" />
      <g id="km-glint" fill="#ffe9b0">
        <rect x="288" y="208" width="32" height="4" rx="2" />
        <rect x="282" y="220" width="44" height="4" rx="2" />
      </g>
      <g id="km-waves">
        <g stroke="#d8f3f7" strokeWidth="3" strokeLinecap="round" opacity=".55">
          <path d="M30 232 q16 -6 32 0 t32 0" fill="none" />
          <path d="M250 226 q16 -6 32 0 t32 0" fill="none" />
        </g>
        <g stroke="#bfeaf0" strokeWidth="3" strokeLinecap="round" opacity=".5">
          <path d="M100 256 q18 -6 36 0 t36 0" fill="none" />
          <path d="M280 252 q18 -6 36 0 t36 0" fill="none" />
        </g>
      </g>
      {/* Ferry — hull sits in the water (below the y=201 surface), deck above it.
          The wake rides inside the group so it tracks the horizontal drift. */}
      <g id="km-ferry">
        <g transform="translate(26,186)">
          <ellipse cx="23" cy="17" rx="30" ry="2.5" fill="#bfeaf0" opacity=".5" />
          <rect x="0" y="5" width="46" height="11" rx="3" fill="#eef2f4" />
          <rect x="6" y="-2" width="32" height="8" rx="2" fill="#cfdadf" />
          <path d="M0 16 l46 0 l-6 6 l-34 0 z" fill="#3a6b78" />
        </g>
      </g>
      {/* Sailboat — hull in the water, sail rising above the surface. Static wake
          (the boat only bobs in place, so it stays over the wake). */}
      <ellipse cx="170" cy="213" rx="26" ry="2.5" fill="#bfeaf0" opacity=".5" />
      <g id="km-boat-1" transform="translate(150,188)">
        <path d="M-4 16 q24 14 48 0 l-6 10 q-18 6 -36 0 z" fill="#8a5a2b" />
        <polygon points="20,16 20,-10 42,14" fill="#fff" />
        <line x1="20" y1="16" x2="20" y2="-14" stroke="#5b4a2e" strokeWidth="2" />
      </g>
      <g id="km-gulls">
        <path d="M8 50 q7 -7 14 0 q7 -7 14 0" fill="none" stroke="#5b6b73" strokeWidth="2.2" />
        <path d="M0 74 q5 -5 10 0 q5 -5 10 0" fill="none" stroke="#5b6b73" strokeWidth="1.8" />
      </g>
    </svg>
  );
}
