import React from 'react';

/**
 * Dalmatian Coast — Cinematic golden-hour panorama
 * Rich atmospheric SVG: Dubrovnik-style walled city, Adriatic sea,
 * layered islands, detailed architecture, Mediterranean flora.
 */
export default function DalmatianCoast({ width = 320, height = 180, className = '', style = {} }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 640 260"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      role="img"
      aria-label="Cinematic Dalmatian coast panorama at golden hour"
    >
      <style>{`
        @keyframes dc2Wave { 0%,100%{transform:translateX(0)} 50%{transform:translateX(-6px)} }
        @keyframes dc2Bob  { 0%,100%{transform:translateY(0) rotate(-.4deg)} 50%{transform:translateY(-5px) rotate(.4deg)} }
        @keyframes dc2Glow { 0%,100%{opacity:.65} 50%{opacity:.9} }
        @keyframes dc2Sparkle { 0%,100%{opacity:0;transform:scale(.5)} 50%{opacity:1;transform:scale(1)} }
        @keyframes dc2Flag  { 0%,100%{transform:skewX(0deg)} 50%{transform:skewX(-4deg)} }
        @keyframes dc2Smoke { 0%{transform:translateY(0) translateX(0) scaleX(1)} 100%{transform:translateY(-18px) translateX(4px) scaleX(1.4);opacity:0} }
      `}</style>

      <defs>
        {/* ── Sky gradients ─── */}
        <linearGradient id="dc2-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#0a1628"/>
          <stop offset="18%"  stopColor="#1a2b4a"/>
          <stop offset="38%"  stopColor="#1e4d7a"/>
          <stop offset="58%"  stopColor="#c87941"/>
          <stop offset="75%"  stopColor="#e8924a"/>
          <stop offset="88%"  stopColor="#f4c06a"/>
          <stop offset="100%" stopColor="#f9d884"/>
        </linearGradient>

        {/* ── Sun glow halo ─── */}
        <radialGradient id="dc2-sunHalo" cx="75%" cy="62%" r="28%">
          <stop offset="0%"   stopColor="#fff7aa" stopOpacity="0.9"/>
          <stop offset="30%"  stopColor="#fcd34d" stopOpacity="0.55"/>
          <stop offset="60%"  stopColor="#f97316" stopOpacity="0.2"/>
          <stop offset="100%" stopColor="#f97316" stopOpacity="0"/>
        </radialGradient>

        {/* ── Adriatic sea ─── */}
        <linearGradient id="dc2-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#0e7490"/>
          <stop offset="25%"  stopColor="#0a5f7a"/>
          <stop offset="60%"  stopColor="#083d56"/>
          <stop offset="100%" stopColor="#051e2d"/>
        </linearGradient>

        {/* ── Sun path reflection on water ─── */}
        <linearGradient id="dc2-sunPath" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%"   stopColor="#fde68a" stopOpacity="0.7"/>
          <stop offset="60%"  stopColor="#f59e0b" stopOpacity="0.35"/>
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0"/>
        </linearGradient>

        {/* ── Stone wall ─── */}
        <linearGradient id="dc2-stone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#e8dcc8"/>
          <stop offset="40%"  stopColor="#d4c9b0"/>
          <stop offset="100%" stopColor="#b8a88a"/>
        </linearGradient>

        {/* ── Warm-lit stone face ─── */}
        <linearGradient id="dc2-stoneWarm" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#f0e0c0"/>
          <stop offset="100%" stopColor="#c8b090"/>
        </linearGradient>

        {/* ── Roof tile ─── */}
        <linearGradient id="dc2-roof" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#d4622a"/>
          <stop offset="50%"  stopColor="#b85220"/>
          <stop offset="100%" stopColor="#8c3c14"/>
        </linearGradient>

        {/* ── Deep shadow ─── */}
        <linearGradient id="dc2-shadow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#2d1f10" stopOpacity="0.85"/>
          <stop offset="100%" stopColor="#1a0f08" stopOpacity="0.5"/>
        </linearGradient>

        {/* ── Rampart / city wall ─── */}
        <linearGradient id="dc2-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#e8d8bc"/>
          <stop offset="100%" stopColor="#c0a87c"/>
        </linearGradient>

        {/* ── Near island ─── */}
        <linearGradient id="dc2-isle1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#2d6a30"/>
          <stop offset="60%"  stopColor="#1a4020"/>
          <stop offset="100%" stopColor="#0d2010"/>
        </linearGradient>

        {/* ── Far island ─── */}
        <linearGradient id="dc2-isle2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#546e87" stopOpacity="0.7"/>
          <stop offset="100%" stopColor="#2a4055" stopOpacity="0.5"/>
        </linearGradient>

        {/* ── Gold trim ─── */}
        <linearGradient id="dc2-gold" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#f9d150"/>
          <stop offset="100%" stopColor="#c89010"/>
        </linearGradient>

        {/* ── Deep cypress ─── */}
        <linearGradient id="dc2-cypress" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#2d5a30"/>
          <stop offset="100%" stopColor="#0d2212"/>
        </linearGradient>

        {/* ── Atmosphere haze ─── */}
        <linearGradient id="dc2-haze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#c87941" stopOpacity="0"/>
          <stop offset="100%" stopColor="#c87941" stopOpacity="0.18"/>
        </linearGradient>

        {/* ── Lavender field ─── */}
        <linearGradient id="dc2-lavender" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#7c3aed" stopOpacity="0.75"/>
          <stop offset="100%" stopColor="#4c1d95" stopOpacity="0.5"/>
        </linearGradient>

        {/* ── Shimmer clip ─── */}
        <clipPath id="dc2-seaClip">
          <rect y="152" width="640" height="108"/>
        </clipPath>

        {/* ── Boat clip ─── */}
        <filter id="dc2-boatShadow" x="-20%" y="-30%" width="140%" height="160%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="rgba(0,0,0,0.4)"/>
        </filter>
        <filter id="dc2-glowFilter" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
        <filter id="dc2-atmBlur" x="-5%" y="-5%" width="110%" height="110%">
          <feGaussianBlur stdDeviation="1.5"/>
        </filter>
      </defs>

      {/* ═══ SKY ══════════════════════════════════════════════ */}
      <rect width="640" height="260" fill="url(#dc2-sky)"/>

      {/* ── Sun mega halo ── */}
      <ellipse cx="480" cy="158" rx="160" ry="90" fill="url(#dc2-sunHalo)"/>
      {/* Sun disk */}
      <circle cx="480" cy="158" r="28" fill="#fff7aa" opacity="0.95"/>
      <circle cx="480" cy="158" r="22" fill="#fde68a" opacity="0.9"/>
      <circle cx="480" cy="158" r="16" fill="#fbbf24"/>
      {/* Lens flare streaks */}
      {[0,30,60,90,120,150,180,210,240,270,300,330].map((a,i) => {
        const rad = a * Math.PI / 180;
        const r1 = 18, r2 = 32 + (i%3)*5;
        return <line key={i}
          x1={480+Math.cos(rad)*r1} y1={158+Math.sin(rad)*r1}
          x2={480+Math.cos(rad)*r2} y2={158+Math.sin(rad)*r2}
          stroke="#fde68a" strokeWidth={i%3===0?1.5:0.8} opacity={i%2===0?0.7:0.4}
        />;
      })}
      {/* Extra golden shimmer rays */}
      {[15,45,75,105,135,165,195,225,255,285,315,345].map((a,i) => {
        const rad = a * Math.PI / 180;
        return <line key={i}
          x1={480+Math.cos(rad)*20} y1={158+Math.sin(rad)*20}
          x2={480+Math.cos(rad)*(60+i*4)} y2={158+Math.sin(rad)*(60+i*4)}
          stroke="#f9d150" strokeWidth="0.5" opacity="0.25"
          style={{animation:`dc2Glow ${2+i*0.1}s ease-in-out infinite`}}
        />;
      })}

      {/* ── Cloud layers — atmospheric depth ── */}
      {/* High altitude clouds */}
      <ellipse cx="80" cy="38" rx="90" ry="14" fill="rgba(255,220,160,0.12)"/>
      <ellipse cx="200" cy="28" rx="120" ry="10" fill="rgba(255,210,140,0.09)"/>
      <ellipse cx="370" cy="22" rx="100" ry="8" fill="rgba(200,180,140,0.08)"/>

      {/* Mid clouds — backlit golden */}
      <ellipse cx="120" cy="70" rx="75" ry="18" fill="rgba(248,230,180,0.18)"/>
      <ellipse cx="60" cy="80" rx="55" ry="14" fill="rgba(248,220,160,0.14)"/>
      <ellipse cx="240" cy="62" rx="85" ry="16" fill="rgba(240,200,140,0.1)"/>

      {/* ── Stars / planets (upper sky — barely visible at golden hour) ── */}
      {[[18,15],[45,8],[90,20],[160,10],[310,6],[380,18],[420,8],[560,14],[610,22]].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r={0.8+i%2*0.4} fill="white" opacity={0.3+i%3*0.1}
          style={{animation:`dc2Sparkle ${2+i*0.4}s ease-in-out ${i*0.3}s infinite`}}/>
      ))}

      {/* ═══ HORIZON / FAR ISLANDS ════════════════════════════ */}
      {/* Outermost island — atmospheric haze */}
      <ellipse cx="520" cy="152" rx="80" ry="14" fill="rgba(80,100,120,0.35)" filter="url(#dc2-atmBlur)"/>
      <path d="M 440 152 Q 480 140 520 144 Q 560 138 600 150 L 600 160 L 440 160 Z"
        fill="url(#dc2-isle2)" filter="url(#dc2-atmBlur)" opacity="0.8"/>

      {/* Mid-distance island with vegetation silhouette */}
      <path d="M 360 152 Q 395 138 430 143 Q 455 136 480 148 L 480 162 L 360 162 Z"
        fill="url(#dc2-isle2)" opacity="0.75"/>
      {/* Cypress silhouettes on far island */}
      {[375,388,401,414,427,440,453,466].map((x,i)=>(
        <ellipse key={i} cx={x} cy={146-i%3*2} rx={2.5} ry={8+i%2*3}
          fill="#1a3a20" opacity="0.5"/>
      ))}

      {/* Near island — Hvar/Brač style */}
      <path d="M 0 152 Q 60 128 140 138 Q 200 130 260 148 L 260 165 L 0 165 Z"
        fill="url(#dc2-isle1)" opacity="0.9"/>
      {/* Dense pine/cypress on near island */}
      {[15,30,50,68,85,100,118,135,150,165,185,200,218,235,248].map((x,i)=>(
        <ellipse key={i} cx={x} cy={136+i%4} rx={3+i%3} ry={12+i%4*2}
          fill={i%2===0?"#1e4a22":"#2a5a28"} opacity="0.85"/>
      ))}

      {/* ═══ CITY WALLS — DUBROVNIK STYLE ════════════════════ */}
      {/* Outer rampart foundation */}
      <rect x="0" y="148" width="420" height="18" fill="url(#dc2-wall)" opacity="0.95"/>
      {/* Rampart top crenellations */}
      {Array.from({length:28}).map((_,i)=>(
        <rect key={i} x={i*15} y={142} width={9} height={10} rx="1"
          fill="url(#dc2-wall)" opacity={i%3===0?0.9:0.75}/>
      ))}
      {/* Wall face detail — horizontal courses */}
      <line x1="0" y1="152" x2="420" y2="152" stroke="#b8a880" strokeWidth="0.7" opacity="0.5"/>
      <line x1="0" y1="157" x2="420" y2="157" stroke="#b8a880" strokeWidth="0.7" opacity="0.4"/>
      <line x1="0" y1="162" x2="420" y2="162" stroke="#b8a880" strokeWidth="0.7" opacity="0.35"/>
      {/* Vertical block joints */}
      {[30,60,90,120,150,180,210,240,270,300,330,360,390].map((x,i)=>(
        <line key={i} x1={x} y1={148} x2={x} y2={166}
          stroke="#b0a070" strokeWidth="0.5" opacity="0.4"/>
      ))}
      {/* Machicolations */}
      {Array.from({length:14}).map((_,i)=>(
        <rect key={i} x={i*30+8} y={144} width={8} height={4} rx="0.5"
          fill="#a89878" opacity="0.5"/>
      ))}

      {/* ── Left bastion tower ── */}
      <rect x="0" y="110" width="38" height="56" fill="url(#dc2-stoneWarm)"/>
      <rect x="0" y="108" width="42" height="6" fill="url(#dc2-wall)"/>
      {/* Crenellations on bastion */}
      {[2,12,22,32].map((x,i)=>(
        <rect key={i} x={x} y={100} width={7} height={9} rx="1" fill="url(#dc2-wall)"/>
      ))}
      {/* Bastion arrow slit windows */}
      <rect x="10" y="120" width="5" height="16" rx="2" fill="rgba(20,10,5,0.7)"/>
      <rect x="22" y="126" width="5" height="14" rx="2" fill="rgba(20,10,5,0.7)"/>
      {/* Bastion roof */}
      <polygon points="0,110 19,94 38,110" fill="url(#dc2-roof)"/>
      <polygon points="38,110 42,107 42,110" fill="#7a3010" opacity="0.7"/>
      {/* Tower shadow */}
      <rect x="0" y="100" width="40" height="4" fill="rgba(20,10,5,0.2)"/>

      {/* ── Main Cathedral / bell tower ── */}
      <rect x="42" y="68" width="44" height="98" fill="url(#dc2-stoneWarm)"/>
      {/* Cathedral facade detail — niches */}
      <rect x="51" y="80" width="10" height="18" rx="5" fill="rgba(30,15,8,0.35)"/>
      <rect x="67" y="80" width="10" height="18" rx="5" fill="rgba(30,15,8,0.35)"/>
      {/* Arched windows */}
      <path d="M 51 80 Q 56 74 61 80" fill="none" stroke="#b8a880" strokeWidth="1"/>
      <path d="M 67 80 Q 72 74 77 80" fill="none" stroke="#b8a880" strokeWidth="1"/>
      {/* Stone courses */}
      {[78,86,94,102,110,118,126,134].map((y,i)=>(
        <line key={i} x1={42} y1={y} x2={86} y2={y}
          stroke="#c8b890" strokeWidth="0.7" opacity="0.5"/>
      ))}
      {/* Gothic arch doorway */}
      <rect x="56" y="138" width="16" height="28" rx="0" fill="rgba(20,10,5,0.75)"/>
      <path d="M 56 138 Q 64 128 72 138" fill="rgba(20,10,5,0.6)" stroke="none"/>
      {/* Rose window */}
      <circle cx="64" cy="112" r="7" fill="none" stroke="#d4c090" strokeWidth="1.2" opacity="0.7"/>
      <circle cx="64" cy="112" r="3" fill="none" stroke="#d4c090" strokeWidth="0.8" opacity="0.6"/>
      {[0,60,120,180,240,300].map((a,i)=>{
        const r = a*Math.PI/180;
        return <line key={i} x1={64} y1={112} x2={64+Math.cos(r)*7} y2={112+Math.sin(r)*7}
          stroke="#d4c090" strokeWidth="0.6" opacity="0.5"/>
      })}
      {/* Cathedral roof */}
      <polygon points="36,68 64,44 92,68" fill="url(#dc2-roof)"/>
      <polygon points="92,68 96,65 96,68" fill="#7a3010" opacity="0.7"/>

      {/* Bell tower — attached to cathedral */}
      <rect x="92" y="38" width="24" height="128" fill="url(#dc2-stone)"/>
      {/* Tower stone courses */}
      {[44,52,60,68,76,84,92,100,108,116,124,132,140,148].map((y,i)=>(
        <line key={i} x1={92} y1={y} x2={116} y2={y}
          stroke="#c0b080" strokeWidth="0.6" opacity="0.45"/>
      ))}
      {/* Belfry openings (romanesque arches) */}
      <rect x="97" y="56" width="5" height="14" rx="2.5" fill="rgba(20,10,5,0.7)"/>
      <rect x="109" y="56" width="5" height="14" rx="2.5" fill="rgba(20,10,5,0.7)"/>
      <rect x="97" y="80" width="5" height="12" rx="2.5" fill="rgba(20,10,5,0.6)"/>
      <rect x="109" y="80" width="5" height="12" rx="2.5" fill="rgba(20,10,5,0.6)"/>
      {/* Clock face */}
      <circle cx="104" cy="106" r="7" fill="#f5f0e0" stroke="#c8b880" strokeWidth="1" opacity="0.95"/>
      <line x1="104" y1="106" x2="104" y2="100.5" stroke="#333" strokeWidth="1" strokeLinecap="round"/>
      <line x1="104" y1="106" x2="108" y2="104" stroke="#333" strokeWidth="0.7" strokeLinecap="round"/>
      {/* Tower crown */}
      <rect x="88" y="32" width="32" height="10" fill="url(#dc2-wall)"/>
      {[90,96,102,108,114].map((x,i)=>(
        <rect key={i} x={x} y={24} width={8} height={9} rx="1" fill="url(#dc2-wall)"/>
      ))}
      {/* Tall bell tower spire */}
      <polygon points="92,32 104,6 116,32" fill="url(#dc2-roof)"/>
      <line x1="104" y1="6" x2="104" y2="2" stroke="#c8b010" strokeWidth="1.5"/>
      <circle cx="104" cy="2" r="2" fill="url(#dc2-gold)"/>

      {/* ── Mid-city buildings ── */}
      {/* Building cluster A */}
      <rect x="116" y="96" width="32" height="70" fill="url(#dc2-stoneWarm)"/>
      <polygon points="114,96 132,76 150,96" fill="url(#dc2-roof)"/>
      <polygon points="150,96 153,93 153,96" fill="#7a3010" opacity="0.7"/>
      {/* Windows */}
      <rect x="122" y="106" width="7" height="10" rx="1.5" fill="rgba(20,10,5,0.5)"/>
      <rect x="134" y="106" width="7" height="10" rx="1.5" fill="rgba(20,10,5,0.5)"/>
      <rect x="122" y="122" width="7" height="10" rx="1.5" fill="rgba(20,10,5,0.5)"/>
      <rect x="134" y="122" width="7" height="10" rx="1.5" fill="rgba(20,10,5,0.5)"/>
      {/* Arch doorway */}
      <rect x="126" y="148" width="12" height="18" rx="1" fill="rgba(20,10,5,0.65)"/>
      <path d="M 126 148 Q 132 141 138 148" fill="rgba(20,10,5,0.5)"/>

      {/* Building cluster B */}
      <rect x="150" y="104" width="28" height="62" fill="#f0e4cc"/>
      <polygon points="148,104 164,86 180,104" fill="url(#dc2-roof)"/>
      <polygon points="180,104 183,101 183,104" fill="#7a3010" opacity="0.7"/>
      {/* Loggia / arcade */}
      {[156,163,170].map((x,i)=>(
        <path key={i} d={`M ${x} 148 Q ${x+3.5} 142 ${x+7} 148`}
          fill="rgba(20,10,5,0.5)" stroke="none"/>
      ))}
      <rect x="155" y="148" width="22" height="18" fill="rgba(20,10,5,0.5)"/>
      <rect x="155" y="112" width="7" height="11" rx="1.5" fill="rgba(20,10,5,0.45)"/>
      <rect x="166" y="112" width="7" height="11" rx="1.5" fill="rgba(20,10,5,0.45)"/>

      {/* Building cluster C */}
      <rect x="180" y="88" width="36" height="78" fill="url(#dc2-stoneWarm)"/>
      <polygon points="178,88 198,64 218,88" fill="url(#dc2-roof)"/>
      <polygon points="218,88 222,85 222,88" fill="#7a3010" opacity="0.7"/>
      <rect x="186" y="98" width="9" height="14" rx="2" fill="rgba(20,10,5,0.5)"/>
      <rect x="200" y="98" width="9" height="14" rx="2" fill="rgba(20,10,5,0.5)"/>
      <rect x="186" y="118" width="9" height="14" rx="2" fill="rgba(20,10,5,0.5)"/>
      <rect x="200" y="118" width="9" height="14" rx="2" fill="rgba(20,10,5,0.5)"/>
      {/* Gothic arch window */}
      <rect x="192" y="140" width="14" height="26" rx="7" fill="rgba(30,15,8,0.6)"/>
      {/* Chimney */}
      <rect x="206" y="72" width="5" height="8" rx="1" fill="#b85020"/>
      <rect x="205" y="70" width="7" height="2.5" rx="0.5" fill="#c06030"/>
      <ellipse cx="208.5" cy="70" rx="4" ry="1.5" fill="rgba(80,60,40,0.35)"
        style={{animation:'dc2Smoke 3s ease-out infinite'}}/>

      {/* Building cluster D */}
      <rect x="218" y="100" width="30" height="66" fill="#f5ead8"/>
      <polygon points="216,100 233,82 250,100" fill="url(#dc2-roof)"/>
      <polygon points="250,100 253,97 253,100" fill="#7a3010" opacity="0.7"/>
      <rect x="222" y="108" width="7" height="10" rx="1.5" fill="rgba(20,10,5,0.45)"/>
      <rect x="234" y="108" width="7" height="10" rx="1.5" fill="rgba(20,10,5,0.45)"/>
      <rect x="222" y="124" width="7" height="10" rx="1.5" fill="rgba(20,10,5,0.45)"/>
      <rect x="234" y="124" width="7" height="10" rx="1.5" fill="rgba(20,10,5,0.45)"/>
      <rect x="226" y="142" width="12" height="24" rx="1" fill="rgba(20,10,5,0.65)"/>

      {/* Building cluster E */}
      <rect x="250" y="110" width="26" height="56" fill="url(#dc2-stoneWarm)"/>
      <polygon points="248,110 263,94 278,110" fill="url(#dc2-roof)"/>
      <polygon points="278,110 281,107 281,107" fill="#7a3010" opacity="0.7"/>
      <rect x="254" y="118" width="6" height="9" rx="1.5" fill="rgba(20,10,5,0.45)"/>
      <rect x="265" y="118" width="6" height="9" rx="1.5" fill="rgba(20,10,5,0.45)"/>
      <rect x="254" y="132" width="6" height="9" rx="1.5" fill="rgba(20,10,5,0.45)"/>
      <rect x="265" y="132" width="6" height="9" rx="1.5" fill="rgba(20,10,5,0.45)"/>

      {/* Building cluster F — far right */}
      <rect x="278" y="98" width="34" height="68" fill="#f0e4cc" opacity="0.95"/>
      <polygon points="276,98 295,76 314,98" fill="url(#dc2-roof)" opacity="0.95"/>
      <polygon points="314,98 318,95 318,98" fill="#7a3010" opacity="0.65"/>
      <rect x="282" y="106" width="8" height="12" rx="2" fill="rgba(20,10,5,0.45)"/>
      <rect x="296" y="106" width="8" height="12" rx="2" fill="rgba(20,10,5,0.45)"/>
      <rect x="282" y="123" width="8" height="12" rx="2" fill="rgba(20,10,5,0.45)"/>
      <rect x="296" y="123" width="8" height="12" rx="2" fill="rgba(20,10,5,0.45)"/>
      <rect x="288" y="144" width="14" height="22" rx="1" fill="rgba(20,10,5,0.6)"/>

      {/* ── Receding buildings (atmospheric haze) ── */}
      {[318,346,372,396].map((x,i)=>(
        <React.Fragment key={i}>
          <rect x={x} y={108+i*4} width={26-i*2} height={58-i*6}
            fill="#e8dccc" opacity={0.85-i*0.12}/>
          <polygon points={`${x-2},${108+i*4} ${x+12-i},${90+i*3} ${x+28-i*2},${108+i*4}`}
            fill="url(#dc2-roof)" opacity={0.8-i*0.1}/>
        </React.Fragment>
      ))}

      {/* ── Foreground promenade / Stradun ── */}
      <path d="M 0 162 L 420 162 L 420 170 Q 350 174 250 172 Q 140 170 0 172 Z"
        fill="#d8cdb0"/>
      {/* Marble promenade gleam */}
      <path d="M 0 163 L 420 163" stroke="#e8e0cc" strokeWidth="0.8" opacity="0.6"/>
      {/* Promenade block joints */}
      {[40,80,120,160,200,240,280,320,360,400].map((x,i)=>(
        <line key={i} x1={x} y1={162} x2={x-10} y2={172}
          stroke="#c4b890" strokeWidth="0.5" opacity="0.4"/>
      ))}
      {/* Promenade shadow under wall */}
      <rect x="0" y="160" width="420" height="4" fill="rgba(0,0,0,0.15)"/>

      {/* ═══ MEDITERRANEAN FLORA ══════════════════════════════ */}

      {/* Cypress grove — left foreground */}
      {[
        {x:340,h:52,w:7},{x:353,h:44,w:6},{x:363,h:58,w:8},
        {x:375,h:48,w:6.5},{x:385,h:54,w:7},{x:395,h:42,w:5.5},
      ].map((c,i)=>(
        <React.Fragment key={i}>
          {/* Trunk */}
          <rect x={c.x-1.5} y={c.h > 50 ? 162-c.h+6 : 166-c.h+4}
            width={3} height={8} fill="#5a3c18"/>
          {/* Main body */}
          <ellipse cx={c.x} cy={178-c.h} rx={c.w} ry={c.h*0.42}
            fill="url(#dc2-cypress)" opacity="0.95"/>
          {/* Light highlight on sunny side */}
          <ellipse cx={c.x+1.5} cy={180-c.h} rx={c.w*0.45} ry={c.h*0.3}
            fill="#3a6035" opacity="0.6"/>
          {/* Shadow side */}
          <ellipse cx={c.x-2} cy={182-c.h} rx={c.w*0.3} ry={c.h*0.35}
            fill="#0d1e0e" opacity="0.3"/>
        </React.Fragment>
      ))}

      {/* Olive grove — right mid */}
      {[410,428,446,462].map((x,i)=>(
        <React.Fragment key={i}>
          {/* Gnarled trunk */}
          <polygon points={`${x},172 ${x+2},164 ${x+4},164 ${x+5},172`}
            fill="#6b4c2a"/>
          <polygon points={`${x+2},166 ${x+1},162 ${x+3},162`} fill="#7a5530"/>
          {/* Canopy — multi-circle olive */}
          <circle cx={x+3} cy={155+i%3*2} r={10+i%2*2} fill="#5a7a30" opacity="0.85"/>
          <circle cx={x-2} cy={152+i%2*2} r={8}  fill="#6b8f3a" opacity="0.8"/>
          <circle cx={x+8} cy={153+i%3}   r={7}  fill="#6b8f3a" opacity="0.8"/>
          <circle cx={x+3} cy={148+i%2}   r={7}  fill="#7ba040" opacity="0.75"/>
          {/* Silvery leaf shimmer */}
          <circle cx={x+1} cy={150}       r={3}  fill="rgba(200,220,180,0.3)"/>
        </React.Fragment>
      ))}

      {/* Lavender field strips — foreground */}
      {[0,5,10,15,20].map((off,i)=>(
        <React.Fragment key={i}>
          {Array.from({length:8}).map((_,j)=>(
            <React.Fragment key={j}>
              <rect x={488+j*16+off*2} y={152+off} width={2} height={12+off}
                fill="#5a3a28"/>
              <ellipse cx={489+j*16+off*2} cy={148+off} rx={4} ry={5+i}
                fill="url(#dc2-lavender)" opacity={0.7+i*0.05}/>
            </React.Fragment>
          ))}
        </React.Fragment>
      ))}

      {/* Foreground wildflowers */}
      {[550,568,585,602,618,634].map((x,i)=>(
        <React.Fragment key={i}>
          <rect x={x} y={160} width={1.5} height={9} fill="#4a6030" opacity="0.8"/>
          <circle cx={x+0.75} cy={157} r={3.5}
            fill={['#D40030','#fbbf24','#ffffff','#f87171','#7c3aed','#34d399'][i]}
            opacity={0.85}/>
        </React.Fragment>
      ))}

      {/* ═══ ADRIATIC SEA ═════════════════════════════════════ */}
      <rect y="152" width="640" height="108" fill="url(#dc2-sea)"/>

      {/* ── Golden path of sunlight on water ── */}
      <path d="M 390 152 L 480 152 L 560 260 L 400 260 Z"
        fill="url(#dc2-sunPath)" opacity="0.55"/>
      {/* Caustic light shimmer on water */}
      <path d="M 430 152 L 495 152 L 545 230 L 445 230 Z"
        fill="url(#dc2-sunPath)" opacity="0.3"/>

      {/* ── Wave layers ── */}
      <g style={{animation:'dc2Wave 5s ease-in-out infinite'}}>
        {/* Near waves — most detail */}
        <path d="M 0 170 Q 40 164 80 170 Q 120 176 160 170 Q 200 164 240 170 Q 280 176 320 170 Q 360 164 400 170 Q 440 176 480 170 Q 520 164 560 170 Q 600 176 640 170"
          stroke="rgba(255,255,255,0.4)" strokeWidth="1.8" fill="none"/>
        <path d="M 0 182 Q 50 176 100 182 Q 160 188 210 182 Q 270 176 320 182 Q 380 188 430 182 Q 490 176 540 182 Q 590 188 640 182"
          stroke="rgba(255,255,255,0.28)" strokeWidth="1.4" fill="none"/>
        <path d="M 0 196 Q 60 190 120 196 Q 185 202 250 196 Q 310 190 370 196 Q 430 202 500 196 Q 565 190 640 196"
          stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" fill="none"/>
        <path d="M 0 212 Q 70 207 140 212 Q 210 218 280 212 Q 350 207 420 212 Q 490 218 560 212 Q 600 209 640 212"
          stroke="rgba(255,255,255,0.12)" strokeWidth="1" fill="none"/>
        <path d="M 0 230 Q 80 226 160 230 Q 240 234 320 230 Q 400 226 480 230 Q 560 234 640 230"
          stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" fill="none"/>
      </g>

      {/* ── Water sparkles on golden path ── */}
      {[
        [440,162],[452,168],[465,175],[478,162],[490,180],
        [503,166],[515,185],[528,172],[505,195],[520,205],
      ].map(([x,y],i)=>(
        <circle key={i} cx={x} cy={y} r={1.5+i%2*0.8} fill="#fde68a" opacity="0.6"
          style={{animation:`dc2Sparkle ${1.5+i*0.35}s ease-in-out ${i*0.2}s infinite`}}/>
      ))}

      {/* ── Main sailing vessel ── */}
      <g style={{animation:'dc2Bob 3.8s ease-in-out infinite', transformOrigin:'320px 70%'}}
        filter="url(#dc2-boatShadow)">
        {/* Hull — classic trabakul shape */}
        <path d="M 288 218 Q 316 212 344 218 L 340 228 Q 316 224 292 228 Z"
          fill="#e8d8b0" stroke="#c8b880" strokeWidth="0.8"/>
        {/* Hull stripe */}
        <rect x="292" y="218" width="48" height="3" fill="#b86020" opacity="0.7"/>
        {/* Deck rail */}
        <line x1="292" y1="218" x2="340" y2="218" stroke="#c8a060" strokeWidth="1.2"/>

        {/* Main mast */}
        <rect x="314.5" y="168" width="3" height="52" fill="#5c4033" rx="1"/>

        {/* Main sail — Croatian-style billowing lateen */}
        <path d="M 316 218 Q 296 200 280 168 Q 300 178 316 218 Z"
          fill="white" stroke="#d8cbb0" strokeWidth="0.8" opacity="0.95"/>
        {/* Sail shadow / fold detail */}
        <path d="M 316 218 Q 302 202 292 175 Q 286 168 280 168"
          fill="none" stroke="rgba(180,160,120,0.5)" strokeWidth="0.8"/>

        {/* Jib / foresail */}
        <path d="M 316 218 Q 330 200 346 168 Q 332 180 316 218 Z"
          fill="#D40030" stroke="#8a1000" strokeWidth="0.8" opacity="0.88"/>
        {/* Jib crease */}
        <path d="M 316 218 Q 328 202 338 175"
          fill="none" stroke="rgba(100,0,0,0.4)" strokeWidth="0.7"/>

        {/* Croatian flag at masthead */}
        <g style={{animation:'dc2Flag 2.5s ease-in-out infinite', transformOrigin:'316px 168px'}}>
          <rect x="317" y="167" width="14" height="4" fill="#D40030"/>
          <rect x="317" y="171" width="14" height="4" fill="white"/>
          <rect x="317" y="175" width="14" height="4" fill="#003087"/>
          {/* Šahovnica on flag */}
          {[0,1,2,3].map(col=>[0,1].map(row=>(
            <rect key={`${col}-${row}`} x={317+col*3.5} y={167+row*4} width={3.5} height={4}
              fill={(col+row)%2===0?'#D40030':'white'} opacity="0.7"/>
          )))}
        </g>

        {/* Water reflection under boat */}
        <path d="M 292 228 Q 316 232 340 228 L 344 238 Q 316 244 288 238 Z"
          fill="rgba(232,216,176,0.2)" opacity="0.5"/>
      </g>

      {/* ── Small fishing boat — middle distance ── */}
      <g style={{animation:'dc2Bob 4.5s ease-in-out .8s infinite', transformOrigin:'180px 70%'}} opacity="0.75">
        <path d="M 158 186 Q 172 182 186 186 L 184 192 Q 172 189 160 192 Z"
          fill="#d4c8a0"/>
        <rect x="170.5" y="172" width="2" height="16" fill="#5c4033" rx="0.5"/>
        <path d="M 171 186 Q 163 180 158 172 Q 167 176 171 186 Z"
          fill="rgba(255,255,255,0.85)"/>
        <path d="M 172 186 Q 179 179 183 172 Q 176 177 172 186 Z"
          fill="#D40030" opacity="0.75"/>
      </g>

      {/* ── Far distant boat silhouette ── */}
      <g opacity="0.45">
        <path d="M 560 168 Q 575 165 590 168 L 589 172 Q 575 170 561 172 Z"
          fill="#0e4a60"/>
        <rect x="574.5" y="157" width="1.5" height="12" fill="#0e3a4a"/>
        <path d="M 575 168 Q 569 163 563 157 Q 570 161 575 168 Z"
          fill="rgba(255,255,255,0.5)"/>
        <path d="M 575 168 Q 580 162 585 157 Q 579 162 575 168 Z"
          fill="#D40030" opacity="0.5"/>
      </g>

      {/* ═══ ATMOSPHERIC OVERLAYS ════════════════════════════ */}
      {/* Ground haze near horizon */}
      <rect x="0" y="148" width="640" height="20" fill="url(#dc2-haze)" opacity="0.45"/>

      {/* Sea horizon glow */}
      <rect x="0" y="150" width="640" height="6"
        fill="rgba(249,210,130,0.22)"/>

      {/* Vignette — darkens edges */}
      <defs>
        <radialGradient id="dc2-vignette" cx="50%" cy="50%" r="70%">
          <stop offset="0%"   stopColor="transparent"/>
          <stop offset="100%" stopColor="rgba(0,0,0,0.38)"/>
        </radialGradient>
      </defs>
      <rect width="640" height="260" fill="url(#dc2-vignette)"/>

      {/* ── Foreground sea foam ── */}
      <path d="M 0 252 Q 50 246 100 252 Q 150 258 200 252 Q 250 246 300 252 Q 350 258 400 252 Q 450 246 500 252 Q 550 258 600 252 L 640 252 L 640 260 L 0 260 Z"
        fill="rgba(255,255,255,0.06)"/>

      {/* ── Croatian coat of arms watermark — subtle ── */}
      <text x="24" y="242" fontSize="10" fill="rgba(255,255,255,0.18)"
        fontFamily="Outfit,sans-serif" fontWeight="800" letterSpacing="0.1em">HRVATSKA</text>

      {/* ── "Golden hour" colour grade overlay ── */}
      <rect width="640" height="260"
        fill="rgba(180,100,20,0.055)" style={{mixBlendMode:'multiply'}}/>
    </svg>
  );
}
