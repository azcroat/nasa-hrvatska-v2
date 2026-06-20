/**
 * SessionCard.test.tsx — Unit tests for the LearnPath chip added in Phase 3 Task 1.
 *
 * SessionCard is a pure presentational component: all behavior is driven by props.
 * No context providers, firebase mocks, or data layer needed.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import SessionCard from '../components/home/SessionCard';
import type { DailySession, SessionActivity } from '../hooks/useDailySession';

// ── Minimal fixtures ──────────────────────────────────────────────────────────

const ACT_A: SessionActivity = {
  id: 'a1',
  label: 'Flashcards',
  screen: 'lesson',
  category: 'vocab',
};
const ACT_B: SessionActivity = {
  id: 'a2',
  label: 'Grammar',
  screen: 'grammar',
  category: 'grammar',
};

function makeSession(completedIds: string[] = []): DailySession {
  return {
    date: '2026-05-13',
    activities: [ACT_A, ACT_B],
    completedIds,
    estimatedMinutes: 10,
  };
}

const BASE_PROPS = {
  isComplete: false,
  progress: 0,
  nextActivity: ACT_A,
  tomorrowLabel: 'Come back tomorrow',
  onStart: vi.fn(),
  onKeepPracticing: vi.fn(),
  streak: 3,
  xpThisWeek: 120,
  wordsdue: 5,
};

const LP_ITEM = { id: 'lp1', name: 'Basic Greetings', go: 'lesson', topic: 'greetings' };

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('SessionCard — LearnPath chip', () => {
  it('renders the LearnPath chip when nextLearnPathItem is provided', () => {
    render(<SessionCard {...BASE_PROPS} session={makeSession()} nextLearnPathItem={LP_ITEM} />);
    const chip = screen.getByTestId('learnpath-chip');
    expect(chip).toBeTruthy();
    // chip label contains the item name (possibly truncated)
    expect(chip.textContent).toContain('Basic Greetings');
  });

  it('does NOT render the LearnPath chip when nextLearnPathItem is null', () => {
    render(<SessionCard {...BASE_PROPS} session={makeSession()} nextLearnPathItem={null} />);
    expect(screen.queryByTestId('learnpath-chip')).toBeNull();
  });

  it('does NOT render the LearnPath chip when nextLearnPathItem is undefined (default)', () => {
    render(<SessionCard {...BASE_PROPS} session={makeSession()} />);
    expect(screen.queryByTestId('learnpath-chip')).toBeNull();
  });

  it('calls onLearnPathStart with the item when chip is clicked (not done)', () => {
    const onLearnPathStart = vi.fn();
    render(
      <SessionCard
        {...BASE_PROPS}
        session={makeSession()}
        nextLearnPathItem={LP_ITEM}
        learnPathItemDone={false}
        onLearnPathStart={onLearnPathStart}
      />,
    );
    fireEvent.click(screen.getByTestId('learnpath-chip'));
    expect(onLearnPathStart).toHaveBeenCalledOnce();
    expect(onLearnPathStart).toHaveBeenCalledWith(LP_ITEM);
  });

  it('does NOT call onLearnPathStart when chip is already done', () => {
    const onLearnPathStart = vi.fn();
    render(
      <SessionCard
        {...BASE_PROPS}
        session={makeSession()}
        nextLearnPathItem={LP_ITEM}
        learnPathItemDone={true}
        onLearnPathStart={onLearnPathStart}
      />,
    );
    fireEvent.click(screen.getByTestId('learnpath-chip'));
    expect(onLearnPathStart).not.toHaveBeenCalled();
  });

  it('shows a checkmark prefix when learnPathItemDone is true', () => {
    render(
      <SessionCard
        {...BASE_PROPS}
        session={makeSession()}
        nextLearnPathItem={LP_ITEM}
        learnPathItemDone={true}
      />,
    );
    const chip = screen.getByTestId('learnpath-chip');
    expect(chip.textContent).toMatch(/^✓/);
  });

  it('shows a star prefix when learnPathItemDone is false', () => {
    render(
      <SessionCard
        {...BASE_PROPS}
        session={makeSession()}
        nextLearnPathItem={LP_ITEM}
        learnPathItemDone={false}
      />,
    );
    const chip = screen.getByTestId('learnpath-chip');
    expect(chip.textContent).toMatch(/^★/);
  });

  it('truncates a long item name to 20 chars in the label', () => {
    const longItem = { id: 'lpX', name: 'This Is A Very Long Lesson Name Indeed', go: 'lesson' };
    render(<SessionCard {...BASE_PROPS} session={makeSession()} nextLearnPathItem={longItem} />);
    const chip = screen.getByTestId('learnpath-chip');
    // name is sliced to 20 chars, prefix takes 2 chars (star + space) = 22 total max
    const labelPart = chip.textContent?.replace(/^[★✓] /, '') ?? '';
    expect(labelPart.length).toBeLessThanOrEqual(20);
  });

  it('existing activity chips are not affected when LearnPath chip is added', () => {
    render(<SessionCard {...BASE_PROPS} session={makeSession()} nextLearnPathItem={LP_ITEM} />);
    // Both activity chips still render
    expect(screen.getByText(/Flashcards/)).toBeTruthy();
    expect(screen.getByText(/Grammar/)).toBeTruthy();
    // LearnPath chip also renders
    expect(screen.getByTestId('learnpath-chip')).toBeTruthy();
  });

  it('LearnPath chip hidden in complete state (whole session done)', () => {
    // When isComplete=true the card renders the "Session Complete!" state,
    // not the chip area. The chip div is inside the non-complete branch.
    render(
      <SessionCard
        {...BASE_PROPS}
        session={makeSession(['a1', 'a2'])}
        isComplete={true}
        nextLearnPathItem={LP_ITEM}
      />,
    );
    expect(screen.queryByTestId('learnpath-chip')).toBeNull();
  });
});
