// src/tests/speakingTasks.test.ts
import { describe, it, expect } from 'vitest';
import { SPEAKING_TASKS, getSpeakingTasks } from '../data/speakingTasks.js';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;

describe('speakingTasks', () => {
  it('every gating level A1..C1 has at least 2 prompts', () => {
    for (const lvl of LEVELS) {
      expect(SPEAKING_TASKS[lvl]?.length ?? 0).toBeGreaterThanOrEqual(2);
    }
  });

  it('each task has a non-empty Croatian prompt, English gloss, and seconds target', () => {
    for (const lvl of LEVELS) {
      for (const t of getSpeakingTasks(lvl)) {
        expect(t.prompt.trim().length).toBeGreaterThan(0);
        expect(t.promptEn.trim().length).toBeGreaterThan(0);
        expect(t.seconds).toBeGreaterThanOrEqual(20);
      }
    }
  });
});
