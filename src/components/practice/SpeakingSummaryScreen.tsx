import React from 'react';
import { H } from '../../data';

interface WordScore {
  word: string;
  meaning: string;
  score: number;
}

interface Props {
  wordScores: WordScore[];
  onDone: () => void;
}

function scoreBadgeColor(s: number) {
  if (s >= 90)
    return { bg: 'var(--success-bg)', border: 'var(--success-b)', text: 'var(--success)' };
  if (s >= 70) return { bg: '#fff7ed', border: '#fed7aa', text: '#c2410c' };
  if (s >= 50) return { bg: '#fff7ed', border: '#fed7aa', text: '#ea580c' };
  return { bg: '#fef2f2', border: '#fecaca', text: 'var(--error)' };
}
function scoreBadgeLabel(s: number) {
  if (s >= 90) return `🟢 Excellent! ${s}%`;
  if (s >= 70) return `🟡 Good! ${s}%`;
  if (s >= 50) return `🟠 Keep practicing ${s}%`;
  return `🔴 Try again ${s}%`;
}

export default function SpeakingSummaryScreen({ wordScores, onDone }: Props) {
  const scored = wordScores;
  const avg =
    scored.length > 0
      ? Math.round(scored.reduce((sum: number, ws: WordScore) => sum + ws.score, 0) / scored.length)
      : null;
  const best =
    scored.length > 0
      ? scored.reduce((b: WordScore, ws: WordScore) => (ws.score > b.score ? ws : b), scored[0]!)
      : null;
  const worst =
    scored.length > 0
      ? scored.reduce((b: WordScore, ws: WordScore) => (ws.score < b.score ? ws : b), scored[0]!)
      : null;

  return (
    <div className="scr-wrap">
      {H('🎤 Pronunciation Results', undefined, undefined)}
      <div className="c" style={{ textAlign: 'center', marginTop: 16 }}>
        {/* Average score badge */}
        {avg !== null && (
          <div
            style={{
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginBottom: 20,
              padding: '18px 28px',
              background:
                avg >= 90
                  ? 'var(--success-bg)'
                  : avg >= 70
                    ? '#fff7ed'
                    : avg >= 50
                      ? '#fff7ed'
                      : '#fef2f2',
              border: `2px solid ${avg >= 90 ? 'var(--success-b)' : avg >= 70 ? '#fed7aa' : avg >= 50 ? '#fdba74' : '#fecaca'}`,
              borderRadius: 18,
            }}
          >
            <div
              style={{
                fontSize: 'var(--text-4xl)',
                fontWeight: 900,
                color:
                  avg >= 90
                    ? 'var(--success)'
                    : avg >= 70
                      ? '#c2410c'
                      : avg >= 50
                        ? '#ea580c'
                        : 'var(--error)',
              }}
            >
              {avg}%
            </div>
            <div
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 700,
                color: 'var(--subtext)',
                marginTop: 4,
              }}
            >
              Average pronunciation score
            </div>
            <div style={{ fontSize: 'var(--text-base)', fontWeight: 800, marginTop: 6 }}>
              {avg >= 90
                ? '🟢 Excellent session!'
                : avg >= 70
                  ? '🟡 Good work!'
                  : avg >= 50
                    ? '🟠 Keep practicing!'
                    : '🔴 Keep at it!'}
            </div>
          </div>
        )}

        {/* Highlights */}
        {best && worst && best.word !== worst.word && (
          <div
            style={{
              display: 'flex',
              gap: 10,
              marginBottom: 18,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                flex: 1,
                minWidth: 130,
                padding: '12px 14px',
                borderRadius: 14,
                background: 'var(--success-bg)',
                border: '1.5px solid var(--success-b)',
              }}
            >
              <div
                style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 800,
                  color: 'var(--success)',
                  marginBottom: 4,
                }}
              >
                ⭐ Best word
              </div>
              <div
                style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--heading)' }}
              >
                {best.word}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)' }}>
                {best.meaning}
              </div>
              <div
                style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 800,
                  color: 'var(--success)',
                  marginTop: 4,
                }}
              >
                {best.score}%
              </div>
            </div>
            <div
              style={{
                flex: 1,
                minWidth: 130,
                padding: '12px 14px',
                borderRadius: 14,
                background: '#fef2f2',
                border: '1.5px solid #fecaca',
              }}
            >
              <div
                style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 800,
                  color: 'var(--error)',
                  marginBottom: 4,
                }}
              >
                📚 Needs work
              </div>
              <div
                style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--heading)' }}
              >
                {worst.word}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)' }}>
                {worst.meaning}
              </div>
              <div
                style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 800,
                  color: 'var(--error)',
                  marginTop: 4,
                }}
              >
                {worst.score}%
              </div>
            </div>
          </div>
        )}

        {/* Per-word breakdown */}
        {scored.length > 0 && (
          <div
            style={{
              background: 'var(--card)',
              borderRadius: 14,
              border: '1.5px solid var(--card-b)',
              overflow: 'hidden',
              marginBottom: 20,
              textAlign: 'left',
            }}
          >
            <div
              style={{
                padding: '10px 16px',
                background: 'var(--bar-bg)',
                fontSize: 'var(--text-sm)',
                fontWeight: 800,
                color: 'var(--heading)',
                borderBottom: '1px solid var(--card-b)',
              }}
            >
              Word-by-word breakdown
            </div>
            {scored.map((ws: WordScore, idx: number) => {
              const colors = scoreBadgeColor(ws.score);
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 16px',
                    borderBottom: idx < scored.length - 1 ? '1px solid var(--card-b)' : 'none',
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      flexShrink: 0,
                      background: colors.bg,
                      border: `2px solid ${colors.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      fontWeight: 900,
                      color: colors.text,
                    }}
                  >
                    {ws.score}%
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: 'var(--text-base)',
                        color: 'var(--heading)',
                      }}
                    >
                      {ws.word}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)' }}>
                      {ws.meaning}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 'var(--text-xs)',
                      fontWeight: 800,
                      color: colors.text,
                      background: colors.bg,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 8,
                      padding: '3px 8px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {scoreBadgeLabel(ws.score)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* No scores — all self-assessed */}
        {scored.length === 0 && (
          <div
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--subtext)',
              marginBottom: 20,
              padding: '14px',
              background: 'var(--bar-bg)',
              borderRadius: 12,
              border: '1.5px solid var(--card-b)',
            }}
          >
            No pronunciation scores recorded. Use "Test My Pronunciation" on the next session to see
            your accuracy!
          </div>
        )}

        <button className="b bp" onClick={onDone}>
          Done ✓
        </button>
      </div>
    </div>
  );
}
