import { describe, it, expect } from 'vitest';
import {
  selectQuestions,
  toGameQuestion,
  type GameQuestion,
} from '../lib/gamification/exerciseSource';

type DebugQuestion = GameQuestion & { _d: number };

describe('toGameQuestion', () => {
  it('maps {q,o,c} raw exercise to GameQuestion shape', () => {
    const g = toGameQuestion(
      {
        q: "What does 'Bog' mean?",
        o: ['Goodbye', 'Hello', 'Thank you'],
        c: 1,
        d: 1,
        skill: 'culture',
      },
      0,
    );
    expect(g).toEqual({
      id: 'ex-0',
      prompt: "What does 'Bog' mean?",
      options: ['Goodbye', 'Hello', 'Thank you'],
      correctIndex: 1,
    });
  });
});

describe('selectQuestions', () => {
  it('returns exactly the requested count of valid questions', () => {
    const qs = selectQuestions({ xp: 0, lc: 0, gc: 0, count: 9 });
    expect(qs).toHaveLength(9);
    for (const q of qs) {
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(q.options.length);
    }
  });

  it('beginner user (A1) gets only difficulty-1 questions', () => {
    const qs = selectQuestions({
      xp: 0,
      lc: 0,
      gc: 0,
      count: 9,
      _debugReturnRaw: true,
    }) as DebugQuestion[];
    expect(qs.every((q) => q._d === 1)).toBe(true);
  });

  it('advanced user (B1+) may include difficulty-2 questions', () => {
    const qs = selectQuestions({
      xp: 5000,
      lc: 0,
      gc: 0,
      count: 50,
      _debugReturnRaw: true,
    }) as DebugQuestion[];
    expect(qs.some((q) => q._d === 2)).toBe(true);
  });
});
