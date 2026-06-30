/**
 * readingMetric — the reading-rep signal (Content-Rec #2).
 *
 * Extensive reading volume is what builds reading fluency, not XP. So we count
 * reading directly: every time a reading-comprehension exercise is completed
 * (a graded ReadingScreen passage or a GradedInputScreen story — both award
 * with activityType 'reading') the central award path records a rep. Stored as
 * { total, week, weekCount } so the UI (InsightsTab) can show lifetime +
 * this-week reps as a real reading-volume signal. Device-local, mirroring the
 * pre-sync productionMetric / listeningMetric design.
 *
 * Cross-device sync is a scoped follow-up identical to the production-rep one:
 * promote to a synced `rr` stat by adding it to the Stats type, Math.max in
 * mergeStatsFromRemote and a clamp in sanitizeStats — no Firestore-rule edit,
 * since users/{uid} rules don't allowlist `stats` sub-keys. Deliberately
 * deferred to keep this change focused on the reading curriculum.
 */
import { weekKey } from './dateUtils';

const READING_REPS_KEY = 'nh_reading_reps';

export interface ReadingReps {
  total: number;
  thisWeek: number;
}

/** Increment the reading-rep counters (lifetime total + current-week bucket). */
export function recordReadingRep(): void {
  try {
    const wk = weekKey();
    const parsed = (() => {
      try {
        return JSON.parse(localStorage.getItem(READING_REPS_KEY) || '{}');
      } catch {
        return {};
      }
    })();
    const total = typeof parsed.total === 'number' ? parsed.total : 0;
    const weekCount =
      parsed.week === wk && typeof parsed.weekCount === 'number' ? parsed.weekCount : 0;
    localStorage.setItem(
      READING_REPS_KEY,
      JSON.stringify({ total: total + 1, week: wk, weekCount: weekCount + 1 }),
    );
  } catch (_) {
    // localStorage unavailable / quota — non-fatal; the metric is best-effort.
  }
}

/** Read lifetime + this-week reading reps. A new week rolls `thisWeek` to 0. */
export function getReadingReps(): ReadingReps {
  try {
    const parsed = JSON.parse(localStorage.getItem(READING_REPS_KEY) || '{}');
    const total = typeof parsed.total === 'number' ? parsed.total : 0;
    const thisWeek =
      parsed.week === weekKey() && typeof parsed.weekCount === 'number' ? parsed.weekCount : 0;
    return { total, thisWeek };
  } catch {
    return { total: 0, thisWeek: 0 };
  }
}
