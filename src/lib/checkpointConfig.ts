// src/lib/checkpointConfig.ts
/**
 * Master switch for the Comprehension Checkpoints feature. TEMPORARILY DISABLED
 * 2026-06-08 pending remediation R3 (the checkpoint speaking path fails on iPad
 * Safari / Capacitor — SpeakingTaskScreen rolls its own MediaRecorder without
 * mimeType negotiation, and whisperClaudeScorer uses a raw relative fetch that
 * breaks on the native build). Re-enable once R3 lands and is device-verified.
 */
export const CHECKPOINTS_ENABLED = false;

/** Number of current-level MCQ items in a checkpoint (plus 2 retention + speaking). */
export const CHECKPOINT_CORE_COUNT = 3;
