// src/tests/grammarUnitDetail.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import React from 'react';
import GrammarUnitDetail from '../components/learn/GrammarUnitDetail';

describe('GrammarUnitDetail', () => {
  it('renders unit title and subtitle for a known unitId', () => {
    render(<GrammarUnitDetail unitId="futur-ii" goBack={() => {}} />);
    expect(screen.getByTestId('unit-title')).toHaveTextContent('Futur II');
    expect(screen.getByTestId('unit-subtitle')).toHaveTextContent(/time clauses/i);
  });

  it('renders the intro prose containing characteristic Croatian terms', () => {
    render(<GrammarUnitDetail unitId="futur-ii" goBack={() => {}} />);
    const intro = screen.getByTestId('unit-intro-section');
    expect(intro).toHaveTextContent(/budem/i);
  });

  it('renders all forms with person labels in a table-like layout', () => {
    render(<GrammarUnitDetail unitId="futur-ii" goBack={() => {}} />);
    const formsSection = screen.getByTestId('unit-forms-section');
    expect(within(formsSection).getByText('ja')).toBeInTheDocument();
    expect(within(formsSection).getByText('ti')).toBeInTheDocument();
    expect(within(formsSection).getByText('mi')).toBeInTheDocument();
  });

  it('renders all examples with HR + EN content', () => {
    render(<GrammarUnitDetail unitId="futur-ii" goBack={() => {}} />);
    const examples = screen.getByTestId('unit-examples-section');
    expect(within(examples).getByText(/Kad budem završio posao/i)).toBeInTheDocument();
    expect(within(examples).getByText(/When I have finished work/i)).toBeInTheDocument();
  });

  it('renders all tips as list items', () => {
    render(<GrammarUnitDetail unitId="futur-ii" goBack={() => {}} />);
    const tips = screen.getByTestId('unit-tips-section');
    expect(within(tips).getByText(/past participle/i)).toBeInTheDocument();
  });

  it('renders the first drill and shows correct/incorrect feedback on click', () => {
    render(<GrammarUnitDetail unitId="futur-ii" goBack={() => {}} />);
    expect(screen.getByTestId('drill-question')).toHaveTextContent(/Kad ____ vremena/);
    // Tap the correct option (index 1, "budem imao")
    const correctOption = screen.getByRole('button', { name: /budem imao/i });
    fireEvent.click(correctOption);
    expect(screen.getByTestId('drill-explain')).toHaveTextContent(
      /Futur II requires past participle/i,
    );
  });

  it('falls through to "Unit not found" when unitId is unknown', () => {
    render(<GrammarUnitDetail unitId="does-not-exist" goBack={() => {}} />);
    expect(screen.getByText(/Unit not found/i)).toBeInTheDocument();
  });
});
