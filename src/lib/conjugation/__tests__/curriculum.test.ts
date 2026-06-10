// src/lib/conjugation/__tests__/curriculum.test.ts
import { describe, it, expect } from 'vitest';
import { UNITS } from '../curriculum';
import { VERBS } from '../../../../functions/api/content/_data/grammar.js';
import type { ConjVerb } from '../types';

describe('conjugation curriculum', () => {
  it('has 16 units in CEFR order A1→B2', () => {
    expect(UNITS).toHaveLength(16);
    const order = ['A1', 'A2', 'B1', 'B2'];
    let last = 0;
    for (const u of UNITS) {
      const idx = order.indexOf(u.cefr);
      expect(idx).toBeGreaterThanOrEqual(last);
      last = idx;
    }
  });

  it('every unit verb infinitive exists in the VERBS dataset', () => {
    const infs = new Set((VERBS as ConjVerb[]).map((v) => v.inf));
    for (const u of UNITS) {
      for (const inf of u.verbs) {
        expect(infs.has(inf), `unit ${u.id} → ${inf}`).toBe(true);
      }
    }
  });

  it('every unit declares at least one form type', () => {
    for (const u of UNITS) expect(u.formTypes.length).toBeGreaterThan(0);
  });
});
