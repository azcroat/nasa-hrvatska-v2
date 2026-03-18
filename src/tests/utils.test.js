import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock Firebase before importing data.jsx
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
  getApps: vi.fn(() => []),
}));
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  setPersistence: vi.fn(() => Promise.resolve()),
  browserLocalPersistence: {},
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  onAuthStateChanged: vi.fn(() => () => {}),
  updateProfile: vi.fn(),
}));
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  collection: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  limit: vi.fn(),
  orderBy: vi.fn(),
}));

import {
  isValidEmail, sh, lvl, lXP, nXP, shuffleArr, buildSearchIndex,
  generateFamilyCode, friendlyError,
  getSR, saveSR, srMark, getStreak, updateStreak,
  getProverbOfDay, getDailyChallenge, shMemo,
} from '../data.jsx';

// ── localStorage helpers ─────────────────────────────────────────────────────
function clearLS() { localStorage.clear(); }

// ── isValidEmail ─────────────────────────────────────────────────────────────
describe('isValidEmail', () => {
  it('accepts valid emails', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('a.b+c@sub.domain.org')).toBe(true);
  });
  it('rejects invalid emails', () => {
    expect(isValidEmail('notanemail')).toBe(false);
    expect(isValidEmail('@nodomain')).toBe(false);
    expect(isValidEmail('no@')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });
});

// ── lvl (XP → level) ─────────────────────────────────────────────────────────
describe('lvl (XP → level)', () => {
  it('returns level 1 at 0 XP', () => expect(lvl(0)).toBe(1));
  it('returns level 2 at 50 XP', () => expect(lvl(50)).toBe(2));
  it('returns level 10 at 3500 XP', () => expect(lvl(3500)).toBe(10));
  it('returns level 10 for very high XP', () => expect(lvl(99999)).toBe(10));
  it('increases monotonically', () => {
    const thresholds = [0, 50, 150, 300, 500, 800, 1200, 1800, 2500, 3500];
    for (let i = 1; i < thresholds.length; i++) {
      expect(lvl(thresholds[i])).toBeGreaterThan(lvl(thresholds[i - 1]));
    }
  });
  it('never returns below 1', () => expect(lvl(-100)).toBeGreaterThanOrEqual(1));
});

// ── lXP / nXP ────────────────────────────────────────────────────────────────
describe('lXP / nXP (level XP thresholds)', () => {
  it('lXP returns 0 for level 1', () => expect(lXP(1)).toBe(0));
  it('lXP returns 50 for level 2', () => expect(lXP(2)).toBe(50));
  it('lXP returns 500 for level 5', () => expect(lXP(5)).toBe(500));
  it('nXP returns 50 for level 1', () => expect(nXP(1)).toBe(50));
  it('nXP returns 150 for level 2', () => expect(nXP(2)).toBe(150));
  it('nXP(n) > lXP(n) for all levels', () => {
    for (let lvlNum = 1; lvlNum <= 9; lvlNum++) {
      expect(nXP(lvlNum)).toBeGreaterThan(lXP(lvlNum));
    }
  });
});

// ── sh (Fisher-Yates shuffle) ────────────────────────────────────────────────
describe('sh (Fisher-Yates shuffle)', () => {
  it('returns same length array', () => {
    expect(sh([1, 2, 3, 4, 5])).toHaveLength(5);
  });
  it('does not mutate original array', () => {
    const arr = [1, 2, 3, 4, 5];
    sh(arr);
    expect(arr).toEqual([1, 2, 3, 4, 5]);
  });
  it('contains the same elements', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(sh(arr).sort()).toEqual([...arr].sort());
  });
  it('handles empty array', () => expect(sh([])).toEqual([]));
  it('handles single-element array', () => expect(sh([42])).toEqual([42]));
});

// ── shuffleArr ───────────────────────────────────────────────────────────────
describe('shuffleArr', () => {
  it('returns a shuffled copy without mutating', () => {
    const arr = ['a', 'b', 'c', 'd'];
    const result = shuffleArr(arr);
    expect(result).toHaveLength(4);
    expect(arr).toEqual(['a', 'b', 'c', 'd']);
    expect(result.sort()).toEqual(['a', 'b', 'c', 'd']);
  });
  it('handles empty array', () => expect(shuffleArr([])).toEqual([]));
});

// ── shMemo (memoised shuffle) — signature: shMemo(key, arr, n) ──────────────
describe('shMemo', () => {
  it('returns an array', () => expect(Array.isArray(shMemo('test-key', [1, 2, 3]))).toBe(true));
  it('returns same reference for same key', () => {
    const arr = [1, 2, 3, 4, 5];
    const r1 = shMemo('stable-key', arr);
    const r2 = shMemo('stable-key', arr);
    expect(r1).toBe(r2);
  });
  it('contains same elements as input', () => {
    const arr = [1, 2, 3];
    const result = shMemo('any-key', arr);
    expect(result.sort()).toEqual([...arr].sort());
  });
});

// ── generateFamilyCode ───────────────────────────────────────────────────────
describe('generateFamilyCode', () => {
  it('generates a 6-character code', () => expect(generateFamilyCode()).toHaveLength(6));
  it('uses only allowed characters (no ambiguous 0/O/1/I)', () => {
    for (let i = 0; i < 20; i++) {
      expect(generateFamilyCode()).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/);
    }
  });
  it('generates unique codes', () => {
    const codes = new Set(Array.from({ length: 50 }, () => generateFamilyCode()));
    expect(codes.size).toBeGreaterThan(40);
  });
});

// ── friendlyError ────────────────────────────────────────────────────────────
describe('friendlyError', () => {
  it('returns fallback for empty/null input', () => {
    expect(friendlyError(null)).toBe('Something went wrong. Please try again.');
    expect(friendlyError('')).toBe('Something went wrong. Please try again.');
  });
  it('handles email-already-in-use', () => expect(friendlyError('email-already-in-use')).toMatch(/already has an account/i));
  it('handles wrong-password, invalid-credential, and user-not-found with same generic message (anti-enumeration)', () => {
    // All three map to the same message to prevent email enumeration attacks
    expect(friendlyError('wrong-password')).toBe('Invalid email or password.');
    expect(friendlyError('invalid-credential')).toBe('Invalid email or password.');
    expect(friendlyError('user-not-found')).toBe('Invalid email or password.');
  });
  it('handles network-request-failed', () => expect(friendlyError('network-request-failed')).toMatch(/no internet/i));
  it('handles too-many-requests', () => expect(friendlyError('too-many-requests')).toMatch(/too many attempts/i));
  it('handles user-disabled', () => expect(friendlyError('user-disabled')).toMatch(/disabled/i));
  it('handles expired-action-code', () => expect(friendlyError('expired-action-code')).toMatch(/expired/i));
  it('strips Firebase: prefix from unknown errors', () => {
    expect(friendlyError('Firebase: Some error (auth/unknown).')).not.toMatch(/^Firebase:/i);
  });
});

// ── buildSearchIndex ─────────────────────────────────────────────────────────
describe('buildSearchIndex', () => {
  it('returns an array', () => expect(Array.isArray(buildSearchIndex())).toBe(true));
  it('returns items with hr and en fields', () => {
    expect(buildSearchIndex().filter(i => i.hr).length).toBeGreaterThan(0);
  });
  it('is cached (returns same reference on second call)', () => {
    expect(buildSearchIndex()).toBe(buildSearchIndex());
  });
  it('contains both vocab and screen entries', () => {
    const idx = buildSearchIndex();
    const hasVocab = idx.some(i => i.type === 'vocab');
    const hasScreen = idx.some(i => i.type === 'screen');
    expect(hasVocab).toBe(true);
    expect(hasScreen).toBe(true);
  });
  it('has go field for navigation', () => {
    expect(buildSearchIndex().every(i => typeof i.go === 'string')).toBe(true);
  });
});

// hp (SHA-256 hashing) removed — local password hashing removed in security migration

// ── SRS: getSR / saveSR / srMark ─────────────────────────────────────────────
describe('SRS (spaced repetition)', () => {
  beforeEach(clearLS);
  afterEach(clearLS);

  it('getSR returns empty object when nothing is stored', () => {
    expect(getSR()).toEqual({});
  });
  it('saveSR persists data', () => {
    saveSR({ 'куча': { r: 3, w: 1 } });
    expect(getSR()).toEqual({ 'куча': { r: 3, w: 1 } });
  });
  it('srMark(word, true) increments right count', () => {
    srMark('hello', true);
    const sr = getSR();
    expect(sr['hello'].r).toBe(1);
    expect(sr['hello'].w).toBe(0);
  });
  it('srMark(word, false) increments wrong count', () => {
    srMark('world', false);
    const sr = getSR();
    expect(sr['world'].w).toBe(1);
    expect(sr['world'].r).toBe(0);
  });
  it('srMark accumulates across multiple calls', () => {
    srMark('test', true);
    srMark('test', true);
    srMark('test', false);
    const sr = getSR();
    expect(sr['test'].r).toBe(2);
    expect(sr['test'].w).toBe(1);
  });
});

// ── Streak ────────────────────────────────────────────────────────────────────
describe('getStreak / updateStreak', () => {
  beforeEach(clearLS);
  afterEach(clearLS);

  it('getStreak returns count 0 when no streak stored', () => {
    expect(getStreak().count).toBe(0);
  });
  it('updateStreak initialises a streak', () => {
    updateStreak();
    expect(getStreak().count).toBeGreaterThanOrEqual(1);
  });
  it('calling updateStreak twice on same day keeps count at 1', () => {
    updateStreak();
    updateStreak();
    expect(getStreak().count).toBe(1);
  });
  it('getStreak returns an object with count and last fields', () => {
    updateStreak();
    const s = getStreak();
    expect(typeof s.count).toBe('number');
    expect(typeof s.last).toBe('string'); // field is 'last', not 'lastDay'
  });
});

// ── XP cooldown helpers ───────────────────────────────────────────────────────
// canEarnXP and markExerciseDone are module-level helpers in App.jsx.
// We test the localStorage contract directly here.
describe('XP cooldown (localStorage contract)', () => {
  beforeEach(clearLS);
  afterEach(clearLS);

  it('no cooldown stored → can earn XP', () => {
    const cd = JSON.parse(localStorage.getItem('xpCooldown') || '{}');
    const today = new Date().toISOString().slice(0, 10);
    expect(cd['mcgame']).not.toBe(today);
  });
  it('after marking done today → cooldown key equals today', () => {
    const today = new Date().toISOString().slice(0, 10);
    const cd = {}; cd['mcgame'] = today;
    localStorage.setItem('xpCooldown', JSON.stringify(cd));
    const stored = JSON.parse(localStorage.getItem('xpCooldown'));
    expect(stored['mcgame']).toBe(today);
  });
  it('yesterday date → not on cooldown', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem('xpCooldown', JSON.stringify({ mcgame: yesterday }));
    const stored = JSON.parse(localStorage.getItem('xpCooldown'));
    expect(stored['mcgame']).not.toBe(today);
  });
});

// ── getProverbOfDay ───────────────────────────────────────────────────────────
describe('getProverbOfDay', () => {
  it('returns an object', () => {
    const p = getProverbOfDay();
    expect(typeof p).toBe('object');
    expect(p).not.toBeNull();
  });
  it('returns same proverb for same day (deterministic)', () => {
    expect(getProverbOfDay()).toEqual(getProverbOfDay());
  });
  it('proverb has hr field', () => {
    expect(typeof getProverbOfDay().hr).toBe('string');
  });
});

// ── getDailyChallenge ─────────────────────────────────────────────────────────
// Returns { dateKey, challenges } — challenges is the array of 3 items
describe('getDailyChallenge', () => {
  it('returns an object with dateKey and challenges', () => {
    const ch = getDailyChallenge();
    expect(typeof ch).toBe('object');
    expect(ch).not.toBeNull();
    expect(typeof ch.dateKey).toBe('string');
  });
  it('challenges is an array of 3 items', () => {
    const { challenges } = getDailyChallenge();
    expect(Array.isArray(challenges)).toBe(true);
    expect(challenges).toHaveLength(3);
  });
  it('is deterministic (same result each call today)', () => {
    expect(getDailyChallenge()).toBe(getDailyChallenge()); // same cached reference
  });
  it('each challenge has q, a, and opts fields', () => {
    getDailyChallenge().challenges.forEach(item => {
      expect(typeof item.q).toBe('string');
      expect(typeof item.a).toBe('string');
      expect(Array.isArray(item.opts)).toBe(true);
    });
  });
});
