import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AlkaRing from '../components/practice/alka/AlkaRing';

describe('AlkaRing', () => {
  it('renders the centre (u sridu) label and the aim reticle', () => {
    render(<AlkaRing aim={0} />);
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByLabelText('lance aim')).toBeTruthy();
  });

  it('renders for every landed zone (0-3) without error', () => {
    for (const z of [0, 1, 2, 3] as const) {
      const { unmount } = render(<AlkaRing aim={1} landed={z} />);
      expect(screen.getByLabelText('lance aim')).toBeTruthy();
      unmount();
    }
  });

  it('uses the aim value when landed is null and accepts a custom size', () => {
    render(<AlkaRing aim={0.5} landed={null} size={200} />);
    expect(screen.getByLabelText('lance aim')).toBeTruthy();
  });
});
