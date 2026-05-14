import { useState, useCallback, useRef, useEffect } from 'react';
import { unlockAudio } from '../lib/audio.js';

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
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState<RecorderError | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const mountedRef = useRef(true);
  const audioUrlRef = useRef<string | null>(null);
  useEffect(() => {
    audioUrlRef.current = audioUrl;
  }, [audioUrl]);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        try {
          recorderRef.current.stop();
        } catch (_) {
          // ignore
        }
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (audioUrlRef.current && audioUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, []);

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

          let secs = 3;
          countdownTimerRef.current = setInterval(() => {
            secs -= 1;
            if (!mountedRef.current) return;
            if (secs > 0) {
              setCountdown(secs);
              return;
            }
            if (countdownTimerRef.current) {
              clearInterval(countdownTimerRef.current);
              countdownTimerRef.current = null;
            }
            const mime = negotiateMimeType(MediaRecorder.isTypeSupported.bind(MediaRecorder));
            if (mime === null) {
              setState('unsupported');
              return;
            }
            const rec = new MediaRecorder(stream, { mimeType: mime });
            recorderRef.current = rec;
            const chunks: Blob[] = [];
            rec.ondataavailable = (e: BlobEvent) => {
              if (e.data && e.data.size > 0) chunks.push(e.data);
            };
            rec.onstop = () => {
              stream.getTracks().forEach((t) => t.stop());
              streamRef.current = null;
              const blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' });
              if (!mountedRef.current) return;
              setAudioBlob(blob);
              const reader = new FileReader();
              reader.onload = () => {
                if (!mountedRef.current) return;
                setAudioUrl(reader.result as string);
                setState('done');
              };
              reader.onerror = () => {
                if (!mountedRef.current) return;
                setError({
                  code: 'FileReaderError',
                  message: "Couldn't save your recording.",
                });
                setState('error');
              };
              reader.readAsDataURL(blob);
            };
            rec.start();
            setState('recording');
          }, 1000);
        })
        .catch((err: Error & { name?: string }) => {
          if (!mountedRef.current) return;
          const code = err.name ?? 'UnknownError';
          setMicAvailable(false);
          setError({ code, message: err.message });
          if (code === 'NotAllowedError' || code === 'PermissionDeniedError') {
            setState('denied');
          } else if (
            code === 'NotFoundError' ||
            code === 'DevicesNotFoundError' ||
            code === 'OverconstrainedError' ||
            code === 'NotSupportedError'
          ) {
            setState('unsupported');
          } else {
            setState('error');
          }
        });
    },
    [state],
  );

  const stopRecording = useCallback(() => {
    const rec = recorderRef.current;
    if (rec && rec.state === 'recording') rec.stop();
  }, []);
  const playback = useCallback(async () => {
    unlockAudio();
    if (!audioUrl) return;
    const audio = new Audio(audioUrl);
    audio.volume = 1.0;
    try {
      await audio.play();
    } catch (_) {
      // logged by consumer if needed
    }
  }, [audioUrl]);

  const reset = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      try {
        recorderRef.current.stop();
      } catch (_) {
        // ignore
      }
    }
    recorderRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioUrl && audioUrl.startsWith('blob:')) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setError(null);
    setCountdown(0);
    setState('idle');
    setMicAvailable(null);
  }, [audioUrl]);

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
