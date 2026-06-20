import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import KnightBubble from './KnightBubble';
import type { KnightSpeech } from './useKnightSpeech';

// Minimal stub of the useKnightSpeech surface (KnightBubble is presentational).
function makeKnight(): KnightSpeech {
  return {
    greeting: { mood: 'happy', text: 'Idemo!' },
    setGreeting: vi.fn(),
    showTranslate: false,
    setShowTranslate: vi.fn(),
    tDir: 'en-hr',
    setTDir: vi.fn(),
    tIn: '',
    setTIn: vi.fn(),
    tOut: '',
    setTOut: vi.fn(),
    tL: false,
    doTr: vi.fn(),
    pickPool: vi.fn(),
    cycleBubble: vi.fn(),
  } as unknown as KnightSpeech;
}

describe('KnightBubble (desktop home greeter — host-of-day)', () => {
  it('renders the host-of-day portrait, not the knight', () => {
    render(<KnightBubble knight={makeKnight()} name="Marko" host="baka" isNative={false} />);
    expect(screen.getByTestId('portrait-baka')).toBeInTheDocument();
    expect(screen.queryByTestId('portrait-kovac')).toBeNull();
  });

  it('greets the user by name', () => {
    render(<KnightBubble knight={makeKnight()} name="Marko" host="ana" isNative={false} />);
    expect(screen.getByText(/, Marko!/)).toBeInTheDocument();
  });
});
