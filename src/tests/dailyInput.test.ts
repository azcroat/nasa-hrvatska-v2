// src/tests/dailyInput.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { getDailyInput, markDailyInput, isDailyInputDone } from '../lib/dailyInput';
import { localDateStr } from '../lib/dateUtils';

describe('dailyInput', () => {
  beforeEach(() => localStorage.clear());

  it('returns both a listening and reading item plus the level', () => {
    const di = getDailyInput({ xp: 0, lc: 0, gc: 0 });
    expect(di.level).toBe('A1');
    expect(di.listening.title.length).toBeGreaterThan(0);
    expect(di.reading.title.length).toBeGreaterThan(0);
    expect(di.listening.doneToday).toBe(false);
    expect(di.reading.doneToday).toBe(false);
  });

  it('derives the level from the learner stats', () => {
    expect(getDailyInput({ xp: 10000, lc: 0, gc: 0 }).level).toBe('C1');
  });

  it('surfaces the first listening unit at A1 as the recommendation', () => {
    // A1 first curriculum unit is "Ordering at a Café" (listeningCurriculum).
    expect(getDailyInput({ xp: 0 }).listening.title).toBe('Ordering at a Café');
  });

  it('markDailyInput is day-scoped and reflected in getDailyInput', () => {
    expect(isDailyInputDone('listening')).toBe(false);
    markDailyInput('listening');
    expect(isDailyInputDone('listening')).toBe(true);
    expect(getDailyInput({ xp: 0 }).listening.doneToday).toBe(true);
    // reading remains untouched
    expect(getDailyInput({ xp: 0 }).reading.doneToday).toBe(false);
    // the flag key carries today's date
    expect(localStorage.getItem(`nh_daily_input_listening_${localDateStr()}`)).toBe('1');
  });

  it('a flag from another day does not count as done today', () => {
    localStorage.setItem('nh_daily_input_reading_1999-01-01', '1');
    expect(isDailyInputDone('reading')).toBe(false);
  });

  it('always returns actionable items even with missing stats', () => {
    const di = getDailyInput(undefined);
    expect(di.listening.title.length).toBeGreaterThan(0);
    expect(di.reading.title.length).toBeGreaterThan(0);
  });
});
