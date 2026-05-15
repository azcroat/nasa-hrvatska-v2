// functions/api/_userContext.js
// SP5: server-side validator/renderer for the userContext payload sent by clients.

import { sanitizeParam } from './_helpers.js';

const CEFR_ALLOWLIST = new Set(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);

export const TOPIC_ALLOWLIST = new Set([
  'genitive',
  'accusative',
  'dative-locative',
  'instrumental',
  'vocative',
  'past-tense',
  'future-tense',
  'aspect-imperfective',
  'aspect-perfective',
  'aspect-negation',
  'conditional',
  'clitics',
  'vocab-a2',
  'vocab-b1',
  'vocab-b2',
  'speaking',
]);

function _isFiniteNonNegativeInt(n) {
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 && Number.isInteger(n);
}

function _clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function _parseLevel(level) {
  if (!level || typeof level !== 'object') return null;
  if (!CEFR_ALLOWLIST.has(level.cefr)) return null;
  const xp = _isFiniteNonNegativeInt(level.xp) ? level.xp : 0;
  const streak = _isFiniteNonNegativeInt(level.streak) ? level.streak : 0;
  return { cefr: level.cefr, xp, streak };
}

function _parseWeakTopics(arr) {
  if (!Array.isArray(arr)) return [];
  const out = [];
  for (const t of arr) {
    if (!t || typeof t !== 'object') continue;
    if (!TOPIC_ALLOWLIST.has(t.topic)) continue;
    if (typeof t.accuracy !== 'number' || t.accuracy < 0 || t.accuracy > 1) continue;
    if (!_isFiniteNonNegativeInt(t.attempts) || t.attempts < 3) continue;
    out.push({
      topic: t.topic,
      accuracy: Math.round(t.accuracy * 100) / 100,
      attempts: t.attempts,
    });
    if (out.length >= 3) break;
  }
  return out;
}

function _parseRecentErrors(arr) {
  if (!Array.isArray(arr)) return [];
  const out = [];
  for (const e of arr) {
    if (!e || typeof e !== 'object') continue;
    if (!TOPIC_ALLOWLIST.has(e.topic)) continue;
    const minutesAgo =
      typeof e.minutesAgo === 'number' ? _clamp(Math.floor(e.minutesAgo), 0, 1440) : 0;
    out.push({
      topic: e.topic,
      prompt: sanitizeParam(e.prompt, 80),
      userAnswer: sanitizeParam(e.userAnswer, 60),
      correctAnswer: sanitizeParam(e.correctAnswer, 60),
      minutesAgo,
    });
    if (out.length >= 5) break;
  }
  return out;
}

function _parseVocab(vocab) {
  if (!vocab || typeof vocab !== 'object') {
    return { learned: 0, dueToday: 0, hardest: [] };
  }
  const learned = _isFiniteNonNegativeInt(vocab.learned) ? vocab.learned : 0;
  const dueToday = _isFiniteNonNegativeInt(vocab.dueToday) ? vocab.dueToday : 0;
  const hardestRaw = Array.isArray(vocab.hardest) ? vocab.hardest : [];
  const hardest = hardestRaw
    .filter((w) => typeof w === 'string')
    .slice(0, 5)
    .map((w) => sanitizeParam(w, 40))
    .filter((w) => w.length > 0);
  return { learned, dueToday, hardest };
}

export function parseUserContext(body) {
  if (!body || typeof body !== 'object') return null;
  const ctx = body.userContext;
  if (!ctx || typeof ctx !== 'object') return null;
  if (ctx.version !== 1) return null;

  const level = _parseLevel(ctx.level);
  if (!level) return null;

  return {
    version: 1,
    generatedAt: typeof ctx.generatedAt === 'number' ? ctx.generatedAt : 0,
    level,
    weakTopics: _parseWeakTopics(ctx.weakTopics),
    recentErrors: _parseRecentErrors(ctx.recentErrors),
    vocab: _parseVocab(ctx.vocab),
  };
}

// renderContextPrompt added in Task 6 — stub here so imports don't break.
export function renderContextPrompt(_ctx, _kind) {
  return '';
}
