// src/lib/speaking/__tests__/SpeakingScorer.test.ts
import { describe, it, expect } from 'vitest';
import { computeSpeakingOverall } from '../SpeakingScorer.js';

describe('computeSpeakingOverall', () => {
  it('averages the four productive criteria (pronunciation excluded in v1)', () => {
    const o = computeSpeakingOverall({ range: 0.8, accuracy: 0.6, fluency: 1.0, task: 0.8 });
    expect(o).toBeCloseTo(0.8, 5);
  });

  it('clamps to [0,1]', () => {
    expect(computeSpeakingOverall({ range: 2, accuracy: 2, fluency: 2, task: 2 })).toBe(1);
    expect(computeSpeakingOverall({ range: -1, accuracy: -1, fluency: -1, task: -1 })).toBe(0);
  });
});
