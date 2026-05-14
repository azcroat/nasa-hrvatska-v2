import React, { useState, useRef, useEffect } from 'react';
import { H, Bar, V, sh, srMark, speak, getDueReviews } from '../../data';
import CroatianKeyboard from '../shared/CroatianKeyboard';
import { recordTopicResult } from '../../lib/adaptive.js';
import { markQuest } from '../../lib/quests.js';
import { knightFlash, knightSpeak } from '../../lib/knightSpeak.js';
import { useStats } from '../../context/StatsContext';

// ── Answer checking helpers ───────────────────────────────────────────────────

/** Normalize diacritics for fuzzy matching (č→c, ć→c, š→s, ž→z, đ→d) */
function normalize(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/[čć]/g, 'c')
    .replace(/[šś]/g, 's')
    .replace(/[žź]/g, 'z')
    .replace(/đ/g, 'd');
}

/** Levenshtein edit distance between two strings */
function levenshtein(a: string, b: string): number {
  const m = a.length,
    n = b.length;
  const dp: number[][] = [];
  for (let i = 0; i <= m; i++) {
    dp[i] = [i];
    for (let j = 1; j <= n; j++) (dp[i] as number[])[j] = i === 0 ? j : 0;
  }
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      (dp[i] as number[])[j] =
        a[i - 1] === b[j - 1]
          ? (dp[i - 1] as number[])[j - 1]!
          : 1 +
            Math.min(
              (dp[i - 1] as number[])[j]!,
              (dp[i] as number[])[j - 1]!,
              (dp[i - 1] as number[])[j - 1]!,
            );
    }
  }
  return (dp[m] as number[])[n]!;
}

/**
 * Check a typed answer against the target.
 * Returns 'perfect' | 'diacritic' | 'close' | 'wrong'
 */
function checkAnswer(input: string, target: string) {
  const inp = input.trim().toLowerCase();
  const tgt = target.trim().toLowerCase();
  if (inp === tgt) return 'perfect';
  const normInp = normalize(inp);
  const normTgt = normalize(tgt);
  if (normInp === normTgt) return 'diacritic';
  const dist = levenshtein(normInp, normTgt);
  const maxLen = Math.max(normInp.length, normTgt.length);
  if (dist <= 1 && maxLen >= 3) return 'close';
  return 'wrong';
}

// ── Pool builder ──────────────────────────────────────────────────────────────

/** Build a 15-word pool. Due SRS words come first, then fresh shuffled words. */
function buildPool() {
  const allWords = Object.values(V).flat();
  try {
    const dueSet = new Set(getDueReviews());
    const dueWords = allWords.filter((w) => dueSet.has(w[0]!));
    const otherWords = allWords.filter((w) => !dueSet.has(w[0]!));
    const pool = [...sh(dueWords), ...sh(otherWords)].slice(0, 15);
    return pool.length >= 5 ? pool : sh(allWords).slice(0, 15);
  } catch {
    return sh(allWords).slice(0, 15);
  }
}

// ── Result UI helpers ─────────────────────────────────────────────────────────

const RESULT_CONFIG = {
  perfect: {
    color: '#16a34a',
    bg: 'rgba(22,163,74,0.08)',
    border: 'rgba(22,163,74,0.3)',
    icon: '✅',
    label: 'Perfect!',
  },
  diacritic: {
    color: '#d97706',
    bg: 'rgba(217,119,6,0.08)',
    border: 'rgba(217,119,6,0.3)',
    icon: '🔤',
    label: 'Close — check diacritics',
  },
  close: {
    color: '#2563eb',
    bg: 'rgba(37,99,235,0.08)',
    border: 'rgba(37,99,235,0.3)',
    icon: '💡',
    label: 'Almost — 1 typo',
  },
  wrong: {
    color: '#dc2626',
    bg: 'rgba(220,38,38,0.08)',
    border: 'rgba(220,38,38,0.3)',
    icon: '❌',
    label: 'Not quite',
  },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function TypingScreen({
  goBack,
  award,
}: {
  goBack: () => void;
  award?: (xp: number, celebrate?: boolean, activityType?: string) => void;
}) {
  const { stats, setStats, writeDelta } = useStats();
  const finishFired = useRef(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const startTsRef = useRef(0); // tracks when current word was presented
  const consecCorrectRef = useRef(0);
  const consecWrongRef = useRef(0);

  const [tyPool] = useState(() => buildPool());
  const [tyI, sTyI] = useState(0);
  const [tyS, sTyS] = useState(0); // correct count (perfect + close accepted)
  const [tyIn, sTyIn] = useState('');
  const [result, setResult] = useState<null | 'perfect' | 'diacritic' | 'close' | 'wrong'>(null);

  // Record when word is presented
  useEffect(() => {
    startTsRef.current = Date.now();
  }, [tyI]);

  if (!tyPool.length) return null;

  const tyW = tyPool[tyI]!;

  // ── Finished screen ──────────────────────────────────────────────────────────
  if (tyI >= tyPool.length) {
    const xp = tyS * 5;
    return (
      <div className="scr-wrap">
        {H('⌨️ Typing Practice', 'Type Croatian words with special characters', goBack)}
        <div style={{ textAlign: 'center', paddingTop: 32 }}>
          <div style={{ fontSize: 64 }}>{tyS >= tyPool.length * 0.8 ? '🏆' : '📚'}</div>
          <h2 style={{ margin: '12px 0 4px', color: 'var(--heading)' }}>
            {tyS} / {tyPool.length}
          </h2>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#d97706', marginBottom: 20 }}>
            +{xp} XP
          </div>
          <button
            className="b bp"
            onClick={() => {
              if (finishFired.current) return;
              finishFired.current = true;
              if (tyS / tyPool.length >= 0.9) {
                knightSpeak('tearsofjoy', 'Savršeno! Sve napisano točno! ✍️');
              }
              if (typeof award === 'function') award(xp, false, 'vocabulary');
              markQuest('vocab');
              if (!stats.vs?.includes('typing')) {
                setStats((prev) => {
                  if (prev.vs?.includes('typing')) return prev;
                  return { ...prev, gc: (prev.gc || 0) + 1, vs: [...(prev.vs || []), 'typing'] };
                });
                if (writeDelta) writeDelta({ gc: 1, vs: ['typing'] });
              }
              goBack();
            }}
          >
            🏠 Done
          </button>
        </div>
      </div>
    );
  }

  // ── Check answer ─────────────────────────────────────────────────────────────
  function submitAnswer() {
    if (result) return; // already answered
    const verdict = checkAnswer(tyIn, tyW[0]!);
    const timeMs = Math.max(500, Date.now() - startTsRef.current);
    const isCorrect = verdict === 'perfect' || verdict === 'diacritic' || verdict === 'close';
    srMark(tyW[0]!, isCorrect, timeMs);
    recordTopicResult('production', isCorrect);
    if (isCorrect) {
      sTyS((s) => s + 1);
      consecWrongRef.current = 0;
      consecCorrectRef.current += 1;
      if (consecCorrectRef.current >= 3) {
        knightFlash('onfire', 2000);
      } else if (Math.random() < 0.2) {
        knightFlash('winking', 1500);
      }
    } else {
      consecCorrectRef.current = 0;
      consecWrongRef.current += 1;
      knightFlash(
        consecWrongRef.current >= 3 ? 'struggling' : 'oops',
        consecWrongRef.current >= 3 ? 2000 : 1500,
      );
    }
    setResult(verdict);
    speak(tyW[0]!);
  }

  function nextWord() {
    const next = tyI + 1;
    sTyI(next);
    setResult(null);
    sTyIn('');
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function insertChar(char: string) {
    const el = inputRef.current;
    if (!el) {
      sTyIn((v) => v + char);
      return;
    }
    const start = el.selectionStart || 0,
      end = el.selectionEnd || 0;
    const newVal = tyIn.slice(0, start) + char + tyIn.slice(end);
    sTyIn(newVal);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + 1, start + 1);
    }, 0);
  }

  const cfg = result ? RESULT_CONFIG[result]! : null;

  return (
    <div className="scr-wrap">
      {H('⌨️ Typing Practice', 'Type Croatian words with special characters', goBack)}
      <Bar v={tyI + 1} mx={tyPool.length} />

      {/* Word prompt */}
      <div className="c" style={{ textAlign: 'center', marginTop: 16, padding: '16px 20px' }}>
        <div
          style={{
            fontSize: 13,
            color: 'var(--subtext)',
            fontWeight: 600,
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Type this word in Croatian:
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 900,
            color: 'var(--heading)',
            fontFamily: "'Playfair Display',serif",
          }}
        >
          {tyW[1]}
        </div>
      </div>

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={tyIn}
        onChange={(e) => {
          if (!result) sTyIn(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            if (!result) submitAnswer();
            else nextWord();
          }
        }}
        placeholder="Type Croatian…"
        disabled={!!result}
        style={{
          marginTop: 14,
          textAlign: 'center',
          fontSize: 20,
          fontWeight: 700,
          background: result ? cfg!.bg : undefined,
          borderColor: result ? cfg!.border : undefined,
          color: result ? cfg!.color : undefined,
          transition: 'all .2s',
        }}
      />

      {/* Croatian keyboard */}
      <CroatianKeyboard onChar={insertChar} />

      {/* Submit / Result */}
      {!result ? (
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button
            className="b"
            style={{
              flex: '0 0 auto',
              padding: '12px 16px',
              background: 'var(--bar-bg)',
              color: 'var(--subtext)',
              border: '1px solid var(--card-b)',
              borderRadius: 12,
              fontFamily: 'inherit',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
            }}
            onClick={() => {
              srMark(tyW[0]!, false, 999999);
              recordTopicResult('production', false);
              setResult('wrong');
              speak(tyW[0]!);
            }}
          >
            Skip
          </button>
          <button
            className="b bp"
            style={{ flex: 1 }}
            onClick={submitAnswer}
            disabled={!tyIn.trim()}
          >
            Check Answer
          </button>
        </div>
      ) : (
        <div
          style={{
            marginTop: 14,
            padding: '14px 16px',
            background: cfg!.bg,
            border: `1px solid ${cfg!.border}`,
            borderRadius: 14,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 800, color: cfg!.color, marginBottom: 6 }}>
            {cfg!.icon} {cfg!.label}
          </div>
          {result !== 'perfect' && (
            <div
              style={{ fontSize: 16, color: 'var(--heading)', fontWeight: 700, marginBottom: 4 }}
            >
              Correct:{' '}
              <span style={{ color: cfg!.color, fontFamily: "'Playfair Display',serif" }}>
                {tyW[0]}
              </span>
            </div>
          )}
          {result === 'diacritic' && (
            <div style={{ fontSize: 13, color: 'var(--subtext)' }}>
              Your answer was accepted — practice the special characters for full marks
            </div>
          )}
          {result === 'close' && (
            <div style={{ fontSize: 13, color: 'var(--subtext)' }}>
              Your answer was accepted — you were just one character off
            </div>
          )}
          <button className="b bp" style={{ marginTop: 12 }} onClick={nextWord}>
            {tyI + 1 < tyPool.length ? 'Next →' : 'See Results'}
          </button>
        </div>
      )}
    </div>
  );
}
