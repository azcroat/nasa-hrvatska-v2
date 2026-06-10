import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConjugationSessionDrill from '../components/practice/ConjugationSessionDrill';
import type * as Adaptive from '../lib/adaptive';

const VERBS = [
  {
    inf: 'pisati',
    en: 'to write',
    aspect: 'impf',
    pair: null,
    klass: 'a-em',
    cefr: 'A1',
    irregular: false,
    present: ['pišem', 'pišeš', 'piše', 'pišemo', 'pišete', 'pišu'],
  },
  {
    inf: 'govoriti',
    en: 'to speak',
    aspect: 'impf',
    pair: null,
    klass: 'i-im',
    cefr: 'A1',
    irregular: false,
    present: ['govorim', 'govoriš', 'govori', 'govorimo', 'govorite', 'govore'],
  },
];

// Stub the grammar hook so no network: return our VERBS.
vi.mock('../hooks/useGrammar', () => ({
  useGrammar: () => ({ grammar: { VERBS }, loading: false, error: null }),
}));
const rateSpy = vi.fn();
vi.mock('../lib/adaptive', async (orig) => {
  const actual = (await orig()) as typeof Adaptive;
  return { ...actual, rateCategorySession: (...a: unknown[]) => rateSpy(...a) };
});

describe('ConjugationSessionDrill', () => {
  it('drills the surfaced category and closes the adaptive loop on completion', () => {
    const goBack = vi.fn();
    render(
      <ConjugationSessionDrill
        category="present-tense"
        cefr="A1"
        goBack={goBack}
        award={vi.fn()}
      />,
    );
    // 4 options render for the first present-tense question.
    expect(screen.getAllByTestId('conj-option')).toHaveLength(4);
    // Answer every question to reach completion.
    for (let guard = 0; guard < 80; guard++) {
      const opts = screen.queryAllByTestId('conj-option');
      if (opts.length === 0) break;
      fireEvent.click(opts[0]!);
      const next = screen.queryByText(/Next →|See Results/);
      if (next) fireEvent.click(next);
    }
    expect(rateSpy).toHaveBeenCalledTimes(1);
    expect(rateSpy.mock.calls[0]![0]).toBe('present-tense');
    expect(typeof rateSpy.mock.calls[0]![1]).toBe('number');
  });

  it('renders a graceful empty state when no cells are available', () => {
    const goBack = vi.fn();
    render(
      // past-tense at A1 → gated out → zero cells
      <ConjugationSessionDrill category="past-tense" cefr="A1" goBack={goBack} award={vi.fn()} />,
    );
    expect(screen.getByTestId('conj-empty')).toBeTruthy();
  });
});
