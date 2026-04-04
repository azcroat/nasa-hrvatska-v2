/**
 * useSyncManager — Firebase sync, Firestore watcher, and persistence effects.
 *
 * Architecture: Firebase is the authoritative source of truth.
 * Local state is an optimistic cache that converges upward on every sync event.
 *
 * Key design principles:
 *  1. No dropped snapshots — all incoming Firestore snapshots are queued via a
 *     Promise chain and processed in arrival order. Replaces the boolean mutex +
 *     200ms setTimeout that silently dropped concurrent snapshots.
 *  2. Stats are additive-merged (Math.max) — numeric progress never decreases
 *     regardless of which device writes first.
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

export function useSyncManager({
  authUser, authScreen, name, stats, favs, jWords, dchlA, dchlSl,
  setStats, setName, applyRemoteProgress, ds,
  // Caller-owned ref — updated here each render so onBeforeSignOut always
  // calls the latest doSyncNow without a stale closure.
  syncNowRef,
  // Caller-owned setter so useAuth can also mark sync ready on sign-in.
  setSyncReady,
  // Whether Firebase has delivered the first snapshot — gates periodic writes
  // so we never overwrite with stale local data before remote merge completes.
  syncReady,
}) {
  const [showBackupBanner, setShowBackupBanner] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const [syncErrorCode, setSyncErrorCode] = useState('');
  const _syncFailCount = useRef(0);
  const _watcherUnsubRef = useRef(null);
  const _idTokenRef = useRef('');

  // Keeps latest state available to unload handlers without stale deps
  const _unloadRef = useRef({});

  // Promise-based serial queue — every snapshot merge appends to this chain.
  // If a merge is running when a new snapshot arrives, the new one waits in
  // line and executes immediately after the current one completes.
  // This replaces the old boolean _mergeInProgressRef + 200ms setTimeout which
  // silently dropped any snapshot that arrived within the debounce window.
  const _mergeQueueRef = useRef(Promise.resolve());

  // Last processed Firebase server-timestamp — exact dedup within a session.
  // Prevents the watcher and the periodic pull from double-applying the same
  // snapshot. Reset to 0 when the watcher is torn down (auth sign-out).
  const _lastMergedFbTs = useRef(0);

  // Stable refs for all callbacks — prevents stale closures inside the queue
  const _setStatsRef = useRef(setStats);
  const _setNameRef = useRef(setName);
  const _applyRef = useRef(applyRemoteProgress);
  const _dsRef = useRef(ds);

  // Sync latest values into refs on every render (synchronous, before effects)
  _unloadRef.current = { authUser, stats, name, authScreen, favs, jWords, dchlA, dchlSl, syncReady };
  _setStatsRef.current = setStats;
  _setNameRef.current = setName;
  _applyRef.current = applyRemoteProgress;
  _dsRef.current = ds;

  // ─── Core merge logic ──────────────────────────────────────────────────────
  // _processSnapshot executes inside the serial queue — guaranteed no concurrent
  // merge can run simultaneously. All snapshot paths (watcher, iosWakeUp,
  // periodic pull) funnel through this single function.

  function _processSnapshot(fp, fpTs, uid) {
    // Re-check dedup after waiting in queue (a prior queued snapshot may have
    // already applied this exact Firebase timestamp while we were waiting).
    if (fpTs > 0 && fpTs === _lastMergedFbTs.current) return;
    if (fpTs > 0) _lastMergedFbTs.current = fpTs;

    const lp = gP(uid);
    const pSt = fp.stats || fp.st || {};
    const lpSt = lp ? (lp.stats || lp.st || {}) : {};

    // Additive merge: Math.max for every numeric counter, union for arrays.
    // This ensures a device coming back online after offline work never loses
    // progress that was earned on either device.
    const mergedStats = {
      ...pSt,
      xp:    Math.max(lpSt.xp    || 0, pSt.xp    || 0),
      lc:    Math.max(lpSt.lc    || 0, pSt.lc    || 0),
      gc:    Math.max(lpSt.gc    || 0, pSt.gc    || 0),
      sp:    Math.max(lpSt.sp    || 0, pSt.sp    || 0),
      de:    Math.max(lpSt.de    || 0, pSt.de    || 0),
      rc:    Math.max(lpSt.rc    || 0, pSt.rc    || 0),
      str:   Math.max(lpSt.str   || 0, pSt.str   || 0),
      pf:    Math.max(lpSt.pf    || 0, pSt.pf    || 0),
      mv:    Math.max(lpSt.mv    || 0, pSt.mv    || 0),
      hi:    Math.max(lpSt.hi    || 0, pSt.hi    || 0),
      ct:    [...new Set([...(lpSt.ct     || []), ...(pSt.ct     || [])])],
      vs:    [...new Set([...(lpSt.vs     || []), ...(pSt.vs     || [])])],
      badges:[...new Set([...(lpSt.badges || []), ...(pSt.badges || [])])],
    };

    // Persist merged state to localStorage so the next page load or snapshot
    // read gets the correct merged baseline (not the raw remote value).
    lP(uid, { ...fp, savedAt: fpTs || Date.now(), stats: mergedStats });

    // Update React state via stable refs (no stale closure risk)
    _setStatsRef.current(prev => mergeStatsFromRemote(prev, pSt, _dsRef.current));
    if (fp.name) _setNameRef.current(fp.name);
    _applyRef.current(fp);
  }

  // enqueueSnapshot — the public entry point for all three snapshot sources.
  // Performs a fast pre-queue dedup check, then appends to the serial chain.
  // The .catch() at the end ensures a broken merge never halts future merges.
  const enqueueSnapshot = useCallback((fp, fpTs, uid) => {
    if (!fp || !uid) return;
    // Fast dedup before queuing — skip if we already processed this exact ts
    if (fpTs > 0 && fpTs === _lastMergedFbTs.current) return;
    _mergeQueueRef.current = _mergeQueueRef.current
      .then(() => _processSnapshot(fp, fpTs, uid))
      .catch((err) => console.error('[sync] snapshot merge error:', err));
  }, []); // stable — all state accessed via refs

  // ─── doSyncNow ─────────────────────────────────────────────────────────────
  const doSyncNow = useCallback(async () => {
    const { authUser: u, stats: st, name: nm, authScreen: as, favs: fv, jWords: jw, dchlA: da, dchlSl: dsl } = _unloadRef.current;
    if (!u || as !== 'app') return false;
    const snap = buildProgressSnapshot({
      uid: u.u, name: nm, stats: st, dchlA: da, dchlSl: dsl, favs: fv, jWords: jw,
    });
    try {
      localStorage.setItem('uP_' + u.u, JSON.stringify(snap));
    } catch (e) {
      if (e?.name === 'QuotaExceededError') {
        console.warn('[sync] localStorage quota exceeded — some progress may not persist locally');
      }
    }
    const result = await fbSaveProgress(u.u, snap).catch(() => ({ ok: false }));
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

    // Reset merge dedup counter on each auth session so a fresh sign-in
    // always re-processes the first Firebase snapshot.
    _lastMergedFbTs.current = 0;
    _mergeQueueRef.current = Promise.resolve();

    // Push local progress to Firebase as soon as the watcher first connects.
    // Without this, the first push waits up to 60s (the periodic timer), causing
    // a stale-streak window when another device opens during that gap.
    let _initialPushDone = false;

    const unsub = fbWatchProgress(uid, (fp, fpTs) => {
      if (setSyncReady) setSyncReady(true);
      // Reset fail counter — live connection confirmed
      _syncFailCount.current = 0;
      setSyncError(false);
      setSyncErrorCode('');
      if (!_initialPushDone) {
        _initialPushDone = true;
        // Push current local state immediately so other devices see it within ~1s
        // of this device connecting, rather than waiting for the 60s periodic timer.
        setTimeout(() => doSyncNow(), 1000);
      }
      if (!fp || fpTs === 0) return; // empty doc — nothing to merge
      enqueueSnapshot(fp, fpTs, uid);
    });
    _watcherUnsubRef.current = unsub;

    // Shared helper: getDoc → enqueue (used by all non-watcher pull paths)
    const fetchAndEnqueue = async () => {
      try {
        const fp = await fbLoadProgress(uid);
        if (!fp) return;
        const fpTs = fp._fbUpdated || 0;
        enqueueSnapshot(fp, fpTs, uid);
      } catch (_) {}
    };

    // iOS Safari / WKWebView: gRPC-Web listener silently dies on background/restore.
    // Force a getDoc on every visibility restore to guarantee convergence.
    const iosWakeUp = () => {
      if (document.visibilityState === 'visible') fetchAndEnqueue();
    };
    const onPageShow = (e) => { if (e.persisted) fetchAndEnqueue(); };

    // Reconnect: push any offline edits to Firebase, then pull latest remote
    const onOnline = () => {
      setTimeout(async () => {
        const { authUser: u, stats: st, name: nm, authScreen: as, favs: fv, jWords: jw, dchlA: da, dchlSl: dsl } = _unloadRef.current;
        if (!u || as !== 'app') return;
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
    const refresh = async () => { try { _idTokenRef.current = await fbGetIdToken(); } catch {} };
    refresh();
    const iv = setInterval(refresh, 30 * 60 * 1000);
    return () => { clearInterval(iv); _idTokenRef.current = ''; };
  }, [authUser, authScreen]);

  // ─── Periodic push every 60s ───────────────────────────────────────────────
  // Ensures progress reaches Firestore even on browser crash or power loss.
  // Tracks consecutive failures and surfaces a visible warning after 2 failures
  // so sync issues are never silent.
  useEffect(() => {
    if (!authUser || authScreen !== 'app') return undefined;
    const iv = setInterval(async () => {
      const { authUser: u, stats: st, name: nm, authScreen: as, favs: fv, jWords: jw, dchlA: da, dchlSl: dsl, syncReady: sr } = _unloadRef.current;
      if (!u || as !== 'app') return;
      // Gate: do not write until Firestore has delivered at least one snapshot.
      // Without this, a fresh sign-in writes lc:0/xp:0 before remote data merges,
      // violating the Firestore rules (lc >= oldLc) and causing permission-denied loops.
      if (!sr) return;
      const snap = buildProgressSnapshot({ uid: u.u, name: nm, stats: st, dchlA: da, dchlSl: dsl, favs: fv, jWords: jw });
      const result = await fbSaveProgress(u.u, snap).catch((e) => ({ ok: false, code: e?.code, err: e?.message }));
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
  // Failsafe for when the real-time gRPC-Web listener silently dies (common on
  // iOS Chrome / WKWebView and poor mobile networks). Guarantees convergence even
  // when the user stays on a single screen for an extended period.
  useEffect(() => {
    if (!authUser || authScreen !== 'app') return undefined;
    const uid = authUser.u;
    const iv = setInterval(async () => {
      const { authUser: u, authScreen: as } = _unloadRef.current;
      if (!u || as !== 'app') return;
      try {
        const fp = await fbLoadProgress(uid);
        if (!fp) return;
        const fpTs = fp._fbUpdated || 0;
        enqueueSnapshot(fp, fpTs, uid);
      } catch (_) {}
    }, 3 * 60 * 1000);
    return () => clearInterval(iv);
  }, [authUser, authScreen, enqueueSnapshot]);

  // ─── Unload: localStorage flush + best-effort Firebase push ───────────────
  useEffect(() => {
    const saveSnapshot = (pushToFirebase) => {
      const { authUser: u, stats: st, name: nm, authScreen: as, favs: fv, jWords: jw, dchlA: da, dchlSl: dsl } = _unloadRef.current;
      if (!u || as !== 'app') return;
      try {
        const snap = buildProgressSnapshot({ uid: u.u, name: nm, stats: st, dchlA: da, dchlSl: dsl, favs: fv, jWords: jw });
        _unloadRef.current._lastSaved = snap;
        try {
          localStorage.setItem('uP_' + u.u, JSON.stringify(snap));
        } catch (e) {
          if (e?.name === 'QuotaExceededError') {
            console.warn('[sync] localStorage quota exceeded — some progress may not persist locally');
          }
        }
        if (pushToFirebase) fbSaveProgress(u.u, snap).catch(() => {});
      } catch (_) {}
    };
    const sendBeacon = (u, d) => {
      if (!navigator.sendBeacon || !_idTokenRef.current || !u || !d) return;
      try {
        const pl = JSON.stringify({ token: _idTokenRef.current, uid: u.u, data: JSON.stringify(d) });
        if (pl.length < 60000) navigator.sendBeacon('/api/save-progress', new Blob([pl], { type: 'application/json' }));
      } catch (_) {}
    };
    const onUnload = () => saveSnapshot(false);
    const onPageHide = (e) => {
      saveSnapshot(true);
      sendBeacon(_unloadRef.current.authUser, _unloadRef.current._lastSaved);
      if (e.persisted && typeof _watcherUnsubRef.current === 'function') {
        _watcherUnsubRef.current();
        _watcherUnsubRef.current = null;
      }
    };
    const onVisHide = () => {
      if (document.visibilityState !== 'hidden') return;
      saveSnapshot(true);
      sendBeacon(_unloadRef.current.authUser, _unloadRef.current._lastSaved);
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
