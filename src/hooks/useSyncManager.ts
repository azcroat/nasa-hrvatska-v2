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
  gP, lP, fbSaveProgress, fbLoadProgress, fbWatchProgress, fbGetIdToken,
} from '../lib/firebase.js';
import { buildProgressSnapshot } from '../lib/progressSnapshot.js';
import { mergeStatsFromRemote } from '../lib/mergeStatsFromRemote.js';
import type { Stats, AuthUser } from '../types/index.js';

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
  syncError: boolean;
  setSyncError: React.Dispatch<React.SetStateAction<boolean>>;
  syncErrorCode: string;
}

export function useSyncManager({
  authUser, authScreen, name, stats, favs, jWords, dchlA, dchlSl,
  setStats, setName, applyRemoteProgress, ds,
  syncNowRef,
  setSyncReady,
  syncReady,
}: SyncManagerParams): SyncManagerResult {
  const [showBackupBanner, setShowBackupBanner] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const [syncErrorCode, setSyncErrorCode] = useState('');
  const _syncFailCount = useRef(0);
  const _watcherUnsubRef = useRef<(() => void) | null>(null);
  const _idTokenRef = useRef('');

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
  _unloadRef.current = { authUser, stats, name, authScreen, favs, jWords, dchlA, dchlSl, syncReady };
  _setStatsRef.current = setStats;
  _setNameRef.current = setName;
  _applyRef.current = applyRemoteProgress;
  _dsRef.current = ds;

  // ─── Core merge logic ──────────────────────────────────────────────────────
  function _processSnapshot(fp: Record<string, unknown>, fpTs: number, uid: string): void {
    if (fpTs > 0 && fpTs === _lastMergedFbTs.current) return;
    if (fpTs > 0) _lastMergedFbTs.current = fpTs;

    const lp = gP(uid) as Record<string, unknown> | null;
    const pSt = (fp.stats || fp.st || {}) as Record<string, unknown>;
    const lpSt = lp ? ((lp.stats || lp.st || {}) as Record<string, unknown>) : {};

    const mergedStats = {
      ...pSt,
      xp:    Math.max((lpSt.xp as number) || 0, (pSt.xp as number) || 0),
      lc:    Math.max((lpSt.lc as number) || 0, (pSt.lc as number) || 0),
      gc:    Math.max((lpSt.gc as number) || 0, (pSt.gc as number) || 0),
      sp:    Math.max((lpSt.sp as number) || 0, (pSt.sp as number) || 0),
      de:    Math.max((lpSt.de as number) || 0, (pSt.de as number) || 0),
      rc:    Math.max((lpSt.rc as number) || 0, (pSt.rc as number) || 0),
      str:   Math.max((lpSt.str as number) || 0, (pSt.str as number) || 0),
      pf:    Math.max((lpSt.pf as number) || 0, (pSt.pf as number) || 0),
      mv:    Math.max((lpSt.mv as number) || 0, (pSt.mv as number) || 0),
      hi:    Math.max((lpSt.hi as number) || 0, (pSt.hi as number) || 0),
      ct:    [...new Set([...((lpSt.ct as string[]) || []), ...((pSt.ct as string[]) || [])])],
      vs:    [...new Set([...((lpSt.vs as string[]) || []), ...((pSt.vs as string[]) || [])])],
      badges:[...new Set([...((lpSt.badges as string[]) || []), ...((pSt.badges as string[]) || [])])],
    };

    lP(uid, { ...fp, savedAt: fpTs || Date.now(), stats: mergedStats });

    _setStatsRef.current(prev => mergeStatsFromRemote(prev, pSt as Partial<Stats>, _dsRef.current));
    if (fp.name) _setNameRef.current(fp.name as string);
    _applyRef.current(fp);
  }

  const enqueueSnapshot = useCallback((fp: Record<string, unknown>, fpTs: number, uid: string): void => {
    if (!fp || !uid) return;
    if (fpTs > 0 && fpTs === _lastMergedFbTs.current) return;
    _mergeQueueRef.current = _mergeQueueRef.current
      .then(() => _processSnapshot(fp, fpTs, uid))
      .catch((err) => console.error('[sync] snapshot merge error:', err));
  }, []);

  // ─── doSyncNow ─────────────────────────────────────────────────────────────
  const doSyncNow = useCallback(async (): Promise<boolean> => {
    const { authUser: u, stats: st, name: nm, authScreen: as_, favs: fv, jWords: jw, dchlA: da, dchlSl: dsl } = _unloadRef.current as {
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
      uid: u.u, name: nm, stats: st, dchlA: da, dchlSl: dsl, favs: fv, jWords: jw,
    });
    try {
      localStorage.setItem('uP_' + u.u, JSON.stringify(snap));
    } catch (e) {
      const err = e as Error & { name?: string };
      if (err?.name === 'QuotaExceededError') {
        console.warn('[sync] localStorage quota exceeded — some progress may not persist locally');
      }
    }
    const result = await fbSaveProgress(u.u, snap).catch(() => ({ ok: false })) as { ok?: boolean };
    return result && result.ok !== false;
  }, [authUser]);

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

    const unsub = fbWatchProgress(uid, (fp: Record<string, unknown>, fpTs: number) => {
      if (setSyncReady) setSyncReady(true);
      _syncFailCount.current = 0;
      setSyncError(false);
      setSyncErrorCode('');
      if (!_initialPushDone) {
        _initialPushDone = true;
        setTimeout(() => doSyncNow(), 1000);
      }
      if (!fp || fpTs === 0) return;
      enqueueSnapshot(fp, fpTs, uid);
    });
    _watcherUnsubRef.current = unsub;

    const fetchAndEnqueue = async (): Promise<void> => {
      try {
        const fp = await fbLoadProgress(uid) as Record<string, unknown> | null;
        if (!fp) return;
        const fpTs = (fp._fbUpdated as number) || 0;
        enqueueSnapshot(fp, fpTs, uid);
      } catch (_) {}
    };

    const iosWakeUp = (): void => {
      if (document.visibilityState === 'visible') fetchAndEnqueue();
    };
    const onPageShow = (e: PageTransitionEvent): void => { if (e.persisted) fetchAndEnqueue(); };

    const onOnline = (): void => {
      setTimeout(async () => {
        const { authUser: u, stats: st, name: nm, authScreen: as_, favs: fv, jWords: jw, dchlA: da, dchlSl: dsl } = _unloadRef.current as {
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
        try {
          const snap = buildProgressSnapshot({ uid: u.u, name: nm, stats: st, dchlA: da, dchlSl: dsl, favs: fv, jWords: jw });
          await fbSaveProgress(u.u, snap).catch(() => {});
        } catch (_) {}
        fetchAndEnqueue();
      }, 1500);
    };

    document.addEventListener('visibilitychange', iosWakeUp);
    window.addEventListener('pageshow', onPageShow);
    window.addEventListener('online', onOnline);
    return () => {
      unsub();
      _watcherUnsubRef.current = null;
      document.removeEventListener('visibilitychange', iosWakeUp);
      window.removeEventListener('pageshow', onPageShow);
      window.removeEventListener('online', onOnline);
    };
  }, [authScreen, authUser, enqueueSnapshot, setSyncReady]);

  // ─── Firebase ID token cache ───────────────────────────────────────────────
  useEffect(() => {
    if (!authUser || authScreen !== 'app') return undefined;
    const refresh = async (): Promise<void> => { try { _idTokenRef.current = await fbGetIdToken(); } catch {} };
    refresh();
    const iv = setInterval(refresh, 30 * 60 * 1000);
    return () => { clearInterval(iv); _idTokenRef.current = ''; };
  }, [authUser, authScreen]);

  // ─── Periodic push every 60s ───────────────────────────────────────────────
  useEffect(() => {
    if (!authUser || authScreen !== 'app') return undefined;
    const iv = setInterval(async () => {
      const { authUser: u, stats: st, name: nm, authScreen: as_, favs: fv, jWords: jw, dchlA: da, dchlSl: dsl, syncReady: sr } = _unloadRef.current as {
        authUser: AuthUser | null;
        stats: Stats;
        name: string;
        authScreen: string;
        favs: unknown[];
        jWords: unknown[];
        dchlA: boolean[];
        dchlSl: string[];
        syncReady: boolean;
      };
      if (!u || as_ !== 'app') return;
      if (!sr) return;
      const snap = buildProgressSnapshot({ uid: u.u, name: nm, stats: st, dchlA: da, dchlSl: dsl, favs: fv, jWords: jw });
      const result = await fbSaveProgress(u.u, snap).catch((e: unknown) => {
        const err = e as { code?: string; message?: string };
        return { ok: false, code: err?.code, err: err?.message };
      }) as { ok?: boolean; code?: string; err?: string };
      if (result && result.ok !== false) {
        _syncFailCount.current = 0;
        setSyncError(false);
        setSyncErrorCode('');
      } else {
        _syncFailCount.current += 1;
        if (_syncFailCount.current >= 2) {
          setSyncError(true);
          setSyncErrorCode(result?.code || result?.err || 'unknown');
        }
      }
    }, 60 * 1000);
    return () => clearInterval(iv);
  }, [authUser, authScreen]);

  // ─── Periodic pull every 3 min ─────────────────────────────────────────────
  useEffect(() => {
    if (!authUser || authScreen !== 'app') return undefined;
    const uid = authUser.u;
    const iv = setInterval(async () => {
      const { authUser: u, authScreen: as_ } = _unloadRef.current as { authUser: AuthUser | null; authScreen: string };
      if (!u || as_ !== 'app') return;
      try {
        const fp = await fbLoadProgress(uid) as Record<string, unknown> | null;
        if (!fp) return;
        const fpTs = (fp._fbUpdated as number) || 0;
        enqueueSnapshot(fp, fpTs, uid);
      } catch (_) {}
    }, 3 * 60 * 1000);
    return () => clearInterval(iv);
  }, [authUser, authScreen, enqueueSnapshot]);

  // ─── Unload: localStorage flush + best-effort Firebase push ───────────────
  useEffect(() => {
    const saveSnapshot = (pushToFirebase: boolean): void => {
      const { authUser: u, stats: st, name: nm, authScreen: as_, favs: fv, jWords: jw, dchlA: da, dchlSl: dsl } = _unloadRef.current as {
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
      try {
        const snap = buildProgressSnapshot({ uid: u.u, name: nm, stats: st, dchlA: da, dchlSl: dsl, favs: fv, jWords: jw });
        (_unloadRef.current as Record<string, unknown>)._lastSaved = snap;
        try {
          localStorage.setItem('uP_' + u.u, JSON.stringify(snap));
        } catch (e) {
          const err = e as Error & { name?: string };
          if (err?.name === 'QuotaExceededError') {
            console.warn('[sync] localStorage quota exceeded — some progress may not persist locally');
          }
        }
        if (pushToFirebase) fbSaveProgress(u.u, snap).catch(() => {});
      } catch (_) {}
    };
    const sendBeacon = (u: AuthUser | null, d: unknown): void => {
      if (!navigator.sendBeacon || !_idTokenRef.current || !u || !d) return;
      try {
        const pl = JSON.stringify({ token: _idTokenRef.current, uid: u.u, data: JSON.stringify(d) });
        if (pl.length < 60000) navigator.sendBeacon('/api/save-progress', new Blob([pl], { type: 'application/json' }));
      } catch (_) {}
    };
    const onUnload = (): void => saveSnapshot(false);
    const onPageHide = (e: PageTransitionEvent): void => {
      saveSnapshot(true);
      sendBeacon(
        (_unloadRef.current.authUser as AuthUser | null),
        (_unloadRef.current as Record<string, unknown>)._lastSaved,
      );
      if (e.persisted && typeof _watcherUnsubRef.current === 'function') {
        _watcherUnsubRef.current();
        _watcherUnsubRef.current = null;
      }
    };
    const onVisHide = (): void => {
      if (document.visibilityState !== 'hidden') return;
      saveSnapshot(true);
      sendBeacon(
        (_unloadRef.current.authUser as AuthUser | null),
        (_unloadRef.current as Record<string, unknown>)._lastSaved,
      );
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

  return { doSyncNow, showBackupBanner, setShowBackupBanner, syncError, setSyncError, syncErrorCode };
}
