// src/tests/wordHeatCard.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { WordHeatCard, type WordScore } from '../components/shared/WordHeatCard';

describe('WordHeatCard', () => {
  it('renders the word title + word-score badge + a PhonemeCell per phoneme', () => {
    const ws: WordScore = {
      word: 'pas',
      score: 88,
      phonemes: [
        { phoneme: 'p', score: 95 },
        { phoneme: 'a', score: 90 },
        { phoneme: 's', score: 80 },
      ],
    };
    render(<WordHeatCard wordScore={ws} />);
    expect(screen.getByText('pas')).toBeInTheDocument();
    expect(screen.getByText('88%')).toBeInTheDocument();
    expect(screen.getAllByTestId('phoneme-cell')).toHaveLength(3);
  });

  it('falls back to "No phoneme data" text when phonemes is empty/missing', () => {
    const ws: WordScore = { word: 'pas', score: 88 }; // no phonemes field
    render(<WordHeatCard wordScore={ws} />);
    expect(screen.getByText(/No phoneme data/i)).toBeInTheDocument();
    expect(screen.queryAllByTestId('phoneme-cell')).toHaveLength(0);
  });

  it('word-score badge color tier varies with score (low vs high)', () => {
    const low: WordScore = { word: 'low', score: 30, phonemes: [] };
    const high: WordScore = { word: 'high', score: 95, phonemes: [] };
    const { rerender } = render(<WordHeatCard wordScore={low} />);
    const lowBadge = screen.getByText('30%').getAttribute('style') || '';
    rerender(<WordHeatCard wordScore={high} />);
    const highBadge = screen.getByText('95%').getAttribute('style') || '';
    expect(lowBadge).not.toBe(highBadge);
  });

  it('data-word attribute is set to the spoken word for test selection', () => {
    const ws: WordScore = { word: 'mama', score: 70, phonemes: [{ phoneme: 'm', score: 70 }] };
    render(<WordHeatCard wordScore={ws} />);
    const card = screen.getByTestId('word-heat-card');
    expect(card.getAttribute('data-word')).toBe('mama');
  });
});
