import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getProverbOfDay, getCityOfDay, getHistFact } from '../dailyPickers';

const proverbs = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'];
const facts = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8'];
const cities = ['Zagreb', 'Split', 'Rijeka', 'Osijek', 'Pula', 'Zadar', 'Dubrovnik', 'Šibenik'];

describe('getProverbOfDay', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('returns a deterministic value for a given date', () => {
    vi.setSystemTime(new Date(2026, 0, 15));
    const a = getProverbOfDay(proverbs);
    const b = getProverbOfDay(proverbs);
    expect(a).toBe(b);
    expect(proverbs).toContain(a);
  });

  it('different dates yield different picks across a 30-day sample', () => {
    const picks = new Set<string>();
    for (let i = 1; i <= 30; i++) {
      vi.setSystemTime(new Date(2026, 0, i));
      picks.add(getProverbOfDay(proverbs)!);
    }
    expect(picks.size).toBeGreaterThan(2);
  });

  it('empty array returns undefined', () => {
    expect(getProverbOfDay([])).toBeUndefined();
  });
});

describe('getCityOfDay', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('returns a deterministic value for a given date', () => {
    vi.setSystemTime(new Date(2026, 0, 15));
    expect(getCityOfDay(cities)).toBe(getCityOfDay(cities));
  });

  it('empty array returns undefined', () => {
    expect(getCityOfDay([])).toBeUndefined();
  });
});

describe('getHistFact', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('returns a deterministic value for a given date', () => {
    vi.setSystemTime(new Date(2026, 0, 15));
    expect(getHistFact(facts)).toBe(getHistFact(facts));
  });

  it('uses a different salt from getProverbOfDay (yields different picks for same array over a window)', () => {
    const same: string[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    let mismatches = 0;
    for (let i = 1; i <= 30; i++) {
      vi.setSystemTime(new Date(2026, 0, i));
      if (getProverbOfDay(same) !== getHistFact(same)) mismatches++;
    }
    expect(mismatches).toBeGreaterThan(15);
  });

  it('empty array returns undefined', () => {
    expect(getHistFact([])).toBeUndefined();
  });
});
