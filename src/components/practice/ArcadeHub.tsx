import React from 'react';
import ScreenHeader from '../shared/ScreenHeader';

interface ModeTile {
  id: string;
  icon: string;
  title: string;
  sub: string;
  live: boolean;
}

const MODES: ModeTile[] = [
  { id: 'alka', icon: '🐎', title: 'Alka', sub: 'Lance & ring · chase 9/9', live: true },
  { id: 'boss', icon: '⚔️', title: 'Boss Battle', sub: 'Folklore combat', live: false },
  { id: 'survival', icon: '♾️', title: 'Survival Run', sub: '3 hearts, endless', live: false },
  { id: 'forge', icon: '🧩', title: 'Sentence Forge', sub: 'Case puzzle', live: false },
  { id: 'duel', icon: '🛡️', title: 'Sibling Duel', sub: 'Coming soon', live: false },
];

export default function ArcadeHub({
  goBack,
  onLaunch,
}: {
  goBack: () => void;
  onLaunch: (modeId: string) => void;
}) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'linear-gradient(160deg,rgba(6,14,30,.97),rgba(10,35,72,.9) 55%,rgba(12,56,104,.85))',
      }}
    >
      <ScreenHeader title="Arcade" goBack={goBack} />
      <div style={{ padding: 16 }}>
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => m.live && onLaunch(m.id)}
            disabled={!m.live}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              width: '100%',
              textAlign: 'left',
              background: m.live ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.03)',
              border: `1px solid ${m.live ? 'rgba(200,152,10,.4)' : 'rgba(255,255,255,.1)'}`,
              borderRadius: 14,
              padding: 14,
              marginBottom: 10,
              color: '#fff',
              opacity: m.live ? 1 : 0.55,
              cursor: m.live ? 'pointer' : 'default',
            }}
          >
            <span style={{ fontSize: 24 }}>{m.icon}</span>
            <span>
              <span style={{ display: 'block', fontWeight: 800, fontSize: 15 }}>{m.title}</span>
              <span style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,.55)' }}>
                {m.live ? m.sub : 'Coming soon'}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
