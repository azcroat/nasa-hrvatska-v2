/**
 * streakFreeze.ts — Streak freeze / streak protection system.
 *
 * Costs 50 XP to buy. Max 2 stored. Auto-applies when a streak would break
 * due to exactly one missed day (the day before yesterday).
 *
 * Uses the same 'uStreak' localStorage key ({ count, last }) that the core
 * streak utilities in streak.ts and data.jsx use.
 */

const FREEZE_KEY = 'nh_streak_freezes';
const FREEZE_COST = 50; // XP cost to purchase one freeze

export function getFreezesStored(): number {
  try {
    const parsed = parseInt(localStorage.getItem(FREEZE_KEY) || '0', 10);
    return Math.min(2, isNaN(parsed) ? 0 : parsed);
  } catch {
    return 0;
  }
}

interface PurchaseResult {
  ok: boolean;
  reason?: string;
  stored?: number;
}

export function purchaseFreeze(
  currentXP: number,
  setStats: (fn: (prev: Record<string, number>) => Record<string, number>) => void,
): PurchaseResult {
  const stored = getFreezesStored();
  if (stored >= 2) return { ok: false, reason: 'Already have maximum 2 freezes stored' };
  if (currentXP < FREEZE_COST)
    return { ok: false, reason: `Need ${FREEZE_COST} XP — you have ${currentXP}` };

  // Deduct XP via React state setter
  setStats((prev) => ({ ...prev, xp: Math.max(0, (prev.xp || 0) - FREEZE_COST) }));
  localStorage.setItem(FREEZE_KEY, String(stored + 1));
  return { ok: true, stored: stored + 1 };
}

interface StreakData {
  count: number;
  last: string;
}

interface FreezeResult {
  applied: boolean;
  streakData: StreakData;
  freezesRemaining?: number;
}

/**
 * Call this when checking whether a streak should break.
 * streakData = { count, last } where last is 'YYYY-MM-DD'.
 * Returns { applied: boolean, streakData, freezesRemaining? }.
 */
export function applyFreezeIfNeeded(streakData: StreakData): FreezeResult {
  if (!streakData?.count || streakData.count === 0) return { applied: false, streakData };

  // DST-safe date arithmetic using setDate
  function _dateStr(offsetDays: number): string {
    const d = new Date();
    if (offsetDays) d.setDate(d.getDate() + offsetDays);
    return (
      d.getFullYear() +
      '-' +
      String(d.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(d.getDate()).padStart(2, '0')
    );
  }

  const today = _dateStr(0);
  const yesterday = _dateStr(-1);
  const dayBeforeYesterday = _dateStr(-2);

  // Streak is active — no freeze needed
  if (streakData.last === today || streakData.last === yesterday) {
    return { applied: false, streakData };
  }

  // Only auto-apply for exactly one missed day
  const freezes = getFreezesStored();
  if (freezes > 0 && streakData.last === dayBeforeYesterday) {
    localStorage.setItem(FREEZE_KEY, String(freezes - 1));
    return {
      applied: true,
      freezesRemaining: freezes - 1,
      streakData: { ...streakData, last: yesterday }, // pretend user was active yesterday
    };
  }

  return { applied: false, streakData };
}

export const FREEZE_COST_XP = FREEZE_COST;
