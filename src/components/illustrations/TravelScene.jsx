import React from 'react';

export default function TravelScene() {
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
