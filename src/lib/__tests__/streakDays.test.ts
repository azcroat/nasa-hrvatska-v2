import { describe, it, expect } from 'vitest';
import { addDay, mergeDaySets, computeStreak, type DaySet } from '../streakDays';

// Helpers to build local-date strings relative to a fixed anchor day.
function shift(day: string, delta: number): string {
  const d = new Date(day + 'T00:00:00');
  d.setDate(d.getDate() + delta);
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

const TODAY = '2026-04-20';
const set = (...days: string[]): DaySet => Object.fromEntries(days.map((d) => [d, true]));

describe('addDay', () => {
  it('adds a day idempotently (union semantics)', () => {
    const a = addDay({}, TODAY);
    expect(a).toEqual({ [TODAY]: true });
    expect(addDay(a, TODAY)).toEqual(a); // idempotent
  });
});

describe('mergeDaySets', () => {
  it('is the union of both sets (commutative)', () => {
    const a = set(TODAY);
    const b = set(shift(TODAY, -2), shift(TODAY, -3));
    expect(mergeDaySets(a, b)).toEqual(mergeDaySets(b, a));
    expect(Object.keys(mergeDaySets(a, b)).sort()).toEqual(
      [TODAY, shift(TODAY, -2), shift(TODAY, -3)].sort(),
    );
  });
});

describe('computeStreak', () => {
  it('empty set → {0, ""}', () => {
    expect(computeStreak({}, TODAY)).toEqual({ count: 0, last: '' });
  });

  it('only today → {1, today}', () => {
    expect(computeStreak(set(TODAY), TODAY)).toEqual({ count: 1, last: TODAY });
  });

  it('three consecutive days ending today → {3, today}', () => {
    const s = set(TODAY, shift(TODAY, -1), shift(TODAY, -2));
    expect(computeStreak(s, TODAY)).toEqual({ count: 3, last: TODAY });
  });

  it('active yesterday but not yet today → streak alive {n, yesterday}', () => {
    const s = set(shift(TODAY, -1), shift(TODAY, -2));
    expect(computeStreak(s, TODAY)).toEqual({ count: 2, last: shift(TODAY, -1) });
  });

  it('last active 3 days ago → broken {0, that date}', () => {
    const s = set(shift(TODAY, -3), shift(TODAY, -4));
    expect(computeStreak(s, TODAY)).toEqual({ count: 0, last: shift(TODAY, -3) });
  });

  it('gap before today → only the unbroken tail counts', () => {
    // today present, yesterday MISSING, day-2 present → run ending today is just {today}
    const s = set(TODAY, shift(TODAY, -2), shift(TODAY, -3));
    expect(computeStreak(s, TODAY)).toEqual({ count: 1, last: TODAY });
  });

  it('cross-device union: active-today ∪ dead-30-streak → current streak, never inflated', () => {
    // Device A: practiced today. Device B: a 30-run that ended 3 days ago (dead).
    const deviceA = set(TODAY);
    const deviceB: DaySet = {};
    for (let i = 3; i < 33; i++) deviceB[shift(TODAY, -i)] = true; // 30 days ending 3 days ago
    const merged = mergeDaySets(deviceA, deviceB);
    expect(computeStreak(merged, TODAY)).toEqual({ count: 1, last: TODAY });
  });
});
