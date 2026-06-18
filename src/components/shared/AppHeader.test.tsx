import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import AppHeader from './AppHeader';

describe('AppHeader', () => {
  it('renders a Me button (testid + aria-label) that calls onProfile', () => {
    const onProfile = vi.fn();
    render(<AppHeader name="Ivana" onProfile={onProfile} />);
    const me = screen.getByTestId('header-profile');
    expect(me).toHaveAttribute('aria-label', 'Me');
    me.click();
    expect(onProfile).toHaveBeenCalledTimes(1);
  });

  it('shows the uppercased user initial', () => {
    render(<AppHeader name="ivana" onProfile={() => {}} />);
    expect(screen.getByTestId('header-profile')).toHaveTextContent('I');
  });
});
