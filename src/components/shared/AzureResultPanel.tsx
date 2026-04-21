import React from 'react';
import { PHONEME_HINTS, scoreColor, scoreEmoji, scoreLabel } from './pronunciationUtils.js';
import PhonemeBreakdown from './PhonemeBreakdown';
import PhonemeGuideCard from './PhonemeGuideCard';

// ── Azure Assessment results panel ────────────────────────────────────────────
interface WordScore {
  word?: string;
  score: number;
  phonemes?: Array<{ phoneme: string; score: number }>;
}

interface AzureResultData {
  overall?: number;
  word_scores?: WordScore[];
  accuracy?: number;
  fluency?: number;
  completeness?: number;
  prosody?: number;
}

interface AzureResultPanelProps {
  azureResult: AzureResultData;
  onRetry: () => void;
}

export default function AzureResultPanel({ azureResult, onRetry }: AzureResultPanelProps) {
  // Find the single lowest-scoring phoneme across all words for a targeted tip.
  let worstPhoneme = null;
  let worstScore = Infinity;
  for (const w of azureResult.word_scores || []) {
    for (const p of w.phonemes || []) {
      if (p.score < worstScore) {
        worstScore = p.score;
        worstPhoneme = p.phoneme;
      }
    }
  }
  const worstHint = worstPhoneme
    ? (PHONEME_HINTS as Record<string, string | undefined>)[worstPhoneme.toLowerCase()] ||
      (PHONEME_HINTS as Record<string, string | undefined>)[worstPhoneme] ||
      null
    : null;

  const overall = azureResult.overall ?? 0;

  return (
    <div
      style={{
        background: 'var(--card)',
        borderRadius: 12,
        padding: '14px 16px',
        border: `2px solid ${scoreColor(overall)}22`,
      }}
    >
      {/* Header scores row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            flexShrink: 0,
            background: `${scoreColor(overall)}20`,
            border: `3px solid ${scoreColor(overall)}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 15,
            fontWeight: 900,
            color: scoreColor(overall),
          }}
        >
          {overall}%
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: scoreColor(overall) }}>
            {scoreEmoji(overall)} {scoreLabel(overall)} — {overall}%
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
            {[
              ['Accuracy', azureResult.accuracy],
              ['Fluency', azureResult.fluency],
              ['Complete', azureResult.completeness],
            ].map(([label, val]) => (
              <span
                key={label}
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: scoreColor(val ?? 0),
                  background: `${scoreColor(val ?? 0)}15`,
                  borderRadius: 6,
                  padding: '2px 7px',
                }}
              >
                {label} {val ?? 0}%
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Word-by-word breakdown */}
      {azureResult.word_scores && azureResult.word_scores.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: '#475569',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 6,
            }}
          >
            Word Scores
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {azureResult.word_scores.map((w: WordScore, i: number) => (
              <div
                key={w.word || `score-${w.score}`}
                style={{
                  background: '#fff',
                  borderRadius: 10,
                  border: `2px solid ${scoreColor(w.score)}40`,
                  padding: '6px 10px',
                  minWidth: 60,
                }}
              >
                <div style={{ fontWeight: 800, fontSize: 14, color: scoreColor(w.score) }}>
                  {w.word}
                </div>
                <div style={{ fontSize: 11, color: 'var(--subtext,#94a3b8)' }}>{w.score}%</div>
                <PhonemeBreakdown phonemes={w.phonemes ?? []} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Targeted tip for worst phoneme + full articulation guide */}
      {worstPhoneme && worstScore < 90 && (
        <div style={{ marginBottom: 10 }}>
          {worstHint && (
            <div
              style={{
                padding: '8px 12px',
                borderRadius: 9,
                background: '#fefce8',
                border: '1.5px solid #fde047',
                fontSize: 12,
                color: '#713f12',
                marginBottom: 6,
              }}
            >
              <span style={{ fontWeight: 800 }}>💡 Tip for &quot;{worstPhoneme}&quot;:</span>{' '}
              {worstHint}
            </div>
          )}
          <PhonemeGuideCard phoneme={worstPhoneme} />
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          onClick={onRetry}
          aria-label="Try pronunciation again"
          style={{
            background: 'none',
            border: '1px solid var(--border,#e2e8f0)',
            borderRadius: 8,
            padding: '6px 14px',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 700,
            fontFamily: "'Outfit',sans-serif",
            color: 'var(--subtext)',
          }}
        >
          <span aria-hidden="true">🔄</span> Try Again
        </button>
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--subtext,#94a3b8)', marginTop: 8 }}>
        Powered by Azure Pronunciation Assessment — phoneme-level accuracy.
      </div>
    </div>
  );
}
