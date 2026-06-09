/**
 * useWhisperSTT — Voice Activity Detection + Whisper transcription hook.
 *
 * Primary path:  RMS-based VAD (Web Audio API) → MediaRecorder → /api/stt (Whisper)
 * Fallback path: Web Speech API push-to-talk (used when /api/stt returns 503 or offline)
 *
 * VAD state machine:
 *   idle → waiting (mic open) → recording (speech detected) → processing (Whisper) → waiting
 *
 * The interrupt feature: if the user speaks while Maja's TTS is playing, the hook
 * calls stopAudio() to cancel the TTS, then calls onInterrupt() so the component
 * can clear the isSpeaking animation.
 *
 * @param {object} opts
 *   onResult(text)    — called with transcribed text; component should auto-send
 *   onInterrupt()     — called when user speaks over TTS (clear isSpeaking state)
 *   onError(msg)      — called on non-recoverable error (optional)
 *   isSpeaking        — whether Maja is currently playing TTS
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { stopAudio, getAudioContext, unlockAudio, blobToBase64 } from '../lib/audio.ts';
import { _nativePost } from '../lib/nativePost.js';
import { isNative } from '../lib/platform.js';

// ── VAD tuning constants ──────────────────────────────────────────────────────
const SPEECH_THRESHOLD = 0.015; // RMS above this triggers speech detection
const SILENCE_THRESHOLD = 0.008; // RMS below this starts the silence timer
const MIN_SPEECH_MS = 250; // Ignore bursts shorter than this (noise guard)
const SILENCE_DURATION_MS = 1800; // Silence this long → end recording, send to Whisper
const POLL_INTERVAL_MS = 80; // How often to sample the AnalyserNode
const FFT_SIZE = 2048;

// Feature-detect once at module load — no point re-checking on every render
const SUPPORTS_VAD =
  typeof window !== 'undefined' &&
  typeof MediaRecorder !== 'undefined' &&
  typeof AudioContext !== 'undefined' &&
  !!navigator.mediaDevices?.getUserMedia;

function getSupportedMimeType() {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/mp4',
  ];
  for (const t of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) return t;
  }
  return '';
}

function computeRms(analyser, buf) {
  analyser.getByteTimeDomainData(buf);
  let sum = 0;
  for (let i = 0; i < buf.length; i++) {
    const v = (buf[i] - 128) / 128;
    sum += v * v;
  }
  return Math.sqrt(sum / buf.length);
}

export default function useWhisperSTT({ onResult, onInterrupt, onError, isSpeaking }) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [vadLevel, setVadLevel] = useState(0); // 0–1 for UI visualisation
  // SP4a — exposed so consumers (AIConversation, LiveTutorScreen, MajaScreen)
  // can render the shared MicPermissionDeniedExplainer instead of just relying
  // on the onError callback with a plain string. Reset on cleanup.
  const [permissionDenied, setPermissionDenied] = useState(false);

  // Whether Whisper is available: null=untested, true=confirmed, false=503→use Web Speech
  const whisperAvailRef = useRef(null);

  // Web Audio / MediaRecorder infrastructure
  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const pollRef = useRef(null);

  // VAD state machine
  const vadStateRef = useRef('idle'); // 'idle'|'waiting'|'recording'|'processing'
  const speechStartRef = useRef(null);
  const silenceStartRef = useRef(null);

  // Web Speech API fallback
  const webSpeechRef = useRef(null);
  const pendingVoiceRef = useRef('');

  // Ref-based guard against double-tap race: React state (isListening) is async and
  // may still read false on a second tap that arrives before the first render cycle.
  // This ref is set synchronously before any await, so the guard is always current.
  const isActivatingRef = useRef(false);

  // AudioContext ownership: true = we created a private ctx and must close it in cleanup;
  // false = we borrowed the shared ctx from audio.ts — TTS still needs it, never close it.
  const ctxIsOwnedRef = useRef(false);
  // MediaStreamSource node — must be explicitly disconnected on cleanup even when ctx is borrowed.
  const sourceRef = useRef(null);

  // Stable refs for callbacks/state used inside intervals and async fns
  const onResultRef = useRef(onResult);
  const onInterruptRef = useRef(onInterrupt);
  const onErrorRef = useRef(onError);
  const isSpeakingRef = useRef(isSpeaking);
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);
  useEffect(() => {
    onInterruptRef.current = onInterrupt;
  }, [onInterrupt]);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);
  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  // ── Full cleanup ────────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      try {
        recorderRef.current.stop();
      } catch {
        /* ignore */
      }
    }
    recorderRef.current = null;
    chunksRef.current = [];
    // Disconnect the MediaStreamSource from the graph — always required to release the mic
    // back to the OS and stop audio flowing through the analyser.
    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect();
      } catch {
        /* ignore */
      }
      sourceRef.current = null;
    }
    if (audioCtxRef.current) {
      if (ctxIsOwnedRef.current) {
        // We created this context — close it to free OS resources.
        try {
          audioCtxRef.current.close();
        } catch {
          /* ignore */
        }
      }
      // Never close the shared context from audio.ts — TTS depends on it surviving.
      audioCtxRef.current = null;
      ctxIsOwnedRef.current = false;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    analyserRef.current = null;
    dataArrayRef.current = null;
    vadStateRef.current = 'idle';
    speechStartRef.current = null;
    silenceStartRef.current = null;
    setIsListening(false);
    setIsProcessing(false);
    setVadLevel(0);
  }, []);

  // Cleanup on unmount
  useEffect(
    () => () => {
      cleanup();
      webSpeechRef.current?.abort?.();
      webSpeechRef.current = null;
    },
    [cleanup],
  );

  // ── Send audio to Whisper ───────────────────────────────────────────────────
  const sendToWhisper = useCallback(
    async (blob) => {
      setIsProcessing(true);
      vadStateRef.current = 'processing';
      try {
        if (!navigator.onLine) throw new Error('offline');

        const audioBase64 = await blobToBase64(blob);
        const res = await _nativePost('/api/stt', {
          audioBase64,
          mimeType: blob.type || 'audio/webm',
        });

        // null = total transport failure (Capacitor native unreachable endpoint, etc.)
        // !res.ok (including 503 = Whisper not configured) → fall back to Web Speech
        if (!res || res.status === 503) {
          // Whisper not configured or transport failed — mark unavailable and let the component fall back
          whisperAvailRef.current = false;
          cleanup();
          return;
        }
        if (!res.ok) throw new Error('STT error ' + res.status);

        whisperAvailRef.current = true;
        const data = await res.json();
        const text = (data.text || '').trim();
        if (text) onResultRef.current?.(text);
      } catch (e) {
        // 'offline' is expected when device loses connection mid-speech; don't surface it
        if (e.message !== 'offline') {
          onErrorRef.current?.(e.message || 'Voice transcription failed — please try again.');
        }
      } finally {
        setIsProcessing(false);
        // Resume VAD so user can speak again without re-tapping
        if (vadStateRef.current !== 'idle' && streamRef.current) {
          vadStateRef.current = 'waiting';
          speechStartRef.current = null;
          silenceStartRef.current = null;
        }
      }
    },
    [cleanup],
  );

  // ── VAD polling tick (runs every POLL_INTERVAL_MS) ─────────────────────────
  const vadTick = useCallback(() => {
    const analyser = analyserRef.current;
    const buf = dataArrayRef.current;
    if (!analyser || !buf) return;

    const rms = computeRms(analyser, buf);
    const now = Date.now();
    setVadLevel(Math.min(rms * 8, 1)); // scale to 0–1 for waveform UI

    const state = vadStateRef.current;

    if (state === 'waiting') {
      if (rms > SPEECH_THRESHOLD) {
        if (!speechStartRef.current) {
          speechStartRef.current = now;
        } else if (now - speechStartRef.current > MIN_SPEECH_MS) {
          // Confirmed real speech — start recording
          if (isSpeakingRef.current) {
            // User is speaking while Maja talks → interrupt TTS immediately
            stopAudio();
            onInterruptRef.current?.();
          }

          vadStateRef.current = 'recording';
          silenceStartRef.current = null;
          chunksRef.current = [];

          const mimeType = getSupportedMimeType();
          const recorder = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : {});
          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
          };
          recorder.onstop = () => {
            const audioBlob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' });
            if (audioBlob.size > 500) {
              // Send non-trivial recordings to Whisper
              sendToWhisper(audioBlob);
            } else {
              // Too short to be speech — back to waiting
              vadStateRef.current = 'waiting';
              speechStartRef.current = null;
            }
          };
          recorder.start(100); // emit data every 100 ms
          recorderRef.current = recorder;
        }
      } else {
        // Below threshold — reset if it was just a noise spike, not sustained speech
        if (speechStartRef.current && now - speechStartRef.current < MIN_SPEECH_MS) {
          speechStartRef.current = null;
        }
      }
    } else if (state === 'recording') {
      if (rms < SILENCE_THRESHOLD) {
        if (!silenceStartRef.current) {
          silenceStartRef.current = now;
        } else if (now - silenceStartRef.current > SILENCE_DURATION_MS) {
          // Sustained silence — stop recording and send to Whisper
          if (recorderRef.current?.state === 'recording') {
            recorderRef.current.stop(); // onstop → sendToWhisper
          }
          speechStartRef.current = null;
        }
      } else {
        // Still speaking — reset silence timer
        silenceStartRef.current = null;
      }
    }
  }, [sendToWhisper]);

  // ── Web Speech API fallback (used when Whisper unavailable) ────────────────
  const startWebSpeech = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      onErrorRef.current?.('Voice input is not supported in this browser. Try Chrome on desktop.');
      return;
    }
    pendingVoiceRef.current = '';
    const r = new SR();
    r.lang = 'hr-HR';
    r.continuous = true;
    r.interimResults = true;
    r.onstart = () => setIsListening(true);
    r.onresult = (e) => {
      let finalChunk = '',
        interimChunk = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalChunk += t;
        else interimChunk += t;
      }
      if (finalChunk) {
        pendingVoiceRef.current = (pendingVoiceRef.current + ' ' + finalChunk).trim();
      } else if (interimChunk) {
        // Show interim in a way the component can optionally pick up
        // (component will only act on onResult, not on interim)
      }
    };
    r.onerror = (e) => {
      setIsListening(false);
      if (e.error && e.error !== 'no-speech') {
        onErrorRef.current?.('Voice input error — please try again or type your message.');
      }
    };
    r.onend = () => {
      setIsListening(false);
      const text = pendingVoiceRef.current.trim();
      pendingVoiceRef.current = '';
      webSpeechRef.current = null;
      if (text) onResultRef.current?.(text);
    };
    r.start();
    webSpeechRef.current = r;
  }, []);

  const stopWebSpeech = useCallback(() => {
    if (webSpeechRef.current) {
      webSpeechRef.current.stop(); // triggers onend → onResult
      // webSpeechRef is cleared inside onend
    }
  }, []);

  // ── Public API ───────────────────────────────────────────────────────────────
  const stop = useCallback(() => {
    if (webSpeechRef.current) {
      stopWebSpeech();
    } else {
      cleanup();
    }
  }, [cleanup, stopWebSpeech]);

  /**
   * toggle() — starts or stops the microphone.
   * - If already listening (Whisper+VAD or Web Speech): stops.
   * - If processing (waiting for Whisper): no-op (don't interrupt the pending request).
   * - Otherwise: opens microphone and starts the appropriate path.
   */
  const toggle = useCallback(async () => {
    // Already listening → stop
    if (isListening || webSpeechRef.current) {
      stop();
      return;
    }
    // Mid-request or mid-setup → ignore tap (isActivatingRef guards the async setup
    // window before setIsListening(true) is committed to React state)
    if (isProcessing || isActivatingRef.current) return;

    // Whisper known unavailable, or browser lacks MediaRecorder → Web Speech
    if (!SUPPORTS_VAD || whisperAvailRef.current === false) {
      startWebSpeech();
      return;
    }

    // ── Whisper + VAD path ────────────────────────────────────────────────
    // Unlock the shared audio pipeline synchronously — BEFORE any await.
    // This ensures the shared AudioContext (_ctx) from audio.ts exists and is resumed
    // within the user-gesture call stack. iOS/Android close the gesture window after
    // the first await, so any context created afterwards is immediately suspended.
    unlockAudio();

    // Set the activating guard synchronously — before any await — so a second tap
    // that arrives before the first render cycle sees isListening=true is rejected.
    isActivatingRef.current = true;

    // Prefer the shared AudioContext that audio.ts already created and unlocked.
    // This avoids creating a second context (iOS allows only one active context per page),
    // and ensures TTS playback continues to work after the VAD session ends (we never
    // close a context we don't own).
    // Fall back to a private context only if the shared one is unavailable or closed.
    const sharedCtx = getAudioContext();
    let ctx;
    if (sharedCtx && sharedCtx.state !== 'closed') {
      ctx = sharedCtx;
      ctxIsOwnedRef.current = false;
    } else {
      const AudioCtxCtor = window.AudioContext || window.webkitAudioContext;
      ctx = new AudioCtxCtor();
      ctxIsOwnedRef.current = true;
    }
    audioCtxRef.current = ctx;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000, // hint: lower SR → smaller audio files
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      if (ctx.state === 'suspended') await ctx.resume();

      const source = ctx.createMediaStreamSource(stream);
      sourceRef.current = source; // tracked for disconnect in cleanup
      const analyser = ctx.createAnalyser();
      analyser.fftSize = FFT_SIZE;
      analyser.smoothingTimeConstant = 0.4;
      source.connect(analyser);
      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

      vadStateRef.current = 'waiting';
      speechStartRef.current = null;
      silenceStartRef.current = null;
      setIsListening(true);
      setVadLevel(0);

      // Poll the analyser at POLL_INTERVAL_MS — drives the entire VAD state machine
      pollRef.current = setInterval(vadTick, POLL_INTERVAL_MS);
    } catch (e) {
      // Setup failed — only close the AudioContext if we own it (not the shared one from audio.ts)
      if (audioCtxRef.current && ctxIsOwnedRef.current) {
        try {
          audioCtxRef.current.close();
        } catch {
          /* ignore */
        }
      }
      audioCtxRef.current = null;
      ctxIsOwnedRef.current = false;
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        setPermissionDenied(true);
        onErrorRef.current?.(
          isNative()
            ? 'Microphone access denied. Go to Settings → Apps → Naša Hrvatska → Permissions, enable Microphone, then force-close and reopen the app.'
            : 'Microphone access was denied. Please allow microphone access in your browser settings and try again.',
        );
      } else {
        // MediaDevices not available (e.g. older iOS) — fall through to Web Speech
        startWebSpeech();
      }
    } finally {
      isActivatingRef.current = false;
    }
  }, [isListening, isProcessing, vadTick, startWebSpeech, stop]);

  /** Manually clear permission-denied state (e.g., after user re-grants and taps Try Again). */
  const clearPermissionDenied = useCallback(() => {
    setPermissionDenied(false);
  }, []);

  return {
    isListening,
    isProcessing,
    vadLevel,
    toggle,
    stop,
    /** True when Whisper path is active (false → Web Speech fallback is in use) */
    usingWhisper: SUPPORTS_VAD && whisperAvailRef.current !== false,
    /** SP4a — set true when getUserMedia rejected with NotAllowed/PermissionDenied. */
    permissionDenied,
    clearPermissionDenied,
  };
}
