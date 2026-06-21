/**
 * svojmoj-screen.test.tsx — behavioral test for SvojMojScreen completion gate.
 *
 * Audit follow-up: SvojMojScreen used to award per-answer XP but NEVER credited
 * lesson completion (gc/vs), so the gated 'svojmoj' lesson could never be marked
 * complete. It now routes completion through completeExercise once every quiz
 * question is answered — credited only on a >=75% pass.
 *
 * The quiz options are NOT shuffled (rendered straight from q.opts), so we can
 * drive a deterministic pass (click each q.a) or fail (click a wrong option) and
 * assert the gate credits / withholds accordingly.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import { SVOJMOJ } from '../data';

// ── Stats context mock — capture the completion write ──────────────────────────
const statsState = vi.hoisted(() => ({
  current: { vs: [] as string[], gc: 0, lc: 0, sp: 0, rc: 0, xp: 0, mv: 0 } as Record<
    string,
    unknown
  >,
}));
const setStats = vi.hoisted(() => vi.fn());
const writeDelta = vi.hoisted(() => vi.fn());
vi.mock('../context/StatsContext', () => ({
  useStats: () => ({ stats: statsState.current, setStats, writeDelta }),
}));

// ── quests mock ────────────────────────────────────────────────────────────────
const markQuest = vi.hoisted(() => vi.fn());
vi.mock('../lib/quests', () => ({ markQuest }));

import SvojMojScreen from '../components/learn/SvojMojScreen';

function answerAll(container: HTMLElement, pick: (qi: number) => string) {
  const blocks = Array.from(container.querySelectorAll('.c'));
  SVOJMOJ.quiz.forEach((_q, qi) => {
    const block = blocks[qi];
    if (!block) throw new Error(`missing quiz block ${qi}`);
    const want = pick(qi);
    const btn = Array.from(block.querySelectorAll('button')).find((b) => b.textContent === want);
    if (!btn) throw new Error(`option "${want}" not found in block ${qi}`);
    fireEvent.click(btn);
  });
}

describe('SvojMojScreen completion gate', () => {
  beforeEach(() => {
    statsState.current = { vs: [], gc: 0, lc: 0, sp: 0, rc: 0, xp: 0, mv: 0 };
    setStats.mockClear();
    writeDelta.mockClear();
    markQuest.mockClear();
  });

  it('credits completion (gc + vs + quest) when all answers are correct (>=75%)', () => {
    const award = vi.fn();
    const { container } = render(<SvojMojScreen goBack={vi.fn()} award={award} />);

    answerAll(container, (qi) => SVOJMOJ.quiz[qi]!.a);

    // Gate passed → the single authority writes the gc/vs delta and marks the quest.
    expect(writeDelta).toHaveBeenCalledWith({ gc: 1, vs: ['svojmoj'] });
    expect(markQuest).toHaveBeenCalledWith('grammar');
    // Per-answer XP still awarded once per correct answer.
    expect(award).toHaveBeenCalledTimes(SVOJMOJ.quiz.length);
  });

  it('does NOT credit completion when the quiz is failed (all wrong)', () => {
    const award = vi.fn();
    const { container } = render(<SvojMojScreen goBack={vi.fn()} award={award} />);

    answerAll(container, (qi) => {
      const q = SVOJMOJ.quiz[qi]!;
      const wrong = q.opts.find((o: string) => o !== q.a);
      if (!wrong) throw new Error(`no wrong option for block ${qi}`);
      return wrong;
    });

    // Gate failed → no completion credit, no quest mark.
    expect(writeDelta).not.toHaveBeenCalledWith(expect.objectContaining({ vs: ['svojmoj'] }));
    expect(markQuest).not.toHaveBeenCalled();
  });
});
