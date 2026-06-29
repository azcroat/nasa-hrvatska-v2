/**
 * src/lib/cefrLevel.ts
 *
 * The user's EFFECTIVE CEFR level: XP-eligible (getUserCefr), capped by grammar
 * mastery (applyCefrMasteryGate), but NEVER below a monotonic floor.
 *
 * Rec #4 — forward-only mastery gate. The floor initializes to the user's
 * current XP-eligible level the first time this runs, so:
 *   - existing users are NEVER demoted and never lose already-unlocked content;
 *   - the mastery cap only gates NEW advancement (into B2/C1/C2) from here on.
 *
 * This is the one stateful piece (it reads/writes localStorage); the gate math
 * itself lives as pure functions in cefr.ts so it stays trivially testable.
 */
import { CEFR_ORDER, cefrRank, getUserCefr, applyCefrMasteryGate, type CefrLevel } from './cefr';

const FLOOR_KEY = 'nh_cefr_floor';

function readFloorRank(): number | null {
  try {
    const raw = localStorage.getItem(FLOOR_KEY);
    if (raw == null) return null;
    const rank = cefrRank(raw);
    // Stored value is a level string (e.g. 'B2'); cefrRank maps unknown → 0 (A1),
    // which is a safe floor, so we accept whatever parses.
    return rank;
  } catch {
    return null;
  }
}

function writeFloorRank(rank: number): void {
  try {
    localStorage.setItem(FLOOR_KEY, CEFR_ORDER[rank] ?? 'A1');
  } catch {
    /* localStorage unavailable (private mode / SSR) — non-fatal, gate still works */
  }
}

/**
 * The effective CEFR level used for display, the daily session, and AI context.
 * Guarantees: result is never above the XP-eligible level (no inflation beyond
 * XP) and never below the monotonic floor (no demotion). New advancement past
 * the floor requires the grammar-mastery thresholds in CEFR_MASTERY_GC.
 */
export function getGatedUserCefr(xp: number, lc: number, gc: number): CefrLevel {
  const eligible = getUserCefr(xp, lc, gc);
  const gated = applyCefrMasteryGate(eligible, gc);

  let floorRank = readFloorRank();
  if (floorRank == null) {
    // First run on this device: grandfather the current XP-eligible level so no
    // existing user is demoted or loses content. The gate applies only going forward.
    floorRank = cefrRank(eligible);
    writeFloorRank(floorRank);
  }

  const resultRank = Math.max(cefrRank(gated), floorRank);
  // Ratchet the floor upward only — it must never decrease.
  if (resultRank > floorRank) writeFloorRank(resultRank);
  return CEFR_ORDER[resultRank]!;
}

/**
 * True when grammar mastery is actively holding the user below their XP-eligible
 * level (used to show an explanatory hint rather than a silent cap).
 */
export function isMasteryGated(xp: number, lc: number, gc: number): boolean {
  return cefrRank(getGatedUserCefr(xp, lc, gc)) < cefrRank(getUserCefr(xp, lc, gc));
}

/** Clear the persisted floor (e.g. on sign-out, so a new account starts fresh). */
export function resetCefrFloor(): void {
  try {
    localStorage.removeItem(FLOOR_KEY);
  } catch {
    /* non-fatal */
  }
}
