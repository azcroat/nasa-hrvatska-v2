// src/lib/checkpointPolicy.ts
import type { CefrLevel } from './cefr.js';
import { levelBelow } from './cefr.js';
import { computePassed } from './cefrCertification.js';
import type { SkillScores, SkillKey, CheckpointState } from './cefrCertification.js';

const PASS = 0.8;
const CLEAN = 0.875; // >= CLEAN = clean; [PASS, CLEAN) = focus band

export type CheckpointKind = 'pass' | 'pass_focus' | 'grace' | 'demote';

export interface CheckpointOutcome {
  kind: CheckpointKind;
  overall: number; // 0..100 (matches computePassed.overall)
  /** Present skills scoring < 0.80. */
  failedSkills: SkillKey[];
  /** Skills to focus on next: borderline-band skills (on pass) or failed skills (on grace/demote). */
  focusSkills: SkillKey[];
  /** Non-null only when kind === 'demote'. */
  demotion: { from: CefrLevel; to: CefrLevel } | null;
}

const ORDER: SkillKey[] = ['vocab', 'grammar', 'reading', 'listening', 'speaking'];

function presentSkills(scores: SkillScores): Array<[SkillKey, number]> {
  return ORDER.filter((k) => scores[k] !== undefined).map((k) => [k, scores[k] as number]);
}

export interface InterpretInput {
  level: CefrLevel; // the certified level being checked
  scores: SkillScores; // per-skill scores (retention items already folded into their skill bucket)
  checkpoints: CheckpointState;
}

/**
 * Pure decision: given the scored exam and the current grace state, decide
 * pass / pass_focus / grace / demote. Reuses `computePassed` for the pass
 * gate (every present skill >= 0.80 AND overall >= 0.80). Retention items are
 * expected to be folded into their skill buckets by the composer, so a
 * forgotten earlier-level item lowers the relevant skill and can fail it —
 * the locked "retention counts toward demotion" decision.
 */
export function interpretCheckpoint(input: InterpretInput): CheckpointOutcome {
  const { level, scores, checkpoints } = input;
  const { passed, overall } = computePassed(scores);
  const present = presentSkills(scores);
  const failedSkills = present.filter(([, v]) => v < PASS).map(([k]) => k);

  if (passed) {
    const focusSkills = present.filter(([, v]) => v >= PASS && v < CLEAN).map(([k]) => k);
    return {
      kind: focusSkills.length > 0 ? 'pass_focus' : 'pass',
      overall,
      failedSkills: [],
      focusSkills,
      demotion: null,
    };
  }

  // Failed. A1 is the floor → always grace (never demote).
  const isFloor = levelBelow(level) === null;
  const prior = checkpoints.consecutiveFails[level] ?? 0;
  if (isFloor || prior < 1) {
    return { kind: 'grace', overall, failedSkills, focusSkills: failedSkills, demotion: null };
  }
  const to = levelBelow(level)!;
  return {
    kind: 'demote',
    overall,
    failedSkills,
    focusSkills: failedSkills,
    demotion: { from: level, to },
  };
}
