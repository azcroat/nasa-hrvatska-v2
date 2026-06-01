import { describe, it, expect } from 'vitest';
import {
  MAP_REGIONS,
  regionStatuses,
  restoredCount,
  nextRegion,
} from '../lib/gamification/mapRegions';

describe('MAP_REGIONS', () => {
  it('has 10 regions in strictly ascending threshold order, first at 0', () => {
    expect(MAP_REGIONS).toHaveLength(10);
    expect(MAP_REGIONS[0]!.xpThreshold).toBe(0);
    for (let i = 1; i < MAP_REGIONS.length; i++) {
      expect(MAP_REGIONS[i]!.xpThreshold).toBeGreaterThan(MAP_REGIONS[i - 1]!.xpThreshold);
    }
  });
});

describe('regionStatuses / restoredCount', () => {
  it('xp=0 restores exactly the first region (Labin)', () => {
    expect(restoredCount(0)).toBe(1);
    const s = regionStatuses(0);
    expect(s[0]!.restored).toBe(true);
    expect(s[1]!.restored).toBe(false);
  });
  it('high xp restores all 10', () => {
    expect(restoredCount(999999)).toBe(10);
    expect(regionStatuses(999999).every((r) => r.restored)).toBe(true);
  });
  it('restored exactly when xp >= threshold', () => {
    const t = MAP_REGIONS[3]!.xpThreshold;
    expect(regionStatuses(t)[3]!.restored).toBe(true);
    expect(regionStatuses(t - 1)[3]!.restored).toBe(false);
  });
  it('negative/NaN xp restores only the free first region', () => {
    expect(restoredCount(-5)).toBe(1);
    expect(restoredCount(Number.NaN)).toBe(1);
  });
});

describe('nextRegion', () => {
  it('returns the next locked region and XP remaining', () => {
    const n = nextRegion(0);
    expect(n).not.toBeNull();
    expect(n!.key).toBe(MAP_REGIONS[1]!.key);
    expect(n!.xpToGo).toBe(MAP_REGIONS[1]!.xpThreshold);
  });
  it('returns null when all regions are restored', () => {
    expect(nextRegion(999999)).toBeNull();
  });
});
