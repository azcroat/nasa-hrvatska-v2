import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense, useReducer } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { BG_LIGHT, BG_DARK, lvl, getStreak, earnFreeze, recordJourneyMilestone } from "./lib/appUtils.js";
import { touchSession, isSessionExpired } from "./lib/firebase.js";
import { getSR, saveSR, getDueReviews } from "./lib/srs.js";
import { buildProgressSnapshot } from "./lib/progressSnapshot.js";
import { localDateStr, weekKey } from "./lib/dateUtils.js";
import { canRepairStreak, repairStreak } from "./lib/streak.js";
import { trackAppOpen } from "./lib/analytics.js";
import { fbRegisterFriendCode } from "./lib/firebase.js";
import { submitWeeklyXP } from "./lib/leaderboard.js";
import AppContext from "./context/AppContext.jsx";
import { StatsProvider } from "./context/StatsContext.jsx";

import { usePreferences } from "./hooks/usePreferences.js";
import { useSearch } from "./hooks/useSearch.js";
import { useAuth } from "./hooks/useAuth.js";
import { useFamily } from "./hooks/useFamily.js";
import { useJournal } from "./hooks/useJournal.js";
import { useDaily } from "./hooks/useDaily.js";
import { useNotifications, checkNameDay, scheduleStreakReminder } from "./hooks/useNotifications.js";
import { useSubscription, grantFreeAnnual, getSubscriptionStatus } from "./hooks/useSubscription.js";
import { useAppScreenState } from "./hooks/useAppScreenState.js";
import { useAward, resetComebackGuard } from "./hooks/useAward.js";
import { statsReducer } from "./lib/statsReducer.js";
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
import KnightCompanion from "./components/shared/KnightCompanion.jsx";
import AppRouter from "./components/AppRouter.jsx";

// ── Module-level constants ───────────────────────────────────────────────────
// All vocabulary category keys (V base keys + TOP100 keys from content.jsx).
// Hardcoded to avoid importing chunk-data at startup — update if vocabulary.js keys change.
const ALL_CATS = ["greetings","numbers","family","inlaws","colors","months","directions","shopping","conjunctions","culture","daily routine","in the classroom","commands at home","fairy tales","hobbies","health","zagreb","animals","body & face","home & rooms","clothing","weather & seasons","time & calendar","transport","questions","restaurant","places","adjectives","emotions","opposites","comparatives","professions","travel","food","kafic","verbs","fruits","vegetables","sports","holidays","imendan","personality","work","opinions","environment","society","civic","life_events","easter","At the Airport","At the Restaurant","At the Doctor","At the Beach","At the Market","Meeting People","Emergency"];
/** @type {import('./types/index.js').Stats} */
const DS = { xp:0,str:1,diff:'beginner',lc:0,pf:0,gc:0,sp:0,de:0,rc:0,authLoading:0,mv:0,hi:0,rs:[],ct:[],vs:[],badges:[] };
const ICONS = { greetings:"👋",numbers:"🔢",family:"👨‍👩‍👧‍👦",food:"🍕",animals:"🐾",body:"🦴","body & face":"🦴",colors:"🎨",home:"🏠","home & rooms":"🏠",clothing:"👔",weather:"☀️","weather & seasons":"☀️",places:"📍",transport:"🚗",verbs:"💬",adjectives:"📏",time:"📅","time & calendar":"📅",months:"🗓️",directions:"🧭",emotions:"💭",professions:"💼",restaurant:"🍽️",shopping:"🛍️",travel:"✈️",health:"🏥",questions:"❓",conjunctions:"🔗",culture:"🏛️","daily routine":"🌅","in the classroom":"📖","commands at home":"🏡","fairy tales":"📜",hobbies:"🎯",zagreb:"🏙️",opposites:"🔄",comparatives:"📊",fruits:"🍎",vegetables:"🥦",sports:"⚽",holidays:"🎄",personality:"😊" };
const TAB_PATHS = { home:"/",learn:"/learn",practice:"/practice",croatia:"/croatia",profile:"/profile" };
const PATH_TO_TAB = { "/":"home","/learn":"learn","/practice":"practice","/croatia":"croatia","/profile":"profile" };

function getDaysSinceJoin(authUser) {
  if (!authUser) return null;
  try {
    const k = 'nh_join_date_' + (authUser.u || authUser.uid || '');
    if (!localStorage.getItem(k)) localStorage.setItem(k, Date.now().toString());
    return Math.floor((Date.now() - parseInt(localStorage.getItem(k) || '0', 10)) / 86400000);
  } catch {
    return null; // private browsing or quota exceeded
  }
}
function pruneStaleLocalStorage() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const del = [];
    // Use Object.keys for more efficient iteration
    const keys = Object.keys(localStorage);
    for (const k of keys) {
      if (/^nh_quest_.+_\d{4}-\d{2}-\d{2}$/.test(k) && !k.endsWith(today)) del.push(k);
      else if (/^nh_week_xp_/.test(k)) {
        // Keep last 4 weeks
        const kDate = k.replace('nh_week_xp_', '');
        const fourWeeksAgo = new Date(); fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
        if (kDate < fourWeeksAgo.toISOString().slice(0, 10).replace(/-\d{2}$/, '')) del.push(k);
      }
      else if (/^nh_comeback_used_\d{4}-\d{2}-\d{2}$/.test(k) && !k.endsWith(today)) del.push(k);
      else if (/^nh_pruned_\d{4}-\d{2}-\d{2}$/.test(k) && !k.endsWith(today)) del.push(k);
    }
    del.forEach(k => { try { localStorage.removeItem(k); } catch {} });
    // Prune SRS cards with due timestamps > 2 years in the past (abandoned words)
    try {
      const sr = JSON.parse(localStorage.getItem('nh_sr') || '{}');
      const twoYearsAgo = Date.now() - 730 * 86400000;
      let pruned = false;
      for (const word in sr) {
        if (sr[word].due && sr[word].due < twoYearsAgo) { delete sr[word]; pruned = true; }
      }
      if (pruned) localStorage.setItem('nh_sr', JSON.stringify(sr));
    } catch {}
    localStorage.setItem('nh_pruned_' + today, '1');
  } catch {}
}

// ── App component ────────────────────────────────────────────────────────────
function App() {
  const { isPremium, isFreeAnnual, daysLeft, refresh: refreshSub } = useSubscription();
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState('AI Tutor');
  const requirePremium = useCallback(function requirePremium(featureName, action) { if (isPremium) { action(); return; } setPaywallFeature(featureName); setShowPaywall(true); }, [isPremium, setPaywallFeature, setShowPaywall]);

  const navigate = useNavigate();
  const location = useLocation();
  const ds = DS;

  // Bootstrap + TTS failure toast (must be before useAward declares setTtsFailedToast)
  useEffect(() => {
    const t = setTimeout(() => import('./data.jsx').then(m => m.bootstrapMistakesFromSRS()), 500);
    // Defer localStorage cleanup to idle time — don't block app startup
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(pruneStaleLocalStorage, { timeout: 5000 });
    } else {
      setTimeout(pruneStaleLocalStorage, 2000);
    }
    const onTtsFailed = () => { setTtsFailedToast(true); setTimeout(() => setTtsFailedToast(false), 2500); };
    window.addEventListener('nh:tts-failed', onTtsFailed);
    return () => { clearTimeout(t); window.removeEventListener('nh:tts-failed', onTtsFailed); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- intentional: one-time setup at mount; TTS listener closure is registered fresh each time the event fires

  // ── Core state ──────────────────────────────────────────────────────────────
  const [currentScreen, _setCurrentScreen] = useState('welcome');
  const setScr = useCallback((s) => {
    _setCurrentScreen(s);
    if (s === 'welcome' || s === 'placement' || s === 'new-placement') return;
    navigate(s === 'dashboard' ? '/' : `/${s}`, { replace: false });
  }, [navigate]);
  const [name, setName] = useState('');
  const [stats, dispatch] = useReducer(statsReducer, DS);
  const setStats = useCallback(
    (fnOrValue) => dispatch(typeof fnOrValue === 'function'
      ? { type: 'APPLY', payload: fnOrValue }
      : { type: 'RESET', payload: fnOrValue }),
    []
  );
  const [showStreakRepair, setShowStreakRepair] = useState(false);
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem('onboarded') === 'true');
  const [showFirstWords, setShowFirstWords] = useState(false);
  const [showPremiumWelcome, setShowPremiumWelcome] = useState(false);
  const [pendingJoinCode, setPendingJoinCode] = useState(() => { try { const c = new URLSearchParams(window.location.search).get('join') || null; if (c && /^[A-Z2-9]{6}$/.test(c)) { const u = new URL(window.location.href); u.searchParams.delete('join'); window.history.replaceState({}, '', u.toString()); return c; } return null; } catch { return null; } });
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
  const _uidRef = useRef(/** @type {string | null} */(null));
  const { darkMode, setDarkMode, favs, setFavs, toggleFav, isFav } = usePreferences(_uidRef);
  const { srchQ, setSrchQ, srchR, srchOpen, setSrchOpen, doSearch } = useSearch();

  // ── Award / gamification ────────────────────────────────────────────────────
  const { award, comebackBonus, setComebackBonus, showCelebration, setShowCelebration, celebXP, setCelebXP, streakMilestone, setStreakMilestone, ceremonyType, setCeremonyType, levelUpData, setLevelUpData, freezeUsedToast, setFreezeUsedToast, earnBackPrompt, setEarnBackPrompt, streakRestoredCount, setStreakRestoredCount, ttsFailedToast, setTtsFailedToast, showXP, xpA, nB, sB } = useAward({ curEx, stats, setStats });

  // ── applyRemoteProgress: merge Firestore snapshot into local state ──────────
  // Defined before useAuth so it can be passed to onSignedIn.
  const applyRemoteProgress = useCallback((fp) => {
    if (!fp) return;
    const _d = new Date();
    const today = _d.getFullYear() + '-' + String(_d.getMonth() + 1).padStart(2, '0') + '-' + String(_d.getDate()).padStart(2, '0');
    const apSt = fp.stats || fp.st || {};
    if (fp.onboarded || fp.cp || apSt.xp > 0) { localStorage.setItem('onboarded', 'true'); setOnboarded(true); }
    if (fp.sr) { const lSR = getSR() || {}; const mSR = { ...lSR }; for (const w in fp.sr) { const r = fp.sr[w]; const l = mSR[w]; if (!l || (r.r||0) > (l.r||0) || (!l.r && (r.s||0) > (l.s||0))) mSR[w] = r; } saveSR(mSR); }
    if (fp.streak) { let lSt = { count:0,last:'' }; try { lSt = JSON.parse(localStorage.getItem('uStreak')||'{"count":0,"last":""}'); } catch (_) {} const _yd=new Date();_yd.setDate(_yd.getDate()-1);const yesterday=_yd.getFullYear()+'-'+String(_yd.getMonth()+1).padStart(2,'0')+'-'+String(_yd.getDate()).padStart(2,'0'); const fpLast=fp.streak.last||''; const fpStreakActive=fpLast===today||fpLast===yesterday; if(fpStreakActive&&(fp.streak.count||0)>(lSt.count||0)){localStorage.setItem('uStreak',JSON.stringify(fp.streak));} /* Expired Firebase streaks are never restored — prevents months-old streak appearing active */ }
    if (fp.freezes !== undefined) { const lF = parseInt(localStorage.getItem('uFreeze')||'0',10); localStorage.setItem('uFreeze', String(Math.max(lF, Math.max(0, parseInt(fp.freezes,10)||0)))); }
    if (fp.favs) { let lFv = []; try { lFv = JSON.parse(localStorage.getItem('uFavs')||'[]'); } catch (_) {} const favMap = new Map(); [...lFv, ...fp.favs].forEach(f => { if (f && f.hr) favMap.set(f.hr, f); }); const mFv = [...favMap.values()]; try { localStorage.setItem('uFavs', JSON.stringify(mFv)); } catch (e) { if (e && e.name === 'QuotaExceededError') { console.warn('[sync] localStorage quota exceeded — some progress may not persist locally'); } } setFavs(mFv); }
    if (fp.journal) { let lJ = []; try { lJ = JSON.parse(localStorage.getItem('uJournal')||'[]'); } catch (_) {} const jM = new Map(); lJ.forEach(e => { if (e?.word) jM.set(e.word, e); }); fp.journal.forEach(e => { if (e?.word) jM.set(e.word, e); }); const mJ = Array.from(jM.values()); try { localStorage.setItem('uJournal', JSON.stringify(mJ)); } catch (e) { if (e && e.name === 'QuotaExceededError') { console.warn('[sync] localStorage quota exceeded — some progress may not persist locally'); } } setJWords(mJ); }
    if (fp.dc?.day === today) { const ans = fp.dc.answered||[false,false,false]; const sel = Array.isArray(fp.dc.selected)&&typeof fp.dc.selected[0]==='string'?fp.dc.selected:['','','']; let lA=[false,false,false]; try { const ld=JSON.parse(localStorage.getItem('dcDay3')||'{}'); if(ld.day===today) lA=ld.answered||lA; } catch(_){} const mA=ans.map((a,i)=>a||lA[i]||false); sDchlA(mA); sDchlSl(sel); localStorage.setItem('dcDay3',JSON.stringify({day:today,answered:mA,selected:sel})); }
    if (fp.cooldown) { let cd={}; try{cd=JSON.parse(localStorage.getItem('xpCooldown')||'{}');}catch(_){} for(const k in fp.cooldown){if(fp.cooldown[k]===today)cd[k]=fp.cooldown[k];} localStorage.setItem('xpCooldown',JSON.stringify(cd)); }
    if (fp.weekXP !== undefined) { const wD=new Date();const wY=wD.getDay()||7;wD.setDate(wD.getDate()+4-wY);const wy=wD.getFullYear();const wn=Math.ceil(((wD.getTime()-new Date(wy,0,1).getTime())/86400000+1)/7);const wk=wy+'-W'+String(wn).padStart(2,'0');const lX=parseInt(localStorage.getItem('nh_week_xp_'+wk)||'0',10);localStorage.setItem('nh_week_xp_'+wk,String(Math.max(lX,fp.weekXP))); }
    // User settings — restore from Firebase so all devices share preferences
    if (fp.nh_level) localStorage.setItem('nh_level', fp.nh_level);
    if (fp.nh_goal) localStorage.setItem('nh_goal', fp.nh_goal);
    if (fp.nh_culture) localStorage.setItem('nh_culture', fp.nh_culture);
    if (fp.nh_placement_done) { localStorage.setItem('nh_placement_done', 'true'); localStorage.setItem('placement_done', 'true'); }
    if (fp.nh_grammar_track_done) localStorage.setItem('nh_grammar_track_done', 'true');
  }, [setFavs, setJWords, sDchlA, sDchlSl, setOnboarded]);

  // Ref to break the useAuth TDZ cycle for doSyncNow and applyRemoteProgress
  const _syncNowRef = useRef(/** @type {(() => Promise<void>) | null} */(null));
  const _applyRemoteRef = useRef(/** @type {((fp: any) => void) | null} */(null));
  _applyRemoteRef.current = applyRemoteProgress;

  // ── Auth ────────────────────────────────────────────────────────────────────
  const { authScreen, setAuthScreen, authUser, authEmail, setAuthEmail, pw, setPw, pc, setPc, displayName, setDisplayName, sp, setSp2, rpEm, setRpEm, authError, setAuthError, authLoading, emailUnverified, setEmailUnverified, resendVerification, doReg, doLog, doOut, doReset, doGoogleLogin, doGuest: _doGuest } = useAuth({
    onSignedIn({ user, progress, isNew, isHydrate }) {
      if (isHydrate) {
        if (progress) { const st = progress.stats || progress.st || {}; dispatch({ type: 'MERGE_REMOTE', payload: st, ds: DS }); if (progress.name) setName(progress.name); }
        return;
      }
      if (progress) {
        setName(progress.name || user.d);
        const pSt = progress.stats || progress.st || {};
        dispatch({ type: 'MERGE_REMOTE', payload: pSt, ds: DS });
        if (!isNew && (progress.onboarded || progress.cp || pSt.xp > 0)) { localStorage.setItem('onboarded','true'); setOnboarded(true); }
      } else { setName(user.d); }
      if (isNew) setScr('welcome');
      else _goPostAuth(true);
      grantFreeAnnual(user.u);
      refreshSub();
    },
    onSignedOut() {
      dispatch({ type: 'RESET', payload: DS });
      setScr('welcome');
      setName('');
      setFamData(null);
      setFamMembers([]);
      setFavs([]);
      setJWords([]);
      resetComebackGuard();
      // Clear exercise session state so the next user doesn't see a stale "resume" prompt
      try { sessionStorage.clear(); } catch {}
    },
    onBeforeSignOut: async () => { if (_syncNowRef.current) return _syncNowRef.current(); },
    applyRemoteProgress: (fp) => _applyRemoteRef.current?.(fp),
    setFamData,
    setSyncReady: _setSyncReady,
  });

  // ── Push notifications (must be after useAuth so authUser.u is available) ─────
  useNotifications({ userId: authUser?.u || '' });

  // Guest mode — bypass auth and go straight to dashboard
  const doGuest = useCallback(() => { _doGuest(); setTimeout(() => setScr('dashboard'), 50); }, [_doGuest, setScr]);

  // ── PWA install + sync manager (need authScreen from useAuth) ────────────────
  const { showPwaInstall, setShowPwaInstall, showAndroidInstall, setShowAndroidInstall, deferredInstallPrompt, setDeferredInstallPrompt } = usePwaInstall({ authScreen });
  const { doSyncNow, showBackupBanner, setShowBackupBanner, syncError, setSyncError } = useSyncManager({
    authUser, authScreen, name, stats, favs, jWords, dchlA, dchlSl,
    setStats, setName, applyRemoteProgress, ds,
    syncNowRef: _syncNowRef,
    setSyncReady: _setSyncReady,
  });

  // ── Screen launchers ────────────────────────────────────────────────────────
  const allCats = ALL_CATS;
  const { resumeLesson, launchAnimLesson, launchMcGame, mcGameComplete, launchFlashcards, launchListening, launchMatch, launchSpeaking, launchPathItem, goBack } = useScreenLauncher({
    setScr, navigate, curEx, sCurEx, currentScreen,
    setStats, award,
    allCats,
    tab, setTab,
    sLt, sLi, sLx, sLs, sLp, sLa, sLsl, sQi,
    sGl, sGp, sGx, sGs, sGa, sGsl,
    setMcInitQ, setMcResultQ, setMcResultScore, setMcMistakes,
    setFcInitPool, setLsInitQ, setMatchInitPool,
    sSi, sSx, sSw, sSr, sSsc,
    setAnimLesson,
  });

  // ── Effects ─────────────────────────────────────────────────────────────────
  // Track retention on every app load (D1/D7/D30 buckets in Firebase Analytics)
  useEffect(() => { trackAppOpen(!!authUser); }, []); // eslint-disable-line react-hooks/exhaustive-deps -- intentional: D1/D7/D30 analytics fires once per session on cold load; authUser at mount time is the correct value

  // Register friend code index once per session when auth is ready
  useEffect(() => {
    if (authUser?.u) fbRegisterFriendCode(authUser.u, authUser.d || name);
  }, [authUser?.u]); // eslint-disable-line react-hooks/exhaustive-deps -- intentional: name is stable by the time authUser.u is set; re-registering on every name change would cause unnecessary network chatter

  // Keep _uidRef current so usePreferences.toggleFav fires fbToggleFavorite
  useEffect(() => { _uidRef.current = authUser?.u || null; }, [authUser]);

  // Q-6: Sync tab + currentScreen on React Router location changes (back/forward)
  useEffect(() => {
    const p = location.pathname;
    const tabForPath = PATH_TO_TAB[p];
    if (tabForPath) { _setTab(tabForPath); _setCurrentScreen('dashboard'); return; }
    if (p && p !== '/' && p !== '/welcome' && p !== '/placement') {
      const scr = p.slice(1);
      const stm = { lesson:'learn',grammar:'learn',padezi:'learn',padezifull:'learn',modal:'learn',tenses:'learn',alphabet:'learn',reading:'learn',read:'learn',readinglist:'learn',readlist:'learn',aspect:'learn',falsefr:'learn',declension:'learn',brzalice:'learn',dialects:'learn',diminutives:'learn',wordform:'learn',colorquirk:'learn',svojmoj:'learn',countries:'learn',professions:'learn',weather:'learn',clothes:'learn',bodydesc:'learn',phonology:'learn',mcgame:'practice',mcresult:'practice',flashcards:'practice',match:'practice',typing:'practice',listening:'practice',speaking:'practice',znam:'practice',boje:'practice',conj:'practice',conjdrill:'practice',unjumble:'practice',prepdrill:'practice',numtime:'practice',wordsprint:'practice',profgender:'practice',comparatives:'practice',future:'practice',sibil:'practice',restaurant:'practice',qwords:'practice',negation:'practice',possess:'practice',coloragree:'practice',opposites:'practice',cityloc:'practice',akudrill:'practice',ordinals:'practice',relpron:'practice',emogender:'practice',verbdrill:'practice',tenseflip:'practice',riddles:'practice',logicquiz:'practice',pronouns:'practice',genderdrill:'practice',sentbuild:'practice',reflexive:'practice',fillstory:'practice',convmatch:'practice',scenes:'practice',storyselect:'practice',story:'practice',proverbs:'practice',idioms:'practice',pitchaccent:'practice',shadowing:'practice',review:'practice',writing:'practice',aspectdrill:'practice',clitic:'practice',numcases:'practice',imperative:'practice',neggen:'practice',collocations:'practice',wordfamilies:'practice',dictation:'practice',proncontrast:'practice',dialogue:'practice',cefrtest:'practice',slang:'practice',region_labin:'croatia',region_bibinje:'croatia',region_hercegovina:'croatia',region_vukovar:'croatia',region_vinkovci:'croatia',region_zagreb:'croatia',region_split:'croatia',region_mostar:'croatia',region_tomislavgrad:'croatia',region_knin:'croatia',cityofday:'croatia',immersion:'croatia',aiconvo:'croatia',crmap:'croatia',history:'croatia',kings:'croatia',grocery:'croatia',recipes:'croatia',roleplay:'croatia',texting:'croatia',friends:'croatia',foodorder:'croatia',transport:'croatia',emergency:'croatia',football:'croatia',popculture:'croatia',practical:'croatia',school:'croatia',basketball:'croatia',gym:'croatia',top100:'croatia',events:'croatia',croatiaathletes:'croatia',baka_summer:'croatia',croatia_today:'croatia',survival_dinner:'croatia',kafic:'croatia',diaspora:'croatia',postcard:'croatia',storymode:'croatia',heritage:'croatia',croatianews:'croatia',phraseofday:'croatia',maja:'croatia',tivicompare:'learn',grammarvideos:'learn',grammarexplainer:'learn',casetransformer:'learn',vocabscenes:'learn',animlesson:'learn',grammarreader:'learn',lifeevents:'croatia',civic:'croatia',easter:'croatia',midsummer:'croatia',domovina:'croatia',bozic:'croatia',cloze:'practice',badges:'profile',leaderboard:'profile',leaderboard_weekly:'profile',family_group:'profile',journal:'profile',favorites:'profile',learnpath:'profile',contact:'profile',certificate:'profile',analytics:'profile',profile:'profile',admin:'profile',privacy:'profile',terms:'profile','grammar-ref':'learn',mistakes:'practice',listeningpath:'practice',grammarmap:'practice',my_words:'practice',speaking_sprint:'practice',ai_listening:'practice',ai_story:'practice',grammar_diagnosis:'learn',micro_lesson:'learn',personas:'croatia',live_tutor:'croatia',grammar_track:'learn',listening_comprehension:'practice' };
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
    // Weekly freeze recharge — award a freeze token if the user earned XP last week
    try {
      const thisWeek = weekKey();
      if ((localStorage.getItem('nh_freeze_recharge_wk') || '') !== thisWeek) {
        const lastWeek = weekKey(new Date(Date.now() - 7 * 86400000));
        const lastWeekXP = parseInt(localStorage.getItem('nh_week_xp_' + lastWeek) || '0', 10);
        if (lastWeekXP > 0) earnFreeze();
        localStorage.setItem('nh_freeze_recharge_wk', thisWeek);
      }
    } catch {}
    if (pendingJoinCode) { try{const u=new URL(window.location.href);u.searchParams.delete('join');window.history.replaceState({},'',u.pathname);}catch(_){} setFamCode(pendingJoinCode);setFamTab('join');setTimeout(()=>setScr('leaderboard'),600);setPendingJoinCode(null); }
    checkNameDay(name);
    scheduleStreakReminder(stats.str || getStreak().count);
  }, [authScreen]); // eslint-disable-line react-hooks/exhaustive-deps -- intentional: runs once per auth transition; inner values (stats, name) are read live at trigger time, not stale

  // Session expiry guard
  useEffect(() => { if (authScreen !== 'app') return undefined; const iv = setInterval(() => { if (isSessionExpired()) doOut(); }, 5*60*1000); return () => clearInterval(iv); }, [authScreen]); // eslint-disable-line react-hooks/exhaustive-deps -- intentional: doOut is stable across renders; only needs to re-register on authScreen change
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
  useEffect(() => { if (!authUser || authScreen !== 'app' || stats.lc === 0) return; doSyncNow(); scheduleStreakReminder(getStreak().count); }, [stats.lc, stats.ct?.length, stats.gc, stats.sp]); // eslint-disable-line

  // Post-sync write-back: after _syncReady fires (Firebase data loaded + merged into local state),
  // push the fully-merged snapshot back to Firebase so ALL devices see the best combined data.
  // This is the critical step that was missing: without it, merged streak/SRS/favs/journal
  // only lived in localStorage on this device and never propagated to other devices.
  // Tracks the last authUser.u for which the post-sync write-back fired.
  // Using the uid (not a boolean) means this fires once per user per page load,
  // and resets correctly when the user signs out and signs back in.
  const _postSyncUserRef = useRef(null);
  useEffect(() => {
    if (!_syncReady || !authUser || authScreen !== 'app') return;
    if (_postSyncUserRef.current === authUser.u) return; // already fired for this user
    _postSyncUserRef.current = authUser.u;
    // 2s delay: lets applyRemoteProgress (streak/SRS/favs) finish writing to localStorage
    // before doSyncNow reads those values for the Firebase payload
    const t = setTimeout(() => { doSyncNow(); }, 2000);
    return () => clearTimeout(t);
  }, [_syncReady, authUser, authScreen, doSyncNow]); // eslint-disable-line

  // Sync weekly XP to leaderboard on every XP change (fire-and-forget)
  useEffect(() => {
    if (!authUser || authScreen !== 'app' || stats.xp === 0) return;
    submitWeeklyXP(null, authUser.u, name, stats.xp).catch(() => {});
  }, [stats.xp, authUser, authScreen, name]); // eslint-disable-line

  // Periodic Firebase sync every 5 minutes — catches XP from mini-games that don't trigger lesson sync
  useEffect(() => {
    if (authScreen !== 'app' || !authUser) return undefined;
    const iv = setInterval(() => { doSyncNow(); }, 5 * 60 * 1000);
    return () => clearInterval(iv);
  }, [authScreen, authUser, doSyncNow]);

  // Self-healing: reconstruct ct from LEARN_PATH if lost (lazy-import keeps chunk-data off startup)
  useEffect(() => {
    if (!authUser || authScreen !== 'app' || stats.lc === 0 || stats.ct.length > 0) return;
    import('./data.jsx').then(({ LEARN_PATH }) => {
      const recovered = [];
      for (const lv of LEARN_PATH) { for (const it of lv.items) { if (it.topic && recovered.length < stats.lc) recovered.push(it.topic); } }
      if (recovered.length > 0) setStats(prev => ({ ...prev, ct: [...new Set([...prev.ct,...recovered])] }));
    });
  }, [authScreen, authUser, stats.lc, stats.ct.length]); // eslint-disable-line

  // Show new-placement for brand-new zero-progress users.
  // CRITICAL: gate on _syncReady so we never redirect before Firebase data has loaded.
  // Without this guard, returning users on a new browser get sent to placement because
  // stats start at DS defaults (lc=0) and Firebase may take >1.2s to hydrate.
  useEffect(() => {
    if (authScreen !== 'app') return undefined;
    if (!_syncReady) return undefined; // wait for Firebase to confirm user state
    if (currentScreen === 'welcome' || currentScreen === 'placement' || currentScreen === 'new-placement') return undefined;
    if (stats.lc === 0 && stats.xp === 0 && !localStorage.getItem('placement_done') && !localStorage.getItem('nh_placement_done') && !localStorage.getItem('onboarded')) {
      const t = setTimeout(() => setScr('new-placement'), 1200);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [authScreen, _syncReady, stats.lc, stats.xp, currentScreen]); // eslint-disable-line

  // Weekly digest (Sunday only)
  useEffect(() => {
    if (!authUser) return;
    const today = new Date(); if (today.getDay() !== 0) return;
    const k = 'nh_digest_' + authUser.u + '_' + today.toISOString().slice(0,10);
    if (localStorage.getItem(k)) return;
    localStorage.setItem(k, '1');
    const consent = localStorage.getItem('nh_analytics_consent');
    if (consent === 'true') {
      fetch('/api/digest', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ userId:authUser.u, email:authUser.e, name:authUser.d||'Learner' }) }).catch(() => {});
    }
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
    const today = localDateStr();
    try { const h=JSON.parse(localStorage.getItem('progress_history')||'[]');const i=h.findIndex(x=>x.date===today);const s={date:today,xp:stats.xp,lc:stats.lc,gc:stats.gc};if(i>=0)h[i]=s;else h.push(s);localStorage.setItem('progress_history',JSON.stringify(h.slice(-90))); } catch (_) {}
  }, [stats.xp, authUser, authScreen]); // eslint-disable-line react-hooks/exhaustive-deps -- intentional: authUser and authScreen are identity-stable once set; the key deps are stats.xp changes

  // Premium welcome banner
  useEffect(() => {
    if (authScreen !== 'app' || !authUser) return undefined;
    if (localStorage.getItem('nh_premium_welcome_shown')) return undefined;
    const t = setTimeout(() => { const {isFreeAnnual} = getSubscriptionStatus(); if (isFreeAnnual && stats.lc === 0) setShowPremiumWelcome(true); }, 2500);
    return () => clearTimeout(t);
  }, [authScreen, authUser?.u]); // eslint-disable-line react-hooks/exhaustive-deps -- intentional: premium welcome check is a one-shot side effect gated on a localStorage flag; re-checking on subscription changes would show duplicate banners

  // One-time apology modal for April 2026 data incident — shown once to any existing user with progress
  const [showApology, setShowApology] = useState(false);
  useEffect(() => {
    if (authScreen !== 'app' || stats.lc === 0) return;
    try { if (!localStorage.getItem('nh_apology_2026_04')) setShowApology(true); } catch {}
  }, [authScreen, stats.lc]);
  const dismissApology = useCallback(() => {
    try { localStorage.setItem('nh_apology_2026_04', '1'); } catch {}
    setShowApology(false);
  }, []);

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
  // getDueReviews() reads localStorage — keep it out of useMemo to avoid stale badge count
  const [dueCount, setDueCount] = useState(() => getDueReviews().length);
  useEffect(() => { setDueCount(getDueReviews().length); }, [stats]);
  const badges = useMemo(() => ({ home:0,learn:0,practice:dueCount,croatia:0,profile:0 }), [dueCount]);
  const doSidebarSearch = useCallback(() => { if (srchQ.trim()) { doSearch(srchQ); setSrchOpen(true); } }, [srchQ, doSearch, setSrchOpen]);
  const _weeklyXP = (() => { try { return parseInt(localStorage.getItem('nh_week_xp_' + weekKey()) || '0', 10); } catch { return 0; } })();
  const ctxValue = useMemo(() => ({
    // Auth / user
    authScreen, authUser, au: authUser, name, setName, doOut,
    doSignUp: () => setAuthScreen('register'),
    // Prefs
    darkMode, setDarkMode, favs, toggleFav, isFav,
    // Navigation
    setScr, goBack, tab, setTab,
    // Stats / gamification
    sCurEx,
    // Journal / family
    jWords, setJWords, famData, setFamData,
    // Subscription
    isPremium, refreshSub, requirePremium,
    // Search
    srchQ, setSrchQ, srchR, srchOpen, setSrchOpen, doSearch,
    // Family (extended)
    famMembers, setFamMembers, famLoading, setFamLoading,
    famName, setFamName, famCode, setFamCode,
    famErr, setFamErr, famTab, setFamTab,
    // Daily challenge
    dchlA, sDchlA, dchlSl, sDchlSl,
    // Screen launchers
    resumeLesson, launchPathItem, launchAnimLesson,
    launchMcGame, mcGameComplete, launchFlashcards, launchListening, launchMatch, launchSpeaking,
    // Sync
    _syncReady, doSyncNow,
    // Misc
    icons: ICONS, allCats, getWeekStats,
    isNewUserWindow, daysSinceJoin, comebackBonus,
    weeklyXP: _weeklyXP,
    currentScreen,
  }), [
    authScreen, authUser, name, setName, doOut, setAuthScreen,
    darkMode, setDarkMode, favs, toggleFav, isFav,
    setScr, goBack, tab, setTab,
    sCurEx,
    jWords, setJWords, famData, setFamData,
    isPremium, refreshSub, requirePremium,
    srchQ, setSrchQ, srchR, srchOpen, setSrchOpen, doSearch,
    famMembers, setFamMembers, famLoading, setFamLoading,
    famName, setFamName, famCode, setFamCode,
    famErr, setFamErr, famTab, setFamTab,
    dchlA, sDchlA, dchlSl, sDchlSl,
    resumeLesson, launchPathItem, launchAnimLesson,
    launchMcGame, mcGameComplete, launchFlashcards, launchListening, launchMatch, launchSpeaking,
    _syncReady, doSyncNow,
    allCats, getWeekStats,
    isNewUserWindow, daysSinceJoin, comebackBonus,
    _weeklyXP, currentScreen,
  ]);
  const statsValue = useMemo(() => ({ stats,setStats,dispatch,award,level }), [stats,setStats,dispatch,award,level]);

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
      <div style={{position:'absolute',bottom:0,left:0,right:0,height:4,background:'linear-gradient(90deg,#C8980A 0%,#FFE070 50%,#C8980A 100%)',animation:'stripe-slide .9s ease .3s both'}}/>

    </div>
  );
  if (authScreen === 'login' || authScreen === 'register') return <LoginScreen authScreen={authScreen} authError={authError} authLoading={authLoading} authEmail={authEmail} pw={pw} pc={pc} displayName={displayName} sp={sp} setAuthScreen={setAuthScreen} setAuthError={setAuthError} setAuthEmail={setAuthEmail} setPw={setPw} setPc={setPc} setDisplayName={setDisplayName} setSp2={setSp2} setRpEm={setRpEm} doLog={doLog} doReg={doReg} doGoogleLogin={doGoogleLogin} doGuest={doGuest} />;
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
      <Suspense fallback={<div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh'}}><div style={{textAlign:'center'}}><div style={{margin:'0 auto 16px',width:56,display:'flex',justifyContent:'center'}}><CroatianGrb size={56}/></div><div style={{fontSize:13,fontWeight:800,color:'var(--subtext)',letterSpacing:'.1em',textTransform:'uppercase',opacity:.6}}>Naša Hrvatska</div></div></div>}>
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
                setStats(s => ({ ...s, xp: Math.max(0, s.xp - (result.xpCost ?? 0)), str: result.restoredCount ?? s.str }));
                setStreakRestoredCount(result.restoredCount ?? 0);
                setTimeout(() => setStreakRestoredCount(0), 5000);
              }
              setShowStreakRepair(false);
            }
          }}
          showAndroidInstall={showAndroidInstall} setShowAndroidInstall={setShowAndroidInstall} deferredInstallPrompt={deferredInstallPrompt}
          showPwaInstall={showPwaInstall} setShowPwaInstall={setShowPwaInstall}
          showBackupBanner={showBackupBanner} setShowBackupBanner={setShowBackupBanner}
          syncError={syncError} setSyncError={setSyncError}
          isFreeAnnual={isFreeAnnual} daysLeft={daysLeft} setShowPaywall={setShowPaywall}
          emailUnverified={emailUnverified} setEmailUnverified={setEmailUnverified} resendVerification={resendVerification}
          showApology={showApology} onDismissApology={dismissApology}
        />
        <AppRouter
          setPlacementQ={setPlacementQ} setPlacementIdx={setPlacementIdx}
          setPlacementScore={setPlacementScore} setPlacementAnswers={setPlacementAnswers}
          setPlacementXp={setPlacementXp} getPlacementCt={getPlacementCt}
          setShowFirstWords={setShowFirstWords}
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
          curEx={curEx}
        />
        {authScreen === 'app' && currentScreen !== 'welcome' && currentScreen !== 'placement' && <TabBar tab={tab} setTab={setTab} setScr={setScr} badges={badges} />}

        <KnightCompanion />
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
