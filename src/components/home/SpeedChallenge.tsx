import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useStats } from '../../context/StatsContext';
import { getSR, getSRScore } from '../../lib/srs.js';
import { V } from '../../data';
import { playCorrect, playWrong, haptic } from '../../lib/soundSettings.js';

const DURATION = 60; // seconds
const XP_CORRECT = 3;
const XP_FAST_BONUS = 1; // extra XP if answered in <3s
const QUESTIONS_PER_GAME = 15;

// Build a question pool from vocabulary + SRS weak words
function buildQuestionPool() {
  // Flatten all vocab
  const allVocab = [];
  try {
    const cats = Object.values(V || {});
    for (const cat of cats) {
      if (Array.isArray(cat)) {
        for (const entry of cat) {
          if (Array.isArray(entry) && entry[0] && entry[1]) {
            allVocab.push({ hr: entry[0], en: entry[1] });
          }
        }
      }
    }
  } catch (_) {}

  if (allVocab.length < 4) return [];

  // Weight words by SRS difficulty
  const sr = getSR();
  const weighted = allVocab.map((w) => ({
    ...w,
    weight: (() => {
      const card = sr[w.hr];
      if (!card) return 1;
      const errRate = card.w / Math.max(card.r + card.w, 1);
      return 1 + errRate * 3; // weak words appear up to 4x more often
    })(),
  }));

  // Weighted shuffle — reservoir sampling by weight for unbiased random ordering
  for (let i = weighted.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = weighted[i]!;
    weighted[i] = weighted[j]!;
    weighted[j] = tmp;
  }
  // Re-sort by weight descending after shuffle so heavier items skew toward front
  weighted.sort((a, b) => b.weight - a.weight);
  return weighted.slice(0, QUESTIONS_PER_GAME + 20); // buffer
}

interface VocabWord {
  hr: string;
  en: string;
  weight?: number;
}
interface Question {
  target: VocabWord;
  choices: VocabWord[];
}

function _fy<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i]!;
    a[i] = a[j]!;
    a[j] = tmp;
  }
  return a;
}

function buildQuestion(target: VocabWord, allVocab: VocabWord[]): Question {
  // 4 choices: 1 correct + 3 random wrong answers
  const wrong = _fy(allVocab.filter((w) => w.en !== target.en)).slice(0, 3);
  const choices = _fy([target, ...wrong]);
  return { target, choices };
}

const LS_KEY_PLAYED = 'nh_speed_challenge_played';

export default function SpeedChallenge({ onXP }: { onXP?: (xp: number) => void }) {
  const { award } = useStats();
  const [phase, setPhase] = useState('idle'); // idle | playing | done
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [answered, setAnswered] = useState<'correct' | 'wrong' | null>(null);
  const [totalEarned, setTotalEarned] = useState(0);
  const timerRef = useRef<number | null>(null);
  const questionStartRef = useRef<number | null>(null);

  // Check if already played today; recompute when phase changes (e.g. after completing a round)
  const playedToday = useMemo(
    () => {
      const today = new Date().toISOString().slice(0, 10);
      return localStorage.getItem(LS_KEY_PLAYED) === today;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [phase], // intentional: re-check after phase transition
  );

  const [noVocab, setNoVocab] = useState(false);
  const pool = useRef<VocabWord[]>([]);
  const questions = useRef<Question[]>([]);
  const allVocab = useRef<VocabWord[]>([]);

  const start = useCallback(() => {
    pool.current = buildQuestionPool();
    allVocab.current = pool.current;
    if (pool.current.length < 4) {
      setNoVocab(true);
      return;
    }
    questions.current = pool.current
      .slice(0, QUESTIONS_PER_GAME)
      .map((t) => buildQuestion(t, allVocab.current));
    setPhase('playing');
    setTimeLeft(DURATION);
    setQIdx(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setAnswered(null);
    setTotalEarned(0);
    questionStartRef.current = Date.now();
  }, []);

  // Timer
  useEffect(() => {
    if (phase !== 'playing') return;
    timerRef.current = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          if (timerRef.current !== null) clearInterval(timerRef.current);
          setPhase('done');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current !== null) clearInterval(timerRef.current);
    };
  }, [phase]);

  const handleAnswer = useCallback(
    (choice: VocabWord) => {
      if (answered !== null || phase !== 'playing') return;
      const q = questions.current[qIdx];
      if (!q) return;
      const responseMs = Date.now() - (questionStartRef.current || Date.now());
      const correct = choice.hr === q.target.hr;
      setAnswered(correct ? 'correct' : 'wrong');

      // Update SRS score so speed challenge contributes to spaced repetition
      try {
        getSRScore(q.target.hr, correct, responseMs);
      } catch (_) {}

      if (correct) {
        playCorrect();
        haptic(30);
        const xp = XP_CORRECT + (responseMs < 3000 ? XP_FAST_BONUS : 0);
        setScore((s) => s + 1);
        setStreak((s) => {
          const next = s + 1;
          setBestStreak((b) => Math.max(b, next));
          return next;
        });
        setTotalEarned((e) => e + xp);
        if (award) award(xp, xp >= 5, 'vocabulary');
      } else {
        playWrong();
        haptic([20, 15, 20]);
        setStreak(0);
      }

      // Advance after brief feedback
      setTimeout(() => {
        setAnswered(null);
        questionStartRef.current = Date.now();
        setQIdx((i) => {
          const next = i + 1;
          if (next >= questions.current.length) {
            setPhase('done');
            return i;
          }
          return next;
        });
      }, 600);
    },
    [answered, phase, qIdx, award],
  );

  // Save today's play on done
  useEffect(() => {
    if (phase === 'done') {
      const today = new Date().toISOString().slice(0, 10);
      localStorage.setItem(LS_KEY_PLAYED, today);
    }
  }, [phase]);

  const share = useCallback(() => {
    const text = `⚡ Speed Croatian: ${score} correct in 60 seconds! 🇭🇷 Beat me on Naša Hrvatska`;
    if (navigator.share) {
      navigator
        .share({ title: 'Naša Hrvatska Speed Challenge', text, url: 'https://nasahrvatska.com' })
        .catch(() => {});
    } else {
      navigator.clipboard?.writeText(text).catch(() => {});
    }
  }, [score]);

  const timePct = (timeLeft / DURATION) * 100;
  const timerColor = timeLeft <= 10 ? '#dc2626' : timeLeft <= 20 ? '#d97706' : 'var(--info)';

  // ── IDLE: teaser card ────────────────────────────────────────────────────
  if (phase === 'idle') {
    return (
      <div
        style={{
          background:
            'linear-gradient(135deg, rgba(124,58,237,0.1) 0%, rgba(139,92,246,0.06) 100%)',
          border: '1.5px solid rgba(124,58,237,0.3)',
          borderRadius: 16,
          padding: '16px',
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 32, flexShrink: 0 }}>⚡</div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: '#7c3aed',
                textTransform: 'uppercase',
                letterSpacing: '.06em',
                marginBottom: 2,
              }}
            >
              Speed Challenge
            </div>
            <div
              style={{ fontSize: 13, color: 'var(--heading)', fontWeight: 600, lineHeight: 1.4 }}
            >
              {playedToday ? '✓ Completed today!' : '60 seconds · how many can you get?'}
            </div>
          </div>
          {!playedToday && (
            <button
              onClick={start}
              style={{
                flexShrink: 0,
                background: '#7c3aed',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '10px 16px',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                fontFamily: "'Outfit',sans-serif",
              }}
            >
              Play →
            </button>
          )}
        </div>
        {noVocab && (
          <div
            style={{
              marginTop: 10,
              padding: '8px 12px',
              background: 'rgba(220,38,38,0.08)',
              border: '1px solid rgba(220,38,38,0.25)',
              borderRadius: 10,
              fontSize: 12,
              color: '#b91c1c',
              fontWeight: 600,
            }}
          >
            Complete a few vocabulary lessons first to unlock Speed Challenge!
          </div>
        )}
        {playedToday && !noVocab && (
          <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--subtext)' }}>
              Come back tomorrow for a new challenge!
            </span>
            <button
              onClick={start}
              style={{
                background: 'none',
                border: '1px solid var(--card-b)',
                borderRadius: 8,
                padding: '4px 10px',
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--subtext)',
                cursor: 'pointer',
              }}
            >
              Practice again
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── DONE: results screen ─────────────────────────────────────────────────
  if (phase === 'done') {
    const grade =
      score >= 12
        ? { label: 'Odlično! 🏆', color: '#16a34a' }
        : score >= 8
          ? { label: 'Sjajno! ⭐', color: '#0e7490' }
          : score >= 4
            ? { label: 'Dobro! 💪', color: '#d97706' }
            : { label: 'Hajde, vježbaj! 🔥', color: '#dc2626' };

    return (
      <div
        style={{
          background: 'var(--card)',
          border: '1.5px solid var(--card-b)',
          borderRadius: 16,
          padding: '20px 16px',
          marginBottom: 12,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 8 }}>⚡</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: grade.color, marginBottom: 4 }}>
          {grade.label}
        </div>
        <div
          style={{
            fontSize: 36,
            fontWeight: 900,
            color: 'var(--heading)',
            lineHeight: 1,
            marginBottom: 4,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {score}
        </div>
        <div style={{ fontSize: 13, color: 'var(--subtext)', fontWeight: 500, marginBottom: 16 }}>
          correct in 60 seconds
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 16 }}>
          {[
            { label: 'Best Streak', value: bestStreak, icon: '🔥' },
            { label: 'XP Earned', value: `+${totalEarned}`, icon: '⚡' },
          ].map((s, i) => (
            <div
              key={i}
              style={{
                background: 'var(--bar-bg)',
                borderRadius: 10,
                padding: '10px 16px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 18, marginBottom: 2 }}>{s.icon}</div>
              <div
                style={{ fontSize: 16, fontWeight: 900, color: 'var(--heading)', lineHeight: 1 }}
              >
                {s.value}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: 'var(--subtext)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '.05em',
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={start}
            style={{
              flex: 1,
              height: 44,
              background: '#7c3aed',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: "'Outfit',sans-serif",
            }}
          >
            Play Again
          </button>
          <button
            onClick={share}
            style={{
              height: 44,
              padding: '0 16px',
              background: 'var(--card)',
              border: '1px solid var(--card-b)',
              borderRadius: 10,
              fontSize: 20,
              cursor: 'pointer',
            }}
          >
            📤
          </button>
        </div>
      </div>
    );
  }

  // ── PLAYING ─────────────────────────────────────────────────────────────
  const q = questions.current[qIdx];
  if (!q) return null;

  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1.5px solid var(--card-b)',
        borderRadius: 16,
        padding: '16px',
        marginBottom: 12,
      }}
    >
      {/* Header: timer + score */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <div
            style={{ height: 8, background: 'var(--bar-bg)', borderRadius: 4, overflow: 'hidden' }}
          >
            <div
              style={{
                height: '100%',
                width: timePct + '%',
                background: timerColor,
                borderRadius: 4,
                transition: 'width 1s linear, background .3s ease',
              }}
            />
          </div>
        </div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 900,
            color: timerColor,
            minWidth: 28,
            textAlign: 'right',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {timeLeft}s
        </div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: 'var(--heading)',
            minWidth: 40,
            textAlign: 'right',
          }}
        >
          ⚡ {score}
        </div>
      </div>

      {/* Streak indicator */}
      {streak >= 3 && (
        <div
          style={{
            textAlign: 'center',
            marginBottom: 8,
            fontSize: 12,
            fontWeight: 700,
            color: '#ea580c',
          }}
        >
          🔥 {streak} in a row!
        </div>
      )}

      {/* Question */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--subtext)',
            textTransform: 'uppercase',
            letterSpacing: '.1em',
            marginBottom: 8,
          }}
        >
          What does this mean?
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 900,
            color: 'var(--heading)',
            fontFamily: "'Playfair Display',serif",
            lineHeight: 1.2,
          }}
        >
          {q.target.hr}
        </div>
      </div>

      {/* Answer choices */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {q.choices.map((choice, i) => {
          const isCorrect = choice.hr === q.target.hr;
          let bg = 'var(--bar-bg)';
          let borderColor = 'transparent';
          if (answered === 'correct' && isCorrect) {
            bg = 'rgba(22,163,74,0.15)';
            borderColor = '#16a34a';
          }
          if (answered === 'wrong' && isCorrect) {
            bg = 'rgba(22,163,74,0.15)';
            borderColor = '#16a34a';
          }
          // tint wrong selection red
          return (
            <button
              key={i}
              onClick={() => handleAnswer(choice)}
              disabled={answered !== null}
              style={{
                padding: '12px 8px',
                borderRadius: 10,
                cursor: answered ? 'default' : 'pointer',
                background: bg,
                border: `1.5px solid ${borderColor}`,
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--heading)',
                fontFamily: "'Outfit',sans-serif",
                textAlign: 'center',
                lineHeight: 1.3,
                transition: 'background .2s, border-color .2s',
              }}
            >
              {choice.en}
            </button>
          );
        })}
      </div>
    </div>
  );
}
