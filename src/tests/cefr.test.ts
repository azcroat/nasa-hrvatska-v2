import { describe, it, expect } from 'vitest';
import { cefrRank, isUnlocked, getUserCefr, CEFR_ORDER } from '../lib/cefr';

describe('CEFR_ORDER', () => {
  it('contains 6 levels in correct order', () => {
    expect(CEFR_ORDER).toEqual(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);
  });
});

describe('cefrRank', () => {
  it('returns 0 for A1', () => expect(cefrRank('A1')).toBe(0));
  it('returns 1 for A2', () => expect(cefrRank('A2')).toBe(1));
  it('returns 2 for B1', () => expect(cefrRank('B1')).toBe(2));
  it('returns 3 for B2', () => expect(cefrRank('B2')).toBe(3));
  it('returns 4 for C1', () => expect(cefrRank('C1')).toBe(4));
  it('returns 5 for C2', () => expect(cefrRank('C2')).toBe(5));
  it('returns 0 for unknown level', () => expect(cefrRank('X9')).toBe(0));
  it('returns 0 for unknown level like A1+', () => expect(cefrRank('A1+')).toBe(0));
});

describe('isUnlocked', () => {
  it('unlocks A1 exercise for any user', () => {
    expect(isUnlocked('A1', 'A1')).toBe(true);
    expect(isUnlocked('A1', 'B2')).toBe(true);
    expect(isUnlocked('A1', 'C2')).toBe(true);
  });
  it('locks B1 exercise for A1 user', () => {
    expect(isUnlocked('B1', 'A1')).toBe(false);
    expect(isUnlocked('B1', 'A2')).toBe(false);
  });
  it('unlocks B1 exercise for B1 user', () => {
    expect(isUnlocked('B1', 'B1')).toBe(true);
  });
  it('unlocks B2 exercise for C1 user', () => {
    expect(isUnlocked('B2', 'C1')).toBe(true);
  });
  it('treats unknown exercise CEFR as unlocked (fail-open)', () => {
    expect(isUnlocked('A1+', 'A1')).toBe(true);
    expect(isUnlocked('X9', 'A1')).toBe(true);
  });
});

describe('getUserCefr', () => {
  it('returns A1 for new user', () => expect(getUserCefr(0, 0, 0)).toBe('A1'));
  it('returns A1 for 299 total', () => expect(getUserCefr(299, 0, 0)).toBe('A1'));
  it('returns A2 at 300 total', () => expect(getUserCefr(300, 0, 0)).toBe('A2'));
  it('returns A2 at 1199 total', () => expect(getUserCefr(1199, 0, 0)).toBe('A2'));
  it('returns B1 at 1200 total', () => expect(getUserCefr(1200, 0, 0)).toBe('B1'));
  it('returns B1 at 3499 total', () => expect(getUserCefr(3499, 0, 0)).toBe('B1'));
  it('returns B2 at 3500 total', () => expect(getUserCefr(3500, 0, 0)).toBe('B2'));
  it('returns B2 at 7999 total', () => expect(getUserCefr(7999, 0, 0)).toBe('B2'));
  it('returns C1 at 8000 total', () => expect(getUserCefr(8000, 0, 0)).toBe('C1'));
  it('returns C1 at 17999 total', () => expect(getUserCefr(17999, 0, 0)).toBe('C1'));
  it('returns C2 at 18000 total', () => expect(getUserCefr(18000, 0, 0)).toBe('C2'));
  it('returns C2 for very high total', () => expect(getUserCefr(50000, 0, 0)).toBe('C2'));

  it('weights lc and gc correctly', () => {
    // 10 lessons = 150 (xp) + 150 (lc*15) = 300 total → A2
    expect(getUserCefr(150, 10, 0)).toBe('A2');
    // 5 grammar = 125 (gc*25) → A1
    expect(getUserCefr(0, 0, 5)).toBe('A1');
    // 10 grammar = 250 (gc*25) → A1 (still < 300)
    expect(getUserCefr(0, 0, 10)).toBe('A1');
    // 12 grammar = 300 (gc*25) → A2
    expect(getUserCefr(0, 0, 12)).toBe('A2');
  });

  it('combines all three stats correctly', () => {
    // 100 xp + 5 lc (75) + 5 gc (125) = 300 → A2
    expect(getUserCefr(100, 5, 5)).toBe('A2');
  });
});
