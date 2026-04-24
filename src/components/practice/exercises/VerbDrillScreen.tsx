import React, { useState, useMemo, useRef } from 'react';
import { H, speak, sh, shMemo } from '../../../data';
import { VERBDRILL, VBPERSONS } from '../../../data';
import { markQuest } from '../../../lib/quests.js';
import { addWordToSRS } from '../../../lib/srs.js';
import { recordTopicResult } from '../../../lib/adaptive.js';

interface VerbEntry {
  inf: string;
  en: string;
  forms: string[];
}
interface QuizQuestion {
  verb: string;
  en: string;
  person: string;
  correct: string;
  opts: string[];
}

// Generate 12 conjugation quiz questions from the verb list
function buildQuiz(verbs: VerbEntry[]): QuizQuestion[] {
  const qs: QuizQuestion[] = [];
  const pool = shMemo('vdqz', verbs, 12);
  pool.forEach((verb: VerbEntry, i: number) => {
    const personIdx = i % 6; // cycle through all 6 persons evenly
    const correct = verb.forms[personIdx] ?? '';
    // Distractors: other forms of the same verb
    const distractors = sh(verb.forms.filter((_: string, fi: number) => fi !== personIdx)).slice(
      0,
      3,
    );
    qs.push({
      verb: verb.inf,
      en: verb.en,
      person: VBPERSONS[personIdx] ?? '',
      correct,
      opts: sh([correct, ...distractors]),
    });
  });
  return qs;
}

interface Props {
  goBack: () => void;
  award: (n: number, celebrate?: boolean, activityType?: string) => void;
}

export default function VerbDrillScreen({ goBack, award }: Props) {
  const [mode, setMode] = useState('reference'); // 'reference' | 'quiz'

  // Quiz state
  const questions = useMemo(() => buildQuiz(VERBDRILL), []);
  const [qi, setQi] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const awardFired = useRef(false);

  function handleAnswer(opt: string) {
    if (answered) return;
    const q = questions[qi]!;
    const isCorrect = opt === q.correct;
    setSelected(opt);
    setAnswered(true);
    recordTopicResult('grammar', isCorrect);
    if (isCorrect) {
      setScore((s) => s + 1);
      speak(opt);
      addWordToSRS(q.verb);
    }
  }

  function next() {
    if (qi < questions.length - 1) {
      setQi((i) => i + 1);
      setAnswered(false);
      setSelected(null);
    } else {
      if (!awardFired.current) {
        awardFired.current = true;
        markQuest('grammar');
        if (typeof award === 'function') award(score * 3 + 10, false, 'grammar');
      }
      setQuizDone(true);
    }
  }

  const verbs = shMemo('vd', VERBDRILL, undefined);

  // ── Reference mode ────────────────────────────────────────────────────────────
  if (mode === 'reference') {
    return (
      <div className="scr-wrap">
        {H('💪 20 Essential Verbs', 'Full present tense conjugation', goBack)}
        <div
          className="c"
          style={{
            marginBottom: 12,
            padding: '10px 14px',
            background: 'rgba(14,116,144,.06)',
            fontSize: 12,
          }}
        >
          💡 Tap any form to hear it. When you're ready, test yourself below!
        </div>
        {verbs.map(function (v: VerbEntry, vi: number) {
          return (
            <div
              key={vi}
              className="c"
              style={{ marginBottom: 10, padding: 0, overflow: 'hidden' }}
            >
              <div
                style={{
                  padding: '8px 14px',
                  background: 'linear-gradient(135deg,#0e7490,#164e63)',
                  color: 'white',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
                onClick={function () {
                  speak(v.inf);
                }}
              >
                <span style={{ fontWeight: 800 }}>{v.inf}</span>
                <span style={{ fontSize: 12, opacity: 0.7 }}>
                  {v.en} <span aria-hidden="true">🔊</span>
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                {v.forms.map(function (f: string, fi: number) {
                  return (
                    <button
                      key={fi}
                      style={{
                        padding: '6px 12px',
                        fontSize: 12,
                        cursor: 'pointer',
                        display: 'flex',
                        gap: 6,
                        background: 'none',
                        border: 'none',
                        borderBottom: '1px solid #f0fdfa',
                        borderRight: fi % 2 === 0 ? '1px solid #f0fdfa' : 'none',
                        fontFamily: "'Outfit',sans-serif",
                        textAlign: 'left',
                      }}
                      onClick={function () {
                        speak(f);
                      }}
                    >
                      <span style={{ fontWeight: 700, color: '#0e7490', minWidth: 50 }}>
                        {VBPERSONS[fi] ?? ''}
                      </span>
                      <span>{f}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* CTA to quiz */}
        <div style={{ marginTop: 8, marginBottom: 24 }}>
          <button
            className="b bp"
            style={{ width: '100%', fontSize: 15 }}
            onClick={() => setMode('quiz')}
          >
            ✏️ Test Your Conjugation →
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
        {H('💪 Conjugation Quiz', '', goBack)}
        <div style={{ textAlign: 'center', padding: '32px 16px' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>
            {pct >= 0.9 ? '🏆' : pct >= 0.7 ? '⭐' : '💪'}
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#164e63', marginBottom: 4 }}>
            {score}/{questions.length} correct
          </div>
          <div style={{ fontSize: 13, color: '#78716c', marginBottom: 16 }}>
            {pct >= 0.9
              ? 'Verb master! Your conjugation is solid.'
              : pct >= 0.7
                ? 'Great progress! Review the ones you missed.'
                : 'Keep drilling — verb forms click with repetition.'}
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#d97706', marginBottom: 24 }}>
            +{score * 3 + 10} XP
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
            <button className="b bp" style={{ flex: 1 }} onClick={goBack}>
              ✓ Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Quiz mode ─────────────────────────────────────────────────────────────────
  const q = questions[qi]!;
  const pctBar = Math.round(((qi + (answered ? 1 : 0)) / questions.length) * 100);

  return (
    <div className="scr-wrap">
      {H('💪 Conjugation Quiz', `Question ${qi + 1} of ${questions.length}`, goBack)}

      {/* Progress bar */}
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
      <div className="c" style={{ marginBottom: 16, padding: '18px 16px', textAlign: 'center' }}>
        <div
          style={{
            fontSize: 12,
            color: '#78716c',
            marginBottom: 6,
            fontWeight: 700,
            letterSpacing: '.05em',
          }}
        >
          CONJUGATE
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#164e63', marginBottom: 4 }}>
          {q.verb}
        </div>
        <div style={{ fontSize: 13, color: '#78716c', marginBottom: 10 }}>{q.en}</div>
        <div
          style={{
            display: 'inline-block',
            background: '#0e7490',
            color: 'white',
            fontSize: 15,
            fontWeight: 800,
            padding: '6px 18px',
            borderRadius: 20,
          }}
        >
          {q.person} + ?
        </div>
      </div>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {q.opts.map((o, oi) => {
          let bg = 'white',
            bc = '#e7e5e4',
            col = '#1c1917',
            fw = 600;
          if (answered) {
            if (o === q.correct) {
              bg = '#dcfce7';
              bc = '#16a34a';
              col = '#14532d';
              fw = 800;
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
                padding: '14px 16px',
                border: `2px solid ${bc}`,
                borderRadius: 12,
                background: bg,
                color: col,
                fontSize: 16,
                fontWeight: fw,
                cursor: answered ? 'default' : 'pointer',
                fontFamily: "'Outfit',sans-serif",
                transition: 'all .15s',
              }}
            >
              {o}
              {answered && o === q.correct && <span style={{ float: 'right' }}>✓</span>}
            </button>
          );
        })}
      </div>

      {/* Post-answer feedback */}
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
            ? `✓ "${q.person} ${q.correct}" — tap the answer to hear it again`
            : `The correct form is "${q.person} ${q.correct}". The ending pattern follows verb class rules.`}
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
