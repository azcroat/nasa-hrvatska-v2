/**
 * genitiveDrillGate.test.tsx — Phase 1 of the completion-authority overhaul.
 *
 * Verifies GenitiveDrill is GATED: LEARN_PATH completion (vs + award + quest) is granted
 * only at >= 75% correct; below that the drill offers a Retry and writes nothing.
 *
 * rnd()=0.9999 freezes the Fisher-Yates shuffle to identity, so opts[0] === answer for
 * every question. Clicking the 1st option = correct; clicking the 2nd = wrong.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

vi.mock('firebase/app', () => ({ initializeApp: vi.fn(() => ({})), getApps: vi.fn(() => []) }));
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
}));

const markQuestMock = vi.fn();
vi.mock('../lib/quests', () => ({ markQuest: (...a: unknown[]) => markQuestMock(...a) }));

const awardMock = vi.fn();
const setStatsMock = vi.fn();
const writeDeltaMock = vi.fn();
vi.mock('../context/StatsContext', () => ({
  useStats: () => ({
    stats: { vs: [] as string[], gc: 0 },
    setStats: setStatsMock,
    dispatch: vi.fn(),
    award: awardMock,
    level: 1,
    writeDelta: writeDeltaMock,
  }),
  StatsProvider: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

vi.mock('../lib/random.js', () => ({ rnd: () => 0.9999 }));
vi.mock('../data', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    Bar: ({ v, mx }: { v: number; mx: number }) =>
      React.createElement('div', { 'data-testid': 'progress-bar', 'data-v': v, 'data-mx': mx }),
  };
});

import GenitiveDrill from '../components/practice/GenitiveDrill';

/** Drive the whole drill, clicking option index `optIdx` (0 = correct, 1 = wrong) each question. */
function runDrill(optIdx: number) {
  for (let i = 0; i < 400; i++) {
    const advance = screen
      .queryAllByRole('button')
      .find((b) => /next|see results/i.test(b.textContent || ''));
    if (advance) {
      fireEvent.click(advance);
      continue;
    }
    const opts = Array.from(document.querySelectorAll('button.ob')) as HTMLButtonElement[];
    if (opts.length === 0) break; // reached results screen
    fireEvent.click(opts[Math.min(optIdx, opts.length - 1)]!);
  }
}

beforeEach(() => {
  awardMock.mockClear();
  setStatsMock.mockClear();
  writeDeltaMock.mockClear();
  markQuestMock.mockClear();
});

describe('GenitiveDrill — 75% completion gate', () => {
  it('FAILS the gate below 75%: no vs write, no award, offers Retry', () => {
    render(<GenitiveDrill goBack={vi.fn()} award={awardMock} />);
    runDrill(1); // all wrong → 0%
    expect(awardMock).not.toHaveBeenCalled();
    expect(writeDeltaMock).not.toHaveBeenCalled();
    expect(setStatsMock).not.toHaveBeenCalled();
    expect(screen.getByTestId('drill-retry')).toBeTruthy();
  });

  it('PASSES the gate at 100%: writes genitive to vs, awards, marks quest', () => {
    render(<GenitiveDrill goBack={vi.fn()} award={awardMock} />);
    runDrill(0); // all correct → 100%
    expect(awardMock).toHaveBeenCalledTimes(1);
    expect(awardMock.mock.calls[0]![2]).toBe('grammar');
    expect(markQuestMock).toHaveBeenCalledWith('grammar');
    expect(writeDeltaMock).toHaveBeenCalledWith(
      expect.objectContaining({ gc: 1, vs: expect.arrayContaining(['genitive']) }),
    );
    const updater = setStatsMock.mock.calls[0]![0] as (p: { gc?: number; vs?: string[] }) => {
      gc?: number;
      vs?: string[];
    };
    const next = updater({ gc: 0, vs: [] });
    expect(next.gc).toBe(1);
    expect(next.vs).toContain('genitive');
  });
});
