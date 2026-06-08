/**
 * pronunciationScorer.honesty.test.tsx
 *
 * Guards the fix for the fabricated-82 bug:
 *   When the Web Speech API only matches the English TRANSLATION of a Croatian
 *   word (e.g. user says "četiri" → browser returns "four"), the scorer MUST NOT
 *   emit a fabricated numeric score (was: score: 82).  It must emit:
 *     { score: null, recognizedViaTranslation: true }
 *
 * Also verifies that a real text-similarity result still yields a numeric score.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import PronunciationScorer from '../components/shared/PronunciationScorer';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** A controllable SpeechRecognition stub.
 *  After calling .start(), call triggerResult(transcripts) to fire onresult. */
function makeSpeechRecognitionStub() {
  let instance: {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    onresult: ((e: unknown) => void) | null;
    onerror: ((e: unknown) => void) | null;
    onend: (() => void) | null;
    start: ReturnType<typeof vi.fn>;
    abort: ReturnType<typeof vi.fn>;
    triggerResult: (transcripts: string[]) => void;
    triggerEnd: () => void;
  } | null = null;

  const SR = vi.fn(function SpeechRecognition(this: typeof instance) {
    instance = {
      lang: '',
      continuous: false,
      interimResults: false,
      maxAlternatives: 3,
      onresult: null,
      onerror: null,
      onend: null,
      start: vi.fn(),
      abort: vi.fn(),
      triggerResult(transcripts: string[]) {
        if (this.onresult) {
          const results = [transcripts.map((t) => ({ transcript: t }))];
          (results[0] as { [Symbol.iterator]: () => Iterator<unknown> })[Symbol.iterator] =
            function* () {
              yield* transcripts.map((t) => ({ transcript: t }));
            };
          this.onresult({ results });
        }
      },
      triggerEnd() {
        if (this.onend) this.onend();
      },
    };
    return instance;
  });

  return { SR, getInstance: () => instance };
}

// ── Module-level mocks ────────────────────────────────────────────────────────

// apiFetch: mock so Azure path returns !ok (→ fallback to Web Speech)
vi.mock('../lib/apiFetch.js', () => ({
  apiFetch: vi.fn(async () => ({ ok: false, json: async () => ({ ok: false }) })),
}));

// platform: isNative() → false
vi.mock('../lib/platform.js', () => ({
  isNative: () => false,
}));
vi.mock('../lib/platform', () => ({
  isNative: () => false,
}));

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PronunciationScorer — translation-only path emits no fabricated score', () => {
  let stub: ReturnType<typeof makeSpeechRecognitionStub>;

  beforeEach(() => {
    stub = makeSpeechRecognitionStub();
    // Disable MediaRecorder so the component goes straight to Web Speech
    Object.defineProperty(global, 'MediaRecorder', { value: undefined, configurable: true });
    Object.defineProperty(navigator, 'mediaDevices', { value: undefined, configurable: true });
    // Install mock SpeechRecognition
    Object.defineProperty(window, 'SpeechRecognition', {
      value: stub.SR,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(window, 'webkitSpeechRecognition', {
      value: stub.SR,
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    // Clean up SpeechRecognition
    Object.defineProperty(window, 'SpeechRecognition', {
      value: undefined,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(window, 'webkitSpeechRecognition', {
      value: undefined,
      configurable: true,
      writable: true,
    });
  });

  it('emits score: null and recognizedViaTranslation: true when recognition returns the English translation', async () => {
    const onScore = vi.fn();

    render(
      <PronunciationScorer targetText="četiri" targetEnglish="four" level="A1" onScore={onScore} />,
    );

    // Click the "Test My Pronunciation" button to trigger Web Speech mode
    await act(async () => {
      (await screen.findByText(/Test My Pronunciation/i)).click();
    });

    // Confirm SpeechRecognition.start() was called
    const srInstance = stub.getInstance();
    expect(srInstance).not.toBeNull();
    expect(srInstance!.start).toHaveBeenCalledTimes(1);

    // Fire a recognition result returning the English word "four" (the translation of "četiri")
    await act(async () => {
      srInstance!.triggerResult(['four']);
    });

    // The key assertion: onScore must have been called with score: null
    expect(onScore).toHaveBeenCalledTimes(1);
    const emitted = onScore.mock.calls[0]![0];
    expect(emitted.score).toBeNull();
    expect(emitted.recognizedViaTranslation).toBe(true);
    // Must NOT be 82 (the old fabricated value)
    expect(emitted.score).not.toBe(82);
  });

  it('does NOT show a numeric score in the UI when recognized via translation', async () => {
    render(
      <PronunciationScorer targetText="četiri" targetEnglish="four" level="A1" onScore={vi.fn()} />,
    );

    await act(async () => {
      (await screen.findByText(/Test My Pronunciation/i)).click();
    });

    const srInstance = stub.getInstance()!;

    await act(async () => {
      srInstance.triggerResult(['four']);
    });

    // Must show qualitative message, no number
    expect(screen.getByText(/Recognized.*accent not scored/i)).toBeInTheDocument();

    // Must NOT show "82" or "82%" anywhere
    expect(screen.queryByText(/\b82\b/)).toBeNull();
    expect(screen.queryByText(/82%/)).toBeNull();
  });

  it('emits a numeric score when recognition returns the Croatian text (normal path)', async () => {
    const onScore = vi.fn();

    render(
      <PronunciationScorer targetText="četiri" targetEnglish="four" level="A1" onScore={onScore} />,
    );

    await act(async () => {
      (await screen.findByText(/Test My Pronunciation/i)).click();
    });

    const srInstance = stub.getInstance()!;

    // Return the Croatian word itself (high-similarity text match)
    await act(async () => {
      srInstance.triggerResult(['četiri']);
    });

    expect(onScore).toHaveBeenCalledTimes(1);
    const emitted = onScore.mock.calls[0]![0];
    // Score must be a real number (similarity-based), not null
    expect(typeof emitted.score).toBe('number');
    expect(emitted.score).not.toBeNull();
    expect(emitted.recognizedViaTranslation).toBeFalsy();
  });

  it('partial translation match also yields null score (targetEnglish is substring of transcript)', async () => {
    const onScore = vi.fn();

    render(
      <PronunciationScorer
        targetText="dobar dan"
        targetEnglish="good day"
        level="A1"
        onScore={onScore}
      />,
    );

    await act(async () => {
      (await screen.findByText(/Test My Pronunciation/i)).click();
    });

    const srInstance = stub.getInstance()!;

    // "good day morning" contains "good day" — translation match
    await act(async () => {
      srInstance.triggerResult(['good day morning']);
    });

    const emitted = onScore.mock.calls[0]![0];
    expect(emitted.score).toBeNull();
    expect(emitted.recognizedViaTranslation).toBe(true);
  });
});
