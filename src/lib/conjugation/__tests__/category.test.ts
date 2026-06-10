import { describe, it, expect } from 'vitest';
import { categoryToFormType, cefrRank, cellsForCategory } from '../category';
import type { ConjVerb } from '../types';

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

const pisati: ConjVerb = {
  inf: 'pisati',
  en: 'to write',
  aspect: 'impf',
  pair: 'napisati',
  klass: 'a-em',
  cefr: 'A1',
  irregular: false,
  present: ['pišem', 'pišeš', 'piše', 'pišemo', 'pišete', 'pišu'],
};
const govoriti: ConjVerb = {
  inf: 'govoriti',
  en: 'to speak',
  aspect: 'impf',
  pair: null,
  klass: 'i-im',
  cefr: 'A1',
  irregular: false,
  present: ['govorim', 'govoriš', 'govori', 'govorimo', 'govorite', 'govore'],
  past: {
    m: ['govorio sam', 'govorio si', 'govorio je', 'govorili smo', 'govorili ste', 'govorili su'],
    f: [
      'govorila sam',
      'govorila si',
      'govorila je',
      'govorile smo',
      'govorile ste',
      'govorile su',
    ],
    n: [
      'govorilo sam',
      'govorilo si',
      'govorilo je',
      'govorila smo',
      'govorila ste',
      'govorila su',
    ],
  },
};

describe('cellsForCategory', () => {
  const verbs = [pisati, govoriti];

  it('returns only present-tense cells for present-tense at A1', () => {
    const cells = cellsForCategory('present-tense', verbs, 'A1', {
      size: 50,
      daySeed: 1,
      dueKeys: new Set(),
    });
    expect(cells.length).toBeGreaterThan(0);
    expect(cells.every((c) => c.formType === 'present')).toBe(true);
  });

  it('drills any level-appropriate verb in the pool, regardless of curriculum units', () => {
    const orphan: ConjVerb = {
      inf: 'kuhati',
      en: 'to cook',
      aspect: 'impf',
      pair: null,
      klass: 'a-am',
      cefr: 'A1',
      irregular: false,
      present: ['kuham', 'kuhaš', 'kuha', 'kuhamo', 'kuhate', 'kuhaju'],
    };
    const cells = cellsForCategory('present-tense', [orphan], 'A1', {
      size: 50,
      daySeed: 1,
      dueKeys: new Set(),
    });
    expect(cells.some((c) => c.inf === 'kuhati' && c.formType === 'present')).toBe(true);
  });

  it('excludes verbs above the user CEFR', () => {
    const b2: ConjVerb = {
      inf: 'razmišljati',
      en: 'to ponder',
      aspect: 'impf',
      pair: null,
      klass: 'a-am',
      cefr: 'B2',
      irregular: false,
      present: [
        'razmišljam',
        'razmišljaš',
        'razmišlja',
        'razmišljamo',
        'razmišljate',
        'razmišljaju',
      ],
    };
    const cells = cellsForCategory('present-tense', [b2], 'A1', {
      size: 50,
      daySeed: 1,
      dueKeys: new Set(),
    });
    expect(cells).toHaveLength(0);
  });

  it('returns past cells for past-tense at A2+', () => {
    const cells = cellsForCategory('past-tense', verbs, 'A2', {
      size: 50,
      daySeed: 1,
      dueKeys: new Set(),
    });
    expect(cells.length).toBeGreaterThan(0);
    expect(cells.every((c) => c.formType === 'past')).toBe(true);
  });

  it('caps at size and is deterministic per day-seed', () => {
    const a = cellsForCategory('present-tense', verbs, 'A1', {
      size: 3,
      daySeed: 42,
      dueKeys: new Set(),
    });
    const b = cellsForCategory('present-tense', verbs, 'A1', {
      size: 3,
      daySeed: 42,
      dueKeys: new Set(),
    });
    expect(a.length).toBeLessThanOrEqual(3);
    expect(a).toEqual(b);
  });

  it('returns [] for a non-conjugation category', () => {
    expect(cellsForCategory('genitive', verbs, 'B2', { dueKeys: new Set() })).toHaveLength(0);
  });
});
