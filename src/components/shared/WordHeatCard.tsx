// src/components/shared/WordHeatCard.tsx
// SP8: single-word card showing the word + score header and a row of phoneme cells.
import React from 'react';
import { scoreColor } from './pronunciationUtils.js';
import { PhonemeCell } from './PhonemeCell';

export interface PhonemePoint {
  phoneme: string;
  score: number;
}

export interface WordScore {
  word?: string;
  score: number;
  phonemes?: PhonemePoint[];
}

export interface WordHeatCardProps {
  wordScore: WordScore;
}

const STYLES = {
  card: {
    background: 'var(--card)',
    border: '1px solid var(--card-b)',
    borderRadius: 10,
    padding: '10px 12px',
  },
  header: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 8,
  },
  word: {
    fontSize: 16,
    fontWeight: 700 as const,
    color: 'var(--heading)',
  },
  wordScore: {
    fontSize: 13,
    fontWeight: 700 as const,
    padding: '2px 8px',
    borderRadius: 4,
  },
  cellRow: {
    display: 'flex' as const,
    flexWrap: 'wrap' as const,
    gap: 6,
  },
  noPhonemes: {
    fontSize: 12,
    color: 'var(--subtext)',
    fontStyle: 'italic' as const,
  },
};

export function WordHeatCard({ wordScore }: WordHeatCardProps): React.ReactElement {
  const { word, score, phonemes } = wordScore;
  const color = scoreColor(score);
  return (
    <div data-testid="word-heat-card" data-word={word ?? ''} style={STYLES.card}>
      <div style={STYLES.header}>
        <span style={STYLES.word}>{word || '(unknown)'}</span>
        <span
          style={{
            ...STYLES.wordScore,
            background: `${color}22`,
            color,
          }}
        >
          {score}%
        </span>
      </div>
      {phonemes && phonemes.length > 0 ? (
        <div style={STYLES.cellRow}>
          {phonemes.map((p, i) => (
            <PhonemeCell key={`${p.phoneme}-${i}`} phoneme={p.phoneme} score={p.score} />
          ))}
        </div>
      ) : (
        <div style={STYLES.noPhonemes}>No phoneme data for this word.</div>
      )}
    </div>
  );
}
