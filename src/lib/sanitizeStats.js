/**
 * sanitizeStats — validates and clamps a raw stats object from remote/localStorage.
 * Prevents corrupted or schema-mismatched data from entering React state.
 */

const ALLOWED_DIFFS = new Set(['beginner', 'intermediate', 'advanced']);

export function sanitizeStats(raw) {
  if (!raw || typeof raw !== 'object') return {};
  const s = {};
  // Non-negative integers — reject NaN, Infinity, negatives, non-numbers
  for (const k of ['xp', 'lc', 'gc', 'sp', 'de', 'rc', 'pf', 'mv', 'hi', 'str', 'authLoading']) {
    const v = raw[k];
    if (typeof v === 'number' && isFinite(v) && v >= 0) {
      s[k] = Math.floor(v);
    }
  }
  // str (streak count) must be at least 1 — matches DS default
  if (typeof s.str === 'number' && s.str < 1) s.str = 1;
  // diff must be a known value
  if (typeof raw.diff === 'string' && ALLOWED_DIFFS.has(raw.diff)) s.diff = raw.diff;
  // Arrays of strings only
  for (const k of ['ct', 'vs', 'rs', 'badges']) {
    if (Array.isArray(raw[k])) s[k] = raw[k].filter(v => typeof v === 'string');
  }
  return s;
}
