/**
 * pronunciationAssess.honesty.test.tsx
 *
 * R2.10 — Pronunciation ASSESSMENT results must never fabricate a "0 / 100" grade-F headline
 * when ZERO phrases were acoustically scored.
 *
 * Background: PronunciationScorer emits `score: null` whenever a spoken phrase was recognized
 * only via its English translation (the default Web-Speech fallback path for short A1 phrases).
 * If every phrase is null, the average must be treated as "not scored" — NOT coerced to 0 — so
 * the results card shows a neutral completion summary instead of a discouraging F / "Beginner".
 *
 * Coverage:
 *   1. All-null phrase scores  → NO "/ 100" headline, NO "F" grade, neutral
 *      "phrases practiced ✓ / accent not acoustically scored" card.
 *   2. Mixed (one numeric, rest null) → numeric average headline renders (e.g. "80 / 100").
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';

// ── Controllable score queue: PronunciationScorer stub emits the next queued value ─────
// Each entry is the `score` passed to onScore({ spoken, score }).
let scoreQueue: Array<number | null> = [];

vi.mock('../components/shared/PronunciationScorer', () => ({
  default: ({ onScore }: { onScore?: (r: { spoken: string; score: number | null }) => void }) => (
    <button
      data-testid="emit-score"
      onClick={() => {
        const score = scoreQueue.length > 0 ? (scoreQueue.shift() as number | null) : null;
        onScore?.({ spoken: 'x', score });
      }}
    >
      emit-score
    </button>
  ),
}));

// AppContext.useApp() → only setScr is consumed.
vi.mock('../context/AppContext', () => ({
  useApp: () => ({ setScr: vi.fn() }),
}));

// StatsContext.useStats() → level drives the phrase bank (undefined → A1, 8 phrases).
vi.mock('../context/StatsContext', () => ({
  useStats: () => ({ level: 'A1' }),
}));

// quests.markQuest — no-op (avoids localStorage in jsdom).
vi.mock('../lib/quests.js', () => ({
  markQuest: vi.fn(),
}));

// random.rnd — deterministic (no shuffle effect) so phrase count is stable.
vi.mock('../lib/random.js', () => ({
  rnd: () => 0,
}));

import PronunciationAssessScreen from '../components/practice/PronunciationAssessScreen';

const TOTAL_PHRASES = 8; // A1 bank is sliced to 8 phrases

/** Drive the assessment from intro → results, emitting one score per phrase from `scores`. */
function runAssessment(scores: Array<number | null>) {
  scoreQueue = [...scores];
  render(<PronunciationAssessScreen goBack={vi.fn()} award={vi.fn()} />);

  // Intro → first phrase
  act(() => {
    screen.getByText(/Start Assessment/i).click();
  });

  for (let i = 0; i < TOTAL_PHRASES; i++) {
    // Emit a score for this phrase (reveals the Next / See Results button)
    act(() => {
      screen.getByTestId('emit-score').click();
    });
    const isLast = i === TOTAL_PHRASES - 1;
    act(() => {
      if (isLast) {
        screen.getByText(/See Results/i).click();
      } else {
        screen.getByText(/Next Phrase/i).click();
      }
    });
  }
}

describe('PronunciationAssessScreen — no fabricated 0/100-F when nothing acoustically scored', () => {
  beforeEach(() => {
    scoreQueue = [];
  });

  it('all-null phrase scores: NO "/ 100" headline, NO "F" grade, neutral completion card', () => {
    runAssessment(new Array(TOTAL_PHRASES).fill(null));

    // No fabricated headline / grade
    expect(screen.queryByText(/\/\s*100/)).toBeNull();
    expect(screen.queryByText(/^0 \/ 100$/)).toBeNull();
    expect(screen.queryByText('Beginner')).toBeNull();

    // Neutral honest completion card
    expect(screen.getByText(/phrases practiced ✓/i)).toBeInTheDocument();
    expect(screen.getByText(/accent not acoustically scored this session/i)).toBeInTheDocument();
  });

  it('mixed scores (one numeric, rest null): numeric average headline renders', () => {
    // One numeric 80, seven null → average over scored subset = 80.
    runAssessment([80, null, null, null, null, null, null, null]);

    expect(screen.getByText(/80 \/ 100/)).toBeInTheDocument();
    // Not the all-null neutral card
    expect(screen.queryByText(/accent not acoustically scored this session/i)).toBeNull();
  });
});
