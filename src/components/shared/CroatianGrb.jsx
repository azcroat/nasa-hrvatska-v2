/**
 * CroatianGrb — proper heraldic Croatian coat of arms (grb)
 *
 * Renders the official šahovnica shield with:
 *  - Heater (Spanish) shield shape
 *  - 5×5 checkerboard, WHITE top-left (standard grb orientation)
 *  - Crown of 5 historical shields of the Croatian lands
 *  - Gold gradient border with shadow
 *
 * Usage: <CroatianGrb size={140} />
 */
import { useMemo } from 'react';

// ── Heraldic colours ─────────────────────────────────────────────────────────
const RED    = '#D40030';  // Croatian red
const WHITE  = '#F8F6F2';  // Parchment white (not pure white — more heraldic)
const GOLD   = '#E8C840';
const GOLD2  = '#B8940A';
const BLUE1  = '#003DA5';  // Croatian royal blue
const BLUE2  = '#1B5FA8';  // Dalmatian azure
const DARK   = '#0A1240';  // Dubrovnik near-black

// ── Helper: heater/Spanish shield path ───────────────────────────────────────
// Generates an SVG path for a heraldic heater shield centred in [x,y,w,h].
// The bottom curves to a rounded point; the top is flat (square).
function heater(x, y, w, h) {
  const cx = x + w / 2;
  const bend = y + h * 0.62;  // where sides start curving inward
  return (
    `M${x},${y} L${x+w},${y} L${x+w},${bend} ` +
    `Q${x+w},${y+h} ${cx},${y+h} ` +
    `Q${x},${y+h} ${x},${bend} Z`
  );
}

// ── Helper: 6-pointed star polygon ───────────────────────────────────────────
function star6Points(cx, cy, r1, r2) {
  const pts = [];
  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI / 6) - Math.PI / 2;
    const r = i % 2 === 0 ? r1 : r2;
    pts.push(`${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`);
  }
  return pts.join(' ');
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CroatianGrb({ size = 140, style = {}, className = '' }) {
  // Stable unique ID prefix so multiple instances don't clash
  const uid = useMemo(() => 'grb' + Math.random().toString(36).slice(2, 7), []);

  // ── Layout in a 200 × 258 viewBox ──────────────────────────────────────────
  // Crown area:    y = 2  – 62   (5 mini shields)
  // Gold bar:      y = 58 – 66
  // Main shield:   y = 62 – 255  (h = 193)
  const VW = 200, VH = 258;

  const mainX = 10, mainY = 62, mainW = 180, mainH = 193;
  const mainPath = heater(mainX, mainY, mainW, mainH);

  // 5×5 checkerboard cell size (clipped to shield)
  const cW = mainW / 5;   // 36
  const cH = mainH / 5;   // 38.6

  // Crown: 5 mini shields, each 32 × 40, evenly spread
  const crownY = 2;
  const crownH = 40;
  const crownW = 30;
  const crownDefs = [4, 42, 85, 128, 166].map(x => ({ x, y: crownY, w: crownW, h: crownH }));

  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      width={size}
      height={Math.round(size * VH / VW)}
      style={{ display: 'block', ...style }}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Grb Hrvatske — Croatian coat of arms"
      role="img"
    >
      <defs>
        {/* Main shield clip */}
        <clipPath id={`${uid}-mc`}>
          <path d={mainPath} />
        </clipPath>

        {/* Crown shield clips */}
        {crownDefs.map((d, i) => (
          <clipPath key={i} id={`${uid}-cc${i}`}>
            <path d={heater(d.x, d.y, d.w, d.h)} />
          </clipPath>
        ))}

        {/* Gold border gradient */}
        <linearGradient id={`${uid}-gold`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#FFE87A" />
          <stop offset="40%"  stopColor="#D4A820" />
          <stop offset="100%" stopColor="#7A5608" />
        </linearGradient>

        {/* Red cell gradient (adds depth) */}
        <linearGradient id={`${uid}-red`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E8003A" />
          <stop offset="100%" stopColor="#AA0020" />
        </linearGradient>

        {/* White cell gradient */}
        <linearGradient id={`${uid}-wht`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#E8E4DC" />
        </linearGradient>

        {/* Drop shadow on main shield */}
        <filter id={`${uid}-sh`} x="-20%" y="-10%" width="140%" height="130%">
          <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="rgba(0,0,0,0.6)" />
        </filter>

        {/* Subtle inner shadow for shield depth */}
        <filter id={`${uid}-in`} x="0" y="0" width="100%" height="100%">
          <feComposite in="SourceGraphic" in2="SourceGraphic" operator="atop" />
        </filter>
      </defs>

      {/* ── Main shield drop shadow ── */}
      <path d={mainPath} fill="rgba(0,0,0,0.3)" transform="translate(4,8)" filter={`url(#${uid}-sh)`} />

      {/* ── Main shield: 5×5 šahovnica clipped to heater shape ── */}
      <g clipPath={`url(#${uid}-mc)`}>
        {[0,1,2,3,4].flatMap(r =>
          [0,1,2,3,4].map(c => (
            <rect
              key={`${r}-${c}`}
              x={mainX + c * cW}
              y={mainY + r * cH}
              width={cW + 0.6}
              height={cH + 0.6}
              fill={(r + c) % 2 === 0 ? `url(#${uid}-wht)` : `url(#${uid}-red)`}
            />
          ))
        )}
        {/* Cell grid lines for crispness */}
        {[1,2,3,4].map(c => (
          <line key={`vl${c}`}
            x1={mainX + c * cW} y1={mainY}
            x2={mainX + c * cW} y2={mainY + mainH}
            stroke="rgba(0,0,0,0.08)" strokeWidth="0.5"
          />
        ))}
        {[1,2,3,4].map(r => (
          <line key={`hl${r}`}
            x1={mainX} y1={mainY + r * cH}
            x2={mainX + mainW} y2={mainY + r * cH}
            stroke="rgba(0,0,0,0.08)" strokeWidth="0.5"
          />
        ))}
      </g>

      {/* ── Main shield border (gold) ── */}
      <path d={mainPath} fill="none"
        stroke={`url(#${uid}-gold)`} strokeWidth="5.5" strokeLinejoin="round" />
      {/* Inner highlight */}
      <path d={mainPath} fill="none"
        stroke="rgba(255,255,220,0.35)" strokeWidth="1.5" strokeLinejoin="round" />

      {/* ── Gold bar dividing crown from shield ── */}
      <rect x={mainX} y={mainY - 7} width={mainW} height={9}
        fill={`url(#${uid}-gold)`} rx="1.5" />
      <rect x={mainX} y={mainY - 7} width={mainW} height={3}
        fill="rgba(255,255,200,0.4)" rx="1" />

      {/* ══════════════════════════════════════════════════════════════════════
          CROWN — 5 historical shields of the Croatian lands
          Left→Right: Old Croatia · Dubrovnik · Dalmatia · Istria · Slavonia
          ══════════════════════════════════════════════════════════════════════ */}

      {/* ── Shield 1: Old Croatia — deep blue, gold crescent & 6-pointed star ── */}
      {(() => {
        const { x, y, w, h } = crownDefs[0];
        const path = heater(x, y, w, h);
        const cx = x + w / 2;
        // Crescent: outer circle minus inner offset circle
        const ocx = x + 9, ocy = y + h * 0.68, or_ = 7;
        const icx = ocx + 3.5, icy = ocy - 1.5, ir = 6;
        return (
          <g key="c0">
            <path d={path} fill={BLUE1} />
            <g clipPath={`url(#${uid}-cc0)`}>
              {/* 6-pointed star top-right */}
              <polygon points={star6Points(x + w * 0.72, y + h * 0.28, 6, 3)} fill={GOLD} />
              {/* Crescent moon (outer arc minus inner) */}
              <path
                d={`M${ocx-or_},${ocy}
                    A${or_},${or_} 0 1,1 ${ocx+or_},${ocy}
                    A${ir},${ir} 0 1,0 ${ocx-or_},${ocy} Z`}
                fill={GOLD}
              />
            </g>
            <path d={path} fill="none" stroke={`url(#${uid}-gold)`} strokeWidth="1.8" />
          </g>
        );
      })()}

      {/* ── Shield 2: Dubrovnik Republic — near-black, gold fess (horizontal band) ── */}
      {(() => {
        const { x, y, w, h } = crownDefs[1];
        const path = heater(x, y, w, h);
        return (
          <g key="c1">
            <g clipPath={`url(#${uid}-cc1)`}>
              <rect x={x} y={y} width={w} height={h} fill={DARK} />
              {/* Gold fess across middle third */}
              <rect x={x} y={y + h * 0.35} width={w} height={h * 0.30} fill={GOLD} />
            </g>
            <path d={path} fill="none" stroke={`url(#${uid}-gold)`} strokeWidth="1.8" />
          </g>
        );
      })()}

      {/* ── Shield 3: Dalmatia — azure, three golden crowned lion heads ── */}
      {(() => {
        const { x, y, w, h } = crownDefs[2];
        const path = heater(x, y, w, h);
        // Triangle arrangement: top-left, top-right, bottom-centre
        const lions = [
          { cx: x + w * 0.28, cy: y + h * 0.30 },
          { cx: x + w * 0.72, cy: y + h * 0.30 },
          { cx: x + w * 0.50, cy: y + h * 0.72 },
        ];
        return (
          <g key="c2">
            <path d={path} fill={BLUE2} />
            <g clipPath={`url(#${uid}-cc2)`}>
              {lions.map((l, i) => (
                <g key={i}>
                  {/* Disc representing lion head */}
                  <circle cx={l.cx} cy={l.cy} r={4.5} fill={GOLD} />
                  {/* Tiny crown above */}
                  <rect x={l.cx - 3.5} y={l.cy - 8} width={7} height={3} fill={GOLD} rx="0.8" />
                  <polygon
                    points={`${l.cx-3.5},${l.cy-8} ${l.cx-1.5},${l.cy-11} ${l.cx},${l.cy-8} ${l.cx+1.5},${l.cy-11} ${l.cx+3.5},${l.cy-8}`}
                    fill={GOLD}
                  />
                </g>
              ))}
            </g>
            <path d={path} fill="none" stroke={`url(#${uid}-gold)`} strokeWidth="1.8" />
          </g>
        );
      })()}

      {/* ── Shield 4: Istria — azure, golden goat passant (simplified) ── */}
      {(() => {
        const { x, y, w, h } = crownDefs[3];
        const path = heater(x, y, w, h);
        // Goat: body polygon + head circle + legs
        const bx = x + 5, by = y + h * 0.42;
        return (
          <g key="c3">
            <path d={path} fill="#2255A8" />
            <g clipPath={`url(#${uid}-cc3)`}>
              {/* Goat body */}
              <polygon
                points={`${bx},${by+12} ${bx+3},${by+4} ${bx+10},${by} ${bx+20},${by+2} ${bx+22},${by+8} ${bx+20},${by+14} ${bx+8},${by+14}`}
                fill={GOLD}
              />
              {/* Head */}
              <ellipse cx={bx + 22} cy={by + 5} rx={5} ry={4} fill={GOLD} />
              {/* Horn */}
              <path d={`M${bx+22},${by+1} Q${bx+27},${by-4} ${bx+25},${by-2}`}
                stroke={GOLD} strokeWidth="1.5" fill="none" strokeLinecap="round" />
              {/* 4 legs */}
              {[bx+4, bx+8, bx+14, bx+18].map((lx, i) => (
                <line key={i} x1={lx} y1={by+13} x2={lx} y2={by+22}
                  stroke={GOLD} strokeWidth="2" strokeLinecap="round" />
              ))}
            </g>
            <path d={path} fill="none" stroke={`url(#${uid}-gold)`} strokeWidth="1.8" />
          </g>
        );
      })()}

      {/* ── Shield 5: Slavonia — blue upper with star, white lower with red stripe ── */}
      {(() => {
        const { x, y, w, h } = crownDefs[4];
        const path = heater(x, y, w, h);
        const splitY = y + h * 0.48;
        return (
          <g key="c4">
            <g clipPath={`url(#${uid}-cc4)`}>
              {/* Upper: royal blue */}
              <rect x={x} y={y} width={w} height={splitY - y + 1} fill={BLUE1} />
              {/* Lower: white */}
              <rect x={x} y={splitY} width={w} height={h - (splitY - y)} fill="#F0EDE6" />
              {/* Gold 6-pointed star in blue section */}
              <polygon
                points={star6Points(x + w / 2, y + h * 0.25, 7, 3.5)}
                fill={GOLD}
              />
              {/* Red stripe in white section (represents the Sava/Drava river band) */}
              <rect x={x} y={splitY + (h * 0.52) * 0.35} width={w} height={(h * 0.52) * 0.28} fill={RED} />
            </g>
            <path d={path} fill="none" stroke={`url(#${uid}-gold)`} strokeWidth="1.8" />
          </g>
        );
      })()}

      {/* ── Crown shield top border (gold bar above mini shields) ── */}
      <rect x={mainX} y={crownY - 1} width={mainW} height={3}
        fill={`url(#${uid}-gold)`} rx="1" />

    </svg>
  );
}
