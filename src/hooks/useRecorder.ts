import { useState, useCallback, useRef, useEffect } from 'react';

const MIME_PRIORITY = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'] as const;

export function negotiateMimeType(isTypeSupported: (m: string) => boolean): string | null {
  for (const m of MIME_PRIORITY) {
    if (isTypeSupported(m)) return m;
  }
  return null;
}

export type RecorderState =
  | 'idle'
  | 'requesting'
  | 'countdown'
  | 'recording'
  | 'done'
  | 'denied'
  | 'unsupported'
  | 'error';

export interface RecorderError {
  code: string;
  message: string;
}

export interface StartRecordingOpts {
  countdown?: number;
  maxDurationMs?: number;
}

export interface UseRecorderResult {
  state: RecorderState;
  micAvailable: boolean | null;
  audioBlob: Blob | null;
  audioUrl: string | null;
  countdown: number;
  error: RecorderError | null;
  startRecording: (opts?: StartRecordingOpts) => void;
  stopRecording: () => void;
  playback: () => Promise<void>;
  reset: () => void;
}

export function useRecorder(): UseRecorderResult {
  const [state, setState] = useState<RecorderState>('idle');
  const [micAvailable, setMicAvailable] = useState<boolean | null>(null);
  const [audioBlob] = useState<Blob | null>(null);
  const [audioUrl] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState<RecorderError | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const mountedRef = useRef(true);
  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    [],
  );

  const startRecording = useCallback(
    (_opts?: StartRecordingOpts) => {
      if (
        state !== 'idle' &&
        state !== 'denied' &&
        state !== 'unsupported' &&
        state !== 'error' &&
        state !== 'done'
      ) {
        return;
      }
      setState('requesting');
      setError(null);

      if (!navigator.mediaDevices?.getUserMedia) {
        setState('unsupported');
        setMicAvailable(false);
        return;
      }

      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          if (!mountedRef.current) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          streamRef.current = stream;
          setMicAvailable(true);
          setCountdown(3);
          setState('countdown');
        })
        .catch(() => {
          // handled in Task 6
        });
    },
    [state],
  );

  const stopRecording = useCallback(() => {}, []);
  const playback = useCallback(async () => {}, []);
  const reset = useCallback(() => {}, []);

  return {
    state,
    micAvailable,
    audioBlob,
    audioUrl,
    countdown,
    error,
    startRecording,
    stopRecording,
    playback,
    reset,
  };
}
