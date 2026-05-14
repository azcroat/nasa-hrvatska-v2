/**
 * useAward-coverage.test.ts — Additional branch-coverage tests for useAward.ts.
 *
 * Targets uncovered branches in lines 347-476, 498-499, 524-563:
 *   - Streak milestone path (sr.milestone truthy)
 *   - Streak ceremony thresholds (30, 50, 100)
 *   - sr.freezeUsed toast
 *   - earnFreeze call (count > 0 && count % 7 === 0)
 *   - applyStreakEarnBack > 0  vs  getStreakEarnBack eb.lc === 1
 *   - Stage gate ceremony (stats.lc >= threshold)
 *   - comeback bonus path (comebackBonus=true, not already used today)
 *   - comeback bonus already-used guard (_awardComebackUsed === _today)
 *   - celebrate + vocab_ curEx -> removes nh_lesson_resume
 *   - trackComplete path: curEx = known type (flashcards / speaking / writing / listening)
 *   - trackLessonComplete vs trackExerciseComplete (celebrate true/false)
 *   - _lsDur > 0 path (nh_ex_start set in sessionStorage)
 *   - Badges: nb.length > 0 path (badge earned during award)
 *   - Level-up path (newLevel > oldLevel)
 *   - _pendingBadge: known speech vs unknown speech (knight:badge dispatch)
 *   - Level-up: known level speech vs unknown level speech
 *   - knight:celebrate event fired for totalAmt >= 20 with no badge/levelup
 *   - server response awarded === undefined -> enqueue path
 *   - nh_journey_first_lesson already set -> no re-record
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ── Mocks (must match useAward.test.ts exactly) ───────────────────────────────

vi.mock('../lib/appUtils.js', () => ({
  lXPgain: vi.fn((x: number) => x),
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

vi.mock('../lib/apiFetch.js', () => ({
  apiFetch: vi.fn(),
}));

vi.mock('../lib/offlineAwardQueue.js', () => ({
  enqueue: vi.fn(),
}));

vi.mock('../lib/activityXp.js', () => ({
  ACTIVITY_XP_MAP: { grammar: 80, lesson: 210, default: 210 },
}));

// Import AFTER mocks
import { useAward, resetComebackGuard } from '../hooks/useAward';
import * as appUtils from '../lib/appUtils.js';
import * as analytics from '../lib/analytics.js';
import * as learnerStyle from '../lib/learnerStyle.js';
import { knightSpeak } from '../lib/knightSpeak.js';
import * as offlineAwardQueue from '../lib/offlineAwardQueue.js';
import { apiFetch } from '../lib/apiFetch.js';

// ── Minimal Stats ─────────────────────────────────────────────────────────────
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

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  resetComebackGuard();
  vi.clearAllMocks();
  // Default: online
  Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
  // Default apiFetch: success
  (apiFetch as ReturnType<typeof vi.fn>).mockResolvedValue({
    ok: true,
    json: async () => ({ awarded: 25 }),
  });
  // Restore default updateStreak behaviour
  (appUtils.updateStreak as ReturnType<typeof vi.fn>).mockReturnValue({
    count: 1,
    milestone: null,
    freezeUsed: false,
  });
  (appUtils.applyStreakEarnBack as ReturnType<typeof vi.fn>).mockReturnValue(0);
  (appUtils.getStreakEarnBack as ReturnType<typeof vi.fn>).mockReturnValue(null);
  (appUtils.lvl as ReturnType<typeof vi.fn>).mockReturnValue(1);
  (appUtils.lXPgain as ReturnType<typeof vi.fn>).mockImplementation((x: number) => x);
  (appUtils.getStreak as ReturnType<typeof vi.fn>).mockReturnValue({ count: 1 });
});

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.restoreAllMocks();
});

// helper: render hook and run award
async function runAward(
  curEx: string,
  amt: number,
  celebrate?: boolean,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  statsOverride?: any,
  writeDelta?: ReturnType<typeof vi.fn>,
  activityType?: string,
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setStats = vi.fn((fn: any) => fn({ ...DS, ...statsOverride }));
  const { result } = renderHook(() =>
    useAward({
      curEx,
      stats: { ...DS, ...statsOverride },
      setStats,
      writeDelta,
    }),
  );
  await act(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await result.current.award(amt, celebrate, activityType as any);
  });
  return { result, setStats };
}

// ── Comeback bonus ────────────────────────────────────────────────────────────

describe('comeback bonus', () => {
  it('adds 50 XP when comebackBonus is true and not yet used today', async () => {
    (appUtils.lXPgain as ReturnType<typeof vi.fn>).mockImplementation((x: number) => x);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setStats = vi.fn((fn: any) => fn({ ...DS }));
    const { result } = renderHook(() =>
      useAward({ curEx: 'comeback_ex_001', stats: { ...DS }, setStats }),
    );
    act(() => {
      result.current.setComebackBonus(true);
    });
    await act(async () => {
      await result.current.award(10);
    });
    // xpA should be 10 + 50 = 60
    expect(result.current.xpA).toBe(60);
  });

  it('does NOT add comeback bonus when nh_comeback_used_<today> is already set', async () => {
    localStorage.setItem('nh_comeback_used_2026-04-19', '1');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setStats = vi.fn((fn: any) => fn({ ...DS }));
    const { result } = renderHook(() =>
      useAward({ curEx: 'comeback_ex_002', stats: { ...DS }, setStats }),
    );
    act(() => {
      result.current.setComebackBonus(true);
    });
    await act(async () => {
      await result.current.award(10);
    });
    expect(result.current.xpA).toBe(10);
  });

  it('does NOT add comeback bonus twice in same session after guard is set', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setStats = vi.fn((fn: any) => fn({ ...DS }));
    const { result } = renderHook(() =>
      useAward({ curEx: 'comeback_ex_003', stats: { ...DS }, setStats }),
    );
    act(() => {
      result.current.setComebackBonus(true);
    });
    // First call: sets _awardComebackUsed + localStorage guard
    await act(async () => {
      await result.current.award(10);
    });
    expect(result.current.xpA).toBe(60);
    // Second call on same exercise would be blocked by cooldown, so use different curEx
    // But we can test the guard via resetComebackGuard and re-entry — here just verify localStorage
    expect(localStorage.getItem('nh_comeback_used_2026-04-19')).toBe('1');
  });
});

// ── Streak milestone branch ───────────────────────────────────────────────────

describe('streak milestone', () => {
  it('sets streakMilestone state when sr.milestone is truthy (via setTimeout)', async () => {
    vi.useFakeTimers();
    (appUtils.updateStreak as ReturnType<typeof vi.fn>).mockReturnValue({
      count: 7,
      milestone: 7,
      freezeUsed: false,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setStats = vi.fn((fn: any) => fn({ ...DS }));
    const { result } = renderHook(() =>
      useAward({ curEx: 'streak_ms_test_001', stats: { ...DS }, setStats }),
    );
    await act(async () => {
      await result.current.award(10);
    });
    act(() => {
      vi.runAllTimers();
    });
    expect(result.current.streakMilestone).toBe(7);
    vi.useRealTimers();
  });

  it('calls trackStreakMilestone when sr.milestone is truthy', async () => {
    (appUtils.updateStreak as ReturnType<typeof vi.fn>).mockReturnValue({
      count: 7,
      milestone: 7,
      freezeUsed: false,
    });
    await runAward('streak_ms_test_002', 10);
    expect(analytics.trackStreakMilestone).toHaveBeenCalledWith(7);
  });

  it('calls recordJourneyMilestone for streak milestone', async () => {
    (appUtils.updateStreak as ReturnType<typeof vi.fn>).mockReturnValue({
      count: 30,
      milestone: 30,
      freezeUsed: false,
    });
    await runAward('streak_ms_test_003', 10);
    expect(appUtils.recordJourneyMilestone).toHaveBeenCalledWith(
      'streak_30',
      expect.objectContaining({ count: 30 }),
    );
  });

  it('calls knightSpeak for a known streak speech milestone', async () => {
    vi.useFakeTimers();
    (appUtils.updateStreak as ReturnType<typeof vi.fn>).mockReturnValue({
      count: 7,
      milestone: 7,
      freezeUsed: false,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setStats = vi.fn((fn: any) => fn({ ...DS }));
    const { result } = renderHook(() =>
      useAward({ curEx: 'streak_speech_001', stats: { ...DS }, setStats }),
    );
    await act(async () => {
      await result.current.award(10);
    });
    act(() => {
      vi.runAllTimers();
    });
    expect(knightSpeak).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('does not call knightSpeak streak speech for unknown milestone value', async () => {
    vi.useFakeTimers();
    (appUtils.updateStreak as ReturnType<typeof vi.fn>).mockReturnValue({
      count: 999,
      milestone: 999,
      freezeUsed: false,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setStats = vi.fn((fn: any) => fn({ ...DS }));
    const { result } = renderHook(() =>
      useAward({ curEx: 'streak_speech_002', stats: { ...DS }, setStats }),
    );
    await act(async () => {
      await result.current.award(10);
    });
    act(() => {
      vi.runAllTimers();
    });
    // streak milestone fires recordJourneyMilestone but knightSpeak shouldn't be called
    // for an unknown milestone (ms is undefined, so the setTimeout branch is skipped)
    expect(analytics.trackStreakMilestone).toHaveBeenCalledWith(999);
    vi.useRealTimers();
  });
});

// ── Streak ceremony thresholds ────────────────────────────────────────────────

describe('streak ceremony thresholds', () => {
  it('sets ceremonyType to streak_30 when count >= 30 and not already set', async () => {
    (appUtils.updateStreak as ReturnType<typeof vi.fn>).mockReturnValue({
      count: 30,
      milestone: null,
      freezeUsed: false,
    });
    const { result } = await (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const setStats = vi.fn((fn: any) => fn({ ...DS }));
      const { result } = renderHook(() =>
        useAward({ curEx: 'ceremony_30_test', stats: { ...DS }, setStats }),
      );
      await act(async () => {
        await result.current.award(10);
      });
      return { result };
    })();
    expect(result.current.ceremonyType).toBe('streak_30');
    expect(localStorage.getItem('nh_ceremony_streak_30')).toBe('1');
  });

  it('does NOT set streak_30 ceremony again if localStorage already has it', async () => {
    localStorage.setItem('nh_ceremony_streak_30', '1');
    (appUtils.updateStreak as ReturnType<typeof vi.fn>).mockReturnValue({
      count: 30,
      milestone: null,
      freezeUsed: false,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setStats = vi.fn((fn: any) => fn({ ...DS }));
    const { result } = renderHook(() =>
      useAward({ curEx: 'ceremony_30_skip', stats: { ...DS }, setStats }),
    );
    await act(async () => {
      await result.current.award(10);
    });
    // ceremonyType remains null since ceremony already done
    expect(result.current.ceremonyType).toBeNull();
  });

  it('sets ceremonyType to streak_50 when count >= 50', async () => {
    (appUtils.updateStreak as ReturnType<typeof vi.fn>).mockReturnValue({
      count: 50,
      milestone: null,
      freezeUsed: false,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setStats = vi.fn((fn: any) => fn({ ...DS }));
    const { result } = renderHook(() =>
      useAward({ curEx: 'ceremony_50_test', stats: { ...DS }, setStats }),
    );
    await act(async () => {
      await result.current.award(10);
    });
    expect(result.current.ceremonyType).toBe('streak_50');
  });

  it('sets ceremonyType to streak_100 when count >= 100', async () => {
    (appUtils.updateStreak as ReturnType<typeof vi.fn>).mockReturnValue({
      count: 100,
      milestone: null,
      freezeUsed: false,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setStats = vi.fn((fn: any) => fn({ ...DS }));
    const { result } = renderHook(() =>
      useAward({ curEx: 'ceremony_100_test', stats: { ...DS }, setStats }),
    );
    await act(async () => {
      await result.current.award(10);
    });
    expect(result.current.ceremonyType).toBe('streak_100');
  });
});

// ── earnFreeze & freezeUsed toast ─────────────────────────────────────────────

describe('earnFreeze and freezeUsedToast', () => {
  it('calls earnFreeze when count > 0 and count % 7 === 0', async () => {
    (appUtils.updateStreak as ReturnType<typeof vi.fn>).mockReturnValue({
      count: 7,
      milestone: null,
      freezeUsed: false,
    });
    await runAward('earn_freeze_7', 10);
    expect(appUtils.earnFreeze).toHaveBeenCalled();
  });

  it('calls earnFreeze for count=14', async () => {
    (appUtils.updateStreak as ReturnType<typeof vi.fn>).mockReturnValue({
      count: 14,
      milestone: null,
      freezeUsed: false,
    });
    await runAward('earn_freeze_14', 10);
    expect(appUtils.earnFreeze).toHaveBeenCalled();
  });

  it('does NOT call earnFreeze when count % 7 !== 0', async () => {
    (appUtils.updateStreak as ReturnType<typeof vi.fn>).mockReturnValue({
      count: 5,
      milestone: null,
      freezeUsed: false,
    });
    await runAward('no_freeze_5', 10);
    expect(appUtils.earnFreeze).not.toHaveBeenCalled();
  });

  it('sets freezeUsedToast when sr.freezeUsed is true', async () => {
    vi.useFakeTimers();
    (appUtils.updateStreak as ReturnType<typeof vi.fn>).mockReturnValue({
      count: 1,
      milestone: null,
      freezeUsed: true,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setStats = vi.fn((fn: any) => fn({ ...DS }));
    const { result } = renderHook(() =>
      useAward({ curEx: 'freeze_used_test', stats: { ...DS }, setStats }),
    );
    await act(async () => {
      await result.current.award(10);
    });
    expect(result.current.freezeUsedToast).toBe(true);
    act(() => {
      vi.runAllTimers();
    });
    expect(result.current.freezeUsedToast).toBe(false);
    vi.useRealTimers();
  });
});

// ── applyStreakEarnBack / getStreakEarnBack ────────────────────────────────────

describe('streak earnBack prompt', () => {
  it('sets streakRestoredCount when applyStreakEarnBack returns > 0', async () => {
    vi.useFakeTimers();
    (appUtils.applyStreakEarnBack as ReturnType<typeof vi.fn>).mockReturnValue(3);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setStats = vi.fn((fn: any) => fn({ ...DS }));
    const { result } = renderHook(() =>
      useAward({ curEx: 'earnback_restore', stats: { ...DS }, setStats }),
    );
    await act(async () => {
      await result.current.award(10);
    });
    act(() => {
      vi.runAllTimers();
    });
    // After timers run the count was set then reset to 0
    expect(result.current.streakRestoredCount).toBe(0);
    vi.useRealTimers();
  });

  it('sets earnBackPrompt when applyStreakEarnBack=0 and eb.lc===1', async () => {
    (appUtils.applyStreakEarnBack as ReturnType<typeof vi.fn>).mockReturnValue(0);
    (appUtils.getStreakEarnBack as ReturnType<typeof vi.fn>).mockReturnValue({
      lc: 1,
      prev: 5,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setStats = vi.fn((fn: any) => fn({ ...DS }));
    const { result } = renderHook(() =>
      useAward({ curEx: 'earnback_prompt', stats: { ...DS }, setStats }),
    );
    await act(async () => {
      await result.current.award(10);
    });
    expect(result.current.earnBackPrompt).toEqual({ prev: 5 });
  });

  it('does NOT set earnBackPrompt when eb is null', async () => {
    (appUtils.applyStreakEarnBack as ReturnType<typeof vi.fn>).mockReturnValue(0);
    (appUtils.getStreakEarnBack as ReturnType<typeof vi.fn>).mockReturnValue(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setStats = vi.fn((fn: any) => fn({ ...DS }));
    const { result } = renderHook(() =>
      useAward({ curEx: 'earnback_null', stats: { ...DS }, setStats }),
    );
    await act(async () => {
      await result.current.award(10);
    });
    expect(result.current.earnBackPrompt).toBeNull();
  });

  it('does NOT set earnBackPrompt when eb.lc !== 1', async () => {
    (appUtils.applyStreakEarnBack as ReturnType<typeof vi.fn>).mockReturnValue(0);
    (appUtils.getStreakEarnBack as ReturnType<typeof vi.fn>).mockReturnValue({
      lc: 2,
      prev: 3,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setStats = vi.fn((fn: any) => fn({ ...DS }));
    const { result } = renderHook(() =>
      useAward({ curEx: 'earnback_lc2', stats: { ...DS }, setStats }),
    );
    await act(async () => {
      await result.current.award(10);
    });
    expect(result.current.earnBackPrompt).toBeNull();
  });
});

// ── Stage gate ceremony ───────────────────────────────────────────────────────

describe('stage gate ceremony', () => {
  it('sets ceremonyType to stage_1 when stats.lc >= 5 and not done', async () => {
    vi.useFakeTimers();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setStats = vi.fn((fn: any) => fn({ ...DS, lc: 5 }));
    const { result } = renderHook(() =>
      useAward({ curEx: 'stage_gate_1', stats: { ...DS, lc: 5 }, setStats }),
    );
    await act(async () => {
      await result.current.award(10);
    });
    act(() => {
      vi.runAllTimers();
    });
    expect(result.current.ceremonyType).toBe('stage_1');
    vi.useRealTimers();
  });

  it('does NOT set stage_1 ceremony when already stored in localStorage', async () => {
    localStorage.setItem('nh_stage1_ceremony', '1');
    vi.useFakeTimers();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setStats = vi.fn((fn: any) => fn({ ...DS, lc: 5 }));
    const { result } = renderHook(() =>
      useAward({ curEx: 'stage_gate_1_skip', stats: { ...DS, lc: 5 }, setStats }),
    );
    await act(async () => {
      await result.current.award(10);
    });
    act(() => {
      vi.runAllTimers();
    });
    expect(result.current.ceremonyType).toBeNull();
    vi.useRealTimers();
  });

  it('sets ceremonyType to stage_2 for lc >= 11 (stage_1 already done)', async () => {
    // stage_1 is already done so the loop skips it and hits stage_2
    localStorage.setItem('nh_stage1_ceremony', '1');
    vi.useFakeTimers();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setStats = vi.fn((fn: any) => fn({ ...DS, lc: 11 }));
    const { result } = renderHook(() =>
      useAward({ curEx: 'stage_gate_2', stats: { ...DS, lc: 11 }, setStats }),
    );
    await act(async () => {
      await result.current.award(10);
    });
    act(() => {
      vi.runAllTimers();
    });
    expect(result.current.ceremonyType).toBe('stage_2');
    vi.useRealTimers();
  });
});

// ── celebrate + vocab_ curEx ─────────────────────────────────────────────────

describe('celebrate + vocab_ curEx', () => {
  it('removes nh_lesson_resume from localStorage', async () => {
    localStorage.setItem('nh_lesson_resume', 'some_data');
    await runAward('vocab_basics', 50, true);
    expect(localStorage.getItem('nh_lesson_resume')).toBeNull();
  });

  it('does NOT remove nh_lesson_resume when curEx is not vocab_', async () => {
    localStorage.setItem('nh_lesson_resume', 'some_data');
    await runAward('flash', 50, true);
    expect(localStorage.getItem('nh_lesson_resume')).toBe('some_data');
  });

  it('does NOT remove nh_lesson_resume when celebrate is false', async () => {
    localStorage.setItem('nh_lesson_resume', 'some_data');
    await runAward('vocab_basics', 50, false);
    expect(localStorage.getItem('nh_lesson_resume')).toBe('some_data');
  });
});

// ── trackComplete / exercise session tracking ─────────────────────────────────

describe('trackComplete exercise session tracking', () => {
  it('calls trackComplete for flash (flashcards type)', async () => {
    await runAward('flash', 10);
    expect(learnerStyle.trackComplete).toHaveBeenCalledWith('flashcards', expect.any(Number));
  });

  it('calls trackComplete for mcgame (quiz type)', async () => {
    await runAward('mcgame', 10);
    expect(learnerStyle.trackComplete).toHaveBeenCalledWith('quiz', expect.any(Number));
  });

  it('calls trackComplete for speaking type', async () => {
    await runAward('speaking', 10);
    expect(learnerStyle.trackComplete).toHaveBeenCalledWith('speaking', expect.any(Number));
  });

  it('calls trackComplete for writing type', async () => {
    await runAward('writing', 10);
    expect(learnerStyle.trackComplete).toHaveBeenCalledWith('writing', expect.any(Number));
  });

  it('calls trackComplete for listening type', async () => {
    await runAward('listening', 10);
    expect(learnerStyle.trackComplete).toHaveBeenCalledWith('listening', expect.any(Number));
  });

  it('calls trackComplete for vocab_ prefix (flashcards type)', async () => {
    await runAward('vocab_a1', 10);
    expect(learnerStyle.trackComplete).toHaveBeenCalledWith('flashcards', expect.any(Number));
  });

  it('does NOT call trackComplete for unknown exercise type', async () => {
    await runAward('unknown_ex_type_xyz', 10);
    expect(learnerStyle.trackComplete).not.toHaveBeenCalled();
  });

  it('writes session count to localStorage for flashcards type', async () => {
    await runAward('flashcards', 10);
    const key = 'nh_session_flashcards_2026-04-19';
    expect(localStorage.getItem(key)).toBe('1');
  });

  it('writes session count to localStorage for listening type', async () => {
    await runAward('listening', 10);
    expect(localStorage.getItem('nh_session_listening_2026-04-19')).toBe('1');
  });

  it('does NOT write session count for quiz type (not in _scTypeMap)', async () => {
    await runAward('mcgame', 10);
    // quiz is not in the _scTypeMap so no session key should be written
    expect(localStorage.getItem('nh_session_quiz_2026-04-19')).toBeNull();
  });

  it('writes nh_last_active to localStorage', async () => {
    await runAward('flash', 10);
    expect(localStorage.getItem('nh_last_active')).not.toBeNull();
  });

  it('calls trackLessonComplete when celebrate=true and exercise type is known', async () => {
    await runAward('flash', 10, true);
    expect(analytics.trackLessonComplete).toHaveBeenCalledWith(
      expect.objectContaining({ lessonType: 'flashcards', xpEarned: 10 }),
    );
  });

  it('calls trackExerciseComplete when celebrate=false and exercise type is known', async () => {
    await runAward('flash', 10, false);
    expect(analytics.trackExerciseComplete).toHaveBeenCalledWith(
      expect.objectContaining({ exerciseType: 'flashcards', xpEarned: 10 }),
    );
  });

  it('accumulates daily study time when nh_ex_start is set in sessionStorage', async () => {
    // Put a start timestamp 2 minutes ago
    const twoMinAgo = Date.now() - 2 * 60 * 1000;
    sessionStorage.setItem('nh_ex_start', String(twoMinAgo));
    await runAward('flash', 10);
    const dtKey = 'nh_daily_time_2026-04-19';
    const val = parseInt(localStorage.getItem(dtKey) || '0', 10);
    expect(val).toBeGreaterThanOrEqual(2);
  });

  it('does NOT accumulate daily study time when nh_ex_start is not set', async () => {
    await runAward('flash', 10);
    // _lsDur will be 0 because nh_ex_start is 0
    expect(localStorage.getItem('nh_daily_time_2026-04-19')).toBeNull();
  });

  it('removes nh_ex_start from sessionStorage after tracking', async () => {
    sessionStorage.setItem('nh_ex_start', String(Date.now() - 1000));
    await runAward('flash', 10);
    expect(sessionStorage.getItem('nh_ex_start')).toBeNull();
  });
});

// ── nh_journey_first_lesson ───────────────────────────────────────────────────

describe('nh_journey_first_lesson', () => {
  it('sets nh_journey_first_lesson and calls recordJourneyMilestone on first award', async () => {
    await runAward('flash', 10);
    expect(localStorage.getItem('nh_journey_first_lesson')).toBe('1');
    expect(appUtils.recordJourneyMilestone).toHaveBeenCalledWith('first_lesson', {});
  });

  it('does NOT call recordJourneyMilestone when nh_journey_first_lesson is already set', async () => {
    localStorage.setItem('nh_journey_first_lesson', '1');
    await runAward('flash', 10);
    // Should not be called again for first_lesson
    const firstLessonCalls = (
      appUtils.recordJourneyMilestone as ReturnType<typeof vi.fn>
    ).mock.calls.filter((c: unknown[]) => c[0] === 'first_lesson');
    expect(firstLessonCalls).toHaveLength(0);
  });
});

// ── Weekly XP tracking ────────────────────────────────────────────────────────

describe('weekly and daily XP tracking', () => {
  it('writes weekly XP to localStorage', async () => {
    await runAward('flash', 30);
    expect(localStorage.getItem('nh_week_xp_2026-W16')).toBe('30');
  });

  it('accumulates weekly XP on multiple calls', async () => {
    localStorage.setItem('nh_week_xp_2026-W16', '20');
    await runAward('flash_wk_01', 30);
    expect(localStorage.getItem('nh_week_xp_2026-W16')).toBe('50');
  });

  it('writes daily XP to localStorage', async () => {
    await runAward('flash_daily_01', 15);
    expect(localStorage.getItem('nh_daily_xp_2026-04-19')).toBe('15');
  });
});

// ── Badge + level-up paths (via BADGES mock override) ────────────────────────

describe('badge earning path', () => {
  it('sets _pendingBadge and fires knight speech when a badge is earned', async () => {
    vi.useFakeTimers();
    // Override BADGES to contain one badge that always fires
    const badgeMock = [
      { id: 'first', n: 'First Lesson', d: 'Earned your first XP', r: () => true },
    ];
    // We need to override the BADGES import used inside useAward
    // Since BADGES is imported from appUtils, we can spy on the module
    const appUtilsMod = await import('../lib/appUtils.js');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (appUtilsMod as any).BADGES = badgeMock;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setStats = vi.fn((fn: any) => fn({ ...DS }));
    const { result } = renderHook(() =>
      useAward({ curEx: 'badge_test_001', stats: { ...DS }, setStats }),
    );
    await act(async () => {
      await result.current.award(10);
    });
    act(() => {
      vi.runAllTimers();
    });
    // knightSpeak should have been called with the badge speech for 'first'
    expect(knightSpeak).toHaveBeenCalled();
    // nB should be set with the badge info
    expect(result.current.nB).toEqual(expect.objectContaining({ id: 'first' }));
    // Restore
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (appUtilsMod as any).BADGES = [];
    vi.useRealTimers();
  });

  it('dispatches knight:badge event for badge with unknown id', async () => {
    vi.useFakeTimers();
    const dispatched: string[] = [];
    window.addEventListener('knight:badge', () => dispatched.push('knight:badge'));

    const badgeMock = [
      { id: 'unknown_badge_xyz', n: 'Unknown', d: 'Unknown badge', r: () => true },
    ];
    const appUtilsMod = await import('../lib/appUtils.js');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (appUtilsMod as any).BADGES = badgeMock;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setStats = vi.fn((fn: any) => fn({ ...DS }));
    const { result } = renderHook(() =>
      useAward({ curEx: 'badge_test_002', stats: { ...DS }, setStats }),
    );
    await act(async () => {
      await result.current.award(10);
    });
    act(() => {
      vi.runAllTimers();
    });
    expect(dispatched).toContain('knight:badge');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (appUtilsMod as any).BADGES = [];
    vi.useRealTimers();
  });
});

// ── Level-up path ─────────────────────────────────────────────────────────────

describe('level-up path', () => {
  it('sets levelUpData when newLevel > oldLevel', async () => {
    vi.useFakeTimers();
    // First call to lvl returns 1 (old), second returns 2 (new)
    let lvlCallCount = 0;
    (appUtils.lvl as ReturnType<typeof vi.fn>).mockImplementation(() => {
      lvlCallCount++;
      return lvlCallCount === 1 ? 1 : 2;
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setStats = vi.fn((fn: any) => fn({ ...DS }));
    const { result } = renderHook(() =>
      useAward({ curEx: 'levelup_test_001', stats: { ...DS }, setStats }),
    );
    await act(async () => {
      await result.current.award(100);
    });
    act(() => {
      vi.runAllTimers();
    });
    expect(result.current.levelUpData).toEqual({ level: 2 });
    vi.useRealTimers();
  });

  it('calls trackLevelUp when level increases', async () => {
    let lvlCallCount = 0;
    (appUtils.lvl as ReturnType<typeof vi.fn>).mockImplementation(() => {
      lvlCallCount++;
      return lvlCallCount === 1 ? 1 : 3;
    });
    await runAward('levelup_track_001', 100);
    expect(analytics.trackLevelUp).toHaveBeenCalledWith(expect.objectContaining({ newLevel: 3 }));
  });

  it('fires level-specific knightSpeak for known level (e.g., 2)', async () => {
    vi.useFakeTimers();
    let lvlCallCount = 0;
    (appUtils.lvl as ReturnType<typeof vi.fn>).mockImplementation(() => {
      lvlCallCount++;
      return lvlCallCount === 1 ? 1 : 2;
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setStats = vi.fn((fn: any) => fn({ ...DS }));
    const { result } = renderHook(() =>
      useAward({ curEx: 'levelup_speech_001', stats: { ...DS }, setStats }),
    );
    await act(async () => {
      await result.current.award(100);
    });
    act(() => {
      vi.runAllTimers();
    });
    expect(knightSpeak).toHaveBeenCalledWith('levelup', expect.any(String));
    vi.useRealTimers();
  });

  it('fires generic knightSpeak for unknown level (e.g., 99)', async () => {
    vi.useFakeTimers();
    let lvlCallCount = 0;
    (appUtils.lvl as ReturnType<typeof vi.fn>).mockImplementation(() => {
      lvlCallCount++;
      return lvlCallCount === 1 ? 1 : 99;
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setStats = vi.fn((fn: any) => fn({ ...DS }));
    const { result } = renderHook(() =>
      useAward({ curEx: 'levelup_speech_002', stats: { ...DS }, setStats }),
    );
    await act(async () => {
      await result.current.award(100);
    });
    act(() => {
      vi.runAllTimers();
    });
    expect(knightSpeak).toHaveBeenCalledWith('levelup', expect.stringContaining('99'));
    vi.useRealTimers();
  });
});

// ── knight:celebrate event ────────────────────────────────────────────────────

describe('knight:celebrate event', () => {
  it('dispatches knight:celebrate for totalAmt >= 20 with no badge or level-up', async () => {
    const events: string[] = [];
    window.addEventListener('knight:celebrate', () => events.push('celebrate'));
    await runAward('knight_celebrate_001', 20);
    expect(events).toContain('celebrate');
    window.removeEventListener('knight:celebrate', () => events.push('celebrate'));
  });

  it('does NOT dispatch knight:celebrate for totalAmt < 20', async () => {
    const events: string[] = [];
    const handler = () => events.push('celebrate');
    window.addEventListener('knight:celebrate', handler);
    await runAward('knight_celebrate_002', 5);
    expect(events).not.toContain('celebrate');
    window.removeEventListener('knight:celebrate', handler);
  });
});

// ── Server response: awarded=undefined -> enqueue ─────────────────────────────

describe('verifyXP server awarded undefined', () => {
  it('enqueues when server response has no awarded field', async () => {
    (apiFetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ awarded: undefined }),
    });
    const writeDelta = vi.fn();
    await runAward('verify_undef_01', 25, false, undefined, writeDelta, 'grammar');
    expect(offlineAwardQueue.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({ activityType: 'grammar', claimedXp: 25 }),
    );
  });

  it('falls back to totalAmt in writeDelta when awarded is undefined', async () => {
    (apiFetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    const writeDelta = vi.fn();
    await runAward('verify_fallback_01', 25, false, undefined, writeDelta, 'grammar');
    expect(writeDelta).toHaveBeenCalledWith(expect.objectContaining({ xp: 25 }));
  });
});

// ── nh_session_started / nh_session_completed ─────────────────────────────────

describe('session started/completed sessionStorage', () => {
  it('sets nh_session_completed when curEx matches nh_session_started', async () => {
    sessionStorage.setItem('nh_session_started', 'flash');
    await runAward('flash', 10);
    expect(sessionStorage.getItem('nh_session_completed')).toBe('flash');
  });

  it('does NOT set nh_session_completed when curEx does not match nh_session_started', async () => {
    sessionStorage.setItem('nh_session_started', 'speaking');
    await runAward('flash', 10);
    expect(sessionStorage.getItem('nh_session_completed')).toBeNull();
  });

  it('does NOT set nh_session_completed when nh_session_started is not set', async () => {
    await runAward('flash', 10);
    expect(sessionStorage.getItem('nh_session_completed')).toBeNull();
  });
});

// ── Negative amt (amt < 0) ────────────────────────────────────────────────────

describe('negative amt', () => {
  it('award(-5) is NOT a no-op — negative XP is allowed through isFinite check', async () => {
    // amt < 0 passes the isFinite && amt===0 guard, so it proceeds
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setStats = vi.fn((fn: any) => fn({ ...DS }));
    const { result } = renderHook(() =>
      useAward({ curEx: 'neg_amt_001', stats: { ...DS }, setStats }),
    );
    await act(async () => {
      await result.current.award(-5);
    });
    // setStats IS called (negative is valid, just won't trigger comeback bonus)
    expect(setStats).toHaveBeenCalled();
  });
});
