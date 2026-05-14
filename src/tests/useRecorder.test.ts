import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRecorder, negotiateMimeType } from '../hooks/useRecorder';

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

describe('useRecorder', () => {
  beforeEach(() => {
    vi.useFakeTimers();
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
});
