// src/lib/activeDayTracker.ts
/**
 * Counts the number of DISTINCT local calendar days the app was used.
 * Drives the "every 5 active days" checkpoint cadence so a user returning
 * from a break is never ambushed (calendar timers fire mid-vacation).
 *
 * Pure core (`applyActiveDay`) + thin localStorage wrapper so it tests
 * without a DOM clock.
 */
export interface ActiveDayState {
  /** Last local day we counted, 'YYYY-MM-DD'. */
  lastDay: string;
  /** Cumulative count of distinct active days. */
  count: number;
}

const KEY = 'nh_active_days';

/** YYYY-MM-DD in LOCAL time (not UTC) — the user's day boundary. */
export function localDayString(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Pure: returns the next state given today's local day string. */
export function applyActiveDay(state: ActiveDayState, today: string): ActiveDayState {
  if (state.lastDay === today) return state;
  return { lastDay: today, count: state.count + 1 };
}

function read(): ActiveDayState {
  if (typeof localStorage === 'undefined') return { lastDay: '', count: 0 };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { lastDay: '', count: 0 };
    const p = JSON.parse(raw) as Partial<ActiveDayState>;
    return {
      lastDay: typeof p.lastDay === 'string' ? p.lastDay : '',
      count: typeof p.count === 'number' ? p.count : 0,
    };
  } catch {
    return { lastDay: '', count: 0 };
  }
}

function write(state: ActiveDayState): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* quota/disabled — retry next call */
  }
}

/** Records today (defaults to now) as an active day; persists. */
export function recordActiveDayNow(today: string = localDayString()): void {
  write(applyActiveDay(read(), today));
}

/** Current cumulative distinct-active-day count. */
export function getActiveDayCount(): number {
  return read().count;
}
