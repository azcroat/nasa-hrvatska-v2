// src/tests/grammarUnitDetail.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import GrammarUnitDetail from '../components/learn/GrammarUnitDetail';

describe('GrammarUnitDetail', () => {
  it('renders unit title, subtitle, intro for a known unitId', () => {
    render(<GrammarUnitDetail unitId="futur-ii" goBack={() => {}} />);
    expect(screen.getByText(/Futur II/)).toBeInTheDocument();
    expect(screen.getByText(/Future Perfect/i)).toBeInTheDocument();
    expect(screen.getByText(/budem/i)).toBeInTheDocument();
  });

  it('renders all forms in a table-like layout', () => {
    render(<GrammarUnitDetail unitId="futur-ii" goBack={() => {}} />);
    expect(screen.getByText('ja')).toBeInTheDocument();
    expect(screen.getByText('ti')).toBeInTheDocument();
    expect(screen.getByText('mi')).toBeInTheDocument();
  });

  it('renders all examples with HR + EN', () => {
    render(<GrammarUnitDetail unitId="futur-ii" goBack={() => {}} />);
    expect(screen.getByText(/Kad budem završio posao/i)).toBeInTheDocument();
    expect(screen.getByText(/When I have finished work/i)).toBeInTheDocument();
  });

  it('renders all tips as list items', () => {
    render(<GrammarUnitDetail unitId="futur-ii" goBack={() => {}} />);
    expect(screen.getByText(/past participle/i)).toBeInTheDocument();
  });

  it('renders the first drill and shows correct/incorrect feedback on click', () => {
    render(<GrammarUnitDetail unitId="futur-ii" goBack={() => {}} />);
    expect(screen.getByText(/Kad ____ vremena/)).toBeInTheDocument();
    const correctOption = screen.getByRole('button', { name: /budem imao/i });
    fireEvent.click(correctOption);
    expect(screen.getByText(/Futur II requires past participle/i)).toBeInTheDocument();
  });

  it('falls through to "Unit not found" when unitId is unknown', () => {
    render(<GrammarUnitDetail unitId="does-not-exist" goBack={() => {}} />);
    expect(screen.getByText(/Unit not found/i)).toBeInTheDocument();
  });
});
