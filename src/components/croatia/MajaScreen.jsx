import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { useApp } from '../../context/AppContext';
import { useStats } from '../../context/StatsContext.jsx';
import { apiFetch } from '../../lib/apiFetch.js';
import MajaOrb from './MajaOrb.jsx';
import ConversationBubble from './ConversationBubble.jsx';
import DebriefScreen from './MajaDebrief.jsx';
import MajaIdleCard from './MajaIdleCard.jsx';
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
  const streamAbortRef = useRef(null);

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
   
  }, [sessionActive]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamAbortRef.current) { streamAbortRef.current.abort(); streamAbortRef.current = null; }
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

      const res = await apiFetch('/api/tts', {
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
        } finally {
          try { reader.cancel(); } catch { /* ignore */ }
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
        // Finalize any in-progress streaming bubble so it doesn't remain stuck
        setConversation((prev) =>
          prev.map((m, i) =>
            i === prev.length - 1 && m.streaming
              ? { ...m, streaming: false }
              : m
          )
        );
        if (phaseRef.current !== 'debrief') {
          setErrorMsg('Nešto je pošlo po krivu. Pokušaj ponovo.');
          setPhase('error');
        }
      }
    },
     
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
        if (e.results[i]?.[0]) full += e.results[i][0].transcript;
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

      if (!res.ok) {
        const e = new Error(`API ${res.status}`);
        e._status = res.status;
        throw e;
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
    } catch (e) {
      let msg = 'Nije moguće spojiti se s Majom. Provjeri internet vezu.';
      if (e?._status === 401) msg = 'Sesija je istekla. Odjavi se i prijavi ponovo.';
      else if (e?._status === 429) msg = 'Prekoračen dnevni limit AI razgovora. Pokušaj sutra.';
      else if (e?._status >= 500) msg = 'Serverska greška. Pokušaj za nekoliko minuta.';
      setErrorMsg(msg);
      setPhase('error');
      setSessionActive(false);
    }

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
      if (typeof award === 'function') award(debrief.xpEarned ?? 30);
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
              personaKey={personaKey}
              personaCfg={personaCfg}
              memory={memory}
              name={name}
              isFirstTime={isFirstTime}
              showWelcome={!sessionActive}
            />


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
