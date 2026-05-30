import { describe, it, expect } from 'vitest';
import {
  runToZone,
  rideTotal,
  isUSridu,
  QUESTIONS_PER_RUN,
  RUNS_PER_RIDE,
  MAX_RIDE_POINTS,
} from '../lib/gamification/alkaRules';
import type { PerformanceTier } from '../lib/gamification/scoring';

const tiers = (...t: PerformanceTier[]) => t;

describe('runToZone', () => {
  it('all perfect → u sridu (3)', () => {
    expect(runToZone(tiers('perfect', 'perfect', 'perfect'))).toBe(3);
  });
  it('perfect + solid, no miss → upper field (2)', () => {
    expect(runToZone(tiers('perfect', 'solid', 'solid'))).toBe(2);
  });
  it('one miss → at most lower field (1)', () => {
    expect(runToZone(tiers('perfect', 'perfect', 'miss'))).toBe(1);
  });
  it('all miss → miss (0)', () => {
    expect(runToZone(tiers('miss', 'miss', 'miss'))).toBe(0);
  });
});

describe('rideTotal', () => {
  it('sums three runs and caps at 9', () => {
    expect(rideTotal([3, 3, 3])).toBe(9);
    expect(rideTotal([1, 2, 3])).toBe(6);
  });
  it('MAX_RIDE_POINTS is 9', () => {
    expect(MAX_RIDE_POINTS).toBe(9);
    expect(RUNS_PER_RIDE * 3).toBe(MAX_RIDE_POINTS);
  });
});

describe('isUSridu', () => {
  it('true only for zone 3', () => {
    expect(isUSridu(3)).toBe(true);
    expect(isUSridu(2)).toBe(false);
    expect(isUSridu(0)).toBe(false);
  });
});

describe('config', () => {
  it('a run has 3 questions', () => {
    expect(QUESTIONS_PER_RUN).toBe(3);
  });
});
