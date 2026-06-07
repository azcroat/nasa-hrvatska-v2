// src/tests/useCheckpoint.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCheckpoint } from '../hooks/useCheckpoint.js';

vi.mock('../lib/speaking/whisperClaudeScorer.js', () => ({
  whisperClaudeScorer: { assess: vi.fn() },
}));

describe('useCheckpoint', () => {
  beforeEach(() => localStorage.clear());

  it('starts idle, advances to running on start(), and to result after complete()', () => {
    const { result } = renderHook(() =>
      useCheckpoint({ certifiedLevel: 'B1', weakSkills: [], activeDayCount: 10 }),
    );
    expect(result.current.phase).toBe('idle');
    act(() => result.current.start());
    expect(result.current.phase).toBe('running');
    expect(result.current.exam?.questions.length).toBeGreaterThan(0);
    act(() => result.current.complete({ vocab: 0.95, grammar: 0.9, speaking: 0.92 }));
    expect(result.current.phase).toBe('result');
    expect(result.current.outcome?.kind).toBe('pass');
  });

  it('snooze() sets phase to idle and persists snoozedUntil', () => {
    const { result } = renderHook(() =>
      useCheckpoint({ certifiedLevel: 'B1', weakSkills: [], activeDayCount: 10 }),
    );
    act(() => result.current.snooze(999999));
    expect(result.current.phase).toBe('idle');
  });
});
