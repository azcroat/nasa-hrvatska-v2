// src/hooks/useLessonCompletion.ts
import { passedLesson } from '../lib/lessonGate';
import { markQuest } from '../lib/quests';

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
  const { screenId, statKind, score, total, xp, questKind, stats, setStats, writeDelta, award } =
    args;
  const passed = passedLesson(score, total);
  if (!passed) return { passed: false };
  if (stats.vs?.includes(screenId)) return { passed: true }; // already credited
  setStats((prev) => {
    if (prev.vs?.includes(screenId)) return prev;
    const vs = [...(prev.vs || []), screenId];
    return statKind === 'lc'
      ? { ...prev, vs, lc: (prev.lc || 0) + 1 }
      : { ...prev, vs, gc: (prev.gc || 0) + 1 };
  });
  if (writeDelta) writeDelta({ [statKind]: 1, vs: [screenId] });
  if (award) award(xp, false, 'lesson');
  if (questKind) markQuest(questKind);
  return { passed: true };
}
