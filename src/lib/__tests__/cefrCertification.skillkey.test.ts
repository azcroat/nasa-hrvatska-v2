// src/lib/__tests__/cefrCertification.skillkey.test.ts
import { describe, it, expect } from 'vitest';
import { computePassed, SPEAKING_GATE_ENFORCED } from '../cefrCertification.js';
import type { SkillScores, SkillKey } from '../cefrCertification.js';

describe('SkillScores.speaking', () => {
  it('computePassed ignores speaking when only vocab/grammar present (legacy equivalency unaffected)', () => {
    const scores: SkillScores = { vocab: 0.9, grammar: 0.85 };
    expect(computePassed(scores).passed).toBe(true);
  });

  it('computePassed treats a present low speaking score as a failing skill (default/checkpoints)', () => {
    const scores: SkillScores = { vocab: 0.9, grammar: 0.9, speaking: 0.5 };
    expect(computePassed(scores).passed).toBe(false);
  });

  it('SkillKey union includes the five skills', () => {
    const keys: SkillKey[] = ['vocab', 'grammar', 'reading', 'listening', 'speaking'];
    expect(keys).toHaveLength(5);
  });
});

describe('speaking shadow mode (includeSpeaking option)', () => {
  it('ships in shadow mode by default (speaking measured but not enforced)', () => {
    // Guard: flipping enforcement on must be a deliberate, reviewed change.
    expect(SPEAKING_GATE_ENFORCED).toBe(false);
  });

  it('shadow mode (includeSpeaking:false) ignores a low speaking score', () => {
    const scores: SkillScores = { vocab: 0.9, grammar: 0.9, reading: 0.85, speaking: 0.3 };
    expect(computePassed(scores, { includeSpeaking: false }).passed).toBe(true);
  });

  it('enforced (includeSpeaking:true) fails on a low speaking score', () => {
    const scores: SkillScores = { vocab: 0.9, grammar: 0.9, reading: 0.85, speaking: 0.3 };
    expect(computePassed(scores, { includeSpeaking: true }).passed).toBe(false);
  });

  it('a strong speaking score passes under enforcement', () => {
    const scores: SkillScores = { vocab: 0.9, grammar: 0.9, reading: 0.85, speaking: 0.9 };
    expect(computePassed(scores, { includeSpeaking: true }).passed).toBe(true);
  });
});
