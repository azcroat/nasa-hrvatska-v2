import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiFetch } from '../../lib/apiFetch.js';

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const TOPICS = [
  "Free conversation",
  "At the café",
  "Greetings & introductions",
  "Family",
  "Directions",
  "Shopping",
  "Food & restaurants",
  "Weather & seasons",
];

const LEVELS = ["A1", "A2", "B1", "B2"];

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
  el.textContent = TUTOR_CSS;
  document.head.appendChild(el);
  cssInjected = true;
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function LiveTutorScreen({ goBack, award }) {
  injectCSS();

  // ── Settings ──────────────────────────────
  const [level, setLevel] = useState("A2");
  const [topic, setTopic] = useState(TOPICS[0]);
  const [started, setStarted] = useState(false);

  // ── Conversation state ────────────────────
  const [messages, setMessages] = useState([]);      // { role, content, gloss?, correction?, phase? }
  const [breakdownCount, setBreakdownCount] = useState(0);
  const [sessionHistory, setSessionHistory] = useState("");
  const [turnCount, setTurnCount] = useState(0);

  // ── Mic / STT state ───────────────────────
  const [isRecording, setIsRecording] = useState(false);
  const [useFallbackInput, setUseFallbackInput] = useState(false);
  const [textInput, setTextInput] = useState("");

  // ── Loading / error / playback state ─────
  const [thinking, setThinking] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(null);
  const [showGloss, setShowGloss] = useState(true);
  const [phase, setPhase] = useState("none");
  const [avatarError, setAvatarError] = useState(false);

  // ── Refs ──────────────────────────────────
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);
  const bottomRef = useRef(null);
  const apiMsgsRef = useRef([]);  // mirrors messages but only role+content for API calls

  // ── Auto-scroll ───────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  // ── Start session: send opening message ───
  const startSession = useCallback(async () => {
    setStarted(true);
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
        if (newTurn === 10) award(20);
      }

      // Play TTS (streaming)
      setThinking(false);
      await playTTSStreaming(fullCroatian);

    } catch (e) {
      setThinking(false);
      setError(e.message === "rate_limit"
        ? "Rate limit reached — wait a moment and try again."
        : e.message === "timeout"
        ? "Request timed out. Please try again."
        : "Connection error. Check your internet and try again.");
    }
  }, [level, topic, turnCount, award]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── TTS: blob fallback helper ──────────────
  const playBlob = async (blob) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audioRef.current = audio;
    await new Promise(resolve => { audio.onended = resolve; audio.play().catch(resolve); });
    URL.revokeObjectURL(url);
  };

  // ── TTS: streaming playback ────────────────
  const playTTSStreaming = async (text) => {
    setPlaying(true);
    try {
      const res = await apiFetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, slow: false, stream: true }),
      });
      if (!res.ok) throw new Error('tts_failed');

      // Check if browser supports MSE with audio/mpeg
      if (!window.MediaSource || !MediaSource.isTypeSupported('audio/mpeg')) {
        // Fallback: collect full response then play
        const blob = await res.blob();
        await playBlob(blob);
        setPlaying(false);
        return;
      }

      const mediaSource = new MediaSource();
      const audioEl = new Audio();
      audioEl.src = URL.createObjectURL(mediaSource);
      audioRef.current = audioEl;

      await new Promise(resolve => { mediaSource.addEventListener('sourceopen', resolve, { once: true }); });
      audioEl.play().catch(() => {}); // Start early — browser buffers while we feed data

      const sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg');
      const reader = res.body.getReader();

      const appendChunk = (chunk) => new Promise(resolve => {
        if (sourceBuffer.updating) {
          sourceBuffer.addEventListener('updateend', () => { sourceBuffer.appendBuffer(chunk); resolve(); }, { once: true });
        } else {
          sourceBuffer.appendBuffer(chunk);
          sourceBuffer.addEventListener('updateend', resolve, { once: true });
        }
      });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        await appendChunk(value);
      }

      await new Promise(resolve => { sourceBuffer.addEventListener('updateend', resolve, { once: true }); });
      mediaSource.endOfStream();

      await new Promise(resolve => { audioEl.onended = resolve; });
      URL.revokeObjectURL(audioEl.src);

    } catch {
      // Any MSE failure: fall back to non-streaming blob approach
      try {
        const res2 = await apiFetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, slow: false }),
        });
        const blob = await res2.blob();
        await playBlob(blob);
      } catch { /* silent fail — text still displayed */ }
    }
    setPlaying(false);
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
      const options = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? { mimeType: 'audio/webm;codecs=opus' }
        : MediaRecorder.isTypeSupported('audio/webm')
        ? { mimeType: 'audio/webm' }
        : {};
      const recorder = new MediaRecorder(stream, options);
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
    } catch {
      // Mic permission denied or not available — fall back to text input
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
    try {
      const res = await fetch('/api/stt', {
        method: 'POST',
        headers: { 'Content-Type': mimeType },
        body: blob,
      });
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
      setPhase('none');
    }
  }, [breakdownCount, sessionHistory, sendToTutor]);

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
      <div className="c" style={{ minHeight: '100vh', paddingBottom: 80 }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'16px 16px 0' }}>
          <button onClick={goBack} className="b bp" style={{ padding:'8px 14px', fontSize:'var(--text-sm)', fontWeight:700 }}>
            ← Back
          </button>
          <div>
            <div style={{ fontSize:'var(--text-lg)', fontWeight:900, color:'var(--heading)' }}>Live Croatian Tutor</div>
            <div style={{ fontSize:'var(--text-xs)', color:'var(--subtext)' }}>Speak Croatian with an adaptive AI tutor</div>
          </div>
        </div>

        {/* Avatar */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'28px 16px 20px' }}>
          <div style={{ position:'relative', width:110, height:110, marginBottom:16 }}>
            <div style={{
              position:'absolute', inset:0, borderRadius:'50%',
              background:'rgba(212,0,45,.12)',
              border:'2px solid rgba(212,0,45,.25)',
            }}/>
            {!avatarError
              ? <img
                  src="/images/portraits/tutor-hero.webp"
                  alt="Marija — your Croatian tutor"
                  onError={() => setAvatarError(true)}
                  style={{ width:110, height:110, borderRadius:'50%', objectFit:'cover', display:'block' }}
                />
              : <div style={{
                  width:110, height:110, borderRadius:'50%',
                  background:'rgba(212,0,45,.1)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:48,
                }}>👩‍🏫</div>
            }
          </div>
          <div style={{ fontSize:'var(--text-lg)', fontWeight:900, color:'var(--heading)' }}>Marija</div>
          <div style={{ fontSize:'var(--text-xs)', color:'var(--subtext)', marginTop:2 }}>Native Croatian speaker · Split</div>
          <div style={{ fontSize:'var(--text-xs)', color:'var(--subtext)', marginTop:4, textAlign:'center', maxWidth:260, lineHeight:1.5 }}>
            I'll speak Croatian with you, adapt to your level, and help you break through comprehension gaps.
          </div>
        </div>

        {/* Settings card */}
        <div style={{ margin:'0 16px', background:'var(--card)', borderRadius:16, border:'1px solid var(--card-b)', padding:'18px 16px' }}>
          {/* Level */}
          <div style={{ marginBottom:18 }}>
            <div style={{ fontSize:'var(--text-xs)', fontWeight:800, color:'var(--heading)', marginBottom:8, letterSpacing:'0.04em', textTransform:'uppercase' }}>Your Level</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
              {LEVELS.map(l => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  style={{
                    padding:'10px 4px',
                    borderRadius:10,
                    border: level === l ? '2px solid #D4002D' : '2px solid var(--card-b)',
                    background: level === l ? 'rgba(212,0,45,.08)' : 'var(--card)',
                    color: level === l ? '#D4002D' : 'var(--subtext)',
                    fontWeight: level === l ? 900 : 600,
                    fontSize:'var(--text-sm)',
                    cursor:'pointer',
                    transition:'all .15s',
                  }}
                >{l}</button>
              ))}
            </div>
          </div>

          {/* Topic */}
          <div>
            <div style={{ fontSize:'var(--text-xs)', fontWeight:800, color:'var(--heading)', marginBottom:8, letterSpacing:'0.04em', textTransform:'uppercase' }}>Conversation Topic</div>
            <select
              value={topic}
              onChange={e => setTopic(e.target.value)}
              style={{
                width:'100%', padding:'10px 12px',
                borderRadius:10, border:'1.5px solid var(--card-b)',
                background:'var(--card)', color:'var(--heading)',
                fontSize:'var(--text-sm)', fontWeight:600,
                cursor:'pointer',
              }}
            >
              {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Start button */}
        <div style={{ padding:'20px 16px 0' }}>
          <button
            onClick={startSession}
            style={{
              width:'100%', padding:'16px',
              borderRadius:14,
              background:'linear-gradient(135deg,#D4002D,#b91c1c)',
              color:'white', border:'none',
              fontSize:'var(--text-sm)', fontWeight:900,
              cursor:'pointer', letterSpacing:'0.02em',
              boxShadow:'0 4px 16px rgba(212,0,45,.35)',
            }}
          >
            Start Speaking with Marija
          </button>
        </div>
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
            ? <img src="/images/portraits/tutor-hero.webp" alt="Marija" onError={() => setAvatarError(true)}
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
                  {avatarError ? '👩‍🏫' : <img src="/images/portraits/tutor-hero.webp" onError={() => setAvatarError(true)} style={{ width:28, height:28, borderRadius:'50%', objectFit:'cover' }} alt="" />}
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
              {avatarError ? '👩‍🏫' : <img src="/images/portraits/tutor-hero.webp" onError={() => setAvatarError(true)} style={{ width:28, height:28, borderRadius:'50%', objectFit:'cover' }} alt="" />}
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
          <button onClick={() => setError(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--error)', fontWeight:800 }}>✕</button>
        </div>
      )}

      {/* ── Controls bar ── */}
      <div style={{
        padding:'10px 16px 16px',
        borderTop:'1px solid var(--card-b)',
        background:'var(--card)',
        flexShrink:0,
      }}>
        {/* Gloss toggle */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
          <div style={{ fontSize:'var(--text-xs)', color:'var(--subtext)' }}>
            Turn {turnCount} · Breakdown {breakdownCount}/3
          </div>
          <button
            onClick={() => setShowGloss(v => !v)}
            style={{
              padding:'4px 10px', borderRadius:20,
              background: showGloss ? 'rgba(99,102,241,.1)' : 'transparent',
              border: '1px solid ' + (showGloss ? 'rgba(99,102,241,.25)' : 'var(--card-b)'),
              color: showGloss ? '#6366f1' : 'var(--subtext)',
              fontSize:10, fontWeight:700, cursor:'pointer',
            }}
          >
            {showGloss ? '👁️ Gloss ON' : '👁️ Gloss OFF'}
          </button>
        </div>

        {showMic ? (
          /* ── Mic button (push-to-talk via Deepgram) ── */
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            <button
              onPointerDown={startRecording}
              onPointerUp={stopRecording}
              onPointerLeave={stopRecording}
              disabled={micBusy}
              style={{
                flex:1, padding:'14px 20px',
                borderRadius:14, border:'none',
                background: isRecording
                  ? 'var(--error, #D4002D)'
                  : playing
                  ? 'var(--subtext, #9ca3af)'
                  : micBusy
                  ? 'rgba(0,0,0,.08)'
                  : 'var(--info, #3b82f6)',
                color: (isRecording || playing || (!micBusy)) ? 'white' : 'var(--subtext)',
                fontSize:'var(--text-sm)', fontWeight:800,
                cursor: micBusy ? 'not-allowed' : 'pointer',
                transition:'all .15s',
                animation: isRecording ? 'lt-mic-glow 0.8s ease-in-out infinite' : 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                touchAction: 'none',
              }}
            >
              {playing
                ? '🔊 Listening...'
                : isRecording
                ? '🔴 Recording...'
                : thinking || phase === 'thinking'
                ? '⏳'
                : '🎙️ Hold to speak'}
            </button>
          </div>
        ) : null}

        {/* Text input fallback / supplement */}
        <form onSubmit={handleTextSubmit} style={{ display:'flex', gap:8, marginTop: showMic ? 0 : 0 }}>
          <input
            type="text"
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            placeholder={showMic ? "Or type your Croatian here…" : "Type your Croatian here…"}
            disabled={!canType}
            style={{
              flex:1, padding:'10px 14px',
              borderRadius:12, border:'1.5px solid var(--card-b)',
              background:'var(--card)', color:'var(--heading)',
              fontSize:'var(--text-sm)', opacity: canType ? 1 : 0.5,
            }}
          />
          <button
            type="submit"
            disabled={!canType || !textInput.trim()}
            className="b bg"
            style={{
              padding:'10px 16px', borderRadius:12,
              fontSize:'var(--text-sm)', fontWeight:800,
              opacity: (canType && textInput.trim()) ? 1 : 0.4,
              cursor: (canType && textInput.trim()) ? 'pointer' : 'not-allowed',
              flexShrink:0,
            }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
