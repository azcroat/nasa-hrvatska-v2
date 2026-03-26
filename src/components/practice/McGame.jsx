import React, { useState, useEffect, useRef } from 'react';
import { H, Spk, srMark, recordMistake } from '../../data.jsx';
import { useHaptic } from '../../hooks/useHaptic.js';

const XP_PER_CORRECT = 3;
const XP_COMPLETION_BONUS = 5;

// ── Sound effects ──────────────────────────────────────────────────────────────
function playCorrect() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {}
}

function playWrong() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {}
}

// ── Particle burst on correct answer ──────────────────────────────────────────
function ParticleBurst({ active }) {
  if (!active) return null;
  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      {['⭐', '✨', '🌟', '💫', '⚡'].map((e, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            fontSize: 16 + i * 3,
            animation: `xpFloat .8s ${i * 0.08}s ease forwards`,
            transform: `translate(${Math.cos((i / 5) * Math.PI * 2) * 40}px, ${
              Math.sin((i / 5) * Math.PI * 2) * 40
            }px)`,
            opacity: 0,
          }}
        >
          {e}
        </div>
      ))}
    </div>
  );
}

const LABELS = ['A', 'B', 'C', 'D'];

export default function McGame({ questions, onComplete, goBack, award }) {
  const haptic = useHaptic();
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState(-1);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [burst, setBurst] = useState(-1);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const firstOptionRef = useRef(null);
  const resultFired = useRef(false);

  useEffect(() => {
    if (firstOptionRef.current) firstOptionRef.current.focus();
  }, [idx]);

  const q = questions[idx];
  if (!q) return null;

  function handleAnswer(o, i) {
    if (answered) return;
    setSelected(i);
    setAnswered(true);
    const ok = o === q.correct;
    if (ok) {
      haptic.correct();
      playCorrect();
      setBurst(i);
      setTimeout(() => setBurst(-1), 900);
      setScore(s => s + 1);
      setStreak(s => {
        const ns = s + 1;
        setBestStreak(b => Math.max(b, ns));
        return ns;
      });
    } else {
      haptic.wrong();
      playWrong();
      setStreak(0);
      if (q.hr) recordMistake(q.hr, q.en || q.correct || '', q.q || q.prompt || '', q.category || '');
    }
    if (q.hr) srMark(q.hr, ok);
  }

  function handleKey(e, i) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      const next =
        e.currentTarget.parentElement.children[
          Math.min(i + 1, q.opts.length - 1)
        ];
      if (next) next.focus();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev =
        e.currentTarget.parentElement.children[Math.max(i - 1, 0)];
      if (prev) prev.focus();
    }
  }

  const progress = (idx / questions.length) * 100;
  const isLast = idx === questions.length - 1;

  return (
    <div className="scr-wrap">
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        {confirmQuit ? (
          <div style={{display:'flex',alignItems:'center',gap:8,flex:1}}>
            <span style={{fontSize:13,fontWeight:700,color:'var(--subtext)'}}>Quit game?</span>
            <button onClick={goBack} style={{padding:'6px 14px',borderRadius:10,border:'none',background:'#dc2626',color:'#fff',fontSize:12,fontWeight:800,cursor:'pointer',fontFamily:"'Outfit',sans-serif"}}>Quit</button>
            <button onClick={() => setConfirmQuit(false)} style={{padding:'6px 14px',borderRadius:10,border:'1.5px solid var(--inp-b)',background:'none',color:'var(--subtext)',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:"'Outfit',sans-serif"}}>Keep going</button>
          </div>
        ) : (
          <button
            onClick={() => { if (idx === 0 && !answered) { goBack(); } else { setConfirmQuit(true); } }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 24,
              color: 'var(--subtext)',
              padding: '10px 12px',
              minHeight: 44,
              borderRadius: 10,
              transition: 'background .15s',
            }}
            aria-label="Go back"
          >
            ×
          </button>
        )}

        {/* Animated progress bar */}
        <div style={{ flex: 1, margin: '0 12px', position: 'relative' }}>
          <div
            style={{
              height: 10,
              background: 'var(--bar-bg)',
              borderRadius: 10,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: progress + '%',
                background: 'linear-gradient(90deg,#0e7490,#06b6d4)',
                borderRadius: 10,
                transition: 'width .5s cubic-bezier(.4,0,.2,1)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent)',
                  animation: 'shimmer 1.5s infinite',
                  backgroundSize: '200% 100%',
                }}
              />
            </div>
          </div>
        </div>

        {/* Streak badge */}
        {streak >= 1 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background:
                'linear-gradient(135deg,rgba(249,115,22,.15),rgba(239,68,68,.1))',
              border: '1.5px solid rgba(249,115,22,.3)',
              borderRadius: 20,
              padding: '4px 10px',
              fontSize: 13,
              fontWeight: 800,
              color: '#ea580c',
              animation: 'streakPop .3s ease',
            }}
          >
            <span
              style={{
                animation: 'flameDance 1s ease-in-out infinite',
                display: 'inline-block',
              }}
            >
              🔥
            </span>
            {streak}
          </div>
        )}
      </div>

      {/* Score line */}
      <div
        style={{
          textAlign: 'center',
          fontSize: 12,
          fontWeight: 700,
          color: 'var(--subtext)',
          marginBottom: 16,
          letterSpacing: '.05em',
        }}
      >
        Question {idx + 1} of {questions.length} · {score} correct
      </div>

      {/* Question card */}
      <div
        className="c"
        style={{
          marginBottom: 20,
          background:
            'linear-gradient(145deg,var(--card),var(--card))',
          borderLeft: '4px solid #0e7490',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginBottom: 8,
          }}
        >
          {q.hr && <Spk text={q.hr} label="" />}
          <p
            style={{
              fontSize: 26,
              fontWeight: 900,
              fontFamily: "'Playfair Display',serif",
              color: 'var(--heading)',
              lineHeight: 1.2,
              flex: 1,
            }}
          >
            {q.hr}
          </p>
        </div>
        <p
          style={{
            fontSize: 13,
            color: 'var(--subtext)',
            fontWeight: 600,
          }}
        >
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
      <div style={{ position: 'relative' }}>
        {q.opts.map((o, i) => {
          const isCorrect = answered && o === q.correct;
          const isWrong =
            answered && selected === i && o !== q.correct;
          return (
            <div key={i} style={{ position: 'relative' }}>
              <button
                ref={i === 0 ? firstOptionRef : null}
                className={
                  'ob' + (isCorrect ? ' ok' : isWrong ? ' no' : '')
                }
                aria-pressed={answered && selected === i}
                onKeyDown={e => handleKey(e, i)}
                onClick={() => handleAnswer(o, i)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 18px',
                  borderRadius: 14,
                  fontSize: 15,
                }}
              >
                {/* Letter label */}
                <span
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 800,
                    flexShrink: 0,
                    background: isCorrect
                      ? '#16a34a'
                      : isWrong
                      ? '#dc2626'
                      : 'var(--bar-bg)',
                    color:
                      isCorrect || isWrong
                        ? '#fff'
                        : 'var(--subtext)',
                    transition: 'all .2s',
                  }}
                >
                  {isCorrect ? '✓' : isWrong ? '✕' : LABELS[i]}
                </span>
                <span style={{ flex: 1, textAlign: 'left' }}>{o}</span>
                {isCorrect && (
                  <span style={{ fontSize: 18 }}>🎯</span>
                )}
              </button>
              <ParticleBurst active={burst === i} />
            </div>
          );
        })}
      </div>

      {/* Next button */}
      {answered && (
        <button
          className="b bp"
          style={{
            width: '100%',
            marginTop: 16,
            fontSize: 16,
            padding: '16px',
          }}
          onClick={() => {
            if (!isLast) {
              setIdx(i => i + 1);
              setAnswered(false);
              setSelected(-1);
            } else {
              if (resultFired.current) return;
              resultFired.current = true;
              award(
                score * XP_PER_CORRECT + XP_COMPLETION_BONUS,
                true
              );
              onComplete(questions, score);
            }
          }}
        >
          {isLast ? '🏆 See Results' : 'Next →'}
        </button>
      )}
    </div>
  );
}
