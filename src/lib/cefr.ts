/**
 * src/lib/cefr.ts
 *
 * CEFR utility functions for the Naša Hrvatska learning app.
 * Provides: CEFR level computation, ranking, and exercise unlock logic.
 */

export const CEFR_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
export type CefrLevel = (typeof CEFR_ORDER)[number];

/**
 * Returns the numeric rank (index) for a CEFR level.
 * Unknown levels → 0 (treated as A1).
 * @example cefrRank('B1') → 2
 * @example cefrRank('X9') → 0
 */
export function cefrRank(cefr: string): number {
  const i = CEFR_ORDER.indexOf(cefr as CefrLevel);
  return i === -1 ? 0 : i;
}

/**
 * Returns true when an exercise is unlocked for the user.
 * Unlocked if: exerciseCefr rank ≤ userCefr rank
 *
 * Unknown exercise CEFR (e.g., 'A1+') → always unlocked (fail-open for missing data).
 *
 * @example isUnlocked('B1', 'B1') → true
 * @example isUnlocked('B2', 'B1') → false
 * @example isUnlocked('A1+', 'A1') → true (unknown exercise CEFR)
 */
export function isUnlocked(exerciseCefr: string, userCefr: string): boolean {
  return cefrRank(exerciseCefr) <= cefrRank(userCefr);
}

/**
 * Computes the user's CEFR level from progress statistics.
 *
 * Formula: total = xp + lc*15 + gc*25
 * Thresholds: A1 (<300) → A2 (<1200) → B1 (<3500) → B2 (<8000) → C1 (<18000) → C2
 *
 * This mirrors the getCEFR formula in src/components/profile/StatsTab.tsx exactly.
 *
 * @param xp - Total XP earned
 * @param lc - Lesson completions
 * @param gc - Grammar completions
 * @returns CEFR level (one of: A1, A2, B1, B2, C1, C2)
 *
 * @example getUserCefr(0, 0, 0) → 'A1'
 * @example getUserCefr(300, 0, 0) → 'A2'
 * @example getUserCefr(150, 10, 0) → 'A2' (150 + 10*15 = 300)
 */
export function getUserCefr(xp: number, lc: number, gc: number): CefrLevel {
  const total = xp + lc * 15 + gc * 25;

  if (total < 300) return 'A1';
  if (total < 1200) return 'A2';
  if (total < 3500) return 'B1';
  if (total < 8000) return 'B2';
  if (total < 18000) return 'C1';
  return 'C2';
}
