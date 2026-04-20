// ─── Scene SVG Illustrations ─────────────────────────────────────────────────
// Each SVG is a static JSX element used as the background for its scene.

export const SVG_kitchen = (
  <svg
    viewBox="0 0 400 320"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
  >
    {/* Sky/wall */}
    <rect width="400" height="320" fill="#fef9f0" />
    {/* Floor */}
    <rect x="0" y="220" width="400" height="100" fill="#e8d5b7" />
    {/* Floor tiles */}
    {[0, 80, 160, 240, 320].map((x) =>
      [0, 40, 80].map((y) => (
        <rect
          key={`${x}-${y}`}
          x={x}
          y={220 + y}
          width="80"
          height="40"
          fill="none"
          stroke="#d4b896"
          strokeWidth="1"
        />
      )),
    )}
    {/* Back counter top */}
    <rect x="0" y="175" width="400" height="15" fill="#8b6f47" />
    {/* Counter cabinet */}
    <rect x="0" y="190" width="400" height="30" fill="#a07850" />
    {/* Cabinet doors */}
    <rect
      x="5"
      y="193"
      width="90"
      height="24"
      rx="2"
      fill="#b8905a"
      stroke="#8b6f47"
      strokeWidth="1"
    />
    <rect
      x="100"
      y="193"
      width="90"
      height="24"
      rx="2"
      fill="#b8905a"
      stroke="#8b6f47"
      strokeWidth="1"
    />
    <rect
      x="195"
      y="193"
      width="90"
      height="24"
      rx="2"
      fill="#b8905a"
      stroke="#8b6f47"
      strokeWidth="1"
    />
    <rect
      x="290"
      y="193"
      width="105"
      height="24"
      rx="2"
      fill="#b8905a"
      stroke="#8b6f47"
      strokeWidth="1"
    />
    {/* Wall cabinets */}
    <rect
      x="0"
      y="40"
      width="110"
      height="80"
      rx="4"
      fill="#c4a27a"
      stroke="#8b6f47"
      strokeWidth="1.5"
    />
    <rect
      x="4"
      y="44"
      width="50"
      height="72"
      rx="2"
      fill="#d4b28a"
      stroke="#a07850"
      strokeWidth="1"
    />
    <rect
      x="56"
      y="44"
      width="50"
      height="72"
      rx="2"
      fill="#d4b28a"
      stroke="#a07850"
      strokeWidth="1"
    />
    <circle cx="31" cy="80" r="3" fill="#8b6f47" />
    <circle cx="81" cy="80" r="3" fill="#8b6f47" />
    <rect
      x="270"
      y="40"
      width="130"
      height="80"
      rx="4"
      fill="#c4a27a"
      stroke="#8b6f47"
      strokeWidth="1.5"
    />
    <rect
      x="274"
      y="44"
      width="58"
      height="72"
      rx="2"
      fill="#d4b28a"
      stroke="#a07850"
      strokeWidth="1"
    />
    <rect
      x="334"
      y="44"
      width="62"
      height="72"
      rx="2"
      fill="#d4b28a"
      stroke="#a07850"
      strokeWidth="1"
    />
    <circle cx="303" cy="80" r="3" fill="#8b6f47" />
    <circle cx="365" cy="80" r="3" fill="#8b6f47" />
    {/* Window */}
    <rect x="140" y="30" width="120" height="90" rx="4" fill="#b8e0f7" />
    <rect
      x="140"
      y="30"
      width="120"
      height="90"
      rx="4"
      fill="none"
      stroke="#8b6f47"
      strokeWidth="3"
    />
    <line x1="200" y1="30" x2="200" y2="120" stroke="#8b6f47" strokeWidth="2" />
    <line x1="140" y1="75" x2="260" y2="75" stroke="#8b6f47" strokeWidth="2" />
    {/* Sunshine through window */}
    <rect x="142" y="32" width="56" height="41" fill="#fffde7" opacity="0.4" />
    {/* Stove */}
    <rect x="10" y="135" width="90" height="42" rx="3" fill="#555" />
    <rect x="12" y="137" width="86" height="30" rx="2" fill="#444" />
    <circle cx="35" cy="148" r="10" fill="#333" />
    <circle cx="35" cy="148" r="6" fill="#222" />
    <circle cx="75" cy="148" r="10" fill="#333" />
    <circle cx="75" cy="148" r="6" fill="#222" />
    <rect x="14" y="168" width="82" height="6" rx="2" fill="#666" />
    {/* Sink */}
    <rect x="195" y="148" width="70" height="32" rx="5" fill="#bbb" />
    <rect x="199" y="152" width="62" height="24" rx="3" fill="#999" />
    <rect x="226" y="138" width="6" height="16" rx="3" fill="#888" />
    <circle cx="229" cy="136" r="5" fill="#777" />
    {/* Kettle */}
    <ellipse cx="310" cy="162" rx="22" ry="18" fill="#e53935" />
    <rect x="330" y="155" width="6" height="8" rx="2" fill="#c62828" />
    <rect x="308" y="144" width="4" height="10" rx="2" fill="#b71c1c" />
    {/* Bread on counter */}
    <ellipse cx="150" cy="172" rx="22" ry="8" fill="#d4a574" />
    <ellipse cx="150" cy="168" rx="20" ry="7" fill="#e8b888" />
    {/* Cup */}
    <rect x="115" y="158" width="20" height="18" rx="3" fill="#e57373" />
    <path d="M135 163 Q143 166 135 172" stroke="#e57373" strokeWidth="3" fill="none" />
  </svg>
);

export const SVG_market = (
  <svg
    viewBox="0 0 400 320"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
  >
    {/* Sky */}
    <rect width="400" height="320" fill="#e8f5e9" />
    {/* Ground */}
    <rect x="0" y="240" width="400" height="80" fill="#c8e6c9" />
    {/* Market canopy */}
    <polygon points="0,60 400,60 370,100 30,100" fill="#e53935" />
    <polygon points="0,60 60,100 0,100" fill="#c62828" />
    <polygon points="400,60 340,100 400,100" fill="#c62828" />
    {/* Canopy stripes */}
    {[60, 120, 180, 240, 300].map((x) => (
      <polygon
        key={x}
        points={`${x},60 ${x + 30},60 ${x + 26},100 ${x - 4},100`}
        fill="#c62828"
        opacity="0.5"
      />
    ))}
    {/* Stall table */}
    <rect x="20" y="140" width="360" height="15" rx="2" fill="#8d6e63" />
    <rect x="30" y="155" width="10" height="85" fill="#795548" />
    <rect x="360" y="155" width="10" height="85" fill="#795548" />
    <rect x="180" y="155" width="10" height="85" fill="#795548" />
    {/* Table top face */}
    <rect x="20" y="125" width="360" height="20" rx="3" fill="#a1887f" />
    {/* Produce on table - left section */}
    <circle cx="50" cy="118" r="14" fill="#f44336" />
    <circle cx="80" cy="116" r="14" fill="#ff9800" />
    <circle cx="110" cy="118" r="12" fill="#f44336" />
    <circle cx="48" cy="104" r="10" fill="#ef5350" />
    <circle cx="78" cy="102" r="10" fill="#ffa726" />
    {/* Leafy greens */}
    <ellipse cx="160" cy="115" rx="25" ry="12" fill="#4caf50" />
    <ellipse cx="155" cy="110" rx="15" ry="8" fill="#66bb6a" />
    <ellipse cx="168" cy="108" rx="15" ry="8" fill="#81c784" />
    {/* Bread section */}
    <ellipse cx="230" cy="117" rx="28" ry="12" fill="#d4a574" />
    <ellipse cx="230" cy="108" rx="24" ry="10" fill="#e8b888" />
    {/* Fish section */}
    <ellipse cx="300" cy="118" rx="28" ry="10" fill="#90caf9" />
    <ellipse cx="295" cy="114" rx="18" ry="7" fill="#64b5f6" />
    <ellipse cx="315" cy="116" rx="16" ry="6" fill="#42a5f5" />
    {/* Hanging sign */}
    <rect
      x="155"
      y="65"
      width="90"
      height="30"
      rx="4"
      fill="#fff9c4"
      stroke="#f9a825"
      strokeWidth="2"
    />
    <text x="200" y="85" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#e65100">
      TRŽNICA
    </text>
    {/* Baskets on ground */}
    <ellipse cx="70" cy="248" rx="30" ry="10" fill="#8d6e63" />
    <rect x="40" y="210" width="60" height="40" rx="5" fill="#a1887f" />
    <ellipse cx="70" cy="210" rx="30" ry="10" fill="#bcaaa4" />
    <circle cx="55" cy="205" r="8" fill="#ff7043" />
    <circle cx="72" cy="203" r="9" fill="#ef5350" />
    <circle cx="88" cy="206" r="7" fill="#ffa726" />
    {/* Hanging garlic/onions */}
    <line x1="320" y1="65" x2="320" y2="130" stroke="#795548" strokeWidth="2" />
    <ellipse cx="320" cy="133" rx="10" ry="8" fill="#fff9c4" />
    <ellipse cx="315" cy="147" rx="9" ry="7" fill="#f5f5f5" />
    <ellipse cx="325" cy="145" rx="9" ry="7" fill="#fff9c4" />
    <ellipse cx="312" cy="160" rx="8" ry="7" fill="#f5f5f5" />
  </svg>
);

export const SVG_cafe = (
  <svg
    viewBox="0 0 400 320"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
  >
    {/* Wall */}
    <rect width="400" height="320" fill="#fff8f0" />
    {/* Floor */}
    <rect x="0" y="230" width="400" height="90" fill="#d7ccc8" />
    {/* Floor tiles */}
    {[0, 80, 160, 240, 320].map((x) =>
      [0, 45].map((y) => (
        <rect
          key={`${x}-${y}`}
          x={x}
          y={230 + y}
          width="80"
          height="45"
          fill="none"
          stroke="#bcaaa4"
          strokeWidth="1"
        />
      )),
    )}
    {/* Window */}
    <rect x="260" y="20" width="130" height="120" rx="4" fill="#b3e5fc" />
    <rect
      x="260"
      y="20"
      width="130"
      height="120"
      rx="4"
      fill="none"
      stroke="#6d4c41"
      strokeWidth="3"
    />
    <line x1="325" y1="20" x2="325" y2="140" stroke="#6d4c41" strokeWidth="2" />
    <line x1="260" y1="80" x2="390" y2="80" stroke="#6d4c41" strokeWidth="2" />
    {/* Curtains */}
    <path d="M260,20 Q275,50 265,80 Q270,50 280,20" fill="#ef9a9a" opacity="0.8" />
    <path d="M390,20 Q375,50 385,80 Q380,50 370,20" fill="#ef9a9a" opacity="0.8" />
    {/* Chalkboard menu */}
    <rect x="10" y="15" width="180" height="110" rx="4" fill="#37474f" />
    <rect x="15" y="20" width="170" height="100" rx="2" fill="#455a64" />
    <text x="100" y="45" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#fff9c4">
      ☕ KAFIĆ MENU ☕
    </text>
    <text x="30" y="65" fontSize="9" fill="#b0bec5">
      Kava .............. 10kn
    </text>
    <text x="30" y="78" fontSize="9" fill="#b0bec5">
      Čaj ............... 8kn
    </text>
    <text x="30" y="91" fontSize="9" fill="#b0bec5">
      Sok ............... 12kn
    </text>
    <text x="30" y="104" fontSize="9" fill="#b0bec5">
      Torta ............. 15kn
    </text>
    {/* Bar counter */}
    <rect x="0" y="165" width="400" height="12" rx="2" fill="#4e342e" />
    <rect x="0" y="177" width="400" height="55" fill="#6d4c41" />
    {/* Espresso machine */}
    <rect x="15" y="120" width="70" height="50" rx="5" fill="#bdbdbd" />
    <rect x="20" y="125" width="60" height="30" rx="3" fill="#e0e0e0" />
    <circle cx="35" cy="145" r="8" fill="#9e9e9e" />
    <circle cx="65" cy="145" r="8" fill="#9e9e9e" />
    <rect x="25" y="155" width="50" height="8" rx="2" fill="#757575" />
    {/* Cups on counter */}
    <rect x="110" y="148" width="18" height="15" rx="2" fill="#fff" />
    <rect x="110" y="163" width="22" height="4" rx="1" fill="#fff" />
    <ellipse cx="119" cy="148" rx="9" ry="3" fill="#ffe0b2" />
    <rect x="140" y="150" width="18" height="15" rx="2" fill="#e8f5e9" />
    <rect x="140" y="165" width="22" height="4" rx="1" fill="#e8f5e9" />
    {/* Cake display */}
    <rect
      x="290"
      y="130"
      width="100"
      height="40"
      rx="3"
      fill="#f5f5f5"
      stroke="#e0e0e0"
      strokeWidth="1"
    />
    <ellipse cx="310" cy="130" rx="15" ry="8" fill="#f48fb1" />
    <rect x="295" y="122" width="30" height="10" rx="3" fill="#f8bbd0" />
    <ellipse cx="350" cy="130" rx="15" ry="8" fill="#fff9c4" />
    <rect x="335" y="122" width="30" height="10" rx="3" fill="#fffde7" />
    {/* Tables in cafe */}
    <ellipse cx="140" cy="215" rx="45" ry="15" fill="#8d6e63" />
    <rect x="130" y="215" width="20" height="25" fill="#795548" />
    <ellipse cx="140" cy="240" rx="25" ry="8" fill="#6d4c41" />
    {/* Chairs */}
    <rect x="85" y="210" width="30" height="25" rx="3" fill="#a1887f" />
    <rect x="80" y="208" width="35" height="5" rx="2" fill="#8d6e63" />
    <rect x="175" y="210" width="30" height="25" rx="3" fill="#a1887f" />
    <rect x="173" y="208" width="35" height="5" rx="2" fill="#8d6e63" />
    {/* Coffees on table */}
    <circle cx="125" cy="210" r="6" fill="#fff" />
    <circle cx="125" cy="210" r="4" fill="#795548" />
    <circle cx="155" cy="210" r="6" fill="#fff" />
    <circle cx="155" cy="210" r="4" fill="#5d4037" />
    {/* Hanging lamp */}
    <line x1="140" y1="0" x2="140" y2="160" stroke="#6d4c41" strokeWidth="2" />
    <ellipse cx="140" cy="163" rx="20" ry="8" fill="#f57f17" />
    <ellipse cx="140" cy="160" rx="18" ry="6" fill="#ffca28" />
  </svg>
);

export const SVG_beach = (
  <svg
    viewBox="0 0 400 320"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
  >
    {/* Sky */}
    <rect width="400" height="320" fill="#87ceeb" />
    {/* Gradient sky */}
    <rect width="400" height="160" fill="#64b5f6" opacity="0.5" />
    {/* Sun */}
    <circle cx="340" cy="55" r="35" fill="#fdd835" />
    <circle cx="340" cy="55" r="28" fill="#ffee58" />
    {/* Sun rays */}
    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
      const rad = (angle * Math.PI) / 180;
      return (
        <line
          key={i}
          x1={340 + 32 * Math.cos(rad)}
          y1={55 + 32 * Math.sin(rad)}
          x2={340 + 48 * Math.cos(rad)}
          y2={55 + 48 * Math.sin(rad)}
          stroke="#fdd835"
          strokeWidth="3"
        />
      );
    })}
    {/* Clouds */}
    <ellipse cx="80" cy="50" rx="40" ry="20" fill="white" opacity="0.9" />
    <ellipse cx="60" cy="55" rx="25" ry="16" fill="white" opacity="0.9" />
    <ellipse cx="105" cy="55" rx="28" ry="16" fill="white" opacity="0.9" />
    <ellipse cx="220" cy="35" rx="35" ry="18" fill="white" opacity="0.85" />
    <ellipse cx="200" cy="40" rx="22" ry="14" fill="white" opacity="0.85" />
    {/* Sea */}
    <rect x="0" y="130" width="400" height="90" fill="#1e88e5" />
    <rect x="0" y="130" width="400" height="10" fill="#42a5f5" />
    {/* Waves */}
    <path
      d="M0 145 Q40 138 80 145 Q120 152 160 145 Q200 138 240 145 Q280 152 320 145 Q360 138 400 145"
      stroke="white"
      strokeWidth="2"
      fill="none"
      opacity="0.6"
    />
    <path
      d="M0 160 Q50 153 100 160 Q150 167 200 160 Q250 153 300 160 Q350 167 400 160"
      stroke="white"
      strokeWidth="2"
      fill="none"
      opacity="0.4"
    />
    {/* Sailboat */}
    <polygon points="260,115 280,90 280,135" fill="white" />
    <polygon points="280,95 300,115 280,130" fill="#ef9a9a" />
    <rect x="278" y="90" width="4" height="48" fill="#6d4c41" />
    <ellipse cx="280" cy="138" rx="22" ry="8" fill="#8d6e63" />
    {/* Sandy beach */}
    <rect x="0" y="220" width="400" height="100" fill="#f5deb3" />
    <rect x="0" y="220" width="400" height="15" fill="#f0d090" />
    {/* Beach umbrella */}
    <line x1="110" y1="170" x2="110" y2="270" stroke="#6d4c41" strokeWidth="4" />
    <ellipse cx="110" cy="170" rx="60" ry="20" fill="#e53935" />
    <ellipse cx="110" cy="170" rx="60" ry="20" fill="none" stroke="#b71c1c" strokeWidth="1" />
    {[0, 60, 120, 180, 240, 300].map((a, i) => {
      const rad = (a * Math.PI) / 180;
      return (
        <line
          key={i}
          x1="110"
          y1="170"
          x2={110 + 58 * Math.cos(rad)}
          y2={170 + 18 * Math.sin(rad)}
          stroke="#b71c1c"
          strokeWidth="1"
        />
      );
    })}
    {/* Beach towel */}
    <rect x="55" y="252" width="100" height="40" rx="3" fill="#42a5f5" />
    <line x1="55" y1="260" x2="155" y2="260" stroke="#1976d2" strokeWidth="1" />
    <line x1="55" y1="272" x2="155" y2="272" stroke="#1976d2" strokeWidth="1" />
    <line x1="55" y1="284" x2="155" y2="284" stroke="#1976d2" strokeWidth="1" />
    {/* Ice cream stand */}
    <rect x="10" y="215" width="35" height="60" rx="3" fill="#f8bbd0" />
    <ellipse cx="27" cy="215" rx="17" ry="6" fill="#f48fb1" />
    <text x="27" y="245" textAnchor="middle" fontSize="9" fill="#880e4f">
      ICE
    </text>
    <text x="27" y="258" textAnchor="middle" fontSize="9" fill="#880e4f">
      CREAM
    </text>
    {/* Shells on beach */}
    <ellipse cx="270" cy="248" rx="12" ry="8" fill="#ffe082" stroke="#f9a825" strokeWidth="1" />
    <ellipse cx="310" cy="260" rx="10" ry="7" fill="#ffccbc" stroke="#ff8a65" strokeWidth="1" />
    <ellipse cx="350" cy="250" rx="11" ry="8" fill="#ffe0b2" stroke="#ff9800" strokeWidth="1" />
    {/* Ball */}
    <circle cx="360" cy="240" r="15" fill="#ef5350" />
    <path d="M348,232 Q360,238 372,232" stroke="white" strokeWidth="1.5" fill="none" />
    <path d="M346,242 Q360,248 374,242" stroke="white" strokeWidth="1.5" fill="none" />
    <line x1="360" y1="225" x2="360" y2="255" stroke="white" strokeWidth="1.5" />
  </svg>
);

export const SVG_livingroom = (
  <svg
    viewBox="0 0 400 320"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
  >
    {/* Wall */}
    <rect width="400" height="320" fill="#f3e5f5" />
    {/* Floor */}
    <rect x="0" y="235" width="400" height="85" fill="#efebe9" />
    {/* Baseboard */}
    <rect x="0" y="232" width="400" height="5" fill="#d7ccc8" />
    {/* Wood floor planks */}
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <rect
        key={i}
        x="0"
        y={237 + i * 14}
        width="400"
        height="13"
        fill={i % 2 === 0 ? '#d7ccc8' : '#cfc4be'}
        opacity="0.5"
      />
    ))}
    {/* Door (left) */}
    <rect x="5" y="100" width="65" height="135" rx="3" fill="#a1887f" />
    <rect x="8" y="103" width="59" height="129" rx="2" fill="#bcaaa4" />
    <rect x="10" y="105" width="55" height="60" rx="2" fill="#d7ccc8" />
    <rect x="10" y="170" width="55" height="59" rx="2" fill="#d7ccc8" />
    <circle cx="59" cy="170" r="5" fill="#ffd54f" />
    {/* Picture/painting on wall */}
    <rect x="160" y="25" width="80" height="60" rx="3" fill="#3949ab" />
    <rect x="164" y="29" width="72" height="52" rx="2" fill="#5c6bc0" />
    <ellipse cx="200" cy="55" rx="20" ry="15" fill="#7986cb" />
    <rect x="163" y="22" width="74" height="6" fill="#6d4c41" />
    {/* Window (right wall) */}
    <rect x="295" y="30" width="100" height="100" rx="4" fill="#bbdefb" />
    <rect
      x="295"
      y="30"
      width="100"
      height="100"
      rx="4"
      fill="none"
      stroke="#6d4c41"
      strokeWidth="3"
    />
    <line x1="345" y1="30" x2="345" y2="130" stroke="#6d4c41" strokeWidth="2" />
    <line x1="295" y1="80" x2="395" y2="80" stroke="#6d4c41" strokeWidth="2" />
    {/* Curtains */}
    <path d="M295,30 Q310,55 300,80 Q305,55 315,30" fill="#ce93d8" opacity="0.9" />
    <path d="M395,30 Q380,55 390,80 Q385,55 375,30" fill="#ce93d8" opacity="0.9" />
    {/* TV on stand */}
    <rect x="130" y="120" width="140" height="90" rx="4" fill="#212121" />
    <rect x="134" y="124" width="132" height="75" rx="3" fill="#1a237e" />
    {/* TV screen content - simple landscape */}
    <rect x="134" y="124" width="132" height="50" fill="#1565c0" />
    <rect x="134" y="174" width="132" height="25" fill="#2e7d32" />
    <circle cx="200" cy="150" r="12" fill="#fdd835" />
    <rect x="188" y="210" width="24" height="15" fill="#424242" />
    <rect x="168" y="224" width="64" height="6" rx="2" fill="#616161" />
    {/* TV stand */}
    <rect x="110" y="210" width="180" height="20" rx="3" fill="#4e342e" />
    <rect x="110" y="225" width="180" height="10" rx="2" fill="#3e2723" />
    {/* Floor lamp (left of TV) */}
    <rect x="90" y="110" width="5" height="120" fill="#9e9e9e" />
    <ellipse cx="92" cy="118" rx="22" ry="12" fill="#ffd54f" />
    <ellipse cx="92" cy="108" rx="20" ry="8" fill="#ffee58" />
    {/* Bookshelf (right) */}
    <rect x="310" y="140" width="80" height="95" rx="3" fill="#795548" />
    <rect x="314" y="144" width="72" height="25" rx="2" fill="#bcaaa4" />
    <rect x="314" y="174" width="72" height="25" rx="2" fill="#bcaaa4" />
    <rect x="314" y="204" width="72" height="25" rx="2" fill="#bcaaa4" />
    {/* Books */}
    {[320, 332, 344, 356, 368].map((x, i) => (
      <rect
        key={x}
        x={x}
        y="146"
        width="10"
        height="22"
        rx="1"
        fill={['#ef5350', '#42a5f5', '#66bb6a', '#ffa726', '#ab47bc'][i]}
      />
    ))}
    {[318, 330, 342, 354, 366, 378].map((x, i) => (
      <rect
        key={x}
        x={x}
        y="176"
        width="9"
        height="22"
        rx="1"
        fill={['#26c6da', '#ec407a', '#ffee58', '#8d6e63', '#78909c', '#ef5350'][i]}
      />
    ))}
    {/* Sofa */}
    <rect x="60" y="225" width="230" height="60" rx="8" fill="#7e57c2" />
    <rect x="60" y="210" width="230" height="20" rx="5" fill="#9575cd" />
    <rect x="60" y="210" width="20" height="75" rx="5" fill="#9575cd" />
    <rect x="270" y="210" width="20" height="75" rx="5" fill="#9575cd" />
    {/* Sofa cushions */}
    <rect x="85" y="215" width="60" height="30" rx="4" fill="#b39ddb" />
    <rect x="155" y="215" width="60" height="30" rx="4" fill="#b39ddb" />
    <rect x="225" y="215" width="45" height="30" rx="4" fill="#b39ddb" />
    {/* Coffee table */}
    <rect x="120" y="278" width="160" height="40" rx="4" fill="#8d6e63" />
    <rect x="120" y="278" width="160" height="8" rx="3" fill="#a1887f" />
    {/* Remote & cup on table */}
    <rect x="165" y="282" width="35" height="12" rx="3" fill="#424242" />
    <rect x="213" y="280" width="14" height="16" rx="2" fill="#ffe0b2" />
    {/* Clock on wall */}
    <circle cx="85" cy="55" r="22" fill="#fafafa" stroke="#9e9e9e" strokeWidth="2" />
    <circle cx="85" cy="55" r="2" fill="#424242" />
    <line x1="85" y1="55" x2="85" y2="40" stroke="#212121" strokeWidth="2" />
    <line x1="85" y1="55" x2="96" y2="60" stroke="#212121" strokeWidth="1.5" />
  </svg>
);

export const SVG_classroom = (
  <svg
    viewBox="0 0 400 320"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
  >
    {/* Wall */}
    <rect width="400" height="320" fill="#e3f2fd" />
    {/* Floor */}
    <rect x="0" y="240" width="400" height="80" fill="#f5f5f5" />
    {/* Floor tiles */}
    {[0, 80, 160, 240, 320].map((x) =>
      [0].map((y) => (
        <rect
          key={x}
          x={x}
          y={240}
          width="80"
          height="80"
          fill="none"
          stroke="#e0e0e0"
          strokeWidth="1"
        />
      )),
    )}
    {/* Window */}
    <rect x="300" y="20" width="90" height="120" rx="4" fill="#b3e5fc" />
    <rect
      x="300"
      y="20"
      width="90"
      height="120"
      rx="4"
      fill="none"
      stroke="#0277bd"
      strokeWidth="3"
    />
    <line x1="345" y1="20" x2="345" y2="140" stroke="#0277bd" strokeWidth="2" />
    <line x1="300" y1="80" x2="390" y2="80" stroke="#0277bd" strokeWidth="2" />
    {/* Sunlight patch */}
    <polygon points="300,20 390,20 390,140 300,140" fill="#fff9c4" opacity="0.2" />
    {/* Blackboard */}
    <rect x="40" y="15" width="240" height="120" rx="4" fill="#1a3a2a" />
    <rect x="44" y="19" width="232" height="112" rx="3" fill="#2d5a3d" />
    {/* Chalk writing on board */}
    <text
      x="160"
      y="55"
      textAnchor="middle"
      fontSize="14"
      fontWeight="bold"
      fill="white"
      opacity="0.9"
    >
      Dobro jutro!
    </text>
    <text x="160" y="80" textAnchor="middle" fontSize="11" fill="#b2dfdb" opacity="0.8">
      Kako se zoveš?
    </text>
    {/* Drawn letters */}
    <text x="70" y="108" fontSize="11" fill="#80cbc4" opacity="0.7">
      A, B, C, D, E...
    </text>
    {/* Chalk tray */}
    <rect x="40" y="135" width="240" height="8" rx="2" fill="#424242" />
    <rect x="55" y="136" width="18" height="6" rx="1" fill="#f5f5f5" />
    <rect x="78" y="136" width="18" height="6" rx="1" fill="#ffcc02" />
    <rect x="100" y="136" width="18" height="6" rx="1" fill="#f5f5f5" />
    {/* Teacher */}
    <circle cx="25" cy="120" r="15" fill="#ffcc80" />
    <rect x="12" y="135" width="26" height="40" rx="4" fill="#1565c0" />
    <rect x="6" y="137" width="12" height="28" rx="4" fill="#1565c0" />
    <rect x="32" y="145" width="12" height="10" rx="2" fill="#ffcc80" />
    {/* Globe */}
    <circle cx="355" cy="175" r="25" fill="#1976d2" />
    <ellipse cx="355" cy="175" rx="25" ry="10" fill="none" stroke="#0d47a1" strokeWidth="1" />
    <ellipse cx="355" cy="175" rx="10" ry="25" fill="none" stroke="#0d47a1" strokeWidth="1" />
    <ellipse cx="344" cy="163" rx="8" ry="5" fill="#4caf50" />
    <ellipse cx="365" cy="175" rx="6" ry="8" fill="#4caf50" />
    <rect x="350" y="200" width="10" height="20" fill="#795548" />
    <ellipse cx="355" cy="220" rx="18" ry="5" fill="#6d4c41" />
    {/* World map on wall */}
    <rect
      x="40"
      y="155"
      width="120"
      height="75"
      rx="3"
      fill="#e8f5e9"
      stroke="#a5d6a7"
      strokeWidth="1.5"
    />
    <ellipse cx="80" cy="190" rx="18" ry="12" fill="#66bb6a" opacity="0.8" />
    <ellipse cx="110" cy="183" rx="25" ry="8" fill="#42a5f5" opacity="0.6" />
    <ellipse cx="130" cy="195" rx="12" ry="15" fill="#66bb6a" opacity="0.7" />
    <text x="100" y="222" textAnchor="middle" fontSize="8" fill="#388e3c">
      Karta svijeta
    </text>
    {/* Student desks */}
    <rect x="40" y="255" width="70" height="10" rx="2" fill="#a1887f" />
    <rect x="50" y="265" width="10" height="25" fill="#8d6e63" />
    <rect x="90" y="265" width="10" height="25" fill="#8d6e63" />
    {/* Notebook on desk */}
    <rect
      x="45"
      y="246"
      width="40"
      height="30"
      rx="2"
      fill="#fff9c4"
      stroke="#f9a825"
      strokeWidth="1"
    />
    <line x1="48" y1="255" x2="82" y2="255" stroke="#bdbdbd" strokeWidth="1" />
    <line x1="48" y1="262" x2="82" y2="262" stroke="#bdbdbd" strokeWidth="1" />
    <line x1="48" y1="269" x2="82" y2="269" stroke="#bdbdbd" strokeWidth="1" />
    <rect x="150" y="255" width="70" height="10" rx="2" fill="#a1887f" />
    <rect x="160" y="265" width="10" height="25" fill="#8d6e63" />
    <rect x="200" y="265" width="10" height="25" fill="#8d6e63" />
    <rect
      x="155"
      y="246"
      width="40"
      height="30"
      rx="2"
      fill="#e3f2fd"
      stroke="#1976d2"
      strokeWidth="1"
    />
    <rect x="270" y="255" width="70" height="10" rx="2" fill="#a1887f" />
    <rect x="280" y="265" width="10" height="25" fill="#8d6e63" />
    <rect x="320" y="265" width="10" height="25" fill="#8d6e63" />
    {/* Backpack */}
    <rect x="270" y="232" width="30" height="36" rx="5" fill="#ef5350" />
    <rect
      x="275"
      y="242"
      width="20"
      height="14"
      rx="3"
      fill="#e53935"
      stroke="#c62828"
      strokeWidth="1"
    />
    <rect x="281" y="240" width="8" height="4" rx="2" fill="#ffcdd2" />
    {/* Pencil on desk */}
    <rect
      x="162"
      y="256"
      width="5"
      height="30"
      rx="1"
      fill="#ffd54f"
      transform="rotate(-10,164,271)"
    />
    <polygon points="162,256 167,256 164.5,250" fill="#ff8f00" transform="rotate(-10,164,271)" />
  </svg>
);

export const SVG_city = (
  <svg
    viewBox="0 0 400 320"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
  >
    {/* Sky */}
    <rect width="400" height="320" fill="#87ceeb" />
    <rect width="400" height="200" fill="#b0d4f1" opacity="0.5" />
    {/* Clouds */}
    <ellipse cx="60" cy="40" rx="40" ry="20" fill="white" opacity="0.9" />
    <ellipse cx="40" cy="46" rx="25" ry="16" fill="white" opacity="0.9" />
    <ellipse cx="85" cy="46" rx="28" ry="16" fill="white" opacity="0.9" />
    <ellipse cx="300" cy="30" rx="45" ry="22" fill="white" opacity="0.85" />
    <ellipse cx="275" cy="38" rx="28" ry="16" fill="white" opacity="0.85" />
    <ellipse cx="335" cy="38" rx="25" ry="16" fill="white" opacity="0.85" />
    {/* Road */}
    <rect x="0" y="240" width="400" height="80" fill="#616161" />
    {/* Road markings */}
    <rect x="0" y="276" width="400" height="6" fill="#fdd835" opacity="0.8" />
    {[0, 60, 120, 180, 240, 300, 360].map((x) => (
      <rect key={x} x={x} y="255" width="40" height="6" fill="white" opacity="0.6" />
    ))}
    {/* Sidewalk */}
    <rect x="0" y="220" width="400" height="22" fill="#bdbdbd" />
    {/* Building 1 (left, tall) */}
    <rect x="10" y="70" width="70" height="155" rx="2" fill="#78909c" />
    {/* Windows */}
    {[85, 110, 135, 160, 185].map((y) =>
      [20, 40, 60].map((x) => (
        <rect key={`${x}-${y}`} x={10 + x} y={y} width="12" height="16" rx="1" fill="#b3e5fc" />
      )),
    )}
    {/* Building 2 (pharmacy) */}
    <rect x="5" y="120" width="65" height="105" rx="2" fill="#80cbc4" />
    <rect x="15" y="195" width="35" height="30" rx="2" fill="#b2dfdb" />
    <text x="32" y="185" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#004d40">
      LJEKARNA
    </text>
    <text x="32" y="195" textAnchor="middle" fontSize="11" fill="#00695c">
      +
    </text>
    {/* Main tall building */}
    <rect x="95" y="40" width="90" height="185" rx="3" fill="#546e7a" />
    {[55, 80, 105, 130, 155, 180].map((y) =>
      [105, 125, 155, 170].map((x) => (
        <rect
          key={`${x}-${y}`}
          x={x}
          y={y}
          width="14"
          height="18"
          rx="1"
          fill={y === 155 || y === 180 ? '#ffd54f' : '#b3e5fc'}
        />
      )),
    )}
    {/* Shop front */}
    <rect x="95" y="190" width="90" height="35" rx="2" fill="#ff8a65" />
    <rect x="100" y="195" width="78" height="25" rx="2" fill="#ffccbc" />
    <text x="140" y="212" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#bf360c">
      DUĆAN
    </text>
    {/* Church */}
    <rect x="250" y="100" width="80" height="125" rx="3" fill="#eeeeee" />
    <polygon points="250,100 290,55 330,100" fill="#f5f5f5" />
    {/* Cross */}
    <rect x="286" y="60" width="8" height="30" fill="#bdbdbd" />
    <rect x="280" y="72" width="20" height="6" fill="#bdbdbd" />
    {/* Church windows */}
    <rect x="262" y="115" width="20" height="35" rx="10" fill="#b3e5fc" />
    <rect x="298" y="115" width="20" height="35" rx="10" fill="#b3e5fc" />
    <rect x="265" y="160" width="50" height="40" rx="3" fill="#d7ccc8" />
    {/* Office block (right) */}
    <rect x="345" y="80" width="55" height="145" rx="2" fill="#90a4ae" />
    {[90, 110, 130, 150, 170, 190].map((y) =>
      [352, 368].map((x) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="12" height="12" rx="1" fill="#b3e5fc" />
      )),
    )}
    {/* Tree */}
    <rect x="210" y="195" width="8" height="30" fill="#6d4c41" />
    <circle cx="214" cy="185" r="22" fill="#4caf50" />
    <circle cx="200" cy="192" r="16" fill="#66bb6a" />
    <circle cx="228" cy="190" r="16" fill="#388e3c" />
    {/* Fountain */}
    <ellipse cx="190" cy="232" rx="30" ry="10" fill="#b3e5fc" stroke="#1976d2" strokeWidth="2" />
    <ellipse cx="190" cy="230" rx="22" ry="7" fill="#64b5f6" />
    <rect x="187" y="215" width="6" height="18" fill="#9e9e9e" />
    {/* Tram */}
    <rect x="100" y="245" width="90" height="35" rx="5" fill="#1565c0" />
    <rect x="105" y="250" width="20" height="20" rx="2" fill="#b3e5fc" />
    <rect x="130" y="250" width="20" height="20" rx="2" fill="#b3e5fc" />
    <rect x="155" y="250" width="20" height="20" rx="2" fill="#b3e5fc" />
    <circle cx="120" cy="283" r="7" fill="#424242" />
    <circle cx="170" cy="283" r="7" fill="#424242" />
    <line x1="0" y1="283" x2="400" y2="283" stroke="#757575" strokeWidth="2" />
    {/* Car */}
    <rect x="240" y="248" width="70" height="28" rx="6" fill="#ef5350" />
    <rect x="250" y="241" width="50" height="20" rx="4" fill="#e53935" />
    <rect x="253" y="244" width="18" height="14" rx="2" fill="#b3e5fc" />
    <rect x="278" y="244" width="18" height="14" rx="2" fill="#b3e5fc" />
    <circle cx="257" cy="278" r="8" fill="#212121" />
    <circle cx="293" cy="278" r="8" fill="#212121" />
    {/* Bike */}
    <circle cx="360" cy="265" r="10" fill="none" stroke="#424242" strokeWidth="2" />
    <circle cx="385" cy="265" r="10" fill="none" stroke="#424242" strokeWidth="2" />
    <line x1="360" y1="265" x2="372" y2="255" stroke="#616161" strokeWidth="2" />
    <line x1="372" y1="255" x2="385" y2="265" stroke="#616161" strokeWidth="2" />
    <line x1="372" y1="255" x2="372" y2="248" stroke="#616161" strokeWidth="2" />
    <line x1="368" y1="248" x2="378" y2="248" stroke="#616161" strokeWidth="2" />
    {/* Bench */}
    <rect x="215" y="235" width="50" height="6" rx="2" fill="#8d6e63" />
    <rect x="220" y="241" width="8" height="15" rx="2" fill="#795548" />
    <rect x="252" y="241" width="8" height="15" rx="2" fill="#795548" />
    <rect x="215" y="230" width="50" height="5" rx="2" fill="#a1887f" />
  </svg>
);

export const SVG_home = (
  <svg
    viewBox="0 0 400 320"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
  >
    {/* Sky */}
    <rect width="400" height="320" fill="#bbdefb" />
    {/* Clouds */}
    <ellipse cx="80" cy="40" rx="40" ry="18" fill="white" opacity="0.9" />
    <ellipse cx="60" cy="46" rx="25" ry="14" fill="white" opacity="0.9" />
    <ellipse cx="105" cy="46" rx="28" ry="14" fill="white" opacity="0.9" />
    <ellipse cx="310" cy="35" rx="45" ry="20" fill="white" opacity="0.85" />
    {/* Ground / lawn */}
    <rect x="0" y="240" width="400" height="80" fill="#81c784" />
    <rect x="0" y="238" width="400" height="8" fill="#66bb6a" />
    {/* Driveway */}
    <rect x="290" y="220" width="110" height="100" fill="#bdbdbd" />
    {/* Fence */}
    {[10, 30, 50, 70, 90].map((x) => (
      <rect key={x} x={x} y="220" width="8" height="30" rx="2" fill="#a1887f" />
    ))}
    <rect x="10" y="228" width="92" height="6" rx="2" fill="#8d6e63" />
    <rect x="10" y="238" width="92" height="6" rx="2" fill="#8d6e63" />
    {/* Path to door */}
    <rect x="178" y="218" width="44" height="30" fill="#d7ccc8" />
    {[0, 10, 20].map((y) => (
      <rect key={y} x="180" y={220 + y} width="40" height="8" rx="1" fill="#bcaaa4" />
    ))}
    {/* Main house body */}
    <rect x="80" y="130" width="240" height="120" rx="4" fill="#fff9f0" />
    {/* Roof */}
    <polygon points="60,130 200,55 340,130" fill="#c62828" />
    <polygon points="62,130 200,57 338,130" fill="#e53935" />
    {/* Roof shadow */}
    <polygon points="60,130 200,57 200,65 70,130" fill="#b71c1c" opacity="0.3" />
    {/* Chimney */}
    <rect x="265" y="70" width="25" height="55" rx="2" fill="#8d6e63" />
    <rect x="260" y="68" width="35" height="8" rx="2" fill="#795548" />
    {/* Smoke */}
    <ellipse cx="277" cy="60" rx="6" ry="9" fill="#e0e0e0" opacity="0.7" />
    <ellipse cx="280" cy="48" rx="8" ry="10" fill="#eeeeee" opacity="0.5" />
    {/* Front door */}
    <rect x="175" y="185" width="50" height="65" rx="4" fill="#5d4037" />
    <rect x="179" y="189" width="42" height="57" rx="3" fill="#6d4c41" />
    <rect x="181" y="191" width="18" height="28" rx="2" fill="#795548" />
    <rect x="201" y="191" width="18" height="28" rx="2" fill="#795548" />
    <circle cx="196" cy="220" r="4" fill="#fdd835" />
    <circle cx="204" cy="220" r="4" fill="#fdd835" />
    {/* Doorstep */}
    <rect x="168" y="248" width="64" height="6" rx="2" fill="#bcaaa4" />
    {/* Left window */}
    <rect
      x="95"
      y="155"
      width="65"
      height="55"
      rx="3"
      fill="#b3e5fc"
      stroke="#795548"
      strokeWidth="2.5"
    />
    <line x1="127" y1="155" x2="127" y2="210" stroke="#795548" strokeWidth="2" />
    <line x1="95" y1="182" x2="160" y2="182" stroke="#795548" strokeWidth="2" />
    {/* Left window curtain */}
    <path d="M95,155 Q106,168 99,182 Q103,168 109,155" fill="#ffccbc" opacity="0.8" />
    <path d="M160,155 Q149,168 156,182 Q152,168 146,155" fill="#ffccbc" opacity="0.8" />
    {/* Right window */}
    <rect
      x="240"
      y="155"
      width="65"
      height="55"
      rx="3"
      fill="#b3e5fc"
      stroke="#795548"
      strokeWidth="2.5"
    />
    <line x1="272" y1="155" x2="272" y2="210" stroke="#795548" strokeWidth="2" />
    <line x1="240" y1="182" x2="305" y2="182" stroke="#795548" strokeWidth="2" />
    {/* Balcony above door */}
    <rect
      x="155"
      y="145"
      width="90"
      height="45"
      rx="3"
      fill="none"
      stroke="#795548"
      strokeWidth="2"
    />
    <rect x="155" y="143" width="90" height="8" rx="2" fill="#8d6e63" />
    {[163, 175, 187, 199, 211, 223, 235].map((x) => (
      <rect key={x} x={x} y="151" width="5" height="35" rx="1" fill="#a1887f" />
    ))}
    {/* Mailbox */}
    <rect x="348" y="218" width="30" height="20" rx="3" fill="#e53935" />
    <rect x="348" y="218" width="30" height="10" rx="3" fill="#ef5350" />
    <rect x="357" y="228" width="12" height="3" rx="1" fill="#fdd835" />
    <rect x="362" y="210" width="4" height="12" fill="#9e9e9e" />
    {/* Dog */}
    <ellipse cx="130" cy="265" rx="20" ry="12" fill="#d4a574" />
    <circle cx="148" cy="256" r="10" fill="#d4a574" />
    <ellipse cx="155" cy="253" rx="6" ry="4" fill="#c49060" />
    <circle cx="151" cy="252" r="2" fill="#333" />
    <rect x="115" y="270" width="6" height="14" rx="2" fill="#c49060" />
    <rect x="123" y="272" width="6" height="12" rx="2" fill="#c49060" />
    <rect x="135" y="272" width="6" height="12" rx="2" fill="#c49060" />
    <rect x="143" y="270" width="6" height="14" rx="2" fill="#c49060" />
    <rect
      x="148"
      y="260"
      width="20"
      height="4"
      rx="2"
      fill="#c49060"
      transform="rotate(30,148,262)"
    />
    {/* Croatian flag */}
    <rect x="355" y="110" width="4" height="70" fill="#9e9e9e" />
    <rect x="359" y="110" width="32" height="12" fill="#e53935" />
    <rect x="359" y="122" width="32" height="12" fill="white" />
    <rect x="359" y="134" width="32" height="12" fill="#1565c0" />
    {/* Garden / flowers */}
    {[18, 32, 46, 60, 75].map((x) => (
      <g key={x}>
        <rect x={x + 2} y="252" width="3" height="12" fill="#66bb6a" />
        <circle
          cx={x + 3}
          cy="251"
          r="5"
          fill={['#f44336', '#fdd835', '#e91e63', '#ff9800', '#9c27b0'][x % 5]}
        />
      </g>
    ))}
    {/* Car in driveway */}
    <rect x="305" y="248" width="75" height="28" rx="6" fill="#1565c0" />
    <rect x="315" y="240" width="55" height="20" rx="4" fill="#1976d2" />
    <rect x="318" y="242" width="18" height="14" rx="2" fill="#b3e5fc" />
    <rect x="342" y="242" width="18" height="14" rx="2" fill="#b3e5fc" />
    <circle cx="322" cy="278" r="8" fill="#212121" />
    <circle cx="360" cy="278" r="8" fill="#212121" />
  </svg>
);

export const SCENE_SVGS = {
  kitchen: SVG_kitchen,
  market: SVG_market,
  cafe: SVG_cafe,
  beach: SVG_beach,
  livingroom: SVG_livingroom,
  classroom: SVG_classroom,
  city: SVG_city,
  home: SVG_home,
};
