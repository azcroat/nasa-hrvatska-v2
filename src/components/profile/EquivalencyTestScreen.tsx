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
 *   - question: delegated to ExamRunner (MCQ runner with data-testid answer-N,
 *               exam-next, exam-progress)
 *   - result: pass/fail with per-skill bars + recommended next step
 *
 * Design echoes PlacementTest.tsx so users get a familiar interaction style.
 *
 * @see src/lib/cefrCertification.ts — recording + cooldown logic
 * @see src/data/cefrEquivalencyItems.ts — item bank
 * @see src/components/exam/ExamRunner.tsx — shared MCQ runner
 */

import React, { useCallback, useMemo, useState } from 'react';
import { cefrRank, type CefrLevel } from '../../lib/cefr.js';
import {
  canTakeEquivalencyTest,
  recordEquivalencyAttempt,
  computePassed,
  getCertifiedLevel,
  isSpeakingGateEnforced,
  type SkillScores,
} from '../../lib/cefrCertification.js';
import { getNextTestFor, type EquivalencyTestSet } from '../../data/cefrEquivalencyItems.js';
import { getSpeakingTasks } from '../../data/speakingTasks.js';
import { whisperClaudeScorer } from '../../lib/speaking/whisperClaudeScorer.js';
import ExamRunner from '../exam/ExamRunner.js';
import type { RunnerQuestion } from '../../lib/checkpointExam.js';

// Speaking becomes a measured skill in the equivalency test from B1 up (A1/A2
// speech samples are too short to score fairly). In shadow mode the score is
// shown but does not gate — see isSpeakingGateEnforced.
const SPEAKING_FLOOR: CefrLevel = 'B1';

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
  const [resultPassed, setResultPassed] = useState<boolean | null>(null);
  const [resultScores, setResultScores] = useState<SkillScores | null>(null);

  // Map the test set's items to ExamRunner's RunnerQuestion shape.
  // EquivalencyItem stores the 4 options in field `o` (not `options`).
  const runnerQuestions: RunnerQuestion[] = useMemo(
    () =>
      (testSet?.items ?? []).map((it, i) => ({
        id: `${testSet!.levelFrom}#${i}`,
        skill: it.skill,
        prompt: it.q,
        options: [...it.o], // it.o is the 4-option tuple on EquivalencyItem
        correctIndex: it.c,
        passage: it.passage,
        level: testSet!.levelFrom,
      })),
    [testSet],
  );

  // Speaking section for B1+ certification. In shadow mode the result is shown
  // and recorded but does not affect pass/fail (see isSpeakingGateEnforced).
  const speaking = useMemo(() => {
    if (!testSet) return undefined;
    if (cefrRank(testSet.levelFrom) < cefrRank(SPEAKING_FLOOR)) return undefined;
    const tasks = getSpeakingTasks(testSet.levelFrom);
    if (tasks.length === 0) return undefined;
    return { level: testSet.levelFrom, tasks, scorer: whisperClaudeScorer };
  }, [testSet]);

  // Called by ExamRunner when all questions have been answered.
  const onExamComplete = useCallback(
    (scores: SkillScores) => {
      // Speaking gates only once enforced (date gate); shadow mode records it
      // without effect. When enforced, a B1+ attempt also REQUIRES a speaking
      // score so skipping can't bypass the gate.
      const enforced = isSpeakingGateEnforced();
      const requireSpeaking =
        enforced && !!testSet && cefrRank(testSet.levelFrom) >= cefrRank(SPEAKING_FLOOR);
      const { passed } = computePassed(scores, { includeSpeaking: enforced, requireSpeaking });
      recordEquivalencyAttempt({
        level: testSet!.levelFrom,
        scores,
        currentLessonCount: userLessonCount,
      });
      setResultPassed(passed);
      setResultScores(scores);
      setPhase('result');
    },
    [testSet, userLessonCount],
  );

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
              {speaking && <li>A short speaking task (🎙️ shown for now, not yet required)</li>}
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
  // Delegated to ExamRunner (data-testid="answer-N", "exam-next", "exam-progress").
  // From B1 up it also runs a speaking section; in shadow mode that score is
  // measured and shown but does not gate certification (isSpeakingGateEnforced).
  if (phase === 'question') {
    return (
      <div className="scr-wrap">
        <ExamRunner
          questions={runnerQuestions}
          speaking={speaking}
          onComplete={onExamComplete}
          title="Equivalency Test"
        />
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
            {resultScores.speaking !== undefined && (
              <SkillBar icon="🎙️" label="Speaking" score={resultScores.speaking} />
            )}
          </div>
          {resultScores.speaking !== undefined && !isSpeakingGateEnforced() && (
            <p style={{ fontSize: 12, color: 'var(--subtext)', marginTop: -8, marginBottom: 16 }}>
              🎙️ Speaking is shown for now and isn&apos;t required to certify yet — but fluency
              means speaking, so it will become part of certification soon.
            </p>
          )}
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
