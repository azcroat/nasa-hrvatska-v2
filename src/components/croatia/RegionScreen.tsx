// @ts-nocheck
import React, { useState } from 'react';
import { sh } from '../../data';
import { REGIONS } from '../../data';

function RegionScreen({ regionKey, goBack }) {
  const [tab, setTab] = useState('overview');
  const [quizI, setQuizI] = useState(0);
  const [quizSel, setQuizSel] = useState(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const [expandedPerson, setExpandedPerson] = useState(null);
  const r = REGIONS[regionKey];

  const TABS = [
    { id: 'overview', label: 'Overview', icon: '📖' },
    { id: 'timeline', label: 'Timeline', icon: '📅' },
    { id: 'people', label: 'People', icon: '👥' },
    { id: 'language', label: 'Language', icon: '💬' },
    { id: 'quiz', label: 'Quiz', icon: '🎯' },
  ];

  function resetQuiz() {
    setQuizI(0);
    setQuizSel(null);
    setQuizScore(0);
    setQuizDone(false);
  }

  function handleQuizAnswer(opt) {
    if (quizSel !== null) return;
    setQuizSel(opt);
    const correct = opt === r.quiz[quizI].a;
    if (correct) setQuizScore((s) => s + 1);
    setTimeout(() => {
      if (quizI < r.quiz.length - 1) {
        setQuizI((i) => i + 1);
        setQuizSel(null);
      } else setQuizDone(true);
    }, 1400);
  }

  const accentColor = r.color || '#0e7490';
  const bgLight = accentColor + '12';

  return (
    <div className="scr-wrap">
      {/* Header */}
      <div
        style={{
          background: `linear-gradient(135deg,${accentColor},${accentColor}cc)`,
          borderRadius: 18,
          padding: '20px',
          marginBottom: 20,
          color: 'white',
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 8 }}>{r.icon || '🗺️'}</div>
        <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 4 }}>{r.title}</div>
        <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 10 }}>{r.sub}</div>
        <div style={{ fontSize: 13, lineHeight: 1.6, opacity: 0.9 }}>{r.intro}</div>
      </div>

      {/* Tab bar */}
      <div
        style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flexShrink: 0,
              padding: '8px 14px',
              borderRadius: 20,
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 12,
              background: tab === t.id ? accentColor : 'rgba(0,0,0,.06)',
              color: tab === t.id ? 'white' : '#44403c',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === 'overview' && (
        <div>
          {r.sections.map(function (s, i) {
            return (
              <div
                key={i}
                className="c"
                style={{
                  marginBottom: 14,
                  borderLeft: `4px solid ${accentColor}`,
                  padding: '14px 16px',
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 800, color: accentColor, marginBottom: 8 }}>
                  {s.h}
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--subtext)' }}>{s.t}</div>
              </div>
            );
          })}
          {r.facts && r.facts.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div
                style={{ fontSize: 14, fontWeight: 800, color: 'var(--info)', marginBottom: 12 }}
              >
                💡 Did You Know?
              </div>
              {r.facts.map(function (f, i) {
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: 12,
                      padding: '12px 14px',
                      background: bgLight,
                      borderRadius: 12,
                      marginBottom: 8,
                      alignItems: 'flex-start',
                    }}
                  >
                    <div style={{ fontSize: 18, flexShrink: 0 }}>⚡</div>
                    <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--heading)' }}>
                      {f}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TIMELINE */}
      {tab === 'timeline' && r.timeline && (
        <div>
          <div style={{ fontSize: 13, color: 'var(--subtext)', marginBottom: 16 }}>
            Swipe through {r.timeline.length} key moments in history
          </div>
          <div style={{ position: 'relative', paddingLeft: 20 }}>
            <div
              style={{
                position: 'absolute',
                left: 9,
                top: 0,
                bottom: 0,
                width: 2,
                background: `linear-gradient(${accentColor},${accentColor}40)`,
              }}
            />
            {r.timeline.map(function (t, i) {
              return (
                <div
                  key={i}
                  style={{ display: 'flex', gap: 16, marginBottom: 20, position: 'relative' }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: accentColor,
                      flexShrink: 0,
                      marginTop: 2,
                      border: '3px solid white',
                      boxShadow: `0 0 0 2px ${accentColor}`,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{ fontSize: 12, fontWeight: 800, color: accentColor, marginBottom: 3 }}
                    >
                      {t.year}
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--heading)' }}>
                      {t.event}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PEOPLE */}
      {tab === 'people' && r.people && (
        <div>
          <div style={{ fontSize: 13, color: 'var(--subtext)', marginBottom: 16 }}>
            Notable figures from {r.title}
          </div>
          {r.people.map(function (p, i) {
            const open = expandedPerson === i;
            return (
              <div
                key={i}
                className="c"
                role="button"
                tabIndex={0}
                style={{ marginBottom: 12, cursor: 'pointer' }}
                onClick={() => setExpandedPerson(open ? null : i)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setExpandedPerson(open ? null : i);
                  }
                }}
                aria-expanded={open}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      background: accentColor + '20',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 22,
                      flexShrink: 0,
                    }}
                  >
                    👤
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--info)' }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: 12, color: accentColor, fontWeight: 700 }}>
                      {p.years}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--subtext)' }}>{p.role}</div>
                  </div>
                  <div style={{ fontSize: 16, color: 'var(--subtext)' }}>{open ? '▲' : '▼'}</div>
                </div>
                {open && (
                  <div
                    style={{
                      marginTop: 12,
                      paddingTop: 12,
                      borderTop: '1px solid rgba(0,0,0,.08)',
                    }}
                  >
                    <div style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--subtext)' }}>
                      {p.story}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* LANGUAGE */}
      {tab === 'language' && r.vocab && (
        <div>
          <div style={{ fontSize: 13, color: 'var(--subtext)', marginBottom: 16 }}>
            Local words, dialect terms & cultural vocabulary
          </div>
          {r.vocab.map(function (v, i) {
            return (
              <div
                key={i}
                style={{
                  padding: '14px',
                  background: 'var(--card)',
                  borderRadius: 14,
                  border: '1px solid rgba(0,0,0,.07)',
                  marginBottom: 10,
                  boxShadow: '0 1px 4px rgba(0,0,0,.05)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 16, fontWeight: 900, color: accentColor }}>{v.hr}</span>
                  <span style={{ fontSize: 13, color: 'var(--subtext)', fontWeight: 600 }}>
                    {v.en}
                  </span>
                </div>
                {v.note && (
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--subtext)',
                      lineHeight: 1.5,
                      fontStyle: 'italic',
                    }}
                  >
                    {v.note}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* QUIZ */}
      {tab === 'quiz' && r.quiz && (
        <div>
          {!quizDone ? (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--info)' }}>
                  Question {quizI + 1} / {r.quiz.length}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: accentColor }}>
                  Score: {quizScore}
                </div>
              </div>
              <div
                style={{
                  background: `linear-gradient(135deg,${bgLight},${accentColor}18)`,
                  borderRadius: 16,
                  padding: '20px',
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    lineHeight: 1.5,
                    color: 'var(--heading)',
                  }}
                >
                  {r.quiz[quizI].q}
                </div>
              </div>
              {sh([r.quiz[quizI].a, ...r.quiz[quizI].al]).map(function (opt, i) {
                const chosen = quizSel === opt;
                const correct = opt === r.quiz[quizI].a;
                const revealed = quizSel !== null;
                let bg = 'var(--card)',
                  border = '1px solid var(--card-b)',
                  color = 'var(--heading)';
                if (revealed && correct) {
                  bg = 'var(--success-bg)';
                  border = '2px solid var(--success-b)';
                  color = 'var(--success)';
                } else if (revealed && chosen && !correct) {
                  bg = 'var(--error-bg)';
                  border = '2px solid var(--error-b)';
                  color = 'var(--error)';
                }
                return (
                  <div
                    key={i}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleQuizAnswer(opt)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleQuizAnswer(opt);
                      }
                    }}
                    style={{
                      padding: '14px 16px',
                      background: bg,
                      border,
                      borderRadius: 12,
                      marginBottom: 8,
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 600,
                      color,
                      transition: 'all .2s',
                    }}
                  >
                    {revealed && correct && '✅ '}
                    {revealed && chosen && !correct && '❌ '}
                    {opt}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 20px' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>
                {quizScore >= r.quiz.length * 0.8
                  ? '🏆'
                  : quizScore >= r.quiz.length * 0.5
                    ? '👏'
                    : '📚'}
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: accentColor, marginBottom: 8 }}>
                {quizScore} / {r.quiz.length}
              </div>
              <div style={{ fontSize: 15, color: 'var(--subtext)', marginBottom: 24 }}>
                {quizScore === r.quiz.length
                  ? 'Perfect! You know this region well!'
                  : quizScore >= r.quiz.length * 0.8
                    ? 'Excellent knowledge!'
                    : quizScore >= r.quiz.length * 0.5
                      ? 'Good — read the overview again for the rest.'
                      : 'Review the history sections and try again!'}
              </div>
              <button className="b bp" onClick={resetQuiz}>
                Try Again
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default RegionScreen;
