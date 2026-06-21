import { describe, it, expect } from 'vitest';
import { progressVoice } from './progressVoice';

describe('progressVoice — host-voiced aggregate progress', () => {
  it('reviews due are NOT surfaced here — the Reviews Due stat pill covers them', () => {
    // wordsdue must never produce a "phrases waiting for review" line (removed
    // 2026-06-21 as redundant clutter). High wordsdue falls through to the next
    // salient signal instead of nagging.
    const v = progressVoice({ streak: 10, wordsdue: 99, xpThisWeek: 999 }, 'ana');
    expect(v.host).toBe('baka'); // streak wins now, not Kovač
    expect(v.en).not.toContain('waiting for review');
    expect(v.hr).not.toContain('ponavljanje');
  });

  it('wordsdue alone (no streak/week) → warm fallback, never a review nag', () => {
    const v = progressVoice({ streak: 0, wordsdue: 50, xpThisWeek: 0 }, 'ivo');
    expect(v.host).toBe('ivo');
    expect(v.icon).toBe('👋');
    expect(v.en).not.toContain('review');
  });

  it('streak ≥ 3 (no reviews) → Baka with the streak count', () => {
    const v = progressVoice({ streak: 5, wordsdue: 0, xpThisWeek: 0 }, 'ana');
    expect(v.host).toBe('baka');
    expect(v.icon).toBe('🔥');
    expect(v.hr).toContain('5');
  });

  it('strong week (no reviews, low streak) → Marko', () => {
    const v = progressVoice({ streak: 1, wordsdue: 0, xpThisWeek: 200 }, 'ana');
    expect(v.host).toBe('marko');
    expect(v.icon).toBe('⭐');
  });

  it('nothing salient → fallback host-of-day with a warm nudge', () => {
    const v = progressVoice({ streak: 1, wordsdue: 0, xpThisWeek: 10 }, 'ivo');
    expect(v.host).toBe('ivo');
    expect(v.icon).toBe('👋');
  });

  it('ordering: streak now wins over reviews due (reviews no longer surfaced)', () => {
    expect(progressVoice({ streak: 30, wordsdue: 2, xpThisWeek: 500 }, 'ana').host).toBe('baka');
  });
});
