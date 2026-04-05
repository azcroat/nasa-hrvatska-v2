import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDaily } from '../hooks/useDaily';

function clearLS() { localStorage.clear(); }

function todayKey() {
  const d = new Date();
  return d.getFullYear() + '-'
    + String(d.getMonth() + 1).padStart(2, '0') + '-'
    + String(d.getDate()).padStart(2, '0');
}

describe('useDaily — daily challenge persistence', () => {
  beforeEach(clearLS);
  afterEach(() => { clearLS(); vi.useRealTimers(); });

  // ── initial state (nothing stored) ────────────────────────────────────────

  it('dchlA defaults to [false, false, false]', () => {
    const { result } = renderHook(() => useDaily());
    expect(result.current.dchlA).toEqual([false, false, false]);
  });

  it('dchlSl defaults to ["", "", ""]', () => {
    const { result } = renderHook(() => useDaily());
    expect(result.current.dchlSl).toEqual(['', '', '']);
  });

  it('exposes setter functions', () => {
    const { result } = renderHook(() => useDaily());
    expect(typeof result.current.sDchlA).toBe('function');
    expect(typeof result.current.sDchlSl).toBe('function');
  });

  // ── loads from dcDay3 (primary source) ───────────────────────────────────

  it('loads answered state from dcDay3 when day matches today', () => {
    localStorage.setItem('dcDay3', JSON.stringify({
      day: todayKey(),
      answered: [true, false, true],
      selected: ['a', '', 'c'],
    }));
    const { result } = renderHook(() => useDaily());
    expect(result.current.dchlA).toEqual([true, false, true]);
  });

  it('loads selected state from dcDay3 when day matches today', () => {
    localStorage.setItem('dcDay3', JSON.stringify({
      day: todayKey(),
      answered: [true, true, false],
      selected: ['x', 'y', ''],
    }));
    const { result } = renderHook(() => useDaily());
    expect(result.current.dchlSl).toEqual(['x', 'y', '']);
  });

  it('ignores dcDay3 when day does not match today', () => {
    localStorage.setItem('dcDay3', JSON.stringify({
      day: '2020-01-01',
      answered: [true, true, true],
      selected: ['a', 'b', 'c'],
    }));
    const { result } = renderHook(() => useDaily());
    expect(result.current.dchlA).toEqual([false, false, false]);
  });

  // ── falls back to main progress doc ──────────────────────────────────────

  it('falls back to main progress doc when dcDay3 absent', () => {
    localStorage.setItem('uS', JSON.stringify({ u: 'user1' }));
    localStorage.setItem('uP_user1', JSON.stringify({
      dc: { day: todayKey(), answered: [true, true, false], selected: ['a', 'b', ''] },
    }));
    const { result } = renderHook(() => useDaily());
    expect(result.current.dchlA).toEqual([true, true, false]);
  });

  it('falls back to main progress doc selected when dcDay3 absent', () => {
    localStorage.setItem('uS', JSON.stringify({ u: 'user1' }));
    localStorage.setItem('uP_user1', JSON.stringify({
      dc: { day: todayKey(), answered: [false, false, false], selected: ['opt1', 'opt2', ''] },
    }));
    const { result } = renderHook(() => useDaily());
    expect(result.current.dchlSl).toEqual(['opt1', 'opt2', '']);
  });

  it('returns defaults when uS session is absent (fallback returns null)', () => {
    // No uS stored → loadFromMainDoc returns null → defaults used
    const { result } = renderHook(() => useDaily());
    expect(result.current.dchlA).toEqual([false, false, false]);
  });

  it('returns defaults when main progress doc day does not match', () => {
    localStorage.setItem('uS', JSON.stringify({ u: 'user1' }));
    localStorage.setItem('uP_user1', JSON.stringify({
      dc: { day: '2020-01-01', answered: [true, true, true], selected: ['a', 'b', 'c'] },
    }));
    const { result } = renderHook(() => useDaily());
    expect(result.current.dchlA).toEqual([false, false, false]);
  });

  // ── merge logic ───────────────────────────────────────────────────────────

  it('merges dcDay3 and main progress doc answered arrays (OR merge)', () => {
    // dcDay3 has answers for positions 0 and 2; main progress doc has answer for position 1
    localStorage.setItem('dcDay3', JSON.stringify({
      day: todayKey(),
      answered: [true, false, true],
      selected: ['a', '', 'c'],
    }));
    localStorage.setItem('uS', JSON.stringify({ u: 'user1' }));
    localStorage.setItem('uP_user1', JSON.stringify({
      dc: { day: todayKey(), answered: [true, true, false], selected: ['a', 'b', ''] },
    }));
    const { result } = renderHook(() => useDaily());
    // Merged: each position takes whichever source has true
    expect(result.current.dchlA[1]).toBe(true);
  });
});
