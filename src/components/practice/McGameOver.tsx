import React from 'react';

export default function McGameOver({ challengeMode, onTryAgain, onContinueAnyway, onBack }) {
  return (
    <div className="scr-wrap" style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ fontSize: 52 }}>💔</div>
      <h3
        style={{
          fontFamily: "'Playfair Display',serif",
          fontSize: 22,
          color: 'var(--heading)',
          marginTop: 12,
        }}
      >
        No hearts left!
      </h3>
      <p style={{ color: 'var(--subtext)', marginTop: 8, fontSize: 14, lineHeight: 1.6 }}>
        {challengeMode
          ? 'Hearts refill over time — 1 per hour.\nCome back to keep going!'
          : 'Take a break and come back fresh, or keep going anyway.'}
      </p>
      <button className="b bp" style={{ marginTop: 24, width: '100%' }} onClick={onTryAgain}>
        🔄 Try Again
      </button>
      {!challengeMode && (
        <button
          className="b bg"
          style={{ marginTop: 10, width: '100%' }}
          onClick={onContinueAnyway}
        >
          Continue Anyway →
        </button>
      )}
      {challengeMode && (
        <button className="b bg" style={{ marginTop: 10, width: '100%' }} onClick={onBack}>
          ← Back to Practice
        </button>
      )}
    </div>
  );
}
