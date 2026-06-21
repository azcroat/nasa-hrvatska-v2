import { describe, it, expect } from 'vitest';
import { progressVoice } from './progressVoice';

describe('progressVoice — host-voiced aggregate progress', () => {
  it('reviews due → Kovač (highest priority, beats streak)', () => {
    const v = progressVoice({ streak: 10, wordsdue: 3, xpThisWeek: 999 }, 'ana');
    expect(v.host).toBe('kovac');
    expect(v.icon).toBe('📚');
    expect(v.hr).toContain('3');
    expect(v.en).toBe('3 phrases waiting for review.');
  });

  it('pluralizes Croatian count agreement (1 / 2–4 / 5+)', () => {
    expect(progressVoice({ streak: 0, wordsdue: 1, xpThisWeek: 0 }, 'ana').hr).toBe(
      '1 fraza čeka ponavljanje.',
    );
    expect(progressVoice({ streak: 0, wordsdue: 3, xpThisWeek: 0 }, 'ana').hr).toBe(
      '3 fraze čekaju ponavljanje.',
    );
    expect(progressVoice({ streak: 0, wordsdue: 5, xpThisWeek: 0 }, 'ana').hr).toBe(
      '5 fraza čeka ponavljanje.',
    );
    // English: 1 phrase vs N phrases
    expect(progressVoice({ streak: 0, wordsdue: 1, xpThisWeek: 0 }, 'ana').en).toBe(
      '1 phrase waiting for review.',
    );
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

  it('ordering: streak does not override reviews due', () => {
    expect(progressVoice({ streak: 30, wordsdue: 2, xpThisWeek: 500 }, 'ana').host).toBe('kovac');
  });
});
