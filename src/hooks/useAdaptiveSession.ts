import { useState, useCallback } from 'react';
import type { SkillCategory } from '../lib/adaptive';

interface SessionState {
  currentDifficulty: 1 | 2 | 3 | 4 | 5;
  correctStreak: number;
  wrongStreak: number;
  categoryAccuracy: Partial<Record<SkillCategory, { correct: number; total: number }>>;
}

export interface UseAdaptiveSession {
  currentDifficulty: 1 | 2 | 3 | 4 | 5;
  onCorrect: (category: SkillCategory) => void;
  onWrong: (category: SkillCategory) => void;
  sessionSummary: () => Partial<Record<SkillCategory, number>>;
  reset: (initialDifficulty?: 1 | 2 | 3 | 4 | 5) => void;
}

function clampDifficulty(value: number): 1 | 2 | 3 | 4 | 5 {
  return Math.min(5, Math.max(1, value)) as 1 | 2 | 3 | 4 | 5;
}

export function useAdaptiveSession(initialDifficulty: 1 | 2 | 3 | 4 | 5 = 3): UseAdaptiveSession {
  const [state, setState] = useState<SessionState>({
    currentDifficulty: initialDifficulty,
    correctStreak: 0,
    wrongStreak: 0,
    categoryAccuracy: {},
  });

  const onCorrect = useCallback((category: SkillCategory) => {
    setState((prev) => {
      // Update category accuracy
      const existing = prev.categoryAccuracy[category] ?? { correct: 0, total: 0 };
      const updatedAccuracy: Partial<Record<SkillCategory, { correct: number; total: number }>> = {
        ...prev.categoryAccuracy,
        [category]: { correct: existing.correct + 1, total: existing.total + 1 },
      };

      // Update streaks — increment correctStreak, reset wrongStreak
      const newCorrectStreak = prev.correctStreak + 1;
      const newWrongStreak = 0;

      // Check if streak threshold reached (3 correct in a row)
      if (newCorrectStreak >= 3) {
        return {
          currentDifficulty: clampDifficulty(prev.currentDifficulty + 1),
          correctStreak: 0,
          wrongStreak: 0,
          categoryAccuracy: updatedAccuracy,
        };
      }

      return {
        ...prev,
        currentDifficulty: prev.currentDifficulty,
        correctStreak: newCorrectStreak,
        wrongStreak: newWrongStreak,
        categoryAccuracy: updatedAccuracy,
      };
    });
  }, []);

  const onWrong = useCallback((category: SkillCategory) => {
    setState((prev) => {
      // Update category accuracy — only total, not correct
      const existing = prev.categoryAccuracy[category] ?? { correct: 0, total: 0 };
      const updatedAccuracy: Partial<Record<SkillCategory, { correct: number; total: number }>> = {
        ...prev.categoryAccuracy,
        [category]: { correct: existing.correct, total: existing.total + 1 },
      };

      // Update streaks — increment wrongStreak, reset correctStreak
      const newWrongStreak = prev.wrongStreak + 1;
      const newCorrectStreak = 0;

      // Check if streak threshold reached (2 wrong in a row)
      if (newWrongStreak >= 2) {
        return {
          currentDifficulty: clampDifficulty(prev.currentDifficulty - 1),
          correctStreak: 0,
          wrongStreak: 0,
          categoryAccuracy: updatedAccuracy,
        };
      }

      return {
        ...prev,
        currentDifficulty: prev.currentDifficulty,
        correctStreak: newCorrectStreak,
        wrongStreak: newWrongStreak,
        categoryAccuracy: updatedAccuracy,
      };
    });
  }, []);

  const sessionSummary = useCallback((): Partial<Record<SkillCategory, number>> => {
    const result: Partial<Record<SkillCategory, number>> = {};
    for (const [cat, data] of Object.entries(state.categoryAccuracy) as Array<
      [SkillCategory, { correct: number; total: number }]
    >) {
      if (data.total > 0) {
        result[cat] = data.correct / data.total;
      }
    }
    return result;
  }, [state.categoryAccuracy]);

  const reset = useCallback((newInitialDifficulty: 1 | 2 | 3 | 4 | 5 = 3) => {
    setState({
      currentDifficulty: newInitialDifficulty,
      correctStreak: 0,
      wrongStreak: 0,
      categoryAccuracy: {},
    });
  }, []);

  return {
    currentDifficulty: state.currentDifficulty,
    onCorrect,
    onWrong,
    sessionSummary,
    reset,
  };
}
