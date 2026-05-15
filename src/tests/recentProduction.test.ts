// src/tests/recentProduction.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getRecentProduction, recordProductionExercise } from '../hooks/useDailySession';

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoStr(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

describe('getRecentProduction', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns [] when localStorage is empty', () => {
    expect(getRecentProduction()).toEqual([]);
  });

  it('returns [] when JSON is malformed', () => {
    localStorage.setItem('nh_recent_production', 'not-json');
    expect(getRecentProduction()).toEqual([]);
  });

  it('returns [] when stored value is not an array', () => {
    localStorage.setItem('nh_recent_production', '{"foo":"bar"}');
    expect(getRecentProduction()).toEqual([]);
  });

  it('returns only screens from entries with date within last 3 days', () => {
    const entries = [
      { screen: 'shadowing', date: todayStr() },
      { screen: 'writing', date: daysAgoStr(2) },
      { screen: 'dictation', date: daysAgoStr(5) }, // outside window
    ];
    localStorage.setItem('nh_recent_production', JSON.stringify(entries));
    const result = getRecentProduction();
    expect(result).toContain('shadowing');
    expect(result).toContain('writing');
    expect(result).not.toContain('dictation');
  });

  it('handles entries missing date field gracefully', () => {
    const entries = [
      { screen: 'shadowing' }, // missing date
      { screen: 'writing', date: todayStr() },
    ];
    localStorage.setItem('nh_recent_production', JSON.stringify(entries));
    const result = getRecentProduction();
    expect(result).toEqual(['writing']);
  });
});

describe('recordProductionExercise', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('appends one entry to empty storage', () => {
    recordProductionExercise('shadowing');
    const raw = localStorage.getItem('nh_recent_production');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].screen).toBe('shadowing');
    expect(parsed[0].date).toBe(new Date().toISOString().slice(0, 10));
  });

  it('does not duplicate same-day re-records', () => {
    recordProductionExercise('shadowing');
    recordProductionExercise('shadowing');
    const parsed = JSON.parse(localStorage.getItem('nh_recent_production')!);
    expect(parsed).toHaveLength(1);
  });

  it('appends second entry for a different screen', () => {
    recordProductionExercise('shadowing');
    recordProductionExercise('writing');
    const parsed = JSON.parse(localStorage.getItem('nh_recent_production')!);
    expect(parsed).toHaveLength(2);
  });

  it('prunes entries older than 3 days on write', () => {
    const old = [{ screen: 'dictation', date: '2020-01-01' }];
    localStorage.setItem('nh_recent_production', JSON.stringify(old));
    recordProductionExercise('shadowing');
    const parsed = JSON.parse(localStorage.getItem('nh_recent_production')!);
    expect(parsed.map((e: { screen: string }) => e.screen)).toEqual(['shadowing']);
  });

  it('no-op on empty string screen', () => {
    recordProductionExercise('');
    expect(localStorage.getItem('nh_recent_production')).toBeNull();
  });

  it('does not throw on QuotaExceededError', () => {
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = vi.fn(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => recordProductionExercise('shadowing')).not.toThrow();
    Storage.prototype.setItem = orig;
  });
});
