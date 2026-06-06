/**
 * syncReadyResolution.test.ts
 *
 * Guards the cross-device "treated as a new user on a fresh device" bug.
 *
 * `_syncReady` gates the onboarding tour (AppModals) and the placement redirect
 * (App.tsx). Before the fix, useSyncManager opened `_syncReady` on the FIRST
 * Firestore onSnapshot emission — which the SDK fires from its IndexedDB cache
 * (stale/empty on a fresh or Safari/iPad device) BEFORE the authoritative server
 * doc arrives, and BEFORE applyRemoteProgress restored the user's state. A
 * returning user therefore got `_syncReady === true` while `onboarded`/level were
 * still empty → re-onboarded / re-placement-tested.
 *
 * syncReadyResolution encodes the corrected decision: never resolve on a cache
 * emission; on a server emission with data, resolve only AFTER the apply; on a
 * server emission with no data, the user is genuinely new and may resolve now.
 */
import { describe, it, expect } from 'vitest';
import { syncReadyResolution } from '../hooks/useSyncManager';

describe('syncReadyResolution — _syncReady gating (cross-device new-user bug)', () => {
  it('WAITS on a fromCache emission even when it carries data (the stale-cache race)', () => {
    expect(syncReadyResolution({ fromCache: true, exists: true }, true)).toBe('wait');
  });

  it('WAITS on a fromCache emission with no data (empty cache on a fresh device)', () => {
    expect(syncReadyResolution({ fromCache: true, exists: false }, false)).toBe('wait');
  });

  it("opens AFTER apply on a server emission carrying the returning user's data", () => {
    // This is the case that was broken: server confirms the user HAS data, so we must
    // wait for applyRemoteProgress before letting the gates decide they are "new".
    expect(syncReadyResolution({ fromCache: false, exists: true }, true)).toBe('open-after-apply');
  });

  it('opens NOW on a server emission for a genuinely new user (no document)', () => {
    expect(syncReadyResolution({ fromCache: false, exists: false }, false)).toBe('open-now');
  });

  it('opens NOW on a server emission for an existing doc with no progress blob (delta-only)', () => {
    expect(syncReadyResolution({ fromCache: false, exists: true }, false)).toBe('open-now');
  });

  it('NEVER returns open-* for any fromCache emission (exhaustive guard)', () => {
    for (const exists of [true, false]) {
      for (const hasData of [true, false]) {
        expect(syncReadyResolution({ fromCache: true, exists }, hasData)).toBe('wait');
      }
    }
  });
});
