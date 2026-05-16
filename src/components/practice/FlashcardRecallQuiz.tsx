import React, { useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { markQuest } from '../../lib/quests.js';
import { playCorrect, playWrong } from '../../lib/soundSettings.js';
import { knightSpeak, knightFlash } from '../../lib/knightSpeak.js';
import { useStats } from '../../context/StatsContext';

const QUIZ_SIZE = 5;
const XP_BASE = 10;
const XP_PER_CORRECT = 5;

/** Fisher-Yates shuffle (in-place, returns array). */
function shuffleArr<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

interface QuizQuestion {
  croatian: string;
  correct: string;
  opts: string[]; // always 4 (or fewer if deck too small)
}

/** Build MC questions from the card pool. */
function buildQuestions(pool: any[]): QuizQuestion[] {
  if (pool.length < 2) return [];

  const optCount = Math.min(4, pool.length);
  const qCount = Math.min(QUIZ_SIZE, pool.length);

  // Pick qCount distinct cards as question subjects
  const shuffledIndices = shuffleArr([...Array(pool.length).keys()]);
  const questionCards = shuffledIndices.slice(0, qCount);

  return questionCards.map((cardIdx) => {
    const card = pool[cardIdx]!;
    const croatian = card[0] as string;
    const correct = card[1] as string;

    // Build distractor pool from other cards
    const distractors = pool
      .filter((_: any, i: number) => i !== cardIdx)
      .map((c: any) => c[1] as string)
      .filter((s: string) => s && s !== correct);

    shuffleArr(distractors);
    const opts = shuffleArr([correct, ...distractors.slice(0, optCount - 1)]);

    return { croatian, correct, opts };
  });
}

interface Props {
  pool: any[];
  knownCount: number;
  onComplete: (quizScore: number, skipped: boolean) => void;
}

type Phase = 'intro' | 'quiz' | 'done';

export default function FlashcardRecallQuiz({ pool, knownCount, onComplete }: Props) {
  const { stats, setStats, writeDelta } = useStats();

  const questions = useMemo(() => buildQuestions(pool), [pool]);

  const [phase, setPhase] = useState<Phase>('intro');
  const [qIdx, setQIdx] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  // Use a ref for score so handleNext always sees the up-to-date value (avoids stale closure)
  const scoreRef = useRef(0);
  const [scoreDisplay, setScoreDisplay] = useState(0); // mirror for UI

  const total = questions.length;
  const cur = questions[qIdx];

  // ── Skip path — preserves old flow ──────────────────────────────────────────
  function handleSkip() {
    // Fire old XP (knownCount * 2 + 5) and old quest, no quiz tag
    onComplete(-1, true);
  }

  // ── Start quiz ────────────────────────────────────────────────────────────
  function handleStart() {
    if (questions.length === 0) {
      // Degenerate: not enough cards, fall back to skip path
      onComplete(-1, true);
      return;
    }
    setPhase('quiz');
  }

  // ── Answer a question ─────────────────────────────────────────────────────
  function pick(opt: string) {
    if (chosen !== null || !cur) return;
    setChosen(opt);
    const isCorrect = opt === cur.correct;
    if (isCorrect) {
      playCorrect();
      knightFlash('happy', 1200);
      scoreRef.current += 1;
      setScoreDisplay(scoreRef.current);
    } else {
      playWrong();
      knightFlash('oops', 1500);
    }
  }

  // ── Advance to next question or finish ────────────────────────────────────
  function handleNext() {
    if (!chosen) return;
    if (qIdx + 1 >= total) {
      finishQuiz(scoreRef.current);
    } else {
      setQIdx((i) => i + 1);
      setChosen(null);
    }
  }

  function finishQuiz(finalScore: number) {
    // Contract clauses
    markQuest('flashcards');
    if (!stats?.vs?.includes('flashcards-quiz')) {
      if (setStats) {
        setStats((prev: any) => {
          if (prev.vs?.includes('flashcards-quiz')) return prev;
          return { ...prev, vs: [...(prev.vs || []), 'flashcards-quiz'] };
        });
      }
      if (writeDelta) writeDelta({ vs: ['flashcards-quiz'] });
    }
    knightSpeak(
      finalScore === total ? 'victory' : finalScore >= total * 0.6 ? 'celebrating' : 'encouraged',
      finalScore === total
        ? `${finalScore}/${total} — perfect quiz! Your memory is excellent. 🧠`
        : `${finalScore}/${total} on the recall quiz. Keep reviewing for stronger memory! 📚`,
      500,
    );
    setPhase('done');
    onComplete(finalScore, false);
  }

  // ── Intro screen ──────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="scr-wrap" style={{ textAlign: 'center' }}>
        <div style={{ padding: '40px 20px 24px' }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🧠</div>
          <h3
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: 22,
              color: 'var(--heading)',
              marginBottom: 8,
            }}
          >
            Quick Recall Check
          </h3>
          <p style={{ color: 'var(--subtext)', fontSize: 14, marginBottom: 4 }}>
            {total} multiple-choice questions from the cards you just reviewed.
          </p>
          <p style={{ color: 'var(--subtext)', fontSize: 13, marginBottom: 24 }}>
            Earn up to{' '}
            <strong style={{ color: '#fbbf24' }}>+{XP_BASE + total * XP_PER_CORRECT} XP</strong> for
            a perfect score.
          </p>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              maxWidth: 360,
              margin: '0 auto',
            }}
          >
            <motion.button
              data-testid="quiz-start-btn"
              onClick={handleStart}
              whileTap={{ scale: 0.96 }}
              style={{
                width: '100%',
                height: 52,
                borderRadius: 14,
                border: '2px solid var(--success-b)',
                background: 'var(--success-bg)',
                color: 'var(--success)',
                fontFamily: "'Outfit',sans-serif",
                fontSize: 15,
                fontWeight: 900,
                cursor: 'pointer',
              }}
            >
              Take Quiz ({total} questions)
            </motion.button>
            <button
              data-testid="quiz-skip-btn"
              onClick={handleSkip}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--subtext)',
                fontSize: 13,
                cursor: 'pointer',
                padding: '8px 0',
                textDecoration: 'underline',
              }}
            >
              Skip quiz, just see results
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Quiz screen ───────────────────────────────────────────────────────────
  if (phase === 'quiz' && cur) {
    const answered = chosen !== null;
    const isCorrect = answered && chosen === cur.correct;

    return (
      <div className="scr-wrap">
        <div style={{ padding: '16px 0 8px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <span style={{ fontSize: 13, color: 'var(--subtext)', fontWeight: 700 }}>
              Question {qIdx + 1} of {total}
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--success)' }}>
              {scoreDisplay} correct
            </span>
          </div>
          {/* thin progress bar */}
          <div
            style={{
              height: 4,
              borderRadius: 4,
              background: 'var(--border)',
              overflow: 'hidden',
              marginBottom: 20,
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${((qIdx + (answered ? 1 : 0)) / total) * 100}%`,
                background: '#f59e0b',
                borderRadius: 4,
                transition: 'width .3s',
              }}
            />
          </div>
        </div>

        <div
          style={{
            background: 'var(--card)',
            borderRadius: 16,
            padding: '28px 20px',
            textAlign: 'center',
            marginBottom: 20,
            boxShadow: '0 2px 12px rgba(0,0,0,.06)',
          }}
        >
          <div style={{ fontSize: 11, color: 'var(--subtext)', fontWeight: 700, marginBottom: 8 }}>
            What does this mean?
          </div>
          <div
            style={{
              fontSize: 30,
              fontWeight: 800,
              color: 'var(--info)',
              fontFamily: "'Playfair Display',serif",
              lineHeight: 1.3,
            }}
          >
            {cur.croatian}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {cur.opts.map((opt, i) => {
            let borderColor = 'var(--border)';
            let bgColor = 'var(--card)';
            let textColor = 'var(--text)';
            if (answered) {
              if (opt === cur.correct) {
                borderColor = 'var(--success-b)';
                bgColor = 'var(--success-bg)';
                textColor = 'var(--success)';
              } else if (opt === chosen) {
                borderColor = '#dc2626';
                bgColor = 'rgba(220,38,38,.08)';
                textColor = '#dc2626';
              }
            }
            return (
              <motion.button
                key={i}
                data-testid={`quiz-opt-${i}`}
                onClick={() => pick(opt)}
                disabled={answered}
                whileTap={answered ? {} : { scale: 0.97 }}
                style={{
                  width: '100%',
                  minHeight: 52,
                  borderRadius: 14,
                  border: `2px solid ${borderColor}`,
                  background: bgColor,
                  color: textColor,
                  fontFamily: "'Outfit',sans-serif",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: answered ? 'default' : 'pointer',
                  padding: '10px 16px',
                  textAlign: 'left',
                  transition: 'border-color .2s, background .2s',
                }}
              >
                {opt}
              </motion.button>
            );
          })}
        </div>

        {answered && (
          <div style={{ textAlign: 'center', marginTop: 12, fontSize: 13, fontWeight: 700 }}>
            {isCorrect ? (
              <span style={{ color: 'var(--success)' }}>Correct!</span>
            ) : (
              <span style={{ color: '#dc2626' }}>
                Correct answer: <em>{cur.correct}</em>
              </span>
            )}
          </div>
        )}

        {answered && (
          <div className="cta-bar" style={{ paddingTop: 8 }}>
            <motion.button
              data-testid="quiz-next-btn"
              onClick={handleNext}
              whileTap={{ scale: 0.96 }}
              style={{
                width: '100%',
                height: 52,
                borderRadius: 14,
                border: '2px solid var(--info)',
                background: 'rgba(14,116,144,.08)',
                color: 'var(--info)',
                fontFamily: "'Outfit',sans-serif",
                fontSize: 15,
                fontWeight: 900,
                cursor: 'pointer',
              }}
            >
              {qIdx + 1 >= total ? 'See Results' : 'Next'}
            </motion.button>
          </div>
        )}
      </div>
    );
  }

  // phase === 'done' — parent renders FlashcardResultScreen; return null while transitioning
  return null;
}
