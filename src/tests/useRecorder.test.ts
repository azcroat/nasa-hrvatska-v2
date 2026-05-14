import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRecorder, negotiateMimeType } from '../hooks/useRecorder';

vi.mock('../lib/audio.js', () => ({ unlockAudio: vi.fn() }));

describe('negotiateMimeType', () => {
  it('returns audio/webm;codecs=opus when supported', () => {
    const isTypeSupported = (m: string) => m === 'audio/webm;codecs=opus';
    expect(negotiateMimeType(isTypeSupported)).toBe('audio/webm;codecs=opus');
  });

  it('falls back to audio/webm', () => {
    const isTypeSupported = (m: string) => m === 'audio/webm';
    expect(negotiateMimeType(isTypeSupported)).toBe('audio/webm');
  });

  it('falls back to audio/mp4 on Safari', () => {
    const isTypeSupported = (m: string) => m === 'audio/mp4';
    expect(negotiateMimeType(isTypeSupported)).toBe('audio/mp4');
  });

  it('returns null when nothing is supported', () => {
    expect(negotiateMimeType(() => false)).toBeNull();
  });
});

class MockFileReader {
  result: string | null = null;
  onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null = null;
  onerror: (() => void) | null = null;
  readAsDataURL(_blob: Blob) {
    this.result = 'data:audio/webm;base64,ZmFrZQ==';
    queueMicrotask(() =>
      this.onload?.call(this as unknown as FileReader, {} as ProgressEvent<FileReader>),
    );
  }
}

class MockMediaRecorder {
  state = 'inactive';
  mimeType: string;
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: ((e: unknown) => void) | null = null;
  constructor(_stream: MediaStream, opts?: { mimeType?: string }) {
    this.mimeType = opts?.mimeType ?? '';
  }
  start() {
    this.state = 'recording';
  }
  stop() {
    this.state = 'inactive';
    this.ondataavailable?.({ data: new Blob(['fake'], { type: this.mimeType || 'audio/webm' }) });
    this.onstop?.();
  }
}
(MockMediaRecorder as unknown as { isTypeSupported: (m: string) => boolean }).isTypeSupported = (
  m: string,
) => m.startsWith('audio/webm');

describe('useRecorder', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    (globalThis as unknown as { MediaRecorder: unknown }).MediaRecorder = MockMediaRecorder;
    (globalThis as unknown as { FileReader: unknown }).FileReader = MockFileReader;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('returns idle state on mount', () => {
    const { result } = renderHook(() => useRecorder());
    expect(result.current.state).toBe('idle');
    expect(result.current.audioBlob).toBeNull();
    expect(result.current.audioUrl).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.micAvailable).toBeNull();
    expect(typeof result.current.startRecording).toBe('function');
    expect(typeof result.current.stopRecording).toBe('function');
    expect(typeof result.current.playback).toBe('function');
    expect(typeof result.current.reset).toBe('function');
  });

  it('transitions idle → requesting → countdown on startRecording', async () => {
    let resolveGUM: (s: MediaStream) => void = () => {};
    const fakeStream = { getTracks: () => [{ stop: vi.fn() }] } as unknown as MediaStream;
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: () =>
          new Promise<MediaStream>((resolve) => {
            resolveGUM = resolve;
          }),
      },
    });

    const { result } = renderHook(() => useRecorder());
    act(() => {
      result.current.startRecording();
    });
    expect(result.current.state).toBe('requesting');

    await act(async () => {
      resolveGUM(fakeStream);
    });
    expect(result.current.state).toBe('countdown');
    expect(result.current.countdown).toBe(3);
  });

  it('transitions countdown → recording after 3 seconds', async () => {
    const fakeStream = { getTracks: () => [{ stop: vi.fn() }] } as unknown as MediaStream;
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: () => Promise.resolve(fakeStream) },
    });

    const { result } = renderHook(() => useRecorder());
    await act(async () => {
      result.current.startRecording();
    });
    expect(result.current.state).toBe('countdown');

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.state).toBe('recording');
  });

  it('stopRecording moves recording → done with audioUrl set', async () => {
    const fakeStream = { getTracks: () => [{ stop: vi.fn() }] } as unknown as MediaStream;
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: () => Promise.resolve(fakeStream) },
    });

    const { result } = renderHook(() => useRecorder());
    await act(async () => {
      result.current.startRecording();
    });
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.state).toBe('recording');

    await act(async () => {
      result.current.stopRecording();
      // flush queued microtask from MockFileReader.onload
      await vi.runAllTimersAsync();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(result.current.state).toBe('done');
    expect(result.current.audioUrl).toMatch(/^data:audio\//);
    expect(result.current.audioBlob).toBeInstanceOf(Blob);
  });

  it('sets state=denied when getUserMedia rejects with NotAllowedError', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: () =>
          Promise.reject(Object.assign(new Error('denied'), { name: 'NotAllowedError' })),
      },
    });
    const { result } = renderHook(() => useRecorder());
    await act(async () => {
      result.current.startRecording();
      await Promise.resolve();
    });
    expect(result.current.state).toBe('denied');
    expect(result.current.micAvailable).toBe(false);
    expect(result.current.error?.code).toBe('NotAllowedError');
  });

  it('sets state=unsupported when no mediaDevices on navigator', () => {
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: undefined });
    const { result } = renderHook(() => useRecorder());
    act(() => {
      result.current.startRecording();
    });
    expect(result.current.state).toBe('unsupported');
    expect(result.current.micAvailable).toBe(false);
  });

  it('sets state=unsupported on NotFoundError', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: () =>
          Promise.reject(Object.assign(new Error('no mic'), { name: 'NotFoundError' })),
      },
    });
    const { result } = renderHook(() => useRecorder());
    await act(async () => {
      result.current.startRecording();
      await Promise.resolve();
    });
    expect(result.current.state).toBe('unsupported');
  });

  it('sets state=unsupported when negotiateMimeType returns null', async () => {
    (MockMediaRecorder as unknown as { isTypeSupported: (m: string) => boolean }).isTypeSupported =
      () => false;
    const fakeStream = { getTracks: () => [{ stop: vi.fn() }] } as unknown as MediaStream;
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: () => Promise.resolve(fakeStream) },
    });
    const { result } = renderHook(() => useRecorder());
    await act(async () => {
      result.current.startRecording();
    });
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.state).toBe('unsupported');
    // restore for following tests
    (MockMediaRecorder as unknown as { isTypeSupported: (m: string) => boolean }).isTypeSupported =
      (m: string) => m.startsWith('audio/webm');
  });

  it('sets state=error on generic DOMException', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: () =>
          Promise.reject(Object.assign(new Error('huh'), { name: 'NotReadableError' })),
      },
    });
    const { result } = renderHook(() => useRecorder());
    await act(async () => {
      result.current.startRecording();
      await Promise.resolve();
    });
    expect(result.current.state).toBe('error');
    expect(result.current.error?.code).toBe('NotReadableError');
    expect(result.current.error?.message).toBe('huh');
  });

  it('reset() returns hook to idle and stops in-flight resources', async () => {
    const trackStop = vi.fn();
    const fakeStream = { getTracks: () => [{ stop: trackStop }] } as unknown as MediaStream;
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: () => Promise.resolve(fakeStream) },
    });
    const { result } = renderHook(() => useRecorder());
    await act(async () => {
      result.current.startRecording();
    });
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.state).toBe('recording');

    act(() => {
      result.current.reset();
    });
    expect(result.current.state).toBe('idle');
    expect(result.current.audioBlob).toBeNull();
    expect(result.current.audioUrl).toBeNull();
    expect(result.current.error).toBeNull();
    expect(trackStop).toHaveBeenCalled();
  });

  it('playback() constructs Audio with audioUrl and calls play()', async () => {
    const fakeStream = { getTracks: () => [{ stop: vi.fn() }] } as unknown as MediaStream;
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: () => Promise.resolve(fakeStream) },
    });

    const playSpy = vi.fn(() => Promise.resolve());
    function FakeAudio(this: { volume: number; play: () => Promise<void> }, _url: string) {
      this.volume = 0;
      this.play = playSpy;
    }
    (globalThis as unknown as { Audio: unknown }).Audio = FakeAudio;

    const { result } = renderHook(() => useRecorder());
    await act(async () => {
      result.current.startRecording();
    });
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    await act(async () => {
      result.current.stopRecording();
      await vi.runAllTimersAsync();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(result.current.state).toBe('done');

    await act(async () => {
      await result.current.playback();
    });
    expect(playSpy).toHaveBeenCalled();
  });

  it('does not setState after unmount during async getUserMedia resolve', async () => {
    let resolveGUM: (s: MediaStream) => void = () => {};
    const fakeStream = { getTracks: () => [{ stop: vi.fn() }] } as unknown as MediaStream;
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: () =>
          new Promise<MediaStream>((r) => {
            resolveGUM = r;
          }),
      },
    });

    const { result, unmount } = renderHook(() => useRecorder());
    act(() => {
      result.current.startRecording();
    });
    expect(result.current.state).toBe('requesting');

    unmount();
    // Resolving after unmount should not throw, should not warn.
    await act(async () => {
      resolveGUM(fakeStream);
      await Promise.resolve();
    });
    // No assertion needed — test passes if no React unmount warning fires.
  });

  it('cleanup on unmount stops stream tracks', async () => {
    const trackStop = vi.fn();
    const fakeStream = { getTracks: () => [{ stop: trackStop }] } as unknown as MediaStream;
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: () => Promise.resolve(fakeStream) },
    });
    const { result, unmount } = renderHook(() => useRecorder());
    await act(async () => {
      result.current.startRecording();
    });
    unmount();
    expect(trackStop).toHaveBeenCalled();
  });

  it('double-tap startRecording is a no-op for the second call', async () => {
    let calls = 0;
    const fakeStream = { getTracks: () => [{ stop: vi.fn() }] } as unknown as MediaStream;
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: () => {
          calls += 1;
          return Promise.resolve(fakeStream);
        },
      },
    });

    const { result } = renderHook(() => useRecorder());
    await act(async () => {
      result.current.startRecording();
      result.current.startRecording();
    });
    expect(calls).toBe(1);
  });

  it('unmount cleanup revokes blob: audioUrl', async () => {
    class BlobFileReader2 {
      result: string | null = null;
      onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null = null;
      onerror: (() => void) | null = null;
      readAsDataURL(_blob: Blob) {
        this.result = 'blob:http://localhost/another-fake-blob';
        queueMicrotask(() =>
          this.onload?.call(this as unknown as FileReader, {} as ProgressEvent<FileReader>),
        );
      }
    }
    (globalThis as unknown as { FileReader: unknown }).FileReader = BlobFileReader2;

    const revokeSpy = vi.fn();
    (globalThis as unknown as { URL: { revokeObjectURL: typeof URL.revokeObjectURL } }).URL = {
      revokeObjectURL: revokeSpy,
    } as unknown as typeof URL;

    const fakeStream = { getTracks: () => [{ stop: vi.fn() }] } as unknown as MediaStream;
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: () => Promise.resolve(fakeStream) },
    });

    const { result, unmount } = renderHook(() => useRecorder());
    await act(async () => {
      result.current.startRecording();
    });
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    await act(async () => {
      result.current.stopRecording();
      await vi.runAllTimersAsync();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(result.current.audioUrl).toMatch(/^blob:/);

    unmount();
    expect(revokeSpy).toHaveBeenCalledWith(expect.stringMatching(/^blob:/));

    (globalThis as unknown as { FileReader: unknown }).FileReader = MockFileReader;
  });

  it('unmount during getUserMedia rejection clears busy flag without setState', async () => {
    let rejectGUM: (err: Error) => void = () => {};
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: () =>
          new Promise<MediaStream>((_, reject) => {
            rejectGUM = reject;
          }),
      },
    });

    const { result, unmount } = renderHook(() => useRecorder());
    act(() => {
      result.current.startRecording();
    });
    expect(result.current.state).toBe('requesting');

    unmount();
    // Now reject — should hit the !mountedRef branch in .catch
    await act(async () => {
      rejectGUM(Object.assign(new Error('post-unmount'), { name: 'NotAllowedError' }));
      await Promise.resolve();
    });
    // No assertion needed — passes if no React unmount warning fires.
  });

  it('reset() during countdown clears timer + stops stream', async () => {
    const trackStop = vi.fn();
    const fakeStream = { getTracks: () => [{ stop: trackStop }] } as unknown as MediaStream;
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: () => Promise.resolve(fakeStream) },
    });

    const { result } = renderHook(() => useRecorder());
    await act(async () => {
      result.current.startRecording();
    });
    // Advance only 1 second — still in countdown, timer + stream are live
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.state).toBe('countdown');

    act(() => {
      result.current.reset();
    });
    expect(result.current.state).toBe('idle');
    expect(trackStop).toHaveBeenCalled();
    // After reset, advancing time should not produce a state change (timer cleared)
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.state).toBe('idle');
  });

  it('sets state=error when FileReader fails to encode blob', async () => {
    class BrokenFileReader {
      result: string | null = null;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      readAsDataURL() {
        queueMicrotask(() => this.onerror?.());
      }
    }
    (globalThis as unknown as { FileReader: unknown }).FileReader = BrokenFileReader;

    const fakeStream = { getTracks: () => [{ stop: vi.fn() }] } as unknown as MediaStream;
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: () => Promise.resolve(fakeStream) },
    });

    const { result } = renderHook(() => useRecorder());
    await act(async () => {
      result.current.startRecording();
    });
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    await act(async () => {
      result.current.stopRecording();
      await vi.runAllTimersAsync();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(result.current.state).toBe('error');
    expect(result.current.error?.code).toBe('FileReaderError');

    // restore MockFileReader for following tests
    (globalThis as unknown as { FileReader: unknown }).FileReader = MockFileReader;
  });

  it('stopRecording is a no-op when no recorder is active', () => {
    const { result } = renderHook(() => useRecorder());
    // Should not throw, even with nothing to stop
    expect(() => result.current.stopRecording()).not.toThrow();
    expect(result.current.state).toBe('idle');
  });

  it('playback() is a no-op when audioUrl is null', async () => {
    const playSpy = vi.fn(() => Promise.resolve());
    function FakeAudio(this: { volume: number; play: () => Promise<void> }, _url: string) {
      this.volume = 0;
      this.play = playSpy;
    }
    (globalThis as unknown as { Audio: unknown }).Audio = FakeAudio;

    const { result } = renderHook(() => useRecorder());
    await act(async () => {
      await result.current.playback();
    });
    expect(playSpy).not.toHaveBeenCalled();
  });

  it('rejected getUserMedia with undefined name falls back to UnknownError', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      // Reject with an Error that has no .name property
      value: { getUserMedia: () => Promise.reject({ message: 'mysterious' }) },
    });
    const { result } = renderHook(() => useRecorder());
    await act(async () => {
      result.current.startRecording();
      await Promise.resolve();
    });
    expect(result.current.state).toBe('error');
    expect(result.current.error?.code).toBe('UnknownError');
  });

  it('reset() revokes blob: audioUrl via URL.revokeObjectURL', async () => {
    class BlobFileReader {
      result: string | null = null;
      onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null = null;
      onerror: (() => void) | null = null;
      readAsDataURL(_blob: Blob) {
        this.result = 'blob:http://localhost/fake-blob-id';
        queueMicrotask(() =>
          this.onload?.call(this as unknown as FileReader, {} as ProgressEvent<FileReader>),
        );
      }
    }
    (globalThis as unknown as { FileReader: unknown }).FileReader = BlobFileReader;

    const revokeSpy = vi.fn();
    (globalThis as unknown as { URL: { revokeObjectURL: typeof URL.revokeObjectURL } }).URL = {
      revokeObjectURL: revokeSpy,
    } as unknown as typeof URL;

    const fakeStream = { getTracks: () => [{ stop: vi.fn() }] } as unknown as MediaStream;
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: () => Promise.resolve(fakeStream) },
    });

    const { result } = renderHook(() => useRecorder());
    await act(async () => {
      result.current.startRecording();
    });
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    await act(async () => {
      result.current.stopRecording();
      await vi.runAllTimersAsync();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(result.current.audioUrl).toMatch(/^blob:/);

    act(() => {
      result.current.reset();
    });
    expect(revokeSpy).toHaveBeenCalledWith(expect.stringMatching(/^blob:/));

    // restore MockFileReader for following tests
    (globalThis as unknown as { FileReader: unknown }).FileReader = MockFileReader;
  });
});
