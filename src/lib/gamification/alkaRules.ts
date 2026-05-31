import type { PerformanceTier } from './scoring';

export type RingZone = 0 | 1 | 2 | 3; // 0 miss, 1 lower field, 2 upper field, 3 u sridu

export const QUESTIONS_PER_RUN = 3;
export const RUNS_PER_RIDE = 3;
export const MAX_RIDE_POINTS = RUNS_PER_RIDE * 3; // 9

// A run's lance lands by how cleanly its questions were answered.
// Any miss caps the lance at the lower field (1). With no misses, the
// proportion of "perfect" answers decides upper (2) vs centre (3).
export function runToZone(tiers: PerformanceTier[]): RingZone {
  if (tiers.length === 0) return 0;
  const misses = tiers.filter((t) => t === 'miss').length;
  if (misses === tiers.length) return 0;
  if (misses > 0) return 1;
  const perfects = tiers.filter((t) => t === 'perfect').length;
  return perfects === tiers.length ? 3 : 2;
}

export function rideTotal(runs: RingZone[]): number {
  return Math.min(
    MAX_RIDE_POINTS,
    runs.reduce<number>((sum, z) => sum + z, 0),
  );
}

export function isUSridu(zone: RingZone): boolean {
  return zone === 3;
}

// XP awarded for completing a ride, derived from the ring total (0-9) — NOT the
// raw in-game score (which is hundreds/thousands and is only the competitive
// number). Returns an integer kept within the 'vocabulary' activity cap (80) so
// the server XP-claim (functions/api/award.js) accepts it without clamping.
export function alkaRideXp(total: number): number {
  const t = Math.max(0, Math.min(MAX_RIDE_POINTS, Math.round(total)));
  return Math.max(20, t * 8); // 20 (participation) .. 72 (perfect 9/9)
}
