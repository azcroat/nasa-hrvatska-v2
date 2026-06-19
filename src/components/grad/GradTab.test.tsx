import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../../context/AppContext', () => ({
  useApp: () => ({ setScr: vi.fn(), setTab: vi.fn() }),
}));
vi.mock('../../context/StatsContext', () => ({
  useStats: () => ({ stats: { xp: 9000, lc: 40, gc: 12 } }),
}));
vi.mock('../../hooks/useContent', () => ({
  useContent: () => ({ content: { V: { greetings: [['Bok', 'Hi', 'bok']] } } }),
}));
vi.mock('../../hooks/useAdaptivePractice', () => ({
  useAdaptivePractice: () => ({ practiceQueue: [] }),
}));

import GradTab from './GradTab';

const props = {
  allCats: ['greetings'],
  sh: <T,>(a: T[]) => a,
  sCurEx: vi.fn(),
  onLaunchQuiz: vi.fn(),
  onLaunchFlash: vi.fn(),
  onLaunchListen: vi.fn(),
  onLaunchMatch: vi.fn(),
  onLaunchSpeaking: vi.fn(),
  award: vi.fn(),
  launchPathItem: vi.fn(),
};

describe('GradTab', () => {
  beforeEach(() => localStorage.clear());

  it('renders the Today card and one row per place', () => {
    render(<GradTab {...props} />);
    expect(screen.getByText(/Danas u gradu/i)).toBeInTheDocument();
    expect(screen.getByText('Anina kavana')).toBeInTheDocument();
    expect(screen.getByText('Markova tržnica')).toBeInTheDocument();
    expect(screen.getByText('Kovačeva soba')).toBeInTheDocument();
    expect(screen.getByText('Bakina kuhinja')).toBeInTheDocument();
    expect(screen.getByText('Ivina ulica')).toBeInTheDocument();
    expect(screen.getByText('Trg')).toBeInTheDocument();
  });

  it('toggles to the map view and persists the choice', () => {
    render(<GradTab {...props} />);
    fireEvent.click(screen.getByRole('button', { name: /Karta/i }));
    expect(localStorage.getItem('nh_grad_view')).toBe('map');
    expect(screen.getByTestId('grad-map')).toBeInTheDocument();
  });

  it('opens a place when a row is tapped', () => {
    render(<GradTab {...props} />);
    fireEvent.click(screen.getByText('Anina kavana'));
    expect(screen.getByTestId('place-screen')).toBeInTheDocument();
  });
});
