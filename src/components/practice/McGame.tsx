import React, { useEffect, useRef, useState } from 'react';
import type { McQuestion } from '../../hooks/useMcGameReducer';
import { srMark, recordMistake } from '../../data';
import { recordTopicResult } from '../../lib/adaptive.js';
import { useHaptic } from '../../hooks/useHaptic';
import { playCorrect, playWrong } from '../../lib/soundSettings.js';
import { getHearts, loseHeart } from '../../lib/lives.js';
import HeartsBar from '../shared/HeartsBar';
import McGameOver from './McGameOver';
import McQuestionArea from './McQuestionArea';
import { knightSpeak, knightFlash } from '../../lib/knightSpeak.js';
import { useMcGameReducer } from '../../hooks/useMcGameReducer';
import { apiFetch } from '../../lib/apiFetch.js';
import { markQuest } from '../../lib/quests.js';

const XP_PER_CORRECT = 3;
const XP_COMPLETION_BONUS = 5;

// Grammar tips shown after a wrong answer when the question has a known category.
// Surfacing the underlying grammar rule (DuoLingo best-practice: error → insight).
const GRAMMAR_TIPS = {
  numbers:
    '💡 After 2–4 use genitive singular (dva stola). After 5+ use genitive plural (pet stolova).',
  greetings:
    '💡 Croatian has formal "Vi" (strangers/elders) and informal "ti" (friends/family). When unsure, use Vi.',
  verbs:
    '💡 Croatian verbs have two aspects: imperfective (ongoing action) vs perfective (completed). e.g., pisati vs napisati.',
  time: '💡 Croatian uses "u pola" for half-past: u pola tri = 2:30 (half to 3, not half past 2!).',
  family:
    '💡 Nouns change endings by gender: -a for feminine, consonant for masculine, -o/-e for neuter.',
  food: '💡 Quantities use genitive: čaša vode (glass of water), komad kruha (piece of bread).',
  adjectives:
    '💡 Adjectives agree with the noun in gender, case, and number. e.g., dobar čovjek / dobra žena.',
  pronouns:
    '💡 Croatian has short clitic pronouns (me, te, ga, mu, joj) that must follow the first stressed word.',
  questions:
    '💡 Yes/no questions: add "li" after the verb. e.g., Govoriš li hrvatski? (Do you speak Croatian?)',
  negation:
    '💡 Negation fuses with "have" and "be": imam → nemam, je → nije. Other verbs: ne + verb.',
  travel:
    '💡 Locations use locative case: u gradu (in the city), na plaži (at the beach), kod kuće (at home).',
  colors:
    '💡 Colors are adjectives and agree with the noun: crvena kuća (f), crveni auto (m), crveno more (n).',
  body: '💡 "Boli me glava" = My head hurts. Croatian body-pain uses accusative of the sufferer.',
  animals:
    '💡 Animal gender determines endings: pas (m), mačka (f), pile (n). Gender changes all adjectives agreeing with it.',
  weather:
    '💡 Weather uses impersonal verbs: Pada kiša (It rains), Puše vjetar (Wind blows). No subject needed.',
  clothes:
    '💡 Oblačiti = to put on (action). Nositi = to wear (state). Different verbs for the same English "to wear".',
  grammar:
    "💡 Croatian has 7 cases. Each tells you the noun's role: nominative (subject), accusative (object), genitive (possession)…",
};

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

interface McGameProps {
  questions: McQuestion[];
  onComplete: (questions: McQuestion[], score: number) => void;
  goBack: () => void;
  award: ((xp: number, bonus?: boolean) => void) | undefined;
  challengeMode?: boolean;
}
export default function McGame({
  questions: rawQuestions,
  onComplete,
  goBack,
  award,
  challengeMode = false,
}: McGameProps) {
  // Guard: drop any question where the correct answer isn't present in opts
  const questions = React.useMemo(
    () =>
      (rawQuestions || []).filter(
        (q: McQuestion) => q && Array.isArray(q.opts) && q.opts.includes(q.correct),
      ),
    [rawQuestions],
  );

  const heartsAlwaysOn = (() => {
    try {
      return localStorage.getItem('nh_hearts_always_on') === 'true';
    } catch {
      return false;
    }
  })();
  const isHeartsMode = challengeMode || heartsAlwaysOn;
  const haptic = useHaptic();

  const initialHearts = React.useMemo(() => {
    const h = isHeartsMode ? getHearts() : 5;
    return Math.min(5, Math.max(0, Number.isFinite(h) ? Math.floor(h) : 5));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — initial hearts must not recompute on re-renders

  const [state, dispatch] = useMcGameReducer(questions, initialHearts);

  // AI explain-error: null | 'loading' | {explanation, rule, tip, example}
  const [aiExplain, setAiExplain] = useState<
    null | 'loading' | { explanation?: string; rule?: string; tip?: string; example?: string }
  >(null);

  // Stable refs — not state; preventing setState-after-teardown and double-fire
  const firstOptionRef = useRef<HTMLButtonElement | null>(null);
  const resultFired = useRef(false);
  const clearedIndices = useRef(new Set<number>());
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const q = state.queue[0] ?? null;

  // Clear all pending timers on unmount
  useEffect(
    () => () => {
      timersRef.current.forEach(clearTimeout);
    },
    [],
  );

  // Focus first option when question changes
  useEffect(() => {
    if (firstOptionRef.current) firstOptionRef.current.focus();
  }, [q?._qIdx]);

  // Knight coaching — entry tip on mount
  useEffect(() => {
    const tips = [
      {
        mood: 'ready',
        text: 'Hajdemo! Think fast — your Croatian intuition is stronger than you know. ⚔️',
      },
      {
        mood: 'happy',
        text: 'Multiple choice: eliminate the wrong answers first. Croatian patterns will guide you. 🎯',
      },
      {
        mood: 'celebrating',
        text: "Build a streak! Three in a row and vocabulary shifts from memory to instinct. That's fluency. 🔥",
      },
      {
        mood: 'encouraging',
        text: "Don't second-guess your first instinct — it's usually the language brain speaking. 🧠",
      },
    ];
    const tip = tips[Math.floor(Math.random() * tips.length)]!;
    knightSpeak(tip.mood, tip.text, 800);
  }, []);

  // Keyboard shortcuts 1–4 to select options
  useEffect(() => {
    if (state.answered) return undefined;
    const handleKeyNum = (e: KeyboardEvent) => {
      const numKey = parseInt(e.key);
      if (numKey >= 1 && numKey <= (q?.opts?.length || 4)) {
        const optIndex = numKey - 1;
        if (q?.opts?.[optIndex] !== undefined) handleAnswer(q.opts[optIndex], optIndex);
      }
    };
    window.addEventListener('keydown', handleKeyNum);
    return () => window.removeEventListener('keydown', handleKeyNum);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.answered, q?._qIdx]); // handleAnswer captured via closure — stable within question lifecycle

  if (!q) return null;
  // TypeScript cannot narrow `q` across function closures — re-assert as non-null
  const currentQ = q;

  function handleAnswer(o: string, i: number) {
    if (state.answered) return;

    const isCorrect = o === currentQ.correct;

    // ── Side effects (imperative, cannot live in reducer) ──────────────────────
    if (isCorrect) {
      haptic.correct();
      playCorrect();
      // Knight reacts to combo milestones — must know next streak value
      const nextStreak = state.streak + 1;
      if (nextStreak === 3) knightSpeak('happy', 'Tri zaredom! Your Croatian memory is firing. 🔥');
      if (nextStreak === 5)
        knightSpeak('celebrating', 'Pet zaredom! Unstoppable! This is what fluency feels like. ⚡');
      if (nextStreak === 10)
        knightSpeak('victory', '10 in a row! Modrić scored less in the World Cup. 🌟');
      // Knight flash — face reaction to correct answer
      if (nextStreak >= 3) {
        knightFlash('onfire', 2000);
      } else if (Math.random() < 0.2) {
        knightFlash('winking', 1500);
      }
    } else {
      haptic.wrong();
      playWrong();
      if (currentQ.hr)
        recordMistake(
          currentQ.hr,
          currentQ.en || currentQ.correct || '',
          currentQ.q || currentQ.prompt || '',
          currentQ.category || '',
          undefined,
        );
      // Knight reacts to wrong answers — first mistake is gentle curiosity; streak of 3+ escalates to focus cue
      const nextWrongStreak = state.wrongStreak + 1;
      if (nextWrongStreak === 1)
        knightSpeak(
          'thinking',
          "Nije točno — but your brain just noticed it. That's how memory forms. 📐",
        );
      else if (nextWrongStreak === 3)
        knightSpeak(
          'encouraged',
          'Tri greške zaredom — slow down and feel the pattern. It will click. 💪',
        );
      // Knight flash — face reaction to wrong answer
      knightFlash(nextWrongStreak >= 3 ? 'struggling' : 'oops', nextWrongStreak >= 3 ? 2000 : 1500);
      // Fetch AI explanation for this error (fire-and-forget, non-blocking)
      const wrongOpt = currentQ.opts[i] ?? '';
      setAiExplain('loading' as const);
      apiFetch('/api/explain-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wrong: wrongOpt,
          correct: currentQ.correct,
          context: currentQ.hr || currentQ.q || '',
          type: 'multiple_choice',
          level: localStorage.getItem('nh_level') || 'B1',
        }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          setAiExplain(d?.explanation ? d : null);
        })
        .catch(() => {
          setAiExplain(null);
        });
    }
    if (currentQ.hr) srMark(currentQ.hr, isCorrect, 0);
    if (currentQ.hr) recordTopicResult('vocabulary', isCorrect);

    // Persistent hearts: call loseHeart() before dispatch so reducer receives result
    const persistentHeartsAfter = !isCorrect && isHeartsMode ? loseHeart() : undefined;

    // ── Dispatch atomic state transition ───────────────────────────────────────
    dispatch({
      type: 'ANSWER',
      payload: {
        isCorrect,
        optionIndex: i,
        question: currentQ,
        grammarTip: isCorrect
          ? null
          : ((GRAMMAR_TIPS as Record<string, string>)[(currentQ.category || '').toLowerCase()] ??
            null),
        persistentHeartsAfter,
        isHeartsMode,
      },
    });

    // ── Schedule timer-driven state resets ─────────────────────────────────────
    if (isCorrect) {
      timersRef.current.push(setTimeout(() => dispatch({ type: 'CLEAR_BURST' }), 900));
      const nextStreak = state.streak + 1;
      if (nextStreak === 3 || nextStreak === 5 || nextStreak === 10 || nextStreak === 15) {
        timersRef.current.push(setTimeout(() => dispatch({ type: 'HIDE_COMBO' }), 1500));
      }
      if (state.correctStreak + 1 === 5) {
        timersRef.current.push(setTimeout(() => dispatch({ type: 'CLEAR_ON_A_ROLL' }), 2000));
      }
    } else {
      timersRef.current.push(setTimeout(() => dispatch({ type: 'CLEAR_SHAKE' }), 500));
      if (state.wrongStreak + 1 >= 3) {
        timersRef.current.push(setTimeout(() => dispatch({ type: 'CLEAR_GLOW' }), 1500));
      }
      const newHearts = isHeartsMode
        ? (persistentHeartsAfter ?? state.hearts)
        : state.practiceMode
          ? state.hearts
          : Math.max(0, state.hearts - 1);
      if (newHearts === 0) {
        timersRef.current.push(setTimeout(() => dispatch({ type: 'TRIGGER_GAME_OVER' }), 600));
      }
    }
  }

  function handleNext() {
    setAiExplain(null);
    const wasCorrect = state.selected !== -1 && currentQ.opts[state.selected] === currentQ.correct;

    if (wasCorrect) {
      if (!clearedIndices.current.has(currentQ._qIdx)) {
        clearedIndices.current.add(currentQ._qIdx);
      }

      if (state.queue.length === 1) {
        // Last question — fire completion before advancing
        if (resultFired.current) return;
        resultFired.current = true;

        const finalScore = state.score;
        const pct = Math.round((finalScore / questions.length) * 100);
        if (pct >= 90) {
          knightSpeak('tearsofjoy', `${pct}% — Savršeno! Nevjerojatno si dobar/a! 🌟`, 300);
        } else {
          knightSpeak(
            pct >= 80 ? 'victory' : pct >= 50 ? 'celebrating' : 'encouraged',
            pct >= 80
              ? `${pct}% correct — that quiz didn't stand a chance! ⚔️`
              : pct >= 50
                ? `${finalScore}/${questions.length} — solid. Come back and the remaining ${questions.length - finalScore} will fall. 💪`
                : `${finalScore}/${questions.length} this time. Every wrong answer is a memory your brain is building. 📐`,
            300,
          );
        }

        const uniqueCleared = clearedIndices.current.size;
        if (typeof award === 'function')
          award(uniqueCleared * XP_PER_CORRECT + XP_COMPLETION_BONUS, true);
        markQuest('vocab');
        onComplete(questions, finalScore);
        return; // don't advance — let onComplete unmount
      }

      dispatch({ type: 'ADVANCE_CORRECT' });
      timersRef.current.push(setTimeout(() => dispatch({ type: 'COMPLETE_TRANSITION' }), 200));
    } else {
      dispatch({ type: 'RE_QUEUE_WRONG' });
      timersRef.current.push(setTimeout(() => dispatch({ type: 'COMPLETE_TRANSITION' }), 200));
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLButtonElement>, i: number) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      const next = e.currentTarget.parentElement?.children[
        Math.min(i + 1, currentQ.opts.length - 1)
      ] as HTMLElement | undefined;
      if (next) next.focus();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = e.currentTarget.parentElement?.children[Math.max(i - 1, 0)] as
        | HTMLElement
        | undefined;
      if (prev) prev.focus();
    }
  }

  const progress = questions.length ? (state.clearedCount / questions.length) * 100 : 0;
  const wasCurrentCorrect =
    state.answered && state.selected !== -1 && currentQ.opts[state.selected] === currentQ.correct;
  const isLast = state.queue.length === 1 && wasCurrentCorrect;

  // "No hearts left" — show game-over screen unless user chose to continue
  if (state.gameOver && !state.continueAnyway) {
    return (
      <McGameOver
        challengeMode={challengeMode}
        onTryAgain={() => {
          const freshH = isHeartsMode ? getHearts() : 5;
          const h = Math.min(5, Math.max(0, Number.isFinite(freshH) ? Math.floor(freshH) : 5));
          clearedIndices.current = new Set();
          resultFired.current = false;
          dispatch({ type: 'RESET', questions, hearts: h });
        }}
        onContinueAnyway={() => dispatch({ type: 'SET_CONTINUE_ANYWAY' })}
        onBack={goBack}
      />
    );
  }

  return (
    <div
      className={state.answered ? 'scr-wrap has-cta' : 'scr-wrap'}
      style={{ animation: state.shaking ? 'mcShake 0.5s ease' : 'none' }}
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
        {state.confirmQuit ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--subtext)' }}>
              Quit game?
            </span>
            <button
              onClick={goBack}
              style={{
                padding: '12px 20px',
                borderRadius: 10,
                border: 'none',
                background: 'var(--error)',
                color: '#fff',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                fontFamily: "'Outfit',sans-serif",
                minHeight: 44,
              }}
            >
              Quit
            </button>
            <button
              onClick={() => dispatch({ type: 'SET_CONFIRM_QUIT', value: false })}
              style={{
                padding: '12px 20px',
                borderRadius: 10,
                border: '1.5px solid var(--inp-b)',
                background: 'none',
                color: 'var(--subtext)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: "'Outfit',sans-serif",
                minHeight: 44,
              }}
            >
              Keep going
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              if (state.clearedCount === 0 && !state.answered) {
                goBack();
              } else {
                dispatch({ type: 'SET_CONFIRM_QUIT', value: true });
              }
            }}
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

        {/* Streak badge */}
        {state.streak >= 1 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'linear-gradient(135deg,rgba(249,115,22,.15),rgba(239,68,68,.1))',
              border: state.streakPulse
                ? '1.5px solid rgba(249,115,22,.7)'
                : '1.5px solid rgba(249,115,22,.3)',
              borderRadius: 20,
              padding: '4px 10px',
              fontSize: 13,
              fontWeight: 800,
              color: 'var(--warning, #ea580c)',
              animation: state.streakPulse ? 'heartbeat 0.4s ease infinite' : 'streakPop .3s ease',
              boxShadow: state.streakPulse ? '0 0 10px rgba(249,115,22,.45)' : 'none',
              transition: 'box-shadow .2s, border-color .2s',
            }}
          >
            <span
              style={{ animation: 'flameDance 1s ease-in-out infinite', display: 'inline-block' }}
            >
              🔥
            </span>
            {state.streak}
          </div>
        )}

        {/* Practice Mode toggle */}
        <button
          onClick={() => dispatch({ type: 'TOGGLE_PRACTICE_MODE' })}
          title={state.practiceMode ? 'Practice Mode ON (hearts disabled)' : 'Practice Mode OFF'}
          aria-label={
            state.practiceMode ? 'Practice Mode active — click to disable' : 'Enable Practice Mode'
          }
          style={{
            background: state.practiceMode ? 'rgba(99,102,241,0.15)' : 'none',
            border: state.practiceMode
              ? '1.5px solid rgba(99,102,241,0.5)'
              : '1.5px solid transparent',
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
        {q._isRetry
          ? `🔄 Retry · ${state.score} correct`
          : `Question ${state.clearedCount + 1} of ${questions.length} · ${state.score} correct`}
      </div>

      {/* Hearts bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <HeartsBar hearts={state.hearts} />
      </div>

      {/* "On a roll" banner */}
      {state.showOnARoll && (
        <div
          style={{
            textAlign: 'center',
            fontSize: 15,
            fontWeight: 900,
            color: '#f59e0b',
            animation: 'bounce-in 0.4s cubic-bezier(0.34,1.56,0.64,1)',
            marginBottom: 10,
            letterSpacing: '0.02em',
          }}
        >
          🔥 You're on a roll!
        </div>
      )}

      {/* Tip banner when wrongStreak >= 3 */}
      {state.wrongStreak >= 3 && (
        <div
          style={{
            marginBottom: 10,
            padding: '8px 14px',
            background: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: 10,
            fontSize: 12,
            color: '#92400e',
            fontWeight: 600,
            textAlign: 'center',
          }}
        >
          💡 Tip: Take your time — these are tricky!
        </div>
      )}

      {/* Grammar tip */}
      {state.grammarTip && state.answered && !wasCurrentCorrect && (
        <div
          style={{
            marginBottom: 10,
            padding: '10px 14px',
            background: 'rgba(99,102,241,0.08)',
            border: '1.5px solid rgba(99,102,241,0.25)',
            borderRadius: 12,
            fontSize: 12,
            color: '#3730a3',
            fontWeight: 600,
            lineHeight: 1.5,
            animation: 'bounce-in 0.3s cubic-bezier(0.34,1.56,0.64,1)',
          }}
        >
          {state.grammarTip}
        </div>
      )}

      {/* AI explain-error card — appears on wrong answers */}
      {state.answered && !wasCurrentCorrect && aiExplain === 'loading' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 14px',
            borderRadius: 12,
            marginBottom: 10,
            background: 'var(--bar-bg)',
            border: '1px solid var(--card-b)',
            fontSize: 12,
            color: 'var(--subtext)',
            fontWeight: 600,
            animation: 'fadeIn .3s ease',
          }}
        >
          <span style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>🤖</span>
          <span>Getting AI explanation…</span>
        </div>
      )}
      {state.answered && !wasCurrentCorrect && aiExplain && aiExplain !== 'loading' && (
        <div
          style={{
            background: 'linear-gradient(135deg,rgba(124,58,237,.06),rgba(124,58,237,.03))',
            border: '1.5px solid rgba(124,58,237,.22)',
            borderRadius: 14,
            padding: '14px 16px',
            marginBottom: 10,
            animation: 'spring-in .3s ease .1s both',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 8,
              fontSize: 11,
              fontWeight: 800,
              color: '#7c3aed',
              textTransform: 'uppercase',
              letterSpacing: '.08em',
            }}
          >
            <span>🤖</span>
            <span>AI Explanation · {aiExplain.rule}</span>
          </div>
          <div
            style={{
              fontSize: 13,
              color: 'var(--heading)',
              lineHeight: 1.6,
              marginBottom: aiExplain.tip ? 8 : 0,
            }}
          >
            {aiExplain.explanation}
          </div>
          {aiExplain.tip && (
            <div
              style={{
                fontSize: 12,
                color: 'var(--subtext)',
                fontStyle: 'italic',
                padding: '6px 10px',
                borderRadius: 8,
                marginTop: 4,
                background: 'rgba(124,58,237,.06)',
                borderLeft: '3px solid rgba(124,58,237,.4)',
              }}
            >
              💡 {aiExplain.tip}
            </div>
          )}
          {aiExplain.example && (
            <div style={{ fontSize: 12, color: '#7c3aed', fontWeight: 700, marginTop: 6 }}>
              e.g. {aiExplain.example}
            </div>
          )}
        </div>
      )}

      {/* Combo toast */}
      {state.showCombo && (
        <div
          style={{
            textAlign: 'center',
            fontSize: 15,
            fontWeight: 900,
            color: '#f59e0b',
            animation: 'bounce-in 0.4s cubic-bezier(0.34,1.56,0.64,1)',
            marginBottom: 10,
            letterSpacing: '0.02em',
          }}
        >
          {state.comboMsg}
        </div>
      )}

      <McQuestionArea
        q={q}
        answered={state.answered}
        selected={state.selected}
        revealCorrect={state.revealCorrect}
        glowIndex={state.glowIndex}
        burst={state.burst}
        qTransition={state.qTransition}
        score={state.score}
        questions={questions}
        isLast={isLast}
        firstOptionRef={firstOptionRef}
        onAnswer={handleAnswer}
        onKey={handleKey}
      />

      {/* Sticky CTA bar */}
      {state.answered && (
        <div className="cta-bar">
          <button
            className="b bp"
            style={{
              fontSize: 16,
              padding: '14px',
              fontFamily: "'Outfit',sans-serif",
              cursor: 'pointer',
            }}
            onClick={handleNext}
          >
            {isLast ? '🏆 See Results' : wasCurrentCorrect ? 'Next →' : 'Got it →'}
          </button>
        </div>
      )}
    </div>
  );
}
