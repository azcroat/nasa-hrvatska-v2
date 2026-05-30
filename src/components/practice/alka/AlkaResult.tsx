import React from 'react';
import { MAX_RIDE_POINTS } from '../../../lib/gamification/alkaRules';

export default function AlkaResult({
  total,
  isNewBest,
  previousBest,
  onPlayAgain,
  onExit,
}: {
  total: number;
  isNewBest: boolean;
  previousBest: number;
  onPlayAgain: () => void;
  onExit: () => void;
}) {
  const perfect = total === MAX_RIDE_POINTS;
  return (
    <div style={{ padding: 20, textAlign: 'center', color: '#fff' }}>
      {perfect && (
        <div
          style={{
            fontFamily: "'Playfair Display',serif",
            fontSize: 26,
            fontWeight: 900,
            color: '#FFE070',
            textShadow: '0 0 18px rgba(255,224,112,.6)',
          }}
        >
          U SRIDU!
        </div>
      )}
      <div style={{ fontSize: 48, fontWeight: 900, color: '#FFE070', lineHeight: 1, marginTop: 8 }}>
        {total}
        <span style={{ fontSize: 20, color: 'rgba(255,255,255,.5)' }}> / {MAX_RIDE_POINTS}</span>
      </div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', marginTop: 6 }}>
        {isNewBest ? `New personal best! (was ${previousBest})` : `Your best: ${previousBest}`}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'center' }}>
        <button onClick={onPlayAgain} style={btn('#C8980A')}>
          Ride again
        </button>
        <button onClick={onExit} style={btn('rgba(255,255,255,.12)')}>
          Done
        </button>
      </div>
    </div>
  );
}

function btn(bg: string): React.CSSProperties {
  return {
    background: bg,
    border: '1px solid rgba(255,255,255,.2)',
    borderRadius: 12,
    padding: '10px 18px',
    color: '#fff',
    fontWeight: 800,
    fontSize: 14,
    cursor: 'pointer',
  };
}
