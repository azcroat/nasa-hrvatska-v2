// src/tests/grammarUnitDetail.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import React from 'react';

// Load real unit data from the server-side _data location.
// (src/data/grammar-advanced.js is removed in SP11 task 13.)
import { ADVANCED_UNITS } from '../../functions/api/content/_data/grammarAdvanced.js';

interface UnitLike {
  id: string;
}

const FUTUR_II = (ADVANCED_UNITS as UnitLike[]).find((u) => u.id === 'futur-ii');

if (!FUTUR_II) {
  throw new Error('Test fixture: ADVANCED_UNITS missing futur-ii unit');
}

vi.mock('../lib/contentClient', () => ({
  getGrammarUnit: vi.fn(async (id: string) => {
    if (id === 'futur-ii') return FUTUR_II;
    const err = new Error('not_found: ' + id);
    err.name = 'ContentNotFoundError';
    throw err;
  }),
}));

import GrammarUnitDetail from '../components/learn/GrammarUnitDetail';

describe('GrammarUnitDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders unit title and subtitle for a known unitId', async () => {
    render(<GrammarUnitDetail unitId="futur-ii" goBack={() => {}} />);
    await waitFor(() => {
      expect(screen.getByTestId('unit-title')).toHaveTextContent('Futur II');
    });
    expect(screen.getByTestId('unit-subtitle')).toHaveTextContent(/time clauses/i);
  });

  it('renders the intro prose containing characteristic Croatian terms', async () => {
    render(<GrammarUnitDetail unitId="futur-ii" goBack={() => {}} />);
    const intro = await screen.findByTestId('unit-intro-section');
    expect(intro).toHaveTextContent(/budem/i);
  });

  it('renders all forms with person labels in a table-like layout', async () => {
    render(<GrammarUnitDetail unitId="futur-ii" goBack={() => {}} />);
    const formsSection = await screen.findByTestId('unit-forms-section');
    expect(within(formsSection).getByText('ja')).toBeInTheDocument();
    expect(within(formsSection).getByText('ti')).toBeInTheDocument();
    expect(within(formsSection).getByText('mi')).toBeInTheDocument();
  });

  it('renders all examples with HR + EN content', async () => {
    render(<GrammarUnitDetail unitId="futur-ii" goBack={() => {}} />);
    const examples = await screen.findByTestId('unit-examples-section');
    expect(within(examples).getByText(/Kad budem završio posao/i)).toBeInTheDocument();
    expect(within(examples).getByText(/When I have finished work/i)).toBeInTheDocument();
  });

  it('renders all tips as list items', async () => {
    render(<GrammarUnitDetail unitId="futur-ii" goBack={() => {}} />);
    const tips = await screen.findByTestId('unit-tips-section');
    expect(within(tips).getByText(/past participle/i)).toBeInTheDocument();
  });

  it('renders the first drill and shows correct/incorrect feedback on click', async () => {
    render(<GrammarUnitDetail unitId="futur-ii" goBack={() => {}} />);
    expect(await screen.findByTestId('drill-question')).toHaveTextContent(/Kad ____ vremena/);
    const correctOption = screen.getByRole('button', { name: /budem imao/i });
    fireEvent.click(correctOption);
    expect(screen.getByTestId('drill-explain')).toHaveTextContent(
      /Futur II requires past participle/i,
    );
  });

  it('falls through to "Unit not found" when unitId is unknown', async () => {
    render(<GrammarUnitDetail unitId="does-not-exist" goBack={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText(/Unit not found/i)).toBeInTheDocument();
    });
  });
});
