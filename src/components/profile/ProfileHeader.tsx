import React from 'react';
import { lXP, nXP, getStreak } from '../../lib/appUtils.js';
import { useApp } from '../../context/AppContext';
import { useStats } from '../../context/StatsContext';

export default function ProfileHeader({ syncTime = 0 }: { syncTime?: number }) {
  const { name, au } = useApp();
  const { level, stats: st } = useStats();
  const streak = getStreak();

  return (
    <div
      style={{
        background: 'linear-gradient(160deg,#030c1a 0%,#071830 30%,#0a2848 60%,#0d3562 100%)',
        borderRadius: 24,
        marginBottom: 16,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 16px 56px rgba(0,0,0,.45), 0 4px 16px rgba(0,0,0,.3)',
      }}
    >
      {/* Emerald identity stripe */}
      <div style={{ height: 3, background: 'linear-gradient(90deg,#059669,#047857)' }} />

      {/* Šahovnica pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28'%3E%3Crect width='14' height='14' fill='rgba(212,0,48,0.04)'/%3E%3Crect x='14' y='14' width='14' height='14' fill='rgba(212,0,48,0.04)'/%3E%3C/svg%3E")`,
          pointerEvents: 'none',
          borderRadius: 'inherit',
        }}
      />
      {/* Radial glow */}
      <div
        style={{
          position: 'absolute',
          top: '-50%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '120%',
          height: '100%',
          background:
            'radial-gradient(ellipse at 50% 20%, rgba(5,150,105,.22) 0%, transparent 65%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ padding: '20px 20px 18px', position: 'relative', zIndex: 1 }}>
        {/* ── ROW 1: Avatar + Name + CEFR + Sync ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(255,255,255,.14)',
              backdropFilter: 'blur(12px)',
              border: '2px solid rgba(255,255,255,.28)',
              boxShadow: '0 8px 24px rgba(0,0,0,.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontSize: 22,
              fontWeight: 900,
              color: '#fff',
            }}
          >
            {name ? name.charAt(0).toUpperCase() : '👤'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: "'Playfair Display',serif",
                fontSize: 17,
                fontWeight: 800,
                color: '#fff',
                letterSpacing: '-.01em',
                textShadow: '0 2px 12px rgba(0,0,0,.5)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {name || au?.d}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <div
                style={{
                  background: 'rgba(5,150,105,.3)',
                  border: '1px solid rgba(5,150,105,.5)',
                  borderRadius: 6,
                  padding: '2px 7px',
                  fontSize: 10,
                  fontWeight: 800,
                  color: 'rgba(255,255,255,.9)',
                }}
              >
                Level {level} Learner
              </div>
            </div>
          </div>
          {/* Sync badge */}
          {syncTime > 0 && (
            <div
              style={{
                background: 'rgba(16,185,129,.15)',
                border: '1px solid rgba(16,185,129,.3)',
                borderRadius: 7,
                padding: '4px 8px',
                fontSize: 9,
                fontWeight: 800,
                color: '#6ee7b7',
                flexShrink: 0,
                textAlign: 'center',
                lineHeight: 1.3,
              }}
            >
              ☁️ Synced
            </div>
          )}
        </div>

        {/* ── XP BAR ── */}
        {(() => {
          const xpFloor = lXP(level);
          const xpCeil = nXP(level);
          const xpInLevel = (st.xp || 0) - xpFloor;
          const xpNeeded = xpCeil - xpFloor;
          const pct = xpNeeded > 0 ? Math.min(100, Math.round((xpInLevel / xpNeeded) * 100)) : 100;
          const xpRemaining = Math.max(0, xpCeil - (st.xp || 0));
          return (
            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'rgba(255,255,255,.65)',
                  marginBottom: 5,
                }}
              >
                <span>Level {level}</span>
                <span style={{ color: 'rgba(255,255,255,.85)' }}>
                  {xpRemaining > 0 ? xpRemaining + ' XP to Level ' + (level + 1) : 'Max Level!'}
                </span>
              </div>
              <div
                style={{
                  height: 6,
                  borderRadius: 3,
                  background: 'rgba(255,255,255,.15)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    borderRadius: 3,
                    background: 'linear-gradient(90deg,#059669,#047857)',
                    width: pct + '%',
                    transition: 'width .6s ease',
                  }}
                />
              </div>
            </div>
          );
        })()}

        {/* ── JOURNEY STATS BAR ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4,1fr)',
            background: 'rgba(0,0,0,.25)',
            borderRadius: 10,
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,.06)',
          }}
        >
          {[
            { label: 'Lessons', value: st.lc || 0 },
            { label: 'Streak', value: `${streak.count}🔥` },
            { label: 'XP', value: st.xp || 0 },
            { label: 'Grammar', value: st.gc || 0 },
          ].map((s, i) => (
            <div
              key={s.label}
              style={{
                padding: '8px 4px',
                textAlign: 'center',
                borderRight: i < 3 ? '1px solid rgba(255,255,255,.07)' : 'none',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                {s.value}
              </div>
              <div
                style={{
                  fontSize: 8,
                  fontWeight: 700,
                  color: 'rgba(255,255,255,.5)',
                  textTransform: 'uppercase',
                  letterSpacing: '.06em',
                  marginTop: 3,
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
