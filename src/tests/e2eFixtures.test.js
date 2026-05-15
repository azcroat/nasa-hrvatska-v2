// src/tests/e2eFixtures.test.js
// SP10: pure-input validation tests for the e2e fixture helpers.
// The helpers themselves use page.addInitScript and can't run in Vitest;
// these tests cover the input-validation + CANNED-response-shape contracts.
import { describe, it, expect } from 'vitest';
import { CEFR_XP_TABLE, forceCefr } from '../../e2e/fixtures/forceCefr.js';
import { mockRnd } from '../../e2e/fixtures/mockRnd.js';
import { CANNED } from '../../e2e/fixtures/mockAiPost.js';
import { getUserCefr } from '../lib/cefr';

describe('e2e fixture helpers — pure-input validation', () => {
  it('CEFR_XP_TABLE maps every band A1-C2 to a working xp value', () => {
    for (const [cefr, xp] of Object.entries(CEFR_XP_TABLE)) {
      expect(getUserCefr(xp, 0, 0), `xp ${xp} should produce ${cefr}`).toBe(cefr);
    }
  });

  it('forceCefr throws on unknown CEFR', async () => {
    const fakePage = { addInitScript: () => Promise.resolve() };
    await expect(forceCefr(fakePage, 'D9')).rejects.toThrow(/unknown CEFR/i);
  });

  it('mockRnd throws when value is out of [0, 1)', async () => {
    const fakePage = { addInitScript: () => Promise.resolve() };
    await expect(mockRnd(fakePage, -0.1)).rejects.toThrow(/must be in/);
    await expect(mockRnd(fakePage, 1.0)).rejects.toThrow(/must be in/);
    await expect(mockRnd(fakePage, 1.5)).rejects.toThrow(/must be in/);
  });

  it('CANNED.correct has the shape /api/correct returns', () => {
    expect(CANNED.correct).toHaveProperty('corrected_text');
    expect(CANNED.correct).toHaveProperty('score');
    expect(CANNED.correct).toHaveProperty('changes');
    expect(Array.isArray(CANNED.correct.changes)).toBe(true);
  });

  it('CANNED.pronunciationAssess has the shape /api/pronunciation-assess returns', () => {
    expect(CANNED.pronunciationAssess).toHaveProperty('overall');
    expect(CANNED.pronunciationAssess).toHaveProperty('word_scores');
    expect(Array.isArray(CANNED.pronunciationAssess.word_scores)).toBe(true);
    expect(CANNED.pronunciationAssess.word_scores[0]).toHaveProperty('phonemes');
  });
});
