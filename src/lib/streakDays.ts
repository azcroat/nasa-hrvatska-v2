// src/lib/streakDays.ts
// Canonical streak model: the set of LOCAL calendar days the user was active.
// The streak (count + last) is DERIVED from this set, never stored independently.
//
// Why a set: sets merge across devices by union — commutative and idempotent — so
// two devices can never produce a contradictory streak. The old model merged the
// derived (count, last) pair with independent Math.max, which fabricated impossible
// states (a dead high count stamped with today's date). Deriving from the union of
// active days makes that state unrepresentable.
//
// A spent streak-freeze is modelled by inserting the bridged day INTO the set, so
// the derivation stays a pure consecutive-run count with no special-casing.

export type DaySet = Record<string, boolean>;

/** Previous local calendar day for a 'YYYY-MM-DD' string. */
function prevDay(day: string): string {
  const d = new Date(day + 'T00:00:00');
  d.setDate(d.getDate() - 1);
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

/** Add an active day (idempotent union of a single date). */
export function addDay(set: DaySet, day: string): DaySet {
  if (!day || set[day]) return set;
  return { ...set, [day]: true };
}

/** Union of two active-day sets (commutative; cross-device-safe). */
export function mergeDaySets(a: DaySet, b: DaySet): DaySet {
  return { ...a, ...b };
}

/**
 * Migration: reconstruct a day-set from a legacy {count, last} summary by marking
 * `count` consecutive local days ending at `last`. Unions into `set` (no day lost).
 * No-op when count<=0 or last is empty.
 */
export function seedDaysFromStreak(set: DaySet, count: number, last: string): DaySet {
  if (!last || !(count > 0)) return set;
  const out: DaySet = { ...set };
  let d = last;
  for (let i = 0; i < count; i++) {
    out[d] = true;
    d = prevDay(d);
  }
  return out;
}

/**
 * Derive the streak from the active-day set as of `today` (local 'YYYY-MM-DD').
 * - count = length of the consecutive run of active days ending at today, or at
 *   yesterday when today isn't active yet (the streak is still alive until tomorrow).
 * - last = the anchor day the run ends on; for a broken streak, the most recent
 *   active day in the set (count 0).
 */
export function computeStreak(set: DaySet, today: string): { count: number; last: string } {
  const has = (d: string): boolean => !!set[d];
  const yesterday = prevDay(today);

  let anchor: string;
  if (has(today)) anchor = today;
  else if (has(yesterday)) anchor = yesterday;
  else {
    const keys = Object.keys(set).filter(Boolean).sort();
    return { count: 0, last: keys.length ? keys[keys.length - 1]! : '' };
  }

  let count = 0;
  let d = anchor;
  while (has(d)) {
    count++;
    d = prevDay(d);
  }
  return { count, last: anchor };
}
