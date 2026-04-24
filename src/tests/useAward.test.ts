/**
 * useAward.test.ts — unit tests for the useAward hook and its exported utilities.
 *
 * Strategy: mock all external lib dependencies so tests run in jsdom without
 * Firebase, network calls, or real analytics side-effects.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ── Mock all external dependencies used by useAward ──────────────────────────

vi.mock('../lib/appUtils.js', () => ({
  lXPgain: vi.fn((x: number) => x), // identity: return what's passed
  lvl: vi.fn(() => 1),
  BADGES: [],
  updateStreak: vi.fn(() => ({ count: 1, milestone: null, freezeUsed: false })),
  applyStreakEarnBack: vi.fn(() => 0),
  getStreakEarnBack: vi.fn(() => null),
  earnFreeze: vi.fn(),
  getStreak: vi.fn(() => ({ count: 1 })),
  recordJourneyMilestone: vi.fn(),
}));

vi.mock('../lib/learnerStyle.js', () => ({
  trackComplete: vi.fn(),
}));

vi.mock('../lib/analytics.js', () => ({
  trackLessonComplete: vi.fn(),
  trackExerciseComplete: vi.fn(),
  trackLevelUp: vi.fn(),
  trackBadgeEarned: vi.fn(),
  trackStreakMilestone: vi.fn(),
}));

vi.mock('../lib/dateUtils.js', () => ({
  localDateStr: vi.fn(() => '2026-04-19'),
  weekKey: vi.fn(() => '2026-W16'),
  getServerDateStr: vi.fn(() => Promise.resolve('2026-04-19')),
}));

vi.mock('../lib/knightSpeak.js', () => ({
  knightSpeak: vi.fn(),
}));

// Import AFTER mocks are set up
import { useAward, canEarnXP, markExerciseDone, resetComebackGuard } from '../hooks/useAward';

// ── Minimal Stats object ──────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DS: any = {
  xp: 0,
  lc: 0,
  gc: 0,
  sp: 0,
  de: 0,
  rc: 0,
  str: 0,
  pf: 0,
  mv: 0,
  hi: 0,
  diff: 'beginner',
  ct: [],
  vs: [],
  rs: [],
  badges: [],
  srsTotal: 0,
  mistakesMastered: 0,
  readingDone: 0,
  mediaVisits: 0,
  authLoading: 0,
};

function clearLS() {
  localStorage.clear();
}

beforeEach(() => {
  clearLS();
  resetComebackGuard();
});
afterEach(() => {
  clearLS();
  vi.restoreAllMocks();
});

// ── Exported standalone utility: canEarnXP ────────────────────────────────────

describe('canEarnXP', () => {
  it('returns true when xpCooldown entry is absent', () => {
    expect(canEarnXP('exercise_abc')).toBe(true);
  });

  it('returns false when exercise was completed today', () => {
    localStorage.setItem('xpCooldown', JSON.stringify({ exercise_abc: '2026-04-19' }));
    expect(canEarnXP('exercise_abc')).toBe(false);
  });

  it('returns true when exercise was completed on a different date', () => {
    localStorage.setItem('xpCooldown', JSON.stringify({ exercise_abc: '2026-04-18' }));
    expect(canEarnXP('exercise_abc')).toBe(true);
  });

  it('returns true when xpCooldown is malformed JSON', () => {
    localStorage.setItem('xpCooldown', 'not-json');
    expect(canEarnXP('exercise_abc')).toBe(true);
  });

  it('returns true for unknown exercise even when other exercises are blocked', () => {
    localStorage.setItem('xpCooldown', JSON.stringify({ other_exercise: '2026-04-19' }));
    expect(canEarnXP('new_exercise')).toBe(true);
  });
});

// ── Exported standalone utility: markExerciseDone ────────────────────────────

describe('markExerciseDone', () => {
  it("writes the exercise to xpCooldown with today's date", () => {
    markExerciseDone('exercise_xyz');
    const cd = JSON.parse(localStorage.getItem('xpCooldown') || '{}');
    expect(cd['exercise_xyz']).toBe('2026-04-19');
  });

  it('cleans up entries from previous days', () => {
    localStorage.setItem('xpCooldown', JSON.stringify({ old_exercise: '2026-04-01' }));
    markExerciseDone('exercise_new');
    const cd = JSON.parse(localStorage.getItem('xpCooldown') || '{}');
    expect('old_exercise' in cd).toBe(false);
    expect(cd['exercise_new']).toBe('2026-04-19');
  });

  it('after calling markExerciseDone, canEarnXP returns false for that exercise', () => {
    markExerciseDone('exercise_done');
    expect(canEarnXP('exercise_done')).toBe(false);
  });
});

// ── Exported standalone utility: resetComebackGuard ─────────────────────────

describe('resetComebackGuard', () => {
  it('is a function', () => {
    expect(typeof resetComebackGuard).toBe('function');
  });

  it('can be called without throwing', () => {
    expect(() => resetComebackGuard()).not.toThrow();
  });
});

// ── Hook: return shape ────────────────────────────────────────────────────────

describe('useAward — return shape', () => {
  it('returns award as a function', () => {
    const { result } = renderHook(() =>
      useAward({ curEx: 'test_exercise', stats: { ...DS }, setStats: vi.fn() }),
    );
    expect(typeof result.current.award).toBe('function');
  });

  it('returns showCelebration as a boolean', () => {
    const { result } = renderHook(() =>
      useAward({ curEx: 'test_exercise', stats: { ...DS }, setStats: vi.fn() }),
    );
    expect(typeof result.current.showCelebration).toBe('boolean');
  });

  it('returns comebackBonus as a boolean', () => {
    const { result } = renderHook(() =>
      useAward({ curEx: 'test_exercise', stats: { ...DS }, setStats: vi.fn() }),
    );
    expect(typeof result.current.comebackBonus).toBe('boolean');
  });

  it('returns setComebackBonus as a function', () => {
    const { result } = renderHook(() =>
      useAward({ curEx: 'test_exercise', stats: { ...DS }, setStats: vi.fn() }),
    );
    expect(typeof result.current.setComebackBonus).toBe('function');
  });

  it('returns setShowCelebration as a function', () => {
    const { result } = renderHook(() =>
      useAward({ curEx: 'test_exercise', stats: { ...DS }, setStats: vi.fn() }),
    );
    expect(typeof result.current.setShowCelebration).toBe('function');
  });

  it('returns celebXP as a number', () => {
    const { result } = renderHook(() =>
      useAward({ curEx: 'test_exercise', stats: { ...DS }, setStats: vi.fn() }),
    );
    expect(typeof result.current.celebXP).toBe('number');
  });

  it('returns showXP as a boolean', () => {
    const { result } = renderHook(() =>
      useAward({ curEx: 'test_exercise', stats: { ...DS }, setStats: vi.fn() }),
    );
    expect(typeof result.current.showXP).toBe('boolean');
  });

  it('returns xpA as a number', () => {
    const { result } = renderHook(() =>
      useAward({ curEx: 'test_exercise', stats: { ...DS }, setStats: vi.fn() }),
    );
    expect(typeof result.current.xpA).toBe('number');
  });

  it('returns freezeUsedToast as a boolean', () => {
    const { result } = renderHook(() =>
      useAward({ curEx: 'test_exercise', stats: { ...DS }, setStats: vi.fn() }),
    );
    expect(typeof result.current.freezeUsedToast).toBe('boolean');
  });

  it('returns ttsFailedToast as a boolean', () => {
    const { result } = renderHook(() =>
      useAward({ curEx: 'test_exercise', stats: { ...DS }, setStats: vi.fn() }),
    );
    expect(typeof result.current.ttsFailedToast).toBe('boolean');
  });

  it('returns streakMilestone as null initially', () => {
    const { result } = renderHook(() =>
      useAward({ curEx: 'test_exercise', stats: { ...DS }, setStats: vi.fn() }),
    );
    expect(result.current.streakMilestone).toBeNull();
  });

  it('returns levelUpData as null initially', () => {
    const { result } = renderHook(() =>
      useAward({ curEx: 'test_exercise', stats: { ...DS }, setStats: vi.fn() }),
    );
    expect(result.current.levelUpData).toBeNull();
  });

  it('returns earnBackPrompt as null initially', () => {
    const { result } = renderHook(() =>
      useAward({ curEx: 'test_exercise', stats: { ...DS }, setStats: vi.fn() }),
    );
    expect(result.current.earnBackPrompt).toBeNull();
  });

  it('returns streakRestoredCount as 0 initially', () => {
    const { result } = renderHook(() =>
      useAward({ curEx: 'test_exercise', stats: { ...DS }, setStats: vi.fn() }),
    );
    expect(result.current.streakRestoredCount).toBe(0);
  });

  it('returns sB as boolean initially false', () => {
    const { result } = renderHook(() =>
      useAward({ curEx: 'test_exercise', stats: { ...DS }, setStats: vi.fn() }),
    );
    expect(result.current.sB).toBe(false);
  });

  it('returns nB as null initially', () => {
    const { result } = renderHook(() =>
      useAward({ curEx: 'test_exercise', stats: { ...DS }, setStats: vi.fn() }),
    );
    expect(result.current.nB).toBeNull();
  });
});

// ── Hook: initial state values ────────────────────────────────────────────────

describe('useAward — initial state', () => {
  it('showCelebration starts as false', () => {
    const { result } = renderHook(() =>
      useAward({ curEx: 'test_exercise', stats: { ...DS }, setStats: vi.fn() }),
    );
    expect(result.current.showCelebration).toBe(false);
  });

  it('comebackBonus starts as false', () => {
    const { result } = renderHook(() =>
      useAward({ curEx: 'test_exercise', stats: { ...DS }, setStats: vi.fn() }),
    );
    expect(result.current.comebackBonus).toBe(false);
  });

  it('showXP starts as false', () => {
    const { result } = renderHook(() =>
      useAward({ curEx: 'test_exercise', stats: { ...DS }, setStats: vi.fn() }),
    );
    expect(result.current.showXP).toBe(false);
  });

  it('xpA starts as 0', () => {
    const { result } = renderHook(() =>
      useAward({ curEx: 'test_exercise', stats: { ...DS }, setStats: vi.fn() }),
    );
    expect(result.current.xpA).toBe(0);
  });

  it('celebXP starts as 0', () => {
    const { result } = renderHook(() =>
      useAward({ curEx: 'test_exercise', stats: { ...DS }, setStats: vi.fn() }),
    );
    expect(result.current.celebXP).toBe(0);
  });

  it('ceremonyType starts as null', () => {
    const { result } = renderHook(() =>
      useAward({ curEx: 'test_exercise', stats: { ...DS }, setStats: vi.fn() }),
    );
    expect(result.current.ceremonyType).toBeNull();
  });
});

// ── Hook: state setters ───────────────────────────────────────────────────────

describe('useAward — state setters', () => {
  it('setComebackBonus updates comebackBonus to true', () => {
    const { result } = renderHook(() =>
      useAward({ curEx: 'test_exercise', stats: { ...DS }, setStats: vi.fn() }),
    );
    act(() => {
      result.current.setComebackBonus(true);
    });
    expect(result.current.comebackBonus).toBe(true);
  });

  it('setShowCelebration updates showCelebration to true', () => {
    const { result } = renderHook(() =>
      useAward({ curEx: 'test_exercise', stats: { ...DS }, setStats: vi.fn() }),
    );
    act(() => {
      result.current.setShowCelebration(true);
    });
    expect(result.current.showCelebration).toBe(true);
  });

  it('setShowCelebration can reset showCelebration to false', () => {
    const { result } = renderHook(() =>
      useAward({ curEx: 'test_exercise', stats: { ...DS }, setStats: vi.fn() }),
    );
    act(() => {
      result.current.setShowCelebration(true);
    });
    act(() => {
      result.current.setShowCelebration(false);
    });
    expect(result.current.showCelebration).toBe(false);
  });

  it('setStreakMilestone updates streakMilestone', () => {
    const { result } = renderHook(() =>
      useAward({ curEx: 'test_exercise', stats: { ...DS }, setStats: vi.fn() }),
    );
    act(() => {
      result.current.setStreakMilestone(7);
    });
    expect(result.current.streakMilestone).toBe(7);
  });

  it('setCeremonyType updates ceremonyType', () => {
    const { result } = renderHook(() =>
      useAward({ curEx: 'test_exercise', stats: { ...DS }, setStats: vi.fn() }),
    );
    act(() => {
      result.current.setCeremonyType('streak_30');
    });
    expect(result.current.ceremonyType).toBe('streak_30');
  });

  it('setLevelUpData updates levelUpData', () => {
    const { result } = renderHook(() =>
      useAward({ curEx: 'test_exercise', stats: { ...DS }, setStats: vi.fn() }),
    );
    act(() => {
      result.current.setLevelUpData({ level: 3 });
    });
    expect(result.current.levelUpData).toEqual({ level: 3 });
  });

  it('setFreezeUsedToast updates freezeUsedToast', () => {
    const { result } = renderHook(() =>
      useAward({ curEx: 'test_exercise', stats: { ...DS }, setStats: vi.fn() }),
    );
    act(() => {
      result.current.setFreezeUsedToast(true);
    });
    expect(result.current.freezeUsedToast).toBe(true);
  });
});

// ── Hook: award() calls setStats ──────────────────────────────────────────────

describe('useAward — award() behaviour', () => {
  it('award(50) calls setStats at least once', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setStats = vi.fn((fn: any) => fn({ ...DS }));
    const { result } = renderHook(() =>
      useAward({
        curEx: 'unique_exercise_award_test_001',
        stats: { ...DS },
        setStats,
      }),
    );
    await act(async () => {
      await result.current.award(50);
    });
    expect(setStats).toHaveBeenCalled();
  });

  it('award(0) is a no-op and does not call setStats', async () => {
    const setStats = vi.fn();
    const { result } = renderHook(() =>
      useAward({ curEx: 'exercise_noop', stats: { ...DS }, setStats }),
    );
    await act(async () => {
      await result.current.award(0);
    });
    expect(setStats).not.toHaveBeenCalled();
  });

  it('award(NaN) is a no-op and does not call setStats', async () => {
    const setStats = vi.fn();
    const { result } = renderHook(() =>
      useAward({ curEx: 'exercise_nan', stats: { ...DS }, setStats }),
    );
    await act(async () => {
      await result.current.award(NaN);
    });
    expect(setStats).not.toHaveBeenCalled();
  });

  it('award() skips setStats when exercise is already done today', async () => {
    // Mark the exercise as done today before rendering the hook
    localStorage.setItem('xpCooldown', JSON.stringify({ cooldown_exercise: '2026-04-19' }));
    const setStats = vi.fn();
    const { result } = renderHook(() =>
      useAward({ curEx: 'cooldown_exercise', stats: { ...DS }, setStats }),
    );
    await act(async () => {
      await result.current.award(50);
    });
    expect(setStats).not.toHaveBeenCalled();
  });

  it('award(50) calls setStats with an updater function', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setStats = vi.fn((fn: any) => fn({ ...DS }));
    const { result } = renderHook(() =>
      useAward({
        curEx: 'unique_exercise_award_test_002',
        stats: { ...DS },
        setStats,
      }),
    );
    await act(async () => {
      await result.current.award(50);
    });
    // setStats should be called with a function (the updater pattern)
    expect(typeof setStats.mock.calls[0][0]).toBe('function');
  });

  it('award() with celebrate=true sets showCelebration to true (via setTimeout)', async () => {
    vi.useFakeTimers();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setStats = vi.fn((fn: any) => fn({ ...DS }));
    const { result } = renderHook(() =>
      useAward({
        curEx: 'unique_exercise_celebrate_001',
        stats: { ...DS },
        setStats,
      }),
    );
    await act(async () => {
      await result.current.award(50, true);
    });
    act(() => {
      vi.runAllTimers();
    });
    expect(result.current.showCelebration).toBe(true);
    vi.useRealTimers();
  });

  it('award() marks the exercise done in xpCooldown after running', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setStats = vi.fn((fn: any) => fn({ ...DS }));
    const { result } = renderHook(() =>
      useAward({
        curEx: 'unique_exercise_mark_done_001',
        stats: { ...DS },
        setStats,
      }),
    );
    await act(async () => {
      await result.current.award(50);
    });
    const cd = JSON.parse(localStorage.getItem('xpCooldown') || '{}');
    expect(cd['unique_exercise_mark_done_001']).toBe('2026-04-19');
  });

  it('award() with writeDelta calls writeDelta with xp amount', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setStats = vi.fn((fn: any) => fn({ ...DS }));
    const writeDelta = vi.fn();
    const { result } = renderHook(() =>
      useAward({
        curEx: 'unique_exercise_delta_001',
        stats: { ...DS },
        setStats,
        writeDelta,
      }),
    );
    await act(async () => {
      await result.current.award(30);
    });
    expect(writeDelta).toHaveBeenCalledWith(expect.objectContaining({ xp: 30 }));
  });
});
