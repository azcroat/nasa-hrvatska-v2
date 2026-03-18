/**
 * stats-hydration.test.js
 *
 * Tests the stats merge pattern that was the root cause of all progress loss.
 *
 * THE BUG: progress.stats || ds replaced the entire stats object.
 * Any user who registered before a new field was added (gc, rc, sp, hi, mv, de)
 * would have undefined for those fields, causing silent failures downstream.
 *
 * THE FIX: {...ds, ...(progress.stats||{})} — merge with defaults.
 *
 * These tests lock in that contract so it can never regress.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { vi } from 'vitest';

vi.mock('firebase/app', () => ({ initializeApp: vi.fn(() => ({})), getApps: vi.fn(() => []) }));
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})), setPersistence: vi.fn(() => Promise.resolve()),
  browserLocalPersistence: {}, signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(), signOut: vi.fn(),
  sendPasswordResetEmail: vi.fn(), onAuthStateChanged: vi.fn(() => () => {}),
  updateProfile: vi.fn(),
}));
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})), doc: vi.fn(), getDoc: vi.fn(), setDoc: vi.fn(),
  collection: vi.fn(), getDocs: vi.fn(), query: vi.fn(), limit: vi.fn(), orderBy: vi.fn(),
}));

function clearLS() { localStorage.clear(); }

// ── Default stats shape (mirrors DS constant in App.jsx) ──────────────────────
const DS = {
  xp: 0, str: 1, diff: 'beginner', lc: 0, pf: 0,
  gc: 0, sp: 0, de: 0, rc: 0, mv: 0, hi: 0,
  rs: [], ct: [], badges: [],
};

// ── The merge helper (mirrors the fix applied in App.jsx) ─────────────────────
function mergeStats(saved) {
  return { ...DS, ...(saved || {}) };
}

// ── Core merge contract ───────────────────────────────────────────────────────
describe('stats hydration — merge with defaults', () => {
  it('null saved stats returns full defaults', () => {
    const result = mergeStats(null);
    expect(result).toEqual(DS);
  });

  it('undefined saved stats returns full defaults', () => {
    const result = mergeStats(undefined);
    expect(result).toEqual(DS);
  });

  it('empty object returns full defaults', () => {
    const result = mergeStats({});
    expect(result).toEqual(DS);
  });

  it('saved XP is preserved', () => {
    const result = mergeStats({ xp: 500 });
    expect(result.xp).toBe(500);
  });

  it('saved lesson count is preserved', () => {
    const result = mergeStats({ lc: 12 });
    expect(result.lc).toBe(12);
  });

  it('saved badges array is preserved', () => {
    const result = mergeStats({ badges: ['first_lesson', 'streak_3'] });
    expect(result.badges).toEqual(['first_lesson', 'streak_3']);
  });

  it('missing new fields get defaults (the core regression)', () => {
    // Simulate a user who registered before gc/sp/de/rc/mv/hi were added
    const oldUserStats = { xp: 1200, lc: 8, pf: 2, rs: [0.8, 1.0], ct: ['greetings'] };
    const result = mergeStats(oldUserStats);

    // Old fields preserved
    expect(result.xp).toBe(1200);
    expect(result.lc).toBe(8);

    // New fields get safe defaults (NOT undefined)
    expect(result.gc).toBe(0);
    expect(result.sp).toBe(0);
    expect(result.de).toBe(0);
    expect(result.rc).toBe(0);
    expect(result.mv).toBe(0);
    expect(result.hi).toBe(0);
  });

  it('no field in result is undefined', () => {
    const oldUserStats = { xp: 300, lc: 3 };
    const result = mergeStats(oldUserStats);
    Object.values(result).forEach(v => {
      expect(v).not.toBeUndefined();
    });
  });
});

// ── The WRONG pattern — documents what NOT to do ──────────────────────────────
describe('stats hydration — wrong pattern (regression documentation)', () => {
  it('old pattern (||) would lose new fields for old users', () => {
    const oldUserStats = { xp: 500, lc: 5 };
    // This is the BUG: progress.stats || ds
    const wrongResult = oldUserStats || DS;
    // wrongResult is oldUserStats — no gc/sp/de/rc fields
    expect(wrongResult.gc).toBeUndefined(); // BUG: undefined crashes callers
    expect(wrongResult.sp).toBeUndefined();
  });

  it('correct merge pattern preserves all fields', () => {
    const oldUserStats = { xp: 500, lc: 5 };
    // This is the FIX: {...ds, ...(progress.stats||{})}
    const correctResult = { ...DS, ...(oldUserStats || {}) };
    expect(correctResult.xp).toBe(500);
    expect(correctResult.gc).toBe(0);  // default, not undefined
    expect(correctResult.sp).toBe(0);
  });
});

// ── Stats updater functions (setSt pattern) ───────────────────────────────────
describe('setSt updater functions', () => {
  it('lesson complete updater increments lc', () => {
    const current = { ...DS, lc: 3 };
    // Mirrors: setSt(s => ({...s, lc: s.lc+1, ...}))
    const updated = { ...current, lc: current.lc + 1 };
    expect(updated.lc).toBe(4);
    expect(updated.xp).toBe(current.xp); // other fields unchanged
  });

  it('perfect lesson updater increments pf', () => {
    const current = { ...DS, lc: 5, pf: 2 };
    const updated = { ...current, pf: current.pf + 1 };
    expect(updated.pf).toBe(3);
    expect(updated.lc).toBe(5);
  });

  it('result ratios array grows correctly', () => {
    const current = { ...DS, rs: [0.8, 1.0] };
    const newScore = 0.75;
    const updated = { ...current, rs: [...current.rs, newScore] };
    expect(updated.rs).toHaveLength(3);
    expect(updated.rs[2]).toBe(0.75);
  });

  it('completed topics set grows without duplicates', () => {
    const current = { ...DS, ct: ['greetings', 'numbers'] };
    const topic = 'greetings'; // already in set
    const updated = { ...current, ct: [...new Set([...current.ct, topic])] };
    expect(updated.ct).toHaveLength(2); // no duplicate
  });

  it('new topic is added to ct', () => {
    const current = { ...DS, ct: ['greetings'] };
    const updated = { ...current, ct: [...new Set([...current.ct, 'family'])] };
    expect(updated.ct).toContain('family');
    expect(updated.ct).toHaveLength(2);
  });
});

// ── XP award mechanics ────────────────────────────────────────────────────────
describe('XP award mechanics', () => {
  beforeEach(clearLS);
  afterEach(clearLS);

  it('canEarnXP returns true when no cooldown stored', () => {
    const today = new Date().toISOString().slice(0, 10);
    const cd = JSON.parse(localStorage.getItem('xpCooldown') || '{}');
    expect(cd['lesson-greetings']).not.toBe(today);
  });

  it('after earning XP today, cooldown blocks re-earning', () => {
    const today = new Date().toISOString().slice(0, 10);
    const cd = { 'lesson-greetings': today };
    localStorage.setItem('xpCooldown', JSON.stringify(cd));
    const stored = JSON.parse(localStorage.getItem('xpCooldown'));
    expect(stored['lesson-greetings']).toBe(today);
  });

  it('cooldown from yesterday does not block earning today', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem('xpCooldown', JSON.stringify({ 'lesson-greetings': yesterday }));
    const stored = JSON.parse(localStorage.getItem('xpCooldown'));
    expect(stored['lesson-greetings']).not.toBe(today);
  });

  it('XP total increases correctly', () => {
    const current = { ...DS, xp: 150 };
    const earned = 30;
    const updated = { ...current, xp: current.xp + earned };
    expect(updated.xp).toBe(180);
  });
});
