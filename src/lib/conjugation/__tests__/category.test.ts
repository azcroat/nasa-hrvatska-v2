import { describe, it, expect } from 'vitest';
import { categoryToFormType, cefrRank } from '../category';

describe('categoryToFormType', () => {
  it('maps tense categories to form types', () => {
    expect(categoryToFormType('present-tense')).toBe('present');
    expect(categoryToFormType('past-tense')).toBe('past');
    expect(categoryToFormType('future-tense')).toBe('future1');
    expect(categoryToFormType('conditional')).toBe('conditional');
  });
  it('maps all aspect categories to present (drilled over pair verbs)', () => {
    expect(categoryToFormType('aspect-imperfective')).toBe('present');
    expect(categoryToFormType('aspect-perfective')).toBe('present');
    expect(categoryToFormType('aspect-negation')).toBe('present');
  });
  it('returns null for non-conjugation categories', () => {
    expect(categoryToFormType('genitive')).toBeNull();
    expect(categoryToFormType('vocab-a2')).toBeNull();
  });
});

describe('cefrRank', () => {
  it('orders A1 < A2 < B1 < B2', () => {
    expect(cefrRank('A1')).toBeLessThan(cefrRank('A2'));
    expect(cefrRank('A2')).toBeLessThan(cefrRank('B1'));
    expect(cefrRank('B1')).toBeLessThan(cefrRank('B2'));
  });
});
