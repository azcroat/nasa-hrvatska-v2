import React from 'react';
import { PLACES, type PlaceId } from './places';
import {
  placeCompletion,
  placeDisplay,
  placeLife,
  aliveCount,
  type Recommendation,
  type PlaceLife,
} from './gradModel';
import CharacterPortrait from '../family/CharacterPortrait';
import GradTownArt from './GradTownArt';

const TEAL = '#0e7490';
const GOLD = '#C8980A';

/**
 * Karta view — a calm animated living-town HERO (the harbour comes to life as
 * you master places) above a roomy, scannable place LIST led by one recommended
 * "Danas" card. No crammed map markers. All motion is CSS-keyframe driven and
 * disabled under prefers-reduced-motion.
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
  const stat = (id: PlaceId) => statsByPlace[id] ?? { total: 0, done: 0, due: 0, lockedCount: 0 };
  const lifeByPlace = Object.fromEntries(
    PLACES.map((p) => [p.id, placeLife(stat(p.id))]),
  ) as Record<PlaceId, PlaceLife>;
  const aliveN = aliveCount(statsByPlace);

  return (
    <div data-testid="grad-map" style={{ fontFamily: "'Outfit',sans-serif" }}>
      <style>{`
        @keyframes kmDrift{from{transform:translateX(-50px)}to{transform:translateX(440px)}}
        @keyframes kmWaves{0%,100%{opacity:.45}50%{opacity:.8}}
        @keyframes kmGlint{0%,100%{opacity:.25}50%{opacity:.7}}
        @keyframes kmBob{0%,100%{transform:translateY(0) rotate(-1.2deg)}50%{transform:translateY(3px) rotate(1.2deg)}}
        @keyframes kmFerry{from{transform:translateX(0)}to{transform:translateX(360px)}}
        @keyframes kmGull{0%{transform:translate(-30px,6px)}100%{transform:translate(420px,-14px)}}
        @keyframes kmSmoke{0%{opacity:0;transform:translateY(0) scale(.6)}25%{opacity:.5}100%{opacity:0;transform:translateY(-26px) scale(1.7)}}
        @keyframes kmFlag{0%,100%{transform:skewY(0)}50%{transform:skewY(-12deg)}}
        @keyframes kmTwk{0%,100%{opacity:.5}50%{opacity:1}}
        @keyframes kmSway{0%,100%{transform:rotate(-1.4deg)}50%{transform:rotate(1.4deg)}}
        @keyframes recoGlow{0%,100%{box-shadow:0 6px 18px rgba(200,152,10,.18)}50%{box-shadow:0 6px 24px rgba(200,152,10,.42)}}
        #km-clouds{animation:kmDrift 60s linear infinite}
        #km-waves{animation:kmWaves 6s ease-in-out infinite}
        #km-glint{animation:kmGlint 5s ease-in-out infinite}
        #km-boat-1{animation:kmBob 4.8s ease-in-out infinite;transform-origin:center bottom}
        #km-ferry{animation:kmFerry 36s linear infinite}
        #km-gulls path{animation:kmGull 13s linear infinite}
        #km-gulls path:last-child{animation-delay:5s}
        #km-flag{animation:kmFlag 2.4s ease-in-out infinite;transform-box:fill-box;transform-origin:left center}
        .km-cyp{transform-box:fill-box;transform-origin:bottom center;animation:kmSway 7s ease-in-out infinite}
        .km-twk{animation:kmTwk 5s ease-in-out infinite}
        /* per-district life: hidden when dormant, shown when partial/full */
        [data-life="dormant"]{opacity:0}
        [data-life="partial"]{opacity:.9}
        [data-life="full"]{opacity:1}
        [data-place="kuhinja"][data-life="partial"] .km-smoke,
        [data-place="kuhinja"][data-life="full"] .km-smoke{animation:kmSmoke 4.4s ease-in-out infinite}
        .km-reco{animation:recoGlow 3.4s ease-in-out infinite}
        @media (prefers-reduced-motion: reduce){
          #km-clouds,#km-waves,#km-glint,#km-boat-1,#km-ferry,#km-gulls path,#km-flag,
          .km-cyp,.km-twk,.km-smoke,.km-reco{animation:none}
        }
      `}</style>

      {/* HERO */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16 / 11',
          borderRadius: 18,
          overflow: 'hidden',
          boxShadow: '0 6px 22px rgba(0,40,80,.18)',
        }}
      >
        <GradTownArt lifeByPlace={lifeByPlace} />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to bottom,rgba(0,0,0,.18),transparent 34%,transparent 60%,rgba(0,40,60,.30))',
            pointerEvents: 'none',
          }}
        />
        <div style={{ position: 'absolute', top: 12, left: 14, right: 14 }}>
          <div
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: 17,
              fontWeight: 800,
              color: '#fff',
              textShadow: '0 1px 6px rgba(0,0,0,.5)',
              lineHeight: 1.1,
            }}
          >
            Naš grad na moru
          </div>
          <div
            data-testid="karta-progress"
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '.06em',
              color: 'rgba(255,255,255,.92)',
              textShadow: '0 1px 4px rgba(0,0,0,.5)',
              marginTop: 3,
            }}
          >
            TVOJ GRAD OŽIVLJAVA · {aliveN} / {PLACES.length} MJESTA
          </div>
        </div>
      </div>

      {/* DANAS recommended card */}
      <button
        data-testid="grad-map-today"
        onClick={() => rec.launch()}
        className="km-reco"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 11,
          width: '100%',
          textAlign: 'left',
          background: 'var(--card)',
          border: '1.5px solid #e6cf94',
          borderRadius: 18,
          padding: '11px 12px',
          margin: '14px 0 18px',
          cursor: 'pointer',
          fontFamily: "'Outfit',sans-serif",
        }}
      >
        <span
          style={{
            width: 46,
            height: 46,
            borderRadius: '50%',
            flex: 'none',
            background: `linear-gradient(135deg,${GOLD},#e6c463)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 3px 9px rgba(0,0,0,.18)',
            overflow: 'hidden',
          }}
        >
          {rec.host ? (
            <CharacterPortrait name={rec.host} size={42} />
          ) : (
            <span style={{ fontSize: 22 }}>☀️</span>
          )}
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              display: 'block',
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '.13em',
              textTransform: 'uppercase',
              color: GOLD,
            }}
          >
            Danas
          </span>
          <span
            style={{
              display: 'block',
              fontFamily: "'Playfair Display',serif",
              fontSize: 15,
              fontWeight: 800,
              color: 'var(--heading)',
            }}
          >
            {rec.hr}
          </span>
          <span style={{ display: 'block', fontSize: 12, color: 'var(--subtext)' }}>
            {rec.en} · ~{rec.durationMin} min
          </span>
        </span>
        <span
          style={{
            flex: 'none',
            background: TEAL,
            color: '#fff',
            fontWeight: 800,
            fontSize: 13,
            padding: '10px 15px',
            borderRadius: 12,
          }}
        >
          Idemo →
        </span>
      </button>

      {/* PLACE LIST */}
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '.14em',
          textTransform: 'uppercase',
          color: 'var(--subtext)',
          margin: '0 4px 9px',
        }}
      >
        Sva mjesta · all places
      </div>
      {PLACES.map((p) => {
        const s = stat(p.id);
        const disp = placeDisplay(s);
        const completion = placeCompletion(s);
        const locked = disp === 'locked';
        const mastered = disp === 'mastered';
        return (
          <button
            key={p.id}
            data-testid={`place-row-${p.id}`}
            onClick={() => onOpenPlace(p.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              width: '100%',
              textAlign: 'left',
              background: 'var(--card)',
              border: '1px solid var(--card-b)',
              borderRadius: 16,
              padding: '11px 12px',
              marginBottom: 10,
              cursor: 'pointer',
              opacity: locked ? 0.62 : 1,
              fontFamily: "'Outfit',sans-serif",
            }}
          >
            <span
              {...(locked ? { 'data-testid': `marker-locked-${p.id}` } : {})}
              style={{
                width: 44,
                height: 44,
                borderRadius: 13,
                flex: 'none',
                background: p.tint,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 21,
              }}
            >
              {locked ? '🔒' : p.icon}
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span
                style={{
                  display: 'block',
                  fontFamily: "'Playfair Display',serif",
                  fontSize: 15,
                  fontWeight: 800,
                  color: 'var(--heading)',
                }}
              >
                {p.name} {mastered ? <span style={{ color: GOLD }}>★</span> : null}
              </span>
              <span style={{ display: 'block', fontSize: 11, color: 'var(--subtext)' }}>
                {p.nameEn}
              </span>
              {!locked && (
                <span
                  data-testid={`ring-${p.id}`}
                  data-completion={String(completion)}
                  style={{
                    display: 'block',
                    height: 6,
                    borderRadius: 3,
                    background: '#eee6d6',
                    marginTop: 7,
                    maxWidth: 150,
                    overflow: 'hidden',
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      height: '100%',
                      width: `${completion * 100}%`,
                      background: mastered ? GOLD : TEAL,
                    }}
                  />
                </span>
              )}
            </span>
            <span style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
              {s.due > 0 && !locked && (
                <span
                  data-testid={`due-badge-${p.id}`}
                  style={{
                    background: '#D40030',
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 900,
                    minWidth: 20,
                    height: 20,
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 5px',
                  }}
                >
                  {s.due}
                </span>
              )}
              {p.host && !locked && <CharacterPortrait name={p.host} size={22} />}
              <span style={{ color: '#cbd5e1', fontSize: 20 }}>›</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
