import React from 'react';
import type { ReadingUnit } from '../../lib/readingCurriculum';

/**
 * ReadingPathBanner — the structured extensive-reading header on the Reading
 * Passages list (Content-Rec #2). Shows the learner's progress at their current
 * CEFR level and a one-tap "Start recommended" CTA for the next graded passage,
 * or a "level complete" state when the path is finished. Presentational only;
 * all progression logic lives in lib/readingCurriculum.
 */
export default function ReadingPathBanner({
  nextUnit,
  progress,
  level,
  onStart,
}: {
  nextUnit: ReadingUnit | null;
  progress: { done: number; total: number };
  level: string;
  onStart: () => void;
}) {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg,#4d7c0f,#3f6212)',
        borderRadius: 16,
        padding: '14px 16px',
        marginBottom: 18,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 900,
            color: 'rgba(255,255,255,.65)',
            textTransform: 'uppercase',
            letterSpacing: '.12em',
          }}
        >
          Your Reading Path
        </span>
        <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,.8)' }}>
          {progress.done}/{progress.total} at {level}
        </span>
      </div>
      {/* Progress bar */}
      <div
        style={{
          height: 5,
          background: 'rgba(255,255,255,.2)',
          borderRadius: 3,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            width: (progress.total ? (progress.done / progress.total) * 100 : 0) + '%',
            height: '100%',
            background: 'rgba(255,255,255,.9)',
            borderRadius: 3,
            transition: 'width .4s ease',
          }}
        />
      </div>
      {nextUnit ? (
        <React.Fragment>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 2 }}>
            {nextUnit.title}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.75)', marginBottom: 12 }}>
            {nextUnit.tEn ? nextUnit.tEn + ' · ' : ''}
            {nextUnit.badge}
          </div>
          <button
            onClick={onStart}
            style={{
              width: '100%',
              padding: '11px 0',
              borderRadius: 10,
              border: 'none',
              background: '#fff',
              color: '#3f6212',
              fontWeight: 800,
              fontSize: 14,
              fontFamily: "'Outfit',sans-serif",
              cursor: 'pointer',
            }}
          >
            ▶ Start recommended
          </button>
        </React.Fragment>
      ) : (
        <div style={{ fontSize: 13, color: '#fff', fontWeight: 700 }}>
          🎉 {level} reading complete — browse any passage below to keep reading.
        </div>
      )}
    </div>
  );
}
