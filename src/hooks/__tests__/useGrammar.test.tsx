import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import 'fake-indexeddb/auto';
import { useGrammar, _resetGrammarHookForTests } from '../useGrammar';

vi.mock('../../lib/contentClient', () => ({
  getGrammar: vi.fn(),
}));

import { getGrammar } from '../../lib/contentClient';

const FIXTURE = {
  PADEZI: { nom: 'ja' },
  GRAM: {},
  CONJ: {},
  MODAL: {},
  TENSES: {},
  ASPECT: {},
  ASPECT_PAIRS: [],
  CONDITIONAL: {},
  FORMAL_REGISTER: {},
  IMPERSONAL: {},
  PHONOLOGY: {},
  PITCH_ACCENT: [],
  PADEZI_FULL: {},
};

function Probe({ tag }: { tag: string }) {
  const { grammar, loading, error } = useGrammar();
  if (error) return <div>error:{error.message}</div>;
  if (loading || !grammar) return <div>loading:{tag}</div>;
  return (
    <div>
      ready:{tag}:{(grammar.PADEZI as { nom: string }).nom}
    </div>
  );
}

beforeEach(() => {
  _resetGrammarHookForTests();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useGrammar', () => {
  it('renders loading state then resolves to grammar', async () => {
    vi.mocked(getGrammar).mockResolvedValueOnce(FIXTURE as never);
    render(<Probe tag="a" />);
    expect(screen.getByText('loading:a')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('ready:a:ja')).toBeInTheDocument());
  });

  it('dedupes concurrent fetches across multiple components', async () => {
    let resolveFetch: (g: typeof FIXTURE) => void = () => {};
    vi.mocked(getGrammar).mockImplementationOnce(
      () =>
        new Promise((r) => {
          resolveFetch = r;
        }) as never,
    );
    render(
      <>
        <Probe tag="a" />
        <Probe tag="b" />
        <Probe tag="c" />
      </>,
    );
    expect(getGrammar).toHaveBeenCalledTimes(1);
    act(() => resolveFetch(FIXTURE));
    await waitFor(() => {
      expect(screen.getByText('ready:a:ja')).toBeInTheDocument();
      expect(screen.getByText('ready:b:ja')).toBeInTheDocument();
      expect(screen.getByText('ready:c:ja')).toBeInTheDocument();
    });
  });

  it('subsequent mounts after success return cached state instantly', async () => {
    vi.mocked(getGrammar).mockResolvedValueOnce(FIXTURE as never);
    const { unmount } = render(<Probe tag="first" />);
    await waitFor(() => expect(screen.getByText('ready:first:ja')).toBeInTheDocument());
    unmount();
    render(<Probe tag="second" />);
    expect(screen.getByText('ready:second:ja')).toBeInTheDocument();
    expect(getGrammar).toHaveBeenCalledTimes(1);
  });

  it('surfaces error state when getGrammar rejects', async () => {
    vi.mocked(getGrammar).mockRejectedValueOnce(new Error('boom') as never);
    render(<Probe tag="e" />);
    await waitFor(() => expect(screen.getByText('error:boom')).toBeInTheDocument());
  });

  it('reload() re-triggers fetch and replaces state', async () => {
    const next = { ...FIXTURE, PADEZI: { nom: 'mi' } };
    vi.mocked(getGrammar)
      .mockResolvedValueOnce(FIXTURE as never)
      .mockResolvedValueOnce(next as never);

    let reloadFn: () => void = () => {};
    function ReloadProbe() {
      const { grammar, reload } = useGrammar();
      reloadFn = reload;
      if (!grammar) return <div>loading</div>;
      return <div>{(grammar.PADEZI as { nom: string }).nom}</div>;
    }

    render(<ReloadProbe />);
    await waitFor(() => expect(screen.getByText('ja')).toBeInTheDocument());
    act(() => reloadFn());
    await waitFor(() => expect(screen.getByText('mi')).toBeInTheDocument());
    expect(getGrammar).toHaveBeenCalledTimes(2);
  });

  it('_resetGrammarHookForTests clears all module state', async () => {
    vi.mocked(getGrammar).mockResolvedValueOnce(FIXTURE as never);
    render(<Probe tag="first" />);
    await waitFor(() => expect(screen.getByText('ready:first:ja')).toBeInTheDocument());

    _resetGrammarHookForTests();
    vi.mocked(getGrammar).mockResolvedValueOnce(FIXTURE as never);
    render(<Probe tag="second" />);
    expect(screen.getByText('loading:second')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('ready:second:ja')).toBeInTheDocument());
    expect(getGrammar).toHaveBeenCalledTimes(2);
  });
});
