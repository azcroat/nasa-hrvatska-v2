import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  recordTopicResult,
  getTopicAccuracy,
  getWeakTopics,
  getRecommendedLesson,
  getDifficultyRecommendation,
  shouldTriggerRemedial,
  getPersonalizedPath,
} from '../lib/adaptive.js';

function clearLS() { localStorage.clear(); }

describe('adaptive — per-topic accuracy tracking', () => {
  beforeEach(clearLS);
  afterEach(clearLS);

  // ── recordTopicResult ─────────────────────────────────────────────────────

  it('creates a new topic entry on first call', () => {
    recordTopicResult('food', true);
    const data = JSON.parse(localStorage.getItem('topic_accuracy'));
    expect(data.food).toBeDefined();
    expect(data.food.attempts).toBe(1);
    expect(data.food.correct).toBe(1);
  });

  it('records incorrect result (correct=false)', () => {
    recordTopicResult('numbers', false);
    const data = JSON.parse(localStorage.getItem('topic_accuracy'));
    expect(data.numbers.correct).toBe(0);
    expect(data.numbers.attempts).toBe(1);
  });

  it('accumulates multiple attempts on same topic', () => {
    recordTopicResult('greetings', true);
    recordTopicResult('greetings', true);
    recordTopicResult('greetings', false);
    const data = JSON.parse(localStorage.getItem('topic_accuracy'));
    expect(data.greetings.attempts).toBe(3);
    expect(data.greetings.correct).toBe(2);
  });

  it('sets lastAttempt timestamp', () => {
    const before = Date.now();
    recordTopicResult('family', true);
    const data = JSON.parse(localStorage.getItem('topic_accuracy'));
    expect(data.family.lastAttempt).toBeGreaterThanOrEqual(before);
  });

  it('accumulates across multiple topics independently', () => {
    recordTopicResult('food', true);
    recordTopicResult('numbers', false);
    const data = JSON.parse(localStorage.getItem('topic_accuracy'));
    expect(data.food.attempts).toBe(1);
    expect(data.numbers.attempts).toBe(1);
    expect(data.food.correct).toBe(1);
    expect(data.numbers.correct).toBe(0);
  });

  // ── getTopicAccuracy ──────────────────────────────────────────────────────

  it('returns null for unknown topic', () => {
    expect(getTopicAccuracy('unknown_topic')).toBeNull();
  });

  it('returns null when no data stored at all', () => {
    expect(getTopicAccuracy('food')).toBeNull();
  });

  it('returns accuracy as percentage (0-100)', () => {
    recordTopicResult('food', true);
    recordTopicResult('food', true);
    recordTopicResult('food', false);
    const result = getTopicAccuracy('food');
    expect(result.accuracy).toBe(67); // Math.round(2/3 * 100)
    expect(result.attempts).toBe(3);
  });

  it('returns 100% accuracy for all correct', () => {
    recordTopicResult('colors', true);
    recordTopicResult('colors', true);
    const result = getTopicAccuracy('colors');
    expect(result.accuracy).toBe(100);
  });

  it('returns 0% accuracy for all incorrect', () => {
    recordTopicResult('verbs', false);
    recordTopicResult('verbs', false);
    const result = getTopicAccuracy('verbs');
    expect(result.accuracy).toBe(0);
  });

  // ── getWeakTopics ─────────────────────────────────────────────────────────

  it('returns empty array when no data', () => {
    expect(getWeakTopics()).toEqual([]);
  });

  it('excludes topics with fewer than 3 attempts', () => {
    recordTopicResult('food', false);
    recordTopicResult('food', false);
    expect(getWeakTopics()).toEqual([]);
  });

  it('includes topic at exactly 3 attempts below threshold', () => {
    recordTopicResult('cases', false);
    recordTopicResult('cases', false);
    recordTopicResult('cases', false);
    const weak = getWeakTopics(60);
    expect(weak.some(t => t.id === 'cases')).toBe(true);
  });

  it('excludes topics above the threshold', () => {
    // 3 correct out of 3 = 100% — above any default threshold
    recordTopicResult('greetings', true);
    recordTopicResult('greetings', true);
    recordTopicResult('greetings', true);
    expect(getWeakTopics()).toEqual([]);
  });

  it('includes topic below custom threshold (80%)', () => {
    // 2 correct out of 3 = 66.6%
    recordTopicResult('aspect', true);
    recordTopicResult('aspect', true);
    recordTopicResult('aspect', false);
    const weak = getWeakTopics(80);
    expect(weak.some(t => t.id === 'aspect')).toBe(true);
  });

  it('sorts weak topics by accuracy ascending (worst first)', () => {
    // Topic A: 0% (3 attempts)
    for (let i = 0; i < 3; i++) recordTopicResult('topicA', false);
    // Topic B: 33% (3 attempts)
    recordTopicResult('topicB', true);
    recordTopicResult('topicB', false);
    recordTopicResult('topicB', false);
    const weak = getWeakTopics(60);
    const ids = weak.map(t => t.id);
    expect(ids.indexOf('topicA')).toBeLessThan(ids.indexOf('topicB'));
  });

  it('returned items have id, accuracy, and attempts fields', () => {
    for (let i = 0; i < 3; i++) recordTopicResult('declension', false);
    const [item] = getWeakTopics();
    expect(typeof item.id).toBe('string');
    expect(typeof item.accuracy).toBe('number');
    expect(typeof item.attempts).toBe('number');
  });

  it('topic exactly at threshold is excluded (strictly less than)', () => {
    // 60% of 5 = 3 correct; topic with 60% accuracy should NOT appear in getWeakTopics(60)
    for (let i = 0; i < 3; i++) recordTopicResult('borderline', true);
    for (let i = 0; i < 2; i++) recordTopicResult('borderline', false);
    // accuracy = 60% — not strictly less than threshold
    const weak = getWeakTopics(60);
    expect(weak.some(t => t.id === 'borderline')).toBe(false);
  });
});

// ── getRecommendedLesson ──────────────────────────────────────────────────────

describe('adaptive — getRecommendedLesson', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('returns level-appropriate default when no weak topics', () => {
    expect(getRecommendedLesson('A1')).toBe('alphabet');
    expect(getRecommendedLesson('A2')).toBe('past-tense');
    expect(getRecommendedLesson('B1')).toBe('future-tense');
    expect(getRecommendedLesson('B2')).toBe('future-tense');
    expect(getRecommendedLesson('C1')).toBe('vi-vs-ti');
  });

  it('falls back to past-tense for unknown level', () => {
    expect(getRecommendedLesson('X9')).toBe('past-tense');
  });

  it('returns past-tense when grammar is a weak topic', () => {
    for (let i = 0; i < 3; i++) recordTopicResult('grammar', false);
    expect(getRecommendedLesson('A1')).toBe('past-tense');
  });

  it('returns future-tense when future is a weak topic', () => {
    for (let i = 0; i < 3; i++) recordTopicResult('future_drill', false);
    expect(getRecommendedLesson('A1')).toBe('future-tense');
  });

  it('returns vi-vs-ti when formal is a weak topic', () => {
    for (let i = 0; i < 3; i++) recordTopicResult('formal_speech', false);
    expect(getRecommendedLesson('A1')).toBe('vi-vs-ti');
  });
});

// ── getDifficultyRecommendation ───────────────────────────────────────────────

describe('adaptive — getDifficultyRecommendation', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('returns beginner when fewer than 5 topics recorded', () => {
    recordTopicResult('food', true);
    recordTopicResult('numbers', true);
    expect(getDifficultyRecommendation()).toBe('beginner');
  });

  it('returns beginner when average accuracy is below 58%', () => {
    // all 5 topics at 0%
    ['a','b','c','d','e'].forEach(t => {
      recordTopicResult(t, false);
      recordTopicResult(t, false);
      recordTopicResult(t, false);
    });
    expect(getDifficultyRecommendation()).toBe('beginner');
  });

  it('returns intermediate when average is 58-77%', () => {
    // 5 topics, 2 correct / 3 attempts each = 67%
    ['a','b','c','d','e'].forEach(t => {
      recordTopicResult(t, true);
      recordTopicResult(t, true);
      recordTopicResult(t, false);
    });
    expect(getDifficultyRecommendation()).toBe('intermediate');
  });

  it('returns advanced when average accuracy is 78% or above', () => {
    // 5 topics, all correct
    ['a','b','c','d','e'].forEach(t => {
      recordTopicResult(t, true);
      recordTopicResult(t, true);
      recordTopicResult(t, true);
      recordTopicResult(t, true);
    });
    expect(getDifficultyRecommendation()).toBe('advanced');
  });
});

// ── shouldTriggerRemedial ─────────────────────────────────────────────────────

describe('adaptive — shouldTriggerRemedial', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('returns false for unknown topic', () => {
    expect(shouldTriggerRemedial('no_such_topic')).toBe(false);
  });

  it('returns false if fewer than 5 attempts even with 0% accuracy', () => {
    for (let i = 0; i < 4; i++) recordTopicResult('cases', false);
    expect(shouldTriggerRemedial('cases')).toBe(false);
  });

  it('returns true at 5 attempts with accuracy below 50%', () => {
    // 2 correct / 5 = 40%
    recordTopicResult('cases', true);
    recordTopicResult('cases', true);
    for (let i = 0; i < 3; i++) recordTopicResult('cases', false);
    expect(shouldTriggerRemedial('cases')).toBe(true);
  });

  it('returns false at 5 attempts with accuracy exactly 50%', () => {
    // 2.5/5 = 50% — not strictly below 0.50
    // Use 3/6 = 50%
    for (let i = 0; i < 3; i++) recordTopicResult('cases', true);
    for (let i = 0; i < 3; i++) recordTopicResult('cases', false);
    expect(shouldTriggerRemedial('cases')).toBe(false);
  });

  it('returns false when accuracy is above 50%', () => {
    for (let i = 0; i < 4; i++) recordTopicResult('vocab', true);
    for (let i = 0; i < 2; i++) recordTopicResult('vocab', false);
    expect(shouldTriggerRemedial('vocab')).toBe(false);
  });
});

// ── getPersonalizedPath ───────────────────────────────────────────────────────

describe('adaptive — getPersonalizedPath', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('returns default level path when no weak topics exist', () => {
    const path = getPersonalizedPath('A1', {});
    expect(Array.isArray(path)).toBe(true);
    expect(path.length).toBeGreaterThan(0);
    expect(typeof path[0].id).toBe('string');
    expect(typeof path[0].reason).toBe('string');
    expect(typeof path[0].urgent).toBe('boolean');
  });

  it('returns default B1 path as fallback for unknown level', () => {
    const path = getPersonalizedPath('Z9', {});
    expect(path.some(p => p.id === 'future-tense' || p.id === 'aspect')).toBe(true);
  });

  it('puts critical items (accuracy < 50%) first and marks them urgent', () => {
    // Create a topic with <50% accuracy and ≥3 attempts
    for (let i = 0; i < 3; i++) recordTopicResult('grammar', false);
    const path = getPersonalizedPath('B1', {});
    const critical = path.find(p => p.id === 'grammar');
    expect(critical).toBeDefined();
    expect(critical.urgent).toBe(true);
  });

  it('includes weak items (50-64%) as non-urgent', () => {
    // 2 correct / 5 = 40% → critical. Use 2/3 ≈ 67% — above weak threshold
    // So set 50-64%: 2 correct / 4 = 50% exactly → NOT weak (not strictly below 65%)
    // Use 1 correct / 3 ≈ 33% → critical (below 50%)
    // For 50-64% range: 2 correct / 4 ≈ 50% is at threshold. Use below 65% but above 50%:
    // 3 correct / 5 = 60%
    for (let i = 0; i < 3; i++) recordTopicResult('tenses', true);
    for (let i = 0; i < 2; i++) recordTopicResult('tenses', false);
    const path = getPersonalizedPath('B1', {});
    const weak = path.find(p => p.id === 'tenses');
    expect(weak).toBeDefined();
    expect(weak.urgent).toBe(false);
  });

  it('each path item has id, label, reason, urgent fields', () => {
    const path = getPersonalizedPath('A2', {});
    path.forEach(item => {
      expect(typeof item.id).toBe('string');
      expect(typeof item.label).toBe('string');
      expect(typeof item.reason).toBe('string');
      expect(typeof item.urgent).toBe('boolean');
    });
  });
});
