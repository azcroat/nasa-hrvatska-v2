/**
 * useScreenLauncher — all screen navigation and exercise launch functions.
 *
 * Extracted from App.jsx to isolate the "how do I start an exercise" logic.
 * Also owns the dwell-time tracker for LEARN_PATH "black hole" screens and goBack().
 *
 * @param params All required setters and state from App / hooks
 */
import { useEffect, useRef, useCallback } from 'react';
// V, GRAM, and LESSONS are only needed when launching exercises — lazy import keeps chunk-data
// out of the startup bundle. sh is a local Fisher-Yates using Math.random().
function _sh(a) { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }
let _dataCache = null;
async function _getData() {
  if (!_dataCache) _dataCache = await import('../data.jsx');
  return _dataCache;
}
import { trackStart, trackAbandon } from '../lib/learnerStyle.js';
import { markExerciseDone } from './useAward.js';

// Screens in LEARN_PATH that don't self-report completion — dwell ≥20s grants credit
const BLACK_HOLE_SCREENS = {
  texting:'lc', roleplay:'lc', readlist:'lc', idioms:'lc', brzalice:'lc', wordform:'lc',
  diminutives:'lc', history:'lc', recipes:'lc', listeningpath:'lc', falsefr:'lc',
  dialects:'lc', aspect:'gc', declension:'gc',
};

export function useScreenLauncher({
  setScr, navigate, curEx, sCurEx, currentScreen,
  setStats, award, writeDelta, allCats,
  // Tab routing (for smart post-completion navigation)
  tab, setTab,
  // Lesson state
  sLt, sLi, sLx, sLs, sLp, sLa, sLsl, sQi,
  // Grammar state
  sGl, sGp, sGx, sGs, sGa, sGsl,
  // Exercise init pools
  setMcInitQ, setMcResultQ, setMcResultScore, setMcMistakes,
  setFcInitPool, setLsInitQ, setMatchInitPool,
  // Speaking state
  sSi, sSx, sSw, sSr, sSsc,
  // Animated lesson
  setAnimLesson,
}) {
  const lpDwellRef = useRef(null);
  // Captures where the user was when an exercise launched so goBack() can
  // return them to the right place instead of relying on browser history.
  // { tab: 'practice'|'learn'|'home'|..., screen: 'greetings'|'dashboard'|... }
  const returnContextRef = useRef(null);

  // Cancel dwell timer when user navigates away from tracked screen
  useEffect(() => {
    const dwell = lpDwellRef.current;
    if (dwell && currentScreen !== dwell.screen) {
      clearTimeout(dwell.timer);
      lpDwellRef.current = null;
    }
  }, [currentScreen]);

  const resumeLesson = useCallback(async () => {
    try {
      const r = JSON.parse(localStorage.getItem('nh_lesson_resume') || 'null');
      if (!r || !r.topic) return;
      const { V } = await _getData();
      if (!V[r.topic]) return;
      const items = _sh(V[r.topic]);
      returnContextRef.current = { tab: 'learn', screen: 'dashboard' };
      sLt(r.topic); sLi(items); sLx(0); sLs(0); sLp('learn'); sLa(false); sLsl(-1); sQi([]);
      sCurEx('vocab_' + r.topic);
      sessionStorage.setItem('nh_ex_start', Date.now().toString());
      setScr('lesson');
    } catch (_) {}
  }, [setScr, sCurEx, sLt, sLi, sLx, sLs, sLp, sLa, sLsl, sQi]);

  const launchAnimLesson = useCallback(async (lessonId) => {
    const { LESSONS } = await import('../data/lessons.js');
    const l = LESSONS.find(x => x.id === lessonId);
    if (l) {
      returnContextRef.current = { tab: tab || 'learn', screen: currentScreen || 'dashboard' };
      setAnimLesson(l); sCurEx('animlesson'); setScr('animlesson');
    }
  }, [setScr, sCurEx, setAnimLesson, tab, currentScreen]);

  const launchMcGame = useCallback((questions) => {
    returnContextRef.current = { tab: tab || 'practice', screen: currentScreen || 'dashboard' };
    setMcInitQ(questions);
    sCurEx('mcgame');
    sessionStorage.setItem('nh_ex_start', Date.now().toString());
    trackStart('quiz');
    setScr('mcgame');
  }, [setScr, sCurEx, setMcInitQ, tab, currentScreen]);

  const mcGameComplete = useCallback((questions, score, mistakes) => {
    setMcResultQ(questions);
    setMcResultScore(score);
    setMcMistakes(mistakes || []);
    setScr('mcresult');
  }, [setScr, setMcResultQ, setMcResultScore, setMcMistakes]);

  const launchFlashcards = useCallback((pool) => {
    returnContextRef.current = { tab: tab || 'practice', screen: currentScreen || 'dashboard' };
    setFcInitPool(pool);
    sCurEx('flashcards');
    sessionStorage.setItem('nh_ex_start', Date.now().toString());
    trackStart('flashcards');
    setScr('flashcards');
  }, [setScr, sCurEx, setFcInitPool, tab, currentScreen]);

  const launchListening = useCallback((questions) => {
    returnContextRef.current = { tab: tab || 'practice', screen: currentScreen || 'dashboard' };
    setLsInitQ(questions);
    sCurEx('listening');
    sessionStorage.setItem('nh_ex_start', Date.now().toString());
    trackStart('listening');
    setScr('listening');
  }, [setScr, sCurEx, setLsInitQ, tab, currentScreen]);

  const launchMatch = useCallback((pool) => {
    returnContextRef.current = { tab: tab || 'practice', screen: currentScreen || 'dashboard' };
    setMatchInitPool(pool);
    sCurEx('match');
    sessionStorage.setItem('nh_ex_start', Date.now().toString());
    trackStart('matching');
    setScr('match');
  }, [setScr, sCurEx, setMatchInitPool, tab, currentScreen]);

  const launchSpeaking = useCallback((items) => {
    returnContextRef.current = { tab: tab || 'practice', screen: currentScreen || 'dashboard' };
    sSi(items); sSx(0); sSw(items[0]); sSr(null); sSsc(0);
    sCurEx('speaking');
    sessionStorage.setItem('nh_ex_start', Date.now().toString());
    trackStart('speaking');
    setScr('speaking');
  }, [setScr, sCurEx, sSi, sSx, sSw, sSr, sSsc, tab, currentScreen]);

  const launchPathItem = useCallback(async (item) => {
    if (!item) return;
    if (item.go === 'lesson' && item.topic) {
      const { V } = await _getData();
      const items = _sh(V[item.topic]);
      // Return to the Learn tab. If launched from a category screen (not dashboard),
      // preserve that screen so the back button lands on the category, not the tab root.
      const returnScreen = (currentScreen && currentScreen !== 'dashboard') ? currentScreen : 'dashboard';
      returnContextRef.current = { tab: 'learn', screen: returnScreen };
      sLt(item.topic); sLi(items); sLx(0); sLs(0); sLp('learn'); sLa(false); sLsl(-1);
      sessionStorage.setItem('nh_ex_start', Date.now().toString());
      trackStart('flashcards');
      setScr('lesson'); sCurEx('vocab_' + item.topic);
    } else if (item.go === 'grammar') {
      const { GRAM } = await _getData();
      sGl(GRAM.beginner[0]); sGp('learn'); sGx(0); sGs(0); sGa(false); sGsl(-1);
      sessionStorage.setItem('nh_ex_start', Date.now().toString());
      trackStart('grammar');
      setScr('grammar'); sCurEx('grammar');
    } else if (item.go === 'mcgame') {
      const { V } = await _getData();
      const pool = allCats.flatMap(t => V[t]);
      const qs = _sh(pool).slice(0, 10).map(w => {
        const wr = _sh(pool.filter(x => x[1] !== w[1])).slice(0, 3).map(x => x[1]);
        return { hr: w[0], en: w[1], ph: w[2], opts: _sh([w[1]].concat(wr)), correct: w[1] };
      });
      launchMcGame(qs);
    } else {
      sessionStorage.setItem('nh_ex_start', Date.now().toString());
      const typeMap = {
        review: 'srs_review', shadowing: 'shadowing', writing: 'writing',
        listening: 'listening', speaking: 'speaking', speaking_sprint: 'speaking',
        aiconvo: 'conversation', ai_listening: 'listening', cloze: 'cloze',
        reading: 'reading', readlist: 'reading',
      };
      if (typeMap[item.go]) trackStart(typeMap[item.go]);
      const bhStat = BLACK_HOLE_SCREENS[item.go];
      if (bhStat) {
        if (lpDwellRef.current?.timer) clearTimeout(lpDwellRef.current.timer);
        const timer = setTimeout(() => {
          let alreadyVisited = false;
          setStats(prev => {
            if (prev.vs?.includes(item.go)) { alreadyVisited = true; return prev; }
            const newVs = [...(prev.vs || []), item.go];
            if (bhStat === 'lc') return { ...prev, lc: prev.lc + 1, vs: newVs };
            if (bhStat === 'gc') return { ...prev, gc: prev.gc + 1, vs: newVs };
            return { ...prev, vs: newVs };
          });
          if (!alreadyVisited && writeDelta) {
            const delta = { vs: [item.go] };
            if (bhStat === 'lc') delta.lc = 1;
            if (bhStat === 'gc') delta.gc = 1;
            writeDelta(delta);
          }
          award(15);
        }, 20000);
        lpDwellRef.current = { screen: item.go, statType: bhStat, timer };
      }
      setScr(item.go); sCurEx(item.go);
    }
  }, [setScr, sCurEx, setStats, award, writeDelta, allCats, launchMcGame,
      sLt, sLi, sLx, sLs, sLp, sLa, sLsl, sGl, sGp, sGx, sGs, sGa, sGsl]);

  const goBack = useCallback(() => {
    if (curEx) markExerciseDone(curEx);
    const startTs = parseInt(sessionStorage.getItem('nh_ex_start') || '0');
    const dur = startTs ? Date.now() - startTs : 0;
    if (curEx && dur > 5000) {
      const typeMap = {
        flash: 'flashcards', flashcards: 'flashcards', mcgame: 'quiz', review: 'srs_review',
        listening: 'listening', ai_listening: 'listening', speaking: 'speaking',
        speaking_sprint: 'speaking', aiconvo: 'conversation', writing: 'writing',
        shadowing: 'shadowing', cloze: 'cloze', grammar: 'grammar', match: 'matching', readlist: 'reading',
      };
      const aType = typeMap[curEx] || (curEx.startsWith('vocab_') ? 'flashcards' : null);
      if (aType) trackAbandon(aType, dur);
    }
    sessionStorage.removeItem('nh_ex_start');
    sCurEx('');

    // Smart return: route back to where the exercise was launched from rather than
    // relying on browser history, which sends users to Home when launched from the
    // dashboard's recommended section or any cross-tab shortcut.
    const ctx = returnContextRef.current;
    returnContextRef.current = null;
    if (ctx) {
      if (ctx.screen && ctx.screen !== 'dashboard') {
        // Return to the specific screen they came from (e.g. a Learn category)
        setScr(ctx.screen);
      } else {
        // Return to the tab root
        setTab(ctx.tab || 'learn');
      }
    } else if (window.history.length <= 1) {
      setScr('dashboard');
    } else {
      navigate(-1);
    }
  }, [curEx, sCurEx, setScr, setTab, navigate]);

  return {
    resumeLesson,
    launchAnimLesson,
    launchMcGame,
    mcGameComplete,
    launchFlashcards,
    launchListening,
    launchMatch,
    launchSpeaking,
    launchPathItem,
    goBack,
  };
}
