import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAdaptiveSession } from '../../src/hooks/useAdaptiveSession';

// ── Initial state ─────────────────────────────────────────────────────────────

describe('useAdaptiveSession initial state', () => {
  it('currentDifficulty defaults to 3', () => {
    const { result } = renderHook(() => useAdaptiveSession());
    expect(result.current.currentDifficulty).toBe(3);
  });

  it('currentDifficulty is 2 when initialized with 2', () => {
    const { result } = renderHook(() => useAdaptiveSession(2));
    expect(result.current.currentDifficulty).toBe(2);
  });
});

// ── onCorrect streak logic ────────────────────────────────────────────────────

describe('onCorrect', () => {
  it('3 correct in a row increases difficulty by 1', () => {
    const { result } = renderHook(() => useAdaptiveSession(3));
    act(() => {
      result.current.onCorrect('genitive');
      result.current.onCorrect('genitive');
      result.current.onCorrect('genitive');
    });
    expect(result.current.currentDifficulty).toBe(4);
  });

  it('3 correct in a row resets streaks to 0 (no further adjustment on 4th correct)', () => {
    const { result } = renderHook(() => useAdaptiveSession(3));
    act(() => {
      result.current.onCorrect('accusative');
      result.current.onCorrect('accusative');
      result.current.onCorrect('accusative');
    });
    // After reset, one more correct should NOT immediately trigger another bump
    act(() => {
      result.current.onCorrect('accusative');
    });
    // Should still be 4 (streaks were reset, so we need 2 more for next bump)
    expect(result.current.currentDifficulty).toBe(4);
  });

  it('difficulty caps at 5 (no going above)', () => {
    const { result } = renderHook(() => useAdaptiveSession(5));
    act(() => {
      result.current.onCorrect('past-tense');
      result.current.onCorrect('past-tense');
      result.current.onCorrect('past-tense');
    });
    expect(result.current.currentDifficulty).toBe(5);
  });
});

// ── onWrong streak logic ──────────────────────────────────────────────────────

describe('onWrong', () => {
  it('2 wrong in a row decreases difficulty by 1', () => {
    const { result } = renderHook(() => useAdaptiveSession(3));
    act(() => {
      result.current.onWrong('clitics');
      result.current.onWrong('clitics');
    });
    expect(result.current.currentDifficulty).toBe(2);
  });

  it('2 wrong in a row resets streaks to 0 (no further adjustment on 3rd wrong)', () => {
    const { result } = renderHook(() => useAdaptiveSession(3));
    act(() => {
      result.current.onWrong('instrumental');
      result.current.onWrong('instrumental');
    });
    // After reset, one more wrong should NOT immediately trigger another drop
    act(() => {
      result.current.onWrong('instrumental');
    });
    expect(result.current.currentDifficulty).toBe(2);
  });

  it('difficulty floors at 1 (no going below)', () => {
    const { result } = renderHook(() => useAdaptiveSession(1));
    act(() => {
      result.current.onWrong('future-tense');
      result.current.onWrong('future-tense');
    });
    expect(result.current.currentDifficulty).toBe(1);
  });
});

// ── Streak independence ───────────────────────────────────────────────────────

describe('streak independence', () => {
  it('correct then wrong does not trigger either adjustment (streaks both reset)', () => {
    const { result } = renderHook(() => useAdaptiveSession(3));
    act(() => {
      result.current.onCorrect('speaking');
    });
    act(() => {
      result.current.onWrong('speaking');
    });
    // correctStreak was 1, then reset to 0 by wrong. wrongStreak is 1.
    // No threshold crossed — difficulty unchanged.
    expect(result.current.currentDifficulty).toBe(3);
  });
});

// ── sessionSummary ────────────────────────────────────────────────────────────

describe('sessionSummary', () => {
  it('returns correct accuracy per category', () => {
    const { result } = renderHook(() => useAdaptiveSession());
    act(() => {
      result.current.onCorrect('genitive');
      result.current.onCorrect('genitive');
      result.current.onWrong('genitive');
      result.current.onCorrect('accusative');
    });
    const summary = result.current.sessionSummary();
    // genitive: 2 correct / 3 total = 0.666...
    expect(summary['genitive']).toBeCloseTo(2 / 3);
    // accusative: 1 correct / 1 total = 1.0
    expect(summary['accusative']).toBe(1.0);
  });

  it('excludes categories with zero practice', () => {
    const { result } = renderHook(() => useAdaptiveSession());
    act(() => {
      result.current.onCorrect('genitive');
    });
    const summary = result.current.sessionSummary();
    // Only 'genitive' should be present
    expect(Object.keys(summary)).toEqual(['genitive']);
    expect('accusative' in summary).toBe(false);
  });
});

// ── reset ─────────────────────────────────────────────────────────────────────

describe('reset', () => {
  it('resets difficulty to provided initial value', () => {
    const { result } = renderHook(() => useAdaptiveSession(3));
    act(() => {
      result.current.onCorrect('vocative');
      result.current.onCorrect('vocative');
      result.current.onCorrect('vocative');
    });
    expect(result.current.currentDifficulty).toBe(4);
    act(() => {
      result.current.reset(2);
    });
    expect(result.current.currentDifficulty).toBe(2);
  });

  it('resets categoryAccuracy to empty', () => {
    const { result } = renderHook(() => useAdaptiveSession());
    act(() => {
      result.current.onCorrect('clitics');
      result.current.onWrong('clitics');
    });
    // Summary should have clitics
    expect(Object.keys(result.current.sessionSummary()).length).toBeGreaterThan(0);
    act(() => {
      result.current.reset();
    });
    // After reset, summary should be empty
    expect(Object.keys(result.current.sessionSummary()).length).toBe(0);
  });
});
