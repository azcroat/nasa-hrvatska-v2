import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { sh } from '../../data';
import { useContent } from '../../hooks/useContent';
import CharacterPortrait from '../family/CharacterPortrait';
import { knightSpeak } from '../../lib/knightSpeak.js';

interface McResultProps {
  questions: any[];
  score: number;
  mistakes?: any[];
  setScr: (scr: string) => void;
  goBack: () => void;
  onNewGame: (items: any[]) => void;
  award?: (xp: number, celebrate?: boolean, activityType?: string) => void;
}
export default function McResult({
  questions,
  score,
  mistakes = [],
  setScr,
  goBack,
  onNewGame,
  award,
}: McResultProps) {
  const { content } = useContent();
  const V = (content?.V ?? {}) as Record<string, any[]>;
  const total = questions.length;
  const allCats = Object.keys(V);
  const targetXP = score * 3 + 5;

  // ── Animated XP count-up ──────────────────────────────────────────────────
  const [displayXP, setDisplayXP] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 900;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayXP(Math.floor(eased * targetXP));
      if (progress < 1) requestAnimationFrame(step);
      else setDisplayXP(targetXP);
    };
    const timer = setTimeout(() => requestAnimationFrame(step), 600);
    return () => clearTimeout(timer);
  }, [targetXP]);

  // ── Knight reacts to result ───────────────────────────────────────────────
  useEffect(() => {
    const ratio = score / total;
    knightSpeak(
      ratio === 1
        ? 'victory'
        : ratio >= 0.8
          ? 'celebrating'
          : ratio >= 0.5
            ? 'encouraged'
            : 'thinking',
      ratio === 1
        ? 'Savršeno! Perfect quiz — prof. Kovač is impressed. ⚔️'
        : ratio >= 0.8
          ? `${score}/${total} — that's strong work. Almost perfect. 💪`
          : ratio >= 0.5
            ? `${score}/${total} correct. Every session you miss fewer. Keep going. 🛡️`
            : 'Practice makes perfect — "vježba čini majstora." Try again tomorrow. 📐',
      700,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Confetti on mount ─────────────────────────────────────────────────────
  useEffect(() => {
    const ratio = score / total;
    if (ratio >= 0.6) {
      const fire = (origin: { x: number; y: number }) =>
        (confetti as any)({
          particleCount: ratio >= 1.0 ? 80 : 50,
          spread: 55,
          origin,
          colors: ['#b61800', '#ffffff', '#003087', '#f59e0b', '#16a34a', '#38bdf8'],
          startVelocity: 25,
          gravity: 1.0,
          ticks: 180,
        });
      setTimeout(() => {
        fire({ x: 0.2, y: 0.6 });
        fire({ x: 0.8, y: 0.6 });
      }, 200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Mistake review drill state ────────────────────────────────────────────
  // reviewPhase: "idle" | "drilling" | "done"
  const [reviewPhase, setReviewPhase] = useState('idle');
  const [reviewIdx, setReviewIdx] = useState(0);
  const [reviewFlipped, setReviewFlipped] = useState(false);
  const [_knownCount, setKnownCount] = useState(0);
  const [reviewDismissed, setReviewDismissed] = useState(false);

  const showReviewPrompt = mistakes.length >= 2 && !reviewDismissed && reviewPhase === 'idle';

  function startReview() {
    setReviewIdx(0);
    setReviewFlipped(false);
    setKnownCount(0);
    setReviewPhase('drilling');
  }

  function handleReviewMark(known: boolean) {
    if (known) setKnownCount((k) => k + 1);
    const next = reviewIdx + 1;
    if (next >= mistakes.length) {
      setReviewPhase('done');
      if (award) award(5, false, 'vocabulary');
    } else {
      setReviewIdx(next);
      setReviewFlipped(false);
    }
  }

  function playAgain() {
    const pool = allCats.flatMap((c) => (V as Record<string, any[]>)[c] || []);
    const items = sh(pool)
      .slice(0, 15)
      .map((w) => {
        const wr = sh(pool.filter((p) => p[1] !== w[1]))
          .slice(0, 3)
          .map((p) => p[1]);
        return { hr: w[0], en: w[1], ph: w[2], opts: sh([w[1], ...wr]), correct: w[1] };
      });
    onNewGame(items);
  }

  const currentMistake = mistakes[reviewIdx];

  return (
    <div className="scr-wrap">
      {/* ── Knight + heading ── delay 0s */}
      <div style={{ animation: 'fade-up 0.5s ease both', animationDelay: '0s' }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <CharacterPortrait name="kovac" size={90} />
        </div>
        <div style={{ fontSize: 64 }}>{score === total ? '🌟' : '🎉'}</div>
        <h2
          style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, color: 'var(--heading)' }}
        >
          {score === total ? 'Perfect!' : 'Great Job!'}
        </h2>
      </div>

      {/* ── Score section ── delay 0.1s */}
      <div style={{ animation: 'fade-up 0.5s ease both', animationDelay: '0.1s' }}>
        <p style={{ color: '#78716c', marginTop: 8, fontSize: 20 }}>
          {score}/{total}
        </p>
        <div style={{ fontSize: 13, color: 'var(--subtext)', marginTop: 4 }}>
          {score} correct · {total - score} missed
        </div>
      </div>

      {/* ── XP card ── delay 0.2s */}
      <div style={{ animation: 'fade-up 0.5s ease both', animationDelay: '0.2s' }}>
        <div
          style={{
            marginTop: 12,
            padding: '10px 14px',
            background: 'var(--bar-bg)',
            borderRadius: 10,
            fontSize: 12,
            color: 'var(--subtext)',
            textAlign: 'center',
            fontWeight: 600,
          }}
        >
          📊 Session: {score || 0} correct ·{' '}
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{displayXP}</span> XP earned
        </div>
        <div style={{ fontSize: 11, color: 'var(--subtext)', marginTop: 3, textAlign: 'center' }}>
          {score} correct × 3 XP + 5 bonus = {targetXP} XP
        </div>
      </div>

      {/* ── Next steps ── delay 0.3s */}
      <div style={{ animation: 'fade-up 0.5s ease both', animationDelay: '0.3s' }}>
        <div
          style={{
            background: 'var(--info-bg)',
            border: '1px solid var(--info-b, rgba(14,116,144,0.3))',
            borderRadius: 12,
            padding: '10px 14px',
            margin: '12px 0',
            fontSize: 13,
            color: 'var(--info)',
            fontWeight: 600,
            textAlign: 'center',
          }}
        >
          {score === total
            ? '🌟 Perfect! Try a harder difficulty next time.'
            : score / total >= 0.7
              ? '💪 Great work! Review missed words with Flashcards 🃏'
              : '📖 Practice these words with Flashcards before retrying 🃏'}
        </div>
      </div>

      {/* ── Mistake Review Prompt ── shown when 2+ mistakes and not dismissed */}
      {showReviewPrompt && (
        <div
          style={{
            animation: 'fade-up 0.5s ease both',
            animationDelay: '0.35s',
            marginTop: 12,
            padding: '14px 16px',
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: 14,
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 14, color: '#b45309', marginBottom: 4 }}>
            ⚡ Quick Review — {mistakes.length} {mistakes.length === 1 ? 'Word' : 'Words'} to
            Reinforce
          </div>
          <div
            style={{
              width: '100%',
              height: 1,
              background: 'rgba(245,158,11,0.25)',
              margin: '8px 0',
            }}
          />
          <div style={{ fontSize: 13, color: 'var(--subtext)', marginBottom: 12 }}>
            You missed these words. 30-second review?
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setReviewDismissed(true)}
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: 10,
                border: '1.5px solid rgba(245,158,11,0.35)',
                background: 'none',
                color: '#92400e',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: "'Outfit',sans-serif",
              }}
            >
              ✗ Skip
            </button>
            <button
              onClick={startReview}
              style={{
                flex: 2,
                padding: '10px 12px',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg,#f59e0b,#d97706)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                fontFamily: "'Outfit',sans-serif",
              }}
            >
              Review Now →
            </button>
          </div>
        </div>
      )}

      {/* ── Mini Flashcard Drill ── */}
      {reviewPhase === 'drilling' && currentMistake && (
        <div
          style={{
            marginTop: 16,
            border: '1.5px solid rgba(245,158,11,0.4)',
            borderRadius: 16,
            overflow: 'hidden',
            animation: 'fade-up 0.3s ease both',
          }}
        >
          {/* Drill header */}
          <div
            style={{
              background: 'rgba(245,158,11,0.1)',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 800, color: '#b45309' }}>
              ⚡ Mistake Review
            </span>
            <span style={{ fontSize: 12, color: '#92400e', fontWeight: 600 }}>
              {reviewIdx + 1} / {mistakes.length}
            </span>
          </div>

          {/* Flashcard */}
          <div style={{ padding: '20px 16px', background: 'var(--card)' }}>
            {!reviewFlipped ? (
              /* Front: Croatian word / question */
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--subtext)',
                    letterSpacing: '0.08em',
                    marginBottom: 8,
                    textTransform: 'uppercase',
                  }}
                >
                  Croatian
                </div>
                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 900,
                    fontFamily: "'Playfair Display',serif",
                    color: 'var(--heading)',
                    marginBottom: 16,
                    lineHeight: 1.2,
                  }}
                >
                  {currentMistake.hr || currentMistake.q || '—'}
                </div>
                <button
                  onClick={() => setReviewFlipped(true)}
                  style={{
                    padding: '12px 28px',
                    borderRadius: 12,
                    border: '1.5px solid rgba(245,158,11,0.5)',
                    background: 'rgba(245,158,11,0.1)',
                    color: '#b45309',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: "'Outfit',sans-serif",
                  }}
                >
                  Show Answer
                </button>
              </div>
            ) : (
              /* Back: English meaning + mark buttons */
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--subtext)',
                    letterSpacing: '0.08em',
                    marginBottom: 4,
                    textTransform: 'uppercase',
                  }}
                >
                  English
                </div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: 'var(--heading)',
                    marginBottom: 4,
                    lineHeight: 1.3,
                  }}
                >
                  {currentMistake.en || currentMistake.correct || '—'}
                </div>
                {currentMistake.hr && (
                  <div style={{ fontSize: 13, color: 'var(--subtext)', marginBottom: 16 }}>
                    {currentMistake.hr}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <button
                    onClick={() => handleReviewMark(false)}
                    style={{
                      flex: 1,
                      padding: '12px 10px',
                      borderRadius: 12,
                      border: '1.5px solid rgba(239,68,68,0.4)',
                      background: 'rgba(239,68,68,0.07)',
                      color: '#dc2626',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: "'Outfit',sans-serif",
                    }}
                  >
                    Still unsure ✗
                  </button>
                  <button
                    onClick={() => handleReviewMark(true)}
                    style={{
                      flex: 1,
                      padding: '12px 10px',
                      borderRadius: 12,
                      border: '1.5px solid rgba(22,163,74,0.4)',
                      background: 'rgba(22,163,74,0.07)',
                      color: '#16a34a',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: "'Outfit',sans-serif",
                    }}
                  >
                    I know it ✓
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Review Done banner ── */}
      {reviewPhase === 'done' && (
        <div
          style={{
            marginTop: 16,
            padding: '14px 16px',
            background: 'rgba(22,163,74,0.08)',
            border: '1px solid rgba(22,163,74,0.3)',
            borderRadius: 14,
            textAlign: 'center',
            animation: 'fade-up 0.4s ease both',
          }}
        >
          <div style={{ fontSize: 22, marginBottom: 4 }}>🎉</div>
          <div style={{ fontWeight: 800, fontSize: 14, color: '#15803d', marginBottom: 4 }}>
            Great! You reviewed {mistakes.length} {mistakes.length === 1 ? 'word' : 'words'}. Keep
            going!
          </div>
          <div
            style={{
              display: 'inline-block',
              marginTop: 4,
              padding: '4px 12px',
              background: 'rgba(22,163,74,0.15)',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 800,
              color: '#16a34a',
            }}
          >
            +5 XP
          </div>
        </div>
      )}

      {/* ── Buttons ── delay 0.4s */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'center',
          marginTop: 24,
          animation: 'fade-up 0.5s ease both',
          animationDelay: '0.4s',
        }}
      >
        <button className="b bg" onClick={playAgain}>
          Play Again
        </button>
        <button className="b bp" onClick={goBack}>
          Back to Practice
        </button>
      </div>
    </div>
  );
}
