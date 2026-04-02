import React, { useState, useEffect, useRef } from 'react';
import { srMark, recordMistake } from '../../data.jsx';
import { useHaptic } from '../../hooks/useHaptic.js';
import { playCorrect, playWrong } from '../../lib/soundSettings.js';
import { getHearts, loseHeart } from '../../lib/lives.js';
import HeartsBar from '../shared/HeartsBar.jsx';
import McGameOver from './McGameOver.jsx';
import McQuestionArea from './McQuestionArea.jsx';
import { knightSpeak } from '../../lib/knightSpeak.js';

const XP_PER_CORRECT = 3;
const XP_COMPLETION_BONUS = 5;

const MC_KEYFRAMES = `
  @keyframes mcShake {
    0%,100% { transform: translateX(0); }
    15%      { transform: translateX(-8px); }
    30%      { transform: translateX(8px); }
    45%      { transform: translateX(-6px); }
    60%      { transform: translateX(6px); }
    75%      { transform: translateX(-3px); }
    90%      { transform: translateX(3px); }
  }
  @keyframes correctGlow {
    0%,100% { box-shadow: 0 0 0px rgba(22,163,74,0); }
    50%     { box-shadow: 0 0 16px 4px rgba(22,163,74,0.7); }
  }
`;

export default function McGame({ questions: rawQuestions, onComplete, goBack, award, challengeMode = false }) {
  // Guard: drop any question where the correct answer isn't present in opts
  // (can happen when question generators produce degenerate option sets)
  const questions = React.useMemo(
    () => (rawQuestions || []).filter(q => q && Array.isArray(q.opts) && q.opts.includes(q.correct)),
    [rawQuestions]
  );
  const haptic = useHaptic();
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState(-1);
  const [streak, setStreak] = useState(0);
  const [_bestStreak, setBestStreak] = useState(0);
  const [burst, setBurst] = useState(-1);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [revealCorrect, setRevealCorrect] = useState(false);
  const [comboMsg, setComboMsg] = useState('');
  const [showCombo, setShowCombo] = useState(false);
  // Change 1: screen shake state
  const [shaking, setShaking] = useState(false);
  // Change 3: streak badge pulse state
  const [streakPulse, setStreakPulse] = useState(false);
  // Hearts system
  const [hearts, setHearts] = useState(() => {
    const h = challengeMode ? getHearts() : 5;
    return Math.min(5, Math.max(0, Number.isFinite(h) ? Math.floor(h) : 5));
  });
  const [gameOver, setGameOver] = useState(false);
  const [continueAnyway, setContinueAnyway] = useState(false);
  // Practice Mode toggle — disables heart deduction when active
  const [practiceMode, setPracticeMode] = useState(false);
  // Adaptive difficulty: wrong streak and correct streak
  const [wrongStreak, setWrongStreak] = useState(0);
  const [_correctStreak, setCorrectStreak] = useState(0);
  const [glowIndex, setGlowIndex] = useState(-1);
  const [showOnARoll, setShowOnARoll] = useState(false);
  // Question transition
  const [qTransition, setQTransition] = useState(false);
  // Mistake tracking for post-game review drill
  const [_mistakes, setMistakes] = useState([]);
  const firstOptionRef = useRef(null);
  const resultFired = useRef(false);
  const timersRef = useRef([]);

  // Clear all pending timers on unmount to prevent setState-after-teardown errors
  useEffect(() => () => { timersRef.current.forEach(clearTimeout); }, []);

  useEffect(() => {
    if (firstOptionRef.current) firstOptionRef.current.focus();
  }, [idx]);

  // Knight coaching — entry tip on mount
  useEffect(() => {
    const tips = [
      { mood: 'ready',       text: 'Hajdemo! Think fast — your Croatian intuition is stronger than you know. ⚔️' },
      { mood: 'happy',       text: 'Multiple choice: eliminate the wrong answers first. Croatian patterns will guide you. 🎯' },
      { mood: 'celebrating', text: 'Build a streak! Three in a row and vocabulary shifts from memory to instinct. That\'s fluency. 🔥' },
      { mood: 'encouraging', text: 'Don\'t second-guess your first instinct — it\'s usually the language brain speaking. 🧠' },
    ];
    const tip = tips[Math.floor(Math.random() * tips.length)];
    knightSpeak(tip.mood, tip.text, 800);
  }, []);  

  // Keyboard shortcuts 1–4 to select options
  useEffect(() => {
    if (answered) return undefined;
    const handleKeyNum = (e) => {
      const numKey = parseInt(e.key);
      if (numKey >= 1 && numKey <= (q?.opts?.length || 4)) {
        const optIndex = numKey - 1;
        if (q?.opts?.[optIndex] !== undefined) {
          handleAnswer(q.opts[optIndex], optIndex);
        }
      }
    };
    window.addEventListener('keydown', handleKeyNum);
    return () => window.removeEventListener('keydown', handleKeyNum);
  }, [answered, idx]);  

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
      timersRef.current.push(setTimeout(() => setBurst(-1), 900));
      setScore(s => s + 1);
      setWrongStreak(0);
      setStreak(s => {
        const ns = s + 1;
        setBestStreak(b => Math.max(b, ns));
        // Combo toast
        let msg = '';
        if (ns === 3) msg = '🔥 3 in a row!';
        else if (ns === 5) msg = '⚡ On fire! 5 streak!';
        else if (ns === 10) msg = '💥 Unstoppable! 10 streak!';
        else if (ns === 15) msg = '🌟 Legendary!';
        if (msg) {
          // Knight reacts to combo streaks
          if (ns === 3) knightSpeak('happy', 'Tri zaredom! Your Croatian memory is firing. 🔥');
          else if (ns === 5) knightSpeak('celebrating', 'Pet zaredom! Unstoppable! This is what fluency feels like. ⚡');
          else if (ns === 10) knightSpeak('victory', '10 in a row! Modrić scored less in the World Cup. 🌟');
          setComboMsg(msg);
          setShowCombo(true);
          // Change 3: pulse the streak badge for the combo toast duration
          setStreakPulse(true);
          timersRef.current.push(setTimeout(() => {
            setShowCombo(false);
            setStreakPulse(false);
          }, 1500));
        }
        return ns;
      });
      setCorrectStreak(cs => {
        const newCs = cs + 1;
        if (newCs === 5) {
          setShowOnARoll(true);
          timersRef.current.push(setTimeout(() => setShowOnARoll(false), 2000));
        }
        return newCs;
      });
    } else {
      haptic.wrong();
      playWrong();
      // Change 1: trigger screen shake
      setShaking(true);
      timersRef.current.push(setTimeout(() => setShaking(false), 500));
      setStreak(0);
      setCorrectStreak(0);
      setRevealCorrect(true);
      setShowCombo(false);
      setComboMsg('');
      setStreakPulse(false);
      if (q.hr) recordMistake(q.hr, q.en || q.correct || '', q.q || q.prompt || '', q.category || '');
      // Track unique mistakes for post-game review drill
      setMistakes(prev => {
        const key = q.hr || q.q || q.correct;
        if (prev.some(m => (m.hr || m.q || m.correct) === key)) return prev;
        return [...prev, q];
      });

      // Update wrong streak and handle help mode glow
      setWrongStreak(ws => {
        const newWs = ws + 1;
        if (newWs >= 3) {
          // Find correct answer index and highlight it for 1.5s
          const correctIdx = q.opts.indexOf(q.correct);
          if (correctIdx !== -1) {
            setGlowIndex(correctIdx);
            timersRef.current.push(setTimeout(() => setGlowIndex(-1), 1500));
          }
        }
        return newWs;
      });

      // Heart deduction: only in challengeMode OR if not in practiceMode (regular mode)
      if (challengeMode) {
        const remaining = loseHeart();
        setHearts(remaining);
        if (remaining === 0) {
          timersRef.current.push(setTimeout(() => setGameOver(true), 600)); // let animation finish
        }
      } else if (!practiceMode) {
        // Regular mode hearts deduction
        setHearts(h => {
          const newH = Math.max(0, h - 1);
          if (newH === 0) {
            timersRef.current.push(setTimeout(() => setGameOver(true), 600));
          }
          return newH;
        });
      }
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

  // "No hearts left" state — show before gameOver if continueAnyway not chosen
  if (gameOver && !continueAnyway) {
    return (
      <McGameOver
        challengeMode={challengeMode}
        onTryAgain={() => {
          setIdx(0);
          setScore(0);
          setHearts(5);
          setAnswered(false);
          setSelected(-1);
          setRevealCorrect(false);
          setStreak(0);
          setWrongStreak(0);
          setCorrectStreak(0);
          setGameOver(false);
          setMistakes([]);
          resultFired.current = false;
        }}
        onContinueAnyway={() => {
          setContinueAnyway(true);
          setGameOver(false);
        }}
        onBack={goBack}
      />
    );
  }

  return (
    // Change 1: apply shake animation to outer wrapper
    <div
      className="scr-wrap"
      style={{ animation: shaking ? 'mcShake 0.5s ease' : 'none' }}
    >
      <style>{MC_KEYFRAMES}</style>

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
            <button onClick={goBack} style={{padding:'12px 20px',borderRadius:10,border:'none',background:'var(--error)',color:'#fff',fontSize:12,fontWeight:800,cursor:'pointer',fontFamily:"'Outfit',sans-serif",minHeight:44}}>Quit</button>
            <button onClick={() => setConfirmQuit(false)} style={{padding:'12px 20px',borderRadius:10,border:'1.5px solid var(--inp-b)',background:'none',color:'var(--subtext)',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:"'Outfit',sans-serif",minHeight:44}}>Keep going</button>
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
              padding: '10px 16px',
              minHeight: 44,
              minWidth: 44,
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
                width: '100%',
                background: 'linear-gradient(90deg,var(--info),#06b6d4)',
                borderRadius: 10,
                transformOrigin: 'left center',
                transform: `scaleX(${progress / 100})`,
                transition: 'transform 0.5s cubic-bezier(0.4,0,0.2,1)',
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

        {/* Streak badge — Change 3: pulse with heartbeat during combo toast */}
        {streak >= 1 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background:
                'linear-gradient(135deg,rgba(249,115,22,.15),rgba(239,68,68,.1))',
              border: streakPulse
                ? '1.5px solid rgba(249,115,22,.7)'
                : '1.5px solid rgba(249,115,22,.3)',
              borderRadius: 20,
              padding: '4px 10px',
              fontSize: 13,
              fontWeight: 800,
              color: 'var(--warning, #ea580c)',
              animation: streakPulse ? 'heartbeat 0.4s ease infinite' : 'streakPop .3s ease',
              boxShadow: streakPulse ? '0 0 10px rgba(249,115,22,.45)' : 'none',
              transition: 'box-shadow .2s, border-color .2s',
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

        {/* Practice Mode toggle */}
        <button
          onClick={() => setPracticeMode(m => !m)}
          title={practiceMode ? 'Practice Mode ON (hearts disabled)' : 'Practice Mode OFF'}
          aria-label={practiceMode ? 'Practice Mode active — click to disable' : 'Enable Practice Mode'}
          style={{
            background: practiceMode ? 'rgba(99,102,241,0.15)' : 'none',
            border: practiceMode ? '1.5px solid rgba(99,102,241,0.5)' : '1.5px solid transparent',
            borderRadius: 10,
            cursor: 'pointer',
            fontSize: 20,
            padding: '6px 10px',
            minHeight: 44,
            minWidth: 44,
            marginLeft: 6,
            transition: 'background .15s, border-color .15s',
          }}
        >
          🛡️
        </button>
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

      {/* Hearts bar — always show, right-aligned */}
      <div style={{display:'flex', justifyContent:'flex-end', marginBottom:8}}>
        <HeartsBar hearts={hearts} />
      </div>

      {/* "On a roll" banner for 5 correct in a row */}
      {showOnARoll && (
        <div style={{
          textAlign: 'center',
          fontSize: 15,
          fontWeight: 900,
          color: '#f59e0b',
          animation: 'bounce-in 0.4s cubic-bezier(0.34,1.56,0.64,1)',
          marginBottom: 10,
          letterSpacing: '0.02em',
        }}>
          🔥 You're on a roll!
        </div>
      )}

      {/* Tip banner when wrongStreak >= 3 */}
      {wrongStreak >= 3 && (
        <div style={{
          marginBottom: 10,
          padding: '8px 14px',
          background: 'rgba(245,158,11,0.1)',
          border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: 10,
          fontSize: 12,
          color: '#92400e',
          fontWeight: 600,
          textAlign: 'center',
        }}>
          💡 Tip: Take your time — these are tricky!
        </div>
      )}

      {/* Combo toast */}
      {showCombo && (
        <div style={{
          textAlign: 'center', fontSize: 15, fontWeight: 900, color: '#f59e0b',
          animation: 'bounce-in 0.4s cubic-bezier(0.34,1.56,0.64,1)',
          marginBottom: 10, letterSpacing: '0.02em',
        }}>
          {comboMsg}
        </div>
      )}

      <McQuestionArea
        q={q}
        answered={answered}
        selected={selected}
        revealCorrect={revealCorrect}
        glowIndex={glowIndex}
        burst={burst}
        qTransition={qTransition}
        score={score}
        questions={questions}
        isLast={isLast}
        firstOptionRef={firstOptionRef}
        onAnswer={handleAnswer}
        onKey={handleKey}
        onNext={() => {
          if (!isLast) {
            setQTransition(true);
            timersRef.current.push(setTimeout(() => {
              setIdx(i => i + 1);
              setAnswered(false);
              setSelected(-1);
              setRevealCorrect(false);
              setQTransition(false);
            }, 200));
          } else {
            if (resultFired.current) return;
            resultFired.current = true;
            const pct = Math.round((score / questions.length) * 100);
            knightSpeak(
              pct >= 80 ? 'victory' : pct >= 50 ? 'celebrating' : 'encouraged',
              pct >= 80 ? `${pct}% correct — that quiz didn't stand a chance! ⚔️` :
              pct >= 50 ? `${score}/${questions.length} — solid. Come back and the remaining ${questions.length - score} will fall. 💪` :
              `${score}/${questions.length} this time. Every wrong answer is a memory your brain is building. 📐`,
              300
            );
            if (typeof award === 'function') award(score * XP_PER_CORRECT + XP_COMPLETION_BONUS, true);
            onComplete(questions, score);
          }
        }}
      />
    </div>
  );
}
