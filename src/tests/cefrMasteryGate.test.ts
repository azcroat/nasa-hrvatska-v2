// src/tests/cefrMasteryGate.test.ts
// Rec #4 — forward-only grammar-mastery gate on the CEFR level.
import { describe, it, expect, beforeEach } from 'vitest';
import {
  cefrMasteryCapRank,
  applyCefrMasteryGate,
  getUserCefr,
  cefrRank,
  CEFR_MASTERY_GC,
} from '../lib/cefr';
import { getGatedUserCefr, isMasteryGated, resetCefrFloor } from '../lib/cefrLevel';

describe('cefrMasteryCapRank (pure)', () => {
  it('caps at B1 below the B2 grammar threshold', () => {
    expect(cefrMasteryCapRank(0)).toBe(cefrRank('B1'));
    expect(cefrMasteryCapRank(CEFR_MASTERY_GC.B2 - 1)).toBe(cefrRank('B1'));
  });
  it('allows B2 once the B2 threshold is met, C1 at its threshold, C2 at its', () => {
    expect(cefrMasteryCapRank(CEFR_MASTERY_GC.B2)).toBe(cefrRank('B2'));
    expect(cefrMasteryCapRank(CEFR_MASTERY_GC.C1)).toBe(cefrRank('C1'));
    expect(cefrMasteryCapRank(CEFR_MASTERY_GC.C2)).toBe(cefrRank('C2'));
    expect(cefrMasteryCapRank(999)).toBe(cefrRank('C2'));
  });
});

describe('applyCefrMasteryGate (pure)', () => {
  it('never raises a level — A1/A2/B1 pass through untouched (pure-XP band)', () => {
    expect(applyCefrMasteryGate('A1', 0)).toBe('A1');
    expect(applyCefrMasteryGate('A2', 0)).toBe('A2');
    expect(applyCefrMasteryGate('B1', 0)).toBe('B1');
  });
  it('caps B2+ eligibility down to the grammar ceiling', () => {
    expect(applyCefrMasteryGate('B2', 0)).toBe('B1'); // XP says B2, no grammar → B1
    expect(applyCefrMasteryGate('C1', CEFR_MASTERY_GC.B2)).toBe('B2');
    expect(applyCefrMasteryGate('C2', CEFR_MASTERY_GC.C1)).toBe('C1');
  });
  it('does not cap when grammar mastery already covers the eligible level', () => {
    expect(applyCefrMasteryGate('B2', CEFR_MASTERY_GC.B2)).toBe('B2');
    expect(applyCefrMasteryGate('C2', CEFR_MASTERY_GC.C2)).toBe('C2');
  });
});

describe('getGatedUserCefr (stateful floor)', () => {
  beforeEach(() => {
    localStorage.clear();
    resetCefrFloor();
  });

  it('a brand-new high-XP/low-grammar user is gated at B1 (XP cannot buy fluency)', () => {
    // 10000 XP → eligible C1, but gc=0 → capped B1. First run, floor inits to
    // eligible? No — floor inits to eligible only to protect EXISTING users; a
    // fresh account that hits this on first load with no grammar still grandfathers
    // its current eligible. So we simulate a genuine new user whose first call
    // happens early (low XP) and then grows.
    expect(getGatedUserCefr(100, 0, 0)).toBe('A1'); // floor seeded at A1
    // Now XP balloons via dwell but grammar stays at 0 → stays gated at B1.
    expect(getGatedUserCefr(10000, 0, 0)).toBe('B1');
  });

  it('REGRESSION: never demotes an existing user — floor grandfathers current level', () => {
    // Existing user's FIRST call already shows C1 by XP (pre-feature progress),
    // with no grammar completions. They must NOT be demoted.
    expect(getGatedUserCefr(10000, 0, 0)).toBe('C1'); // floor grandfathered to C1
    // Even as more (dwell) XP accrues with gc still 0, they keep C1.
    expect(getGatedUserCefr(17000, 0, 0)).toBe('C1');
  });

  it('advancement past the floor requires grammar mastery', () => {
    getGatedUserCefr(100, 0, 0); // seed floor at A1 (new user)
    // Reach B2-eligible XP with enough grammar (gc is the 3rd arg) → advances to B2.
    expect(getGatedUserCefr(8000, 0, CEFR_MASTERY_GC.B2)).toBe('B2');
    // C1-eligible XP but only B2-level grammar → held at B2 (floor), not C1.
    expect(getGatedUserCefr(18000, 0, CEFR_MASTERY_GC.B2)).toBe('B2');
    // Earn the C1 grammar threshold → advances to C1.
    expect(getGatedUserCefr(18000, 0, CEFR_MASTERY_GC.C1)).toBe('C1');
  });

  it('result is never above the XP-eligible level (no inflation beyond XP)', () => {
    localStorage.clear();
    resetCefrFloor();
    // Lots of grammar but only B1-band XP → stays B1 (mastery cap can’t raise above XP).
    expect(getGatedUserCefr(500, 0, 100)).toBe(getUserCefr(500, 0, 100));
  });

  it('isMasteryGated flags only when grammar holds the user below XP eligibility', () => {
    localStorage.clear();
    resetCefrFloor();
    getGatedUserCefr(100, 0, 0); // new user, floor A1
    expect(isMasteryGated(8000, 0, 0)).toBe(true); // total 8000 → C1-eligible, gc 0 → gated
    localStorage.clear();
    resetCefrFloor();
    getGatedUserCefr(100, 0, 0);
    // total 7150 → B2-eligible, with B2 grammar mastery → not gated.
    expect(isMasteryGated(7000, 0, CEFR_MASTERY_GC.B2)).toBe(false);
  });
});
