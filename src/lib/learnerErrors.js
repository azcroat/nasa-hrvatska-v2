// ═══════════════════════════════════════════════════════════
// Unified Learner Error Ledger
// All AI modules log errors here; all modules read from here.
// Persisted to localStorage as 'nh_learner_errors'.
// ═══════════════════════════════════════════════════════════

const STORAGE_KEY = 'nh_learner_errors';
const MAX_ERRORS = 200; // cap to prevent localStorage bloat
const DECAY_DAYS = 90;  // errors older than 90 days lose weight

function _load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
}

function _save(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
  catch {} // ignore storage errors
}

/**
 * Log an error the learner made.
 * @param {string} pattern  - e.g. 'accusative_case', 'perfective_aspect', 'dative_preposition'
 * @param {string} category - 'grammar' | 'vocabulary' | 'pronunciation' | 'speaking' | 'reading'
 * @param {object} context  - { wrong?: string, correct?: string, source?: string }
 */
export function logError(pattern, category, context = {}) {
  if (!pattern || !category) return;
  const data = _load();
  const now = Date.now();
  const key = category + ':' + pattern;
  const existing = data[key] || { pattern, category, count: 0, firstSeen: now, contexts: [] };
  existing.count += 1;
  existing.lastSeen = now;
  // Keep last 5 contexts for diagnosis
  if (context.wrong || context.correct) {
    existing.contexts = [{ ...context, ts: now }, ...existing.contexts].slice(0, 5);
  }
  data[key] = existing;
  // Trim if over cap (remove oldest)
  const keys = Object.keys(data);
  if (keys.length > MAX_ERRORS) {
    const oldest = keys.sort((a, b) => (data[a].lastSeen || 0) - (data[b].lastSeen || 0))[0];
    delete data[oldest];
  }
  _save(data);
}

/**
 * Get top N errors, weighted by recency + frequency.
 * @param {number} n - how many to return (default 10)
 * @param {string} category - optional filter by category
 */
export function getTopErrors(n = 10, category = null) {
  const data = _load();
  const now = Date.now();
  return Object.values(data)
    .filter(e => !category || e.category === category)
    .map(e => {
      const daysSince = (now - (e.lastSeen || now)) / 86400000;
      const recencyWeight = Math.exp(-daysSince / 30); // decay over 30 days
      const score = e.count * recencyWeight;
      return { ...e, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
}

/**
 * Get errors grouped by category.
 */
export function getErrorsByCategory() {
  const data = _load();
  const result = { grammar: [], vocabulary: [], pronunciation: [], speaking: [], reading: [] };
  for (const e of Object.values(data)) {
    if (result[e.category]) result[e.category].push(e);
  }
  return result;
}

/**
 * Get a summary suitable for sending to AI APIs.
 * Returns top errors as a compact string for prompt injection.
 */
export function getErrorSummaryForAI(maxErrors = 5) {
  const top = getTopErrors(maxErrors);
  if (top.length === 0) return null;
  return top.map(e => `${e.pattern} (${e.category}, ${e.count}x)`).join(', ');
}

/**
 * Get structured error data for API calls.
 */
export function getErrorsForAPI(maxErrors = 8) {
  return getTopErrors(maxErrors).map(({ pattern, category, count, lastSeen, contexts }) => ({
    pattern, category, count, lastSeen, recentExample: contexts[0] || null,
  }));
}

/**
 * Clear all errors (e.g., on level reset or user request).
 */
export function clearErrors() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Get total error count.
 */
export function getErrorCount() {
  return Object.keys(_load()).length;
}
