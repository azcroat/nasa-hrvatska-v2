import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAlkaRide } from '../components/practice/alka/useAlkaRide';
import type { GameQuestion } from '../lib/gamification/exerciseSource';

const Q = (i: number): GameQuestion => ({
  id: `q${i}`,
  prompt: `prompt ${i}`,
  options: ['a', 'b', 'c'],
  correctIndex: 1,
});
const nineQuestions = Array.from({ length: 9 }, (_, i) => Q(i));

describe('useAlkaRide', () => {
  beforeEach(() => localStorage.clear());

  it('starts on run 1, question 0, status playing', () => {
    const { result } = renderHook(() => useAlkaRide({ questions: nineQuestions, onXp: () => {} }));
    expect(result.current.status).toBe('playing');
    expect(result.current.runIndex).toBe(0);
    expect(result.current.current.id).toBe('q0');
  });

  it('all-correct-and-fast ride scores 9/9 and ends in result', () => {
    let awarded = 0;
    const { result } = renderHook(() =>
      useAlkaRide({ questions: nineQuestions, onXp: (n) => (awarded += n) }),
    );
    act(() => {
      for (let i = 0; i < 9; i++) result.current.answer(1, 500); // correct, fast
    });
    expect(result.current.status).toBe('result');
    expect(result.current.total).toBe(9);
    expect(result.current.isNewBest).toBe(true);
    expect(awarded).toBeGreaterThan(0);
  });

  it('one wrong answer caps that run at the lower field', () => {
    const { result } = renderHook(() => useAlkaRide({ questions: nineQuestions, onXp: () => {} }));
    act(() => {
      result.current.answer(0, 500); // wrong (correctIndex is 1)
      result.current.answer(1, 500);
      result.current.answer(1, 500);
      for (let i = 0; i < 6; i++) result.current.answer(1, 500);
    });
    expect(result.current.runZones[0]).toBe(1);
  });
});
