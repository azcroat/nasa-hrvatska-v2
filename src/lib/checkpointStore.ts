// src/lib/checkpointStore.ts
import {
  getCertificationState,
  writeCertificationState,
  demoteOneLevel,
  type SkillScores,
  type CertificationAttempt,
} from './cefrCertification.js';
import { interpretCheckpoint, type CheckpointOutcome } from './checkpointPolicy.js';
import type { CefrLevel } from './cefr.js';

/**
 * Applies a completed checkpoint exam to certification state and returns the
 * outcome for the UI. Cadence (lastCheckpointAt / activeDaysAtLastCheckpoint)
 * is refreshed on pass / pass_focus / demote, but NOT on grace — a grace
 * result offers an immediate retry within the same cycle.
 */
export function recordCheckpointResult(opts: {
  level: CefrLevel;
  scores: SkillScores;
  activeDayCount: number;
  now?: number;
}): CheckpointOutcome {
  const now = opts.now ?? Date.now();
  const state = getCertificationState();
  const outcome = interpretCheckpoint({
    level: opts.level,
    scores: opts.scores,
    checkpoints: state.checkpoints,
  });

  // Record an attempt for history/analytics (reuse existing shape).
  const attempt: CertificationAttempt = {
    level: opts.level,
    passed: outcome.kind === 'pass' || outcome.kind === 'pass_focus',
    takenAt: now,
    scores: opts.scores,
    overall: outcome.overall,
  };
  state.attempts.push(attempt);
  if (state.attempts.length > 100) state.attempts = state.attempts.slice(-100);

  if (outcome.focusSkills.length > 0) {
    state.checkpoints.focusSkills[opts.level] = outcome.focusSkills;
  } else if (outcome.kind === 'pass') {
    // Clean pass — no focus needed; clear any stale focus flag for this level.
    delete state.checkpoints.focusSkills[opts.level];
  }

  if (outcome.kind === 'pass' || outcome.kind === 'pass_focus') {
    state.checkpoints.consecutiveFails[opts.level] = 0;
    state.checkpoints.lastCheckpointAt = now;
    state.checkpoints.activeDaysAtLastCheckpoint = opts.activeDayCount;
    writeCertificationState(state);
  } else if (outcome.kind === 'grace') {
    state.checkpoints.consecutiveFails[opts.level] =
      (state.checkpoints.consecutiveFails[opts.level] ?? 0) + 1;
    writeCertificationState(state); // cadence NOT refreshed
  } else {
    // demote: persist attempt+focus first, then demote (demoteOneLevel writes again).
    state.checkpoints.lastCheckpointAt = now;
    state.checkpoints.activeDaysAtLastCheckpoint = opts.activeDayCount;
    writeCertificationState(state);
    demoteOneLevel('checkpoint_fail');
  }
  return outcome;
}
