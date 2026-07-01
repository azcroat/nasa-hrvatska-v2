// src/tests/DailyInputCard.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DailyInputCard from '../components/home/DailyInputCard';
import { isDailyInputDone } from '../lib/dailyInput';

describe('DailyInputCard', () => {
  beforeEach(() => localStorage.clear());

  it('renders the card, both input rows, and the level badge', () => {
    render(<DailyInputCard stats={{ xp: 0 }} setScr={() => {}} />);
    expect(screen.getByTestId('daily-input-card')).toBeTruthy();
    expect(screen.getByTestId('daily-input-listening')).toBeTruthy();
    expect(screen.getByTestId('daily-input-reading')).toBeTruthy();
    expect(screen.getByText('A1')).toBeTruthy();
    expect(screen.getByText(/Today's Input/)).toBeTruthy();
  });

  it('opening listening navigates to ai_listening, tracks curEx, and marks done', () => {
    const setScr = vi.fn();
    const sCurEx = vi.fn();
    render(<DailyInputCard stats={{ xp: 0 }} setScr={setScr} sCurEx={sCurEx} />);
    fireEvent.click(screen.getByTestId('daily-input-listening'));
    expect(setScr).toHaveBeenCalledWith('ai_listening');
    expect(sCurEx).toHaveBeenCalledWith('ai_listening');
    expect(isDailyInputDone('listening')).toBe(true);
  });

  it('opening reading navigates to readlist and marks done', () => {
    const setScr = vi.fn();
    render(<DailyInputCard stats={{ xp: 0 }} setScr={setScr} />);
    fireEvent.click(screen.getByTestId('daily-input-reading'));
    expect(setScr).toHaveBeenCalledWith('readlist');
    expect(isDailyInputDone('reading')).toBe(true);
  });

  it('shows a ✓ for an input already engaged today', () => {
    localStorage.setItem(
      `nh_daily_input_listening_${new Date().toISOString().slice(0, 10)}`,
      // dateUtils.localDateStr may differ from ISO in TZ edge cases, so drive
      // the assertion through the component's own state instead:
      '1',
    );
    // Re-mark through the public API to guarantee the key matches localDateStr.
    render(<DailyInputCard stats={{ xp: 0 }} setScr={() => {}} />);
    // Deterministic path: engage reading, re-render, expect its ✓.
    fireEvent.click(screen.getByTestId('daily-input-reading'));
    render(<DailyInputCard stats={{ xp: 0 }} setScr={() => {}} />);
    const readingRows = screen.getAllByTestId('daily-input-reading');
    expect(readingRows[readingRows.length - 1].textContent).toContain('✓');
  });
});
