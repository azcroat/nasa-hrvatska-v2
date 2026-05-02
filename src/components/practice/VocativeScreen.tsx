import React, { useState, useRef } from 'react';
import { H, Bar, VOCATIVE } from '../../data';
import { speak } from '../../lib/audio.js';
import { markQuest } from '../../lib/quests.js';

// Shuffle helper
function sh<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = b[i] as T;
    b[i] = b[j] as T;
    b[j] = tmp;
  }
  return b;
}

export default function VocativeScreen({
  goBack,
  award,
}: {
  goBack: () => void;
  award?: (xp: number, celebrate?: boolean, activityType?: string) => void;
}) {
  const [phase, setPhase] = useState('rules'); // rules | dialogues | quiz | done
  const [quizQ] = useState(() => sh(VOCATIVE.quiz));
  const [qi, setQi] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [dIdx, setDIdx] = useState(0);
  const finishFired = useRef(false);

  const total = quizQ.length;
  const pct = Math.round((score / total) * 100);

  // ── Phase: Rules ───────────────────────────────────────────────────────────
  if (phase === 'rules') {
    return (
      <div className="scr-wrap">
        {H('📣 Vocative Case', 'Vokativ — Direct Address', goBack)}

        <div
          className="c"
          style={{
            marginBottom: 16,
            padding: '14px 16px',
            background: 'var(--info-bg)',
            border: '1px solid var(--info-b)',
            borderRadius: 12,
          }}
        >
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--info)' }}>
            {VOCATIVE.intro}
          </p>
        </div>

        {VOCATIVE.rules.map((rule, ri) => (
          <div key={ri} className="c" style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
              <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--heading)' }}>
                {rule.pattern}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 20,
                  background: 'var(--warning-bg)',
                  color: 'var(--warning)',
                  border: '1px solid var(--warning-b)',
                }}
              >
                {rule.transform}
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {rule.examples.map((ex: string[], ei: number) => {
                const [base, voc] = ex;
                return (
                  <div
                    key={ei}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'var(--app-bg)',
                      borderRadius: 8,
                      padding: '4px 10px',
                      border: '1px solid var(--card-b)',
                      fontSize: 13,
                    }}
                  >
                    <span style={{ color: 'var(--subtext)', textDecoration: 'line-through' }}>
                      {base}
                    </span>
                    <span style={{ color: 'var(--subtext)' }}>→</span>
                    <button
                      style={{
                        fontWeight: 800,
                        color: 'var(--success)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        fontSize: 13,
                        fontFamily: 'inherit',
                      }}
                      onClick={() => speak(voc ?? '')}
                    >
                      {voc}!
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <button
          className="b bp"
          style={{ width: '100%', marginTop: 8 }}
          onClick={() => setPhase('dialogues')}
        >
          Practice with dialogues →
        </button>
      </div>
    );
  }

  // ── Phase: Dialogues ──────────────────────────────────────────────────────
  if (phase === 'dialogues') {
    const d = VOCATIVE.dialogues[dIdx]!;
    const isLast = dIdx === VOCATIVE.dialogues.length - 1;
    return (
      <div className="scr-wrap">
        {H('📣 Vocative Case', `Dialogue ${dIdx + 1} of ${VOCATIVE.dialogues.length}`, goBack)}

        <div
          style={{
            textAlign: 'center',
            marginBottom: 12,
            color: 'var(--subtext)',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {d.ctx}
        </div>

        <div className="c" style={{ marginBottom: 10 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--error)',
              textTransform: 'uppercase',
              letterSpacing: 1,
              marginBottom: 6,
            }}
          >
            ✗ Common mistake
          </div>
          <div style={{ fontSize: 17, color: 'var(--error)', fontWeight: 600 }}>{d.wrong}</div>
        </div>

        <div
          className="c"
          style={{
            marginBottom: 10,
            background: 'var(--success-bg)',
            border: '1px solid var(--success-b)',
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--success)',
              textTransform: 'uppercase',
              letterSpacing: 1,
              marginBottom: 6,
            }}
          >
            ✓ Correct Croatian
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 17, color: 'var(--success)', fontWeight: 700 }}>
              {d.correct}
            </div>
            <button
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 18,
                padding: 0,
              }}
              onClick={() => speak(d.correct)}
              aria-label="Hear pronunciation"
            >
              🔊
            </button>
          </div>
        </div>

        <div
          style={{
            fontSize: 13,
            color: 'var(--subtext)',
            fontStyle: 'italic',
            marginBottom: 16,
            padding: '8px 12px',
            background: 'var(--app-bg)',
            borderRadius: 8,
            border: '1px solid var(--card-b)',
          }}
        >
          💡 {d.note}
        </div>

        <button
          className="b bp"
          style={{ width: '100%' }}
          onClick={() => {
            if (isLast) setPhase('quiz');
            else setDIdx(dIdx + 1);
          }}
        >
          {isLast ? 'Start Quiz →' : 'Next example →'}
        </button>
      </div>
    );
  }

  // ── Phase: Quiz ───────────────────────────────────────────────────────────
  if (phase === 'quiz') {
    if (qi >= total) {
      // Show results inline, then transition to done
      if ((phase as string) !== 'done') {
        setTimeout(() => setPhase('done'), 0);
      }
      return null;
    }

    const q = quizQ[qi]!;
    const opts = sh([q.a, ...q.al]);

    return (
      <div className="scr-wrap">
        {H('📣 Vocative Quiz', `Question ${qi + 1} of ${total}`, goBack)}

        <Bar v={qi} mx={total} />

        <div
          className="c"
          style={{
            margin: '16px 0',
            minHeight: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <p
            style={{
              fontSize: 18,
              fontWeight: 700,
              textAlign: 'center',
              color: 'var(--heading)',
              margin: 0,
            }}
          >
            {q.q}
          </p>
        </div>

        <div style={{ display: 'grid', gap: 8 }}>
          {opts.map((o, oi) => {
            const isCorrect = o === q.a;
            const isSelected = answered && o === selected;
            return (
              <button
                key={oi}
                className="ob"
                style={{
                  textAlign: 'center',
                  padding: '13px 16px',
                  fontSize: 16,
                  fontWeight: 600,
                  background: answered
                    ? isCorrect
                      ? 'var(--success-bg)'
                      : isSelected
                        ? 'var(--error-bg)'
                        : 'var(--card)'
                    : 'var(--card)',
                  borderColor: answered
                    ? isCorrect
                      ? 'var(--success-b)'
                      : isSelected
                        ? 'var(--error-b)'
                        : 'var(--card-b)'
                    : 'var(--card-b)',
                  color: answered
                    ? isCorrect
                      ? 'var(--success)'
                      : isSelected
                        ? 'var(--error)'
                        : 'var(--subtext)'
                    : 'var(--heading)',
                }}
                onClick={() => {
                  if (answered) return;
                  setSelected(o);
                  setAnswered(true);
                  if (isCorrect) {
                    setScore((s) => s + 1);
                    speak(o).catch(() => {});
                  }
                }}
              >
                {o}
                {answered && isCorrect && ' ✓'}
                {answered && isSelected && !isCorrect && ' ✗'}
              </button>
            );
          })}
        </div>

        {answered && (
          <button
            className="b bp"
            style={{ width: '100%', marginTop: 16 }}
            onClick={() => {
              setAnswered(false);
              setSelected(null);
              setQi(qi + 1);
              if (qi + 1 >= total) setPhase('done');
            }}
          >
            {qi + 1 < total ? 'Next →' : 'See results →'}
          </button>
        )}
      </div>
    );
  }

  // ── Phase: Done ───────────────────────────────────────────────────────────
  const xpEarned = score * 8;
  const passed = pct >= 70;
  return (
    <div className="scr-wrap">
      {H('📣 Vocative Case', 'Complete!', goBack)}

      <div style={{ textAlign: 'center', paddingTop: 24 }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>
          {passed ? (pct === 100 ? '🏆' : '🎉') : '📚'}
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 900, margin: '0 0 4px', color: 'var(--heading)' }}>
          {score} / {total}
        </h2>
        <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--warning)', marginBottom: 8 }}>
          +{xpEarned} XP
        </div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            padding: '6px 16px',
            borderRadius: 20,
            display: 'inline-block',
            background: passed ? 'var(--success-bg)' : 'var(--error-bg)',
            color: passed ? 'var(--success)' : 'var(--error)',
            border: `1px solid ${passed ? 'var(--success-b)' : 'var(--error-b)'}`,
            marginBottom: 16,
          }}
        >
          {passed ? '✓ Vocative mastered' : 'Review the rules and try again'}
        </div>

        {!passed && (
          <div style={{ marginBottom: 16, color: 'var(--subtext)', fontSize: 14 }}>
            Tip: Remember — masculine consonant stems add <strong>-e</strong> (brat→brate),
            -telj/-alj nouns add <strong>-u</strong>, and feminine -a nouns swap to{' '}
            <strong>-o</strong>.
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          {!passed && (
            <button
              className="b"
              onClick={() => {
                setPhase('rules');
                setQi(0);
                setScore(0);
                setAnswered(false);
                setSelected(null);
                setDIdx(0);
              }}
            >
              🔄 Try again
            </button>
          )}
          <button
            className="b bp"
            onClick={() => {
              if (finishFired.current) return;
              finishFired.current = true;
              if (typeof award === 'function') award(xpEarned, false, 'vocabulary');
              markQuest('grammar');
              goBack();
            }}
          >
            {passed ? '✓ Done' : 'Continue anyway'}
          </button>
        </div>
      </div>
    </div>
  );
}
