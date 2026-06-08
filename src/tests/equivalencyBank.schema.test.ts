/**
 * equivalencyBank.schema.test.ts
 *
 * Deterministic validation gate for the CEFR equivalency item bank.
 * Guards against:
 *   - Malformed items (wrong option count, out-of-range correct index, unknown skill)
 *   - Missing skill variety — the scoring path (computePassed / SkillScores) requires
 *     at least one vocab AND one grammar item per set; if either is absent the
 *     per-skill pass/fail logic silently produces misleading results (P3.9 gap).
 *   - Accidental bank shrinkage — asserts a minimum pool size so we notice if
 *     a JSON import silently fails to load.
 *
 * Run: npx vitest run src/tests/equivalencyBank.schema.test.ts
 */

import { describe, it, expect } from 'vitest';
import {
  getNextTestFor,
  type EquivalencyItem,
  type EquivalencySkill,
} from '../data/cefrEquivalencyItems.js';
import type { CefrLevel } from '../lib/cefr.js';

const LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];

const VALID_SKILLS: EquivalencySkill[] = ['vocab', 'grammar', 'reading'];

describe('Equivalency item bank — schema + invariants', () => {
  for (const level of LEVELS) {
    describe(`Level ${level}`, () => {
      const set = getNextTestFor(level);

      it('returns a non-null set with items', () => {
        expect(set).not.toBeNull();
        expect(set!.items.length).toBeGreaterThan(0);
      });

      it('has a healthy item pool (≥ 100 items)', () => {
        expect(set!.items.length).toBeGreaterThanOrEqual(100);
      });

      it('every item has exactly 4 non-empty option strings', () => {
        for (const item of set!.items) {
          expect(Array.isArray(item.o)).toBe(true);
          expect(item.o).toHaveLength(4);
          for (const opt of item.o) {
            expect(typeof opt).toBe('string');
            expect(opt.trim().length).toBeGreaterThan(0);
          }
        }
      });

      it('every item has a correct-answer index in 0–3 (integer)', () => {
        for (const item of set!.items) {
          expect(Number.isInteger(item.c)).toBe(true);
          expect(item.c).toBeGreaterThanOrEqual(0);
          expect(item.c).toBeLessThanOrEqual(3);
        }
      });

      it('every item skill is one of vocab / grammar / reading', () => {
        for (const item of set!.items) {
          expect(VALID_SKILLS).toContain(item.skill);
        }
      });

      it('every reading item has a passage (non-empty string)', () => {
        const readingItems = set!.items.filter((i: EquivalencyItem) => i.skill === 'reading');
        for (const item of readingItems) {
          expect(typeof item.passage).toBe('string');
          expect((item.passage as string).trim().length).toBeGreaterThan(0);
        }
      });

      // ── INVARIANT: skill coverage ─────────────────────────────────────────────
      // computePassed() and SkillScores in cefrCertification.ts partition items by
      // skill and compute per-skill pass rates. If a skill is absent the denominator
      // is 0 and the result is NaN / vacuously true. These assertions guarantee that
      // will never happen for the two scoring-critical skills.

      it('contains at least 1 vocab item (scoring invariant)', () => {
        const count = set!.items.filter((i: EquivalencyItem) => i.skill === 'vocab').length;
        expect(count).toBeGreaterThanOrEqual(1);
      });

      it('contains at least 1 grammar item (scoring invariant)', () => {
        const count = set!.items.filter((i: EquivalencyItem) => i.skill === 'grammar').length;
        expect(count).toBeGreaterThanOrEqual(1);
      });

      it('contains at least 1 reading item', () => {
        const count = set!.items.filter((i: EquivalencyItem) => i.skill === 'reading').length;
        expect(count).toBeGreaterThanOrEqual(1);
      });
    });
  }
});
