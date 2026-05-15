// src/tests/writingScreen.diff.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';

// Mock _aiPost so we can return canned correction responses without hitting the network
vi.mock('../lib/aiPost', () => ({
  _aiPost: vi.fn(),
}));

// Mock StatsContext (WritingScreen uses useStats)
vi.mock('../context/StatsContext', async () => {
  const actual = (await vi.importActual('../context/StatsContext')) as Record<string, unknown>;
  return {
    ...actual,
    useStats: () => ({
      stats: { xp: 1500, lc: 10, gc: 5, sp: 3 },
      setStats: vi.fn(),
      writeDelta: vi.fn(),
      level: 'B1',
    }),
  };
});

// Mock other lib deps that WritingScreen pulls in
vi.mock('../lib/quests.js', () => ({ markQuest: vi.fn() }));
vi.mock('../lib/srs.js', () => ({ addWordToSRS: vi.fn() }));
vi.mock('../lib/soundSettings.js', () => ({ getVoicePreference: () => 'en' }));
vi.mock('../lib/learnerErrors.js', () => ({ logError: vi.fn() }));
vi.mock('../lib/apiFetch.js', () => ({
  apiFetch: vi.fn().mockResolvedValue(new Response('', { status: 200 })),
}));

import WritingScreen from '../components/practice/WritingScreen';
import { _aiPost } from '../lib/aiPost';

const SAMPLE_TEXT = 'Imam mama i tata svaki dan svaki dan svaki dan.';

function fillResponse(overrides: Record<string, unknown> = {}) {
  vi.mocked(_aiPost).mockResolvedValue(
    new Response(
      JSON.stringify({
        corrected_text: 'Imam majku i tatu svaki dan svaki dan svaki dan.',
        score: 80,
        level_demonstrated: 'B1 - Intermediate',
        changes: [
          { original: 'mama', corrected: 'majku', note: 'Accusative for direct object.' },
          { original: 'tata', corrected: 'tatu', note: 'Accusative for direct object.' },
        ],
        strengths: ['Good sentence structure'],
        improvements: ['Practice accusative endings'],
        encouragement: 'Bravo!',
        ...overrides,
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    ),
  );
}

describe('WritingScreen integration with CorrectionDiff', () => {
  beforeEach(() => {
    vi.mocked(_aiPost).mockReset();
  });

  it('submits text and renders CorrectionDiff with strikethrough + insert spans', async () => {
    fillResponse();
    render(<WritingScreen goBack={() => {}} award={() => {}} />);

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: SAMPLE_TEXT } });

    const submit = screen.getByRole('button', { name: /check|correct|submit|provjeri|grade my/i });
    await act(async () => {
      fireEvent.click(submit);
    });

    await waitFor(() => {
      expect(screen.getAllByRole('button').some((b) => b.querySelector('del'))).toBe(true);
    });

    expect(screen.getByText('mama').tagName).toBe('DEL');
    expect(screen.getByText('majku').tagName).toBe('INS');
    expect(screen.getByText('tata').tagName).toBe('DEL');
    expect(screen.getByText('tatu').tagName).toBe('INS');
  });

  it('submits text and renders correctedText as plain prose when changes is empty', async () => {
    fillResponse({ changes: [] });
    render(<WritingScreen goBack={() => {}} award={() => {}} />);

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: SAMPLE_TEXT } });

    const submit = screen.getByRole('button', { name: /check|correct|submit|provjeri|grade my/i });
    await act(async () => {
      fireEvent.click(submit);
    });

    await waitFor(() => {
      expect(
        screen.getAllByText('Imam majku i tatu svaki dan svaki dan svaki dan.').length,
      ).toBeGreaterThan(0);
    });
    expect(screen.queryByText('mama')).not.toBeInTheDocument();
  });
});
