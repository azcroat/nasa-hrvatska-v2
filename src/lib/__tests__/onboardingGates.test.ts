import { describe, it, expect } from 'vitest';
import { shouldShowGoalModal } from '../onboardingGates';

describe('shouldShowGoalModal — "What\'s your main goal?" gate (cross-device regression)', () => {
  it('does NOT show before the server restore has resolved (syncReady false)', () => {
    // The original bug: shown on a fresh device before Firestore loaded → existing user
    // re-prompted for their goal. Must wait for syncReady (which opens only post-restore).
    expect(shouldShowGoalModal({ syncReady: false, dismissed: false, hasGoalSet: false })).toBe(
      false,
    );
  });

  it('does NOT show for a returning user whose goal was restored (syncReady + hasGoalSet)', () => {
    expect(shouldShowGoalModal({ syncReady: true, dismissed: false, hasGoalSet: true })).toBe(
      false,
    );
  });

  it('SHOWS for a genuinely new user once the server confirms no goal', () => {
    expect(shouldShowGoalModal({ syncReady: true, dismissed: false, hasGoalSet: false })).toBe(
      true,
    );
  });

  it('does NOT re-show after the user dismisses/completes it', () => {
    expect(shouldShowGoalModal({ syncReady: true, dismissed: true, hasGoalSet: false })).toBe(
      false,
    );
  });

  it('stays hidden while offline/unresolved even with no goal (no false prompt)', () => {
    expect(shouldShowGoalModal({ syncReady: false, dismissed: false, hasGoalSet: true })).toBe(
      false,
    );
  });
});
