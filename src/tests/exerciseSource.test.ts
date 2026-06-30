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

  it('A2 user gets difficulty ≤ 2 (never difficulty-3)', () => {
    // xp 800 → A2 (300 ≤ 800 < 1200).
    const qs = selectQuestions({
      xp: 800,
      lc: 0,
      gc: 0,
      count: 85,
      _debugReturnRaw: true,
    }) as DebugQuestion[];
    expect(qs.some((q) => q._d === 2)).toBe(true);
    expect(qs.every((q) => q._d <= 2)).toBe(true);
  });

  // Session-Rec #5: difficulty-3 questions (53% of PLACE) used to be dead for
  // everyone. B1+ now reaches them.
  it('B1 user reaches difficulty-3 questions, but NOT the B2-tagged ones', () => {
    // xp 2000 → B1 (1200 ≤ 2000 < 3500).
    const qs = selectQuestions({
      xp: 2000,
      lc: 0,
      gc: 0,
      count: 85,
      _debugReturnRaw: true,
    }) as DebugQuestion[];
    expect(qs.some((q) => q._d === 3)).toBe(true);
    // The 17 B2-tagged items must stay gated above B1 (the cefr tag is finer
    // than the difficulty tier).
    expect(qs.every((q) => q._cefr !== 'B2')).toBe(true);
  });

  it('B2 user reaches both difficulty-3 and the B2-tagged grammar questions', () => {
    // xp 5000 → B2 (3500 ≤ 5000 < 8000).
    const qs = selectQuestions({
      xp: 5000,
      lc: 0,
      gc: 0,
      count: 85,
      _debugReturnRaw: true,
    }) as DebugQuestion[];
    expect(qs.some((q) => q._d === 3)).toBe(true);
    expect(qs.some((q) => q._cefr === 'B2')).toBe(true);
  });
});
