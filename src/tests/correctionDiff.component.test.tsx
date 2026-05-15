// src/tests/correctionDiff.component.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { DiffSpan } from '../components/practice/DiffSpan';

describe('DiffSpan', () => {
  it('renders strikethrough original + insert corrected', () => {
    render(<DiffSpan original="mama" corrected="majku" note="accusative ending" index={0} />);
    const del = screen.getByText('mama');
    const ins = screen.getByText('majku');
    expect(del.tagName).toBe('DEL');
    expect(ins.tagName).toBe('INS');
  });

  it('tap on DiffSpan reveals the note popover', () => {
    render(<DiffSpan original="mama" corrected="majku" note="accusative ending" index={0} />);
    expect(screen.queryByText('accusative ending')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('accusative ending')).toBeInTheDocument();
  });

  it('Escape key dismisses an open popover', () => {
    render(<DiffSpan original="mama" corrected="majku" note="accusative ending" index={0} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('accusative ending')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText('accusative ending')).not.toBeInTheDocument();
  });

  it('change without a note renders no role=button (non-interactive marker)', () => {
    render(<DiffSpan original="mama" corrected="majku" index={0} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('mama').tagName).toBe('DEL');
  });
});
