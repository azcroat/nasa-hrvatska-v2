import React from 'react';
import { nXP } from '../../data';

/**
 * Hero stats cluster — streak card, XP progress ring, CEFR bar, and the mini
 * stat row (lessons / mastered / total XP). Extracted from HeroSection as part
 * of finishing 1c. Presentational; all values come in as props.
 */
export default function HeroStats({
  streak,
  freezes,
  xpPct,
  xpCur,
  xpNeeded,
  level,
  cefr,
  lc,
  xp,
  wsMastered,
}: {
  streak: { count: number; last?: string };
  freezes: number;
  xpPct: number;
  xpCur: number;
  xpNeeded: number;
  level: number;
  cefr: { current: string; next: string; pctInLevel: number };
  lc: number;
  xp: number;
  wsMastered?: number;
}) {
  return (
    <React.Fragment>
      {/* ── PREMIUM STATS: Streak card + XP ring ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12, marginTop: 8 }}>
        {/* Streak card */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: 'rgba(255,255,255,.09)',
            borderRadius: 20,
            padding: '18px 10px 14px',
            border: '1px solid rgba(255,255,255,.14)',
            backdropFilter: 'blur(12px)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,.12)',
          }}
        >
          <span className="anim-streak" style={{ fontSize: 34, lineHeight: 1, marginBottom: 2 }}>
            🔥
          </span>
          <div
            style={{
              fontSize: 46,
              fontWeight: 900,
              color: 'white',
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
              fontFamily: "'Outfit',sans-serif",
              textShadow: '0 0 28px rgba(251,146,60,.75)',
              marginTop: 3,
            }}
          >
            {streak.count}
          </div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'rgba(255,255,255,.6)',
              textTransform: 'uppercase',
              letterSpacing: '.1em',
              marginTop: 6,
            }}
          >
            day streak
          </div>
          {streak.count === 0 ? (
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: 'rgba(253,186,116,.95)',
                marginTop: 5,
              }}
            >
              Start your streak! Complete a lesson today 🔥
            </div>
          ) : (
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: 'rgba(253,186,116,.95)',
                marginTop: 5,
              }}
            >
              {streak.count >= 30
                ? '🇭🇷 Legend!'
                : streak.count >= 7
                  ? '⚡ Odlično!'
                  : '✓ Keep going!'}
            </div>
          )}
          {streak.count >= 25 && streak.count < 30 && (
            <div style={{ fontSize: 10, color: '#d97706', fontWeight: 700, marginTop: 2 }}>
              5 more days to legendary status! ⭐
            </div>
          )}
          {streak.count >= 7 && streak.count < 25 && (
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.6)', marginTop: 2 }}>
              {30 - streak.count} days to Legend status
            </div>
          )}
          {freezes > 0 && (
            <div
              title="Zaštita niza — Streak shield"
              style={{
                marginTop: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                background: 'rgba(59,130,246,.18)',
                border: '1px solid rgba(59,130,246,.35)',
                borderRadius: 10,
                padding: '4px 9px',
              }}
            >
              <span style={{ fontSize: 12 }}>🛡️</span>
              <span style={{ fontSize: 9, color: 'rgba(147,197,253,.95)', fontWeight: 800 }}>
                ×{freezes} Zaštita niza
              </span>
            </div>
          )}
          {streak.count === 0 && (
            <div
              style={{
                fontSize: 11,
                color: 'var(--warning)',
                fontWeight: 600,
                marginTop: 4,
                textAlign: 'center',
              }}
            >
              Complete any lesson today to start your streak! 🔥
            </div>
          )}
        </div>

        {/* XP progress ring */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: 'rgba(255,255,255,.09)',
            borderRadius: 20,
            padding: '14px 10px 12px',
            border: '1px solid rgba(255,255,255,.14)',
            backdropFilter: 'blur(12px)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,.12)',
          }}
        >
          <svg width="96" height="96" viewBox="0 0 96 96" aria-hidden="true">
            <defs>
              <linearGradient id="xpRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#818cf8" />
              </linearGradient>
            </defs>
            {/* Glow halo */}
            <circle
              cx="48"
              cy="48"
              r="38"
              fill="none"
              stroke="rgba(56,189,248,.1)"
              strokeWidth="14"
            />
            {/* Track */}
            <circle
              cx="48"
              cy="48"
              r="38"
              fill="none"
              stroke="rgba(255,255,255,.12)"
              strokeWidth="8"
            />
            {/* Fill */}
            <circle
              cx="48"
              cy="48"
              r="38"
              fill="none"
              stroke="url(#xpRingGrad)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray="238.76"
              strokeDashoffset={238.76 * (1 - xpPct / 100)}
              style={{
                transform: 'rotate(-90deg)',
                transformOrigin: '48px 48px',
                transition: 'stroke-dashoffset 0.9s cubic-bezier(.4,0,.2,1)',
                filter: 'drop-shadow(0 0 5px rgba(56,189,248,.9))',
              }}
            />
            {/* Level number */}
            <text
              x="48"
              y="45"
              textAnchor="middle"
              fontSize="26"
              fontWeight="900"
              fill="white"
              fontFamily="Outfit,sans-serif"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {level}
            </text>
            <text
              x="48"
              y="60"
              textAnchor="middle"
              fontSize="9"
              fontWeight="800"
              fill="rgba(255,255,255,.55)"
              fontFamily="Outfit,sans-serif"
              letterSpacing="2"
            >
              LEVEL
            </text>
          </svg>
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: 'rgba(96,205,250,.95)',
              marginTop: 1,
              letterSpacing: '.04em',
            }}
          >
            {xpPct}% → Lv {level + 1}
          </div>
          <div
            style={{
              fontSize: 9,
              color: 'rgba(255,255,255,.45)',
              marginTop: 3,
              fontWeight: 600,
            }}
          >
            {(nXP(level) - xp).toLocaleString()} XP to go
          </div>
        </div>
      </div>

      {/* CEFR progression bar */}
      <div style={{ marginTop: 12 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 4,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.7)',
              letterSpacing: '.05em',
            }}
          >
            CEFR LEVEL
          </span>
          <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--gold, #C8980A)' }}>
            {cefr.current} → {cefr.next} &nbsp;·&nbsp; {cefr.pctInLevel}%
          </span>
        </div>
        <div
          style={{
            height: 6,
            background: 'rgba(255,255,255,0.15)',
            borderRadius: 6,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: cefr.pctInLevel + '%',
              background: 'linear-gradient(90deg, var(--gold,#C8980A), #FFE070)',
              borderRadius: 6,
              transition: 'width 0.6s ease',
            }}
          />
        </div>
        <div
          style={{
            marginTop: 4,
            fontSize: 10,
            color: 'rgba(255,255,255,0.5)',
            fontStyle: 'italic',
          }}
        >
          {xpCur} / {xpNeeded} XP this level
        </div>
      </div>

      {/* Mini stat row */}
      <div style={{ display: 'flex', gap: 7, marginBottom: freezes === 0 ? 11 : 14 }}>
        {[
          { icon: '📚', value: lc, label: 'lessons' },
          { icon: '💪', value: wsMastered, label: 'mastered' },
          { icon: '⭐', value: xp.toLocaleString(), label: 'total XP' },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              background: 'rgba(255,255,255,.07)',
              borderRadius: 12,
              padding: '8px 4px',
              border: '1px solid rgba(255,255,255,.09)',
            }}
          >
            <span style={{ fontSize: 15 }}>{s.icon}</span>
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 900,
                  color: 'white',
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  color: 'rgba(255,255,255,.45)',
                  textTransform: 'uppercase',
                  letterSpacing: '.05em',
                }}
              >
                {s.label}
              </div>
            </div>
          </div>
        ))}
      </div>
    </React.Fragment>
  );
}
