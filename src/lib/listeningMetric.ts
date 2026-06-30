/**
 * listeningMetric — the listening-rep signal (Content-Rec #1).
 *
 * Comprehension is built by HOURS of input, not by XP. So we count listening
 * directly: every time any listening activity is completed (AI Listening,
 * Dictation, Shadowing, the Daily Listening card, the static listening quiz)
 * the central award path records a rep keyed on activityType 'listening'.
 * Stored as { total, week, weekCount } so the UI (InsightsTab) can show lifetime
 * + this-week reps as a real input-volume signal. Device-local, mirroring the
 * pre-sync productionMetric design.
 *
 * Cross-device sync is a scoped follow-up identical to the production-rep one:
 * promote to a synced `lr` stat by adding it to the Stats type, Math.max in
 * mergeStatsFromRemote and a clamp in sanitizeStats — no Firestore-rule edit,
 * since users/{uid} rules don't allowlist `stats` sub-keys. Deliberately
 * deferred to keep this change focused on the listening curriculum.
 */
import { weekKey } from './dateUtils';

const LISTENING_REPS_KEY = 'nh_listening_reps';

export interface ListeningReps {
  total: number;
  thisWeek: number;
}

/** Increment the listening-rep counters (lifetime total + current-week bucket). */
export function recordListeningRep(): void {
  try {
    const wk = weekKey();
    const parsed = (() => {
      try {
        return JSON.parse(localStorage.getItem(LISTENING_REPS_KEY) || '{}');
      } catch {
        return {};
      }
    })();
    const total = typeof parsed.total === 'number' ? parsed.total : 0;
    const weekCount =
      parsed.week === wk && typeof parsed.weekCount === 'number' ? parsed.weekCount : 0;
    localStorage.setItem(
      LISTENING_REPS_KEY,
      JSON.stringify({ total: total + 1, week: wk, weekCount: weekCount + 1 }),
    );
  } catch (_) {
    // localStorage unavailable / quota — non-fatal; the metric is best-effort.
  }
}

/** Read lifetime + this-week listening reps. A new week rolls `thisWeek` to 0. */
export function getListeningReps(): ListeningReps {
  try {
    const parsed = JSON.parse(localStorage.getItem(LISTENING_REPS_KEY) || '{}');
    const total = typeof parsed.total === 'number' ? parsed.total : 0;
    const thisWeek =
      parsed.week === weekKey() && typeof parsed.weekCount === 'number' ? parsed.weekCount : 0;
    return { total, thisWeek };
  } catch {
    return { total: 0, thisWeek: 0 };
  }
}
