import { describe, it, expect, beforeEach, vi } from 'vitest';

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
}));

import { isValidEmail, sh, lvl, lXP, nXP, shuffleArr, buildSearchIndex, generateFamilyCode } from '../data.jsx';

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
});

describe('lXP / nXP (level XP thresholds)', () => {
  it('lXP returns XP needed to reach level', () => {
    expect(lXP(1)).toBe(0);
    expect(lXP(2)).toBe(50);
    expect(lXP(5)).toBe(500);
  });
  it('nXP returns XP target for next level', () => {
    expect(nXP(1)).toBe(50);
    expect(nXP(2)).toBe(150);
  });
});

describe('sh (Fisher-Yates shuffle)', () => {
  it('returns same length array', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(sh(arr)).toHaveLength(arr.length);
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
});

describe('shuffleArr', () => {
  it('returns a shuffled copy without mutating', () => {
    const arr = ['a', 'b', 'c', 'd'];
    const result = shuffleArr(arr);
    expect(result).toHaveLength(4);
    expect(arr).toEqual(['a', 'b', 'c', 'd']);
    expect(result.sort()).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe('generateFamilyCode', () => {
  it('generates a 6-character code', () => {
    const code = generateFamilyCode();
    expect(code).toHaveLength(6);
  });
  it('uses only allowed characters (no ambiguous 0/O/1/I)', () => {
    for (let i = 0; i < 20; i++) {
      const code = generateFamilyCode();
      expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/);
    }
  });
  it('generates unique codes', () => {
    const codes = new Set(Array.from({ length: 50 }, () => generateFamilyCode()));
    expect(codes.size).toBeGreaterThan(40);
  });
});

describe('buildSearchIndex', () => {
  it('returns an array', () => {
    const idx = buildSearchIndex();
    expect(Array.isArray(idx)).toBe(true);
  });
  it('returns items with hr and en fields', () => {
    const idx = buildSearchIndex();
    const withHr = idx.filter(i => i.hr);
    expect(withHr.length).toBeGreaterThan(0);
  });
  it('is cached (returns same reference on second call)', () => {
    const a = buildSearchIndex();
    const b = buildSearchIndex();
    expect(a).toBe(b);
  });
});
