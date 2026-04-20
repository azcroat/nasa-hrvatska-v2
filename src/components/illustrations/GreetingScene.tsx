import React from 'react';

export default function GreetingScene() {
  return (
    <svg
      width="280"
      height="180"
      viewBox="0 0 280 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Croatian café greeting"
    >
      <defs>
        {/* Wall gradient */}
        <linearGradient id="vs-greet-wall" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#E8A87C" />
          <stop offset="60%" stopColor="#D4855A" />
          <stop offset="100%" stopColor="#C07040" />
        </linearGradient>
        {/* Floor */}
        <linearGradient id="vs-greet-floor" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#D7CCC8" />
          <stop offset="100%" stopColor="#A1887F" />
        </linearGradient>
        {/* Table top */}
        <radialGradient id="vs-greet-table" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#C9A84C" />
          <stop offset="100%" stopColor="#8B6914" />
        </radialGradient>
        {/* Coffee cup */}
        <linearGradient id="vs-greet-cup" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F5F0E8" />
        </linearGradient>
        {/* Coffee liquid */}
        <radialGradient id="vs-greet-coffee" cx="40%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#6B3A2A" />
          <stop offset="100%" stopColor="#3E1C00" />
        </radialGradient>
        {/* Skin */}
        <radialGradient id="vs-greet-skin" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#FFCBA4" />
          <stop offset="100%" stopColor="#E8A882" />
        </radialGradient>
        {/* Skin 2 (slightly different tone) */}
        <radialGradient id="vs-greet-skin2" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#FFD5B0" />
          <stop offset="100%" stopColor="#EDB888" />
        </radialGradient>
        {/* Bulb glow */}
        <radialGradient id="vs-greet-bulb" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFF9C4" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#FFD54F" stopOpacity="0" />
        </radialGradient>
        {/* Window arch */}
        <linearGradient id="vs-greet-window" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#87CEEB" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#B8E4F7" stopOpacity="0.6" />
        </linearGradient>
        {/* Speech shadow */}
        <filter id="vs-greet-shadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#00000022" />
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
      <rect width="280" height="180" fill="url(#vs-greet-wall)" />

      {/* Wall texture — subtle lines */}
      <line x1="0" y1="45" x2="280" y2="45" stroke="#C07040" strokeWidth="0.5" opacity="0.3" />
      <line x1="0" y1="90" x2="280" y2="90" stroke="#C07040" strokeWidth="0.5" opacity="0.3" />

      {/* Floor */}
      <path d="M 0 138 Q 140 132 280 138 L 280 180 L 0 180 Z" fill="url(#vs-greet-floor)" />

      {/* ── Arched window ── */}
      <rect x="105" y="22" width="70" height="55" fill="url(#vs-greet-window)" />
      <path d="M 105 22 Q 105 4 140 4 Q 175 4 175 22 Z" fill="url(#vs-greet-window)" />
      {/* Window frame */}
      <rect x="105" y="22" width="70" height="55" fill="none" stroke="#6B4226" strokeWidth="3" />
      <path
        d="M 105 22 Q 105 4 140 4 Q 175 4 175 22"
        fill="none"
        stroke="#6B4226"
        strokeWidth="3"
      />
      {/* Window cross bars */}
      <line x1="140" y1="4" x2="140" y2="77" stroke="#6B4226" strokeWidth="2" />
      <line x1="105" y1="40" x2="175" y2="40" stroke="#6B4226" strokeWidth="2" />
      {/* Shutters */}
      {/* Left shutter */}
      <rect x="84" y="4" width="21" height="73" rx="1.5" fill="#2D5016" />
      {[10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65].map((y, i) => (
        <line
          key={i}
          x1="86"
          y1={y}
          x2="103"
          y2={y}
          stroke="#3A6B20"
          strokeWidth="0.7"
          opacity="0.6"
        />
      ))}
      {/* Right shutter */}
      <rect x="175" y="4" width="21" height="73" rx="1.5" fill="#2D5016" />
      {[10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65].map((y, i) => (
        <line
          key={i}
          x1="177"
          y1={y}
          x2="194"
          y2={y}
          stroke="#3A6B20"
          strokeWidth="0.7"
          opacity="0.6"
        />
      ))}
      {/* Shutter hinges */}
      <circle cx="104" cy="20" r="2" fill="#8B6A40" />
      <circle cx="104" cy="60" r="2" fill="#8B6A40" />
      <circle cx="176" cy="20" r="2" fill="#8B6A40" />
      <circle cx="176" cy="60" r="2" fill="#8B6A40" />

      {/* ── String lights ── */}
      <path
        d="M 5 16 Q 35 22 70 18 Q 100 14 140 20 Q 175 25 210 19 Q 245 14 275 18"
        stroke="#8D6E63"
        strokeWidth="1.2"
        fill="none"
      />
      {/* Bulb glows */}
      {[
        [22, 20],
        [55, 17],
        [88, 16],
        [122, 19],
        [156, 22],
        [190, 18],
        [225, 16],
        [258, 17],
      ].map(([bx, by], i) => (
        <g key={i}>
          <circle cx={bx} cy={by} r="7" fill="url(#vs-greet-bulb)" />
          <circle cx={bx} cy={by} r="3" fill="#FFF176" stroke="#FFD600" strokeWidth="0.6" />
        </g>
      ))}

      {/* ── Café table ── */}
      {/* Pedestal leg */}
      <rect x="132" y="138" width="16" height="6" rx="2" fill="#6B4E20" />
      <rect x="120" y="143" width="40" height="5" rx="2.5" fill="#8B6320" />
      <rect x="135" y="120" width="10" height="19" rx="2" fill="#7A5718" />
      {/* Table top (ellipse for perspective) */}
      <ellipse cx="140" cy="120" rx="55" ry="12" fill="url(#vs-greet-table)" />
      <ellipse cx="140" cy="120" rx="55" ry="12" fill="none" stroke="#6B4200" strokeWidth="1.2" />
      {/* Table edge highlight */}
      <path
        d="M 87 118 Q 140 110 193 118"
        stroke="#D4A830"
        strokeWidth="1"
        fill="none"
        opacity="0.5"
      />

      {/* ── Bistro chair LEFT ── */}
      <g opacity="0.9">
        {/* Seat */}
        <ellipse cx="76" cy="142" rx="18" ry="5" fill="#8B6320" />
        {/* Back */}
        <rect x="60" y="120" width="5" height="23" rx="2" fill="#6B4200" />
        <rect x="67" y="122" width="3" height="19" rx="1" fill="#8B5E20" />
        <rect x="74" y="122" width="3" height="19" rx="1" fill="#8B5E20" />
        {/* Legs — X pattern */}
        <line
          x1="62"
          y1="142"
          x2="58"
          y2="163"
          stroke="#6B4200"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <line
          x1="90"
          y1="142"
          x2="94"
          y2="163"
          stroke="#6B4200"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <line
          x1="62"
          y1="163"
          x2="90"
          y2="142"
          stroke="#7A5210"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="90"
          y1="163"
          x2="62"
          y2="142"
          stroke="#7A5210"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>

      {/* ── Bistro chair RIGHT ── */}
      <g opacity="0.9">
        <ellipse cx="204" cy="142" rx="18" ry="5" fill="#8B6320" />
        <rect x="215" y="120" width="5" height="23" rx="2" fill="#6B4200" />
        <rect x="208" y="122" width="3" height="19" rx="1" fill="#8B5E20" />
        <rect x="201" y="122" width="3" height="19" rx="1" fill="#8B5E20" />
        <line
          x1="190"
          y1="142"
          x2="186"
          y2="163"
          stroke="#6B4200"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <line
          x1="218"
          y1="142"
          x2="222"
          y2="163"
          stroke="#6B4200"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <line
          x1="190"
          y1="163"
          x2="218"
          y2="142"
          stroke="#7A5210"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="218"
          y1="163"
          x2="190"
          y2="142"
          stroke="#7A5210"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>

      {/* ── Coffee cup LEFT ── */}
      {/* Saucer */}
      <ellipse cx="110" cy="117" rx="14" ry="4" fill="#E8E0D4" stroke="#CCBCAC" strokeWidth="0.8" />
      {/* Cup body */}
      <path
        d="M 100 108 Q 99 116 102 117 Q 110 120 118 117 Q 121 116 120 108 Z"
        fill="url(#vs-greet-cup)"
        stroke="#D0C0B0"
        strokeWidth="0.7"
      />
      {/* Coffee */}
      <ellipse cx="110" cy="109" rx="9" ry="2.5" fill="url(#vs-greet-coffee)" />
      {/* Handle */}
      <path
        d="M 120 110 Q 126 110 126 113 Q 126 116 120 116"
        stroke="#D0C0B0"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Steam */}
      <path
        d="M 106 107 Q 103 103 106 99 Q 109 95 106 91"
        className="vs-greet-stm1"
        stroke="rgba(200,200,200,0.7)"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 113 106 Q 116 102 113 98 Q 110 94 113 90"
        className="vs-greet-stm2"
        stroke="rgba(200,200,200,0.65)"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />

      {/* ── Coffee cup RIGHT ── */}
      <ellipse cx="170" cy="117" rx="14" ry="4" fill="#E8E0D4" stroke="#CCBCAC" strokeWidth="0.8" />
      <path
        d="M 160 108 Q 159 116 162 117 Q 170 120 178 117 Q 181 116 180 108 Z"
        fill="url(#vs-greet-cup)"
        stroke="#D0C0B0"
        strokeWidth="0.7"
      />
      <ellipse cx="170" cy="109" rx="9" ry="2.5" fill="url(#vs-greet-coffee)" />
      <path
        d="M 160 110 Q 154 110 154 113 Q 154 116 160 116"
        stroke="#D0C0B0"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Steam */}
      <path
        d="M 166 107 Q 163 103 166 99 Q 169 95 166 91"
        className="vs-greet-stm3"
        stroke="rgba(200,200,200,0.7)"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 173 106 Q 176 102 173 98 Q 170 94 173 90"
        className="vs-greet-stm4"
        stroke="rgba(200,200,200,0.65)"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />

      {/* ── Person LEFT (upper half only) ── */}
      {/* Torso / shirt */}
      <path
        d="M 52 138 Q 48 128 50 118 Q 52 110 62 108 L 66 112 L 70 108 Q 80 110 82 118 Q 84 128 80 138 Z"
        fill="#1565C0"
      />
      {/* Shirt collar */}
      <path d="M 63 108 L 66 113 L 69 108" fill="white" opacity="0.7" />
      {/* Shirt details */}
      <path
        d="M 52 122 Q 60 120 66 121"
        stroke="#1976D2"
        strokeWidth="0.7"
        fill="none"
        opacity="0.5"
      />
      {/* Neck */}
      <rect x="63" y="100" width="6" height="9" rx="2" fill="url(#vs-greet-skin)" />
      {/* Head */}
      <circle cx="66" cy="94" r="13" fill="url(#vs-greet-skin)" />
      {/* Ear */}
      <ellipse cx="53" cy="94" rx="2.5" ry="3" fill="#E8A882" />
      <ellipse cx="79" cy="94" rx="2.5" ry="3" fill="#E8A882" />
      {/* Hair (darker, short) */}
      <path d="M 53 88 Q 55 77 66 77 Q 77 77 79 88" fill="#4E342E" />
      <path d="M 53 88 Q 52 93 54 97" fill="#4E342E" />
      <path d="M 79 88 Q 80 93 78 97" fill="#4E342E" />
      {/* Eyes */}
      <ellipse cx="61" cy="93" rx="2" ry="2.2" fill="#3E2723" />
      <ellipse cx="71" cy="93" rx="2" ry="2.2" fill="#3E2723" />
      <circle cx="62" cy="92.3" r="0.8" fill="white" />
      <circle cx="72" cy="92.3" r="0.8" fill="white" />
      {/* Smile */}
      <path
        d="M 60 98 Q 66 103 72 98"
        stroke="#C07050"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />
      {/* Cheek flush */}
      <circle cx="58" cy="97" r="3.5" fill="#FF8A65" opacity="0.3" />
      <circle cx="74" cy="97" r="3.5" fill="#FF8A65" opacity="0.3" />

      {/* ── Person RIGHT (upper half only) ── */}
      {/* Torso / shirt (different color — terracotta) */}
      <path
        d="M 198 138 Q 194 128 196 118 Q 198 110 208 108 L 212 112 L 216 108 Q 226 110 228 118 Q 230 128 226 138 Z"
        fill="#BF360C"
      />
      {/* Shirt collar */}
      <path d="M 209 108 L 212 113 L 215 108" fill="white" opacity="0.6" />
      {/* Neck */}
      <rect x="209" y="100" width="6" height="9" rx="2" fill="url(#vs-greet-skin2)" />
      {/* Head */}
      <circle cx="212" cy="94" r="13" fill="url(#vs-greet-skin2)" />
      {/* Ear */}
      <ellipse cx="199" cy="94" rx="2.5" ry="3" fill="#EDB888" />
      <ellipse cx="225" cy="94" rx="2.5" ry="3" fill="#EDB888" />
      {/* Hair (lighter — auburn/wavy) */}
      <path d="M 200 87 Q 202 75 212 75 Q 222 75 224 87" fill="#8D5524" />
      <path d="M 200 87 Q 198 93 200 98" fill="#8D5524" />
      <path d="M 224 87 Q 226 93 224 98" fill="#8D5524" />
      {/* Hair wave */}
      <path
        d="M 200 87 Q 206 83 212 85 Q 218 87 224 84"
        stroke="#7A4820"
        strokeWidth="0.9"
        fill="none"
      />
      {/* Eyes */}
      <ellipse cx="207" cy="93" rx="2" ry="2.2" fill="#4E342E" />
      <ellipse cx="217" cy="93" rx="2" ry="2.2" fill="#4E342E" />
      <circle cx="208" cy="92.3" r="0.8" fill="white" />
      <circle cx="218" cy="92.3" r="0.8" fill="white" />
      {/* Smile */}
      <path
        d="M 206 98 Q 212 104 218 98"
        stroke="#C07050"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />
      {/* Cheek flush */}
      <circle cx="204" cy="97" r="3.5" fill="#FF8A65" opacity="0.3" />
      <circle cx="220" cy="97" r="3.5" fill="#FF8A65" opacity="0.3" />

      {/* ── Speech bubble LEFT (Bog!) ── */}
      <g className="vs-greet-sb1" filter="url(#vs-greet-shadow)">
        {/* Bubble body */}
        <rect
          x="8"
          y="48"
          width="72"
          height="36"
          rx="10"
          fill="white"
          stroke="#E0D0C0"
          strokeWidth="1.2"
        />
        {/* Tail pointing down-right toward person */}
        <path d="M 30 84 L 46 96 L 52 84 Z" fill="white" />
        <path d="M 30 84 L 46 96" stroke="#E0D0C0" strokeWidth="1.2" />
        <path d="M 52 84 L 46 96" stroke="#E0D0C0" strokeWidth="1.2" />
        {/* Text */}
        <text
          x="44"
          y="67"
          textAnchor="middle"
          fontSize="14"
          fontWeight="800"
          fill="#0277BD"
          fontFamily="Georgia,serif"
        >
          Bog!
        </text>
        <text
          x="44"
          y="80"
          textAnchor="middle"
          fontSize="8"
          fill="#888"
          fontFamily="Arial,sans-serif"
        >
          Hello!
        </text>
      </g>

      {/* ── Speech bubble RIGHT (Hvala!) ── */}
      <g className="vs-greet-sb2" filter="url(#vs-greet-shadow)">
        <rect
          x="200"
          y="48"
          width="74"
          height="36"
          rx="10"
          fill="white"
          stroke="#E0D0C0"
          strokeWidth="1.2"
        />
        {/* Tail pointing down-left toward person */}
        <path d="M 228 84 L 212 96 L 218 84 Z" fill="white" />
        <path d="M 228 84 L 212 96" stroke="#E0D0C0" strokeWidth="1.2" />
        <path d="M 218 84 L 212 96" stroke="#E0D0C0" strokeWidth="1.2" />
        {/* Text */}
        <text
          x="237"
          y="67"
          textAnchor="middle"
          fontSize="12.5"
          fontWeight="800"
          fill="#B71C1C"
          fontFamily="Georgia,serif"
        >
          Hvala!
        </text>
        <text
          x="237"
          y="80"
          textAnchor="middle"
          fontSize="8"
          fill="#888"
          fontFamily="Arial,sans-serif"
        >
          Thank you!
        </text>
      </g>

      {/* ── Potted plant (right side) ── */}
      {/* Pot */}
      <path d="M 252 155 Q 248 168 250 172 Q 256 176 264 172 Q 266 168 262 155 Z" fill="#BF5B17" />
      <rect x="248" y="152" width="18" height="5" rx="2" fill="#D4691E" />
      {/* Soil */}
      <ellipse cx="257" cy="155" rx="9" ry="3" fill="#5D4037" />
      {/* Stems */}
      <path
        d="M 257 152 Q 252 144 248 138 Q 244 132 248 128"
        stroke="#4CAF50"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 257 148 Q 262 140 268 134 Q 272 128 268 124"
        stroke="#388E3C"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 257 144 Q 255 136 257 130"
        stroke="#43A047"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Leaves */}
      {[
        [246, 127, -30],
        [249, 131, 20],
        [268, 123, 35],
        [264, 128, -25],
        [256, 129, -10],
        [260, 133, 15],
        [253, 138, -20],
        [263, 136, 30],
      ].map(([cx, cy, rot], i) => (
        <ellipse
          key={i}
          cx={cx}
          cy={cy}
          rx="7"
          ry="3"
          fill={i % 2 === 0 ? '#4CAF50' : '#66BB6A'}
          transform={`rotate(${rot} ${cx} ${cy})`}
          opacity="0.9"
        />
      ))}

      {/* ── Cobblestone hints at bottom ── */}
      <rect x="8" y="168" width="22" height="10" rx="4" fill="#B0A090" opacity="0.55" />
      <rect x="34" y="170" width="20" height="9" rx="4" fill="#A89880" opacity="0.5" />
      <rect x="58" y="167" width="24" height="11" rx="4" fill="#B0A090" opacity="0.5" />
      <rect x="220" y="169" width="22" height="10" rx="4" fill="#B0A090" opacity="0.5" />
      <rect x="246" y="167" width="26" height="11" rx="4" fill="#A89880" opacity="0.55" />
    </svg>
  );
}
