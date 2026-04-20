import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  recordTopicResult,
  getTopicAccuracy,
  getWeakTopics,
  getDifficultyRecommendation,
  shouldTriggerRemedial,
  getPersonalizedPath,
} from '../lib/adaptive';

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe('recordTopicResult + getTopicAccuracy', () => {
  it('creates new topic entry on first call', () => {
    recordTopicResult('food', true);
    const acc = getTopicAccuracy('food');
    expect(acc).not.toBeNull();
    expect(acc!.attempts).toBe(1);
    expect(acc!.accuracy).toBe(100);
  });

  it('tracks incorrect answers', () => {
    recordTopicResult('grammar', false);
    const acc = getTopicAccuracy('grammar');
    expect(acc!.accuracy).toBe(0);
    expect(acc!.attempts).toBe(1);
  });

  it('accumulates multiple results correctly', () => {
    recordTopicResult('vocab', true);
    recordTopicResult('vocab', true);
    recordTopicResult('vocab', false);
    const acc = getTopicAccuracy('vocab');
    expect(acc!.attempts).toBe(3);
    // Math.round((2/3)*100) = Math.round(66.67) = 67
    expect(acc!.accuracy).toBe(67);
  });

  it('returns null for unknown topic', () => {
    expect(getTopicAccuracy('nonexistent')).toBeNull();
  });
});

describe('getWeakTopics', () => {
  it('returns empty array when no topics recorded', () => {
    expect(getWeakTopics()).toEqual([]);
  });

  it('excludes topics with fewer than 3 attempts', () => {
    recordTopicResult('new_topic', false);
    recordTopicResult('new_topic', false);
    expect(getWeakTopics()).toEqual([]);
  });

  it('includes topics with ≥3 attempts and accuracy below threshold', () => {
    for (let i = 0; i < 5; i++) recordTopicResult('hard_topic', false);
    const weak = getWeakTopics();
    expect(weak.some((t: { id: string }) => t.id === 'hard_topic')).toBe(true);
  });

  it('excludes topics above threshold', () => {
    for (let i = 0; i < 4; i++) recordTopicResult('easy_topic', true);
    const weak = getWeakTopics();
    expect(weak.some((t: { id: string }) => t.id === 'easy_topic')).toBe(false);
  });

  it('sorts worst-accuracy topics first', () => {
    for (let i = 0; i < 4; i++) recordTopicResult('medium_topic', false);
    recordTopicResult('medium_topic', true);
    for (let i = 0; i < 5; i++) recordTopicResult('terrible_topic', false);
    const weak = getWeakTopics();
    const ids = weak.map((t: { id: string }) => t.id);
    expect(ids.indexOf('terrible_topic')).toBeLessThan(ids.indexOf('medium_topic'));
  });
});

describe('getDifficultyRecommendation', () => {
  it('returns beginner when fewer than 5 topics recorded', () => {
    recordTopicResult('topic1', true);
    recordTopicResult('topic1', true);
    recordTopicResult('topic1', true);
    expect(getDifficultyRecommendation()).toBe('beginner');
  });

  it('returns advanced when rolling accuracy ≥78% across ≥5 topics', () => {
    const topics = ['t1', 't2', 't3', 't4', 't5'];
    for (const t of topics) {
      for (let i = 0; i < 4; i++) recordTopicResult(t, true);
    }
    expect(getDifficultyRecommendation()).toBe('advanced');
  });

  it('returns intermediate when accuracy is between 58% and 78%', () => {
    // 3 correct out of 4 = 75%; across 5 topics avg = 75% → intermediate
    const topics = ['ta', 'tb', 'tc', 'td', 'te'];
    for (const t of topics) {
      recordTopicResult(t, true);
      recordTopicResult(t, true);
      recordTopicResult(t, true);
      recordTopicResult(t, false);
    }
    expect(getDifficultyRecommendation()).toBe('intermediate');
  });

  it('returns beginner when accuracy is below 58%', () => {
    // 1 correct out of 4 = 25%; across 5 topics avg = 25% → beginner
    const topics = ['ta', 'tb', 'tc', 'td', 'te'];
    for (const t of topics) {
      recordTopicResult(t, true);
      recordTopicResult(t, false);
      recordTopicResult(t, false);
      recordTopicResult(t, false);
    }
    expect(getDifficultyRecommendation()).toBe('beginner');
  });
});

describe('shouldTriggerRemedial', () => {
  it('returns false when fewer than 5 attempts', () => {
    for (let i = 0; i < 4; i++) recordTopicResult('topic', false);
    expect(shouldTriggerRemedial('topic')).toBe(false);
  });

  it('returns true when accuracy <50% AND ≥5 attempts', () => {
    for (let i = 0; i < 6; i++) recordTopicResult('hard', false);
    expect(shouldTriggerRemedial('hard')).toBe(true);
  });

  it('returns false when accuracy ≥50% with ≥5 attempts', () => {
    for (let i = 0; i < 5; i++) recordTopicResult('ok_topic', true);
    expect(shouldTriggerRemedial('ok_topic')).toBe(false);
  });

  it('returns false for unknown topic', () => {
    expect(shouldTriggerRemedial('never_seen')).toBe(false);
  });
});

describe('getPersonalizedPath', () => {
  it('returns an array', () => {
    expect(Array.isArray(getPersonalizedPath('A1'))).toBe(true);
  });

  it('returns non-empty array when no weak topics (falls back to level defaults)', () => {
    const path = getPersonalizedPath('B1');
    expect(path.length).toBeGreaterThan(0);
  });

  it('returns items with required shape (id, label, reason, urgent)', () => {
    for (let i = 0; i < 5; i++) recordTopicResult('grammar', false);
    const path = getPersonalizedPath('B1');
    for (const item of path) {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('label');
      expect(item).toHaveProperty('reason');
      expect(item).toHaveProperty('urgent');
    }
  });

  it('surfaces critical topics (accuracy <50%) as urgent items', () => {
    // 6 fails = 0% accuracy, well below 50% critical threshold
    for (let i = 0; i < 6; i++) recordTopicResult('phonology', false);
    const path = getPersonalizedPath('C1');
    const critical = path.find((item) => item.id === 'phonology');
    expect(critical).toBeDefined();
    expect(critical!.urgent).toBe(true);
  });

  it('falls back to A1 defaults when no weak topics', () => {
    const path = getPersonalizedPath('A1');
    expect(path.length).toBeGreaterThan(0);
    expect(path[0]).toHaveProperty('id', 'grammar');
  });

  it('accepts optional stats parameter without error', () => {
    expect(() => getPersonalizedPath('B2', { diff: 'intermediate' })).not.toThrow();
  });
});
