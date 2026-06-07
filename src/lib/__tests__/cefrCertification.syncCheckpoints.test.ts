// src/lib/__tests__/cefrCertification.syncCheckpoints.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { mergeRemoteCertifications, getCertificationState } from '../cefrCertification.js';
import type { CertificationState } from '../cefrCertification.js';

const KEY = 'nh_cefr_certifications';
function local(cp: Partial<CertificationState['checkpoints']>) {
  const base = {
    passes: {},
    attempts: [],
    lastFailedAt: {},
    v: 2,
    checkpoints: {
      lastCheckpointAt: 100,
      activeDaysAtLastCheckpoint: 2,
      consecutiveFails: { B1: 0 },
      focusSkills: {},
      demotions: [],
      snoozedUntil: null,
      ...cp,
    },
  };
  localStorage.setItem(KEY, JSON.stringify(base));
}

describe('mergeRemoteCertifications — checkpoints', () => {
  beforeEach(() => localStorage.clear());

  it('takes the MAX lastCheckpointAt and activeDaysAtLastCheckpoint', () => {
    local({ lastCheckpointAt: 100, activeDaysAtLastCheckpoint: 2 });
    mergeRemoteCertifications({
      passes: {},
      attempts: [],
      lastFailedAt: {},
      v: 2,
      checkpoints: {
        lastCheckpointAt: 200,
        activeDaysAtLastCheckpoint: 5,
        consecutiveFails: {},
        focusSkills: {},
        demotions: [],
        snoozedUntil: null,
      },
    } as CertificationState);
    const s = getCertificationState();
    expect(s.checkpoints.lastCheckpointAt).toBe(200);
    expect(s.checkpoints.activeDaysAtLastCheckpoint).toBe(5);
  });

  it('takes the MAX consecutiveFails per level (do not erase a pending grace)', () => {
    local({ consecutiveFails: { B1: 1 } });
    mergeRemoteCertifications({
      passes: {},
      attempts: [],
      lastFailedAt: {},
      v: 2,
      checkpoints: {
        lastCheckpointAt: null,
        activeDaysAtLastCheckpoint: 0,
        consecutiveFails: { B1: 0, A2: 1 },
        focusSkills: {},
        demotions: [],
        snoozedUntil: null,
      },
    } as CertificationState);
    const s = getCertificationState();
    expect(s.checkpoints.consecutiveFails.B1).toBe(1);
    expect(s.checkpoints.consecutiveFails.A2).toBe(1);
  });
});
