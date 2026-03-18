/**
 * useAuth — owns all authentication state and the session lifecycle.
 *
 * Extracted from App.jsx. Includes session restore on mount, Firebase
 * auth-state listener, and all sign-in / register / reset / sign-out
 * handlers. App.jsx receives callbacks for app-level side-effects
 * (navigation, stats hydration, family loading).
 *
 * Pattern: callbacks are stored in a ref so the one-time mount effect
 * always uses the latest implementations without listing them as deps.
 */
import { useState, useEffect, useRef } from 'react';
import {
  _fbReady, hp, gA, sA, gP, sP, gS, sS, cS,
  touchSession, updateStreak, isSessionExpired, isValidEmail,
  fbLogin, fbRegister, fbLogout, fbResetPassword,
  fbSetUserSecurity, fbGetUserSecurity, fbCreateAccount,
  fbLoadProgress, fbLoadUserFamily, fbOnAuthStateChanged,
  initFirebase, saveSR, getLocalFamily,
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

  // ── Auth flow state ──────────────────────────────────────────────────────
  const [authScreen, setAuthScreen] = useState('loading');
  const [authUser, setAuthUser] = useState(null);
  const [authEmail, setAuthEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pc, setPc] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [sq, setSq] = useState('');       // security question
  const [sa, setSa] = useState('');       // security answer
  const [sp, setSp2] = useState(false);   // show-password toggle

  // ── Reset-password multi-step flow ───────────────────────────────────────
  const [rpEm, setRpEm] = useState('');
  const [rpSa, setRpSa] = useState('');
  const [rpPw, setRpPw] = useState('');
  const [rpPc, setRpPc] = useState('');
  const [rpStep, setRpStep] = useState(1);
  const [rpQ, setRpQ] = useState('');
  const [_rpSaHash, _setRpSaHash] = useState('');
  const [_rpStoredEmail, _setRpStoredEmail] = useState('');

  // ── Error / loading ──────────────────────────────────────────────────────
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // ── Session restore (runs once on mount) ─────────────────────────────────
  useEffect(() => {
    initFirebase();
    const s = gS();
    if (s && s.u) {
      if (isSessionExpired()) {
        cS(); setAuthScreen('login');
        setTimeout(() => setAuthError('✅ Your session expired. Your account is safe — just sign in again.'), 200);
        return;
      }
      const a = gA();
      if (a[s.u]) {
        const p = gP(s.u);
        const user = { u: s.u, d: a[s.u].d, e: a[s.u].e || s.u };
        setAuthUser(user);
        touchSession(); updateStreak();
        const lf = getLocalFamily(); if (lf) cb.current.setFamData(lf);
        cb.current.onSignedIn({ user, progress: p });
        setAuthScreen('app');
        let _syncReadyFired = false;
        function _fireSyncReady() { if (!_syncReadyFired) { _syncReadyFired = true; cb.current.setSyncReady(true); } }
        const t = setTimeout(_fireSyncReady, 5000);
        fbLoadProgress(s.u).then(fp => {
          clearTimeout(t);
          if (fp) {
            const lp = gP(s.u);
            const fpTs = fp._fbUpdated || fp.savedAt || 0;
            const lpTs = (lp && lp.savedAt) || 0;
            const fpXP = (fp.stats && fp.stats.xp) || 0;
            const lpXP = (lp && lp.stats && lp.stats.xp) || 0;
            if (fpTs > lpTs || (!fpTs && !lpTs && fpXP >= lpXP)) {
              sP(s.u, fp);
              cb.current.onSignedIn({ user, progress: fp, isHydrate: true });
              cb.current.applyRemoteProgress(fp);
            }
          }
          _fireSyncReady();
        }).catch(() => _fireSyncReady());
      } else {
        if (_fbReady) {
          fbOnAuthStateChanged(fbUser => {
            if (fbUser) {
              const dn = fbUser.displayName || fbUser.email;
              const k = fbUser.email;
              const aMap = gA(); const ex = aMap[k] || {}; ex.d = dn; ex.e = k; aMap[k] = ex; sA(aMap);
              fbLoadProgress(k).then(fp => {
                if (fp) sP(k, fp);
                const user = { u: k, d: dn, e: k };
                setAuthUser(user); sS({ u: k }); touchSession(); updateStreak();
                fbLoadUserFamily(k).then(f => { if (f) cb.current.setFamData(f); });
                const p = fp || gP(k);
                cb.current.onSignedIn({ user, progress: p });
                if (p) cb.current.applyRemoteProgress(p);
                cb.current.setSyncReady(true); setAuthScreen('app');
              });
            } else {
              const _s = gS(); const _a = gA();
              if (_s && _s.u && _a[_s.u]) setAuthScreen('login');
              else { cS(); setAuthScreen('login'); }
            }
          });
        } else { setAuthScreen('login'); }
      }
    } else { setAuthScreen('login'); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Register ─────────────────────────────────────────────────────────────
  async function doReg() {
    setAuthError('');
    if (!authEmail.trim() || !isValidEmail(authEmail.trim())) { setAuthError('Please enter a valid email address.'); return; }
    if (!pw || pw.length < 6) { setAuthError('Password must be at least 6 characters.'); return; }
    if (pw !== pc) { setAuthError('Passwords do not match.'); return; }
    if (!displayName.trim()) { setAuthError('Please enter your display name.'); return; }
    if (!sq.trim()) { setAuthError('Please select a security question.'); return; }
    if (!sa.trim() || sa.trim().length < 2) { setAuthError('Please enter a security answer (2+ characters).'); return; }
    setAuthLoading(true);
    try {
      initFirebase();
      const k = authEmail.trim().toLowerCase();
      const existing = gA();
      if (existing[k]) { setAuthError('An account with this email already exists. Please sign in instead.'); setAuthLoading(false); return; }
      if (_fbReady) {
        const fb = await fbRegister(k, pw, displayName.trim());
        if (!fb.ok && fb.err.indexOf('already') >= 0) { setAuthError('An account with this email already exists. Please sign in instead.'); setAuthLoading(false); return; }
        if (!fb.ok && (fb.err.indexOf('least 6') >= 0 || fb.err.indexOf('weak') >= 0)) { setAuthError('Password is too weak. Use at least 6 characters.'); setAuthLoading(false); return; }
        if (!fb.ok && fb.err.indexOf('valid email') >= 0) { setAuthError('Please enter a valid email address.'); setAuthLoading(false); return; }
        if (fb.ok) { try { await fbSetUserSecurity(k, sq.trim(), await hp(sa.trim().toLowerCase())); } catch (e) {} }
      }
      const a = gA(); const h = await hp(pw); const sah = await hp(sa.trim().toLowerCase());
      a[k] = { p: h, d: displayName.trim(), e: k, sq: sq.trim(), sa: sah, created: Date.now() };
      sA(a);
      const user = { u: k, d: displayName.trim(), e: k };
      setAuthUser(user); sS({ u: k });
      setAuthEmail(''); setPw(''); setPc(''); setDisplayName(''); setSq(''); setSa('');
      cb.current.onSignedIn({ user, progress: null, isNew: true });
      setAuthScreen('app');
      cb.current.setSyncReady(true);
    } catch (e) { setAuthError('Registration failed. Please try again.'); }
    setAuthLoading(false);
  }

  // ── Login ─────────────────────────────────────────────────────────────────
  async function doLog() {
    setAuthError('');
    if (!authEmail.trim() || !isValidEmail(authEmail.trim())) { setAuthError('Please enter a valid email address.'); return; }
    if (!pw) { setAuthError('Please enter your password.'); return; }
    setAuthLoading(true);
    try {
      initFirebase();
      const k = authEmail.trim().toLowerCase();
      let fbResult = null;
      if (_fbReady) { try { fbResult = await fbLogin(k, pw); } catch (e) { fbResult = null; } }

      // Firebase success path
      if (fbResult && fbResult.ok) {
        const fbProgress = await fbLoadProgress(k);
        const fdn = fbResult.user.displayName || k;
        const fa = gA(); const fex = fa[k] || {}; fex.d = fdn; fex.e = k;
        try { fex.p = await hp(pw); } catch (e) {}
        fa[k] = fex; sA(fa); if (fbProgress) sP(k, fbProgress);
        const user = { u: k, d: fdn, e: k };
        setAuthUser(user); sS({ u: k }); touchSession(); updateStreak();
        const progress = fbProgress || gP(k);
        cb.current.onSignedIn({ user, progress });
        cb.current.applyRemoteProgress(progress);
        setAuthEmail(''); setPw('');
        fbLoadUserFamily(k).then(f => { if (f) cb.current.setFamData(f); });
        setAuthScreen('app');
        cb.current.setSyncReady(true);
        setAuthLoading(false); return;
      }

      // Rate limit hard-stop
      if (fbResult && fbResult.err && fbResult.err.indexOf('Too many attempts') >= 0) {
        setAuthError(fbResult.err); setAuthLoading(false); return;
      }

      // Local account fallback
      const la = gA();
      if (!la[k]) { setAuthError('No account found with this email. Please check your email or create a new account.'); setAuthLoading(false); return; }
      if (la[k].p) {
        const lh = await hp(pw);
        if (la[k].p === lh) {
          const user = { u: k, d: la[k].d, e: k };
          setAuthUser(user); sS({ u: k }); touchSession(); updateStreak();
          const lp = gP(k);
          cb.current.onSignedIn({ user, progress: lp });
          setAuthEmail(''); setPw('');
          setAuthScreen('app');
          // Background Firebase sync after offline login — load remote first,
          // then mark sync ready so subsequent saves go to Firebase
          fbLoadProgress(k).then(fp => {
            if (fp) {
              const stored = gP(k);
              const fpTs = fp._fbUpdated || fp.savedAt || 0;
              const lpTs = (stored && stored.savedAt) || 0;
              const fpXP = (fp.stats && fp.stats.xp) || 0;
              const lpXP = (stored && stored.stats && stored.stats.xp) || 0;
              if (fp.sr) saveSR(fp.sr);
              if (fpTs > lpTs || (!fpTs && !lpTs && fpXP > lpXP)) {
                sP(k, fp);
                cb.current.onSignedIn({ user, progress: fp, isHydrate: true });
                cb.current.applyRemoteProgress(fp);
              }
            }
            cb.current.setSyncReady(true);
          }).catch(() => {
            // Network error — keep local progress, still mark ready so saves go to Firebase when possible
            cb.current.setSyncReady(true);
          });
          setAuthLoading(false); return;
        }
        setAuthError('Incorrect password. Try again or use Forgot Password.'); setAuthLoading(false); return;
      }
      setAuthError("Please use 'Forgot Password' to restore access to your account.");
    } catch (e) { setAuthError('Login failed. Please try again.'); }
    setAuthLoading(false);
  }

  // ── Reset password ────────────────────────────────────────────────────────
  async function doReset() {
    setAuthError(''); initFirebase();
    if (rpStep === 1) {
      if (!rpEm.trim() || !isValidEmail(rpEm.trim())) { setAuthError('Please enter your email address.'); return; }
      const k = rpEm.trim().toLowerCase(); let sqFound = ''; let saFound = '';
      const a = gA(); if (a[k] && a[k].sq) { sqFound = a[k].sq; saFound = a[k].sa; }
      if (!sqFound && _fbReady) {
        try {
          const sec = await fbGetUserSecurity(k);
          if (sec && sec.sq) { sqFound = sec.sq; saFound = sec.sa; }
          else if (sec && !sec.sq) {
            const fb = await fbResetPassword(k);
            if (fb.ok) { setAuthScreen('login'); setTimeout(() => setAuthError('✅ Password reset email sent! Check your inbox.'), 100); return; }
            else { setAuthError(fb.err); return; }
          }
        } catch (e) {}
      }
      if (!sqFound) {
        if (_fbReady) {
          const fb2 = await fbResetPassword(k);
          if (fb2.ok) { setAuthScreen('login'); setTimeout(() => setAuthError('✅ Password reset email sent! Check your inbox.'), 100); return; }
        }
        setAuthError('No account found with this email.'); return;
      }
      _setRpSaHash(saFound); _setRpStoredEmail(k); setRpQ(sqFound); setRpStep(2);
    } else if (rpStep === 2) {
      if (!rpSa.trim()) { setAuthError('Please enter your security answer.'); return; }
      const sah = await hp(rpSa.trim().toLowerCase());
      if (sah !== _rpSaHash) { setAuthError('Incorrect security answer. Please try again.'); return; }
      setRpStep(3);
    } else if (rpStep === 3) {
      if (!rpPw || rpPw.length < 6) { setAuthError('New password must be at least 6 characters.'); return; }
      if (rpPw !== rpPc) { setAuthError('Passwords do not match.'); return; }
      const k = _rpStoredEmail;
      const a = gA(); if (a[k]) { a[k].p = await hp(rpPw); sA(a); }
      if (_fbReady) { const acct = await fbCreateAccount(k, rpPw); if (!acct.ok) { try { await fbResetPassword(k); } catch (e) {} } }
      _setRpSaHash(''); _setRpStoredEmail('');
      setAuthError(''); setRpEm(''); setRpSa(''); setRpPw(''); setRpPc(''); setRpStep(1); setRpQ('');
      setAuthScreen('login'); setTimeout(() => setAuthError('✅ Password reset! Sign in with your new password.'), 100);
    }
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
    sq, setSq, sa, setSa, sp, setSp2,
    rpEm, setRpEm, rpSa, setRpSa, rpPw, setRpPw, rpPc, setRpPc,
    rpStep, setRpStep, rpQ, setRpQ,
    authError, setAuthError,
    authLoading,
    doReg, doLog, doOut, doReset,
  };
}
