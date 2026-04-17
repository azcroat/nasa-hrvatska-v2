// @ts-nocheck
import React from 'react';
import { useStats } from '../../context/StatsContext';
import { useApp } from '../../context/AppContext';

const CEFR_LABELS = { A1: 'Beginner', A2: 'Elementary', B1: 'Intermediate', B2: 'Upper-Intermediate', C1: 'Advanced', C2: 'Proficient' };

// Same formula as HeroSection and StatsTab — all three must stay in sync.
// total = xp + lessons*15 + grammar*25 → A1<300, A2<1200, B1<3500, B2<8000, C1<18000
function getCEFR(xp, lc, gc) {
  const total = (xp || 0) + ((lc || 0) * 15) + ((gc || 0) * 25);
  if (total < 300)   return 'A1';
  if (total < 1200)  return 'A2';
  if (total < 3500)  return 'B1';
  if (total < 8000)  return 'B2';
  if (total < 18000) return 'C1';
  return 'C2';
}

export default function DesktopPanel() {
  const { stats, level: numLevel } = useStats();
  const { setTab, setScr } = useApp();

  const xp = stats?.xp ?? 0;
  const lc  = stats?.lc ?? 0;
  const gc  = stats?.gc ?? 0;
  const cefrLevel = getCEFR(xp, lc, gc);

  return (
    <aside className="desktop-panel" aria-label="Progress sidebar">
      {/* CEFR level badge — uses same XP-based formula as Today and Me tabs */}
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 16, padding: '16px', marginBottom: 16,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: 'linear-gradient(135deg,#d4002d,#e63946)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 900, color: '#fff',
        }}>
          {cefrLevel}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>
            {CEFR_LABELS[cefrLevel] ?? cefrLevel}
          </div>
          <div style={{ fontSize: 11, color: 'var(--subtext)', marginTop: 2 }}>
            {xp.toLocaleString()} XP · {lc} lessons
          </div>
        </div>
      </div>

      {/* Your progress stats */}
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 16, padding: '16px', marginBottom: 16,
      }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--subtext)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>
          Your Progress
        </div>
        {[
          { icon: '📚', label: 'Lessons completed', value: lc },
          { icon: '💪', label: 'Grammar sessions', value: gc },
          { icon: '⭐', label: 'Total XP', value: xp.toLocaleString() },
          { icon: '🎓', label: 'Level', value: `${cefrLevel} · Lv ${numLevel ?? 1}` },
        ].map((row, i, arr) => (
          <div key={row.label} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '7px 0',
            borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
          }}>
            <span style={{ fontSize: 15, width: 22, textAlign: 'center' }}>{row.icon}</span>
            <span style={{ flex: 1, fontSize: 12, color: 'var(--subtext)', fontWeight: 600 }}>{row.label}</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>{row.value}</span>
          </div>
        ))}
      </div>

      {/* AI Conversation shortcut */}
      <button
        onClick={() => setScr('aiconvo')}
        style={{
          width: '100%', padding: '12px 16px', borderRadius: 14,
          background: 'linear-gradient(135deg,#1e1b4b,#3730a3)',
          border: 'none', color: '#fff', fontSize: 13, fontWeight: 800,
          cursor: 'pointer', fontFamily: "'Outfit',sans-serif",
          boxShadow: '0 4px 16px rgba(55,48,163,.25)',
          display: 'flex', alignItems: 'center', gap: 8,
          marginBottom: 10,
        }}
      >
        <span style={{ fontSize: 18 }}>🤖</span>
        <span>AI Voice Conversation →</span>
      </button>

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
