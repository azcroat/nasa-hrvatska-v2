/**
 * mergeStatsFromRemote — single canonical function for merging Firebase stats into local state.
 *
 * Used by all three remote-data paths:
 *   1. useSyncManager real-time watcher
 *   2. useSyncManager iosWakeUp
 *   3. App.jsx onSignedIn (isHydrate + normal)
 *
 * Rules:
 *   - xp, lc, gc, sp, pr, de, rc, str: take Math.max (never decrease)
 *   - diff: take the higher ordinal (beginner < intermediate < advanced) — never regress CEFR level
 *   - ct, vs, badges: union (never lose completed topics/screens)
 *   - all other fields: take remote value (sanitized), falling back to DS default
 */
import type { Stats } from '../types/index.js';
import { sanitizeStats } from './sanitizeStats.js';

const DIFF_ORDER: Record<string, number> = { beginner: 0, intermediate: 1, advanced: 2 };

function higherDiff(a: string | undefined, b: string | undefined, fallback: string): Stats['diff'] {
  const ao = DIFF_ORDER[a ?? ''] ?? -1;
  const bo = DIFF_ORDER[b ?? ''] ?? -1;
  const winner = ao >= bo ? a : b;
  return (winner && winner in DIFF_ORDER ? winner : fallback) as Stats['diff'];
}

export function mergeStatsFromRemote(prev: Stats, rawRemoteSt: unknown, ds: Stats): Stats {
  const remoteSt = sanitizeStats(rawRemoteSt);
  return {
    ...ds,
    ...remoteSt,
    // diff: always take the highest level seen — never let a stale remote value regress CEFR
    diff: higherDiff(prev.diff, remoteSt.diff, ds.diff),
    ct: [...new Set([...(prev.ct || []), ...(remoteSt.ct || [])])],
    vs: [...new Set([...(prev.vs || []), ...(remoteSt.vs || [])])],
    badges: [...new Set([...(prev.badges || []), ...(remoteSt.badges || [])])],
    // rs stores ordered lesson score strings (e.g. ["100","75","80"]) — not keyed,
    // so Set-union would collapse duplicates and distort history. Keep the longer
    // array; since rs only grows with each lesson completion, longer = more complete.
    rs: ((prev.rs || []).length >= (remoteSt.rs || []).length ? prev.rs : remoteSt.rs) || [],
    lc: Math.max(prev.lc || 0, remoteSt.lc || 0),
    gc: Math.max(prev.gc || 0, remoteSt.gc || 0),
    sp: Math.max(prev.sp || 0, remoteSt.sp || 0),
    pr: Math.max(prev.pr || 0, remoteSt.pr || 0),
    de: Math.max(prev.de || 0, remoteSt.de || 0),
    rc: Math.max(prev.rc || 0, remoteSt.rc || 0),
    xp: Math.max(prev.xp || 0, remoteSt.xp || 0),
    str: Math.max(prev.str || 0, remoteSt.str || 0),
    pf: Math.max(prev.pf || 0, remoteSt.pf || 0),
    mv: Math.max(prev.mv || 0, remoteSt.mv || 0),
    hi: Math.max(prev.hi || 0, remoteSt.hi || 0),
    // Badge-backing counters — Math.max so they are never lost on multi-device sync.
    // Without this, completing 50 SRS reviews on device A and syncing on device B
    // would overwrite device B's badge progress with the remote blob's (possibly lower) value.
    srsTotal: Math.max(prev.srsTotal || 0, remoteSt.srsTotal || 0),
    mistakesMastered: Math.max(prev.mistakesMastered || 0, remoteSt.mistakesMastered || 0),
    readingDone: Math.max(prev.readingDone || 0, remoteSt.readingDone || 0),
    mediaVisits: Math.max(prev.mediaVisits || 0, remoteSt.mediaVisits || 0),
    // levelQuizPasses — per-key latest-wins by passedAt timestamp.
    // A device that passed a quiz more recently (higher passedAt) wins for that level.
    // Keys from both local and remote are always preserved (additive union).
    levelQuizPasses: (() => {
      const local = prev.levelQuizPasses ?? {};
      const remote = remoteSt.levelQuizPasses ?? {};
      const merged: Record<number, { score: number; passedAt: number }> = { ...local };
      for (const key of Object.keys(remote) as unknown as number[]) {
        const k = Number(key);
        const rv = remote[k];
        const lv = merged[k];
        if (rv && (!lv || rv.passedAt > lv.passedAt)) {
          merged[k] = rv;
        }
      }
      return merged;
    })(),
  };
}
