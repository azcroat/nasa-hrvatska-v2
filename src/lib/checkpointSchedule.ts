// src/lib/checkpointSchedule.ts
import type { CefrLevel } from './cefr.js';
import type { CheckpointState } from './cefrCertification.js';

export const ACTIVE_DAYS_PER_CHECKPOINT = 5;

export interface DueInput {
  enabled: boolean; // CHECKPOINTS_ENABLED flag
  certified: CefrLevel; // current certified level
  activeDayCount: number; // from activeDayTracker.getActiveDayCount()
  checkpoints: CheckpointState;
  now: number; // epoch ms (injected for tests)
}

export interface DueResult {
  due: boolean;
  reason: 'disabled' | 'snoozed' | 'not_enough_active_days' | 'due';
}

/**
 * A checkpoint is due when the feature is enabled, the user is not snoozed,
 * and at least ACTIVE_DAYS_PER_CHECKPOINT active days have passed since the
 * last completed checkpoint. A1 is included (non-demoting floor). The App
 * layer additionally gates on `syncReady` and "not mid-lesson" before
 * calling this — those are runtime concerns, not scheduling logic.
 */
export function isCheckpointDue(input: DueInput): DueResult {
  if (!input.enabled) return { due: false, reason: 'disabled' };
  const { snoozedUntil } = input.checkpoints;
  if (snoozedUntil != null && input.now < snoozedUntil) {
    return { due: false, reason: 'snoozed' };
  }
  const elapsed = input.activeDayCount - input.checkpoints.activeDaysAtLastCheckpoint;
  if (elapsed < ACTIVE_DAYS_PER_CHECKPOINT) {
    return { due: false, reason: 'not_enough_active_days' };
  }
  return { due: true, reason: 'due' };
}

/** Screens during which an exam popup is acceptable (never mid-lesson). */
const SAFE_SCREENS = new Set(['dashboard', 'home', 'profile', 'stats']);

/**
 * App-layer gate for showing the checkpoint invite. Combines the `due` result
 * with runtime conditions: only after cross-device sync resolves, only inside
 * the app shell, and only on a non-exercise screen. Mirrors the goal-modal
 * discipline (PRs #12/#13) but is App-scoped so it fires on foreground.
 */
export function shouldShowCheckpoint(args: {
  syncReady: boolean;
  authScreen: string;
  currentScreen: string;
  due: boolean;
}): boolean {
  return (
    args.syncReady && args.authScreen === 'app' && SAFE_SCREENS.has(args.currentScreen) && args.due
  );
}
