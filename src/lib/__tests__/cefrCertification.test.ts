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
  getCertifiedLevel,
  getCertificationState,
  getEffectiveLevelForUnlock,
  getLastAttempt,
  mergeRemoteCertifications,
  recordEquivalencyAttempt,
  snapshotCertifications,
} from '../cefrCertification.js';

beforeEach(() => {
  localStorage.clear();
});

describe('CERTIFICATION_REQUIRED feature flag', () => {
  it('is FALSE in shipped code so existing UX is unchanged', () => {
    // Critical invariant: shipping with the flag on would silently lock
    // content for every user. This must stay false until equivalency
    // test items are content-authored.
    expect(CERTIFICATION_REQUIRED).toBe(false);
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
  it('returns eligible when the flag is off (current default)', () => {
    expect(getEffectiveLevelForUnlock('B2')).toBe('B2');
    expect(getEffectiveLevelForUnlock('A1')).toBe('A1');
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
      v: 1,
      passes: {
        B1: {
          passedAt: Date.now() - 1000,
          scores: { vocab: 0.85, grammar: 0.85, reading: 0.85 },
          overall: 85,
        },
      },
      attempts: [],
      lastFailedAt: {},
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
      v: 1,
      passes: {
        A2: {
          passedAt: laterAt,
          scores: { vocab: 0.85, grammar: 0.85, reading: 0.85 },
          overall: 85,
        },
      },
      attempts: [],
      lastFailedAt: {},
    });
    mergeRemoteCertifications({
      v: 1,
      passes: {
        A2: {
          passedAt: earlierAt,
          scores: { vocab: 0.85, grammar: 0.85, reading: 0.85 },
          overall: 85,
        },
      },
      attempts: [],
      lastFailedAt: {},
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
