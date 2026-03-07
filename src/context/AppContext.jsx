import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  _fbReady, _fbAuth, _fbDb, BADGES, V,
  initFirebase, hp, gA, sA, gP, sP, gS, sS, cS,
  touchSession, isSessionExpired, isValidEmail,
  fbSaveProgress, fbLoadProgress, fbRegister, fbLogin, fbLogout, fbResetPassword,
  speak, speakSlow, speakEN,
  lvl, lXP, nXP, getSR, srMark, getStreak, updateStreak,
  getProverbOfDay, getDailyChallenge, getHistFact,
  fbCreateFamily, fbJoinFamily, fbGetFamilyMembers, fbLeaveFamily, fbLoadUserFamily, fbGetLeaderboard,
  generateFamilyCode, getLocalFamily, saveLocalFamily,
  buildSearchIndex, shuffleArr, sh,
} from '../data.jsx';

const AppContext = createContext(null);

const DS = { xp:0, str:1, diff:"beginner", lc:0, pf:0, gc:0, sp:0, de:0, rc:0, al:0, mv:0, hi:0, rs:[], ct:[], badges:[] };

const ICONS = { greetings:"👋", numbers:"🔢", family:"👨‍👩‍👧‍👦", food:"🍕", animals:"🐾", body:"🦴", colors:"🎨", home:"🏠", clothing:"👔", weather:"☀️", places:"📍", transport:"🚗", verbs:"💬", adjectives:"📏", time:"📅", months:"🗓️", directions:"🧭", emotions:"💭", professions:"💼", restaurant:"🍽️", shopping:"🛍️", travel:"✈️", health:"🏥", questions:"❓", conjunctions:"🔗", culture:"🏛️" };

export function AppProvider({ children }) {
  // ── Auth state ──────────────────────────────────────────────
  const [as, setAs] = useState("loading");
  const [au, setAu] = useState(null);
  const [name, setName] = useState("");
  const [ae, setAe] = useState("");
  const [al, setAl] = useState(false);

  // ── User stats & prefs ──────────────────────────────────────
  const [st, setSt] = useState(DS);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");
  const [favs, setFavs] = useState(() => { try { return JSON.parse(localStorage.getItem("uFavs") || "[]"); } catch { return []; } });

  // ── XP / badge overlays ─────────────────────────────────────
  const [showXP, setShowXP] = useState(false);
  const [xpA, setXpA] = useState(0);
  const [nB, setNB] = useState(null);
  const [sB, setSB] = useState(false);

  // ── Daily challenge ─────────────────────────────────────────
  const [dchlA, sDchlA] = useState(() => {
    const d = localStorage.getItem("dcDay");
    return d === String(Math.floor(Date.now() / 86400000));
  });
  const [dchlSl, sDchlSl] = useState(-1);

  // ── Family ──────────────────────────────────────────────────
  const [famData, setFamData] = useState(null);
  const [famMembers, setFamMembers] = useState([]);

  // ── Anti-gaming (XP cooldown) ────────────────────────────────
  const [curEx, sCurEx] = useState("");

  // ── Translate widget (persists on dashboard) ─────────────────
  const [tDir, sTDir] = useState("en-hr");
  const [tIn, sTIn] = useState("");
  const [tOut, sTOut] = useState("");
  const [tL, sTL] = useState(false);

  // ── Derived ──────────────────────────────────────────────────
  const level = lvl(st.xp);
  const allCats = Object.keys(V);

  // ── Utilities ────────────────────────────────────────────────
  const toggleFav = (item) => {
    const key = item.hr || item.name;
    const exists = favs.some(f => (f.hr || f.name) === key);
    const nf = exists
      ? favs.filter(f => (f.hr || f.name) !== key)
      : [{ hr: item.hr, en: item.en, type: item.type || "custom", go: item.go }, ...favs];
    setFavs(nf);
    localStorage.setItem("uFavs", JSON.stringify(nf));
  };
  const isFav = (key) => favs.some(f => (f.hr || f.name) === key);

  const getWeekStats = () => {
    const sr = getSR();
    const weak = Object.values(sr).filter(v => v.w > v.r).length;
    const strong = Object.values(sr).filter(v => v.r > v.w).length;
    return { lessons: st.lc, grammar: st.gc, streak: getStreak().count, weak, strong };
  };

  // ── Anti-gaming functions ────────────────────────────────────
  function canEarnXP(exerciseId) {
    try {
      const cd = JSON.parse(localStorage.getItem("xpCooldown") || "{}");
      const today = new Date().toISOString().slice(0, 10);
      return cd[exerciseId] !== today;
    } catch { return true; }
  }
  function markExerciseDone(exerciseId) {
    try {
      const cd = JSON.parse(localStorage.getItem("xpCooldown") || "{}");
      const today = new Date().toISOString().slice(0, 10);
      cd[exerciseId] = today;
      const clean = {};
      for (const k in cd) { if (cd[k] === today) clean[k] = cd[k]; }
      localStorage.setItem("xpCooldown", JSON.stringify(clean));
    } catch {}
  }

  // ── Award XP ─────────────────────────────────────────────────
  const award = useCallback((amt) => {
    if (curEx && !canEarnXP(curEx)) return;
    setXpA(amt); setShowXP(true);
    setSt(s => {
      const n = { ...s, xp: s.xp + amt };
      const nb = BADGES.filter(b => !s.badges.includes(b.id) && b.r(n));
      if (nb.length) {
        n.badges = [...s.badges, ...nb.map(b => b.id)];
        setTimeout(() => { setNB(nb[0]); setSB(true); setTimeout(() => setSB(false), 3000); }, 600);
      }
      return n;
    });
    setTimeout(() => setShowXP(false), 1500);
  }, [curEx]);

  // ── Auth functions ───────────────────────────────────────────
  async function doLog(email, password) {
    setAe(""); setAl(true);
    try {
      initFirebase();
      const k = email.trim().toLowerCase();
      if (_fbReady) {
        const fb = await fbLogin(k, password);
        if (fb.ok) {
          const fbProgress = await fbLoadProgress(k);
          const dn = fb.user.displayName || k;
          const a = gA(); if (!a[k]) a[k] = { d: dn, e: k }; sA(a);
          if (fbProgress) sP(k, fbProgress);
          setAu({ u: k, d: dn, e: k }); sS({ u: k });
          const p = fbProgress || gP(k);
          if (p) { setName(p.name || dn); setSt(p.st || DS); }
          else setName(dn);
          setAs("app"); setAl(false);
          fbLoadUserFamily(k).then(f => { if (f) setFamData(f); });
          return { ok: true, hasProgress: !!(p?.st?.xp > 0 || p?.st?.lc > 0), cp: p?.cp };
        } else {
          let msg = fb.err;
          if (msg.includes("wrong-password") || msg.includes("invalid-credential")) msg = "Incorrect password. Try again or use Forgot Password.";
          else if (msg.includes("user-not-found")) msg = "No account found with this email.";
          else if (msg.includes("too-many-requests")) msg = "Too many attempts. Please wait a moment.";
          else if (msg.includes("network")) msg = "Network error. Check your connection.";
          setAe(msg); setAl(false); return { ok: false };
        }
      }
      const a = gA();
      if (!a[k]) { setAe("No account found with this email."); setAl(false); return { ok: false }; }
      const h = await hp(password);
      if (a[k].p !== h) { setAe("Incorrect password."); setAl(false); return { ok: false }; }
      setAu({ u: k, d: a[k].d, e: k }); sS({ u: k });
      const p = gP(k);
      if (p) { setName(p.name || a[k].d); setSt(p.st || DS); }
      else setName(a[k].d);
      setAs("app");
      return { ok: true, hasProgress: !!(p?.st?.xp > 0 || p?.st?.lc > 0), cp: p?.cp };
    } catch { setAe("Login failed. Please try again."); }
    setAl(false);
    return { ok: false };
  }

  async function doReg(email, password, confirmPassword, displayName, secQuestion, secAnswer) {
    setAe("");
    if (!email.trim() || !isValidEmail(email.trim())) { setAe("Please enter a valid email address."); return { ok: false }; }
    if (!password || password.length < 6) { setAe("Password must be at least 6 characters."); return { ok: false }; }
    if (password !== confirmPassword) { setAe("Passwords do not match."); return { ok: false }; }
    if (!displayName.trim()) { setAe("Please enter your display name."); return { ok: false }; }
    if (!secQuestion.trim()) { setAe("Please select a security question."); return { ok: false }; }
    if (!secAnswer.trim() || secAnswer.trim().length < 2) { setAe("Please enter a security answer (2+ characters)."); return { ok: false }; }
    setAl(true);
    try {
      initFirebase();
      const k = email.trim().toLowerCase();
      if (_fbReady) {
        const fb = await fbRegister(k, password, displayName.trim());
        if (!fb.ok && fb.err.includes("already")) { setAe("An account with this email already exists."); setAl(false); return { ok: false }; }
        if (!fb.ok) {
          let msg = fb.err;
          if (msg.includes("weak-password")) msg = "Password is too weak. Use at least 6 characters.";
          else if (msg.includes("network")) msg = "Network error. Check your connection.";
          setAe(msg); setAl(false); return { ok: false };
        }
        try {
          const id = k.replace(/[.#$/[\]]/g, "_");
          await _fbDb.collection("users").doc(id).set({ sq: secQuestion.trim(), sa: await hp(secAnswer.trim().toLowerCase()) }, { merge: true });
        } catch {}
      }
      const a = gA();
      const h = await hp(password);
      const sah = await hp(secAnswer.trim().toLowerCase());
      a[k] = { p: h, d: displayName.trim(), e: k, sq: secQuestion.trim(), sa: sah, created: Date.now() };
      sA(a);
      setAu({ u: k, d: displayName.trim(), e: k }); sS({ u: k });
      setName(displayName.trim()); setSt(DS); setAs("app");
    } catch { setAe("Registration failed. Please try again."); }
    setAl(false);
    return { ok: true };
  }

  async function doReset(step, data) {
    setAe(""); initFirebase();
    if (step === 1) {
      const k = data.email.trim().toLowerCase();
      if (!k || !isValidEmail(k)) { setAe("Please enter your email address."); return { ok: false }; }
      let sqFound = "", saFound = "";
      const a = gA();
      if (a[k]?.sq) { sqFound = a[k].sq; saFound = a[k].sa; }
      if (!sqFound && _fbReady && _fbDb) {
        try {
          const id = k.replace(/[.#$/[\]]/g, "_");
          const doc = await _fbDb.collection("users").doc(id).get();
          if (doc.exists && doc.data().sq) { sqFound = doc.data().sq; saFound = doc.data().sa; }
          else if (doc.exists && !doc.data().sq) {
            const fb = await fbResetPassword(k);
            if (fb.ok) return { ok: true, emailSent: true };
            else { setAe(fb.err); return { ok: false }; }
          }
        } catch {}
      }
      if (!sqFound) {
        if (_fbReady) {
          const fb2 = await fbResetPassword(k);
          if (fb2.ok) return { ok: true, emailSent: true };
        }
        setAe("No account found with this email."); return { ok: false };
      }
      localStorage.setItem("_rpSaHash", saFound); localStorage.setItem("_rpEmail", k);
      return { ok: true, question: sqFound };
    } else if (step === 2) {
      const sah = await hp(data.secAnswer.trim().toLowerCase());
      const stored = localStorage.getItem("_rpSaHash");
      if (sah !== stored) { setAe("Incorrect security answer. Please try again."); return { ok: false }; }
      return { ok: true };
    } else if (step === 3) {
      if (!data.newPassword || data.newPassword.length < 6) { setAe("New password must be at least 6 characters."); return { ok: false }; }
      if (data.newPassword !== data.confirmPassword) { setAe("Passwords do not match."); return { ok: false }; }
      const k = localStorage.getItem("_rpEmail");
      const a = gA(); if (a[k]) { a[k].p = await hp(data.newPassword); sA(a); }
      if (_fbReady && _fbAuth) { try { await _fbAuth.sendPasswordResetEmail(k); } catch {} }
      localStorage.removeItem("_rpSaHash"); localStorage.removeItem("_rpEmail");
      setAe("");
      return { ok: true };
    }
    return { ok: false };
  }

  function doOut() {
    fbLogout(); cS(); setAu(null); setSt(DS); setName(""); setFamData(null); setFamMembers([]); setAs("login");
  }

  const doTr = async () => {
    const t = tIn.trim(); if (!t) return;
    sTL(true); sTOut("");
    const [s, g] = tDir === "en-hr" ? ["en", "hr"] : ["hr", "en"];
    try {
      const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(t)}&langpair=${s}|${g}`);
      const d = await r.json();
      if (d.responseStatus === 200 && d.responseData?.translatedText) sTOut(d.responseData.translatedText);
      else sTOut("Translation failed. Try again.");
    } catch { sTOut("Network error."); }
    sTL(false);
  };

  // ── Session init ─────────────────────────────────────────────
  useEffect(() => {
    initFirebase();
    const s = gS();
    if (s?.u) {
      if (isSessionExpired()) {
        cS(); setAs("login");
        setTimeout(() => setAe("✅ Your session expired. Your account is safe — just sign in again."), 200);
        return;
      }
      const a = gA();
      if (a[s.u]) {
        const p = gP(s.u);
        setAu({ u: s.u, d: a[s.u].d, e: a[s.u].e || s.u });
        touchSession(); updateStreak();
        const lf = getLocalFamily(); if (lf) setFamData(lf);
        if (p) { setName(p.name || a[s.u].d); setSt(p.st || DS); }
        else setName(a[s.u].d);
        setAs("app");
        return;
      }
      // Firebase auth fallback
      if (_fbReady && _fbAuth) {
        _fbAuth.onAuthStateChanged(user => {
          if (user) {
            const dn = user.displayName || user.email; const k = user.email;
            const a = gA(); a[k] = { d: dn, e: k }; sA(a);
            fbLoadProgress(k).then(fp => {
              if (fp) sP(k, fp);
              setAu({ u: k, d: dn, e: k }); sS({ u: k }); touchSession(); updateStreak();
              fbLoadUserFamily(k).then(f => { if (f) setFamData(f); });
              const p = fp || gP(k);
              if (p) { setName(p.name || dn); setSt(p.st || DS); } else setName(dn);
              setAs("app");
            });
          } else { cS(); setAs("login"); }
        });
      } else { cS(); setAs("login"); }
    } else setAs("login");
  }, []);

  // ── Save progress on change ───────────────────────────────────
  useEffect(() => {
    if (au && as === "app") { sP(au.u, { name, st, cp: true }); touchSession(); }
  }, [st, name, au, as]);

  // ── Session expiry check ──────────────────────────────────────
  useEffect(() => {
    if (as !== "app") return;
    const iv = setInterval(() => {
      if (isSessionExpired()) { cS(); setAu(null); setSt(DS); setName(""); setAs("login"); }
    }, 5 * 60 * 1000);
    return () => clearInterval(iv);
  }, [as]);

  // ── Activity heartbeat ────────────────────────────────────────
  useEffect(() => {
    if (as !== "app") return;
    const h = () => touchSession();
    window.addEventListener("click", h); window.addEventListener("touchstart", h); window.addEventListener("keydown", h);
    return () => { window.removeEventListener("click", h); window.removeEventListener("touchstart", h); window.removeEventListener("keydown", h); };
  }, [as]);

  const value = {
    // Auth
    as, setAs, au, setAu, name, setName, ae, setAe, al, setAl,
    doLog, doReg, doReset, doOut,
    // Stats
    st, setSt, level, allCats, icons: ICONS, DS,
    // Prefs
    darkMode, setDarkMode,
    favs, setFavs, toggleFav, isFav,
    // Overlays
    showXP, xpA, sB, nB,
    // Daily challenge
    dchlA, sDchlA, dchlSl, sDchlSl,
    // Translate
    tDir, sTDir, tIn, sTIn, tOut, sTOut, tL, doTr,
    // Family
    famData, setFamData, famMembers, setFamMembers,
    // XP
    award, curEx, sCurEx, markExerciseDone, canEarnXP,
    // Utilities
    getWeekStats, sh, shuffleArr, lXP, nXP, speak, speakSlow, speakEN, srMark, getSR, getStreak, getProverbOfDay, getDailyChallenge, getHistFact,
    // Family (extended)
    fbCreateFamily, fbJoinFamily, fbGetFamilyMembers, fbLeaveFamily, fbGetLeaderboard, generateFamilyCode, getLocalFamily, saveLocalFamily,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
