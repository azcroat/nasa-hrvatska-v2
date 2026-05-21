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
