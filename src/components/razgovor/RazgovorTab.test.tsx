import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RazgovorTab from './RazgovorTab';

const props = { setScr: vi.fn(), sCurEx: vi.fn() };

describe('RazgovorTab', () => {
  beforeEach(() => localStorage.clear());

  it('renders Danas + five partners + Alati shelf', () => {
    render(<RazgovorTab {...props} />);
    expect(screen.getByText('Danas')).toBeInTheDocument();
    for (const n of ['Ana', 'Marko', 'Baka Marija', 'prof. Kovač', 'Ivo']) {
      expect(screen.getAllByText(n).length).toBeGreaterThan(0);
    }
    expect(screen.getByText(/AI alati/i)).toBeInTheDocument();
  });

  it('opens a partner interior on tap', () => {
    render(<RazgovorTab {...props} />);
    // partner row name is in a Playfair span; click it
    fireEvent.click(screen.getAllByText('Marko')[0]!);
    expect(screen.getByTestId('partner-screen')).toBeInTheDocument();
  });

  it('expands the Alati shelf to show utilities', () => {
    render(<RazgovorTab {...props} />);
    fireEvent.click(screen.getByText(/AI alati/i));
    expect(screen.getByText('AI slušanje')).toBeInTheDocument();
    expect(screen.getByText('Foto skener riječi')).toBeInTheDocument();
  });
});
