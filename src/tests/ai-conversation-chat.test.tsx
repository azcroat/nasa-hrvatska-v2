/**
 * ai-conversation-chat.test.tsx — Behavioral tests for AIConversationChat.
 *
 * AIConversationChat is a pure presentational component — all behaviors are
 * driven by props, so no hook or API mocking is required beyond child component
 * stubs. This makes it the ideal place to verify the critical pacing fixes:
 *
 * Critical behaviors tested:
 *   - Send button disabled when isSpeaking=true (pacing fix)
 *   - Send button enabled when isSpeaking=false and input is present
 *   - Enter key blocked while Maja is speaking (pacing fix)
 *   - Enter key submits when not speaking
 *   - Input placeholder changes to compose-while-speaking text during TTS
 *   - Mic button disabled when isSpeaking (prevents VAD interference)
 *   - Send button icon: ⏸ while speaking + typed input, ➤ otherwise
 *   - Interrupt button shown in header subtitle while speaking
 *   - Starter phrases panel toggled by Phrases button
 *   - Voice button absent when hasSpeechAPI=false
 *   - Hint button disabled when no messages exist
 *   - Offline state: input shows offline placeholder
 *   - Component renders without crashing with minimal props
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// ── Firebase mock (required by some transitive imports) ───────────────────────
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

// ── Child component stubs — avoid deep render trees and media/canvas APIs ─────
vi.mock('../components/croatia/SpeakingAvatar', () => ({
  default: ({ name }: { name: string }) =>
    React.createElement('div', { 'data-testid': 'speaking-avatar' }, name),
  portraitSrc: () => '/images/portraits/young-woman.webp',
}));
vi.mock('../components/croatia/TappableMessage', () => ({
  default: ({ msg }: { msg: { content: string } }) =>
    React.createElement('div', { 'data-testid': 'tappable-message' }, msg?.content ?? ''),
}));
vi.mock('../components/shared/WaveformVisualizer', () => ({
  default: () => React.createElement('div', { 'data-testid': 'waveform' }),
}));
vi.mock('../components/shared/CefrSoftHint', () => ({
  CefrSoftHint: () => null,
}));
vi.mock('../components/croatia/ConversationScenarios.js', () => ({
  sceneForCat: () => '/images/scenes/dubrovnik-hero.webp',
  STARTERS: {
    B1: ['Možete li mi pomoći?', 'Koliko košta?'],
    A1: ['Dobar dan!'],
  },
}));

import AIConversationChat from '../components/croatia/AIConversationChat';

// ── Shared test scenario ──────────────────────────────────────────────────────

const SCENARIO = {
  id: 'cafe',
  cat: 'Errands',
  aiName: 'Marija',
  title: 'At a Café',
  levels: ['A1', 'A2', 'B1'],
};

function makeProps(overrides: Record<string, unknown> = {}) {
  return {
    scenario: SCENARIO,
    level: 'B1',
    messages: [],
    corrections: {},
    loading: false,
    chatError: '',
    sendError: '',
    input: '',
    setInput: vi.fn(),
    listening: false,
    isSpeaking: false,
    npcVideoUrl: null,
    npcVideoLoading: false,
    muted: false,
    setMuted: vi.fn(),
    showStarters: false,
    setShowStarters: vi.fn(),
    userCount: 0,
    isOnline: true,
    hasSpeechAPI: true,
    isVoiceProcessing: false,
    vadLevel: 0,
    messagesEndRef: { current: null },
    inputRef: { current: null },
    onSend: vi.fn(),
    onSendError: vi.fn(),
    onInterrupt: vi.fn(),
    onToggleVoice: vi.fn(),
    onHint: vi.fn(),
    onRetryOpener: vi.fn(),
    onReset: vi.fn(),
    onEndEvaluate: vi.fn(),
    onWordClick: vi.fn(),
    onSpeakMessage: vi.fn(),
    ...overrides,
  };
}

function getSendButton() {
  return screen
    .getAllByRole('button')
    .find(
      (b) =>
        b.getAttribute('aria-label')?.toLowerCase().includes('send') ||
        b.getAttribute('aria-label')?.toLowerCase().includes('waiting'),
    );
}
function getMicButton() {
  // When isVoiceProcessing=true the icon switches from 🎤 to ⏳ — match the title instead
  return screen
    .getAllByRole('button')
    .find(
      (b) =>
        b.textContent?.includes('🎤') ||
        b.textContent?.includes('⏳') ||
        b.getAttribute('title')?.includes('Transcribing') ||
        b.getAttribute('title')?.includes('Speak in Croatian') ||
        b.getAttribute('title')?.includes('Stop listening'),
    );
}
function getInput() {
  return screen.getByRole('textbox');
}

// ── Smoke test ────────────────────────────────────────────────────────────────

describe('AIConversationChat — rendering', () => {
  it('renders without crashing', () => {
    render(<AIConversationChat {...makeProps()} />);
  });

  it('shows the NPC name in the header', () => {
    render(<AIConversationChat {...makeProps()} />);
    expect(screen.getAllByText('Marija').length).toBeGreaterThan(0);
  });

  it('renders a text input', () => {
    render(<AIConversationChat {...makeProps()} />);
    expect(getInput()).toBeTruthy();
  });

  it('renders a send button', () => {
    render(<AIConversationChat {...makeProps()} />);
    expect(getSendButton()).toBeTruthy();
  });

  it('renders a mic button when hasSpeechAPI=true', () => {
    render(<AIConversationChat {...makeProps({ hasSpeechAPI: true })} />);
    expect(getMicButton()).toBeTruthy();
  });

  it('does NOT render a mic button when hasSpeechAPI=false', () => {
    render(<AIConversationChat {...makeProps({ hasSpeechAPI: false })} />);
    expect(getMicButton()).toBeUndefined();
  });
});

// ── Send button disabled state ────────────────────────────────────────────────

describe('AIConversationChat — send button disabled logic (pacing fix)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('send button disabled when isSpeaking=true (even with typed input)', () => {
    render(<AIConversationChat {...makeProps({ isSpeaking: true, input: 'Dobar dan' })} />);
    const btn = getSendButton();
    expect(btn).toBeTruthy();
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });

  it('send button disabled when input is empty', () => {
    render(<AIConversationChat {...makeProps({ input: '' })} />);
    const btn = getSendButton();
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });

  it('send button disabled when offline', () => {
    render(<AIConversationChat {...makeProps({ isOnline: false, input: 'Test' })} />);
    const btn = getSendButton();
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });

  it('send button disabled when loading=true', () => {
    render(<AIConversationChat {...makeProps({ loading: true, input: 'Test' })} />);
    const btn = getSendButton();
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });

  it('send button enabled when not speaking, input present, online, not loading', () => {
    render(
      <AIConversationChat
        {...makeProps({ isSpeaking: false, input: 'Dobar dan', isOnline: true, loading: false })}
      />,
    );
    const btn = getSendButton();
    expect((btn as HTMLButtonElement).disabled).toBe(false);
  });
});

// ── Send button icon ──────────────────────────────────────────────────────────

describe('AIConversationChat — send button icon', () => {
  it('shows ⏸ icon when isSpeaking=true and input is non-empty', () => {
    render(<AIConversationChat {...makeProps({ isSpeaking: true, input: 'text' })} />);
    const btn = getSendButton();
    expect(btn?.textContent).toContain('⏸');
  });

  it('shows ➤ icon when not speaking', () => {
    render(<AIConversationChat {...makeProps({ isSpeaking: false, input: '' })} />);
    const btn = getSendButton();
    expect(btn?.textContent).toContain('➤');
  });

  it('shows ➤ icon when speaking but input is empty', () => {
    render(<AIConversationChat {...makeProps({ isSpeaking: true, input: '' })} />);
    const btn = getSendButton();
    expect(btn?.textContent).toContain('➤');
  });
});

// ── Input placeholder ─────────────────────────────────────────────────────────

describe('AIConversationChat — input placeholder', () => {
  it('shows compose-while-speaking placeholder when isSpeaking=true', () => {
    render(<AIConversationChat {...makeProps({ isSpeaking: true })} />);
    const input = getInput() as HTMLInputElement;
    expect(input.placeholder).toBe('Compose your reply — send when Maja finishes…');
  });

  it('shows default Croatian placeholder when idle', () => {
    render(<AIConversationChat {...makeProps({ isSpeaking: false, listening: false })} />);
    const input = getInput() as HTMLInputElement;
    expect(input.placeholder).toMatch(/Piši na hrvatskom/);
  });

  it('shows offline placeholder when isOnline=false', () => {
    render(<AIConversationChat {...makeProps({ isOnline: false })} />);
    const input = getInput() as HTMLInputElement;
    expect(input.placeholder).toMatch(/Offline/);
  });

  it('shows listening placeholder when listening=true', () => {
    render(<AIConversationChat {...makeProps({ listening: true, isSpeaking: false })} />);
    const input = getInput() as HTMLInputElement;
    expect(input.placeholder).toMatch(/Listening/i);
  });

  it('shows transcribing placeholder when isVoiceProcessing=true', () => {
    render(<AIConversationChat {...makeProps({ isVoiceProcessing: true })} />);
    const input = getInput() as HTMLInputElement;
    expect(input.placeholder).toMatch(/Transcribing/i);
  });
});

// ── Enter key handling (pacing fix) ──────────────────────────────────────────

describe('AIConversationChat — Enter key pacing fix', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does NOT call onSend on Enter when isSpeaking=true', () => {
    const onSend = vi.fn();
    render(<AIConversationChat {...makeProps({ isSpeaking: true, input: 'Dobar dan', onSend })} />);
    fireEvent.keyDown(getInput(), { key: 'Enter', shiftKey: false });
    expect(onSend).not.toHaveBeenCalled();
  });

  it('calls onSend on Enter when isSpeaking=false', () => {
    const onSend = vi.fn();
    render(
      <AIConversationChat {...makeProps({ isSpeaking: false, input: 'Dobar dan', onSend })} />,
    );
    fireEvent.keyDown(getInput(), { key: 'Enter', shiftKey: false });
    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it('does NOT call onSend on Shift+Enter (new line intent)', () => {
    const onSend = vi.fn();
    render(<AIConversationChat {...makeProps({ isSpeaking: false, input: 'Test', onSend })} />);
    fireEvent.keyDown(getInput(), { key: 'Enter', shiftKey: true });
    expect(onSend).not.toHaveBeenCalled();
  });
});

// ── Mic button disabled state ─────────────────────────────────────────────────

describe('AIConversationChat — mic button state', () => {
  it('mic button disabled when isSpeaking=true', () => {
    render(<AIConversationChat {...makeProps({ isSpeaking: true, hasSpeechAPI: true })} />);
    const mic = getMicButton();
    expect((mic as HTMLButtonElement).disabled).toBe(true);
  });

  it('mic button disabled when isVoiceProcessing=true', () => {
    render(<AIConversationChat {...makeProps({ isVoiceProcessing: true, hasSpeechAPI: true })} />);
    const mic = getMicButton();
    expect((mic as HTMLButtonElement).disabled).toBe(true);
  });

  it('mic button disabled when loading=true', () => {
    render(<AIConversationChat {...makeProps({ loading: true, hasSpeechAPI: true })} />);
    const mic = getMicButton();
    expect((mic as HTMLButtonElement).disabled).toBe(true);
  });

  it('mic button enabled when idle and online', () => {
    render(
      <AIConversationChat
        {...makeProps({
          isSpeaking: false,
          isVoiceProcessing: false,
          loading: false,
          isOnline: true,
          hasSpeechAPI: true,
        })}
      />,
    );
    const mic = getMicButton();
    expect((mic as HTMLButtonElement).disabled).toBe(false);
  });

  it('onToggleVoice called when mic button clicked while enabled', () => {
    const onToggleVoice = vi.fn();
    render(<AIConversationChat {...makeProps({ hasSpeechAPI: true, onToggleVoice })} />);
    fireEvent.click(getMicButton()!);
    expect(onToggleVoice).toHaveBeenCalledTimes(1);
  });
});

// ── Interrupt button in header ────────────────────────────────────────────────

describe('AIConversationChat — interrupt while speaking', () => {
  it('shows interrupt button in header subtitle when isSpeaking=true', () => {
    render(<AIConversationChat {...makeProps({ isSpeaking: true })} />);
    // The subtitle becomes a clickable "tap to interrupt" or inline interrupt element
    const buttons = screen.getAllByRole('button');
    const interruptBtn = buttons.find(
      (b) =>
        b.textContent?.toLowerCase().includes('interrupt') ||
        b.textContent?.toLowerCase().includes('stop') ||
        b.textContent?.toLowerCase().includes('tap to'),
    );
    expect(interruptBtn).toBeTruthy();
  });

  it('calls onInterrupt when interrupt button clicked', () => {
    const onInterrupt = vi.fn();
    render(<AIConversationChat {...makeProps({ isSpeaking: true, onInterrupt })} />);
    const buttons = screen.getAllByRole('button');
    const interruptBtn = buttons.find(
      (b) =>
        b.textContent?.toLowerCase().includes('interrupt') ||
        b.textContent?.toLowerCase().includes('stop') ||
        b.textContent?.toLowerCase().includes('tap to'),
    );
    fireEvent.click(interruptBtn!);
    expect(onInterrupt).toHaveBeenCalledTimes(1);
  });
});

// ── Starters panel ────────────────────────────────────────────────────────────

describe('AIConversationChat — starter phrases', () => {
  it('Phrases button toggles setShowStarters', () => {
    const setShowStarters = vi.fn();
    render(<AIConversationChat {...makeProps({ showStarters: false, setShowStarters })} />);
    const btn = screen.getAllByRole('button').find((b) => b.textContent?.includes('Phrases'));
    fireEvent.click(btn!);
    expect(setShowStarters).toHaveBeenCalled();
  });

  it('starter phrase buttons visible when showStarters=true', () => {
    render(<AIConversationChat {...makeProps({ showStarters: true, level: 'B1' })} />);
    // STARTERS.B1 = ['Možete li mi pomoći?', 'Koliko košta?'] from our mock
    expect(screen.getByText('Možete li mi pomoći?')).toBeTruthy();
    expect(screen.getByText('Koliko košta?')).toBeTruthy();
  });

  it('clicking a starter sets the input', () => {
    const setInput = vi.fn();
    render(<AIConversationChat {...makeProps({ showStarters: true, level: 'B1', setInput })} />);
    fireEvent.click(screen.getByText('Možete li mi pomoći?'));
    expect(setInput).toHaveBeenCalledWith('Možete li mi pomoći?');
  });
});

// ── Hint button ───────────────────────────────────────────────────────────────

describe('AIConversationChat — hint button', () => {
  it('hint button disabled when no messages exist', () => {
    render(<AIConversationChat {...makeProps({ messages: [] })} />);
    const hint = screen.getAllByRole('button').find((b) => b.textContent?.includes('Hint'));
    expect((hint as HTMLButtonElement).disabled).toBe(true);
  });

  it('hint button enabled when messages exist', () => {
    render(
      <AIConversationChat
        {...makeProps({ messages: [{ role: 'assistant', content: 'Dobar dan!' }] })}
      />,
    );
    const hint = screen.getAllByRole('button').find((b) => b.textContent?.includes('Hint'));
    expect((hint as HTMLButtonElement).disabled).toBe(false);
  });
});

// ── Exchange counter ──────────────────────────────────────────────────────────

describe('AIConversationChat — exchange counter', () => {
  it('shows "0 exchanges" when userCount=0', () => {
    render(<AIConversationChat {...makeProps({ userCount: 0 })} />);
    expect(screen.getByText(/0 exchange/)).toBeTruthy();
  });

  it('shows "1 exchange" (singular) when userCount=1', () => {
    render(<AIConversationChat {...makeProps({ userCount: 1 })} />);
    expect(screen.getByText(/1 exchange/)).toBeTruthy();
  });

  it('shows "3 exchanges" (plural) when userCount=3', () => {
    render(<AIConversationChat {...makeProps({ userCount: 3 })} />);
    expect(screen.getByText(/3 exchanges/)).toBeTruthy();
  });

  it('shows "needs 2 to evaluate" hint when userCount < 2', () => {
    render(<AIConversationChat {...makeProps({ userCount: 1 })} />);
    expect(screen.getByText(/needs 2 to evaluate/)).toBeTruthy();
  });
});
