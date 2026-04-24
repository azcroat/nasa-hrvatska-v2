import React, { useState, useMemo, useRef } from 'react';
import { H, ALPHA, speak, sh } from '../../data';
import { markQuest } from '../../lib/quests.js';
import { useStats } from '../../context/StatsContext.tsx';

interface AlphaQuizQuestion {
  prompt: string;
  promptEn: string;
  ipa: string;
  correct: string;
  opts: string[];
}

// Build 10 quiz questions: hear a description → pick the letter
function buildAlphaQuiz(alpha: string[][]): AlphaQuizQuestion[] {
  // Pick 10 letters spread across the alphabet
  const pool = sh([...alpha]).slice(0, 10);
  return pool.map((letter: string[]) => {
    const distractors = sh(alpha.filter((l: string[]) => l[0] !== letter[0])).slice(0, 3);
    return {
      prompt: letter[2] ?? '',
      promptEn: letter[3] ?? '',
      ipa: letter[1] ?? '',
      correct: letter[0] ?? '',
      opts: sh([letter[0] ?? '', ...distractors.map((d: string[]) => d[0] ?? '')]),
    };
  });
}

interface Props {
  goBack: () => void;
  award?: (xp: number, celebrate?: boolean, activityType?: string) => void;
}

export default function AlphabetScreen({ goBack, award }: Props) {
  const { stats, setStats, writeDelta } = useStats();
  const [mode, setMode] = useState('reference'); // 'reference' | 'quiz'

  // Quiz state
  const questions = useMemo(() => buildAlphaQuiz(ALPHA), []);
  const [qi, setQi] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const [learnedCount, setLearnedCount] = useState(0);
  const learnedRef = useRef(new Set());
  const awardFired = useRef(false);

  function markLearned(letter: string) {
    if (!learnedRef.current.has(letter)) {
      learnedRef.current.add(letter);
      setLearnedCount(learnedRef.current.size);
    }
  }

  function handleAnswer(opt: string) {
    if (answered) return;
    const q = questions[qi];
    if (!q) return;
    const isCorrect = opt === q.correct;
    setSelected(opt);
    setAnswered(true);
    if (isCorrect) {
      setScore((s) => s + 1);
      speak(q.prompt);
    }
  }

  function next() {
    if (qi < questions.length - 1) {
      setQi((i) => i + 1);
      setAnswered(false);
      setSelected(null);
    } else {
      markQuest('grammar');
      setQuizDone(true);
    }
  }

  // ── Reference mode ────────────────────────────────────────────────────────────
  if (mode === 'reference') {
    return (
      <div className="scr-wrap">
        {H('🔤 Croatian Alphabet', '30 letters — perfectly phonetic!', goBack)}

        {learnedCount > 0 && (
          <div
            style={{
              marginBottom: 12,
              padding: '8px 14px',
              background: 'rgba(22,163,74,.08)',
              borderRadius: 10,
              fontSize: 12,
              color: '#15803d',
              fontWeight: 700,
            }}
          >
            ✓ You've tapped {learnedCount}/30 letters
          </div>
        )}

        <div
          className="c"
          style={{
            marginBottom: 12,
            padding: '10px 14px',
            background: 'rgba(14,116,144,.06)',
            fontSize: 12,
          }}
        >
          💡 Croatian spelling is <strong>100% phonetic</strong> — every letter always makes exactly
          one sound. Tap each letter to hear it.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {ALPHA.map((l, i) => (
            <button
              key={i}
              className="c"
              style={{
                padding: '12px 16px',
                border: learnedRef.current.has(l[0])
                  ? '2px solid #16a34a'
                  : '1px solid var(--card-b)',
                background: learnedRef.current.has(l[0]) ? 'rgba(22,163,74,.05)' : 'var(--card)',
              }}
              onClick={() => {
                speak(l[2] ?? '');
                markLearned(l[0] ?? '');
              }}
            >
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: learnedRef.current.has(l[0]) ? '#16a34a' : '#164e63',
                    fontFamily: 'monospace',
                    minWidth: 55,
                  }}
                >
                  {l[0]}
                  {learnedRef.current.has(l[0]) ? ' ✓' : ''}
                </span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: '#0e7490', fontWeight: 700 }}>{l[1]}</div>
                  <div style={{ fontSize: 13 }}>
                    {l[2]} <span style={{ color: '#78716c', fontSize: 11 }}>({l[3]})</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div style={{ marginTop: 16, marginBottom: 24 }}>
          <button
            className="b bp"
            style={{ width: '100%', fontSize: 15 }}
            onClick={() => setMode('quiz')}
          >
            🎯 Test the Alphabet →
          </button>
        </div>
      </div>
    );
  }

  // ── Quiz done ─────────────────────────────────────────────────────────────────
  if (quizDone) {
    const pct = score / questions.length;
    return (
      <div className="scr-wrap">
        {H('🔤 Alphabet Quiz', '', goBack)}
        <div style={{ textAlign: 'center', padding: '32px 16px' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>
            {pct >= 0.9 ? '🏆' : pct >= 0.7 ? '⭐' : '💪'}
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#164e63', marginBottom: 4 }}>
            {score}/{questions.length} correct
          </div>
          <div style={{ fontSize: 13, color: '#78716c', marginBottom: 24 }}>
            {pct >= 0.9
              ? 'You know the Croatian alphabet! Each letter → one sound.'
              : pct >= 0.7
                ? 'Good work! Practice the tricky ones: č, š, ž, lj, nj.'
                : 'Review the letters and try again — it gets easier fast!'}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="b bg"
              style={{ flex: 1 }}
              onClick={() => {
                setMode('reference');
              }}
            >
              📖 Review
            </button>
            <button
              className="b bp"
              style={{ flex: 1 }}
              onClick={() => {
                if (!awardFired.current) {
                  awardFired.current = true;
                  if (typeof award === 'function') award(20, false, 'vocabulary');
                }
                if (!stats.vs?.includes('alphabet')) {
                  setStats((prev) => {
                    if (prev.vs?.includes('alphabet')) return prev;
                    return {
                      ...prev,
                      lc: (prev.lc || 0) + 1,
                      vs: [...(prev.vs || []), 'alphabet'],
                    };
                  });
                  if (writeDelta) writeDelta({ lc: 1, vs: ['alphabet'] });
                }
                goBack();
              }}
            >
              ✓ Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Quiz mode ─────────────────────────────────────────────────────────────────
  const q = questions[qi];
  if (!q) return null;
  const pctBar = Math.round(((qi + (answered ? 1 : 0)) / questions.length) * 100);

  return (
    <div className="scr-wrap">
      {H('🔤 Alphabet Quiz', `Question ${qi + 1} of ${questions.length}`, goBack)}

      <div
        style={{
          height: 6,
          borderRadius: 99,
          background: 'rgba(14,116,144,.12)',
          marginBottom: 20,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pctBar}%`,
            borderRadius: 99,
            background: 'linear-gradient(90deg,#0e7490,#06b6d4)',
            transition: 'width .3s',
          }}
        />
      </div>

      {/* Question */}
      <div className="c" style={{ marginBottom: 16, padding: '20px 16px', textAlign: 'center' }}>
        <div
          style={{
            fontSize: 12,
            color: '#78716c',
            marginBottom: 8,
            fontWeight: 700,
            letterSpacing: '.05em',
          }}
        >
          WHICH LETTER SOUNDS LIKE THIS?
        </div>
        <div style={{ fontSize: 13, color: '#78716c', marginBottom: 6 }}>
          The word <strong style={{ color: '#164e63' }}>{q.prompt}</strong> ({q.promptEn}) starts
          with the sound:
        </div>
        <button
          onClick={() => speak(q.prompt)}
          style={{
            fontSize: 18,
            fontWeight: 900,
            color: '#0e7490',
            background: 'rgba(14,116,144,.08)',
            border: '2px solid rgba(14,116,144,.2)',
            borderRadius: 12,
            padding: '12px 28px',
            cursor: 'pointer',
            fontFamily: "'Outfit',sans-serif",
          }}
        >
          🔊 {q.ipa}
        </button>
      </div>

      {/* Letter options */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {q.opts.map((o, oi) => {
          let bg = 'white',
            bc = '#e7e5e4',
            col = '#1c1917';
          if (answered) {
            if (o === q.correct) {
              bg = '#dcfce7';
              bc = '#16a34a';
              col = '#14532d';
            } else if (o === selected) {
              bg = '#fee2e2';
              bc = '#dc2626';
              col = '#7f1d1d';
            }
          }
          return (
            <button
              key={oi}
              onClick={() => handleAnswer(o)}
              style={{
                padding: '18px 8px',
                border: `2px solid ${bc}`,
                borderRadius: 14,
                background: bg,
                color: col,
                fontSize: 22,
                fontWeight: 800,
                cursor: answered ? 'default' : 'pointer',
                fontFamily: 'monospace',
                transition: 'all .15s',
                textAlign: 'center',
              }}
            >
              {o}
            </button>
          );
        })}
      </div>

      {answered && (
        <div
          style={{
            marginTop: 12,
            padding: '10px 14px',
            borderRadius: 10,
            background: selected === q.correct ? 'rgba(22,163,74,.07)' : 'rgba(220,38,38,.06)',
            border: `1px solid ${selected === q.correct ? 'rgba(22,163,74,.2)' : 'rgba(220,38,38,.15)'}`,
            fontSize: 12,
            color: '#44403c',
          }}
        >
          {selected === q.correct
            ? `✓ "${q.correct}" always sounds ${q.ipa}`
            : `✗ It's "${q.correct}" — always sounds ${q.ipa}. In "${q.prompt}" (${q.promptEn}).`}
        </div>
      )}

      {answered && (
        <button className="b bp" style={{ width: '100%', marginTop: 12 }} onClick={next}>
          {qi < questions.length - 1 ? 'Next →' : 'See Results'}
        </button>
      )}

      <button
        style={{
          display: 'block',
          width: '100%',
          marginTop: 10,
          padding: '8px',
          border: 'none',
          background: 'none',
          fontSize: 12,
          color: '#78716c',
          cursor: 'pointer',
          textDecoration: 'underline',
        }}
        onClick={() => setMode('reference')}
      >
        Back to reference
      </button>
    </div>
  );
}
