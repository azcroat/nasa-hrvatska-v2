// src/lib/sessionCategory.ts
//
// Bridges a Today's Session adaptive activity to the adaptive *category*
// scheduler so completing it advances that category's `due` — the missing write
// that caused the session to serve the same grammar category (genitive) forever.
//
// Why a bridge is needed:
//   - The session knows which CATEGORY it asked for (activity id `cat_<category>`),
//     but multi-category screens (cloze/znam/aspectdrill) can't infer it.
//   - The single completion authority (completeExercise) has the real score/total
//     but not the category.
// So the session stashes the category at launch (setSessionCategory) and the
// completion authority consumes it with real accuracy (consumeSessionCategoryOutcome).
import { rateCategorySession } from './adaptive';
import type { SkillCategory } from './adaptive';

const KEY = 'nh_session_category';
const ACTIVITY_PREFIX = 'cat_';

/**
 * Called when Today's Session launches an activity. If it's an adaptive grammar
 * activity (`cat_<category>`), records the category so completion can advance its
 * schedule. For any non-adaptive activity (SRS, Croatia, production, fill), clears
 * any stale value so a later completion can't be mis-attributed.
 */
export function setSessionCategory(activityId: string | null | undefined): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    if (activityId && activityId.startsWith(ACTIVITY_PREFIX)) {
      sessionStorage.setItem(KEY, activityId.slice(ACTIVITY_PREFIX.length));
    } else {
      sessionStorage.removeItem(KEY);
    }
  } catch {
    // sessionStorage unavailable (private mode / cross-origin) — non-fatal.
  }
}

/** Clears any pending session category (e.g., when the user backs out). */
export function clearSessionCategory(): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // non-fatal
  }
}

/**
 * Called by the completion authority when an exercise finishes. If a session
 * category is pending, advances that category's FSRS schedule with the user's
 * REAL accuracy (score/total) and clears it (idempotent). No-op when no session
 * category is pending — safe for Practice-tab runs and unit tests.
 *
 * accuracy: score/total when total>0; otherwise 0.6 (engaged-but-unscored effort
 * exercises) — never a fixed grade standing in for real performance.
 */
export function consumeSessionCategoryOutcome(score?: number, total?: number): void {
  if (typeof sessionStorage === 'undefined') return;
  let category: string | null = null;
  try {
    category = sessionStorage.getItem(KEY);
    if (!category) return;
    sessionStorage.removeItem(KEY);
  } catch {
    return;
  }
  const accuracy = typeof total === 'number' && total > 0 ? (score ?? 0) / total : 0.6;
  rateCategorySession(category as SkillCategory, Math.max(0, Math.min(1, accuracy)));
}
