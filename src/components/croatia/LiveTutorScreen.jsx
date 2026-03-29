import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiFetch } from '../../lib/apiFetch.js';
import { getAudioContext } from '../../lib/audio.js';
import { markQuest } from '../../lib/quests.js';
import { useOnlineStatus } from '../../hooks/useOnlineStatus.js';
import LiveTutorSetup from './LiveTutorSetup.jsx';
import LiveTutorDebrief from './LiveTutorDebrief.jsx';
import LiveTutorControls from './LiveTutorControls.jsx';

// ── Keyframe for debrief spinner (injected once alongside TUTOR_CSS) ──
const DEBRIEF_EXTRA_CSS = `
@keyframes lt-debrief-spin { to { transform: rotate(360deg) } }
@keyframes lt-debrief-pop {
  0%   { transform: scale(0.85); opacity: 0; }
  80%  { transform: scale(1.03); }
  100% { transform: scale(1);    opacity: 1; }
}
`;

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const TUTOR_PERSONA = {
  name: "Marija",
  city: "Split",
  description: "You are warm, patient, and love helping people learn Croatian. You encourage learners with enthusiasm and celebrate their progress.",
};

const PHASE_LABELS = {
  none:            { icon: "🗣️", label: "Speaking freely" },
  thinking:        { icon: "⏳", label: "Transcribing..." },
  speaking:        { icon: "🔊", label: "Tutor speaking..." },
  simplify:        { icon: "📖", label: "Simplifying..." },
  repeat:          { icon: "🔁", label: "Let's try again" },
  explain_english: { icon: "💡", label: "English explanation" },
  celebrate:       { icon: "✅", label: "Excellent!" },
};

// ─────────────────────────────────────────────
// KEYFRAME CSS (injected once)
// ─────────────────────────────────────────────
const TUTOR_CSS = `
@keyframes lt-pulse {
  0%   { transform: scale(1);   opacity: 0.6; }
  100% { transform: scale(2.4); opacity: 0; }
}
@keyframes lt-dot {
  0%, 60%, 100% { transform: translateY(0);    opacity: 1;   }
  30%           { transform: translateY(-7px); opacity: 0.5; }
}
@keyframes lt-mic-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(212,0,45,.4); }
  50%      { box-shadow: 0 0 0 14px rgba(212,0,45,.0); }
}
@keyframes lt-slide-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
`;

let cssInjected = false;
function injectCSS() {
  if (cssInjected) return;
  const el = document.createElement('style');
  el.textContent = TUTOR_CSS + DEBRIEF_EXTRA_CSS;
  document.head.appendChild(el);
  cssInjected = true;
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function LiveTutorScreen({ goBack, award }) {
  injectCSS();
  const isOnline = useOnlineStatus();

  // ── Settings ──────────────────────────────
  const [level, setLevel] = useState("A2");
  const [topic, setTopic] = useState("Free conversation");
  const [started, setStarted] = useState(false);

  // ── Session debrief ───────────────────────
  const [debrief, setDebrief] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const sessionStartRef = useRef(null);

  // ── Conversation state ────────────────────
  const [messages, setMessages] = useState([]);      // { role, content, gloss?, correction?, phase? }
  const [breakdownCount, setBreakdownCount] = useState(0);
  const [sessionHistory, setSessionHistory] = useState("");
  const [turnCount, setTurnCount] = useState(0);

  // ── Mic / STT state ───────────────────────
  const [isRecording, setIsRecording] = useState(false);
  const [useFallbackInput, setUseFallbackInput] = useState(false);
  const [textInput, setTextInput] = useState("");
  // 'unknown' | 'prompt' | 'granted' | 'denied' | 'unavailable'
  const [micPermission, setMicPermission] = useState('unknown');

  // ── Loading / error / playback state ─────
  const [thinking, setThinking] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(null);
  const [showGloss, setShowGloss] = useState(true);
  const [phase, setPhase] = useState("none");
  const [avatarError, setAvatarError] = useState(false);

  // ── Audio output state ────────────────────
  // 'unknown' | 'ok' | 'no-output' | 'suspended'
  const [audioStatus, setAudioStatus] = useState('unknown');
  const [testingAudio, setTestingAudio] = useState(false);
  const [audioTestResult, setAudioTestResult] = useState(null); // null | 'ok' | 'fail'
  const ttsFailCountRef = useRef(0); // consecutive TTS failures during active session
  const [showAudioWarning, setShowAudioWarning] = useState(false);

  // ── Refs ──────────────────────────────────
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);
  const bottomRef = useRef(null);
  const apiMsgsRef = useRef([]);  // mirrors messages but only role+content for API calls

  // ── Check mic permission on mount ─────────
  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicPermission('unavailable');
      return undefined;
    }
    if (!navigator.permissions?.query) {
      // Permissions API not supported — discover on first use
      return undefined;
    }
    let permStatus;
    navigator.permissions.query({ name: 'microphone' })
      .then(status => {
        permStatus = status;
        setMicPermission(status.state); // 'granted' | 'prompt' | 'denied'
        status.onchange = () => setMicPermission(status.state);
      })
      .catch(() => { /* browser doesn't support mic permission query — no-op */ });
    return () => { if (permStatus) permStatus.onchange = null; };
  }, []);

  // ── Check audio output on mount ───────────
  useEffect(() => {
    async function checkAudio() {
      // Check if the AudioContext was suspended (iOS: requires user gesture first)
      const ctx = getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        setAudioStatus('suspended');
        return;
      }
      // Enumerate devices: look for any audiooutput device
      if (navigator.mediaDevices?.enumerateDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const outputs = devices.filter(d => d.kind === 'audiooutput');
          // outputs.length === 0 means the browser sees no audio output hardware
          if (outputs.length === 0) {
            setAudioStatus('no-output');
            return;
          }
        } catch { /* enumerateDevices not supported — assume ok */ }
      }
      setAudioStatus('ok');
    }
    checkAudio();
  }, []);

  // ── Test speaker: oscillator beep ─────────
  const testSpeaker = useCallback(async () => {
    setTestingAudio(true);
    setAudioTestResult(null);
    try {
      // Use existing unlocked context if available, otherwise create a temporary one
      let ctx = getAudioContext();
      let tempCtx = false;
      if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        tempCtx = true;
      }
      await ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = 520; // pleasant mid-tone
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.6);
      await new Promise(r => setTimeout(r, 700));
      if (tempCtx) ctx.close();
      setAudioStatus('ok');
      setAudioTestResult('ok');
    } catch {
      setAudioTestResult('fail');
      setAudioStatus('no-output');
    }
    setTestingAudio(false);
  }, []);

  // ── Auto-scroll ───────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  // ── Start session: send opening message ───
  const startSession = useCallback(async () => {
    setStarted(true);
    setDebrief(null);
    sessionStartRef.current = Date.now();
    setMessages([]);
    apiMsgsRef.current = [];
    setBreakdownCount(0);
    setSessionHistory("");
    setTurnCount(0);
    setPhase("none");
    setError(null);

    // Prime the tutor with a system-style user message
    const opener = `Zdravo! Htio/htjela bih vježbati hrvatski. Tema: ${topic}. Razina: ${level}.`;
    await sendToTutor(opener, 0, "");
  }, [topic, level]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Core: send user text → tutor API → TTS ──
  const sendToTutor = useCallback(async (userText, currentBreakdown, currentHistory) => {
    setThinking(true);
    setError(null);

    const newUserMsg = { role: "user", content: userText };
    const updatedApiMsgs = [...apiMsgsRef.current, newUserMsg];
    apiMsgsRef.current = updatedApiMsgs;

    // Show user bubble (skip for the invisible opener)
    const isOpener = userText.startsWith("Zdravo! Htio");
    if (!isOpener) {
      setMessages(prev => [...prev, { role: "user", content: userText }]);
    }

    try {
      const res = await apiFetch("/api/conversational-tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedApiMsgs,
          level,
          topic,
          persona: TUTOR_PERSONA,
          breakdownCount: currentBreakdown,
          sessionHistory: currentHistory,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = await res.json();

      // Update breakdown count & session history
      const newBreakdown = data.breakdown_count ?? currentBreakdown;
      setBreakdownCount(newBreakdown);
      const newHistory = data.internal_note
        ? (currentHistory + " | " + data.internal_note).slice(-500)
        : currentHistory;
      setSessionHistory(newHistory);
      setPhase(data.scaffold_action || "none");

      // Build full tutor text (Croatian + comprehension prompt)
      const fullCroatian = data.comprehension_prompt
        ? `${data.croatian} ${data.comprehension_prompt}`
        : data.croatian;

      // Add tutor message
      const tutorMsg = {
        role: "assistant",
        content: data.croatian,
        comprehension_prompt: data.comprehension_prompt,
        gloss: data.english_gloss,
        correction: data.correction,
        phase: data.scaffold_action,
      };
      setMessages(prev => [...prev, tutorMsg]);
      apiMsgsRef.current = [...apiMsgsRef.current, { role: "assistant", content: fullCroatian }];

      // Award XP
      const newTurn = turnCount + 1;
      setTurnCount(newTurn);
      if (award) {
        award(5);
        if (newTurn === 10) { award(20); markQuest('speak'); }
      }

      // Play TTS (streaming)
      setThinking(false);
      await playTTSStreaming(fullCroatian);

    } catch (e) {
      setThinking(false);
      const msg = e.message || "";
      setError(
        msg === "rate_limit" || msg.includes("429")
          ? "Rate limit reached — wait a moment and try again."
          : msg === "timeout" || msg.includes("504")
          ? "Request timed out. Please try again."
          : msg === "daily_quota_exceeded"
          ? "Daily AI limit reached. Resets at midnight UTC — try again tomorrow!"
          : msg === "not_configured"
          ? "AI service not available right now. Please try again later."
          : msg === "api_error"
          ? "AI service error. Please try again in a moment."
          : !navigator.onLine
          ? "No internet connection — check your network and try again."
          : "Connection error. Please try again."
      );
    }
  }, [level, topic, turnCount, award]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── TTS: blob fallback helper ──────────────
  const playBlob = async (blob) => {
    // iOS: use the pre-unlocked AudioContext to bypass HTMLAudioElement autoplay policy
    const ctx = getAudioContext();
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (isIOS && ctx) {
      try {
        await ctx.resume();
        const ab = await blob.arrayBuffer();
        const decoded = await ctx.decodeAudioData(ab);
        const src = ctx.createBufferSource();
        src.buffer = decoded;
        src.connect(ctx.destination);
        audioRef.current = { pause: () => { try { src.stop(); } catch {} }, currentTime: 0 };
        src.start(0);
        await new Promise(resolve => { src.onended = resolve; });
        return;
      } catch { /* fall through to HTMLAudioElement */ }
    }
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audioRef.current = audio;
    await new Promise(resolve => { audio.onended = resolve; audio.play().catch(resolve); });
    URL.revokeObjectURL(url);
  };

  // ── TTS: streaming playback ────────────────
  const playTTSStreaming = async (text) => {
    setPlaying(true);
    setPhase('speaking');
    try {
      const res = await apiFetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, slow: false, stream: true }),
      });
      if (!res.ok) throw new Error('tts_failed');

      // Check if browser supports MSE with audio/mpeg
      if (!window.MediaSource || !MediaSource.isTypeSupported('audio/mpeg')) {
        // Fallback: collect full response then play as blob
        const blob = await res.blob();
        await playBlob(blob);
        ttsFailCountRef.current = 0; // successful playback — clear warning
        setShowAudioWarning(false);
        setPlaying(false);
        setPhase('none');
        return;
      }

      const mediaSource = new MediaSource();
      const audioEl = new Audio();
      audioRef.current = audioEl;

      // Register onended/onerror BEFORE assigning src — guarantees we never miss the event
      // even if audio ends synchronously before we reach the await below.
      const endedPromise = new Promise(resolve => {
        audioEl.onended = resolve;
        audioEl.onerror = resolve; // never leave endedPromise unsettled on playback error
      });
      audioEl.src = URL.createObjectURL(mediaSource);

      await new Promise(resolve => { mediaSource.addEventListener('sourceopen', resolve, { once: true }); });
      audioEl.play().catch(() => {}); // Start early — browser buffers while we feed chunks

      const sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg');
      const reader = res.body.getReader();

      const appendChunk = (chunk) => new Promise((resolve, reject) => {
        const doAppend = () => {
          try { sourceBuffer.appendBuffer(chunk); } catch (e) { reject(e); return; }
          sourceBuffer.addEventListener('updateend', resolve, { once: true });
        };
        // If a previous append is still in progress, queue this one after it finishes
        if (sourceBuffer.updating) {
          sourceBuffer.addEventListener('updateend', doAppend, { once: true });
        } else {
          doAppend();
        }
      });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        await appendChunk(value);
      }

      // Only wait for updateend if a buffer operation is still in progress —
      // if updating is already false, no further updateend will fire and the
      // await would hang forever.
      if (sourceBuffer.updating) {
        await new Promise(resolve => sourceBuffer.addEventListener('updateend', resolve, { once: true }));
      }
      mediaSource.endOfStream();

      await endedPromise;
      URL.revokeObjectURL(audioEl.src);
      ttsFailCountRef.current = 0; // successful streaming — clear warning
      setShowAudioWarning(false);

    } catch {
      // Any MSE failure: fall back to non-streaming blob approach
      let blobOk = false;
      try {
        const res2 = await apiFetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, slow: false }),
        });
        if (res2.ok) {
          const blob = await res2.blob();
          await playBlob(blob);
          blobOk = true;
        }
      } catch { /* silent fail — text still displayed */ }
      if (!blobOk) {
        ttsFailCountRef.current += 1;
        if (ttsFailCountRef.current >= 2) setShowAudioWarning(true);
      }
    }
    setPlaying(false);
    setPhase('none');
  };

  // ── STT: start recording via MediaRecorder ─
  const startRecording = useCallback(async () => {
    // Don't start if already busy
    if (isRecording || thinking || playing) return;

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      setPlaying(false);
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      audioChunksRef.current = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        if (blob.size < 1000) { setIsRecording(false); return; } // too short, ignore
        await transcribeAudio(blob, recorder.mimeType || 'audio/webm');
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (e) {
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        setMicPermission('denied');
      } else if (e.name === 'NotFoundError' || e.name === 'DevicesNotFoundError') {
        setMicPermission('unavailable');
      }
      setUseFallbackInput(true);
    }
  }, [isRecording, thinking, playing]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── STT: stop recording ────────────────────
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  // ── STT: send audio blob to Deepgram /api/stt ─
  const transcribeAudio = useCallback(async (blob, mimeType) => {
    setPhase('thinking'); // show loading state
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 15000); // 15s max
    try {
      const res = await fetch('/api/stt', {
        method: 'POST',
        headers: { 'Content-Type': mimeType },
        body: blob,
        signal: controller.signal,
      });
      clearTimeout(tid);
      const data = await res.json();
      if (data.fallback) {
        // Deepgram not configured, fall back to text input
        setUseFallbackInput(true);
        setPhase('none');
        return;
      }
      const transcript = data.transcript?.trim();
      if (transcript) {
        await sendToTutor(transcript, breakdownCount, sessionHistory);
      } else {
        setPhase('none'); // no speech detected, re-enable mic
      }
    } catch {
      clearTimeout(tid);
      setPhase('none');
    }
  }, [breakdownCount, sessionHistory, sendToTutor]);

  // ── End session → fetch debrief from Marija ─
  const endSession = useCallback(async () => {
    if (summaryLoading || debrief) return;
    setSummaryLoading(true);

    // Build plain-text transcript
    const transcript = messages
      .map(m => `${m.role === 'user' ? 'Learner' : 'Marija'}: ${m.content}`)
      .join('\n');
    const durationSecs = sessionStartRef.current
      ? Math.round((Date.now() - sessionStartRef.current) / 1000)
      : messages.length * 30;

    const summaryAbort = new AbortController();
    const summaryTimeout = setTimeout(() => summaryAbort.abort(), 20000); // 20s max
    try {
      const res = await apiFetch('/api/live-tutor-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, level, topic, durationSecs, turnCount }),
        signal: summaryAbort.signal,
      });
      clearTimeout(summaryTimeout);
      const data = res.ok ? await res.json() : null;
      setDebrief(data && data.summary ? { ...data, durationSecs } : {
        summary: 'Odličan razgovor! Svaki put kad govoriš, napredak je zagarantiran.',
        strength: 'You completed a full conversation session — that takes courage!',
        nextStep: 'Practice the vocabulary from today in a flashcard session.',
        xpEarned: Math.min(75, Math.max(25, Math.round(durationSecs / 60) * 10 + turnCount * 3)),
        durationSecs,
      });
    } catch {
      clearTimeout(summaryTimeout);
      setDebrief({
        summary: 'Odličan razgovor! Svaki put kad govoriš, napredak je zagarantiran.',
        strength: 'You completed a full conversation session — that takes courage!',
        nextStep: 'Practice the vocabulary from today in a flashcard session.',
        xpEarned: Math.max(25, turnCount * 4),
        durationSecs,
      });
    } finally {
      setSummaryLoading(false);
    }
  }, [messages, level, topic, turnCount, summaryLoading, debrief]);

  // ── Text input submit ──────────────────────
  const handleTextSubmit = useCallback((e) => {
    e.preventDefault();
    const txt = textInput.trim();
    if (!txt || thinking || playing) return;
    setTextInput("");
    sendToTutor(txt, breakdownCount, sessionHistory);
  }, [textInput, thinking, playing, breakdownCount, sessionHistory, sendToTutor]);

  // ── Cleanup on unmount ─────────────────────
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        try { mediaRecorderRef.current.stop(); } catch {}
      }
      if (audioRef.current) { audioRef.current.pause(); }
    };
  }, []);

  // ─────────────────────────────────────────────
  // RENDER — Setup screen
  // ─────────────────────────────────────────────
  if (!started) {
    return (
      <>
        {!isOnline && (
          <div style={{ background:'#fef2f2', color:'#dc2626', padding:'10px 16px', fontSize:13, fontWeight:600, textAlign:'center', borderBottom:'1px solid #fecaca' }}>
            No internet connection — connect to start a session.
          </div>
        )}
        <LiveTutorSetup
        goBack={goBack}
        level={level}
        setLevel={setLevel}
        topic={topic}
        setTopic={setTopic}
        micPermission={micPermission}
        audioStatus={audioStatus}
        testingAudio={testingAudio}
        audioTestResult={audioTestResult}
        avatarError={avatarError}
        setAvatarError={setAvatarError}
        onTestSpeaker={testSpeaker}
        onStart={startSession}
      />
      </>
    );
  }

  // ─────────────────────────────────────────────
  // RENDER — Session debrief
  // ─────────────────────────────────────────────
  if (debrief) {
    return (
      <LiveTutorDebrief
        goBack={goBack}
        debrief={debrief}
        turnCount={turnCount}
        topic={topic}
        award={award}
        onPracticeAgain={() => {
          setDebrief(null);
          setStarted(false);
          setMessages([]);
          apiMsgsRef.current = [];
          setBreakdownCount(0);
          setTurnCount(0);
          setSessionHistory('');
        }}
      />
    );
  }

  // ─────────────────────────────────────────────
  // RENDER — Summary loading overlay
  // ─────────────────────────────────────────────
  if (summaryLoading) {
    return (
      <div className="c" style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20 }}>
        <div style={{ width:48, height:48, borderRadius:'50%', border:'4px solid rgba(212,0,45,.15)', borderTopColor:'#D4002D', animation:'lt-debrief-spin 0.9s linear infinite' }}/>
        <p style={{ color:'var(--subtext)', fontSize:14 }}>Marija is writing your summary…</p>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // RENDER — Active conversation screen
  // ─────────────────────────────────────────────
  const phaseInfo = PHASE_LABELS[phase] || PHASE_LABELS.none;
  const micBusy = phase === 'speaking' || phase === 'thinking' || thinking || playing;
  const canType  = !thinking && !playing;
  const showMic = !useFallbackInput;

  return (
    <div className="c" style={{ minHeight:'100vh', display:'flex', flexDirection:'column' }}>

      {/* ── Top bar ── */}
      <div style={{
        display:'flex', alignItems:'center', gap:10,
        padding:'12px 16px', borderBottom:'1px solid var(--card-b)',
        background:'var(--card)', flexShrink:0,
      }}>
        <button onClick={goBack} className="b bp" style={{ padding:'6px 12px', fontSize:'var(--text-xs)', fontWeight:700, flexShrink:0 }}>
          ← Back
        </button>

        {/* Avatar mini */}
        <div style={{ position:'relative', width:36, height:36, flexShrink:0 }}>
          {(thinking || playing) && (
            <div style={{
              position:'absolute', inset:0, borderRadius:'50%',
              background: playing ? 'rgba(212,0,45,.3)' : 'rgba(245,158,11,.3)',
              animation:'lt-pulse 1.2s ease-out infinite',
            }}/>
          )}
          {!avatarError
            ? <img src="/images/portraits/tutor-hero.webp" alt="Marija" loading="lazy" onError={() => setAvatarError(true)}
                style={{ width:36, height:36, borderRadius:'50%', objectFit:'cover', position:'relative', zIndex:1 }} />
            : <div style={{ width:36, height:36, borderRadius:'50%', background:'rgba(212,0,45,.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, position:'relative', zIndex:1 }}>👩‍🏫</div>
          }
        </div>

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:'var(--text-sm)', fontWeight:800, color:'var(--heading)' }}>Marija · {level}</div>
          <div style={{ fontSize:10, color:'var(--subtext)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{topic}</div>
        </div>

        {/* Phase badge */}
        <div style={{
          display:'flex', alignItems:'center', gap:4,
          padding:'4px 10px', borderRadius:20,
          background: phase === 'celebrate' ? 'rgba(22,163,74,.1)' : phase === 'explain_english' ? 'rgba(99,102,241,.1)' : 'rgba(0,0,0,.04)',
          border: '1px solid ' + (phase === 'celebrate' ? 'rgba(22,163,74,.25)' : phase === 'explain_english' ? 'rgba(99,102,241,.25)' : 'var(--card-b)'),
          flexShrink:0,
        }}>
          <span style={{ fontSize:12 }}>{phaseInfo.icon}</span>
          <span style={{ fontSize:10, fontWeight:700, color:'var(--subtext)' }}>{phaseInfo.label}</span>
        </div>
      </div>

      {/* ── Conversation feed ── */}
      <div style={{ flex:1, overflowY:'auto', padding:'16px 16px 8px' }}>

        {messages.length === 0 && thinking && (
          <div style={{ textAlign:'center', color:'var(--subtext)', fontSize:'var(--text-sm)', marginTop:40 }}>
            Marija is preparing your lesson…
          </div>
        )}

        {messages.map((msg, i) => {
          const isUser = msg.role === 'user';
          return (
            <div key={i} style={{
              animation:'lt-slide-in .25s ease',
              marginBottom:12,
              display:'flex',
              flexDirection: isUser ? 'row-reverse' : 'row',
              alignItems:'flex-start',
              gap:8,
            }}>
              {/* Avatar dot */}
              {!isUser && (
                <div style={{ width:28, height:28, borderRadius:'50%', background:'rgba(212,0,45,.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0, marginTop:2 }}>
                  {avatarError ? '👩‍🏫' : <img src="/images/portraits/tutor-hero.webp" loading="lazy" onError={() => setAvatarError(true)} style={{ width:28, height:28, borderRadius:'50%', objectFit:'cover' }} alt="" />}
                </div>
              )}

              <div style={{ maxWidth:'78%' }}>
                {/* Main bubble */}
                <div style={{
                  padding:'10px 14px',
                  borderRadius: isUser ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
                  background: isUser ? 'rgba(212,0,45,.08)' : 'var(--card)',
                  border: isUser ? '1px solid rgba(212,0,45,.2)' : '1px solid var(--card-b)',
                  fontSize:'var(--text-sm)',
                  color:'var(--heading)',
                  lineHeight:1.55,
                }}>
                  {msg.content}
                  {msg.comprehension_prompt && (
                    <div style={{ marginTop:6, fontSize:'var(--text-xs)', color:'var(--info)', fontStyle:'italic' }}>
                      {msg.comprehension_prompt}
                    </div>
                  )}
                </div>

                {/* English gloss */}
                {!isUser && msg.gloss && showGloss && (
                  <div style={{
                    marginTop:4, padding:'6px 10px',
                    background:'rgba(99,102,241,.06)', borderRadius:8,
                    border:'1px solid rgba(99,102,241,.15)',
                    fontSize:'var(--text-xs)', color:'var(--subtext)', fontStyle:'italic',
                  }}>
                    {msg.gloss}
                  </div>
                )}

                {/* Correction */}
                {!isUser && msg.correction && (
                  <div style={{
                    marginTop:4, padding:'6px 10px',
                    background:'rgba(245,158,11,.08)', borderRadius:8,
                    border:'1px solid rgba(245,158,11,.25)',
                    fontSize:'var(--text-xs)', color:'#92400e',
                  }}>
                    ✏️ {msg.correction}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Thinking indicator */}
        {thinking && (
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12, animation:'lt-slide-in .25s ease' }}>
            <div style={{ width:28, height:28, borderRadius:'50%', background:'rgba(212,0,45,.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>
              {avatarError ? '👩‍🏫' : <img src="/images/portraits/tutor-hero.webp" loading="lazy" onError={() => setAvatarError(true)} style={{ width:28, height:28, borderRadius:'50%', objectFit:'cover' }} alt="" />}
            </div>
            <div style={{ padding:'10px 16px', background:'var(--card)', border:'1px solid var(--card-b)', borderRadius:'4px 16px 16px 16px', display:'flex', alignItems:'center', gap:5 }}>
              {[0,1,2].map(n => (
                <div key={n} style={{
                  width:7, height:7, borderRadius:'50%',
                  background:'var(--subtext)',
                  animation:`lt-dot 1.1s ease-in-out ${n * .18}s infinite`,
                }}/>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef}/>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div style={{
          margin:'0 16px 8px',
          padding:'10px 14px',
          background:'rgba(220,38,38,.08)', borderRadius:10,
          border:'1px solid rgba(220,38,38,.2)',
          fontSize:'var(--text-xs)', color:'var(--error)',
          display:'flex', alignItems:'center', gap:8,
        }}>
          <span>⚠️</span>
          <span style={{ flex:1 }}>{error}</span>
          <button onClick={() => setError(null)} aria-label="Dismiss error" style={{ background:'none', border:'none', cursor:'pointer', color:'var(--error)', fontWeight:800 }}>✕</button>
        </div>
      )}

      {/* ── Mic blocked banner (active session) ── */}
      {useFallbackInput && (micPermission === 'denied' || micPermission === 'unavailable') && (
        <div style={{
          margin:'0 16px 8px',
          padding:'10px 14px',
          borderRadius:10,
          background: micPermission === 'denied' ? 'rgba(220,38,38,.07)' : 'rgba(0,0,0,.04)',
          border: '1px solid ' + (micPermission === 'denied' ? 'rgba(220,38,38,.2)' : 'var(--card-b)'),
          fontSize:'var(--text-xs)', color:'var(--subtext)',
          display:'flex', alignItems:'center', gap:8,
        }}>
          <span>🎙️</span>
          <span style={{ flex:1 }}>
            {micPermission === 'denied'
              ? 'Microphone blocked — type your Croatian below. To enable voice, allow microphone access in your browser site settings and reload.'
              : 'No microphone detected — type your Croatian below.'}
          </span>
        </div>
      )}

      {/* ── Audio playback warning (active session) ── */}
      {showAudioWarning && (
        <div style={{
          margin:'0 16px 8px',
          padding:'10px 14px',
          borderRadius:10,
          background:'rgba(245,158,11,.08)',
          border:'1px solid rgba(245,158,11,.3)',
          fontSize:'var(--text-xs)', color:'#92400e',
          display:'flex', alignItems:'center', gap:8,
        }}>
          <span>🔇</span>
          <span style={{ flex:1 }}>Not hearing Marija? Check your volume, speaker, or headphone connection. Her replies are shown as text above.</span>
          <button onClick={() => setShowAudioWarning(false)} aria-label="Dismiss audio warning" style={{ background:'none', border:'none', cursor:'pointer', color:'#92400e', fontWeight:800, flexShrink:0 }}>✕</button>
        </div>
      )}

      {/* ── Controls bar ── */}
      <LiveTutorControls
        turnCount={turnCount}
        breakdownCount={breakdownCount}
        messages={messages}
        summaryLoading={summaryLoading}
        showGloss={showGloss}
        setShowGloss={setShowGloss}
        showMic={showMic}
        isRecording={isRecording}
        playing={playing}
        thinking={thinking}
        micBusy={micBusy}
        phase={phase}
        textInput={textInput}
        setTextInput={setTextInput}
        canType={canType}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        onEndSession={endSession}
        onTextSubmit={handleTextSubmit}
      />
    </div>
  );
}
