import { useState, useEffect } from 'react';
import { stopAudio } from '../../../lib/audio.ts';
import { recordTopicResult } from '../../../lib/adaptive';
import { getStoryCatalog } from '../../../lib/contentClient';
import type { StoryCatalogEntry } from '../../../types/content';
import { EXERCISES } from './exercises';

/**
 * Listening-comprehension quiz state machine — navigation, per-set progress,
 * scoring, and the bonus-story catalog. Extracted from ListeningComprehensionScreen
 * as part of finishing 1b (decomposing the main screen). Returns a view-model the
 * view subcomponents consume. Behavior-identical to the prior inline logic.
 */
export function useListeningQuiz(
  award?: (xp: number, celebrate?: boolean, activityType?: string) => void,
) {
  const STORAGE_KEY = 'nh_listen_comp_v2';

  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  function saveProgress(prog: any) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prog));
    } catch {}
  }

  // ── Helpers ────────────────────────────────────────────────────────────────────

  function shuffle(arr: any[]) {
    const b = [...arr];
    for (let i = b.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [b[i], b[j]] = [b[j], b[i]];
    }
    return b;
  }

  // Navigation state
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedSet, setSelectedSet] = useState<any | null>(null);
  const [selectedSetIdx, setSelectedSetIdx] = useState<number | null>(null);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [shuffledQuestions, setShuffledQuestions] = useState<any[] | null>(null);
  const [missedQuestions, setMissedQuestions] = useState<any[]>([]);

  // Bonus story modal
  const [bonusStory, setBonusStory] = useState<any | null>(null);

  // Story catalog (async-loaded for BonusStoryCard)
  const [storyCatalog, setStoryCatalog] = useState<StoryCatalogEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cat = await getStoryCatalog();
        if (!cancelled) setStoryCatalog(cat);
      } catch {
        // BonusStoryCard renders null when catalog is empty — fine
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist progress
  const [progress, setProgress] = useState<any>(() => loadProgress());

  // Computed: level completion
  const levelIds = Object.keys(EXERCISES);
  const levelData = selectedLevel
    ? ((EXERCISES as Record<string, typeof EXERCISES.A1>)[selectedLevel] ?? null)
    : null;

  function getCompletedQuestions(levelId: string, setIdx: number) {
    const lvl = (progress as any)[levelId] || {};
    const set = lvl[setIdx] || {};
    return Object.keys(set).filter((k) => set[k] === true).length;
  }

  function getTotalQuestionsForSet(levelId: string, setIdx: number) {
    return (EXERCISES as Record<string, typeof EXERCISES.A1>)[levelId]!.sets[setIdx]!.questions
      .length;
  }

  function isSetComplete(levelId: string, setIdx: number) {
    const total = getTotalQuestionsForSet(levelId, setIdx);
    return getCompletedQuestions(levelId, setIdx) >= total;
  }

  function isLevelComplete(levelId: string) {
    const sets = (EXERCISES as Record<string, typeof EXERCISES.A1>)[levelId]!.sets;
    return sets.every((_, si) => isSetComplete(levelId, si));
  }

  function getLevelCompletionCount(levelId: string) {
    const sets = (EXERCISES as Record<string, typeof EXERCISES.A1>)[levelId]!.sets;
    return sets.reduce((sum, _, si) => sum + getCompletedQuestions(levelId, si), 0);
  }

  function getLevelTotalCount(levelId: string) {
    const sets = (EXERCISES as Record<string, typeof EXERCISES.A1>)[levelId]!.sets;
    return sets.reduce((sum, _, si) => sum + getTotalQuestionsForSet(levelId, si), 0);
  }

  function markQuestionDone(levelId: string, setIdx: number, qIdx: number) {
    setProgress((prev: any) => {
      const next = {
        ...prev,
        [levelId]: {
          ...(prev[levelId] || {}),
          [setIdx]: {
            ...((prev[levelId] || {})[setIdx] || {}),
            [qIdx]: true,
          },
        },
      };
      saveProgress(next);
      return next;
    });
  }

  function startSet(setData: any, setIdx: number) {
    // Build ordered questions preserving original indices for progress tracking
    const indexed = setData.questions.map((q: any, i: number) => ({ ...q, _origIdx: i }));
    const shuffled = shuffle(indexed).map((q) => ({ ...q, opts: shuffle(q.opts) }));
    setShuffledQuestions(shuffled);
    setSelectedSet(setData);
    setSelectedSetIdx(setIdx);
    setQuestionIdx(0);
    setChosen(null);
    setScore(0);
    setFinished(false);
    setMissedQuestions([]);
  }

  function handleAnswer(opt: string) {
    if (chosen !== null) return;
    setChosen(opt);
    const q = shuffledQuestions![questionIdx]!;
    const correct = opt === q.en;
    if (correct) {
      setScore((s) => s + 1);
    } else {
      setMissedQuestions((prev) => [...prev, { hr: q.hr, en: q.en }]);
    }
    // Feed the adaptive engine so weak listening resurfaces in the daily session.
    recordTopicResult('listening', correct);
    // Mark this question as done in progress
    markQuestionDone(selectedLevel!, selectedSetIdx!, q._origIdx);
  }

  function next() {
    const qs = shuffledQuestions!;
    if (questionIdx + 1 >= qs.length) {
      setFinished(true);
      // `score` already includes the last answer (handleAnswer incremented it before Next was clickable).
      const finalScore = score;
      const xp = Math.round((finalScore / qs.length) * 15) + 5;
      if (award) award(xp, false, 'listening');
    } else {
      setQuestionIdx((i) => i + 1);
      setChosen(null);
    }
  }

  function reset() {
    stopAudio();
    setSelectedSet(null);
    setSelectedSetIdx(null);
    setShuffledQuestions(null);
    setChosen(null);
    setScore(0);
    setFinished(false);
    setQuestionIdx(0);
    setMissedQuestions([]);
  }

  function handleAddToFlashcards(words: any[]) {
    // Dispatch event to app-level handler if available
    try {
      window.dispatchEvent(
        new CustomEvent('nh:add-weak-words', {
          detail: { words, source: 'listening-comprehension', level: selectedLevel },
        }),
      );
    } catch {}
  }

  return {
    selectedLevel,
    setSelectedLevel,
    selectedSet,
    selectedSetIdx,
    questionIdx,
    chosen,
    score,
    finished,
    shuffledQuestions,
    missedQuestions,
    bonusStory,
    setBonusStory,
    storyCatalog,
    levelIds,
    levelData,
    getCompletedQuestions,
    getTotalQuestionsForSet,
    isSetComplete,
    isLevelComplete,
    getLevelCompletionCount,
    getLevelTotalCount,
    startSet,
    handleAnswer,
    next,
    reset,
    handleAddToFlashcards,
  };
}

export type ListeningQuiz = ReturnType<typeof useListeningQuiz>;
