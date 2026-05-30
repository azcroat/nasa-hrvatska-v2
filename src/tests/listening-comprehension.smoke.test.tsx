/**
 * listening-comprehension.smoke.test.tsx — safety net for the 1b decomposition.
 *
 * ListeningComprehensionScreen was a 2607-line file with 6 inline helper
 * components + a large EXERCISES data const and NO prior test. This smoke test
 * is the net for splitting those out (raise-to-senior-grade roadmap, item 1b):
 * it mounts the screen and asserts the Comprehension Track landing renders with
 * its CEFR level cards. Each extraction step must keep this green — if the
 * screen stops mounting or the EXERCISES wiring breaks, this fails.
 *
 * Smoke scope (mount + landing render) by design: the extraction is a verbatim
 * move of already-separate component definitions into their own files, so `tsc`
 * is the primary structural guard; this confirms the screen still composes.
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../context/AppContext', () => ({
  useApp: vi.fn(() => ({})),
  AppProvider: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

vi.mock('../lib/audio.ts', () => ({
  speak: vi.fn(() => Promise.resolve('ok')),
  speakSlow: vi.fn(() => Promise.resolve('ok')),
  stopAudio: vi.fn(),
}));

vi.mock('../lib/contentClient', () => ({
  getStoryCatalog: vi.fn(() => Promise.resolve([])),
  getStory: vi.fn(() => Promise.resolve(null)),
}));

import ListeningComprehensionScreen from '../components/practice/ListeningComprehensionScreen';

describe('ListeningComprehensionScreen — smoke / 1b safety net', () => {
  it('mounts and renders the Comprehension Track landing with CEFR level cards', () => {
    render(<ListeningComprehensionScreen goBack={vi.fn()} award={vi.fn()} />);
    expect(screen.getByText('Comprehension Track')).toBeInTheDocument();
    // EXERCISES data must still drive the level cards after extraction.
    expect(screen.getByText('A1 — Starter')).toBeInTheDocument();
    expect(screen.getByText(/Hear Croatian sentences/)).toBeInTheDocument();
  });
});
