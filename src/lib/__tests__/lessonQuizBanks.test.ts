import { describe, it, expect } from 'vitest';
import { LESSON_QUIZ_BANKS } from '../lessonQuizBanks';

describe('LESSON_QUIZ_BANKS', () => {
  const ids = ['aspect', 'wordform', 'diminutives', 'phonology'];
  it('has a bank of >=5 questions for each passive lesson', () => {
    for (const id of ids) {
      const bank = LESSON_QUIZ_BANKS[id];
      expect(bank, id).toBeDefined();
      expect(bank!.length, id).toBeGreaterThanOrEqual(5);
    }
  });
  it('every question is well-formed (>=2 options, exactly one valid correctIdx, no empties)', () => {
    for (const id of ids) {
      for (const q of LESSON_QUIZ_BANKS[id]!) {
        expect(q.prompt.trim(), id).not.toBe('');
        expect(q.options.length, `${id}: ${q.prompt}`).toBeGreaterThanOrEqual(2);
        expect(
          q.options.every((o) => o.trim() !== ''),
          `${id}: ${q.prompt}`,
        ).toBe(true);
        expect(q.correctIdx, `${id}: ${q.prompt}`).toBeGreaterThanOrEqual(0);
        expect(q.correctIdx, `${id}: ${q.prompt}`).toBeLessThan(q.options.length);
      }
    }
  });
});
