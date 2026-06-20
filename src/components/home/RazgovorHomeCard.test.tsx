import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RazgovorHomeCard from './RazgovorHomeCard';

describe('RazgovorHomeCard', () => {
  it('renders the host portrait, name, and a Razgovor CTA', () => {
    render(<RazgovorHomeCard host="ana" onOpen={vi.fn()} />);
    expect(screen.getByTestId('home-razgovor-card')).toBeInTheDocument();
    expect(screen.getByTestId('portrait-ana')).toBeInTheDocument();
    expect(screen.getByText(/Ana te čeka/)).toBeInTheDocument();
    expect(screen.getByText(/💬 Razgovor/)).toBeInTheDocument();
  });

  it('calls onOpen when the card is clicked', () => {
    const onOpen = vi.fn();
    render(<RazgovorHomeCard host="baka" onOpen={onOpen} />);
    fireEvent.click(screen.getByTestId('home-razgovor-card'));
    expect(onOpen).toHaveBeenCalledOnce();
  });
});
