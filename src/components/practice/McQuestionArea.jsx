import React from 'react';
import { motion } from 'framer-motion';
import { Spk } from '../../data.jsx';

const LABELS = ['A', 'B', 'C', 'D'];

// ── Particle burst on correct answer ─────────────────────────────────────────
const PARTICLES = ['⭐','✨','🌟','💫','⚡','✨','⭐','🌟','💥','✨'];
const PARTICLE_POSITIONS = [
  [-30, -20], [-40, 0], [-30, 20], [0, 30], [0, -30],
  [-20, 40], [20, 40], [30, 0], [20, -40], [-20, -40],
];

function ParticleBurst({ active }) {
  if (!active) return null;
  return (
    <div style={{ position: 'absolute', top: '50%', left: '50%', pointerEvents: 'none', zIndex: 10 }}>
      {PARTICLES.map((e, i) => {
        const [topOff, leftOff] = PARTICLE_POSITIONS[i];
        return (
          <div key={i} style={{
            position: 'absolute', fontSize: 14 + (i % 3) * 4,
            animation: `xpFloat .8s ${i * 0.05}s ease forwards`,
            top: topOff, left: leftOff, opacity: 0,
          }}>
            {e}
          </div>
        );
      })}
    </div>
  );
}

export default function McQuestionArea({
  q,
  answered,
  selected,
  revealCorrect,
  glowIndex,
  burst,
  qTransition,
  score,
  questions,
  isLast,
  firstOptionRef,
  onAnswer,
  onKey,
  onNext,
}) {
  return (
    <>
      {/* Question card */}
      <div
        className="c"
        style={{
          marginBottom: 20,
          background: 'linear-gradient(145deg,var(--card),var(--card))',
          borderLeft: '4px solid var(--info)',
          opacity: qTransition ? 0 : 1,
          transform: qTransition ? 'translateY(8px)' : 'translateY(0)',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
          {q.hr && <Spk text={q.hr} label="" />}
          <p style={{
            fontSize: 26, fontWeight: 900, fontFamily: "'Playfair Display',serif",
            color: 'var(--heading)', lineHeight: 1.2, flex: 1,
          }}>
            {q.hr}
          </p>
        </div>
        <p style={{ fontSize: 13, color: 'var(--subtext)', fontWeight: 600 }}>
          What does this mean in English?
        </p>
      </div>

      {/* SR-only announcer */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {answered &&
          (q.opts[selected] === q.correct
            ? `Correct! Score: ${score} of ${questions.length}.`
            : `Incorrect. The answer is ${q.correct}. Score: ${score} of ${questions.length}.`)}
      </div>

      {/* Options */}
      <div style={{
        position: 'relative', opacity: qTransition ? 0 : 1,
        transform: qTransition ? 'translateY(8px)' : 'translateY(0)',
        transition: 'opacity 0.2s ease, transform 0.2s ease',
      }}>
        {q.opts.map((o, i) => {
          const isCorrect = answered && o === q.correct;
          const isWrong = answered && selected === i && o !== q.correct;
          const isRevealedCorrect = revealCorrect && o === q.correct && !isCorrect;
          const isGlowing = glowIndex === i && answered && !isCorrect;
          return (
            <div key={i} style={{ position: 'relative' }}>
              <motion.button
                ref={i === 0 ? firstOptionRef : null}
                className={'ob' + (isCorrect ? ' ok' : isWrong ? ' no' : '')}
                aria-pressed={answered && selected === i}
                aria-label={`Option ${i + 1}: ${o}`}
                onKeyDown={e => onKey(e, i)}
                onClick={() => onAnswer(o, i)}
                whileTap={!answered ? { scale: 0.97 } : {}}
                transition={{ type: 'spring', stiffness: 600, damping: 20 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 18px', borderRadius: 14, fontSize: 15,
                  transition: 'background .2s ease, border-color .2s ease, transform .12s ease',
                  ...(isRevealedCorrect ? { background: 'var(--success-bg)', borderColor: 'var(--success-b)', color: 'var(--success)' } : {}),
                  ...(isGlowing ? { animation: 'correctGlow 0.5s ease infinite', borderColor: 'var(--success-b)' } : {}),
                }}
              >
                <span style={{
                  width: 30, height: 30, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 800, flexShrink: 0,
                  background: isCorrect ? 'var(--success)' : isWrong ? 'var(--error)' : isRevealedCorrect ? 'var(--success)' : 'var(--bar-bg)',
                  color: isCorrect || isWrong || isRevealedCorrect ? '#fff' : 'var(--subtext)',
                  transition: 'all .2s',
                }}>
                  {isCorrect ? '✓' : isWrong ? '✕' : isRevealedCorrect ? '✓' : LABELS[i]}
                </span>
                <span style={{ flex: 1, textAlign: 'left' }}>{o}</span>
                {isRevealedCorrect && <span style={{ fontSize: 11, marginLeft: 4 }}>✓</span>}
                {isCorrect && <span style={{ fontSize: 18 }}>🎯</span>}
              </motion.button>
              <ParticleBurst active={burst === i} />
            </div>
          );
        })}
      </div>

      {/* Keyboard hint */}
      <div style={{ fontSize: 10, color: 'var(--subtext)', textAlign: 'center', marginTop: 6, opacity: 0.6 }}>
        Tip: Press 1–{q?.opts?.length || 4} to select
      </div>
      <span className="sr-only" aria-live="polite">Tip: press 1–4 to choose an answer</span>

      {/* Grammar hint on wrong answer */}
      {answered && q.opts[selected] !== q.correct && (
        <div style={{
          marginTop: 8, padding: '10px 14px',
          background: 'var(--info-bg)',
          border: '1px solid var(--info-b, rgba(14,116,144,0.2))',
          borderRadius: 10, fontSize: 12, color: 'var(--subtext)', lineHeight: 1.5,
        }}>
          💡 {q.hint || q.explanation || 'Take note of this word — it will appear again in spaced repetition.'}
        </div>
      )}

      {/* Next button */}
      {answered && (
        <button
          className="b bp"
          style={{ width: '100%', marginTop: 16, fontSize: 16, padding: '16px' }}
          onClick={onNext}
        >
          {isLast ? '🏆 See Results' : 'Next →'}
        </button>
      )}
    </>
  );
}
