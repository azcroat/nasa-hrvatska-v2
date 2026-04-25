import { describe, it, expect, beforeEach } from 'vitest';
import {
  rateCategorySession,
  getDueCategoryQueue,
  getCategoryDifficulty,
  type SkillCategory,
} from '../lib/adaptive';

beforeEach(() => {
  localStorage.clear();
});

describe('rateCategorySession', () => {
  it('sets recentAccuracy via EWMA on first session', () => {
    rateCategorySession('genitive', 0.8);
    // new card starts at 0.5; EWMA: 0.3*0.8 + 0.7*0.5 = 0.59
    const diff = getCategoryDifficulty('genitive');
    expect(diff).toBeGreaterThanOrEqual(1);
    expect(diff).toBeLessThanOrEqual(5);
  });

  it('schedules due date in the future after a session', () => {
    const before = Date.now();
    rateCategorySession('past-tense', 0.9);
    // Raw localStorage value should have due > now (at least 1 day out)
    const raw = JSON.parse(localStorage.getItem('nh_cat_sr') ?? '{}');
    expect(raw['past-tense'].due).toBeGreaterThan(before + 86400000 * 0.9);
  });

  it('maps accuracy < 0.5 to grade 1 (interval = 1 day)', () => {
    rateCategorySession('accusative', 0.3);
    const raw = JSON.parse(localStorage.getItem('nh_cat_sr') ?? '{}');
    const card = raw['accusative'];
    expect(card.due).toBeLessThanOrEqual(Date.now() + 86400000 * 1.5);
  });

  it('maps accuracy >= 0.9 to grade 4 (longer interval)', () => {
    rateCategorySession('future-tense', 0.95);
    const raw = JSON.parse(localStorage.getItem('nh_cat_sr') ?? '{}');
    const card = raw['future-tense'];
    // Default stability=1, grade 4 → min(60, round(1*2.5))=2 days
    expect(card.due).toBeGreaterThan(Date.now() + 86400000 * 1.9);
  });

  it('EWMA accuracy decays toward session score over multiple calls', () => {
    rateCategorySession('speaking', 1.0);
    rateCategorySession('speaking', 1.0);
    rateCategorySession('speaking', 0.0); // sudden failure
    const raw = JSON.parse(localStorage.getItem('nh_cat_sr') ?? '{}');
    // After 2 perfect + 1 zero, recentAccuracy should be < 1.0
    expect(raw['speaking'].recentAccuracy).toBeLessThan(1.0);
    expect(raw['speaking'].recentAccuracy).toBeGreaterThan(0.0);
  });
});

describe('getDueCategoryQueue', () => {
  it('returns an array of up to maxSlots items', () => {
    const queue = getDueCategoryQueue(6);
    expect(queue.length).toBeLessThanOrEqual(6);
  });

  it('each item has category and difficulty 1–5', () => {
    const queue = getDueCategoryQueue(4);
    for (const item of queue) {
      expect(typeof item.category).toBe('string');
      expect(item.difficulty).toBeGreaterThanOrEqual(1);
      expect(item.difficulty).toBeLessThanOrEqual(5);
    }
  });

  it('prioritises categories with due date in the past', () => {
    // Make 'genitive' overdue by back-dating it
    const catData: Record<string, object> = {};
    catData['genitive'] = {
      stability: 7,
      recentAccuracy: 0.8,
      due: Date.now() - 1000,
      lastSeen: Date.now() - 86400000 * 8,
    };
    catData['accusative'] = {
      stability: 7,
      recentAccuracy: 0.9,
      due: Date.now() + 86400000,
      lastSeen: Date.now(),
    };
    localStorage.setItem('nh_cat_sr', JSON.stringify(catData));

    const queue = getDueCategoryQueue(6);
    expect(queue[0]?.category).toBe('genitive');
  });
});

describe('getCategoryDifficulty', () => {
  it('returns 1 for a brand-new category (no history)', () => {
    const d = getCategoryDifficulty('conditional' as SkillCategory);
    expect(d).toBe(1);
  });

  it('returns higher difficulty as stability grows', () => {
    // Simulate high stability
    const catData: Record<string, object> = {};
    catData['instrumental'] = {
      stability: 20,
      recentAccuracy: 0.92,
      due: Date.now() + 100000,
      lastSeen: Date.now(),
    };
    localStorage.setItem('nh_cat_sr', JSON.stringify(catData));
    const d = getCategoryDifficulty('instrumental' as SkillCategory);
    expect(d).toBeGreaterThanOrEqual(4);
  });
});
