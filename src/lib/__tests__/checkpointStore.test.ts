// src/lib/__tests__/checkpointStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { recordCheckpointResult } from '../checkpointStore.js';
import { getCertificationState, getCertifiedLevel } from '../cefrCertification.js';

const KEY = 'nh_cefr_certifications';
function seed(passes: string[]) {
  const p: Record<string, unknown> = {};
  for (const lvl of passes)
    p[lvl] = { passedAt: 1, scores: { vocab: 0.9, grammar: 0.9 }, overall: 90 };
  localStorage.setItem(KEY, JSON.stringify({ passes: p, attempts: [], lastFailedAt: {}, v: 1 }));
}

describe('recordCheckpointResult', () => {
  beforeEach(() => localStorage.clear());

  it('clean pass resets grace, refreshes cadence, records no demotion', () => {
    seed(['A2', 'B1']);
    const o = recordCheckpointResult({
      level: 'B1',
      scores: { vocab: 0.95, grammar: 0.9, speaking: 0.92 },
      activeDayCount: 10,
      now: 555,
    });
    expect(o.kind).toBe('pass');
    const s = getCertificationState();
    expect(s.checkpoints.lastCheckpointAt).toBe(555);
    expect(s.checkpoints.activeDaysAtLastCheckpoint).toBe(10);
    expect(s.checkpoints.consecutiveFails.B1 ?? 0).toBe(0);
    expect(getCertifiedLevel()).toBe('B1');
  });

  it('first fail sets grace=1 and does NOT reset cadence (immediate retry)', () => {
    seed(['A2', 'B1']);
    const o = recordCheckpointResult({
      level: 'B1',
      scores: { vocab: 0.95, grammar: 0.9, speaking: 0.4 },
      activeDayCount: 10,
      now: 555,
    });
    expect(o.kind).toBe('grace');
    const s = getCertificationState();
    expect(s.checkpoints.consecutiveFails.B1).toBe(1);
    expect(s.checkpoints.lastCheckpointAt).toBeNull(); // cadence NOT refreshed on grace
    expect(getCertifiedLevel()).toBe('B1');
  });

  it('second consecutive fail demotes and refreshes cadence', () => {
    seed(['A2', 'B1']);
    const s0 = getCertificationState();
    s0.checkpoints.consecutiveFails.B1 = 1;
    localStorage.setItem(KEY, JSON.stringify(s0));
    const o = recordCheckpointResult({
      level: 'B1',
      scores: { vocab: 0.4, grammar: 0.9, speaking: 0.9 },
      activeDayCount: 12,
      now: 777,
    });
    expect(o.kind).toBe('demote');
    expect(getCertifiedLevel()).toBe('A2');
    const s = getCertificationState();
    expect(s.checkpoints.lastCheckpointAt).toBe(777);
    expect(s.checkpoints.focusSkills.B1).toContain('vocab');
  });
});
