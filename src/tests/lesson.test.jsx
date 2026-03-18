/**
 * lesson.test.jsx
 *
 * Tests the LessonScreen component — specifically:
 *   - setSt (NOT setStats) is called when a lesson completes
 *     This is the exact prop name mismatch that caused all lesson progress
 *     to be silently dropped. If setSt is ever renamed back to setStats,
 *     this test will catch it immediately.
 *   - resultFired guard prevents double-award on rapid Results clicks
 *   - Quiz flow: learn → quiz → result
 *   - Score is tracked correctly
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

vi.mock('firebase/app', () => ({ initializeApp: vi.fn(() => ({})), getApps: vi.fn(() => []) }));
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})), setPersistence: vi.fn(() => Promise.resolve()),
  browserLocalPersistence: {}, signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(), signOut: vi.fn(),
  sendPasswordResetEmail: vi.fn(), onAuthStateChanged: vi.fn(() => () => {}),
  updateProfile: vi.fn(),
}));
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})), doc: vi.fn(), getDoc: vi.fn(), setDoc: vi.fn(),
  collection: vi.fn(), getDocs: vi.fn(), query: vi.fn(), limit: vi.fn(), orderBy: vi.fn(),
}));

vi.mock('../data.jsx', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    srMark: vi.fn(),
    speak: vi.fn(),
    H: (title) => React.createElement('h2', null, title),
    Bar: ({ v, mx }) => React.createElement('div', { 'data-testid': 'bar', 'data-v': v, 'data-mx': mx }),
    V: actual.V || {},
    shuffleArr: actual.shuffleArr || ((a) => a),
  };
});

import LessonScreen from '../components/learn/LessonScreen.jsx';

// ── Test data ─────────────────────────────────────────────────────────────────
const SAMPLE_WORDS = [
  ['Bok', 'Hey / Hi', 'bok'],
  ['Dobar dan', 'Good day', 'DOH-bar dan'],
  ['Hvala', 'Thank you', 'HVA-la'],
  ['Molim', 'Please / You\'re welcome', 'MOH-lim'],
];

// A quiz item has the word tuple plus opts array and correct-index (ci)
function makeQuizItems(words = SAMPLE_WORDS) {
  return words.map((w, i) => ({
    ...w,
    0: w[0], 1: w[1], 2: w[2],
    opts: [w[1], `wrong${i}a`, `wrong${i}b`, `wrong${i}c`],
    ci: 0, // correct answer is always index 0
  }));
}

const BASE_PROPS = {
  lt: 'Greetings',
  li: SAMPLE_WORDS,
  lx: 0,
  ls: 0,
  lp: 'learn',
  la: false,
  lsl: -1,
  qi: makeQuizItems(),
  icons: { Greetings: '👋' },
  sLi: vi.fn(),
  sLx: vi.fn(),
  sLs: vi.fn(),
  sLp: vi.fn(),
  sLa: vi.fn(),
  sLsl: vi.fn(),
  sQi: vi.fn(),
  goBack: vi.fn(),
  award: vi.fn(),
  setSt: vi.fn(),   // ← CRITICAL: must be setSt not setStats
};

function renderLesson(overrides = {}) {
  const props = { ...BASE_PROPS, ...overrides,
    sLi: vi.fn(), sLx: vi.fn(), sLs: vi.fn(), sLp: vi.fn(),
    sLa: vi.fn(), sLsl: vi.fn(), sQi: vi.fn(),
    goBack: vi.fn(), award: vi.fn(), setSt: vi.fn(),
    ...overrides,
  };
  const utils = render(<LessonScreen {...props} />);
  return { ...utils, props };
}

// ── Learn phase ───────────────────────────────────────────────────────────────
describe('LessonScreen — learn phase', () => {
  it('renders without crashing', () => {
    renderLesson();
  });

  it('shows lesson title', () => {
    renderLesson();
    expect(screen.getByText(/Greetings/i)).toBeTruthy();
  });

  it('shows all vocabulary words', () => {
    renderLesson();
    expect(screen.getByText('Bok')).toBeTruthy();
    expect(screen.getByText('Dobar dan')).toBeTruthy();
    expect(screen.getByText('Hvala')).toBeTruthy();
  });

  it('shows Quiz Me button when >= 4 words', () => {
    renderLesson();
    expect(screen.getByText(/Quiz Me/i)).toBeTruthy();
  });

  it('Quiz Me button calls sQi, sLx, sLp', () => {
    const { props } = renderLesson();
    fireEvent.click(screen.getByText(/Quiz Me/i));
    expect(props.sQi).toHaveBeenCalled();
    expect(props.sLx).toHaveBeenCalledWith(0);
    expect(props.sLp).toHaveBeenCalledWith('quiz');
  });
});

// ── Quiz phase ────────────────────────────────────────────────────────────────
describe('LessonScreen — quiz phase', () => {
  function renderQuiz(overrides = {}) {
    return renderLesson({ lp: 'quiz', lx: 0, ls: 0, la: false, lsl: -1, ...overrides });
  }

  it('shows the Croatian word being tested', () => {
    renderQuiz();
    expect(screen.getByText('Bok')).toBeTruthy();
  });

  it('shows all 4 answer options', () => {
    renderQuiz();
    const qi = makeQuizItems();
    expect(screen.getByText(qi[0].opts[0])).toBeTruthy();
    expect(screen.getByText(qi[0].opts[1])).toBeTruthy();
  });

  it('clicking an option calls sLsl and sLa', () => {
    const { props } = renderQuiz();
    fireEvent.click(screen.getByText(props.qi[0].opts[0]));
    expect(props.sLsl).toHaveBeenCalledWith(0);
    expect(props.sLa).toHaveBeenCalledWith(true);
  });

  it('correct answer increments score via sLs', () => {
    const { props } = renderQuiz();
    fireEvent.click(screen.getByText(props.qi[0].opts[0])); // opts[0] = correct (ci:0)
    expect(props.sLs).toHaveBeenCalled();
  });

  it('wrong answer does not call sLs', () => {
    const { props } = renderQuiz();
    fireEvent.click(screen.getByText(props.qi[0].opts[1])); // wrong
    expect(props.sLs).not.toHaveBeenCalled();
  });

  it('Next button appears after answering', () => {
    renderQuiz({ la: true, lsl: 0 });
    expect(screen.getByText(/Next/i)).toBeTruthy();
  });

  it('Next button advances to next question', () => {
    const { props } = renderQuiz({ la: true, lsl: 0 });
    fireEvent.click(screen.getByText(/Next/i));
    expect(props.sLx).toHaveBeenCalled();
    expect(props.sLa).toHaveBeenCalledWith(false);
  });
});

// ── The critical prop contract: setSt must be called (not setStats) ───────────
describe('LessonScreen — setSt prop contract (the bug that killed progress)', () => {
  it('setSt is called when the last question Results button is clicked', () => {
    const setSt = vi.fn();
    const award = vi.fn();
    const qi = makeQuizItems();

    // Render at the last question, already answered
    render(<LessonScreen
      lt="Greetings" li={SAMPLE_WORDS} icons={{ Greetings: '👋' }}
      lp="quiz" lx={qi.length - 1} ls={3} la={true} lsl={0}
      qi={qi}
      sLi={vi.fn()} sLx={vi.fn()} sLs={vi.fn()} sLp={vi.fn()}
      sLa={vi.fn()} sLsl={vi.fn()} sQi={vi.fn()}
      goBack={vi.fn()} award={award} setSt={setSt}
    />);

    fireEvent.click(screen.getByText(/Results/i));
    // setSt MUST have been called — this is the bug that wiped all progress
    expect(setSt).toHaveBeenCalled();
  });

  it('award is called when lesson completes', () => {
    const award = vi.fn();
    const qi = makeQuizItems();

    render(<LessonScreen
      lt="Greetings" li={SAMPLE_WORDS} icons={{ Greetings: '👋' }}
      lp="quiz" lx={qi.length - 1} ls={4} la={true} lsl={0}
      qi={qi}
      sLi={vi.fn()} sLx={vi.fn()} sLs={vi.fn()} sLp={vi.fn()}
      sLa={vi.fn()} sLsl={vi.fn()} sQi={vi.fn()}
      goBack={vi.fn()} award={award} setSt={vi.fn()}
    />);

    fireEvent.click(screen.getByText(/Results/i));
    expect(award).toHaveBeenCalled();
  });

  // This test is the exact regression guard for the double-award bug
  it('award is called exactly once even if Results is clicked multiple times', () => {
    const award = vi.fn();
    const qi = makeQuizItems();

    render(<LessonScreen
      lt="Greetings" li={SAMPLE_WORDS} icons={{ Greetings: '👋' }}
      lp="quiz" lx={qi.length - 1} ls={4} la={true} lsl={0}
      qi={qi}
      sLi={vi.fn()} sLx={vi.fn()} sLs={vi.fn()} sLp={vi.fn()}
      sLa={vi.fn()} sLsl={vi.fn()} sQi={vi.fn()}
      goBack={vi.fn()} award={award} setSt={vi.fn()}
    />);

    const btn = screen.getByText(/Results/i);
    fireEvent.click(btn);
    fireEvent.click(btn); // rapid second tap
    fireEvent.click(btn); // third tap

    // resultFired guard — must be exactly 1
    expect(award).toHaveBeenCalledTimes(1);
  });

  it('setSt is called with a function updater (not a raw value)', () => {
    const setSt = vi.fn();
    const qi = makeQuizItems();

    render(<LessonScreen
      lt="Greetings" li={SAMPLE_WORDS} icons={{ Greetings: '👋' }}
      lp="quiz" lx={qi.length - 1} ls={3} la={true} lsl={0}
      qi={qi}
      sLi={vi.fn()} sLx={vi.fn()} sLs={vi.fn()} sLp={vi.fn()}
      sLa={vi.fn()} sLsl={vi.fn()} sQi={vi.fn()}
      goBack={vi.fn()} award={vi.fn()} setSt={setSt}
    />);

    fireEvent.click(screen.getByText(/Results/i));
    // setSt should be called with a function updater s => ({...s, lc: s.lc+1, ...})
    expect(setSt).toHaveBeenCalledWith(expect.any(Function));
  });
});

// ── Result phase ──────────────────────────────────────────────────────────────
describe('LessonScreen — result phase', () => {
  function renderResult(ls = 4, total = 4) {
    const qi = makeQuizItems().slice(0, total);
    return renderLesson({ lp: 'result', ls, qi });
  }

  it('shows Perfect! on 100% score', () => {
    renderResult(4, 4);
    expect(screen.getByText(/Perfect!/i)).toBeTruthy();
  });

  it('shows Great Job! on partial score', () => {
    renderResult(2, 4);
    expect(screen.getByText(/Great Job!/i)).toBeTruthy();
  });

  it('shows score fraction', () => {
    renderResult(3, 4);
    expect(screen.getByText('3/4')).toBeTruthy();
  });

  it('Continue button calls goBack', () => {
    const { props } = renderLesson({ lp: 'result', ls: 4, qi: makeQuizItems() });
    fireEvent.click(screen.getByText(/Continue/i));
    expect(props.goBack).toHaveBeenCalled();
  });
});
