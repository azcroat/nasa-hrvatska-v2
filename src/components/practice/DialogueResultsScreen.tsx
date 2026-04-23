import React from 'react';
import { H } from '../../data';

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function DialogueResultsScreen({
  scenario,
  score,
  totalTurns,
  onBack,
}: {
  scenario: any;
  score: number;
  totalTurns: number;
  onBack: () => void;
}) {
  /* eslint-enable @typescript-eslint/no-explicit-any */
  const pct = Math.round((score / totalTurns) * 100);
  const isExcellent = pct > 80;
  return (
    <div className="scr-wrap">
      {H('💬 Dialogue Simulator', scenario.title, onBack)}
      <div
        style={{
          background: 'var(--card)',
          border: '1.5px solid var(--card-b)',
          borderRadius: 18,
          padding: '28px 24px',
          textAlign: 'center',
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 12 }}>{isExcellent ? '🏆' : '💪'}</div>
        <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--heading)', marginBottom: 6 }}>
          {score} / {totalTurns}
        </div>
        <div style={{ fontSize: 15, color: 'var(--subtext)', marginBottom: 16 }}>
          {pct}% correct responses
        </div>
        {isExcellent ? (
          <div
            style={{
              background: '#dcfce7',
              border: '1.5px solid #86efac',
              borderRadius: 12,
              padding: '12px 16px',
              fontSize: 15,
              fontWeight: 700,
              color: '#166534',
            }}
          >
            Odlično! You handled that conversation beautifully!
          </div>
        ) : (
          <div
            style={{
              background: '#fef3c7',
              border: '1.5px solid #fcd34d',
              borderRadius: 12,
              padding: '12px 16px',
              fontSize: 15,
              fontWeight: 700,
              color: '#92400e',
            }}
          >
            Good effort! Review the tips and try this scenario again.
          </div>
        )}
      </div>
      <button
        className="tc"
        onClick={onBack}
        style={{
          width: '100%',
          padding: '14px',
          fontWeight: 800,
          fontSize: 14,
          color: 'var(--heading)',
        }}
      >
        ← Back to Scenarios
      </button>
    </div>
  );
}
