/**
 * mergeStatsFromRemote.test.ts
 *
 * Integration tests for the canonical stats-merge function.
 * This is the single most critical merge path in the app — all three
 * sync routes (useSyncManager watcher, iosWakeUp, onSignedIn) go through it.
 *
 * Test contract: the result must NEVER have a lower value than the local state
 * for monotonically-increasing counters (xp, lc, gc, sp, de, rc, str, pf, mv, hi),
 * must take the union of array fields (ct, vs, badges), and must never regress
 * the CEFR difficulty level.
 */
import { describe, it, expect } from 'vitest';
import { mergeStatsFromRemote } from '../lib/mergeStatsFromRemote.js';
import type { Stats } from '../types/index.js';

const DS: Stats = {
  xp: 0, str: 1, diff: 'beginner', lc: 0, pf: 0,
  gc: 0, sp: 0, de: 0, rc: 0, mv: 0, hi: 0,
  rs: [], ct: [], vs: [], badges: [],
};

function prev(overrides: Partial<Stats> = {}): Stats {
  return { ...DS, ...overrides };
}

// ── Monotonically-increasing counters ────────────────────────────────────────

describe('mergeStatsFromRemote — numeric counters never decrease', () => {
  it('local xp wins when local > remote', () => {
    const result = mergeStatsFromRemote(prev({ xp: 500 }), { xp: 200 }, DS);
    expect(result.xp).toBe(500);
  });

  it('remote xp wins when remote > local', () => {
    const result = mergeStatsFromRemote(prev({ xp: 100 }), { xp: 800 }, DS);
    expect(result.xp).toBe(800);
  });

  it('lc never decreases — local wins', () => {
    const result = mergeStatsFromRemote(prev({ lc: 10 }), { lc: 3 }, DS);
    expect(result.lc).toBe(10);
  });

  it('lc takes remote when remote is higher', () => {
    const result = mergeStatsFromRemote(prev({ lc: 3 }), { lc: 15 }, DS);
    expect(result.lc).toBe(15);
  });

  it('gc, sp, de, rc, pf, mv, hi all take Math.max', () => {
    const loc = prev({ gc: 5, sp: 3, de: 2, rc: 8, pf: 1, mv: 4, hi: 7 });
    const rem  = { gc: 8, sp: 1, de: 5, rc: 2, pf: 3, mv: 4, hi: 9 };
    const result = mergeStatsFromRemote(loc, rem, DS);
    expect(result.gc).toBe(8);  // remote wins
    expect(result.sp).toBe(3);  // local wins
    expect(result.de).toBe(5);  // remote wins
    expect(result.rc).toBe(8);  // local wins
    expect(result.pf).toBe(3);  // remote wins
    expect(result.mv).toBe(4);  // tie → either value
    expect(result.hi).toBe(9);  // remote wins
  });

  it('str (streak) takes Math.max', () => {
    const result = mergeStatsFromRemote(prev({ str: 7 }), { str: 14 }, DS);
    expect(result.str).toBe(14);
  });
});

// ── Array field unions ────────────────────────────────────────────────────────

describe('mergeStatsFromRemote — array fields are union (no items lost)', () => {
  it('ct union: keeps all local and remote topics', () => {
    const result = mergeStatsFromRemote(
      prev({ ct: ['greetings', 'numbers'] }),
      { ct: ['family', 'numbers'] },
      DS
    );
    expect(result.ct).toContain('greetings');
    expect(result.ct).toContain('numbers');
    expect(result.ct).toContain('family');
    expect(result.ct.filter(x => x === 'numbers')).toHaveLength(1); // no duplicates
  });

  it('vs union: no screen visits lost', () => {
    const result = mergeStatsFromRemote(
      prev({ vs: ['dashboard', 'lesson'] }),
      { vs: ['lesson', 'profile'] },
      DS
    );
    expect(result.vs).toContain('dashboard');
    expect(result.vs).toContain('lesson');
    expect(result.vs).toContain('profile');
  });

  it('badges union: earned badges are never lost', () => {
    const result = mergeStatsFromRemote(
      prev({ badges: ['first_lesson', 'streak_3'] }),
      { badges: ['streak_7', 'first_lesson'] },
      DS
    );
    expect(result.badges).toContain('first_lesson');
    expect(result.badges).toContain('streak_3');
    expect(result.badges).toContain('streak_7');
    // No duplicates
    expect(result.badges.filter(b => b === 'first_lesson')).toHaveLength(1);
  });

  it('empty remote ct does not wipe local ct', () => {
    const result = mergeStatsFromRemote(
      prev({ ct: ['greetings', 'food', 'colors'] }),
      { ct: [] },
      DS
    );
    expect(result.ct).toHaveLength(3);
  });

  it('empty local ct gets remote ct', () => {
    const result = mergeStatsFromRemote(prev({ ct: [] }), { ct: ['greetings'] }, DS);
    expect(result.ct).toContain('greetings');
  });
});

// ── CEFR difficulty never regresses ──────────────────────────────────────────

describe('mergeStatsFromRemote — diff never regresses', () => {
  it('advanced local + beginner remote → advanced result', () => {
    const result = mergeStatsFromRemote(prev({ diff: 'advanced' }), { diff: 'beginner' }, DS);
    expect(result.diff).toBe('advanced');
  });

  it('beginner local + advanced remote → advanced result', () => {
    const result = mergeStatsFromRemote(prev({ diff: 'beginner' }), { diff: 'advanced' }, DS);
    expect(result.diff).toBe('advanced');
  });

  it('intermediate local + intermediate remote → intermediate result', () => {
    const result = mergeStatsFromRemote(prev({ diff: 'intermediate' }), { diff: 'intermediate' }, DS);
    expect(result.diff).toBe('intermediate');
  });

  it('unknown diff value falls back to DS default', () => {
    const result = mergeStatsFromRemote(prev({ diff: 'beginner' }), { diff: 'fluent' as Stats['diff'] }, DS);
    // neither local (beginner) nor remote (invalid) should cause a crash
    expect(['beginner', 'intermediate', 'advanced']).toContain(result.diff);
  });
});

// ── Null / undefined robustness ───────────────────────────────────────────────

describe('mergeStatsFromRemote — null/undefined safety', () => {
  it('null remote stats returns local values', () => {
    const result = mergeStatsFromRemote(prev({ xp: 500, lc: 5 }), null, DS);
    expect(result.xp).toBe(500);
    expect(result.lc).toBe(5);
  });

  it('undefined remote stats returns local values', () => {
    const result = mergeStatsFromRemote(prev({ xp: 300 }), undefined, DS);
    expect(result.xp).toBe(300);
  });

  it('remote with null ct does not crash', () => {
    const result = mergeStatsFromRemote(prev({ ct: ['greetings'] }), { ct: null }, DS);
    expect(result.ct).toContain('greetings');
  });

  it('all fields are defined in result (no undefined)', () => {
    const result = mergeStatsFromRemote(prev(), { xp: 50 }, DS);
    const keyFields = ['xp', 'str', 'diff', 'lc', 'pf', 'gc', 'sp', 'de', 'rc', 'mv', 'hi', 'rs', 'ct', 'vs', 'badges'];
    keyFields.forEach(k => {
      expect((result as Record<string, unknown>)[k]).not.toBeUndefined();
    });
  });
});

// ── End-to-end merge scenarios ────────────────────────────────────────────────

describe('mergeStatsFromRemote — real-world sync scenarios', () => {
  it('user syncs after completing lessons on phone — phone data wins on counters', () => {
    const local = prev({ xp: 1200, lc: 8, gc: 3, ct: ['greetings', 'family'], badges: ['first_lesson'] });
    const remote = { xp: 950, lc: 6, gc: 5, ct: ['numbers', 'greetings'], badges: ['first_lesson', 'streak_3'] };
    const result = mergeStatsFromRemote(local, remote, DS);
    expect(result.xp).toBe(1200);  // local wins
    expect(result.lc).toBe(8);     // local wins
    expect(result.gc).toBe(5);     // remote wins
    expect(result.ct).toContain('greetings');
    expect(result.ct).toContain('family');
    expect(result.ct).toContain('numbers');
    expect(result.badges).toContain('streak_3'); // remote badge added
  });

  it('fresh sign-in on new device — remote data hydrates empty local', () => {
    const local = prev(); // empty (DS defaults)
    const remote = { xp: 2400, lc: 15, gc: 8, diff: 'intermediate', ct: ['greetings','family','food'], badges: ['first_lesson','streak_7'] };
    const result = mergeStatsFromRemote(local, remote, DS);
    expect(result.xp).toBe(2400);
    expect(result.lc).toBe(15);
    expect(result.diff).toBe('intermediate');
    expect(result.ct).toHaveLength(3);
  });

  it('old user (missing new fields) gets safe defaults for new fields', () => {
    const local = prev({ xp: 5000, lc: 40 }); // no gc, sp, de, rc, mv, hi
    const remote = { xp: 5200, lc: 42 }; // also missing new fields
    const result = mergeStatsFromRemote(local, remote, DS);
    expect(result.gc).toBe(0);
    expect(result.sp).toBe(0);
    expect(result.de).toBe(0);
    expect(result.rc).toBe(0);
    expect(result.mv).toBe(0);
    expect(result.hi).toBe(0);
    expect(result.xp).toBe(5200);
    expect(result.lc).toBe(42);
  });
});
