import React from 'react';
import ScreenHeader from '../shared/ScreenHeader';
import { useStats } from '../../context/StatsContext';
import {
  regionStatuses,
  restoredCount,
  nextRegion,
  MAP_REGIONS,
} from '../../lib/gamification/mapRegions';
// REGIONS is untyped JS cultural data: key -> { title, sub, icon, color }
import { REGIONS } from '../../data/cultural/regions.js';

type RegionMeta = { title?: string; sub?: string; icon?: string };
const META = REGIONS as Record<string, RegionMeta>;

export default function MapScreen({ goBack }: { goBack: () => void }) {
  const { stats } = useStats();
  const xp = stats?.xp ?? 0;
  const statuses = regionStatuses(xp);
  const done = restoredCount(xp);
  const next = nextRegion(xp);
  const nextTitle = next ? META[next.key]?.title || next.key : null;
  const pct = Math.round((done / MAP_REGIONS.length) * 100);

  return (
    <div style={shell}>
      <ScreenHeader title="Vaša Hrvatska" goBack={goBack} />
      <div style={{ padding: 14 }}>
        <div style={progBox}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 7,
            }}
          >
            <span style={progLabel}>Regions restored</span>
            <span
              style={{
                fontSize: 14,
                fontWeight: 900,
                color: '#FFE070',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {done} / {MAP_REGIONS.length}
            </span>
          </div>
          <div style={meter}>
            <div
              style={{
                height: '100%',
                width: pct + '%',
                background: 'linear-gradient(90deg,#22c55e,#4ade80)',
                borderRadius: 6,
              }}
            />
          </div>
          {next && (
            <div
              style={{
                fontSize: 11,
                color: 'rgba(255,255,255,.6)',
                marginTop: 8,
                textAlign: 'center',
              }}
            >
              Next: <b style={{ color: '#FFE070' }}>{nextTitle}</b> — {next.xpToGo.toLocaleString()}{' '}
              XP to go
            </div>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
          {statuses.map((r) => {
            const meta = META[r.key] || {};
            const isNext = next?.key === r.key;
            return (
              <div
                key={r.key}
                data-testid={`map-region-${r.key}`}
                style={r.restored ? tileOn : isNext ? tileNext : tileOff}
              >
                <div style={{ fontSize: 20 }}>{meta.icon || '📍'}</div>
                <div style={{ fontSize: 12.5, fontWeight: 800, marginTop: 3 }}>
                  {meta.title || r.key}
                </div>
                {r.restored ? (
                  <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,.5)', marginTop: 1 }}>
                    {meta.sub || ''}
                  </div>
                ) : isNext ? (
                  <div
                    style={{
                      fontSize: 8.5,
                      letterSpacing: '.1em',
                      textTransform: 'uppercase',
                      color: '#7dd3fc',
                      fontWeight: 800,
                      marginTop: 2,
                    }}
                  >
                    ▶ next · {r.xpThreshold.toLocaleString()} XP
                  </div>
                ) : (
                  <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,.45)', marginTop: 2 }}>
                    🔒 {r.xpThreshold.toLocaleString()} XP
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const shell: React.CSSProperties = {
  minHeight: '100vh',
  background: 'linear-gradient(160deg,rgba(6,14,30,.97),rgba(10,35,72,.9) 55%,rgba(12,56,104,.85))',
  color: '#fff',
};
const progBox: React.CSSProperties = {
  background: 'rgba(255,255,255,.06)',
  border: '1px solid rgba(255,255,255,.12)',
  borderRadius: 12,
  padding: '11px 13px',
  marginBottom: 14,
};
const progLabel: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '.06em',
  textTransform: 'uppercase',
  color: 'rgba(200,152,10,.9)',
  fontWeight: 800,
};
const meter: React.CSSProperties = {
  height: 7,
  background: 'rgba(255,255,255,.12)',
  borderRadius: 6,
  overflow: 'hidden',
};
const tileBase: React.CSSProperties = {
  borderRadius: 13,
  padding: '11px 10px',
  minHeight: 64,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
};
const tileOn: React.CSSProperties = {
  ...tileBase,
  background: 'linear-gradient(150deg,rgba(200,152,10,.22),rgba(10,35,72,.5))',
  border: '1px solid rgba(200,152,10,.55)',
};
const tileOff: React.CSSProperties = {
  ...tileBase,
  background: 'rgba(255,255,255,.04)',
  border: '1px dashed rgba(255,255,255,.16)',
  opacity: 0.6,
};
const tileNext: React.CSSProperties = {
  ...tileBase,
  background: 'rgba(56,189,248,.10)',
  border: '1px solid rgba(56,189,248,.6)',
};
