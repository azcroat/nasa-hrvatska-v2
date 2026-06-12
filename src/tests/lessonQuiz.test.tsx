import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LessonQuiz from '../components/learn/LessonQuiz';

vi.mock('../context/StatsContext', () => ({
  useStats: () => ({ stats: { vs: [], lc: 0, gc: 0 }, setStats: vi.fn(), writeDelta: vi.fn() }),
}));

const questions = [
  { prompt: 'Q1', options: ['a', 'b'], correctIdx: 0 },
  { prompt: 'Q2', options: ['a', 'b'], correctIdx: 1 },
  { prompt: 'Q3', options: ['a', 'b'], correctIdx: 0 },
  { prompt: 'Q4', options: ['a', 'b'], correctIdx: 1 },
];

function answerAll(pickCorrect: boolean) {
  for (let i = 0; i < questions.length; i++) {
    const opts = screen.getAllByTestId('lessonquiz-option');
    // options are shuffled; find the correct slot by class after a probe is unreliable,
    // so click by matching text against the question's correct option.
    const correctText = questions[i]!.options[questions[i]!.correctIdx]!;
    const target = pickCorrect
      ? opts.find((o) => o.textContent === correctText)!
      : opts.find((o) => o.textContent !== correctText)!;
    fireEvent.click(target);
    const next = screen.queryByTestId('lessonquiz-next');
    if (next) fireEvent.click(next);
  }
}

describe('LessonQuiz', () => {
  it('does NOT complete below 75% (Retry shown, award not called)', () => {
    const award = vi.fn();
    render(
      <LessonQuiz
        screenId="aspect"
        statKind="gc"
        questions={questions}
        xp={20}
        award={award}
        goBack={vi.fn()}
      />,
    );
    answerAll(false); // all wrong → 0%
    expect(screen.getByTestId('lessonquiz-retry')).toBeTruthy();
    expect(award).not.toHaveBeenCalled();
  });

  it('completes at 100% (award called once)', () => {
    const award = vi.fn();
    render(
      <LessonQuiz
        screenId="aspect"
        statKind="gc"
        questions={questions}
        xp={20}
        award={award}
        goBack={vi.fn()}
      />,
    );
    answerAll(true); // all correct
    expect(award).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('lessonquiz-retry')).toBeNull();
  });
});
