/**
 * sessionSignal — empty-state self-heal for Today's Session activities.
 *
 * Problem this solves:
 * Today's Session launches each daily activity into a practice screen.
 * The session-completion handshake fires from useAward.ts when award() is
 * called with a positive XP amount — that writes 'nh_session_completed'
 * to sessionStorage and HomeTab's mount effect picks it up to markDone
 * the activity.
 *
 * But screens that hit an empty-state branch (no cards due, no questions,
 * load failure) never call award(). The activity is stranded — the user
 * lands on a "All caught up" wall, taps Go Back, and the daily session
 * remains permanently stuck at N-1/N with no path to complete it.
 *
 * Fix: every empty-state branch in a session-eligible practice screen
 * calls signalSessionCompleteIfActive(thisScreen). If this screen was
 * the activity the user just launched (sessionStorage 'nh_session_started'
 * matches), we write 'nh_session_completed' so the existing markDone
 * handoff fires when the user navigates back. If we weren't launched
 * from the daily session (user opened the screen directly from Practice
 * tab), this is a safe no-op.
 *
 * Companion to the build-time SRS guard in useDailySession.ts. That
 * guard auto-skips the SRS slot BEFORE launch by re-checking
 * getDueReviews() on every session-state change. This signal handles
 * the data-fetch-failure path where a screen IS launched and then
 * legitimately has nothing to render.
 */

const STARTED_KEY = 'nh_session_started';
const COMPLETED_KEY = 'nh_session_completed';

export function signalSessionCompleteIfActive(screen: string): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    const started = sessionStorage.getItem(STARTED_KEY);
    if (started && started === screen) {
      sessionStorage.setItem(COMPLETED_KEY, screen);
    }
  } catch {
    // sessionStorage can throw in cross-origin iframes or private mode —
    // missing the signal is strictly better than crashing the empty-state
    // render, since the user can always advance the session manually.
  }
}

/**
 * Mark whatever Today's Session activity is currently active as FINISHED.
 *
 * Why this exists (and is distinct from signalSessionCompleteIfActive):
 * The previous completion handshake only fired on a *passing* award() call, and
 * only when curEx exactly matched the launched screen. That stranded the daily
 * session in two real ways:
 *   1. GATED drills (genitive, accusative, …) the learner finished but scored
 *      < 75% on never called award() — so the session never advanced. A learner
 *      who struggles with genitive was blocked from the rest of their session
 *      forever ("genitive continues to gate progress").
 *   2. The conjugation drill runs under curEx 'conjpractice:<category>' while the
 *      session launched screen is 'conjpractice', so the exact-match check failed
 *      and conjugation activities never completed even when passed.
 *
 * The session is a daily-practice flow, not a mastery gate: FINISHING an activity
 * must advance it. (XP/credit is still gated on a pass via completeExercise; the
 * adaptive scheduler still reschedules with real accuracy.) Because the session
 * launches and navigates to exactly one activity at a time and clears
 * nh_session_started on return Home, a finishing exercise IS the active activity.
 */
export function markSessionActivityFinished(): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    const started = sessionStorage.getItem(STARTED_KEY);
    if (started) {
      sessionStorage.setItem(COMPLETED_KEY, started);
    }
  } catch {
    // non-fatal — session can still be advanced manually.
  }
}
