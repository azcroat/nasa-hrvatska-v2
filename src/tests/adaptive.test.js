import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  recordTopicResult,
  getTopicAccuracy,
  getWeakTopics,
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
