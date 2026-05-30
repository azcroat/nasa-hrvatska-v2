import React from 'react';

/**
 * Exercise card — a single tappable practice/exercise tile. Extracted from
 * PracticeTab as part of the 1d decomposition so the intent panels can share it.
 * Presentational; CATEGORY_COLORS (its sole prior closure) moved in here.
 */
const CATEGORY_COLORS: Record<string, string> = {
  grammar: '#7c3aed',
  vocab: '#0e7490',
  practical: '#059669',
  advanced: '#d97706',
};

export default function ExerciseCard({
  id,
  label,
  icon,
  desc,
  cefr,
  duration,
  action,
  category,
}: {
  id: string;
  label: string;
  icon: string;
  desc: string;
  cefr?: string;
  duration?: string;
  action?: () => void;
  category?: string;
}) {
  const catColor = CATEGORY_COLORS[category ?? ''] || 'var(--bar-bg)';
  const cefrClass = cefr ? `cefr cefr-${cefr.toLowerCase().replace(/[^a-z]/g, '')}` : '';
  return (
    <button
      data-testid={`exercise-card-${id}`}
      onClick={action}
      className="exercise-card"
      style={{ borderLeftColor: catColor }}
    >
      <div className="exercise-card-icon">{icon}</div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="exercise-card-label">{label}</div>
        <div className="exercise-card-desc">{desc}</div>
        <div className="exercise-card-meta">
          {cefr && <span className={cefrClass}>{cefr}</span>}
          {duration && (
            <span style={{ fontSize: 10, color: 'var(--subtext)', fontWeight: 600 }}>
              ⏱ {duration}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
