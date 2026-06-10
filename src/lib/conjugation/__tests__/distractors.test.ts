// src/lib/conjugation/__tests__/distractors.test.ts
import { describe, it, expect } from 'vitest';
import { buildDistractors } from '../distractors';
import type { ConjVerb, ConjCell } from '../types';

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
const cell: ConjCell = { inf: 'pisati', formType: 'present', personIdx: 0 }; // pišem

// deterministic RNG for tests
function seeded(n: number): () => number {
  let s = n;
  return () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
}

describe('buildDistractors', () => {
  it('returns exactly 3 unique distractors, none equal to the correct form', () => {
    const d = buildDistractors({
      verb: pisati,
      cell,
      correct: 'pišem',
      allVerbs: [pisati],
      rng: seeded(1),
    });
    expect(d).toHaveLength(3);
    expect(new Set(d).size).toBe(3);
    expect(d).not.toContain('pišem');
  });

  it('prefers wrong-person forms of the same verb', () => {
    const d = buildDistractors({
      verb: pisati,
      cell,
      correct: 'pišem',
      allVerbs: [pisati],
      rng: seeded(1),
    });
    // pišeš/piše/… are wrong persons of the same verb
    expect(d.some((x) => pisati.present!.includes(x))).toBe(true);
  });
});
