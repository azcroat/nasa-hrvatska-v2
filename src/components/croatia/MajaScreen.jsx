import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { useApp } from '../../context/AppContext';
import { useStats } from '../../context/StatsContext.jsx';
import { apiFetch } from '../../lib/apiFetch.js';
import MajaOrb from './MajaOrb.jsx';
import MemoryChips from './MemoryChips.jsx';
import ConversationBubble from './ConversationBubble.jsx';
import DebriefScreen from './MajaDebrief.jsx';

// ─────────────────────────────────────────────
// KEYFRAME STYLES
// ─────────────────────────────────────────────
const MAJA_STYLES = `
@keyframes maja-pulse {
  0%   { transform: scale(1);   opacity: 0.65; }
  100% { transform: scale(2.3); opacity: 0;    }
}
@keyframes maja-dot {
  0%, 60%, 100% { transform: translateY(0);    opacity: 1;   }
  30%           { transform: translateY(-8px); opacity: 0.6; }
}
@keyframes maja-float {
  0%, 100% { transform: translateY(0px);  }
  50%      { transform: translateY(-4px); }
}
@keyframes maja-shimmer {
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
}
@keyframes debrief-pop {
  0%   { transform: scale(0.8);  opacity: 0; }
  80%  { transform: scale(1.03);             }
  100% { transform: scale(1);    opacity: 1; }
}
@keyframes maja-ellipsis {
  0%  { content: '.';   }
  33% { content: '..';  }
  66% { content: '...'; }
}
@keyframes maja-confetti-fall {
  0%   { transform: translateY(-20px) rotate(0deg);   opacity: 1; }
  100% { transform: translateY(80px)  rotate(360deg); opacity: 0; }
}
@keyframes maja-bar-pulse {
  0%, 100% { opacity: 0.7; }
  50%       { opacity: 1;   }
}
@keyframes maja-cursor-blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}
`;

// ─────────────────────────────────────────────
// PERSONA CONFIG
// ─────────────────────────────────────────────
const PERSONA_CONFIG = {
  teacher: {
    name: 'Maja Kovačević',
    title: 'Učiteljica Hrvatskog',
    avatar: '/images/portraits/tutor-hero.webp',
    fallbackEmoji: '👩‍🏫',
    orbColor: '#D4002D',
    thinkingColor: '#F59E0B',
    speakingColor: '#D4002D',
    listenColor: '#0e7490',
    accentColor: '#D4002D',
  },
  fisherman: {
    name: 'Marko',
    title: 'Ribar, Stari Grad, Hvar',
    avatar: '/images/portraits/fisherman.webp',
    fallbackEmoji: '⛵',
    orbColor: '#0284c7',
    thinkingColor: '#0369a1',
    speakingColor: '#0284c7',
    listenColor: '#0ea5e9',
    accentColor: '#0284c7',
  },
  secretary: {
    name: 'Ana Perković',
    title: 'Tajnica, Grad Zagreb',
    avatar: '/images/portraits/mature-woman.webp',
    fallbackEmoji: '💼',
    orbColor: '#7c3aed',
    thinkingColor: '#6d28d9',
    speakingColor: '#7c3aed',
    listenColor: '#8b5cf6',
    accentColor: '#7c3aed',
  },
  baka: {
    name: 'Baka Mara',
    title: 'Baka iz Vinkovaca, Slavonija',
    avatar: '/images/portraits/grandmother.webp',
    fallbackEmoji: '👵',
    orbColor: '#b45309',
    thinkingColor: '#92400e',
    speakingColor: '#b45309',
    listenColor: '#d97706',
    accentColor: '#b45309',
  },
};

function getPersona() {
  try {
    const p = localStorage.getItem('maja_persona');
    return PERSONA_CONFIG[p] ? p : 'teacher';
  } catch {
    return 'teacher';
  }
}

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const SR_SUPPORTED =
  typeof window !== 'undefined' &&
  !!(window.SpeechRecognition || window.webkitSpeechRecognition);

const DEFAULT_MEMORY = {
  sessionCount: 0,
  relationshipLevel: 0,
  totalMinutes: 0,
  knownFacts: {},
  mistakePatterns: [],
  lastSessionSummary: '',
  nextTopicSuggestion: '',
  recentVocab: [],
  sessions: [],
};

const SILENCE_DELAY_MS = 2000;

function loadMemory() {
  try {
    const raw = localStorage.getItem('majaMemory');
    if (!raw) return { ...DEFAULT_MEMORY };
    return { ...DEFAULT_MEMORY, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_MEMORY };
  }
}

function saveMemory(mem) {
  try {
    localStorage.setItem('majaMemory', JSON.stringify(mem));
  } catch {
    // quota exceeded — silently ignore
  }
}

function fmtDuration(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m} min ${s} sec`;
}

function fmtElapsed(secs) {
  const m = Math.floor(secs / 60);
  const s = String(secs % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function relationshipLabel(level) {
  const labels = ['stranac', 'poznanik', 'redoviti polaznik', 'prijatelj', 'bliski prijatelj'];
  return labels[Math.min(level, 4)] || 'stranac';
}

function computeRelationshipLevel(sessionCount) {
  if (sessionCount >= 20) return 4;
  if (sessionCount >= 10) return 3;
  if (sessionCount >= 5)  return 2;
  if (sessionCount >= 2)  return 1;
  return 0;
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function MajaScreen() {
  const { name, goBack } = useApp();
  const { level, award } = useStats();

  // ── persona ────────────────────────────────
  const [personaKey] = useState(() => getPersona());
  const personaCfg = PERSONA_CONFIG[personaKey] || PERSONA_CONFIG.teacher;

  // ── state ──────────────────────────────────
  const [memory, setMemory] = useState(loadMemory);
  const [phase, setPhase] = useState('idle');
  const [conversation, setConversation] = useState([]);
  const [session, setSession] = useState({
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
  const [debrief, setDebrief] = useState(null);
  const [elapsedSecs, setElapsedSecs] = useState(0);
  const [sessionActive, setSessionActive] = useState(false);
  const [fallbackText, setFallbackText] = useState('');
  const [micDenied, setMicDenied] = useState(false);

  // ── refs ───────────────────────────────────
  const debriefXpFired = useRef(false);
  const phaseRef = useRef('idle');
  const recRef = useRef(null);
  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const transcriptRef = useRef('');
  const sessionStartRef = useRef(null);
  const elapsedTimerRef = useRef(null);
  const scrollRef = useRef(null);
  const mediaStreamRef = useRef(null);

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
        setElapsedSecs(Math.floor((Date.now() - sessionStartRef.current) / 1000));
      }, 1000);
    } else {
      clearInterval(elapsedTimerRef.current);
    }
    return () => clearInterval(elapsedTimerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionActive]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      stopMicImmediate();
      stopWaveform();
      clearTimeout(silenceTimerRef.current);
      clearInterval(elapsedTimerRef.current);
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
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
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
          return Math.max(2, Math.min(60, (data[idx] / 255) * 60));
        });
        setWaveform(bars);
        animFrameRef.current = requestAnimationFrame(tick);
      };
      animFrameRef.current = requestAnimationFrame(tick);
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setMicDenied(true);
      }
      // waveform not critical — continue without it
    }
  }, [stopWaveform]);

  // ── TTS helper ─────────────────────────────
  const playTTS = useCallback(async (text) => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }

      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, slow: false }),
      });

      if (!res.ok) throw new Error(`TTS ${res.status}`);

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      audioUrlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;

      return new Promise((resolve) => {
        audio.onended = () => {
          URL.revokeObjectURL(url);
          audioUrlRef.current = null;
          audioRef.current = null;
          resolve();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
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
    clearTimeout(silenceTimerRef.current);
    if (recRef.current) {
      try { recRef.current.stop(); } catch {}
      recRef.current = null;
    }
  }

  const stopMic = useCallback(() => {
    stopMicImmediate();
    stopWaveform();
  }, [stopWaveform]);

  // ── send message ───────────────────────────
  const sendMessage = useCallback(
    async (text) => {
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
        const res = await fetch('/api/maja', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, stream: true }),
        });

        if (!res.ok) throw new Error(`API ${res.status}`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let streamedText = '';

        // Add a placeholder streaming message
        setConversation((prev) => [...prev, { role: 'maja', content: '', streaming: true }]);
        setPhase('thinking'); // keep thinking indicator while streaming starts

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop(); // keep incomplete line in buffer
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
                    i === prev.length - 1 && m.streaming
                      ? { ...m, content: streamedText }
                      : m
                  )
                );
              }
            } catch { continue; }
          }
        }

        // Mark streaming complete — parse accumulated JSON reply from Maja
        // Maja streams a JSON object; extract the "reply" field from it
        let replyText = streamedText;
        let correction = null;
        let newFacts = {};
        let emotion = 'warm';
        try {
          const cleaned = streamedText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
          const parsed = JSON.parse(cleaned);
          replyText = parsed.reply || streamedText;
          correction = parsed.correction || null;
          newFacts = parsed.newFacts || {};
          emotion = parsed.emotion || 'warm';
        } catch { /* use raw streamedText as reply if JSON parse fails */ }

        setConversation((prev) =>
          prev.map((m, i) =>
            i === prev.length - 1 && m.streaming
              ? { ...m, content: replyText, streaming: false, correction, emotion }
              : m
          )
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
        if (phaseRef.current !== 'debrief') {
          setErrorMsg('Nešto je pošlo po krivu. Pokušaj ponovo.');
          setPhase('error');
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [conversation, session, level, name, playTTS]
  );

  // ── start listening ────────────────────────
  const startListening = useCallback(() => {
    if (phaseRef.current === 'debrief') return;

    setPhase('listening');
    transcriptRef.current = '';
    setLiveTranscript('');

    startWaveform();

    if (!SR_SUPPORTED) return; // fallback text input handles it

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SpeechRec();
    rec.lang = 'hr-HR';
    rec.interimResults = true;
    rec.continuous = true;
    recRef.current = rec;

    const resetSilenceTimer = () => {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        const captured = transcriptRef.current.trim();
        if (captured.length > 1 && phaseRef.current === 'listening') {
          stopMic();
          sendMessage(captured);
        }
      }, SILENCE_DELAY_MS);
    };

    rec.onresult = (e) => {
      let full = '';
      for (let i = 0; i < e.results.length; i++) {
        full += e.results[i][0].transcript;
      }
      transcriptRef.current = full;
      setLiveTranscript(full);
      resetSilenceTimer();
    };

    rec.onerror = (e) => {
      if (e.error === 'not-allowed') {
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startWaveform, stopMic, sendMessage]);

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

      if (!res.ok) throw new Error(`API ${res.status}`);
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
    } catch {
      setErrorMsg('Nije moguće spojiti se s Majom. Provjeri internet vezu.');
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
      const mergedVocab = [
        ...(data.newVocab || []),
        ...(mem.recentVocab || []),
      ].slice(0, 30);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      award(debrief.xpEarned ?? 30);
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
            {/* ── Persona avatar card ── */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                marginBottom: 12,
              }}
            >
              <div style={{ position: 'relative' }}>
                <img
                  src={personaCfg.avatar}
                  alt={personaCfg.name}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: `3px solid ${personaCfg.accentColor}`,
                    display: 'block',
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const sib = /** @type {HTMLElement} */ (e.currentTarget.nextSibling);
                    if (sib) sib.style.display = 'flex';
                  }}
                />
                <div
                  style={{
                    display: 'none',
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    border: `3px solid ${personaCfg.accentColor}`,
                    background: personaCfg.accentColor + '22',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 36,
                  }}
                >
                  {personaCfg.fallbackEmoji}
                </div>
                {memory.sessionCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: -4,
                      right: -4,
                      background: personaCfg.accentColor,
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 10,
                      border: '2px solid #fff',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    #{memory.sessionCount + 1}
                  </span>
                )}
              </div>
              <span
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: 'var(--heading)',
                  marginTop: 4,
                }}
              >
                {personaCfg.name}
              </span>
              <span style={{ fontSize: 12, color: 'var(--subtext)' }}>
                {personaCfg.title}
              </span>
              {memory.sessionCount > 0 && (
                <span
                  style={{
                    fontSize: 11,
                    color: personaCfg.accentColor,
                    background: personaCfg.accentColor + '14',
                    border: `1px solid ${personaCfg.accentColor}33`,
                    borderRadius: 10,
                    padding: '2px 8px',
                  }}
                >
                  {relationshipLabel(memory.relationshipLevel)}
                </span>
              )}
            </div>

            {/* ── Memory chips ── */}
            <MemoryChips knownFacts={memory.knownFacts} />

            {/* ── Welcome / returning card ── */}
            {!sessionActive && (
              <>
                {isFirstTime ? (
                  <div
                    style={{
                      background: 'var(--card)',
                      border: '1px solid var(--card-b)',
                      borderRadius: 14,
                      padding: '20px 18px',
                      marginBottom: 20,
                    }}
                  >
                    <h2
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: 'var(--heading)',
                        margin: '0 0 14px',
                        textAlign: 'center',
                      }}
                    >
                      Upoznaj {personaCfg.name.split(' ')[0]}
                    </h2>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        marginBottom: 14,
                      }}
                    >
                      <img
                        src={personaCfg.avatar}
                        alt={personaCfg.name}
                        style={{
                          width: 100,
                          height: 100,
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: `3px solid ${personaCfg.accentColor}`,
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const sib = /** @type {HTMLElement} */ (e.currentTarget.nextSibling);
                          if (sib) sib.style.display = 'flex';
                        }}
                      />
                      <div
                        style={{
                          display: 'none',
                          width: 100,
                          height: 100,
                          borderRadius: '50%',
                          border: `3px solid ${personaCfg.accentColor}`,
                          background: personaCfg.accentColor + '22',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 48,
                        }}
                      >
                        {personaCfg.fallbackEmoji}
                      </div>
                    </div>
                    <ul
                      style={{
                        listStyle: 'none',
                        margin: '0 0 12px',
                        padding: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}
                    >
                      {({
                        teacher: [
                          '🇭🇷 Predaje Hrvatski u Zagrebu',
                          '📍 Rodom iz Zadra',
                          '❤️ Prstaci, brudet i Hajduk Split',
                        ],
                        fisherman: [
                          '⛵ Ribar u Starom Gradu, Hvar',
                          '🐟 Jedini prave ribe: zubatac i špar',
                          '⚽ Navijač Hajduka Split',
                        ],
                        secretary: [
                          '🏛️ Tajnica u Gradu Zagrebu',
                          '📋 Stručnjakinja za obrasce i postupke',
                          '☕ Kava u 10:00 je sveta',
                        ],
                        baka: [
                          '🏠 Baka iz Vinkovaca, Slavonija',
                          '🍲 Kulen, sarma i pogača iz pećnice',
                          '❤️ Sedam unuka i beskonačna ljubav',
                        ],
                      }[personaKey] || []).map((item) => (
                        <li
                          key={item}
                          style={{
                            fontSize: 14,
                            color: 'var(--heading)',
                            lineHeight: 1.5,
                          }}
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                    <p
                      style={{
                        fontSize: 12,
                        fontStyle: 'italic',
                        color: 'var(--subtext)',
                        margin: 0,
                        lineHeight: 1.6,
                        textAlign: 'center',
                      }}
                    >
                      {personaKey === 'teacher' && 'Maja će se sjetiti svakog vašeg razgovora i prilagoditi lekcije vama.'}
                      {personaKey === 'fisherman' && 'Marko ne uči gramatiku — ali čut ćeš pravi dalmatinski Hrvatski.'}
                      {personaKey === 'secretary' && 'Ana te uči formalnom Hrvatskom kroz stvarnu birokratsku interakciju.'}
                      {personaKey === 'baka' && 'Baka Mara te dočekuje s toplinom i hranom. Savršeno za početnike.'}
                    </p>
                  </div>
                ) : (
                  <div
                    style={{
                      background: 'var(--card)',
                      border: '1px solid var(--card-b)',
                      borderRadius: 14,
                      padding: '16px 18px',
                      marginBottom: 20,
                    }}
                  >
                    <p
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: 'var(--heading)',
                        margin: '0 0 4px',
                      }}
                    >
                      Dobrodošli natrag, {name || 'Student'}! 👋
                    </p>
                    <p
                      style={{
                        fontSize: 13,
                        color: 'var(--subtext)',
                        margin: '0 0 8px',
                      }}
                    >
                      Dosad {memory.sessionCount}{' '}
                      {memory.sessionCount === 1 ? 'razgovor' : 'razgovora'} ·{' '}
                      {memory.totalMinutes} minuta
                    </p>
                    {memory.recentVocab?.length > 0 && (
                      <p style={{ fontSize: 12, color: 'var(--subtext)', margin: '0 0 6px' }}>
                        Nedavno ste naučili:{' '}
                        <strong>
                          {memory.recentVocab
                            .slice(0, 3)
                            .map((v) => v.hr)
                            .join(', ')}
                        </strong>
                      </p>
                    )}
                    {memory.nextTopicSuggestion && (
                      <p
                        style={{
                          fontSize: 12,
                          color: 'var(--info)',
                          background: 'var(--info-bg)',
                          border: '1px solid var(--info-b)',
                          borderRadius: 8,
                          padding: '6px 10px',
                          margin: 0,
                          lineHeight: 1.5,
                        }}
                      >
                        💬 {memory.nextTopicSuggestion}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ── SR not supported banner ── */}
            {!SR_SUPPORTED && (
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
                Za glasovni razgovor koristite Chrome ili Edge. Možete i dalje razgovarati
                s Majom upisivanjem teksta u polje ispod.
              </div>
            )}

            {/* ── Mic denied banner ── */}
            {micDenied && SR_SUPPORTED && (
              <div
                style={{
                  background: 'rgba(220,38,38,0.08)',
                  border: '1px solid rgba(220,38,38,0.25)',
                  borderRadius: 10,
                  padding: '12px 14px',
                  marginBottom: 14,
                  fontSize: 13,
                  color: '#991b1b',
                  lineHeight: 1.5,
                }}
              >
                <strong>Pristup mikrofonu odbijen.</strong> Dopusti pristup mikrofonu u
                postavkama preglednika ili koristi tekstualni unos ispod.
                <br />
                <button
                  onClick={() => setMicDenied(false)}
                  style={{
                    marginTop: 8,
                    background: '#D4002D',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '5px 12px',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  Pokušaj ponovo
                </button>
              </div>
            )}

            {/* ── THE ORB ── */}
            <MajaOrb phase={phase} waveform={waveform} liveTranscript={liveTranscript} personaCfg={personaCfg} />

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
                  <ConversationBubble key={i} msg={msg} personaCfg={personaCfg} />
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
                      <span style={{ color: personaCfg.listenColor, fontWeight: 600 }}>Govoriš…</span>
                    ) : phase === 'thinking' ? (
                      <span style={{ color: '#d97706', fontWeight: 600 }}>Obrađujem…</span>
                    ) : phase === 'maja-speaking' ? (
                      <span style={{ color: personaCfg.speakingColor, fontWeight: 600 }}>{personaCfg.name.split(' ')[0]} govori…</span>
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
