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

/**
 * Detect common Croatian grammar errors by comparing user input to the correct form.
 * Calls logError() for each pattern found.
 *
 * Covers 8 high-frequency error types identifiable without full NLP:
 *   1. č vs ć confusion (phoneme pair)
 *   2. đ vs dj/dž confusion
 *   3. Diacritics dropped entirely (š/ž/č/ć/đ)
 *   4. Reflexive se/si missing
 *   5. Animate accusative (masculine -a form)
 *   6. dva vs dvije numeral gender mismatch
 *   7. Clitic at sentence-final position
 *   8. Missing genitive after nema/nije
 *
 * @param {string} userText - what the user typed/said
 * @param {string} correctText - the correct answer
 * @param {string} [source='exercise'] - where this check happened
 */
export function detectAndLogCroatianErrors(userText, correctText, source = 'exercise') {
  if (!userText || !correctText) return;
  const user = userText.trim().toLowerCase();
  const correct = correctText.trim().toLowerCase();
  if (user === correct) return; // no error to detect

  const ctx = { wrong: userText, correct: correctText, source };

  // ── 1. č vs ć confusion ───────────────────────────────────────────────────
  // If replacing all č↔ć makes strings equal, the error is phoneme confusion
  const normC = s => s.replace(/[čć]/g, 'c');
  if (normC(user) === normC(correct) && user !== correct) {
    if (user.includes('č') !== correct.includes('č') || user.includes('ć') !== correct.includes('ć')) {
      logError('c_vs_c_confusion', 'pronunciation', ctx);
    }
  }

  // ── 2. đ vs dj confusion ──────────────────────────────────────────────────
  const normDj = s => s.replace(/đ/g, 'dj');
  if (normDj(user) === normDj(correct) && user !== correct) {
    logError('dj_diacritics', 'pronunciation', ctx);
  }

  // ── 3. Diacritics dropped entirely ───────────────────────────────────────
  const stripDiacritics = s => s.replace(/[šžčćđ]/g, match => (
    { š: 's', ž: 'z', č: 'c', ć: 'c', đ: 'd' }[match] || match
  ));
  if (stripDiacritics(user) === stripDiacritics(correct) && user !== correct) {
    logError('diacritics_dropped', 'pronunciation', ctx);
  }

  // ── 4. Missing reflexive se/si ────────────────────────────────────────────
  const hasRefCorrect = /\bse\b|\bsi\b/.test(correct);
  const hasRefUser = /\bse\b|\bsi\b/.test(user);
  if (hasRefCorrect && !hasRefUser) {
    logError('reflexive_missing', 'grammar', ctx);
  }

  // ── 5. Animate accusative (masculine -a ending missing) ──────────────────
  // Heuristic: correct has word ending -a, user has same stem without -a
  const correctWords = correct.split(/\s+/);
  const userWords = user.split(/\s+/);
  if (correctWords.length === userWords.length) {
    for (let i = 0; i < correctWords.length; i++) {
      const cw = correctWords[i];
      const uw = userWords[i];
      if (cw.endsWith('a') && cw.length > 3 && uw === cw.slice(0, -1)) {
        logError('animate_accusative', 'grammar', { ...ctx, word: cw });
        break;
      }
    }
  }

  // ── 6. Numeral gender agreement (dva vs dvije) ────────────────────────────
  if ((user.includes('dva') && correct.includes('dvije')) ||
      (user.includes('dvije') && correct.includes('dva'))) {
    logError('numeral_gender_dva_dvije', 'grammar', ctx);
  }
  // Also catch tri/četiri agreement with neuter
  if ((user.includes('jedan') && correct.includes('jedno')) ||
      (user.includes('jedno') && correct.includes('jedan')) ||
      (user.includes('jedna') && correct.includes('jedan'))) {
    logError('numeral_gender_agreement', 'grammar', ctx);
  }

  // ── 7. Clitic at sentence-final position ─────────────────────────────────
  // Clitics should appear in second Wackernagel position, not at end
  const CLITICS = new Set(['sam', 'si', 'je', 'smo', 'ste', 'su', 'ga', 'ju', 'mu', 'joj', 'im', 'se', 'li']);
  const uWords = user.split(/\s+/);
  const cWords = correct.split(/\s+/);
  const uLast = uWords[uWords.length - 1];
  const cLast = cWords[cWords.length - 1];
  if (CLITICS.has(uLast) && !CLITICS.has(cLast) && uWords.length === cWords.length) {
    logError('clitic_placement', 'grammar', ctx);
  }

  // ── 8. Missing genitive after nema/nije ──────────────────────────────────
  const negationPattern = /\b(nema|nije|nisam|nisi|nismo|niste|nisu)\b/;
  if (negationPattern.test(correct) && !negationPattern.test(user)) {
    logError('genitive_of_negation', 'grammar', ctx);
  }
}

/**
 * Log a specific known Croatian error type directly.
 * Use when the error type is already identified (e.g., from AI correction feedback).
 *
 * @param {string} errorType - e.g. 'aspect', 'clitic_placement', 'animate_accusative',
 *   'genitive_of_negation', 'numeral_agreement', 'vocative_avoidance', 'gender_agreement'
 * @param {object} [context={}] - { wrong?, correct?, source? }
 */
export function logCroatianError(errorType, context = {}) {
  if (!errorType) return;
  logError(errorType, 'grammar', context);
}
