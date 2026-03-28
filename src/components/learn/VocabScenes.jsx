import React, { useState, useEffect, useRef, useCallback } from 'react';
import { H } from '../../data.jsx';
import { speak } from '../../lib/audio.js';

// ─── Scene Data ──────────────────────────────────────────────────────────────

// ─── Scene SVG Illustrations ─────────────────────────────────────────────────

const SVG_kitchen = (
  <svg viewBox="0 0 400 320" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}>
    {/* Sky/wall */}
    <rect width="400" height="320" fill="#fef9f0"/>
    {/* Floor */}
    <rect x="0" y="220" width="400" height="100" fill="#e8d5b7"/>
    {/* Floor tiles */}
    {[0,80,160,240,320].map(x => [0,40,80].map(y => (
      <rect key={`${x}-${y}`} x={x} y={220+y} width="80" height="40" fill="none" stroke="#d4b896" strokeWidth="1"/>
    )))}
    {/* Back counter top */}
    <rect x="0" y="175" width="400" height="15" fill="#8b6f47"/>
    {/* Counter cabinet */}
    <rect x="0" y="190" width="400" height="30" fill="#a07850"/>
    {/* Cabinet doors */}
    <rect x="5" y="193" width="90" height="24" rx="2" fill="#b8905a" stroke="#8b6f47" strokeWidth="1"/>
    <rect x="100" y="193" width="90" height="24" rx="2" fill="#b8905a" stroke="#8b6f47" strokeWidth="1"/>
    <rect x="195" y="193" width="90" height="24" rx="2" fill="#b8905a" stroke="#8b6f47" strokeWidth="1"/>
    <rect x="290" y="193" width="105" height="24" rx="2" fill="#b8905a" stroke="#8b6f47" strokeWidth="1"/>
    {/* Wall cabinets */}
    <rect x="0" y="40" width="110" height="80" rx="4" fill="#c4a27a" stroke="#8b6f47" strokeWidth="1.5"/>
    <rect x="4" y="44" width="50" height="72" rx="2" fill="#d4b28a" stroke="#a07850" strokeWidth="1"/>
    <rect x="56" y="44" width="50" height="72" rx="2" fill="#d4b28a" stroke="#a07850" strokeWidth="1"/>
    <circle cx="31" cy="80" r="3" fill="#8b6f47"/>
    <circle cx="81" cy="80" r="3" fill="#8b6f47"/>
    <rect x="270" y="40" width="130" height="80" rx="4" fill="#c4a27a" stroke="#8b6f47" strokeWidth="1.5"/>
    <rect x="274" y="44" width="58" height="72" rx="2" fill="#d4b28a" stroke="#a07850" strokeWidth="1"/>
    <rect x="334" y="44" width="62" height="72" rx="2" fill="#d4b28a" stroke="#a07850" strokeWidth="1"/>
    <circle cx="303" cy="80" r="3" fill="#8b6f47"/>
    <circle cx="365" cy="80" r="3" fill="#8b6f47"/>
    {/* Window */}
    <rect x="140" y="30" width="120" height="90" rx="4" fill="#b8e0f7"/>
    <rect x="140" y="30" width="120" height="90" rx="4" fill="none" stroke="#8b6f47" strokeWidth="3"/>
    <line x1="200" y1="30" x2="200" y2="120" stroke="#8b6f47" strokeWidth="2"/>
    <line x1="140" y1="75" x2="260" y2="75" stroke="#8b6f47" strokeWidth="2"/>
    {/* Sunshine through window */}
    <rect x="142" y="32" width="56" height="41" fill="#fffde7" opacity="0.4"/>
    {/* Stove */}
    <rect x="10" y="135" width="90" height="42" rx="3" fill="#555"/>
    <rect x="12" y="137" width="86" height="30" rx="2" fill="#444"/>
    <circle cx="35" cy="148" r="10" fill="#333"/>
    <circle cx="35" cy="148" r="6" fill="#222"/>
    <circle cx="75" cy="148" r="10" fill="#333"/>
    <circle cx="75" cy="148" r="6" fill="#222"/>
    <rect x="14" y="168" width="82" height="6" rx="2" fill="#666"/>
    {/* Sink */}
    <rect x="195" y="148" width="70" height="32" rx="5" fill="#bbb"/>
    <rect x="199" y="152" width="62" height="24" rx="3" fill="#999"/>
    <rect x="226" y="138" width="6" height="16" rx="3" fill="#888"/>
    <circle cx="229" cy="136" r="5" fill="#777"/>
    {/* Kettle */}
    <ellipse cx="310" cy="162" rx="22" ry="18" fill="#e53935"/>
    <rect x="330" y="155" width="6" height="8" rx="2" fill="#c62828"/>
    <rect x="308" y="144" width="4" height="10" rx="2" fill="#b71c1c"/>
    {/* Bread on counter */}
    <ellipse cx="150" cy="172" rx="22" ry="8" fill="#d4a574"/>
    <ellipse cx="150" cy="168" rx="20" ry="7" fill="#e8b888"/>
    {/* Cup */}
    <rect x="115" y="158" width="20" height="18" rx="3" fill="#e57373"/>
    <path d="M135 163 Q143 166 135 172" stroke="#e57373" strokeWidth="3" fill="none"/>
  </svg>
);

const SVG_market = (
  <svg viewBox="0 0 400 320" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}>
    {/* Sky */}
    <rect width="400" height="320" fill="#e8f5e9"/>
    {/* Ground */}
    <rect x="0" y="240" width="400" height="80" fill="#c8e6c9"/>
    {/* Market canopy */}
    <polygon points="0,60 400,60 370,100 30,100" fill="#e53935"/>
    <polygon points="0,60 60,100 0,100" fill="#c62828"/>
    <polygon points="400,60 340,100 400,100" fill="#c62828"/>
    {/* Canopy stripes */}
    {[60,120,180,240,300].map(x => (
      <polygon key={x} points={`${x},60 ${x+30},60 ${x+26},100 ${x-4},100`} fill="#c62828" opacity="0.5"/>
    ))}
    {/* Stall table */}
    <rect x="20" y="140" width="360" height="15" rx="2" fill="#8d6e63"/>
    <rect x="30" y="155" width="10" height="85" fill="#795548"/>
    <rect x="360" y="155" width="10" height="85" fill="#795548"/>
    <rect x="180" y="155" width="10" height="85" fill="#795548"/>
    {/* Table top face */}
    <rect x="20" y="125" width="360" height="20" rx="3" fill="#a1887f"/>
    {/* Produce on table - left section */}
    <circle cx="50" cy="118" r="14" fill="#f44336"/>
    <circle cx="80" cy="116" r="14" fill="#ff9800"/>
    <circle cx="110" cy="118" r="12" fill="#f44336"/>
    <circle cx="48" cy="104" r="10" fill="#ef5350"/>
    <circle cx="78" cy="102" r="10" fill="#ffa726"/>
    {/* Leafy greens */}
    <ellipse cx="160" cy="115" rx="25" ry="12" fill="#4caf50"/>
    <ellipse cx="155" cy="110" rx="15" ry="8" fill="#66bb6a"/>
    <ellipse cx="168" cy="108" rx="15" ry="8" fill="#81c784"/>
    {/* Bread section */}
    <ellipse cx="230" cy="117" rx="28" ry="12" fill="#d4a574"/>
    <ellipse cx="230" cy="108" rx="24" ry="10" fill="#e8b888"/>
    {/* Fish section */}
    <ellipse cx="300" cy="118" rx="28" ry="10" fill="#90caf9"/>
    <ellipse cx="295" cy="114" rx="18" ry="7" fill="#64b5f6"/>
    <ellipse cx="315" cy="116" rx="16" ry="6" fill="#42a5f5"/>
    {/* Hanging sign */}
    <rect x="155" y="65" width="90" height="30" rx="4" fill="#fff9c4" stroke="#f9a825" strokeWidth="2"/>
    <text x="200" y="85" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#e65100">TRŽNICA</text>
    {/* Baskets on ground */}
    <ellipse cx="70" cy="248" rx="30" ry="10" fill="#8d6e63"/>
    <rect x="40" y="210" width="60" height="40" rx="5" fill="#a1887f"/>
    <ellipse cx="70" cy="210" rx="30" ry="10" fill="#bcaaa4"/>
    <circle cx="55" cy="205" r="8" fill="#ff7043"/>
    <circle cx="72" cy="203" r="9" fill="#ef5350"/>
    <circle cx="88" cy="206" r="7" fill="#ffa726"/>
    {/* Hanging garlic/onions */}
    <line x1="320" y1="65" x2="320" y2="130" stroke="#795548" strokeWidth="2"/>
    <ellipse cx="320" cy="133" rx="10" ry="8" fill="#fff9c4"/>
    <ellipse cx="315" cy="147" rx="9" ry="7" fill="#f5f5f5"/>
    <ellipse cx="325" cy="145" rx="9" ry="7" fill="#fff9c4"/>
    <ellipse cx="312" cy="160" rx="8" ry="7" fill="#f5f5f5"/>
  </svg>
);

const SVG_cafe = (
  <svg viewBox="0 0 400 320" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}>
    {/* Wall */}
    <rect width="400" height="320" fill="#fff8f0"/>
    {/* Floor */}
    <rect x="0" y="230" width="400" height="90" fill="#d7ccc8"/>
    {/* Floor tiles */}
    {[0,80,160,240,320].map(x => [0,45].map(y => (
      <rect key={`${x}-${y}`} x={x} y={230+y} width="80" height="45" fill="none" stroke="#bcaaa4" strokeWidth="1"/>
    )))}
    {/* Window */}
    <rect x="260" y="20" width="130" height="120" rx="4" fill="#b3e5fc"/>
    <rect x="260" y="20" width="130" height="120" rx="4" fill="none" stroke="#6d4c41" strokeWidth="3"/>
    <line x1="325" y1="20" x2="325" y2="140" stroke="#6d4c41" strokeWidth="2"/>
    <line x1="260" y1="80" x2="390" y2="80" stroke="#6d4c41" strokeWidth="2"/>
    {/* Curtains */}
    <path d="M260,20 Q275,50 265,80 Q270,50 280,20" fill="#ef9a9a" opacity="0.8"/>
    <path d="M390,20 Q375,50 385,80 Q380,50 370,20" fill="#ef9a9a" opacity="0.8"/>
    {/* Chalkboard menu */}
    <rect x="10" y="15" width="180" height="110" rx="4" fill="#37474f"/>
    <rect x="15" y="20" width="170" height="100" rx="2" fill="#455a64"/>
    <text x="100" y="45" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#fff9c4">☕ KAFIĆ MENU ☕</text>
    <text x="30" y="65" fontSize="9" fill="#b0bec5">Kava .............. 10kn</text>
    <text x="30" y="78" fontSize="9" fill="#b0bec5">Čaj ............... 8kn</text>
    <text x="30" y="91" fontSize="9" fill="#b0bec5">Sok ............... 12kn</text>
    <text x="30" y="104" fontSize="9" fill="#b0bec5">Torta ............. 15kn</text>
    {/* Bar counter */}
    <rect x="0" y="165" width="400" height="12" rx="2" fill="#4e342e"/>
    <rect x="0" y="177" width="400" height="55" fill="#6d4c41"/>
    {/* Espresso machine */}
    <rect x="15" y="120" width="70" height="50" rx="5" fill="#bdbdbd"/>
    <rect x="20" y="125" width="60" height="30" rx="3" fill="#e0e0e0"/>
    <circle cx="35" cy="145" r="8" fill="#9e9e9e"/>
    <circle cx="65" cy="145" r="8" fill="#9e9e9e"/>
    <rect x="25" y="155" width="50" height="8" rx="2" fill="#757575"/>
    {/* Cups on counter */}
    <rect x="110" y="148" width="18" height="15" rx="2" fill="#fff"/>
    <rect x="110" y="163" width="22" height="4" rx="1" fill="#fff"/>
    <ellipse cx="119" cy="148" rx="9" ry="3" fill="#ffe0b2"/>
    <rect x="140" y="150" width="18" height="15" rx="2" fill="#e8f5e9"/>
    <rect x="140" y="165" width="22" height="4" rx="1" fill="#e8f5e9"/>
    {/* Cake display */}
    <rect x="290" y="130" width="100" height="40" rx="3" fill="#f5f5f5" stroke="#e0e0e0" strokeWidth="1"/>
    <ellipse cx="310" cy="130" rx="15" ry="8" fill="#f48fb1"/>
    <rect x="295" y="122" width="30" height="10" rx="3" fill="#f8bbd0"/>
    <ellipse cx="350" cy="130" rx="15" ry="8" fill="#fff9c4"/>
    <rect x="335" y="122" width="30" height="10" rx="3" fill="#fffde7"/>
    {/* Tables in cafe */}
    <ellipse cx="140" cy="215" rx="45" ry="15" fill="#8d6e63"/>
    <rect x="130" y="215" width="20" height="25" fill="#795548"/>
    <ellipse cx="140" cy="240" rx="25" ry="8" fill="#6d4c41"/>
    {/* Chairs */}
    <rect x="85" y="210" width="30" height="25" rx="3" fill="#a1887f"/>
    <rect x="80" y="208" width="35" height="5" rx="2" fill="#8d6e63"/>
    <rect x="175" y="210" width="30" height="25" rx="3" fill="#a1887f"/>
    <rect x="173" y="208" width="35" height="5" rx="2" fill="#8d6e63"/>
    {/* Coffees on table */}
    <circle cx="125" cy="210" r="6" fill="#fff"/>
    <circle cx="125" cy="210" r="4" fill="#795548"/>
    <circle cx="155" cy="210" r="6" fill="#fff"/>
    <circle cx="155" cy="210" r="4" fill="#5d4037"/>
    {/* Hanging lamp */}
    <line x1="140" y1="0" x2="140" y2="160" stroke="#6d4c41" strokeWidth="2"/>
    <ellipse cx="140" cy="163" rx="20" ry="8" fill="#f57f17"/>
    <ellipse cx="140" cy="160" rx="18" ry="6" fill="#ffca28"/>
  </svg>
);

const SVG_beach = (
  <svg viewBox="0 0 400 320" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}>
    {/* Sky */}
    <rect width="400" height="320" fill="#87ceeb"/>
    {/* Gradient sky */}
    <rect width="400" height="160" fill="#64b5f6" opacity="0.5"/>
    {/* Sun */}
    <circle cx="340" cy="55" r="35" fill="#fdd835"/>
    <circle cx="340" cy="55" r="28" fill="#ffee58"/>
    {/* Sun rays */}
    {[0,45,90,135,180,225,270,315].map((angle, i) => {
      const rad = angle * Math.PI / 180;
      return <line key={i} x1={340 + 32*Math.cos(rad)} y1={55 + 32*Math.sin(rad)} x2={340 + 48*Math.cos(rad)} y2={55 + 48*Math.sin(rad)} stroke="#fdd835" strokeWidth="3"/>;
    })}
    {/* Clouds */}
    <ellipse cx="80" cy="50" rx="40" ry="20" fill="white" opacity="0.9"/>
    <ellipse cx="60" cy="55" rx="25" ry="16" fill="white" opacity="0.9"/>
    <ellipse cx="105" cy="55" rx="28" ry="16" fill="white" opacity="0.9"/>
    <ellipse cx="220" cy="35" rx="35" ry="18" fill="white" opacity="0.85"/>
    <ellipse cx="200" cy="40" rx="22" ry="14" fill="white" opacity="0.85"/>
    {/* Sea */}
    <rect x="0" y="130" width="400" height="90" fill="#1e88e5"/>
    <rect x="0" y="130" width="400" height="10" fill="#42a5f5"/>
    {/* Waves */}
    <path d="M0 145 Q40 138 80 145 Q120 152 160 145 Q200 138 240 145 Q280 152 320 145 Q360 138 400 145" stroke="white" strokeWidth="2" fill="none" opacity="0.6"/>
    <path d="M0 160 Q50 153 100 160 Q150 167 200 160 Q250 153 300 160 Q350 167 400 160" stroke="white" strokeWidth="2" fill="none" opacity="0.4"/>
    {/* Sailboat */}
    <polygon points="260,115 280,90 280,135" fill="white"/>
    <polygon points="280,95 300,115 280,130" fill="#ef9a9a"/>
    <rect x="278" y="90" width="4" height="48" fill="#6d4c41"/>
    <ellipse cx="280" cy="138" rx="22" ry="8" fill="#8d6e63"/>
    {/* Sandy beach */}
    <rect x="0" y="220" width="400" height="100" fill="#f5deb3"/>
    <rect x="0" y="220" width="400" height="15" fill="#f0d090"/>
    {/* Beach umbrella */}
    <line x1="110" y1="170" x2="110" y2="270" stroke="#6d4c41" strokeWidth="4"/>
    <ellipse cx="110" cy="170" rx="60" ry="20" fill="#e53935"/>
    <ellipse cx="110" cy="170" rx="60" ry="20" fill="none" stroke="#b71c1c" strokeWidth="1"/>
    {[0,60,120,180,240,300].map((a, i) => {
      const rad = a * Math.PI / 180;
      return <line key={i} x1="110" y1="170" x2={110 + 58*Math.cos(rad)} y2={170 + 18*Math.sin(rad)} stroke="#b71c1c" strokeWidth="1"/>;
    })}
    {/* Beach towel */}
    <rect x="55" y="252" width="100" height="40" rx="3" fill="#42a5f5"/>
    <line x1="55" y1="260" x2="155" y2="260" stroke="#1976d2" strokeWidth="1"/>
    <line x1="55" y1="272" x2="155" y2="272" stroke="#1976d2" strokeWidth="1"/>
    <line x1="55" y1="284" x2="155" y2="284" stroke="#1976d2" strokeWidth="1"/>
    {/* Ice cream stand */}
    <rect x="10" y="215" width="35" height="60" rx="3" fill="#f8bbd0"/>
    <ellipse cx="27" cy="215" rx="17" ry="6" fill="#f48fb1"/>
    <text x="27" y="245" textAnchor="middle" fontSize="9" fill="#880e4f">ICE</text>
    <text x="27" y="258" textAnchor="middle" fontSize="9" fill="#880e4f">CREAM</text>
    {/* Shells on beach */}
    <ellipse cx="270" cy="248" rx="12" ry="8" fill="#ffe082" stroke="#f9a825" strokeWidth="1"/>
    <ellipse cx="310" cy="260" rx="10" ry="7" fill="#ffccbc" stroke="#ff8a65" strokeWidth="1"/>
    <ellipse cx="350" cy="250" rx="11" ry="8" fill="#ffe0b2" stroke="#ff9800" strokeWidth="1"/>
    {/* Ball */}
    <circle cx="360" cy="240" r="15" fill="#ef5350"/>
    <path d="M348,232 Q360,238 372,232" stroke="white" strokeWidth="1.5" fill="none"/>
    <path d="M346,242 Q360,248 374,242" stroke="white" strokeWidth="1.5" fill="none"/>
    <line x1="360" y1="225" x2="360" y2="255" stroke="white" strokeWidth="1.5"/>
  </svg>
);

const SVG_livingroom = (
  <svg viewBox="0 0 400 320" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}>
    {/* Wall */}
    <rect width="400" height="320" fill="#f3e5f5"/>
    {/* Floor */}
    <rect x="0" y="235" width="400" height="85" fill="#efebe9"/>
    {/* Baseboard */}
    <rect x="0" y="232" width="400" height="5" fill="#d7ccc8"/>
    {/* Wood floor planks */}
    {[0,1,2,3,4,5].map(i => (
      <rect key={i} x="0" y={237+i*14} width="400" height="13" fill={i%2===0?"#d7ccc8":"#cfc4be"} opacity="0.5"/>
    ))}
    {/* Door (left) */}
    <rect x="5" y="100" width="65" height="135" rx="3" fill="#a1887f"/>
    <rect x="8" y="103" width="59" height="129" rx="2" fill="#bcaaa4"/>
    <rect x="10" y="105" width="55" height="60" rx="2" fill="#d7ccc8"/>
    <rect x="10" y="170" width="55" height="59" rx="2" fill="#d7ccc8"/>
    <circle cx="59" cy="170" r="5" fill="#ffd54f"/>
    {/* Picture/painting on wall */}
    <rect x="160" y="25" width="80" height="60" rx="3" fill="#3949ab"/>
    <rect x="164" y="29" width="72" height="52" rx="2" fill="#5c6bc0"/>
    <ellipse cx="200" cy="55" rx="20" ry="15" fill="#7986cb"/>
    <rect x="163" y="22" width="74" height="6" fill="#6d4c41"/>
    {/* Window (right wall) */}
    <rect x="295" y="30" width="100" height="100" rx="4" fill="#bbdefb"/>
    <rect x="295" y="30" width="100" height="100" rx="4" fill="none" stroke="#6d4c41" strokeWidth="3"/>
    <line x1="345" y1="30" x2="345" y2="130" stroke="#6d4c41" strokeWidth="2"/>
    <line x1="295" y1="80" x2="395" y2="80" stroke="#6d4c41" strokeWidth="2"/>
    {/* Curtains */}
    <path d="M295,30 Q310,55 300,80 Q305,55 315,30" fill="#ce93d8" opacity="0.9"/>
    <path d="M395,30 Q380,55 390,80 Q385,55 375,30" fill="#ce93d8" opacity="0.9"/>
    {/* TV on stand */}
    <rect x="130" y="120" width="140" height="90" rx="4" fill="#212121"/>
    <rect x="134" y="124" width="132" height="75" rx="3" fill="#1a237e"/>
    {/* TV screen content - simple landscape */}
    <rect x="134" y="124" width="132" height="50" fill="#1565c0"/>
    <rect x="134" y="174" width="132" height="25" fill="#2e7d32"/>
    <circle cx="200" cy="150" r="12" fill="#fdd835"/>
    <rect x="188" y="210" width="24" height="15" fill="#424242"/>
    <rect x="168" y="224" width="64" height="6" rx="2" fill="#616161"/>
    {/* TV stand */}
    <rect x="110" y="210" width="180" height="20" rx="3" fill="#4e342e"/>
    <rect x="110" y="225" width="180" height="10" rx="2" fill="#3e2723"/>
    {/* Floor lamp (left of TV) */}
    <rect x="90" y="110" width="5" height="120" fill="#9e9e9e"/>
    <ellipse cx="92" cy="118" rx="22" ry="12" fill="#ffd54f"/>
    <ellipse cx="92" cy="108" rx="20" ry="8" fill="#ffee58"/>
    {/* Bookshelf (right) */}
    <rect x="310" y="140" width="80" height="95" rx="3" fill="#795548"/>
    <rect x="314" y="144" width="72" height="25" rx="2" fill="#bcaaa4"/>
    <rect x="314" y="174" width="72" height="25" rx="2" fill="#bcaaa4"/>
    <rect x="314" y="204" width="72" height="25" rx="2" fill="#bcaaa4"/>
    {/* Books */}
    {[320,332,344,356,368].map((x, i) => (
      <rect key={x} x={x} y="146" width="10" height="22" rx="1" fill={['#ef5350','#42a5f5','#66bb6a','#ffa726','#ab47bc'][i]}/>
    ))}
    {[318,330,342,354,366,378].map((x, i) => (
      <rect key={x} x={x} y="176" width="9" height="22" rx="1" fill={['#26c6da','#ec407a','#ffee58','#8d6e63','#78909c','#ef5350'][i]}/>
    ))}
    {/* Sofa */}
    <rect x="60" y="225" width="230" height="60" rx="8" fill="#7e57c2"/>
    <rect x="60" y="210" width="230" height="20" rx="5" fill="#9575cd"/>
    <rect x="60" y="210" width="20" height="75" rx="5" fill="#9575cd"/>
    <rect x="270" y="210" width="20" height="75" rx="5" fill="#9575cd"/>
    {/* Sofa cushions */}
    <rect x="85" y="215" width="60" height="30" rx="4" fill="#b39ddb"/>
    <rect x="155" y="215" width="60" height="30" rx="4" fill="#b39ddb"/>
    <rect x="225" y="215" width="45" height="30" rx="4" fill="#b39ddb"/>
    {/* Coffee table */}
    <rect x="120" y="278" width="160" height="40" rx="4" fill="#8d6e63"/>
    <rect x="120" y="278" width="160" height="8" rx="3" fill="#a1887f"/>
    {/* Remote & cup on table */}
    <rect x="165" y="282" width="35" height="12" rx="3" fill="#424242"/>
    <rect x="213" y="280" width="14" height="16" rx="2" fill="#ffe0b2"/>
    {/* Clock on wall */}
    <circle cx="85" cy="55" r="22" fill="#fafafa" stroke="#9e9e9e" strokeWidth="2"/>
    <circle cx="85" cy="55" r="2" fill="#424242"/>
    <line x1="85" y1="55" x2="85" y2="40" stroke="#212121" strokeWidth="2"/>
    <line x1="85" y1="55" x2="96" y2="60" stroke="#212121" strokeWidth="1.5"/>
  </svg>
);

const SVG_classroom = (
  <svg viewBox="0 0 400 320" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}>
    {/* Wall */}
    <rect width="400" height="320" fill="#e3f2fd"/>
    {/* Floor */}
    <rect x="0" y="240" width="400" height="80" fill="#f5f5f5"/>
    {/* Floor tiles */}
    {[0,80,160,240,320].map(x => [0].map(y => (
      <rect key={x} x={x} y={240} width="80" height="80" fill="none" stroke="#e0e0e0" strokeWidth="1"/>
    )))}
    {/* Window */}
    <rect x="300" y="20" width="90" height="120" rx="4" fill="#b3e5fc"/>
    <rect x="300" y="20" width="90" height="120" rx="4" fill="none" stroke="#0277bd" strokeWidth="3"/>
    <line x1="345" y1="20" x2="345" y2="140" stroke="#0277bd" strokeWidth="2"/>
    <line x1="300" y1="80" x2="390" y2="80" stroke="#0277bd" strokeWidth="2"/>
    {/* Sunlight patch */}
    <polygon points="300,20 390,20 390,140 300,140" fill="#fff9c4" opacity="0.2"/>
    {/* Blackboard */}
    <rect x="40" y="15" width="240" height="120" rx="4" fill="#1a3a2a"/>
    <rect x="44" y="19" width="232" height="112" rx="3" fill="#2d5a3d"/>
    {/* Chalk writing on board */}
    <text x="160" y="55" textAnchor="middle" fontSize="14" fontWeight="bold" fill="white" opacity="0.9">Dobro jutro!</text>
    <text x="160" y="80" textAnchor="middle" fontSize="11" fill="#b2dfdb" opacity="0.8">Kako se zoveš?</text>
    {/* Drawn letters */}
    <text x="70" y="108" fontSize="11" fill="#80cbc4" opacity="0.7">A, B, C, D, E...</text>
    {/* Chalk tray */}
    <rect x="40" y="135" width="240" height="8" rx="2" fill="#424242"/>
    <rect x="55" y="136" width="18" height="6" rx="1" fill="#f5f5f5"/>
    <rect x="78" y="136" width="18" height="6" rx="1" fill="#ffcc02"/>
    <rect x="100" y="136" width="18" height="6" rx="1" fill="#f5f5f5"/>
    {/* Teacher */}
    <circle cx="25" cy="120" r="15" fill="#ffcc80"/>
    <rect x="12" y="135" width="26" height="40" rx="4" fill="#1565c0"/>
    <rect x="6" y="137" width="12" height="28" rx="4" fill="#1565c0"/>
    <rect x="32" y="145" width="12" height="10" rx="2" fill="#ffcc80"/>
    {/* Globe */}
    <circle cx="355" cy="175" r="25" fill="#1976d2"/>
    <ellipse cx="355" cy="175" rx="25" ry="10" fill="none" stroke="#0d47a1" strokeWidth="1"/>
    <ellipse cx="355" cy="175" rx="10" ry="25" fill="none" stroke="#0d47a1" strokeWidth="1"/>
    <ellipse cx="344" cy="163" rx="8" ry="5" fill="#4caf50"/>
    <ellipse cx="365" cy="175" rx="6" ry="8" fill="#4caf50"/>
    <rect x="350" y="200" width="10" height="20" fill="#795548"/>
    <ellipse cx="355" cy="220" rx="18" ry="5" fill="#6d4c41"/>
    {/* World map on wall */}
    <rect x="40" y="155" width="120" height="75" rx="3" fill="#e8f5e9" stroke="#a5d6a7" strokeWidth="1.5"/>
    <ellipse cx="80" cy="190" rx="18" ry="12" fill="#66bb6a" opacity="0.8"/>
    <ellipse cx="110" cy="183" rx="25" ry="8" fill="#42a5f5" opacity="0.6"/>
    <ellipse cx="130" cy="195" rx="12" ry="15" fill="#66bb6a" opacity="0.7"/>
    <text x="100" y="222" textAnchor="middle" fontSize="8" fill="#388e3c">Karta svijeta</text>
    {/* Student desks */}
    <rect x="40" y="255" width="70" height="10" rx="2" fill="#a1887f"/>
    <rect x="50" y="265" width="10" height="25" fill="#8d6e63"/>
    <rect x="90" y="265" width="10" height="25" fill="#8d6e63"/>
    {/* Notebook on desk */}
    <rect x="45" y="246" width="40" height="30" rx="2" fill="#fff9c4" stroke="#f9a825" strokeWidth="1"/>
    <line x1="48" y1="255" x2="82" y2="255" stroke="#bdbdbd" strokeWidth="1"/>
    <line x1="48" y1="262" x2="82" y2="262" stroke="#bdbdbd" strokeWidth="1"/>
    <line x1="48" y1="269" x2="82" y2="269" stroke="#bdbdbd" strokeWidth="1"/>
    <rect x="150" y="255" width="70" height="10" rx="2" fill="#a1887f"/>
    <rect x="160" y="265" width="10" height="25" fill="#8d6e63"/>
    <rect x="200" y="265" width="10" height="25" fill="#8d6e63"/>
    <rect x="155" y="246" width="40" height="30" rx="2" fill="#e3f2fd" stroke="#1976d2" strokeWidth="1"/>
    <rect x="270" y="255" width="70" height="10" rx="2" fill="#a1887f"/>
    <rect x="280" y="265" width="10" height="25" fill="#8d6e63"/>
    <rect x="320" y="265" width="10" height="25" fill="#8d6e63"/>
    {/* Backpack */}
    <rect x="270" y="232" width="30" height="36" rx="5" fill="#ef5350"/>
    <rect x="275" y="242" width="20" height="14" rx="3" fill="#e53935" stroke="#c62828" strokeWidth="1"/>
    <rect x="281" y="240" width="8" height="4" rx="2" fill="#ffcdd2"/>
    {/* Pencil on desk */}
    <rect x="162" y="256" width="5" height="30" rx="1" fill="#ffd54f" transform="rotate(-10,164,271)"/>
    <polygon points="162,256 167,256 164.5,250" fill="#ff8f00" transform="rotate(-10,164,271)"/>
  </svg>
);

const SVG_city = (
  <svg viewBox="0 0 400 320" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}>
    {/* Sky */}
    <rect width="400" height="320" fill="#87ceeb"/>
    <rect width="400" height="200" fill="#b0d4f1" opacity="0.5"/>
    {/* Clouds */}
    <ellipse cx="60" cy="40" rx="40" ry="20" fill="white" opacity="0.9"/>
    <ellipse cx="40" cy="46" rx="25" ry="16" fill="white" opacity="0.9"/>
    <ellipse cx="85" cy="46" rx="28" ry="16" fill="white" opacity="0.9"/>
    <ellipse cx="300" cy="30" rx="45" ry="22" fill="white" opacity="0.85"/>
    <ellipse cx="275" cy="38" rx="28" ry="16" fill="white" opacity="0.85"/>
    <ellipse cx="335" cy="38" rx="25" ry="16" fill="white" opacity="0.85"/>
    {/* Road */}
    <rect x="0" y="240" width="400" height="80" fill="#616161"/>
    {/* Road markings */}
    <rect x="0" y="276" width="400" height="6" fill="#fdd835" opacity="0.8"/>
    {[0,60,120,180,240,300,360].map(x => (
      <rect key={x} x={x} y="255" width="40" height="6" fill="white" opacity="0.6"/>
    ))}
    {/* Sidewalk */}
    <rect x="0" y="220" width="400" height="22" fill="#bdbdbd"/>
    {/* Building 1 (left, tall) */}
    <rect x="10" y="70" width="70" height="155" rx="2" fill="#78909c"/>
    {/* Windows */}
    {[85,110,135,160,185].map(y => [20,40,60].map(x => (
      <rect key={`${x}-${y}`} x={10+x} y={y} width="12" height="16" rx="1" fill="#b3e5fc"/>
    )))}
    {/* Building 2 (pharmacy) */}
    <rect x="5" y="120" width="65" height="105" rx="2" fill="#80cbc4"/>
    <rect x="15" y="195" width="35" height="30" rx="2" fill="#b2dfdb"/>
    <text x="32" y="185" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#004d40">LJEKARNA</text>
    <text x="32" y="195" textAnchor="middle" fontSize="11" fill="#00695c">+</text>
    {/* Main tall building */}
    <rect x="95" y="40" width="90" height="185" rx="3" fill="#546e7a"/>
    {[55,80,105,130,155,180].map(y => [105,125,155,170].map(x => (
      <rect key={`${x}-${y}`} x={x} y={y} width="14" height="18" rx="1" fill={y===155||y===180?"#ffd54f":"#b3e5fc"}/>
    )))}
    {/* Shop front */}
    <rect x="95" y="190" width="90" height="35" rx="2" fill="#ff8a65"/>
    <rect x="100" y="195" width="78" height="25" rx="2" fill="#ffccbc"/>
    <text x="140" y="212" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#bf360c">DUĆAN</text>
    {/* Church */}
    <rect x="250" y="100" width="80" height="125" rx="3" fill="#eeeeee"/>
    <polygon points="250,100 290,55 330,100" fill="#f5f5f5"/>
    {/* Cross */}
    <rect x="286" y="60" width="8" height="30" fill="#bdbdbd"/>
    <rect x="280" y="72" width="20" height="6" fill="#bdbdbd"/>
    {/* Church windows */}
    <rect x="262" y="115" width="20" height="35" rx="10" fill="#b3e5fc"/>
    <rect x="298" y="115" width="20" height="35" rx="10" fill="#b3e5fc"/>
    <rect x="265" y="160" width="50" height="40" rx="3" fill="#d7ccc8"/>
    {/* Office block (right) */}
    <rect x="345" y="80" width="55" height="145" rx="2" fill="#90a4ae"/>
    {[90,110,130,150,170,190].map(y => [352,368].map(x => (
      <rect key={`${x}-${y}`} x={x} y={y} width="12" height="12" rx="1" fill="#b3e5fc"/>
    )))}
    {/* Tree */}
    <rect x="210" y="195" width="8" height="30" fill="#6d4c41"/>
    <circle cx="214" cy="185" r="22" fill="#4caf50"/>
    <circle cx="200" cy="192" r="16" fill="#66bb6a"/>
    <circle cx="228" cy="190" r="16" fill="#388e3c"/>
    {/* Fountain */}
    <ellipse cx="190" cy="232" rx="30" ry="10" fill="#b3e5fc" stroke="#1976d2" strokeWidth="2"/>
    <ellipse cx="190" cy="230" rx="22" ry="7" fill="#64b5f6"/>
    <rect x="187" y="215" width="6" height="18" fill="#9e9e9e"/>
    {/* Tram */}
    <rect x="100" y="245" width="90" height="35" rx="5" fill="#1565c0"/>
    <rect x="105" y="250" width="20" height="20" rx="2" fill="#b3e5fc"/>
    <rect x="130" y="250" width="20" height="20" rx="2" fill="#b3e5fc"/>
    <rect x="155" y="250" width="20" height="20" rx="2" fill="#b3e5fc"/>
    <circle cx="120" cy="283" r="7" fill="#424242"/>
    <circle cx="170" cy="283" r="7" fill="#424242"/>
    <line x1="0" y1="283" x2="400" y2="283" stroke="#757575" strokeWidth="2"/>
    {/* Car */}
    <rect x="240" y="248" width="70" height="28" rx="6" fill="#ef5350"/>
    <rect x="250" y="241" width="50" height="20" rx="4" fill="#e53935"/>
    <rect x="253" y="244" width="18" height="14" rx="2" fill="#b3e5fc"/>
    <rect x="278" y="244" width="18" height="14" rx="2" fill="#b3e5fc"/>
    <circle cx="257" cy="278" r="8" fill="#212121"/>
    <circle cx="293" cy="278" r="8" fill="#212121"/>
    {/* Bike */}
    <circle cx="360" cy="265" r="10" fill="none" stroke="#424242" strokeWidth="2"/>
    <circle cx="385" cy="265" r="10" fill="none" stroke="#424242" strokeWidth="2"/>
    <line x1="360" y1="265" x2="372" y2="255" stroke="#616161" strokeWidth="2"/>
    <line x1="372" y1="255" x2="385" y2="265" stroke="#616161" strokeWidth="2"/>
    <line x1="372" y1="255" x2="372" y2="248" stroke="#616161" strokeWidth="2"/>
    <line x1="368" y1="248" x2="378" y2="248" stroke="#616161" strokeWidth="2"/>
    {/* Bench */}
    <rect x="215" y="235" width="50" height="6" rx="2" fill="#8d6e63"/>
    <rect x="220" y="241" width="8" height="15" rx="2" fill="#795548"/>
    <rect x="252" y="241" width="8" height="15" rx="2" fill="#795548"/>
    <rect x="215" y="230" width="50" height="5" rx="2" fill="#a1887f"/>
  </svg>
);

const SVG_home = (
  <svg viewBox="0 0 400 320" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}>
    {/* Sky */}
    <rect width="400" height="320" fill="#bbdefb"/>
    {/* Clouds */}
    <ellipse cx="80" cy="40" rx="40" ry="18" fill="white" opacity="0.9"/>
    <ellipse cx="60" cy="46" rx="25" ry="14" fill="white" opacity="0.9"/>
    <ellipse cx="105" cy="46" rx="28" ry="14" fill="white" opacity="0.9"/>
    <ellipse cx="310" cy="35" rx="45" ry="20" fill="white" opacity="0.85"/>
    {/* Ground / lawn */}
    <rect x="0" y="240" width="400" height="80" fill="#81c784"/>
    <rect x="0" y="238" width="400" height="8" fill="#66bb6a"/>
    {/* Driveway */}
    <rect x="290" y="220" width="110" height="100" fill="#bdbdbd"/>
    {/* Fence */}
    {[10,30,50,70,90].map(x => (
      <rect key={x} x={x} y="220" width="8" height="30" rx="2" fill="#a1887f"/>
    ))}
    <rect x="10" y="228" width="92" height="6" rx="2" fill="#8d6e63"/>
    <rect x="10" y="238" width="92" height="6" rx="2" fill="#8d6e63"/>
    {/* Path to door */}
    <rect x="178" y="218" width="44" height="30" fill="#d7ccc8"/>
    {[0,10,20].map(y => (
      <rect key={y} x="180" y={220+y} width="40" height="8" rx="1" fill="#bcaaa4"/>
    ))}
    {/* Main house body */}
    <rect x="80" y="130" width="240" height="120" rx="4" fill="#fff9f0"/>
    {/* Roof */}
    <polygon points="60,130 200,55 340,130" fill="#c62828"/>
    <polygon points="62,130 200,57 338,130" fill="#e53935"/>
    {/* Roof shadow */}
    <polygon points="60,130 200,57 200,65 70,130" fill="#b71c1c" opacity="0.3"/>
    {/* Chimney */}
    <rect x="265" y="70" width="25" height="55" rx="2" fill="#8d6e63"/>
    <rect x="260" y="68" width="35" height="8" rx="2" fill="#795548"/>
    {/* Smoke */}
    <ellipse cx="277" cy="60" rx="6" ry="9" fill="#e0e0e0" opacity="0.7"/>
    <ellipse cx="280" cy="48" rx="8" ry="10" fill="#eeeeee" opacity="0.5"/>
    {/* Front door */}
    <rect x="175" y="185" width="50" height="65" rx="4" fill="#5d4037"/>
    <rect x="179" y="189" width="42" height="57" rx="3" fill="#6d4c41"/>
    <rect x="181" y="191" width="18" height="28" rx="2" fill="#795548"/>
    <rect x="201" y="191" width="18" height="28" rx="2" fill="#795548"/>
    <circle cx="196" cy="220" r="4" fill="#fdd835"/>
    <circle cx="204" cy="220" r="4" fill="#fdd835"/>
    {/* Doorstep */}
    <rect x="168" y="248" width="64" height="6" rx="2" fill="#bcaaa4"/>
    {/* Left window */}
    <rect x="95" y="155" width="65" height="55" rx="3" fill="#b3e5fc" stroke="#795548" strokeWidth="2.5"/>
    <line x1="127" y1="155" x2="127" y2="210" stroke="#795548" strokeWidth="2"/>
    <line x1="95" y1="182" x2="160" y2="182" stroke="#795548" strokeWidth="2"/>
    {/* Left window curtain */}
    <path d="M95,155 Q106,168 99,182 Q103,168 109,155" fill="#ffccbc" opacity="0.8"/>
    <path d="M160,155 Q149,168 156,182 Q152,168 146,155" fill="#ffccbc" opacity="0.8"/>
    {/* Right window */}
    <rect x="240" y="155" width="65" height="55" rx="3" fill="#b3e5fc" stroke="#795548" strokeWidth="2.5"/>
    <line x1="272" y1="155" x2="272" y2="210" stroke="#795548" strokeWidth="2"/>
    <line x1="240" y1="182" x2="305" y2="182" stroke="#795548" strokeWidth="2"/>
    {/* Balcony above door */}
    <rect x="155" y="145" width="90" height="45" rx="3" fill="none" stroke="#795548" strokeWidth="2"/>
    <rect x="155" y="143" width="90" height="8" rx="2" fill="#8d6e63"/>
    {[163,175,187,199,211,223,235].map(x => (
      <rect key={x} x={x} y="151" width="5" height="35" rx="1" fill="#a1887f"/>
    ))}
    {/* Mailbox */}
    <rect x="348" y="218" width="30" height="20" rx="3" fill="#e53935"/>
    <rect x="348" y="218" width="30" height="10" rx="3" fill="#ef5350"/>
    <rect x="357" y="228" width="12" height="3" rx="1" fill="#fdd835"/>
    <rect x="362" y="210" width="4" height="12" fill="#9e9e9e"/>
    {/* Dog */}
    <ellipse cx="130" cy="265" rx="20" ry="12" fill="#d4a574"/>
    <circle cx="148" cy="256" r="10" fill="#d4a574"/>
    <ellipse cx="155" cy="253" rx="6" ry="4" fill="#c49060"/>
    <circle cx="151" cy="252" r="2" fill="#333"/>
    <rect x="115" y="270" width="6" height="14" rx="2" fill="#c49060"/>
    <rect x="123" y="272" width="6" height="12" rx="2" fill="#c49060"/>
    <rect x="135" y="272" width="6" height="12" rx="2" fill="#c49060"/>
    <rect x="143" y="270" width="6" height="14" rx="2" fill="#c49060"/>
    <rect x="148" y="260" width="20" height="4" rx="2" fill="#c49060" transform="rotate(30,148,262)"/>
    {/* Croatian flag */}
    <rect x="355" y="110" width="4" height="70" fill="#9e9e9e"/>
    <rect x="359" y="110" width="32" height="12" fill="#e53935"/>
    <rect x="359" y="122" width="32" height="12" fill="white"/>
    <rect x="359" y="134" width="32" height="12" fill="#1565c0"/>
    {/* Garden / flowers */}
    {[18,32,46,60,75].map(x => (
      <g key={x}>
        <rect x={x+2} y="252" width="3" height="12" fill="#66bb6a"/>
        <circle cx={x+3} cy="251" r="5" fill={['#f44336','#fdd835','#e91e63','#ff9800','#9c27b0'][x%5]}/>
      </g>
    ))}
    {/* Car in driveway */}
    <rect x="305" y="248" width="75" height="28" rx="6" fill="#1565c0"/>
    <rect x="315" y="240" width="55" height="20" rx="4" fill="#1976d2"/>
    <rect x="318" y="242" width="18" height="14" rx="2" fill="#b3e5fc"/>
    <rect x="342" y="242" width="18" height="14" rx="2" fill="#b3e5fc"/>
    <circle cx="322" cy="278" r="8" fill="#212121"/>
    <circle cx="360" cy="278" r="8" fill="#212121"/>
  </svg>
);

const SCENE_SVGS = {
  kitchen: SVG_kitchen,
  market: SVG_market,
  cafe: SVG_cafe,
  beach: SVG_beach,
  livingroom: SVG_livingroom,
  classroom: SVG_classroom,
  city: SVG_city,
  home: SVG_home,
};

const SCENES = [
  {
    id: "kitchen",
    title: "Kuhinja",
    titleEn: "The Kitchen",
    icon: "🍳",
    emoji: "🏠",
    color: "#d97706",
    bg: "#fffbeb",
    sceneStyle: {},
    items: [
      { id:"fridge",   hr:"hladnjak",   en:"fridge",      icon:"🧊", note:"m.", x:12, y:20 },
      { id:"stove",    hr:"štednjak",   en:"stove",       icon:"🔥", note:"m.", x:30, y:55 },
      { id:"sink",     hr:"sudoper",    en:"sink",        icon:"🚿", note:"m.", x:55, y:50 },
      { id:"table",    hr:"stol",       en:"table",       icon:"🪑", note:"m.", x:50, y:78 },
      { id:"window",   hr:"prozor",     en:"window",      icon:"🪟", note:"m.", x:75, y:20 },
      { id:"cup",      hr:"šalica",     en:"cup",         icon:"☕", note:"f.", x:40, y:45 },
      { id:"plate",    hr:"tanjur",     en:"plate",       icon:"🍽️", note:"m.", x:52, y:75 },
      { id:"fork",     hr:"vilica",     en:"fork",        icon:"🍴", note:"f.", x:60, y:75 },
      { id:"knife",    hr:"nož",        en:"knife",       icon:"🔪", note:"m.", x:65, y:75 },
      { id:"bottle",   hr:"boca",       en:"bottle",      icon:"🍶", note:"f.", x:20, y:45 },
      { id:"bread",    hr:"kruh",       en:"bread",       icon:"🍞", note:"m.", x:35, y:70 },
      { id:"chair",    hr:"stolica",    en:"chair",       icon:"🪑", note:"f.", x:55, y:88 },
    ]
  },
  {
    id: "market",
    title: "Tržnica",
    titleEn: "The Market",
    icon: "🛒",
    emoji: "🏪",
    color: "#16a34a",
    bg: "#f0fdf4",
    sceneStyle: {},
    items: [
      { id:"apple",    hr:"jabuka",     en:"apple",       icon:"🍎", note:"f.", x:15, y:40 },
      { id:"orange",   hr:"naranča",    en:"orange",      icon:"🍊", note:"f.", x:28, y:40 },
      { id:"tomato",   hr:"rajčica",    en:"tomato",      icon:"🍅", note:"f.", x:40, y:40 },
      { id:"cucumber", hr:"krastavac",  en:"cucumber",    icon:"🥒", note:"m.", x:55, y:40 },
      { id:"cheese",   hr:"sir",        en:"cheese",      icon:"🧀", note:"m.", x:70, y:45 },
      { id:"fish",     hr:"riba",       en:"fish",        icon:"🐟", note:"f.", x:20, y:65 },
      { id:"bread2",   hr:"kruh",       en:"bread",       icon:"🍞", note:"m.", x:35, y:65 },
      { id:"honey",    hr:"med",        en:"honey",       icon:"🍯", note:"m.", x:50, y:65 },
      { id:"egg",      hr:"jaje",       en:"egg",         icon:"🥚", note:"n.", x:65, y:65 },
      { id:"grapes",   hr:"grožđe",     en:"grapes",      icon:"🍇", note:"n.", x:80, y:40 },
      { id:"onion",    hr:"luk",        en:"onion",       icon:"🧅", note:"m.", x:10, y:65 },
      { id:"bag",      hr:"torba",      en:"bag",         icon:"👜", note:"f.", x:80, y:70 },
      { id:"basket",   hr:"košara",     en:"basket",      icon:"🧺", note:"f.", x:45, y:80 },
    ]
  },
  {
    id: "cafe",
    title: "Kafić",
    titleEn: "The Café",
    icon: "☕",
    emoji: "🏙️",
    color: "#92400e",
    bg: "#fffbeb",
    sceneStyle: {},
    items: [
      { id:"coffee",   hr:"kava",       en:"coffee",      icon:"☕", note:"f.", x:30, y:55 },
      { id:"tea",      hr:"čaj",        en:"tea",         icon:"🍵", note:"m.", x:45, y:55 },
      { id:"juice",    hr:"sok",        en:"juice",       icon:"🥤", note:"m.", x:60, y:55 },
      { id:"water",    hr:"voda",       en:"water",       icon:"💧", note:"f.", x:20, y:55 },
      { id:"cake",     hr:"torta",      en:"cake",        icon:"🎂", note:"f.", x:35, y:75 },
      { id:"menu",     hr:"jelovnik",   en:"menu",        icon:"📋", note:"m.", x:15, y:35 },
      { id:"waiter",   hr:"konobar",    en:"waiter",      icon:"🧑‍🍳", note:"m.", x:70, y:40 },
      { id:"chair2",   hr:"stolica",    en:"chair",       icon:"🪑", note:"f.", x:50, y:85 },
      { id:"table2",   hr:"stol",       en:"table",       icon:"🪑", note:"m.", x:40, y:80 },
      { id:"spoon",    hr:"žlica",      en:"spoon",       icon:"🥄", note:"f.", x:55, y:70 },
      { id:"sugar",    hr:"šećer",      en:"sugar",       icon:"🍬", note:"m.", x:25, y:70 },
      { id:"newspaper",hr:"novine",     en:"newspaper",   icon:"📰", note:"f.pl.", x:80, y:35 },
    ]
  },
  {
    id: "beach",
    title: "Plaža",
    titleEn: "The Beach",
    icon: "🏖️",
    emoji: "🌊",
    color: "#0891b2",
    bg: "#ecfeff",
    sceneStyle: {},
    items: [
      { id:"sea",      hr:"more",       en:"sea",         icon:"🌊", note:"n.", x:50, y:25 },
      { id:"sand",     hr:"pijesak",    en:"sand",        icon:"⏳", note:"m.", x:50, y:70 },
      { id:"sun",      hr:"sunce",      en:"sun",         icon:"☀️", note:"n.", x:80, y:10 },
      { id:"umbrella", hr:"suncobran",  en:"parasol",     icon:"⛱️", note:"m.", x:25, y:55 },
      { id:"towel",    hr:"ručnik",     en:"towel",       icon:"🏊", note:"m.", x:40, y:75 },
      { id:"boat",     hr:"brod",       en:"boat",        icon:"⛵", note:"m.", x:70, y:30 },
      { id:"shell",    hr:"školjka",    en:"shell",       icon:"🐚", note:"f.", x:60, y:80 },
      { id:"icecream", hr:"sladoled",   en:"ice cream",   icon:"🍦", note:"m.", x:15, y:45 },
      { id:"glasses",  hr:"naočale",    en:"sunglasses",  icon:"😎", note:"f.pl.", x:35, y:65 },
      { id:"hat",      hr:"šešir",      en:"hat",         icon:"👒", note:"m.", x:55, y:60 },
      { id:"ball",     hr:"lopta",      en:"ball",        icon:"⚽", note:"f.", x:70, y:70 },
      { id:"fish2",    hr:"riba",       en:"fish",        icon:"🐟", note:"f.", x:45, y:30 },
    ]
  },
  {
    id: "livingroom",
    title: "Dnevna soba",
    titleEn: "The Living Room",
    icon: "🛋️",
    emoji: "🏠",
    color: "#7c3aed",
    bg: "#faf5ff",
    sceneStyle: {},
    items: [
      { id:"sofa",     hr:"kauč",       en:"sofa",        icon:"🛋️", note:"m.", x:40, y:60 },
      { id:"tv",       hr:"televizor",  en:"TV",          icon:"📺", note:"m.", x:50, y:30 },
      { id:"lamp",     hr:"lampa",      en:"lamp",        icon:"💡", note:"f.", x:20, y:35 },
      { id:"book2",    hr:"knjiga",     en:"book",        icon:"📚", note:"f.", x:75, y:55 },
      { id:"phone2",   hr:"telefon",    en:"phone",       icon:"📱", note:"m.", x:30, y:70 },
      { id:"clock",    hr:"sat",        en:"clock",       icon:"🕰️", note:"m.", x:80, y:20 },
      { id:"painting", hr:"slika",      en:"painting",    icon:"🖼️", note:"f.", x:50, y:15 },
      { id:"carpet",   hr:"tepih",      en:"carpet",      icon:"🏠", note:"m.", x:45, y:80 },
      { id:"door",     hr:"vrata",      en:"door",        icon:"🚪", note:"n.pl.", x:15, y:50 },
      { id:"curtain",  hr:"zavjesa",    en:"curtain",     icon:"🪟", note:"f.", x:75, y:25 },
      { id:"remote",   hr:"daljinski",  en:"remote",      icon:"📡", note:"m.", x:60, y:68 },
    ]
  },
  {
    id: "classroom",
    title: "Razred",
    titleEn: "The Classroom",
    icon: "📚",
    emoji: "🏫",
    color: "#0369a1",
    bg: "#f0f9ff",
    sceneStyle: {},
    items: [
      { id:"board",    hr:"ploča",      en:"blackboard",  icon:"🟩", note:"f.", x:45, y:20 },
      { id:"chalk",    hr:"kreda",      en:"chalk",       icon:"✏️", note:"f.", x:30, y:35 },
      { id:"desk",     hr:"klupa",      en:"desk",        icon:"🪑", note:"f.", x:35, y:65 },
      { id:"pencil",   hr:"olovka",     en:"pencil",      icon:"✏️", note:"f.", x:55, y:55 },
      { id:"ruler",    hr:"ravnalo",    en:"ruler",       icon:"📏", note:"n.", x:65, y:55 },
      { id:"backpack", hr:"ruksak",     en:"backpack",    icon:"🎒", note:"m.", x:20, y:70 },
      { id:"notebook", hr:"bilježnica", en:"notebook",    icon:"📓", note:"f.", x:45, y:72 },
      { id:"map",      hr:"karta",      en:"map",         icon:"🗺️", note:"f.", x:75, y:20 },
      { id:"teacher",  hr:"učitelj",    en:"teacher",     icon:"👨‍🏫", note:"m.", x:20, y:35 },
      { id:"globe",    hr:"globus",     en:"globe",       icon:"🌍", note:"m.", x:80, y:40 },
      { id:"scissors", hr:"škare",      en:"scissors",    icon:"✂️", note:"f.pl.", x:70, y:70 },
    ]
  },
  {
    id: "city",
    title: "Grad",
    titleEn: "The City",
    icon: "🏙️",
    emoji: "🌆",
    color: "#374151",
    bg: "#f9fafb",
    sceneStyle: {},
    items: [
      { id:"building",  hr:"zgrada",    en:"building",    icon:"🏢", note:"f.", x:20, y:40 },
      { id:"church",    hr:"crkva",     en:"church",      icon:"⛪", note:"f.", x:70, y:35 },
      { id:"tram",      hr:"tramvaj",   en:"tram",        icon:"🚋", note:"m.", x:45, y:65 },
      { id:"car",       hr:"auto",      en:"car",         icon:"🚗", note:"m.", x:25, y:70 },
      { id:"bike",      hr:"bicikl",    en:"bicycle",     icon:"🚲", note:"m.", x:60, y:72 },
      { id:"tree",      hr:"drvo",      en:"tree",        icon:"🌳", note:"n.", x:80, y:50 },
      { id:"bench",     hr:"klupa",     en:"bench",       icon:"🪑", note:"f.", x:40, y:75 },
      { id:"fountain",  hr:"fontana",   en:"fountain",    icon:"⛲", note:"f.", x:50, y:55 },
      { id:"shop",      hr:"dućan",     en:"shop",        icon:"🏪", note:"m.", x:35, y:45 },
      { id:"pharmacy",  hr:"ljekarna",  en:"pharmacy",    icon:"💊", note:"f.", x:15, y:50 },
      { id:"sky",       hr:"nebo",      en:"sky",         icon:"☁️", note:"n.", x:50, y:10 },
    ]
  },
  {
    id: "home",
    title: "Kuća",
    titleEn: "The Croatian Home",
    icon: "🏡",
    emoji: "🇭🇷",
    color: "#dc2626",
    bg: "#fef2f2",
    sceneStyle: {},
    items: [
      { id:"roof",     hr:"krov",       en:"roof",        icon:"🏠", note:"m.", x:50, y:10 },
      { id:"door2",    hr:"vrata",      en:"door",        icon:"🚪", note:"n.pl.", x:50, y:65 },
      { id:"garden",   hr:"vrt",        en:"garden",      icon:"🌿", note:"m.", x:20, y:75 },
      { id:"car2",     hr:"auto",       en:"car",         icon:"🚗", note:"m.", x:80, y:75 },
      { id:"chimney",  hr:"dimnjak",    en:"chimney",     icon:"🏭", note:"m.", x:65, y:15 },
      { id:"balcony",  hr:"balkon",     en:"balcony",     icon:"🏢", note:"m.", x:30, y:40 },
      { id:"stairs",   hr:"stepenice",  en:"stairs",      icon:"🪜", note:"f.pl.", x:55, y:75 },
      { id:"fence",    hr:"ograda",     en:"fence",       icon:"🔩", note:"f.", x:15, y:60 },
      { id:"mailbox",  hr:"poštanski sandučić", en:"mailbox", icon:"📬", note:"m.", x:75, y:60 },
      { id:"dog2",     hr:"pas",        en:"dog",         icon:"🐕", note:"m.", x:30, y:80 },
      { id:"flag",     hr:"zastava",    en:"flag",        icon:"🇭🇷", note:"f.", x:80, y:35 },
    ]
  },
];

// Total items across all scenes
const TOTAL_WORDS = SCENES.reduce((s, sc) => s + sc.items.length, 0);

// ─── localStorage helpers ─────────────────────────────────────────────────────

function loadDiscovered(sceneId) {
  try {
    const raw = localStorage.getItem(`nh_scene_${sceneId}`);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function saveDiscovered(sceneId, set) {
  try { localStorage.setItem(`nh_scene_${sceneId}`, JSON.stringify([...set])); } catch {}
}

function loadSRS() {
  try {
    const raw = localStorage.getItem('nh_scene_srs');
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function saveSRS(set) {
  try { localStorage.setItem('nh_scene_srs', JSON.stringify([...set])); } catch {}
}

function loadSRSQueue() {
  try {
    const raw = localStorage.getItem('nh_scene_srs_queue');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveSRSQueue(arr) {
  try { localStorage.setItem('nh_scene_srs_queue', JSON.stringify(arr)); } catch {}
}

// ─── Inline styles & CSS injection ───────────────────────────────────────────

const CSS = `
@keyframes vs-pulse {
  0%,100% { transform: translate(-50%,-50%) scale(1); }
  50%      { transform: translate(-50%,-50%) scale(1.12); }
}
@keyframes vs-discovered {
  0%   { transform: translate(-50%,-50%) scale(1); }
  40%  { transform: translate(-50%,-50%) scale(1.3); }
  70%  { transform: translate(-50%,-50%) scale(0.92); }
  100% { transform: translate(-50%,-50%) scale(1); }
}
@keyframes vs-popup-in {
  from { transform: translateY(100%); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}
@keyframes vs-confetti {
  0%   { transform: translateY(-10px) rotate(0deg);   opacity: 1; }
  100% { transform: translateY(340px) rotate(720deg); opacity: 0; }
}
@keyframes vs-complete-in {
  from { opacity: 0; transform: scale(0.85); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes vs-toast-in {
  from { opacity: 0; transform: translateX(40px); }
  to   { opacity: 1; transform: translateX(0); }
}
.vs-pulse-anim     { animation: vs-pulse 2s infinite; }
.vs-discovered-anim{ animation: vs-discovered 0.45s ease; }
`;

let cssInjected = false;
function ensureCSS() {
  if (cssInjected) return;
  cssInjected = true;
  const el = document.createElement('style');
  el.textContent = CSS;
  document.head.appendChild(el);
}

// ─── Confetti component ───────────────────────────────────────────────────────

const CONFETTI_COLORS = ['#f59e0b','#10b981','#3b82f6','#ec4899','#8b5cf6','#ef4444','#06b6d4'];

function Confetti() {
  const pieces = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    left: `${(i / 28) * 100}%`,
    delay: `${(i * 0.07).toFixed(2)}s`,
    duration: `${1.2 + (i % 5) * 0.18}s`,
    size: 6 + (i % 4) * 2,
  }));
  return (
    <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none', zIndex:10 }}>
      {pieces.map(p => (
        <div key={p.id} style={{
          position:'absolute', left:p.left, top:0,
          width:p.size, height:p.size,
          borderRadius: p.id % 3 === 0 ? '50%' : 2,
          background:p.color,
          animation:`vs-confetti ${p.duration} ${p.delay} ease-in forwards`,
        }} />
      ))}
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ text, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div style={{
      position:'fixed', bottom:90, right:16, zIndex:9999,
      background:'#1c1917', color:'white', borderRadius:12,
      padding:'10px 16px', fontSize:13, fontWeight:600,
      boxShadow:'0 4px 20px rgba(0,0,0,.25)',
      animation:'vs-toast-in 0.3s ease',
      maxWidth:240,
    }}>
      {text}
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ value, max, color, height = 6 }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ height, background:'rgba(0,0,0,.08)', borderRadius:99, overflow:'hidden' }}>
      <div style={{
        height:'100%', width:`${pct}%`, borderRadius:99,
        background: color || '#10b981',
        transition:'width 0.4s ease',
      }} />
    </div>
  );
}

// ─── Scene Picker ─────────────────────────────────────────────────────────────

function ScenePicker({ onSelect, allDiscovered }) {
  const totalDiscovered = SCENES.reduce((s, sc) => s + (allDiscovered[sc.id]?.size ?? 0), 0);

  return (
    <div className="scr-wrap">
      {H("🎭 Vocabulary Scenes", "Tap objects in a scene to discover their Croatian names")}

      {/* Progress summary */}
      <div style={{
        background:'linear-gradient(135deg,#0f172a,#1e293b)',
        borderRadius:16, padding:'14px 18px', marginBottom:20,
        color:'white', display:'flex', alignItems:'center', justifyContent:'space-between',
      }}>
        <div>
          <div style={{ fontSize:11, opacity:.65, fontWeight:600, marginBottom:2, textTransform:'uppercase', letterSpacing:'.06em' }}>Total Progress</div>
          <div style={{ fontSize:22, fontWeight:800 }}>{totalDiscovered} <span style={{ fontSize:14, opacity:.7 }}>/ {TOTAL_WORDS} words discovered</span></div>
        </div>
        <div style={{ fontSize:36 }}>🌟</div>
      </div>

      {/* Scene grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        {SCENES.map(scene => {
          const disc = allDiscovered[scene.id]?.size ?? 0;
          const total = scene.items.length;
          const complete = disc >= total;
          return (
            <button key={scene.id} onClick={() => onSelect(scene)}
              style={{
                background: complete ? scene.bg : 'white',
                border: complete ? `2px solid ${scene.color}` : '1.5px solid rgba(0,0,0,.08)',
                borderRadius:16, padding:'16px 14px', cursor:'pointer', textAlign:'left',
                boxShadow: complete ? `0 2px 12px ${scene.color}33` : '0 1px 4px rgba(0,0,0,.06)',
                transition:'transform 0.15s ease, box-shadow 0.15s ease',
                position:'relative', overflow:'hidden',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform='scale(1.03)'; e.currentTarget.style.boxShadow=`0 6px 20px ${scene.color}44`; }}
              onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow=complete?`0 2px 12px ${scene.color}33`:'0 1px 4px rgba(0,0,0,.06)'; }}
            >
              {complete && (
                <div style={{
                  position:'absolute', top:8, right:8,
                  background:scene.color, color:'white',
                  borderRadius:20, padding:'2px 8px', fontSize:10, fontWeight:800,
                }}>Complete!</div>
              )}
              <div style={{ fontSize:42, marginBottom:8, lineHeight:1 }}>{scene.icon}</div>
              <div style={{ fontSize:14, fontWeight:800, color:'#1c1917', marginBottom:2 }}>{scene.title}</div>
              <div style={{ fontSize:11, color:'#78716c', marginBottom:10 }}>{scene.titleEn}</div>
              <div style={{ fontSize:11, color:scene.color, fontWeight:700, marginBottom:6 }}>
                {disc} / {total} discovered
              </div>
              <ProgressBar value={disc} max={total} color={scene.color} height={5} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Item Button ──────────────────────────────────────────────────────────────

function ItemButton({ item, discovered, isActive, isQuiz, onTap }) {
  const [justFound, setJustFound] = useState(false);
  const prevDisc = useRef(discovered);

  useEffect(() => {
    if (!prevDisc.current && discovered) {
      setJustFound(true);
      const t = setTimeout(() => setJustFound(false), 450);
      return () => clearTimeout(t);
    }
    prevDisc.current = discovered;
  }, [discovered]);

  const baseStyle = {
    position:'absolute',
    left:`${item.x}%`,
    top:`${item.y}%`,
    transform:'translate(-50%,-50%)',
    width:44, height:44, borderRadius:'50%',
    border:'none', cursor:'pointer',
    display:'flex', flexDirection:'column',
    alignItems:'center', justifyContent:'center',
    padding:0, zIndex: isActive ? 5 : 2,
    transition:'box-shadow 0.2s ease',
  };

  if (justFound) {
    return (
      <div style={{ ...baseStyle, background:'#fef9c3', boxShadow:'0 0 0 3px #f59e0b' }}
        className="vs-discovered-anim">
        <span style={{ fontSize:22, lineHeight:1 }}>{item.icon}</span>
      </div>
    );
  }

  if (discovered) {
    return (
      <button onClick={onTap} aria-label={`${item.hr} — ${item.en}`} style={{
        ...baseStyle,
        background: isActive ? '#fff' : 'rgba(255,255,255,0.92)',
        boxShadow: isActive
          ? '0 0 0 3px #f59e0b, 0 4px 16px rgba(0,0,0,.18)'
          : '0 2px 8px rgba(0,0,0,.14)',
        flexDirection:'column',
      }}>
        <span style={{ fontSize:20, lineHeight:1 }}>{item.icon}</span>
        <span style={{
          fontSize:8, fontWeight:700, color:'#1c1917', lineHeight:1,
          marginTop:1, maxWidth:42, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
          textAlign:'center',
        }}>{item.hr}</span>
      </button>
    );
  }

  // Undiscovered
  const showQuizMark = isQuiz;
  return (
    <button onClick={onTap}
      aria-label="Undiscovered item — tap to reveal"
      className="vs-pulse-anim"
      style={{
        ...baseStyle,
        background: showQuizMark ? 'rgba(99,102,241,0.75)' : 'rgba(0,0,0,0.4)',
        boxShadow: isActive ? '0 0 0 3px #f59e0b' : 'none',
        color:'white', fontSize: showQuizMark ? 18 : 22,
        filter: showQuizMark ? 'none' : 'blur(0.3px)',
      }}>
      {showQuizMark ? '?' : <span style={{ filter:'blur(1.5px)', opacity:.55 }}>{item.icon}</span>}
    </button>
  );
}

// ─── Item Popup ───────────────────────────────────────────────────────────────

function ItemPopup({ item, scene, isAdded, isQuiz, quizRevealed, onClose, onSpeak, onAddSRS, onQuizAnswer }) {
  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position:'absolute', inset:0, zIndex:6,
        background:'rgba(0,0,0,0.18)',
      }} />
      {/* Sheet */}
      <div style={{
        position:'absolute', bottom:0, left:0, right:0, zIndex:7,
        background:'white', borderRadius:'16px 16px 0 0',
        padding:'16px 20px 20px',
        boxShadow:'0 -4px 24px rgba(0,0,0,.16)',
        animation:'vs-popup-in 0.28s cubic-bezier(.4,0,.2,1)',
      }}>
        {/* Close */}
        <button onClick={onClose} aria-label="Close" style={{
          position:'absolute', top:12, right:14,
          background:'none', border:'none', cursor:'pointer',
          fontSize:20, color:'#78716c', lineHeight:1, padding:4,
        }}>✕</button>

        {isQuiz && !quizRevealed && (
          <div style={{ fontSize:12, color:'#6366f1', fontWeight:700, marginBottom:10, textAlign:'center' }}>
            Do you know this word?
          </div>
        )}

        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:12 }}>
          <div style={{ fontSize:48, lineHeight:1 }}>{item.icon}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:26, fontWeight:900, color:'#1c1917', lineHeight:1.1 }}>{item.hr}</div>
            <div style={{ fontSize:14, color:'#78716c', marginTop:3 }}>{item.en}</div>
          </div>
          {/* Gender badge */}
          <div style={{
            background:scene.bg, color:scene.color, border:`1.5px solid ${scene.color}44`,
            borderRadius:20, padding:'3px 10px', fontSize:11, fontWeight:800,
          }}>{item.note}</div>
        </div>

        {/* Action row */}
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <button onClick={onSpeak} aria-label="Listen to pronunciation" style={{
            flex:1, background:`${scene.bg}`, border:`1.5px solid ${scene.color}44`,
            borderRadius:12, padding:'10px 0', cursor:'pointer',
            fontSize:14, fontWeight:700, color:scene.color,
          }}>
            <span aria-hidden="true">🔊</span> Listen
          </button>
          <button onClick={onAddSRS} style={{
            flex:1,
            background: isAdded ? '#dcfce7' : scene.color,
            border:'none', borderRadius:12, padding:'10px 0', cursor:'pointer',
            fontSize:14, fontWeight:700,
            color: isAdded ? '#15803d' : 'white',
          }}>
            {isAdded ? '✓ In flashcards' : '+ Add to flashcards'}
          </button>
        </div>

        {/* Quiz answer buttons */}
        {isQuiz && quizRevealed && (
          <div style={{ display:'flex', gap:8, marginTop:10 }}>
            <button onClick={() => onQuizAnswer(true)} style={{
              flex:1, background:'#dcfce7', border:'1.5px solid #86efac',
              borderRadius:12, padding:'10px 0', cursor:'pointer',
              fontSize:13, fontWeight:700, color:'#15803d',
            }}>✓ I knew it</button>
            <button onClick={() => onQuizAnswer(false)} style={{
              flex:1, background:'#fee2e2', border:'1.5px solid #fca5a5',
              borderRadius:12, padding:'10px 0', cursor:'pointer',
              fontSize:13, fontWeight:700, color:'#b91c1c',
            }}>✗ I didn't</button>
          </div>
        )}
        {isQuiz && !quizRevealed && (
          <button onClick={() => onQuizAnswer(null)} style={{
            width:'100%', marginTop:10,
            background:'#f1f5f9', border:'1.5px solid #e2e8f0',
            borderRadius:12, padding:'10px 0', cursor:'pointer',
            fontSize:13, fontWeight:700, color:'#475569',
          }}>Reveal word</button>
        )}
      </div>
    </>
  );
}

// ─── Scene Complete Overlay ───────────────────────────────────────────────────

function SceneComplete({ scene, onNext, onBack }) {
  return (
    <div style={{
      position:'absolute', inset:0, zIndex:20,
      background:'rgba(0,0,0,.55)',
      display:'flex', alignItems:'center', justifyContent:'center',
    }}>
      <div style={{
        background:'white', borderRadius:20,
        padding:'32px 28px', textAlign:'center',
        boxShadow:'0 8px 40px rgba(0,0,0,.28)',
        animation:'vs-complete-in 0.4s cubic-bezier(.4,0,.2,1)',
        maxWidth:300, width:'90%',
      }}>
        <div style={{ fontSize:52, marginBottom:10 }}>🎉</div>
        <div style={{ fontSize:20, fontWeight:900, color:'#1c1917', marginBottom:6 }}>Scene Complete!</div>
        <div style={{ fontSize:13, color:'#78716c', marginBottom:6 }}>
          You discovered all {scene.items.length} words in
        </div>
        <div style={{ fontSize:16, fontWeight:800, color:scene.color, marginBottom:18 }}>
          {scene.icon} {scene.title}
        </div>
        <div style={{
          background:'#fef3c7', borderRadius:12, padding:'10px 16px', marginBottom:18,
          fontSize:13, fontWeight:700, color:'#92400e',
        }}>+15 XP earned!</div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onBack} style={{
            flex:1, background:'#f5f5f4', border:'none', borderRadius:12,
            padding:'12px 0', cursor:'pointer', fontSize:13, fontWeight:700, color:'#44403c',
          }}>← Scenes</button>
          <button onClick={onNext} style={{
            flex:2, background:scene.color, border:'none', borderRadius:12,
            padding:'12px 0', cursor:'pointer', fontSize:13, fontWeight:700, color:'white',
          }}>Next Scene →</button>
        </div>
      </div>
    </div>
  );
}

// ─── Scene Explorer ───────────────────────────────────────────────────────────

function SceneExplorer({ scene, onBack, onNextScene, award }) {
  const [discovered, setDiscovered] = useState(() => loadDiscovered(scene.id));
  const [activeItem, setActiveItem] = useState(null);
  const [addedToSRS, setAddedToSRS] = useState(() => loadSRS());
  const [viewMode, setViewMode] = useState('explore');
  const [quizScore, setQuizScore] = useState({ known: 0, unknown: 0 });
  const [quizRevealed, setQuizRevealed] = useState(false);
  const [toast, setToast] = useState(null);
  const [showComplete, setShowComplete] = useState(false);
  const [completeFired, setCompleteFired] = useState(false);
  const awardFired = useRef(false);

  const total = scene.items.length;
  const discCount = discovered.size;

  // Check completion
  useEffect(() => {
    if (discCount >= total && !completeFired) {
      setCompleteFired(true);
      setShowComplete(true);
      if (!awardFired.current) {
        awardFired.current = true;
        if (typeof award === 'function') award(15);
      }
    }
  }, [discCount, total, completeFired, award]);

  const handleItemTap = useCallback((item) => {
    // Mark discovered
    setDiscovered(prev => {
      if (!prev.has(item.id)) {
        const next = new Set(prev);
        next.add(item.id);
        saveDiscovered(scene.id, next);
        return next;
      }
      return prev;
    });
    setActiveItem(item);
    setQuizRevealed(false);
    speak(item.hr);
  }, [scene.id]);

  const handleClose = useCallback(() => {
    setActiveItem(null);
    setQuizRevealed(false);
  }, []);

  const handleAddSRS = useCallback(() => {
    if (!activeItem) return;
    const key = `${scene.id}_${activeItem.id}`;
    if (addedToSRS.has(key)) return;

    const next = new Set(addedToSRS);
    next.add(key);
    setAddedToSRS(next);
    saveSRS(next);

    // Persist to SRS queue
    const queue = loadSRSQueue();
    const exists = queue.some(q => q.hr === activeItem.hr && q.en === activeItem.en);
    if (!exists) {
      queue.push({ hr: activeItem.hr, en: activeItem.en, note: activeItem.note });
      saveSRSQueue(queue);
    }

    setToast(`Added "${activeItem.hr}" to your word list!`);
  }, [activeItem, addedToSRS, scene.id]);

  const handleQuizAnswer = useCallback((result) => {
    if (result === null) {
      // "Reveal" pressed
      setQuizRevealed(true);
      return;
    }
    if (result === true) setQuizScore(s => ({ ...s, known: s.known + 1 }));
    else if (result === false) setQuizScore(s => ({ ...s, unknown: s.unknown + 1 }));
    handleClose();
  }, [handleClose]);

  const isAdded = activeItem
    ? addedToSRS.has(`${scene.id}_${activeItem.id}`)
    : false;

  return (
    <div className="scr-wrap">
      {/* Header */}
      <div style={{ marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
          <button onClick={onBack} style={{
            background:'none', border:'none', cursor:'pointer',
            fontSize:13, fontWeight:700, color:'var(--subtext)', padding:'4px 0',
          }}>← Back</button>
          <div style={{ flex:1 }}>
            <span style={{ fontSize:17, fontWeight:900, color:'#1c1917' }}>{scene.icon} {scene.title}</span>
            <span style={{ fontSize:12, color:'#78716c', marginLeft:6 }}>{scene.titleEn}</span>
          </div>
          <div style={{ fontSize:12, fontWeight:700, color:scene.color }}>
            {discCount}/{total}
          </div>
        </div>

        {/* Mini progress */}
        <ProgressBar value={discCount} max={total} color={scene.color} height={5} />

        {/* Mode toggle */}
        <div style={{ display:'flex', gap:6, marginTop:10 }}>
          {['explore','quiz'].map(mode => (
            <button key={mode} onClick={() => { setViewMode(mode); setActiveItem(null); }}
              style={{
                flex:1, padding:'8px 0', borderRadius:10, border:'none', cursor:'pointer',
                fontSize:12, fontWeight:700,
                background: viewMode === mode ? scene.color : '#f5f5f4',
                color: viewMode === mode ? 'white' : '#44403c',
                transition:'background 0.2s',
              }}>
              {mode === 'explore' ? '🔍 Explore' : '🧠 Quiz'}
            </button>
          ))}
        </div>

        {/* Quiz score bar */}
        {viewMode === 'quiz' && (quizScore.known + quizScore.unknown) > 0 && (
          <div style={{
            marginTop:8, background:'#f1f5f9', borderRadius:10, padding:'8px 12px',
            fontSize:12, fontWeight:600, color:'#475569', display:'flex', gap:16,
          }}>
            <span style={{ color:'#15803d' }}>✓ Known: {quizScore.known}</span>
            <span style={{ color:'#b91c1c' }}>✗ Missed: {quizScore.unknown}</span>
          </div>
        )}
      </div>

      {/* Scene area */}
      <div style={{
        height:320, position:'relative', borderRadius:16, overflow:'hidden',
        ...scene.sceneStyle,
        boxShadow:'0 2px 16px rgba(0,0,0,.12)',
        marginBottom:16,
      }}>
        {/* SVG illustration background */}
        {SCENE_SVGS[scene.id] || (
          <div style={{
            position:'absolute', inset:0,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:160, opacity:.10, userSelect:'none', pointerEvents:'none', lineHeight:1,
          }}>{scene.emoji}</div>
        )}

        {/* Item buttons */}
        {scene.items.map(item => (
          <ItemButton
            key={item.id}
            item={item}
            discovered={discovered.has(item.id)}
            isActive={activeItem?.id === item.id}
            isQuiz={viewMode === 'quiz' && !discovered.has(item.id)}
            onTap={() => handleItemTap(item)}
          />
        ))}

        {/* Popup */}
        {activeItem && (
          <ItemPopup
            item={activeItem}
            scene={scene}
            isAdded={isAdded}
            isQuiz={viewMode === 'quiz'}
            quizRevealed={quizRevealed}
            onClose={handleClose}
            onSpeak={() => speak(activeItem.hr)}
            onAddSRS={handleAddSRS}
            onQuizAnswer={handleQuizAnswer}
          />
        )}

        {/* Confetti + complete overlay */}
        {showComplete && <Confetti />}
        {showComplete && (
          <SceneComplete
            scene={scene}
            onBack={onBack}
            onNext={() => { setShowComplete(false); onNextScene(); }}
          />
        )}
      </div>

      {/* Word list below scene */}
      <div style={{ marginBottom:8, fontSize:12, fontWeight:700, color:'#78716c', textTransform:'uppercase', letterSpacing:'.06em' }}>
        {discCount < total ? `${total - discCount} words left to discover` : 'All words discovered!'}
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
        {scene.items.map(item => (
          <button key={item.id} onClick={() => {
            setActiveItem(item); setQuizRevealed(false); speak(item.hr);
          }}
            style={{
              background: discovered.has(item.id) ? scene.bg : '#f5f5f4',
              border: discovered.has(item.id) ? `1.5px solid ${scene.color}55` : '1.5px solid #e7e5e4',
              borderRadius:20, padding:'5px 12px', cursor:'pointer',
              fontSize:12, fontWeight:700,
              color: discovered.has(item.id) ? scene.color : '#a8a29e',
            }}>
            {discovered.has(item.id) ? item.hr : '• • •'}
          </button>
        ))}
      </div>

      {toast && <Toast text={toast} onDone={() => setToast(null)} />}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function VocabScenes({ goBack, award }) {
  ensureCSS();

  const [currentScene, setCurrentScene] = useState(null);
  const [allDiscovered, setAllDiscovered] = useState(() =>
    Object.fromEntries(SCENES.map(sc => [sc.id, loadDiscovered(sc.id)]))
  );

  // Refresh allDiscovered when returning to picker
  const handleBackToPicker = useCallback(() => {
    setCurrentScene(null);
    setAllDiscovered(
      Object.fromEntries(SCENES.map(sc => [sc.id, loadDiscovered(sc.id)]))
    );
  }, []);

  const handleNextScene = useCallback(() => {
    if (!currentScene) return;
    const idx = SCENES.findIndex(s => s.id === currentScene.id);
    const next = SCENES[(idx + 1) % SCENES.length];
    setCurrentScene(next);
    setAllDiscovered(
      Object.fromEntries(SCENES.map(sc => [sc.id, loadDiscovered(sc.id)]))
    );
  }, [currentScene]);

  if (currentScene) {
    return (
      <SceneExplorer
        key={currentScene.id}
        scene={currentScene}
        onBack={handleBackToPicker}
        onNextScene={handleNextScene}
        award={award}
      />
    );
  }

  return (
    <ScenePicker
      onSelect={setCurrentScene}
      allDiscovered={allDiscovered}
    />
  );
}
