// Ordered Map-of-Croatia regions and the cumulative total-XP threshold at which
// each "restores". Region 0 is free (restored from the start). Keys match
// src/data/cultural/regions.js REGIONS. Thresholds span the A1→C2 XP curve.
export interface MapRegionDef {
  key: string;
  xpThreshold: number;
}

export const MAP_REGIONS: readonly MapRegionDef[] = [
  { key: 'labin', xpThreshold: 0 },
  { key: 'split', xpThreshold: 400 },
  { key: 'zagreb', xpThreshold: 1000 },
  { key: 'bibinje', xpThreshold: 1800 },
  { key: 'vukovar', xpThreshold: 3000 },
  { key: 'vinkovci', xpThreshold: 4500 },
  { key: 'knin', xpThreshold: 6500 },
  { key: 'mostar', xpThreshold: 9500 },
  { key: 'tomislavgrad', xpThreshold: 13000 },
  { key: 'hercegovina', xpThreshold: 18000 },
];

export interface RegionStatus {
  key: string;
  xpThreshold: number;
  restored: boolean;
}

function safeXp(xp: number): number {
  return Number.isFinite(xp) && xp > 0 ? xp : 0;
}

export function regionStatuses(xp: number): RegionStatus[] {
  const x = safeXp(xp);
  return MAP_REGIONS.map((r) => ({
    key: r.key,
    xpThreshold: r.xpThreshold,
    restored: x >= r.xpThreshold,
  }));
}

export function restoredCount(xp: number): number {
  return regionStatuses(xp).filter((r) => r.restored).length;
}

export function nextRegion(
  xp: number,
): { key: string; xpThreshold: number; xpToGo: number } | null {
  const x = safeXp(xp);
  const next = MAP_REGIONS.find((r) => x < r.xpThreshold);
  if (!next) return null;
  return { key: next.key, xpThreshold: next.xpThreshold, xpToGo: next.xpThreshold - x };
}
