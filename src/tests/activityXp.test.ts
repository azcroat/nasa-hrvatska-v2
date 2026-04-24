import { describe, it, expect } from 'vitest';
import { ACTIVITY_XP_MAP } from '../lib/activityXp.js';

describe('ACTIVITY_XP_MAP', () => {
  it('covers all required activity types', () => {
    const required = [
      'media_view',
      'phrase_of_day',
      'daily_discovery',
      'grammar',
      'vocabulary',
      'pronunciation',
      'listening',
      'reading',
      'speaking',
      'culture',
      'quest',
      'review',
      'lesson',
      'heritage',
      'story',
      'default',
    ];
    for (const key of required) {
      expect(ACTIVITY_XP_MAP).toHaveProperty(key);
    }
  });

  it('all caps are positive integers', () => {
    for (const [_key, cap] of Object.entries(ACTIVITY_XP_MAP)) {
      expect(typeof cap).toBe('number');
      expect(Number.isInteger(cap)).toBe(true);
      expect(cap).toBeGreaterThan(0);
    }
  });

  it('lesson cap covers 50 XP × 2× multiplier + 50 comeback + 10 headroom', () => {
    expect(ACTIVITY_XP_MAP.lesson).toBeGreaterThanOrEqual(160);
  });

  it('heritage cap covers 75 XP × 2× multiplier + 50 comeback + 10 headroom', () => {
    expect(ACTIVITY_XP_MAP.heritage).toBeGreaterThanOrEqual(210);
  });

  it('grammar/vocabulary caps cover 25 XP × 2× multiplier + 50 comeback', () => {
    expect(ACTIVITY_XP_MAP.grammar).toBeGreaterThanOrEqual(50);
    expect(ACTIVITY_XP_MAP.vocabulary).toBeGreaterThanOrEqual(50);
  });

  it('default cap covers all activity types', () => {
    expect(ACTIVITY_XP_MAP.default).toBeGreaterThanOrEqual(ACTIVITY_XP_MAP.lesson);
  });
});
