/**
 * pronunciationScorer.transport.test.tsx
 *
 * R4 Phase 2A — Task 3:
 * Verifies that PronunciationScorer.submitToAzure routes /api/pronunciation-assess
 * through _nativePost (native-safe transport) rather than apiFetch.
 *
 * Coverage:
 *   1. Successful Azure path: _nativePost returns ok=true response →
 *      azureResult rendered, onScore called with numeric overall score.
 *   2. null transport: _nativePost returns null → error thrown →
 *      component falls back to Web Speech (or shows error if Web Speech unsupported).
 *   3. Payload unchanged: _nativePost is called with the correct keys
 *      { audioBase64, referenceText, locale, audioMimeType }.
 */
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import PronunciationScorer from '../components/shared/PronunciationScorer';

// ── _nativePost mock — controllable per-test ─────────────────────────────────
const mockNativePost = vi.fn();
vi.mock('../lib/nativePost.js', () => ({
  _nativePost: (...args: unknown[]) => mockNativePost(...args),
}));

// ── apiFetch mock — coaching call should still use apiFetch ──────────────────
vi.mock('../lib/apiFetch.js', () => ({
  apiFetch: vi.fn(async () => ({ ok: false, json: async () => ({}) })),
}));

// ── platform: not native, so MediaRecorder path is taken ─────────────────────
vi.mock('../lib/platform.js', () => ({ isNative: () => false }));
vi.mock('../lib/platform', () => ({ isNative: () => false }));

// ── Minimal MediaRecorder stub ────────────────────────────────────────────────
// Returns an object exposing `triggerStop()`. After the component calls
// startAzureRecording() and the recording state is 'recording', call
// triggerStop() to simulate the browser firing the 'stop' event on the recorder,
// which kicks off submitToAzure().
function installMediaRecorderStub() {
  // Shared mutable bag — the component writes onstop/ondataavailable to the
  // instance it constructs; we read them back through this shared reference.
  const shared: {
    onstop: (() => void) | null;
    onerror: (() => void) | null;
    ondataavailable: ((e: { data: Blob }) => void) | null;
    mimeType: string;
    state: string;
    startCalled: boolean;
    stopCalled: boolean;
  } = {
    onstop: null,
    onerror: null,
    ondataavailable: null,
    mimeType: 'audio/webm',
    state: 'inactive',
    startCalled: false,
    stopCalled: false,
  };

  // Use a real ES6 class so `new MediaRecorder(...)` works correctly.
  class FakeMediaRecorder {
    mimeType = 'audio/webm';
    state = 'inactive';
    get onstop() {
      return shared.onstop;
    }
    set onstop(v: (() => void) | null) {
      shared.onstop = v;
    }
    get onerror() {
      return shared.onerror;
    }
    set onerror(v: (() => void) | null) {
      shared.onerror = v;
    }
    get ondataavailable() {
      return shared.ondataavailable;
    }
    set ondataavailable(v: ((e: { data: Blob }) => void) | null) {
      shared.ondataavailable = v;
    }
    start() {
      shared.state = 'recording';
      this.state = 'recording';
      shared.startCalled = true;
      // Fire ondataavailable with a fake audio chunk
      if (shared.ondataavailable) {
        const blob = new Blob([new Uint8Array([1, 2, 3])], { type: 'audio/webm' });
        shared.ondataavailable({ data: blob });
      }
    }
    stop() {
      shared.state = 'inactive';
      this.state = 'inactive';
      shared.stopCalled = true;
      // Do NOT auto-call onstop — test controls when to fire it via triggerStop()
    }
    static isTypeSupported(_t: string) {
      return false;
    }
  }

  Object.defineProperty(global, 'MediaRecorder', {
    value: FakeMediaRecorder,
    configurable: true,
  });
  Object.defineProperty(navigator, 'mediaDevices', {
    value: {
      getUserMedia: vi.fn(async () => ({
        getTracks: () => [{ stop: vi.fn() }],
      })),
    },
    configurable: true,
  });

  return {
    shared,
    /** Call after the component transitions to 'recording' state to fire onstop. */
    triggerStop() {
      if (shared.onstop) shared.onstop();
    },
  };
}

describe('PronunciationScorer — _nativePost transport (Task 3)', () => {
  afterEach(() => {
    vi.clearAllMocks();
    // Clean up MediaRecorder and mediaDevices
    Object.defineProperty(global, 'MediaRecorder', { value: undefined, configurable: true });
    Object.defineProperty(navigator, 'mediaDevices', { value: undefined, configurable: true });
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

  it('calls _nativePost with correct keys { audioBase64, referenceText, locale, audioMimeType }', async () => {
    mockNativePost.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        overall: 80,
        accuracy: 80,
        fluency: 80,
        completeness: 80,
        word_scores: [],
      }),
    });

    const recorder = installMediaRecorderStub();

    render(
      <PronunciationScorer
        targetText="dobar dan"
        targetEnglish="good day"
        level="A1"
        onScore={vi.fn()}
      />,
    );

    // Click to start recording (Azure mode) — triggers getUserMedia + MediaRecorder.start()
    await act(async () => {
      (await screen.findByText(/Test My Pronunciation/i)).click();
    });

    // Now fire onstop directly (component is in 'recording' state; onstop is set)
    await act(async () => {
      recorder.triggerStop();
    });

    // Flush async (submitToAzure awaits nativePost)
    await act(async () => {});

    expect(mockNativePost).toHaveBeenCalledTimes(1);
    const [path, body] = mockNativePost.mock.calls[0] as [string, Record<string, unknown>, unknown];
    expect(path).toBe('/api/pronunciation-assess');
    // Correct keys
    expect(typeof body.audioBase64).toBe('string');
    expect(body.referenceText).toBe('dobar dan');
    expect(body.locale).toBe('hr-HR');
    expect(typeof body.audioMimeType).toBe('string');
    // Must NOT have the old wrong keys
    expect(body.audio).toBeUndefined();
    expect(body.text).toBeUndefined();
  });

  it('sets azure result state when _nativePost returns ok:true response', async () => {
    const mockScores = {
      ok: true,
      overall: 85,
      accuracy: 82,
      fluency: 88,
      completeness: 90,
      word_scores: [],
    };
    mockNativePost.mockResolvedValueOnce({
      ok: true,
      json: async () => mockScores,
    });

    const recorder = installMediaRecorderStub();

    const onScore = vi.fn();
    render(<PronunciationScorer targetText="hvala" level="A1" onScore={onScore} />);

    await act(async () => {
      (await screen.findByText(/Test My Pronunciation/i)).click();
    });

    await act(async () => {
      recorder.triggerStop();
    });

    await act(async () => {});

    // onScore should have been called with the overall score
    expect(onScore).toHaveBeenCalledWith(expect.objectContaining({ score: 85 }));
  });

  it('falls back gracefully when _nativePost returns null (transport failure)', async () => {
    // null → throws 'assess_transport_failed' → caught → fallback attempted
    mockNativePost.mockResolvedValueOnce(null);

    // No SpeechRecognition installed → component should show error or reset to idle
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

    const recorder = installMediaRecorderStub();

    render(<PronunciationScorer targetText="hvala" level="A1" onScore={vi.fn()} />);

    await act(async () => {
      (await screen.findByText(/Test My Pronunciation/i)).click();
    });

    await act(async () => {
      recorder.triggerStop();
    });

    await act(async () => {});

    // Component should have handled the error (not crashed) — button reappears or error msg shown
    // The exact text depends on fallback: either the start button is back or an error message is shown
    const btn = screen.queryByText(/Test My Pronunciation/i);
    const errMsg = screen.queryByText(/unavailable/i);
    // At least one of these must be present — component must not be stuck in "processing" forever
    expect(btn !== null || errMsg !== null).toBe(true);
  });
});
