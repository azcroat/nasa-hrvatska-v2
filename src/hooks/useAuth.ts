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
  gP,
  lP,
  gS,
  sS,
  cS,
  touchSession,
  isValidEmail,
  fbLogin,
  fbRegister,
  fbLogout,
  fbLoginGoogle,
  fbResetPassword,
  fbLoadProgress,
  fbLoadUserFamily,
  fbOnAuthStateChanged,
  initFirebase,
  getLocalFamily,
  saveLocalFamily,
  fbSaveProgress,
  type FamilyData,
} from '../lib/firebase.js';
import { updateStreak } from '../lib/appUtils.js';
import { getSR } from '../lib/srs.js';
import type { AuthUser } from '../types/index.js';

interface AuthCallbacks {
  onSignedIn: (opts: {
    user: AuthUser;
    progress: unknown;
    isNew?: boolean;
    isHydrate?: boolean;
  }) => void;
  onSignedOut: () => void;
  applyRemoteProgress: (progress: unknown) => void;
  setFamData: (fam: unknown) => void;
  setSyncReady: (ready: boolean) => void;
  onBeforeSignOut?: () => Promise<void>;
}

export function useAuth({
  onSignedIn,
  onSignedOut,
  applyRemoteProgress,
  setFamData,
  setSyncReady,
  onBeforeSignOut,
}: AuthCallbacks): {
  authScreen: string;
  setAuthScreen: (s: string) => void;
  authUser: AuthUser | null;
  authEmail: string;
  setAuthEmail: React.Dispatch<React.SetStateAction<string>>;
  pw: string;
  setPw: React.Dispatch<React.SetStateAction<string>>;
  pc: string;
  setPc: React.Dispatch<React.SetStateAction<string>>;
  displayName: string;
  setDisplayName: React.Dispatch<React.SetStateAction<string>>;
  sp: boolean;
  setSp2: React.Dispatch<React.SetStateAction<boolean>>;
  rpEm: string;
  setRpEm: React.Dispatch<React.SetStateAction<string>>;
  authError: string;
  setAuthError: React.Dispatch<React.SetStateAction<string>>;
  authLoading: boolean;
  emailUnverified: boolean;
  setEmailUnverified: React.Dispatch<React.SetStateAction<boolean>>;
  resendVerification: () => Promise<void>;
  doReg: () => Promise<void>;
  doLog: () => Promise<void>;
  doOut: () => Promise<void>;
  doReset: () => Promise<void>;
  doGoogleLogin: () => Promise<void>;
  doGuest: () => void;
} {
  // Keep callbacks in a ref so the one-time mount effect never goes stale
  const cb = useRef<AuthCallbacks>({
    onSignedIn,
    onSignedOut,
    applyRemoteProgress,
    setFamData,
    setSyncReady,
    onBeforeSignOut,
  });
  cb.current = {
    onSignedIn,
    onSignedOut,
    applyRemoteProgress,
    setFamData,
    setSyncReady,
    onBeforeSignOut,
  };

  // Holds the Firestore onSnapshot unsubscribe fn — cleaned up on sign-out / unmount
  const watchRef = useRef<(() => void) | null>(null);

  // Set to true just before fbRegister so the auth listener treats the next user as a new account
  const isNewReg = useRef(false);

  // Guest mode — skip Firebase redirect while user is browsing without an account
  const guestRef = useRef(false);

  // Track authScreen in a ref so the auth listener (mounted once) can read the current value.
  const authScreenRef = useRef('loading');

  // ── Auth flow state ──────────────────────────────────────────────────────
  const [authScreen, _setAuthScreen] = useState('loading');
  // Wrap setAuthScreen so authScreenRef always mirrors the latest value
  function setAuthScreen(s: string): void {
    authScreenRef.current = s;
    _setAuthScreen(s);
  }
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
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

    const s = gS() as { u?: string; d?: string } | null;
    let earlyRestored = false;
    let _origLocalSavedAt = 0;
    let _origLocalFbUpdated = 0;
    if (s && s.u) {
      const cached = gP(s.u) as Record<string, unknown> | null;
      if (cached) {
        _origLocalSavedAt = (cached.savedAt as number) || 0;
        _origLocalFbUpdated = (cached._fbUpdated as number) || 0;
        earlyRestored = true;
        const user: AuthUser = { u: s.u, d: s.d || s.u, e: s.u };
        setAuthUser(user);
        touchSession();
        updateStreak();
        const lf = getLocalFamily();
        if (lf) cb.current.setFamData(lf);
        cb.current.onSignedIn({ user, progress: cached });
        setAuthScreen('app');
      }
    }

    let authFired = false;
    const authFallbackTimer = setTimeout(function () {
      if (!authFired && !earlyRestored) {
        setAuthScreen('login');
      }
    }, 8000);

    const unsub = fbOnAuthStateChanged(function (fbUser) {
      authFired = true;
      clearTimeout(authFallbackTimer);
      if (!fbUser) {
        if (guestRef.current) {
          setAuthScreen('app');
          return;
        }
        // If we already restored from local cache (earlyRestored) and Firebase
        // fires null — this happens when offline or in test environments with
        // placeholder Firebase credentials. Keep the locally-restored session
        // rather than wiping it and reverting to login.
        if (earlyRestored) return;
        cS();
        if (watchRef.current) {
          watchRef.current();
          watchRef.current = null;
        }
        setAuthUser(null);
        setAuthScreen('login');
        return;
      }
      guestRef.current = false;

      const k = (fbUser.email as string) || (fbUser.uid as string);
      const dn = (fbUser.displayName as string) || k;
      const user: AuthUser = { u: k, d: dn, e: k };
      const isNew = isNewReg.current;
      isNewReg.current = false;

      cb.current.setSyncReady(false);

      setAuthUser(user);
      sS({ u: k, d: dn });
      touchSession();
      updateStreak();

      if (isNew) {
        const offlineProgress = gP(k);
        cb.current.onSignedIn({ user, progress: offlineProgress, isNew: true });
        cb.current.setSyncReady(true);
        setAuthScreen('app');
        if (offlineProgress) {
          fbSaveProgress(k, offlineProgress as Record<string, unknown>).catch(function () {});
        }
        if (
          fbUser &&
          !fbUser.emailVerified &&
          fbUser.providerData?.length &&
          fbUser.providerData[0]?.providerId !== 'google.com'
        ) {
          setEmailUnverified(true);
        }
        return;
      }

      const localP = gP(k) as Record<string, unknown> | null;

      if (!earlyRestored && localP) {
        _origLocalSavedAt = (localP.savedAt as number) || 0;
        _origLocalFbUpdated = (localP._fbUpdated as number) || 0;
        earlyRestored = true;
        cb.current.onSignedIn({ user, progress: localP });
        setAuthScreen('app');
      }

      fbLoadUserFamily(k).then(function (f: unknown) {
        if (f) {
          saveLocalFamily(f as FamilyData);
          cb.current.setFamData(f);
        }
      });

      let syncReadyFired = false;
      function fireSyncReady(): void {
        if (!syncReadyFired) {
          syncReadyFired = true;
          cb.current.setSyncReady(true);
        }
      }
      const freshDevice = !earlyRestored && !localP;
      const t = setTimeout(
        function () {
          const needsNavTimeout =
            !earlyRestored ||
            authScreenRef.current === 'login' ||
            authScreenRef.current === 'register' ||
            authScreenRef.current === 'loading';
          if (needsNavTimeout) {
            earlyRestored = true;
            cb.current.onSignedIn({ user, progress: localP });
          }
          setAuthScreen('app');
          fireSyncReady();
        },
        freshDevice ? 14000 : 6000,
      );

      fbLoadProgress(k)
        .then(function (fp: Record<string, unknown> | null) {
          clearTimeout(t);

          const lp = gP(k) as Record<string, unknown> | null;
          const _fpStat = fp
            ? (fp.stats as Record<string, number>) || (fp.st as Record<string, number>) || {}
            : {};
          const _lpStat = lp
            ? (lp.stats as Record<string, number>) || (lp.st as Record<string, number>) || {}
            : {};
          const fpXP: number = (_fpStat.xp as number) || 0;
          const lpXP: number = (_lpStat.xp as number) || 0;

          if (fp) {
            _origLocalSavedAt = 0;
            _origLocalFbUpdated = 0;
            const fpSt = (fp.stats || fp.st || {}) as Record<string, unknown>;
            const lpSt = ((lp && (lp.stats || lp.st)) as Record<string, unknown>) || {};
            const mergedStats = {
              ...fpSt,
              xp: Math.max((lpSt.xp as number) || 0, (fpSt.xp as number) || 0),
              lc: Math.max((lpSt.lc as number) || 0, (fpSt.lc as number) || 0),
              gc: Math.max((lpSt.gc as number) || 0, (fpSt.gc as number) || 0),
              sp: Math.max((lpSt.sp as number) || 0, (fpSt.sp as number) || 0),
              de: Math.max((lpSt.de as number) || 0, (fpSt.de as number) || 0),
              rc: Math.max((lpSt.rc as number) || 0, (fpSt.rc as number) || 0),
              str: Math.max((lpSt.str as number) || 0, (fpSt.str as number) || 0),
              pf: Math.max((lpSt.pf as number) || 0, (fpSt.pf as number) || 0),
              mv: Math.max((lpSt.mv as number) || 0, (fpSt.mv as number) || 0),
              hi: Math.max((lpSt.hi as number) || 0, (fpSt.hi as number) || 0),
              ct: [
                ...new Set([...((lpSt.ct as string[]) || []), ...((fpSt.ct as string[]) || [])]),
              ],
              vs: [
                ...new Set([...((lpSt.vs as string[]) || []), ...((fpSt.vs as string[]) || [])]),
              ],
              badges: [
                ...new Set([
                  ...((lpSt.badges as string[]) || []),
                  ...((fpSt.badges as string[]) || []),
                ]),
              ],
              diff: (function () {
                const DO: Record<string, number> = { beginner: 0, intermediate: 1, advanced: 2 };
                const lo = DO[lpSt.diff as string] !== undefined ? DO[lpSt.diff as string]! : -1;
                const fo = DO[fpSt.diff as string] !== undefined ? DO[fpSt.diff as string]! : -1;
                return lo >= fo ? lpSt.diff || fpSt.diff : fpSt.diff || lpSt.diff;
              })(),
            };
            lP(k, { ...fp, stats: mergedStats });
            cb.current.onSignedIn({
              user,
              progress: { ...fp, stats: mergedStats },
              isHydrate: true,
            });
            cb.current.applyRemoteProgress(fp);
            if (lpXP > fpXP) {
              // Include local SRS data so any offline reviews done before sign-in are
              // uploaded here. Without this, fp.sr (Firestore SRS) would be re-saved,
              // overwriting newer local cards until the next doSyncNow() fires.
              fbSaveProgress(k, { ...fp, stats: mergedStats, sr: getSR() }).catch(function () {});
            }
          } else {
            _origLocalSavedAt = 0;
            _origLocalFbUpdated = 0;
            if (lpXP > 0 && lp) {
              // lp is from gP(k) = localStorage snapshot (buildProgressSnapshot includes sr: getSR())
              // so local SRS is already embedded — no additional getSR() call needed here.
              fbSaveProgress(k, lp).catch(function () {});
            }
          }

          const needsNav =
            !earlyRestored ||
            authScreenRef.current === 'login' ||
            authScreenRef.current === 'register' ||
            authScreenRef.current === 'loading';
          if (needsNav) {
            earlyRestored = true;
            let navProgress: unknown = fp || localP;
            if (fp && localP) {
              const _fpSt = (fp.stats || fp.st || {}) as Record<string, unknown>;
              const _lpSt = (localP.stats || localP.st || {}) as Record<string, unknown>;
              const _safeMerged = {
                xp: Math.max((_lpSt.xp as number) || 0, (_fpSt.xp as number) || 0),
                lc: Math.max((_lpSt.lc as number) || 0, (_fpSt.lc as number) || 0),
                gc: Math.max((_lpSt.gc as number) || 0, (_fpSt.gc as number) || 0),
                sp: Math.max((_lpSt.sp as number) || 0, (_fpSt.sp as number) || 0),
                de: Math.max((_lpSt.de as number) || 0, (_fpSt.de as number) || 0),
                rc: Math.max((_lpSt.rc as number) || 0, (_fpSt.rc as number) || 0),
                str: Math.max((_lpSt.str as number) || 0, (_fpSt.str as number) || 0),
                pf: Math.max((_lpSt.pf as number) || 0, (_fpSt.pf as number) || 0),
                mv: Math.max((_lpSt.mv as number) || 0, (_fpSt.mv as number) || 0),
                hi: Math.max((_lpSt.hi as number) || 0, (_fpSt.hi as number) || 0),
                ct: [
                  ...new Set([
                    ...((_lpSt.ct as string[]) || []),
                    ...((_fpSt.ct as string[]) || []),
                  ]),
                ],
                vs: [
                  ...new Set([
                    ...((_lpSt.vs as string[]) || []),
                    ...((_fpSt.vs as string[]) || []),
                  ]),
                ],
                badges: [
                  ...new Set([
                    ...((_lpSt.badges as string[]) || []),
                    ...((_fpSt.badges as string[]) || []),
                  ]),
                ],
                diff: (function () {
                  const DO: Record<string, number> = { beginner: 0, intermediate: 1, advanced: 2 };
                  const lo =
                    DO[_lpSt.diff as string] !== undefined ? DO[_lpSt.diff as string]! : -1;
                  const fo =
                    DO[_fpSt.diff as string] !== undefined ? DO[_fpSt.diff as string]! : -1;
                  return lo >= fo ? _lpSt.diff || _fpSt.diff : _fpSt.diff || _lpSt.diff;
                })(),
              };
              navProgress = Object.assign({}, fp, { stats: Object.assign({}, _fpSt, _safeMerged) });
            }
            cb.current.onSignedIn({ user, progress: navProgress });
          }
          setAuthScreen('app');

          fireSyncReady();

          (function () {
            const famData = getLocalFamily() as Record<string, unknown> | null;
            const latestProgress = (fp || gP(k)) as Record<string, unknown> | null;
            const _lpSt =
              latestProgress &&
              ((latestProgress.stats || latestProgress.st) as Record<string, unknown>);
            if (famData && famData.code && _lpSt && (_lpSt.xp as number) > 0) {
              fbSaveProgress(k, latestProgress as Record<string, unknown>).catch(function () {});
            }
          })();
        })
        .catch(function () {
          clearTimeout(t);
          const needsNavCatch =
            !earlyRestored ||
            authScreenRef.current === 'login' ||
            authScreenRef.current === 'register' ||
            authScreenRef.current === 'loading';
          if (needsNavCatch) {
            earlyRestored = true;
            cb.current.onSignedIn({ user, progress: localP });
          }
          setAuthScreen('app');
          fireSyncReady();
        });
    });

    return function () {
      clearTimeout(authFallbackTimer);
      unsub();
      if (watchRef.current) {
        watchRef.current();
        watchRef.current = null;
      }
    };
  }, []);

  // ── Register ─────────────────────────────────────────────────────────────
  async function doReg(): Promise<void> {
    setAuthError('');
    if (!authEmail.trim() || !isValidEmail(authEmail.trim())) {
      setAuthError('Please enter a valid email address.');
      return;
    }
    if (!pw || pw.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }
    if (pw !== pc) {
      setAuthError('Passwords do not match.');
      return;
    }
    if (!displayName.trim()) {
      setAuthError('Please enter your display name.');
      return;
    }
    setAuthLoading(true);
    const regKey = 'reg_attempts';
    let regData: { count: number; since: number } = { count: 0, since: 0 };
    try {
      regData = JSON.parse(localStorage.getItem(regKey) || '{"count":0,"since":0}');
    } catch (_) {}
    const now = Date.now();
    if (now - regData.since < 600000) {
      if (regData.count >= 3) {
        setAuthError('Too many registration attempts. Please wait 10 minutes.');
        setAuthLoading(false);
        return;
      }
      localStorage.setItem(
        regKey,
        JSON.stringify({ count: regData.count + 1, since: regData.since }),
      );
    } else {
      localStorage.setItem(regKey, JSON.stringify({ count: 1, since: now }));
    }
    try {
      const k = authEmail.trim().toLowerCase();
      isNewReg.current = true;
      const fb = (await fbRegister(k, pw, displayName.trim())) as { ok: boolean; err?: string };
      if (!fb.ok) {
        isNewReg.current = false;
        setAuthError(fb.err || 'Registration failed. Please try again.');
        setAuthLoading(false);
        return;
      }
      setAuthEmail('');
      setPw('');
      setPc('');
      setDisplayName('');
    } catch (e) {
      isNewReg.current = false;
      setAuthError('Registration failed. Please try again.');
    }
    setAuthLoading(false);
  }

  // ── Login ─────────────────────────────────────────────────────────────────
  async function doLog(): Promise<void> {
    setAuthError('');
    if (!authEmail.trim() || !isValidEmail(authEmail.trim())) {
      setAuthError('Please enter a valid email address.');
      return;
    }
    if (!pw) {
      setAuthError('Please enter your password.');
      return;
    }
    setAuthLoading(true);
    const loginKey = 'login_attempts';
    let loginData: { count: number; since: number } = { count: 0, since: 0 };
    try {
      loginData = JSON.parse(localStorage.getItem(loginKey) || '{"count":0,"since":0}');
    } catch (_) {}
    const now = Date.now();
    if (now - loginData.since < 600000) {
      if (loginData.count >= 10) {
        setAuthError('Too many sign-in attempts. Please wait 10 minutes.');
        setAuthLoading(false);
        return;
      }
      localStorage.setItem(
        loginKey,
        JSON.stringify({ count: loginData.count + 1, since: loginData.since }),
      );
    } else {
      localStorage.setItem(loginKey, JSON.stringify({ count: 1, since: now }));
    }
    try {
      const k = authEmail.trim().toLowerCase();
      const result = (await fbLogin(k, pw)) as { ok: boolean; err?: string };
      if (result.ok) {
        localStorage.removeItem(loginKey);
        setAuthEmail('');
        setPw('');
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
  async function doReset(): Promise<void> {
    setAuthError('');
    if (!rpEm.trim() || !isValidEmail(rpEm.trim())) {
      setAuthError('Please enter your email address.');
      return;
    }
    setAuthLoading(true);
    try {
      await fbResetPassword(rpEm.trim().toLowerCase());
    } catch (e) {
      // Intentionally swallow — always show generic message (prevents email enumeration)
    }
    setRpEm('');
    setAuthScreen('login');
    setTimeout(function () {
      setAuthError('✅ If an account exists for that email, a reset link has been sent.');
    }, 100);
    setAuthLoading(false);
  }

  // ── Google Sign-In ────────────────────────────────────────────────────────
  async function doGoogleLogin(): Promise<void> {
    setAuthError('');
    setAuthLoading(true);
    try {
      const result = (await fbLoginGoogle()) as { ok: boolean; err?: string };
      if (result.ok) {
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
  async function resendVerification(): Promise<void> {
    try {
      const { getAuth } = await import('firebase/auth');
      const { sendEmailVerification } = await import('firebase/auth');
      const auth = getAuth();
      if (auth.currentUser) await sendEmailVerification(auth.currentUser);
    } catch (e) {}
  }

  // ── Sign out ──────────────────────────────────────────────────────────────
  async function doOut(): Promise<void> {
    if (cb.current.onBeforeSignOut) {
      try {
        await Promise.race([
          cb.current.onBeforeSignOut(),
          new Promise<void>((resolve) => setTimeout(resolve, 3000)),
        ]);
      } catch {}
    }
    guestRef.current = false;
    if (watchRef.current) {
      watchRef.current();
      watchRef.current = null;
    }
    fbLogout();
    // Clear per-user progress blob before cS() so no stale early-restore fires
    const _outUser = authUser;
    if (_outUser?.u) {
      try { localStorage.removeItem('uP_' + _outUser.u); } catch {}
    }
    cS();
    // Clear all per-user state so a different user on the same device starts clean.
    // Without this, the early-restore path in useAuth reads the previous user's data
    // (streak, XP, CEFR level) for up to 14 seconds after sign-out.
    const _nhKeys = Object.keys(localStorage).filter((k) => k.startsWith('nh_'));
    _nhKeys.forEach((k) => { try { localStorage.removeItem(k); } catch {} });
    ['nh_lesson_resume', 'nh_checkpoints', 'login_attempts', 'uStreak', 'uFreeze', 'xpCooldown'].forEach((k) =>
      localStorage.removeItem(k),
    );
    ['nh_ex_start', 'nh_checkpoint_level', 'nh_readlist_filter'].forEach((k) =>
      sessionStorage.removeItem(k),
    );
    setAuthUser(null);
    setAuthScreen('login');
    cb.current.onSignedOut();
  }

  // ── Guest mode ────────────────────────────────────────────────────────────
  function doGuest(): void {
    guestRef.current = true;
    touchSession();
    updateStreak();
    setAuthScreen('app');
  }

  return {
    authScreen,
    setAuthScreen,
    authUser,
    authEmail,
    setAuthEmail,
    pw,
    setPw,
    pc,
    setPc,
    displayName,
    setDisplayName,
    sp,
    setSp2,
    rpEm,
    setRpEm,
    authError,
    setAuthError,
    authLoading,
    emailUnverified,
    setEmailUnverified,
    resendVerification,
    doReg,
    doLog,
    doOut,
    doReset,
    doGoogleLogin,
    doGuest,
  };
}
