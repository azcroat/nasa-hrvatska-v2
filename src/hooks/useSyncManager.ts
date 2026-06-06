/**
 * useSyncManager — Firebase sync, Firestore watcher, and persistence effects.
 *
 * Architecture: Firebase is the authoritative source of truth.
 * Local state is an optimistic cache that converges upward on every sync event.
 *
 * Key design principles:
 *  1. No dropped snapshots — all incoming Firestore snapshots are queued via a
 *     Promise chain and processed in arrival order.
 *  2. Stats are additive-merged (Math.max) — numeric progress never decreases.
 *  3. Arrays (ct, vs, badges, favs, journal) are unioned — no item ever lost.
 *  4. Settings (nh_level, nh_goal, etc.) are synced from remote to all devices.
 *  5. All callbacks accessed via refs — no stale closures across re-renders.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  gP,
  lP,
  fbSaveProgress,
  fbLoadProgress,
  fbWatchProgress,
  fbGetIdToken,
} from '../lib/firebase.js';
import { buildProgressSnapshot } from '../lib/progressSnapshot.js';
import { mergeStatsFromRemote } from '../lib/mergeStatsFromRemote.js';
import { sanitizeStats } from '../lib/sanitizeStats.js';
import * as offlineAwardQueue from '../lib/offlineAwardQueue.js';
import type { Stats, AuthUser } from '../types/index.js';

/** Metadata from a Firestore progress snapshot — distinguishes cache vs server emissions. */
export interface SyncSnapshotMeta {
  fromCache: boolean;
  exists: boolean;
}

/**
 * Decides WHEN `_syncReady` may open. `_syncReady` gates the "is this a brand-new user?"
 * decision (onboarding tour + placement redirect), so it must only open once we KNOW the
 * user's real state — never on the Firestore SDK's initial IndexedDB-cache emission, which
 * is stale/empty on a fresh or Safari/iPad device.
 *
 *  - fromCache emission           → 'wait'             (not authoritative)
 *  - server emission WITH data    → 'open-after-apply' (open only once applyRemoteProgress ran)
 *  - server emission WITHOUT data → 'open-now'         (server-confirmed new user / no progress blob)
 *
 * Returning this as a pure decision keeps the (otherwise untestable) hook race covered by tests.
 */
export function syncReadyResolution(
  meta: SyncSnapshotMeta,
  hasData: boolean,
): 'wait' | 'open-after-apply' | 'open-now' {
  if (meta.fromCache) return 'wait';
  return hasData ? 'open-after-apply' : 'open-now';
}

interface SyncManagerParams {
  authUser: AuthUser | null;
  authScreen: string;
  name: string;
  stats: Stats;
  favs: unknown[];
  jWords: unknown[];
  dchlA: boolean[];
  dchlSl: string[];
  setStats: (fn: (prev: Stats) => Stats) => void;
  setName: (name: string) => void;
  applyRemoteProgress: (progress: unknown) => void;
  ds: Stats;
  syncNowRef?: React.MutableRefObject<(() => Promise<boolean>) | undefined>;
  setSyncReady?: (ready: boolean) => void;
  syncReady: boolean;
}

interface SyncManagerResult {
  doSyncNow: () => Promise<boolean>;
  showBackupBanner: boolean;
  setShowBackupBanner: React.Dispatch<React.SetStateAction<boolean>>;
  lastSyncedAt: number;
}

export function useSyncManager({
  authUser,
  authScreen,
  name,
  stats,
  favs,
  jWords,
  dchlA,
  dchlSl,
  setStats,
  setName,
  applyRemoteProgress,
  ds,
  syncNowRef,
  setSyncReady,
  syncReady,
}: SyncManagerParams): SyncManagerResult {
  const [showBackupBanner, setShowBackupBanner] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number>(0);
  const _syncFailCount = useRef(0);
  const _isSavingRef = useRef(false); // mutex: prevents concurrent doSyncNow calls
  // Signature of the snapshot from the most recent successful periodic push.
  // The 5-min periodic tick skips when the current snapshot's signature equals
  // this one — no point pushing a ~200KB blob that's byte-identical to what
  // we already wrote. Event-driven syncs (doSyncNow, quest-done, unload) are
  // NOT gated by this — they're intentional and always run.
  const _lastPeriodicSigRef = useRef<string | null>(null);
  const _watcherUnsubRef = useRef<(() => void) | null>(null);
  const _idTokenRef = useRef('');
  // Sticky user ref: authUser can momentarily become null during Firebase token refresh.
  // This ref retains the last confirmed authenticated user so unload saves (pagehide /
  // visibilitychange) are never silently skipped due to a brief null window at tab close.
  const _lastKnownUserRef = useRef<AuthUser | null>(null);

  // Keeps latest state available to unload handlers without stale deps
  const _unloadRef = useRef<Record<string, unknown>>({});

  // Promise-based serial queue
  const _mergeQueueRef = useRef(Promise.resolve());

  // Last processed Firebase server-timestamp
  const _lastMergedFbTs = useRef(0);

  // Stable refs for all callbacks
  const _setStatsRef = useRef(setStats);
  const _setNameRef = useRef(setName);
  const _applyRef = useRef(applyRemoteProgress);
  const _dsRef = useRef<Stats>(ds);

  // Sync latest values into refs on every render
  _unloadRef.current = {
    authUser,
    stats,
    name,
    authScreen,
    favs,
    jWords,
    dchlA,
    dchlSl,
    syncReady,
  };
  // Keep _lastKnownUserRef current while user is authenticated in the app.
  // This survives any brief authUser=null window during Firebase token refresh.
  if (authUser && authScreen === 'app') _lastKnownUserRef.current = authUser;
  _setStatsRef.current = setStats;
  _setNameRef.current = setName;
  _applyRef.current = applyRemoteProgress;
  _dsRef.current = ds;

  // ─── Core merge logic ──────────────────────────────────────────────────────
  function _processSnapshot(fp: Record<string, unknown>, fpTs: number, uid: string): void {
    if (fpTs > 0 && fpTs === _lastMergedFbTs.current) return;
    if (fpTs > 0) _lastMergedFbTs.current = fpTs;

    // Use the raw uid (email) key — same key used by useAuth.ts (gP(s.u)) and
    // doSyncNow() (localStorage.setItem('uP_' + u.u, ...)) so all three paths
    // read and write the same localStorage entry.
    const lp = gP(uid) as Record<string, unknown> | null;
    const pSt = (fp.stats || fp.st || {}) as Record<string, unknown>;
    const lpSt = lp ? ((lp.stats || lp.st || {}) as Record<string, unknown>) : {};

    const _diffOrder: Record<string, number> = { beginner: 0, intermediate: 1, advanced: 2 };
    // Sanitize both sides before merging — prevents inflated values from a
    // crafted Firestore progress blob bypassing validation and poisoning localStorage.
    const safeLp = sanitizeStats(lpSt);
    const safePSt = sanitizeStats(pSt);

    const mergedStats = {
      ...safePSt,
      xp: Math.max((safeLp.xp as number) || 0, (safePSt.xp as number) || 0),
      lc: Math.max((safeLp.lc as number) || 0, (safePSt.lc as number) || 0),
      gc: Math.max((safeLp.gc as number) || 0, (safePSt.gc as number) || 0),
      sp: Math.max((safeLp.sp as number) || 0, (safePSt.sp as number) || 0),
      de: Math.max((safeLp.de as number) || 0, (safePSt.de as number) || 0),
      rc: Math.max((safeLp.rc as number) || 0, (safePSt.rc as number) || 0),
      str: Math.max((safeLp.str as number) || 0, (safePSt.str as number) || 0),
      pf: Math.max((safeLp.pf as number) || 0, (safePSt.pf as number) || 0),
      mv: Math.max((safeLp.mv as number) || 0, (safePSt.mv as number) || 0),
      hi: Math.max((safeLp.hi as number) || 0, (safePSt.hi as number) || 0),
      // diff: take the higher CEFR level — never regress even on stale remote snapshot
      diff: (() => {
        const lo = _diffOrder[safeLp.diff as string] ?? -1;
        const po = _diffOrder[safePSt.diff as string] ?? -1;
        return lo >= po ? safeLp.diff : safePSt.diff;
      })(),
      ct: [...new Set([...((safeLp.ct as string[]) || []), ...((safePSt.ct as string[]) || [])])],
      vs: [...new Set([...((safeLp.vs as string[]) || []), ...((safePSt.vs as string[]) || [])])],
      badges: [
        ...new Set([
          ...((safeLp.badges as string[]) || []),
          ...((safePSt.badges as string[]) || []),
        ]),
      ],
      // rs: ordered score history — keep the longer array (more entries = more complete history)
      rs:
        ((safeLp.rs as string[]) || []).length >= ((safePSt.rs as string[]) || []).length
          ? (safeLp.rs as string[]) || []
          : (safePSt.rs as string[]) || [],
    };

    lP(uid, { ...fp, savedAt: fpTs || Date.now(), stats: mergedStats });

    _setStatsRef.current((prev) =>
      mergeStatsFromRemote(prev, pSt as Partial<Stats>, _dsRef.current),
    );
    if (fp.name) _setNameRef.current(fp.name as string);
    _applyRef.current(fp);
  }

  const enqueueSnapshot = useCallback(
    (fp: Record<string, unknown>, fpTs: number, uid: string): void => {
      if (!fp || !uid) return;
      if (fpTs > 0 && fpTs === _lastMergedFbTs.current) return;
      _mergeQueueRef.current = _mergeQueueRef.current
        .then(() => _processSnapshot(fp, fpTs, uid))
        .catch((err) => console.error('[sync] snapshot merge error:', err));
    },
    [],
  );

  // ─── doSyncNow ─────────────────────────────────────────────────────────────
  const doSyncNow = useCallback(async (): Promise<boolean> => {
    if (_isSavingRef.current) return false; // concurrent save already in flight
    _isSavingRef.current = true;
    try {
      const {
        authUser: u,
        stats: st,
        name: nm,
        authScreen: as_,
        favs: fv,
        jWords: jw,
        dchlA: da,
        dchlSl: dsl,
      } = _unloadRef.current as {
        authUser: AuthUser | null;
        stats: Stats;
        name: string;
        authScreen: string;
        favs: unknown[];
        jWords: unknown[];
        dchlA: boolean[];
        dchlSl: string[];
      };
      if (!u || as_ !== 'app') return false;
      const snap = buildProgressSnapshot({
        uid: u.u,
        name: nm,
        stats: st,
        dchlA: da,
        dchlSl: dsl,
        favs: fv,
        jWords: jw,
      });
      try {
        localStorage.setItem('uP_' + u.u, JSON.stringify(snap));
      } catch (e) {
        const err = e as Error & { name?: string };
        if (err?.name === 'QuotaExceededError') {
          console.warn(
            '[sync] localStorage quota exceeded — some progress may not persist locally',
          );
        }
      }
      const result = (await fbSaveProgress(u.u, snap).catch(() => ({ ok: false }))) as {
        ok?: boolean;
      };
      const success = result && result.ok !== false;
      if (success) setLastSyncedAt(Date.now());
      return success;
    } finally {
      _isSavingRef.current = false;
    }
  }, [setLastSyncedAt]); // setLastSyncedAt is stable (useState setter) — safe dep

  // Keep caller ref current so onBeforeSignOut always calls latest doSyncNow
  if (syncNowRef) syncNowRef.current = doSyncNow;

  // ─── Backup banner ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (authScreen !== 'app' || !authUser) return;
    if (!localStorage.getItem('fbBackupConfirmed') && !localStorage.getItem('onboarded')) {
      setShowBackupBanner(true);
    }
  }, [authScreen, authUser]);

  // ─── Real-time Firestore listener + iOS wake-up + reconnect ───────────────
  useEffect(() => {
    if (authScreen !== 'app' || !authUser) return undefined;
    const uid = authUser.u;

    _lastMergedFbTs.current = 0;
    _mergeQueueRef.current = Promise.resolve();

    let _initialPushDone = false;

    // Reconnect helper — called when the Firestore watcher errors (permissions,
    // network drop, etc.). Exponential backoff: 5s, 10s, 20s, 40s, 60s cap.
    let _reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let _reconnectAttempts = 0;
    const startWatcher = (): void => {
      if (_watcherUnsubRef.current) {
        try {
          _watcherUnsubRef.current();
        } catch (_) {}
        _watcherUnsubRef.current = null;
      }
      const unsub = fbWatchProgress(
        uid,
        (
          fp: Record<string, unknown> | null,
          fpTs: number,
          meta: { fromCache: boolean; exists: boolean },
        ) => {
          _reconnectAttempts = 0; // reset on success
          _syncFailCount.current = 0;

          // Apply remote data as soon as it arrives (cache OR server) for fast hydration.
          if (fp) enqueueSnapshot(fp, fpTs, uid);

          // _syncReady gates the "is this a brand-new user?" decision — the onboarding
          // tour (AppModals) and the placement redirect (App.tsx) both wait on it.
          // CRITICAL: open it ONLY on an authoritative SERVER snapshot (never a fromCache
          // emission, which is stale/empty on a fresh or Safari/iPad device), AND only
          // AFTER applyRemoteProgress has actually run. enqueueSnapshot defers
          // _processSnapshot onto _mergeQueueRef (a microtask), so setting _syncReady
          // synchronously here would let the gates evaluate against un-restored state and
          // treat a returning user as new. Chaining onto the queue closes that race.
          const _resolution = syncReadyResolution(meta, !!fp);
          if (setSyncReady && _resolution === 'open-after-apply') {
            // Chain onto the merge queue so _syncReady opens only AFTER _processSnapshot
            // (applyRemoteProgress) has run — gates then see the restored state.
            _mergeQueueRef.current = _mergeQueueRef.current
              .then(() => setSyncReady(true))
              .catch(() => setSyncReady(true));
          } else if (setSyncReady && _resolution === 'open-now') {
            // Server confirmed no progress document → genuinely new user. Resolve now
            // so onboarding/placement can legitimately show.
            setSyncReady(true);
          }

          // Initial offline-push-if-newer. Decide ONLY on a SERVER snapshot so we never
          // push stale local data based on the cache emission (which can be older than
          // what another device already saved to Firebase).
          if (!meta.fromCache && fp && !_initialPushDone) {
            _initialPushDone = true;
            const localSnap = gP(uid) as { savedAt?: number } | null;
            const localSavedAt = localSnap?.savedAt || 0;
            if (localSavedAt > (fpTs || 0)) {
              // Local progress is genuinely newer — push it so offline work is not lost.
              // 800ms delay ensures applyRemoteProgress has run before we build the snapshot.
              setTimeout(() => doSyncNow(), 800);
            }
          }
        },
        (err: Error) => {
          // Watcher errored — reconnect silently with exponential backoff (no UI banner)
          console.warn('[sync] Firestore watcher error — scheduling reconnect:', err?.message);
          _syncFailCount.current++;
          _reconnectAttempts++;
          const delay = Math.min(5000 * Math.pow(2, _reconnectAttempts - 1), 60000);
          if (_reconnectTimer) clearTimeout(_reconnectTimer);
          _reconnectTimer = setTimeout(() => {
            startWatcher();
          }, delay);
        },
      );
      _watcherUnsubRef.current = unsub;
    };
    startWatcher();

    const fetchAndEnqueue = async (): Promise<void> => {
      try {
        const fp = (await fbLoadProgress(uid)) as Record<string, unknown> | null;
        if (!fp) return;
        const fpTs = (fp._fbUpdated as number) || 0;
        enqueueSnapshot(fp, fpTs, uid);
      } catch (_) {}
    };

    const iosWakeUp = (): void => {
      if (document.visibilityState === 'visible') fetchAndEnqueue();
    };
    const onPageShow = (e: PageTransitionEvent): void => {
      if (e.persisted) fetchAndEnqueue();
    };

    const onOnline = (): void => {
      setTimeout(async () => {
        const {
          authUser: u,
          stats: st,
          name: nm,
          authScreen: as_,
          favs: fv,
          jWords: jw,
          dchlA: da,
          dchlSl: dsl,
        } = _unloadRef.current as {
          authUser: AuthUser | null;
          stats: Stats;
          name: string;
          authScreen: string;
          favs: unknown[];
          jWords: unknown[];
          dchlA: boolean[];
          dchlSl: string[];
        };
        if (!u || as_ !== 'app') return;

        // Flush offline award queue — audit any XP awarded while disconnected
        offlineAwardQueue.flush(u.u).catch(() => {});

        try {
          const snap = buildProgressSnapshot({
            uid: u.u,
            name: nm,
            stats: st,
            dchlA: da,
            dchlSl: dsl,
            favs: fv,
            jWords: jw,
          });
          await fbSaveProgress(u.u, snap).catch(() => {});
        } catch (_) {}
        fetchAndEnqueue();
      }, 1500);
    };

    document.addEventListener('visibilitychange', iosWakeUp);
    window.addEventListener('pageshow', onPageShow);
    window.addEventListener('online', onOnline);
    return () => {
      if (_reconnectTimer) clearTimeout(_reconnectTimer);
      if (_watcherUnsubRef.current) {
        try {
          _watcherUnsubRef.current();
        } catch (_) {}
        _watcherUnsubRef.current = null;
      }
      document.removeEventListener('visibilitychange', iosWakeUp);
      window.removeEventListener('pageshow', onPageShow);
      window.removeEventListener('online', onOnline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- doSyncNow is stable (useCallback) but adding it causes infinite re-renders; intentional omission
  }, [authScreen, authUser, enqueueSnapshot, setSyncReady]);

  // ─── Firebase ID token cache ───────────────────────────────────────────────
  useEffect(() => {
    if (!authUser || authScreen !== 'app') return undefined;
    const refresh = async (): Promise<void> => {
      try {
        _idTokenRef.current = await fbGetIdToken();
      } catch {}
    };
    refresh();
    const iv = setInterval(refresh, 30 * 60 * 1000);
    return () => {
      clearInterval(iv);
      _idTokenRef.current = '';
    };
  }, [authUser, authScreen]);

  // ─── Periodic push every 5 minutes ─────────────────────────────────────────
  // Raised from 60s → 300s (2026-05-25) to reduce Firestore write rate. The
  // SDK's WriteStream was emitting "Write stream exhausted maximum allowed
  // queued writes" / "Using maximum backoff delay" logs because periodic
  // pushes plus fbApplyDelta bursts were outpacing the WriteStream drain.
  // localStorage is authoritative; cross-device freshness gap of up to 5 min
  // is acceptable. unload handler still flushes a final snapshot on tab close.
  useEffect(() => {
    if (!authUser || authScreen !== 'app') return undefined;
    const iv = setInterval(
      async () => {
        const {
          authUser: u,
          stats: st,
          name: nm,
          authScreen: as_,
          favs: fv,
          jWords: jw,
          dchlA: da,
          dchlSl: dsl,
        } = _unloadRef.current as {
          authUser: AuthUser | null;
          stats: Stats;
          name: string;
          authScreen: string;
          favs: unknown[];
          jWords: unknown[];
          dchlA: boolean[];
          dchlSl: string[];
        };
        if (!u || as_ !== 'app') return;
        // Skip when offline — writes can't drain.
        if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
        // In-flight guard via the same mutex doSyncNow uses. Prevents the
        // periodic tick from stacking a second snapshot write on top of an
        // already-pending one (e.g. a slow link where the previous push is
        // still pending, or doSyncNow triggered between ticks).
        if (_isSavingRef.current) return;
        _isSavingRef.current = true;
        try {
          const snap = buildProgressSnapshot({
            uid: u.u,
            name: nm,
            stats: st,
            dchlA: da,
            dchlSl: dsl,
            favs: fv,
            jWords: jw,
          });
          // Content-equality skip: if the snapshot is byte-identical to the
          // last one we successfully pushed, there's nothing new to sync.
          // Pushing the same ~200KB blob every 5 min on an idle session is
          // pure write-stream pressure for zero data benefit.
          const sig = JSON.stringify(snap);
          if (sig === _lastPeriodicSigRef.current) return;
          const result = (await fbSaveProgress(u.u, snap).catch((e: unknown) => {
            const err = e as { code?: string; message?: string };
            return { ok: false, code: err?.code, err: err?.message };
          })) as { ok?: boolean; code?: string; err?: string };
          if (result && result.ok !== false) {
            _syncFailCount.current = 0;
            _lastPeriodicSigRef.current = sig;
            setLastSyncedAt(Date.now());
          } else {
            _syncFailCount.current += 1;
            if (_syncFailCount.current >= 2) {
              console.warn('[sync] periodic push failed', _syncFailCount.current, 'times');
            }
          }
        } finally {
          _isSavingRef.current = false;
        }
      },
      5 * 60 * 1000,
    );
    return () => clearInterval(iv);
  }, [authUser, authScreen, setLastSyncedAt]);

  // ─── Periodic pull: REMOVED (2026-05-28) ───────────────────────────────────
  // A 3-minute setInterval that fired fbLoadProgress (getDoc on users/{id}).
  // Removed because it was redundant AND actively harmful:
  //  • Redundant: the real-time fbWatchProgress onSnapshot listener (above)
  //    already delivers every cross-device change the instant it lands, and
  //    visibilitychange / pageshow / online handlers cover wake-from-sleep.
  //  • Harmful: when idle the doc isn't changing, so enqueueSnapshot early-
  //    returned and the pull did nothing useful — but the bare getDoc still
  //    WOKE the Firestore network connection every 3 min. If a write was stuck
  //    in the SDK's IndexedDB mutation queue (from past burst writes exceeding
  //    the ~1 write/sec/document soft limit on users/{id}), each wake-up made
  //    the SDK re-attempt the write pipeline flush → "Write stream exhausted
  //    maximum allowed queued writes" + max-backoff logs, every 3 min on the dot.
  // fbLoadProgress is still used by the watcher-bootstrap fetchAndEnqueue path.

  // ─── Unload: localStorage flush + best-effort Firebase push ───────────────
  useEffect(() => {
    const saveSnapshot = (pushToFirebase: boolean): void => {
      const {
        authUser: u_raw,
        stats: st,
        name: nm,
        authScreen: as_,
        favs: fv,
        jWords: jw,
        dchlA: da,
        dchlSl: dsl,
      } = _unloadRef.current as {
        authUser: AuthUser | null;
        stats: Stats;
        name: string;
        authScreen: string;
        favs: unknown[];
        jWords: unknown[];
        dchlA: boolean[];
        dchlSl: string[];
      };
      // authUser can be momentarily null during Firebase token refresh at tab-close.
      // Fall back to _lastKnownUserRef (updated every render while authenticated) so
      // pagehide / visibilitychange saves are never silently skipped in that narrow window.
      const u = u_raw || (as_ === 'app' ? _lastKnownUserRef.current : null);
      if (!u || as_ !== 'app') return;
      try {
        const snap = buildProgressSnapshot({
          uid: u.u,
          name: nm,
          stats: st,
          dchlA: da,
          dchlSl: dsl,
          favs: fv,
          jWords: jw,
        });
        (_unloadRef.current as Record<string, unknown>)._lastSaved = snap;
        try {
          localStorage.setItem('uP_' + u.u, JSON.stringify(snap));
        } catch (e) {
          const err = e as Error & { name?: string };
          if (err?.name === 'QuotaExceededError') {
            console.warn(
              '[sync] localStorage quota exceeded — some progress may not persist locally',
            );
          }
        }
        if (pushToFirebase) fbSaveProgress(u.u, snap).catch(() => {});
      } catch (_) {}
    };
    const sendBeacon = (u: AuthUser | null, d: unknown): void => {
      if (!navigator.sendBeacon || !_idTokenRef.current || !u || !d) return;
      try {
        const pl = JSON.stringify({
          token: _idTokenRef.current,
          uid: u.u,
          data: JSON.stringify(d),
        });
        if (pl.length < 60000)
          navigator.sendBeacon('/api/save-progress', new Blob([pl], { type: 'application/json' }));
      } catch (_) {}
    };
    // Dedup guard: both pagehide and visibilitychange(hidden) fire together on tab close.
    // Without this flag, two concurrent fbSaveProgress calls and two sendBeacon calls launch.
    let _hideFired = false;
    const _doHideSave = (u: AuthUser | null): void => {
      if (_hideFired) return;
      _hideFired = true;
      saveSnapshot(true);
      sendBeacon(u, (_unloadRef.current as Record<string, unknown>)._lastSaved);
      // Reset after 5000ms — fbSaveProgress uses _withRetry (600+1200+2400ms total).
      // 200ms was too short: a retrying write could complete AFTER the guard reset,
      // causing a concurrent second write to race and potentially overwrite the newer snapshot.
      setTimeout(() => {
        _hideFired = false;
      }, 5000);
    };
    const onUnload = (): void => saveSnapshot(false);
    const onPageHide = (e: PageTransitionEvent): void => {
      _doHideSave(_unloadRef.current.authUser as AuthUser | null);
      if (e.persisted && typeof _watcherUnsubRef.current === 'function') {
        _watcherUnsubRef.current();
        _watcherUnsubRef.current = null;
      }
    };
    const onVisHide = (): void => {
      if (document.visibilityState !== 'hidden') return;
      _doHideSave(_unloadRef.current.authUser as AuthUser | null);
    };
    window.addEventListener('beforeunload', onUnload);
    window.addEventListener('pagehide', onPageHide);
    document.addEventListener('visibilitychange', onVisHide);
    return () => {
      window.removeEventListener('beforeunload', onUnload);
      window.removeEventListener('pagehide', onPageHide);
      document.removeEventListener('visibilitychange', onVisHide);
    };
  }, []);

  return {
    doSyncNow,
    showBackupBanner,
    setShowBackupBanner,
    lastSyncedAt,
  };
}
