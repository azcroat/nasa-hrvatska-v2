/**
 * conversationLevel — level-awareness for the Dialogue Simulator menu
 * (Content-Rec #4).
 *
 * The guided DialogueSim scenarios top out at B1 and the menu showed them in a
 * fixed order with a purely decorative difficulty badge. This sorts the menu by
 * proximity to the learner's CEFR (level-appropriate first, stretch last) and
 * decides when to surface the "Advanced Conversations" bridge into the existing
 * B2–C2 AIConversation scenarios — so a B2+ learner is routed to level-
 * appropriate conversation instead of being stuck at B1. Pure helpers; no new
 * content.
 */
import { cefrRank, isUnlocked } from './cefr';

/** A scenario is "at level" when its difficulty is at or below the learner's. */
export function scenarioFitsLevel(difficulty: string | undefined, userLevel: string): boolean {
  if (!difficulty) return true; // untagged scenarios are always available
  return isUnlocked(difficulty, userLevel);
}

/**
 * Sort a copy of the scenarios so the most level-appropriate appear first:
 * at-or-below the learner's level (closest first) before any "stretch"
 * scenarios above it. Stable within each group (original order preserved).
 */
export function sortScenariosByLevel<T extends { difficulty?: string }>(
  scenarios: T[],
  userLevel: string,
): T[] {
  const ur = cefrRank(userLevel);
  return scenarios
    .map((s, i) => ({ s, i }))
    .sort((a, b) => {
      const ra = a.s.difficulty ? cefrRank(a.s.difficulty) : 0;
      const rb = b.s.difficulty ? cefrRank(b.s.difficulty) : 0;
      const aStretch = ra > ur ? 1 : 0;
      const bStretch = rb > ur ? 1 : 0;
      if (aStretch !== bStretch) return aStretch - bStretch; // at/below level first
      const da = Math.abs(ra - ur);
      const db = Math.abs(rb - ur);
      if (da !== db) return da - db; // closest to the learner's level first
      return a.i - b.i; // stable
    })
    .map((x) => x.s);
}

/**
 * Show the bridge to the advanced (B2–C2) AIConversation scenarios once the
 * learner reaches B1 — i.e. as they approach the ceiling of the guided
 * scenarios and are ready to stretch into richer conversation.
 */
export function shouldShowAdvancedBridge(userLevel: string): boolean {
  return cefrRank(userLevel) >= cefrRank('B1');
}
