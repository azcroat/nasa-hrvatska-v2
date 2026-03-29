/**
 * mergeStatsFromRemote — single canonical function for merging Firebase stats into local state.
 *
 * Used by all three remote-data paths:
 *   1. useSyncManager real-time watcher
 *   2. useSyncManager iosWakeUp
 *   3. App.jsx onSignedIn (isHydrate + normal)
 *
 * Rules:
 *   - xp, lc, gc: take Math.max (never decrease)
 *   - ct, vs: union (never lose completed topics/screens)
 *   - all other fields: take remote value (sanitized), falling back to DS default
 */
import type { Stats } from '../types/index.js';
import { sanitizeStats } from './sanitizeStats.js';

export function mergeStatsFromRemote(prev: Stats, rawRemoteSt: unknown, ds: Stats): Stats {
  const remoteSt = sanitizeStats(rawRemoteSt);
  return {
    ...ds,
    ...remoteSt,
    ct: [...new Set([...(prev.ct || []), ...(remoteSt.ct || [])])],
    vs: [...new Set([...(prev.vs || []), ...(remoteSt.vs || [])])],
    badges: [...new Set([...(prev.badges || []), ...(remoteSt.badges || [])])],
    lc: Math.max(prev.lc || 0, remoteSt.lc || 0),
    gc: Math.max(prev.gc || 0, remoteSt.gc || 0),
    sp: Math.max(prev.sp || 0, remoteSt.sp || 0),
    de: Math.max(prev.de || 0, remoteSt.de || 0),
    rc: Math.max(prev.rc || 0, remoteSt.rc || 0),
    xp: Math.max(prev.xp || 0, remoteSt.xp || 0),
    str: Math.max(prev.str || 0, remoteSt.str || 0),
  };
}
