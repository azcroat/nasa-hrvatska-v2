// @ts-nocheck
/**
 * SentenceTileScreen — DuoLingo-style sentence tile assembly exercise.
 *
 * Shows an English prompt; learner taps scrambled Croatian word tiles to assemble
 * the correct sentence. Tiles move between the bank (available) and tray (answer).
 * Tapping a tray tile returns it to the bank. Submit checks the answer.
 *
 * DuoLingo best-practice: tile-tap engages deeper recall than multiple-choice
 * because the learner must produce word order, not just recognize it.
 */
import React, { useState, useMemo, useCallback } from 'react';
import { H, Bar } from '../../data';
import { SENTBUILD } from '../../data';
import { markQuest } from '../../lib/quests.js';
import { useHaptic } from '../../hooks/useHaptic';
import { playCorrect, playWrong } from '../../lib/soundSettings.js';
import { knightSpeak } from '../../lib/knightSpeak.js';

const TILE_STYLE_BASE = {
  padding: '10px 16px',
  borderRadius: 12,
  fontSize: 15,
  fontWeight: 700,
  cursor: 'pointer',
  border: '2.5px solid',
  transition: 'transform .12s, box-shadow .12s, opacity .12s',
  fontFamily: "'Outfit', sans-serif",
  minHeight: 44,
  whiteSpace: 'nowrap',
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Normalize for comparison: lowercase, strip punctuation
function norm(s) {
  return s
    .replace(/[.?!,;:]/g, '')
    .trim()
    .toLowerCase();
}

// Build tile bank: correct words + 2 distractors from wrong opts
function buildBank(item) {
  const correctWords = item.hr
    .replace(/[.?!,;:]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  // Pick up to 2 distractor words from wrong option sentences
  const distractors = [];
  for (const opt of item.opts || []) {
    if (norm(opt) === norm(item.hr)) continue;
    const words = opt
      .replace(/[.?!,;:]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    for (const w of words) {
      const wn = norm(w);
      if (!correctWords.some((cw) => norm(cw) === wn) && !distractors.some((d) => norm(d) === wn)) {
        distractors.push(w);
        if (distractors.length >= 2) break;
      }
    }
    if (distractors.length >= 2) break;
  }
  // Each tile is { id, word } — unique IDs for React keys (words may repeat)
  return shuffle([...correctWords, ...distractors].map((word, i) => ({ id: i, word })));
}

export default function SentenceTileScreen({ goBack, award }) {
  const haptic = useHaptic();

  const questions = useMemo(() => {
    return shuffle(SENTBUILD).slice(0, 10);
  }, []);

  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [bank, setBank] = useState(() => (questions.length > 0 ? buildBank(questions[0]) : []));
  const [tray, setTray] = useState([]);
  const [feedback, setFeedback] = useState(null); // null | 'correct' | 'wrong'
  const [done, setDone] = useState(false);

  const q = questions[idx];

  const tapBank = useCallback(
    (tile) => {
      if (feedback) return;
      setBank((prev) => prev.filter((t) => t.id !== tile.id));
      setTray((prev) => [...prev, tile]);
    },
    [feedback],
  );

  const tapTray = useCallback(
    (tile) => {
      if (feedback) return;
      setTray((prev) => prev.filter((t) => t.id !== tile.id));
      setBank((prev) => [...prev, tile]);
    },
    [feedback],
  );

  const handleSubmit = useCallback(() => {
    if (tray.length === 0 || feedback) return;
    const assembled = tray.map((t) => t.word).join(' ');
    const isCorrect = norm(assembled) === norm(q.hr);
    if (isCorrect) {
      haptic.correct();
      playCorrect();
      setScore((s) => s + 1);
      setFeedback('correct');
      knightSpeak('happy', 'Točno! Excellent sentence structure! 🎯', 300);
    } else {
      haptic.wrong();
      playWrong();
      setFeedback('wrong');
    }
  }, [tray, feedback, q, haptic]);

  const handleNext = useCallback(() => {
    const nextIdx = idx + 1;
    if (nextIdx >= questions.length) {
      if (typeof award === 'function') award(score * 4 + 5, true);
      markQuest('grammar');
      knightSpeak(
        score >= questions.length * 0.8 ? 'victory' : 'encouraging',
        score >= questions.length * 0.8
          ? `${score}/${questions.length} — your Croatian word order is spot on! ⚔️`
          : `${score}/${questions.length} — sentence building takes practice. You're getting there! 💪`,
        300,
      );
      setDone(true);
    } else {
      setIdx(nextIdx);
      setBank(buildBank(questions[nextIdx]));
      setTray([]);
      setFeedback(null);
    }
  }, [idx, questions, score, award]);

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="scr-wrap">
        {H('🧩 Sentence Assembly', 'Tap tiles to build Croatian sentences', goBack)}
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: 64, marginBottom: 12 }}>
            {pct >= 80 ? '🏆' : pct >= 60 ? '⭐' : '💪'}
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#164e63', marginBottom: 8 }}>
            {score} / {questions.length} correct
          </div>
          <div style={{ fontSize: 16, color: '#64748b', marginBottom: 24 }}>
            {pct >= 80
              ? 'Excellent word order!'
              : pct >= 60
                ? 'Good progress!'
                : 'Keep practising!'}
          </div>
          <button className="b bp" onClick={goBack}>
            ✓ Done
          </button>
        </div>
      </div>
    );
  }

  const isCorrect = feedback === 'correct';
  const isWrong = feedback === 'wrong';

  return (
    <div className="scr-wrap">
      {H('🧩 Sentence Assembly', 'Tap tiles to build the Croatian sentence', goBack)}
      <Bar v={idx} mx={questions.length} h={6} />

      {/* English prompt */}
      <div className="c" style={{ marginBottom: 20, padding: '16px 18px' }}>
        <div
          style={{
            fontSize: 12,
            color: '#64748b',
            fontWeight: 700,
            marginBottom: 6,
            textTransform: 'uppercase',
            letterSpacing: '.06em',
          }}
        >
          Translate to Croatian:
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>
          "{q.en}"
        </div>
      </div>

      {/* Answer tray */}
      <div
        style={{
          minHeight: 64,
          padding: '12px 14px',
          border: `2px solid ${isCorrect ? '#16a34a' : isWrong ? '#dc2626' : 'rgba(14,116,144,.2)'}`,
          borderRadius: 16,
          background: isCorrect
            ? 'rgba(22,163,74,.06)'
            : isWrong
              ? 'rgba(220,38,38,.06)'
              : 'var(--card)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 12,
          transition: 'border-color .2s, background .2s',
        }}
      >
        {tray.length === 0 && !feedback && (
          <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600, alignSelf: 'center' }}>
            ← Tap words to build sentence
          </div>
        )}
        {tray.map((tile) => (
          <button
            key={tile.id}
            onClick={() => tapTray(tile)}
            disabled={!!feedback}
            style={{
              ...TILE_STYLE_BASE,
              background: isCorrect ? '#dcfce7' : isWrong ? '#fee2e2' : '#dbeafe',
              borderColor: isCorrect ? '#16a34a' : isWrong ? '#dc2626' : '#3b82f6',
              color: isCorrect ? '#166534' : isWrong ? '#991b1b' : '#1e40af',
              cursor: feedback ? 'default' : 'pointer',
            }}
          >
            {tile.word}
          </button>
        ))}
      </div>

      {/* Wrong answer — show correct sentence */}
      {isWrong && (
        <div
          style={{
            marginBottom: 12,
            padding: '10px 14px',
            background: 'rgba(220,38,38,.06)',
            border: '1.5px solid rgba(220,38,38,.2)',
            borderRadius: 12,
            fontSize: 13,
            color: '#991b1b',
            fontWeight: 600,
          }}
        >
          Correct: <span style={{ fontStyle: 'italic' }}>{q.hr}</span>
        </div>
      )}

      {/* Tile bank */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          padding: '14px',
          background: 'var(--bar-bg)',
          borderRadius: 16,
          minHeight: 60,
          marginBottom: 20,
        }}
      >
        {bank.map((tile) => (
          <button
            key={tile.id}
            onClick={() => tapBank(tile)}
            disabled={!!feedback}
            style={{
              ...TILE_STYLE_BASE,
              background: 'var(--card)',
              borderColor: 'rgba(14,116,144,.3)',
              color: 'var(--heading)',
              cursor: feedback ? 'default' : 'pointer',
              opacity: feedback ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!feedback) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(14,116,144,.2)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {tile.word}
          </button>
        ))}
      </div>

      {/* Action buttons */}
      {!feedback ? (
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => {
              setTray([]);
              setBank(buildBank(q));
            }}
            className="b bg"
            style={{ fontSize: 13 }}
          >
            🗑 Clear
          </button>
          <button
            onClick={handleSubmit}
            disabled={tray.length === 0}
            className="b bp"
            style={{ flex: 1, opacity: tray.length === 0 ? 0.5 : 1 }}
          >
            Check →
          </button>
        </div>
      ) : (
        <button onClick={handleNext} className="b bp" style={{ width: '100%' }}>
          {idx + 1 >= questions.length ? '🏆 See Results' : 'Next →'}
        </button>
      )}
    </div>
  );
}
