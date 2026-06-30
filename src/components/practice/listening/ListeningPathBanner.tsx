import React from 'react';
import type { ListeningUnit } from '../../../lib/listeningCurriculum';

/**
 * ListeningPathBanner — the structured listening-curriculum header on the AI
 * Listening setup screen (Content-Rec #1). Shows the learner's progress at
 * their current CEFR level and a one-tap "Start recommended" CTA for the next
 * unit, or a "level complete" state when the path is finished. Presentational
 * only; all progression logic lives in lib/listeningCurriculum.
 */
export default function ListeningPathBanner({
  nextUnit,
  progress,
  level,
  isOnline,
  onStart,
}: {
  nextUnit: ListeningUnit | null;
  progress: { done: number; total: number };
  level: string;
  isOnline: boolean;
  onStart: () => void;
}) {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg,#0e7490,#155e75)',
        borderRadius: 16,
        padding: '14px 16px',
        marginBottom: 16,
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
          Your Listening Path
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
            {nextUnit.desc} · {nextUnit.style === 'dialogue' ? 'Dialogue' : 'Monologue'}
          </div>
          <button
            onClick={onStart}
            disabled={!isOnline}
            style={{
              width: '100%',
              padding: '11px 0',
              borderRadius: 10,
              border: 'none',
              background: '#fff',
              color: '#0e7490',
              fontWeight: 800,
              fontSize: 14,
              fontFamily: "'Outfit',sans-serif",
              cursor: isOnline ? 'pointer' : 'not-allowed',
              opacity: isOnline ? 1 : 0.5,
            }}
          >
            ▶ Start recommended
          </button>
        </React.Fragment>
      ) : (
        <div style={{ fontSize: 13, color: '#fff', fontWeight: 700 }}>
          🎉 {level} listening complete — pick any topic below to keep practising.
        </div>
      )}
    </div>
  );
}
