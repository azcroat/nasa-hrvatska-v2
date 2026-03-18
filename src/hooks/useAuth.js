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
  gP, sP, gS, sS, cS,
  touchSession, updateStreak, isValidEmail,
  fbLogin, fbRegister, fbLogout, fbResetPassword,
  fbLoadProgress, fbLoadUserFamily, fbOnAuthStateChanged,
  initFirebase, getLocalFamily,
} from '../data.jsx';

/**
 * @param {object} opts
 * @param {function} opts.onSignedIn   — ({ user, progress, isNew, isHydrate }) => void
 * @param {function} opts.onSignedOut  — () => void
 * @param {function} opts.applyRemoteProgress — (progress) => void
 * @param {function} opts.setFamData   — (fam|null) => void
 * @param {function} opts.setSyncReady — (bool) => void
 */
export function useAuth({ onSignedIn, onSignedOut, applyRemoteProgress, setFamData, setSyncReady }) {
  // Keep callbacks in a ref so the one-time mount effect never goes stale
  const cb = useRef({ onSignedIn, onSignedOut, applyRemoteProgress, setFamData, setSyncReady });
  cb.current = { onSignedIn, onSignedOut, applyRemoteProgress, setFamData, setSyncReady };

  // Set to true just before fbRegister so the auth listener treats the next user as a new account
  const isNewReg = useRef(false);

  // ── Auth flow state ──────────────────────────────────────────────────────
  const [authScreen, setAuthScreen] = useState('loading');
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

    const unsub = fbOnAuthStateChanged(function(fbUser) {
      if (!fbUser) {
        // Not signed in — clear stale session and go to login
        cS();
        setAuthUser(null);
        setAuthScreen('login');
        return;
      }

      const k = fbUser.email || fbUser.uid;
      const dn = fbUser.displayName || k;
      const user = { u: k, d: dn, e: k };
      const isNew = isNewReg.current;
      isNewReg.current = false;

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

      fbLoadUserFamily(k).then(function(f) { if (f) cb.current.setFamData(f); });

      let syncReadyFired = false;
      function fireSyncReady() {
        if (!syncReadyFired) { syncReadyFired = true; cb.current.setSyncReady(true); }
      }
      // Safety net: mark sync ready after 6s even if Firebase is slow
      const t = setTimeout(function() {
        if (!earlyRestored) {
          // Fresh device, Firebase is very slow — show app with whatever we have
          earlyRestored = true;
          cb.current.onSignedIn({ user, progress: localP });
          setAuthScreen('app');
        }
        fireSyncReady();
      }, 6000);

      fbLoadProgress(k).then(function(fp) {
        clearTimeout(t);

        if (fp) {
          const lp = gP(k);
          const fpTs = fp._fbUpdated || fp.savedAt || 0;
          const lpTs = (lp && lp.savedAt) || 0;
          const fpXP = (fp.stats && fp.stats.xp) || 0;
          const lpXP = (lp && lp.stats && lp.stats.xp) || 0;
          const remoteIsNewer = fpTs > lpTs || (!fpTs && !lpTs && fpXP >= lpXP);

          if (remoteIsNewer) {
            sP(k, fp);
            cb.current.onSignedIn({ user, progress: fp, isHydrate: true });
            cb.current.applyRemoteProgress(fp);
          }
        }

        // Fresh device: now we have Firebase data (or confirmed none) — show app
        if (!earlyRestored) {
          earlyRestored = true;
          cb.current.onSignedIn({ user, progress: fp || localP });
          setAuthScreen('app');
        }

        fireSyncReady();
      }).catch(function() {
        clearTimeout(t);
        // Network error — show app with local data (or empty stats for fresh device)
        if (!earlyRestored) {
          earlyRestored = true;
          cb.current.onSignedIn({ user, progress: localP });
          setAuthScreen('app');
        }
        fireSyncReady();
      });
    });

    return unsub;
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
        // Auth listener fires and handles session + progress loading
        setAuthEmail(''); setPw('');
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

  // ── Sign out ──────────────────────────────────────────────────────────────
  function doOut() {
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
    doReg, doLog, doOut, doReset,
  };
}
