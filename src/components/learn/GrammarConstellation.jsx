import { useState } from 'react';
import { markQuest } from '../../lib/quests.js';

const CASES = [
  {
    id: 'nominativ', name: 'Nominativ', abbr: 'NOM', color: '#0e7490',
    question: 'WHO? WHAT? (subject)',
    shortDesc: 'The subject of the sentence — who does the action',
    pattern: 'Base form: žena, muž, dijete',
    examples: [
      { hr: 'Žena čita.', en: 'The woman reads.' },
      { hr: 'Muž spava.', en: 'The husband sleeps.' },
    ],
    tip: 'This is the dictionary form. No change needed.',
    endings: { m: '-', f: '-a', n: '-o/-e' },
  },
  {
    id: 'genitiv', name: 'Genitiv', abbr: 'GEN', color: '#7c3aed',
    question: 'OF WHO? OF WHAT? (possession, quantity)',
    shortDesc: 'Possession, negation, quantity — "of" in English',
    pattern: 'M/N: +-a, F: -e',
    examples: [
      { hr: 'Kuća prijatelja.', en: "The friend's house." },
      { hr: 'Čaša vode.', en: 'A glass of water.' },
    ],
    tip: 'After nema (there is no), bez (without), od (from/of)',
    endings: { m: '-a', f: '-e', n: '-a' },
  },
  {
    id: 'dativ', name: 'Dativ', abbr: 'DAT', color: '#b45309',
    question: 'TO WHO? FOR WHO? (recipient)',
    shortDesc: 'The recipient of an action — giving, sending, saying TO someone',
    pattern: 'M/N: +-u, F: -i',
    examples: [
      { hr: 'Dajem prijatelju.', en: 'I give to the friend.' },
      { hr: 'Kažem majci.', en: 'I say to (my) mother.' },
    ],
    tip: 'After k/ka (towards), nasuprot (opposite), zahvaljujući (thanks to)',
    endings: { m: '-u', f: '-i', n: '-u' },
  },
  {
    id: 'akuzativ', name: 'Akuzativ', abbr: 'ACC', color: '#dc2626',
    question: 'WHO? WHAT? (direct object)',
    shortDesc: 'The direct object — what the action is done TO',
    pattern: 'M animate: -a, F: -u, N: same as NOM',
    examples: [
      { hr: 'Vidim muža.', en: 'I see the husband.' },
      { hr: 'Čitam knjigu.', en: 'I read a book.' },
    ],
    tip: 'Most common case after verbs. Also after: u, na, kroz, za (movement)',
    endings: { m: '-a (anim)', f: '-u', n: '= NOM' },
  },
  {
    id: 'vokativ', name: 'Vokativ', abbr: 'VOC', color: '#16a34a',
    question: 'ADDRESSING someone directly',
    shortDesc: 'Calling someone by name or title — direct address',
    pattern: 'M: -e/-u, F: -o/-e',
    examples: [
      { hr: 'Marko! Dođi!', en: 'Marko! Come here!' },
      { hr: 'Mama, jesi li tu?', en: 'Mum, are you there?' },
    ],
    tip: 'Used when calling out to someone. Often same as nominative in speech.',
    endings: { m: '-e/-u', f: '-o/-e', n: '= NOM' },
  },
  {
    id: 'lokativ', name: 'Lokativ', abbr: 'LOC', color: '#0284c7',
    question: 'WHERE? ABOUT WHAT? (location, topic)',
    shortDesc: 'Location and topic — always used WITH a preposition',
    pattern: 'M/N: +-u, F: -i',
    examples: [
      { hr: 'U gradu.', en: 'In the city.' },
      { hr: 'Govorim o prijatelju.', en: 'I speak about the friend.' },
    ],
    tip: 'ALWAYS with: u (in), na (on/at), o (about), po (around), pri (by)',
    endings: { m: '-u', f: '-i', n: '-u' },
  },
  {
    id: 'instrumental', name: 'Instrumental', abbr: 'INS', color: '#78716c',
    question: 'WITH WHAT? BY WHAT MEANS?',
    shortDesc: 'The instrument or companion — doing something WITH something',
    pattern: 'M/N: +-om/-em, F: +-om/-om',
    examples: [
      { hr: 'Pišem olovkom.', en: 'I write with a pencil.' },
      { hr: 'Idem s prijateljem.', en: 'I go with a friend.' },
    ],
    tip: 'After s/sa (with), pred (in front of), između (between), nad (above)',
    endings: { m: '-om', f: '-om', n: '-om' },
  },
];

const QUIZ = [
  { q: 'Tko spava? (Who sleeps?) — Which case?', answer: 'nominativ', options: ['nominativ', 'akuzativ', 'dativ', 'genitiv'] },
  { q: 'Čaša ___. (A glass of water) — Which case is "water" in?', answer: 'genitiv', options: ['genitiv', 'lokativ', 'instrumental', 'akuzativ'] },
  { q: 'Dajem ___. (I give to my friend) — Which case?', answer: 'dativ', options: ['dativ', 'nominativ', 'akuzativ', 'vokativ'] },
  { q: 'Vidim ___. (I see him) — Which case?', answer: 'akuzativ', options: ['akuzativ', 'nominativ', 'genitiv', 'instrumental'] },
  { q: 'Zdravo, ___! (Hello, [friend name]!) — Which case?', answer: 'vokativ', options: ['vokativ', 'nominativ', 'dativ', 'lokativ'] },
  { q: 'U ___. (In the city) — Which case?', answer: 'lokativ', options: ['lokativ', 'akuzativ', 'dativ', 'instrumental'] },
  { q: 'Pišem ___. (I write with a pencil) — Which case?', answer: 'instrumental', options: ['instrumental', 'lokativ', 'genitiv', 'nominativ'] },
];

function ConstellationBackground() {
  const points = [
    [60, 40], [180, 80], [300, 30], [420, 70], [520, 45], [640, 85], [740, 50],
    [100, 150], [250, 130], [380, 160], [500, 120], [620, 155], [720, 130],
    [40, 220], [160, 200], [320, 240], [460, 210], [580, 230], [700, 200],
  ];
  const connections = [
    [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6],
    [7, 8], [8, 9], [9, 10], [10, 11], [11, 12],
    [0, 7], [2, 8], [4, 10], [6, 12],
    [7, 13], [8, 14], [9, 15], [10, 16], [11, 17], [12, 18],
  ];

  return (
    <svg
      style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        opacity: 0.12, pointerEvents: 'none',
      }}
      viewBox="0 0 780 280"
      preserveAspectRatio="xMidYMid slice"
    >
      {connections.map(([a, b], i) => (
        <line
          key={i}
          x1={points[a][0]} y1={points[a][1]}
          x2={points[b][0]} y2={points[b][1]}
          stroke="#60a5fa" strokeWidth="0.8"
        />
      ))}
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 2.5 : 1.5} fill="#93c5fd" />
      ))}
    </svg>
  );
}

function EndingsTable({ endings }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
      {[['M', endings.m], ['F', endings.f], ['N', endings.n]].map(([label, val]) => (
        <div
          key={label}
          style={{
            flex: 1, background: '#f1f5f9', borderRadius: 6,
            padding: '4px 0', textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, marginBottom: 2 }}>{label}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', fontFamily: 'monospace' }}>{val}</div>
        </div>
      ))}
    </div>
  );
}

function CaseCard({ caseData, expanded, onToggle }) {
  const { name, abbr, color, question, shortDesc, pattern, examples, tip, endings } = caseData;

  return (
    <div
      onClick={onToggle}
      style={{
        background: '#ffffff',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: expanded
          ? `0 4px 20px ${color}33, 0 1px 4px rgba(0,0,0,0.08)`
          : '0 1px 4px rgba(0,0,0,0.08)',
        border: `2px solid ${expanded ? color : '#e2e8f0'}`,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        gridColumn: caseData.id === 'instrumental' ? '1 / -1' : undefined,
      }}
    >
      {/* Card header */}
      <div
        style={{
          background: color,
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            background: 'rgba(255,255,255,0.25)',
            color: '#fff',
            fontWeight: 800,
            fontSize: 11,
            padding: '2px 7px',
            borderRadius: 20,
            letterSpacing: '0.05em',
          }}
        >
          {abbr}
        </span>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 15, flex: 1 }}>{name}</span>
        <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, lineHeight: 1 }}>
          {expanded ? '▲' : '▼'}
        </span>
      </div>

      {/* Question */}
      <div style={{ padding: '8px 12px 6px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: color, lineHeight: 1.3 }}>
          {question}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ padding: '0 12px 12px', borderTop: `1px solid #f1f5f9` }}>
          <p style={{ margin: '8px 0 6px', fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
            {shortDesc}
          </p>

          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6, fontStyle: 'italic' }}>
            {pattern}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
            {examples.map((ex, i) => (
              <div
                key={i}
                style={{
                  background: '#f8fafc',
                  borderLeft: `3px solid ${color}`,
                  borderRadius: '0 6px 6px 0',
                  padding: '5px 8px',
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{ex.hr}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{ex.en}</div>
              </div>
            ))}
          </div>

          <EndingsTable endings={endings} />

          <div
            style={{
              marginTop: 8,
              background: `${color}12`,
              border: `1px solid ${color}30`,
              borderRadius: 8,
              padding: '6px 10px',
              fontSize: 12,
              color: '#374151',
              lineHeight: 1.5,
            }}
          >
            <span style={{ fontWeight: 700, color: color }}>Tip: </span>{tip}
          </div>
        </div>
      )}
    </div>
  );
}

export default function GrammarConstellation({ goBack, award }) {
  const [mode, setMode] = useState('explore');
  const [expandedCase, setExpandedCase] = useState(null);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [awardCalled, setAwardCalled] = useState(false);

  function toggleCase(id) {
    setExpandedCase(prev => (prev === id ? null : id));
  }

  function startQuiz() {
    setMode('quiz');
    setQuizIdx(0);
    setQuizScore(0);
    setSelected(null);
    setAnswered(false);
  }

  function handleAnswer(opt) {
    if (answered) return;
    setSelected(opt);
    setAnswered(true);
    if (opt === QUIZ[quizIdx].answer) {
      setQuizScore(s => s + 1);
    }
  }

  function handleNext() {
    if (quizIdx < QUIZ.length - 1) {
      setQuizIdx(i => i + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      setMode('done');
      const finalScore = quizScore + (selected === QUIZ[quizIdx].answer ? 1 : 0);
      if (!awardCalled) {
        setAwardCalled(true);
        if (typeof award === 'function') award(finalScore * 10);
        markQuest('grammar');
      }
    }
  }

  function getDoneMessage(score) {
    if (score === 7) return 'Perfect! You know all 7 cases!';
    if (score >= 5) return 'Great work! Almost there!';
    if (score >= 3) return 'Good start — keep practising!';
    return 'Keep exploring the cases and try again!';
  }

  const currentQ = QUIZ[quizIdx];

  // Compute final score for done screen
  const finalScore = mode === 'done'
    ? quizScore
    : quizScore;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #0f172a 0%, #1e293b 50%, #0c1a2e 100%)',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <ConstellationBackground />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 600,
          margin: '0 auto',
          padding: '16px 16px 80px',
        }}
      >
        {/* ── EXPLORE MODE ─────────────────────────────────── */}
        {mode === 'explore' && (
          <>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <button
                onClick={goBack}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: 8,
                  color: '#cbd5e1',
                  fontSize: 20,
                  width: 38,
                  height: 38,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                ←
              </button>
              <h1 style={{ margin: 0, color: '#f1f5f9', fontSize: 20, fontWeight: 800 }}>
                ⭐ Grammar Constellation
              </h1>
            </div>

            <p style={{ color: '#94a3b8', fontSize: 14, margin: '0 0 18px 50px', lineHeight: 1.5 }}>
              Croatian has 7 cases. Each one answers a different question.
              Tap a card to explore it.
            </p>

            {/* Case grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
                marginBottom: 20,
              }}
            >
              {CASES.map(c => (
                <CaseCard
                  key={c.id}
                  caseData={c}
                  expanded={expandedCase === c.id}
                  onToggle={() => toggleCase(c.id)}
                />
              ))}
            </div>

            {/* Start quiz button */}
            <button
              onClick={startQuiz}
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                border: 'none',
                borderRadius: 12,
                color: '#fff',
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
                letterSpacing: '0.02em',
              }}
            >
              Start Quiz →
            </button>
          </>
        )}

        {/* ── QUIZ MODE ────────────────────────────────────── */}
        {mode === 'quiz' && (
          <>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <button
                onClick={() => setMode('explore')}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: 8,
                  color: '#cbd5e1',
                  fontSize: 20,
                  width: 38,
                  height: 38,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                ←
              </button>
              <div>
                <h1 style={{ margin: 0, color: '#f1f5f9', fontSize: 18, fontWeight: 800 }}>
                  Case Quiz
                </h1>
                <div style={{ color: '#64748b', fontSize: 13 }}>
                  Question {quizIdx + 1} of 7
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div
              style={{
                height: 6,
                background: 'rgba(255,255,255,0.1)',
                borderRadius: 3,
                marginBottom: 24,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${((quizIdx) / 7) * 100}%`,
                  background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                  borderRadius: 3,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>

            {/* Question card */}
            <div
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 16,
                padding: '24px 20px',
                marginBottom: 20,
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: '#f1f5f9',
                  fontSize: 18,
                  fontWeight: 600,
                  lineHeight: 1.5,
                  textAlign: 'center',
                }}
              >
                {currentQ.q}
              </p>
            </div>

            {/* Answer options — 2x2 grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
                marginBottom: 20,
              }}
            >
              {currentQ.options.map(opt => {
                const isCorrect = opt === currentQ.answer;
                const isSelected = opt === selected;

                let bg = 'rgba(255,255,255,0.07)';
                let border = '1px solid rgba(255,255,255,0.12)';
                let color = '#e2e8f0';
                let textColor = '#e2e8f0';

                if (answered) {
                  if (isCorrect) {
                    bg = '#14532d';
                    border = '2px solid #22c55e';
                    color = '#22c55e';
                    textColor = '#bbf7d0';
                  } else if (isSelected && !isCorrect) {
                    bg = '#450a0a';
                    border = '2px solid #ef4444';
                    color = '#ef4444';
                    textColor = '#fecaca';
                  }
                } else if (isSelected) {
                  bg = 'rgba(99,102,241,0.2)';
                  border = '2px solid #6366f1';
                }

                // Find the case color for the correct answer label
                const caseInfo = CASES.find(c => c.id === opt);
                const dotColor = caseInfo ? caseInfo.color : '#94a3b8';

                return (
                  <button
                    key={opt}
                    onClick={() => handleAnswer(opt)}
                    disabled={answered}
                    style={{
                      background: bg,
                      border,
                      borderRadius: 12,
                      padding: '12px 10px',
                      cursor: answered ? 'default' : 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: dotColor,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: textColor,
                        textTransform: 'capitalize',
                      }}
                    >
                      {opt}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Feedback + Next */}
            {answered && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: selected === currentQ.answer
                    ? 'rgba(34,197,94,0.1)'
                    : 'rgba(239,68,68,0.1)',
                  border: `1px solid ${selected === currentQ.answer ? '#22c55e' : '#ef4444'}`,
                  borderRadius: 12,
                  padding: '12px 16px',
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 14,
                      color: selected === currentQ.answer ? '#22c55e' : '#ef4444',
                    }}
                  >
                    {selected === currentQ.answer ? '✓ Correct!' : '✗ Not quite'}
                  </div>
                  {selected !== currentQ.answer && (
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                      Answer: <span style={{ color: '#f1f5f9', fontWeight: 600, textTransform: 'capitalize' }}>{currentQ.answer}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleNext}
                  style={{
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    border: 'none',
                    borderRadius: 8,
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 700,
                    padding: '8px 16px',
                    cursor: 'pointer',
                  }}
                >
                  {quizIdx < QUIZ.length - 1 ? 'Next →' : 'Finish'}
                </button>
              </div>
            )}
          </>
        )}

        {/* ── DONE MODE ────────────────────────────────────── */}
        {mode === 'done' && (
          <>
            {/* Score card */}
            <div
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 20,
                padding: '36px 24px',
                textAlign: 'center',
                marginBottom: 20,
                marginTop: 16,
              }}
            >
              {/* Stars display */}
              <div style={{ fontSize: 40, marginBottom: 12 }}>
                {Array.from({ length: 7 }, (_, i) => (
                  <span
                    key={i}
                    style={{
                      color: i < finalScore ? '#facc15' : '#334155',
                      filter: i < finalScore ? 'drop-shadow(0 0 6px #facc15)' : 'none',
                    }}
                  >
                    ★
                  </span>
                ))}
              </div>

              <div style={{ color: '#f1f5f9', fontSize: 48, fontWeight: 900, lineHeight: 1, marginBottom: 8 }}>
                {finalScore}<span style={{ fontSize: 24, color: '#64748b', fontWeight: 400 }}>/7</span>
              </div>

              <div style={{ color: '#cbd5e1', fontSize: 18, fontWeight: 600, marginBottom: 6 }}>
                {getDoneMessage(finalScore)}
              </div>

              <div style={{ color: '#64748b', fontSize: 13 }}>
                +{finalScore * 10} points earned
              </div>
            </div>

            {/* Case summary — quick reminder */}
            <div
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 14,
                padding: '14px 16px',
                marginBottom: 20,
              }}
            >
              <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, marginBottom: 10, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Quick Reference
              </div>
              {CASES.map(c => (
                <div
                  key={c.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '5px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <span
                    style={{
                      background: c.color,
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: 10,
                      minWidth: 32,
                      textAlign: 'center',
                    }}
                  >
                    {c.abbr}
                  </span>
                  <span style={{ color: '#cbd5e1', fontSize: 13, flex: 1 }}>{c.name}</span>
                  <span style={{ color: '#475569', fontSize: 11 }}>{c.question.split('(')[0].trim()}</span>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setMode('explore')}
                style={{
                  flex: 1,
                  padding: '13px',
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 12,
                  color: '#e2e8f0',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Review Cases
              </button>
              <button
                onClick={goBack}
                style={{
                  flex: 1,
                  padding: '13px',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  border: 'none',
                  borderRadius: 12,
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
                }}
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
