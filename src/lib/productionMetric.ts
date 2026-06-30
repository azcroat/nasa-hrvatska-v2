/**
 * productionMetric — the production-rep fluency signal (Session-Rec #6).
 *
 * Fluency is built by OUTPUT, not slot-count or raw XP — so we measure production
 * directly: every time a production-pool activity is COMPLETED in a daily session,
 * count it (see useDailySession.markDone). Stored as { total, week, weekCount } so
 * the UI (InsightsTab) can show lifetime + this-week reps as the real progress
 * signal. Device-local, mirroring the existing nh_recent_production design.
 *
 * Cross-device sync is a scoped follow-up: the users/{uid} security rules don't
 * allowlist `stats` sub-keys (no hasOnly), so promoting this to a synced `pr`
 * stat is a 3-line change — add to the Stats type, Math.max in
 * mergeStatsFromRemote, clamp in sanitizeStats — with no Firestore-rule edit.
 * Deliberately deferred rather than bolted onto an unrelated change.
 */
import { weekKey } from './dateUtils';

const PRODUCTION_REPS_KEY = 'nh_production_reps';

export interface ProductionReps {
  total: number;
  thisWeek: number;
}

/** Increment the production-rep counters (lifetime total + current-week bucket). */
export function recordProductionRep(): void {
  try {
    const wk = weekKey();
    const parsed = (() => {
      try {
        return JSON.parse(localStorage.getItem(PRODUCTION_REPS_KEY) || '{}');
      } catch {
        return {};
      }
    })();
    const total = typeof parsed.total === 'number' ? parsed.total : 0;
    const weekCount =
      parsed.week === wk && typeof parsed.weekCount === 'number' ? parsed.weekCount : 0;
    localStorage.setItem(
      PRODUCTION_REPS_KEY,
      JSON.stringify({ total: total + 1, week: wk, weekCount: weekCount + 1 }),
    );
  } catch (_) {
    // localStorage unavailable / quota — non-fatal; the metric is best-effort.
  }
}

/** Read lifetime + this-week production reps. A new week rolls `thisWeek` to 0. */
export function getProductionReps(): ProductionReps {
  try {
    const parsed = JSON.parse(localStorage.getItem(PRODUCTION_REPS_KEY) || '{}');
    const total = typeof parsed.total === 'number' ? parsed.total : 0;
    const thisWeek =
      parsed.week === weekKey() && typeof parsed.weekCount === 'number' ? parsed.weekCount : 0;
    return { total, thisWeek };
  } catch {
    return { total: 0, thisWeek: 0 };
  }
}
