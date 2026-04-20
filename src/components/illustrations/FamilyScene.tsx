import React from 'react';

export default function FamilyScene() {
  return (
    <svg
      width="280"
      height="180"
      viewBox="0 0 280 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Croatian family outdoors"
    >
      <defs>
        {/* Sky */}
        <linearGradient id="vs-fam-sky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#60B4E8" />
          <stop offset="100%" stopColor="#B8E0F7" />
        </linearGradient>
        {/* Ground */}
        <linearGradient id="vs-fam-ground" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#5CB85C" />
          <stop offset="100%" stopColor="#388E3C" />
        </linearGradient>
        {/* Sun */}
        <radialGradient id="vs-fam-sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFF176" />
          <stop offset="60%" stopColor="#FFD600" />
          <stop offset="100%" stopColor="#FF8F00" />
        </radialGradient>
        {/* House wall */}
        <linearGradient id="vs-fam-house" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F0E0C8" />
          <stop offset="100%" stopColor="#D9C5A8" />
        </linearGradient>
        {/* Roof */}
        <linearGradient id="vs-fam-roof" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#C0392B" />
          <stop offset="100%" stopColor="#96281B" />
        </linearGradient>
        {/* Tree trunk */}
        <linearGradient id="vs-fam-trunk" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#5D4037" />
          <stop offset="50%" stopColor="#795548" />
          <stop offset="100%" stopColor="#5D4037" />
        </linearGradient>
        {/* Tree crowns */}
        <radialGradient id="vs-fam-tree1" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#66BB6A" />
          <stop offset="100%" stopColor="#2E7D32" />
        </radialGradient>
        <radialGradient id="vs-fam-tree2" cx="50%" cy="35%" r="55%">
          <stop offset="0%" stopColor="#81C784" />
          <stop offset="100%" stopColor="#388E3C" />
        </radialGradient>
        <radialGradient id="vs-fam-tree3" cx="60%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#4CAF50" />
          <stop offset="100%" stopColor="#1B5E20" />
        </radialGradient>
        {/* Skin */}
        <radialGradient id="vs-fam-skin" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#FFCBA4" />
          <stop offset="100%" stopColor="#E8A882" />
        </radialGradient>
      </defs>

      {/* Sky */}
      <rect width="280" height="180" fill="url(#vs-fam-sky)" />

      {/* Sun with animated rays */}
      <g transform="translate(240, 28)">
        <circle r="16" fill="url(#vs-fam-sun)" />
        <g opacity="0.7">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0"
            to="360"
            dur="20s"
            repeatCount="indefinite"
          />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
            <line
              key={i}
              x1={Math.cos((angle * Math.PI) / 180) * 19}
              y1={Math.sin((angle * Math.PI) / 180) * 19}
              x2={Math.cos((angle * Math.PI) / 180) * 26}
              y2={Math.sin((angle * Math.PI) / 180) * 26}
              stroke="#FFD600"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          ))}
        </g>
      </g>

      {/* Ground */}
      <path
        d="M 0 118 Q 70 112 140 116 Q 210 120 280 114 L 280 180 L 0 180 Z"
        fill="url(#vs-fam-ground)"
      />
      {/* Ground detail */}
      <path
        d="M 0 124 Q 80 120 160 124 Q 220 127 280 122"
        stroke="#43A047"
        strokeWidth="1"
        fill="none"
        opacity="0.5"
      />

      {/* ── House ── */}
      {/* Side wall (3D effect) */}
      <polygon points="200,62 220,62 220,108 200,108" fill="#C5AD8E" />
      {/* Roof side (3D) */}
      <polygon points="186,62 220,62 206,42 172,42" fill="#7D2115" />
      {/* Front wall */}
      <rect x="148" y="62" width="52" height="46" fill="url(#vs-fam-house)" />
      {/* Front roof */}
      <polygon points="140,62 206,62 173,38" fill="url(#vs-fam-roof)" />
      {/* Chimney */}
      <rect x="188" y="40" width="10" height="18" fill="#B0856A" />
      {/* Chimney smoke */}
      <path
        d="M 193 40 Q 190 35 193 30 Q 196 25 193 20"
        stroke="rgba(200,200,200,0.6)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 196 38 Q 199 33 196 28"
        stroke="rgba(200,200,200,0.45)"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Windows */}
      <rect
        x="153"
        y="70"
        width="14"
        height="14"
        rx="1"
        fill="#AED6F1"
        stroke="#8ABBD4"
        strokeWidth="0.8"
      />
      <line x1="160" y1="70" x2="160" y2="84" stroke="#8ABBD4" strokeWidth="0.7" />
      <line x1="153" y1="77" x2="167" y2="77" stroke="#8ABBD4" strokeWidth="0.7" />
      {/* Window light glow */}
      <rect x="153" y="70" width="14" height="14" rx="1" fill="#FFFDE7" opacity="0.3" />
      <rect
        x="179"
        y="70"
        width="14"
        height="14"
        rx="1"
        fill="#AED6F1"
        stroke="#8ABBD4"
        strokeWidth="0.8"
      />
      <line x1="186" y1="70" x2="186" y2="84" stroke="#8ABBD4" strokeWidth="0.7" />
      <line x1="179" y1="77" x2="193" y2="77" stroke="#8ABBD4" strokeWidth="0.7" />
      {/* Door */}
      <rect x="163" y="90" width="14" height="18" rx="2" fill="#8B6340" />
      <circle cx="174" cy="100" r="1.5" fill="#D4A017" />

      {/* ── Croatian flag ── */}
      <rect x="143" y="42" width="2.5" height="36" fill="#7A5C3A" />
      <rect x="144" y="42" width="20" height="7" fill="#CC2929" />
      <rect x="144" y="49" width="20" height="7" fill="#FFFFFF" />
      <rect x="144" y="56" width="20" height="6" fill="#003DA5" />

      {/* ── Oak tree ── */}
      {/* Roots */}
      <path d="M 60 118 Q 55 122 50 120" stroke="#5D4037" strokeWidth="2" fill="none" />
      <path d="M 68 118 Q 72 123 77 121" stroke="#5D4037" strokeWidth="2" fill="none" />
      {/* Trunk */}
      <polygon points="57,118 72,118 69,80 60,80" fill="url(#vs-fam-trunk)" />
      {/* Bark lines */}
      <path
        d="M 61 115 Q 63 105 61 95 Q 60 85 62 80"
        stroke="#4E342E"
        strokeWidth="0.8"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M 67 116 Q 68 106 66 96 Q 65 86 67 80"
        stroke="#4E342E"
        strokeWidth="0.8"
        fill="none"
        opacity="0.5"
      />
      {/* Crown layers */}
      <circle cx="64" cy="82" r="20" fill="url(#vs-fam-tree1)" opacity="0.95" />
      <circle cx="51" cy="74" r="16" fill="url(#vs-fam-tree2)" opacity="0.9" />
      <circle cx="77" cy="76" r="17" fill="url(#vs-fam-tree3)" opacity="0.9" />
      <circle cx="64" cy="66" r="14" fill="url(#vs-fam-tree2)" opacity="0.85" />

      {/* ── Father figure ── */}
      {/* Legs */}
      <path d="M 116 142 L 112 170" stroke="#1565C0" strokeWidth="7" strokeLinecap="round" />
      <path d="M 122 142 L 126 170" stroke="#1565C0" strokeWidth="7" strokeLinecap="round" />
      {/* Shoes */}
      <ellipse cx="111" cy="171" rx="5" ry="3" fill="#333" />
      <ellipse cx="127" cy="171" rx="5" ry="3" fill="#333" />
      {/* Pants */}
      <path d="M 108 130 Q 109 150 116 160 L 119 160 Q 120 148 119 138" fill="#1E88E5" />
      <path d="M 130 130 Q 129 150 122 160 L 119 160 Q 118 148 119 138" fill="#1E88E5" />
      {/* Shirt body */}
      <path d="M 106 108 Q 104 125 108 132 L 130 132 Q 134 125 132 108 Z" fill="#1565C0" />
      {/* Shirt collar */}
      <path d="M 114 108 L 119 116 L 124 108" fill="#FFFFFF" opacity="0.7" />
      {/* Arms */}
      <path d="M 108 115 Q 98 122 94 130" stroke="#1565C0" strokeWidth="7" strokeLinecap="round" />
      <path
        d="M 130 115 Q 140 120 143 128"
        stroke="#1565C0"
        strokeWidth="7"
        strokeLinecap="round"
      />
      {/* Hands */}
      <circle cx="93" cy="131" r="4.5" fill="#FDBCB4" />
      <circle cx="144" cy="129" r="4.5" fill="#FDBCB4" />
      {/* Neck */}
      <rect x="116" y="100" width="6" height="9" rx="2" fill="#FDBCB4" />
      {/* Head */}
      <circle cx="119" cy="96" r="14" fill="url(#vs-fam-skin)" />
      {/* Hair - dark */}
      <path d="M 106 92 Q 108 80 119 80 Q 130 80 132 92" fill="#3E2723" />
      <path d="M 106 92 Q 105 97 107 99" fill="#3E2723" />
      <path d="M 132 92 Q 133 97 131 99" fill="#3E2723" />
      {/* Eyes */}
      <ellipse cx="114" cy="95" rx="2" ry="2.2" fill="#3E2723" />
      <ellipse cx="124" cy="95" rx="2" ry="2.2" fill="#3E2723" />
      <circle cx="115" cy="94.5" r="0.8" fill="white" />
      <circle cx="125" cy="94.5" r="0.8" fill="white" />
      {/* Smile */}
      <path
        d="M 113 100 Q 119 105 125 100"
        stroke="#C47B6A"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />
      {/* Ear */}
      <ellipse cx="105" cy="96" rx="2.5" ry="3" fill="#E8A882" />
      <ellipse cx="133" cy="96" rx="2.5" ry="3" fill="#E8A882" />

      {/* ── Mother figure ── */}
      {/* Legs */}
      <path d="M 152 148 L 148 170" stroke="#2A2A2A" strokeWidth="6" strokeLinecap="round" />
      <path d="M 158 148 L 162 170" stroke="#2A2A2A" strokeWidth="6" strokeLinecap="round" />
      {/* Shoes */}
      <ellipse cx="147" cy="171" rx="5" ry="3" fill="#8B0000" />
      <ellipse cx="163" cy="171" rx="5" ry="3" fill="#8B0000" />
      {/* Dress/skirt */}
      <path
        d="M 142 120 Q 140 138 142 150 Q 148 155 155 155 Q 162 155 168 150 Q 170 138 168 120 Z"
        fill="#C62828"
      />
      {/* Dress pattern hint */}
      <path
        d="M 145 128 Q 155 126 165 128"
        stroke="#E57373"
        strokeWidth="0.8"
        fill="none"
        opacity="0.6"
      />
      <path
        d="M 144 135 Q 155 133 166 135"
        stroke="#E57373"
        strokeWidth="0.8"
        fill="none"
        opacity="0.6"
      />
      {/* Belt */}
      <rect x="142" y="120" width="26" height="5" rx="2" fill="#8B0000" />
      {/* Blouse top */}
      <path d="M 142 106 Q 140 118 142 122 L 168 122 Q 170 118 168 106 Z" fill="#F48FB1" />
      {/* Arms */}
      <path
        d="M 143 112 Q 133 118 130 126"
        stroke="#F48FB1"
        strokeWidth="6.5"
        strokeLinecap="round"
      />
      <path
        d="M 167 112 Q 177 116 179 124"
        stroke="#F48FB1"
        strokeWidth="6.5"
        strokeLinecap="round"
      />
      {/* Hands */}
      <circle cx="129" cy="127" r="4" fill="#FDBCB4" />
      <circle cx="180" cy="125" r="4" fill="#FDBCB4" />
      {/* Neck */}
      <rect x="152" y="98" width="6" height="9" rx="2" fill="#FDBCB4" />
      {/* Head */}
      <circle cx="155" cy="93" r="13" fill="url(#vs-fam-skin)" />
      {/* Hair - lighter brown with style */}
      <path d="M 143 88 Q 145 76 155 75 Q 165 76 167 88" fill="#6D4C41" />
      <path d="M 143 88 Q 140 94 142 98" fill="#6D4C41" />
      <path d="M 167 88 Q 170 94 168 99" fill="#6D4C41" />
      {/* Hair detail */}
      <path d="M 143 88 Q 148 82 155 82" stroke="#5D4037" strokeWidth="1" fill="none" />
      {/* Eyes */}
      <ellipse cx="150" cy="92" rx="1.8" ry="2" fill="#4E342E" />
      <ellipse cx="160" cy="92" rx="1.8" ry="2" fill="#4E342E" />
      <circle cx="151" cy="91.5" r="0.7" fill="white" />
      <circle cx="161" cy="91.5" r="0.7" fill="white" />
      {/* Smile */}
      <path
        d="M 149 97 Q 155 102 161 97"
        stroke="#C47B6A"
        strokeWidth="1.1"
        fill="none"
        strokeLinecap="round"
      />
      {/* Ear */}
      <ellipse cx="142" cy="93" rx="2.5" ry="3" fill="#E8A882" />
      <ellipse cx="168" cy="93" rx="2.5" ry="3" fill="#E8A882" />

      {/* ── Child figure ── */}
      {/* Legs */}
      <path d="M 185 150 L 182 170" stroke="#388E3C" strokeWidth="5.5" strokeLinecap="round" />
      <path d="M 191 150 L 194 170" stroke="#388E3C" strokeWidth="5.5" strokeLinecap="round" />
      {/* Shoes */}
      <ellipse cx="181" cy="171" rx="4.5" ry="2.5" fill="#444" />
      <ellipse cx="195" cy="171" rx="4.5" ry="2.5" fill="#444" />
      {/* Shorts/pants */}
      <path d="M 180 135 Q 179 148 185 155 L 188 155 Q 188 145 188 138" fill="#43A047" />
      <path d="M 196 135 Q 197 148 191 155 L 188 155 Q 188 145 188 138" fill="#43A047" />
      {/* Shirt */}
      <path d="M 178 118 Q 177 132 180 137 L 196 137 Q 199 132 198 118 Z" fill="#FF7043" />
      {/* Shirt stripe */}
      <path d="M 178 124 L 198 124" stroke="#FF5722" strokeWidth="1.5" opacity="0.7" />
      {/* Arms raised in joy */}
      <path
        d="M 179 122 Q 171 115 168 108"
        stroke="#FF7043"
        strokeWidth="5.5"
        strokeLinecap="round"
      />
      <path
        d="M 197 122 Q 205 114 207 107"
        stroke="#FF7043"
        strokeWidth="5.5"
        strokeLinecap="round"
      />
      {/* Hands */}
      <circle cx="167" cy="107" r="4" fill="#FDBCB4" />
      <circle cx="208" cy="106" r="4" fill="#FDBCB4" />
      {/* Neck */}
      <rect x="185" y="110" width="5.5" height="8" rx="2" fill="#FDBCB4" />
      {/* Head (bigger/rounder for child) */}
      <circle cx="188" cy="105" r="13" fill="url(#vs-fam-skin)" />
      {/* Hair */}
      <path d="M 176 100 Q 177 89 188 88 Q 199 89 200 100" fill="#3E2723" />
      <path d="M 176 100 Q 175 105 177 107" fill="#3E2723" />
      {/* Eyes (bigger for child) */}
      <ellipse cx="183" cy="104" rx="2.2" ry="2.5" fill="#4E342E" />
      <ellipse cx="193" cy="104" rx="2.2" ry="2.5" fill="#4E342E" />
      <circle cx="184" cy="103.2" r="0.9" fill="white" />
      <circle cx="194" cy="103.2" r="0.9" fill="white" />
      {/* Big smile */}
      <path
        d="M 182 110 Q 188 116 194 110"
        stroke="#C47B6A"
        strokeWidth="1.3"
        fill="none"
        strokeLinecap="round"
      />
      {/* Chubby cheeks */}
      <circle cx="179" cy="108" r="3" fill="#FFAB91" opacity="0.45" />
      <circle cx="197" cy="108" r="3" fill="#FFAB91" opacity="0.45" />
      {/* Ear */}
      <ellipse cx="175" cy="105" rx="2.2" ry="2.8" fill="#E8A882" />
      <ellipse cx="201" cy="105" rx="2.2" ry="2.8" fill="#E8A882" />

      {/* ── Birds ── */}
      <path
        d="M 30 35 Q 33 31 36 35 Q 39 31 42 35"
        stroke="#5D4037"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 55 48 Q 57 45 59 48 Q 61 45 63 48"
        stroke="#5D4037"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 22 55 Q 24 52 26 55 Q 28 52 30 55"
        stroke="#78909C"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
