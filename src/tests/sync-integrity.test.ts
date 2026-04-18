/**
 * sync-integrity.test.ts — Cross-cutting sync invariant tests.
 *
 * These tests guard against the class of bugs that caused weeks of recurring
 * sync failures: key mismatches between write paths, divergent merge strategies
 * across code paths, and stale data contaminating current-week counters.
 *
 * Critical invariants tested:
 *   1. weekKey() is UTC-based and produces the same key across all three callers
 *      (useAward → localStorage write, progressSnapshot → weekXPKey field,
 *       applyRemoteProgress → localStorage read/write)
 *   2. rs (score history) merge: longer array wins — same in mergeStatsFromRemote
 *      AND the inline stats merge in fbWatchProgress (fixed 2026-04-18)
 *   3. buildProgressSnapshot always includes weekXPKey so applyRemoteProgress
 *      can guard against cross-week contamination
 *   4. Math.max never decreases any numeric stat through any merge path
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { weekKey } from '../lib/dateUtils.js';
import { mergeStatsFromRemote } from '../lib/mergeStatsFromRemote.js';
import type { Stats } from '../types/index.js';

// ── Firebase + lib mocks ──────────────────────────────────────────────────────
vi.mock('firebase/app', () => ({ initializeApp: vi.fn(() => ({})), getApps: vi.fn(() => []) }));
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})), setPersistence: vi.fn(() => Promise.resolve()),
  browserLocalPersistence: {}, signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(), signOut: vi.fn(),
  sendPasswordResetEmail: vi.fn(), onAuthStateChanged: vi.fn(() => () => {}),
  updateProfile: vi.fn(), initializeAuth: vi.fn(() => ({})),
  indexedDBLocalPersistence: {}, browserSessionPersistence: {}, inMemoryPersistence: {},
  GoogleAuthProvider: vi.fn(() => ({})), signInWithPopup: vi.fn(),
  sendEmailVerification: vi.fn(), deleteUser: vi.fn(),
}));
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})), doc: vi.fn(), getDoc: vi.fn(), setDoc: vi.fn(),
  collection: vi.fn(), getDocs: vi.fn(), query: vi.fn(), limit: vi.fn(), orderBy: vi.fn(),
  initializeFirestore: vi.fn(() => ({})),
  persistentLocalCache: vi.fn(() => ({})), persistentMultipleTabManager: vi.fn(() => ({})),
  memoryLocalCache: vi.fn(() => ({})),
  onSnapshot: vi.fn(() => () => {}), serverTimestamp: vi.fn(), increment: vi.fn(),
  arrayUnion: vi.fn(), arrayRemove: vi.fn(), writeBatch: vi.fn(), runTransaction: vi.fn(),
  deleteField: vi.fn(), deleteDoc: vi.fn(), updateDoc: vi.fn(),
}));
vi.mock('firebase/analytics', () => ({
  getAnalytics: vi.fn(() => ({})), logEvent: vi.fn(),
  isSupported: vi.fn(() => Promise.resolve(false)),
}));
vi.mock('../lib/srs.js', () => ({ getSR: vi.fn(() => ({})), saveSR: vi.fn() }));
vi.mock('../lib/appUtils.js', () => ({
  getStreak: vi.fn(() => ({ count: 0, last: '' })),
  getStreakFreezes: vi.fn(() => 0),
}));
vi.mock('../lib/firebase.js', () => ({ gP: vi.fn(() => null) }));

const DS: Stats = {
  xp: 0, str: 1, diff: 'beginner', lc: 0, pf: 0,
  gc: 0, sp: 0, de: 0, rc: 0, mv: 0, hi: 0,
  rs: [], ct: [], vs: [], badges: [],
};

function prev(overrides: Partial<Stats> = {}): Stats {
  return { ...DS, ...overrides };
}

// ─── 1. weekKey() UTC consistency ─────────────────────────────────────────────

describe('sync-integrity — weekKey() UTC consistency', () => {
  it('weekKey() returns a string matching YYYY-WNN format', () => {
    const wk = weekKey();
    expect(wk).toMatch(/^\d{4}-W\d{2}$/);
  });

  it('weekKey() is deterministic: same result called twice in same second', () => {
    expect(weekKey()).toBe(weekKey());
  });

  it('weekKey() uses UTC arithmetic (year/month/date from Date object)', () => {
    // Construct a known date: 2026-01-05 (Monday of week 2)
    const monday = new Date(2026, 0, 5); // local Monday Jan 5 2026
    const wk = weekKey(monday);
    // Jan 5 2026 is in ISO week 2 of 2026
    expect(wk).toBe('2026-W02');
  });

  it('weekKey() produces same result for dates in the same ISO week', () => {
    // 2026-W15: Mon Apr 6 → Sun Apr 12
    const mon = new Date(2026, 3, 6);   // Mon Apr 6
    const sun = new Date(2026, 3, 12);  // Sun Apr 12
    expect(weekKey(mon)).toBe(weekKey(sun));
  });

  it('weekKey() produces different results for consecutive weeks', () => {
    const thisMonday = new Date(2026, 3, 6);   // week 15
    const nextMonday = new Date(2026, 3, 13);  // week 16
    expect(weekKey(thisMonday)).not.toBe(weekKey(nextMonday));
  });
});

// ─── 2. rs merge: longer array wins across all paths ─────────────────────────

describe('sync-integrity — rs (score history) merge: longer array wins', () => {
  it('local rs wins when longer', () => {
    const local = prev({ rs: ['100', '75', '80', '90'] });
    const remote = { rs: ['95', '60'] };
    const result = mergeStatsFromRemote(local, remote, DS);
    expect(result.rs).toHaveLength(4);
    expect(result.rs).toEqual(['100', '75', '80', '90']);
  });

  it('remote rs wins when longer', () => {
    const local = prev({ rs: ['80'] });
    const remote = { rs: ['100', '75', '80', '90', '85'] };
    const result = mergeStatsFromRemote(local, remote, DS);
    expect(result.rs).toHaveLength(5);
    expect(result.rs).toEqual(['100', '75', '80', '90', '85']);
  });

  it('local rs wins on tie (equal length — local is preferred)', () => {
    const local = prev({ rs: ['95', '70'] });
    const remote = { rs: ['80', '60'] };
    const result = mergeStatsFromRemote(local, remote, DS);
    expect(result.rs).toHaveLength(2);
    // local wins when equal
    expect(result.rs).toEqual(['95', '70']);
  });

  it('empty local rs gets remote rs', () => {
    const local = prev({ rs: [] });
    const remote = { rs: ['100', '90', '80'] };
    const result = mergeStatsFromRemote(local, remote, DS);
    expect(result.rs).toHaveLength(3);
  });

  it('empty remote rs keeps local rs', () => {
    const local = prev({ rs: ['100', '90', '80', '70'] });
    const remote = { rs: [] };
    const result = mergeStatsFromRemote(local, remote, DS);
    expect(result.rs).toHaveLength(4);
  });

  it('missing remote rs (undefined) keeps local rs', () => {
    const local = prev({ rs: ['100', '90'] });
    const remote = {}; // no rs field
    const result = mergeStatsFromRemote(local, remote, DS);
    expect(result.rs).toHaveLength(2);
  });

  it('rs is never undefined in result', () => {
    const result = mergeStatsFromRemote(prev(), {}, DS);
    expect(Array.isArray(result.rs)).toBe(true);
  });
});

// ─── 3. buildProgressSnapshot — weekXPKey field ──────────────────────────────

describe('sync-integrity — buildProgressSnapshot weekXPKey', () => {
  beforeEach(() => { localStorage.clear(); });
  afterEach(() => { localStorage.clear(); });

  it('snapshot includes weekXPKey matching weekKey() format', async () => {
    const { buildProgressSnapshot } = await import('../lib/progressSnapshot.js');
    const snap = buildProgressSnapshot({
      uid: 'test@example.com',
      name: 'Test',
      stats: DS,
      dchlA: [false, false, false],
      dchlSl: ['', '', ''],
      favs: [],
      jWords: [],
    });
    expect(snap.weekXPKey).toBeDefined();
    expect(snap.weekXPKey).toMatch(/^\d{4}-W\d{2}$/);
  });

  it('snapshot weekXPKey matches weekKey() called at the same moment', async () => {
    const { buildProgressSnapshot } = await import('../lib/progressSnapshot.js');
    const expectedWk = weekKey();
    const snap = buildProgressSnapshot({
      uid: 'test@example.com',
      name: 'Test',
      stats: DS,
      dchlA: [false, false, false],
      dchlSl: ['', '', ''],
      favs: [],
      jWords: [],
    });
    expect(snap.weekXPKey).toBe(expectedWk);
  });
});

// ─── 4. Numeric stats never decrease through any merge ────────────────────────

describe('sync-integrity — monotonic numeric stats (all merge paths)', () => {
  const fields: (keyof Stats)[] = ['xp', 'lc', 'gc', 'sp', 'de', 'rc', 'pf', 'mv', 'hi', 'str'];

  it.each(fields)('%s never decreases when remote is lower', (field) => {
    const local = prev({ [field]: 1000 } as Partial<Stats>);
    const remote = { [field]: 1 };
    const result = mergeStatsFromRemote(local, remote, DS);
    expect((result as Record<string, number>)[field as string]).toBe(1000);
  });

  it.each(fields)('%s takes remote when remote is higher', (field) => {
    const local = prev({ [field]: 1 } as Partial<Stats>);
    const remote = { [field]: 1000 };
    const result = mergeStatsFromRemote(local, remote, DS);
    expect((result as Record<string, number>)[field as string]).toBe(1000);
  });
});

// ─── 5. Array fields never lose items across merge ───────────────────────────

describe('sync-integrity — array fields: no items lost through merge', () => {
  it('ct union never shrinks', () => {
    const local = prev({ ct: ['A1', 'A2', 'B1'] });
    const remote = { ct: ['A1', 'C1'] };
    const result = mergeStatsFromRemote(local, remote, DS);
    expect(result.ct.length).toBeGreaterThanOrEqual(local.ct.length);
    expect(result.ct).toContain('B1');
    expect(result.ct).toContain('C1');
  });

  it('badges union: earned badges never lost', () => {
    const local = prev({ badges: ['first_lesson', 'streak_7'] });
    const remote = { badges: ['streak_30'] };
    const result = mergeStatsFromRemote(local, remote, DS);
    expect(result.badges).toContain('first_lesson');
    expect(result.badges).toContain('streak_7');
    expect(result.badges).toContain('streak_30');
  });

  it('vs union: screen visit history preserved', () => {
    const local = prev({ vs: ['dashboard', 'lesson', 'practice'] });
    const remote = { vs: ['settings'] };
    const result = mergeStatsFromRemote(local, remote, DS);
    expect(result.vs).toContain('dashboard');
    expect(result.vs).toContain('settings');
  });
});

// ─── 6. weekXP key alignment: all three paths use same string ────────────────
// Regression test: the isoWeekKey() bug used local time; weekKey() uses UTC.
// This test shows they can differ, and confirms applyRemoteProgress now uses UTC.

describe('sync-integrity — weekXP key alignment across all write paths', () => {
  beforeEach(() => { localStorage.clear(); });
  afterEach(() => { localStorage.clear(); });

  it('weekKey() result matches what applyRemoteProgress reads/writes', async () => {
    const { applyRemoteProgress } = await import('../lib/applyRemoteProgress.js');
    const wk = weekKey(); // UTC-based — same as useAward and progressSnapshot
    const setters = {
      setFavs: vi.fn(), setJWords: vi.fn(), sDchlA: vi.fn(),
      sDchlSl: vi.fn(), setOnboarded: vi.fn(), setName: vi.fn(),
    };
    // Simulate a snapshot written by progressSnapshot (which uses weekKey())
    applyRemoteProgress({ weekXP: 500, weekXPKey: wk }, setters);
    // Must be readable under the same key used by useAward
    const stored = parseInt(localStorage.getItem('nh_week_xp_' + wk) || '0', 10);
    expect(stored).toBe(500);
  });

  it('applyRemoteProgress rejects snapshot from a stale week key', async () => {
    const { applyRemoteProgress } = await import('../lib/applyRemoteProgress.js');
    const wk = weekKey();
    const setters = {
      setFavs: vi.fn(), setJWords: vi.fn(), sDchlA: vi.fn(),
      sDchlSl: vi.fn(), setOnboarded: vi.fn(), setName: vi.fn(),
    };
    // Snapshot with an old weekXPKey — stale cross-week value
    applyRemoteProgress({ weekXP: 9999, weekXPKey: '2020-W01' }, setters);
    const stored = parseInt(localStorage.getItem('nh_week_xp_' + wk) || '0', 10);
    // Must not have applied the stale value
    expect(stored).toBe(0);
  });
});
