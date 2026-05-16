/**
 * shadowingMic.test.tsx — verifies ShadowingScreen consumes the shared
 * useRecorder hook and renders correct UI for each state.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsProvider } from '../context/StatsContext';
import type { Stats, StatsContextValue } from '../types';

vi.mock('../data', () => ({
  H: () => null,
  Bar: () => null,
  Spk: () => null,
  speakSlow: vi.fn(),
  SHADOWING: [{ hr: 'Dobar dan', en: 'Good day', tip: 'Listen for the d sounds' }],
}));

// SP11d: ShadowingScreen fetches SHADOWING via useContent().
vi.mock('../hooks/useContent', () => ({
  useContent: () => ({
    content: {
      V: {},
      COUNTRIES: [],
      PROFESSIONS: [],
      WEATHER: {},
      CLOTHES: {},
      BODYDESC: [],
      TECH_VOC: {},
      BUREAUCRATIC: {},
      PROVERBS: [],
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
      LEVEL_NARRATIVE: {},
      SHADOWING: [{ hr: 'Dobar dan', en: 'Good day', tip: 'Listen for the d sounds' }],
    },
    loading: false,
    error: null,
    reload: () => {},
  }),
}));

vi.mock('../lib/adaptive.js', () => ({ recordTopicResult: vi.fn() }));

vi.mock('../components/shared/PronunciationScorer', () => ({
  default: () => null,
}));

vi.mock('../lib/quests.js', () => ({ markQuest: vi.fn() }));

vi.mock('../lib/platform', () => ({
  getMicPermissionPlatform: () => 'desktop',
}));

const recorderMock = vi.fn();
vi.mock('../hooks/useRecorder', () => ({
  useRecorder: () => recorderMock(),
}));

function recorderState(overrides: Record<string, unknown> = {}) {
  return {
    state: 'idle' as const,
    micAvailable: null,
    audioBlob: null,
    audioUrl: null,
    countdown: 0,
    error: null,
    startRecording: vi.fn(),
    stopRecording: vi.fn(),
    playback: vi.fn(),
    reset: vi.fn(),
    ...overrides,
  };
}

function makeCtx() {
  const setStats = vi.fn();
  const writeDelta = vi.fn();
  const award = vi.fn();
  const stats: Stats = {
    xp: 0,
    lc: 0,
    gc: 0,
    sp: 0,
    de: 0,
    rc: 0,
    pf: 0,
    mv: 0,
    hi: 0,
    str: 0,
    authLoading: 0,
    diff: 'beginner',
    ct: [],
    vs: [],
    rs: [],
    badges: [],
  };
  const value: StatsContextValue = {
    stats,
    setStats,
    writeDelta,
    dispatch: vi.fn(),
    award,
    level: 1,
  };
  return { value };
}

describe('ShadowingScreen mic states', () => {
  beforeEach(() => {
    recorderMock.mockReset();
  });

  it('idle: Record button visible', async () => {
    recorderMock.mockReturnValue(recorderState({ state: 'idle' }));
    const { default: ShadowingScreen } = await import('../components/practice/ShadowingScreen');
    const { value } = makeCtx();
    render(
      <StatsProvider value={value}>
        <ShadowingScreen goBack={vi.fn()} award={vi.fn()} />
      </StatsProvider>,
    );
    expect(screen.getByText(/Record My Attempt/i)).toBeInTheDocument();
  });

  it('countdown: counter is visible', async () => {
    recorderMock.mockReturnValue(recorderState({ state: 'countdown', countdown: 2 }));
    const { default: ShadowingScreen } = await import('../components/practice/ShadowingScreen');
    const { value } = makeCtx();
    render(
      <StatsProvider value={value}>
        <ShadowingScreen goBack={vi.fn()} award={vi.fn()} />
      </StatsProvider>,
    );
    expect(screen.getByText(/Get ready/i)).toBeInTheDocument();
  });

  it('recording: red Recording label visible', async () => {
    recorderMock.mockReturnValue(recorderState({ state: 'recording' }));
    const { default: ShadowingScreen } = await import('../components/practice/ShadowingScreen');
    const { value } = makeCtx();
    render(
      <StatsProvider value={value}>
        <ShadowingScreen goBack={vi.fn()} award={vi.fn()} />
      </StatsProvider>,
    );
    expect(screen.getByText(/Recording/i)).toBeInTheDocument();
  });

  it('done: Play Back button visible', async () => {
    recorderMock.mockReturnValue(
      recorderState({ state: 'done', audioUrl: 'data:audio/webm;base64,X' }),
    );
    const { default: ShadowingScreen } = await import('../components/practice/ShadowingScreen');
    const { value } = makeCtx();
    render(
      <StatsProvider value={value}>
        <ShadowingScreen goBack={vi.fn()} award={vi.fn()} />
      </StatsProvider>,
    );
    expect(screen.getByText(/Play Back/i)).toBeInTheDocument();
  });

  it('denied: MicPermissionDeniedExplainer rendered', async () => {
    recorderMock.mockReturnValue(recorderState({ state: 'denied', micAvailable: false }));
    const { default: ShadowingScreen } = await import('../components/practice/ShadowingScreen');
    const { value } = makeCtx();
    render(
      <StatsProvider value={value}>
        <ShadowingScreen goBack={vi.fn()} award={vi.fn()} />
      </StatsProvider>,
    );
    expect(screen.getByText(/Microphone access is blocked/i)).toBeInTheDocument();
  });

  it('unsupported: fallback message + writing alternative shown', async () => {
    recorderMock.mockReturnValue(recorderState({ state: 'unsupported', micAvailable: false }));
    const { default: ShadowingScreen } = await import('../components/practice/ShadowingScreen');
    const { value } = makeCtx();
    render(
      <StatsProvider value={value}>
        <ShadowingScreen goBack={vi.fn()} award={vi.fn()} />
      </StatsProvider>,
    );
    expect(screen.getByText(/Microphone not available/i)).toBeInTheDocument();
  });

  it('error: Try Again button rendered', async () => {
    recorderMock.mockReturnValue(
      recorderState({ state: 'error', error: { code: 'X', message: 'oops' } }),
    );
    const { default: ShadowingScreen } = await import('../components/practice/ShadowingScreen');
    const { value } = makeCtx();
    render(
      <StatsProvider value={value}>
        <ShadowingScreen goBack={vi.fn()} award={vi.fn()} />
      </StatsProvider>,
    );
    expect(screen.getByText(/Try Again/i)).toBeInTheDocument();
  });
});
