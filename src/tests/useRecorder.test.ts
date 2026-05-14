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
});
