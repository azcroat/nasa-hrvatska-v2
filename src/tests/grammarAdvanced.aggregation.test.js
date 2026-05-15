// src/tests/grammarAdvanced.aggregation.test.js
import { describe, it, expect } from 'vitest';
import { ADVANCED_UNITS, GRAMMAR_UNIT_BY_ID } from '../data/grammar-advanced.js';

describe('grammar-advanced.js aggregation', () => {
  it('GRAMMAR_UNIT_BY_ID has an entry for every unit in ADVANCED_UNITS', () => {
    for (const u of ADVANCED_UNITS) {
      expect(GRAMMAR_UNIT_BY_ID[u.id]).toBe(u);
    }
  });

  it('GRAMMAR_UNIT_BY_ID has no extra entries beyond ADVANCED_UNITS', () => {
    expect(Object.keys(GRAMMAR_UNIT_BY_ID)).toHaveLength(ADVANCED_UNITS.length);
  });

  it('no duplicate unit ids across ADVANCED_UNITS', () => {
    const ids = ADVANCED_UNITS.map((u) => u.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});
