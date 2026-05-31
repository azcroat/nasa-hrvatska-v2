import { describe, it, expect } from 'vitest';
import {
  scoreAnswer,
  BASE_POINTS,
  MAX_SPEED_BONUS,
  FAST_MS,
  SLOW_MS,
} from '../lib/gamification/scoring';

describe('scoreAnswer', () => {
  it('wrong answer: zero points, combo reset, tier miss', () => {
    const r = scoreAnswer({ correct: false, responseMs: 800, combo: 5 });
    expect(r.points).toBe(0);
    expect(r.combo).toBe(0);
    expect(r.tier).toBe('miss');
  });

  it('fast correct answer: full speed bonus and perfect tier at combo 0', () => {
    const r = scoreAnswer({ correct: true, responseMs: FAST_MS, combo: 0 });
    expect(r.speedBonus).toBe(MAX_SPEED_BONUS);
    expect(r.points).toBe(BASE_POINTS + MAX_SPEED_BONUS);
    expect(r.combo).toBe(1);
    expect(r.tier).toBe('perfect');
  });

  it('slow correct answer: no speed bonus, weak tier', () => {
    const r = scoreAnswer({ correct: true, responseMs: SLOW_MS, combo: 0 });
    expect(r.speedBonus).toBe(0);
    expect(r.points).toBe(BASE_POINTS);
    expect(r.tier).toBe('weak');
  });

  it('combo multiplies points: combo 5 adds +50% before rounding', () => {
    const r = scoreAnswer({ correct: true, responseMs: SLOW_MS, combo: 5 });
    expect(r.points).toBe(150);
    expect(r.combo).toBe(6);
  });

  it('combo multiplier is capped at x2.0 (combo >= 10)', () => {
    const r = scoreAnswer({ correct: true, responseMs: SLOW_MS, combo: 20 });
    expect(r.points).toBe(200);
  });

  it('mid-speed correct answer interpolates speed bonus and is solid tier', () => {
    const mid = (FAST_MS + SLOW_MS) / 2;
    const r = scoreAnswer({ correct: true, responseMs: mid, combo: 0 });
    expect(r.speedBonus).toBe(Math.round(MAX_SPEED_BONUS / 2));
    expect(r.tier).toBe('solid');
  });
});
