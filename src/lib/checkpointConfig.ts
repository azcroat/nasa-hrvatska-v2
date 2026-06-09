// src/lib/checkpointConfig.ts
/**
 * Master switch for the Comprehension Checkpoints feature. ENABLED 2026-06-09.
 * The disable reason (R3: checkpoint speaking broke on iPad Safari / Capacitor —
 * own MediaRecorder w/o mimeType negotiation + raw relative fetch on native) is
 * resolved: SpeakingTaskScreen now uses the shared `useRecorder` and
 * whisperClaudeScorer routes through `_nativePost` (native-safe absolute URL +
 * Firebase bearer); R4 further hardened the STT/assess transport. Checkpoints fire
 * after 5 ACTIVE days, so this does not immediately blast all users.
 * KILL SWITCH: set this back to `false` (one-line revert) to disable instantly.
 */
export const CHECKPOINTS_ENABLED = true;

/** Number of current-level MCQ items in a checkpoint (plus 2 retention + speaking). */
export const CHECKPOINT_CORE_COUNT = 3;
