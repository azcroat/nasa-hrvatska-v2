// src/lib/conjugation/__tests__/cells.test.ts
import { describe, it, expect } from 'vitest';
import { cellsForUnit, dueConjKeys } from '../cells';
import type { ConjVerb } from '../types';
import type { ConjUnit as Unit } from '../curriculum';

const pisati: ConjVerb = {
  inf: 'pisati',
  en: 'to write',
  aspect: 'impf',
  pair: null,
  klass: 'a-em',
  cefr: 'A1',
  irregular: false,
  present: ['pišem', 'pišeš', 'piše', 'pišemo', 'pišete', 'pišu'],
};

function a6() {
  return ['1', '2', '3', '4', '5', '6'];
}

describe('cellsForUnit', () => {
  it('expands a present unit into 6 cells per verb', () => {
    const unit: Pick<Unit, 'formTypes' | 'verbs'> = { formTypes: ['present'], verbs: ['pisati'] };
    const cells = cellsForUnit(unit, [pisati]);
    expect(cells).toHaveLength(6);
    expect(cells[0]).toMatchObject({ inf: 'pisati', formType: 'present', personIdx: 0 });
  });
  it('expands a past unit into 18 cells per verb (6 persons × 3 genders)', () => {
    const past: ConjVerb = { ...pisati, past: { m: a6(), f: a6(), n: a6() } };
    const unit: Pick<Unit, 'formTypes' | 'verbs'> = { formTypes: ['past'], verbs: ['pisati'] };
    const cells = cellsForUnit(unit, [past]);
    expect(cells).toHaveLength(18);
  });
});

describe('dueConjKeys', () => {
  it('filters an SR map to only due conjugation keys', () => {
    const now = Date.now();
    const sr = {
      kuća: { nextDue: now - 1000 },
      'conj|pisati|present|0': { nextDue: now - 1000 }, // due
      'conj|pisati|present|1': { nextDue: now + 100000 }, // not due
    };
    const due = dueConjKeys(sr, now);
    expect(due.has('conj|pisati|present|0')).toBe(true);
    expect(due.has('conj|pisati|present|1')).toBe(false);
    expect(due.has('kuća')).toBe(false);
  });
});
