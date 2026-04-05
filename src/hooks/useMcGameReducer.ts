/**
 * useMcGameReducer — all McGame state in a single reducer.
 *
 * Why useReducer here:
 *  • handleAnswer dispatches 6–10 state updates atomically — with useState those
 *    updates are batched in React 18 but reading stale closures is still a hazard.
 *  • The reducer makes every transition explicit, auditable, and unit-testable
 *    without mounting a component.
 *  • Timer callbacks only ever dispatch action objects — they never read stale state.
 */

import { useReducer } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────

export interface McQuestion {
  q?: string;
  prompt?: string;
  hr?: string;
  en?: string;
  correct: string;
  opts: string[];
  category?: string;
  _qIdx: number;
  _isRetry: boolean;
}

export interface McGameState {
  // Queue management
  queue: McQuestion[];
  clearedCount: number;
  // Scoring
  score: number;
  hearts: number;
  gameOver: boolean;
  continueAnyway: boolean;
  practiceMode: boolean;
  // Answer state (reset on each ADVANCE)
  answered: boolean;
  selected: number;          // option index selected, -1 = none
  revealCorrect: boolean;
  grammarTip: string | null;
  qTransition: boolean;
  // Streak tracking
  streak: number;
  bestStreak: number;
  wrongStreak: number;
  correctStreak: number;
  comboMsg: string;
  showCombo: boolean;
  streakPulse: boolean;
  showOnARoll: boolean;
  // Animation signals (cleared by timer-dispatched actions)
  burst: number;             // option index showing burst glow, -1 = none
  shaking: boolean;
  glowIndex: number;         // option index showing hint glow, -1 = none
  // UI
  confirmQuit: boolean;
  // Mistake log for post-game review
  mistakes: McQuestion[];
}

// Payload for the ANSWER action — side-effectful work (loseHeart, srMark,
// recordMistake, knightSpeak) is done by the caller before dispatching.
interface AnswerPayload {
  isCorrect: boolean;
  optionIndex: number;
  question: McQuestion;
  grammarTip: string | null;
  /** Result of loseHeart() when isHeartsMode — undefined otherwise. */
  persistentHeartsAfter: number | undefined;
  isHeartsMode: boolean;
}

export type McGameAction =
  | { type: 'ANSWER'; payload: AnswerPayload }
  | { type: 'ADVANCE_CORRECT' }
  | { type: 'RE_QUEUE_WRONG' }
  | { type: 'COMPLETE_TRANSITION' }
  | { type: 'TRIGGER_GAME_OVER' }
  | { type: 'SET_CONFIRM_QUIT'; value: boolean }
  | { type: 'TOGGLE_PRACTICE_MODE' }
  | { type: 'SET_CONTINUE_ANYWAY' }
  | { type: 'CLEAR_BURST' }
  | { type: 'CLEAR_SHAKE' }
  | { type: 'HIDE_COMBO' }
  | { type: 'CLEAR_GLOW' }
  | { type: 'CLEAR_ON_A_ROLL' }
  | { type: 'RESET'; questions: McQuestion[]; hearts: number };

// ── Reducer ──────────────────────────────────────────────────────────────────

function comboMessage(streak: number): string {
  if (streak === 3)  return '🔥 3 in a row!';
  if (streak === 5)  return '⚡ On fire! 5 streak!';
  if (streak === 10) return '💥 Unstoppable! 10 streak!';
  if (streak === 15) return '🌟 Legendary!';
  return '';
}

function mcGameReducer(state: McGameState, action: McGameAction): McGameState {
  switch (action.type) {

    case 'ANSWER': {
      const { isCorrect, optionIndex, question, grammarTip, persistentHeartsAfter, isHeartsMode } = action.payload;

      if (isCorrect) {
        const newStreak      = state.streak + 1;
        const newBest        = Math.max(state.bestStreak, newStreak);
        const newCorrect     = state.correctStreak + 1;
        const msg            = comboMessage(newStreak);
        const hasCombo       = msg.length > 0;
        const showOnARoll    = newCorrect === 5;

        return {
          ...state,
          answered:      true,
          selected:      optionIndex,
          burst:         optionIndex,
          score:         state.score + 1,
          streak:        newStreak,
          bestStreak:    newBest,
          wrongStreak:   0,
          correctStreak: newCorrect,
          comboMsg:      msg,
          showCombo:     hasCombo,
          streakPulse:   hasCombo,
          showOnARoll:   showOnARoll || state.showOnARoll,
          grammarTip:    null,
          revealCorrect: false,
        };
      }

      // Wrong answer
      const newWrongStreak = state.wrongStreak + 1;
      // Hint glow: reveal correct option after 3 consecutive wrong answers
      const correctIdx = newWrongStreak >= 3 ? question.opts.indexOf(question.correct) : -1;

      // Heart deduction (pure calculation — side effects handled by caller)
      let newHearts = state.hearts;
      if (isHeartsMode) {
        // persistentHeartsAfter is the result of loseHeart() called by the component
        newHearts = persistentHeartsAfter ?? state.hearts;
      } else if (!state.practiceMode) {
        newHearts = Math.max(0, state.hearts - 1);
      }

      const newMistakes = (() => {
        const key = question.hr || question.q || question.correct;
        if (state.mistakes.some(m => (m.hr || m.q || m.correct) === key)) return state.mistakes;
        return [...state.mistakes, question];
      })();

      return {
        ...state,
        answered:      true,
        selected:      optionIndex,
        revealCorrect: true,
        grammarTip,
        shaking:       true,
        streak:        0,
        correctStreak: 0,
        wrongStreak:   newWrongStreak,
        glowIndex:     correctIdx,
        showCombo:     false,
        comboMsg:      '',
        streakPulse:   false,
        hearts:        newHearts,
        mistakes:      newMistakes,
      };
    }

    case 'ADVANCE_CORRECT': {
      // Move past the first (correctly answered) item.
      // The caller checks queue.length === 1 to fire onComplete before dispatching.
      return {
        ...state,
        queue:        state.queue.slice(1),
        clearedCount: state.clearedCount + 1,
        answered:     false,
        selected:     -1,
        revealCorrect: false,
        grammarTip:   null,
        qTransition:  true,
      };
    }

    case 'RE_QUEUE_WRONG': {
      // Wrong answer: move first item to end of queue (DuoLingo re-queue pattern)
      const [current, ...rest] = state.queue;
      return {
        ...state,
        queue:         [...rest, { ...current, _isRetry: true }],
        answered:      false,
        selected:      -1,
        revealCorrect: false,
        grammarTip:    null,
        qTransition:   true,
      };
    }

    case 'COMPLETE_TRANSITION':
      return { ...state, qTransition: false };

    case 'TRIGGER_GAME_OVER':
      return { ...state, gameOver: true };

    case 'SET_CONFIRM_QUIT':
      return { ...state, confirmQuit: action.value };

    case 'TOGGLE_PRACTICE_MODE':
      return { ...state, practiceMode: !state.practiceMode };

    case 'SET_CONTINUE_ANYWAY':
      return { ...state, continueAnyway: true, gameOver: false };

    case 'CLEAR_BURST':
      return { ...state, burst: -1 };

    case 'CLEAR_SHAKE':
      return { ...state, shaking: false };

    case 'HIDE_COMBO':
      return { ...state, showCombo: false, streakPulse: false };

    case 'CLEAR_GLOW':
      return { ...state, glowIndex: -1 };

    case 'CLEAR_ON_A_ROLL':
      return { ...state, showOnARoll: false };

    case 'RESET':
      return {
        ...buildInitialState(action.questions, action.hearts),
      };

    default:
      return state;
  }
}

// ── Initial state builder ────────────────────────────────────────────────────

export function buildInitialState(questions: McQuestion[], hearts: number): McGameState {
  return {
    queue:         questions.map((q, i) => ({ ...q, _qIdx: i, _isRetry: false })),
    clearedCount:  0,
    score:         0,
    hearts,
    gameOver:      false,
    continueAnyway: false,
    practiceMode:  false,
    answered:      false,
    selected:      -1,
    revealCorrect: false,
    grammarTip:    null,
    qTransition:   false,
    streak:        0,
    bestStreak:    0,
    wrongStreak:   0,
    correctStreak: 0,
    comboMsg:      '',
    showCombo:     false,
    streakPulse:   false,
    showOnARoll:   false,
    burst:         -1,
    shaking:       false,
    glowIndex:     -1,
    confirmQuit:   false,
    mistakes:      [],
  };
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useMcGameReducer(initialQuestions: McQuestion[], initialHearts: number) {
  return useReducer(mcGameReducer, undefined, () =>
    buildInitialState(initialQuestions, initialHearts)
  );
}
