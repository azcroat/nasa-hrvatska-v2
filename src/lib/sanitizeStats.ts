/**
 * sanitizeStats — validates and clamps a raw stats object from remote/localStorage.
 * Prevents corrupted or schema-mismatched data from entering React state.
 */
import type { Stats } from '../types/index.js';

const ALLOWED_DIFFS = new Set<string>(['beginner', 'intermediate', 'advanced']);

export function sanitizeStats(raw: unknown): Partial<Stats> {
  if (!raw || typeof raw !== 'object') return {};
  const r = raw as Record<string, unknown>;
  const s: Partial<Stats> = {};
  // Non-negative integers — reject NaN, Infinity, negatives, non-numbers
  for (const k of ['xp', 'lc', 'gc', 'sp', 'de', 'rc', 'pf', 'mv', 'hi', 'str'] as const) {
    const v = r[k];
    if (typeof v === 'number' && isFinite(v) && v >= 0) {
      s[k] = Math.floor(v);
    }
  }
  // Badge-backing counters — pass through with same non-negative integer validation
  for (const bk of ['srsTotal', 'mistakesMastered', 'readingDone', 'mediaVisits'] as const) {
    const bv = r[bk];
    if (typeof bv === 'number' && isFinite(bv) && bv >= 0) {
      s[bk] = Math.floor(bv);
    }
  }
  // diff must be a known value
  if (typeof r.diff === 'string' && ALLOWED_DIFFS.has(r.diff)) {
    s.diff = r.diff as Stats['diff'];
  }
  // Arrays of strings only
  for (const k of ['ct', 'vs', 'rs', 'badges'] as const) {
    const v = r[k];
    if (Array.isArray(v)) s[k] = v.filter((x): x is string => typeof x === 'string');
  }
  return s;
}
