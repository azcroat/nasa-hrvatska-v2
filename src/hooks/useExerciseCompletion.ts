// src/hooks/useExerciseCompletion.ts
// The single completion authority. Every score-bearing/productive/reference screen
// routes its completion write through completeExercise, which reads EXERCISE_COMPLETION
// to decide the policy:
//   gated   — credited only when passedLesson(score,total) (>= 75%)
//   effort  — credited on genuine finish (no MCQ correctness)
//   passive — credited on read/dwell
// It owns the idempotent vs write, the counter increment, the XP award and the quest mark,
// so no component hand-rolls completion logic. completeLesson is a thin wrapper (below).
import { passedLesson } from '../lib/lessonGate';
import { markQuest } from '../lib/quests';
import { EXERCISE_COMPLETION, type StatKind } from '../lib/completion/exerciseRegistry';
import { consumeSessionCategoryOutcome } from '../lib/sessionCategory';

interface MinStats {
  vs?: string[];
  lc?: number;
  gc?: number;
  sp?: number;
  rc?: number;
}

interface CompleteExerciseArgs<S extends MinStats> {
  /** Registry key (also the vs flag string, unless the registry overrides vsKey). */
  key: string;
  /** Required for `gated` policy; omitted for effort/passive. */
  score?: number;
  total?: number;
  xp: number;
  stats: S;
  setStats: (fn: (prev: S) => S) => void;
  writeDelta?: (delta: Record<string, unknown>) => void;
  award?: (xp: number, celebrate?: boolean, activityType?: string) => void;
  // Optional overrides — used by completeLesson to preserve exact legacy behavior.
  statKind?: StatKind;
  questKind?: string;
  activityType?: string;
  /** Pass-through to award()'s celebrate flag (e.g. SentenceTile fires confetti). */
  celebrate?: boolean;
}

export function completeExercise<S extends MinStats>(
  args: CompleteExerciseArgs<S>,
): {
  passed: boolean;
} {
  const { key, score, total, xp, stats, setStats, writeDelta, award } = args;
  // Advance the adaptive category schedule with REAL accuracy when this finish
  // corresponds to a Today's Session adaptive activity. Runs on every attempt
  // (pass or fail) so a struggled category reschedules instead of repeating
  // forever; no-op outside the daily session. This is the write that was missing
  // and caused the session to serve the same grammar category every day.
  consumeSessionCategoryOutcome(score, total);
  const entry = EXERCISE_COMPLETION[key];
  const policyKind = entry?.policy.kind ?? 'gated';
  const statKind: StatKind = args.statKind ?? entry?.policy.statKind ?? 'gc';
  const vsKey = entry?.vsKey ?? key;
  const questKind = args.questKind ?? entry?.questKind;
  const activityType = args.activityType ?? entry?.activityType ?? 'lesson';

  // gated screens require a pass; effort/passive complete on the call itself.
  const passed = policyKind === 'gated' ? passedLesson(score ?? 0, total ?? 0) : true;
  if (!passed) return { passed: false };
  if (stats.vs?.includes(vsKey)) return { passed: true }; // already credited

  setStats((prev) => {
    if (prev.vs?.includes(vsKey)) return prev;
    const next = { ...prev, vs: [...(prev.vs || []), vsKey] };
    next[statKind] = ((prev[statKind] as number) || 0) + 1;
    return next;
  });
  if (writeDelta) writeDelta({ [statKind]: 1, vs: [vsKey] });
  if (award) award(xp, args.celebrate ?? false, activityType);
  if (questKind) markQuest(questKind);
  return { passed: true };
}
