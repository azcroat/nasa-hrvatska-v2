import { describe, it, expect } from 'vitest';
import { CULTURAL_FACTS, getDailyFact } from '../lib/culturalFacts';

describe('culturalFacts', () => {
  it('CULTURAL_FACTS has at least 10 entries', () => {
    expect(CULTURAL_FACTS.length).toBeGreaterThanOrEqual(10);
  });

  it('every fact has emoji and fact string', () => {
    for (const item of CULTURAL_FACTS) {
      expect(typeof item.emoji).toBe('string');
      expect(item.emoji.length).toBeGreaterThan(0);
      expect(typeof item.fact).toBe('string');
      expect(item.fact.length).toBeGreaterThan(0);
    }
  });

  it('getDailyFact returns an object with emoji and fact', () => {
    const result = getDailyFact();
    expect(typeof result.emoji).toBe('string');
    expect(typeof result.fact).toBe('string');
    expect(result.fact.length).toBeGreaterThan(0);
  });

  it('getDailyFact returns a value that is in CULTURAL_FACTS', () => {
    const result = getDailyFact();
    const found = CULTURAL_FACTS.find(f => f.fact === result.fact);
    expect(found).toBeDefined();
  });

  it('getDailyFact is deterministic within the same day (same call, same result)', () => {
    const r1 = getDailyFact();
    const r2 = getDailyFact();
    expect(r1.fact).toBe(r2.fact);
  });
});
