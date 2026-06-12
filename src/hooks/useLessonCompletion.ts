// src/hooks/useLessonCompletion.ts
import { passedLesson } from '../lib/lessonGate';
import { markQuest } from '../lib/quests';

interface LessonStats {
  vs?: string[];
  lc?: number;
  gc?: number;
}
interface CompleteArgs {
  screenId: string;
  statKind: 'lc' | 'gc';
  score: number;
  total: number;
  xp: number;
  questKind?: string;
  stats: LessonStats;
  setStats: (fn: (prev: LessonStats) => LessonStats) => void;
  writeDelta?: (delta: Record<string, unknown>) => void;
  award?: (xp: number, celebrate?: boolean, activityType?: string) => void;
}

// Marks a lesson complete (vs flag + lc/gc + XP + quest) ONLY when the learner
// passed (>=75%). Idempotent: no double credit if screenId already in vs. Returns
// { passed } so the caller can show pass/fail + Retry UI.
export function completeLesson(args: CompleteArgs): { passed: boolean } {
  const { screenId, statKind, score, total, xp, questKind, stats, setStats, writeDelta, award } =
    args;
  const passed = passedLesson(score, total);
  if (!passed) return { passed: false };
  if (stats.vs?.includes(screenId)) return { passed: true }; // already credited
  setStats((prev) => {
    if (prev.vs?.includes(screenId)) return prev;
    return {
      ...prev,
      [statKind]: (prev[statKind] || 0) + 1,
      vs: [...(prev.vs || []), screenId],
    };
  });
  if (writeDelta) writeDelta({ [statKind]: 1, vs: [screenId] });
  if (award) award(xp, false, 'lesson');
  if (questKind) markQuest(questKind);
  return { passed: true };
}
