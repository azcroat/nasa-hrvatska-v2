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

/**
 * Mark the active Today's Session activity complete.
 *
 * Why this matters: the daily session is a practice FLOW, not a mastery gate, so
 * an activity must advance when the learner FINISHES it — not only on a passing
 * award(). The old handshake (useAward: nh_session_completed written only when
 * curEx === nh_session_started) stranded the session in two ways: gated drills
 * finished below 75% never called award() (so genitive "kept gating progress"),
 * and the conjugation drill runs under curEx 'conjpractice:<category>' which never
 * matched the launched screen 'conjpractice'. (XP/vs/gc credit is still gated on a
 * pass via completeExercise; the adaptive scheduler still reschedules with real
 * accuracy — only session progression is unblocked.)
 *
 * Forms:
 *  - With `screen`: write only when it matches the launched activity. Screen-
 *    accurate; used by empty-state branches and by callers that know their screen
 *    id (e.g. the conjugation drill passes 'conjpractice').
 *  - Without `screen`: complete whatever activity is currently launched. Used by
 *    the single completion authority (completeExercise), which knows the registry
 *    key but not the launched screen. This is safe ONLY because nh_session_started
 *    is cleared the moment the user abandons the activity (App.tsx setTab clears it
 *    on tab-away), so it is never stale when an unrelated drill finishes — without
 *    that, a finished Practice-tab drill would falsely complete an abandoned
 *    session activity.
 */
export function signalSessionCompleteIfActive(screen?: string): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    const started = sessionStorage.getItem(STARTED_KEY);
    if (!started) return;
    if (screen === undefined || started === screen) {
      sessionStorage.setItem(COMPLETED_KEY, started);
    }
  } catch {
    // sessionStorage can throw in cross-origin iframes or private mode —
    // missing the signal is strictly better than crashing the render, since the
    // user can always advance the session manually.
  }
}
