// src/lib/__tests__/cefrCertification.skillkey.test.ts
import { describe, it, expect } from 'vitest';
import {
  computePassed,
  isSpeakingGateEnforced,
  SPEAKING_ENFORCEMENT_DATE,
} from '../cefrCertification.js';
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

describe('speaking gate — date-gated enforcement', () => {
  const flipMs = Date.parse(SPEAKING_ENFORCEMENT_DATE);

  it('is shadow (not enforced) the day before the enforcement date', () => {
    expect(isSpeakingGateEnforced(flipMs - 24 * 60 * 60 * 1000)).toBe(false);
  });

  it('is enforced on/after the enforcement date', () => {
    expect(isSpeakingGateEnforced(flipMs)).toBe(true);
    expect(isSpeakingGateEnforced(flipMs + 24 * 60 * 60 * 1000)).toBe(true);
  });
});

describe('computePassed — includeSpeaking / requireSpeaking', () => {
  it('shadow (includeSpeaking:false) ignores a low speaking score', () => {
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

  it('requireSpeaking fails when no speaking score was produced (no skipping the gate)', () => {
    const scores: SkillScores = { vocab: 0.95, grammar: 0.95, reading: 0.95 };
    expect(computePassed(scores, { includeSpeaking: true, requireSpeaking: true }).passed).toBe(
      false,
    );
    // ...but in shadow (requireSpeaking:false) the same scores pass.
    expect(computePassed(scores).passed).toBe(true);
  });
});
