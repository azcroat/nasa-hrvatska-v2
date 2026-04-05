// ═══════════════════════════════════════════════════════════
// Unified Learner Error Ledger
// ═══════════════════════════════════════════════════════════

const STORAGE_KEY = 'nh_learner_errors';
const MAX_ERRORS = 200;
const _DECAY_DAYS = 90;

interface ErrorContext {
  wrong?: string;
  correct?: string;
  source?: string;
  [key: string]: unknown;
}

interface ErrorEntry {
  pattern: string;
  category: string;
  count: number;
  firstSeen: number;
  lastSeen?: number;
  contexts: Array<ErrorContext & { ts: number }>;
  score?: number;
}

interface ErrorMap {
  [key: string]: ErrorEntry;
}

function _load(): ErrorMap {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
}

function _save(data: ErrorMap): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
  catch {}
}

export function logError(pattern: string, category: string, context: ErrorContext = {}): void {
  if (!pattern || !category) return;
  const data = _load();
  const now = Date.now();
  const key = category + ':' + pattern;
  const existing = data[key] || { pattern, category, count: 0, firstSeen: now, contexts: [] };
  existing.count += 1;
  existing.lastSeen = now;
  if (context.wrong || context.correct) {
    existing.contexts = [{ ...context, ts: now }, ...existing.contexts].slice(0, 5);
  }
  data[key] = existing;
  const keys = Object.keys(data);
  if (keys.length > MAX_ERRORS) {
    const oldest = keys.sort((a, b) => (data[a].lastSeen || 0) - (data[b].lastSeen || 0))[0];
    delete data[oldest];
  }
  _save(data);
}

export function getTopErrors(n = 10, category: string | null = null): ErrorEntry[] {
  const data = _load();
  const now = Date.now();
  return Object.values(data)
    .filter(e => !category || e.category === category)
    .map(e => {
      const daysSince = (now - (e.lastSeen || now)) / 86400000;
      const recencyWeight = Math.exp(-daysSince / 30);
      const score = e.count * recencyWeight;
      return { ...e, score };
    })
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, n);
}

export function getErrorsByCategory(): Record<string, ErrorEntry[]> {
  const data = _load();
  const result: Record<string, ErrorEntry[]> = { grammar: [], vocabulary: [], pronunciation: [], speaking: [], reading: [] };
  for (const e of Object.values(data)) {
    if (result[e.category]) result[e.category].push(e);
  }
  return result;
}

export function getErrorSummaryForAI(maxErrors = 5): string | null {
  const top = getTopErrors(maxErrors);
  if (top.length === 0) return null;
  return top.map(e => `${e.pattern} (${e.category}, ${e.count}x)`).join(', ');
}

export function getErrorsForAPI(maxErrors = 8): Array<{ pattern: string; category: string; count: number; lastSeen?: number; recentExample: ErrorContext | null }> {
  return getTopErrors(maxErrors).map(({ pattern, category, count, lastSeen, contexts }) => ({
    pattern, category, count, lastSeen, recentExample: contexts[0] || null,
  }));
}

export function clearErrors(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function getErrorCount(): number {
  return Object.keys(_load()).length;
}

export function detectAndLogCroatianErrors(userText: string, correctText: string, source = 'exercise'): void {
  if (!userText || !correctText) return;
  const user = userText.trim().toLowerCase();
  const correct = correctText.trim().toLowerCase();
  if (user === correct) return;

  const ctx: ErrorContext = { wrong: userText, correct: correctText, source };

  const normC = (s: string) => s.replace(/[čć]/g, 'c');
  if (normC(user) === normC(correct) && user !== correct) {
    if (user.includes('č') !== correct.includes('č') || user.includes('ć') !== correct.includes('ć')) {
      logError('c_vs_c_confusion', 'pronunciation', ctx);
    }
  }

  const normDj = (s: string) => s.replace(/đ/g, 'dj');
  if (normDj(user) === normDj(correct) && user !== correct) {
    logError('dj_diacritics', 'pronunciation', ctx);
  }

  const stripDiacritics = (s: string) => s.replace(/[šžčćđ]/g, (match: string) => (
    ({ š: 's', ž: 'z', č: 'c', ć: 'c', đ: 'd' } as Record<string, string>)[match] || match
  ));
  if (stripDiacritics(user) === stripDiacritics(correct) && user !== correct) {
    logError('diacritics_dropped', 'pronunciation', ctx);
  }

  const hasRefCorrect = /\bse\b|\bsi\b/.test(correct);
  const hasRefUser = /\bse\b|\bsi\b/.test(user);
  if (hasRefCorrect && !hasRefUser) {
    logError('reflexive_missing', 'grammar', ctx);
  }

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

  if ((user.includes('dva') && correct.includes('dvije')) ||
      (user.includes('dvije') && correct.includes('dva'))) {
    logError('numeral_gender_dva_dvije', 'grammar', ctx);
  }
  if ((user.includes('jedan') && correct.includes('jedno')) ||
      (user.includes('jedno') && correct.includes('jedan')) ||
      (user.includes('jedna') && correct.includes('jedan'))) {
    logError('numeral_gender_agreement', 'grammar', ctx);
  }

  const CLITICS = new Set(['sam', 'si', 'je', 'smo', 'ste', 'su', 'ga', 'ju', 'mu', 'joj', 'im', 'se', 'li']);
  const uWords = user.split(/\s+/);
  const cWords = correct.split(/\s+/);
  const uLast = uWords[uWords.length - 1];
  const cLast = cWords[cWords.length - 1];
  if (CLITICS.has(uLast) && !CLITICS.has(cLast) && uWords.length === cWords.length) {
    logError('clitic_placement', 'grammar', ctx);
  }

  const negationPattern = /\b(nema|nije|nisam|nisi|nismo|niste|nisu)\b/;
  if (negationPattern.test(correct) && !negationPattern.test(user)) {
    logError('genitive_of_negation', 'grammar', ctx);
  }
}

export function logCroatianError(errorType: string, context: ErrorContext = {}): void {
  if (!errorType) return;
  logError(errorType, 'grammar', context);
}
