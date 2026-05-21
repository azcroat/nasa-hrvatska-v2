/**
 * src/components/profile/EquivalencyTestScreen.tsx
 *
 * CEFR equivalency-test runner. Renders a multi-item test for the level the
 * user is attempting to certify, tracks per-skill scores, then records the
 * attempt + shows pass/fail with targeted feedback.
 *
 * Entry path:
 *   - User has eligible level higher than their certified level → home/profile
 *     CTA links to setScr('equivalency'). Component reads the next test set
 *     via getNextTestFor(certifiedLevel). If there's no next test (user is
 *     already C2), shows the "all tests passed" celebration.
 *   - Retake gating: canTakeEquivalencyTest() decides if the user is in a
 *     cooldown window after a failure. If cooling down, we show why and
 *     when they can retry.
 *
 * UI states:
 *   - intro:  shows level being tested, item count, time estimate, "Begin"
 *   - cooldown: shows why retake is blocked + cooldown timer / lessons remaining
 *   - question: shows current item with 4 options; optional passage above
 *   - result: pass/fail with per-skill bars + recommended next step
 *
 * Design echoes PlacementTest.tsx so users get a familiar interaction style.
 *
 * @see src/lib/cefrCertification.ts — recording + cooldown logic
 * @see src/data/cefrEquivalencyItems.ts — item bank
 */

import React, { useEffect, useMemo, useState } from 'react';
import type { CefrLevel } from '../../lib/cefr.js';
import {
  canTakeEquivalencyTest,
  recordEquivalencyAttempt,
  computePassed,
  getCertifiedLevel,
  type SkillScores,
} from '../../lib/cefrCertification.js';
import {
  getNextTestFor,
  type EquivalencyItem,
  type EquivalencyTestSet,
} from '../../data/cefrEquivalencyItems.js';

interface EquivalencyTestScreenProps {
  /** User's eligible (activity-derived) level. Used to show context only. */
  userEligible: CefrLevel;
  /** User's lesson-completion count, for cooldown calc. */
  userLessonCount: number;
  /** Navigate to a different screen (e.g., back to profile). */
  setScr: (screen: string) => void;
  /** Optional: which specific level to test. Defaults to next-from-certified. */
  overrideLevel?: CefrLevel;
}

type Phase = 'intro' | 'cooldown' | 'question' | 'result';

interface SkillAccumulator {
  total: number;
  correct: number;
}

/**
 * Compute per-skill scores from accumulator. Returns 0..1 per skill.
 * Skills with zero items asked return undefined (the SkillScores type
 * permits this for `reading` and `listening`; vocab/grammar are always
 * present in our tests).
 */
function scoresFromAcc(
  acc: Record<'vocab' | 'grammar' | 'reading', SkillAccumulator>,
): SkillScores {
  const safe = (a: SkillAccumulator) => (a.total > 0 ? a.correct / a.total : 0);
  return {
    vocab: safe(acc.vocab),
    grammar: safe(acc.grammar),
    reading: acc.reading.total > 0 ? safe(acc.reading) : undefined,
  } as SkillScores;
}

function SkillBar({ icon, label, score }: { icon: string; label: string; score: number }) {
  const pct = Math.round(score * 100);
  const filled = Math.round(score * 10);
  const passed = score >= 0.8;
  const colour = passed ? '#16a34a' : score >= 0.5 ? '#f59e0b' : '#dc2626';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      <span style={{ fontSize: 16, width: 22, flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', width: 76, flexShrink: 0 }}>
        {label}
      </span>
      <div style={{ flex: 1, display: 'flex', gap: 2 }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 8,
              borderRadius: 4,
              background: i < filled ? colour : '#e5e7eb',
              transition: 'background .25s',
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color: colour, width: 56, textAlign: 'right' }}>
        {pct}%
      </span>
    </div>
  );
}

function formatCooldownEnd(at: number): string {
  const ms = at - Date.now();
  if (ms <= 0) return 'now';
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  if (days > 0) return `in ${days}d ${hours}h`;
  if (hours > 0) return `in ${hours}h`;
  return `in <1h`;
}

export default function EquivalencyTestScreen({
  userEligible,
  userLessonCount,
  setScr,
  overrideLevel,
}: EquivalencyTestScreenProps) {
  const certified = getCertifiedLevel();
  const targetLevel = overrideLevel ?? certified;
  const testSet: EquivalencyTestSet | null = useMemo(
    () => getNextTestFor(targetLevel),
    [targetLevel],
  );

  // Retake gate read ONCE on mount — re-reading mid-test would let a user
  // cycle the cooldown via UI navigation.
  const retake = useMemo(
    () => (testSet ? canTakeEquivalencyTest(testSet.levelFrom, userLessonCount) : null),
    [testSet, userLessonCount],
  );

  const initialPhase: Phase = !testSet
    ? 'result'
    : retake && !retake.canTake
      ? 'cooldown'
      : 'intro';
  const [phase, setPhase] = useState<Phase>(initialPhase);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [acc, setAcc] = useState<Record<'vocab' | 'grammar' | 'reading', SkillAccumulator>>({
    vocab: { total: 0, correct: 0 },
    grammar: { total: 0, correct: 0 },
    reading: { total: 0, correct: 0 },
  });
  const [resultPassed, setResultPassed] = useState<boolean | null>(null);
  const [resultScores, setResultScores] = useState<SkillScores | null>(null);

  // No-test edge case: user is already C2 (no further test exists).
  if (!testSet) {
    return (
      <div className="scr-wrap">
        <div style={{ padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 56 }}>🎓</div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", margin: '12px 0 6px' }}>
            You're at the top
          </h2>
          <p style={{ color: 'var(--subtext)', fontSize: 14, marginBottom: 18 }}>
            You've certified at C1 — Croatia's most advanced equivalency tier in this app. There is
            no C2 test (C2 is native-equivalent fluency, measured by formal external providers).
          </p>
          <button
            onClick={() => setScr('me')}
            style={{
              padding: '12px 22px',
              background: 'linear-gradient(135deg,#0e7490,#0a5c73)',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  const currentItem: EquivalencyItem | undefined = testSet.items[questionIndex];

  function handleSelect(i: number) {
    if (answered) return;
    setSelectedIndex(i);
    setAnswered(true);
    if (!currentItem) return;
    const isCorrect = i === currentItem.c;
    const skill = currentItem.skill;
    setAcc((prev) => ({
      ...prev,
      [skill]: {
        total: prev[skill].total + 1,
        correct: prev[skill].correct + (isCorrect ? 1 : 0),
      },
    }));
  }

  function handleNext() {
    setSelectedIndex(null);
    setAnswered(false);
    // testSet is narrowed at the top of render but the closure-captured
    // reference here loses that narrowing. Re-assert with a local const so
    // tsc strict-null-checks pass without `!` everywhere.
    const set = testSet;
    if (!set) return;
    if (questionIndex + 1 >= set.items.length) {
      // Test complete — record + show result.
      const finalAcc = acc;
      const scores = scoresFromAcc(finalAcc);
      const { passed } = computePassed(scores);
      recordEquivalencyAttempt({
        level: set.levelFrom,
        scores,
        currentLessonCount: userLessonCount,
      });
      setResultPassed(passed);
      setResultScores(scores);
      setPhase('result');
      return;
    }
    setQuestionIndex((i) => i + 1);
  }

  // ── Intro ────────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="scr-wrap">
        <div style={{ padding: '18px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#cc0000', letterSpacing: '.22em' }}>
            CEFR EQUIVALENCY TEST
          </div>
          <h2
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: 26,
              margin: '6px 0 12px',
              color: 'var(--heading)',
            }}
          >
            {testSet.levelFrom} → {testSet.levelTo}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--subtext)', lineHeight: 1.6, marginBottom: 18 }}>
            {testSet.description}
          </p>
          <div
            style={{
              background: 'var(--card)',
              border: '1.5px solid var(--card-b)',
              borderRadius: 12,
              padding: '14px 16px',
              marginBottom: 14,
            }}
          >
            <p style={{ fontWeight: 800, marginBottom: 8, color: 'var(--heading)' }}>
              What to expect
            </p>
            <ul style={{ paddingLeft: 18, fontSize: 13, color: 'var(--subtext)', lineHeight: 1.6 }}>
              <li>{testSet.items.length} multiple-choice items</li>
              <li>~{testSet.minutes} minutes</li>
              <li>Mix of vocabulary, grammar, and reading comprehension</li>
              <li>
                Pass = <b>80%+</b> overall AND on every skill
              </li>
              <li>Fail = 7-day cooldown OR 5 more lessons before retry</li>
            </ul>
          </div>
          <div
            style={{
              background: 'rgba(204,0,0,0.06)',
              border: '1.5px solid rgba(204,0,0,0.2)',
              borderRadius: 12,
              padding: '12px 14px',
              marginBottom: 18,
              fontSize: 13,
              color: '#a30000',
              lineHeight: 1.5,
            }}
          >
            <b>Real fluency only.</b> Your eligible level (<b>{userEligible}</b>) reflects activity.
            Passing this test reflects demonstrated competency at <b>{testSet.levelFrom}</b>.
          </div>
          <button
            data-testid="equivalency-begin"
            onClick={() => setPhase('question')}
            style={{
              display: 'block',
              width: '100%',
              padding: '16px',
              background: 'linear-gradient(135deg,#16a34a,#15803d)',
              color: '#fff',
              border: 'none',
              borderRadius: 14,
              fontSize: 16,
              fontWeight: 800,
              cursor: 'pointer',
              marginBottom: 10,
            }}
          >
            Begin Test →
          </button>
          <button
            onClick={() => setScr('me')}
            style={{
              display: 'block',
              width: '100%',
              padding: '12px',
              background: 'transparent',
              color: 'var(--subtext)',
              border: '1.5px solid var(--card-b)',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ── Cooldown ────────────────────────────────────────────────────────────
  if (phase === 'cooldown') {
    if (!retake) return null;
    return (
      <div className="scr-wrap">
        <div style={{ padding: '24px 18px', textAlign: 'center' }}>
          <div style={{ fontSize: 56 }}>⏳</div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", margin: '10px 0 4px' }}>
            Retake on cooldown
          </h2>
          <p style={{ color: 'var(--subtext)', fontSize: 14, lineHeight: 1.6, marginBottom: 18 }}>
            {retake.reason === 'already_passed'
              ? `You've already passed the ${testSet.levelFrom} test. No need to retake.`
              : retake.cooldownUntil
                ? `You can retake the ${testSet.levelFrom} test ${formatCooldownEnd(retake.cooldownUntil)} — or sooner if you complete ${retake.lessonsRemaining} more lesson${retake.lessonsRemaining === 1 ? '' : 's'}.`
                : 'Retake unavailable for now.'}
          </p>
          <button
            onClick={() => setScr('me')}
            style={{
              padding: '12px 22px',
              background: 'linear-gradient(135deg,#0e7490,#0a5c73)',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  // ── Question ────────────────────────────────────────────────────────────
  if (phase === 'question' && currentItem) {
    return (
      <div className="scr-wrap">
        <div style={{ padding: 16 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 12,
              color: 'var(--subtext)',
              marginBottom: 12,
            }}
          >
            <span>
              Question {questionIndex + 1} / {testSet.items.length}
            </span>
            <span style={{ textTransform: 'uppercase', fontWeight: 700 }}>{currentItem.skill}</span>
          </div>
          {/* Progress bar */}
          <div
            style={{
              height: 4,
              background: '#e5e7eb',
              borderRadius: 2,
              marginBottom: 18,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${((questionIndex + (answered ? 1 : 0)) / testSet.items.length) * 100}%`,
                background: 'linear-gradient(90deg,#16a34a,#0e7490)',
                height: '100%',
                transition: 'width .3s',
              }}
            />
          </div>
          {currentItem.passage && (
            <div
              style={{
                background: '#fffbeb',
                border: '1.5px solid #fde68a',
                borderRadius: 10,
                padding: '12px 14px',
                fontSize: 14,
                lineHeight: 1.6,
                marginBottom: 14,
                color: '#78350f',
              }}
            >
              {currentItem.passage}
            </div>
          )}
          <p
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--heading)',
              marginBottom: 14,
              lineHeight: 1.4,
            }}
          >
            {currentItem.q}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
            {currentItem.o.map((opt, i) => {
              const isSelected = selectedIndex === i;
              const isCorrect = answered && i === currentItem.c;
              const isWrongSelection = answered && isSelected && i !== currentItem.c;
              const colour = isCorrect
                ? '#16a34a'
                : isWrongSelection
                  ? '#dc2626'
                  : isSelected
                    ? '#0e7490'
                    : 'var(--card-b)';
              const bg = isCorrect
                ? '#dcfce7'
                : isWrongSelection
                  ? '#fee2e2'
                  : isSelected
                    ? '#e0f2fe'
                    : 'var(--card)';
              return (
                <button
                  key={i}
                  data-testid={`equivalency-opt-${i}`}
                  onClick={() => handleSelect(i)}
                  disabled={answered}
                  style={{
                    padding: '14px 16px',
                    textAlign: 'left',
                    background: bg,
                    border: `1.5px solid ${colour}`,
                    borderRadius: 12,
                    fontSize: 15,
                    color: 'var(--heading)',
                    cursor: answered ? 'default' : 'pointer',
                    fontWeight: isCorrect ? 700 : 500,
                    transition: 'background .15s, border .15s',
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          <button
            data-testid="equivalency-next"
            onClick={handleNext}
            disabled={!answered}
            style={{
              display: 'block',
              width: '100%',
              padding: '14px',
              background: answered ? 'linear-gradient(135deg,#16a34a,#15803d)' : '#e5e7eb',
              color: answered ? '#fff' : '#9ca3af',
              border: 'none',
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 800,
              cursor: answered ? 'pointer' : 'not-allowed',
            }}
          >
            {questionIndex + 1 >= testSet.items.length ? 'Finish Test' : 'Next Question →'}
          </button>
        </div>
      </div>
    );
  }

  // ── Result ──────────────────────────────────────────────────────────────
  if (phase === 'result' && resultScores) {
    const passed = resultPassed === true;
    return (
      <div className="scr-wrap">
        <div style={{ padding: '20px 18px', textAlign: 'center' }}>
          <div style={{ fontSize: 64 }}>{passed ? '🎉' : '💪'}</div>
          <h2
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: 28,
              margin: '8px 0 4px',
              color: passed ? '#16a34a' : '#dc2626',
            }}
          >
            {passed ? `Certified ${testSet.levelFrom}` : 'Not yet'}
          </h2>
          <p style={{ color: 'var(--subtext)', fontSize: 14, marginBottom: 18 }}>
            {passed
              ? `You're now certified at ${testSet.levelFrom}. ${testSet.levelTo} content is unlocked.`
              : `You need 80% on every skill to certify. Keep practicing — retest after 5 more lessons or 7 days.`}
          </p>
          <div
            style={{
              background: 'var(--card)',
              border: '1.5px solid var(--card-b)',
              borderRadius: 12,
              padding: '16px 14px',
              marginBottom: 18,
              textAlign: 'left',
            }}
          >
            <p style={{ fontWeight: 800, color: 'var(--heading)', marginBottom: 12 }}>
              Your skill breakdown
            </p>
            <SkillBar icon="📚" label="Vocabulary" score={resultScores.vocab} />
            <SkillBar icon="📝" label="Grammar" score={resultScores.grammar} />
            {resultScores.reading !== undefined && (
              <SkillBar icon="📖" label="Reading" score={resultScores.reading} />
            )}
          </div>
          <button
            onClick={() => setScr('me')}
            style={{
              padding: '14px 22px',
              background: 'linear-gradient(135deg,#0e7490,#0a5c73)',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontWeight: 800,
              fontSize: 14,
              cursor: 'pointer',
              width: '100%',
            }}
          >
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  return null;
}
