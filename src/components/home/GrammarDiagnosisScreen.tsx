// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { H, getSR } from '../../data';
import { apiFetch } from '../../lib/apiFetch.js';

// ── Severity config ────────────────────────────────────────────────────────────
const SEV = {
  high:   { color: '#D4002D', bg: '#fff1f2', border: '#fecdd3', label: 'HIGH' },
  medium: { color: '#d97706', bg: '#fffbeb', border: '#fde68a', label: 'MED'  },
  low:    { color: '#0e7490', bg: '#f0f9ff', border: '#bae6fd', label: 'LOW'  },
};

// ── Human-readable age ─────────────────────────────────────────────────────────
function ageLabel(ts) {
  const ms = Date.now() - ts;
  const days = Math.floor(ms / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

// ── Option labels ──────────────────────────────────────────────────────────────
const LABELS = ['A', 'B', 'C', 'D'];

// ── Loading dots animation ────────────────────────────────────────────────────
function LoadingDots() {
  const [dot, setDot] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDot(d => (d + 1) % 4), 420);
    return () => clearInterval(t);
  }, []);
  return <span style={{ letterSpacing: 2 }}>{'.'.repeat(dot)}&nbsp;</span>;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function GrammarDiagnosisScreen({ goBack, award }) {
  const [phase, setPhase]               = useState('idle');
  const [diagnosis, setDiagnosis]       = useState(null);
  const [cacheAge, setCacheAge]         = useState(null);
  const [activeBlindSpot, setActiveBlindSpot] = useState(0);
  const [drillAnswers, setDrillAnswers] = useState({});
  const [xpAwarded, setXpAwarded]      = useState(false);

  // ── On mount: check cache ──────────────────────────────────────────────────
  useEffect(() => {
    const level = localStorage.getItem('nh_level') || 'B1';
    try {
      const raw = localStorage.getItem('nh_grammar_diagnosis');
      if (raw) {
        const cached = JSON.parse(raw);
        const age = Date.now() - cached.generatedAt;
        if (age < 604800000 && cached.level === level && cached.data) {
          setDiagnosis(cached.data);
          setCacheAge(ageLabel(cached.generatedAt));
          setPhase('results');
          return;
        }
      }
    } catch (_) {}
    setPhase('idle');
  }, []);

  // ── Award XP when a drill is answered correctly ────────────────────────────
  useEffect(() => {
    if (xpAwarded || !diagnosis) return;
    const anyCorrect = Object.entries(drillAnswers).some(([key, chosen]) => {
      // key format: bs{i}_q{j}
      const [bsPart, qPart] = key.split('_');
      const bsIdx = parseInt(bsPart.replace('bs', ''), 10);
      const qIdx  = parseInt(qPart.replace('q', ''), 10);
      const drill = diagnosis.blindSpots?.[bsIdx]?.drills?.[qIdx];
      return drill && chosen === drill.correct;
    });
    if (anyCorrect) {
      setXpAwarded(true);
      award && award(10);
    }
  }, [drillAnswers, diagnosis, xpAwarded, award]);

  // ── Generate function ──────────────────────────────────────────────────────
  async function generate() {
    setPhase('loading');
    const level = localStorage.getItem('nh_level') || 'B1';

    const srData = getSR();
    const srMistakes = {};
    Object.entries(srData).forEach(([word, stats]) => {
      if (stats.w > 0 || stats.r > 0) {
        srMistakes[word] = { wrong_count: stats.w, right_count: stats.r };
      }
    });

    let majaMemory = {};
    try { majaMemory = JSON.parse(localStorage.getItem('majaMemory') || '{}'); } catch (_) {}
    const majaPatterns = Array.isArray(majaMemory.mistakePatterns)
      ? majaMemory.mistakePatterns.slice(0, 20)
      : [];

    let writingMistakes = [];
    try { writingMistakes = JSON.parse(localStorage.getItem('nh_writing_mistakes') || '[]').slice(0, 20); } catch (_) {}

    try {
      const res = await apiFetch('/api/grammar-diagnosis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level, srMistakes, majaPatterns, writingMistakes }),
      });
      if (!res.ok) throw new Error('api_error');
      const data = await res.json();

      localStorage.setItem('nh_grammar_diagnosis', JSON.stringify({
        data,
        generatedAt: Date.now(),
        level,
      }));

      setDiagnosis(data);
      setDrillAnswers({});
      setCacheAge(null);
      setXpAwarded(false);
      setActiveBlindSpot(0);
      setPhase('results');
    } catch (_) {
      setPhase('error');
    }
  }

  // ── Data counts for idle screen ────────────────────────────────────────────
  function getDataCounts() {
    const srData     = getSR();
    const srCount    = Object.keys(srData).length;
    let majaMemory = {};
    try { majaMemory = JSON.parse(localStorage.getItem('majaMemory') || '{}'); } catch (_) {}
    const majaCount  = Array.isArray(majaMemory.mistakePatterns)
      ? majaMemory.mistakePatterns.length : 0;
    let writingCount = 0;
    try { writingCount = JSON.parse(localStorage.getItem('nh_writing_mistakes') || '[]').length; } catch (_) {}
    return { srCount, majaCount, writingCount };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PHASE: idle
  // ══════════════════════════════════════════════════════════════════════════
  if (phase === 'idle') {
    const { srCount, majaCount, writingCount } = getDataCounts();
    const hasData = srCount > 0 || majaCount > 0 || writingCount > 0;

    return (
      <div className="scr-wrap">
        {H('🔬 Grammar Diagnosis', 'Discover your Croatian blind spots')}

        {/* What it does */}
        <div className="c" style={{ marginBottom: 20, padding: '20px 18px' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 14 }}>
            <span style={{ fontSize: 32 }}>🧠</span>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 16, marginBottom: 4 }}>
                Your Personal Grammar Report
              </div>
              <div style={{ fontSize: 14, color: 'var(--subtext)', lineHeight: 1.55 }}>
                Claude analyses your SRS mistakes, Maja conversation errors, and writing
                corrections to pinpoint the exact grammar rules you struggle with — then
                gives you targeted drills to fix them.
              </div>
            </div>
          </div>
          <div style={{
            background: 'var(--bar-bg)',
            borderRadius: 10,
            padding: '10px 14px',
            fontSize: 13,
            color: 'var(--subtext)',
            lineHeight: 1.6,
          }}>
            📅 &nbsp;Updated weekly — your report stays fresh for 7 days
          </div>
        </div>

        {/* Data preview chips */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--subtext)', marginBottom: 10, letterSpacing: 0.5 }}>
            DATA SOURCES
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[
              { icon: '🃏', label: `${srCount} SRS words tracked`,     active: srCount > 0      },
              { icon: '🎤', label: `${majaCount} Maja patterns`,        active: majaCount > 0    },
              { icon: '✍️', label: `${writingCount} writing corrections`, active: writingCount > 0 },
            ].map(chip => (
              <div key={chip.label} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 13px', borderRadius: 20,
                background: chip.active ? '#f0fdf4' : 'var(--bar-bg)',
                border: `1.5px solid ${chip.active ? '#86efac' : 'var(--card-b)'}`,
                fontSize: 13, fontWeight: chip.active ? 600 : 400,
                color: chip.active ? '#15803d' : 'var(--subtext)',
                transition: 'all 0.2s',
              }}>
                <span>{chip.icon}</span>
                <span>{chip.label}</span>
                {chip.active && <span style={{ fontSize: 11 }}>✓</span>}
              </div>
            ))}
          </div>
        </div>

        {hasData ? (
          <button
            className="b bp"
            style={{ width: '100%', fontSize: 16, padding: '14px 0', borderRadius: 14 }}
            onClick={generate}
          >
            🔬 Generate My Report →
          </button>
        ) : (
          <div className="c" style={{ textAlign: 'center', padding: '28px 20px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
            <div style={{ fontWeight: 700, color: 'var(--heading)', marginBottom: 8, fontSize: 15 }}>
              Not enough data yet
            </div>
            <div style={{ fontSize: 14, color: 'var(--subtext)', lineHeight: 1.6, marginBottom: 20 }}>
              Practice more to unlock your diagnosis — try Flashcards, Maja, and
              Free Writing first!
            </div>
            <button className="b bg" onClick={goBack}>← Back</button>
          </div>
        )}

        {!hasData && null}
        {hasData && (
          <button className="b bg" style={{ width: '100%', marginTop: 10 }} onClick={goBack}>
            ← Back
          </button>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PHASE: loading
  // ══════════════════════════════════════════════════════════════════════════
  if (phase === 'loading') {
    return (
      <div className="scr-wrap" style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minHeight: '70vh', textAlign: 'center', padding: '40px 20px',
      }}>
        {/* Pulsing icon */}
        <div style={{
          fontSize: 56,
          animation: 'nh-pulse 1.4s ease-in-out infinite',
          marginBottom: 28,
        }}>
          🔬
        </div>

        <div style={{
          fontSize: 22, fontWeight: 700, color: 'var(--heading)', marginBottom: 10,
        }}>
          Analyzing your mistakes<LoadingDots />
        </div>

        <div style={{ fontSize: 14, color: 'var(--subtext)', marginBottom: 36, lineHeight: 1.6 }}>
          Claude is reading your entire learning history<br />and identifying your grammar blind spots
        </div>

        {/* Progress bar shimmer */}
        <div style={{
          width: 260, height: 6, borderRadius: 99,
          background: 'var(--bar-bg)', overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', borderRadius: 99,
            background: 'linear-gradient(90deg, #0e7490, #0891b2, #0e7490)',
            backgroundSize: '200% 100%',
            animation: 'nh-shimmer 1.6s linear infinite',
          }} />
        </div>

        <style>{`
          @keyframes nh-pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50%       { transform: scale(1.08); opacity: 0.85; }
          }
          @keyframes nh-shimmer {
            0%   { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PHASE: error
  // ══════════════════════════════════════════════════════════════════════════
  if (phase === 'error') {
    return (
      <div className="scr-wrap" style={{ textAlign: 'center', padding: '60px 24px' }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>📡</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--heading)', marginBottom: 8 }}>
          Couldn't generate your report
        </div>
        <div style={{ fontSize: 14, color: 'var(--subtext)', marginBottom: 32, lineHeight: 1.6 }}>
          Try again when you have internet access.
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="b bp" onClick={generate}>Try Again</button>
          <button className="b bg" onClick={goBack}>← Back</button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PHASE: results
  // ══════════════════════════════════════════════════════════════════════════
  const blindSpots = diagnosis?.blindSpots || [];

  return (
    <div className="scr-wrap">
      {H('🔬 Grammar Diagnosis', diagnosis?.summary || 'Your personalized grammar report')}

      {/* Cache age pill */}
      {cacheAge && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          marginBottom: 18, flexWrap: 'wrap',
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '5px 12px', borderRadius: 20,
            background: 'var(--bar-bg)', border: '1.5px solid var(--card-b)',
            fontSize: 12, color: 'var(--subtext)',
          }}>
            📅 Report from {cacheAge}
          </div>
          <button
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 12, color: '#0e7490', fontWeight: 600, padding: '5px 8px',
            }}
            onClick={generate}
          >
            Refresh →
          </button>
        </div>
      )}

      {/* Blind spots */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {blindSpots.map((bs, i) => {
          const sev     = SEV[bs.severity] || SEV.low;
          const isOpen  = activeBlindSpot === i;

          return (
            <div
              key={i}
              className="c"
              style={{
                padding: 0, overflow: 'hidden',
                border: `1.5px solid ${isOpen ? sev.border : 'var(--card-b)'}`,
                transition: 'border-color 0.2s',
              }}
            >
              {/* Header row */}
              <button
                onClick={() => setActiveBlindSpot(isOpen ? -1 : i)}
                style={{
                  width: '100%', background: isOpen ? sev.bg : 'var(--card)',
                  border: 'none', cursor: 'pointer',
                  padding: '14px 16px',
                  display: 'flex', alignItems: 'center', gap: 10,
                  transition: 'background 0.2s',
                }}
              >
                {/* Severity badge */}
                <span style={{
                  flexShrink: 0,
                  padding: '3px 8px', borderRadius: 6,
                  background: sev.color, color: '#fff',
                  fontSize: 10, fontWeight: 800, letterSpacing: 0.5,
                }}>
                  {sev.label}
                </span>

                {/* Name */}
                <span style={{
                  flex: 1, textAlign: 'left',
                  fontWeight: 700, fontSize: 15, color: 'var(--heading)',
                }}>
                  {bs.name}
                </span>

                {/* Chevron */}
                <span style={{
                  flexShrink: 0, fontSize: 14, color: 'var(--subtext)',
                  transition: 'transform 0.2s',
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  display: 'inline-block',
                }}>
                  ▼
                </span>
              </button>

              {/* Expanded body */}
              {isOpen && (
                <div style={{ padding: '0 16px 18px' }}>
                  <div style={{ height: 1, background: sev.border, margin: '0 0 16px' }} />

                  {/* Explanation */}
                  <div style={{
                    fontSize: 14, color: 'var(--subtext)', lineHeight: 1.65,
                    marginBottom: 18,
                  }}>
                    {bs.explanation}
                  </div>

                  {/* Mistake comparison */}
                  {bs.example && (
                    <div style={{ marginBottom: 20 }}>
                      <div style={{
                        fontSize: 11, fontWeight: 700, color: 'var(--subtext)',
                        letterSpacing: 0.5, marginBottom: 10,
                      }}>
                        THE MISTAKE
                      </div>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {/* Wrong */}
                        <div style={{
                          flex: 1, minWidth: 130,
                          background: '#fff1f2', border: '1.5px solid #fecdd3',
                          borderRadius: 12, padding: '12px 14px',
                        }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#D4002D', marginBottom: 6 }}>
                            ❌ Wrong
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: '#9f1239' }}>
                            {bs.example.wrong}
                          </div>
                          {bs.example.wrong_en && (
                            <div style={{ fontSize: 12, color: '#be123c', marginTop: 4, fontStyle: 'italic' }}>
                              {bs.example.wrong_en}
                            </div>
                          )}
                        </div>
                        {/* Correct */}
                        <div style={{
                          flex: 1, minWidth: 130,
                          background: '#f0fdf4', border: '1.5px solid #86efac',
                          borderRadius: 12, padding: '12px 14px',
                        }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#15803d', marginBottom: 6 }}>
                            ✅ Correct
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: '#166534' }}>
                            {bs.example.correct}
                          </div>
                          {bs.example.correct_en && (
                            <div style={{ fontSize: 12, color: '#16a34a', marginTop: 4, fontStyle: 'italic' }}>
                              {bs.example.correct_en}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quick drills */}
                  {bs.drills && bs.drills.length > 0 && (
                    <div>
                      <div style={{
                        fontSize: 11, fontWeight: 700, color: 'var(--subtext)',
                        letterSpacing: 0.5, marginBottom: 12,
                      }}>
                        QUICK DRILLS
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {bs.drills.map((drill, j) => {
                          const drillKey  = `bs${i}_q${j}`;
                          const chosen    = drillAnswers[drillKey];
                          const answered  = chosen !== undefined;

                          return (
                            <div key={j} style={{
                              background: 'var(--bar-bg)',
                              borderRadius: 12, padding: '14px 14px 12px',
                            }}>
                              <div style={{
                                fontSize: 14, fontWeight: 600, color: 'var(--heading)',
                                marginBottom: 10, lineHeight: 1.5,
                              }}>
                                {j + 1}. {drill.q}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                                {drill.options.map((opt, k) => {
                                  const isChosen  = chosen === k;
                                  const isCorrect = drill.correct === k;
                                  let bg     = 'var(--card)';
                                  let border = '1.5px solid var(--card-b)';
                                  let color  = 'var(--heading)';

                                  if (answered) {
                                    if (isCorrect) {
                                      bg = '#f0fdf4'; border = '1.5px solid #86efac'; color = '#166534';
                                    } else if (isChosen && !isCorrect) {
                                      bg = '#fff1f2'; border = '1.5px solid #fecdd3'; color = '#9f1239';
                                    }
                                  } else if (isChosen) {
                                    bg = '#eff6ff'; border = '1.5px solid #93c5fd';
                                  }

                                  return (
                                    <button
                                      key={k}
                                      disabled={answered}
                                      onClick={() => setDrillAnswers(prev => ({ ...prev, [drillKey]: k }))}
                                      style={{
                                        display: 'flex', alignItems: 'center', gap: 10,
                                        background: bg, border, borderRadius: 9,
                                        padding: '9px 12px', cursor: answered ? 'default' : 'pointer',
                                        textAlign: 'left', transition: 'all 0.15s',
                                      }}
                                    >
                                      <span style={{
                                        flexShrink: 0, width: 22, height: 22,
                                        borderRadius: 6,
                                        background: answered && isCorrect
                                          ? '#22c55e'
                                          : answered && isChosen && !isCorrect
                                          ? '#D4002D'
                                          : 'var(--bar-bg)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 11, fontWeight: 800, color: answered && (isCorrect || (isChosen && !isCorrect)) ? '#fff' : 'var(--subtext)',
                                        transition: 'all 0.15s',
                                      }}>
                                        {answered && isCorrect ? '✓' : answered && isChosen && !isCorrect ? '✗' : LABELS[k]}
                                      </span>
                                      <span style={{ fontSize: 14, color, fontWeight: isChosen ? 600 : 400 }}>
                                        {opt}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Feedback line */}
                              {answered && (
                                <div style={{
                                  marginTop: 8, fontSize: 13,
                                  color: chosen === drill.correct ? '#15803d' : '#D4002D',
                                  fontWeight: 600,
                                }}>
                                  {chosen === drill.correct
                                    ? '✓ Correct! Well done.'
                                    : `✗ The correct answer was: ${drill.options[drill.correct]}`}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* XP awarded banner */}
      {xpAwarded && (
        <div style={{
          background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)',
          border: '1.5px solid #86efac',
          borderRadius: 12, padding: '12px 16px',
          marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 22 }}>⭐</span>
          <div>
            <div style={{ fontWeight: 700, color: '#15803d', fontSize: 14 }}>+10 XP earned!</div>
            <div style={{ fontSize: 12, color: '#16a34a' }}>Great work on the drill questions</div>
          </div>
        </div>
      )}

      {/* Bottom actions */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button className="b bp" style={{ flex: 1, minWidth: 140 }} onClick={generate}>
          🔄 Refresh Report
        </button>
        <button className="b bg" style={{ flex: 1, minWidth: 100 }} onClick={goBack}>
          ← Back
        </button>
      </div>
    </div>
  );
}
