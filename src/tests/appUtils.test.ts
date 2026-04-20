import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  lvl,
  lXP,
  nXP,
  getDailyXPGoal,
  DAILY_XP_GOAL,
  getStreak,
  updateStreak,
  getStreakFreezes,
  earnFreeze,
  spendFreeze,
  getCultureStats,
  incrementCulture,
  recordJourneyMilestone,
  getJourneyMilestones,
  getStreakEarnBack,
  applyStreakEarnBack,
} from '../lib/appUtils';

beforeEach(() => localStorage.clear());
afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

// ─── lvl — level from XP ──────────────────────────────────────────────────────

describe('lvl — level from XP', () => {
  it('level 1 at 0 XP', () => {
    expect(lvl(0)).toBe(1);
  });

  it('level 1 at negative XP', () => {
    expect(lvl(-100)).toBe(1);
  });

  it('level 2 at exactly 50 XP (first threshold)', () => {
    expect(lvl(50)).toBe(2);
  });

  it('level 3 at exactly 150 XP', () => {
    expect(lvl(150)).toBe(3);
  });

  it('level 10 at exactly 3500 XP (max threshold)', () => {
    expect(lvl(3500)).toBe(10);
  });

  it('level 10 well beyond 3500 XP', () => {
    expect(lvl(99999)).toBe(10);
  });

  it('level increases with XP', () => {
    expect(lvl(100)).toBeGreaterThan(lvl(0));
    expect(lvl(1000)).toBeGreaterThan(lvl(100));
    expect(lvl(10000)).toBeGreaterThan(lvl(1000));
  });

  it('returns integer', () => {
    expect(Number.isInteger(lvl(123))).toBe(true);
    expect(Number.isInteger(lvl(0))).toBe(true);
    expect(Number.isInteger(lvl(9999))).toBe(true);
  });

  it('just below a threshold stays at lower level', () => {
    expect(lvl(49)).toBe(1); // 50 is threshold for level 2
    expect(lvl(149)).toBe(2); // 150 is threshold for level 3
  });
});

// ─── lXP — cumulative XP needed to reach a level ─────────────────────────────

describe('lXP — cumulative XP to reach level', () => {
  it('lXP(1) is 0', () => {
    expect(lXP(1)).toBe(0);
  });

  it('lXP(2) is 50', () => {
    expect(lXP(2)).toBe(50);
  });

  it('lXP(3) is 150', () => {
    expect(lXP(3)).toBe(150);
  });

  it('lXP(10) is 3500 (last defined threshold)', () => {
    expect(lXP(10)).toBe(3500);
  });

  it('XP needed increases monotonically with level', () => {
    expect(lXP(2)).toBeGreaterThan(lXP(1));
    expect(lXP(5)).toBeGreaterThan(lXP(3));
    expect(lXP(10)).toBeGreaterThan(lXP(7));
  });

  it('lvl(lXP(n)) round-trip: reaching lXP(n) XP puts you at level n', () => {
    // The threshold arrays are designed so that having exactly lXP(n) XP => lvl = n
    for (const level of [2, 3, 4, 5, 6, 7, 8, 9, 10]) {
      expect(lvl(lXP(level))).toBe(level);
    }
  });
});

// ─── nXP — XP to fill current level bar ──────────────────────────────────────

describe('nXP — XP width of a level', () => {
  it('nXP(1) is 50 (XP from level 1 to level 2)', () => {
    expect(nXP(1)).toBe(50);
  });

  it('nXP(2) is 150', () => {
    // From the nXP array: [0, 50, 150, 300, 500, ...]
    expect(nXP(2)).toBe(150);
  });

  it('all nXP values are positive', () => {
    for (let l = 1; l <= 9; l++) {
      expect(nXP(l)).toBeGreaterThan(0);
    }
  });

  it('nXP(1) equals lXP(2) - lXP(1)', () => {
    // This holds specifically for level 1
    expect(nXP(1)).toBe(lXP(2) - lXP(1));
  });
});

// ─── getDailyXPGoal ───────────────────────────────────────────────────────────

describe('getDailyXPGoal', () => {
  it('returns DAILY_XP_GOAL (50) when nothing is stored', () => {
    expect(getDailyXPGoal()).toBe(DAILY_XP_GOAL);
    expect(getDailyXPGoal()).toBe(50);
  });

  it('returns DAILY_XP_GOAL when stored value is 0', () => {
    localStorage.setItem('nh_daily_goal_xp', '0');
    expect(getDailyXPGoal()).toBe(DAILY_XP_GOAL);
  });

  it('respects a custom positive goal from localStorage', () => {
    localStorage.setItem('nh_daily_goal_xp', '100');
    expect(getDailyXPGoal()).toBe(100);
  });

  it('respects another custom goal value (20)', () => {
    localStorage.setItem('nh_daily_goal_xp', '20');
    expect(getDailyXPGoal()).toBe(20);
  });

  it('returns a positive number in all cases', () => {
    expect(getDailyXPGoal()).toBeGreaterThan(0);
    localStorage.setItem('nh_daily_goal_xp', '200');
    expect(getDailyXPGoal()).toBeGreaterThan(0);
  });
});

// ─── getStreak + updateStreak ─────────────────────────────────────────────────

describe('getStreak', () => {
  it('returns count 0 and empty last when no data', () => {
    const streak = getStreak();
    expect(streak.count).toBe(0);
    expect(streak.last).toBe('');
  });

  it('reads previously stored streak correctly', () => {
    localStorage.setItem('uStreak', JSON.stringify({ count: 7, last: '2026-04-10' }));
    const streak = getStreak();
    expect(streak.count).toBe(7);
    expect(streak.last).toBe('2026-04-10');
  });
});

describe('updateStreak', () => {
  it('sets last to the provided todayOverride date', () => {
    const result = updateStreak('2026-04-19');
    expect(result.last).toBe('2026-04-19');
  });

  it('calling updateStreak twice on the same day does not double-increment count', () => {
    updateStreak('2026-04-19');
    const first = getStreak().count;
    updateStreak('2026-04-19');
    const second = getStreak().count;
    expect(second).toBe(first);
  });

  it('increments streak when called on consecutive days', () => {
    localStorage.setItem('uStreak', JSON.stringify({ count: 3, last: '2026-04-18' }));
    const result = updateStreak('2026-04-19');
    expect(result.count).toBe(4);
    expect(result.last).toBe('2026-04-19');
  });

  it('returns milestone when streak hits 7', () => {
    localStorage.setItem('uStreak', JSON.stringify({ count: 6, last: '2026-04-18' }));
    const result = updateStreak('2026-04-19');
    expect(result.count).toBe(7);
    expect(result.milestone).toBe(7);
  });

  it('returns milestone null when no milestone is hit', () => {
    localStorage.setItem('uStreak', JSON.stringify({ count: 2, last: '2026-04-18' }));
    const result = updateStreak('2026-04-19');
    expect(result.milestone).toBeNull();
  });

  it('resets count to 1 when streak is broken (gap > 1 day, no freeze)', () => {
    // Two days ago → gap of 2 calendar days → count resets, but a freeze could bridge exactly 2 days
    // To be safe: set gap to 3 days so no freeze can save it
    localStorage.setItem('uStreak', JSON.stringify({ count: 10, last: '2026-04-15' }));
    const result = updateStreak('2026-04-19'); // 4-day gap, freeze cannot help
    expect(result.count).toBe(1);
    expect(result.last).toBe('2026-04-19');
  });

  it('returns milestone 30 when streak hits 30', () => {
    localStorage.setItem('uStreak', JSON.stringify({ count: 29, last: '2026-04-18' }));
    const result = updateStreak('2026-04-19');
    expect(result.count).toBe(30);
    expect(result.milestone).toBe(30);
  });

  it('persists updated streak to uStreak localStorage key', () => {
    localStorage.setItem('uStreak', JSON.stringify({ count: 1, last: '2026-04-18' }));
    updateStreak('2026-04-19');
    const stored = JSON.parse(localStorage.getItem('uStreak') || '{}');
    expect(stored.count).toBe(2);
    expect(stored.last).toBe('2026-04-19');
  });
});

// ─── getStreakFreezes + earnFreeze + spendFreeze ───────────────────────────────

describe('getStreakFreezes', () => {
  it('returns 0 when no freezes stored', () => {
    expect(getStreakFreezes()).toBe(0);
  });

  it('reads freeze count from uFreeze key', () => {
    localStorage.setItem('uFreeze', '2');
    expect(getStreakFreezes()).toBe(2);
  });
});

describe('earnFreeze', () => {
  it('increments freeze count from 0 to 1', () => {
    earnFreeze();
    expect(getStreakFreezes()).toBe(1);
  });

  it('increments freeze count from 1 to 2', () => {
    earnFreeze();
    earnFreeze();
    expect(getStreakFreezes()).toBe(2);
  });

  it('caps at 2 (maximum freeze count)', () => {
    earnFreeze();
    earnFreeze();
    earnFreeze(); // third call — should still be 2
    expect(getStreakFreezes()).toBe(2);
  });
});

describe('spendFreeze', () => {
  it('returns false when no freezes available', () => {
    expect(spendFreeze()).toBe(false);
  });

  it('returns true when freeze is available and decrements count', () => {
    earnFreeze();
    earnFreeze();
    expect(spendFreeze()).toBe(true);
    expect(getStreakFreezes()).toBe(1);
  });

  it('can spend the last freeze and reach 0', () => {
    earnFreeze();
    expect(spendFreeze()).toBe(true);
    expect(getStreakFreezes()).toBe(0);
  });

  it('returns false after all freezes are spent', () => {
    earnFreeze();
    spendFreeze(); // now at 0
    expect(spendFreeze()).toBe(false);
  });
});

// ─── getCultureStats + incrementCulture ──────────────────────────────────────

describe('getCultureStats', () => {
  it('returns empty object when nothing stored', () => {
    expect(getCultureStats()).toEqual({});
  });

  it('returns stored culture stats object', () => {
    localStorage.setItem('nh_culture', JSON.stringify({ bakaCnt: 3, cityCnt: 5 }));
    expect(getCultureStats()).toEqual({ bakaCnt: 3, cityCnt: 5 });
  });

  it('returns empty object on corrupted JSON', () => {
    localStorage.setItem('nh_culture', 'INVALID{{{');
    expect(getCultureStats()).toEqual({});
  });
});

describe('incrementCulture', () => {
  it('increments a new key from 0 to 1', () => {
    expect(incrementCulture('bakaCnt')).toBe(1);
  });

  it('increments an existing key', () => {
    localStorage.setItem('nh_culture', JSON.stringify({ bakaCnt: 2 }));
    expect(incrementCulture('bakaCnt')).toBe(3);
  });

  it('persists the update to localStorage', () => {
    incrementCulture('cityCnt');
    incrementCulture('cityCnt');
    const stored = JSON.parse(localStorage.getItem('nh_culture') || '{}');
    expect(stored.cityCnt).toBe(2);
  });

  it('multiple different keys are independent', () => {
    incrementCulture('bakaCnt');
    incrementCulture('mediaCnt');
    const stats = getCultureStats();
    expect(stats.bakaCnt).toBe(1);
    expect(stats.mediaCnt).toBe(1);
  });
});

// ─── recordJourneyMilestone + getJourneyMilestones ────────────────────────────

describe('recordJourneyMilestone + getJourneyMilestones', () => {
  it('records a new milestone', () => {
    recordJourneyMilestone('first_lesson');
    const milestones = getJourneyMilestones();
    expect(milestones).toHaveLength(1);
    expect(milestones[0].type).toBe('first_lesson');
    expect(typeof milestones[0].date).toBe('string');
  });

  it('does not add duplicate non-repeatable milestone', () => {
    recordJourneyMilestone('first_lesson');
    recordJourneyMilestone('first_lesson');
    expect(getJourneyMilestones()).toHaveLength(1);
  });

  it('allows repeatable milestones with allowRepeat=true', () => {
    recordJourneyMilestone('daily_bonus', { allowRepeat: true });
    recordJourneyMilestone('daily_bonus', { allowRepeat: true });
    expect(getJourneyMilestones()).toHaveLength(2);
  });

  it('stores additional meta fields', () => {
    recordJourneyMilestone('level_up', { level: 5 });
    const milestones = getJourneyMilestones();
    expect((milestones[0] as Record<string, unknown>).level).toBe(5);
  });

  it('getJourneyMilestones returns empty array when nothing stored', () => {
    expect(getJourneyMilestones()).toEqual([]);
  });

  it('returns empty array on corrupted data', () => {
    localStorage.setItem('nh_journey', 'INVALID{{{');
    expect(getJourneyMilestones()).toEqual([]);
  });
});

// ─── getStreakEarnBack + applyStreakEarnBack ───────────────────────────────────

describe('getStreakEarnBack', () => {
  it('returns null when nothing stored', () => {
    expect(getStreakEarnBack()).toBeNull();
  });

  it('returns null when earn_back date is older than yesterday', () => {
    localStorage.setItem('nh_earn_back', JSON.stringify({ prev: 10, date: '2020-01-01', lc: 2 }));
    expect(getStreakEarnBack()).toBeNull();
  });

  it('returns the data when date is today', () => {
    const today = new Date();
    const todayStr =
      today.getFullYear() +
      '-' +
      String(today.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(today.getDate()).padStart(2, '0');
    localStorage.setItem('nh_earn_back', JSON.stringify({ prev: 5, date: todayStr, lc: 2 }));
    const result = getStreakEarnBack();
    expect(result).not.toBeNull();
    expect(result!.prev).toBe(5);
  });
});

describe('applyStreakEarnBack', () => {
  it('returns 0 when no earn_back data stored', () => {
    expect(applyStreakEarnBack()).toBe(0);
  });

  it('returns 0 when earn_back lc < 2', () => {
    const today = new Date();
    const todayStr =
      today.getFullYear() +
      '-' +
      String(today.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(today.getDate()).padStart(2, '0');
    localStorage.setItem('nh_earn_back', JSON.stringify({ prev: 10, date: todayStr, lc: 1 }));
    expect(applyStreakEarnBack()).toBe(0);
  });

  it('applies the streak and returns the previous count', () => {
    const today = new Date();
    const todayStr =
      today.getFullYear() +
      '-' +
      String(today.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(today.getDate()).padStart(2, '0');
    localStorage.setItem('nh_earn_back', JSON.stringify({ prev: 15, date: todayStr, lc: 3 }));
    const result = applyStreakEarnBack();
    expect(result).toBe(15);
    expect(getStreak().count).toBe(15);
    expect(localStorage.getItem('nh_earn_back')).toBeNull();
  });
});
