// src/tests/phonemeHeatMap.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import PhonemeHeatMap from '../components/shared/PhonemeHeatMap';
import type { WordScore } from '../components/shared/WordHeatCard';

describe('PhonemeHeatMap', () => {
  it('renders one WordHeatCard per entry in wordScores', () => {
    const scores: WordScore[] = [
      { word: 'pas', score: 88, phonemes: [{ phoneme: 'p', score: 95 }] },
      { word: 'mama', score: 70, phonemes: [{ phoneme: 'm', score: 70 }] },
      { word: 'voda', score: 92, phonemes: [{ phoneme: 'v', score: 92 }] },
    ];
    render(<PhonemeHeatMap wordScores={scores} />);
    expect(screen.getAllByTestId('word-heat-card')).toHaveLength(3);
  });

  it('renders null when wordScores is empty or undefined', () => {
    const { container, rerender } = render(<PhonemeHeatMap wordScores={[]} />);
    expect(container.firstChild).toBeNull();
    rerender(
      // @ts-expect-error — intentionally pass undefined to exercise defensive branch
      <PhonemeHeatMap wordScores={undefined} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders the root with data-testid="phoneme-heat-map"', () => {
    const scores: WordScore[] = [
      { word: 'pas', score: 88, phonemes: [{ phoneme: 'p', score: 95 }] },
    ];
    render(<PhonemeHeatMap wordScores={scores} />);
    expect(screen.getByTestId('phoneme-heat-map')).toBeInTheDocument();
  });

  it('each WordHeatCard receives the corresponding wordScore object', () => {
    const scores: WordScore[] = [
      { word: 'first', score: 50, phonemes: [{ phoneme: 'f', score: 50 }] },
      { word: 'second', score: 80, phonemes: [{ phoneme: 's', score: 80 }] },
    ];
    render(<PhonemeHeatMap wordScores={scores} />);
    const cards = screen.getAllByTestId('word-heat-card');
    expect(cards[0].getAttribute('data-word')).toBe('first');
    expect(cards[1].getAttribute('data-word')).toBe('second');
  });
});
