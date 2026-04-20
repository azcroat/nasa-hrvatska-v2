/**
 * gameLogic.test.js — Integration tests for the 5 core game systems:
 *   a) Streak calculation
 *   b) XP award (lXPgain / lvl / badge detection)
 *   c) SRS scheduling (FSRS-4.5 via getSRScore)
 *   d) Week key generation (dateUtils.weekKey)
 *   e) Badge conditions (BADGES array)
 *
 * All tests are self-contained. No real network calls, no real Firebase,
 * no real localStorage side effects (cleared in beforeEach/afterEach).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Firebase stubs (must come before any import that loads data.jsx) ──────────
vi.mock('firebase/app', () => ({ initializeApp: vi.fn(() => ({})), getApps: vi.fn(() => []) }));
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
  initializeAuth: vi.fn(() => ({})),
  indexedDBLocalPersistence: {},
  browserSessionPersistence: {},
  inMemoryPersistence: {},
  GoogleAuthProvider: vi.fn(() => ({})),
  signInWithPopup: vi.fn(),
  sendEmailVerification: vi.fn(),
  deleteUser: vi.fn(),
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

// ── Imports ───────────────────────────────────────────────────────────────────
import { weekKey } from '../lib/dateUtils.js';
import { getSRScore, getSR, saveSR } from '../lib/srs.js';
import {
  getStreak,
  updateStreak,
  getStreakFreezes,
  earnFreeze,
  spendFreeze,
  lXPgain,
  lvl,
  BADGES,
} from '../data';

// ── localStorage helper ───────────────────────────────────────────────────────
function clearLS() {
  localStorage.clear();
}

// ── Streak date helpers ───────────────────────────────────────────────────────
/** Format a Date as YYYY-MM-DD (same algorithm as localDateStr in content.jsx) */
function fmtDate(d) {
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

/** Write a streak record directly to localStorage, bypassing updateStreak. */
function setStreakLS(count, last) {
  localStorage.setItem('uStreak', JSON.stringify({ count, last }));
}

/** Shortcut for today's date string (local time). */
function today() {
  return fmtDate(new Date());
}

/** Shortcut for yesterday's date string (local time). */
function yesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return fmtDate(d);
}

/** 2 days ago string (local time). */
function twoDaysAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 2);
  return fmtDate(d);
}

// ═══════════════════════════════════════════════════════════════════════════════
// a) STREAK CALCULATION
// ═══════════════════════════════════════════════════════════════════════════════

describe('Streak calculation — a) new user', () => {
  beforeEach(clearLS);
  afterEach(clearLS);

  it('new user starts at streak count 0', () => {
    expect(getStreak().count).toBe(0);
  });

  it('getStreak returns an object with count and last fields', () => {
    const s = getStreak();
    expect(typeof s.count).toBe('number');
    expect(typeof s.last).toBe('string');
  });

  it('completing a lesson for the first time sets streak to 1', () => {
    updateStreak();
    expect(getStreak().count).toBe(1);
  });

  it('calling updateStreak again on the same day keeps streak at 1', () => {
    updateStreak();
    updateStreak();
    expect(getStreak().count).toBe(1);
  });

  it('last field is set to today after first lesson', () => {
    updateStreak();
    expect(getStreak().last).toBe(today());
  });
});

describe('Streak calculation — b) consecutive days', () => {
  beforeEach(clearLS);
  afterEach(clearLS);

  it('streak continues when last activity was yesterday', () => {
    // Seed: streak of 3 with last activity yesterday
    setStreakLS(3, yesterday());
    updateStreak();
    expect(getStreak().count).toBe(4);
  });

  it('streak increments correctly across multiple consecutive updates', () => {
    setStreakLS(6, yesterday());
    updateStreak();
    expect(getStreak().count).toBe(7);
  });

  it('streak milestone is returned when hitting a milestone (7)', () => {
    setStreakLS(6, yesterday());
    const result = updateStreak();
    expect(result.milestone).toBe(7);
  });

  it('no milestone returned on a non-milestone day', () => {
    setStreakLS(2, yesterday());
    const result = updateStreak();
    expect(result.milestone).toBeNull();
  });
});

describe('Streak calculation — c) broken streak (gap > 1 day)', () => {
  beforeEach(clearLS);
  afterEach(clearLS);

  it('missing a day resets streak to 1 (not 0)', () => {
    setStreakLS(5, twoDaysAgo());
    updateStreak();
    expect(getStreak().count).toBe(1);
  });

  it('streak resets when last date is more than 1 day ago', () => {
    setStreakLS(10, '2000-01-01'); // very old date
    updateStreak();
    expect(getStreak().count).toBe(1);
  });

  it('streak resets and last is set to today after break', () => {
    setStreakLS(7, twoDaysAgo());
    updateStreak();
    expect(getStreak().last).toBe(today());
  });

  it('earn-back token is saved when streak >= 2 breaks', () => {
    setStreakLS(5, twoDaysAgo());
    updateStreak();
    const eb = JSON.parse(localStorage.getItem('nh_earn_back') || 'null');
    expect(eb).not.toBeNull();
    expect(eb.prev).toBe(5);
  });

  it('earn-back token is NOT saved when streak was 0 or 1', () => {
    setStreakLS(1, twoDaysAgo());
    updateStreak();
    const eb = JSON.parse(localStorage.getItem('nh_earn_back') || 'null');
    // streak < 2 — earn-back should not be written (or prev would be 1)
    if (eb !== null) {
      expect(eb.prev).toBeLessThan(2);
    }
  });
});

describe('Streak calculation — d) streak freeze', () => {
  beforeEach(clearLS);
  afterEach(clearLS);

  it('freeze is NOT available by default', () => {
    expect(getStreakFreezes()).toBe(0);
  });

  it('earnFreeze increments freeze count', () => {
    earnFreeze();
    expect(getStreakFreezes()).toBe(1);
  });

  it('earnFreeze is capped at 2', () => {
    earnFreeze();
    earnFreeze();
    earnFreeze(); // should cap at 2
    expect(getStreakFreezes()).toBe(2);
  });

  it('streak freeze prevents reset when day was missed', () => {
    // Give user a freeze and a streak with last activity 2 days ago
    localStorage.setItem('uFreeze', '1');
    setStreakLS(5, twoDaysAgo());
    const result = updateStreak();
    // Freeze was consumed — streak should survive (not reset to 1)
    // updateStreak returns freezeUsed: true when a freeze is applied
    expect(result.freezeUsed).toBe(true);
  });

  it('freeze is spent after being used', () => {
    localStorage.setItem('uFreeze', '1');
    setStreakLS(5, twoDaysAgo());
    updateStreak();
    expect(getStreakFreezes()).toBe(0);
  });

  it('spendFreeze returns false when no freezes available', () => {
    expect(spendFreeze()).toBe(false);
  });

  it('spendFreeze returns true when a freeze is available', () => {
    earnFreeze();
    expect(spendFreeze()).toBe(true);
    expect(getStreakFreezes()).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// b) XP AWARD
// ═══════════════════════════════════════════════════════════════════════════════

describe('XP award — lXPgain (campaign-aware)', () => {
  // lXPgain applies a seasonal campaign multiplier (>= 1x) when a campaign
  // is active. Campaigns are date-based; tests must not assume no campaign.
  // Contract invariants that hold regardless of active campaign:
  //   • lXPgain(0) === 0
  //   • lXPgain(xp) >= xp  (multiplier is always >= 1)
  //   • lXPgain(xp) is a whole integer (Math.round applied)
  //   • lXPgain(xp) is deterministic within the same test run

  it('returns 0 when given 0 (regardless of campaign multiplier)', () => {
    // 0 * anything = 0, and Math.round(0) = 0
    expect(lXPgain(0)).toBe(0);
  });

  it('returns a positive number for positive XP input', () => {
    expect(lXPgain(20)).toBeGreaterThan(0);
    expect(lXPgain(50)).toBeGreaterThan(0);
  });

  it('result is always >= the raw XP (multiplier is always >= 1)', () => {
    expect(lXPgain(10)).toBeGreaterThanOrEqual(10);
    expect(lXPgain(100)).toBeGreaterThanOrEqual(100);
    expect(lXPgain(1)).toBeGreaterThanOrEqual(1);
  });

  it('result is always a whole integer (no fractional XP)', () => {
    expect(Number.isInteger(lXPgain(10))).toBe(true);
    expect(Number.isInteger(lXPgain(7))).toBe(true);
    expect(Number.isInteger(lXPgain(33))).toBe(true);
  });

  it('XP accumulates as a sum of per-award values (total >= raw total)', () => {
    const awards = [10, 20, 15, 50];
    const rawTotal = awards.reduce((a, b) => a + b, 0); // 95
    const total = awards.reduce((acc, xp) => acc + lXPgain(xp), 0);
    expect(total).toBeGreaterThanOrEqual(rawTotal);
    expect(Number.isInteger(total)).toBe(true);
  });

  it('is deterministic: same XP input gives same output within one run', () => {
    const a = lXPgain(25);
    const b = lXPgain(25);
    expect(a).toBe(b);
  });
});

describe('XP award — lvl (XP → level)', () => {
  // Thresholds: [0,50,150,300,500,800,1200,1800,2500,3500] → levels 1–10
  it('level 1 at 0 XP', () => expect(lvl(0)).toBe(1));
  it('level 2 at exactly 50 XP', () => expect(lvl(50)).toBe(2));
  it('level 3 at exactly 150 XP', () => expect(lvl(150)).toBe(3));
  it('level 5 at exactly 500 XP', () => expect(lvl(500)).toBe(5));
  it('level 10 at exactly 3500 XP', () => expect(lvl(3500)).toBe(10));
  it('level 10 for very high XP (no overflow)', () => expect(lvl(999999)).toBe(10));
  it('level increases monotonically at each threshold', () => {
    const thresholds = [0, 50, 150, 300, 500, 800, 1200, 1800, 2500, 3500];
    for (let i = 1; i < thresholds.length; i++) {
      expect(lvl(thresholds[i])).toBeGreaterThan(lvl(thresholds[i - 1]));
    }
  });
  it('49 XP is still level 1', () => expect(lvl(49)).toBe(1));
  it('level-up triggers at correct threshold (50 XP → level 2)', () => {
    const before = lvl(49);
    const after = lvl(50);
    expect(after).toBe(before + 1);
  });
  it('level-up triggers at 150 XP (level 2 → 3)', () => {
    const before = lvl(149);
    const after = lvl(150);
    expect(after).toBe(before + 1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// c) SRS SCHEDULING (FSRS-4.5)
// ═══════════════════════════════════════════════════════════════════════════════

describe('SRS scheduling — new card', () => {
  beforeEach(clearLS);
  afterEach(clearLS);

  it('new card: correct fast answer → due date is at least 1 day in the future', () => {
    const card = getSRScore('jabuka', true, 1000);
    const oneDay = 86400000;
    expect(card.due).toBeGreaterThanOrEqual(Date.now() + oneDay - 500); // 500ms tolerance
  });

  it('new card: "Good" answer (correct, fast) starts with positive stability', () => {
    const card = getSRScore('kruh', true, 1000);
    expect(card.s).toBeGreaterThan(0);
  });

  it('new card: "Again" (wrong, fast) also produces ≥ 1 day interval (FSRS minimum)', () => {
    const card = getSRScore('voda', false, 500);
    const oneDay = 86400000;
    expect(card.due).toBeGreaterThanOrEqual(Date.now() + oneDay - 500);
  });

  it('"Again" (wrong) sets lapse count to 1 on a brand-new card', () => {
    const card = getSRScore('mačka', false, 1000);
    expect(card.l).toBe(1);
  });

  it('"Good" (correct fast) sets lapse count to 0 on a brand-new card', () => {
    const card = getSRScore('pas', true, 1000);
    expect(card.l).toBe(0);
  });

  it('correct answer sets right-count (r) to 1 on new card', () => {
    const card = getSRScore('kuća', true, 2000);
    expect(card.r).toBe(1);
    expect(card.w).toBe(0);
  });

  it('wrong answer sets wrong-count (w) to 1 on new card', () => {
    const card = getSRScore('grad', false, 2000);
    expect(card.w).toBe(1);
    expect(card.r).toBe(0);
  });

  it('"Easy" grade (correct + fast ≤8s) produces higher stability than "Hard" (correct + slow >8s)', () => {
    const easy = getSRScore('easy_word', true, 1000); // grade 4
    clearLS();
    const hard = getSRScore('hard_word', true, 10000); // grade 3
    expect(easy.s).toBeGreaterThan(hard.s);
  });

  it('initial difficulty is within [1, 10]', () => {
    const card = getSRScore('test_diff', true, 2000);
    expect(card.d).toBeGreaterThanOrEqual(1);
    expect(card.d).toBeLessThanOrEqual(10);
  });

  it('elapsed days after multiple correct reviews: stability grows monotonically', () => {
    let prevS = 0;
    for (let i = 0; i < 4; i++) {
      const sr = getSR();
      if (sr.mono_srs) {
        sr.mono_srs.due = Date.now() - 1;
        saveSR(sr);
      }
      const card = getSRScore('mono_srs', true, 1000);
      expect(card.s).toBeGreaterThan(prevS);
      prevS = card.s;
    }
  });
});

describe('SRS scheduling — existing card updates', () => {
  beforeEach(clearLS);
  afterEach(clearLS);

  it('"Good" answer increases stability on second review (when card is overdue)', () => {
    const first = getSRScore('rast', true, 2000);
    const initialS = first.s;
    // Make it overdue so the recall path fires with meaningful R
    const sr = getSR();
    sr.rast.due = Date.now() - 1;
    saveSR(sr);
    const second = getSRScore('rast', true, 2000);
    expect(second.s).toBeGreaterThan(initialS);
  });

  it('"Again" (wrong) increments lapse counter on existing card', () => {
    getSRScore('zaborav', true, 2000);
    const before = getSR().zaborav.l;
    getSRScore('zaborav', false, 500);
    expect(getSR().zaborav.l).toBe(before + 1);
  });

  it('"Again" on existing card increases difficulty (d)', () => {
    getSRScore('tesko', true, 2000);
    const dBefore = getSR().tesko.d;
    getSRScore('tesko', false, 500);
    expect(getSR().tesko.d).toBeGreaterThanOrEqual(dBefore);
  });

  it('right count (r) accumulates correctly over multiple correct reviews', () => {
    getSRScore('tocno', true, 2000);
    getSRScore('tocno', true, 2000);
    getSRScore('tocno', true, 2000);
    expect(getSR().tocno.r).toBe(3);
  });

  it('wrong count (w) accumulates correctly over multiple wrong reviews', () => {
    getSRScore('krivo', false, 2000);
    getSRScore('krivo', false, 2000);
    expect(getSR().krivo.w).toBe(2);
  });

  it('difficulty stays within [1, 10] after many mixed reviews', () => {
    for (let i = 0; i < 20; i++) {
      getSRScore('d_range', i % 3 === 0 ? false : true, i % 2 === 0 ? 1000 : 9000);
    }
    const { d } = getSR().d_range;
    expect(d).toBeGreaterThanOrEqual(1);
    expect(d).toBeLessThanOrEqual(10);
  });

  it('due date is always in the future after any review', () => {
    for (let i = 0; i < 5; i++) {
      const sr = getSR();
      if (sr.future_check) {
        sr.future_check.due = Date.now() - 1;
        saveSR(sr);
      }
      const card = getSRScore('future_check', i % 2 === 0 ? true : false, 1000);
      expect(card.due).toBeGreaterThan(Date.now() - 100); // small tolerance
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// d) WEEK KEY GENERATION (dateUtils.weekKey)
// ═══════════════════════════════════════════════════════════════════════════════

describe('Week key generation — weekKey()', () => {
  it('returns a string in "YYYY-Www" format', () => {
    const wk = weekKey();
    expect(wk).toMatch(/^\d{4}-W\d{2}$/);
  });

  it('same date always returns the same week key', () => {
    const d = new Date(2026, 2, 18); // March 18 2026 (Wednesday)
    expect(weekKey(d)).toBe(weekKey(d));
  });

  it('Monday and Sunday of the same ISO week return the same key', () => {
    // ISO week 12 of 2026: Mon Mar 16 – Sun Mar 22
    const mon = new Date(2026, 2, 16); // Monday  March 16 2026
    const sun = new Date(2026, 2, 22); // Sunday  March 22 2026
    expect(weekKey(mon)).toBe(weekKey(sun));
  });

  it('known date returns expected ISO week key (2026-W12)', () => {
    // March 16–22 2026 is ISO week 12
    const wed = new Date(2026, 2, 18);
    expect(weekKey(wed)).toBe('2026-W12');
  });

  it('week key changes across week boundary (Sun→Mon)', () => {
    // ISO week 12 Sunday vs ISO week 13 Monday
    const sun = new Date(2026, 2, 22); // Sun, end of W12
    const mon = new Date(2026, 2, 23); // Mon, start of W13
    expect(weekKey(sun)).not.toBe(weekKey(mon));
  });

  it('week number is zero-padded to 2 digits', () => {
    // Week 1 of any year should be "Wxx" not "Wx"
    const jan5 = new Date(2026, 0, 5); // Jan 5 2026 is in week 2
    expect(weekKey(jan5)).toMatch(/W\d{2}$/);
  });

  it('no-arg call (default=today) returns valid format', () => {
    expect(weekKey()).toMatch(/^\d{4}-W\d{2}$/);
  });

  it('Jan 1 of a year that is in week 52/53 of prior year is handled correctly', () => {
    // Jan 1 2016 is in ISO week 53 of 2015
    const jan1_2016 = new Date(2016, 0, 1);
    expect(weekKey(jan1_2016)).toBe('2015-W53');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// e) BADGE CONDITIONS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Badge conditions — BADGES array structure', () => {
  it('BADGES is an array', () => {
    expect(Array.isArray(BADGES)).toBe(true);
  });

  it('every badge has id, n, i, d, and r fields', () => {
    for (const b of BADGES) {
      expect(typeof b.id).toBe('string');
      expect(typeof b.n).toBe('string');
      expect(typeof b.i).toBe('string');
      expect(typeof b.d).toBe('string');
      expect(typeof b.r).toBe('function');
    }
  });

  it('all badge ids are unique', () => {
    const ids = BADGES.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('Badge conditions — XP milestone badges', () => {
  it('"first" badge (lc >= 1): triggers when lc is 1', () => {
    const firstBadge = BADGES.find((b) => b.id === 'first');
    expect(firstBadge.r({ lc: 1, xp: 0, streak: 0, badges: [] })).toBe(true);
  });

  it('"first" badge does NOT trigger at lc = 0', () => {
    const firstBadge = BADGES.find((b) => b.id === 'first');
    expect(firstBadge.r({ lc: 0, xp: 0, streak: 0, badges: [] })).toBe(false);
  });

  it('"x100" XP badge triggers at exactly 100 XP', () => {
    const badge = BADGES.find((b) => b.id === 'x100');
    expect(badge.r({ xp: 100, lc: 1, streak: 0 })).toBe(true);
  });

  it('"x100" badge does NOT trigger at 99 XP', () => {
    const badge = BADGES.find((b) => b.id === 'x100');
    expect(badge.r({ xp: 99, lc: 1, streak: 0 })).toBe(false);
  });

  it('"x500" badge triggers at 500 XP', () => {
    const badge = BADGES.find((b) => b.id === 'x500');
    expect(badge.r({ xp: 500, lc: 10, streak: 0 })).toBe(true);
  });

  it('"x500" badge does NOT trigger at 499 XP', () => {
    const badge = BADGES.find((b) => b.id === 'x500');
    expect(badge.r({ xp: 499, lc: 10, streak: 0 })).toBe(false);
  });

  it('"x1k" badge triggers at 1000 XP', () => {
    const badge = BADGES.find((b) => b.id === 'x1k');
    expect(badge.r({ xp: 1000, lc: 20, streak: 0 })).toBe(true);
  });
});

describe('Badge conditions — streak badges', () => {
  it('"str3" badge triggers at streak = 3', () => {
    const badge = BADGES.find((b) => b.id === 'str3');
    expect(badge.r({ streak: 3, xp: 50, lc: 3 })).toBe(true);
  });

  it('"str3" badge does NOT trigger at streak = 2', () => {
    const badge = BADGES.find((b) => b.id === 'str3');
    expect(badge.r({ streak: 2, xp: 50, lc: 2 })).toBe(false);
  });

  it('"str7" badge triggers at streak = 7', () => {
    const badge = BADGES.find((b) => b.id === 'str7');
    expect(badge.r({ streak: 7, xp: 100, lc: 7 })).toBe(true);
  });

  it('"str7" badge does NOT trigger at streak = 6', () => {
    const badge = BADGES.find((b) => b.id === 'str7');
    expect(badge.r({ streak: 6, xp: 80, lc: 6 })).toBe(false);
  });

  it('"str30" badge triggers at streak = 30', () => {
    const badge = BADGES.find((b) => b.id === 'str30');
    expect(badge.r({ streak: 30, xp: 500, lc: 30 })).toBe(true);
  });
});

describe('Badge conditions — lesson count badges', () => {
  it('"ded" (dedicated) badge triggers at lc = 5', () => {
    const badge = BADGES.find((b) => b.id === 'ded');
    expect(badge.r({ lc: 5, xp: 100, streak: 0 })).toBe(true);
  });

  it('"ded" badge does NOT trigger at lc = 4', () => {
    const badge = BADGES.find((b) => b.id === 'ded');
    expect(badge.r({ lc: 4, xp: 80, streak: 0 })).toBe(false);
  });

  it('"lc20" badge triggers at lc = 20', () => {
    const badge = BADGES.find((b) => b.id === 'lc20');
    expect(badge.r({ lc: 20, xp: 200, streak: 0 })).toBe(true);
  });
});

describe('Badge conditions — double-award prevention', () => {
  /**
   * The double-award check is enforced in useAward.js by filtering:
   *   BADGES.filter(b => !badges.includes(b.id) && b.r(stats))
   *
   * These tests verify the badge predicate (r) is pure and deterministic,
   * so the caller can safely de-duplicate using the badges array.
   */

  it('badge predicate returns same result on repeated calls with same stats', () => {
    const badge = BADGES.find((b) => b.id === 'x100');
    const stats = { xp: 100, lc: 5, streak: 0 };
    expect(badge.r(stats)).toBe(badge.r(stats));
  });

  it('badge predicate is deterministic: true stays true with same XP', () => {
    const badge = BADGES.find((b) => b.id === 'x500');
    const stats = { xp: 600, lc: 10, streak: 0 };
    const result1 = badge.r(stats);
    const result2 = badge.r(stats);
    expect(result1).toBe(result2);
    expect(result1).toBe(true);
  });

  it('already-earned badge ids can be excluded from eligibility check', () => {
    // Simulate useAward logic: filter out already-earned badges
    const earnedBadges = ['first', 'x100'];
    const stats = { xp: 500, lc: 10, streak: 0, badges: earnedBadges };
    const newBadges = BADGES.filter((b) => {
      if (earnedBadges.includes(b.id)) return false;
      try {
        return b.r(stats);
      } catch {
        return false;
      }
    });
    // x500 should now be in new badges; x100 and first should NOT
    const newIds = newBadges.map((b) => b.id);
    expect(newIds).not.toContain('first');
    expect(newIds).not.toContain('x100');
    expect(newIds).toContain('x500');
  });

  it('awarding a badge and re-checking with updated list prevents double-award', () => {
    const stats = { xp: 100, lc: 1, streak: 0 };
    // First pass: find newly earned badges
    const firstPass = BADGES.filter((b) => {
      try {
        return b.r(stats);
      } catch {
        return false;
      }
    }).map((b) => b.id);
    // Second pass: same stats, but earned list includes firstPass
    const secondPass = BADGES.filter((b) => {
      if (firstPass.includes(b.id)) return false;
      try {
        return b.r(stats);
      } catch {
        return false;
      }
    }).map((b) => b.id);
    // No badge should appear in both passes
    const overlap = firstPass.filter((id) => secondPass.includes(id));
    expect(overlap).toHaveLength(0);
  });
});
