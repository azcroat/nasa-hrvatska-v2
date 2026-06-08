// src/lib/__tests__/activeDayTracker.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import {
  applyActiveDay,
  getActiveDayCount,
  recordActiveDayNow,
  localDayString,
} from '../activeDayTracker.js';

describe('activeDayTracker (pure core)', () => {
  it('increments count only on a new day', () => {
    let st = { lastDay: '', count: 0 };
    st = applyActiveDay(st, '2026-06-07');
    expect(st).toEqual({ lastDay: '2026-06-07', count: 1 });
    st = applyActiveDay(st, '2026-06-07'); // same day → no change
    expect(st).toEqual({ lastDay: '2026-06-07', count: 1 });
    st = applyActiveDay(st, '2026-06-08'); // new day → +1
    expect(st).toEqual({ lastDay: '2026-06-08', count: 2 });
  });

  it('localDayString formats a Date as YYYY-MM-DD (local)', () => {
    expect(localDayString(new Date(2026, 5, 7))).toBe('2026-06-07');
  });
});

describe('activeDayTracker (localStorage wrapper)', () => {
  beforeEach(() => localStorage.clear());
  it('persists and reads the count across calls', () => {
    recordActiveDayNow('2026-06-07');
    recordActiveDayNow('2026-06-08');
    recordActiveDayNow('2026-06-08');
    expect(getActiveDayCount()).toBe(2);
  });
});
