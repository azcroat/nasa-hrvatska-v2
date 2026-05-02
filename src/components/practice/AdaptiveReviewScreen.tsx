import React, { useState, useMemo, useEffect, useRef } from 'react';
import { speak, getMistakes, recordMistake } from '../../data';
import { getSR } from '../../lib/srs.ts';
import { useStats } from '../../context/StatsContext.tsx';
import { markQuest } from '../../lib/quests.js';

// ─── STYLES ──────────────────────────────────────────────────────────────────
const STYLES = `
@keyframes ar-pop {
  0%{transform:scale(0.93);opacity:0}
  60%{transform:scale(1.03)}
  100%{transform:scale(1);opacity:1}
}
@keyframes ar-slide {
  from{transform:translateY(14px);opacity:0}
  to{transform:translateY(0);opacity:1}
}
`;

// ─── BUILD ADAPTIVE SESSION ───────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildAdaptiveSession(sr: any, mistakes: any[]) {
  const now = Date.now();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session: any[] = [];

  // 1. OVERDUE SRS CARDS (highest priority)
  const overdue = Object.entries(sr)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter(([, c]: [string, any]) => c.due && c.due <= now && c.w > 0)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .sort(([, a]: [string, any], [, b]: [string, any]) => (b.l || 0) - (a.l || 0))
    .slice(0, 8)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map(([id, c]: [string, any]) => ({ type: 'srs', id, card: c, priority: 'overdue' }));
  session.push(...overdue);

  // 2. HIGH-MISTAKE ITEMS (from mistake log)
  const highMistake = mistakes
    .filter((m) => m.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .map((m) => ({ type: 'mistake', item: m, priority: 'frequent' }));
  session.push(...highMistake);

  // 3. GRAMMAR WEAK SPOTS
  const grammarMistakes = mistakes.filter(
    (m) => m.category && ['grammar', 'cases', 'aspect', 'verb'].some((c) => m.category.includes(c)),
  );
  const catCounts: Record<string, number> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  grammarMistakes.forEach((m: any) => {
    catCounts[m.category] = (catCounts[m.category] || 0) + m.count;
  });
  const weakestGrammarCat = Object.entries(catCounts).sort(([, a], [, b]) => b - a)[0]?.[0];

  // 4. Fill to 15 items minimum with due SRS cards
  const dueSoon = Object.entries(sr)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter(([, c]: [string, any]) => c.due && c.due <= now + 24 * 60 * 60 * 1000)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .sort(([, a]: [string, any], [, b]: [string, any]) => a.due - b.due)
    .slice(0, Math.max(0, 15 - session.length))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map(([id, c]: [string, any]) => ({ type: 'srs', id, card: c, priority: 'due' }));
  session.push(...dueSoon);

  return { session, weakestGrammarCat, totalItems: session.length };
}

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────
function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div
      style={{
        background: 'rgba(0,0,0,.08)',
        borderRadius: 99,
        height: 6,
        overflow: 'hidden',
        marginBottom: 20,
      }}
    >
      <div
        style={{
          height: '100%',
          borderRadius: 99,
          width: `${pct}%`,
          background: 'linear-gradient(90deg,#7c3aed,#0e7490)',
          transition: 'width .3s ease',
        }}
      />
    </div>
  );
}

// ─── SRS CARD REVIEW ──────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SRSCardReview({ item, onResult }: { item: any; onResult: (correct: boolean) => void }) {
  const [flipped, setFlipped] = useState(false);
  const word = item.id;

  // Try to get English from item card (fallback gracefully)
  const enHint = item.card?.en || '';

  return (
    <div style={{ animation: 'ar-pop .22s ease both' }}>
      <div
        style={{
          background: 'var(--card-bg)',
          borderRadius: 20,
          padding: 28,
          boxShadow: '0 4px 20px rgba(0,0,0,.1)',
          marginBottom: 16,
          textAlign: 'center',
          minHeight: 160,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: 'var(--subtext)',
            textTransform: 'uppercase',
            letterSpacing: '.12em',
            marginBottom: 10,
          }}
        >
          {item.priority === 'overdue'
            ? '🔴 Overdue'
            : item.priority === 'due'
              ? '📅 Due today'
              : '📚 Review'}
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 900,
            color: 'var(--heading)',
            marginBottom: flipped ? 14 : 0,
          }}
        >
          {word}
        </div>
        {flipped && (
          <div style={{ animation: 'ar-slide .18s ease both' }}>
            {enHint && (
              <div style={{ fontSize: 16, color: '#0e7490', fontWeight: 700, marginBottom: 8 }}>
                {enHint}
              </div>
            )}
            <button
              onClick={() => speak(word)}
              style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer' }}
            >
              🔊
            </button>
          </div>
        )}
      </div>

      {!flipped ? (
        <button onClick={() => setFlipped(true)} style={btnStyle('#7c3aed')}>
          Otkrij ↓
        </button>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button onClick={() => onResult(true)} style={btnStyle('#059669')}>
            ✓ Znam
          </button>
          <button onClick={() => onResult(false)} style={btnStyle('#dc2626')}>
            ✗ Ne znam
          </button>
        </div>
      )}
    </div>
  );
}

// ─── MISTAKE CARD REVIEW ──────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MistakeCardItem = any;
function MistakeCardReview({
  item,
  onResult,
}: {
  item: MistakeCardItem;
  onResult: (correct: boolean) => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const m = item.item;

  return (
    <div style={{ animation: 'ar-pop .22s ease both' }}>
      <div
        style={{
          background: 'var(--card-bg)',
          borderRadius: 20,
          padding: 24,
          boxShadow: '0 4px 20px rgba(220,38,38,.1)',
          border: '1.5px solid rgba(220,38,38,.15)',
          marginBottom: 16,
          minHeight: 160,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: '#dc2626',
              background: 'rgba(220,38,38,.12)',
              padding: '2px 8px',
              borderRadius: 99,
            }}
          >
            🎯 Greška ×{m.count}
          </span>
          {m.category && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: 'var(--subtext)',
                background: 'rgba(0,0,0,.06)',
                padding: '2px 8px',
                borderRadius: 99,
              }}
            >
              {m.category}
            </span>
          )}
        </div>
        <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--heading)', marginBottom: 6 }}>
          {m.hr}
        </div>
        {m.q && (
          <div
            style={{ fontSize: 13, color: 'var(--subtext)', marginBottom: 8, fontStyle: 'italic' }}
          >
            {m.q}
          </div>
        )}
        {flipped && m.en && (
          <div
            style={{
              animation: 'ar-slide .18s ease both',
              background: 'rgba(14,116,144,.08)',
              borderRadius: 10,
              padding: '8px 12px',
              marginTop: 8,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0e7490' }}>{m.en}</div>
            <button
              onClick={() => speak(m.hr)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 18,
                cursor: 'pointer',
                marginTop: 4,
              }}
            >
              🔊
            </button>
          </div>
        )}
      </div>

      {!flipped ? (
        <button onClick={() => setFlipped(true)} style={btnStyle('#dc2626')}>
          Otkrij značenje
        </button>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button onClick={() => onResult(true)} style={btnStyle('#059669')}>
            ✓ Znam
          </button>
          <button onClick={() => onResult(false)} style={btnStyle('#dc2626')}>
            ✗ Ne znam
          </button>
        </div>
      )}
    </div>
  );
}

// ─── SHARED BUTTON STYLE ─────────────────────────────────────────────────────
function btnStyle(color: string) {
  return {
    width: '100%',
    padding: '14px 16px',
    borderRadius: 14,
    border: 'none',
    background: color,
    color: '#fff',
    fontWeight: 800,
    fontSize: 15,
    cursor: 'pointer',
    fontFamily: "'Outfit',sans-serif",
    letterSpacing: '.02em',
  };
}

// ─── INSIGHT PILL ─────────────────────────────────────────────────────────────
function Pill({ label, color = '#7c3aed' }: { label: string; color?: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: 12,
        fontWeight: 700,
        padding: '4px 10px',
        borderRadius: 99,
        marginRight: 6,
        marginBottom: 6,
        background: `${color}18`,
        color,
        border: `1px solid ${color}33`,
      }}
    >
      {label}
    </span>
  );
}

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────
interface Props {
  goBack: () => void;
  award?: (xp: number, celebrate?: boolean, activityType?: string) => void;
}
export default function AdaptiveReviewScreen({ goBack, award }: Props) {
  useStats(); // keeps provider contract; stats read via sr/mistakes directly
  const [view, setView] = useState('dashboard'); // 'dashboard' | 'session' | 'results'
  const [sessionIdx, setSessionIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const questFiredRef = useRef(false);

  const sr = useMemo(() => getSR(), []);
  const mistakes = useMemo(() => getMistakes(), []);
  const { session, weakestGrammarCat, totalItems } = useMemo(
    () => buildAdaptiveSession(sr, mistakes),
    [sr, mistakes],
  );

  // Guard: if sessionIdx runs past end of session (shouldn't happen in normal flow,
  // but defensive), transition to results via effect — NOT during render.
  useEffect(() => {
    if (view === 'session' && session.length > 0 && sessionIdx >= session.length) {
      if (!questFiredRef.current) {
        questFiredRef.current = true;
        markQuest('master');
      }
      if (award) award(correct * 2, false, 'review');
      setView('results');
    }
  }, [view, sessionIdx, session.length, correct, award]);

  const overdueCount = Object.values(sr).filter(
    (c) => c.due && c.due <= Date.now() && c.w > 0,
  ).length;
  const topMissed = [...mistakes].sort((a, b) => b.count - a.count).slice(0, 3);
  const srsCount = session.filter((i) => i.type === 'srs').length;
  const mistakeCount = session.filter((i) => i.type === 'mistake').length;

  const isEmpty = totalItems === 0;

  // ─── EMPTY STATE ────────────────────────────────────────────────────────────
  if (isEmpty) {
    return (
      <div style={{ padding: '0 0 32px', fontFamily: "'Outfit',sans-serif" }}>
        <style>{STYLES}</style>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 8px' }}>
          <button
            onClick={goBack}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 22,
              cursor: 'pointer',
              color: 'var(--heading)',
              padding: 4,
            }}
          >
            ←
          </button>
          <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--heading)' }}>Smart Review</div>
        </div>
        <div style={{ padding: '40px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🌱</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--heading)', marginBottom: 8 }}>
            Još nema podataka!
          </div>
          <div style={{ fontSize: 14, color: 'var(--subtext)', lineHeight: 1.6, marginBottom: 28 }}>
            Uradi nekoliko vježbi da vidimo gdje trebaš pomoć. Smart Review gradi personaliziranu
            sesiju iz tvojih grešaka i SRS kartice.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={goBack} style={btnStyle('#7c3aed')}>
              Idi na vježbe
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── DASHBOARD ──────────────────────────────────────────────────────────────
  if (view === 'dashboard') {
    return (
      <div style={{ padding: '0 0 32px', fontFamily: "'Outfit',sans-serif" }}>
        <style>{STYLES}</style>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 8px' }}>
          <button
            onClick={goBack}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 22,
              cursor: 'pointer',
              color: 'var(--heading)',
              padding: 4,
            }}
          >
            ←
          </button>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--heading)' }}>
              Smart Review
            </div>
            <div style={{ fontSize: 12, color: 'var(--subtext)' }}>
              Prilagođeno tvojim slabostima
            </div>
          </div>
        </div>

        <div style={{ padding: '0 16px' }}>
          {/* Weak areas section */}
          <div
            style={{
              background: 'var(--card-bg)',
              borderRadius: 18,
              padding: 18,
              marginBottom: 14,
              boxShadow: '0 2px 12px rgba(0,0,0,.06)',
            }}
          >
            <div
              style={{ fontSize: 13, fontWeight: 900, color: 'var(--heading)', marginBottom: 12 }}
            >
              Tvoja slaba mjesta
            </div>

            {topMissed.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--subtext)',
                    textTransform: 'uppercase',
                    letterSpacing: '.08em',
                    marginBottom: 6,
                  }}
                >
                  Najčešće greške
                </div>
                <div>
                  {topMissed.map((m, i) => (
                    <Pill key={i} label={`${m.hr} ×${m.count}`} color="#dc2626" />
                  ))}
                </div>
              </div>
            )}

            {overdueCount > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'rgba(217,119,6,.08)',
                  borderRadius: 12,
                  padding: '10px 12px',
                  marginBottom: 10,
                }}
              >
                <span style={{ fontSize: 20 }}>📅</span>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#d97706' }}>
                  {overdueCount} kartica{overdueCount !== 1 ? 'a' : ''} čeka na ponavljanje
                </div>
              </div>
            )}

            {weakestGrammarCat && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'rgba(124,58,237,.08)',
                  borderRadius: 12,
                  padding: '10px 12px',
                }}
              >
                <span style={{ fontSize: 20 }}>🔬</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--subtext)' }}>
                    Najslabije područje
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: '#7c3aed',
                      textTransform: 'capitalize',
                    }}
                  >
                    {weakestGrammarCat}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Session composition */}
          <div
            style={{
              background: 'linear-gradient(135deg,#3730a3,#0e7490)',
              borderRadius: 18,
              padding: 18,
              marginBottom: 20,
              color: '#fff',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 10, opacity: 0.9 }}>
              Tvoja prilagođena sesija
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 6 }}>
              {totalItems} stavki
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {srsCount > 0 && (
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    background: 'rgba(255,255,255,.18)',
                    padding: '4px 10px',
                    borderRadius: 99,
                  }}
                >
                  🔁 {srsCount} SRS
                </span>
              )}
              {mistakeCount > 0 && (
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    background: 'rgba(255,255,255,.18)',
                    padding: '4px 10px',
                    borderRadius: 99,
                  }}
                >
                  🎯 {mistakeCount} greška
                </span>
              )}
            </div>
          </div>

          <button onClick={() => setView('session')} style={btnStyle('#7c3aed')}>
            ▶ Počni sesiju
          </button>
        </div>
      </div>
    );
  }

  // ─── SESSION ─────────────────────────────────────────────────────────────────
  if (view === 'session') {
    const current = session[sessionIdx];

    if (!current) {
      // Session ended — useEffect above handles the transition.
      return null;
    }

    function handleResult(isCorrect: boolean) {
      if (isCorrect) {
        setCorrect((c) => c + 1);
      } else {
        setWrong((w) => w + 1);
        if (current.type === 'srs') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (recordMistake as (...a: any[]) => void)(current.id, '', current.id, 'adaptive');
        } else if (current.type === 'mistake') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (recordMistake as (...a: any[]) => void)(
            current.item.hr,
            current.item.en || '',
            current.item.q || '',
            'adaptive',
          );
        }
      }
      if (sessionIdx + 1 >= session.length) {
        const newCorrect = isCorrect ? correct + 1 : correct;
        if (!questFiredRef.current) {
          questFiredRef.current = true;
          markQuest('master');
          if (award) award(newCorrect * 2, false, 'review');
        }
        setView('results');
      } else {
        setSessionIdx((i) => i + 1);
      }
    }

    return (
      <div style={{ padding: '0 0 32px', fontFamily: "'Outfit',sans-serif" }}>
        <style>{STYLES}</style>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 8px' }}>
          <button
            onClick={() => setView('dashboard')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 22,
              cursor: 'pointer',
              color: 'var(--heading)',
              padding: 4,
            }}
          >
            ←
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--heading)' }}>
              Smart Review
            </div>
            <div style={{ fontSize: 11, color: 'var(--subtext)' }}>
              {sessionIdx + 1} / {session.length}
            </div>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>✓ {correct}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', marginLeft: 8 }}>
            ✗ {wrong}
          </div>
        </div>

        <div style={{ padding: '0 16px' }}>
          <ProgressBar current={sessionIdx} total={session.length} />

          {current.type === 'srs' && <SRSCardReview item={current} onResult={handleResult} />}
          {current.type === 'mistake' && (
            <MistakeCardReview item={current} onResult={handleResult} />
          )}
        </div>
      </div>
    );
  }

  // ─── RESULTS ─────────────────────────────────────────────────────────────────
  if (view === 'results') {
    const total = correct + wrong;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const xp = correct * 2;

    let recommendation = null;
    if (weakestGrammarCat) {
      recommendation = `Focus on: ${weakestGrammarCat}`;
    } else if (wrong > 0) {
      recommendation = 'Review missed words in Flashcards';
    } else {
      recommendation = 'Great session! Keep your SRS streak going.';
    }

    return (
      <div style={{ padding: '0 0 32px', fontFamily: "'Outfit',sans-serif" }}>
        <style>{STYLES}</style>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 8px' }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--heading)' }}>
            Sesija završena
          </div>
        </div>

        <div style={{ padding: '0 16px' }}>
          <div
            style={{
              textAlign: 'center',
              padding: '24px 0 28px',
              animation: 'ar-pop .3s ease both',
            }}
          >
            <div style={{ fontSize: 60, marginBottom: 8 }}>
              {pct >= 80 ? '🏆' : pct >= 60 ? '👍' : '💪'}
            </div>
            <div
              style={{ fontSize: 32, fontWeight: 900, color: 'var(--heading)', marginBottom: 4 }}
            >
              {pct}%
            </div>
            <div style={{ fontSize: 15, color: 'var(--subtext)', marginBottom: 20 }}>
              {correct}/{total} točno
            </div>
          </div>

          {/* Stats cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 10,
              marginBottom: 16,
            }}
          >
            {[
              { label: 'Pregledano', value: total, color: '#7c3aed' },
              { label: 'Točnost', value: `${pct}%`, color: '#0e7490' },
              { label: 'XP zarađeno', value: `+${xp}`, color: '#d97706' },
            ].map((s, i) => (
              <div
                key={i}
                style={{
                  background: 'var(--card-bg)',
                  borderRadius: 14,
                  padding: '14px 10px',
                  textAlign: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,.06)',
                }}
              >
                <div style={{ fontSize: 20, fontWeight: 900, color: s.color, marginBottom: 2 }}>
                  {s.value}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: 'var(--subtext)',
                    textTransform: 'uppercase',
                    letterSpacing: '.06em',
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Recommendation */}
          <div
            style={{
              background: 'rgba(124,58,237,.08)',
              border: '1.5px solid rgba(124,58,237,.2)',
              borderRadius: 14,
              padding: '14px 16px',
              marginBottom: 20,
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
            }}
          >
            <span style={{ fontSize: 20 }}>🧠</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#7c3aed', marginBottom: 2 }}>
                Preporuka za sljedeći put
              </div>
              <div style={{ fontSize: 13, color: 'var(--subtext)', lineHeight: 1.5 }}>
                {recommendation}
              </div>
            </div>
          </div>

          <button onClick={goBack} style={btnStyle('#7c3aed')}>
            ✓ Završi
          </button>
        </div>
      </div>
    );
  }

  return null;
}
