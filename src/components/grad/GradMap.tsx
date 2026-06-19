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
  statsByPlace: Record<string, { due: number; total: number }>;
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
        const s = statsByPlace[p.id] ?? { due: 0, total: 0 };
        const recommended = rec.placeId === p.id;
        const badge = recommended ? rec.count || s.due : s.due;
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
                {recommended && badge > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      background: '#C8980A',
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
                    {badge}
                  </span>
                )}
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 9,
                    background: p.tint,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                  }}
                >
                  {p.icon}
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
