import React, { useMemo, useState } from 'react';
import { getSR } from '../../lib/srs.js';
import { speak } from '../../data';

// Reads FSRS data and surfaces the words with the highest error rate + difficulty.
// Gives users a real, actionable insight: "practice these 10 words today."
export default function WeakWordsPanel({ setScr }: { setScr?: (screen: string) => void }) {
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
        const score = errorRate * 0.6 + (difficulty / 10) * 0.3 + (Math.min(lapses, 5) / 5) * 0.1;
        return { word, errorRate, difficulty, total, lapses, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, expanded ? 20 : 8);

    return entries;
  }, [expanded]);

  if (weakWords.length === 0) {
    return (
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--card-b)',
          borderRadius: 16,
          padding: '16px 18px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            flexShrink: 0,
            background: 'rgba(220,38,38,.08)',
            border: '1.5px solid rgba(220,38,38,.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
          }}
        >
          🌱
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--subtext)', lineHeight: 1.4 }}>
          Complete a few vocabulary reviews to see your weak areas
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        marginBottom: 16,
        borderRadius: 18,
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(220,38,38,.15)',
        border: '1.5px solid rgba(220,38,38,.2)',
      }}
    >
      {/* ── Header banner ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #b91c1c 0%, #dc2626 60%, #ef4444 100%)',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 13,
            flexShrink: 0,
            background: 'rgba(255,255,255,.15)',
            border: '1.5px solid rgba(255,255,255,.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
          }}
        >
          🔥
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: 'rgba(255,255,255,.7)',
              textTransform: 'uppercase',
              letterSpacing: '.1em',
              marginBottom: 2,
            }}
          >
            NEEDS WORK
          </div>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>
            Weak Areas · {weakWords.length} words
          </div>
        </div>
        <button
          onClick={() => setScr && setScr('review')}
          style={{
            padding: '8px 14px',
            borderRadius: 10,
            border: '1.5px solid rgba(255,255,255,.4)',
            background: 'rgba(255,255,255,.15)',
            color: '#fff',
            fontSize: 12,
            fontWeight: 800,
            cursor: 'pointer',
            fontFamily: "'Outfit',sans-serif",
            flexShrink: 0,
            backdropFilter: 'blur(4px)',
          }}
        >
          Review →
        </button>
      </div>

      {/* ── Word list ── */}
      <div style={{ background: 'var(--card)', padding: '10px 12px 12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {weakWords.map(({ word, errorRate, total, lapses }) => {
            const errPct = Math.round(errorRate * 100);
            const barColor =
              errorRate >= 0.6 ? '#dc2626' : errorRate >= 0.35 ? '#d97706' : '#16a34a';
            return (
              <div
                key={word}
                style={{
                  background: 'var(--bar-bg)',
                  border: '1px solid var(--card-b)',
                  borderRadius: 12,
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 800,
                        color: 'var(--heading)',
                        fontFamily: "'Playfair Display',serif",
                      }}
                    >
                      {word}
                    </span>
                    <button
                      onClick={() => speak(word)}
                      aria-label={`Pronounce ${word}`}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        fontSize: 14,
                        opacity: 0.6,
                        flexShrink: 0,
                      }}
                    >
                      🔊
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        flex: 1,
                        height: 5,
                        background: 'var(--card-b)',
                        borderRadius: 3,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: errPct + '%',
                          background: barColor,
                          borderRadius: 3,
                          transition: 'width .5s ease',
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: barColor,
                        flexShrink: 0,
                        minWidth: 32,
                      }}
                    >
                      {errPct}% err
                    </span>
                  </div>
                </div>
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

        {weakWords.length >= 8 && (
          <button
            onClick={() => setExpanded((e) => !e)}
            style={{
              width: '100%',
              marginTop: 8,
              height: 36,
              background: 'none',
              color: 'var(--subtext)',
              border: '1px solid var(--card-b)',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: "'Outfit',sans-serif",
            }}
          >
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>
    </div>
  );
}
