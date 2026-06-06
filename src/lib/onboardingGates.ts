/**
 * Pure gating decisions for "new user?" onboarding prompts.
 *
 * Extracted so the cross-device regression — an EXISTING user being re-prompted on a
 * fresh device/browser/iPad — is covered by tests without rendering the components.
 */

/**
 * Whether to show the "What's your main goal?" modal (GoalSetterModal).
 *
 * `syncReady` MUST be true first. `_syncReady` only opens AFTER the Firestore restore
 * (applyRemoteProgress) has run, so by the time it is true a returning user's
 * `nh_goal_set` has already been restored to localStorage and `hasGoalSet` is true →
 * the modal stays hidden. A genuinely new user (server-confirmed no document) gets
 * `syncReady === true` with `hasGoalSet === false` → the modal shows.
 *
 * The bug this guards: previously the modal was `useState(() => !localStorage.getItem(
 * 'nh_goal_set'))`, evaluated once at mount BEFORE the restore — so an existing user
 * was asked their goal again on every fresh device.
 */
export function shouldShowGoalModal(args: {
  syncReady: boolean;
  dismissed: boolean;
  hasGoalSet: boolean;
}): boolean {
  return args.syncReady && !args.dismissed && !args.hasGoalSet;
}
