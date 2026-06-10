// src/lib/conjugation/__tests__/mastery.test.ts
import { describe, it, expect } from 'vitest';
import { cellMastery, verbMastery } from '../mastery';
import type { ConjCell } from '../types';

describe('mastery', () => {
  it('classifies a cell by FSRS stability', () => {
    expect(cellMastery({ s: 30 })).toBe('mastered'); // s ≥ 21
    expect(cellMastery({ s: 5 })).toBe('learning');
    expect(cellMastery(undefined)).toBe('new');
  });
  it('summarizes a verb across its cells', () => {
    const cells: ConjCell[] = [
      { inf: 'pisati', formType: 'present', personIdx: 0 },
      { inf: 'pisati', formType: 'present', personIdx: 1 },
    ];
    const sr = { 'conj|pisati|present|0': { s: 30 }, 'conj|pisati|present|1': { s: 30 } };
    expect(verbMastery('pisati', cells, sr)).toBe('mastered');
  });
});
