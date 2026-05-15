// src/tests/azureResultPanel.heatmap.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import AzureResultPanel from '../components/shared/AzureResultPanel';

describe('AzureResultPanel — SP8 heat map integration', () => {
  it('when azureResult.word_scores has entries, renders <PhonemeHeatMap>', () => {
    const azureResult = {
      overall: 82,
      accuracy: 85,
      fluency: 80,
      completeness: 90,
      prosody: 75,
      word_scores: [
        {
          word: 'pas',
          score: 88,
          phonemes: [
            { phoneme: 'p', score: 95 },
            { phoneme: 'a', score: 90 },
            { phoneme: 's', score: 80 },
          ],
        },
      ],
    };
    render(<AzureResultPanel azureResult={azureResult} onRetry={() => {}} />);
    expect(screen.getByTestId('phoneme-heat-map')).toBeInTheDocument();
    expect(screen.getAllByTestId('phoneme-cell').length).toBeGreaterThan(0);
  });

  it('when word_scores is empty, no heat map renders (no crash)', () => {
    const azureResult = {
      overall: 70,
      accuracy: 70,
      fluency: 70,
      completeness: 70,
      prosody: 70,
      word_scores: [],
    };
    render(<AzureResultPanel azureResult={azureResult} onRetry={() => {}} />);
    expect(screen.queryByTestId('phoneme-heat-map')).not.toBeInTheDocument();
  });

  it('existing header section still renders the overall score (no regression)', () => {
    const azureResult = {
      overall: 82,
      accuracy: 85,
      fluency: 80,
      completeness: 90,
      prosody: 75,
      word_scores: [{ word: 'pas', score: 88, phonemes: [{ phoneme: 'p', score: 95 }] }],
    };
    render(<AzureResultPanel azureResult={azureResult} onRetry={() => {}} />);
    expect(screen.getAllByText('82%').length).toBeGreaterThan(0);
  });
});
