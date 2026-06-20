import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../croatia/StoriesTab', () => ({ default: () => <div data-testid="stories-embed" /> }));
vi.mock('../croatia/MediaTab', () => ({ default: () => <div data-testid="media-embed" /> }));

import HrvatskaTab from './HrvatskaTab';

const props = { setScr: vi.fn(), sCurEx: vi.fn() };

describe('HrvatskaTab', () => {
  beforeEach(() => localStorage.clear());

  it('renders the Danas card + five door rows', () => {
    render(<HrvatskaTab {...props} />);
    expect(screen.getByText('Danas u Hrvatskoj')).toBeInTheDocument();
    for (const title of ['Priče', 'Krajevi', 'Život', 'Povijest i jezik', 'Mediji']) {
      expect(screen.getAllByText(new RegExp(title)).length).toBeGreaterThan(0);
    }
  });

  it('opens a door interior on tap and shows the back bar', () => {
    render(<HrvatskaTab {...props} />);
    fireEvent.click(screen.getByText(/Krajevi/));
    expect(screen.getByTestId('door-screen')).toBeInTheDocument();
    expect(screen.getByText('← Hrvatska')).toBeInTheDocument();
  });

  it('the Danas card launches a screen directly', () => {
    const setScr = vi.fn();
    render(<HrvatskaTab setScr={setScr} sCurEx={vi.fn()} />);
    fireEvent.click(screen.getByText('Danas u Hrvatskoj').closest('button')!);
    expect(setScr).toHaveBeenCalled();
  });

  it('back from a door returns to the door list', () => {
    render(<HrvatskaTab {...props} />);
    fireEvent.click(screen.getByText(/Krajevi/));
    fireEvent.click(screen.getByText('← Hrvatska'));
    expect(screen.queryByTestId('door-screen')).toBeNull();
    expect(screen.getByText('Danas u Hrvatskoj')).toBeInTheDocument();
  });
});
