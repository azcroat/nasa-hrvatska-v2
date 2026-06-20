/**
 * hero-section.smoke.test.tsx — safety net for the 1c decomposition.
 *
 * HeroSection is a 2009-line file (1224-line main component, 14 hooks, plus
 * inline data consts, pure helpers, and 2 small components) with NO prior test.
 * This smoke test is the net for splitting those out (roadmap 1c): it mounts the
 * hero with minimal valid props and asserts the expanded hero renders. Each
 * extraction step (data → helpers → subviews → useHero hook) must keep this
 * green — if the hero stops mounting or a moved helper/const breaks, this fails.
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// framer-motion: render children through plain elements (no animation).
vi.mock('framer-motion', () => {
  const passthrough = (tag: string) =>
    function MotionStub(props: Record<string, unknown>) {
      const { children, className, style, onClick, ['aria-label']: ariaLabel } = props as never;
      return React.createElement(
        tag,
        { className, style, onClick, 'aria-label': ariaLabel },
        children,
      );
    };
  const motion = new Proxy({}, { get: (_t, tag: string) => passthrough(tag) });
  return { motion, AnimatePresence: ({ children }: { children: React.ReactNode }) => children };
});

vi.mock('../context/AppContext', () => ({ useApp: vi.fn(() => ({ name: 'Test' })) }));
vi.mock('../context/StatsContext', () => ({
  useStats: vi.fn(() => ({
    level: 1,
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
    award: vi.fn(),
    setStats: vi.fn(),
  })),
}));
vi.mock('../hooks/useContent', () => ({
  useContent: vi.fn(() => ({ content: { LEVEL_NARRATIVE: {} } })),
}));
vi.mock('../hooks/useTranslator', () => ({
  useTranslator: vi.fn(() => ({
    tDir: 'en-hr',
    setTDir: vi.fn(),
    tIn: '',
    setTIn: vi.fn(),
    tOut: '',
    setTOut: vi.fn(),
    tL: false,
    doTr: vi.fn(),
  })),
}));
vi.mock('../data', () => ({
  lXP: vi.fn(() => 0),
  nXP: vi.fn(() => 100),
  earnFreeze: vi.fn(),
  getStreakFreezes: vi.fn(() => 0),
  speak: vi.fn(),
}));
vi.mock('../lib/appUtils.js', () => ({
  getDailyXP: vi.fn(() => 0),
  getDailyXPGoal: vi.fn(() => 50),
  getXPBoost: vi.fn(() => ({ active: false })),
  activateXPBoost: vi.fn(),
  canActivateXPBoost: vi.fn(() => false),
  XP_BOOST_COST: 200,
}));
vi.mock('../components/shared/CroatianGrb', () => ({ default: () => null }));

import HeroSection from '../components/home/HeroSection';

const PATH_DATA = {
  nextItem: null,
  activeLv: { level: 1, title: 'Level 1', items: [] },
  activeLvDone: 0,
};

describe('HeroSection — smoke / 1c safety net', () => {
  it('mounts and renders the expanded hero', () => {
    render(
      <HeroSection
        streak={{ count: 3, last: '2026-05-30' }}
        pathData={PATH_DATA}
        allQuestsDone={false}
      />,
    );
    // The hero defaults to expanded → the collapse affordance is present.
    expect(screen.getByText('Hide details')).toBeInTheDocument();
    expect(screen.getByLabelText('Collapse hero section')).toBeInTheDocument();
  });
});
