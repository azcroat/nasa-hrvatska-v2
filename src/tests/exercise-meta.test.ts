import { describe, it, expect } from 'vitest';
import { EXERCISE_META, getExerciseMeta } from '../data/exerciseMeta';
import type { SkillCategory } from '../lib/adaptive';

const VALID_CATEGORIES: SkillCategory[] = [
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
];

describe('EXERCISE_META', () => {
  it('all entries have difficulty 1-5', () => {
    for (const [key, meta] of Object.entries(EXERCISE_META)) {
      expect(
        [1, 2, 3, 4, 5].includes(meta.difficulty),
        `${key}: difficulty ${meta.difficulty} is not 1-5`,
      ).toBe(true);
    }
  });

  it('all entries have a valid SkillCategory', () => {
    for (const [key, meta] of Object.entries(EXERCISE_META)) {
      expect(
        VALID_CATEGORIES.includes(meta.category),
        `${key}: category "${meta.category}" is not a valid SkillCategory`,
      ).toBe(true);
    }
  });

  it('coverage: at least 10 entries in EXERCISE_META', () => {
    expect(Object.keys(EXERCISE_META).length).toBeGreaterThanOrEqual(10);
  });

  it('contains expected exercise array names', () => {
    expect(EXERCISE_META['PLACE']).toBeDefined();
    expect(EXERCISE_META['FUTURE']).toBeDefined();
    expect(EXERCISE_META['TENSEFLIP']).toBeDefined();
    expect(EXERCISE_META['TRANSLATE_DRILLS']).toBeDefined();
    expect(EXERCISE_META['NEGATION']).toBeDefined();
  });

  it('FUTURE is mapped to future-tense category', () => {
    expect(EXERCISE_META['FUTURE']?.category).toBe('future-tense');
  });

  it('NEGATION is mapped to aspect-negation category', () => {
    expect(EXERCISE_META['NEGATION']?.category).toBe('aspect-negation');
  });

  it('TENSEFLIP is mapped to past-tense category with difficulty 3', () => {
    expect(EXERCISE_META['TENSEFLIP']?.category).toBe('past-tense');
    expect(EXERCISE_META['TENSEFLIP']?.difficulty).toBe(3);
  });

  it('future placeholder arrays are pre-mapped', () => {
    expect(EXERCISE_META['PAST_EXERCISES_MC']?.category).toBe('past-tense');
    expect(EXERCISE_META['PAST_EXERCISES_MC']?.difficulty).toBe(1);
    expect(EXERCISE_META['PAST_EXERCISES_FILL']?.category).toBe('past-tense');
    expect(EXERCISE_META['PAST_EXERCISES_FILL']?.difficulty).toBe(3);
    expect(EXERCISE_META['PAST_EXERCISES_XFORM']?.category).toBe('past-tense');
    expect(EXERCISE_META['PAST_EXERCISES_XFORM']?.difficulty).toBe(4);
    expect(EXERCISE_META['FUTURE_EXERCISES_MC']?.category).toBe('future-tense');
    expect(EXERCISE_META['FUTURE_EXERCISES_MC']?.difficulty).toBe(1);
    expect(EXERCISE_META['FUTURE_EXERCISES_FILL']?.category).toBe('future-tense');
    expect(EXERCISE_META['FUTURE_EXERCISES_FILL']?.difficulty).toBe(3);
    expect(EXERCISE_META['FUTURE_EXERCISES_XFORM']?.category).toBe('future-tense');
    expect(EXERCISE_META['FUTURE_EXERCISES_XFORM']?.difficulty).toBe(4);
  });
});

describe('getExerciseMeta', () => {
  it('returns correct entry for known key', () => {
    const meta = getExerciseMeta('PLACE');
    expect(meta.category).toBe('vocab-a2');
    expect([1, 2, 3, 4, 5]).toContain(meta.difficulty);
  });

  it('returns default {difficulty:3, category:"vocab-b1"} for unknown key', () => {
    const meta = getExerciseMeta('NONEXISTENT_ARRAY_XYZ');
    expect(meta).toEqual({ difficulty: 3, category: 'vocab-b1' });
  });

  it('returns default for empty string', () => {
    const meta = getExerciseMeta('');
    expect(meta).toEqual({ difficulty: 3, category: 'vocab-b1' });
  });
});
