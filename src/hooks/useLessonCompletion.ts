// src/hooks/useLessonCompletion.ts
// Passive-lesson completion gate (PRs #36–#38). Now a thin wrapper over the single
// completion authority `completeExercise` (src/hooks/useExerciseCompletion.ts): it passes
// the lesson's explicit statKind/questKind and the legacy 'lesson' award activityType so
// behavior is byte-identical to the original gated implementation.
import { completeExercise } from './useExerciseCompletion';

// Structural minimum the gate touches; the real Stats type satisfies this, so the
// generic S below lets completeLesson accept useStats()'s full Stats updater unchanged.
interface LessonStats {
  vs?: string[];
  lc?: number;
  gc?: number;
}
interface CompleteArgs<S extends LessonStats> {
  screenId: string;
  statKind: 'lc' | 'gc';
  score: number;
  total: number;
  xp: number;
  questKind?: string;
  stats: S;
  setStats: (fn: (prev: S) => S) => void;
  writeDelta?: (delta: Record<string, unknown>) => void;
  award?: (xp: number, celebrate?: boolean, activityType?: string) => void;
}

// Marks a lesson complete (vs flag + lc/gc + XP + quest) ONLY when the learner
// passed (>=75%). Idempotent: no double credit if screenId already in vs. Returns
// { passed } so the caller can show pass/fail + Retry UI.
export function completeLesson<S extends LessonStats>(args: CompleteArgs<S>): { passed: boolean } {
  return completeExercise({
    key: args.screenId,
    score: args.score,
    total: args.total,
    xp: args.xp,
    stats: args.stats,
    setStats: args.setStats,
    writeDelta: args.writeDelta,
    award: args.award,
    statKind: args.statKind,
    questKind: args.questKind,
    activityType: 'lesson',
  });
}
