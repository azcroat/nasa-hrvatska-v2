import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../context/StatsContext', () => ({
  useStats: () => ({ stats: { xp: 2400 } }),
}));
import MapScreen from '../components/practice/MapScreen';
import { restoredCount } from '../lib/gamification/mapRegions';

describe('MapScreen', () => {
  it('shows the restored count out of 10 for the given XP', () => {
    render(<MapScreen goBack={() => {}} />);
    expect(screen.getByText(`${restoredCount(2400)} / 10`)).toBeTruthy();
  });
  it('renders a tile per region (10) and a Next hint', () => {
    render(<MapScreen goBack={() => {}} />);
    expect(screen.getAllByTestId(/^map-region-/)).toHaveLength(10);
    expect(screen.getByText(/Next:/)).toBeTruthy();
  });
  it('fires goBack from the header', () => {
    const goBack = vi.fn();
    render(<MapScreen goBack={goBack} />);
    fireEvent.click(screen.getByLabelText('Go back'));
    expect(goBack).toHaveBeenCalledTimes(1);
  });
});
