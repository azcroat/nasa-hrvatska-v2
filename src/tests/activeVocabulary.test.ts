// src/tests/activeVocabulary.test.ts
// Unit tests for the vocabulary-in-context engine (Content-Rec #3).
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../lib/srs', () => ({ getSR: vi.fn(() => ({})) }));

import { getSR } from '../lib/srs';
import { getActiveVocabulary, getActiveVocabularyTargets } from '../lib/activeVocabulary';
import { FREQUENCY_500 } from '../lib/frequency500';

const mockSR = (map: Record<string, unknown>) =>
  (getSR as unknown as { mockReturnValue: (v: unknown) => void }).mockReturnValue(map);

const CONTENT_POS = new Set(['noun', 'verb', 'adj', 'adv', 'num']);
const contentWords = new Set(FREQUENCY_500.filter((e) => CONTENT_POS.has(e.pos)).map((e) => e.hr));
const rankOf = (hr: string) => FREQUENCY_500.find((e) => e.hr === hr)?.rank ?? Infinity;
const now = Date.now();

beforeEach(() => {
  mockSR({});
});

describe('getActiveVocabulary — empty SR (new learner)', () => {
  it('falls back to the high-frequency CONTENT core, frequency-ordered', () => {
    const v = getActiveVocabulary({ limit: 5 });
    expect(v.weak).toEqual([]);
    expect(v.due).toEqual([]);
    expect(v.learning).toEqual([]);
    expect(v.targets).toHaveLength(5);
    // every target is a content-POS frequency word…
    for (const t of v.targets) expect(contentWords.has(t)).toBe(true);
    // …and they are in ascending corpus-frequency rank (most common first).
    const ranks = v.targets.map(rankOf);
    for (let i = 1; i < ranks.length; i++) {
      expect(ranks[i]).toBeGreaterThan(ranks[i - 1] as number);
    }
  });
});

describe('getActiveVocabulary — prioritisation', () => {
  it('ranks weak (lapsed) words first', () => {
    mockSR({
      kuća: { s: 2, d: 5, l: 3, w: 4, r: 1, due: now + 100000 }, // lapsed → weak
      more: { s: 30, d: 2, l: 0, w: 0, r: 5, due: now + 100000 }, // mastered, not weak/due
    });
    const v = getActiveVocabulary();
    expect(v.weak).toContain('kuća');
    expect(v.targets[0]).toBe('kuća');
    expect(v.targets).not.toContain('more');
  });

  it('treats wrong>right (with ≥2 reviews) as weak', () => {
    mockSR({ riba: { s: 1, d: 6, l: 0, w: 3, r: 1, due: now + 100000 } });
    expect(getActiveVocabulary().weak).toContain('riba');
  });

  it('includes due words, most-overdue first', () => {
    mockSR({
      a: { s: 1, d: 5, l: 0, w: 0, r: 1, due: now - 100000 },
      b: { s: 1, d: 5, l: 0, w: 0, r: 1, due: now - 500000 },
    });
    expect(getActiveVocabulary().due).toEqual(['b', 'a']);
  });

  it('classifies reviewed-but-not-due-or-mastered words as learning', () => {
    mockSR({ čekati: { s: 5, d: 3, l: 0, w: 1, r: 3, due: now + 999999 } });
    const v = getActiveVocabulary();
    expect(v.learning).toContain('čekati');
    expect(v.weak).not.toContain('čekati');
    expect(v.due).not.toContain('čekati');
  });

  it('weak ranks above due/learning/fresh in targets', () => {
    mockSR({
      weakw: { s: 1, d: 7, l: 2, w: 3, r: 0, due: now + 999999 },
      duew: { s: 1, d: 5, l: 0, w: 0, r: 1, due: now - 1000 },
    });
    const v = getActiveVocabulary();
    expect(v.targets.indexOf('weakw')).toBeLessThan(v.targets.indexOf('duew'));
  });
});

describe('getActiveVocabulary — dedup & limit', () => {
  it('a word that is both weak and due appears once (weak wins)', () => {
    mockSR({ x: { s: 1, d: 6, l: 2, w: 3, r: 1, due: now - 1000 } });
    const v = getActiveVocabulary();
    expect(v.weak).toContain('x');
    expect(v.due).toContain('x');
    expect(v.targets.filter((t) => t === 'x')).toHaveLength(1);
    expect(v.targets[0]).toBe('x');
  });

  it('respects the limit', () => {
    expect(getActiveVocabulary({ limit: 3 }).targets).toHaveLength(3);
    expect(getActiveVocabulary({ limit: 1 }).targets).toHaveLength(1);
  });

  it('getActiveVocabularyTargets returns just the capped target list', () => {
    const t = getActiveVocabularyTargets(4);
    expect(Array.isArray(t)).toBe(true);
    expect(t).toHaveLength(4);
  });
});

describe('getActiveVocabulary — robustness', () => {
  it('never throws and returns frequency core if getSR throws', () => {
    (getSR as unknown as { mockImplementation: (f: () => unknown) => void }).mockImplementation(
      () => {
        throw new Error('SR unavailable');
      },
    );
    const v = getActiveVocabulary({ limit: 4 });
    expect(v.targets).toHaveLength(4);
    for (const t of v.targets) expect(contentWords.has(t)).toBe(true);
  });

  it('ignores malformed card entries', () => {
    mockSR({ good: { s: 1, d: 5, l: 2, w: 2, r: 0, due: now - 10 }, bad: null, worse: 42 });
    const v = getActiveVocabulary();
    expect(v.weak).toContain('good');
    expect(v.targets).toContain('good');
  });
});
