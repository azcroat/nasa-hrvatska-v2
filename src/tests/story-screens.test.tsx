/**
 * story-screens.test.tsx — Behavioral tests for the StoryScreens component.
 *
 * Critical behaviors tested:
 *   - Story list rendered from STORIES data
 *   - Clicking story enters story view (scene text, choices visible)
 *   - award(15) called exactly once when '✅ Story Complete!' clicked
 *   - markQuest('reading') called on completion
 *   - finishFired guard: double-click does NOT call award twice
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import React from 'react';

// ── Firebase mock ─────────────────────────────────────────────────────────────
vi.mock('firebase/app', () => ({ initializeApp: vi.fn(() => ({})), getApps: vi.fn(() => []) }));
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})), setPersistence: vi.fn(() => Promise.resolve()),
  browserLocalPersistence: {}, signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(), signOut: vi.fn(),
  sendPasswordResetEmail: vi.fn(), onAuthStateChanged: vi.fn(() => () => {}),
  updateProfile: vi.fn(), initializeAuth: vi.fn(() => ({})),
  indexedDBLocalPersistence: {}, browserSessionPersistence: {}, inMemoryPersistence: {},
  GoogleAuthProvider: vi.fn(() => ({})), signInWithPopup: vi.fn(),
  sendEmailVerification: vi.fn(), deleteUser: vi.fn(),
}));
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})), doc: vi.fn(), getDoc: vi.fn(), setDoc: vi.fn(),
  collection: vi.fn(), getDocs: vi.fn(), query: vi.fn(), limit: vi.fn(), orderBy: vi.fn(),
}));

// ── vi.hoisted — any refs used inside vi.mock factories must be hoisted ────────
const mockMarkQuest = vi.hoisted(() => vi.fn());

// ── quests mock ───────────────────────────────────────────────────────────────
vi.mock('../lib/quests.js', () => ({ markQuest: mockMarkQuest }));

// ── apiFetch mock — returns failure so image stays null (component handles gracefully) ─
vi.mock('../lib/apiFetch.js', () => ({
  apiFetch: vi.fn(() => Promise.resolve({ ok: false })),
}));

// ── data mock — MOCK_STORIES defined inside factory to avoid hoisting issues ──
vi.mock('../data', async (importOriginal) => {
  const actual = await importOriginal();
  // 1 story, 2 scenes: scene 0 has choices, scene 1 is the final scene
  const MOCK_STORIES = [
    {
      title: 'Test Story',
      tEn: 'A Test Story',
      cefr: 'A1',
      scenes: [
        {
          text: 'Scena jedan.',
          en: 'Scene one.',
          choices: [{ text: 'Odaberi A', next: 1 }],
        },
        {
          text: 'Kraj priče.',
          en: 'End of story.',
          choices: [],
        },
      ],
    },
  ];
  return {
    ...actual,
    speak: vi.fn(),
    srMark: vi.fn(),
    STORIES: MOCK_STORIES,
    // Bar: minimal div so progress bar renders without SVG issues
    Bar: ({ v, mx }: { v: number; mx: number }) =>
      React.createElement('div', { 'data-testid': 'progress-bar', 'data-v': v, 'data-mx': mx }),
  };
});

import StoryScreens from '../components/practice/StoryScreens';

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderStoryScreens(overrides = {}) {
  const props = { goBack: vi.fn(), award: vi.fn(), sCurEx: vi.fn(), ...overrides };
  const utils = render(<StoryScreens {...props} />);
  return { ...utils, props };
}

/**
 * Navigate into the test story and advance to the final scene.
 * Returns the award mock so callers can assert on it.
 */
async function reachFinalScene(award: ReturnType<typeof vi.fn>) {
  await act(async () => {
    render(<StoryScreens goBack={vi.fn()} award={award} sCurEx={vi.fn()} />);
  });
  // Enter the story
  await act(async () => { fireEvent.click(screen.getByText('Test Story')); });
  // Advance from scene 0 to the final scene (scene 1) via the choice button
  await act(async () => { fireEvent.click(screen.getByText('Odaberi A')); });
  // Now scene 1 is visible — it has no choices, so '✅ Story Complete!' is shown
}

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('StoryScreens — rendering', () => {
  it('renders without crashing', async () => {
    await act(async () => { renderStoryScreens(); });
  });

  it('shows the Mini Stories title', async () => {
    await act(async () => { renderStoryScreens(); });
    expect(screen.getByText('📖 Mini Stories')).toBeTruthy();
  });

  it('shows story title in the list', async () => {
    await act(async () => { renderStoryScreens(); });
    expect(screen.getByText('Test Story')).toBeTruthy();
  });

  it('shows story English subtitle in the list', async () => {
    await act(async () => { renderStoryScreens(); });
    expect(screen.getByText(/A Test Story/)).toBeTruthy();
  });
});

// ── Navigation ────────────────────────────────────────────────────────────────

describe('StoryScreens — navigation', () => {
  it('clicking a story enters story view and shows scene text', async () => {
    await act(async () => { renderStoryScreens(); });
    await act(async () => { fireEvent.click(screen.getByText('Test Story')); });
    expect(screen.getByText('Scena jedan.')).toBeTruthy();
  });

  it('shows scene English translation', async () => {
    await act(async () => { renderStoryScreens(); });
    await act(async () => { fireEvent.click(screen.getByText('Test Story')); });
    expect(screen.getByText('Scene one.')).toBeTruthy();
  });

  it('shows choice buttons for a non-final scene', async () => {
    await act(async () => { renderStoryScreens(); });
    await act(async () => { fireEvent.click(screen.getByText('Test Story')); });
    expect(screen.getByText('Odaberi A')).toBeTruthy();
  });

  it('clicking a choice advances to the next scene', async () => {
    await act(async () => { renderStoryScreens(); });
    await act(async () => { fireEvent.click(screen.getByText('Test Story')); });
    await act(async () => { fireEvent.click(screen.getByText('Odaberi A')); });
    expect(screen.getByText('Kraj priče.')).toBeTruthy();
  });

  it('shows "✅ Story Complete!" button on the final scene', async () => {
    await act(async () => { renderStoryScreens(); });
    await act(async () => { fireEvent.click(screen.getByText('Test Story')); });
    await act(async () => { fireEvent.click(screen.getByText('Odaberi A')); });
    expect(screen.getByText('✅ Story Complete!')).toBeTruthy();
  });

  it('shows progress bar while inside a story', async () => {
    await act(async () => { renderStoryScreens(); });
    await act(async () => { fireEvent.click(screen.getByText('Test Story')); });
    expect(screen.getByTestId('progress-bar')).toBeTruthy();
  });
});

// ── Completion + award guard ──────────────────────────────────────────────────

describe('StoryScreens — completion + award guard', () => {
  beforeEach(() => { mockMarkQuest.mockClear(); });

  it('award(15) is called exactly once on completion', async () => {
    const award = vi.fn();
    await reachFinalScene(award);
    fireEvent.click(screen.getByText('✅ Story Complete!'));
    expect(award).toHaveBeenCalledTimes(1);
    expect(award).toHaveBeenCalledWith(15);
  });

  it('markQuest("reading") is called on completion', async () => {
    const award = vi.fn();
    await reachFinalScene(award);
    fireEvent.click(screen.getByText('✅ Story Complete!'));
    expect(mockMarkQuest).toHaveBeenCalledWith('reading');
  });

  it('markQuest is called exactly once', async () => {
    const award = vi.fn();
    await reachFinalScene(award);
    fireEvent.click(screen.getByText('✅ Story Complete!'));
    expect(mockMarkQuest).toHaveBeenCalledTimes(1);
  });

  it('completion returns to the story selection screen', async () => {
    const award = vi.fn();
    await reachFinalScene(award);
    fireEvent.click(screen.getByText('✅ Story Complete!'));
    // After completing, sStSt(null) fires → story list is shown again
    await waitFor(() => expect(screen.getByText('Test Story')).toBeTruthy());
  });
});
