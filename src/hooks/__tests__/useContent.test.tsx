import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import 'fake-indexeddb/auto';
import { useContent, _resetContentHookForTests } from '../useContent';

vi.mock('../../lib/contentClient', () => ({
  getContent: vi.fn(),
}));

import { getContent } from '../../lib/contentClient';

const FIXTURE = {
  V: { test: 'x' },
  COUNTRIES: [],
  PROFESSIONS: [],
  WEATHER: {},
  CLOTHES: {},
  BODYDESC: [],
  TECH_VOC: {},
  BUREAUCRATIC: {},
  PROVERBS: [{ hr: 'Tko rano rani, dvije sreće grabi.', en: 'test' }],
  IDIOMS: [],
  BRZALICE: [],
  HISTORY: {},
  EVENTS: [],
  KINGS: {},
  REGIONS: {},
  DIALECTS: {},
  CROATIAN_CITIES: [],
  FOODORDER: {},
  TRANSPORT: [],
  GROCERY: {},
  RECIPES: [],
  PRACTICAL: {},
  SCENES: [],
  LEVEL_NARRATIVE: { heritage: ['First Words'] },
  SHADOWING: [],
};

function Probe({ tag }: { tag: string }) {
  const { content, loading, error } = useContent();
  if (error) return <div>error:{error.message}</div>;
  if (loading || !content) return <div>loading:{tag}</div>;
  const proverb = (content.PROVERBS as Array<{ hr: string }>)[0];
  return (
    <div>
      ready:{tag}:{proverb?.hr ?? '?'}
    </div>
  );
}

beforeEach(() => {
  _resetContentHookForTests();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useContent', () => {
  it('renders loading state then resolves to content', async () => {
    vi.mocked(getContent).mockResolvedValueOnce(FIXTURE as never);
    render(<Probe tag="a" />);
    expect(screen.getByText('loading:a')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText('ready:a:Tko rano rani, dvije sreće grabi.')).toBeInTheDocument(),
    );
  });

  it('dedupes concurrent fetches across multiple components', async () => {
    let resolveFetch: (c: typeof FIXTURE) => void = () => {};
    vi.mocked(getContent).mockImplementationOnce(
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
    expect(getContent).toHaveBeenCalledTimes(1);
    act(() => resolveFetch(FIXTURE));
    await waitFor(() => {
      expect(screen.getByText('ready:a:Tko rano rani, dvije sreće grabi.')).toBeInTheDocument();
      expect(screen.getByText('ready:b:Tko rano rani, dvije sreće grabi.')).toBeInTheDocument();
      expect(screen.getByText('ready:c:Tko rano rani, dvije sreće grabi.')).toBeInTheDocument();
    });
  });

  it('subsequent mounts after success return cached state instantly', async () => {
    vi.mocked(getContent).mockResolvedValueOnce(FIXTURE as never);
    const { unmount } = render(<Probe tag="first" />);
    await waitFor(() =>
      expect(screen.getByText('ready:first:Tko rano rani, dvije sreće grabi.')).toBeInTheDocument(),
    );
    unmount();
    render(<Probe tag="second" />);
    expect(screen.getByText('ready:second:Tko rano rani, dvije sreće grabi.')).toBeInTheDocument();
    expect(getContent).toHaveBeenCalledTimes(1);
  });

  it('surfaces error state when getContent rejects', async () => {
    vi.mocked(getContent).mockRejectedValueOnce(new Error('boom') as never);
    render(<Probe tag="e" />);
    await waitFor(() => expect(screen.getByText('error:boom')).toBeInTheDocument());
  });

  it('reload() re-triggers fetch and replaces state', async () => {
    const next = {
      ...FIXTURE,
      PROVERBS: [{ hr: 'Druga proverb.', en: 'second' }],
    };
    vi.mocked(getContent)
      .mockResolvedValueOnce(FIXTURE as never)
      .mockResolvedValueOnce(next as never);

    let reloadFn: () => void = () => {};
    function ReloadProbe() {
      const { content, reload } = useContent();
      reloadFn = reload;
      if (!content) return <div>loading</div>;
      const p = (content.PROVERBS as Array<{ hr: string }>)[0];
      return <div>{p?.hr ?? '?'}</div>;
    }

    render(<ReloadProbe />);
    await waitFor(() =>
      expect(screen.getByText('Tko rano rani, dvije sreće grabi.')).toBeInTheDocument(),
    );
    act(() => reloadFn());
    await waitFor(() => expect(screen.getByText('Druga proverb.')).toBeInTheDocument());
    expect(getContent).toHaveBeenCalledTimes(2);
  });

  it('_resetContentHookForTests clears all module state', async () => {
    vi.mocked(getContent).mockResolvedValueOnce(FIXTURE as never);
    render(<Probe tag="first" />);
    await waitFor(() =>
      expect(screen.getByText('ready:first:Tko rano rani, dvije sreće grabi.')).toBeInTheDocument(),
    );

    _resetContentHookForTests();
    vi.mocked(getContent).mockResolvedValueOnce(FIXTURE as never);
    render(<Probe tag="second" />);
    expect(screen.getByText('loading:second')).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getByText('ready:second:Tko rano rani, dvije sreće grabi.'),
      ).toBeInTheDocument(),
    );
    expect(getContent).toHaveBeenCalledTimes(2);
  });
});
