import React, { useMemo, useState } from 'react';
import { getSR } from '../../lib/srs.js';
import { speak } from '../../data.jsx';

// Reads FSRS data and surfaces the words with the highest error rate + difficulty.
// Gives users a real, actionable insight: "practice these 10 words today."
export default function WeakWordsPanel({ setScr }) {
  const [expanded, setExpanded] = useState(false);

  const weakWords = useMemo(() => {
    const sr = getSR();
    const entries = Object.entries(sr)
      .filter(([, card]) => (card.r || 0) + (card.w || 0) >= 2) // need ≥2 reviews for signal
      .map(([word, card]) => {
        const total = (card.r || 0) + (card.w || 0);
        const errorRate = (card.w || 0) / total;
        const difficulty = card.d || 5;
        const lapses = card.l || 0;
        // Composite weakness score: error rate matters most, then difficulty, then lapses
        const score = (errorRate * 0.6) + ((difficulty / 10) * 0.3) + (Math.min(lapses, 5) / 5 * 0.1);
        return { word, errorRate, difficulty, total, lapses, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, expanded ? 20 : 8);

    return entries;
  }, [expanded]);

  if (weakWords.length === 0) {
    return (
      <div style={{ padding: '16px', background: 'var(--card)', borderRadius: 14, border: '1px solid var(--card-b)', marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--subtext)', textAlign: 'center' }}>
          🌱 Complete a few vocabulary reviews to see your weak areas
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ width: 3, height: 20, background: 'var(--danger, #dc2626)', borderRadius: 2 }} />
        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--heading)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Weak Areas
        </span>
        <span style={{ fontSize: 11, color: 'var(--subtext)', fontWeight: 500 }}>
          ({weakWords.length} words to review)
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {weakWords.map(({ word, errorRate, difficulty, total, lapses }) => {
          const errPct = Math.round(errorRate * 100);
          const barColor = errorRate >= 0.6 ? '#dc2626' : errorRate >= 0.35 ? '#d97706' : '#16a34a';
          return (
            <div key={word} style={{
              background: 'var(--card)', border: '1px solid var(--card-b)',
              borderRadius: 12, padding: '10px 14px',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              {/* Word + pronunciation */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--heading)', fontFamily: "'Playfair Display',serif" }}>
                    {word}
                  </span>
                  <button
                    onClick={() => speak(word)}
                    aria-label={`Pronounce ${word}`}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                      fontSize: 14, opacity: 0.6, flexShrink: 0,
                    }}
                  >🔊</button>
                </div>
                {/* Error rate bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 5, background: 'var(--bar-bg)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: errPct + '%', background: barColor, borderRadius: 3, transition: 'width .5s ease' }} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: barColor, flexShrink: 0, minWidth: 32 }}>
                    {errPct}% err
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div style={{ flexShrink: 0, textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: 'var(--subtext)', fontWeight: 600 }}>
                  {total} reviews
                </div>
                {lapses > 0 && (
                  <div style={{ fontSize: 10, color: '#dc2626', fontWeight: 700 }}>
                    {lapses} lapse{lapses !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button
          onClick={() => setScr && setScr('review')}
          style={{
            flex: 1, height: 40, background: 'var(--info)', color: '#fff',
            border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700,
            cursor: 'pointer', fontFamily: "'Outfit',sans-serif",
          }}
        >
          Review These Words →
        </button>
        {weakWords.length >= 8 && (
          <button
            onClick={() => setExpanded(e => !e)}
            style={{
              height: 40, padding: '0 14px', background: 'var(--card)', color: 'var(--subtext)',
              border: '1px solid var(--card-b)', borderRadius: 10, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: "'Outfit',sans-serif",
            }}
          >
            {expanded ? 'Less' : 'More'}
          </button>
        )}
      </div>
    </div>
  );
}
