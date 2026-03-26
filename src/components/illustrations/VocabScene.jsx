import React from 'react';

// ─── FoodScene ────────────────────────────────────────────────────────────────
export function FoodScene() {
  return (
    <svg width="280" height="180" viewBox="0 0 280 180" fill="none"
      xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Croatian dining table">
      <defs>
        {/* Background warm kitchen */}
        <radialGradient id="vs-food-bg" cx="50%" cy="45%" r="65%">
          <stop offset="0%" stopColor="#FFF3E0"/>
          <stop offset="60%" stopColor="#FFE0B2"/>
          <stop offset="100%" stopColor="#FFCC80"/>
        </radialGradient>
        {/* Wooden table */}
        <linearGradient id="vs-food-wood" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#A0522D"/>
          <stop offset="40%" stopColor="#8B4513"/>
          <stop offset="100%" stopColor="#6B3410"/>
        </linearGradient>
        {/* Tablecloth */}
        <linearGradient id="vs-food-cloth" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFDF8"/>
          <stop offset="100%" stopColor="#FFF0DC"/>
        </linearGradient>
        {/* Peka clay */}
        <radialGradient id="vs-food-peka" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#7A3B1E"/>
          <stop offset="50%" stopColor="#5C2A10"/>
          <stop offset="100%" stopColor="#3E1A08"/>
        </radialGradient>
        {/* Steam glow behind peka */}
        <radialGradient id="vs-food-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FF8C42" stopOpacity="0.35"/>
          <stop offset="100%" stopColor="#FF8C42" stopOpacity="0"/>
        </radialGradient>
        {/* Wine */}
        <linearGradient id="vs-food-wine" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C62828"/>
          <stop offset="100%" stopColor="#6A0000"/>
        </linearGradient>
        {/* Bread */}
        <radialGradient id="vs-food-bread" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#F5C842"/>
          <stop offset="50%" stopColor="#D4A017"/>
          <stop offset="100%" stopColor="#A0700A"/>
        </radialGradient>
        {/* Olive oil bottle */}
        <linearGradient id="vs-food-oil" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9DC43B"/>
          <stop offset="50%" stopColor="#7A9E28"/>
          <stop offset="100%" stopColor="#5A7B14"/>
        </linearGradient>
        {/* Table legs */}
        <linearGradient id="vs-food-leg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6B3410"/>
          <stop offset="100%" stopColor="#8B4513"/>
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width="280" height="180" fill="url(#vs-food-bg)"/>

      {/* Warm glow behind peka */}
      <ellipse cx="140" cy="105" rx="55" ry="40" fill="url(#vs-food-glow)"/>

      {/* Table legs */}
      <rect x="52" y="118" width="12" height="55" rx="3" fill="url(#vs-food-leg)"/>
      <rect x="216" y="118" width="12" height="55" rx="3" fill="url(#vs-food-leg)"/>

      {/* Wooden table top — trapezoid via polygon */}
      <polygon points="28,100 252,100 244,120 36,120" fill="url(#vs-food-wood)"/>

      {/* Wood grain lines */}
      <path d="M 55 105 Q 120 102 190 106" stroke="#7A3B1E" strokeWidth="0.8" fill="none" opacity="0.5"/>
      <path d="M 45 110 Q 130 107 215 112" stroke="#7A3B1E" strokeWidth="0.8" fill="none" opacity="0.4"/>
      <path d="M 50 116 Q 140 113 230 117" stroke="#7A3B1E" strokeWidth="0.7" fill="none" opacity="0.35"/>
      <path d="M 70 103 Q 90 99 110 104" stroke="#9B5E3A" strokeWidth="0.5" fill="none" opacity="0.3"/>

      {/* Tablecloth */}
      <polygon points="38,92 242,92 238,102 42,102" fill="url(#vs-food-cloth)" stroke="#EDE0CC" strokeWidth="0.8"/>

      {/* ── Peka dish ── */}
      {/* Base ellipse (clay bottom rim) */}
      <ellipse cx="140" cy="97" rx="42" ry="9" fill="#3E1A08" opacity="0.9"/>
      {/* Dome body */}
      <path d="M 98 97 Q 98 62 140 60 Q 182 62 182 97 Z" fill="url(#vs-food-peka)"/>
      {/* Dome highlight */}
      <path d="M 110 85 Q 115 68 135 65" stroke="#A05530" strokeWidth="1.5" fill="none" opacity="0.6" strokeLinecap="round"/>
      <path d="M 115 91 Q 118 78 130 74" stroke="#A05530" strokeWidth="1" fill="none" opacity="0.4" strokeLinecap="round"/>
      {/* Handle knob on top */}
      <ellipse cx="140" cy="61" rx="7" ry="4" fill="#4A2010"/>
      <ellipse cx="140" cy="59" rx="5" ry="2.5" fill="#6A3018"/>

      {/* Steam wisps */}
      <path d="M 127 58 Q 123 50 127 42 Q 131 34 127 26" stroke="rgba(220,220,220,0.75)" strokeWidth="2.2" fill="none" strokeLinecap="round">
        <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite"/>
      </path>
      <path d="M 140 55 Q 136 47 140 39 Q 144 31 140 23" stroke="rgba(210,210,210,0.7)" strokeWidth="2" fill="none" strokeLinecap="round">
        <animate attributeName="opacity" values="1;0.5;1" dur="2.3s" repeatCount="indefinite"/>
      </path>
      <path d="M 153 58 Q 157 50 153 42 Q 149 34 153 26" stroke="rgba(220,220,220,0.65)" strokeWidth="2.2" fill="none" strokeLinecap="round">
        <animate attributeName="opacity" values="0.7;1;0.7" dur="1.8s" repeatCount="indefinite"/>
      </path>

      {/* ── Wine glass ── */}
      {/* Bowl */}
      <path d="M 55 65 Q 52 85 58 90 Q 63 94 70 94 Q 77 94 82 90 Q 88 85 85 65 Z" fill="url(#vs-food-wine)" opacity="0.88"/>
      {/* Glass rim (transparent top) */}
      <ellipse cx="70" cy="66" rx="15" ry="3.5" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2"/>
      {/* Wine surface glint */}
      <path d="M 58 72 Q 63 70 68 72" stroke="rgba(255,150,150,0.5)" strokeWidth="1" fill="none"/>
      {/* Stem */}
      <rect x="68.5" y="94" width="3" height="18" fill="#CCCCCC" opacity="0.85"/>
      {/* Base */}
      <ellipse cx="70" cy="112" rx="12" ry="3.5" fill="#BBBBBB" opacity="0.8"/>
      {/* Glass sheen */}
      <path d="M 60 70 Q 57 80 59 88" stroke="rgba(255,255,255,0.35)" strokeWidth="2" fill="none" strokeLinecap="round"/>

      {/* ── Bread loaf ── */}
      <ellipse cx="202" cy="91" rx="28" ry="13" fill="url(#vs-food-bread)"/>
      {/* Crust edge */}
      <ellipse cx="202" cy="91" rx="28" ry="13" fill="none" stroke="#8B5E0A" strokeWidth="1.5"/>
      {/* Score lines */}
      <path d="M 184 88 Q 190 82 198 86" stroke="#9B6B10" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      <path d="M 190 85 Q 196 79 204 83" stroke="#9B6B10" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      <path d="M 196 83 Q 202 77 210 82" stroke="#9B6B10" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      <path d="M 202 82 Q 208 77 216 82" stroke="#9B6B10" strokeWidth="1" fill="none" strokeLinecap="round"/>
      {/* Bread top highlight */}
      <ellipse cx="196" cy="85" rx="10" ry="5" fill="#F8D860" opacity="0.4"/>

      {/* ── Olive oil bottle ── */}
      {/* Body */}
      <rect x="232" y="68" width="16" height="30" rx="3" fill="url(#vs-food-oil)"/>
      {/* Neck */}
      <rect x="235" y="60" width="10" height="10" rx="2" fill="#6A8E20"/>
      {/* Cork/cap */}
      <rect x="236" y="56" width="8" height="6" rx="2" fill="#C8A05A"/>
      {/* Label */}
      <rect x="233" y="74" width="14" height="12" rx="1" fill="#F5F0DC" opacity="0.85"/>
      <line x1="235" y1="78" x2="245" y2="78" stroke="#8B7A40" strokeWidth="0.8"/>
      <line x1="235" y1="81" x2="245" y2="81" stroke="#8B7A40" strokeWidth="0.8"/>
      {/* Bottle sheen */}
      <path d="M 235 70 L 235 95" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round"/>

      {/* ── Olive branch ── */}
      {/* Main stem */}
      <path d="M 20 75 Q 30 68 40 72 Q 50 76 58 70" stroke="#2D5A1B" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      {/* Branch 1 */}
      <path d="M 30 71 Q 26 65 22 62" stroke="#2D5A1B" strokeWidth="1.2" fill="none"/>
      {/* Branch 2 */}
      <path d="M 40 72 Q 38 66 35 62" stroke="#2D5A1B" strokeWidth="1.2" fill="none"/>
      {/* Branch 3 */}
      <path d="M 50 70 Q 50 64 47 60" stroke="#2D5A1B" strokeWidth="1.2" fill="none"/>
      {/* Leaves */}
      {[
        [21,60,"-25"],
        [24,63,"15"],
        [34,60,"-20"],
        [37,63,"20"],
        [46,58,"-15"],
        [49,61,"25"],
      ].map(([cx,cy,rot], i) => (
        <ellipse key={i} cx={cx} cy={cy} rx="5.5" ry="2.5"
          fill="#3A7A25"
          transform={`rotate(${rot} ${cx} ${cy})`}/>
      ))}
      {/* Olive fruits */}
      <circle cx="26" cy="67" r="2.5" fill="#2D5A1B"/>
      <circle cx="42" cy="69" r="2.5" fill="#4A8035"/>
      <circle cx="54" cy="66" r="2.5" fill="#2D5A1B"/>

      {/* ── Salt & Pepper ── */}
      {/* Salt */}
      <ellipse cx="16" cy="95" rx="6" ry="7" fill="#F5F5F5" stroke="#DDDDDD" strokeWidth="0.8"/>
      <ellipse cx="16" cy="89" rx="6" ry="2.5" fill="#EEEEEE"/>
      <circle cx="16" cy="89" r="1.5" fill="#AAAAAA"/>
      {/* Pepper */}
      <ellipse cx="30" cy="95" rx="6" ry="7" fill="#333333" stroke="#222222" strokeWidth="0.8"/>
      <ellipse cx="30" cy="89" rx="6" ry="2.5" fill="#2A2A2A"/>
      <circle cx="30" cy="89" r="1.5" fill="#555555"/>
    </svg>
  );
}

// ─── FamilyScene ──────────────────────────────────────────────────────────────
export function FamilyScene() {
  return (
    <svg width="280" height="180" viewBox="0 0 280 180" fill="none"
      xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Croatian family outdoors">
      <defs>
        {/* Sky */}
        <linearGradient id="vs-fam-sky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#60B4E8"/>
          <stop offset="100%" stopColor="#B8E0F7"/>
        </linearGradient>
        {/* Ground */}
        <linearGradient id="vs-fam-ground" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#5CB85C"/>
          <stop offset="100%" stopColor="#388E3C"/>
        </linearGradient>
        {/* Sun */}
        <radialGradient id="vs-fam-sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFF176"/>
          <stop offset="60%" stopColor="#FFD600"/>
          <stop offset="100%" stopColor="#FF8F00"/>
        </radialGradient>
        {/* House wall */}
        <linearGradient id="vs-fam-house" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F0E0C8"/>
          <stop offset="100%" stopColor="#D9C5A8"/>
        </linearGradient>
        {/* Roof */}
        <linearGradient id="vs-fam-roof" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#C0392B"/>
          <stop offset="100%" stopColor="#96281B"/>
        </linearGradient>
        {/* Tree trunk */}
        <linearGradient id="vs-fam-trunk" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#5D4037"/>
          <stop offset="50%" stopColor="#795548"/>
          <stop offset="100%" stopColor="#5D4037"/>
        </linearGradient>
        {/* Tree crowns */}
        <radialGradient id="vs-fam-tree1" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#66BB6A"/>
          <stop offset="100%" stopColor="#2E7D32"/>
        </radialGradient>
        <radialGradient id="vs-fam-tree2" cx="50%" cy="35%" r="55%">
          <stop offset="0%" stopColor="#81C784"/>
          <stop offset="100%" stopColor="#388E3C"/>
        </radialGradient>
        <radialGradient id="vs-fam-tree3" cx="60%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#4CAF50"/>
          <stop offset="100%" stopColor="#1B5E20"/>
        </radialGradient>
        {/* Skin */}
        <radialGradient id="vs-fam-skin" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#FFCBA4"/>
          <stop offset="100%" stopColor="#E8A882"/>
        </radialGradient>
      </defs>

      {/* Sky */}
      <rect width="280" height="180" fill="url(#vs-fam-sky)"/>

      {/* Sun with animated rays */}
      <g transform="translate(240, 28)">
        <circle r="16" fill="url(#vs-fam-sun)"/>
        <g opacity="0.7">
          <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="20s" repeatCount="indefinite"/>
          {[0,45,90,135,180,225,270,315].map((angle, i) => (
            <line key={i}
              x1={Math.cos(angle * Math.PI/180) * 19}
              y1={Math.sin(angle * Math.PI/180) * 19}
              x2={Math.cos(angle * Math.PI/180) * 26}
              y2={Math.sin(angle * Math.PI/180) * 26}
              stroke="#FFD600" strokeWidth="2.5" strokeLinecap="round"/>
          ))}
        </g>
      </g>

      {/* Ground */}
      <path d="M 0 118 Q 70 112 140 116 Q 210 120 280 114 L 280 180 L 0 180 Z" fill="url(#vs-fam-ground)"/>
      {/* Ground detail */}
      <path d="M 0 124 Q 80 120 160 124 Q 220 127 280 122" stroke="#43A047" strokeWidth="1" fill="none" opacity="0.5"/>

      {/* ── House ── */}
      {/* Side wall (3D effect) */}
      <polygon points="200,62 220,62 220,108 200,108" fill="#C5AD8E"/>
      {/* Roof side (3D) */}
      <polygon points="186,62 220,62 206,42 172,42" fill="#7D2115"/>
      {/* Front wall */}
      <rect x="148" y="62" width="52" height="46" fill="url(#vs-fam-house)"/>
      {/* Front roof */}
      <polygon points="140,62 206,62 173,38" fill="url(#vs-fam-roof)"/>
      {/* Chimney */}
      <rect x="188" y="40" width="10" height="18" fill="#B0856A"/>
      {/* Chimney smoke */}
      <path d="M 193 40 Q 190 35 193 30 Q 196 25 193 20" stroke="rgba(200,200,200,0.6)" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M 196 38 Q 199 33 196 28" stroke="rgba(200,200,200,0.45)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      {/* Windows */}
      <rect x="153" y="70" width="14" height="14" rx="1" fill="#AED6F1" stroke="#8ABBD4" strokeWidth="0.8"/>
      <line x1="160" y1="70" x2="160" y2="84" stroke="#8ABBD4" strokeWidth="0.7"/>
      <line x1="153" y1="77" x2="167" y2="77" stroke="#8ABBD4" strokeWidth="0.7"/>
      {/* Window light glow */}
      <rect x="153" y="70" width="14" height="14" rx="1" fill="#FFFDE7" opacity="0.3"/>
      <rect x="179" y="70" width="14" height="14" rx="1" fill="#AED6F1" stroke="#8ABBD4" strokeWidth="0.8"/>
      <line x1="186" y1="70" x2="186" y2="84" stroke="#8ABBD4" strokeWidth="0.7"/>
      <line x1="179" y1="77" x2="193" y2="77" stroke="#8ABBD4" strokeWidth="0.7"/>
      {/* Door */}
      <rect x="163" y="90" width="14" height="18" rx="2" fill="#8B6340"/>
      <circle cx="174" cy="100" r="1.5" fill="#D4A017"/>

      {/* ── Croatian flag ── */}
      <rect x="143" y="42" width="2.5" height="36" fill="#7A5C3A"/>
      <rect x="144" y="42" width="20" height="7" fill="#CC2929"/>
      <rect x="144" y="49" width="20" height="7" fill="#FFFFFF"/>
      <rect x="144" y="56" width="20" height="6" fill="#003DA5"/>

      {/* ── Oak tree ── */}
      {/* Roots */}
      <path d="M 60 118 Q 55 122 50 120" stroke="#5D4037" strokeWidth="2" fill="none"/>
      <path d="M 68 118 Q 72 123 77 121" stroke="#5D4037" strokeWidth="2" fill="none"/>
      {/* Trunk */}
      <polygon points="57,118 72,118 69,80 60,80" fill="url(#vs-fam-trunk)"/>
      {/* Bark lines */}
      <path d="M 61 115 Q 63 105 61 95 Q 60 85 62 80" stroke="#4E342E" strokeWidth="0.8" fill="none" opacity="0.5"/>
      <path d="M 67 116 Q 68 106 66 96 Q 65 86 67 80" stroke="#4E342E" strokeWidth="0.8" fill="none" opacity="0.5"/>
      {/* Crown layers */}
      <circle cx="64" cy="82" r="20" fill="url(#vs-fam-tree1)" opacity="0.95"/>
      <circle cx="51" cy="74" r="16" fill="url(#vs-fam-tree2)" opacity="0.9"/>
      <circle cx="77" cy="76" r="17" fill="url(#vs-fam-tree3)" opacity="0.9"/>
      <circle cx="64" cy="66" r="14" fill="url(#vs-fam-tree2)" opacity="0.85"/>

      {/* ── Father figure ── */}
      {/* Legs */}
      <path d="M 116 142 L 112 170" stroke="#1565C0" strokeWidth="7" strokeLinecap="round"/>
      <path d="M 122 142 L 126 170" stroke="#1565C0" strokeWidth="7" strokeLinecap="round"/>
      {/* Shoes */}
      <ellipse cx="111" cy="171" rx="5" ry="3" fill="#333"/>
      <ellipse cx="127" cy="171" rx="5" ry="3" fill="#333"/>
      {/* Pants */}
      <path d="M 108 130 Q 109 150 116 160 L 119 160 Q 120 148 119 138" fill="#1E88E5"/>
      <path d="M 130 130 Q 129 150 122 160 L 119 160 Q 118 148 119 138" fill="#1E88E5"/>
      {/* Shirt body */}
      <path d="M 106 108 Q 104 125 108 132 L 130 132 Q 134 125 132 108 Z" fill="#1565C0"/>
      {/* Shirt collar */}
      <path d="M 114 108 L 119 116 L 124 108" fill="#FFFFFF" opacity="0.7"/>
      {/* Arms */}
      <path d="M 108 115 Q 98 122 94 130" stroke="#1565C0" strokeWidth="7" strokeLinecap="round"/>
      <path d="M 130 115 Q 140 120 143 128" stroke="#1565C0" strokeWidth="7" strokeLinecap="round"/>
      {/* Hands */}
      <circle cx="93" cy="131" r="4.5" fill="#FDBCB4"/>
      <circle cx="144" cy="129" r="4.5" fill="#FDBCB4"/>
      {/* Neck */}
      <rect x="116" y="100" width="6" height="9" rx="2" fill="#FDBCB4"/>
      {/* Head */}
      <circle cx="119" cy="96" r="14" fill="url(#vs-fam-skin)"/>
      {/* Hair - dark */}
      <path d="M 106 92 Q 108 80 119 80 Q 130 80 132 92" fill="#3E2723"/>
      <path d="M 106 92 Q 105 97 107 99" fill="#3E2723"/>
      <path d="M 132 92 Q 133 97 131 99" fill="#3E2723"/>
      {/* Eyes */}
      <ellipse cx="114" cy="95" rx="2" ry="2.2" fill="#3E2723"/>
      <ellipse cx="124" cy="95" rx="2" ry="2.2" fill="#3E2723"/>
      <circle cx="115" cy="94.5" r="0.8" fill="white"/>
      <circle cx="125" cy="94.5" r="0.8" fill="white"/>
      {/* Smile */}
      <path d="M 113 100 Q 119 105 125 100" stroke="#C47B6A" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      {/* Ear */}
      <ellipse cx="105" cy="96" rx="2.5" ry="3" fill="#E8A882"/>
      <ellipse cx="133" cy="96" rx="2.5" ry="3" fill="#E8A882"/>

      {/* ── Mother figure ── */}
      {/* Legs */}
      <path d="M 152 148 L 148 170" stroke="#2A2A2A" strokeWidth="6" strokeLinecap="round"/>
      <path d="M 158 148 L 162 170" stroke="#2A2A2A" strokeWidth="6" strokeLinecap="round"/>
      {/* Shoes */}
      <ellipse cx="147" cy="171" rx="5" ry="3" fill="#8B0000"/>
      <ellipse cx="163" cy="171" rx="5" ry="3" fill="#8B0000"/>
      {/* Dress/skirt */}
      <path d="M 142 120 Q 140 138 142 150 Q 148 155 155 155 Q 162 155 168 150 Q 170 138 168 120 Z" fill="#C62828"/>
      {/* Dress pattern hint */}
      <path d="M 145 128 Q 155 126 165 128" stroke="#E57373" strokeWidth="0.8" fill="none" opacity="0.6"/>
      <path d="M 144 135 Q 155 133 166 135" stroke="#E57373" strokeWidth="0.8" fill="none" opacity="0.6"/>
      {/* Belt */}
      <rect x="142" y="120" width="26" height="5" rx="2" fill="#8B0000"/>
      {/* Blouse top */}
      <path d="M 142 106 Q 140 118 142 122 L 168 122 Q 170 118 168 106 Z" fill="#F48FB1"/>
      {/* Arms */}
      <path d="M 143 112 Q 133 118 130 126" stroke="#F48FB1" strokeWidth="6.5" strokeLinecap="round"/>
      <path d="M 167 112 Q 177 116 179 124" stroke="#F48FB1" strokeWidth="6.5" strokeLinecap="round"/>
      {/* Hands */}
      <circle cx="129" cy="127" r="4" fill="#FDBCB4"/>
      <circle cx="180" cy="125" r="4" fill="#FDBCB4"/>
      {/* Neck */}
      <rect x="152" y="98" width="6" height="9" rx="2" fill="#FDBCB4"/>
      {/* Head */}
      <circle cx="155" cy="93" r="13" fill="url(#vs-fam-skin)"/>
      {/* Hair - lighter brown with style */}
      <path d="M 143 88 Q 145 76 155 75 Q 165 76 167 88" fill="#6D4C41"/>
      <path d="M 143 88 Q 140 94 142 98" fill="#6D4C41"/>
      <path d="M 167 88 Q 170 94 168 99" fill="#6D4C41"/>
      {/* Hair detail */}
      <path d="M 143 88 Q 148 82 155 82" stroke="#5D4037" strokeWidth="1" fill="none"/>
      {/* Eyes */}
      <ellipse cx="150" cy="92" rx="1.8" ry="2" fill="#4E342E"/>
      <ellipse cx="160" cy="92" rx="1.8" ry="2" fill="#4E342E"/>
      <circle cx="151" cy="91.5" r="0.7" fill="white"/>
      <circle cx="161" cy="91.5" r="0.7" fill="white"/>
      {/* Smile */}
      <path d="M 149 97 Q 155 102 161 97" stroke="#C47B6A" strokeWidth="1.1" fill="none" strokeLinecap="round"/>
      {/* Ear */}
      <ellipse cx="142" cy="93" rx="2.5" ry="3" fill="#E8A882"/>
      <ellipse cx="168" cy="93" rx="2.5" ry="3" fill="#E8A882"/>

      {/* ── Child figure ── */}
      {/* Legs */}
      <path d="M 185 150 L 182 170" stroke="#388E3C" strokeWidth="5.5" strokeLinecap="round"/>
      <path d="M 191 150 L 194 170" stroke="#388E3C" strokeWidth="5.5" strokeLinecap="round"/>
      {/* Shoes */}
      <ellipse cx="181" cy="171" rx="4.5" ry="2.5" fill="#444"/>
      <ellipse cx="195" cy="171" rx="4.5" ry="2.5" fill="#444"/>
      {/* Shorts/pants */}
      <path d="M 180 135 Q 179 148 185 155 L 188 155 Q 188 145 188 138" fill="#43A047"/>
      <path d="M 196 135 Q 197 148 191 155 L 188 155 Q 188 145 188 138" fill="#43A047"/>
      {/* Shirt */}
      <path d="M 178 118 Q 177 132 180 137 L 196 137 Q 199 132 198 118 Z" fill="#FF7043"/>
      {/* Shirt stripe */}
      <path d="M 178 124 L 198 124" stroke="#FF5722" strokeWidth="1.5" opacity="0.7"/>
      {/* Arms raised in joy */}
      <path d="M 179 122 Q 171 115 168 108" stroke="#FF7043" strokeWidth="5.5" strokeLinecap="round"/>
      <path d="M 197 122 Q 205 114 207 107" stroke="#FF7043" strokeWidth="5.5" strokeLinecap="round"/>
      {/* Hands */}
      <circle cx="167" cy="107" r="4" fill="#FDBCB4"/>
      <circle cx="208" cy="106" r="4" fill="#FDBCB4"/>
      {/* Neck */}
      <rect x="185" y="110" width="5.5" height="8" rx="2" fill="#FDBCB4"/>
      {/* Head (bigger/rounder for child) */}
      <circle cx="188" cy="105" r="13" fill="url(#vs-fam-skin)"/>
      {/* Hair */}
      <path d="M 176 100 Q 177 89 188 88 Q 199 89 200 100" fill="#3E2723"/>
      <path d="M 176 100 Q 175 105 177 107" fill="#3E2723"/>
      {/* Eyes (bigger for child) */}
      <ellipse cx="183" cy="104" rx="2.2" ry="2.5" fill="#4E342E"/>
      <ellipse cx="193" cy="104" rx="2.2" ry="2.5" fill="#4E342E"/>
      <circle cx="184" cy="103.2" r="0.9" fill="white"/>
      <circle cx="194" cy="103.2" r="0.9" fill="white"/>
      {/* Big smile */}
      <path d="M 182 110 Q 188 116 194 110" stroke="#C47B6A" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
      {/* Chubby cheeks */}
      <circle cx="179" cy="108" r="3" fill="#FFAB91" opacity="0.45"/>
      <circle cx="197" cy="108" r="3" fill="#FFAB91" opacity="0.45"/>
      {/* Ear */}
      <ellipse cx="175" cy="105" rx="2.2" ry="2.8" fill="#E8A882"/>
      <ellipse cx="201" cy="105" rx="2.2" ry="2.8" fill="#E8A882"/>

      {/* ── Birds ── */}
      <path d="M 30 35 Q 33 31 36 35 Q 39 31 42 35" stroke="#5D4037" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
      <path d="M 55 48 Q 57 45 59 48 Q 61 45 63 48" stroke="#5D4037" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      <path d="M 22 55 Q 24 52 26 55 Q 28 52 30 55" stroke="#78909C" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

// ─── TravelScene ──────────────────────────────────────────────────────────────
export function TravelScene() {
  return (
    <svg width="280" height="180" viewBox="0 0 280 180" fill="none"
      xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Croatian coastal road trip">
      <defs>
        {/* Sky */}
        <linearGradient id="vs-travel-sky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4FC3F7"/>
          <stop offset="70%" stopColor="#87CEEB"/>
          <stop offset="100%" stopColor="#B3E5FC"/>
        </linearGradient>
        {/* Sea */}
        <linearGradient id="vs-travel-sea" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0288D1"/>
          <stop offset="50%" stopColor="#006994"/>
          <stop offset="100%" stopColor="#01579B"/>
        </linearGradient>
        {/* Road */}
        <linearGradient id="vs-travel-road" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#78909C"/>
          <stop offset="100%" stopColor="#546E7A"/>
        </linearGradient>
        {/* Cliff 1 */}
        <linearGradient id="vs-travel-cliff1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#B0A090"/>
          <stop offset="100%" stopColor="#8D7B6A"/>
        </linearGradient>
        {/* Cliff 2 */}
        <linearGradient id="vs-travel-cliff2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C5B5A5"/>
          <stop offset="100%" stopColor="#A0917A"/>
        </linearGradient>
        {/* Pine canopy */}
        <radialGradient id="vs-travel-pine" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#4CAF50"/>
          <stop offset="100%" stopColor="#1B5E20"/>
        </radialGradient>
        {/* Van body */}
        <linearGradient id="vs-travel-van" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFDE7"/>
          <stop offset="100%" stopColor="#FFF8E1"/>
        </linearGradient>
        {/* Sun glare */}
        <radialGradient id="vs-travel-sunglare" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFECB3" stopOpacity="0.9"/>
          <stop offset="50%" stopColor="#FFD54F" stopOpacity="0.4"/>
          <stop offset="100%" stopColor="#FF8F00" stopOpacity="0"/>
        </radialGradient>
        {/* Water shimmer */}
        <linearGradient id="vs-travel-shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#29B6F6" stopOpacity="0"/>
          <stop offset="40%" stopColor="#81D4FA" stopOpacity="0.6"/>
          <stop offset="60%" stopColor="#81D4FA" stopOpacity="0.6"/>
          <stop offset="100%" stopColor="#29B6F6" stopOpacity="0"/>
        </linearGradient>
      </defs>

      {/* Sky */}
      <rect width="280" height="180" fill="url(#vs-travel-sky)"/>

      {/* Sun + glare */}
      <circle cx="248" cy="32" r="18" fill="url(#vs-travel-sunglare)"/>
      <circle cx="248" cy="32" r="13" fill="#FFD600" opacity="0.9"/>
      <circle cx="248" cy="32" r="9" fill="#FFF176"/>

      {/* Sea */}
      <path d="M 0 100 Q 60 95 140 98 Q 200 101 280 96 L 280 180 L 0 180 Z" fill="url(#vs-travel-sea)"/>

      {/* Sea shimmer lines */}
      <path d="M 10 115 Q 60 112 110 116" stroke="url(#vs-travel-shimmer)" strokeWidth="1.5" fill="none" opacity="0.5"/>
      <path d="M 5 125 Q 70 121 130 126" stroke="url(#vs-travel-shimmer)" strokeWidth="1" fill="none" opacity="0.4"/>
      <path d="M 0 135 Q 55 131 100 136" stroke="#81D4FA" strokeWidth="0.8" fill="none" opacity="0.3"/>
      <path d="M 180 110 Q 225 107 270 112" stroke="#81D4FA" strokeWidth="1" fill="none" opacity="0.4"/>

      {/* Rocky cliffs — back layer */}
      <path d="M 160 100 Q 175 70 195 65 Q 215 62 230 72 Q 248 80 260 100 Z" fill="url(#vs-travel-cliff1)"/>
      {/* Cliff detail lines */}
      <path d="M 185 85 Q 195 78 205 82" stroke="#998070" strokeWidth="0.8" fill="none" opacity="0.5"/>
      <path d="M 210 80 Q 220 75 232 80" stroke="#998070" strokeWidth="0.8" fill="none" opacity="0.4"/>
      {/* Rocky cliffs — front layer */}
      <path d="M 155 100 Q 162 78 178 73 Q 192 70 205 78 Q 218 86 224 100 Z" fill="url(#vs-travel-cliff2)"/>
      <path d="M 168 90 Q 178 82 188 87" stroke="#B0A090" strokeWidth="0.8" fill="none" opacity="0.5"/>

      {/* ── Stone pines on cliffs ── */}
      {/* Pine 1 */}
      <rect x="174" y="62" width="5" height="14" rx="1" fill="#5D4037"/>
      <ellipse cx="177" cy="60" rx="11" ry="5" fill="url(#vs-travel-pine)"/>
      <ellipse cx="177" cy="57" rx="8" ry="3.5" fill="#2D5A1B"/>
      {/* Pine 2 */}
      <rect x="192" y="58" width="5" height="13" rx="1" fill="#5D4037"/>
      <ellipse cx="195" cy="56" rx="13" ry="5.5" fill="url(#vs-travel-pine)"/>
      <ellipse cx="195" cy="53" rx="9" ry="3.5" fill="#2D5A1B"/>
      {/* Pine 3 (smaller/distant) */}
      <rect x="215" y="62" width="4" height="11" rx="1" fill="#5D4037"/>
      <ellipse cx="217" cy="61" rx="9" ry="4" fill="url(#vs-travel-pine)" opacity="0.85"/>

      {/* ── Coastal road ── (perspective trapezoid) */}
      <polygon points="80,180 125,100 160,100 200,180" fill="url(#vs-travel-road)"/>
      {/* Road edge lines */}
      <line x1="80" y1="180" x2="125" y2="100" stroke="#90A4AE" strokeWidth="1" opacity="0.6"/>
      <line x1="200" y1="180" x2="160" y2="100" stroke="#90A4AE" strokeWidth="1" opacity="0.6"/>
      {/* Centre line dashes — perspective scaled */}
      {[0,1,2,3,4,5,6].map(i => {
        const t0 = i / 7;
        const t1 = (i + 0.45) / 7;
        const x0 = 80 + t0*(200-80), y0 = 180 + t0*(100-180);
        const x1b = 80 + t1*(200-80), y1b = 180 + t1*(100-180);
        const cx0 = 125 + t0*(160-125);
        const cx1b = 125 + t1*(160-125);
        const mx0 = (x0+cx0)/2, mx1b = (x1b+cx1b)/2;
        const myd0 = (y0), myd1 = (y1b);
        return (
          <line key={i} x1={mx0} y1={myd0} x2={mx1b} y2={myd1}
            stroke="#FFEE58" strokeWidth={1.5 - i*0.15} opacity="0.85" strokeLinecap="round"/>
        );
      })}
      {/* Road shoulder texture */}
      <path d="M 84 175 Q 95 165 105 158 Q 115 150 120 143" stroke="#607D8B" strokeWidth="0.6" fill="none" opacity="0.4"/>

      {/* ── Sailboat ── */}
      <g>
        <animateTransform attributeName="transform" type="translate" values="0,0; 0,-3; 0,0" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"/>
        {/* Hull */}
        <path d="M 28 122 Q 22 128 28 132 Q 55 140 82 132 Q 88 128 82 122 Z" fill="#F5F5F5" stroke="#DDDDDD" strokeWidth="0.8"/>
        {/* Colored stripe on hull */}
        <path d="M 32 128 Q 55 134 78 128" stroke="#1565C0" strokeWidth="3" fill="none" strokeLinecap="round"/>
        {/* Mast */}
        <line x1="55" y1="122" x2="55" y2="86" stroke="#8D6E63" strokeWidth="1.8"/>
        {/* Main sail */}
        <path d="M 55 88 L 55 120 L 80 112 Z" fill="white" stroke="#EEEEEE" strokeWidth="0.8" opacity="0.95"/>
        {/* Jib sail */}
        <path d="M 55 94 L 55 118 L 34 114 Z" fill="#E3F2FD" stroke="#BBDEFB" strokeWidth="0.8" opacity="0.9"/>
        {/* Water reflection */}
        <path d="M 35 135 Q 55 138 75 135" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" fill="none"/>
      </g>

      {/* ── VW-style camper van ── */}
      {/* Van body */}
      <rect x="92" y="148" width="68" height="30" rx="4" fill="url(#vs-travel-van)" stroke="#E0D8C0" strokeWidth="0.8"/>
      {/* Colored mid-stripe */}
      <rect x="92" y="158" width="68" height="8" fill="#26A69A"/>
      {/* Cab/windshield area */}
      <rect x="140" y="150" width="20" height="15" rx="2" fill="#B2EBF2" stroke="#80DEEA" strokeWidth="0.8"/>
      <line x1="150" y1="150" x2="150" y2="165" stroke="#80DEEA" strokeWidth="0.7"/>
      {/* Rear window */}
      <rect x="94" y="151" width="18" height="10" rx="1.5" fill="#B2EBF2" stroke="#80DEEA" strokeWidth="0.7"/>
      {/* Headlight */}
      <circle cx="160" cy="163" r="3" fill="#FFF9C4" stroke="#F9A825" strokeWidth="0.8"/>
      {/* Wheels */}
      <circle cx="110" cy="178" r="9" fill="#37474F"/>
      <circle cx="110" cy="178" r="5.5" fill="#607D8B"/>
      <circle cx="110" cy="178" r="2.5" fill="#90A4AE"/>
      <circle cx="148" cy="178" r="9" fill="#37474F"/>
      <circle cx="148" cy="178" r="5.5" fill="#607D8B"/>
      <circle cx="148" cy="178" r="2.5" fill="#90A4AE"/>
      {/* VW emblem (simplified) */}
      <circle cx="108" cy="156" r="5" fill="#26A69A" stroke="white" strokeWidth="0.8"/>
      {/* Door line */}
      <line x1="130" y1="148" x2="130" y2="178" stroke="#D0C8A8" strokeWidth="0.8"/>
      {/* Door handle */}
      <rect x="127" y="162" width="6" height="2" rx="1" fill="#C8B890"/>

      {/* ── Road sign ── */}
      <rect x="215" y="122" width="2.5" height="30" fill="#888"/>
      <rect x="209" y="122" width="22" height="14" rx="2" fill="#1B5E20" stroke="#2E7D32" strokeWidth="0.8"/>
      <text x="220" y="131" textAnchor="middle" fontSize="5.5" fill="white" fontFamily="Arial,sans-serif" fontWeight="bold">Dubrovnik</text>
      <text x="220" y="133.5" textAnchor="middle" fontSize="4" fill="white" fontFamily="Arial,sans-serif">→</text>

      {/* Km stone */}
      <rect x="74" y="168" width="10" height="10" rx="1.5" fill="#BDBDBD"/>
      <text x="79" y="175" textAnchor="middle" fontSize="4.5" fill="#555" fontFamily="Arial,sans-serif">12</text>

      {/* ── Seagulls ── */}
      <path d="M 65 52 Q 68 48 71 52 Q 74 48 77 52" stroke="#546E7A" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M 100 40 Q 103 37 106 40 Q 109 37 112 40" stroke="#546E7A" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
      <path d="M 135 58 Q 137 55 139 58 Q 141 55 143 58" stroke="#607D8B" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

// ─── GreetingScene ────────────────────────────────────────────────────────────
export function GreetingScene() {
  return (
    <svg width="280" height="180" viewBox="0 0 280 180" fill="none"
      xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Croatian café greeting">
      <defs>
        {/* Wall gradient */}
        <linearGradient id="vs-greet-wall" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#E8A87C"/>
          <stop offset="60%" stopColor="#D4855A"/>
          <stop offset="100%" stopColor="#C07040"/>
        </linearGradient>
        {/* Floor */}
        <linearGradient id="vs-greet-floor" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#D7CCC8"/>
          <stop offset="100%" stopColor="#A1887F"/>
        </linearGradient>
        {/* Table top */}
        <radialGradient id="vs-greet-table" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#C9A84C"/>
          <stop offset="100%" stopColor="#8B6914"/>
        </radialGradient>
        {/* Coffee cup */}
        <linearGradient id="vs-greet-cup" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF"/>
          <stop offset="100%" stopColor="#F5F0E8"/>
        </linearGradient>
        {/* Coffee liquid */}
        <radialGradient id="vs-greet-coffee" cx="40%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#6B3A2A"/>
          <stop offset="100%" stopColor="#3E1C00"/>
        </radialGradient>
        {/* Skin */}
        <radialGradient id="vs-greet-skin" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#FFCBA4"/>
          <stop offset="100%" stopColor="#E8A882"/>
        </radialGradient>
        {/* Skin 2 (slightly different tone) */}
        <radialGradient id="vs-greet-skin2" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#FFD5B0"/>
          <stop offset="100%" stopColor="#EDB888"/>
        </radialGradient>
        {/* Bulb glow */}
        <radialGradient id="vs-greet-bulb" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFF9C4" stopOpacity="0.9"/>
          <stop offset="100%" stopColor="#FFD54F" stopOpacity="0"/>
        </radialGradient>
        {/* Window arch */}
        <linearGradient id="vs-greet-window" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#87CEEB" stopOpacity="0.8"/>
          <stop offset="100%" stopColor="#B8E4F7" stopOpacity="0.6"/>
        </linearGradient>
        {/* Speech shadow */}
        <filter id="vs-greet-shadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#00000022"/>
        </filter>
      </defs>

      <style>{`
        @keyframes vs-greet-pop1 {
          0%   { transform: scale(0) translateY(4px); opacity: 0; }
          65%  { transform: scale(1.06) translateY(-1px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes vs-greet-pop2 {
          0%   { transform: scale(0) translateY(4px); opacity: 0; }
          65%  { transform: scale(1.06) translateY(-1px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes vs-greet-steam {
          0%   { opacity: 0.7; transform: translateY(0); }
          50%  { opacity: 0.3; transform: translateY(-4px); }
          100% { opacity: 0.7; transform: translateY(0); }
        }
        @keyframes vs-greet-steam2 {
          0%   { opacity: 0.5; transform: translateY(0); }
          50%  { opacity: 1;   transform: translateY(-4px); }
          100% { opacity: 0.5; transform: translateY(0); }
        }
        .vs-greet-sb1 {
          transform-origin: 60px 80px;
          animation: vs-greet-pop1 0.4s 0.1s cubic-bezier(0.34,1.56,0.64,1) both;
        }
        .vs-greet-sb2 {
          transform-origin: 216px 80px;
          animation: vs-greet-pop2 0.4s 0.45s cubic-bezier(0.34,1.56,0.64,1) both;
        }
        .vs-greet-stm1 { animation: vs-greet-steam 2s ease-in-out infinite; }
        .vs-greet-stm2 { animation: vs-greet-steam2 2.3s ease-in-out infinite; }
        .vs-greet-stm3 { animation: vs-greet-steam 1.8s 0.5s ease-in-out infinite; }
        .vs-greet-stm4 { animation: vs-greet-steam2 2.1s 0.3s ease-in-out infinite; }
      `}</style>

      {/* Wall background */}
      <rect width="280" height="180" fill="url(#vs-greet-wall)"/>

      {/* Wall texture — subtle lines */}
      <line x1="0" y1="45" x2="280" y2="45" stroke="#C07040" strokeWidth="0.5" opacity="0.3"/>
      <line x1="0" y1="90" x2="280" y2="90" stroke="#C07040" strokeWidth="0.5" opacity="0.3"/>

      {/* Floor */}
      <path d="M 0 138 Q 140 132 280 138 L 280 180 L 0 180 Z" fill="url(#vs-greet-floor)"/>

      {/* ── Arched window ── */}
      <rect x="105" y="22" width="70" height="55" fill="url(#vs-greet-window)"/>
      <path d="M 105 22 Q 105 4 140 4 Q 175 4 175 22 Z" fill="url(#vs-greet-window)"/>
      {/* Window frame */}
      <rect x="105" y="22" width="70" height="55" fill="none" stroke="#6B4226" strokeWidth="3"/>
      <path d="M 105 22 Q 105 4 140 4 Q 175 4 175 22" fill="none" stroke="#6B4226" strokeWidth="3"/>
      {/* Window cross bars */}
      <line x1="140" y1="4" x2="140" y2="77" stroke="#6B4226" strokeWidth="2"/>
      <line x1="105" y1="40" x2="175" y2="40" stroke="#6B4226" strokeWidth="2"/>
      {/* Shutters */}
      {/* Left shutter */}
      <rect x="84" y="4" width="21" height="73" rx="1.5" fill="#2D5016"/>
      {[10,15,20,25,30,35,40,45,50,55,60,65].map((y,i) => (
        <line key={i} x1="86" y1={y} x2="103" y2={y} stroke="#3A6B20" strokeWidth="0.7" opacity="0.6"/>
      ))}
      {/* Right shutter */}
      <rect x="175" y="4" width="21" height="73" rx="1.5" fill="#2D5016"/>
      {[10,15,20,25,30,35,40,45,50,55,60,65].map((y,i) => (
        <line key={i} x1="177" y1={y} x2="194" y2={y} stroke="#3A6B20" strokeWidth="0.7" opacity="0.6"/>
      ))}
      {/* Shutter hinges */}
      <circle cx="104" cy="20" r="2" fill="#8B6A40"/>
      <circle cx="104" cy="60" r="2" fill="#8B6A40"/>
      <circle cx="176" cy="20" r="2" fill="#8B6A40"/>
      <circle cx="176" cy="60" r="2" fill="#8B6A40"/>

      {/* ── String lights ── */}
      <path d="M 5 16 Q 35 22 70 18 Q 100 14 140 20 Q 175 25 210 19 Q 245 14 275 18"
        stroke="#8D6E63" strokeWidth="1.2" fill="none"/>
      {/* Bulb glows */}
      {[[22,20],[55,17],[88,16],[122,19],[156,22],[190,18],[225,16],[258,17]].map(([bx,by],i) => (
        <g key={i}>
          <circle cx={bx} cy={by} r="7" fill="url(#vs-greet-bulb)"/>
          <circle cx={bx} cy={by} r="3" fill="#FFF176" stroke="#FFD600" strokeWidth="0.6"/>
        </g>
      ))}

      {/* ── Café table ── */}
      {/* Pedestal leg */}
      <rect x="132" y="138" width="16" height="6" rx="2" fill="#6B4E20"/>
      <rect x="120" y="143" width="40" height="5" rx="2.5" fill="#8B6320"/>
      <rect x="135" y="120" width="10" height="19" rx="2" fill="#7A5718"/>
      {/* Table top (ellipse for perspective) */}
      <ellipse cx="140" cy="120" rx="55" ry="12" fill="url(#vs-greet-table)"/>
      <ellipse cx="140" cy="120" rx="55" ry="12" fill="none" stroke="#6B4200" strokeWidth="1.2"/>
      {/* Table edge highlight */}
      <path d="M 87 118 Q 140 110 193 118" stroke="#D4A830" strokeWidth="1" fill="none" opacity="0.5"/>

      {/* ── Bistro chair LEFT ── */}
      <g opacity="0.9">
        {/* Seat */}
        <ellipse cx="76" cy="142" rx="18" ry="5" fill="#8B6320"/>
        {/* Back */}
        <rect x="60" y="120" width="5" height="23" rx="2" fill="#6B4200"/>
        <rect x="67" y="122" width="3" height="19" rx="1" fill="#8B5E20"/>
        <rect x="74" y="122" width="3" height="19" rx="1" fill="#8B5E20"/>
        {/* Legs — X pattern */}
        <line x1="62" y1="142" x2="58" y2="163" stroke="#6B4200" strokeWidth="3" strokeLinecap="round"/>
        <line x1="90" y1="142" x2="94" y2="163" stroke="#6B4200" strokeWidth="3" strokeLinecap="round"/>
        <line x1="62" y1="163" x2="90" y2="142" stroke="#7A5210" strokeWidth="2" strokeLinecap="round"/>
        <line x1="90" y1="163" x2="62" y2="142" stroke="#7A5210" strokeWidth="2" strokeLinecap="round"/>
      </g>

      {/* ── Bistro chair RIGHT ── */}
      <g opacity="0.9">
        <ellipse cx="204" cy="142" rx="18" ry="5" fill="#8B6320"/>
        <rect x="215" y="120" width="5" height="23" rx="2" fill="#6B4200"/>
        <rect x="208" y="122" width="3" height="19" rx="1" fill="#8B5E20"/>
        <rect x="201" y="122" width="3" height="19" rx="1" fill="#8B5E20"/>
        <line x1="190" y1="142" x2="186" y2="163" stroke="#6B4200" strokeWidth="3" strokeLinecap="round"/>
        <line x1="218" y1="142" x2="222" y2="163" stroke="#6B4200" strokeWidth="3" strokeLinecap="round"/>
        <line x1="190" y1="163" x2="218" y2="142" stroke="#7A5210" strokeWidth="2" strokeLinecap="round"/>
        <line x1="218" y1="163" x2="190" y2="142" stroke="#7A5210" strokeWidth="2" strokeLinecap="round"/>
      </g>

      {/* ── Coffee cup LEFT ── */}
      {/* Saucer */}
      <ellipse cx="110" cy="117" rx="14" ry="4" fill="#E8E0D4" stroke="#CCBCAC" strokeWidth="0.8"/>
      {/* Cup body */}
      <path d="M 100 108 Q 99 116 102 117 Q 110 120 118 117 Q 121 116 120 108 Z" fill="url(#vs-greet-cup)" stroke="#D0C0B0" strokeWidth="0.7"/>
      {/* Coffee */}
      <ellipse cx="110" cy="109" rx="9" ry="2.5" fill="url(#vs-greet-coffee)"/>
      {/* Handle */}
      <path d="M 120 110 Q 126 110 126 113 Q 126 116 120 116" stroke="#D0C0B0" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      {/* Steam */}
      <path d="M 106 107 Q 103 103 106 99 Q 109 95 106 91" className="vs-greet-stm1" stroke="rgba(200,200,200,0.7)" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <path d="M 113 106 Q 116 102 113 98 Q 110 94 113 90" className="vs-greet-stm2" stroke="rgba(200,200,200,0.65)" strokeWidth="1.8" fill="none" strokeLinecap="round"/>

      {/* ── Coffee cup RIGHT ── */}
      <ellipse cx="170" cy="117" rx="14" ry="4" fill="#E8E0D4" stroke="#CCBCAC" strokeWidth="0.8"/>
      <path d="M 160 108 Q 159 116 162 117 Q 170 120 178 117 Q 181 116 180 108 Z" fill="url(#vs-greet-cup)" stroke="#D0C0B0" strokeWidth="0.7"/>
      <ellipse cx="170" cy="109" rx="9" ry="2.5" fill="url(#vs-greet-coffee)"/>
      <path d="M 160 110 Q 154 110 154 113 Q 154 116 160 116" stroke="#D0C0B0" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      {/* Steam */}
      <path d="M 166 107 Q 163 103 166 99 Q 169 95 166 91" className="vs-greet-stm3" stroke="rgba(200,200,200,0.7)" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <path d="M 173 106 Q 176 102 173 98 Q 170 94 173 90" className="vs-greet-stm4" stroke="rgba(200,200,200,0.65)" strokeWidth="1.8" fill="none" strokeLinecap="round"/>

      {/* ── Person LEFT (upper half only) ── */}
      {/* Torso / shirt */}
      <path d="M 52 138 Q 48 128 50 118 Q 52 110 62 108 L 66 112 L 70 108 Q 80 110 82 118 Q 84 128 80 138 Z" fill="#1565C0"/>
      {/* Shirt collar */}
      <path d="M 63 108 L 66 113 L 69 108" fill="white" opacity="0.7"/>
      {/* Shirt details */}
      <path d="M 52 122 Q 60 120 66 121" stroke="#1976D2" strokeWidth="0.7" fill="none" opacity="0.5"/>
      {/* Neck */}
      <rect x="63" y="100" width="6" height="9" rx="2" fill="url(#vs-greet-skin)"/>
      {/* Head */}
      <circle cx="66" cy="94" r="13" fill="url(#vs-greet-skin)"/>
      {/* Ear */}
      <ellipse cx="53" cy="94" rx="2.5" ry="3" fill="#E8A882"/>
      <ellipse cx="79" cy="94" rx="2.5" ry="3" fill="#E8A882"/>
      {/* Hair (darker, short) */}
      <path d="M 53 88 Q 55 77 66 77 Q 77 77 79 88" fill="#4E342E"/>
      <path d="M 53 88 Q 52 93 54 97" fill="#4E342E"/>
      <path d="M 79 88 Q 80 93 78 97" fill="#4E342E"/>
      {/* Eyes */}
      <ellipse cx="61" cy="93" rx="2" ry="2.2" fill="#3E2723"/>
      <ellipse cx="71" cy="93" rx="2" ry="2.2" fill="#3E2723"/>
      <circle cx="62" cy="92.3" r="0.8" fill="white"/>
      <circle cx="72" cy="92.3" r="0.8" fill="white"/>
      {/* Smile */}
      <path d="M 60 98 Q 66 103 72 98" stroke="#C07050" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      {/* Cheek flush */}
      <circle cx="58" cy="97" r="3.5" fill="#FF8A65" opacity="0.3"/>
      <circle cx="74" cy="97" r="3.5" fill="#FF8A65" opacity="0.3"/>

      {/* ── Person RIGHT (upper half only) ── */}
      {/* Torso / shirt (different color — terracotta) */}
      <path d="M 198 138 Q 194 128 196 118 Q 198 110 208 108 L 212 112 L 216 108 Q 226 110 228 118 Q 230 128 226 138 Z" fill="#BF360C"/>
      {/* Shirt collar */}
      <path d="M 209 108 L 212 113 L 215 108" fill="white" opacity="0.6"/>
      {/* Neck */}
      <rect x="209" y="100" width="6" height="9" rx="2" fill="url(#vs-greet-skin2)"/>
      {/* Head */}
      <circle cx="212" cy="94" r="13" fill="url(#vs-greet-skin2)"/>
      {/* Ear */}
      <ellipse cx="199" cy="94" rx="2.5" ry="3" fill="#EDB888"/>
      <ellipse cx="225" cy="94" rx="2.5" ry="3" fill="#EDB888"/>
      {/* Hair (lighter — auburn/wavy) */}
      <path d="M 200 87 Q 202 75 212 75 Q 222 75 224 87" fill="#8D5524"/>
      <path d="M 200 87 Q 198 93 200 98" fill="#8D5524"/>
      <path d="M 224 87 Q 226 93 224 98" fill="#8D5524"/>
      {/* Hair wave */}
      <path d="M 200 87 Q 206 83 212 85 Q 218 87 224 84" stroke="#7A4820" strokeWidth="0.9" fill="none"/>
      {/* Eyes */}
      <ellipse cx="207" cy="93" rx="2" ry="2.2" fill="#4E342E"/>
      <ellipse cx="217" cy="93" rx="2" ry="2.2" fill="#4E342E"/>
      <circle cx="208" cy="92.3" r="0.8" fill="white"/>
      <circle cx="218" cy="92.3" r="0.8" fill="white"/>
      {/* Smile */}
      <path d="M 206 98 Q 212 104 218 98" stroke="#C07050" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      {/* Cheek flush */}
      <circle cx="204" cy="97" r="3.5" fill="#FF8A65" opacity="0.3"/>
      <circle cx="220" cy="97" r="3.5" fill="#FF8A65" opacity="0.3"/>

      {/* ── Speech bubble LEFT (Bog!) ── */}
      <g className="vs-greet-sb1" filter="url(#vs-greet-shadow)">
        {/* Bubble body */}
        <rect x="8" y="48" width="72" height="36" rx="10" fill="white" stroke="#E0D0C0" strokeWidth="1.2"/>
        {/* Tail pointing down-right toward person */}
        <path d="M 30 84 L 46 96 L 52 84 Z" fill="white"/>
        <path d="M 30 84 L 46 96" stroke="#E0D0C0" strokeWidth="1.2"/>
        <path d="M 52 84 L 46 96" stroke="#E0D0C0" strokeWidth="1.2"/>
        {/* Text */}
        <text x="44" y="67" textAnchor="middle" fontSize="14" fontWeight="800"
          fill="#0277BD" fontFamily="Georgia,serif">Bog!</text>
        <text x="44" y="80" textAnchor="middle" fontSize="8" fill="#888"
          fontFamily="Arial,sans-serif">Hello!</text>
      </g>

      {/* ── Speech bubble RIGHT (Hvala!) ── */}
      <g className="vs-greet-sb2" filter="url(#vs-greet-shadow)">
        <rect x="200" y="48" width="74" height="36" rx="10" fill="white" stroke="#E0D0C0" strokeWidth="1.2"/>
        {/* Tail pointing down-left toward person */}
        <path d="M 228 84 L 212 96 L 218 84 Z" fill="white"/>
        <path d="M 228 84 L 212 96" stroke="#E0D0C0" strokeWidth="1.2"/>
        <path d="M 218 84 L 212 96" stroke="#E0D0C0" strokeWidth="1.2"/>
        {/* Text */}
        <text x="237" y="67" textAnchor="middle" fontSize="12.5" fontWeight="800"
          fill="#B71C1C" fontFamily="Georgia,serif">Hvala!</text>
        <text x="237" y="80" textAnchor="middle" fontSize="8" fill="#888"
          fontFamily="Arial,sans-serif">Thank you!</text>
      </g>

      {/* ── Potted plant (right side) ── */}
      {/* Pot */}
      <path d="M 252 155 Q 248 168 250 172 Q 256 176 264 172 Q 266 168 262 155 Z" fill="#BF5B17"/>
      <rect x="248" y="152" width="18" height="5" rx="2" fill="#D4691E"/>
      {/* Soil */}
      <ellipse cx="257" cy="155" rx="9" ry="3" fill="#5D4037"/>
      {/* Stems */}
      <path d="M 257 152 Q 252 144 248 138 Q 244 132 248 128" stroke="#4CAF50" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <path d="M 257 148 Q 262 140 268 134 Q 272 128 268 124" stroke="#388E3C" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <path d="M 257 144 Q 255 136 257 130" stroke="#43A047" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      {/* Leaves */}
      {[
        [246,127,-30],
        [249,131,20],
        [268,123,35],
        [264,128,-25],
        [256,129,-10],
        [260,133,15],
        [253,138,-20],
        [263,136,30],
      ].map(([cx,cy,rot], i) => (
        <ellipse key={i} cx={cx} cy={cy} rx="7" ry="3"
          fill={i%2===0 ? "#4CAF50" : "#66BB6A"}
          transform={`rotate(${rot} ${cx} ${cy})`}
          opacity="0.9"/>
      ))}

      {/* ── Cobblestone hints at bottom ── */}
      <rect x="8" y="168" width="22" height="10" rx="4" fill="#B0A090" opacity="0.55"/>
      <rect x="34" y="170" width="20" height="9" rx="4" fill="#A89880" opacity="0.5"/>
      <rect x="58" y="167" width="24" height="11" rx="4" fill="#B0A090" opacity="0.5"/>
      <rect x="220" y="169" width="22" height="10" rx="4" fill="#B0A090" opacity="0.5"/>
      <rect x="246" y="167" width="26" height="11" rx="4" fill="#A89880" opacity="0.55"/>
    </svg>
  );
}

// ─── Scene map & default export ──────────────────────────────────────────────
const SCENES = {
  food:      FoodScene,
  family:    FamilyScene,
  travel:    TravelScene,
  greetings: GreetingScene,
};

export default function VocabScene({ scene = 'food' }) {
  const S = SCENES[scene] || FoodScene;
  return <S />;
}
