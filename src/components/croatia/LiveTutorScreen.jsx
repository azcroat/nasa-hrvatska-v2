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
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [sttSupported, setSttSupported] = useState(true);
  const [textInput, setTextInput] = useState("");

  // ── Loading / error state ─────────────────
  const [thinking, setThinking] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(null);
  const [showGloss, setShowGloss] = useState(true);
  const [phase, setPhase] = useState("none");
  const [avatarError, setAvatarError] = useState(false);

  // ── Refs ──────────────────────────────────
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);
  const bottomRef = useRef(null);
  const apiMsgsRef = useRef([]);  // mirrors messages but only role+content for API calls

  // ── Check STT support ─────────────────────
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) setSttSupported(false);
  }, []);

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

      // Play TTS
      setThinking(false);
      await playTTS(fullCroatian);

    } catch (e) {
      setThinking(false);
      setError(e.message === "rate_limit"
        ? "Rate limit reached — wait a moment and try again."
        : e.message === "timeout"
        ? "Request timed out. Please try again."
        : "Connection error. Check your internet and try again.");
    }
  }, [level, topic, turnCount, award]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── TTS playback ──────────────────────────
  const playTTS = async (text) => {
    try {
      setPlaying(true);
      const res = await apiFetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, slow: false }),
      });
      if (!res.ok) throw new Error("TTS failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current._blobUrl || "");
      }
      const audio = new Audio(url);
      audio._blobUrl = url;
      audioRef.current = audio;
      audio.onended = () => {
        setPlaying(false);
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => setPlaying(false);
      await audio.play();
    } catch {
      setPlaying(false);
      // TTS failure is non-fatal — conversation continues
    }
  };

  // ── STT: start listening ───────────────────
  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    // Stop any existing instance
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
    }
    if (audioRef.current) {
      audioRef.current.pause();
      setPlaying(false);
    }

    const rec = new SR();
    rec.lang = 'hr-HR';
    rec.continuous = false;
    rec.interimResults = false;

    rec.onstart = () => setListening(true);
    rec.onend   = () => { setListening(false); setInterim(""); };
    rec.onerror = (e) => {
      setListening(false);
      setInterim("");
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        setError("Microphone error: " + e.error);
      }
    };
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript.trim();
      if (transcript) {
        sendToTutor(transcript, breakdownCount, sessionHistory);
      }
    };

    recognitionRef.current = rec;
    try {
      rec.start();
    } catch {
      setError("Could not start microphone. Check browser permissions.");
    }
  }, [breakdownCount, sessionHistory, sendToTutor]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
  }, []);

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
      if (recognitionRef.current) try { recognitionRef.current.abort(); } catch {}
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

        {/* STT notice */}
        {!sttSupported && (
          <div style={{ margin:'12px 16px', padding:'10px 14px', background:'rgba(245,158,11,.08)', borderRadius:10, border:'1px solid rgba(245,158,11,.2)', fontSize:'var(--text-xs)', color:'#92400e' }}>
            Your browser doesn't support voice input — you'll use text input instead. Chrome on desktop/Android works best for voice.
          </div>
        )}

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
  const canSpeak = !thinking && !playing && sttSupported;
  const canType  = !thinking && !playing;

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

        {sttSupported ? (
          /* ── Mic button layout ── */
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {/* Mic button */}
            <button
              onClick={listening ? stopListening : startListening}
              disabled={thinking || playing}
              style={{
                width:56, height:56, borderRadius:'50%',
                background: listening
                  ? 'linear-gradient(135deg,#D4002D,#b91c1c)'
                  : canSpeak
                  ? 'rgba(212,0,45,.1)'
                  : 'rgba(0,0,0,.05)',
                border: listening
                  ? '2px solid #D4002D'
                  : '2px solid rgba(212,0,45,.3)',
                color: listening ? 'white' : canSpeak ? '#D4002D' : 'var(--subtext)',
                fontSize:22, cursor: canSpeak ? 'pointer' : 'not-allowed',
                display:'flex', alignItems:'center', justifyContent:'center',
                flexShrink:0, transition:'all .15s',
                animation: listening ? 'lt-mic-glow 1.4s ease-in-out infinite' : 'none',
                boxShadow: listening ? '0 4px 18px rgba(212,0,45,.4)' : 'none',
              }}
            >
              {listening ? '⏹' : playing ? '🔊' : thinking ? '⏳' : '🎙️'}
            </button>

            <div style={{ flex:1 }}>
              {listening ? (
                <div style={{ fontSize:'var(--text-sm)', color:'#D4002D', fontWeight:700, animation:'lt-mic-glow 1.4s ease-in-out infinite' }}>
                  Listening… tap to stop
                </div>
              ) : playing ? (
                <div style={{ fontSize:'var(--text-sm)', color:'var(--info)', fontWeight:700 }}>
                  Marija is speaking…
                </div>
              ) : thinking ? (
                <div style={{ fontSize:'var(--text-sm)', color:'var(--subtext)' }}>
                  Thinking…
                </div>
              ) : (
                <div style={{ fontSize:'var(--text-xs)', color:'var(--subtext)', lineHeight:1.4 }}>
                  Tap the mic to speak in Croatian
                  <br/>or type below
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Text input fallback / supplement */}
        <form onSubmit={handleTextSubmit} style={{ display:'flex', gap:8, marginTop: sttSupported ? 10 : 0 }}>
          <input
            type="text"
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            placeholder={sttSupported ? "Or type your Croatian here…" : "Type your Croatian here…"}
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
