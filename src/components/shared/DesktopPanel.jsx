import React, { useMemo } from 'react';
import { useStats } from '../../context/StatsContext.jsx';
import { useApp } from '../../context/AppContext.jsx';


const LEVEL_LABELS = { A1: 'Beginner', A2: 'Elementary', B1: 'Intermediate', B2: 'Upper-Intermediate', C1: 'Advanced' };

function getCEFRStr(numLevel) {
  if (numLevel <= 2) return 'A1';
  if (numLevel <= 4) return 'A2';
  if (numLevel <= 6) return 'B1';
  if (numLevel <= 8) return 'B2';
  return 'C1';
}

export default function DesktopPanel() {
  const { stats, level: numLevel } = useStats();
  const { setTab } = useApp();

  const xp = stats?.xp ?? 0;
  const level = getCEFRStr(numLevel ?? 1);

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
