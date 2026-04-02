/**
 * useSyncManager — Firebase sync, Firestore watcher, and persistence effects.
 *
 * Extracted from App.jsx to isolate the most complex cross-cutting concern.
 * Manages: real-time Firestore listener, beforeunload/pagehide flush,
 * ID token cache, and showBackupBanner state.
 *
 * NOTE: applyRemoteProgress is defined in App.jsx (needs setFavs/setJWords/sDchlA/sDchlSl
 * from hooks called before useAuth) and passed here as a parameter.
 * syncNowRef is maintained in App.jsx to break the useAuth TDZ cycle.
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
}) {
  const [showBackupBanner, setShowBackupBanner] = useState(false);
  const _watcherUnsubRef = useRef(null);
  const _idTokenRef = useRef('');
  // Keeps latest state available to unload handlers without stale deps
  const _unloadRef = useRef({});
  // Prevents simultaneous watcher + iosWakeUp from double-applying a remote merge
  const _mergeInProgressRef = useRef(false);
  // Tracks the last Firebase server-timestamp we successfully merged.
  // Replaces the old `fpTs > lpTs` comparison which broke when autosave inflated
  // the local `savedAt` timestamp, falsely making local appear "newer" than Firebase.
  // Now we merge any Firebase snapshot that has a different (new) server timestamp,
  // regardless of what the local savedAt says.
  const _lastMergedFbTs = useRef(0);

  // Sync latest state into ref on every render (synchronous, before effects)
  _unloadRef.current = { authUser, stats, name, authScreen, favs, jWords, dchlA, dchlSl };

  // doSyncNow: persist current state to localStorage + Firebase
  const doSyncNow = useCallback(async () => {
    if (!authUser) return false;
    const snap = buildProgressSnapshot({
      uid: authUser.u, name, stats, dchlA, dchlSl, favs, jWords,
    });
    try {
      localStorage.setItem('uP_' + authUser.u, JSON.stringify(snap));
    } catch (e) {
      if (e && e.name === 'QuotaExceededError') {
        console.warn('[sync] localStorage quota exceeded — some progress may not persist locally');
      }
    }
    const result = await fbSaveProgress(authUser.u, snap).catch(() => ({ ok: false }));
    return result && result.ok !== false;
  }, [authUser, name, stats, favs, jWords, dchlA, dchlSl]);

  // Keep caller ref current so onBeforeSignOut always calls latest doSyncNow
  if (syncNowRef) syncNowRef.current = doSyncNow;

  // Show backup banner once after first successful Firebase sync for a new user
  useEffect(() => {
    if (authScreen !== 'app' || !authUser) return;
    // _syncReady handled by caller — we gate on fbBackupConfirmed + onboarded
    if (!localStorage.getItem('fbBackupConfirmed') && !localStorage.getItem('onboarded')) {
      setShowBackupBanner(true);
    }
  }, [authScreen, authUser]);

  // Real-time Firestore listener + iOS wake-up on visibilitychange
  useEffect(() => {
    if (authScreen !== 'app' || !authUser) return undefined;
    const unsub = fbWatchProgress(authUser.u, (fp, fpTs) => {
      if (setSyncReady) setSyncReady(true);
      // Merge whenever Firebase has a new server timestamp we haven't processed yet.
      // This replaces the old `fpTs > lpTs` check: comparing against the local savedAt
      // (which autosave bumps every 30s) caused Firebase data to be rejected when the
      // local clock appeared "newer" — the primary cause of divergent multi-device state.
      const isNewSnapshot = fpTs > 0 && fpTs !== _lastMergedFbTs.current;
      if (!isNewSnapshot) return;
      if (_mergeInProgressRef.current) return;
      _mergeInProgressRef.current = true;
      _lastMergedFbTs.current = fpTs;
      try {
        const lp = gP(authUser.u);
        const pSt = fp.stats || fp.st || {};
        // Always merge additive: take max of local + remote, union arrays.
        // Safe even when local is "newer" — Math.max/union can never decrease values.
        const lpSt = lp ? (lp.stats || lp.st || {}) : {};
        const mergedStats = {
          ...pSt,
          xp:  Math.max(lpSt.xp  || 0, pSt.xp  || 0),
          lc:  Math.max(lpSt.lc  || 0, pSt.lc  || 0),
          gc:  Math.max(lpSt.gc  || 0, pSt.gc  || 0),
          sp:  Math.max(lpSt.sp  || 0, pSt.sp  || 0),
          de:  Math.max(lpSt.de  || 0, pSt.de  || 0),
          rc:  Math.max(lpSt.rc  || 0, pSt.rc  || 0),
          str: Math.max(lpSt.str || 0, pSt.str || 0),
          pf:  Math.max(lpSt.pf  || 0, pSt.pf  || 0),
          mv:  Math.max(lpSt.mv  || 0, pSt.mv  || 0),
          hi:  Math.max(lpSt.hi  || 0, pSt.hi  || 0),
          ct:  [...new Set([...(lpSt.ct  || []), ...(pSt.ct  || [])])],
          vs:  [...new Set([...(lpSt.vs  || []), ...(pSt.vs  || [])])],
          badges: [...new Set([...(lpSt.badges || []), ...(pSt.badges || [])])],
        };
        lP(authUser.u, { ...fp, savedAt: fpTs, stats: mergedStats });
        setStats(prev => mergeStatsFromRemote(prev, pSt, ds));
        if (fp.name) setName(fp.name);
        applyRemoteProgress(fp);
      } finally {
        setTimeout(() => { _mergeInProgressRef.current = false; }, 200);
      }
    });
    _watcherUnsubRef.current = unsub;

    // iOS Safari: force getDoc on visibility restore (gRPC-Web can silently fail)
    const iosWakeUp = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const fp = await fbLoadProgress(authUser.u);
        if (!fp) return;
        const fpTs = fp._fbUpdated || 0;
        // Use same _lastMergedFbTs tracking as the watcher — skip if we already
        // processed this exact Firebase snapshot in this session.
        if (fpTs > 0 && fpTs === _lastMergedFbTs.current) return;
        if (_mergeInProgressRef.current) return;
        _mergeInProgressRef.current = true;
        _lastMergedFbTs.current = fpTs || (_lastMergedFbTs.current + 1);
        try {
          const lp = gP(authUser.u);
          const pSt = fp.stats || fp.st || {};
          const lpSt2 = lp ? (lp.stats || lp.st || {}) : {};
          const mergedStats2 = {
            ...pSt,
            xp:  Math.max(lpSt2.xp  || 0, pSt.xp  || 0),
            lc:  Math.max(lpSt2.lc  || 0, pSt.lc  || 0),
            gc:  Math.max(lpSt2.gc  || 0, pSt.gc  || 0),
            sp:  Math.max(lpSt2.sp  || 0, pSt.sp  || 0),
            de:  Math.max(lpSt2.de  || 0, pSt.de  || 0),
            rc:  Math.max(lpSt2.rc  || 0, pSt.rc  || 0),
            str: Math.max(lpSt2.str || 0, pSt.str || 0),
            pf:  Math.max(lpSt2.pf  || 0, pSt.pf  || 0),
            mv:  Math.max(lpSt2.mv  || 0, pSt.mv  || 0),
            hi:  Math.max(lpSt2.hi  || 0, pSt.hi  || 0),
            ct:  [...new Set([...(lpSt2.ct  || []), ...(pSt.ct  || [])])],
            vs:  [...new Set([...(lpSt2.vs  || []), ...(pSt.vs  || [])])],
            badges: [...new Set([...(lpSt2.badges || []), ...(pSt.badges || [])])],
          };
          lP(authUser.u, { ...fp, savedAt: fpTs, stats: mergedStats2 });
          setStats(prev => mergeStatsFromRemote(prev, pSt, ds));
          if (fp.name) setName(fp.name);
          applyRemoteProgress(fp);
        } finally {
          setTimeout(() => { _mergeInProgressRef.current = false; }, 200);
        }
      } catch (_) {}
    };
    const onPageShow = (e) => { if (e.persisted) iosWakeUp(); };
    // Reconnect sync: flush any locally-queued progress when network comes back
    const onOnline = () => {
      // Small delay so the network stack is stable before we hit Firebase
      setTimeout(() => {
        iosWakeUp();
        // Also push local state → Firebase in case offline edits were made
        const { authUser: u, stats: st, name: nm, authScreen: as, favs: fv, jWords: jw, dchlA: da, dchlSl: dsl } = _unloadRef.current;
        if (!u || as !== 'app') return;
        try {
          const snap = buildProgressSnapshot({ uid: u.u, name: nm, stats: st, dchlA: da, dchlSl: dsl, favs: fv, jWords: jw });
          fbSaveProgress(u.u, snap).catch(() => {});
        } catch (_) {}
      }, 1500);
    };
    document.addEventListener('visibilitychange', iosWakeUp);
    window.addEventListener('pageshow', onPageShow);
    window.addEventListener('online', onOnline);
    return () => {
      unsub();
      _watcherUnsubRef.current = null;
      _mergeInProgressRef.current = false;
      document.removeEventListener('visibilitychange', iosWakeUp);
      window.removeEventListener('pageshow', onPageShow);
      window.removeEventListener('online', onOnline);
    };
  }, [authScreen, authUser, applyRemoteProgress, ds, setStats, setName, setSyncReady]);

  // Cache Firebase ID token every 30 min for navigator.sendBeacon authentication
  useEffect(() => {
    if (!authUser || authScreen !== 'app') return undefined;
    const refresh = async () => { try { _idTokenRef.current = await fbGetIdToken(); } catch {} };
    refresh();
    const iv = setInterval(refresh, 30 * 60 * 1000);
    return () => { clearInterval(iv); _idTokenRef.current = ''; };
  }, [authUser, authScreen]);

  // Periodic Firebase push every 2 minutes — ensures progress reaches Firestore
  // even if the user never triggers pagehide/visibilitychange (e.g. browser crash,
  // power loss, or clearing browser data between sessions).
  useEffect(() => {
    if (!authUser || authScreen !== 'app') return undefined;
    const iv = setInterval(() => {
      const { authUser: u, stats: st, name: nm, authScreen: as, favs: fv, jWords: jw, dchlA: da, dchlSl: dsl } = _unloadRef.current;
      if (!u || as !== 'app') return;
      const snap = buildProgressSnapshot({ uid: u.u, name: nm, stats: st, dchlA: da, dchlSl: dsl, favs: fv, jWords: jw });
      fbSaveProgress(u.u, snap).catch(() => {});
    }, 2 * 60 * 1000);
    return () => clearInterval(iv);
  }, [authUser, authScreen]);

  // Synchronous localStorage flush + best-effort Firebase push on tab close / page kill
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
          if (e && e.name === 'QuotaExceededError') {
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
      if (e.persisted && typeof _watcherUnsubRef.current === 'function') { _watcherUnsubRef.current(); _watcherUnsubRef.current = null; }
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { doSyncNow, showBackupBanner, setShowBackupBanner };
}
