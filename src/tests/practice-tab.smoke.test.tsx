/**
 * practice-tab.smoke.test.tsx — safety net for the 1d decomposition.
 *
 * PracticeTab is a 2577-line single component (state + ~10 launch handlers +
 * a ~900-line EXERCISES catalog + a smart-recommendations block + 4 intent
 * panels) with NO prior test. This smoke test is the net for splitting it
 * (roadmap 1d): it mounts the hub with minimal valid props/mocks and asserts
 * the practice hub renders. Each extraction step (recommendations hook, intent
 * subviews, etc.) must keep this green.
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../context/AppContext', () => ({ useApp: vi.fn(() => ({ setScr: vi.fn() })) }));
vi.mock('../context/StatsContext', () => ({
  useStats: vi.fn(() => ({
    stats: {
      xp: 0,
      lc: 0,
      gc: 0,
      sp: 0,
      de: 0,
      rc: 0,
      pf: 0,
      mv: 0,
      hi: 0,
      str: 0,
      ct: [],
      vs: [],
      rs: [],
      badges: [],
    },
  })),
}));
vi.mock('../hooks/useContent', () => ({ useContent: vi.fn(() => ({ content: { V: {} } })) }));
vi.mock('../hooks/useAdaptivePractice', () => ({
  useAdaptivePractice: vi.fn(() => ({ practiceQueue: [] })),
}));
vi.mock('../data', () => ({
  LISTEN: [],
  getSR: vi.fn(() => ({})),
  getDueReviews: vi.fn(() => []),
  lvl: vi.fn(() => 1),
  getStreak: vi.fn(() => ({ count: 0, last: '' })),
}));
vi.mock('../lib/cefr', () => ({
  isUnlocked: vi.fn(() => true),
  getUserCefr: vi.fn(() => 'A1'),
}));
vi.mock('../lib/dateUtils.js', () => ({ localDateStr: vi.fn(() => '2026-05-30') }));
vi.mock('../components/home/DailyListeningCard', () => ({ default: () => null }));
vi.mock('../components/home/WeakWordsPanel', () => ({ default: () => null }));
vi.mock('../components/home/QuestTracker', () => ({ default: () => null }));
vi.mock('../components/home/SpeedChallenge', () => ({ default: () => null }));

import PracticeTab from '../components/practice/PracticeTab';

const noop = vi.fn();
const props = {
  allCats: ['greetings'],
  sh: <T,>(arr: T[]) => arr,
  sCurEx: noop,
  onLaunchQuiz: noop,
  onLaunchFlash: noop,
  onLaunchListen: noop,
  onLaunchMatch: noop,
  onLaunchSpeaking: noop,
  award: noop,
  launchPathItem: noop,
};

describe('PracticeTab — smoke / 1d safety net', () => {
  it('mounts and renders the practice hub', () => {
    render(<PracticeTab {...props} />);
    // Hero eyebrow ("Practice") + level line are always rendered.
    expect(screen.getAllByText('Practice').length).toBeGreaterThan(0);
    expect(screen.getByText(/Level/)).toBeInTheDocument();
  });
});
