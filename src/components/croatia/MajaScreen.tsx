import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { useStats } from '../../context/StatsContext';
import { markQuest } from '../../lib/quests.js';
import { apiFetch } from '../../lib/apiFetch.js';
import { getVoicePreference } from '../../lib/soundSettings.js';
import { unlockAudio, ttsFetch } from '../../lib/audio.js';
import MajaOrb from './MajaOrb';
import ConversationBubble from './ConversationBubble';
import DebriefScreen from './MajaDebrief';
import MajaIdleCard from './MajaIdleCard';
import MicPermissionDeniedExplainer from '../shared/MicPermissionDeniedExplainer';
import useWhisperSTT from '../../hooks/useWhisperSTT.js';
import { isVoiceAvailable } from './majaVoice';
import {
  MAJA_STYLES,
  PERSONA_CONFIG,
  getPersona,
  SR_SUPPORTED,
  SILENCE_DELAY_MS,
  loadMemory,
  saveMemory,
  fmtElapsed,
  computeRelationshipLevel,
} from './MajaScreenUtils.js';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface ConversationMessage {
  role: string;
  content: string;
  streaming?: boolean;
  correction?: unknown;
  emotion?: string;
}
interface DebriefData {
  majaNotes: string;
  didWell: string;
  focusNext: string;
  newVocab?: { hr: string; en: string; used_in?: string }[];
  nextTopicSuggestion?: string;
  xpEarned?: number;
  durationSecs: number;
  updatedFacts?: Record<string, unknown>;
  mistakePatternsUpdate?: unknown[];
  suggestLevelUp?: boolean;
  suggestLevelUpTo?: string;
  levelUpMessage?: string;
}
interface SessionState {
  count: number;
  relationshipLevel: number;
  knownFacts: Record<string, unknown>;
  mistakePatterns: unknown[];
  lastSummary: string;
  nextTopic: string;
}
interface ApiError extends Error {
  _status?: number;
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function MajaScreen() {
  const { name, goBack } = useApp();
  const { level, award } = useStats();

  // ── persona ────────────────────────────────
  const [personaKey] = useState(() => getPersona());
  const personaCfg =
    (personaKey
      ? (PERSONA_CONFIG as Record<string, typeof PERSONA_CONFIG.teacher>)[personaKey]
      : null) || PERSONA_CONFIG.teacher;

  // ── state ──────────────────────────────────
  const [memory, setMemory] = useState(loadMemory);
  const [phase, setPhase] = useState('idle');
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [session, setSession] = useState<SessionState>({
    count: 0,
    relationshipLevel: 0,
    knownFacts: {},
    mistakePatterns: [],
    lastSummary: '',
    nextTopic: '',
  });
  const [waveform, setWaveform] = useState(Array(30).fill(4));
  const [liveTranscript, setLiveTranscript] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [debrief, setDebrief] = useState<DebriefData | null>(null);
  const [elapsedSecs, setElapsedSecs] = useState(0);
  const [sessionActive, setSessionActive] = useState(false);
  const [fallbackText, setFallbackText] = useState('');
  const [micDenied, setMicDenied] = useState(false);

  // ── refs ───────────────────────────────────
  const debriefXpFired = useRef<boolean>(false);
  const phaseRef = useRef<string>('idle');
  const recRef = useRef<InstanceType<typeof window.SpeechRecognition> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transcriptRef = useRef<string>('');
  const sessionStartRef = useRef<number | null>(null);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const streamAbortRef = useRef<AbortController | null>(null);

  // keep phaseRef in sync
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // auto-scroll conversation
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation]);

  // elapsed timer
  useEffect(() => {
    if (sessionActive) {
      sessionStartRef.current = Date.now() - elapsedSecs * 1000;
      elapsedTimerRef.current = setInterval(() => {
        setElapsedSecs(Math.floor((Date.now() - (sessionStartRef.current ?? Date.now())) / 1000));
      }, 1000);
    } else {
      clearInterval(elapsedTimerRef.current ?? undefined);
    }
    return () => clearInterval(elapsedTimerRef.current ?? undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionActive]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamAbortRef.current) {
        streamAbortRef.current.abort();
        streamAbortRef.current = null;
      }
      stopMicImmediate();
      stopWaveform();
      clearTimeout(silenceTimerRef.current ?? undefined);
      clearInterval(elapsedTimerRef.current ?? undefined);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── waveform helpers ───────────────────────
  const stopWaveform = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    analyserRef.current = null;
    setWaveform(Array(30).fill(4));
  }, []);

  const startWaveform = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      const tick = () => {
        if (!analyserRef.current || phaseRef.current !== 'listening') {
          stopWaveform();
          return;
        }
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const bars = Array.from({ length: 30 }, (_, i) => {
          const idx = Math.floor((i / 30) * data.length);
          return Math.max(2, Math.min(60, ((data[idx] ?? 0) / 255) * 60));
        });
        setWaveform(bars);
        animFrameRef.current = requestAnimationFrame(tick);
      };
      animFrameRef.current = requestAnimationFrame(tick);
    } catch (err: unknown) {
      if ((err as Error).name === 'NotAllowedError') {
        setMicDenied(true);
      }
      // waveform not critical — continue without it
    }
  }, [stopWaveform]);

  // ── TTS helper ─────────────────────────────
  const playTTS = useCallback(async (text: string): Promise<void> => {
    unlockAudio(); // must be synchronous before any await — iOS activation
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (audioUrlRef.current) {
        audioUrlRef.current = null;
      }

      const res = await ttsFetch({ text, slow: false, voice: getVoicePreference() });

      if (!res || !res.ok) throw new Error(`TTS ${res?.status ?? 'failed'}`);

      const blob = await res.blob();
      // Use base64 data URL — blob: URLs fail silently on some Android OEM WebViews
      const url = await new Promise<string>((resolve) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.readAsDataURL(blob);
      });
      audioUrlRef.current = url;
      const audio = new Audio(url);
      audio.volume = 1.0; // required: low volume blocks activation on some WebViews
      audioRef.current = audio;

      return new Promise((resolve) => {
        audio.onended = () => {
          audioUrlRef.current = null;
          audioRef.current = null;
          resolve();
        };
        audio.onerror = () => {
          audioUrlRef.current = null;
          audioRef.current = null;
          resolve(); // continue even on error
        };
        audio.play().catch(() => resolve());
      });
    } catch {
      // TTS failure is non-fatal — text is already shown in conversation
    }
  }, []);

  // ── mic helpers ────────────────────────────
  function stopMicImmediate() {
    clearTimeout(silenceTimerRef.current ?? undefined);
    if (recRef.current) {
      try {
        recRef.current.onresult = null;
        recRef.current.onerror = null;
        recRef.current.onend = null;
        recRef.current.abort();
      } catch (_) {}
      recRef.current = null;
    }
  }

  const stopMic = useCallback(() => {
    stopMicImmediate();
    stopWaveform();
  }, [stopWaveform]);

  // ── send message ───────────────────────────
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) {
        setPhase('listening');
        startListening();
        return;
      }

      setPhase('thinking');
      setLiveTranscript('');

      const userMsg = { role: 'user', content: text };
      setConversation((prev) => [...prev, userMsg]);

      const updatedHistory = [...conversation, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const payload = {
        message: text,
        history: updatedHistory,
        session,
        userLevel: level || 'A1',
        userName: name || 'Student',
        isSessionStart: false,
        persona: personaKey,
      };

      try {
        // ── Streaming path ──────────────────────────────────────────────────
        const abortCtrl = new AbortController();
        streamAbortRef.current = abortCtrl;
        const streamTimeout = setTimeout(() => abortCtrl.abort(), 30000); // 30s max
        const res = await apiFetch('/api/maja', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, stream: true }),
          signal: abortCtrl.signal,
        });
        clearTimeout(streamTimeout);

        if (!res.ok) throw new Error(`API ${res.status}`);
        if (!res.body) throw new Error('Server returned no response body.');

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let streamedText = '';

        // Add a placeholder streaming message
        setConversation((prev) => [...prev, { role: 'maja', content: '', streaming: true }]);
        setPhase('thinking'); // keep thinking indicator while streaming starts

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? ''; // keep incomplete line in buffer
            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const data = line.slice(6).trim();
              if (data === '[DONE]') break;
              try {
                const parsed = JSON.parse(data);
                if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                  streamedText += parsed.delta.text;
                  setConversation((prev) =>
                    prev.map((m, i) =>
                      i === prev.length - 1 && m.streaming ? { ...m, content: streamedText } : m,
                    ),
                  );
                }
              } catch {
                continue;
              }
            }
          }
        } finally {
          try {
            reader.cancel();
          } catch {
            /* ignore */
          }
        }

        // Mark streaming complete — parse accumulated JSON reply from Maja
        // Maja streams a JSON object; extract the "reply" field from it
        let replyText = streamedText;
        let correction = null;
        let newFacts = {};
        let emotion = 'warm';
        try {
          const cleaned = streamedText
            .replace(/^```(?:json)?\s*/i, '')
            .replace(/\s*```$/, '')
            .trim();
          const parsed = JSON.parse(cleaned);
          replyText = parsed.reply || streamedText;
          correction = parsed.correction || null;
          newFacts = parsed.newFacts || {};
          emotion = parsed.emotion || 'warm';
        } catch {
          /* use raw streamedText as reply if JSON parse fails */
        }

        setConversation((prev) =>
          prev.map((m, i) =>
            i === prev.length - 1 && m.streaming
              ? { ...m, content: replyText, streaming: false, correction, emotion }
              : m,
          ),
        );

        if (newFacts && Object.keys(newFacts).length) {
          setSession((prev) => ({
            ...prev,
            knownFacts: { ...prev.knownFacts, ...newFacts },
          }));
        }

        if (phaseRef.current !== 'debrief') {
          setPhase('maja-speaking');
          await playTTS(replyText);
          if (phaseRef.current === 'maja-speaking') {
            startListening();
          }
        }
      } catch {
        // Finalize any in-progress streaming bubble so it doesn't remain stuck
        setConversation((prev) =>
          prev.map((m, i) =>
            i === prev.length - 1 && m.streaming ? { ...m, streaming: false } : m,
          ),
        );
        if (phaseRef.current !== 'debrief') {
          setErrorMsg('Nešto je pošlo po krivu. Pokušaj ponovo.');
          setPhase('error');
        }
      }
    },

    // eslint-disable-next-line react-hooks/exhaustive-deps
    [conversation, session, level, name, playTTS],
  );

  // Voice availability: Web Speech (desktop) OR MediaRecorder→Whisper (iOS Safari,
  // which has no SpeechRecognition). Drives the banner + the iOS capture path.
  const VOICE_AVAILABLE = isVoiceAvailable(
    SR_SUPPORTED,
    typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia,
    typeof MediaRecorder !== 'undefined',
  );

  // iOS / no-Web-Speech voice path: record → Whisper STT → feed the transcript to
  // Maja, exactly like AIConversation. VAD auto-stops on silence and fires onResult.
  // Inert on desktop (never toggled there — Web Speech handles it).
  const iosVoice = useWhisperSTT({
    onResult: (text: string) => {
      const t = (text || '').trim();
      if (t.length > 1 && phaseRef.current === 'listening') {
        stopMic();
        sendMessage(t);
      }
    },
    onInterrupt: () => {},
    onError: () => {},
    isSpeaking: phase === 'maja-speaking',
  });
  // Read iosVoice through a ref so startListening's useCallback identity stays
  // stable (it feeds the auto-listen effect) instead of churning every render.
  const iosVoiceRef = useRef(iosVoice);
  iosVoiceRef.current = iosVoice;

  // Surface a Whisper-path mic denial through the same banner as Web Speech.
  useEffect(() => {
    if (iosVoice.permissionDenied) setMicDenied(true);
  }, [iosVoice.permissionDenied]);

  // Release the iOS Whisper mic once the conversation is no longer listening or
  // speaking (debrief / idle / error), so it never lingers open in the background.
  // Mid-conversation it stays on across turns; isSpeaking suppresses self-capture.
  useEffect(() => {
    if (
      !SR_SUPPORTED &&
      phase !== 'listening' &&
      phase !== 'maja-speaking' &&
      iosVoiceRef.current.isListening
    ) {
      iosVoiceRef.current.stop();
    }
  }, [phase]);

  // ── start listening ────────────────────────
  const startListening = useCallback(() => {
    if (phaseRef.current === 'debrief') return;

    setPhase('listening');
    transcriptRef.current = '';
    setLiveTranscript('');

    startWaveform();

    if (!SR_SUPPORTED) {
      // iOS Safari has no Web Speech API: capture via MediaRecorder → Whisper.
      // VAD auto-stops on silence and fires iosVoice.onResult → sendMessage.
      // A text input remains as a manual backup (showFallbackInput).
      if (VOICE_AVAILABLE && !iosVoiceRef.current.isListening) iosVoiceRef.current.toggle();
      return;
    }

    const SpeechRec = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SpeechRec();
    rec.lang = 'hr-HR';
    rec.interimResults = true;
    rec.continuous = true;
    recRef.current = rec;

    const resetSilenceTimer = () => {
      clearTimeout(silenceTimerRef.current ?? undefined);
      silenceTimerRef.current = setTimeout(() => {
        const captured = transcriptRef.current.trim();
        if (captured.length > 1 && phaseRef.current === 'listening') {
          stopMic();
          sendMessage(captured);
        }
      }, SILENCE_DELAY_MS);
    };

    rec.onresult = (e: Event) => {
      const se = e as unknown as { results: SpeechRecognitionResultList };
      let full = '';
      for (let i = 0; i < se.results.length; i++) {
        if (se.results[i]?.[0]) full += se.results[i]![0]!.transcript;
      }
      transcriptRef.current = full;
      setLiveTranscript(full);
      resetSilenceTimer();
    };

    rec.onerror = (e: Event) => {
      const re = e as unknown as { error: string };
      if (re.error === 'not-allowed') {
        setMicDenied(true);
        setPhase('listening'); // fallback will show
      }
    };

    rec.onend = () => {
      // If still supposed to be listening and we have transcript, send it
      if (phaseRef.current === 'listening' && transcriptRef.current.trim().length > 1) {
        stopMic();
        sendMessage(transcriptRef.current.trim());
      }
    };

    try {
      rec.start();
    } catch {
      // rec already started — ignore
    }
  }, [startWaveform, stopMic, sendMessage, VOICE_AVAILABLE]);

  // ── start session ──────────────────────────
  const startSession = useCallback(async () => {
    setPhase('thinking');
    setErrorMsg('');
    setConversation([]);
    setElapsedSecs(0);
    setSessionActive(true);

    const mem = loadMemory();
    const newCount = mem.sessionCount + 1;
    const relLevel = computeRelationshipLevel(newCount);

    const sess = {
      count: newCount,
      relationshipLevel: relLevel,
      knownFacts: { ...mem.knownFacts },
      mistakePatterns: [...(mem.mistakePatterns || [])],
      lastSummary: mem.lastSessionSummary || '',
      nextTopic: mem.nextTopicSuggestion || '',
    };
    setSession(sess);

    try {
      const res = await apiFetch('/api/maja', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: '',
          history: [],
          session: sess,
          userLevel: level || 'A1',
          userName: name || 'Student',
          isSessionStart: true,
          persona: personaKey,
        }),
      });

      if (!res.ok) {
        const apiErr: ApiError = Object.assign(new Error(`API ${res.status}`), {
          _status: res.status,
        });
        throw apiErr;
      }
      const data = await res.json();

      const majaMsg = {
        role: 'maja',
        content: data.reply,
        correction: null,
        emotion: data.emotion,
      };
      setConversation([majaMsg]);

      if (data.newFacts && Object.keys(data.newFacts).length) {
        setSession((prev) => ({
          ...prev,
          knownFacts: { ...prev.knownFacts, ...data.newFacts },
        }));
      }

      setPhase('maja-speaking');
      await playTTS(data.reply);
      if (phaseRef.current === 'maja-speaking') {
        startListening();
      }
    } catch (err: unknown) {
      const e = err as ApiError;
      let msg = 'Nije moguće spojiti se s Majom. Provjeri internetsku vezu.';
      if (e?._status === 401) msg = 'Sesija je istekla. Odjavi se i prijavi ponovo.';
      else if (e?._status === 429) msg = 'Prekoračen dnevni limit AI razgovora. Pokušaj sutra.';
      else if (e?._status !== undefined && e._status >= 500)
        msg = 'Serverska greška. Pokušaj za koji trenutak.';
      setErrorMsg(msg);
      setPhase('error');
      setSessionActive(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, name, playTTS, startListening]);

  // ── end session ────────────────────────────
  const endSession = useCallback(async () => {
    stopMic();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setSessionActive(false);
    setPhase('thinking');

    const durationSecs = elapsedSecs;

    try {
      const res = await apiFetch('/api/maja-debrief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: conversation.map((m) => ({ role: m.role, content: m.content })),
          session: {
            count: session.count,
            userName: name || 'Student',
            userLevel: level || 'A1',
            knownFacts: session.knownFacts,
            mistakePatterns: session.mistakePatterns,
          },
          durationSeconds: durationSecs,
        }),
      });

      if (!res.ok) throw new Error(`Debrief API ${res.status}`);
      const data = await res.json();

      // update localStorage memory
      const mem = loadMemory();
      const newSessionCount = mem.sessionCount + 1;
      const mergedFacts = { ...mem.knownFacts, ...(data.updatedFacts || {}) };
      const mergedVocab = [...(data.newVocab || []), ...(mem.recentVocab || [])].slice(0, 30);

      const updatedMem = {
        ...mem,
        sessionCount: newSessionCount,
        relationshipLevel: computeRelationshipLevel(newSessionCount),
        totalMinutes: mem.totalMinutes + Math.round(durationSecs / 60),
        knownFacts: mergedFacts,
        mistakePatterns: data.mistakePatternsUpdate || mem.mistakePatterns,
        lastSessionSummary: data.majaNotes || mem.lastSessionSummary,
        nextTopicSuggestion: data.nextTopicSuggestion || '',
        recentVocab: mergedVocab,
        sessions: [
          {
            date: new Date().toISOString(),
            durationSecs,
            messages: conversation.length,
            xpEarned: data.xpEarned ?? 30,
          },
          ...(mem.sessions || []),
        ].slice(0, 50),
      };
      saveMemory(updatedMem);
      setMemory(updatedMem);

      setDebrief({ ...data, durationSecs });
      setPhase('debrief');
    } catch {
      // debrief failed — show a minimal one
      setDebrief({
        majaNotes: 'Hvala na razgovoru! Vidimo se uskoro.',
        didWell: 'Završili ste razgovor — to je uvijek pobjednički korak!',
        focusNext: 'Nastavi vježbati svaki dan.',
        newVocab: [],
        nextTopicSuggestion: '',
        xpEarned: 20,
        durationSecs: elapsedSecs,
      });
      setPhase('debrief');
    }
  }, [conversation, elapsedSecs, level, name, session, stopMic]);

  // ── continue conversation ──────────────────
  const handleContinue = useCallback(() => {
    setDebrief(null);
    setConversation([]);
    setElapsedSecs(0);
    setPhase('idle');
    setSessionActive(false);
  }, []);

  // ── debrief back (award XP) ────────────────
  const handleDebriefBack = useCallback(() => {
    if (debrief && !debriefXpFired.current) {
      debriefXpFired.current = true;
      if (typeof award === 'function') award(debrief.xpEarned ?? 30, false, 'speaking');
      markQuest('culture');
    }
    goBack();
  }, [debrief, award, goBack]);

  // ── fallback send ──────────────────────────
  const handleFallbackSend = useCallback(() => {
    const text = fallbackText.trim();
    if (!text) return;
    setFallbackText('');
    sendMessage(text);
  }, [fallbackText, sendMessage]);

  // ── retry after error ──────────────────────
  const handleRetry = useCallback(() => {
    setErrorMsg('');
    if (sessionActive) {
      startListening();
    } else {
      setPhase('idle');
    }
  }, [sessionActive, startListening]);

  // ── derived values ─────────────────────────
  const isFirstTime = memory.sessionCount === 0;
  const showFallbackInput =
    (!SR_SUPPORTED || micDenied) && (phase === 'listening' || sessionActive);

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <>
      <style>{MAJA_STYLES}</style>
      <div
        style={{
          maxWidth: 480,
          margin: '0 auto',
          padding: '0 16px 120px',
        }}
      >
        {/* ── Back / header bar ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 0 12px',
            position: 'sticky',
            top: 0,
            background: 'transparent',
            zIndex: 10,
          }}
        >
          <button
            onClick={goBack}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--heading)',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              padding: '4px 0',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            ← {personaCfg.name.split(' ')[0]}
          </button>

          {sessionActive && phase !== 'debrief' && (
            <button
              onClick={endSession}
              style={{
                background: 'transparent',
                border: '1px solid var(--card-b)',
                borderRadius: 8,
                color: 'var(--subtext)',
                fontSize: 13,
                padding: '6px 12px',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              ⏹ Završi
            </button>
          )}
        </div>

        {/* ── DEBRIEF SCREEN ── */}
        {phase === 'debrief' && debrief && (
          <DebriefScreen
            debrief={debrief}
            conversation={conversation}
            durationSecs={debrief.durationSecs ?? elapsedSecs}
            onContinue={handleContinue}
            onBack={handleDebriefBack}
            award={award}
          />
        )}

        {phase !== 'debrief' && (
          <>
            {/* ── Persona avatar card + welcome ── */}
            <MajaIdleCard
              personaKey={personaKey ?? 'teacher'}
              personaCfg={personaCfg}
              memory={memory}
              name={name ?? ''}
              isFirstTime={isFirstTime}
              showWelcome={!sessionActive}
            />

            {/* ── No-voice banner (only when neither Web Speech nor Whisper works) ── */}
            {!VOICE_AVAILABLE && (
              <div
                style={{
                  background: 'rgba(245,158,11,0.1)',
                  border: '1px solid rgba(245,158,11,0.35)',
                  borderRadius: 10,
                  padding: '12px 14px',
                  marginBottom: 14,
                  fontSize: 13,
                  color: '#92400e',
                  lineHeight: 1.5,
                }}
              >
                <strong>Prepoznavanje govora nije dostupno u ovom pregledniku.</strong>
                <br />
                Za glasovni razgovor koristite Chrome ili Edge. Možete i dalje razgovarati s Majom
                upisivanjem teksta u polje ispod.
              </div>
            )}

            {/* ── Mic denied explainer (Web Speech or Whisper path) ── */}
            {micDenied && (
              <div style={{ marginBottom: 14 }}>
                <MicPermissionDeniedExplainer onRetry={() => setMicDenied(false)} />
              </div>
            )}

            {/* ── THE ORB ── */}
            <MajaOrb
              phase={phase}
              waveform={waveform}
              liveTranscript={liveTranscript}
              personaCfg={personaCfg}
            />

            {/* ── Error message ── */}
            {phase === 'error' && (
              <div
                style={{
                  textAlign: 'center',
                  marginBottom: 12,
                }}
              >
                <p style={{ fontSize: 13, color: '#dc2626', margin: '0 0 8px' }}>
                  {errorMsg || 'Nepoznata greška.'}
                </p>
                <button
                  onClick={handleRetry}
                  style={{
                    background: '#dc2626',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 20px',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Pokušaj ponovo
                </button>
              </div>
            )}

            {/* ── Conversation transcript ── */}
            {conversation.length > 0 && (
              <div
                ref={scrollRef}
                style={{
                  maxHeight: '35vh',
                  overflowY: 'auto',
                  padding: '8px 4px',
                  marginBottom: 8,
                  scrollbarWidth: 'thin',
                }}
              >
                {conversation.map((msg, i) => (
                  <ConversationBubble
                    key={i}
                    msg={msg as Parameters<typeof ConversationBubble>[0]['msg']}
                    personaCfg={personaCfg}
                  />
                ))}
              </div>
            )}

            {/* ── Fallback text input ── */}
            {showFallbackInput && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <textarea
                  value={fallbackText}
                  onChange={(e) => setFallbackText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleFallbackSend();
                    }
                  }}
                  placeholder={`Upiši svoju poruku ${personaCfg.name.split(' ')[0]}...`}
                  rows={2}
                  style={{
                    flex: 1,
                    borderRadius: 10,
                    border: '1px solid var(--card-b)',
                    background: 'var(--card)',
                    color: 'var(--heading)',
                    padding: '10px 12px',
                    fontSize: 14,
                    resize: 'none',
                    fontFamily: 'inherit',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={handleFallbackSend}
                  disabled={!fallbackText.trim() || phase === 'thinking'}
                  style={{
                    borderRadius: 10,
                    background: fallbackText.trim() && phase !== 'thinking' ? '#D4002D' : '#ccc',
                    color: '#fff',
                    border: 'none',
                    padding: '0 16px',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: fallbackText.trim() && phase !== 'thinking' ? 'pointer' : 'default',
                    transition: 'background 0.2s',
                  }}
                >
                  Pošalji
                </button>
              </div>
            )}

            {/* ── Action bar ── */}
            <div style={{ marginTop: 8 }}>
              {phase === 'idle' && (
                <button
                  onClick={startSession}
                  style={{
                    width: '100%',
                    height: 52,
                    borderRadius: 12,
                    background: personaCfg.accentColor,
                    color: '#fff',
                    border: 'none',
                    fontSize: 17,
                    fontWeight: 700,
                    cursor: 'pointer',
                    letterSpacing: 0.3,
                    boxShadow: `0 4px 16px ${personaCfg.accentColor}40`,
                  }}
                >
                  Počni razgovor →
                </button>
              )}

              {sessionActive && phase !== 'idle' && phase !== 'debrief' && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 0',
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      color: 'var(--subtext)',
                    }}
                  >
                    {phase === 'listening' ? (
                      <span style={{ color: personaCfg.listenColor, fontWeight: 600 }}>
                        Govoriš…
                      </span>
                    ) : phase === 'thinking' ? (
                      <span style={{ color: '#d97706', fontWeight: 600 }}>Obrađujem…</span>
                    ) : phase === 'maja-speaking' ? (
                      <span style={{ color: personaCfg.speakingColor, fontWeight: 600 }}>
                        {personaCfg.name.split(' ')[0]} govori…
                      </span>
                    ) : null}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      color: 'var(--subtext)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {fmtElapsed(elapsedSecs)} elapsed
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
