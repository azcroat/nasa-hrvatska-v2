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
 * Returns the CEFR level one rank below `level`, or null when `level` is the
 * floor (A1). Used by certification/checkpoint demotion logic.
 * @example levelBelow('B1') → 'A2'
 * @example levelBelow('A1') → null
 */
export function levelBelow(level: CefrLevel): CefrLevel | null {
  const idx = CEFR_ORDER.indexOf(level);
  return idx <= 0 ? null : CEFR_ORDER[idx - 1]!;
}

/**
 * Returns true when an exercise is unlocked for the user.
 * Unlocked if: exerciseCefr rank ≤ userCefr rank
 *
 * Unknown exercise CEFR (e.g., 'A1+') → always unlocked (fail-open for missing data).
 *
 * The `userCefr` argument is the level the caller wants to check against.
 * When the CERTIFICATION_REQUIRED feature flag (in cefrCertification.ts) is
 * active, callers should pass the user's *certified* level (from
 * `getCertifiedLevel()`) instead of their *eligible* level (from
 * `getUserCefr()`). Until the flag flips, callers continue to pass the
 * eligible level so behaviour is unchanged.
 *
 * @example isUnlocked('B1', 'B1') → true
 * @example isUnlocked('B2', 'B1') → false
 * @example isUnlocked('A1+', 'A1') → true (unknown exercise CEFR)
 */
export function isUnlocked(exerciseCefr: string, userCefr: string): boolean {
  return cefrRank(exerciseCefr) <= cefrRank(userCefr);
}

/**
 * Returns the level the application should treat as authoritative for
 * content unlocking. Encapsulates the eligible-vs-certified decision so
 * callers don't have to know which mode is active.
 *
 * When `CERTIFICATION_REQUIRED` is false (current default):
 *   returns `eligible` (activity-derived, getUserCefr output).
 *
 * When `CERTIFICATION_REQUIRED` is true (hard-gated mode):
 *   returns the user's certified level (highest test-passed CEFR).
 *
 * The caller injects the certification module's exports to avoid a
 * circular import — cefrCertification.ts depends on this file for the
 * CefrLevel type and cefrRank helper. The two helpers needed are
 * trivially small so passing them in is cleaner than dynamic-import
 * wrangling at the module boundary.
 *
 * Most code paths should use `getEffectiveLevelForUnlock()` (below)
 * which wires up the module connection at one centralised call site.
 *
 * @param eligible The activity-derived level.
 * @param cert Optional certification helpers. When omitted, returns eligible.
 */
export function getEffectiveLevel(
  eligible: CefrLevel,
  cert?: {
    CERTIFICATION_REQUIRED: boolean;
    getCertifiedLevel: () => CefrLevel;
  },
): CefrLevel {
  if (!cert || !cert.CERTIFICATION_REQUIRED) return eligible;
  return cert.getCertifiedLevel();
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
