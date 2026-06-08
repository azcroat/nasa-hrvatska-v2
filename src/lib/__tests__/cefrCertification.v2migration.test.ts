// src/lib/__tests__/cefrCertification.v2migration.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { getCertificationState } from '../cefrCertification.js';

const KEY = 'nh_cefr_certifications';

function emptyCheckpoints() {
  return {
    lastCheckpointAt: null,
    activeDaysAtLastCheckpoint: 0,
    consecutiveFails: {},
    focusSkills: {},
    demotions: [],
    snoozedUntil: null,
  };
}

describe('v1 -> v2 migration', () => {
  beforeEach(() => localStorage.clear());

  it('returns a v2 empty state with a checkpoints block when storage is empty', () => {
    const s = getCertificationState();
    expect(s.v).toBe(2);
    expect(s.checkpoints).toEqual(emptyCheckpoints());
  });

  it('migrates a stored v1 state, preserving passes/attempts and adding checkpoints', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        passes: { A2: { passedAt: 111, scores: { vocab: 0.9, grammar: 0.9 }, overall: 90 } },
        attempts: [
          {
            level: 'A2',
            passed: true,
            takenAt: 111,
            scores: { vocab: 0.9, grammar: 0.9 },
            overall: 90,
          },
        ],
        lastFailedAt: {},
        v: 1,
      }),
    );
    const s = getCertificationState();
    expect(s.v).toBe(2);
    expect(s.passes.A2?.overall).toBe(90);
    expect(s.attempts).toHaveLength(1);
    expect(s.checkpoints).toEqual(emptyCheckpoints());
  });

  it('normalises a partial/corrupt checkpoints block to defaults', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        passes: {},
        attempts: [],
        lastFailedAt: {},
        checkpoints: { snoozedUntil: 999 },
        v: 2,
      }),
    );
    const s = getCertificationState();
    expect(s.checkpoints.snoozedUntil).toBe(999);
    expect(s.checkpoints.consecutiveFails).toEqual({});
    expect(Array.isArray(s.checkpoints.demotions)).toBe(true);
  });
});
