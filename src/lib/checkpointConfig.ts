// src/lib/checkpointConfig.ts
/**
 * Master switch for the Comprehension Checkpoints feature. Enabled 2026-06-07
 * after the speaking item banks + /api/assess-speaking were built and the
 * Workers AI "AI" binding was enabled on the Pages project. Set to false to
 * disable for all users (kill switch).
 */
export const CHECKPOINTS_ENABLED = true;

/** Number of current-level MCQ items in a checkpoint (plus 2 retention + speaking). */
export const CHECKPOINT_CORE_COUNT = 3;
