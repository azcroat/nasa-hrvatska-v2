import { describe, it, expect, vi, beforeEach } from 'vitest';
import type * as Adaptive from '../../lib/adaptive';

// Flag is read at module-eval; force it on for these cases.
vi.mock('../../lib/conjugation/conjugationConfig', () => ({
  CONJ_LAB_ENABLED: true,
  DAILY_CONJ_SET_SIZE: 15,
}));
// Keep real CATEGORY_MIN_CEFR / CONJ_CATEGORIES; make the queue mockable per-test.
vi.mock('../../lib/adaptive', async (orig) => {
  const actual = (await orig()) as typeof Adaptive;
  return { ...actual, getDueCategoryQueue: vi.fn() };
});

import { getDueCategoryQueue } from '../../lib/adaptive';
import { resolveAdaptiveActivity } from '../useDailySession';

const ASPECT_THEN_PAST = [
  { category: 'aspect-perfective' as const, difficulty: 3 as const }, // B2
  { category: 'past-tense' as const, difficulty: 2 as const }, // A2
];

describe('adaptive conjugation pick (flag on)', () => {
  beforeEach(() => vi.mocked(getDueCategoryQueue).mockReset());

  it('skips a category above the user CEFR and picks the first eligible conj category', () => {
    vi.mocked(getDueCategoryQueue).mockReturnValue(ASPECT_THEN_PAST);
    const act = resolveAdaptiveActivity('A2', new Set<string>());
    expect(act).not.toBeNull();
    expect(act!.category).toBe('past-tense');
    expect(act!.screen).toBe('conjpractice');
  });

  it('an A1 user gets nothing when only above-level conj categories are due', () => {
    vi.mocked(getDueCategoryQueue).mockReturnValue(ASPECT_THEN_PAST);
    expect(resolveAdaptiveActivity('A1', new Set<string>())).toBeNull();
  });

  it('an A1 user gets present-tense routed to conjpractice', () => {
    vi.mocked(getDueCategoryQueue).mockReturnValue([
      { category: 'present-tense' as const, difficulty: 1 as const },
    ]);
    const act = resolveAdaptiveActivity('A1', new Set<string>());
    expect(act!.category).toBe('present-tense');
    expect(act!.screen).toBe('conjpractice');
  });
});
