import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { V, sh } from '../../data.jsx';
import CroatianKnight from '../shared/CroatianKnight';

export default function McResult({ questions, score, setScr, goBack, onNewGame }) {
  const total = questions.length;
  const allCats = Object.keys(V);
  const targetXP = score * 3 + 5;

  // ── Animated XP count-up ──────────────────────────────────────────────────
  const [displayXP, setDisplayXP] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 900;
    const step = (timestamp) => {
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

  // ── Confetti on mount ─────────────────────────────────────────────────────
  useEffect(() => {
    const ratio = score / total;
    if (ratio >= 0.6) {
      const fire = (origin) => confetti({
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
  }, []);

  function playAgain() {
    const pool = allCats.flatMap(c => V[c]);
    const items = sh(pool).slice(0, 15).map(w => {
      const wr = sh(pool.filter(p => p[1] !== w[1])).slice(0, 3).map(p => p[1]);
      return { hr: w[0], en: w[1], ph: w[2], opts: sh([w[1], ...wr]), correct: w[1] };
    });
    onNewGame(items);
  }

  return (
    <div className="scr-wrap">

      {/* ── Knight + heading ── delay 0s */}
      <div style={{ animation: 'fade-up 0.5s ease both', animationDelay: '0s' }}>
        <CroatianKnight
          size={90}
          mood={
            score === total ? 'celebrating' :
            score / total >= 0.6 ? 'happy' :
            'encouraged'
          }
          style={{ margin: '0 auto 8px', display: 'block' }}
        />
        <div style={{ fontSize: 64 }}>
          {score === total ? "🌟" : "🎉"}
        </div>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, color: 'var(--heading)' }}>
          {score === total ? "Perfect!" : "Great Job!"}
        </h2>
      </div>

      {/* ── Score section ── delay 0.1s */}
      <div style={{ animation: 'fade-up 0.5s ease both', animationDelay: '0.1s' }}>
        <p style={{ color: "#78716c", marginTop: 8, fontSize: 20 }}>
          {score}/{total}
        </p>
        <div style={{ fontSize: 13, color: 'var(--subtext)', marginTop: 4 }}>
          {score} correct · {total - score} missed
        </div>
      </div>

      {/* ── XP card ── delay 0.2s */}
      <div style={{ animation: 'fade-up 0.5s ease both', animationDelay: '0.2s' }}>
        <div style={{
          marginTop: 12, padding: '10px 14px',
          background: 'var(--bar-bg)', borderRadius: 10,
          fontSize: 12, color: 'var(--subtext)', textAlign: 'center', fontWeight: 600
        }}>
          📊 Session: {score || 0} correct · <span style={{ fontVariantNumeric: 'tabular-nums' }}>{displayXP}</span> XP earned
        </div>
        <div style={{ fontSize: 11, color: 'var(--subtext)', marginTop: 3, textAlign: 'center' }}>
          {score} correct × 3 XP + 5 bonus = {targetXP} XP
        </div>
      </div>

      {/* ── Next steps ── delay 0.3s */}
      <div style={{ animation: 'fade-up 0.5s ease both', animationDelay: '0.3s' }}>
        <div style={{
          background: 'var(--info-bg)',
          border: '1px solid var(--info-b, rgba(14,116,144,0.3))',
          borderRadius: 12,
          padding: '10px 14px',
          margin: '12px 0',
          fontSize: 13,
          color: 'var(--info)',
          fontWeight: 600,
          textAlign: 'center',
        }}>
          {score === total
            ? '🌟 Perfect! Try a harder difficulty next time.'
            : score / total >= 0.7
            ? '💪 Great work! Review missed words with Flashcards 🃏'
            : '📖 Practice these words with Flashcards before retrying 🃏'}
        </div>
      </div>

      {/* ── Buttons ── delay 0.4s */}
      <div style={{
        display: "flex", gap: 12, justifyContent: "center", marginTop: 24,
        animation: 'fade-up 0.5s ease both', animationDelay: '0.4s'
      }}>
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
