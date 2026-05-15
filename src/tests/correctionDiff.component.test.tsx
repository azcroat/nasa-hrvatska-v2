// src/tests/correctionDiff.component.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { DiffSpan } from '../components/practice/DiffSpan';
import { CorrectionDiff } from '../components/practice/CorrectionDiff';

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

describe('CorrectionDiff', () => {
  it('renders one DiffSpan for one change', () => {
    render(
      <CorrectionDiff
        originalText="Imam mama danas."
        correctedText="Imam majku danas."
        changes={[{ original: 'mama', corrected: 'majku', note: 'acc' }]}
      />,
    );
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('mama').tagName).toBe('DEL');
    expect(screen.getByText('majku').tagName).toBe('INS');
  });

  it('no changes renders correctedText as plain prose with no diff markup', () => {
    render(<CorrectionDiff originalText="Imam mama." correctedText="Imam majku." changes={[]} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByText('mama')).not.toBeInTheDocument();
    expect(screen.getByText('Imam majku.')).toBeInTheDocument();
  });

  it('two non-overlapping changes renders two DiffSpans interleaved with plain text', () => {
    render(
      <CorrectionDiff
        originalText="Imam mama i tata."
        correctedText="Imam majku i tatu."
        changes={[
          { original: 'mama', corrected: 'majku', note: 'A' },
          { original: 'tata', corrected: 'tatu', note: 'B' },
        ]}
      />,
    );
    expect(screen.getAllByRole('button')).toHaveLength(2);
    expect(screen.getByText(/Imam/)).toBeInTheDocument();
  });
});
