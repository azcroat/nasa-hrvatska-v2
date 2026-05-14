import { useState, useCallback } from 'react';

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
  const [state] = useState<RecorderState>('idle');
  const [micAvailable] = useState<boolean | null>(null);
  const [audioBlob] = useState<Blob | null>(null);
  const [audioUrl] = useState<string | null>(null);
  const [countdown] = useState(0);
  const [error] = useState<RecorderError | null>(null);

  const startRecording = useCallback((_opts?: StartRecordingOpts) => {}, []);
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
