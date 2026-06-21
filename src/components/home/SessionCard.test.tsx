import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SessionCard from './SessionCard';
import type { DailySession } from '../../hooks/useDailySession';

const baseSession: DailySession = {
  date: '2026-06-21',
  activities: [
    { id: 'flashcards', label: 'Flashcards', screen: 'flashcards', category: 'vocab-a2' },
  ],
  completedIds: [],
  estimatedMinutes: 10,
};

function renderCard(overrides: Partial<React.ComponentProps<typeof SessionCard>> = {}) {
  const props: React.ComponentProps<typeof SessionCard> = {
    session: baseSession,
    isComplete: false,
    progress: 0,
    nextActivity: baseSession.activities[0]!,
    tomorrowLabel: 'Come back tomorrow',
    onStart: vi.fn(),
    onKeepPracticing: vi.fn(),
    streak: 0,
    xpThisWeek: 0,
    wordsdue: 0,
    ...overrides,
  };
  return render(<SessionCard {...props} />);
}

describe('SessionCard — Reviews Due pill', () => {
  it('is a clickable button that opens review when reviews are due', () => {
    const onReviewClick = vi.fn();
    renderCard({ wordsdue: 98, onReviewClick });
    const pill = screen.getByTestId('reviews-due-pill');
    expect(pill.tagName).toBe('BUTTON');
    expect(pill).toHaveTextContent('98');
    expect(pill).toHaveTextContent('Reviews Due →'); // affordance arrow
    fireEvent.click(pill);
    expect(onReviewClick).toHaveBeenCalledTimes(1);
  });

  it('is NOT interactive when nothing is due (no dead button)', () => {
    const onReviewClick = vi.fn();
    renderCard({ wordsdue: 0, onReviewClick });
    const pill = screen.getByTestId('reviews-due-pill');
    expect(pill.tagName).not.toBe('BUTTON');
    expect(pill).toHaveTextContent('Reviews Due');
    expect(pill).not.toHaveTextContent('→');
  });

  it('does not render a "phrases waiting for review" nag line', () => {
    renderCard({ wordsdue: 98 });
    expect(screen.queryByText(/phrases waiting for review/i)).toBeNull();
    expect(screen.queryByText(/čeka ponavljanje/i)).toBeNull();
  });
});
