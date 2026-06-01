import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../context/StatsContext', () => ({
  useStats: () => ({ stats: { xp: 1200 } }),
}));
import ArcadeHub from '../components/practice/ArcadeHub';

describe('ArcadeHub', () => {
  it('renders all five modes — Alka live, the other four "Coming soon"', () => {
    render(<ArcadeHub goBack={() => {}} onLaunch={() => {}} />);
    expect(screen.getByText('Alka')).toBeTruthy();
    expect(screen.getByText('Boss Battle')).toBeTruthy();
    expect(screen.getByText('Survival Run')).toBeTruthy();
    expect(screen.getByText('Sentence Forge')).toBeTruthy();
    expect(screen.getByText('Sibling Duel')).toBeTruthy();
    expect(screen.getAllByText('Coming soon')).toHaveLength(4);
  });

  it('launches only the live Alka mode; disabled tiles do nothing', () => {
    const onLaunch = vi.fn();
    render(<ArcadeHub goBack={() => {}} onLaunch={onLaunch} />);
    fireEvent.click(screen.getByText('Alka'));
    expect(onLaunch).toHaveBeenCalledWith('alka');
    onLaunch.mockClear();
    fireEvent.click(screen.getByText('Boss Battle'));
    expect(onLaunch).not.toHaveBeenCalled();
  });

  it('fires goBack from the header', () => {
    const goBack = vi.fn();
    render(<ArcadeHub goBack={goBack} onLaunch={() => {}} />);
    fireEvent.click(screen.getByLabelText('Go back'));
    expect(goBack).toHaveBeenCalledTimes(1);
  });

  it('shows the Your Croatia card with restored count and launches the map', () => {
    const onLaunch = vi.fn();
    render(<ArcadeHub goBack={() => {}} onLaunch={onLaunch} />);
    const card = screen.getByTestId('arcade-your-croatia');
    expect(card).toBeTruthy();
    // xp=1200 → labin/split/zagreb restored = 3 of 10
    expect(screen.getByText('3/10')).toBeTruthy();
    fireEvent.click(card);
    expect(onLaunch).toHaveBeenCalledWith('map');
  });
});
