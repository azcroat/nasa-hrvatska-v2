import React, { useMemo } from 'react';
import { useStats } from '../../context/StatsContext.jsx';
import { useApp } from '../../context/AppContext.jsx';

function StreakRing({ streak }) {
  const MAX = 30;
  const pct = Math.min(streak / MAX, 1);
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <svg width={72} height={72} viewBox="0 0 72 72" aria-label={`${streak} day streak`}>
        <circle cx={36} cy={36} r={r} fill="none" stroke="var(--bar-bg)" strokeWidth={6} />
        <circle
          cx={36} cy={36} r={r} fill="none"
          stroke="url(#streakGrad)" strokeWidth={6}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 36 36)"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        <defs>
          <linearGradient id="streakGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
        <text x={36} y={40} textAnchor="middle" fontSize={20} fontWeight={900} fill="var(--text)">
          {streak}
        </text>
      </svg>
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--subtext)' }}>
        {streak === 1 ? '1 day streak' : `${streak} day streak`}
      </span>
    </div>
  );
}

const LEVEL_LABELS = { A1: 'Beginner', A2: 'Elementary', B1: 'Intermediate', B2: 'Upper-Intermediate', C1: 'Advanced' };

export default function DesktopPanel() {
  const { stats } = useStats();
  const { setTab } = useApp();

  const streak = stats?.str ?? 0;
  const xp = stats?.xp ?? 0;
  const level = stats?.lv ?? 'A1';

  // Stub leaderboard — in a real app this would be a live Firestore query
  const leaderboard = useMemo(() => [
    { name: 'Ana K.', xp: xp + 120, isYou: false },
    { name: 'Marko B.', xp: xp + 45, isYou: false },
    { name: 'You', xp, isYou: true },
    { name: 'Ivana P.', xp: Math.max(0, xp - 30), isYou: false },
    { name: 'Tomislav R.', xp: Math.max(0, xp - 80), isYou: false },
  ].sort((a, b) => b.xp - a.xp), [xp]);

  return (
    <aside className="desktop-panel" aria-label="Progress sidebar">
      {/* Streak ring */}
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 16, padding: '20px 16px', marginBottom: 16, textAlign: 'center',
      }}>
        <StreakRing streak={streak} />
      </div>

      {/* CEFR level badge */}
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 16, padding: '16px', marginBottom: 16,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: 'linear-gradient(135deg,#d4002d,#e63946)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 900, color: '#fff',
        }}>
          {level}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>
            {LEVEL_LABELS[level] ?? level}
          </div>
          <div style={{ fontSize: 11, color: 'var(--subtext)', marginTop: 2 }}>
            {xp.toLocaleString()} total XP
          </div>
        </div>
      </div>

      {/* Weekly leaderboard stub */}
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 16, padding: '16px', marginBottom: 16,
      }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--subtext)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>
          This Week
        </div>
        {leaderboard.map((entry, i) => (
          <div key={entry.name} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '6px 0',
            borderBottom: i < leaderboard.length - 1 ? '1px solid var(--border)' : 'none',
            opacity: entry.isYou ? 1 : 0.75,
          }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--subtext)', width: 16 }}>{i + 1}</span>
            <span style={{
              flex: 1, fontSize: 13, fontWeight: entry.isYou ? 800 : 600,
              color: entry.isYou ? 'var(--info)' : 'var(--text)',
            }}>{entry.name}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--subtext)' }}>
              {entry.xp.toLocaleString()} XP
            </span>
          </div>
        ))}
      </div>

      {/* Quick practice CTA */}
      <button
        onClick={() => setTab('practice')}
        style={{
          width: '100%', padding: '12px 16px', borderRadius: 14,
          background: 'linear-gradient(135deg,#d4002d,#e63946)',
          border: 'none', color: '#fff', fontSize: 14, fontWeight: 800,
          cursor: 'pointer', fontFamily: "'Outfit',sans-serif",
          boxShadow: '0 4px 16px rgba(212,0,45,.25)',
        }}
      >
        Practice Now →
      </button>
    </aside>
  );
}
