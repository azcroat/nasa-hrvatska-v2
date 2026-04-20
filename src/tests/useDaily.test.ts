/**
 * useDaily.test.ts — TypeScript tests for the useDaily hook.
 *
 * Complements useDaily.test.js (JavaScript) with typed state-update assertions
 * and additional edge-case coverage for the sDchlA / sDchlSl setters.
 *
 * The hook state property names are:
 *   dchlA  / sDchlA  — daily challenge answered array (boolean[])
 *   dchlSl / sDchlSl — daily challenge selected array (string[])
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDaily } from '../hooks/useDaily';

function todayKey(): string {
  const d = new Date();
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

beforeEach(() => localStorage.clear());
afterEach(() => {
  localStorage.clear();
  vi.useRealTimers();
});

// ── Return shape ──────────────────────────────────────────────────────────────

describe('useDaily — return shape', () => {
  it('returns dchlA as an array', () => {
    const { result } = renderHook(() => useDaily());
    expect(Array.isArray(result.current.dchlA)).toBe(true);
  });

  it('returns dchlSl as an array', () => {
    const { result } = renderHook(() => useDaily());
    expect(Array.isArray(result.current.dchlSl)).toBe(true);
  });

  it('returns sDchlA as a function', () => {
    const { result } = renderHook(() => useDaily());
    expect(typeof result.current.sDchlA).toBe('function');
  });

  it('returns sDchlSl as a function', () => {
    const { result } = renderHook(() => useDaily());
    expect(typeof result.current.sDchlSl).toBe('function');
  });
});

// ── State initialization ──────────────────────────────────────────────────────

describe('useDaily — state initialization', () => {
  it('defaults dchlA to [false, false, false] when no localStorage data', () => {
    const { result } = renderHook(() => useDaily());
    expect(result.current.dchlA).toEqual([false, false, false]);
  });

  it('defaults dchlSl to ["", "", ""] when no localStorage data', () => {
    const { result } = renderHook(() => useDaily());
    expect(result.current.dchlSl).toEqual(['', '', '']);
  });

  it("ignores stale dcDay3 data (yesterday's answers) and returns defaults", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr =
      yesterday.getFullYear() +
      '-' +
      String(yesterday.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(yesterday.getDate()).padStart(2, '0');
    localStorage.setItem(
      'dcDay3',
      JSON.stringify({
        day: yStr,
        answered: [true, true, true],
        selected: ['x', 'y', 'z'],
      }),
    );
    const { result } = renderHook(() => useDaily());
    expect(result.current.dchlA).toEqual([false, false, false]);
  });

  it("loads today's answered array from dcDay3", () => {
    localStorage.setItem(
      'dcDay3',
      JSON.stringify({
        day: todayKey(),
        answered: [true, false, true],
        selected: ['a', '', 'c'],
      }),
    );
    const { result } = renderHook(() => useDaily());
    expect(result.current.dchlA).toEqual([true, false, true]);
  });

  it("loads today's selected array from dcDay3", () => {
    localStorage.setItem(
      'dcDay3',
      JSON.stringify({
        day: todayKey(),
        answered: [true, true, false],
        selected: ['opt1', 'opt2', ''],
      }),
    );
    const { result } = renderHook(() => useDaily());
    expect(result.current.dchlSl).toEqual(['opt1', 'opt2', '']);
  });

  it('returns defaults when dcDay3 contains malformed JSON', () => {
    localStorage.setItem('dcDay3', 'not-valid-json');
    const { result } = renderHook(() => useDaily());
    expect(result.current.dchlA).toEqual([false, false, false]);
  });

  it('falls back to main progress doc when dcDay3 is absent', () => {
    localStorage.setItem('uS', JSON.stringify({ u: 'testuser1' }));
    localStorage.setItem(
      'uP_testuser1',
      JSON.stringify({
        dc: { day: todayKey(), answered: [false, true, true], selected: ['', 'b', 'c'] },
      }),
    );
    const { result } = renderHook(() => useDaily());
    expect(result.current.dchlA).toEqual([false, true, true]);
  });
});

// ── State updates ─────────────────────────────────────────────────────────────

describe('useDaily — state updates', () => {
  it('sDchlA updates dchlA state', () => {
    const { result } = renderHook(() => useDaily());
    act(() => {
      result.current.sDchlA([true, false, true]);
    });
    expect(result.current.dchlA).toEqual([true, false, true]);
  });

  it('sDchlSl updates dchlSl state', () => {
    const { result } = renderHook(() => useDaily());
    act(() => {
      result.current.sDchlSl(['option_a', 'option_b', '']);
    });
    expect(result.current.dchlSl).toEqual(['option_a', 'option_b', '']);
  });

  it('sDchlA can update to all-true array', () => {
    const { result } = renderHook(() => useDaily());
    act(() => {
      result.current.sDchlA([true, true, true]);
    });
    expect(result.current.dchlA).toEqual([true, true, true]);
  });

  it('sDchlA can reset to all-false array', () => {
    const { result } = renderHook(() => useDaily());
    act(() => {
      result.current.sDchlA([true, true, true]);
    });
    act(() => {
      result.current.sDchlA([false, false, false]);
    });
    expect(result.current.dchlA).toEqual([false, false, false]);
  });

  it('sDchlSl can update individual options', () => {
    const { result } = renderHook(() => useDaily());
    act(() => {
      result.current.sDchlSl(['answer_1']);
    });
    expect(result.current.dchlSl).toEqual(['answer_1']);
  });

  it('sDchlSl can reset to empty array', () => {
    const { result } = renderHook(() => useDaily());
    act(() => {
      result.current.sDchlSl(['something']);
    });
    act(() => {
      result.current.sDchlSl([]);
    });
    expect(result.current.dchlSl).toEqual([]);
  });

  it('sDchlA and sDchlSl are independent state slices', () => {
    const { result } = renderHook(() => useDaily());
    act(() => {
      result.current.sDchlA([true, true, false]);
    });
    // dchlSl should not be affected by sDchlA change
    expect(result.current.dchlSl).toEqual(['', '', '']);
  });

  it('multiple sequential sDchlA calls update state correctly', () => {
    const { result } = renderHook(() => useDaily());
    act(() => {
      result.current.sDchlA([true, false, false]);
    });
    act(() => {
      result.current.sDchlA([true, true, false]);
    });
    act(() => {
      result.current.sDchlA([true, true, true]);
    });
    expect(result.current.dchlA).toEqual([true, true, true]);
  });
});
