/**
 * Adaptive learning — per-topic accuracy tracking + path adjustment.
 *
 * localStorage key 'topic_accuracy': { [topicId]: { attempts, correct, lastAttempt } }
 *
 * Exports:
 *   recordTopicResult(topicId, correct)     — record a right/wrong answer
 *   getTopicAccuracy(topicId)               — { accuracy, attempts } or null
 *   getWeakTopics(threshold)                — topics below threshold, sorted worst-first
 *   getRecommendedLesson(cefrLevel)         — lesson ID to prioritize next, based on gaps
 *   getDifficultyRecommendation()           — 'beginner'|'intermediate'|'advanced'
 *   shouldTriggerRemedial(topicId)          — true when accuracy is critically low (≥5 attempts, <50%)
 *   getPersonalizedPath(cefrLevel, stats)   — ordered array of {id, reason} lesson recommendations
 */

const KEY = 'topic_accuracy';

function _load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
}

function _save(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
}

// ─── Core tracking ──────────────────────────────────────────────────────────

export function recordTopicResult(topicId, correct) {
  const data = _load();
  const curr = data[topicId] || { attempts: 0, correct: 0, lastAttempt: 0 };
  data[topicId] = {
    attempts: curr.attempts + 1,
    correct: curr.correct + (correct ? 1 : 0),
    lastAttempt: Date.now(),
  };
  _save(data);
}

export function getTopicAccuracy(topicId) {
  const data = _load();
  const t = data[topicId];
  if (!t || t.attempts === 0) return null;
  return { accuracy: Math.round((t.correct / t.attempts) * 100), attempts: t.attempts };
}

export function getWeakTopics(threshold = 60) {
  const data = _load();
  return Object.entries(data)
    .filter(([, v]) => /** @type {any} */ (v).attempts >= 3 &&
      (/** @type {any} */ (v).correct / /** @type {any} */ (v).attempts * 100) < threshold)
    .map(([id, v]) => ({
      id,
      accuracy: Math.round(/** @type {any} */ (v).correct / /** @type {any} */ (v).attempts * 100),
      attempts: /** @type {any} */ (v).attempts,
    }))
    .sort((a, b) => a.accuracy - b.accuracy);
}

// ─── Path adjustment ─────────────────────────────────────────────────────────

/**
 * Returns the recommended next animated lesson ID based on what the learner
 * has attempted and where their gaps are. Falls back to a level-appropriate default.
 *
 * @param {string} cefrLevel - 'A1'|'A2'|'B1'|'B2'|'C1'
 * @returns {string} lesson ID from lessons.js
 */
export function getRecommendedLesson(cefrLevel) {
  const weak = getWeakTopics(65);

  // Map topic IDs to animated lesson IDs
  const TOPIC_TO_LESSON = {
    grammar:   'past-tense',   // grammar weakness → reinforce past tense first
    past:      'past-tense',
    tenses:    'past-tense',
    future:    'future-tense',
    formal:    'vi-vs-ti',
    alphabet:  'alphabet',
  };

  // If learner has specific weak topics, recommend the corresponding lesson
  for (const { id } of weak) {
    for (const [topic, lesson] of Object.entries(TOPIC_TO_LESSON)) {
      if (id.toLowerCase().includes(topic)) return lesson;
    }
  }

  // Level-appropriate defaults when no clear weakness
  const LEVEL_DEFAULT = {
    A1: 'alphabet',
    A2: 'past-tense',
    B1: 'future-tense',
    B2: 'future-tense',
    C1: 'vi-vs-ti',
  };
  return LEVEL_DEFAULT[cefrLevel] || 'past-tense';
}

/**
 * Returns recommended exercise difficulty based on rolling accuracy across all topics.
 * Uses a 70% threshold: above = ready to advance, below = stay or drop.
 *
 * @returns {'beginner'|'intermediate'|'advanced'}
 */
export function getDifficultyRecommendation() {
  const data = _load();
  const entries = Object.values(data);
  if (entries.length < 5) return 'beginner'; // not enough data

  const avg = entries.reduce((sum, v) => {
    const vt = /** @type {any} */ (v);
    return sum + (vt.attempts > 0 ? vt.correct / vt.attempts : 0);
  }, 0) / entries.length;

  const avgPct = avg * 100;
  if (avgPct >= 78) return 'advanced';
  if (avgPct >= 58) return 'intermediate';
  return 'beginner';
}

/**
 * Returns true if a topic needs urgent remedial review.
 * Criteria: ≥5 attempts AND accuracy below 50% — the learner is struggling badly.
 *
 * @param {string} topicId
 * @returns {boolean}
 */
export function shouldTriggerRemedial(topicId) {
  const data = _load();
  const t = data[topicId];
  if (!t || t.attempts < 5) return false;
  return (t.correct / t.attempts) < 0.50;
}

/**
 * Returns a prioritized, personalized learning path as an ordered array of
 * { id, label, reason } objects. Designed to surface the most urgent gaps first.
 *
 * @param {string} cefrLevel
 * @param {{ diff?: string }} [stats]
 * @returns {Array<{id:string, label:string, reason:string, urgent:boolean}>}
 */
export function getPersonalizedPath(cefrLevel, stats) {
  const weak = getWeakTopics(65);
  const critical = getWeakTopics(50);

  /** @type {Array<{id:string, label:string, reason:string, urgent:boolean}>} */
  const path = [];

  // Critical remedial items first (accuracy < 50%, ≥3 attempts)
  for (const { id, accuracy } of critical) {
    path.push({
      id,
      label: id.charAt(0).toUpperCase() + id.slice(1),
      reason: `Accuracy ${accuracy}% — needs urgent review`,
      urgent: true,
    });
  }

  // Weak items (50–64%, ≥3 attempts)
  for (const { id, accuracy } of weak.filter(w => !critical.find(c => c.id === w.id))) {
    path.push({
      id,
      label: id.charAt(0).toUpperCase() + id.slice(1),
      reason: `Accuracy ${accuracy}% — practice recommended`,
      urgent: false,
    });
  }

  // Level-appropriate next steps if no clear weaknesses
  if (path.length === 0) {
    const NEXT = {
      A1: [{ id: 'grammar', label: 'Basic Grammar', reason: 'Next step for A1 learners', urgent: false }],
      A2: [{ id: 'past-tense', label: 'Past Tense', reason: 'Core A2 milestone', urgent: false }],
      B1: [
        { id: 'future-tense', label: 'Future Tense', reason: 'Core B1 milestone', urgent: false },
        { id: 'aspect', label: 'Verb Aspect', reason: 'Imperfective vs perfective — key B1 concept', urgent: false },
      ],
      B2: [
        { id: 'conditionals', label: 'Conditional', reason: 'If-then structures — B2 requirement', urgent: false },
        { id: 'formal-register', label: 'Formal Register', reason: 'Professional Croatian — B2 skill', urgent: false },
      ],
      C1: [
        { id: 'phonology', label: 'Phonology & Pitch', reason: 'C1 precision — tonal accuracy', urgent: false },
      ],
    };
    return NEXT[cefrLevel] || NEXT['B1'];
  }

  return path;
}
