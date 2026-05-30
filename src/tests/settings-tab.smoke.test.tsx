/**
 * settings-tab.smoke.test.tsx — Characterization/safety net for SettingsTab.
 *
 * SettingsTab is a 2000-line god-component with NO prior component-level test.
 * This smoke test is the safety net for the 1a decomposition (raise-to-senior-
 * grade roadmap): it renders the tab and asserts every major section still
 * appears and the first toggle still wires to its setter. Each extraction step
 * must keep this green — if a section disappears or render crashes, this fails.
 *
 * Deliberately a SMOKE test, not exhaustive behavior: section presence + one
 * representative interaction. Behavior depth is covered by E2E.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// ── Context + hook mocks ──────────────────────────────────────────────────────
const mockSetSoundEnabled = vi.hoisted(() => vi.fn());

vi.mock('../context/AppContext', () => ({
  useApp: vi.fn(() => ({
    au: { u: 'test@example.com', d: 'Test' },
    darkMode: false,
    setDarkMode: vi.fn(),
    setScr: vi.fn(),
    doOut: vi.fn(),
    name: 'Test',
    favs: [],
    jWords: [],
    launchFlashcards: vi.fn(),
    launchSpeaking: vi.fn(),
  })),
  AppProvider: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

vi.mock('../context/StatsContext.tsx', () => ({
  useStats: vi.fn(() => ({ stats: { xp: 500, lc: 0, str: 0 }, setStats: vi.fn() })),
  StatsProvider: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

vi.mock('../hooks/useContent', () => ({
  useContent: vi.fn(() => ({ content: { V: {} } })),
}));

vi.mock('../lib/soundSettings.js', () => ({
  isSoundEnabled: vi.fn(() => false),
  setSoundEnabled: mockSetSoundEnabled,
  isHapticEnabled: vi.fn(() => false),
  setHapticEnabled: vi.fn(),
  getVoicePreference: vi.fn(() => 'female'),
  setVoicePreference: vi.fn(),
  getSpeechRate: vi.fn(() => 'normal'),
  setSpeechRate: vi.fn(),
}));

vi.mock('../lib/streakFreeze.js', () => ({
  getFreezesStored: vi.fn(() => 0),
  purchaseFreeze: vi.fn(() => ({ ok: false, reason: 'Not enough XP' })),
  FREEZE_COST_XP: 200,
}));

vi.mock('../lib/audio.ts', () => ({
  speak: vi.fn(() => Promise.resolve('ok')),
  getAudioDebugState: vi.fn(() => ({})),
}));

vi.mock('../lib/debugLog.ts', () => ({ getEntries: vi.fn(() => []) }));
vi.mock('../lib/platform.ts', () => ({ isNative: vi.fn(() => false) }));
vi.mock('../lib/firebase.js', () => ({ fbExportUserData: vi.fn(() => Promise.resolve({})) }));
vi.mock('../data', () => ({
  fbDeleteAccount: vi.fn(() => Promise.resolve({ ok: true })),
  sh: vi.fn((x: unknown) => x),
}));

import SettingsTab from '../components/profile/SettingsTab';

function renderTab(overrides: Record<string, unknown> = {}) {
  // Goal Focus section only renders when a goal is set, so seed one — we want the
  // populated tab under test, not the empty state.
  localStorage.setItem('nh_goal', 'heritage');
  const props = { syncReady: true, onSyncNow: vi.fn(), ...overrides };
  return { ...render(<SettingsTab {...props} />), props };
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});
afterEach(() => localStorage.clear());

describe('SettingsTab — smoke / characterization net (guards 1a decomposition)', () => {
  // The 8 section-hdr-title strings that must survive any decomposition.
  const SECTIONS = [
    'Goal Focus',
    'Learning Preferences',
    'Heritage Learner',
    'Streak Protection',
    'Notifications',
    'Cloud Sync',
    'Appearance',
    'Data & Account',
  ];

  it('renders without crashing and shows every major section', () => {
    renderTab();
    for (const title of SECTIONS) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
  });

  it('renders the Sound Effects + Croatian Pronunciation preference rows', () => {
    renderTab();
    expect(screen.getByText('Sound Effects')).toBeInTheDocument();
    // Emoji shares the text node ("🎙️ Croatian Pronunciation") — match on substring.
    expect(screen.getByText(/Croatian Pronunciation/)).toBeInTheDocument();
  });

  it('the first toggle (Sound Effects) wires to setSoundEnabled', () => {
    renderTab();
    const switches = screen.getAllByRole('switch');
    expect(switches.length).toBeGreaterThan(0);
    fireEvent.click(switches[0]!); // Sound Effects is the first switch in the tab
    expect(mockSetSoundEnabled).toHaveBeenCalledWith(true); // default mocked off → toggles on
  });

  it('exposes the Sign Out and Danger Zone (delete) account controls', () => {
    renderTab();
    expect(screen.getByText(/sign out/i)).toBeInTheDocument();
    expect(screen.getByText(/delete/i)).toBeInTheDocument();
  });
});
