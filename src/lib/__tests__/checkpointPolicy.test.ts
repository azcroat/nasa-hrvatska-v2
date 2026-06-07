// src/lib/__tests__/checkpointPolicy.test.ts
import { describe, it, expect } from 'vitest';
import { interpretCheckpoint } from '../checkpointPolicy.js';
import type { SkillScores, CheckpointState } from '../cefrCertification.js';

function cp(consecutive: Record<string, number> = {}): CheckpointState {
  return {
    lastCheckpointAt: null,
    activeDaysAtLastCheckpoint: 0,
    consecutiveFails: consecutive,
    focusSkills: {},
    demotions: [],
    snoozedUntil: null,
  };
}

describe('interpretCheckpoint', () => {
  it('clean pass when every skill >= 0.88', () => {
    const scores: SkillScores = { vocab: 0.95, grammar: 0.9, reading: 0.9, speaking: 0.92 };
    const o = interpretCheckpoint({ level: 'B1', scores, checkpoints: cp() });
    expect(o.kind).toBe('pass');
    expect(o.focusSkills).toEqual([]);
  });

  it('pass-with-focus when a skill is in the borderline band [0.80,0.875)', () => {
    const scores: SkillScores = { vocab: 0.95, grammar: 0.9, speaking: 0.82 };
    const o = interpretCheckpoint({ level: 'B1', scores, checkpoints: cp() });
    expect(o.kind).toBe('pass_focus');
    expect(o.focusSkills).toContain('speaking');
  });

  it('grace on first fail (no prior fail), listing the failed skills', () => {
    const scores: SkillScores = { vocab: 0.95, grammar: 0.9, speaking: 0.5 };
    const o = interpretCheckpoint({ level: 'B1', scores, checkpoints: cp({ B1: 0 }) });
    expect(o.kind).toBe('grace');
    expect(o.failedSkills).toEqual(['speaking']);
    expect(o.demotion).toBeNull();
  });

  it('demote on second consecutive fail (A2+), previewing the drop', () => {
    const scores: SkillScores = { vocab: 0.5, grammar: 0.9, speaking: 0.9 };
    const o = interpretCheckpoint({ level: 'B1', scores, checkpoints: cp({ B1: 1 }) });
    expect(o.kind).toBe('demote');
    expect(o.demotion).toEqual({ from: 'B1', to: 'A2' });
    expect(o.failedSkills).toEqual(['vocab']);
  });

  it('A1 never demotes — repeated fails stay grace', () => {
    const scores: SkillScores = { vocab: 0.4, grammar: 0.9, speaking: 0.9 };
    const o = interpretCheckpoint({ level: 'A1', scores, checkpoints: cp({ A1: 5 }) });
    expect(o.kind).toBe('grace');
    expect(o.demotion).toBeNull();
  });
});
