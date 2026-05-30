import React from 'react';
import { useStats } from '../../../context/StatsContext.tsx';

/**
 * Difficulty Level selector — extracted from SettingsTab as part of the 1a
 * decomposition. Reads/writes the `diff` field on the stats context, so it
 * pulls `useStats()` directly rather than taking props (context is available to
 * any descendant — no lifting needed). Behavior-identical to the prior inline
 * block. Props-less.
 */
export default function DifficultySection() {
  const { stats: statsCtx, setStats } = useStats();
  return (
    <div style={{ padding: '14px 0', borderBottom: '1px solid var(--card-b)' }}>
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>🎯 Difficulty Level</div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)', marginTop: 2 }}>
          Controls exercise complexity and content recommendations
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {(
          [
            {
              id: 'beginner' as const,
              label: 'Beginner',
              desc: 'A1–A2: basic vocab and simple sentences',
            },
            {
              id: 'intermediate' as const,
              label: 'Intermediate',
              desc: 'B1: grammar drills and everyday conversation',
            },
            {
              id: 'advanced' as const,
              label: 'Advanced',
              desc: 'B2+: complex grammar, idioms, and nuance',
            },
          ] as const
        ).map((d) => {
          const active = (statsCtx.diff || 'beginner') === d.id;
          return (
            <button
              key={d.id}
              onClick={() => setStats((prev) => ({ ...prev, diff: d.id }))}
              title={d.desc}
              style={{
                flex: 1,
                padding: '8px 4px',
                borderRadius: 9,
                border: 'none',
                cursor: 'pointer',
                fontFamily: "'Outfit',sans-serif",
                fontWeight: 700,
                fontSize: 11,
                background: active ? 'var(--info-bg,#e0f2fe)' : 'var(--bar-bg,#f1f5f9)',
                color: active ? 'var(--info,#0284c7)' : 'var(--subtext,#64748b)',
                outline: active ? '2px solid var(--info,#0284c7)' : 'none',
                transition: 'all .15s',
              }}
            >
              {d.label}
            </button>
          );
        })}
      </div>
      <div style={{ fontSize: 10, color: 'var(--subtext)', marginTop: 6, lineHeight: 1.4 }}>
        {(statsCtx.diff || 'beginner') === 'beginner'
          ? '📌 Beginner: essential vocabulary, simple grammar, and slow pronunciation'
          : (statsCtx.diff || 'beginner') === 'intermediate'
            ? '📌 Intermediate: case system, verb aspects, and natural conversation speed'
            : '📌 Advanced: idioms, clitic ordering, formal register, and dialect nuance'}
      </div>
    </div>
  );
}
