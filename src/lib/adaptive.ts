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
// Topic data older than 30 days is considered stale and resets on next attempt.
// This prevents old struggles from permanently marking a topic as "weak" after
// the learner has had a long break and potentially improved through other means.
const STALE_MS = 30 * 24 * 60 * 60 * 1000;

interface TopicData {
  attempts: number;
  correct: number;
  lastAttempt: number;
}

interface TopicMap {
  [topicId: string]: TopicData;
}

function _load(): TopicMap {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

function _save(data: TopicMap): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {}
}

// ─── Core tracking ──────────────────────────────────────────────────────────

export function recordTopicResult(topicId: string, correct: boolean): void {
  const data = _load();
  const curr = data[topicId] || { attempts: 0, correct: 0, lastAttempt: 0 };
  // If last attempt was >30 days ago, start a fresh window so historical
  // struggles don't permanently haunt the adaptive panel.
  const isStale = curr.lastAttempt > 0 && Date.now() - curr.lastAttempt > STALE_MS;
  const base = isStale ? { attempts: 0, correct: 0 } : curr;
  data[topicId] = {
    attempts: base.attempts + 1,
    correct: base.correct + (correct ? 1 : 0),
    lastAttempt: Date.now(),
  };
  _save(data);
}

export function getTopicAccuracy(topicId: string): { accuracy: number; attempts: number } | null {
  const data = _load();
  const t = data[topicId];
  if (!t || t.attempts === 0) return null;
  return { accuracy: Math.round((t.correct / t.attempts) * 100), attempts: t.attempts };
}

export function getWeakTopics(
  threshold = 60,
): Array<{ id: string; accuracy: number; attempts: number }> {
  const data = _load();
  const now = Date.now();
  return Object.entries(data)
    .filter(
      ([, v]) =>
        v.attempts >= 3 &&
        (v.correct / v.attempts) * 100 < threshold &&
        now - v.lastAttempt < STALE_MS, // only surface recent data
    )
    .map(([id, v]) => ({
      id,
      accuracy: Math.round((v.correct / v.attempts) * 100),
      attempts: v.attempts,
    }))
    .sort((a, b) => a.accuracy - b.accuracy);
}

// ─── Path adjustment ─────────────────────────────────────────────────────────

/**
 * Returns the recommended next animated lesson ID based on what the learner
 * has attempted and where their gaps are. Falls back to a level-appropriate default.
 */
export function getRecommendedLesson(cefrLevel: string): string {
  const weak = getWeakTopics(65);

  // Map topic IDs to animated lesson IDs
  const TOPIC_TO_LESSON: Record<string, string> = {
    grammar: 'past-tense',
    past: 'past-tense',
    tenses: 'past-tense',
    future: 'future-tense',
    formal: 'vi-vs-ti',
    alphabet: 'alphabet',
  };

  for (const { id } of weak) {
    for (const [topic, lesson] of Object.entries(TOPIC_TO_LESSON)) {
      if (id.toLowerCase().includes(topic)) return lesson;
    }
  }

  const LEVEL_DEFAULT: Record<string, string> = {
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
 */
export function getDifficultyRecommendation(): 'beginner' | 'intermediate' | 'advanced' {
  const data = _load();
  const entries = Object.values(data);
  if (entries.length < 5) return 'beginner';

  const avg =
    entries.reduce((sum, v) => {
      return sum + (v.attempts > 0 ? v.correct / v.attempts : 0);
    }, 0) / entries.length;

  const avgPct = avg * 100;
  if (avgPct >= 78) return 'advanced';
  if (avgPct >= 58) return 'intermediate';
  return 'beginner';
}

/**
 * Returns true if a topic needs urgent remedial review.
 */
export function shouldTriggerRemedial(topicId: string): boolean {
  const data = _load();
  const t = data[topicId];
  if (!t || t.attempts < 5) return false;
  return t.correct / t.attempts < 0.5;
}

interface PathItem {
  id: string;
  label: string;
  reason: string;
  urgent: boolean;
}

/**
 * Returns a prioritized, personalized learning path.
 */
export function getPersonalizedPath(cefrLevel: string, stats?: { diff?: string }): PathItem[] {
  const weak = getWeakTopics(65);
  const critical = getWeakTopics(50);

  const path: PathItem[] = [];

  for (const { id, accuracy } of critical) {
    path.push({
      id,
      label: id.charAt(0).toUpperCase() + id.slice(1),
      reason: `Accuracy ${accuracy}% — needs urgent review`,
      urgent: true,
    });
  }

  for (const { id, accuracy } of weak.filter((w) => !critical.find((c) => c.id === w.id))) {
    path.push({
      id,
      label: id.charAt(0).toUpperCase() + id.slice(1),
      reason: `Accuracy ${accuracy}% — practice recommended`,
      urgent: false,
    });
  }

  if (path.length === 0) {
    const NEXT: Record<string, PathItem[]> = {
      A1: [
        {
          id: 'grammar',
          label: 'Basic Grammar',
          reason: 'Next step for A1 learners',
          urgent: false,
        },
      ],
      A2: [{ id: 'past-tense', label: 'Past Tense', reason: 'Core A2 milestone', urgent: false }],
      B1: [
        { id: 'future-tense', label: 'Future Tense', reason: 'Core B1 milestone', urgent: false },
        {
          id: 'aspect',
          label: 'Verb Aspect',
          reason: 'Imperfective vs perfective — key B1 concept',
          urgent: false,
        },
      ],
      B2: [
        {
          id: 'conditionals',
          label: 'Conditional',
          reason: 'If-then structures — B2 requirement',
          urgent: false,
        },
        {
          id: 'formal-register',
          label: 'Formal Register',
          reason: 'Professional Croatian — B2 skill',
          urgent: false,
        },
      ],
      C1: [
        {
          id: 'phonology',
          label: 'Phonology & Pitch',
          reason: 'C1 precision — tonal accuracy',
          urgent: false,
        },
      ],
    };
    return NEXT[cefrLevel] || NEXT['B1'];
  }

  return path;
}
