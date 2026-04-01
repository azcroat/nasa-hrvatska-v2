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
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  gP, sP, lP, gS, sS, cS,
  touchSession, isValidEmail,
  fbLogin, fbRegister, fbLogout, fbLoginGoogle, fbResetPassword,
  fbLoadProgress, fbLoadUserFamily, fbOnAuthStateChanged,
  initFirebase, getLocalFamily, saveLocalFamily, fbSaveProgress,
} from '../lib/firebase.js';
import { updateStreak } from '../lib/appUtils.js';

/**
 * @param {object} opts
 * @param {function} opts.onSignedIn   — ({ user, progress, isNew, isHydrate }) => void
 * @param {function} opts.onSignedOut  — () => void
 * @param {function} opts.applyRemoteProgress — (progress) => void
 * @param {function} opts.setFamData   — (fam|null) => void
 * @param {function} opts.setSyncReady — (bool) => void
 * @param {function} [opts.onBeforeSignOut] - async () => void, called before sign-out to flush pending sync
 */
export function useAuth({ onSignedIn, onSignedOut, applyRemoteProgress, setFamData, setSyncReady, onBeforeSignOut }) {
  // Keep callbacks in a ref so the one-time mount effect never goes stale
  const cb = useRef({ onSignedIn, onSignedOut, applyRemoteProgress, setFamData, setSyncReady, onBeforeSignOut });
  cb.current = { onSignedIn, onSignedOut, applyRemoteProgress, setFamData, setSyncReady, onBeforeSignOut };

  // Holds the Firestore onSnapshot unsubscribe fn — cleaned up on sign-out / unmount
  const watchRef = useRef(null);

  // Set to true just before fbRegister so the auth listener treats the next user as a new account
  const isNewReg = useRef(false);

  // Guest mode — skip Firebase redirect while user is browsing without an account
  const guestRef = useRef(false);

  // Track authScreen in a ref so the auth listener (mounted once) can read the current value.
  // Used to detect re-login after logout: if authScreen was 'login', _goPostAuth must fire
  // even when earlyRestored=true from a prior session.
  const authScreenRef = useRef('loading');

  // ── Auth flow state ──────────────────────────────────────────────────────
  const [authScreen, _setAuthScreen] = useState('loading');
  // Wrap setAuthScreen so authScreenRef always mirrors the latest value
  function setAuthScreen(s) { authScreenRef.current = s; _setAuthScreen(s); }
  const [authUser, setAuthUser] = useState(/** @type {import('../types/index.js').AuthUser | null} */(null));
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

  // ── Email verification ───────────────────────────────────────────────────
  const [emailUnverified, setEmailUnverified] = useState(false);

  // ── Firebase auth listener (runs once on mount) ──────────────────────────
  useEffect(() => {
    initFirebase();

    // ── Early restore: show app immediately if we have a cached local session ──
    // This prevents the loading spinner on returning devices.
    // The auth listener will overwrite with Firebase data when it arrives.
    const s = gS();
    let earlyRestored = false;
    // Captures the localStorage savedAt BEFORE React autosave effects can bump it to
    // Date.now(). The autosave effect fires after the first render (when authScreen
    // becomes "app"), which happens before fbOnAuthStateChanged resolves its async
    // fbLoadProgress call. Without this capture, lpTs = Date.now() and Firebase data
    // from our last patch (fpTs = older timestamp) is incorrectly rejected.
    let origLocalSavedAt = 0;
    let origLocalFbUpdated = 0;
    if (s && s.u) {
      const cached = gP(s.u);
      if (cached) {
        origLocalSavedAt = cached.savedAt || 0;
        origLocalFbUpdated = cached._fbUpdated || 0;
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
        // Guest mode — user is browsing without auth, don't redirect to login
        if (guestRef.current) { setAuthScreen('app'); return; }
        // Not signed in — clear stale session and go to login
        cS();
        if (watchRef.current) { watchRef.current(); watchRef.current = null; }
        setAuthUser(null);
        setAuthScreen('login');
        return;
      }
      // Real sign-in — exit guest mode
      guestRef.current = false;

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

      // ── New registration: preserve any offline progress earned before sign-up ──
      if (isNew) {
        // A user may complete lessons offline before creating an account.
        // Pass local progress (if any) so that work is not discarded.
        const offlineProgress = gP(k);
        cb.current.onSignedIn({ user, progress: offlineProgress, isNew: true });
        cb.current.setSyncReady(true);
        setAuthScreen('app');
        // Immediately push offline progress to Firebase so other devices get it
        if (offlineProgress) {
          fbSaveProgress(k, offlineProgress).catch(function() {});
        }
        // Show email verification banner for email/password registrations (Google is pre-verified)
        if (fbUser && !fbUser.emailVerified && fbUser.providerData && fbUser.providerData[0] && fbUser.providerData[0].providerId !== 'google.com') {
          setEmailUnverified(true);
        }
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
        origLocalSavedAt = localP.savedAt || 0;
        origLocalFbUpdated = localP._fbUpdated || 0;
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
        const needsNavTimeout = !earlyRestored || authScreenRef.current === 'login' || authScreenRef.current === 'register' || authScreenRef.current === 'loading';
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
          // Always merge Firebase + local additively — Math.max for counts, union for arrays.
          // No timestamp gate: the old `remoteIsNewer` check (fpTs > lpTs) was unreliable
          // because local savedAt gets bumped by autosave every 30s, making local appear
          // "newer" than Firebase even when Firebase has data from a different device.
          origLocalSavedAt = 0;
          origLocalFbUpdated = 0;
          const fpSt = (fp.stats || fp.st || {});
          const lpSt = (lp && (lp.stats || lp.st)) || {};
          const mergedStats = {
            ...fpSt,
            xp:  Math.max(lpSt.xp  || 0, fpSt.xp  || 0),
            lc:  Math.max(lpSt.lc  || 0, fpSt.lc  || 0),
            gc:  Math.max(lpSt.gc  || 0, fpSt.gc  || 0),
            sp:  Math.max(lpSt.sp  || 0, fpSt.sp  || 0),
            de:  Math.max(lpSt.de  || 0, fpSt.de  || 0),
            rc:  Math.max(lpSt.rc  || 0, fpSt.rc  || 0),
            str: Math.max(lpSt.str || 0, fpSt.str || 0),
            pf:  Math.max(lpSt.pf  || 0, fpSt.pf  || 0),
            mv:  Math.max(lpSt.mv  || 0, fpSt.mv  || 0),
            hi:  Math.max(lpSt.hi  || 0, fpSt.hi  || 0),
            ct:  [...new Set([...(lpSt.ct  || []), ...(fpSt.ct  || [])])],
            vs:  [...new Set([...(lpSt.vs  || []), ...(fpSt.vs  || [])])],
            badges: [...new Set([...(lpSt.badges || []), ...(fpSt.badges || [])])],
            diff: (function() {
              var DO = { beginner: 0, intermediate: 1, advanced: 2 };
              var lo = DO[lpSt.diff] !== undefined ? DO[lpSt.diff] : -1;
              var fo = DO[fpSt.diff] !== undefined ? DO[fpSt.diff] : -1;
              return lo >= fo ? (lpSt.diff || fpSt.diff) : (fpSt.diff || lpSt.diff);
            })(),
          };
          lP(k, { ...fp, stats: mergedStats }); // cache locally with merged stats
          cb.current.onSignedIn({ user, progress: { ...fp, stats: mergedStats }, isHydrate: true });
          // Always apply remote progress (streak, SRS, favs, journal) — additive merge,
          // safe to call regardless of which device is "newer".
          cb.current.applyRemoteProgress(fp);
        } else {
          origLocalSavedAt = 0;
          origLocalFbUpdated = 0;
        }

        // Recovery push: local has more XP than Firestore (e.g. offline session, failed write).
        // Push the local snapshot so other devices get this device's progress.
        if (lpXP > fpXP) {
          fbSaveProgress(k, lp).catch(function() {});
        }

        // Call onSignedIn (which triggers _goPostAuth navigation) if:
        //  a) earlyRestored is false — first time showing the app on this load, OR
        //  b) we came from 'login'/'register' screen — re-login after logout needs navigation
        //     even when earlyRestored=true from a prior session in this page load.
        const needsNav = !earlyRestored || authScreenRef.current === 'login' || authScreenRef.current === 'register' || authScreenRef.current === 'loading';
        if (needsNav) {
          earlyRestored = true;
          // Always merge local + remote so local progress is never discarded when
          // Firebase has equal or older data (e.g. autosave to Firebase failed during
          // the session, or the sign-out flush didn't complete before the read).
          // Without this, fp || localP picks stale Firebase over fresh local data.
          var navProgress = fp || localP;
          if (fp && localP) {
            var _fpSt = fp.stats || fp.st || {};
            var _lpSt = localP.stats || localP.st || {};
            var _safeMerged = {
              xp:  Math.max(_lpSt.xp  || 0, _fpSt.xp  || 0),
              lc:  Math.max(_lpSt.lc  || 0, _fpSt.lc  || 0),
              gc:  Math.max(_lpSt.gc  || 0, _fpSt.gc  || 0),
              sp:  Math.max(_lpSt.sp  || 0, _fpSt.sp  || 0),
              de:  Math.max(_lpSt.de  || 0, _fpSt.de  || 0),
              rc:  Math.max(_lpSt.rc  || 0, _fpSt.rc  || 0),
              str: Math.max(_lpSt.str || 0, _fpSt.str || 0),
              pf:  Math.max(_lpSt.pf  || 0, _fpSt.pf  || 0),
              mv:  Math.max(_lpSt.mv  || 0, _fpSt.mv  || 0),
              hi:  Math.max(_lpSt.hi  || 0, _fpSt.hi  || 0),
              ct:  [...new Set([...(_lpSt.ct  || []), ...(_fpSt.ct  || [])])],
              vs:  [...new Set([...(_lpSt.vs  || []), ...(_fpSt.vs  || [])])],
              badges: [...new Set([...(_lpSt.badges || []), ...(_fpSt.badges || [])])],
              diff: (function() {
                var DO = { beginner: 0, intermediate: 1, advanced: 2 };
                var lo = DO[_lpSt.diff] !== undefined ? DO[_lpSt.diff] : -1;
                var fo = DO[_fpSt.diff] !== undefined ? DO[_fpSt.diff] : -1;
                return lo >= fo ? (_lpSt.diff || _fpSt.diff) : (_fpSt.diff || _lpSt.diff);
              })(),
            };
            navProgress = Object.assign({}, fp, { stats: Object.assign({}, _fpSt, _safeMerged) });
          }
          cb.current.onSignedIn({ user, progress: navProgress });
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

        // Real-time cross-device sync is owned entirely by the App.jsx
        // fbWatchProgress useEffect. Starting a second listener here caused
        // double-application of every snapshot (two setStats + two applyRemoteProgress
        // calls per update) and a race where the two lP() writes interfered with
        // each other. watchRef is still cleaned up on sign-out below.
      }).catch(function() {
        clearTimeout(t);
        // Network error — show app with local data (or empty stats for fresh device)
        const needsNavCatch = !earlyRestored || authScreenRef.current === 'login' || authScreenRef.current === 'register' || authScreenRef.current === 'loading';
        if (needsNavCatch) {
          earlyRestored = true;
          cb.current.onSignedIn({ user, progress: localP });
        }
        setAuthScreen('app');
        fireSyncReady();
        // App.jsx watcher will reconnect once authScreen becomes 'app'.
      });
    });

    return function() { clearTimeout(authFallbackTimer); unsub(); if (watchRef.current) { watchRef.current(); watchRef.current = null; } };
  }, []);

  // ── Register ─────────────────────────────────────────────────────────────
  async function doReg() {
    setAuthError('');
    if (!authEmail.trim() || !isValidEmail(authEmail.trim())) { setAuthError('Please enter a valid email address.'); return; }
    if (!pw || pw.length < 6) { setAuthError('Password must be at least 6 characters.'); return; }
    if (pw !== pc) { setAuthError('Passwords do not match.'); return; }
    if (!displayName.trim()) { setAuthError('Please enter your display name.'); return; }
    setAuthLoading(true);
    // Rate limit: max 3 registration attempts per 10 minutes
    const regKey = 'reg_attempts';
    const regData = JSON.parse(localStorage.getItem(regKey) || '{"count":0,"since":0}');
    const now = Date.now();
    if (now - regData.since < 600000) {
      if (regData.count >= 3) {
        setAuthError('Too many registration attempts. Please wait 10 minutes.');
        setAuthLoading(false);
        return;
      }
      localStorage.setItem(regKey, JSON.stringify({ count: regData.count + 1, since: regData.since }));
    } else {
      localStorage.setItem(regKey, JSON.stringify({ count: 1, since: now }));
    }
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
    // Rate limit: max 5 login attempts per 10 minutes
    const loginKey = 'login_attempts';
    const loginData = JSON.parse(localStorage.getItem(loginKey) || '{"count":0,"since":0}');
    const now = Date.now();
    if (now - loginData.since < 600000) {
      if (loginData.count >= 5) {
        setAuthError('Too many sign-in attempts. Please wait 10 minutes.');
        setAuthLoading(false);
        return;
      }
      localStorage.setItem(loginKey, JSON.stringify({ count: loginData.count + 1, since: loginData.since }));
    } else {
      localStorage.setItem(loginKey, JSON.stringify({ count: 1, since: now }));
    }
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

  // ── Resend verification email ─────────────────────────────────────────────
  async function resendVerification() {
    try {
      const { getAuth } = await import('firebase/auth');
      const { sendEmailVerification } = await import('firebase/auth');
      const auth = getAuth();
      if (auth.currentUser) await sendEmailVerification(auth.currentUser);
    } catch(e) {}
  }

  // ── Sign out ──────────────────────────────────────────────────────────────
  async function doOut() {
    // Flush latest progress to Firestore BEFORE revoking the auth token.
    // This guarantees the user's final state is saved even if the periodic save
    // hadn't fired yet. Auth token is still valid at this point so the write succeeds.
    if (cb.current.onBeforeSignOut) {
      try {
        // Cap the pre-signout sync at 3 seconds so a slow/hanging Firebase write
        // (network error, quota exhaustion) never blocks the user from signing out.
        await Promise.race([
          cb.current.onBeforeSignOut(),
          new Promise(resolve => setTimeout(resolve, 3000)),
        ]);
      } catch {}
    }
    guestRef.current = false;
    if (watchRef.current) { watchRef.current(); watchRef.current = null; }
    fbLogout(); cS(); setAuthUser(null); setAuthScreen('login');
    cb.current.onSignedOut();
  }

  // ── Guest mode ────────────────────────────────────────────────────────────
  function doGuest() {
    guestRef.current = true;
    touchSession();
    updateStreak();
    setAuthScreen('app');
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
    emailUnverified, setEmailUnverified,
    resendVerification,
    doReg, doLog, doOut, doReset, doGoogleLogin, doGuest,
  };
}
