import { describe, it, expect } from 'vitest';

// ── Pure logic helpers extracted for testability ──────────────────────────────

function computeAwarded(
  claimedXp,
  activityType,
  activityXpMap,
  velocityTotal,
  velocityBudget = 600,
) {
  const maxXp = activityXpMap[activityType] ?? activityXpMap.default;
  const remaining = Math.max(0, velocityBudget - velocityTotal);
  return Math.min(claimedXp, maxXp, remaining);
}

const ACTIVITY_XP_MAP = {
  grammar: 80,
  vocabulary: 80,
  lesson: 210,
  heritage: 250,
  story: 100,
  speaking: 100,
  listening: 80,
  reading: 80,
  culture: 100,
  quest: 100,
  review: 80,
  media_view: 15,
  phrase_of_day: 15,
  daily_discovery: 20,
  pronunciation: 80,
  default: 210,
};

describe('computeAwarded', () => {
  it('returns claimedXp when under all caps', () => {
    expect(computeAwarded(25, 'grammar', ACTIVITY_XP_MAP, 0)).toBe(25);
  });

  it('caps to activityType max', () => {
    expect(computeAwarded(200, 'grammar', ACTIVITY_XP_MAP, 0)).toBe(80);
  });

  it('caps to velocity remaining', () => {
    expect(computeAwarded(100, 'lesson', ACTIVITY_XP_MAP, 550)).toBe(50);
  });

  it('returns 0 when velocity budget exhausted', () => {
    expect(computeAwarded(100, 'lesson', ACTIVITY_XP_MAP, 600)).toBe(0);
  });

  it('uses default cap for unknown activityType', () => {
    expect(computeAwarded(300, 'unknown_type', ACTIVITY_XP_MAP, 0)).toBe(210);
  });

  it('caps lesson to 210 max', () => {
    expect(computeAwarded(9999, 'lesson', ACTIVITY_XP_MAP, 0)).toBe(210);
  });

  it('caps heritage to 250 max', () => {
    expect(computeAwarded(9999, 'heritage', ACTIVITY_XP_MAP, 0)).toBe(250);
  });

  it('velocity window reset: full budget available', () => {
    expect(computeAwarded(100, 'lesson', ACTIVITY_XP_MAP, 0)).toBe(100);
  });

  it('velocity accumulation: partial budget', () => {
    expect(computeAwarded(200, 'lesson', ACTIVITY_XP_MAP, 500)).toBe(100);
  });
});

describe('request validation', () => {
  function validateRequest(activityType, claimedXp) {
    if (typeof activityType !== 'string' || !activityType.trim()) {
      return { error: 'invalid_activity_type', status: 400 };
    }
    if (!Number.isInteger(claimedXp) || claimedXp <= 0 || claimedXp > 10000) {
      return { error: 'invalid_xp', status: 400 };
    }
    return null;
  }

  it('rejects empty activityType', () => {
    expect(validateRequest('', 50)).toMatchObject({ status: 400 });
  });

  it('rejects non-string activityType', () => {
    expect(validateRequest(null, 50)).toMatchObject({ status: 400 });
  });

  it('rejects zero xp', () => {
    expect(validateRequest('grammar', 0)).toMatchObject({ status: 400 });
  });

  it('rejects negative xp', () => {
    expect(validateRequest('grammar', -1)).toMatchObject({ status: 400 });
  });

  it('rejects xp > 10000 (sanity bound)', () => {
    expect(validateRequest('grammar', 10001)).toMatchObject({ status: 400 });
  });

  it('accepts valid request', () => {
    expect(validateRequest('grammar', 25)).toBeNull();
  });

  it('accepts xp = 10000 (boundary)', () => {
    expect(validateRequest('grammar', 10000)).toBeNull();
  });
});
