/**
 * streak.ts — Streak repair (Streak Insurance) utilities.
 *
 * Augments the core streak logic in src/data/content.jsx without touching it.
 * Reads/writes the same `uStreak` localStorage key ({count, last}) that
 * getStreak() / updateStreak() in data.jsx use, so everything stays consistent.
 */

const STREAK_REPAIR_KEY = 'nh_streak_repair';
const XP_COST_REPAIR    = 100;      // XP cost to repair one missed day
const FREE_REPAIR_KEY   = 'nh_used_free_repair'; // one-time free repair for new users

function _localDateStr(): string {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function _yesterdayStr(): string {
  // Use setDate arithmetic — DST-safe (avoids the 23/25-hour edge case of Date.now()-86400000)
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

/**
 * Returns true if the user can repair their streak right now.
 * Conditions:
 *   1. Streak is currently 0 (broken).
 *   2. The streak was last active YESTERDAY (broke exactly 1 day ago).
 *   3. Has not already repaired today.
 */
export function canRepairStreak(): boolean {
  try {
    const repairData = JSON.parse(localStorage.getItem(STREAK_REPAIR_KEY) || '{}') as Record<string, unknown>;
    const today = _localDateStr();
    if (repairData.lastRepair === today) return false; // already repaired today

    const streakRaw = JSON.parse(localStorage.getItem('uStreak') || '{"count":0,"last":""}') as { count?: number; last?: string };
    if ((streakRaw.count || 0) > 0) return false; // streak is alive, nothing to repair

    const yesterday = _yesterdayStr();
    return streakRaw.last === yesterday;
  } catch {
    return false;
  }
}

/**
 * Returns the XP cost to repair.
 * New users (< 5 lessons) get their first-ever repair free.
 */
export function getRepairCost(): number {
  try {
    if (localStorage.getItem(FREE_REPAIR_KEY)) return XP_COST_REPAIR;
    const statsKey = Object.keys(localStorage).find(k => k.startsWith('uP_'));
    const raw = statsKey ? JSON.parse(localStorage.getItem(statsKey) || '{}') as Record<string, unknown> : {};
    const stats = raw?.stats as Record<string, unknown> | undefined;
    const st    = raw?.st    as Record<string, unknown> | undefined;
    const lc = (stats?.lc ?? st?.lc ?? 0) as number;
    return lc < 5 ? 0 : XP_COST_REPAIR;
  } catch {
    return XP_COST_REPAIR;
  }
}

interface RepairResult {
  ok: boolean;
  reason?: string;
  xpCost?: number;
  restoredCount?: number;
}

/**
 * Executes the streak repair.
 * @param currentXP — the user's current XP total
 */
export function repairStreak(currentXP: number): RepairResult {
  if (!canRepairStreak()) {
    return { ok: false, reason: 'Cannot repair streak at this time.' };
  }
  if (currentXP < XP_COST_REPAIR) {
    return { ok: false, reason: `Need ${XP_COST_REPAIR} XP to repair your streak.` };
  }

  try {
    // Read existing streak data to know what count to restore
    const streakRaw = JSON.parse(localStorage.getItem('uStreak') || '{"count":0,"last":""}') as { count: number; last: string };
    const today = _localDateStr();

    let restoredCount = 1;
    try {
      const eb = JSON.parse(localStorage.getItem('nh_earn_back') || 'null') as { prev?: number } | null;
      if (eb && (eb.prev || 0) > 0) {
        restoredCount = eb.prev!;
      }
    } catch {}

    // Write the repaired streak
    streakRaw.count = restoredCount;
    streakRaw.last  = today;
    localStorage.setItem('uStreak', JSON.stringify(streakRaw));

    // Record that repair was used today; mark free repair as consumed
    const repairData = JSON.parse(localStorage.getItem(STREAK_REPAIR_KEY) || '{}') as Record<string, unknown>;
    repairData.lastRepair = today;
    localStorage.setItem(STREAK_REPAIR_KEY, JSON.stringify(repairData));
    if (!localStorage.getItem(FREE_REPAIR_KEY)) {
      localStorage.setItem(FREE_REPAIR_KEY, '1');
    }

    // Clear earn-back token (already consumed)
    try { localStorage.removeItem('nh_earn_back'); } catch {}

    return { ok: true, xpCost: XP_COST_REPAIR, restoredCount };
  } catch (e: unknown) {
    return { ok: false, reason: 'Repair failed: ' + (e as Error).message };
  }
}
