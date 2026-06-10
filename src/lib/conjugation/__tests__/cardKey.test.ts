// src/lib/conjugation/__tests__/cardKey.test.ts
import { describe, it, expect } from 'vitest';
import { buildCardKey, parseCardKey } from '../cardKey';
import type { ConjCell } from '../types';

describe('conjugation card keys', () => {
  it('round-trips a present cell', () => {
    const cell: ConjCell = { inf: 'pisati', formType: 'present', personIdx: 0 };
    const key = buildCardKey(cell);
    expect(key).toBe('conj|pisati|present|0');
    expect(parseCardKey(key)).toEqual(cell);
  });

  it('round-trips a gendered past cell', () => {
    const cell: ConjCell = { inf: 'ići', formType: 'past', personIdx: 2, gender: 'f' };
    const key = buildCardKey(cell);
    expect(key).toBe('conj|ići|past|2|f');
    expect(parseCardKey(key)).toEqual(cell);
  });

  it('returns null for non-conjugation keys', () => {
    expect(parseCardKey('kuća')).toBeNull();
    expect(parseCardKey('conj|bad')).toBeNull();
  });
});
