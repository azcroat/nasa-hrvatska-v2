import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RazgovorTab from './RazgovorTab';

const props = { setScr: vi.fn(), sCurEx: vi.fn() };

describe('RazgovorTab', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

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

  it('opens the handed-off partner from sessionStorage on mount (Dom host deep-link)', () => {
    sessionStorage.setItem('nh_open_partner', 'marko');
    render(<RazgovorTab {...props} />);
    expect(screen.getByTestId('partner-screen')).toBeInTheDocument();
    // greeting confirms it is Marko's interior
    expect(screen.getByText(/Idemo na priču o moru/)).toBeInTheDocument();
    // the handoff key is consumed
    expect(sessionStorage.getItem('nh_open_partner')).toBeNull();
  });

  it('ignores an invalid handed-off partner id', () => {
    sessionStorage.setItem('nh_open_partner', 'not-a-partner');
    render(<RazgovorTab {...props} />);
    expect(screen.queryByTestId('partner-screen')).toBeNull();
    expect(screen.getByText('Danas')).toBeInTheDocument();
  });
});
