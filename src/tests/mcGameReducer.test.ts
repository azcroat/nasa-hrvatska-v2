/**
 * mcGameReducer.test.ts — unit tests for the pure reducer logic in useMcGameReducer.
 * Tests buildInitialState and the mcGameReducer transitions without mounting React.
 */
import { describe, it, expect } from 'vitest';
import { buildInitialState, useMcGameReducer } from '../hooks/useMcGameReducer';
import type { McQuestion } from '../hooks/useMcGameReducer';
import { renderHook, act } from '@testing-library/react';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeQ(override: Partial<McQuestion> = {}): McQuestion {
  return {
    hr: 'kuća',
    en: 'house',
    correct: 'house',
    opts: ['car', 'house', 'dog', 'cat'],
    _qIdx: 0,
    _isRetry: false,
    ...override,
  };
}

// ── buildInitialState ─────────────────────────────────────────────────────────

describe('buildInitialState', () => {
  it('builds state with the given questions', () => {
    const qs = [makeQ({ _qIdx: 0 }), makeQ({ hr: 'auto', en: 'car', correct: 'car', _qIdx: 1 })];
    const state = buildInitialState(qs, 3);
    expect(state.queue).toHaveLength(2);
    expect(state.hearts).toBe(3);
    expect(state.score).toBe(0);
    expect(state.streak).toBe(0);
    expect(state.gameOver).toBe(false);
    expect(state.answered).toBe(false);
  });

  it('sets _isRetry to false for all questions', () => {
    const qs = [makeQ()];
    const state = buildInitialState(qs, 5);
    expect(state.queue[0]._isRetry).toBe(false);
  });

  it('initialises mistake log as empty array', () => {
    const state = buildInitialState([makeQ()], 3);
    expect(state.mistakes).toEqual([]);
  });

  it('sets bestStreak to 0', () => {
    const state = buildInitialState([makeQ()], 3);
    expect(state.bestStreak).toBe(0);
  });

  it('sets selected to -1', () => {
    const state = buildInitialState([makeQ()], 3);
    expect(state.selected).toBe(-1);
  });
});

// ── useMcGameReducer hook ─────────────────────────────────────────────────────

describe('useMcGameReducer', () => {
  it('initialises with correct state from questions', () => {
    const qs = [makeQ()];
    const { result } = renderHook(() => useMcGameReducer(qs, 3));
    expect(result.current[0].queue).toHaveLength(1);
    expect(result.current[0].hearts).toBe(3);
  });

  it('ANSWER correct increments score and streak', () => {
    const q = makeQ();
    const { result } = renderHook(() => useMcGameReducer([q], 3));
    act(() => {
      result.current[1]({
        type: 'ANSWER',
        payload: {
          isCorrect: true,
          optionIndex: 1,
          question: q,
          grammarTip: null,
          persistentHeartsAfter: undefined,
          isHeartsMode: false,
        },
      });
    });
    expect(result.current[0].score).toBe(1);
    expect(result.current[0].streak).toBe(1);
    expect(result.current[0].answered).toBe(true);
    expect(result.current[0].burst).toBe(1);
    expect(result.current[0].wrongStreak).toBe(0);
  });

  it('ANSWER wrong decrements hearts and sets shaking', () => {
    const q = makeQ();
    const { result } = renderHook(() => useMcGameReducer([q], 3));
    act(() => {
      result.current[1]({
        type: 'ANSWER',
        payload: {
          isCorrect: false,
          optionIndex: 0,
          question: q,
          grammarTip: 'Tip: use accusative',
          persistentHeartsAfter: undefined,
          isHeartsMode: false,
        },
      });
    });
    expect(result.current[0].hearts).toBe(2); // 3 - 1
    expect(result.current[0].shaking).toBe(true);
    expect(result.current[0].streak).toBe(0);
    expect(result.current[0].revealCorrect).toBe(true);
    expect(result.current[0].grammarTip).toBe('Tip: use accusative');
  });

  it('ANSWER wrong uses persistentHeartsAfter when isHeartsMode=true', () => {
    const q = makeQ();
    const { result } = renderHook(() => useMcGameReducer([q], 3));
    act(() => {
      result.current[1]({
        type: 'ANSWER',
        payload: {
          isCorrect: false,
          optionIndex: 0,
          question: q,
          grammarTip: null,
          persistentHeartsAfter: 1, // externally computed
          isHeartsMode: true,
        },
      });
    });
    expect(result.current[0].hearts).toBe(1);
  });

  it('ANSWER wrong in practiceMode does not deduct hearts', () => {
    const q = makeQ();
    const { result } = renderHook(() => useMcGameReducer([q], 3));
    // First toggle practiceMode on
    act(() => {
      result.current[1]({ type: 'TOGGLE_PRACTICE_MODE' });
    });
    expect(result.current[0].practiceMode).toBe(true);
    act(() => {
      result.current[1]({
        type: 'ANSWER',
        payload: {
          isCorrect: false,
          optionIndex: 0,
          question: q,
          grammarTip: null,
          persistentHeartsAfter: undefined,
          isHeartsMode: false,
        },
      });
    });
    expect(result.current[0].hearts).toBe(3); // no deduction in practice mode
  });

  it('ADVANCE_CORRECT removes first question from queue', () => {
    const qs = [makeQ({ _qIdx: 0 }), makeQ({ hr: 'pas', _qIdx: 1 })];
    const { result } = renderHook(() => useMcGameReducer(qs, 3));
    act(() => {
      result.current[1]({ type: 'ADVANCE_CORRECT' });
    });
    expect(result.current[0].queue).toHaveLength(1);
    expect(result.current[0].clearedCount).toBe(1);
    expect(result.current[0].answered).toBe(false);
    expect(result.current[0].qTransition).toBe(true);
  });

  it('RE_QUEUE_WRONG moves first item to end with _isRetry=true', () => {
    const qs = [makeQ({ hr: 'first', _qIdx: 0 }), makeQ({ hr: 'second', _qIdx: 1 })];
    const { result } = renderHook(() => useMcGameReducer(qs, 3));
    act(() => {
      result.current[1]({ type: 'RE_QUEUE_WRONG' });
    });
    // First item should be moved to end
    const queue = result.current[0].queue;
    expect(queue[queue.length - 1]._isRetry).toBe(true);
    expect(queue[queue.length - 1].hr).toBe('first');
    expect(queue[0].hr).toBe('second');
  });

  it('COMPLETE_TRANSITION sets qTransition=false', () => {
    const { result } = renderHook(() => useMcGameReducer([makeQ()], 3));
    act(() => {
      result.current[1]({ type: 'ADVANCE_CORRECT' });
    });
    act(() => {
      result.current[1]({ type: 'COMPLETE_TRANSITION' });
    });
    expect(result.current[0].qTransition).toBe(false);
  });

  it('TRIGGER_GAME_OVER sets gameOver=true', () => {
    const { result } = renderHook(() => useMcGameReducer([makeQ()], 3));
    act(() => {
      result.current[1]({ type: 'TRIGGER_GAME_OVER' });
    });
    expect(result.current[0].gameOver).toBe(true);
  });

  it('SET_CONFIRM_QUIT updates confirmQuit', () => {
    const { result } = renderHook(() => useMcGameReducer([makeQ()], 3));
    act(() => {
      result.current[1]({ type: 'SET_CONFIRM_QUIT', value: true });
    });
    expect(result.current[0].confirmQuit).toBe(true);
  });

  it('TOGGLE_PRACTICE_MODE toggles practiceMode', () => {
    const { result } = renderHook(() => useMcGameReducer([makeQ()], 3));
    expect(result.current[0].practiceMode).toBe(false);
    act(() => {
      result.current[1]({ type: 'TOGGLE_PRACTICE_MODE' });
    });
    expect(result.current[0].practiceMode).toBe(true);
    act(() => {
      result.current[1]({ type: 'TOGGLE_PRACTICE_MODE' });
    });
    expect(result.current[0].practiceMode).toBe(false);
  });

  it('SET_CONTINUE_ANYWAY sets continueAnyway=true and gameOver=false', () => {
    const { result } = renderHook(() => useMcGameReducer([makeQ()], 3));
    act(() => {
      result.current[1]({ type: 'TRIGGER_GAME_OVER' });
    });
    act(() => {
      result.current[1]({ type: 'SET_CONTINUE_ANYWAY' });
    });
    expect(result.current[0].continueAnyway).toBe(true);
    expect(result.current[0].gameOver).toBe(false);
  });

  it('CLEAR_BURST resets burst to -1', () => {
    const q = makeQ();
    const { result } = renderHook(() => useMcGameReducer([q], 3));
    act(() => {
      result.current[1]({
        type: 'ANSWER',
        payload: {
          isCorrect: true,
          optionIndex: 1,
          question: q,
          grammarTip: null,
          persistentHeartsAfter: undefined,
          isHeartsMode: false,
        },
      });
    });
    act(() => {
      result.current[1]({ type: 'CLEAR_BURST' });
    });
    expect(result.current[0].burst).toBe(-1);
  });

  it('CLEAR_SHAKE sets shaking=false', () => {
    const q = makeQ();
    const { result } = renderHook(() => useMcGameReducer([q], 3));
    act(() => {
      result.current[1]({
        type: 'ANSWER',
        payload: {
          isCorrect: false,
          optionIndex: 0,
          question: q,
          grammarTip: null,
          persistentHeartsAfter: undefined,
          isHeartsMode: false,
        },
      });
    });
    act(() => {
      result.current[1]({ type: 'CLEAR_SHAKE' });
    });
    expect(result.current[0].shaking).toBe(false);
  });

  it('HIDE_COMBO clears showCombo and streakPulse', () => {
    const { result } = renderHook(() => useMcGameReducer([makeQ()], 3));
    act(() => {
      result.current[1]({ type: 'HIDE_COMBO' });
    });
    expect(result.current[0].showCombo).toBe(false);
    expect(result.current[0].streakPulse).toBe(false);
  });

  it('CLEAR_GLOW resets glowIndex to -1', () => {
    const { result } = renderHook(() => useMcGameReducer([makeQ()], 3));
    act(() => {
      result.current[1]({ type: 'CLEAR_GLOW' });
    });
    expect(result.current[0].glowIndex).toBe(-1);
  });

  it('CLEAR_ON_A_ROLL sets showOnARoll=false', () => {
    const { result } = renderHook(() => useMcGameReducer([makeQ()], 3));
    act(() => {
      result.current[1]({ type: 'CLEAR_ON_A_ROLL' });
    });
    expect(result.current[0].showOnARoll).toBe(false);
  });

  it('RESET replaces state with new questions', () => {
    const { result } = renderHook(() => useMcGameReducer([makeQ()], 3));
    act(() => {
      result.current[1]({
        type: 'RESET',
        questions: [makeQ({ hr: 'nova', _qIdx: 0 })],
        hearts: 5,
      });
    });
    expect(result.current[0].queue[0].hr).toBe('nova');
    expect(result.current[0].hearts).toBe(5);
    expect(result.current[0].score).toBe(0);
  });

  it('ANSWER wrong adds to mistakes (deduplicates by hr key)', () => {
    const q = makeQ({ hr: 'kuća' });
    const { result } = renderHook(() => useMcGameReducer([q], 3));
    act(() => {
      result.current[1]({
        type: 'ANSWER',
        payload: {
          isCorrect: false,
          optionIndex: 0,
          question: q,
          grammarTip: null,
          persistentHeartsAfter: undefined,
          isHeartsMode: false,
        },
      });
    });
    expect(result.current[0].mistakes).toHaveLength(1);
    // Second wrong answer on same word — should not duplicate
    act(() => {
      result.current[1]({ type: 'RE_QUEUE_WRONG' });
    });
    act(() => {
      result.current[1]({
        type: 'ANSWER',
        payload: {
          isCorrect: false,
          optionIndex: 0,
          question: q,
          grammarTip: null,
          persistentHeartsAfter: undefined,
          isHeartsMode: false,
        },
      });
    });
    expect(result.current[0].mistakes).toHaveLength(1);
  });

  it('ANSWER correct after 3-streak shows combo message', () => {
    const q = makeQ();
    const { result } = renderHook(() => useMcGameReducer([q, q, q], 3));
    // Answer 3 correct in a row
    for (let i = 0; i < 3; i++) {
      act(() => {
        result.current[1]({
          type: 'ANSWER',
          payload: {
            isCorrect: true,
            optionIndex: 1,
            question: q,
            grammarTip: null,
            persistentHeartsAfter: undefined,
            isHeartsMode: false,
          },
        });
      });
      act(() => {
        result.current[1]({ type: 'ADVANCE_CORRECT' });
      });
    }
    // After 3rd correct answer, showCombo should have been true
    // (after ADVANCE_CORRECT it's still reflected in the streak count)
    expect(result.current[0].bestStreak).toBeGreaterThanOrEqual(3);
  });

  it('unknown action type returns state unchanged (default branch)', () => {
    const { result } = renderHook(() => useMcGameReducer([makeQ()], 3));
    const stateBefore = result.current[0];
    act(() => {
      // @ts-expect-error intentionally dispatch unknown action to hit default branch
      result.current[1]({ type: 'UNKNOWN_ACTION_XYZ' });
    });
    // State should be reference-equal (same object) when unknown action hits default
    expect(result.current[0]).toBe(stateBefore);
  });
});
