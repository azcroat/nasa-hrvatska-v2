import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  V, LEARN_PATH,
  BG_LIGHT, BG_DARK,
  touchSession, isSessionExpired,
  lvl, getSR, saveSR, getStreak,
  earnFreeze, getDueReviews,
  bootstrapMistakesFromSRS, recordJourneyMilestone,
} from "./data.jsx";
import { buildProgressSnapshot } from "./lib/progressSnapshot.js";
import { canRepairStreak, repairStreak } from "./lib/streak.js";
import { trackAppOpen } from "./lib/analytics.js";
import { fbRegisterFriendCode } from "./lib/firebase.js";
import AppContext from "./context/AppContext.jsx";
import { StatsProvider } from "./context/StatsContext.jsx";

import { usePreferences } from "./hooks/usePreferences.js";
import { useSearch } from "./hooks/useSearch.js";
import { useAuth } from "./hooks/useAuth.js";
import { useFamily } from "./hooks/useFamily.js";
import { useJournal } from "./hooks/useJournal.js";
import { useDaily } from "./hooks/useDaily.js";
import { useTranslator } from "./hooks/useTranslator.js";
import { useNotifications, checkNameDay, scheduleStreakReminder } from "./hooks/useNotifications.js";
import { useSubscription, grantFreeAnnual, getSubscriptionStatus } from "./hooks/useSubscription.js";
import { useAppScreenState } from "./hooks/useAppScreenState.js";
import { useAward } from "./hooks/useAward.js";
import { usePwaInstall } from "./hooks/usePwaInstall.js";
import { usePlacement } from "./hooks/usePlacement.js";
import { useSyncManager } from "./hooks/useSyncManager.js";
import { useScreenLauncher } from "./hooks/useScreenLauncher.js";

import LoginScreen from "./components/auth/LoginScreen.jsx";
import ResetPassword from "./components/auth/ResetPassword.jsx";
import XPPopup from "./components/shared/XPPopup.jsx";
import BadgeToast from "./components/shared/BadgeToast.jsx";
import TabBar from "./components/shared/TabBar.jsx";
import Sidebar from "./components/shared/Sidebar.jsx";
import OfflineBanner from "./components/shared/OfflineBanner.jsx";
import CookieConsent from "./components/shared/CookieConsent.jsx";
import CroatianGrb from "./components/shared/CroatianGrb.jsx";
import { AppToasts } from "./components/shared/AppToasts.jsx";
import { AppModals } from "./components/shared/AppModals.jsx";
import AppRouter from "./components/AppRouter.jsx";
import AmbientPlayer from "./components/shared/AmbientPlayer.jsx";

// ── Module-level constants ───────────────────────────────────────────────────
const DS = { xp:0,str:1,diff:"beginner",lc:0,pf:0,gc:0,sp:0,de:0,rc:0,authLoading:0,mv:0,hi:0,rs:[],ct:[],vs:[],badges:[] };
const ICONS = { greetings:"👋",numbers:"🔢",family:"👨‍👩‍👧‍👦",food:"🍕",animals:"🐾",body:"🦴","body & face":"🦴",colors:"🎨",home:"🏠","home & rooms":"🏠",clothing:"👔",weather:"☀️","weather & seasons":"☀️",places:"📍",transport:"🚗",verbs:"💬",adjectives:"📏",time:"📅","time & calendar":"📅",months:"🗓️",directions:"🧭",emotions:"💭",professions:"💼",restaurant:"🍽️",shopping:"🛍️",travel:"✈️",health:"🏥",questions:"❓",conjunctions:"🔗",culture:"🏛️","daily routine":"🌅","in the classroom":"📖","commands at home":"🏡","fairy tales":"📜",hobbies:"🎯",zagreb:"🏙️",opposites:"🔄",comparatives:"📊",fruits:"🍎",vegetables:"🥦",sports:"⚽",holidays:"🎄",personality:"😊" };
const TAB_PATHS = { home:"/",learn:"/learn",practice:"/practice",croatia:"/croatia",profile:"/profile" };
const PATH_TO_TAB = { "/":"home","/learn":"learn","/practice":"practice","/croatia":"croatia","/profile":"profile" };

function _localDateStr() { const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function getDaysSinceJoin(authUser) {
  if (!authUser) return null;
  const k = 'nh_join_date_' + (authUser.u || authUser.uid || '');
  if (!localStorage.getItem(k)) localStorage.setItem(k, Date.now().toString());
  return Math.floor((Date.now() - parseInt(localStorage.getItem(k))) / 86400000);
}
function pruneStaleLocalStorage() {
  try {
    const today = _localDateStr();
    const gk = 'nh_pruned_' + today;
    if (localStorage.getItem(gk)) return;
    localStorage.setItem(gk, '1');
    const del = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i); if (!k) continue;
      if (/^nh_quest_.+_\d{4}-\d{2}-\d{2}$/.test(k)) { const d = k.slice(-10); if (d < today.slice(0,8)+String(Math.max(1,parseInt(today.slice(8))-3)).padStart(2,'0')) del.push(k); }
      if (/^nh_week_xp_\d{4}-W\d{2}$/.test(k)) { const yr=parseInt(k.slice(11,15));const wn=parseInt(k.slice(17));const cy=new Date().getFullYear();const cw=(()=>{const d2=new Date();const dy=d2.getDay()||7;d2.setDate(d2.getDate()+4-dy);return Math.ceil(((d2.getTime()-new Date(d2.getFullYear(),0,1).getTime())/86400000+1)/7);})(); if(yr<cy-1||(yr===cy&&wn<cw-8))del.push(k); }
      if (/^nh_comeback_used_\d{4}-\d{2}-\d{2}$/.test(k) && k.slice(-10) < today) del.push(k);
      if (/^nh_pruned_\d{4}-\d{2}-\d{2}$/.test(k) && k.slice(-10) < today) del.push(k);
    }
    del.forEach(k2 => { try { localStorage.removeItem(k2); } catch {} });
  } catch {}
}

// ── App component ────────────────────────────────────────────────────────────
function App() {
  useNotifications();
  const { isPremium, isFreeAnnual, daysLeft, refresh: refreshSub } = useSubscription();
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState('AI Tutor');
  function requirePremium(featureName, action) { if (isPremium) { action(); return; } setPaywallFeature(featureName); setShowPaywall(true); }

  const navigate = useNavigate();
  const location = useLocation();
  const ds = DS;

  // Bootstrap + TTS failure toast (must be before useAward declares setTtsFailedToast)
  useEffect(() => {
    const t = setTimeout(bootstrapMistakesFromSRS, 500);
    pruneStaleLocalStorage();
    const onTtsFailed = () => { setTtsFailedToast(true); setTimeout(() => setTtsFailedToast(false), 2500); };
    window.addEventListener('nh:tts-failed', onTtsFailed);
    return () => { clearTimeout(t); window.removeEventListener('nh:tts-failed', onTtsFailed); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Core state ──────────────────────────────────────────────────────────────
  const [currentScreen, _setCurrentScreen] = useState('welcome');
  const setScr = useCallback((s) => {
    _setCurrentScreen(s);
    if (s === 'welcome' || s === 'placement' || s === 'new-placement') return;
    navigate(s === 'dashboard' ? '/' : `/${s}`, { replace: false });
  }, [navigate]);
  const [name, setName] = useState('');
  const [stats, setStats] = useState(ds);
  const [showStreakRepair, setShowStreakRepair] = useState(false);
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem('onboarded') === 'true');
  const [showFirstWords, setShowFirstWords] = useState(false);
  const [showPremiumWelcome, setShowPremiumWelcome] = useState(false);
  const [pendingJoinCode, setPendingJoinCode] = useState(() => { try { const c = new URLSearchParams(window.location.search).get('join') || null; return c && /^[A-Z2-9]{6}$/.test(c) ? c : null; } catch { return null; } });
  const [_syncReady, _setSyncReady] = useState(false);
  const [showBackupBannerLocal, setShowBackupBannerLocal] = useState(false); // fallback if useSyncManager not ready

  // ── Screen + exercise state ─────────────────────────────────────────────────
  const { placementIdx, setPlacementIdx, placementScore, setPlacementScore, placementAnswers, setPlacementAnswers, placementXp, setPlacementXp, placementQ, setPlacementQ, getPlacementCt } = usePlacement();
  const { lt, sLt, li, sLi, lx, sLx, ls, sLs, lp, sLp, la, sLa, lsl, sLsl, qi, sQi, gl, sGl, gx, sGx, gp, sGp, gs, sGs, ga, sGa, gsl, sGsl, matchInitPool, setMatchInitPool, mcInitQ, setMcInitQ, mcResultQ, setMcResultQ, mcResultScore, setMcResultScore, mcMistakes, setMcMistakes, rp, sRp, rph, sRph, rqi, sRqi, rsc, sRsc, ra, sRa, rsl, sRsl, hw, sHw, sw, sSw, sr, sSr, sx, sSx, si, sSi, ssc, sSsc, animLesson, setAnimLesson, fcInitPool, setFcInitPool, lsInitQ, setLsInitQ, curEx, sCurEx } = useAppScreenState();
  const { dchlA, sDchlA, dchlSl, sDchlSl } = useDaily();
  const { famData, setFamData, famMembers, setFamMembers, famLoading, setFamLoading, famName, setFamName, famCode, setFamCode, famErr, setFamErr, famTab, setFamTab } = useFamily();
  const [tab, _setTab] = useState(() => PATH_TO_TAB[window.location.pathname] || 'home');
  const setTab = useCallback((t) => { _setTab(t); navigate(TAB_PATHS[t] || '/', { replace: false }); }, [navigate]);
  const { jWords, setJWords, jIn, setJIn, jEn, setJEn } = useJournal();
  const _uidRef = useRef(null);
  const { darkMode, setDarkMode, favs, setFavs, toggleFav, isFav } = usePreferences(_uidRef);
  const { srchQ, setSrchQ, srchR, srchOpen, setSrchOpen, doSearch } = useSearch();

  // ── Award / gamification ────────────────────────────────────────────────────
  const { award, comebackBonus, setComebackBonus, showCelebration, setShowCelebration, celebXP, setCelebXP, streakMilestone, setStreakMilestone, ceremonyType, setCeremonyType, levelUpData, setLevelUpData, freezeUsedToast, setFreezeUsedToast, earnBackPrompt, setEarnBackPrompt, streakRestoredCount, setStreakRestoredCount, ttsFailedToast, setTtsFailedToast, showXP, xpA, nB, sB } = useAward({ curEx, stats, setStats });

  const { tDir, setTDir: sTDir, tIn, setTIn: sTIn, tOut, tL, doTr } = useTranslator();

  // ── applyRemoteProgress: merge Firestore snapshot into local state ──────────
  // Defined before useAuth so it can be passed to onSignedIn.
  const applyRemoteProgress = useCallback((fp) => {
    if (!fp) return;
    const apSt = fp.stats || fp.st || {};
    if (fp.onboarded || fp.cp || apSt.xp > 0) { localStorage.setItem('onboarded', 'true'); setOnboarded(true); }
    if (fp.sr) { const lSR = getSR() || {}; const mSR = { ...lSR }; for (const w in fp.sr) { const r = fp.sr[w]; const l = mSR[w]; if (!l || (r.r||0) > (l.r||0) || (!l.r && (r.s||0) > (l.s||0))) mSR[w] = r; } saveSR(mSR); }
    if (fp.streak) { let lSt = { count:0,last:'' }; try { lSt = JSON.parse(localStorage.getItem('uStreak')||'{"count":0,"last":""}'); } catch (_) {} const mSt = (fp.streak.count||0) >= (lSt.count||0) ? fp.streak : lSt; localStorage.setItem('uStreak', JSON.stringify(mSt)); }
    if (fp.freezes !== undefined) { const lF = parseInt(localStorage.getItem('uFreeze')||'0',10); localStorage.setItem('uFreeze', String(Math.max(lF, Math.max(0, parseInt(fp.freezes,10)||0)))); }
    if (fp.favs) { let lFv = []; try { lFv = JSON.parse(localStorage.getItem('uFavs')||'[]'); } catch (_) {} const mFv = [...new Set([...lFv,...fp.favs])]; localStorage.setItem('uFavs', JSON.stringify(mFv)); setFavs(mFv); }
    if (fp.journal) { let lJ = []; try { lJ = JSON.parse(localStorage.getItem('uJournal')||'[]'); } catch (_) {} const jM = new Map(); lJ.forEach(e => { if (e?.word) jM.set(e.word, e); }); fp.journal.forEach(e => { if (e?.word) jM.set(e.word, e); }); const mJ = Array.from(jM.values()); localStorage.setItem('uJournal', JSON.stringify(mJ)); setJWords(mJ); }
    const today = _localDateStr();
    if (fp.dc?.day === today) { const ans = fp.dc.answered||[false,false,false]; const sel = Array.isArray(fp.dc.selected)&&typeof fp.dc.selected[0]==='string'?fp.dc.selected:['','','']; let lA=[false,false,false]; try { const ld=JSON.parse(localStorage.getItem('dcDay3')||'{}'); if(ld.day===today) lA=ld.answered||lA; } catch(_){} const mA=ans.map((a,i)=>a||lA[i]||false); sDchlA(mA); sDchlSl(sel); localStorage.setItem('dcDay3',JSON.stringify({day:today,answered:mA,selected:sel})); }
    if (fp.cooldown) { const t = new Date().toISOString().slice(0,10); let cd={}; try{cd=JSON.parse(localStorage.getItem('xpCooldown')||'{}');}catch(_){} for(const k in fp.cooldown){if(fp.cooldown[k]===t)cd[k]=fp.cooldown[k];} localStorage.setItem('xpCooldown',JSON.stringify(cd)); }
    if (fp.weekXP !== undefined) { const wD=new Date();const wY=wD.getDay()||7;wD.setDate(wD.getDate()+4-wY);const wy=wD.getFullYear();const wn=Math.ceil(((wD.getTime()-new Date(wy,0,1).getTime())/86400000+1)/7);const wk=wy+'-W'+String(wn).padStart(2,'0');const lX=parseInt(localStorage.getItem('nh_week_xp_'+wk)||'0',10);localStorage.setItem('nh_week_xp_'+wk,String(Math.max(lX,fp.weekXP))); }
  }, [setFavs, setJWords, sDchlA, sDchlSl, setOnboarded]);

  // Ref to break the useAuth TDZ cycle for doSyncNow and applyRemoteProgress
  const _syncNowRef = useRef(null);
  const _applyRemoteRef = useRef(null);
  _applyRemoteRef.current = applyRemoteProgress;

  // ── Auth ────────────────────────────────────────────────────────────────────
  const { authScreen, setAuthScreen, authUser, authEmail, setAuthEmail, pw, setPw, pc, setPc, displayName, setDisplayName, sp, setSp2, rpEm, setRpEm, authError, setAuthError, authLoading, emailUnverified, setEmailUnverified, resendVerification, doReg, doLog, doOut, doReset, doGoogleLogin } = useAuth({
    onSignedIn({ user, progress, isNew, isHydrate }) {
      if (isHydrate) {
        if (progress) { const st=progress.stats||progress.st||{}; setStats(prev=>({...ds,...st,ct:[...new Set([...(prev.ct||[]),...(st.ct||[])])],vs:[...new Set([...(prev.vs||[]),...(st.vs||[])])],lc:Math.max(prev.lc||0,st.lc||0),gc:Math.max(prev.gc||0,st.gc||0),xp:Math.max(prev.xp||0,st.xp||0)})); if(progress.name)setName(progress.name); }
        return;
      }
      if (progress) {
        setName(progress.name || user.d);
        const pSt = progress.stats || progress.st || {};
        setStats(prev=>({...ds,...pSt,ct:[...new Set([...(prev.ct||[]),...(pSt.ct||[])])],vs:[...new Set([...(prev.vs||[]),...(pSt.vs||[])])],lc:Math.max(prev.lc||0,pSt.lc||0),gc:Math.max(prev.gc||0,pSt.gc||0),xp:Math.max(prev.xp||0,pSt.xp||0)}));
        if (!isNew && (progress.onboarded || progress.cp || pSt.xp > 0)) { localStorage.setItem('onboarded','true'); setOnboarded(true); }
      } else { setName(user.d); }
      if (isNew) setScr('welcome');
      else _goPostAuth(true);
      grantFreeAnnual(user.u);
      refreshSub();
    },
    onSignedOut() { setStats(ds); setScr('welcome'); setName(''); setFamData(null); setFamMembers([]); },
    onBeforeSignOut: async () => { if (_syncNowRef.current) return _syncNowRef.current(); },
    applyRemoteProgress: (fp) => _applyRemoteRef.current?.(fp),
    setFamData,
    setSyncReady: _setSyncReady,
    ds,
  });

  // ── PWA install + sync manager (need authScreen from useAuth) ────────────────
  const { showPwaInstall, setShowPwaInstall, showAndroidInstall, setShowAndroidInstall, deferredInstallPrompt, setDeferredInstallPrompt } = usePwaInstall({ authScreen });
  const { doSyncNow, showBackupBanner, setShowBackupBanner } = useSyncManager({
    authUser, authScreen, name, stats, favs, jWords, dchlA, dchlSl,
    setStats, setName, applyRemoteProgress, ds,
    syncNowRef: _syncNowRef,
    setSyncReady: _setSyncReady,
  });

  // ── Screen launchers ────────────────────────────────────────────────────────
  const allCats = useMemo(() => Object.keys(V), []);
  const { resumeLesson, launchAnimLesson, launchMcGame, mcGameComplete, launchFlashcards, launchListening, launchMatch, launchSpeaking, launchPathItem, goBack } = useScreenLauncher({
    setScr, navigate, curEx, sCurEx, currentScreen,
    setStats, award,
    allCats,
    sLt, sLi, sLx, sLs, sLp, sLa, sLsl, sQi,
    sGl, sGp, sGx, sGs, sGa, sGsl,
    setMcInitQ, setMcResultQ, setMcResultScore, setMcMistakes,
    setFcInitPool, setLsInitQ, setMatchInitPool,
    sSi, sSx, sSw, sSr, sSsc,
    setAnimLesson,
  });

  // ── Effects ─────────────────────────────────────────────────────────────────
  // Track retention on every app load (D1/D7/D30 buckets in Firebase Analytics)
  useEffect(() => { trackAppOpen(!!authUser); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Register friend code index once per session when auth is ready
  useEffect(() => {
    if (authUser?.u) fbRegisterFriendCode(authUser.u, authUser.d || name);
  }, [authUser?.u]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep _uidRef current so usePreferences.toggleFav fires fbToggleFavorite
  useEffect(() => { _uidRef.current = authUser?.u || null; }, [authUser]);

  // Q-6: Sync tab + currentScreen on React Router location changes (back/forward)
  useEffect(() => {
    const p = location.pathname;
    const tabForPath = PATH_TO_TAB[p];
    if (tabForPath) { _setTab(tabForPath); _setCurrentScreen('dashboard'); return; }
    if (p && p !== '/' && p !== '/welcome' && p !== '/placement') {
      const scr = p.slice(1);
      const stm = { lesson:'learn',grammar:'learn',padezi:'learn',padezifull:'learn',modal:'learn',tenses:'learn',alphabet:'learn',reading:'learn',read:'learn',readinglist:'learn',readlist:'learn',aspect:'learn',falsefr:'learn',declension:'learn',brzalice:'learn',dialects:'learn',diminutives:'learn',wordform:'learn',colorquirk:'learn',svojmoj:'learn',countries:'learn',professions:'learn',weather:'learn',clothes:'learn',bodydesc:'learn',phonology:'learn',mcgame:'practice',mcresult:'practice',flashcards:'practice',match:'practice',typing:'practice',listening:'practice',speaking:'practice',znam:'practice',boje:'practice',conj:'practice',conjdrill:'practice',unjumble:'practice',prepdrill:'practice',numtime:'practice',wordsprint:'practice',profgender:'practice',comparatives:'practice',future:'practice',sibil:'practice',restaurant:'practice',qwords:'practice',negation:'practice',possess:'practice',coloragree:'practice',opposites:'practice',cityloc:'practice',akudrill:'practice',ordinals:'practice',relpron:'practice',emogender:'practice',verbdrill:'practice',tenseflip:'practice',riddles:'practice',logicquiz:'practice',pronouns:'practice',genderdrill:'practice',sentbuild:'practice',reflexive:'practice',fillstory:'practice',convmatch:'practice',scenes:'practice',storyselect:'practice',story:'practice',proverbs:'practice',idioms:'practice',pitchaccent:'practice',shadowing:'practice',review:'practice',writing:'practice',aspectdrill:'practice',clitic:'practice',numcases:'practice',imperative:'practice',neggen:'practice',collocations:'practice',wordfamilies:'practice',dictation:'practice',proncontrast:'practice',dialogue:'practice',cefrtest:'practice',slang:'practice',region_labin:'croatia',region_bibinje:'croatia',region_hercegovina:'croatia',region_vukovar:'croatia',region_vinkovci:'croatia',region_zagreb:'croatia',region_split:'croatia',region_mostar:'croatia',region_tomislavgrad:'croatia',region_knin:'croatia',cityofday:'croatia',immersion:'croatia',aiconvo:'croatia',crmap:'croatia',history:'croatia',kings:'croatia',grocery:'croatia',recipes:'croatia',roleplay:'croatia',texting:'croatia',friends:'croatia',foodorder:'croatia',transport:'croatia',emergency:'croatia',football:'croatia',popculture:'croatia',practical:'croatia',school:'croatia',basketball:'croatia',gym:'croatia',top100:'croatia',events:'croatia',croatiaathletes:'croatia',baka_summer:'croatia',croatia_today:'croatia',survival_dinner:'croatia',kafic:'croatia',diaspora:'croatia',postcard:'croatia',storymode:'croatia',heritage:'croatia',croatianews:'croatia',phraseofday:'croatia',maja:'croatia',tivicompare:'learn',grammarvideos:'learn',grammarexplainer:'learn',casetransformer:'learn',vocabscenes:'learn',animlesson:'learn',grammarreader:'learn',lifeevents:'croatia',civic:'croatia',easter:'croatia',midsummer:'croatia',domovina:'croatia',bozic:'croatia',cloze:'practice',badges:'profile',leaderboard:'profile',leaderboard_weekly:'profile',family_group:'profile',journal:'profile',favorites:'profile',learnpath:'profile',contact:'profile',certificate:'profile',analytics:'profile',profile:'profile',admin:'profile',privacy:'profile',terms:'profile','grammar-ref':'learn',mistakes:'practice',listeningpath:'practice',grammarmap:'practice',my_words:'practice',speaking_sprint:'practice',ai_listening:'practice',ai_story:'practice',grammar_diagnosis:'learn',micro_lesson:'learn',personas:'croatia',live_tutor:'croatia' };
      _setCurrentScreen(scr);
      if (stm[scr]) _setTab(stm[scr]);
    }
  }, [location.pathname]);

  // Comeback bonus + weekly freeze recharge + pending join code
  useEffect(() => {
    if (authScreen !== 'app') return;
    const lastSeen = localStorage.getItem('lastSeen'); const now = Date.now();
    if (lastSeen && stats.xp > 0) { const diff = now - parseInt(lastSeen,10); if (diff > 86400000 && diff < 7*86400000) { setComebackBonus(true); setTimeout(() => setComebackBonus(false), 4000); } }
    localStorage.setItem('lastSeen', String(now));
    // Streak repair prompt — show when streak broke yesterday and user has enough XP
    if (canRepairStreak() && stats.xp >= 100) { setTimeout(() => setShowStreakRepair(true), 1500); }
    // Weekly freeze recharge
    (function() { const wk=()=>{const d=new Date();const dy=d.getDay()||7;d.setDate(d.getDate()+4-dy);const yr=d.getFullYear();const w=Math.ceil(((d.getTime()-new Date(yr,0,1).getTime())/86400000+1)/7);return`${yr}-W${String(w).padStart(2,'0')}`;};const tw=wk();const lw=localStorage.getItem('nh_freeze_recharge_wk')||'';if(lw!==tw){const pd=new Date();pd.setDate(pd.getDate()-7);const pdy=pd.getDay()||7;pd.setDate(pd.getDate()+4-pdy);const py=pd.getFullYear();const pw=Math.ceil(((pd.getTime()-new Date(py,0,1).getTime())/86400000+1)/7);const pxp=parseInt(localStorage.getItem('nh_week_xp_'+py+'-W'+String(pw).padStart(2,'0'))||'0',10);if(pxp>0)earnFreeze();localStorage.setItem('nh_freeze_recharge_wk',tw);}})();
    if (pendingJoinCode) { try{const u=new URL(window.location.href);u.searchParams.delete('join');window.history.replaceState({},'',u.pathname);}catch(_){} setFamCode(pendingJoinCode);setFamTab('join');setTimeout(()=>setScr('leaderboard'),600);setPendingJoinCode(null); }
    checkNameDay(name);
    scheduleStreakReminder(stats.str || getStreak().count);
  }, [authScreen]); // eslint-disable-line

  // Session expiry guard
  useEffect(() => { if (authScreen !== 'app') return undefined; const iv = setInterval(() => { if (isSessionExpired()) doOut(); }, 5*60*1000); return () => clearInterval(iv); }, [authScreen]); // eslint-disable-line
  // Touch session on user interaction
  useEffect(() => { if (authScreen !== 'app') return undefined; const h = () => touchSession(); window.addEventListener('click',h); window.addEventListener('touchstart',h); window.addEventListener('keydown',h); return () => { window.removeEventListener('click',h); window.removeEventListener('touchstart',h); window.removeEventListener('keydown',h); }; }, [authScreen]);

  // Auto-save to localStorage on every state change (Firebase handled by useSyncManager)
  useEffect(() => {
    if (!authUser || authScreen !== 'app') return;
    const snap = buildProgressSnapshot({ uid: authUser.u, name, stats, dchlA, dchlSl, favs, jWords });
    try { localStorage.setItem('uP_' + authUser.u, JSON.stringify(snap)); } catch (e) { console.warn('localStorage quota:', e); }
    touchSession();
  }, [stats, currentScreen, name, authUser, authScreen, jWords, favs, dchlA, dchlSl]); // eslint-disable-line

  // Sync to Firebase on lesson/grammar completion
  useEffect(() => { if (!authUser || authScreen !== 'app' || stats.lc === 0) return; doSyncNow(); scheduleStreakReminder(getStreak().count); }, [stats.lc, stats.ct?.length, stats.gc]); // eslint-disable-line

  // Self-healing: reconstruct ct from LEARN_PATH if lost
  useEffect(() => {
    if (!authUser || authScreen !== 'app' || stats.lc === 0 || stats.ct.length > 0) return;
    const recovered = [];
    for (const lv of LEARN_PATH) { for (const it of lv.items) { if (it.topic && recovered.length < stats.lc) recovered.push(it.topic); } }
    if (recovered.length > 0) setStats(prev => ({ ...prev, ct: [...new Set([...prev.ct,...recovered])] }));
  }, [authScreen, authUser, stats.lc, stats.ct.length]); // eslint-disable-line

  // Show new-placement for brand-new zero-progress users
  useEffect(() => {
    if (authScreen !== 'app') return undefined;
    if (currentScreen === 'welcome' || currentScreen === 'placement' || currentScreen === 'new-placement') return undefined;
    if (stats.lc === 0 && stats.xp === 0 && !localStorage.getItem('placement_done') && !localStorage.getItem('nh_placement_done') && !localStorage.getItem('onboarded')) {
      const t = setTimeout(() => setScr('new-placement'), 1200);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [authScreen, stats.lc, stats.xp, currentScreen]); // eslint-disable-line

  // Weekly digest (Sunday only)
  useEffect(() => {
    if (!authUser) return;
    const today = new Date(); if (today.getDay() !== 0) return;
    const k = 'nh_digest_' + authUser.u + '_' + today.toISOString().slice(0,10);
    if (localStorage.getItem(k)) return;
    localStorage.setItem(k, '1');
    fetch('/api/digest', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ userId:authUser.u, email:authUser.e, name:authUser.d||'Learner' }) }).catch(() => {});
  }, [authUser]);

  // Push notifications + free annual grant + uidRef sync
  useEffect(() => { if (!authUser) return; import('./lib/pushNotifications.js').then(({registerMessagingServiceWorker,registerPushWithServer}) => { registerMessagingServiceWorker().catch(()=>{}); if(typeof Notification!=='undefined'&&Notification.permission==='granted')registerPushWithServer({streak:getStreak().count,name:name||authUser.d||''}).catch(()=>{}); }); }, [authUser?.u]); // eslint-disable-line
  useEffect(() => { if (authUser?.u) grantFreeAnnual(authUser.u); }, [authUser?.u]); // eslint-disable-line

  // Lesson resume persistence
  useEffect(() => { if (currentScreen !== 'lesson' || !lt) return; try { localStorage.setItem('nh_lesson_resume', JSON.stringify({ topic:lt, phase:lp, ts:Date.now() })); } catch (_) {} }, [currentScreen, lt, lp]);

  // curEx persistence → last exercise + journey milestones
  useEffect(() => {
    if (!curEx) return;
    const LABELS = { mcgame:'Quiz',flashcards:'Flashcards',match:'Match Pairs',typing:'Typing',listening:'Listening',speaking:'Speaking',wordsprint:'Word Sprint',review:'SRS Review',writing:'Free Writing',znam:'Translate',unjumble:'Word Order',prepdrill:'Prepositions',numtime:'Numbers & Time',grammar:'Grammar',tenses:'Tenses',padezi:'Cases',padezifull:'Padeži Master',conjdrill:'Conjugation',aspect:'Verb Aspect',modal:'Modal Verbs',declension:'Declension',dialogue:'Dialogue Sim',shadowing:'Shadowing',cefrtest:'CEFR Test',dictation:'Dictation',roleplay:'Role-Play',readlist:'Reading',idioms:'Idioms',proverbs:'Proverbs' };
    const label = LABELS[curEx] || (curEx.startsWith('vocab_') ? curEx.replace('vocab_','').replace(/_/g,' ') + ' vocab' : curEx);
    localStorage.setItem('nh_last_ex', curEx);
    localStorage.setItem('nh_last_ex_label', label);
    if (curEx === 'speaking' && !localStorage.getItem('nh_journey_first_speaking')) { localStorage.setItem('nh_journey_first_speaking','1'); recordJourneyMilestone('first_speaking', {}); }
  }, [curEx]);

  // Daily snapshot for progress charts
  useEffect(() => {
    if (!authUser || authScreen !== 'app' || stats.xp === 0) return;
    const today = new Date().toISOString().slice(0,10);
    try { const h=JSON.parse(localStorage.getItem('progress_history')||'[]');const i=h.findIndex(x=>x.date===today);const s={date:today,xp:stats.xp,lc:stats.lc,gc:stats.gc};if(i>=0)h[i]=s;else h.push(s);localStorage.setItem('progress_history',JSON.stringify(h.slice(-90))); } catch (_) {}
  }, [stats.xp, authUser, authScreen]); // eslint-disable-line

  // Premium welcome banner
  useEffect(() => {
    if (authScreen !== 'app' || !authUser) return undefined;
    if (localStorage.getItem('nh_premium_welcome_shown')) return undefined;
    const t = setTimeout(() => { const {isFreeAnnual} = getSubscriptionStatus(); if (isFreeAnnual) setShowPremiumWelcome(true); }, 2500);
    return () => clearTimeout(t);
  }, [authScreen, authUser?.u]); // eslint-disable-line

  // Page title
  useEffect(() => { document.title = currentScreen && currentScreen !== 'home' && currentScreen !== 'dashboard' ? `${currentScreen.replace(/_/g,' ')} · Naša Hrvatska` : 'Naša Hrvatska — Learn Croatian'; }, [currentScreen]);

  // ── Derived values ──────────────────────────────────────────────────────────
  function _goPostAuth(hasProgress) {
    if (!hasProgress) { setScr('welcome'); return; }
    const ip = _initialPath.current; _initialPath.current = '/';
    const tbp = {'/learn':'learn','/practice':'practice','/croatia':'croatia','/profile':'profile'};
    if (tbp[ip]) { _setTab(tbp[ip]); _setCurrentScreen('dashboard'); return; }
    setScr('dashboard');
  }
  const _initialPath = useRef(window.location.pathname);
  const getWeekStats = useCallback(() => { const sr=getSR(); const weak=Object.values(sr).filter(v=>v.w>v.r).length; const strong=Object.values(sr).filter(v=>v.r>v.w).length; return{lessons:stats.lc,grammar:stats.gc,streak:getStreak().count,weak,strong}; }, [stats]);
  const level = useMemo(() => lvl(stats.xp), [stats.xp]);
  const daysSinceJoin = useMemo(() => getDaysSinceJoin(authUser), [authUser]);
  const isNewUserWindow = daysSinceJoin !== null && daysSinceJoin >= 1 && daysSinceJoin <= 10;
  const badges = useMemo(() => ({ home:0,learn:0,practice:getDueReviews().length,croatia:0,profile:0 }), []);
  const doSidebarSearch = useCallback(() => { if (srchQ.trim()) { doSearch(srchQ); setSrchOpen(true); } }, [srchQ, doSearch, setSrchOpen]);
  const ctxValue = useMemo(() => ({ authScreen,authUser,au:authUser,name,setName,doOut,darkMode,setDarkMode,favs,toggleFav,isFav,setScr,goBack,tab,setTab,jWords,setJWords,famData,setFamData,sCurEx,st:stats,stats,setStats,level,award }), [authScreen,authUser,name,setName,doOut,darkMode,setDarkMode,favs,toggleFav,isFav,setScr,goBack,tab,setTab,jWords,setJWords,famData,setFamData,sCurEx,stats,setStats,level,award]);
  const statsValue = useMemo(() => ({ stats,setStats,award,level }), [stats,setStats,award,level]);
  const _weeklyXP = (() => { try{const d=new Date();const dy=d.getDay()||7;d.setDate(d.getDate()+4-dy);const yr=d.getFullYear();const wk=Math.ceil(((d.getTime()-new Date(yr,0,1).getTime())/86400000+1)/7);return parseInt(localStorage.getItem('nh_week_xp_'+yr+'-W'+String(wk).padStart(2,'0'))||'0',10);}catch{return 0;} })();

  // ── Auth screens ────────────────────────────────────────────────────────────
  if (authScreen === 'loading') return (
    <div className={darkMode ? 'dark' : ''} style={{ minHeight:'100vh',background:'linear-gradient(160deg,#030c1a 0%,#071830 30%,#0a2848 60%,#0c3562 100%)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:"'Outfit',sans-serif",position:'relative',overflow:'hidden' }}>
      <div style={{position:'absolute',inset:0,backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Crect width='16' height='16' fill='rgba(212,0,48,0.045)'/%3E%3Crect x='16' y='16' width='16' height='16' fill='rgba(212,0,48,0.045)'/%3E%3C/svg%3E")`,pointerEvents:'none'}}/>
      <div style={{position:'absolute',top:'-30%',left:'50%',transform:'translateX(-50%)',width:'80vw',height:'60vh',background:'radial-gradient(ellipse at center,rgba(14,116,144,.22) 0%,transparent 70%)',pointerEvents:'none'}}/>
      <div style={{textAlign:'center',animation:'rise .55s ease',position:'relative',zIndex:1}}>
        <div style={{display:'flex',justifyContent:'center',marginBottom:28,animation:'grb-glow 2.5s ease-in-out infinite',filter:'drop-shadow(0 0 20px rgba(14,116,144,.5))'}}>
          <CroatianGrb size={108} />
        </div>
        <div style={{fontSize:13,fontWeight:800,color:'rgba(255,255,255,.55)',letterSpacing:'.35em',textTransform:'uppercase',marginBottom:5}}>Naša Hrvatska</div>
        <div style={{fontSize:12,fontWeight:500,color:'rgba(255,255,255,.35)',letterSpacing:'.18em',textTransform:'uppercase',marginBottom:36}}>Learn Croatian</div>
        <div style={{display:'flex',gap:9,justifyContent:'center'}}>
          {[0,1,2].map(i => <div key={i} style={{width:8,height:8,borderRadius:'50%',background:'rgba(14,116,144,.85)',animation:`dot-bounce 1.4s ease-in-out ${i*0.18}s infinite`}}/>)}
        </div>
      </div>
      <div style={{position:'absolute',bottom:0,left:0,right:0,height:4,display:'flex',animation:'stripe-slide .9s ease .3s both'}}>
        <div style={{flex:1,background:'#D40030'}}/><div style={{flex:1,background:'rgba(255,255,255,.9)'}}/><div style={{flex:1,background:'#003DA5'}}/>
      </div>
    </div>
  );
  if (authScreen === 'login' || authScreen === 'register') return <LoginScreen authScreen={authScreen} authError={authError} authLoading={authLoading} authEmail={authEmail} pw={pw} pc={pc} displayName={displayName} sp={sp} setAuthScreen={setAuthScreen} setAuthError={setAuthError} setAuthEmail={setAuthEmail} setPw={setPw} setPc={setPc} setDisplayName={setDisplayName} setSp2={setSp2} setRpEm={setRpEm} doLog={doLog} doReg={doReg} doGoogleLogin={doGoogleLogin} />;
  if (authScreen === 'reset') return <ResetPassword authError={authError} authLoading={authLoading} rpEm={rpEm} setAuthScreen={setAuthScreen} setAuthError={setAuthError} setRpEm={setRpEm} doReset={doReset} />;

  // ── Main app ────────────────────────────────────────────────────────────────
  return (
    <AppContext.Provider value={ctxValue}>
    <StatsProvider value={statsValue}>
    <div className={darkMode ? 'dark' : ''} style={darkMode ? BG_DARK : BG_LIGHT}>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      {authScreen === 'app' && currentScreen !== 'welcome' && currentScreen !== 'placement' && (
        <Sidebar tab={tab} setTab={setTab} setScr={setScr} name={name} level={level} st={stats} darkMode={darkMode} setDarkMode={setDarkMode} badges={badges} srchQ={srchQ} setSrchQ={setSrchQ} onSearch={doSidebarSearch} doOut={doOut} />
      )}
      <div className="app-content" id="main-content" role="main">
      <Suspense fallback={<div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh'}}><div style={{textAlign:'center'}}><div style={{display:'flex',justifyContent:'center',gap:0,marginBottom:16,borderRadius:3,overflow:'hidden',width:54,margin:'0 auto 16px'}}><div style={{height:6,flex:1,background:'#D4002D'}}/><div style={{height:6,flex:1,background:'#F5F5F5'}}/><div style={{height:6,flex:1,background:'#003DA5'}}/></div><div style={{fontSize:13,fontWeight:800,color:'var(--subtext)',letterSpacing:'.1em',textTransform:'uppercase',opacity:.6}}>Naša Hrvatska</div></div></div>}>
        <XPPopup showXP={showXP} xpA={xpA} />
        <BadgeToast show={sB} badge={nB} />
        <AppModals
          showCelebration={showCelebration} setShowCelebration={setShowCelebration} celebXP={celebXP}
          streakMilestone={streakMilestone} setStreakMilestone={setStreakMilestone}
          ceremonyType={ceremonyType} setCeremonyType={setCeremonyType}
          levelUpData={levelUpData} setLevelUpData={setLevelUpData}
          showFirstWords={showFirstWords} setShowFirstWords={setShowFirstWords}
          onboarded={onboarded} setOnboarded={setOnboarded}
          _syncReady={_syncReady} authScreen={authScreen} currentScreen={currentScreen}
          showPaywall={showPaywall} setShowPaywall={setShowPaywall} paywallFeature={paywallFeature} refreshSub={refreshSub}
          showPremiumWelcome={showPremiumWelcome} setShowPremiumWelcome={setShowPremiumWelcome}
          stats={stats} lt={lt} setScr={setScr} setTab={setTab} name={name}
        />
        <AppToasts
          comebackBonus={comebackBonus} freezeUsedToast={freezeUsedToast}
          earnBackPrompt={earnBackPrompt} streakRestoredCount={streakRestoredCount} ttsFailedToast={ttsFailedToast}
          streakRepairAvailable={showStreakRepair}
          onRepairStreak={(action) => {
            if (action === 'dismiss') { setShowStreakRepair(false); return; }
            if (action === 'repair') {
              const result = repairStreak(stats.xp);
              if (result.ok) {
                setStats(s => ({ ...s, xp: Math.max(0, s.xp - result.xpCost), streak: result.restoredCount }));
                setStreakRestoredCount(result.restoredCount);
                setTimeout(() => setStreakRestoredCount(0), 5000);
              }
              setShowStreakRepair(false);
            }
          }}
          showAndroidInstall={showAndroidInstall} setShowAndroidInstall={setShowAndroidInstall} deferredInstallPrompt={deferredInstallPrompt}
          showPwaInstall={showPwaInstall} setShowPwaInstall={setShowPwaInstall}
          showBackupBanner={showBackupBanner} setShowBackupBanner={setShowBackupBanner}
          isFreeAnnual={isFreeAnnual} daysLeft={daysLeft} setShowPaywall={setShowPaywall}
          emailUnverified={emailUnverified} setEmailUnverified={setEmailUnverified} resendVerification={resendVerification}
        />
        <AppRouter
          currentScreen={currentScreen} goBack={goBack} setScr={setScr} setTab={setTab}
          authUser={authUser} authScreen={authScreen} name={name} setName={setName}
          level={level} stats={stats} setStats={setStats} award={award}
          isPremium={isPremium} refreshSub={refreshSub}
          srchQ={srchQ} setSrchQ={setSrchQ} srchR={srchR} srchOpen={srchOpen} setSrchOpen={setSrchOpen} doSearch={doSearch}
          tDir={tDir} sTDir={sTDir} tIn={tIn} sTIn={sTIn} tOut={tOut} tL={tL} doTr={doTr}
          tab={tab}
          famData={famData} setFamData={setFamData} famMembers={famMembers} setFamMembers={setFamMembers}
          famLoading={famLoading} setFamLoading={setFamLoading} famName={famName} setFamName={setFamName}
          famCode={famCode} setFamCode={setFamCode} famErr={famErr} setFamErr={setFamErr}
          famTab={famTab} setFamTab={setFamTab}
          dchlA={dchlA} sDchlA={sDchlA} dchlSl={dchlSl} sDchlSl={sDchlSl}
          setJWords={setJWords} favs={favs} toggleFav={toggleFav}
          icons={ICONS} allCats={allCats} getWeekStats={getWeekStats}
          isNewUserWindow={isNewUserWindow} daysSinceJoin={daysSinceJoin} comebackBonus={comebackBonus}
          resumeLesson={resumeLesson} launchPathItem={launchPathItem} launchAnimLesson={launchAnimLesson}
          launchMcGame={launchMcGame} mcGameComplete={mcGameComplete}
          launchFlashcards={launchFlashcards} launchListening={launchListening}
          launchMatch={launchMatch} launchSpeaking={launchSpeaking}
          _syncReady={_syncReady} doSyncNow={doSyncNow}
          setPlacementQ={setPlacementQ} setPlacementIdx={setPlacementIdx}
          setPlacementScore={setPlacementScore} setPlacementAnswers={setPlacementAnswers}
          setPlacementXp={setPlacementXp} getPlacementCt={getPlacementCt}
          setShowFirstWords={setShowFirstWords} _weeklyXP={_weeklyXP}
          lt={lt} li={li} lx={lx} ls={ls} lp={lp} la={la} lsl={lsl} qi={qi}
          sLt={sLt} sLi={sLi} sLx={sLx} sLs={sLs} sLp={sLp} sLa={sLa} sLsl={sLsl} sQi={sQi}
          gl={gl} gx={gx} gp={gp} gs={gs} ga={ga} gsl={gsl}
          sGl={sGl} sGp={sGp} sGx={sGx} sGs={sGs} sGa={sGa} sGsl={sGsl}
          matchInitPool={matchInitPool}
          mcInitQ={mcInitQ} mcResultQ={mcResultQ} mcResultScore={mcResultScore} mcMistakes={mcMistakes}
          rp={rp} rph={rph} rqi={rqi} rsc={rsc} ra={ra} rsl={rsl} hw={hw}
          sRp={sRp} sRph={sRph} sRqi={sRqi} sRsc={sRsc} sRa={sRa} sRsl={sRsl} sHw={sHw}
          sw={sw} si={si} sx={sx} sr={sr} ssc={ssc}
          sSw={sSw} sSr={sSr} sSx={sSx} sSi={sSi} sSsc={sSsc}
          animLesson={animLesson} fcInitPool={fcInitPool} lsInitQ={lsInitQ}
          curEx={curEx} sCurEx={sCurEx} doOut={doOut}
          requirePremium={requirePremium}
        />
        {authScreen === 'app' && currentScreen !== 'welcome' && currentScreen !== 'placement' && <TabBar tab={tab} setTab={setTab} setScr={setScr} badges={badges} />}
        {authScreen === 'app' && <AmbientPlayer />}
        <OfflineBanner />
        <CookieConsent />
      </Suspense>
      </div>
    </div>
    </StatsProvider>
    </AppContext.Provider>
  );
}

export default App;
