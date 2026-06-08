// src/lib/__tests__/cefrCertification.demote.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { demoteOneLevel, getCertifiedLevel, getCertificationState } from '../cefrCertification.js';

const KEY = 'nh_cefr_certifications';
function seed(passes: Record<string, number>) {
  const p: Record<string, unknown> = {};
  for (const [lvl, overall] of Object.entries(passes)) {
    p[lvl] = { passedAt: 1, scores: { vocab: 0.9, grammar: 0.9 }, overall };
  }
  localStorage.setItem(KEY, JSON.stringify({ passes: p, attempts: [], lastFailedAt: {}, v: 1 }));
}

describe('demoteOneLevel', () => {
  beforeEach(() => localStorage.clear());

  it('drops the certified level by one rank and records the demotion', () => {
    seed({ A2: 90, B1: 85 }); // certified = B1
    expect(getCertifiedLevel()).toBe('B1');
    const res = demoteOneLevel('checkpoint_fail');
    expect(res).toEqual({ from: 'B1', to: 'A2' });
    expect(getCertifiedLevel()).toBe('A2');
    const s = getCertificationState();
    expect(s.checkpoints.demotions[s.checkpoints.demotions.length - 1]).toMatchObject({
      from: 'B1',
      to: 'A2',
      reason: 'checkpoint_fail',
    });
    expect(s.checkpoints.consecutiveFails.B1).toBe(0);
  });

  it('returns null and is a no-op at the A1 floor', () => {
    seed({}); // certified = A1
    expect(demoteOneLevel('checkpoint_fail')).toBeNull();
    expect(getCertifiedLevel()).toBe('A1');
  });
});
