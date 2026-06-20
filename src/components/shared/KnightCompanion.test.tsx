import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// useApp drives currentScreen (controls hidden-on-home). Mock it per test.
let mockScreen = 'lesson';
vi.mock('../../context/AppContext', () => ({ useApp: () => ({ currentScreen: mockScreen }) }));
vi.mock('../../data', () => ({ getStreak: () => ({ count: 0 }) }));

import KnightCompanion from './KnightCompanion';

describe('KnightCompanion (prof. Kovač coaching companion)', () => {
  beforeEach(() => {
    mockScreen = 'lesson';
    localStorage.clear();
  });

  it('renders the Kovač portrait button on a non-home screen', () => {
    render(<KnightCompanion />);
    expect(screen.getByTestId('coach-companion')).toBeInTheDocument();
    expect(screen.getByTestId('portrait-kovac')).toBeInTheDocument();
  });

  it('renders nothing on the home/dashboard screen', () => {
    mockScreen = 'dashboard';
    const { container } = render(<KnightCompanion />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows a speech bubble with the prof. Kovač label on knight:speak', () => {
    render(<KnightCompanion />);
    act(() => {
      window.dispatchEvent(
        new CustomEvent('knight:speak', { detail: { mood: 'thinking', text: 'Pazi na padež!' } }),
      );
    });
    expect(screen.getByText('Pazi na padež!')).toBeInTheDocument();
    expect(screen.getByText(/prof\. Kovač/i)).toBeInTheDocument();
  });

  it('shows the ✗ glyph on a negative knight:flash and ✓ on a positive one', () => {
    render(<KnightCompanion />);
    act(() => {
      window.dispatchEvent(
        new CustomEvent('knight:flash', { detail: { mood: 'oops', durationMs: 1800 } }),
      );
    });
    expect(screen.getByTestId('coach-glyph')).toHaveTextContent('✗');
    act(() => {
      window.dispatchEvent(
        new CustomEvent('knight:flash', { detail: { mood: 'encouraged', durationMs: 1800 } }),
      );
    });
    expect(screen.getByTestId('coach-glyph')).toHaveTextContent('✓');
  });

  it('shows a tutor message bubble on tap', () => {
    render(<KnightCompanion />);
    fireEvent.click(screen.getByRole('button', { name: /prof\. Kovač/i }));
    expect(screen.getByText(/prof\. Kovač/i)).toBeInTheDocument();
  });
});
