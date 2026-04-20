import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { canRepairStreak, getRepairCost, repairStreak } from '../lib/streak';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function twoDaysAgoStr() {
  const d = new Date();
  d.setDate(d.getDate() - 2);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** streak.ts reads/writes the 'uStreak' key (same as data.jsx). */
function setStreak(count: number, last: string) {
  localStorage.setItem('uStreak', JSON.stringify({ count, last }));
}

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

// ─── canRepairStreak ──────────────────────────────────────────────────────────

describe('canRepairStreak', () => {
  it('returns false when no streak data exists', () => {
    expect(canRepairStreak()).toBe(false);
  });

  it('returns false when streak is active (count > 0)', () => {
    setStreak(5, todayStr());
    expect(canRepairStreak()).toBe(false);
  });

  it('returns false when streak is active with count > 0 and last is yesterday', () => {
    // Still alive — hasn't ticked today yet, but count > 0 means not broken
    setStreak(3, yesterdayStr());
    expect(canRepairStreak()).toBe(false);
  });

  it('returns true when count is 0 and last was yesterday (just broke)', () => {
    setStreak(0, yesterdayStr());
    expect(canRepairStreak()).toBe(true);
  });

  it('returns false when last was two or more days ago', () => {
    setStreak(0, twoDaysAgoStr());
    expect(canRepairStreak()).toBe(false);
  });

  it('returns false when already repaired today', () => {
    setStreak(0, yesterdayStr());
    // Mark repair as already used today
    localStorage.setItem('nh_streak_repair', JSON.stringify({ lastRepair: todayStr() }));
    expect(canRepairStreak()).toBe(false);
  });

  it('returns true when repair was used on a previous day (not today)', () => {
    setStreak(0, yesterdayStr());
    // Repair was used yesterday — should be available again today
    localStorage.setItem('nh_streak_repair', JSON.stringify({ lastRepair: twoDaysAgoStr() }));
    expect(canRepairStreak()).toBe(true);
  });
});

// ─── getRepairCost ────────────────────────────────────────────────────────────

describe('getRepairCost', () => {
  it('returns a non-negative number', () => {
    expect(getRepairCost()).toBeGreaterThanOrEqual(0);
  });

  it('returns 0 (free) for brand-new users (no lessons completed, no prior free repair)', () => {
    // No free-repair marker and no profile stats → lc = 0 → free repair
    expect(getRepairCost()).toBe(0);
  });

  it('returns 100 (XP_COST_REPAIR) once the free repair token is consumed', () => {
    localStorage.setItem('nh_used_free_repair', '1');
    expect(getRepairCost()).toBe(100);
  });
});

// ─── repairStreak ─────────────────────────────────────────────────────────────

describe('repairStreak', () => {
  it('returns ok: false when repair is not possible (active streak)', () => {
    setStreak(5, todayStr());
    const result = repairStreak(500);
    expect(result.ok).toBe(false);
  });

  it('returns ok: false when repair is not possible (already repaired today)', () => {
    setStreak(0, yesterdayStr());
    localStorage.setItem('nh_streak_repair', JSON.stringify({ lastRepair: todayStr() }));
    const result = repairStreak(500);
    expect(result.ok).toBe(false);
  });

  it('returns ok: false when XP is insufficient (paid repair)', () => {
    setStreak(0, yesterdayStr());
    localStorage.setItem('nh_used_free_repair', '1'); // no more free repair
    const result = repairStreak(50); // cost is 100, only have 50
    expect(result.ok).toBe(false);
    expect(result.reason).toContain('100 XP');
  });

  it('returns ok: true when repair is free (new user) and streak was broken yesterday', () => {
    setStreak(0, yesterdayStr());
    const result = repairStreak(0); // 0 XP is enough because cost is 0
    expect(result.ok).toBe(true);
    expect(result.xpCost).toBe(0);
  });

  it('returns ok: true when XP is sufficient (paid repair)', () => {
    setStreak(0, yesterdayStr());
    localStorage.setItem('nh_used_free_repair', '1'); // force paid repair
    const result = repairStreak(500);
    expect(result.ok).toBe(true);
    expect(result.xpCost).toBe(100);
  });

  it('updates uStreak to today after a successful repair', () => {
    setStreak(0, yesterdayStr());
    repairStreak(0);
    const stored = JSON.parse(localStorage.getItem('uStreak') || '{}');
    expect(stored.last).toBe(todayStr());
    expect(stored.count).toBeGreaterThanOrEqual(1);
  });

  it('marks free repair token as consumed after first use', () => {
    setStreak(0, yesterdayStr());
    repairStreak(0);
    expect(localStorage.getItem('nh_used_free_repair')).toBe('1');
  });

  it('prevents a second repair on the same day', () => {
    setStreak(0, yesterdayStr());
    repairStreak(0); // first repair succeeds
    setStreak(0, yesterdayStr()); // simulate broken again (edge case)
    const second = repairStreak(500);
    // already repaired today → cannot repair again
    expect(second.ok).toBe(false);
  });
});
