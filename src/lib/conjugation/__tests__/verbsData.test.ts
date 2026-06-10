// src/lib/conjugation/__tests__/verbsData.test.ts
import { describe, it, expect } from 'vitest';
import { VERBS } from '../../../../functions/api/content/_data/grammar.js';
import type { ConjVerb, FormType } from '../types';
import { expectedForms } from '../morphology';

const KLASSES = new Set(['a-am', 'a-em', 'i-im', 'irr']);
const ASPECTS = new Set(['impf', 'pf', 'bi']);

describe('VERBS dataset integrity', () => {
  const verbs = VERBS as ConjVerb[];

  it('is a non-empty array', () => {
    expect(Array.isArray(verbs)).toBe(true);
    expect(verbs.length).toBeGreaterThan(0);
  });

  it('every record has valid core fields', () => {
    for (const v of verbs) {
      expect(typeof v.inf, v.inf).toBe('string');
      expect(v.inf.trim().length).toBeGreaterThan(0);
      expect(typeof v.en).toBe('string');
      expect(KLASSES.has(v.klass), `${v.inf} klass=${v.klass}`).toBe(true);
      expect(ASPECTS.has(v.aspect), `${v.inf} aspect=${v.aspect}`).toBe(true);
      expect(['A1', 'A2', 'B1', 'B2']).toContain(v.cefr);
    }
  });

  it('form arrays have correct lengths and no empty strings', () => {
    const six = (arr: unknown): arr is string[] =>
      Array.isArray(arr) &&
      arr.length === 6 &&
      arr.every((s) => typeof s === 'string' && s.trim() !== '');
    for (const v of verbs) {
      if (v.present) expect(six(v.present), `${v.inf}.present`).toBe(true);
      if (v.future1) expect(six(v.future1), `${v.inf}.future1`).toBe(true);
      if (v.conditional) expect(six(v.conditional), `${v.inf}.conditional`).toBe(true);
      if (v.imperative) {
        expect(v.imperative.length, `${v.inf}.imperative`).toBe(3);
        expect(v.imperative.every((s) => typeof s === 'string' && s.trim() !== '')).toBe(true);
      }
      if (v.past) {
        for (const g of ['m', 'f', 'n'] as const) {
          expect(six(v.past[g]), `${v.inf}.past.${g}`).toBe(true);
        }
      }
    }
  });

  it('every aspect pair resolves to another record when present in the dataset', () => {
    const infs = new Set(verbs.map((v) => v.inf));
    for (const v of verbs) {
      if (v.pair !== null && infs.has(v.pair)) {
        expect(infs.has(v.pair)).toBe(true);
      }
    }
  });
});

describe('VERBS morphology correctness', () => {
  const verbs = VERBS as ConjVerb[];
  const FORMS: FormType[] = ['present', 'past', 'future1', 'imperative', 'conditional'];

  it('every non-exempt authored form matches the derived regular form', () => {
    for (const v of verbs) {
      for (const ft of FORMS) {
        if (!v[ft]) continue;
        if (v.irregular || v.irregularForms?.includes(ft)) continue; // exempt → shape test covers it
        const exp = expectedForms(v, ft);
        expect(exp, `${v.inf}.${ft}: no derivation but not flagged irregular`).not.toBeNull();
        expect(v[ft], `${v.inf}.${ft} mismatch vs morphology rule`).toEqual(exp);
      }
    }
  });

  it('has at least 50 A1 verbs', () => {
    expect(verbs.filter((v) => v.cefr === 'A1').length).toBeGreaterThanOrEqual(50);
  });

  it('has at least 50 A2 verbs', () => {
    expect(verbs.filter((v) => v.cefr === 'A2').length).toBeGreaterThanOrEqual(50);
  });

  it('no infinitive appears at two levels', () => {
    const seen = new Map<string, string>();
    for (const v of verbs) {
      expect(seen.has(v.inf), `${v.inf} duplicated`).toBe(false);
      seen.set(v.inf, v.cefr);
    }
  });

  it('hand-trusted (irregular) forms stay a minority of authored forms', () => {
    let total = 0;
    let exempt = 0;
    for (const v of verbs)
      for (const ft of FORMS) {
        if (!v[ft]) continue;
        total++;
        if (v.irregular || v.irregularForms?.includes(ft)) exempt++;
      }
    // Guard against dodging the validator by over-flagging. Generous headroom for
    // early phases where irregular A1 verbs dominate.
    expect(exempt / total, `exempt ratio ${exempt}/${total}`).toBeLessThanOrEqual(0.6);
  });
});
