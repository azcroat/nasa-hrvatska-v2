/**
 * useAuth — owns all authentication state and the session lifecycle.
 *
 * Pure Firebase Auth via onAuthStateChanged as single source of truth.
 * No local account fallback, no security Q&A, no password hashing.
 *
 * Cross-device sync strategy:
 *  - Returning device (has local cache): shows app immediately with cached stats,
 *    then applies Firebase data via isHydrate when it arrives.
 *  - Fresh device (no local cache): holds at 'loading' until Firebase responds,
 *    so the hero banner never shows stale/empty stats.
 */
import { useState, useEffect, useRef } from 'react';
import {
  gP, sP, lP, gS, sS, cS,
  touchSession, updateStreak, isValidEmail,
  fbLogin, fbRegister, fbLogout, fbLoginGoogle, fbResetPassword,
  fbLoadProgress, fbWatchProgress, fbLoadUserFamily, fbOnAuthStateChanged,
  initFirebase, getLocalFamily, saveLocalFamily, fbSaveProgress,
} from '../data.jsx';

/**
 * @param {object} opts
 * @param {function} opts.onSignedIn   — ({ user, progress, isNew, isHydrate }) => void
 * @param {function} opts.onSignedOut  — () => void
 * @param {function} opts.applyRemoteProgress — (progress) => void
 * @param {function} opts.setFamData   — (fam|null) => void
 * @param {function} opts.setSyncReady — (bool) => void
 */
export function useAuth({ onSignedIn, onSignedOut, applyRemoteProgress, setFamData, setSyncReady, onBeforeSignOut }) {
  // Keep callbacks in a ref so the one-time mount effect never goes stale
  const cb = useRef({ onSignedIn, onSignedOut, applyRemoteProgress, setFamData, setSyncReady, onBeforeSignOut });
  cb.current = { onSignedIn, onSignedOut, applyRemoteProgress, setFamData, setSyncReady, onBeforeSignOut };

  // Holds the Firestore onSnapshot unsubscribe fn — cleaned up on sign-out / unmount
  const watchRef = useRef(null);

  // Set to true just before fbRegister so the auth listener treats the next user as a new account
  const isNewReg = useRef(false);

  // Track authScreen in a ref so the auth listener (mounted once) can read the current value.
  // Used to detect re-login after logout: if authScreen was 'login', _goPostAuth must fire
  // even when earlyRestored=true from a prior session.
  const authScreenRef = useRef('loading');

  // ── Auth flow state ──────────────────────────────────────────────────────
  const [authScreen, _setAuthScreen] = useState('loading');
  // Wrap setAuthScreen so authScreenRef always mirrors the latest value
  function setAuthScreen(s) { authScreenRef.current = s; _setAuthScreen(s); }
  const [authUser, setAuthUser] = useState(null);
  const [authEmail, setAuthEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pc, setPc] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [sp, setSp2] = useState(false);

  // ── Reset-password flow ──────────────────────────────────────────────────
  const [rpEm, setRpEm] = useState('');

  // ── Error / loading ──────────────────────────────────────────────────────
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // ── Firebase auth listener (runs once on mount) ──────────────────────────
  useEffect(() => {
    initFirebase();

    // ── Early restore: show app immediately if we have a cached local session ──
    // This prevents the loading spinner on returning devices.
    // The auth listener will overwrite with Firebase data when it arrives.
    const s = gS();
    let earlyRestored = false;
    if (s && s.u) {
      const cached = gP(s.u);
      if (cached) {
        earlyRestored = true;
        const user = { u: s.u, d: s.d || s.u, e: s.u };
        setAuthUser(user);
        touchSession(); updateStreak();
        const lf = getLocalFamily();
        if (lf) cb.current.setFamData(lf);
        cb.current.onSignedIn({ user, progress: cached });
        setAuthScreen('app');
      }
    }

    // Safety net: if Firebase never calls onAuthStateChanged (blocked SDK, network
    // failure, init error), drop to the login screen after 8 seconds so the user
    // is never stuck on an infinite loading spinner.
    let authFired = false;
    const authFallbackTimer = setTimeout(function() {
      if (!authFired && !earlyRestored) {
        setAuthScreen('login');
      }
    }, 8000);

    const unsub = fbOnAuthStateChanged(function(fbUser) {
      authFired = true;
      clearTimeout(authFallbackTimer);
      if (!fbUser) {
        // Not signed in — clear stale session and go to login
        cS();
        if (watchRef.current) { watchRef.current(); watchRef.current = null; }
        setAuthUser(null);
        setAuthScreen('login');
        return;
      }

      const k = fbUser.email || fbUser.uid;
      const dn = fbUser.displayName || k;
      const user = { u: k, d: dn, e: k };
      const isNew = isNewReg.current;
      isNewReg.current = false;

      // Reset sync gate so hero always shows "Syncing…" while Firebase loads.
      // Without this, _syncReady stays true from a previous session and the hero
      // shows a lesson based on stale/empty stats immediately after re-login.
      cb.current.setSyncReady(false);

      setAuthUser(user);
      sS({ u: k, d: dn });
      touchSession(); updateStreak();

      // ── New registration: no remote progress yet ──
      if (isNew) {
        cb.current.onSignedIn({ user, progress: null, isNew: true });
        cb.current.setSyncReady(true);
        setAuthScreen('app');
        return;
      }

      // ── Returning user: if early restore already showed the app, skip the
      //    non-hydrate onSignedIn call (avoids double navigation via _goPostAuth).
      //    Firebase data arrives via the isHydrate path below.
      // ── Fresh device: early restore did nothing, so wait for Firebase before
      //    showing the app — this prevents the hero from flashing "Basic Greetings".
      const localP = gP(k);

      if (!earlyRestored && localP) {
        // Local data exists but wasn't used for early restore (e.g., key mismatch).
        // Show app now and let Firebase update via isHydrate.
        earlyRestored = true;
        cb.current.onSignedIn({ user, progress: localP });
        setAuthScreen('app');
      }

      fbLoadUserFamily(k).then(function(f) {
        if (f) {
          saveLocalFamily(f);
          cb.current.setFamData(f);
        }
      });

      let syncReadyFired = false;
      function fireSyncReady() {
        if (!syncReadyFired) { syncReadyFired = true; cb.current.setSyncReady(true); }
      }
      // Safety net: mark sync ready even if Firebase is slow.
      // Fresh devices (no local cache) get a longer window so retries in fbLoadProgress
      // have time to complete before the fallback fires with null progress.
      // Returning devices already show cached data so 6s is fine.
      const freshDevice = !earlyRestored && !localP;
      const t = setTimeout(function() {
        const needsNavTimeout = !earlyRestored || authScreenRef.current === 'login' || authScreenRef.current === 'register';
        if (needsNavTimeout) {
          earlyRestored = true;
          cb.current.onSignedIn({ user, progress: localP });
        }
        setAuthScreen('app');
        fireSyncReady();
      }, freshDevice ? 14000 : 6000);

      fbLoadProgress(k).then(function(fp) {
        clearTimeout(t);

        const lp = gP(k);
        // Support both current ("stats") and legacy ("st") key formats.
        // Data saved before a prior rename uses "st"; newer saves use "stats".
        const fpXP = (fp && ((fp.stats && fp.stats.xp) || (fp.st && fp.st.xp))) || 0;
        const lpXP = (lp && ((lp.stats && lp.stats.xp) || (lp.st && lp.st.xp))) || 0;

        if (fp) {
          const fpTs = fp._fbUpdated || fp.savedAt || 0;
          const lpTs = (lp && lp.savedAt) || 0;
          const remoteIsNewer = fpTs > lpTs || (!fpTs && !lpTs && fpXP >= lpXP);

          if (remoteIsNewer) {
            lP(k, fp); // cache locally — lP skips the Firestore write to avoid snapshot loop
            cb.current.onSignedIn({ user, progress: fp, isHydrate: true });
            cb.current.applyRemoteProgress(fp);
          }
        }

        // Recovery push: if Firestore has no XP but local storage does, the user's data
        // was never synced (network failure, blocked writes, or clock-skew skip).
        // Push it now so it's safe regardless of what happens to this device's storage.
        if (fpXP === 0 && lpXP > 0) {
          fbSaveProgress(k, lp).catch(function() {});
        }

        // Call onSignedIn (which triggers _goPostAuth navigation) if:
        //  a) earlyRestored is false — first time showing the app on this load, OR
        //  b) we came from 'login'/'register' screen — re-login after logout needs navigation
        //     even when earlyRestored=true from a prior session in this page load.
        const needsNav = !earlyRestored || authScreenRef.current === 'login' || authScreenRef.current === 'register';
        if (needsNav) {
          earlyRestored = true;
          cb.current.onSignedIn({ user, progress: fp || localP });
        }
        setAuthScreen('app');

        fireSyncReady();

        // ── Family XP backfill ───────────────────────────────────────────────
        // Fires AFTER progress is loaded so gP(k) is guaranteed to have real data.
        // fbLoadUserFamily runs concurrently and is much faster (2 getDoc calls, no
        // retry), so getLocalFamily() will have the family code by this point.
        // This fixes children who show 0 XP because fbSaveProgress previously fired
        // before localStorage had family data (race condition on fresh devices).
        (function() {
          const famData = getLocalFamily();
          const latestProgress = fp || gP(k);
          const _lpSt = latestProgress && (latestProgress.stats || latestProgress.st);
          if (famData && famData.code && _lpSt && _lpSt.xp > 0) {
            fbSaveProgress(k, latestProgress).catch(function() {});
          }
        })();

        // ── Real-time cross-device sync ──────────────────────────────────────
        // Start a Firestore onSnapshot listener. Any time another device saves
        // progress, this fires and immediately applies the update here — no
        // re-login required. We skip the initial event (same data we just loaded)
        // by comparing remote vs local timestamps.
        if (watchRef.current) watchRef.current(); // stop any prior watcher
        watchRef.current = fbWatchProgress(k, function(remoteFp, remoteTs) {
          const lc = gP(k);
          const localTs = (lc && lc._fbUpdated) || 0;
          if (remoteTs > localTs) {
            lP(k, remoteFp);
            cb.current.onSignedIn({ user, progress: remoteFp, isHydrate: true });
            cb.current.applyRemoteProgress(remoteFp);
          }
        });
      }).catch(function() {
        clearTimeout(t);
        // Network error — show app with local data (or empty stats for fresh device)
        const needsNavCatch = !earlyRestored || authScreenRef.current === 'login' || authScreenRef.current === 'register';
        if (needsNavCatch) {
          earlyRestored = true;
          cb.current.onSignedIn({ user, progress: localP });
        }
        setAuthScreen('app');
        fireSyncReady();
        // Start watcher even after a load error — Firestore may recover and
        // the snapshot will deliver the user's data when connectivity returns.
        if (watchRef.current) watchRef.current();
        watchRef.current = fbWatchProgress(k, function(remoteFp, remoteTs) {
          const lc = gP(k);
          const localTs = (lc && lc._fbUpdated) || 0;
          if (remoteTs > localTs) {
            lP(k, remoteFp);
            cb.current.onSignedIn({ user, progress: remoteFp, isHydrate: true });
            cb.current.applyRemoteProgress(remoteFp);
          }
        });
      });
    });

    return function() { clearTimeout(authFallbackTimer); unsub(); if (watchRef.current) { watchRef.current(); watchRef.current = null; } };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Register ─────────────────────────────────────────────────────────────
  async function doReg() {
    setAuthError('');
    if (!authEmail.trim() || !isValidEmail(authEmail.trim())) { setAuthError('Please enter a valid email address.'); return; }
    if (!pw || pw.length < 6) { setAuthError('Password must be at least 6 characters.'); return; }
    if (pw !== pc) { setAuthError('Passwords do not match.'); return; }
    if (!displayName.trim()) { setAuthError('Please enter your display name.'); return; }
    setAuthLoading(true);
    try {
      const k = authEmail.trim().toLowerCase();
      isNewReg.current = true;
      const fb = await fbRegister(k, pw, displayName.trim());
      if (!fb.ok) {
        isNewReg.current = false;
        setAuthError(fb.err || 'Registration failed. Please try again.');
        setAuthLoading(false);
        return;
      }
      // Auth listener fires and handles the rest
      setAuthEmail(''); setPw(''); setPc(''); setDisplayName('');
    } catch (e) {
      isNewReg.current = false;
      setAuthError('Registration failed. Please try again.');
    }
    setAuthLoading(false);
  }

  // ── Login ─────────────────────────────────────────────────────────────────
  async function doLog() {
    setAuthError('');
    if (!authEmail.trim() || !isValidEmail(authEmail.trim())) { setAuthError('Please enter a valid email address.'); return; }
    if (!pw) { setAuthError('Please enter your password.'); return; }
    setAuthLoading(true);
    try {
      const k = authEmail.trim().toLowerCase();
      const result = await fbLogin(k, pw);
      if (result.ok) {
        // Credentials confirmed — switch to loading screen immediately so the
        // user sees progress rather than the login form snapping back idle
        // while the auth listener + fbLoadProgress run in the background.
        setAuthEmail(''); setPw('');
        setAuthScreen('loading');
      } else {
        setAuthError(result.err || 'Sign in failed. Please try again.');
      }
    } catch (e) {
      setAuthError('Sign in failed. Please try again.');
    }
    setAuthLoading(false);
  }

  // ── Reset password ────────────────────────────────────────────────────────
  async function doReset() {
    setAuthError('');
    if (!rpEm.trim() || !isValidEmail(rpEm.trim())) { setAuthError('Please enter your email address.'); return; }
    setAuthLoading(true);
    try {
      await fbResetPassword(rpEm.trim().toLowerCase());
    } catch (e) {
      // Intentionally swallow — always show generic message (prevents email enumeration)
    }
    setRpEm('');
    setAuthScreen('login');
    setTimeout(function() { setAuthError('✅ If an account exists for that email, a reset link has been sent.'); }, 100);
    setAuthLoading(false);
  }

  // ── Google Sign-In ────────────────────────────────────────────────────────
  async function doGoogleLogin() {
    setAuthError('');
    setAuthLoading(true);
    try {
      const result = await fbLoginGoogle();
      if (result.ok) {
        // Auth listener (fbOnAuthStateChanged) handles the rest — same path as doLog
        setAuthScreen('loading');
      } else if (result.err) {
        setAuthError(result.err);
      }
    } catch (e) {
      setAuthError('Google sign-in failed. Please try again.');
    }
    setAuthLoading(false);
  }

  // ── Sign out ──────────────────────────────────────────────────────────────
  async function doOut() {
    // Flush latest progress to Firestore BEFORE revoking the auth token.
    // This guarantees the user's final state is saved even if the periodic save
    // hadn't fired yet. Auth token is still valid at this point so the write succeeds.
    if (cb.current.onBeforeSignOut) {
      try { await cb.current.onBeforeSignOut(); } catch {}
    }
    if (watchRef.current) { watchRef.current(); watchRef.current = null; }
    fbLogout(); cS(); setAuthUser(null); setAuthScreen('login');
    cb.current.onSignedOut();
  }

  return {
    authScreen, setAuthScreen,
    authUser,
    authEmail, setAuthEmail,
    pw, setPw, pc, setPc,
    displayName, setDisplayName,
    sp, setSp2,
    rpEm, setRpEm,
    authError, setAuthError,
    authLoading,
    doReg, doLog, doOut, doReset, doGoogleLogin,
  };
}
