import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

// Mock the data source + stats context BEFORE importing the component.
const mockQuestions = Array.from({ length: 9 }, (_, i) => ({
  id: `q${i}`,
  prompt: `Prompt ${i}`,
  options: ['wrong', 'correct', 'other'],
  correctIndex: 1,
}));
let mockCount = 9;
vi.mock('../lib/gamification/exerciseSource', () => ({
  selectQuestions: vi.fn(() => mockQuestions.slice(0, mockCount)),
}));
vi.mock('../context/StatsContext', () => ({
  useStats: () => ({ stats: { xp: 0, lc: 0, gc: 0 } }),
}));

import AlkaScreen from '../components/practice/alka/AlkaScreen';

beforeEach(() => {
  mockCount = 9;
  localStorage.clear();
});

describe('AlkaScreen', () => {
  it('shows a fallback when fewer than 9 questions are available', () => {
    mockCount = 3;
    render(<AlkaScreen goBack={() => {}} />);
    expect(screen.getByText(/Not enough exercises/)).toBeTruthy();
  });

  it('renders the first question, the ring, and the run pill', () => {
    render(<AlkaScreen goBack={() => {}} />);
    expect(screen.getByText('Prompt 0')).toBeTruthy();
    expect(screen.getByTestId('alka-option-0')).toBeTruthy();
    expect(screen.getByLabelText('lance aim')).toBeTruthy();
    expect(screen.getByText('Run 1/3')).toBeTruthy();
  });

  it('plays a full 9-question ride to the result screen and awards XP once', () => {
    vi.useFakeTimers();
    try {
      const award = vi.fn();
      render(<AlkaScreen goBack={() => {}} award={award} />);
      for (let i = 0; i < 9; i++) {
        act(() => {
          fireEvent.click(screen.getByTestId('alka-option-1')); // correct
        });
        act(() => {
          vi.advanceTimersByTime(450); // clear the reveal window → advance
        });
      }
      expect(screen.getByText('/ 9')).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Ride again' })).toBeTruthy();
      expect(award).toHaveBeenCalledTimes(1);
      // XP must be a sane integer within the activity cap, not the raw game score.
      const xp = award.mock.calls[0][0];
      expect(Number.isInteger(xp)).toBe(true);
      expect(xp).toBeGreaterThan(0);
      expect(xp).toBeLessThanOrEqual(80);
      expect(award.mock.calls[0][2]).toBe('vocabulary');
    } finally {
      vi.useRealTimers();
    }
  });
});
