/**
 * useScreenLauncher — all screen navigation and exercise launch functions.
 *
 * Extracted from App.jsx to isolate the "how do I start an exercise" logic.
 * Also owns the dwell-time tracker for LEARN_PATH "black hole" screens and goBack().
 */
import { useEffect, useRef, useCallback } from 'react';
import { trackStart, trackAbandon } from '../lib/learnerStyle.js';
import { markExerciseDone } from './useAward.js';
import type { Stats, StatsDelta } from '../types/index.js';

// V, GRAM, and LESSONS are only needed when launching exercises — lazy import keeps chunk-data
// out of the startup bundle. sh is a local Fisher-Yates using Math.random().
function _sh<T>(a: T[]): T[] { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }

type VocabWord = [string, string, string?, ...string[]];

/**
 * _buildAdaptivePool — weights vocabulary by FSRS stability so weaker words
 * appear more often in quiz pools.
 */
function _buildAdaptivePool(pool: VocabWord[]): VocabWord[] {
  let srData: Record<string, { due?: number; nextDue?: number }> = {};
  try { srData = JSON.parse(localStorage.getItem('nh_sr') || '{}'); } catch (_) {}
  const now = Date.now();
  const weighted: VocabWord[] = [];
  for (const w of pool) {
    const key = w[0];
    const card = srData[key];
    if (!card) { weighted.push(w, w); continue; }
    const msRemaining = (card.due || card.nextDue || 0) - now;
    if (msRemaining < 0) { weighted.push(w, w, w, w); }
    else if (msRemaining < 7 * 86400000) { weighted.push(w, w); }
    else { weighted.push(w); }
  }
  return weighted;
}

let _dataCache: Record<string, unknown> | null = null;
async function _getData(): Promise<Record<string, unknown>> {
  if (!_dataCache) _dataCache = await import('../data.jsx') as Record<string, unknown>;
  return _dataCache;
}

// Screens in LEARN_PATH that don't self-report completion — dwell ≥20s grants credit.
const BLACK_HOLE_SCREENS: Record<string, string> = {
  texting:'lc', roleplay:'lc', readlist:'lc', idioms:'lc', brzalice:'lc', wordform:'lc',
  diminutives:'lc', history:'lc', recipes:'lc', listeningpath:'lc', falsefr:'lc',
  dialects:'lc', aspect:'gc', declension:'gc',
  listening:'lc', alphabet:'lc', techvoc:'lc', pitchaccent:'lc',
  tenses:'gc', formalregister:'gc', conditional:'gc', impersonal:'gc',
  padezifull:'gc', clitic:'gc', grammarmap:'gc', aspectdrill:'gc',
  shadowing:'lc', proverbs:'lc', bureaucratic:'lc',
  conjdrill:'gc', padezi:'gc', modal:'gc',
  grammarreader:'gc', colorquirk:'gc', negation:'gc', phonology:'lc',
  professions:'lc', bodydesc:'lc', clothes:'lc', countries:'lc', weather:'lc',
  civic:'lc', top100:'lc', tivicompare:'lc', lifeevents:'lc',
  popculture:'lc', events:'lc', cityofday:'lc', kafic:'lc', kings:'lc',
  school:'lc', restaurant:'lc', emergency:'lc', crmap:'lc',
  storyselect:'lc', foodorder:'lc', grocery:'lc', transport:'lc',
  grammarvideos:'lc',
};

interface McQuestion {
  hr: string;
  en: string;
  ph?: string;
  opts: string[];
  correct: string;
}

interface LearnPathItem {
  go?: string;
  topic?: string;
  filter?: unknown;
}

interface ScreenLauncherParams {
  setScr: (screen: string) => void;
  navigate: (delta: number) => void;
  curEx: string;
  sCurEx: (ex: string) => void;
  currentScreen: string;
  setStats: (fn: (prev: Stats) => Stats) => void;
  award: (amt: number) => void;
  writeDelta: (delta: StatsDelta & Record<string, unknown>) => void;
  allCats: string[];
  tab: string;
  setTab: (tab: string) => void;
  // Lesson setters
  sLt: (v: unknown) => void;
  sLi: (v: unknown[]) => void;
  sLx: (v: number) => void;
  sLs: (v: number) => void;
  sLp: (v: string) => void;
  sLa: (v: boolean) => void;
  sLsl: (v: number) => void;
  sQi: (v: unknown[]) => void;
  // Grammar setters
  sGl: (v: unknown) => void;
  sGp: (v: string) => void;
  sGx: (v: number) => void;
  sGs: (v: number) => void;
  sGa: (v: boolean) => void;
  sGsl: (v: number) => void;
  // Exercise init pools
  setMcInitQ: (v: unknown[]) => void;
  setMcResultQ: (v: unknown[]) => void;
  setMcResultScore: (v: number) => void;
  setMcMistakes: (v: unknown[]) => void;
  setFcInitPool: (v: unknown[]) => void;
  setLsInitQ: (v: unknown[]) => void;
  setMatchInitPool: (v: unknown[]) => void;
  // Speaking setters
  sSi: (v: unknown[]) => void;
  sSx: (v: number) => void;
  sSw: (v: unknown) => void;
  sSr: (v: unknown) => void;
  sSsc: (v: number) => void;
  // Animated lesson
  setAnimLesson: (v: unknown) => void;
}

interface ScreenLauncherResult {
  resumeLesson: () => Promise<void>;
  launchAnimLesson: (lessonId: string) => Promise<void>;
  launchMcGame: (questions: McQuestion[]) => void;
  launchLegendary: (item: LearnPathItem) => Promise<void>;
  launchCheckpoint: (levelIndex: number, levelItems: LearnPathItem[]) => Promise<void>;
  mcGameComplete: (questions: McQuestion[], score: number, mistakes: unknown[]) => void;
  launchFlashcards: (pool: unknown[]) => void;
  launchListening: (questions: unknown[]) => void;
  launchMatch: (pool: unknown[]) => void;
  launchSpeaking: (items: unknown[]) => void;
  launchPathItem: (item: LearnPathItem) => Promise<void>;
  goBack: () => void;
}

export function useScreenLauncher({
  setScr, navigate, curEx, sCurEx, currentScreen,
  setStats, award, writeDelta, allCats,
  tab, setTab,
  sLt, sLi, sLx, sLs, sLp, sLa, sLsl, sQi,
  sGl, sGp, sGx, sGs, sGa, sGsl,
  setMcInitQ, setMcResultQ, setMcResultScore, setMcMistakes,
  setFcInitPool, setLsInitQ, setMatchInitPool,
  sSi, sSx, sSw, sSr, sSsc,
  setAnimLesson,
}: ScreenLauncherParams): ScreenLauncherResult {
  const lpDwellRef = useRef<{ screen: string; statType: string; timer: ReturnType<typeof setTimeout> } | null>(null);
  const returnContextRef = useRef<{ tab: string; screen?: string } | null>(null);

  useEffect(() => {
    const dwell = lpDwellRef.current;
    if (dwell && currentScreen !== dwell.screen) {
      clearTimeout(dwell.timer);
      lpDwellRef.current = null;
    }
  }, [currentScreen]);

  const resumeLesson = useCallback(async (): Promise<void> => {
    try {
      const r = JSON.parse(localStorage.getItem('nh_lesson_resume') || 'null') as { topic?: string } | null;
      if (!r || !r.topic) return;
      const { V } = await _getData() as { V: Record<string, VocabWord[]> };
      if (!V[r.topic]) return;
      const items = _sh(V[r.topic]);
      returnContextRef.current = { tab: 'learn', screen: 'dashboard' };
      sLt(r.topic); sLi(items); sLx(0); sLs(0); sLp('learn'); sLa(false); sLsl(-1); sQi([]);
      sCurEx('vocab_' + r.topic);
      sessionStorage.setItem('nh_ex_start', Date.now().toString());
      setScr('lesson');
    } catch (_) {}
  }, [setScr, sCurEx, sLt, sLi, sLx, sLs, sLp, sLa, sLsl, sQi]);

  const launchAnimLesson = useCallback(async (lessonId: string): Promise<void> => {
    const { LESSONS } = await import('../data/lessons.js') as { LESSONS: { id: string }[] };
    const l = LESSONS.find(x => x.id === lessonId);
    if (l) {
      returnContextRef.current = { tab: tab || 'learn', screen: currentScreen || 'dashboard' };
      setAnimLesson(l); sCurEx('animlesson'); setScr('animlesson');
    }
  }, [setScr, sCurEx, setAnimLesson, tab, currentScreen]);

  const launchMcGame = useCallback((questions: McQuestion[]): void => {
    if (!questions || questions.length === 0) return;
    returnContextRef.current = { tab: tab || 'practice', screen: currentScreen || 'dashboard' };
    setMcInitQ(questions);
    sCurEx('mcgame');
    sessionStorage.setItem('nh_ex_start', Date.now().toString());
    trackStart('quiz');
    setScr('mcgame');
  }, [setScr, sCurEx, setMcInitQ, tab, currentScreen]);

  const launchCheckpoint = useCallback(async (levelIndex: number, levelItems: LearnPathItem[]): Promise<void> => {
    const { V } = await _getData() as { V: Record<string, VocabWord[]> };
    const topics = levelItems.map(it => it.topic).filter(Boolean) as string[];
    const pool = topics.length > 0
      ? topics.flatMap(t => V[t] || []).filter(w => w && w[0] && w[1])
      : allCats.flatMap(t => V[t] || []).filter(w => w && w[0] && w[1]);
    if (pool.length === 0) return;
    const adaptivePool = _buildAdaptivePool(pool);
    const seen = new Set<string>();
    const deduped = _sh(adaptivePool).filter(w => { if (seen.has(w[0])) return false; seen.add(w[0]); return true; });
    const globalPool = allCats.flatMap(t => V[t] || []).filter(w => w && w[0] && w[1]);
    const qs: McQuestion[] = deduped.slice(0, 15).map(w => {
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

  const launchLegendary = useCallback(async (item: LearnPathItem): Promise<void> => {
    const { V } = await _getData() as { V: Record<string, VocabWord[]> };
    const topicPool = item.topic ? (V[item.topic] || []) : [];
    const globalPool = allCats.flatMap(t => V[t] || []).filter(w => w && w[0] && w[1]);
    const basePool = topicPool.length >= 5
      ? [...topicPool, ...globalPool.slice(0, Math.ceil(globalPool.length * 0.2))]
      : globalPool;
    const adaptivePool = _buildAdaptivePool(basePool.filter(w => w && w[0] && w[1]));
    const seen = new Set<string>();
    const deduped = _sh(adaptivePool).filter(w => {
      if (seen.has(w[0])) return false; seen.add(w[0]); return true;
    });
    const qs: McQuestion[] = deduped.slice(0, 15).map(w => {
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

  const mcGameComplete = useCallback((questions: McQuestion[], score: number, mistakes: unknown[]): void => {
    const cpLevel = sessionStorage.getItem('nh_checkpoint_level');
    if (cpLevel !== null) {
      const pct = questions.length > 0 ? score / questions.length : 0;
      if (pct >= 0.7) {
        try {
          const checkpoints = JSON.parse(localStorage.getItem('nh_checkpoints') || '{}') as Record<string, boolean>;
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

  const launchFlashcards = useCallback((pool: unknown[]): void => {
    returnContextRef.current = { tab: tab || 'practice', screen: currentScreen || 'dashboard' };
    setFcInitPool(pool);
    sCurEx('flashcards');
    sessionStorage.setItem('nh_ex_start', Date.now().toString());
    trackStart('flashcards');
    setScr('flashcards');
  }, [setScr, sCurEx, setFcInitPool, tab, currentScreen]);

  const launchListening = useCallback((questions: unknown[]): void => {
    returnContextRef.current = { tab: tab || 'practice', screen: currentScreen || 'dashboard' };
    setLsInitQ(questions);
    sCurEx('listening');
    sessionStorage.setItem('nh_ex_start', Date.now().toString());
    trackStart('listening');
    setScr('listening');
  }, [setScr, sCurEx, setLsInitQ, tab, currentScreen]);

  const launchMatch = useCallback((pool: unknown[]): void => {
    returnContextRef.current = { tab: tab || 'practice', screen: currentScreen || 'dashboard' };
    setMatchInitPool(pool);
    sCurEx('match');
    sessionStorage.setItem('nh_ex_start', Date.now().toString());
    trackStart('matching');
    setScr('match');
  }, [setScr, sCurEx, setMatchInitPool, tab, currentScreen]);

  const launchSpeaking = useCallback((items: unknown[]): void => {
    returnContextRef.current = { tab: tab || 'practice', screen: currentScreen || 'dashboard' };
    sSi(items); sSx(0); sSw(items[0]); sSr(null); sSsc(0);
    sCurEx('speaking');
    sessionStorage.setItem('nh_ex_start', Date.now().toString());
    trackStart('speaking');
    setScr('speaking');
  }, [setScr, sCurEx, sSi, sSx, sSw, sSr, sSsc, tab, currentScreen]);

  const launchPathItem = useCallback(async (item: LearnPathItem): Promise<void> => {
    if (!item) return;
    if (item.go === 'lesson' && item.topic) {
      const { V } = await _getData() as { V: Record<string, VocabWord[]> };
      const raw = V[item.topic];
      // Fall back to global pool when topic vocabulary is missing or too small — never silent-fail
      const pool = (raw && raw.length >= 2) ? raw
        : allCats.flatMap(t => V[t] || []).filter(w => w && w[0] && w[1]);
      if (pool.length < 2) return;
      const items = _sh(pool);
      const returnScreen = (currentScreen && currentScreen !== 'dashboard') ? currentScreen : 'dashboard';
      returnContextRef.current = { tab: 'learn', screen: returnScreen };
      sLt(item.topic); sLi(items); sLx(0); sLs(0); sLp('learn'); sLa(false); sLsl(-1); sQi([]);
      sessionStorage.setItem('nh_ex_start', Date.now().toString());
      trackStart('flashcards');
      setScr('lesson'); sCurEx('vocab_' + item.topic);
    } else if (item.go === 'grammar') {
      const { GRAM } = await _getData() as { GRAM: { beginner: unknown[] } };
      sGl(GRAM.beginner[0]); sGp('learn'); sGx(0); sGs(0); sGa(false); sGsl(-1);
      sessionStorage.setItem('nh_ex_start', Date.now().toString());
      trackStart('grammar');
      setScr('grammar'); sCurEx('grammar');
    } else if (item.go === 'mcgame') {
      const { V } = await _getData() as { V: Record<string, VocabWord[]> };
      const pool = allCats.flatMap(t => V[t] || []).filter(w => w && w[0] && w[1]);
      const adaptivePool = _buildAdaptivePool(pool);
      const seen = new Set<string>();
      const deduped = _sh(adaptivePool).filter(w => { if (seen.has(w[0])) return false; seen.add(w[0]); return true; });
      const qs: McQuestion[] = deduped.slice(0, 10).map(w => {
        const wr = _sh(pool.filter(x => x[1] !== w[1])).slice(0, 3).map(x => x[1]);
        return { hr: w[0], en: w[1], ph: w[2], opts: _sh([w[1]].concat(wr)), correct: w[1] };
      });
      launchMcGame(qs);
    } else {
      sessionStorage.setItem('nh_ex_start', Date.now().toString());
      const typeMap: Record<string, string> = {
        review: 'srs_review', shadowing: 'shadowing', writing: 'writing',
        listening: 'listening', speaking: 'speaking', speaking_sprint: 'speaking',
        aiconvo: 'conversation', ai_listening: 'listening', cloze: 'cloze',
        reading: 'reading', readlist: 'reading',
      };
      if (item.go && typeMap[item.go]) trackStart(typeMap[item.go]);
      const bhStat = item.go ? BLACK_HOLE_SCREENS[item.go] : undefined;
      if (bhStat && item.go) {
        if (lpDwellRef.current?.timer) clearTimeout(lpDwellRef.current.timer);
        const screenId = item.go;
        const timer = setTimeout(() => {
          let alreadyVisited = false;
          setStats(prev => {
            if (prev.vs?.includes(screenId)) { alreadyVisited = true; return prev; }
            const newVs = [...(prev.vs || []), screenId];
            if (bhStat === 'lc') return { ...prev, lc: prev.lc + 1, vs: newVs };
            if (bhStat === 'gc') return { ...prev, gc: prev.gc + 1, vs: newVs };
            return { ...prev, vs: newVs };
          });
          if (!alreadyVisited && writeDelta) {
            const delta: StatsDelta & Record<string, unknown> = { vs: [screenId] };
            if (bhStat === 'lc') delta.lc = 1;
            if (bhStat === 'gc') delta.gc = 1;
            writeDelta(delta);
          }
          award(15);
        }, 20000);
        lpDwellRef.current = { screen: screenId, statType: bhStat, timer };
      }
      if (item.go === 'readlist') {
        if (item.filter) sessionStorage.setItem('nh_readlist_filter', JSON.stringify(item.filter));
        else sessionStorage.removeItem('nh_readlist_filter');
      }
      if (item.go) { setScr(item.go); sCurEx(item.go); }
    }
  }, [setScr, sCurEx, setStats, award, writeDelta, allCats, launchMcGame, currentScreen,
      sLt, sLi, sLx, sLs, sLp, sLa, sLsl, sQi, sGl, sGp, sGx, sGs, sGa, sGsl]);

  const goBack = useCallback((): void => {
    if (curEx) markExerciseDone(curEx);
    const startTs = parseInt(sessionStorage.getItem('nh_ex_start') || '0');
    const dur = startTs ? Date.now() - startTs : 0;
    if (curEx && dur > 5000) {
      const typeMap: Record<string, string> = {
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

    const ctx = returnContextRef.current;
    returnContextRef.current = null;
    if (ctx) {
      if (ctx.screen && ctx.screen !== 'dashboard') {
        setScr(ctx.screen);
      } else {
        setTab(ctx.tab || 'learn');
      }
    } else if (window.history.length <= 1) {
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
