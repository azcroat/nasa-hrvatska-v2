// src/tests/recentErrors.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { appendRecentError, getRecentErrors } from '../lib/recentErrors';

const KEY = 'nh_recent_errors';

describe('appendRecentError', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('appends one entry to empty storage', () => {
    appendRecentError({
      topic: 'accusative',
      prompt: 'Vidim ____ knjigu',
      userAnswer: 'knjiga',
      correctAnswer: 'knjigu',
    });
    const raw = localStorage.getItem(KEY);
    expect(raw).not.toBeNull();
    const arr = JSON.parse(raw!);
    expect(arr).toHaveLength(1);
    expect(arr[0].topic).toBe('accusative');
    expect(typeof arr[0].at).toBe('number');
  });

  it('caps the array at 5 entries (drops oldest)', () => {
    for (let i = 0; i < 7; i++) {
      appendRecentError({
        topic: 'accusative',
        prompt: `q${i}`,
        userAnswer: `a${i}`,
        correctAnswer: `c${i}`,
      });
    }
    const arr = JSON.parse(localStorage.getItem(KEY)!);
    expect(arr).toHaveLength(5);
    expect(arr[0].prompt).toBe('q6');
    expect(arr[4].prompt).toBe('q2');
  });

  it('truncates prompt to 80 chars and answers to 60 chars', () => {
    appendRecentError({
      topic: 'aspect',
      prompt: 'x'.repeat(200),
      userAnswer: 'y'.repeat(200),
      correctAnswer: 'z'.repeat(200),
    });
    const arr = JSON.parse(localStorage.getItem(KEY)!);
    expect(arr[0].prompt).toHaveLength(80);
    expect(arr[0].userAnswer).toHaveLength(60);
    expect(arr[0].correctAnswer).toHaveLength(60);
  });

  it('prunes entries older than 24h on write', () => {
    const oldAt = Date.now() - 25 * 60 * 60 * 1000;
    localStorage.setItem(
      KEY,
      JSON.stringify([
        { topic: 'aspect', prompt: 'old', userAnswer: 'a', correctAnswer: 'b', at: oldAt },
      ]),
    );
    appendRecentError({
      topic: 'accusative',
      prompt: 'new',
      userAnswer: 'a',
      correctAnswer: 'b',
    });
    const arr = JSON.parse(localStorage.getItem(KEY)!);
    expect(arr).toHaveLength(1);
    expect(arr[0].prompt).toBe('new');
  });

  it('silently no-ops on QuotaExceededError', () => {
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = vi.fn(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() =>
      appendRecentError({
        topic: 'accusative',
        prompt: 'q',
        userAnswer: 'a',
        correctAnswer: 'c',
      }),
    ).not.toThrow();
    Storage.prototype.setItem = orig;
  });
});

describe('getRecentErrors', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns [] when localStorage is empty', () => {
    expect(getRecentErrors()).toEqual([]);
  });

  it('returns [] when JSON is malformed', () => {
    localStorage.setItem(KEY, 'not-json');
    expect(getRecentErrors()).toEqual([]);
  });

  it('projects to schema with minutesAgo computed from at', () => {
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    localStorage.setItem(
      KEY,
      JSON.stringify([
        { topic: 'accusative', prompt: 'q', userAnswer: 'a', correctAnswer: 'c', at: fiveMinAgo },
      ]),
    );
    const result = getRecentErrors();
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      topic: 'accusative',
      prompt: 'q',
      userAnswer: 'a',
      correctAnswer: 'c',
    });
    expect(result[0].minutesAgo).toBeGreaterThanOrEqual(4);
    expect(result[0].minutesAgo).toBeLessThanOrEqual(6);
  });
});
