/**
 * useWhisperSTT.test.ts — verifies the permissionDenied exposure that
 * SP4a adds. The full VAD behavior is out of scope (sibling hook to
 * useRecorder, not layered on top) per Option A scope decision.
 *
 * SUPPORTS_VAD in useWhisperSTT is evaluated at module load — we must set
 * up globalThis.MediaRecorder + globalThis.AudioContext BEFORE the dynamic
 * import to land on the Whisper+VAD code path during toggle().
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('../lib/audio.ts', () => ({
  stopAudio: vi.fn(),
  getAudioContext: () => null,
  unlockAudio: vi.fn(),
}));
vi.mock('../lib/apiFetch.js', () => ({ apiFetch: vi.fn() }));
vi.mock('../lib/platform.js', () => ({ isNative: () => false }));

class MockMediaRecorder {
  state = 'inactive';
  static isTypeSupported(_: string) {
    return true;
  }
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  start() {}
  stop() {}
}

class MockAudioContext {
  state = 'running';
  resume() {
    return Promise.resolve();
  }
  createMediaStreamSource() {
    return { connect: vi.fn(), disconnect: vi.fn() };
  }
  createAnalyser() {
    return { fftSize: 0, smoothingTimeConstant: 0, frequencyBinCount: 0 };
  }
  close() {
    return Promise.resolve();
  }
}

describe('useWhisperSTT permissionDenied state', () => {
  beforeEach(() => {
    (globalThis as unknown as { MediaRecorder: unknown }).MediaRecorder = MockMediaRecorder;
    (globalThis as unknown as { AudioContext: unknown }).AudioContext = MockAudioContext;
    // Ensure mediaDevices.getUserMedia exists so SUPPORTS_VAD === true at module load
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: () => Promise.resolve({} as MediaStream) },
    });
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initial state has permissionDenied=false', async () => {
    const useWhisperSTT = (await import('../hooks/useWhisperSTT')).default;
    const { result } = renderHook(() =>
      useWhisperSTT({
        onResult: vi.fn(),
        onInterrupt: vi.fn(),
        onError: vi.fn(),
        isSpeaking: false,
      }),
    );
    expect(result.current.permissionDenied).toBe(false);
  });

  it('toggle() flips permissionDenied=true when getUserMedia rejects with NotAllowedError', async () => {
    // Override mediaDevices to reject with NotAllowedError
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: () =>
          Promise.reject(Object.assign(new Error('denied'), { name: 'NotAllowedError' })),
      },
    });

    const useWhisperSTT = (await import('../hooks/useWhisperSTT')).default;
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useWhisperSTT({
        onResult: vi.fn(),
        onInterrupt: vi.fn(),
        onError,
        isSpeaking: false,
      }),
    );

    await act(async () => {
      await result.current.toggle();
    });

    expect(result.current.permissionDenied).toBe(true);
    expect(onError).toHaveBeenCalledWith(expect.stringMatching(/[Mm]icrophone/));
  });

  it('clearPermissionDenied resets the flag back to false', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: () =>
          Promise.reject(Object.assign(new Error('denied'), { name: 'NotAllowedError' })),
      },
    });
    const useWhisperSTT = (await import('../hooks/useWhisperSTT')).default;
    const { result } = renderHook(() =>
      useWhisperSTT({
        onResult: vi.fn(),
        onInterrupt: vi.fn(),
        onError: vi.fn(),
        isSpeaking: false,
      }),
    );
    await act(async () => {
      await result.current.toggle();
    });
    expect(result.current.permissionDenied).toBe(true);

    act(() => {
      result.current.clearPermissionDenied();
    });
    expect(result.current.permissionDenied).toBe(false);
  });
});
