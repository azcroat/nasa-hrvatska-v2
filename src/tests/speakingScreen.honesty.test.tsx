/**
 * speakingScreen.honesty.test.tsx
 *
 * R2.9 — Practice "Speaking" screen must never display a FABRICATED pronunciation %.
 * The only legitimate pronunciation percentage is a real Azure acoustic number.
 * A recognized-but-unscored result (translation-only / open-ended / legacy Web-Speech)
 * is represented as `null` and rendered as a qualitative "Recognized" status — never a number.
 *
 * Coverage:
 *   1. SpeakingPracticePanel currentWordScore badge:
 *        - null score  → qualitative "✓ Recognized (accent not scored)", NO "%"
 *        - real number → numeric "X%" badge
 *   2. SpeakingSummaryScreen:
 *        - all-null scores  → NO "Average pronunciation score", neutral "practiced ✓" summary
 *        - mixed [80, null, 90] → avg 85% over scored-only + "2 of 3 scored" note
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// ── Mock the data barrel so the panel/summary render without audio/SSR deps ────
vi.mock('../data', () => ({
  H: (title: string) => <div>{title}</div>,
  Bar: () => <div data-testid="bar" />,
  Spk: ({ label }: { label?: string }) => <button>{label ?? 'speak'}</button>,
  speakSlow: vi.fn(),
}));

// Mock PronunciationScorer — the panel only needs it to render a placeholder here.
vi.mock('../components/shared/PronunciationScorer', () => ({
  default: () => <div data-testid="scorer-stub" />,
}));

// Mock the AI progress bar skeleton (unused in these paths but imported by the panel).
vi.mock('../components/shared/SkeletonLoader', () => ({
  AIProgressBar: () => <div data-testid="ai-progress" />,
}));

import SpeakingPracticePanel from '../components/practice/SpeakingPracticePanel';
import SpeakingSummaryScreen from '../components/practice/SpeakingSummaryScreen';

// ── Shared panel props factory ─────────────────────────────────────────────────
function panelProps(
  overrides: Partial<React.ComponentProps<typeof SpeakingPracticePanel>> = {},
): React.ComponentProps<typeof SpeakingPracticePanel> {
  return {
    sw: ['četiri', 'four', 'tʃetiri'],
    si: [['četiri', 'four', 'tʃetiri']],
    sx: 0,
    sr: null,
    listening: false,
    recResult: null,
    recMsg: null,
    langIdx: 0,
    currentLang: 'hr-HR',
    waveform: new Array(30).fill(0),
    pronScore: null,
    currentWordScore: null,
    recordingURL: null,
    onStartMic: vi.fn(),
    onStopMic: vi.fn(),
    onSelfAssess: vi.fn(),
    onAdvanceWord: vi.fn(),
    onClearRecording: vi.fn(),
    onScore: vi.fn(),
    ...overrides,
  };
}

describe('SpeakingPracticePanel — currentWordScore badge honesty', () => {
  it('null acoustic score renders qualitative "Recognized" badge with NO percentage', () => {
    render(<SpeakingPracticePanel {...panelProps({ currentWordScore: { score: null } })} />);

    expect(screen.getByText(/Recognized.*accent not scored/i)).toBeInTheDocument();
    // No fabricated "75%" (the old `score ?? 75`) or any "%" badge anywhere.
    expect(screen.queryByText(/\b75%/)).toBeNull();
    expect(screen.queryByText(/Keep practicing 75%/i)).toBeNull();
  });

  it('real numeric acoustic score renders the "%" badge', () => {
    render(<SpeakingPracticePanel {...panelProps({ currentWordScore: { score: 82 } })} />);

    // Numeric badge present (scoreBadgeLabel format "🟡 Good! 82%")
    expect(screen.getByText(/82%/)).toBeInTheDocument();
    // Must NOT fall through to the qualitative-only treatment
    expect(screen.queryByText(/Recognized.*accent not scored/i)).toBeNull();
  });
});

describe('SpeakingSummaryScreen — average over scored-only / honest unscored summary', () => {
  it('all-null scores: NO average %, shows neutral "practiced ✓" completion summary', () => {
    render(
      <SpeakingSummaryScreen
        wordScores={[
          { word: 'jedan', meaning: 'one', score: null },
          { word: 'dva', meaning: 'two', score: null },
        ]}
        onDone={vi.fn()}
      />,
    );

    // No fabricated average at all
    expect(screen.queryByText(/Average pronunciation score/i)).toBeNull();
    // Neutral honest completion summary
    expect(screen.getByText(/2 words practiced/i)).toBeInTheDocument();
    expect(screen.getByText(/accent not acoustically scored this session/i)).toBeInTheDocument();
  });

  it('mixed [80, null, 90]: average is 85% over scored-only with a "2 of 3 scored" note', () => {
    render(
      <SpeakingSummaryScreen
        wordScores={[
          { word: 'jedan', meaning: 'one', score: 80 },
          { word: 'dva', meaning: 'two', score: null },
          { word: 'tri', meaning: 'three', score: 90 },
        ]}
        onDone={vi.fn()}
      />,
    );

    // Average computed over scored subset only: (80 + 90) / 2 = 85
    expect(screen.getByText(/Average pronunciation score/i)).toBeInTheDocument();
    expect(screen.getByText(/^85%$/)).toBeInTheDocument();
    // Honest coverage note
    expect(screen.getByText(/2 of 3 words acoustically scored/i)).toBeInTheDocument();
  });

  it('per-word breakdown shows "✓" for unscored words and "%" for scored ones', () => {
    render(
      <SpeakingSummaryScreen
        wordScores={[
          { word: 'jedan', meaning: 'one', score: 80 },
          { word: 'dva', meaning: 'two', score: null },
        ]}
        onDone={vi.fn()}
      />,
    );

    // The unscored row shows a "Recognized" qualitative chip
    expect(screen.getByText(/✓ Recognized/i)).toBeInTheDocument();
    // The scored row still shows its numeric badge (appears in both the avatar and the chip)
    expect(screen.getAllByText(/80%/).length).toBeGreaterThan(0);
  });
});
