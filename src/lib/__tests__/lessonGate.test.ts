import { describe, it, expect } from 'vitest';
import { LESSON_PASS_THRESHOLD, passedLesson, lessonScorePct } from '../lessonGate';

describe('lessonGate', () => {
  it('threshold is 0.75', () => {
    expect(LESSON_PASS_THRESHOLD).toBe(0.75);
  });
  it('passes at or above 75%', () => {
    expect(passedLesson(6, 8)).toBe(true); // 0.75
    expect(passedLesson(8, 8)).toBe(true);
  });
  it('fails below 75%', () => {
    expect(passedLesson(5, 8)).toBe(false); // 0.625
    expect(passedLesson(0, 5)).toBe(false);
  });
  it('zero-total never passes', () => {
    expect(passedLesson(0, 0)).toBe(false);
    expect(lessonScorePct(0, 0)).toBe(0);
  });
  it('lessonScorePct returns the ratio', () => {
    expect(lessonScorePct(3, 4)).toBe(0.75);
  });
});
