/**
 * Data integrity test for PronunciationContrast quiz questions.
 *
 * Guards permanently against:
 * - Duplicate options within a question (was present in 13 of 25 questions before fix)
 * - Correct answer not appearing in options
 * - Options array length != 4
 */
import { describe, it, expect } from 'vitest';
import { DATA } from '../components/practice/PronunciationContrast';

describe('PronunciationContrast DATA integrity', () => {
  it('every question has exactly 4 options', () => {
    for (const q of DATA) {
      expect(q.opts.length, `Question "${q.q}" has ${q.opts.length} options, expected 4`).toBe(4);
    }
  });

  it('every question has 4 DISTINCT options (no duplicates)', () => {
    for (const q of DATA) {
      const unique = new Set(q.opts);
      expect(unique.size, `Question "${q.q}" has duplicate options: [${q.opts.join(', ')}]`).toBe(
        4,
      );
    }
  });

  it('every question contains the correct answer exactly once in opts', () => {
    for (const q of DATA) {
      const count = q.opts.filter((o: string) => o === q.answer).length;
      expect(
        count,
        `Question "${q.q}": answer "${q.answer}" appears ${count} time(s) in opts [${q.opts.join(', ')}], expected exactly 1`,
      ).toBe(1);
    }
  });

  it('every question has a non-empty answer string', () => {
    for (const q of DATA) {
      expect(q.answer.length, `Question "${q.q}" has an empty answer`).toBeGreaterThan(0);
    }
  });
});
