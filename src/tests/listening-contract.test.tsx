/**
 * Exercise Contract: ListeningScreen
 *
 * Verifies that on quiz completion ListeningScreen fires:
 *   1. award(xp > 0, false, 'listening')
 *   2. markQuest('speak')
 *   3. setStats — produces lc: +1, vs includes 'listening'
 *   4. writeDelta({ lc: 1, vs: ['listening'] })
 *
 * ListeningScreen IS the comprehension quiz (hear HR sentence, pick EN meaning).
 * The contract fires on the "Finish!" button on the results screen.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StatsProvider } from '../context/StatsContext';
import type { Stats, StatsContextValue } from '../types';

// -- random mock: Fisher-Yates becomes identity (no swaps) --------------------
vi.mock('../lib/random.js', () => ({ rnd: () => 0.9999 }));

// -- quests mock --------------------------------------------------------------
const markQuestMock = vi.fn();
vi.mock('../lib/quests.js', () => ({
  markQuest: (...args: unknown[]) => markQuestMock(...args),
}));

// -- knightSpeak mock (called in useEffect on mount) --------------------------
vi.mock('../lib/knightSpeak.js', () => ({
  knightSpeak: vi.fn(),
  knightFlash: vi.fn(),
}));

// -- data mock: stub speak/speakSlow/sh; pass Bar through ---------------------
vi.mock('../data', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as object),
    speak: vi.fn(),
    speakSlow: vi.fn(),
    // sh = shuffle; with rnd()===0.9999, Fisher-Yates is already a no-op,
    // but we override anyway to guarantee opts[0] stays the correct answer.
    sh: (arr: unknown[]) => [...arr],
  };
});

// -- recordTopicResult mock ---------------------------------------------------
vi.mock('../lib/adaptive.js', () => ({
  recordTopicResult: vi.fn(),
}));

import ListeningScreen from '../components/practice/ListeningScreen';

// Minimal question set: one item where en === opts[0] (correct by position).
const QUESTIONS = [
  {
    hr: 'Dobar dan.',
    en: 'Good day.',
    opts: ['Good day.', 'Good night.', 'Hello.', 'Goodbye.'],
    tip: 'Standard daytime greeting.',
  },
  {
    hr: 'Hvala.',
    en: 'Thank you.',
    opts: ['Thank you.', 'Please.', 'Sorry.', 'Excuse me.'],
  },
];

function makeCtx(vsAlreadyDone = false) {
  const setStats = vi.fn();
  const writeDelta = vi.fn();
  const dispatch = vi.fn();
  const award = vi.fn();
  const stats: Stats = {
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
    authLoading: 0,
    diff: 'beginner',
    ct: [],
    vs: vsAlreadyDone ? ['listening'] : [],
    rs: [],
    badges: [],
  };
  const value: StatsContextValue = { stats, setStats, writeDelta, dispatch, award, level: 1 };
  return { value, setStats, writeDelta, award };
}

/**
 * Drive through the quiz: answer every question then click Finish.
 * opts[0] is correct because sh() is identity and rnd() is near-1.
 */
async function completeListeningQuiz() {
  const total = QUESTIONS.length;
  for (let i = 0; i < total; i++) {
    // Click the first option button (correct answer = opts[0])
    const optBtns = document.querySelectorAll('button.ob');
    if (optBtns.length > 0) {
      fireEvent.click(optBtns[0] as HTMLElement);
    }
    // Click Next / See Results
    const advBtn = screen
      .queryAllByRole('button')
      .find((b) => /next|see results/i.test(b.textContent || ''));
    if (advBtn) fireEvent.click(advBtn);
  }
  // Click Finish on the results screen
  const finish = screen.queryByRole('button', { name: /finish/i });
  if (finish) fireEvent.click(finish);
}

describe('ListeningScreen -- Exercise Contract', () => {
  beforeEach(() => {
    markQuestMock.mockClear();
  });

  it('fires award, markQuest, setStats, writeDelta on Finish', async () => {
    const { value, setStats, writeDelta, award } = makeCtx();
    const goBack = vi.fn();

    render(
      <StatsProvider value={value}>
        <ListeningScreen questions={QUESTIONS} goBack={goBack} award={award} />
      </StatsProvider>,
    );

    await completeListeningQuiz();

    // 1. award fired once with positive XP and activityType 'listening'
    expect(award).toHaveBeenCalledTimes(1);
    expect(award.mock.calls[0]![0]).toBeGreaterThan(0);
    expect(award.mock.calls[0]![2]).toBe('listening');

    // 2. markQuest called with 'speak' (listening counts toward speak quest)
    expect(markQuestMock).toHaveBeenCalledWith('speak');

    // 3. setStats called at least once
    expect(setStats).toHaveBeenCalled();

    // 4. writeDelta called with lc: 1 and vs containing 'listening'
    expect(writeDelta).toHaveBeenCalledWith(
      expect.objectContaining({ lc: 1, vs: expect.arrayContaining(['listening']) }),
    );

    // 5. goBack called to exit
    expect(goBack).toHaveBeenCalled();
  });

  it('does not double-fire if vs already includes listening', async () => {
    const { value, setStats, writeDelta, award } = makeCtx(true /* vs already has 'listening' */);
    const goBack = vi.fn();

    render(
      <StatsProvider value={value}>
        <ListeningScreen questions={QUESTIONS} goBack={goBack} award={award} />
      </StatsProvider>,
    );

    await completeListeningQuiz();

    // award still fires (XP always awarded)
    expect(award).toHaveBeenCalledTimes(1);

    // But setStats / writeDelta should NOT fire (guard prevents double-credit)
    expect(setStats).not.toHaveBeenCalled();
    expect(writeDelta).not.toHaveBeenCalled();
  });

  it('does not double-fire contract if Finish clicked twice', async () => {
    const { value, award, writeDelta } = makeCtx();
    const goBack = vi.fn();

    render(
      <StatsProvider value={value}>
        <ListeningScreen questions={QUESTIONS} goBack={goBack} award={award} />
      </StatsProvider>,
    );

    await completeListeningQuiz();

    // Attempt to click Finish a second time (simulates rapid double-tap)
    const finish = screen.queryByRole('button', { name: /finish/i });
    if (finish) fireEvent.click(finish);

    // finishFired ref ensures exactly one award
    expect(award).toHaveBeenCalledTimes(1);
    expect(writeDelta).toHaveBeenCalledTimes(1);
  });
});
