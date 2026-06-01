import React from 'react';
import ScreenHeader from '../shared/ScreenHeader';
import { useStats } from '../../context/StatsContext';
import { restoredCount, MAP_REGIONS } from '../../lib/gamification/mapRegions';

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
  const { stats } = useStats();
  const restored = restoredCount(stats?.xp ?? 0);
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
        {/* Your Croatia — persistent collection layer, prominent above the game modes */}
        <button
          data-testid="arcade-your-croatia"
          onClick={() => onLaunch('map')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 11,
            width: '100%',
            textAlign: 'left',
            background: 'linear-gradient(135deg, rgba(34,197,94,.18), rgba(10,35,72,.45))',
            border: '1px solid rgba(74,222,128,.45)',
            borderRadius: 15,
            padding: 13,
            marginBottom: 14,
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 26 }}>🗺️</span>
          <span>
            <span style={{ display: 'block', fontWeight: 900, fontSize: 15 }}>Your Croatia</span>
            <span style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,.65)' }}>
              Restore your heritage map
            </span>
          </span>
          <span style={{ marginLeft: 'auto', textAlign: 'center' }}>
            <b style={{ display: 'block', fontSize: 18, fontWeight: 900, color: '#4ade80' }}>
              {restored}/{MAP_REGIONS.length}
            </b>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,.5)' }}>regions</span>
          </span>
        </button>
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
