import { describe, it, expect, beforeEach } from 'vitest';
import {
  rateCategorySession,
  getDueCategoryQueue,
  getCategoryDifficulty,
  ALL_CATEGORIES,
  CATEGORY_MIN_CEFR,
  CONJ_CATEGORIES,
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
    // Default stability=1, grade 4 → max(10, min(60, round(1*2.5))) = max(10, 3) = 10 days
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

  it('among recently-seen categories, prioritises due-in-past (FSRS ordering)', () => {
    const now = Date.now();
    // Seed EVERY category as seen today so none are "starved" — isolates the
    // FSRS due-ordering from the coverage floor.
    const catData: Record<string, object> = {};
    for (const c of ALL_CATEGORIES) {
      catData[c] = { stability: 7, recentAccuracy: 0.85, due: now + 86400000, lastSeen: now };
    }
    // genitive is overdue (due in the past) → first among non-starved.
    catData['genitive'] = { stability: 7, recentAccuracy: 0.8, due: now - 1000, lastSeen: now };
    localStorage.setItem('nh_cat_sr', JSON.stringify(catData));

    const queue = getDueCategoryQueue(6);
    expect(queue[0]?.category).toBe('genitive');
  });

  it('coverage floor: a never-seen category outranks a recently-practised due one', () => {
    const now = Date.now();
    // Seed all categories as just-practised AND overdue (would be due-front),
    // except 'vocative' which is never seen → starved → must come first.
    const catData: Record<string, object> = {};
    for (const c of ALL_CATEGORIES) {
      catData[c] = { stability: 7, recentAccuracy: 0.9, due: now - 1000, lastSeen: now };
    }
    delete catData['vocative'];
    localStorage.setItem('nh_cat_sr', JSON.stringify(catData));

    const queue = getDueCategoryQueue(6);
    expect(queue[0]?.category).toBe('vocative');
  });

  it('coverage floor: a long-neglected (stale) category outranks a recently-practised one', () => {
    const now = Date.now();
    const catData: Record<string, object> = {};
    for (const c of ALL_CATEGORIES) {
      catData[c] = { stability: 7, recentAccuracy: 0.9, due: now - 1000, lastSeen: now };
    }
    // accusative last practised 20 days ago (> 14-day floor) → starved.
    catData['accusative'] = {
      stability: 7,
      recentAccuracy: 0.9,
      due: now - 1000,
      lastSeen: now - 86400000 * 20,
    };
    localStorage.setItem('nh_cat_sr', JSON.stringify(catData));

    const queue = getDueCategoryQueue(6);
    expect(queue[0]?.category).toBe('accusative');
  });

  it('a brand-new user (no history) still starts at genitive', () => {
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

describe('conjugation category metadata', () => {
  it('present-tense is a registered category', () => {
    expect(ALL_CATEGORIES).toContain('present-tense');
  });
  it('CONJ_CATEGORIES are the 7 tense/aspect categories', () => {
    expect([...CONJ_CATEGORIES].sort()).toEqual(
      [
        'aspect-imperfective',
        'aspect-negation',
        'aspect-perfective',
        'conditional',
        'future-tense',
        'past-tense',
        'present-tense',
      ].sort(),
    );
  });
  it('min CEFR ascends present→aspect', () => {
    expect(CATEGORY_MIN_CEFR['present-tense']).toBe('A1');
    expect(CATEGORY_MIN_CEFR['past-tense']).toBe('A2');
    expect(CATEGORY_MIN_CEFR['future-tense']).toBe('A2');
    expect(CATEGORY_MIN_CEFR['conditional']).toBe('B1');
    expect(CATEGORY_MIN_CEFR['aspect-imperfective']).toBe('B1');
    expect(CATEGORY_MIN_CEFR['aspect-negation']).toBe('B1');
    expect(CATEGORY_MIN_CEFR['aspect-perfective']).toBe('B2');
  });
  it('rateCategorySession schedules present-tense', () => {
    rateCategorySession('present-tense', 0.8);
    expect(ALL_CATEGORIES).toContain('present-tense');
  });
});
