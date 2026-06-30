// src/tests/fluencySnapshot.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FluencySnapshot from '../components/profile/FluencySnapshot';
import { weekKey } from '../lib/dateUtils';

function seedReps(
  key: string,
  opts: { total: number; thisWeek: number; sameWeek?: boolean } = { total: 0, thisWeek: 0 },
) {
  localStorage.setItem(
    key,
    JSON.stringify({
      total: opts.total,
      week: opts.sameWeek === false ? 'old-week' : weekKey(),
      weekCount: opts.thisWeek,
    }),
  );
}

describe('FluencySnapshot', () => {
  beforeEach(() => localStorage.clear());

  it('renders the CEFR level and all three skill rows', () => {
    render(<FluencySnapshot cefr="B1" setScr={() => {}} />);
    expect(screen.getByText('B1')).toBeTruthy();
    expect(screen.getByText('Listening')).toBeTruthy();
    expect(screen.getByText('Reading')).toBeTruthy();
    expect(screen.getByText('Speaking & Writing')).toBeTruthy();
  });

  it('shows the empty-state nudge when nothing was practised this week', () => {
    render(<FluencySnapshot cefr="A2" setScr={() => {}} />);
    expect(screen.getByText(/Start a session to build your fluency profile/)).toBeTruthy();
  });

  it('names the lightest skill of the week in the focus nudge', () => {
    // Listening + reading have reps this week; production has none → focus = production.
    seedReps('nh_listening_reps', { total: 10, thisWeek: 4 });
    seedReps('nh_reading_reps', { total: 6, thisWeek: 3 });
    seedReps('nh_production_reps', { total: 2, thisWeek: 0 });
    render(<FluencySnapshot cefr="B1" setScr={() => {}} />);
    const focus = screen.getByText(/lightest skill/);
    expect(focus.textContent).toContain('Speaking & Writing');
  });

  it('the focus CTA navigates to the lightest skill screen', () => {
    seedReps('nh_listening_reps', { total: 1, thisWeek: 0 }); // listening lightest
    seedReps('nh_reading_reps', { total: 6, thisWeek: 3 });
    seedReps('nh_production_reps', { total: 6, thisWeek: 2 });
    const setScr = vi.fn();
    render(<FluencySnapshot cefr="B1" setScr={setScr} />);
    fireEvent.click(screen.getByText(/lightest skill/).closest('button')!);
    expect(setScr).toHaveBeenCalledWith('ai_listening');
  });

  it('uses the synced production total when it exceeds the device-local one', () => {
    seedReps('nh_production_reps', { total: 3, thisWeek: 1 });
    render(<FluencySnapshot cefr="B2" setScr={() => {}} syncedProductionTotal={42} />);
    // The production row should show the synced 42 total, not the device-local 3.
    expect(screen.getByText(/1 this week · 42 total/)).toBeTruthy();
  });
});
