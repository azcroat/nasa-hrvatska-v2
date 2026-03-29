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
} from '../data.jsx';
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
      const lp = gP(authUser.u);
      const lpTs = (lp && (lp._fbUpdated || lp.savedAt)) || 0;
      if (fpTs > lpTs) {
        lP(authUser.u, { ...fp, savedAt: fpTs });
        const pSt = fp.stats || fp.st || {};
        setStats(prev => mergeStatsFromRemote(prev, pSt, ds));
        if (fp.name) setName(fp.name);
        applyRemoteProgress(fp);
      }
      if (setSyncReady) setSyncReady(true);
    });
    _watcherUnsubRef.current = unsub;

    // iOS Safari: force getDoc on visibility restore (gRPC-Web can silently fail)
    const iosWakeUp = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const fp = await fbLoadProgress(authUser.u);
        if (!fp) return;
        const lp = gP(authUser.u);
        const fpTs = fp._fbUpdated || 0;
        const lpTs = (lp && (lp._fbUpdated || lp.savedAt)) || 0;
        if (fpTs > lpTs) {
          lP(authUser.u, { ...fp, savedAt: fpTs });
          const pSt = fp.stats || fp.st || {};
          setStats(prev => mergeStatsFromRemote(prev, pSt, ds));
          if (fp.name) setName(fp.name);
          applyRemoteProgress(fp);
        }
      } catch (_) {}
    };
    const onPageShow = (e) => { if (e.persisted) iosWakeUp(); };
    document.addEventListener('visibilitychange', iosWakeUp);
    window.addEventListener('pageshow', onPageShow);
    return () => {
      unsub();
      _watcherUnsubRef.current = null;
      document.removeEventListener('visibilitychange', iosWakeUp);
      window.removeEventListener('pageshow', onPageShow);
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
