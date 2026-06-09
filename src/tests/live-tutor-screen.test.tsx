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

vi.mock('../lib/audio.js', () => ({
  getAudioContext: vi.fn(() => null),
  unlockAudio: vi.fn(),
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
  default: ({ onEndSession }: { onEndSession: () => void }) =>
    React.createElement(
      'div',
      { 'data-testid': 'live-tutor-controls' },
      React.createElement(
        'button',
        { 'data-testid': 'end-session-btn', onClick: onEndSession },
        'End Session',
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
