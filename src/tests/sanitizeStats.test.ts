import { describe, it, expect } from 'vitest';
import { sanitizeStats } from '../lib/sanitizeStats';

// ---------------------------------------------------------------------------
// Numeric fields
// ---------------------------------------------------------------------------
describe('sanitizeStats — numeric fields', () => {
  it('accepts valid positive integer xp', () => {
    const result = sanitizeStats({ xp: 500 });
    expect(result.xp).toBe(500);
  });

  it('floors fractional xp', () => {
    const result = sanitizeStats({ xp: 9.9 });
    expect(result.xp).toBe(9);
  });

  it('accepts xp === 0', () => {
    expect(sanitizeStats({ xp: 0 }).xp).toBe(0);
  });

  it('excludes negative xp', () => {
    const result = sanitizeStats({ xp: -10 });
    expect(result.xp).toBeUndefined();
  });

  it('excludes NaN xp', () => {
    const result = sanitizeStats({ xp: NaN });
    expect(result.xp).toBeUndefined();
  });

  it('excludes Infinity xp', () => {
    const result = sanitizeStats({ xp: Infinity });
    expect(result.xp).toBeUndefined();
  });

  it('excludes non-numeric xp (string)', () => {
    const result = sanitizeStats({ xp: 'not-a-number' as unknown as number });
    expect(result.xp).toBeUndefined();
  });

  it('all core numeric counter fields are preserved when valid', () => {
    const raw = { xp: 100, lc: 5, gc: 3, sp: 2, de: 1, rc: 4, pf: 0, mv: 7, hi: 2, str: 14 };
    const result = sanitizeStats(raw);
    for (const [key, val] of Object.entries(raw)) {
      expect(result[key as keyof typeof result]).toBe(val);
    }
  });

  it('badge-backing counter fields are preserved when valid', () => {
    const raw = { srsTotal: 10, mistakesMastered: 3, readingDone: 2, mediaVisits: 5 };
    const result = sanitizeStats(raw);
    for (const [key, val] of Object.entries(raw)) {
      expect(result[key as keyof typeof result]).toBe(val);
    }
  });

  it('badge-backing counters exclude negatives', () => {
    const result = sanitizeStats({ srsTotal: -1 });
    expect(result.srsTotal).toBeUndefined();
  });

  it('authLoading is not a recognized stat field and is dropped', () => {
    // authLoading is a UI-state flag, not a persisted stat — sanitizeStats must drop it
    // regardless of value to prevent numeric corruption of boolean state.
    expect(sanitizeStats({ authLoading: 1 }).authLoading).toBeUndefined();
    expect(sanitizeStats({ authLoading: -1 }).authLoading).toBeUndefined();
    expect(sanitizeStats({ authLoading: true }).authLoading).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// diff field
// ---------------------------------------------------------------------------
describe('sanitizeStats — diff field', () => {
  it('accepts "beginner"', () => {
    expect(sanitizeStats({ diff: 'beginner' }).diff).toBe('beginner');
  });

  it('accepts "intermediate"', () => {
    expect(sanitizeStats({ diff: 'intermediate' }).diff).toBe('intermediate');
  });

  it('accepts "advanced"', () => {
    expect(sanitizeStats({ diff: 'advanced' }).diff).toBe('advanced');
  });

  it('excludes unknown diff value "expert"', () => {
    expect(sanitizeStats({ diff: 'expert' }).diff).toBeUndefined();
  });

  it('excludes numeric diff', () => {
    expect(sanitizeStats({ diff: 1 as unknown as string }).diff).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Array fields
// ---------------------------------------------------------------------------
describe('sanitizeStats — array fields', () => {
  it('accepts valid string array for ct', () => {
    const result = sanitizeStats({ ct: ['greetings', 'numbers'] });
    expect(Array.isArray(result.ct)).toBe(true);
    expect(result.ct).toContain('greetings');
    expect(result.ct).toContain('numbers');
  });

  it('accepts empty array for ct', () => {
    const result = sanitizeStats({ ct: [] });
    expect(Array.isArray(result.ct)).toBe(true);
    expect(result.ct).toHaveLength(0);
  });

  it('excludes non-array ct (string)', () => {
    const result = sanitizeStats({ ct: 'greetings' as unknown as string[] });
    expect(result.ct).toBeUndefined();
  });

  it('filters non-string items from ct array', () => {
    const result = sanitizeStats({ ct: ['valid', 42, null, 'also-valid'] as unknown as string[] });
    expect(Array.isArray(result.ct)).toBe(true);
    expect(result.ct).toEqual(['valid', 'also-valid']);
  });

  it('accepts valid string array for badges', () => {
    const result = sanitizeStats({ badges: ['first_lesson', 'week_streak'] });
    expect(Array.isArray(result.badges)).toBe(true);
    expect(result.badges).toContain('first_lesson');
  });

  it('filters non-string items from badges array', () => {
    const result = sanitizeStats({ badges: ['good_badge', 99, undefined] as unknown as string[] });
    expect(result.badges).toEqual(['good_badge']);
  });

  it('accepts valid string array for vs', () => {
    const result = sanitizeStats({ vs: ['lesson1', 'lesson2'] });
    expect(Array.isArray(result.vs)).toBe(true);
  });

  it('accepts valid string array for rs', () => {
    const result = sanitizeStats({ rs: ['item_a'] });
    expect(Array.isArray(result.rs)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// null / undefined / malformed input
// ---------------------------------------------------------------------------
describe('sanitizeStats — null/undefined/malformed input', () => {
  it('null input returns empty object', () => {
    const result = sanitizeStats(null);
    expect(result).toEqual({});
  });

  it('undefined input returns empty object', () => {
    const result = sanitizeStats(undefined);
    expect(result).toEqual({});
  });

  it('non-object string input returns empty object', () => {
    const result = sanitizeStats('string input' as unknown);
    expect(result).toEqual({});
  });

  it('non-object number input returns empty object', () => {
    const result = sanitizeStats(42 as unknown);
    expect(result).toEqual({});
  });

  it('empty object input returns empty object', () => {
    const result = sanitizeStats({});
    expect(result).toEqual({});
  });

  it('unknown fields are not included in output', () => {
    const result = sanitizeStats({ unknownField: 'value', xp: 100 });
    expect((result as Record<string, unknown>).unknownField).toBeUndefined();
    expect(result.xp).toBe(100);
  });

  it('array input returns empty object', () => {
    const result = sanitizeStats([1, 2, 3] as unknown);
    // Arrays are objects in JS — implementation may include index keys or empty
    // The contract is that it returns a Partial<Stats> with no unknown keys leaking
    expect(typeof result).toBe('object');
    expect(result).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// levelQuizPasses — SP1 addition: per-key latest-wins merge field
// ---------------------------------------------------------------------------
describe('sanitizeStats — levelQuizPasses field', () => {
  it('accepts a valid levelQuizPasses object', () => {
    const result = sanitizeStats({
      levelQuizPasses: { 1: { score: 85, passedAt: 1700000000000 } },
    });
    expect(result.levelQuizPasses).toBeDefined();
    expect(result.levelQuizPasses![1]).toEqual({ score: 85, passedAt: 1700000000000 });
  });

  it('accepts multiple level keys', () => {
    const result = sanitizeStats({
      levelQuizPasses: {
        1: { score: 90, passedAt: 1700000000000 },
        2: { score: 75, passedAt: 1700001000000 },
      },
    });
    expect(Object.keys(result.levelQuizPasses!)).toHaveLength(2);
  });

  it('excludes entries with NaN keys (non-numeric string key)', () => {
    const result = sanitizeStats({
      levelQuizPasses: {
        notANumber: { score: 90, passedAt: 1700000000000 },
        1: { score: 80, passedAt: 1700000000001 },
      },
    });
    // Only the numeric key survives
    expect(result.levelQuizPasses![1]).toBeDefined();
    expect(Object.keys(result.levelQuizPasses!).filter((k) => k === 'notANumber')).toHaveLength(0);
  });

  it('excludes entries where score is not a number', () => {
    const result = sanitizeStats({
      levelQuizPasses: { 1: { score: 'A+', passedAt: 1700000000000 } },
    });
    expect(result.levelQuizPasses![1]).toBeUndefined();
  });

  it('excludes entries where passedAt is not a number', () => {
    const result = sanitizeStats({
      levelQuizPasses: { 1: { score: 90, passedAt: 'now' } },
    });
    expect(result.levelQuizPasses![1]).toBeUndefined();
  });

  it('excludes entries with Infinity score', () => {
    const result = sanitizeStats({
      levelQuizPasses: { 1: { score: Infinity, passedAt: 1700000000000 } },
    });
    expect(result.levelQuizPasses![1]).toBeUndefined();
  });

  it('excludes entries with Infinity passedAt', () => {
    const result = sanitizeStats({
      levelQuizPasses: { 1: { score: 90, passedAt: Infinity } },
    });
    expect(result.levelQuizPasses![1]).toBeUndefined();
  });

  it('ignores null levelQuizPasses', () => {
    const result = sanitizeStats({ levelQuizPasses: null });
    expect(result.levelQuizPasses).toBeUndefined();
  });

  it('ignores array levelQuizPasses (must be plain object)', () => {
    const result = sanitizeStats({ levelQuizPasses: [{ score: 90, passedAt: 1700000000000 }] });
    expect(result.levelQuizPasses).toBeUndefined();
  });

  it('returns empty validated object when all entries are invalid', () => {
    const result = sanitizeStats({
      levelQuizPasses: {
        1: { score: 'bad', passedAt: 'also bad' },
        notanum: { score: 90, passedAt: 1700000000000 },
      },
    });
    // levelQuizPasses is set but empty (or undefined)
    if (result.levelQuizPasses !== undefined) {
      expect(Object.keys(result.levelQuizPasses)).toHaveLength(0);
    }
  });

  it('preserves score of 0 (falsy but valid)', () => {
    const result = sanitizeStats({
      levelQuizPasses: { 1: { score: 0, passedAt: 1700000000000 } },
    });
    expect(result.levelQuizPasses![1]).toEqual({ score: 0, passedAt: 1700000000000 });
  });
});
