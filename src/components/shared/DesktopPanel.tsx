import React from 'react';
import { useStats } from '../../context/StatsContext';

const CEFR_LABELS = {
  A1: 'Beginner',
  A2: 'Elementary',
  B1: 'Intermediate',
  B2: 'Upper-Intermediate',
  C1: 'Advanced',
  C2: 'Proficient',
};

// Same formula as HeroSection and StatsTab — all three must stay in sync.
// total = xp + lessons*15 + grammar*25 → A1<300, A2<1200, B1<3500, B2<8000, C1<18000
function getCEFR(xp: number, lc: number, gc: number) {
  const total = (xp || 0) + (lc || 0) * 15 + (gc || 0) * 25;
  if (total < 300) return 'A1';
  if (total < 1200) return 'A2';
  if (total < 3500) return 'B1';
  if (total < 8000) return 'B2';
  if (total < 18000) return 'C1';
  return 'C2';
}

export default function DesktopPanel() {
  const { stats } = useStats();
  const xp = stats?.xp ?? 0;
  const lc = stats?.lc ?? 0;
  const gc = stats?.gc ?? 0;
  const cefrLevel = getCEFR(xp, lc, gc);

  return (
    <aside className="desktop-panel" aria-label="Progress sidebar">
      {/* CEFR level badge — uses same XP-based formula as Today and Me tabs */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '16px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            flexShrink: 0,
            background: 'linear-gradient(135deg,#d4002d,#e63946)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            fontWeight: 900,
            color: '#fff',
          }}
        >
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

      {/* Right rail intentionally minimal: the level chip above is the only
          progress signal here. The 'Your Progress' stats block, the AI Voice
          Conversation shortcut, and the Practice Now CTA were removed —
          stats live on the Me tab, AI lives exclusively on the AI Tutor tab,
          Practice is one tap on the bottom nav. Keeps the home screen
          uncluttered. */}
    </aside>
  );
}
