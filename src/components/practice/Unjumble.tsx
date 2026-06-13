import React, { useState, useRef } from 'react';
import { H, Bar, sh, UNJUMBLE } from '../../data';
import { useStats } from '../../context/StatsContext';
import { completeExercise } from '../../hooks/useExerciseCompletion';

export default function Unjumble({
  goBack,
  award,
}: {
  goBack: () => void;
  award?: (xp: number, celebrate?: boolean, activityType?: string) => void;
}) {
  const { stats, setStats, writeDelta } = useStats();
  const [ujQ] = useState(() => sh(UNJUMBLE).slice(0, 10));
  const [ujI, sUjI] = useState(0);
  const [ujS, sUjS] = useState(0);
  const [ujIn, sUjIn] = useState('');
  const [ujA, sUjA] = useState(false);
  const finishFired = useRef(false);

  const total = ujQ.length;
  const q = ujQ[ujI];

  const shuffledWords = React.useMemo(() => ujQ.map((q) => sh([...q.words])), [ujQ]);

  if (!q) {
    const xp = ujS * 3 + 10;
    return (
      <div className="scr-wrap">
        {H('🧩 Word Order', 'Arrange words to form correct Croatian sentences', goBack)}
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 64 }}>{ujS >= total * 0.8 ? '🌟' : '👍'}</div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", color: '#164e63' }}>
            Word Order Complete!
          </h2>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#0e7490' }}>
            {ujS} / {ujQ.length}
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#d97706', margin: '12px 0 20px' }}>
            +{xp} XP
          </div>
          <button
            className="b bp"
            onClick={() => {
              if (finishFired.current) return;
              finishFired.current = true;
              completeExercise({
                key: 'unjumble',
                score: ujS,
                total,
                xp,
                stats,
                setStats,
                writeDelta,
                award,
              });
              goBack();
            }}
          >
            Continue →
          </button>
        </div>
      </div>
    );
  }

  const isCorrect =
    ujIn.replace(/[.?!]/g, '').trim().toLowerCase() ===
    q.correct.replace(/[.?!]/g, '').trim().toLowerCase();

  return (
    <div className="scr-wrap">
      {H('🧩 Word Order', 'Arrange words to form correct Croatian sentences', goBack)}
      <Bar v={ujI + 1} mx={total} h={6} />
      <div className="c" style={{ marginTop: 16 }}>
        <div style={{ fontSize: 13, color: '#78716c', marginBottom: 8 }}>
          Translate to Croatian:
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#164e63', marginBottom: 16 }}>
          "{q.en}"
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {(shuffledWords[ujI] ?? []).map((w, wi) => (
            <button
              key={wi}
              style={{
                padding: '8px 16px',
                borderRadius: 10,
                border: '2px solid #0e7490',
                background: 'rgba(14,116,144,.06)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 15,
              }}
              onClick={() => sUjIn((prev) => (prev ? prev + ' ' : '') + w)}
            >
              {w}
            </button>
          ))}
        </div>
        <div
          style={{
            minHeight: 50,
            padding: '14px 18px',
            border:
              '2px solid ' + (ujA ? (isCorrect ? '#16a34a' : '#dc2626') : 'rgba(14,116,144,.12)'),
            borderRadius: 14,
            background: 'rgba(255,255,255,.65)',
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          {ujIn || '← Tap words to build sentence'}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button className="b bg" style={{ fontSize: 13 }} onClick={() => sUjIn('')}>
            🗑 Clear
          </button>
          {!ujA && (
            <button
              className="b bp"
              onClick={() => {
                sUjA(true);
                if (isCorrect) sUjS((s) => s + 1);
              }}
            >
              Check ✅
            </button>
          )}
        </div>
        {ujA && (
          <div
            style={{
              marginTop: 12,
              padding: '12px 16px',
              borderRadius: 10,
              background: isCorrect ? 'rgba(22,163,74,.08)' : 'rgba(220,38,38,.08)',
              fontSize: 14,
            }}
          >
            {isCorrect ? (
              <span style={{ color: '#16a34a', fontWeight: 700 }}>✅ Correct!</span>
            ) : (
              <span style={{ color: '#dc2626' }}>
                ❌ Correct answer: <b>{q.correct}</b>
              </span>
            )}
          </div>
        )}
        {ujA && (
          <button
            className="b bp"
            style={{ width: '100%', marginTop: 12 }}
            onClick={() => {
              if (ujI < total - 1) {
                sUjI((i) => i + 1);
                sUjIn('');
                sUjA(false);
              } else {
                sUjI(total); // show completion screen
              }
            }}
          >
            {ujI < total - 1 ? 'Next →' : 'Finish!'}
          </button>
        )}
      </div>
    </div>
  );
}
