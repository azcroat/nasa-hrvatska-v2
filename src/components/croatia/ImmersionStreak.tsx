import React from 'react';
import { getWeekDots } from './MediaPlayerUtils';

export default function ImmersionStreak() {
  const dots = getWeekDots();
  const count = dots.filter(Boolean).length;
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--card-b)',
        borderRadius: 14,
        padding: '12px 14px',
        marginBottom: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <div style={{ fontSize: 24, flexShrink: 0 }}>🔥</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--heading)', marginBottom: 6 }}>
          {count > 0 ? `${count}/7 days this week` : 'Start your immersion streak!'}{' '}
          {count >= 5 ? '🏆' : count >= 3 ? '⭐' : ''}
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {dots.map((active, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  marginBottom: 2,
                  background: active ? '#D40030' : 'var(--bar-bg)',
                  border: `1.5px solid ${active ? '#D40030' : 'var(--card-b)'}`,
                  boxShadow: active ? '0 2px 8px rgba(212,0,48,.35)' : 'none',
                  transition: 'all .2s',
                }}
              />
              <div style={{ fontSize: 8, color: 'var(--subtext)', fontWeight: 600 }}>
                {dayLabels[i]}
              </div>
            </div>
          ))}
        </div>
      </div>
      {count > 0 && (
        <div
          style={{
            fontSize: 10,
            color: 'var(--subtext)',
            fontStyle: 'italic',
            textAlign: 'right',
            maxWidth: 80,
            lineHeight: 1.4,
          }}
        >
          Great immersion habit!
        </div>
      )}
    </div>
  );
}
