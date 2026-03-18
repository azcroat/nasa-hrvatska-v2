/**
 * useAuth — owns all authentication state and the session lifecycle.
 *
 * Pure Firebase Auth via onAuthStateChanged as single source of truth.
 * No local account fallback, no security Q&A, no password hashing.
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
 * @param {object}   opts.ds           — default stats shape
 */
export function useAuth({ onSignedIn, onSignedOut, applyRemoteProgress, setFamData, setSyncReady, ds }) {
  // Keep callbacks in a ref so the one-time mount effect never goes stale
  const cb = useRef({ onSignedIn, onSignedOut, applyRemoteProgress, setFamData, setSyncReady });
  cb.current = { onSignedIn, onSignedOut, applyRemoteProgress, setFamData, setSyncReady };

  // Ref set to true just before fbRegister so the auth listener knows it's a new account
  const isNewReg = useRef(false);

  // ── Auth flow state ──────────────────────────────────────────────────────
  const [authScreen, setAuthScreen] = useState('loading');
  const [authUser, setAuthUser] = useState(null);
  const [authEmail, setAuthEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pc, setPc] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [sp, setSp2] = useState(false);   // show-password toggle

  // ── Reset-password flow ──────────────────────────────────────────────────
  const [rpEm, setRpEm] = useState('');

  // ── Error / loading ──────────────────────────────────────────────────────
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // ── Firebase auth listener (runs once on mount) ──────────────────────────
  useEffect(() => {
    initFirebase();

    // Restore any cached local data while Firebase confirms auth
    const s = gS();
    if (s && s.u) {
      const cached = gP(s.u);
      if (cached) {
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
        // Not signed in — clear any stale session
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

      if (isNew) {
        // Brand new account — no remote progress exists yet
        cb.current.onSignedIn({ user, progress: null, isNew: true });
        cb.current.setSyncReady(true);
        setAuthScreen('app');
        return;
      }

      // Returning user — load remote progress, merge with local
      const localP = gP(k);
      if (localP && authScreen !== 'app') {
        cb.current.onSignedIn({ user, progress: localP });
        setAuthScreen('app');
      }

      fbLoadUserFamily(k).then(function(f) { if (f) cb.current.setFamData(f); });

      let syncReadyFired = false;
      function fireSyncReady() { if (!syncReadyFired) { syncReadyFired = true; cb.current.setSyncReady(true); } }
      const t = setTimeout(fireSyncReady, 5000);

      fbLoadProgress(k).then(function(fp) {
        clearTimeout(t);
        if (fp) {
          const lp = gP(k);
          const fpTs = fp._fbUpdated || fp.savedAt || 0;
          const lpTs = (lp && lp.savedAt) || 0;
          const fpXP = (fp.stats && fp.stats.xp) || 0;
          const lpXP = (lp && lp.stats && lp.stats.xp) || 0;
          if (fpTs > lpTs || (!fpTs && !lpTs && fpXP >= lpXP)) {
            sP(k, fp);
            cb.current.onSignedIn({ user, progress: fp, isHydrate: true });
            cb.current.applyRemoteProgress(fp);
          }
        }
        if (authScreen !== 'app') {
          cb.current.onSignedIn({ user, progress: fp || localP });
          setAuthScreen('app');
        }
        fireSyncReady();
      }).catch(function() {
        if (authScreen !== 'app') {
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
      // Auth listener will fire and handle the rest
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
        // Auth listener will fire and handle session + progress loading
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
      // Always send the reset email and show generic success (prevents email enumeration)
      await fbResetPassword(rpEm.trim().toLowerCase());
      setRpEm('');
      setAuthScreen('login');
      setTimeout(function() { setAuthError('✅ If an account exists for that email, a reset link has been sent.'); }, 100);
    } catch (e) {
      setAuthScreen('login');
      setTimeout(function() { setAuthError('✅ If an account exists for that email, a reset link has been sent.'); }, 100);
    }
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
