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

/**
 * _buildAdaptivePool — weights vocabulary by FSRS stability so weaker words
 * appear more often in quiz pools. DuoLingo best-practice: surface the word
 * just before the learner would forget it, not randomly.
 *
 * Weights (words can appear multiple times in the pool):
 *   overdue (due < now)         → 4× — forgotten / at risk
 *   due soon (< 7 days)         → 2× — reinforcement window
 *   new (no card yet)           → 2× — first exposure deserves priority
 *   stable (7+ days remaining)  → 1× — already solid
 */
function _buildAdaptivePool(pool) {
  let srData = {};
  try { srData = JSON.parse(localStorage.getItem('nh_sr') || '{}'); } catch (_) {}
  const now = Date.now();
  const weighted = [];
  for (const w of pool) {
    const key = w[0]; // Croatian word is index 0
    const card = srData[key];
    if (!card) { weighted.push(w, w); continue; } // new word → 2×
    const msRemaining = (card.due || card.nextDue || 0) - now;
    if (msRemaining < 0) { weighted.push(w, w, w, w); } // overdue → 4×
    else if (msRemaining < 7 * 86400000) { weighted.push(w, w); } // due soon → 2×
    else { weighted.push(w); } // stable → 1×
  }
  return weighted;
}
let _dataCache = null;
async function _getData() {
  if (!_dataCache) _dataCache = await import('../data.jsx');
  return _dataCache;
}
import { trackStart, trackAbandon } from '../lib/learnerStyle.js';
import { markExerciseDone } from './useAward.js';

// Screens in LEARN_PATH that don't self-report completion — dwell ≥20s grants credit.
// IMPORTANT: Any screen added here that ALSO has an explicit Finish/Done/Complete button
// must ALSO call setStats+writeDelta in that button's handler (see FalseFriendsScreen,
// AspectDrillScreen, etc. for the pattern). The dwell timer and button handler both check
// stats.vs to prevent double-counting, so both paths are safe to have simultaneously.
const BLACK_HOLE_SCREENS = {
  texting:'lc', roleplay:'lc', readlist:'lc', idioms:'lc', brzalice:'lc', wordform:'lc',
  diminutives:'lc', history:'lc', recipes:'lc', listeningpath:'lc', falsefr:'lc',
  dialects:'lc', aspect:'gc', declension:'gc',
  // Safety-net entries for screens that also have explicit completion buttons.
  // The button fires first; the dwell timer fires only if the user stays ≥20s without clicking.
  listening:'lc', alphabet:'lc', techvoc:'lc', pitchaccent:'lc',
  tenses:'gc', formalregister:'gc', conditional:'gc', impersonal:'gc',
  padezifull:'gc', clitic:'gc', grammarmap:'gc', aspectdrill:'gc',
  // Additional informational screens added to ensure all LEARN_PATH entries award credit.
  shadowing:'lc', proverbs:'lc', bureaucratic:'lc',
  // Grammar drill screens missing from original list — ck checks gc, so must award gc on dwell.
  conjdrill:'gc', padezi:'gc', modal:'gc',
  // Grammar reference screens — users read/study without a quiz completion event.
  grammarreader:'gc', colorquirk:'gc', negation:'gc', phonology:'lc',
  // Vocabulary reference screens — browse without an explicit award call.
  professions:'lc', bodydesc:'lc', clothes:'lc', countries:'lc', weather:'lc',
  civic:'lc', top100:'lc', tivicompare:'lc', lifeevents:'lc',
  // Cultural content screens — informational/educational, no quiz.
  popculture:'lc', events:'lc', cityofday:'lc', kafic:'lc', kings:'lc',
  // Practical life screens — reference material without completion events.
  school:'lc', restaurant:'lc', emergency:'lc', crmap:'lc',
  storyselect:'lc', foodorder:'lc', grocery:'lc', transport:'lc',
  // Video content — viewing without explicit completion.
  grammarvideos:'lc',
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
    if (!questions || questions.length === 0) return; // guard: never launch an empty game
    returnContextRef.current = { tab: tab || 'practice', screen: currentScreen || 'dashboard' };
    setMcInitQ(questions);
    sCurEx('mcgame');
    sessionStorage.setItem('nh_ex_start', Date.now().toString());
    trackStart('quiz');
    setScr('mcgame');
  }, [setScr, sCurEx, setMcInitQ, tab, currentScreen]);

  /**
   * launchLegendary — launches McGame in hard/challenge mode for a completed item.
   * DuoLingo best-practice: let advanced learners replay completed units at higher
   * difficulty (more distractors, all hearts active, no glow hints).
   * Adaptive pool ensures the weakest words from that topic are prioritised.
   */
  /**
   * launchCheckpoint — comprehensive quiz covering all topics from a LearnPath level.
   * DuoLingo best-practice: checkpoint tests ensure learners can recall everything
   * from a unit before they consider themselves "done" with it.
   * Pass condition (≥70%) is stored in localStorage nh_checkpoints as { levelIndex: true }.
   */
  const launchCheckpoint = useCallback(async (levelIndex, levelItems) => {
    const { V } = await _getData();
    const topics = levelItems.map(it => it.topic).filter(Boolean);
    const pool = topics.length > 0
      ? topics.flatMap(t => V[t] || []).filter(w => w && w[0] && w[1])
      : allCats.flatMap(t => V[t] || []).filter(w => w && w[0] && w[1]);
    if (pool.length === 0) return;
    const adaptivePool = _buildAdaptivePool(pool);
    const seen = new Set();
    const deduped = _sh(adaptivePool).filter(w => { if (seen.has(w[0])) return false; seen.add(w[0]); return true; });
    const globalPool = allCats.flatMap(t => V[t] || []).filter(w => w && w[0] && w[1]);
    const qs = deduped.slice(0, 15).map(w => {
      const wr = _sh(globalPool.filter(x => x[1] !== w[1])).slice(0, 3).map(x => x[1]);
      return { hr: w[0], en: w[1], ph: w[2], opts: _sh([w[1]].concat(wr)), correct: w[1] };
    });
    sessionStorage.setItem('nh_checkpoint_level', String(levelIndex));
    returnContextRef.current = { tab: 'learn', screen: 'learnpath' };
    setMcInitQ(qs);
    sCurEx('mcgame');
    sessionStorage.setItem('nh_ex_start', Date.now().toString());
    trackStart('quiz');
    setScr('mcgame');
  }, [setScr, sCurEx, setMcInitQ, allCats]);

  const launchLegendary = useCallback(async (item) => {
    const { V } = await _getData();
    const topicPool = item.topic ? (V[item.topic] || []) : [];
    const globalPool = allCats.flatMap(t => V[t] || []).filter(w => w && w[0] && w[1]);
    const basePool = topicPool.length >= 5
      ? [...topicPool, ...globalPool.slice(0, Math.ceil(globalPool.length * 0.2))]
      : globalPool;
    const adaptivePool = _buildAdaptivePool(basePool.filter(w => w && w[0] && w[1]));
    const seen = new Set();
    const deduped = _sh(adaptivePool).filter(w => {
      if (seen.has(w[0])) return false; seen.add(w[0]); return true;
    });
    const qs = deduped.slice(0, 15).map(w => {
      const wr = _sh(globalPool.filter(x => x[1] !== w[1])).slice(0, 4).map(x => x[1]);
      return { hr: w[0], en: w[1], ph: w[2], opts: _sh([w[1]].concat(wr)), correct: w[1] };
    });
    returnContextRef.current = { tab: 'learn', screen: 'learnpath' };
    setMcInitQ(qs);
    sessionStorage.setItem('nh_legendary_mode', '1');
    sCurEx('mcgame');
    sessionStorage.setItem('nh_ex_start', Date.now().toString());
    trackStart('quiz');
    setScr('mcgame');
  }, [setScr, sCurEx, setMcInitQ, allCats]);

  const mcGameComplete = useCallback((questions, score, mistakes) => {
    // Checkpoint: if this was a checkpoint quiz, store pass/fail result
    const cpLevel = sessionStorage.getItem('nh_checkpoint_level');
    if (cpLevel !== null) {
      const pct = questions.length > 0 ? score / questions.length : 0;
      if (pct >= 0.7) {
        try {
          const checkpoints = JSON.parse(localStorage.getItem('nh_checkpoints') || '{}');
          checkpoints[cpLevel] = true;
          localStorage.setItem('nh_checkpoints', JSON.stringify(checkpoints));
        } catch (_) {}
      }
      sessionStorage.removeItem('nh_checkpoint_level');
    }
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
      const raw = V[item.topic];
      if (!raw || raw.length < 2) {
        // Vocabulary not available for this topic — do not award credit.
        // The path item stays incomplete until real content is added.
        // This should never fire for any current LEARN_PATH item; it is a
        // safety guard against future content gaps only.
        return;
      }
      const items = _sh(raw);
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
      const pool = allCats.flatMap(t => V[t] || []).filter(w => w && w[0] && w[1]);
      // Use FSRS-weighted pool so weaker/forgotten words appear more often
      const adaptivePool = _buildAdaptivePool(pool);
      const seen = new Set();
      const deduped = _sh(adaptivePool).filter(w => { if (seen.has(w[0])) return false; seen.add(w[0]); return true; });
      const qs = deduped.slice(0, 10).map(w => {
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
      // For readlist: store the difficulty filter so ReadingList can narrow its view
      if (item.go === 'readlist') {
        if (item.filter) sessionStorage.setItem('nh_readlist_filter', JSON.stringify(item.filter));
        else sessionStorage.removeItem('nh_readlist_filter');
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
      // No browser history — stay in the current tab rather than drifting to Home.
      setTab(tab || 'home');
    } else {
      navigate(-1);
    }
  }, [curEx, sCurEx, setScr, setTab, navigate]);

  return {
    resumeLesson,
    launchAnimLesson,
    launchMcGame,
    launchLegendary,
    launchCheckpoint,
    mcGameComplete,
    launchFlashcards,
    launchListening,
    launchMatch,
    launchSpeaking,
    launchPathItem,
    goBack,
  };
}
