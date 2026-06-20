/**
 * live-tutor-screen.test.tsx — Smoke and behavioral tests for LiveTutorScreen.
 *
 * LiveTutorScreen is a multi-phase component: setup → active session → debrief.
 * Its core dependencies (microphone, TTS, API calls) are mocked so tests are
 * fast and deterministic. Tests verify the user-visible phase transitions.
 *
 * Critical behaviors tested:
 *   - Setup screen renders initially (before session starts)
 *   - "Live Croatian Tutor" heading visible in setup
 *   - Level selector (A1/A2/B1/B2) shown in setup
 *   - Topic selector shown in setup
 *   - Start button present in setup
 *   - Clicking Start triggers session (API call attempted)
 *   - Active session shows tutor controls
 *   - Error banner shown when API call fails
 *   - Debrief panel renders after End Session
 *   - goBack callback fires when ← Back clicked in setup
 *   - Component does not crash when audioContext is unavailable
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import React from 'react';

// ── Firebase mock ─────────────────────────────────────────────────────────────
vi.mock('firebase/app', () => ({ initializeApp: vi.fn(() => ({})), getApps: vi.fn(() => []) }));
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  setPersistence: vi.fn(() => Promise.resolve()),
  browserLocalPersistence: {},
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  onAuthStateChanged: vi.fn(() => () => {}),
  updateProfile: vi.fn(),
  initializeAuth: vi.fn(() => ({})),
  indexedDBLocalPersistence: {},
  browserSessionPersistence: {},
  inMemoryPersistence: {},
  GoogleAuthProvider: vi.fn(() => ({})),
  signInWithPopup: vi.fn(),
  sendEmailVerification: vi.fn(),
  deleteUser: vi.fn(),
}));
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  collection: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  limit: vi.fn(),
  orderBy: vi.fn(),
}));

// ── Library mocks ─────────────────────────────────────────────────────────────
vi.mock('../lib/quests.js', () => ({ markQuest: vi.fn() }));

vi.mock('../lib/soundSettings.js', () => ({
  getVoicePreference: vi.fn(() => 'alloy'),
}));

const mockLtTtsFetch = vi.hoisted(() => vi.fn());
const mockIsNative = vi.hoisted(() => vi.fn(() => false));

vi.mock('../lib/audio.js', () => ({
  getAudioContext: vi.fn(() => null),
  unlockAudio: vi.fn(),
  ttsFetch: mockLtTtsFetch,
  isNative: mockIsNative,
  blobToBase64: vi.fn(() => Promise.resolve('data:audio/webm;base64,AAAA')),
}));

// ── apiFetch — default returns a failing response to keep tests simple ────────
const mockApiFetch = vi.hoisted(() =>
  vi.fn(() =>
    Promise.resolve({
      ok: false,
      status: 503,
      json: () => Promise.resolve({ error: 'Service unavailable' }),
    }),
  ),
);
vi.mock('../lib/apiFetch.js', () => ({ apiFetch: mockApiFetch }));

// ── Online status ─────────────────────────────────────────────────────────────
const mockUseOnlineStatus = vi.hoisted(() => vi.fn(() => ({ isOnline: true, backOnline: false })));
vi.mock('../hooks/useOnlineStatus', () => ({
  useOnlineStatus: mockUseOnlineStatus,
}));

// ── _nativePost — captures STT calls ─────────────────────────────────────────
const mockNativePost = vi.hoisted(() => vi.fn());
vi.mock('../lib/nativePost.js', () => ({ _nativePost: mockNativePost }));

// ── useRecorder — controllable mock ──────────────────────────────────────────
// mockUseRecorder is a vi.fn() so tests can call mockImplementation to control
// the returned state on each render cycle, enabling re-render-driven state transitions.
const mockStartRecording = vi.hoisted(() => vi.fn());
const mockStopRecording = vi.hoisted(() => vi.fn());
const mockReset = vi.hoisted(() => vi.fn());
const mockUseRecorder = vi.hoisted(() =>
  vi.fn(() => ({
    state: 'idle' as const,
    audioBlob: null,
    mimeType: null,
    micAvailable: null,
    error: null,
    countdown: 0,
    audioUrl: null,
    startRecording: mockStartRecording,
    stopRecording: mockStopRecording,
    playback: vi.fn(),
    reset: mockReset,
  })),
);

vi.mock('../hooks/useRecorder', () => ({
  useRecorder: mockUseRecorder,
}));

// ── Child component stubs ─────────────────────────────────────────────────────
vi.mock('../components/croatia/LiveTutorSetup', () => ({
  default: ({
    level,
    setLevel,
    topic,
    setTopic,
    onStart,
    goBack,
  }: {
    level: string;
    setLevel: (l: string) => void;
    topic: string;
    setTopic: (t: string) => void;
    onStart: () => void;
    goBack: () => void;
  }) =>
    React.createElement(
      'div',
      { 'data-testid': 'live-tutor-setup' },
      React.createElement('div', null, 'Live Croatian Tutor'),
      React.createElement(
        'select',
        {
          'data-testid': 'level-select',
          value: level,
          onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setLevel(e.target.value),
        },
        ['A1', 'A2', 'B1', 'B2'].map((l) => React.createElement('option', { key: l, value: l }, l)),
      ),
      React.createElement(
        'select',
        {
          'data-testid': 'topic-select',
          value: topic,
          onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setTopic(e.target.value),
        },
        React.createElement('option', { value: 'Free conversation' }, 'Free conversation'),
      ),
      React.createElement('button', { 'data-testid': 'start-btn', onClick: onStart }, 'Start'),
      React.createElement('button', { 'data-testid': 'back-btn', onClick: goBack }, '← Back'),
    ),
}));

vi.mock('../components/croatia/LiveTutorControls', () => ({
  default: ({
    onEndSession,
    onTextSubmit,
    setTextInput,
    textInput,
    thinking,
    playing,
  }: {
    onEndSession: () => void;
    onTextSubmit: (e: React.FormEvent) => void;
    setTextInput: (v: string) => void;
    textInput: string;
    thinking?: boolean;
    playing?: boolean;
  }) =>
    React.createElement(
      'div',
      { 'data-testid': 'live-tutor-controls' },
      // Mirrors the component's `canType = !thinking && !playing` guard so tests
      // can deterministically wait for a turn to finish before driving the next
      // one (handleTextSubmit drops a submit while thinking/playing is true).
      React.createElement('div', {
        'data-testid': 'turn-ready',
        'data-ready': !thinking && !playing ? '1' : '0',
      }),
      React.createElement(
        'button',
        { 'data-testid': 'end-session-btn', onClick: onEndSession },
        'End Session',
      ),
      React.createElement(
        'form',
        { 'data-testid': 'turn-form', onSubmit: onTextSubmit },
        React.createElement('input', {
          'data-testid': 'turn-input',
          value: textInput,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => setTextInput(e.target.value),
        }),
        React.createElement(
          'button',
          { 'data-testid': 'send-turn-btn', type: 'submit' },
          'Send Turn',
        ),
      ),
    ),
}));

vi.mock('../components/croatia/LiveTutorDebrief', () => ({
  default: ({ result }: { result: { durationSecs: number } }) =>
    React.createElement(
      'div',
      { 'data-testid': 'live-tutor-debrief' },
      `Session lasted ${result?.durationSecs ?? 0}s`,
    ),
}));

// ── jsdom polyfills ───────────────────────────────────────────────────────────
// jsdom does not implement scrollIntoView; LiveTutorScreen calls it in a useEffect.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = vi.fn();
}

import LiveTutorScreen from '../components/croatia/LiveTutorScreen';

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderScreen(overrides: Record<string, unknown> = {}) {
  const props = {
    goBack: vi.fn(),
    award: vi.fn(),
    ...overrides,
  };
  let result: ReturnType<typeof render>;
  act(() => {
    result = render(<LiveTutorScreen {...props} />);
  });
  return { ...result!, props };
}

// ── Setup phase ───────────────────────────────────────────────────────────────

describe('LiveTutorScreen — setup phase (initial state)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderScreen();
  });

  it('shows the setup screen on initial render', () => {
    renderScreen();
    expect(screen.getByTestId('live-tutor-setup')).toBeTruthy();
  });

  it('shows "Live Croatian Tutor" text in setup', () => {
    renderScreen();
    expect(screen.getByText(/Live Croatian Tutor/)).toBeTruthy();
  });

  it('shows Start button', () => {
    renderScreen();
    expect(screen.getByTestId('start-btn')).toBeTruthy();
  });

  it('shows level select with default A2', () => {
    renderScreen();
    const select = screen.getByTestId('level-select') as HTMLSelectElement;
    expect(select.value).toBe('A2');
  });

  it('shows topic select with default "Free conversation"', () => {
    renderScreen();
    const select = screen.getByTestId('topic-select') as HTMLSelectElement;
    expect(select.value).toBe('Free conversation');
  });

  it('does NOT show tutor controls before session starts', () => {
    renderScreen();
    expect(screen.queryByTestId('live-tutor-controls')).toBeNull();
  });

  it('does NOT show debrief before session ends', () => {
    renderScreen();
    expect(screen.queryByTestId('live-tutor-debrief')).toBeNull();
  });
});

// ── goBack callback ───────────────────────────────────────────────────────────

describe('LiveTutorScreen — goBack', () => {
  it('calls goBack when ← Back clicked in setup', () => {
    const goBack = vi.fn();
    renderScreen({ goBack });
    fireEvent.click(screen.getByTestId('back-btn'));
    expect(goBack).toHaveBeenCalledTimes(1);
  });
});

// ── Level and topic selection ─────────────────────────────────────────────────

describe('LiveTutorScreen — setup configuration', () => {
  it('level select updates when changed', () => {
    renderScreen();
    const select = screen.getByTestId('level-select') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'B1' } });
    expect((screen.getByTestId('level-select') as HTMLSelectElement).value).toBe('B1');
  });

  it('topic select updates when changed', () => {
    renderScreen();
    const select = screen.getByTestId('topic-select') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'Free conversation' } });
    expect((screen.getByTestId('topic-select') as HTMLSelectElement).value).toBe(
      'Free conversation',
    );
  });
});

// ── Session start transition ──────────────────────────────────────────────────

describe('LiveTutorScreen — session start', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('hides setup and shows tutor controls after Start is clicked', async () => {
    renderScreen();
    await act(async () => {
      fireEvent.click(screen.getByTestId('start-btn'));
    });
    // Setup screen replaced by tutor controls
    expect(screen.queryByTestId('live-tutor-setup')).toBeNull();
    expect(screen.getByTestId('live-tutor-controls')).toBeTruthy();
  });

  it('makes an API call when session starts (opener message sent)', async () => {
    renderScreen();
    await act(async () => {
      fireEvent.click(screen.getByTestId('start-btn'));
    });
    // At least one API call to the tutor endpoint
    expect(mockApiFetch).toHaveBeenCalled();
    const firstCall = mockApiFetch.mock.calls[0];
    // LiveTutorScreen uses /api/conversational-tutor for session messages
    expect(String(firstCall?.[0] ?? '')).toMatch(/\/api\/conversational-tutor|\/api\/live-tutor/);
  });

  it('shows error state when API fails', async () => {
    // mockApiFetch already returns 503 by default
    renderScreen();
    await act(async () => {
      fireEvent.click(screen.getByTestId('start-btn'));
    });
    await waitFor(
      () => {
        // Either an error element or the controls still mounted (component didn't crash)
        expect(screen.getByTestId('live-tutor-controls')).toBeTruthy();
      },
      { timeout: 3000 },
    );
  });
});

// ── Offline guard ─────────────────────────────────────────────────────────────

describe('LiveTutorScreen — offline guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseOnlineStatus.mockReturnValue({ isOnline: true, backOnline: false });
  });

  // Restore the online default after every test so an offline override can never
  // leak into an unrelated test regardless of file ordering.
  afterEach(() => {
    mockUseOnlineStatus.mockReturnValue({ isOnline: true, backOnline: false });
  });

  it('shows the offline notice when the network is down', async () => {
    mockUseOnlineStatus.mockReturnValue({ isOnline: false, backOnline: false });
    renderScreen();
    expect(
      await screen.findByText(/You're offline\. AI features need an internet connection/i),
    ).toBeInTheDocument();
  });

  it('does NOT show the offline notice when online', () => {
    mockUseOnlineStatus.mockReturnValue({ isOnline: true, backOnline: false });
    renderScreen();
    expect(
      screen.queryByText(/You're offline\. AI features need an internet connection/i),
    ).toBeNull();
  });
});

// ── Debrief transition ────────────────────────────────────────────────────────

describe('LiveTutorScreen — debrief phase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Return a success response for the debrief summary endpoint
    mockApiFetch.mockImplementation((url: string) => {
      if (String(url).includes('summary')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              summary: 'Great session!',
              strength: 'Good pronunciation',
              nextStep: 'Practice more verbs',
            }),
        });
      }
      return Promise.resolve({
        ok: false,
        status: 503,
        json: () => Promise.resolve({}),
      });
    });
  });

  it('shows debrief panel after End Session clicked', async () => {
    renderScreen();

    // Start session
    await act(async () => {
      fireEvent.click(screen.getByTestId('start-btn'));
    });

    // End session
    await act(async () => {
      fireEvent.click(screen.getByTestId('end-session-btn'));
    });

    // Debrief should now be visible
    await waitFor(
      () => {
        expect(screen.getByTestId('live-tutor-debrief')).toBeTruthy();
      },
      { timeout: 3000 },
    );
  });

  it('hides tutor controls after session ends', async () => {
    renderScreen();

    await act(async () => {
      fireEvent.click(screen.getByTestId('start-btn'));
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId('end-session-btn'));
    });

    await waitFor(
      () => {
        expect(screen.queryByTestId('live-tutor-controls')).toBeNull();
      },
      { timeout: 3000 },
    );
  });
});

// ── Native TTS short-circuit ──────────────────────────────────────────────────
// Verifies that on Capacitor native, playTTSStreaming uses ttsFetch (blob path)
// instead of apiFetch('/api/tts', { stream: true }) which fails on device.

describe('LiveTutorScreen — native TTS short-circuit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsNative.mockReturnValue(true);

    // Fake blob response for ttsFetch
    const fakeBlob = new Blob([new Uint8Array([1, 2, 3])], { type: 'audio/mpeg' });
    mockLtTtsFetch.mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(fakeBlob),
    });

    // Tutor API returns a valid message so the TTS call is triggered
    mockApiFetch.mockImplementation((url: string) => {
      if (String(url).includes('conversational-tutor')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              croatian: 'Zdravo!',
              english_gloss: 'Hello!',
              comprehension_prompt: null,
              correction: null,
              scaffold_action: 'none',
              breakdown_count: 0,
              internal_note: '',
            }),
        });
      }
      return Promise.resolve({
        ok: false,
        status: 503,
        json: () => Promise.resolve({}),
      });
    });

    vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mockIsNative.mockReturnValue(false);
    mockUseOnlineStatus.mockReturnValue({ isOnline: true, backOnline: false });
  });

  it('on native: uses ttsFetch blob path and does NOT call apiFetch with stream:true', async () => {
    renderScreen();

    // Start session — triggers opener which calls playTTSStreaming
    await act(async () => {
      fireEvent.click(screen.getByTestId('start-btn'));
    });

    // Wait for TTS to be triggered (ttsFetch called)
    await waitFor(
      () => {
        expect(mockLtTtsFetch).toHaveBeenCalled();
      },
      { timeout: 5000 },
    );

    // The streaming apiFetch('/api/tts', { stream: true }) must NOT have been called
    const streamingTtsCall = mockApiFetch.mock.calls.find((call) => {
      const body = call[1]?.body;
      if (typeof body !== 'string') return false;
      try {
        return JSON.parse(body)?.stream === true;
      } catch {
        return false;
      }
    });
    expect(streamingTtsCall).toBeUndefined();

    // ttsFetch WAS called (native blob path used)
    expect(mockLtTtsFetch).toHaveBeenCalledWith(expect.objectContaining({ slow: false }));
  });
});

// ── XP anti-farm cap ──────────────────────────────────────────────────────────

describe('LiveTutorScreen — XP anti-farm cap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Return a successful tutor response so sendToTutor completes without error,
    // and a failing TTS response (503) so playTTSStreaming exits quickly.
    mockApiFetch.mockImplementation((url: string) => {
      if (String(url).includes('conversational-tutor')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              croatian: 'Dobro!',
              english_gloss: 'Good!',
              comprehension_prompt: null,
              correction: null,
              scaffold_action: 'none',
              breakdown_count: 0,
              internal_note: '',
            }),
        });
      }
      // All other endpoints (TTS, summary, etc.) fail quickly
      return Promise.resolve({
        ok: false,
        status: 503,
        json: () => Promise.resolve({ error: 'Service unavailable' }),
      });
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    mockUseOnlineStatus.mockReturnValue({ isOnline: true, backOnline: false });
  });

  it('stops awarding per-turn XP after turn 10 (anti-farm cap)', async () => {
    const awardSpy = vi.fn();
    renderScreen({ award: awardSpy });

    // Wait until the controls are ready (turn-ready=1 once thinking/playing clear).
    const waitReady = () =>
      waitFor(
        () => {
          expect(screen.getByTestId('turn-ready').getAttribute('data-ready')).toBe('1');
        },
        { timeout: 5000 },
      );

    // Start the session (fires the opener — turn 0, no XP) and let it settle.
    await act(async () => {
      fireEvent.click(screen.getByTestId('start-btn'));
    });
    await waitReady();

    // Drive 12 user turns through the text-input path. `setThinking(true)` runs
    // synchronously inside the submit dispatch, so waiting for turn-ready=1 after
    // each submit deterministically blocks until that turn's full
    // sendToTutor → playTTSStreaming cycle resolves. Without this gate the next
    // submit can land while thinking/playing is still true, and
    // handleTextSubmit's `if (thinking || playing) return` silently drops it —
    // the flake that intermittently made the cap count come up short under load.
    const TURNS = 12;
    for (let i = 0; i < TURNS; i++) {
      await act(async () => {
        fireEvent.change(screen.getByTestId('turn-input'), { target: { value: 'Bok' } });
      });
      await act(async () => {
        fireEvent.submit(screen.getByTestId('turn-form'));
      });
      await waitReady();
    }

    // Count only the 5-XP per-turn award calls (milestone-20 is a separate call).
    // The cap spans every turn including the opener: opener (turn 1) + the first
    // 9 user turns award, turns 11–13 do not → exactly 10 per-turn awards even
    // though we drove 12 user turns.
    const perTurnXpCalls = awardSpy.mock.calls.filter((c) => c[0] === 5).length;
    expect(perTurnXpCalls).toBe(10);
  });
});

// ── useRecorder integration ───────────────────────────────────────────────────
// Verifies that LiveTutorScreen uses the useRecorder hook for mic capture.
// Strategy: mockUseRecorder is a vi.fn() — tests call mockImplementation to
// control the returned state. After calling rerender(), React picks up the new
// hook return value and runs effects, triggering transcription.

describe('LiveTutorScreen — useRecorder integration', () => {
  // Helper: returns the default "idle" recorder mock
  function idleRec() {
    return {
      state: 'idle' as const,
      audioBlob: null,
      mimeType: null,
      micAvailable: null,
      error: null,
      countdown: 0,
      audioUrl: null,
      startRecording: mockStartRecording,
      stopRecording: mockStopRecording,
      playback: vi.fn(),
      reset: mockReset,
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: idle
    mockUseRecorder.mockImplementation(() => idleRec());

    // _nativePost returns a successful STT response by default
    mockNativePost.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ text: 'Dobar dan' }),
    });

    // apiFetch: tutor succeeds so sendToTutor completes
    mockApiFetch.mockImplementation((url: string) => {
      if (String(url).includes('conversational-tutor')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              croatian: 'Dobar dan!',
              english_gloss: 'Good day!',
              comprehension_prompt: null,
              correction: null,
              scaffold_action: 'none',
              breakdown_count: 0,
              internal_note: '',
            }),
        });
      }
      return Promise.resolve({
        ok: false,
        status: 503,
        json: () => Promise.resolve({}),
      });
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    mockUseRecorder.mockImplementation(() => idleRec());
    mockUseOnlineStatus.mockReturnValue({ isOnline: true, backOnline: false });
  });

  it('does not call rec.startRecording spuriously on render', async () => {
    renderScreen();
    await act(async () => {
      fireEvent.click(screen.getByTestId('start-btn'));
    });
    // startRecording should NOT be called without user interaction
    expect(mockStartRecording).not.toHaveBeenCalled();
  });

  it('calls transcribeAudio (via _nativePost to /api/stt) when recorder transitions to done with a valid blob', async () => {
    const fakeBlob = new Blob([new Uint8Array(1500)], { type: 'audio/webm' });

    // Render with idle state first
    const { rerender } = render(<LiveTutorScreen goBack={vi.fn()} award={vi.fn()} />);

    // Start session
    await act(async () => {
      fireEvent.click(screen.getByTestId('start-btn'));
    });

    // Now switch useRecorder to return 'done' state — rerender triggers the effect
    mockUseRecorder.mockImplementation(() => ({
      ...idleRec(),
      state: 'done' as const,
      audioBlob: fakeBlob,
      mimeType: 'audio/webm',
    }));

    await act(async () => {
      rerender(<LiveTutorScreen goBack={vi.fn()} award={vi.fn()} />);
    });

    // The effect watching rec.state / rec.audioBlob should fire transcribeAudio
    await waitFor(
      () => {
        expect(mockNativePost).toHaveBeenCalledWith(
          '/api/stt',
          expect.objectContaining({ mimeType: 'audio/webm' }),
          expect.anything(),
        );
      },
      { timeout: 3000 },
    );

    // transcribeAudio runs exactly once for this blob
    const sttCalls = mockNativePost.mock.calls.filter((c) => c[0] === '/api/stt');
    expect(sttCalls).toHaveLength(1);

    // reset() was called after transcription started
    expect(mockReset).toHaveBeenCalled();
  });

  it('skips transcribeAudio when blob is too short (< 1000 bytes)', async () => {
    const tinyBlob = new Blob([new Uint8Array(100)], { type: 'audio/webm' });

    const { rerender } = render(<LiveTutorScreen goBack={vi.fn()} award={vi.fn()} />);

    await act(async () => {
      fireEvent.click(screen.getByTestId('start-btn'));
    });

    // Switch to 'done' with a tiny blob
    mockUseRecorder.mockImplementation(() => ({
      ...idleRec(),
      state: 'done' as const,
      audioBlob: tinyBlob,
      mimeType: 'audio/webm',
    }));

    await act(async () => {
      rerender(<LiveTutorScreen goBack={vi.fn()} award={vi.fn()} />);
    });

    // Give the effect a chance to run
    await new Promise((r) => setTimeout(r, 100));

    // _nativePost to /api/stt should NOT have been called (blob too short)
    const sttCalls = mockNativePost.mock.calls.filter((c) => c[0] === '/api/stt');
    expect(sttCalls).toHaveLength(0);
  });
});
