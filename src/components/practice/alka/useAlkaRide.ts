import { useMemo, useReducer, useRef, useCallback, useEffect } from 'react';
import { scoreAnswer, type PerformanceTier } from '../../../lib/gamification/scoring';
import {
  runToZone,
  rideTotal,
  QUESTIONS_PER_RUN,
  type RingZone,
} from '../../../lib/gamification/alkaRules';
import { getAlkaBest, recordAlkaBest } from '../../../lib/gamification/alkaBest';
import type { GameQuestion } from '../../../lib/gamification/exerciseSource';

export interface UseAlkaRide {
  status: 'playing' | 'result';
  runIndex: number;
  questionInRun: number;
  current: GameQuestion;
  combo: number;
  score: number;
  aim: number;
  runZones: RingZone[];
  total: number;
  isNewBest: boolean;
  previousBest: number;
  answer: (optionIndex: number, responseMs: number) => void;
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Reducer — all ride state in one object so updates are atomic across calls.
// Using useReducer means each dispatch sees the true current state,
// eliminating stale-closure bugs when multiple answer() calls are batched.
// ---------------------------------------------------------------------------

interface RideState {
  status: 'playing' | 'result';
  idx: number;
  combo: number;
  score: number;
  aim: number;
  runTiers: PerformanceTier[];
  runZones: RingZone[];
  total: number;
  isNewBest: boolean;
}

const INITIAL: RideState = {
  status: 'playing',
  idx: 0,
  combo: 0,
  score: 0,
  aim: 0,
  runTiers: [],
  runZones: [],
  total: 0,
  isNewBest: false,
};

type RideAction =
  | { type: 'ANSWER'; optionIndex: number; responseMs: number; correctIndex: number }
  | { type: 'RESET' };

function rideReducer(state: RideState, action: RideAction): RideState {
  if (action.type === 'RESET') return { ...INITIAL };

  // ANSWER
  if (state.status === 'result') return state;

  const correct = action.optionIndex === action.correctIndex;
  const r = scoreAnswer({ correct, responseMs: action.responseMs, combo: state.combo });

  const newScore = state.score + r.points;
  const newAim = correct ? Math.min(1, state.aim + 0.34) : 0;
  const nextTiers: PerformanceTier[] = [...state.runTiers, r.tier];
  const finishedRun = nextTiers.length >= QUESTIONS_PER_RUN;

  if (finishedRun) {
    const zone = runToZone(nextTiers);
    const nextZones: RingZone[] = [...state.runZones, zone];
    const isLastRun = nextZones.length >= 3;

    if (isLastRun) {
      const t = rideTotal(nextZones);
      const newBest = recordAlkaBest(t);
      return {
        ...state,
        status: 'result',
        combo: r.combo,
        score: newScore,
        aim: 0,
        runTiers: [],
        runZones: nextZones,
        total: t,
        isNewBest: newBest,
        idx: state.idx + 1,
      };
    }

    return {
      ...state,
      combo: r.combo,
      score: newScore,
      aim: 0,
      runTiers: [],
      runZones: nextZones,
      idx: state.idx + 1,
    };
  }

  return {
    ...state,
    combo: r.combo,
    score: newScore,
    aim: newAim,
    runTiers: nextTiers,
    idx: state.idx + 1,
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAlkaRide({
  questions,
  onXp,
}: {
  questions: GameQuestion[];
  onXp: (xp: number) => void;
}): UseAlkaRide {
  const previousBest = useMemo(() => getAlkaBest(), []);
  const [state, dispatch] = useReducer(rideReducer, INITIAL);

  // Use a ref so the answer callback can read the current idx without
  // closing over stale state. The ref is updated every render.
  const idxRef = useRef(state.idx);
  idxRef.current = state.idx;

  // questions is expected to be stable for the lifetime of a ride (same array).
  // We store it in a ref so the answer callback doesn't need to close over it
  // as a dependency (it never changes, but this makes the dep array explicit).
  const questionsRef = useRef(questions);
  questionsRef.current = questions;

  // XP side-effect: emit once when the ride ends (status flips to 'result').
  // Fired from an effect — NOT during render — so updating the parent's stats
  // context (onXp → award) doesn't trigger a render-phase cross-component update.
  // xpFiredRef guards against re-firing while status stays 'result'; it resets
  // when a new ride begins (status back to 'playing').
  const xpFiredRef = useRef(false);
  useEffect(() => {
    if (state.status === 'result' && !xpFiredRef.current) {
      xpFiredRef.current = true;
      onXp(state.score);
    } else if (state.status === 'playing') {
      xpFiredRef.current = false;
    }
  }, [state.status, state.score, onXp]);

  const answer = useCallback((optionIndex: number, responseMs: number) => {
    const q = questionsRef.current[idxRef.current];
    if (!q) return;
    dispatch({
      type: 'ANSWER',
      optionIndex,
      responseMs,
      correctIndex: q.correctIndex,
    });
  }, []); // no deps — reads everything through refs

  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  const currentQ = questions[Math.min(state.idx, questions.length - 1)]!;

  return {
    status: state.status,
    runIndex: state.runZones.length,
    questionInRun: state.runTiers.length,
    current: currentQ,
    combo: state.combo,
    score: state.score,
    aim: state.aim,
    runZones: state.runZones,
    total: state.total,
    isNewBest: state.isNewBest,
    previousBest,
    answer,
    reset,
  };
}
