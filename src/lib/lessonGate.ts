// src/lib/lessonGate.ts
// Single source of the lesson "comprehension gate" pass rule. Pure; no React/storage.
export const LESSON_PASS_THRESHOLD = 0.75;

export function lessonScorePct(score: number, total: number): number {
  return total > 0 ? score / total : 0;
}

export function passedLesson(score: number, total: number): boolean {
  return total > 0 && score / total >= LESSON_PASS_THRESHOLD;
}
