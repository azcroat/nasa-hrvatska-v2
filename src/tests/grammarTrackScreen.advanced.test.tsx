// src/tests/grammarTrackScreen.advanced.test.tsx
// SP9 Task 6: verify the 10 advanced grammar units (5 B2 + 5 C1) are wired
// into GrammarTrackScreen + that taps route through `launchGrammarUnit`.
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Mock useApp so the screen mounts outside the real provider.
vi.mock('../context/AppContext', () => ({
  useApp: () => ({
    setScr: vi.fn(),
    sCurEx: vi.fn(),
    currentScreen: 'grammar_track',
    award: vi.fn(),
  }),
}));

import GrammarTrackScreen from '../components/learn/GrammarTrackScreen';

function clickLevelTab(label: RegExp) {
  // The level tabs are <button> elements containing "B2"/"C1" plus a child span
  // with the progress count. There can also be unit cards on screen that contain
  // the same letters — so find the small pill button by `getAllByRole`.
  const buttons = screen.getAllByRole('button').filter((b) => label.test(b.textContent || ''));
  // Tab button is the shortest (just "B2 0/X" / "C1 0/X"), unit cards are much longer.
  buttons.sort((a, b) => (a.textContent || '').length - (b.textContent || '').length);
  if (buttons.length === 0) throw new Error(`No button matching ${label}`);
  fireEvent.click(buttons[0]!);
}

describe('GrammarTrackScreen — SP9 advanced units', () => {
  it('B2 level shows the 5 new SP9 advanced units alongside existing ones', () => {
    render(<GrammarTrackScreen goBack={() => {}} launchGrammarUnit={() => {}} />);
    clickLevelTab(/^B2/);
    expect(screen.getByText(/Futur II/i)).toBeInTheDocument();
    expect(screen.getByText(/Relativne rečenice/i)).toBeInTheDocument();
    expect(screen.getByText(/Trpni/i)).toBeInTheDocument();
    expect(screen.getByText(/Glagolski pridjevi/i)).toBeInTheDocument();
    expect(screen.getByText(/Indirektni govor/i)).toBeInTheDocument();
  });

  it('C1 level shows the 5 new SP9 C1 units', () => {
    render(<GrammarTrackScreen goBack={() => {}} launchGrammarUnit={() => {}} />);
    clickLevelTab(/^C1/);
    expect(screen.getByText(/Kondicional II/i)).toBeInTheDocument();
    expect(screen.getByText(/Poslovni jezik/i)).toBeInTheDocument();
    expect(screen.getByText(/Glagolske imenice/i)).toBeInTheDocument();
    expect(screen.getByText(/Povratni glagoli/i)).toBeInTheDocument();
    expect(screen.getByText(/Red riječi/i)).toBeInTheDocument();
  });

  it('tapping an SP9 unit calls launchGrammarUnit with its unitId', () => {
    const launch = vi.fn();
    render(<GrammarTrackScreen goBack={() => {}} launchGrammarUnit={launch} />);
    clickLevelTab(/^C1/);
    const card = screen.getByText(/Kondicional II/i).closest('button');
    expect(card).toBeTruthy();
    fireEvent.click(card!);
    expect(launch).toHaveBeenCalledWith('kondicional-ii');
  });
});
