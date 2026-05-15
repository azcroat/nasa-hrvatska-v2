// src/tests/phonemeCell.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { PhonemeCell } from '../components/shared/PhonemeCell';

describe('PhonemeCell', () => {
  it('renders phoneme symbol + score% with role=button and tabIndex=0', () => {
    render(<PhonemeCell phoneme="ʃ" score={72} />);
    const cell = screen.getByRole('button');
    expect(cell).toBeInTheDocument();
    expect(cell.getAttribute('tabIndex')).toBe('0');
    expect(screen.getByText('ʃ')).toBeInTheDocument();
    expect(screen.getByText('72%')).toBeInTheDocument();
  });

  it('tap on cell opens the popover; second tap closes it', () => {
    render(<PhonemeCell phoneme="r" score={45} />);
    const cell = screen.getByRole('button');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    fireEvent.click(cell);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    fireEvent.click(cell);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('Escape key dismisses an open popover', () => {
    render(<PhonemeCell phoneme="r" score={45} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('outside-click dismisses an open popover', () => {
    render(
      <div>
        <PhonemeCell phoneme="r" score={45} />
        <button>outside</button>
      </div>,
    );
    const cells = screen.getAllByRole('button');
    const phonemeCell = cells.find((b) => b.getAttribute('data-testid') === 'phoneme-cell')!;
    fireEvent.click(phonemeCell);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    fireEvent.click(document.body);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('cell with no PHONEME_HINTS entry still renders (graceful degradation)', () => {
    // 'zz' is not in PHONEME_HINTS — the cell should still render without crash.
    render(<PhonemeCell phoneme="zz" score={88} />);
    expect(screen.getByText('zz')).toBeInTheDocument();
    expect(screen.getByText('88%')).toBeInTheDocument();
  });
});
