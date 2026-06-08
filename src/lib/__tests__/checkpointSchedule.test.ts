// src/lib/__tests__/checkpointSchedule.test.ts
import { describe, it, expect } from 'vitest';
import { isCheckpointDue, ACTIVE_DAYS_PER_CHECKPOINT } from '../checkpointSchedule.js';
import type { CheckpointState } from '../cefrCertification.js';

function cp(partial: Partial<CheckpointState> = {}): CheckpointState {
  return {
    lastCheckpointAt: null,
    activeDaysAtLastCheckpoint: 0,
    consecutiveFails: {},
    focusSkills: {},
    demotions: [],
    snoozedUntil: null,
    ...partial,
  };
}

describe('isCheckpointDue', () => {
  const base = { enabled: true, certified: 'B1' as const, activeDayCount: 5, now: 1000 };

  it('not due when the feature flag is off', () => {
    expect(isCheckpointDue({ ...base, enabled: false, checkpoints: cp() }).due).toBe(false);
  });

  it('due at A1 (non-demoting floor still runs)', () => {
    expect(isCheckpointDue({ ...base, certified: 'A1', checkpoints: cp() }).due).toBe(true);
  });

  it('due once 5 active days have elapsed since the last checkpoint', () => {
    expect(
      isCheckpointDue({
        ...base,
        activeDayCount: 5,
        checkpoints: cp({ activeDaysAtLastCheckpoint: 0 }),
      }).due,
    ).toBe(true);
    expect(
      isCheckpointDue({
        ...base,
        activeDayCount: 4,
        checkpoints: cp({ activeDaysAtLastCheckpoint: 0 }),
      }).due,
    ).toBe(false);
  });

  it('not due while snoozed; due again after snooze expires', () => {
    expect(
      isCheckpointDue({ ...base, now: 500, checkpoints: cp({ snoozedUntil: 1000 }) }).due,
    ).toBe(false);
    expect(
      isCheckpointDue({ ...base, now: 1001, checkpoints: cp({ snoozedUntil: 1000 }) }).due,
    ).toBe(true);
  });

  it('uses the 5-active-day constant', () => {
    expect(ACTIVE_DAYS_PER_CHECKPOINT).toBe(5);
  });
});
