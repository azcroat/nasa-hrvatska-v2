// src/components/shared/PhonemeHeatMap.tsx
// SP8: prominent per-word phoneme heat map for Azure pronunciation results.
// Renders one card per spoken word, each containing color-coded phoneme cells.
// Tapping a cell reveals a popover with hint + mouth-shape + sample audio.
import React from 'react';
import { WordHeatCard, type WordScore } from './WordHeatCard';

export interface PhonemeHeatMapProps {
  wordScores: WordScore[];
}

const STYLES = {
  wrapper: {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    gap: 10,
    marginTop: 12,
  },
};

export default function PhonemeHeatMap({
  wordScores,
}: PhonemeHeatMapProps): React.ReactElement | null {
  if (!wordScores || wordScores.length === 0) return null;
  return (
    <div data-testid="phoneme-heat-map" style={STYLES.wrapper}>
      {wordScores.map((w, i) => (
        <WordHeatCard key={`${w.word ?? 'word'}-${i}`} wordScore={w} />
      ))}
    </div>
  );
}
