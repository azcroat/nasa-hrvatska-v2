import React from 'react';

const PHASES = ['Pair', 'Fill-In', 'Why?', 'Compare'];

export default function AspectPhaseBar({ phase, total }) {
  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
      {PHASES.slice(0, total).map((label, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            padding: '5px 0',
            borderRadius: 6,
            textAlign: 'center',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '.04em',
            background:
              i < phase
                ? 'var(--success,#16a34a)'
                : i === phase
                  ? 'var(--info,#0284c7)'
                  : 'var(--bar-bg)',
            color: i <= phase ? '#fff' : 'var(--subtext)',
            transition: 'all .25s',
          }}
        >
          {i < phase ? '✓' : label}
        </div>
      ))}
    </div>
  );
}
