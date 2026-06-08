/**
 * Unit tests for src/lib/cefrCertification.ts
 *
 * Covers: storage round-trip, pass/fail computation, certified-level
 * computation, retake cooldown logic, remote-merge semantics.
 *
 * Note: CERTIFICATION_REQUIRED is asserted FALSE by default so the
 * feature flag is shipped off. A separate test confirms the flag is
 * what we ship.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  CERTIFICATION_REQUIRED,
  canTakeEquivalencyTest,
  computePassed,
  emptyCheckpointState,
  getCertifiedLevel,
  getCertificationState,
  getEffectiveLevelForUnlock,
  getLastAttempt,
  mergeRemoteCertifications,
  migrateGrandfatheredCertification,
  recordEquivalencyAttempt,
  snapshotCertifications,
} from '../cefrCertification.js';

beforeEach(() => {
  localStorage.clear();
  // The migration flag is its own key — clear() handles it, but be
  // explicit so a future refactor that opts out of clear() doesn't
  // silently break the idempotency test.
  localStorage.removeItem('nh_cefr_migration_v1_done');
});

describe('CERTIFICATION_REQUIRED feature flag', () => {
  it('is TRUE in shipped code — hard CEFR gating is active', () => {
    // Per the 2026-05-20 product decision: "people must actually know the
    // CEFR level material before progressing." The flag activates strict
    // gating via getEffectiveLevelForUnlock. Existing users are
    // grandfathered to their eligible level by migrateGrandfatheredCertification
    // on first launch.
    expect(CERTIFICATION_REQUIRED).toBe(true);
  });
});

describe('computePassed', () => {
  it('passes when all skills >= 80% AND overall >= 80%', () => {
    const r = computePassed({ vocab: 0.85, grammar: 0.82, reading: 0.81 });
    expect(r.passed).toBe(true);
    expect(r.overall).toBeCloseTo(82.67, 1);
  });

  it('fails when any one skill is below 80% even if overall is high', () => {
    const r = computePassed({ vocab: 1.0, grammar: 0.7, reading: 1.0 });
    expect(r.passed).toBe(false);
    expect(r.overall).toBeCloseTo(90, 1);
  });

  it('fails when overall is below 80%', () => {
    const r = computePassed({ vocab: 0.8, grammar: 0.8, reading: 0.5 });
    expect(r.passed).toBe(false);
  });

  it('handles optional listening skill', () => {
    const r1 = computePassed({ vocab: 0.85, grammar: 0.85, reading: 0.85, listening: 0.5 });
    expect(r1.passed).toBe(false);
    const r2 = computePassed({ vocab: 0.85, grammar: 0.85, reading: 0.85, listening: 0.85 });
    expect(r2.passed).toBe(true);
  });
});

describe('getCertifiedLevel', () => {
  it("returns 'A1' when no tests have been taken", () => {
    expect(getCertifiedLevel()).toBe('A1');
  });

  it('returns the highest passed level', () => {
    recordEquivalencyAttempt({
      level: 'A2',
      scores: { vocab: 0.9, grammar: 0.9, reading: 0.9 },
      currentLessonCount: 10,
    });
    expect(getCertifiedLevel()).toBe('A2');
    recordEquivalencyAttempt({
      level: 'B1',
      scores: { vocab: 0.85, grammar: 0.85, reading: 0.85 },
      currentLessonCount: 20,
    });
    expect(getCertifiedLevel()).toBe('B1');
  });

  it('stays at A1 when the only attempt failed', () => {
    recordEquivalencyAttempt({
      level: 'A2',
      scores: { vocab: 0.5, grammar: 0.5, reading: 0.5 },
      currentLessonCount: 10,
    });
    expect(getCertifiedLevel()).toBe('A1');
  });

  it('does NOT downgrade when a higher level is passed but a lower one is failed', () => {
    recordEquivalencyAttempt({
      level: 'B1',
      scores: { vocab: 0.9, grammar: 0.9, reading: 0.9 },
      currentLessonCount: 10,
    });
    expect(getCertifiedLevel()).toBe('B1');
    recordEquivalencyAttempt({
      level: 'A2',
      scores: { vocab: 0.5, grammar: 0.5, reading: 0.5 },
      currentLessonCount: 11,
    });
    // A2 failure does not retract B1 pass
    expect(getCertifiedLevel()).toBe('B1');
  });
});

describe('canTakeEquivalencyTest', () => {
  it('allows a first attempt', () => {
    const r = canTakeEquivalencyTest('A2', 0);
    expect(r.canTake).toBe(true);
  });

  it('blocks retake within 7-day cooldown if fewer than 5 lessons since failure', () => {
    recordEquivalencyAttempt({
      level: 'A2',
      scores: { vocab: 0.5, grammar: 0.5, reading: 0.5 },
      currentLessonCount: 10,
    });
    const r = canTakeEquivalencyTest('A2', 12);
    expect(r.canTake).toBe(false);
    expect(r.reason).toBe('cooldown_active');
    expect(r.lessonsRemaining).toBe(3); // 5 - 2 lessons since failure
  });

  it('unblocks retake after 5 lessons even within 7-day cooldown', () => {
    recordEquivalencyAttempt({
      level: 'A2',
      scores: { vocab: 0.5, grammar: 0.5, reading: 0.5 },
      currentLessonCount: 10,
    });
    const r = canTakeEquivalencyTest('A2', 15); // +5 lessons
    expect(r.canTake).toBe(true);
  });

  it('blocks an already-passed level (no need to retake)', () => {
    recordEquivalencyAttempt({
      level: 'A2',
      scores: { vocab: 0.9, grammar: 0.9, reading: 0.9 },
      currentLessonCount: 10,
    });
    const r = canTakeEquivalencyTest('A2', 100);
    expect(r.canTake).toBe(false);
    expect(r.reason).toBe('already_passed');
  });
});

describe('recordEquivalencyAttempt', () => {
  it('stores a pass and updates certifiedLevel', () => {
    const r = recordEquivalencyAttempt({
      level: 'B1',
      scores: { vocab: 0.9, grammar: 0.9, reading: 0.9 },
      currentLessonCount: 25,
    });
    expect(r.passed).toBe(true);
    expect(r.newCertified).toBe('B1');
    const state = getCertificationState();
    expect(state.passes.B1?.overall).toBeCloseTo(90, 1);
  });

  it('stores a fail and sets lastFailedAt for cooldown', () => {
    const before = Date.now();
    recordEquivalencyAttempt({
      level: 'B1',
      scores: { vocab: 0.5, grammar: 0.5, reading: 0.5 },
      currentLessonCount: 25,
    });
    const state = getCertificationState();
    expect(state.lastFailedAt.B1).toBeGreaterThanOrEqual(before);
    expect(state.passes.B1).toBeUndefined();
  });

  it('caps attempt history at 100 entries', () => {
    for (let i = 0; i < 105; i++) {
      recordEquivalencyAttempt({
        level: 'A2',
        scores: { vocab: 0.5, grammar: 0.5, reading: 0.5 },
        currentLessonCount: i,
      });
    }
    const state = getCertificationState();
    expect(state.attempts.length).toBe(100);
  });
});

describe('getEffectiveLevelForUnlock', () => {
  it('returns the certified level (flag is ON in shipped code)', () => {
    // With CERTIFICATION_REQUIRED=true, the eligible-vs-certified
    // distinction is the entire point. Fresh user: certified is A1
    // regardless of eligible.
    expect(getEffectiveLevelForUnlock('B2')).toBe('A1');
    expect(getEffectiveLevelForUnlock('A1')).toBe('A1');
  });

  it('returns the certified level after a pass — not eligible', () => {
    recordEquivalencyAttempt({
      level: 'A2',
      scores: { vocab: 0.9, grammar: 0.9, reading: 0.9 },
      currentLessonCount: 10,
    });
    expect(getEffectiveLevelForUnlock('B2')).toBe('A2');
  });
});

describe('mergeRemoteCertifications', () => {
  it('takes the additive union of passes', () => {
    recordEquivalencyAttempt({
      level: 'A2',
      scores: { vocab: 0.9, grammar: 0.9, reading: 0.9 },
      currentLessonCount: 10,
    });
    mergeRemoteCertifications({
      v: 2,
      passes: {
        B1: {
          passedAt: Date.now() - 1000,
          scores: { vocab: 0.85, grammar: 0.85, reading: 0.85 },
          overall: 85,
        },
      },
      attempts: [],
      lastFailedAt: {},
      checkpoints: emptyCheckpointState(),
    });
    expect(getCertifiedLevel()).toBe('B1');
  });

  it('preserves earlier passedAt when merging two remote pass records for the same level', () => {
    // Two remote merges (e.g., two devices), each with a pass for A2 at
    // different timestamps. The earlier timestamp wins — that's when the
    // user demonstrably first passed. This is the cross-source preservation
    // policy. (Note: a fresh local recordEquivalencyAttempt stamps Now()
    // intentionally — each new attempt records its own moment.)
    const earlierAt = Date.now() - 100_000;
    const laterAt = Date.now() - 50_000;
    mergeRemoteCertifications({
      v: 2,
      passes: {
        A2: {
          passedAt: laterAt,
          scores: { vocab: 0.85, grammar: 0.85, reading: 0.85 },
          overall: 85,
        },
      },
      attempts: [],
      lastFailedAt: {},
      checkpoints: emptyCheckpointState(),
    });
    mergeRemoteCertifications({
      v: 2,
      passes: {
        A2: {
          passedAt: earlierAt,
          scores: { vocab: 0.85, grammar: 0.85, reading: 0.85 },
          overall: 85,
        },
      },
      attempts: [],
      lastFailedAt: {},
      checkpoints: emptyCheckpointState(),
    });
    const state = getCertificationState();
    expect(state.passes.A2?.passedAt).toBe(earlierAt);
  });

  it('ignores remote with wrong schema version', () => {
    mergeRemoteCertifications({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      v: 99 as any,
      passes: { A2: { passedAt: 1, scores: { vocab: 1, grammar: 1, reading: 1 }, overall: 100 } },
      attempts: [],
      lastFailedAt: {},
      checkpoints: emptyCheckpointState(),
    });
    expect(getCertifiedLevel()).toBe('A1');
  });

  it('safely no-ops on null / undefined / non-object input', () => {
    expect(() => mergeRemoteCertifications(null)).not.toThrow();
    expect(() => mergeRemoteCertifications(undefined)).not.toThrow();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => mergeRemoteCertifications('garbage' as any)).not.toThrow();
  });
});

describe('snapshotCertifications', () => {
  it('returns undefined when no attempts have been made', () => {
    expect(snapshotCertifications()).toBeUndefined();
  });

  it('returns full state once at least one attempt exists', () => {
    recordEquivalencyAttempt({
      level: 'A2',
      scores: { vocab: 0.9, grammar: 0.9, reading: 0.9 },
      currentLessonCount: 10,
    });
    const snap = snapshotCertifications();
    expect(snap).toBeDefined();
    expect(snap?.passes.A2).toBeDefined();
    expect(snap?.attempts.length).toBe(1);
  });
});

describe('migrateGrandfatheredCertification', () => {
  it('grandfathers all levels up to eligible into certification on first call', () => {
    migrateGrandfatheredCertification('B1');
    const state = getCertificationState();
    expect(state.passes.A2?.overall).toBe(80);
    expect(state.passes.B1?.overall).toBe(80);
    expect(state.passes.B2).toBeUndefined();
    expect(state.passes.C1).toBeUndefined();
    expect(getCertifiedLevel()).toBe('B1');
  });

  it('is idempotent — second call does not add duplicate attempts', () => {
    migrateGrandfatheredCertification('A2');
    const firstAttempts = getCertificationState().attempts.length;
    migrateGrandfatheredCertification('A2');
    expect(getCertificationState().attempts.length).toBe(firstAttempts);
  });

  it('never overwrites a real pass at a lower level', () => {
    recordEquivalencyAttempt({
      level: 'A2',
      scores: { vocab: 0.95, grammar: 0.95, reading: 0.95 },
      currentLessonCount: 10,
    });
    const realPassAt = getCertificationState().passes.A2!.passedAt;
    const realPassOverall = getCertificationState().passes.A2!.overall;
    migrateGrandfatheredCertification('B1');
    const state = getCertificationState();
    // A2 real pass preserved, not overwritten by grandfather
    expect(state.passes.A2!.passedAt).toBe(realPassAt);
    expect(state.passes.A2!.overall).toBe(realPassOverall);
    // B1 grandfathered
    expect(state.passes.B1?.overall).toBe(80);
  });

  it('does nothing for an A1-eligible user (A1 needs no test)', () => {
    migrateGrandfatheredCertification('A1');
    const state = getCertificationState();
    expect(Object.keys(state.passes).length).toBe(0);
    expect(getCertifiedLevel()).toBe('A1');
  });

  it('does NOT set the migration flag when eligible is A1', () => {
    // A1 calls are no-ops; the flag must stay clear so a later call with
    // real stats (e.g., after Firebase hydration) still grandfathers.
    migrateGrandfatheredCertification('A1');
    expect(localStorage.getItem('nh_cefr_migration_v1_done')).toBeNull();
    // Now stats arrive — eligible jumps to B1, migration should run.
    migrateGrandfatheredCertification('B1');
    expect(localStorage.getItem('nh_cefr_migration_v1_done')).toBe('1');
    expect(getCertifiedLevel()).toBe('B1');
  });
});

describe('getLastAttempt', () => {
  it('returns null when no attempts at the requested level', () => {
    expect(getLastAttempt('B2')).toBeNull();
  });

  it('returns the most recent attempt at the requested level', () => {
    recordEquivalencyAttempt({
      level: 'A2',
      scores: { vocab: 0.5, grammar: 0.5, reading: 0.5 },
      currentLessonCount: 5,
    });
    recordEquivalencyAttempt({
      level: 'A2',
      scores: { vocab: 0.9, grammar: 0.9, reading: 0.9 },
      currentLessonCount: 10,
    });
    const last = getLastAttempt('A2');
    expect(last?.passed).toBe(true);
  });
});
