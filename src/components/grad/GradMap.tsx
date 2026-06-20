import React from 'react';
import { PLACES, type PlaceId } from './places';
import type { Recommendation } from './gradModel';

const SCENE = `${import.meta.env.BASE_URL}images/grad-town.svg`;

/**
 * Karta view — the crafted flat-vector Adriatic town (public/images/grad-town.svg)
 * with place markers overlaid from each place's mapPos. The recommended place
 * glows gold with a count badge; a slim Today bar floats at the bottom.
 */
export default function GradMap({
  rec,
  onOpenPlace,
  statsByPlace,
}: {
  rec: Recommendation;
  onOpenPlace: (id: PlaceId) => void;
  statsByPlace: Record<string, { done: number; total: number; due: number; lockedCount: number }>;
}) {
  return (
    <div
      data-testid="grad-map"
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '392 / 690',
        borderRadius: 18,
        overflow: 'hidden',
        boxShadow: '0 6px 22px rgba(0,0,0,.18)',
      }}
    >
      <style>{`@keyframes gradPulse{0%{transform:translate(-50%,-50%) scale(.6);opacity:.7}70%{transform:translate(-50%,-50%) scale(2.4);opacity:0}100%{opacity:0}}`}</style>
      <img
        src={SCENE}
        alt="Naš grad na moru"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 8,
          left: 12,
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '.12em',
          textTransform: 'uppercase',
          color: '#fff',
          textShadow: '0 1px 4px rgba(0,0,0,.4)',
        }}
      >
        Naš grad na moru
      </div>

      {PLACES.map((p) => {
        const s = statsByPlace[p.id] ?? { done: 0, total: 0, due: 0, lockedCount: 0 };
        const available = s.total - s.lockedCount;
        const completion = available > 0 ? Math.min(1, s.done / available) : 0;
        const isLocked = s.total > 0 && s.lockedCount === s.total;
        const isMastered = available > 0 && s.done >= available && s.due === 0;
        const recommended = rec.placeId === p.id && !isLocked;
        const showDue = s.due > 0 && !isLocked;
        const R = 16;
        const CIRC = 2 * Math.PI * R;
        return (
          <button
            key={p.id}
            onClick={() => onOpenPlace(p.id)}
            aria-label={p.name}
            style={{
              position: 'absolute',
              left: `${p.mapPos.x}%`,
              top: `${p.mapPos.y}%`,
              transform: 'translate(-50%,-100%)',
              border: 'none',
              background: 'none',
              padding: 0,
              cursor: 'pointer',
              fontFamily: "'Outfit',sans-serif",
              opacity: isLocked ? 0.55 : 1,
            }}
          >
            <span
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              {recommended && (
                <span
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: 1,
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    background: 'rgba(200,152,10,.5)',
                    zIndex: -1,
                    animation: 'gradPulse 1.9s infinite',
                  }}
                />
              )}
              <span
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  background: 'rgba(255,255,255,.97)',
                  border: recommended ? '1.5px solid #C8980A' : '1px solid var(--card-b)',
                  borderRadius: 13,
                  padding: '5px 10px 5px 6px',
                  boxShadow: recommended
                    ? '0 5px 18px rgba(200,152,10,.45)'
                    : '0 5px 14px rgba(0,0,0,.28)',
                }}
              >
                {showDue && (
                  <span
                    data-testid={`due-badge-${p.id}`}
                    style={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      background: recommended ? '#C8980A' : '#D40030',
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: 900,
                      minWidth: 18,
                      height: 18,
                      borderRadius: 9,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 4px',
                      border: '2px solid #fff',
                    }}
                  >
                    {s.due}
                  </span>
                )}
                <span
                  data-testid={`ring-${p.id}`}
                  data-completion={String(completion)}
                  style={{ position: 'relative', width: 32, height: 32, flex: 'none' }}
                >
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 36 36"
                    style={{ position: 'absolute', inset: 0 }}
                  >
                    <circle
                      cx="18"
                      cy="18"
                      r={R}
                      fill="none"
                      stroke="rgba(31,41,55,.14)"
                      strokeWidth="3"
                    />
                    {!isLocked && completion > 0 && (
                      <circle
                        cx="18"
                        cy="18"
                        r={R}
                        fill="none"
                        stroke={isMastered ? '#C8980A' : '#0e7490'}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={`${completion * CIRC} ${CIRC}`}
                        transform="rotate(-90 18 18)"
                      />
                    )}
                  </svg>
                  <span
                    {...(isLocked ? { 'data-testid': `marker-locked-${p.id}` } : {})}
                    style={{
                      position: 'absolute',
                      inset: 4,
                      borderRadius: 8,
                      background: p.tint,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                    }}
                  >
                    {isLocked ? '🔒' : p.icon}
                  </span>
                </span>
                <span
                  style={{
                    fontFamily: "'Playfair Display',serif",
                    fontSize: 12,
                    fontWeight: 800,
                    color: 'var(--heading)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {p.name}
                </span>
              </span>
              <span style={{ width: 2, height: 13, background: 'rgba(31,41,55,.4)' }} />
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: 'rgba(31,41,55,.45)',
                  marginTop: -1,
                  boxShadow: '0 0 0 3px rgba(255,255,255,.5)',
                }}
              />
            </span>
          </button>
        );
      })}

      {/* floating Today bar */}
      <button
        onClick={() => rec.launch()}
        data-testid="grad-map-today"
        style={{
          position: 'absolute',
          left: 12,
          right: 12,
          bottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 11,
          background: 'rgba(255,255,255,.95)',
          border: '1px solid var(--card-b)',
          borderRadius: 16,
          padding: '10px 12px',
          boxShadow: '0 8px 24px rgba(0,0,0,.3)',
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: "'Outfit',sans-serif",
        }}
      >
        <span
          style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            background: 'rgba(14,116,144,.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            flex: 'none',
          }}
        >
          ☀️
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{ display: 'block', fontSize: 13, color: 'var(--heading)', fontWeight: 800 }}
          >
            {rec.hr}
          </span>
          <span style={{ display: 'block', fontSize: 11, color: 'var(--subtext)', marginTop: 1 }}>
            {rec.en} · ~{rec.durationMin} min
          </span>
        </span>
        <span
          style={{
            flex: 'none',
            background: '#0e7490',
            color: '#fff',
            fontWeight: 800,
            fontSize: 12,
            padding: '8px 13px',
            borderRadius: 10,
          }}
        >
          Idemo →
        </span>
      </button>
    </div>
  );
}
