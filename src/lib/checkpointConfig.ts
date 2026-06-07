// src/lib/checkpointConfig.ts
/**
 * Master switch for the Comprehension Checkpoints feature. Stays FALSE until
 * the speaking item banks + /api/assess-speaking are validated in prod
 * (see Plan 3 rollout). Flip to true to activate for all users.
 */
export const CHECKPOINTS_ENABLED = false;

/** Number of current-level MCQ items in a checkpoint (plus 2 retention + speaking). */
export const CHECKPOINT_CORE_COUNT = 3;
