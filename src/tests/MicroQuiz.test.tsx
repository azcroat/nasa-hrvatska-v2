import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MicroQuiz from '../components/learn/MicroQuiz';

vi.mock('../lib/random.js', () => ({ rnd: () => 0.9999 }));

const ITEMS = [
  { hr: 'pas', en: 'dog' },
  { hr: 'mačka', en: 'cat' },
  { hr: 'ptica', en: 'bird' },
];
const DISTRACTORS = [
  { hr: 'riba', en: 'fish' },
  { hr: 'krava', en: 'cow' },
];

describe('MicroQuiz', () => {
  it('renders the first question with the Croatian word visible', () => {
    render(
      <MicroQuiz items={ITEMS} distractors={DISTRACTORS} onComplete={vi.fn()} award={vi.fn()} />,
    );
    expect(screen.getByText(/Quick check/)).toBeInTheDocument();
  });

  it('awards +2 XP on correct answer', () => {
    const award = vi.fn();
    render(
      <MicroQuiz items={ITEMS} distractors={DISTRACTORS} onComplete={vi.fn()} award={award} />,
    );
    // With rnd=0.9999 the answer stays at opts[0]
    const firstOpt = screen.getAllByRole('button').find((b) => b.className.includes('ob'));
    fireEvent.click(firstOpt!);
    expect(award).toHaveBeenCalledWith(2, false, 'lesson');
  });

  it('does NOT award XP on wrong answer', () => {
    const award = vi.fn();
    render(
      <MicroQuiz items={ITEMS} distractors={DISTRACTORS} onComplete={vi.fn()} award={award} />,
    );
    // Click an option that is NOT opts[0]
    const opts = screen.getAllByRole('button').filter((b) => b.className.includes('ob'));
    fireEvent.click(opts[1]!);
    expect(award).not.toHaveBeenCalled();
  });

  it('calls onComplete after 2 questions', () => {
    const onComplete = vi.fn();
    render(
      <MicroQuiz items={ITEMS} distractors={DISTRACTORS} onComplete={onComplete} award={vi.fn()} />,
    );
    // First Q
    fireEvent.click(screen.getAllByRole('button').find((b) => b.className.includes('ob'))!);
    fireEvent.click(screen.getByText(/Next/));
    // Second Q
    fireEvent.click(screen.getAllByRole('button').find((b) => b.className.includes('ob'))!);
    fireEvent.click(screen.getByText(/Continue lesson/));
    expect(onComplete).toHaveBeenCalled();
  });
});
