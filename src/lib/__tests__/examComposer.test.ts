// src/lib/__tests__/examComposer.test.ts
import { describe, it, expect } from 'vitest';
import { buildCheckpointBlueprint } from '../examBlueprint.js';
import { composeExam } from '../examComposer.js';
import type { ComposerBanks } from '../examComposer.js';

// Minimal fake item banks keyed by level. Each item carries its skill + level.
const banks: ComposerBanks = {
  itemsByLevel: {
    A1: [
      { id: 'a1-v1', skill: 'vocab', level: 'A1' },
      { id: 'a1-g1', skill: 'grammar', level: 'A1' },
    ],
    A2: [
      { id: 'a2-v1', skill: 'vocab', level: 'A2' },
      { id: 'a2-g1', skill: 'grammar', level: 'A2' },
      { id: 'a2-r1', skill: 'reading', level: 'A2' },
    ],
    B1: [
      { id: 'b1-v1', skill: 'vocab', level: 'B1' },
      { id: 'b1-v2', skill: 'vocab', level: 'B1' },
      { id: 'b1-g1', skill: 'grammar', level: 'B1' },
      { id: 'b1-g2', skill: 'grammar', level: 'B1' },
      { id: 'b1-r1', skill: 'reading', level: 'B1' },
    ],
  },
  speakingTasksByLevel: { B1: [{ id: 'b1-spk1' }, { id: 'b1-spk2' }] },
};

function seededRng(seq: number[]) {
  let i = 0;
  return () => seq[i++ % seq.length]!;
}

describe('composeExam (B1 checkpoint)', () => {
  it('includes core B1 items, 2 retention items from below B1, and 1 speaking task by default', () => {
    const bp = buildCheckpointBlueprint('B1', { speakingFlagged: false });
    const exam = composeExam(bp, banks, { weakTopics: [] }, seededRng([0, 0, 0, 0, 0]));
    expect(exam.coreItems.every((it) => it.level === 'B1')).toBe(true);
    expect(exam.retentionItems).toHaveLength(2);
    expect(exam.retentionItems.every((it) => it.level !== 'B1')).toBe(true);
    expect(exam.speakingTasks).toHaveLength(1);
  });

  it('starts with 2 speaking tasks when speaking was previously flagged', () => {
    const bp = buildCheckpointBlueprint('B1', { speakingFlagged: true });
    const exam = composeExam(bp, banks, { weakTopics: [] }, seededRng([0, 0, 0, 0, 0]));
    expect(exam.speakingTasks).toHaveLength(2);
  });
});
