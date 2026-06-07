// src/lib/examBlueprint.ts
import type { CefrLevel } from './cefr.js';

export interface CheckpointBlueprint {
  level: CefrLevel;
  /** How many retention items to pull from levels below `level`. */
  retentionCount: number;
  /** How many speaking tasks to start with (a 2nd may be added at runtime if borderline). */
  speakingCount: number;
}

/**
 * Describes a checkpoint exam for `level`. Speaking starts at 1 task, or 2 if
 * the previous checkpoint flagged speaking (the runtime adds a 2nd task on a
 * borderline single-task score — that escalation lives in Plan 3's runner).
 */
export function buildCheckpointBlueprint(
  level: CefrLevel,
  opts: { speakingFlagged: boolean },
): CheckpointBlueprint {
  return {
    level,
    retentionCount: 2,
    speakingCount: opts.speakingFlagged ? 2 : 1,
  };
}
