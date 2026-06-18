import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import React from 'react';
import HostFamilyWelcome from './HostFamilyWelcome';
import { hostOfDay, HOST_NAME } from './hostFamily';

describe('HostFamilyWelcome', () => {
  it('greets the user by name and shows the host of the day', () => {
    render(<HostFamilyWelcome name="Ivana" streakCount={3} dayIdx={0} />);
    // The user's name must be visible — home.spec asserts on it.
    expect(screen.getByText(/Ivana/)).toBeInTheDocument();
    const host = hostOfDay(0);
    expect(screen.getByTestId(`portrait-${host}`)).toBeInTheDocument();
    expect(screen.getByText(HOST_NAME[host])).toBeInTheDocument();
  });

  it('renders the welcome container even with zero streak', () => {
    const { container } = render(<HostFamilyWelcome name="X" streakCount={0} dayIdx={2} />);
    expect(container.querySelector('[data-testid="host-welcome"]')).toBeTruthy();
  });
});
