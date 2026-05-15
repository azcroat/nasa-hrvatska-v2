// src/tests/recentReads.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { recordStoryRead, getRecentReads, getRecentReadsExtended } from '../lib/recentReads';

const KEY = 'nh_recent_reads';

describe('recordStoryRead', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('appends one entry to empty storage', () => {
    recordStoryRead('gs_a1_1');
    const raw = localStorage.getItem(KEY);
    expect(raw).not.toBeNull();
    const arr = JSON.parse(raw!);
    expect(arr).toHaveLength(1);
    expect(arr[0].id).toBe('gs_a1_1');
    expect(typeof arr[0].at).toBe('number');
  });

  it('does not duplicate same-day re-records', () => {
    recordStoryRead('gs_a1_1');
    recordStoryRead('gs_a1_1');
    const arr = JSON.parse(localStorage.getItem(KEY)!);
    expect(arr).toHaveLength(1);
  });

  it('silently no-ops on QuotaExceededError', () => {
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = vi.fn(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => recordStoryRead('gs_a1_1')).not.toThrow();
    Storage.prototype.setItem = orig;
  });
});

describe('getRecentReads', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns [] when localStorage is empty or JSON is malformed', () => {
    expect(getRecentReads()).toEqual([]);
    localStorage.setItem(KEY, 'not-json');
    expect(getRecentReads()).toEqual([]);
  });

  it('returns only entries within the 7-day hard exclusion window', () => {
    const sixDays = Date.now() - 6 * 24 * 60 * 60 * 1000;
    const eightDays = Date.now() - 8 * 24 * 60 * 60 * 1000;
    localStorage.setItem(
      KEY,
      JSON.stringify([
        { id: 'recent', at: sixDays },
        { id: 'old', at: eightDays },
      ]),
    );
    const result = getRecentReads();
    expect(result).toContain('recent');
    expect(result).not.toContain('old');
  });
});

describe('getRecentReadsExtended', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns entries within the 30-day window', () => {
    const tenDays = Date.now() - 10 * 24 * 60 * 60 * 1000;
    const twentyDays = Date.now() - 20 * 24 * 60 * 60 * 1000;
    const fortyDays = Date.now() - 40 * 24 * 60 * 60 * 1000;
    localStorage.setItem(
      KEY,
      JSON.stringify([
        { id: 'a', at: tenDays },
        { id: 'b', at: twentyDays },
        { id: 'c', at: fortyDays },
      ]),
    );
    const result = getRecentReadsExtended();
    expect(result).toContain('a');
    expect(result).toContain('b');
    expect(result).not.toContain('c');
  });
});
