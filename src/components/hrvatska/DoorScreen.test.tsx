import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Embeds use AppContext internally — stub them so DoorScreen renders in isolation.
vi.mock('../croatia/StoriesTab', () => ({ default: () => <div data-testid="stories-embed" /> }));
vi.mock('../croatia/MediaTab', () => ({ default: () => <div data-testid="media-embed" /> }));

import DoorScreen from './DoorScreen';

describe('DoorScreen', () => {
  beforeEach(() => localStorage.clear());

  it('renders back bar, host portrait, and Krajevi region cards', () => {
    render(<DoorScreen doorId="krajevi" setScr={vi.fn()} sCurEx={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText('← Hrvatska')).toBeInTheDocument();
    expect(screen.getByTestId('portrait-marko')).toBeInTheDocument();
    expect(screen.getByText('Zagreb')).toBeInTheDocument();
    expect(screen.getByText('Interaktivna karta')).toBeInTheDocument();
  });

  it('launches a card via setScr + sCurEx', () => {
    const setScr = vi.fn();
    const sCurEx = vi.fn();
    render(<DoorScreen doorId="krajevi" setScr={setScr} sCurEx={sCurEx} onBack={vi.fn()} />);
    fireEvent.click(screen.getByText('Zagreb'));
    expect(sCurEx).toHaveBeenCalledWith('region_zagreb');
    expect(setScr).toHaveBeenCalledWith('region_zagreb');
  });

  it('embeds the Stories sub-tab inside the Priče door', () => {
    render(<DoorScreen doorId="price" setScr={vi.fn()} sCurEx={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByTestId('portrait-baka')).toBeInTheDocument();
    expect(screen.getByText("Baka's Summer")).toBeInTheDocument();
    expect(screen.getByTestId('stories-embed')).toBeInTheDocument();
  });

  it('embeds the Media sub-tab inside the Mediji door', () => {
    render(<DoorScreen doorId="mediji" setScr={vi.fn()} sCurEx={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByTestId('media-embed')).toBeInTheDocument();
  });

  it('hides the seasonal Easter card outside the Easter window', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 1)); // June 1
    render(<DoorScreen doorId="price" setScr={vi.fn()} sCurEx={vi.fn()} onBack={vi.fn()} />);
    expect(screen.queryByText('Uskrs u Hrvatskoj')).toBeNull();
    vi.useRealTimers();
  });

  it('back button calls onBack', () => {
    const onBack = vi.fn();
    render(<DoorScreen doorId="zivot" setScr={vi.fn()} sCurEx={vi.fn()} onBack={onBack} />);
    fireEvent.click(screen.getByText('← Hrvatska'));
    expect(onBack).toHaveBeenCalled();
  });
});
