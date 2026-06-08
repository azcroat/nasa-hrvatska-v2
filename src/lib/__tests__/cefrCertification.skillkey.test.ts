// src/lib/__tests__/cefrCertification.skillkey.test.ts
import { describe, it, expect } from 'vitest';
import { computePassed } from '../cefrCertification.js';
import type { SkillScores, SkillKey } from '../cefrCertification.js';

describe('SkillScores.speaking', () => {
  it('computePassed ignores speaking when only vocab/grammar present (legacy equivalency unaffected)', () => {
    const scores: SkillScores = { vocab: 0.9, grammar: 0.85 };
    expect(computePassed(scores).passed).toBe(true);
  });

  it('computePassed treats a present low speaking score as a failing skill', () => {
    const scores: SkillScores = { vocab: 0.9, grammar: 0.9, speaking: 0.5 };
    expect(computePassed(scores).passed).toBe(false);
  });

  it('SkillKey union includes the five skills', () => {
    const keys: SkillKey[] = ['vocab', 'grammar', 'reading', 'listening', 'speaking'];
    expect(keys).toHaveLength(5);
  });
});
