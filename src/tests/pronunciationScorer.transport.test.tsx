/**
 * pronunciationScorer.transport.test.tsx
 *
 * R4 Phase 2A — Task 3 (updated for R4 Phase 2B Task 7):
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
 *
 * NOTE: After Task 7, PronunciationScorer uses useRecorder internally.
 * Tests drive recording completion by simulating useRecorder state transitions.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
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
vi.mock('../lib/platform.js', () => ({
  isNative: () => false,
  getMicPermissionPlatform: () => 'desktop',
}));
vi.mock('../lib/platform', () => ({
  isNative: () => false,
  getMicPermissionPlatform: () => 'desktop',
}));

// ── useRecorder mock — drives recording completion per-test ──────────────────
const recorderMock = vi.fn();
vi.mock('../hooks/useRecorder', () => ({
  useRecorder: () => recorderMock(),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function recorderState(overrides: Record<string, unknown> = {}) {
  return {
    state: 'idle' as const,
    micAvailable: null as boolean | null,
    audioBlob: null as Blob | null,
    audioUrl: null as string | null,
    mimeType: null as string | null,
    countdown: 0,
    error: null,
    startRecording: vi.fn(),
    stopRecording: vi.fn(),
    playback: vi.fn(),
    reset: vi.fn(),
    ...overrides,
  };
}

describe('PronunciationScorer — _nativePost transport (Task 3)', () => {
  beforeEach(() => {
    recorderMock.mockReset();
    mockNativePost.mockReset();
    // Disable MediaRecorder and mediaDevices — not used directly after Task 7 migration
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

  afterEach(() => {
    vi.clearAllMocks();
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

    const fakeBlob = new Blob([new Uint8Array([1, 2, 3])], { type: 'audio/ogg;codecs=opus' });
    const fakeMimeType = 'audio/ogg;codecs=opus';

    let step = 0;
    recorderMock.mockImplementation(() => {
      step += 1;
      if (step <= 1) return recorderState({ state: 'idle' });
      return recorderState({ state: 'done', audioBlob: fakeBlob, mimeType: fakeMimeType });
    });

    const { rerender } = render(
      <PronunciationScorer
        targetText="dobar dan"
        targetEnglish="good day"
        level="A1"
        onScore={vi.fn()}
      />,
    );

    // Transition recorder to 'done' state (simulates recording completion)
    await act(async () => {
      rerender(
        <PronunciationScorer
          targetText="dobar dan"
          targetEnglish="good day"
          level="A1"
          onScore={vi.fn()}
        />,
      );
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

    const fakeBlob = new Blob([new Uint8Array([4, 5, 6])], { type: 'audio/webm' });

    let step = 0;
    recorderMock.mockImplementation(() => {
      step += 1;
      if (step <= 1) return recorderState({ state: 'idle' });
      return recorderState({ state: 'done', audioBlob: fakeBlob, mimeType: 'audio/webm' });
    });

    const onScore = vi.fn();
    const { rerender } = render(
      <PronunciationScorer targetText="hvala" level="A1" onScore={onScore} />,
    );

    await act(async () => {
      rerender(<PronunciationScorer targetText="hvala" level="A1" onScore={onScore} />);
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

    const fakeBlob = new Blob([new Uint8Array([7, 8, 9])], { type: 'audio/webm' });

    let step = 0;
    recorderMock.mockImplementation(() => {
      step += 1;
      if (step <= 1) return recorderState({ state: 'idle' });
      return recorderState({ state: 'done', audioBlob: fakeBlob, mimeType: 'audio/webm' });
    });

    const { rerender } = render(
      <PronunciationScorer targetText="hvala" level="A1" onScore={vi.fn()} />,
    );

    await act(async () => {
      rerender(<PronunciationScorer targetText="hvala" level="A1" onScore={vi.fn()} />);
    });

    // Flush any remaining async work
    await act(async () => {});
    await act(async () => {});

    // Core assertions:
    // 1. _nativePost WAS called (submitToAzure ran and completed)
    expect(mockNativePost).toHaveBeenCalledTimes(1);
    // 2. The component rendered without crashing — some content is in the DOM
    expect(document.body.textContent).not.toBe('');
  });
});
