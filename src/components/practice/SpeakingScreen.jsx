import React, { useState, useRef, useEffect } from 'react';
import { H, Bar, Spk, speakSlow } from '../../data.jsx';
import PronunciationScorer from '../shared/PronunciationScorer.jsx';
import { markQuest } from '../../lib/quests.js';
import { AIProgressBar } from '../shared/SkeletonLoader.jsx';

const SRSupported = typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

// Language codes to try in order — hr-HR is most accurate but least supported
const LANG_FALLBACKS = ['hr-HR', 'hr', 'en-US'];

// Map SpeechRecognition error codes to user-friendly messages
function srError(code) {
  switch (code) {
    case 'not-allowed':
    case 'permission-denied':
      return 'Microphone permission denied. Please allow microphone access in your browser settings and try again.';
    case 'no-speech':
      return "No speech detected. Please speak louder and closer to the mic.";
    case 'audio-capture':
      return 'No microphone found. Check that your microphone is connected and not in use by another app.';
    case 'network':
      return 'Network error. Speech recognition requires an internet connection.';
    case 'service-not-allowed':
      return 'Speech recognition is not available here. This feature requires HTTPS.';
    case 'aborted':
      return null; // user-initiated stop, no message needed
    default:
      return `Mic error (${code || 'unknown'}). Try again or use self-assessment below.`;
  }
}

// Score badge helpers — spec thresholds: 90+ excellent, 70+ good, 50+ keep practicing, <50 try again
function scoreBadgeColor(s) {
  if (s >= 90) return { bg: 'var(--success-bg)', border: 'var(--success-b)', text: 'var(--success)' };
  if (s >= 70) return { bg: '#fff7ed', border: '#fed7aa', text: '#c2410c' };
  if (s >= 50) return { bg: '#fff7ed', border: '#fed7aa', text: '#ea580c' };
  return { bg: '#fef2f2', border: '#fecaca', text: 'var(--error)' };
}
function scoreBadgeLabel(s) {
  if (s >= 90) return `🟢 Excellent! ${s}%`;
  if (s >= 70) return `🟡 Good! ${s}%`;
  if (s >= 50) return `🟠 Keep practicing ${s}%`;
  return `🔴 Try again ${s}%`;
}

export default function SpeakingScreen({ sw, si, sx, sr, ssc, sSr, sSx, sSw, sSsc, goBack, award, setSt }) {
  const [listening, setListening] = useState(false);
  const [recResult, setRecResult] = useState(null);
  const [recMsg, setRecMsg] = useState('');
  const [langIdx, setLangIdx] = useState(0);
  const recRef = useRef(null);
  const timeoutRef = useRef(null);
  const finishFired = useRef(false);

  // Voice recording state
  const mediaRecRef = useRef(null);
  const chunksRef = useRef([]);
  const [recordingURL, setRecordingURL] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  // Waveform visualization state
  const [waveform, setWaveform] = useState(new Array(30).fill(0));
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const streamRef = useRef(null);

  // AI pronunciation feedback state
  const [pronScore, setPronScore] = useState(null);

  // Per-word accuracy score from PronunciationScorer
  const [currentWordScore, setCurrentWordScore] = useState(null);

  // Session scores: array of { word: string, score: number }
  const [wordScores, setWordScores] = useState([]);

  // Results summary screen (shown before goBack after all words done)
  const [showSummary, setShowSummary] = useState(false);

  // Cleanup waveform on unmount — must be before early return to satisfy Rules of Hooks
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { return () => { stopWaveform(); }; }, []);

  if (!sw) return null;

  // Reset per-word score when word changes (called on Next)
  function advanceWord() {
    setRecordingURL(null);
    setRecResult(null);
    setRecMsg('');
    setListening(false);
    setCurrentWordScore(null);
    setPronScore(null);
    if (sx < si.length - 1) {
      const n = sx + 1;
      sSx(n);
      sSw(si[n]);
      sSr(null);
    } else {
      // All words done — show summary before awarding
      if (finishFired.current) return;
      finishFired.current = true;
      award(ssc * 5 + 5);
      markQuest('speak');
      setSt(s => ({ ...s, sp: s.sp + 1 }));
      setShowSummary(true);
    }
  }

  // Called by PronunciationScorer when it gets a result
  function handleScorerResult({ spoken, score }) {
    setCurrentWordScore({ spoken, score });
    // Record score for the current word
    setWordScores(prev => {
      // If we already have a score for this word index, update it (keep best)
      const existing = prev.find(ws => ws.word === sw[0]);
      if (existing) {
        return prev.map(ws => ws.word === sw[0] ? { ...ws, score: Math.max(ws.score, score) } : ws);
      }
      return [...prev, { word: sw[0], meaning: sw[1], score }];
    });
  }

  function stopRecording() {
    if (mediaRecRef.current && mediaRecRef.current.state === 'recording') {
      try { mediaRecRef.current.stop(); } catch(_) {}
    }
  }

  async function startWaveform() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      function draw() {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        const bars = Array.from({ length: 30 }, (_, i) => {
          const idx = Math.floor(i * dataArray.length / 30);
          return Math.round(dataArray[idx] / 255 * 100);
        });
        setWaveform(bars);
        animFrameRef.current = requestAnimationFrame(draw);
      }
      draw();
    } catch (e) {
      // Microphone not available — just show static bars
    }
  }

  function stopWaveform() {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    setWaveform(new Array(30).fill(0));
  }

  async function analyzePronunciation(transcript, targetWord) {
    if (!navigator.onLine) {
      setPronScore({ score: 0, match_quality: 'off', phonetic_tips: [], encouragement: "You're offline — pronunciation analysis needs a connection." });
      return;
    }
    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "convo",
          messages: [
            {
              role: "user",
              content: `Pronunciation analysis task:\nTarget Croatian word/phrase: "${targetWord}"\nWhat the learner said (as recognized by speech-to-text): "${transcript}"\n\nRate their pronunciation accuracy (0-100) and give specific phonetic tips.\nReturn ONLY JSON: {"score": 0-100, "match_quality": "exact|close|partial|off", "phonetic_tips": ["tip1","tip2"], "encouragement": "brief Croatian + English encouragement"}`,
            },
          ],
          params: {
            level: "B1",
            aiName: "Maja",
            aiRole: "pronunciation coach",
            context: "You are a Croatian pronunciation coach. Respond only with the JSON requested.",
          },
        }),
      });
      const data = await res.json();
      try {
        const parsed = JSON.parse(data.text);
        setPronScore(parsed);
      } catch {
        const isClose = transcript.toLowerCase().includes(targetWord.toLowerCase().slice(0, 3));
        setPronScore({
          score: isClose ? 70 : 40,
          match_quality: isClose ? 'close' : 'off',
          phonetic_tips: [],
          encouragement: "Pokušaj još jednom! / Try again!",
        });
      }
    } catch {
      setPronScore(null);
    }
  }

  function startRecognition(lIdx) {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SpeechRec();
    const lang = LANG_FALLBACKS[lIdx] || 'hr-HR';
    rec.lang = lang;
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 5;
    recRef.current = rec;
    setListening(true);
    setRecResult(null);
    setRecMsg('');

    // Auto-stop after 12 seconds to prevent infinite listening
    timeoutRef.current = setTimeout(() => {
      if (recRef.current) {
        try { recRef.current.stop(); } catch (_) {}
      }
      stopRecording();
      stopWaveform();
      setListening(false);
      setRecResult('timeout');
      setRecMsg('No speech detected within 12 seconds. Try again or use self-assessment.');
    }, 12000);

    rec.onresult = (e) => {
      clearTimeout(timeoutRef.current);
      stopRecording();
      stopWaveform();
      const alts = Array.from(e.results[0]).map(r => r.transcript.toLowerCase().trim());
      const target = sw[0].toLowerCase().trim();
      // Generous matching: exact, contains, or at least 60% character overlap
      const levenshteinClose = (a, b) => {
        if (!a || !b) return false;
        const longer = a.length > b.length ? a : b;
        const shorter = a.length > b.length ? b : a;
        if (longer.length === 0) return true;
        const shared = shorter.split('').filter(c => longer.includes(c)).length;
        return shared / longer.length >= 0.6;
      };
      const matched = alts.some(a =>
        a === target ||
        a.includes(target) ||
        target.includes(a) ||
        levenshteinClose(a, target)
      );
      setRecResult(matched ? 'match' : 'nomatch');
      setListening(false);
      if (matched) { sSr('ok'); sSsc(s => s + 1); }
      // Analyze pronunciation with AI using the best transcript
      analyzePronunciation(alts[0] || '', sw[0]);
    };

    rec.onerror = (e) => {
      clearTimeout(timeoutRef.current);
      stopRecording();
      stopWaveform();
      const code = e.error || e.type || '';
      // If language not supported, try next fallback
      if ((code === 'language-not-supported' || code === 'service-not-allowed') && lIdx < LANG_FALLBACKS.length - 1) {
        setLangIdx(lIdx + 1);
        startRecognition(lIdx + 1);
        return;
      }
      const msg = srError(code);
      setListening(false);
      if (msg) {
        setRecResult('error');
        setRecMsg(msg);
      } else {
        setRecResult(null);
      }
    };

    rec.onend = () => {
      clearTimeout(timeoutRef.current);
      stopRecording();
      stopWaveform();
      setListening(false);
    };

    try {
      rec.start();
    } catch (e) {
      clearTimeout(timeoutRef.current);
      stopRecording();
      setListening(false);
      setRecResult('error');
      setRecMsg('Could not start microphone. Try refreshing the page.');
    }
  }

  async function startMic() {
    if (!SRSupported) return;
    setRecordingURL(null);
    setPronScore(null);
    chunksRef.current = [];

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop()); // permission check only - stop immediately
    } catch (e) {
      setRecResult('error');
      setRecMsg('Microphone permission denied. Please allow microphone access in your browser settings and try again.');
      return;
    }

    // Start fresh stream for recording
    try {
      const recordStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRec = new MediaRecorder(recordStream);
      mediaRecRef.current = mediaRec;
      setIsRecording(true);

      mediaRec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordingURL(URL.createObjectURL(blob));
        setIsRecording(false);
        recordStream.getTracks().forEach(t => t.stop());
      };

      mediaRec.start();
    } catch(_) {
      // If MediaRecorder fails, continue without recording (speech recognition still works)
    }

    startWaveform();
    startRecognition(langIdx);
  }

  function stopMic() {
    clearTimeout(timeoutRef.current);
    if (recRef.current) { try { recRef.current.stop(); } catch (_) {} }
    stopRecording();
    stopWaveform();
    setListening(false);
  }

  const currentLang = LANG_FALLBACKS[langIdx];

  // ── Summary screen ────────────────────────────────────────────────────────
  if (showSummary) {
    const scored = wordScores;
    const avg = scored.length > 0
      ? Math.round(scored.reduce((sum, ws) => sum + ws.score, 0) / scored.length)
      : null;
    const best = scored.length > 0
      ? scored.reduce((b, ws) => ws.score > b.score ? ws : b, scored[0])
      : null;
    const worst = scored.length > 0
      ? scored.reduce((b, ws) => ws.score < b.score ? ws : b, scored[0])
      : null;

    return (
      <div className="scr-wrap">
        {H('🎤 Pronunciation Results')}
        <div className="c" style={{ textAlign: 'center', marginTop: 16 }}>

          {/* Average score badge */}
          {avg !== null && (
            <div style={{
              display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
              marginBottom: 20, padding: '18px 28px',
              background: avg >= 90 ? 'var(--success-bg)' : avg >= 70 ? '#fff7ed' : avg >= 50 ? '#fff7ed' : '#fef2f2',
              border: `2px solid ${avg >= 90 ? 'var(--success-b)' : avg >= 70 ? '#fed7aa' : avg >= 50 ? '#fdba74' : '#fecaca'}`,
              borderRadius: 18,
            }}>
              <div style={{
                fontSize: 'var(--text-4xl)', fontWeight: 900,
                color: avg >= 90 ? 'var(--success)' : avg >= 70 ? '#c2410c' : avg >= 50 ? '#ea580c' : 'var(--error)',
              }}>{avg}%</div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--subtext)', marginTop: 4 }}>
                Average pronunciation score
              </div>
              <div style={{ fontSize: 'var(--text-base)', fontWeight: 800, marginTop: 6 }}>
                {avg >= 90 ? '🟢 Excellent session!' : avg >= 70 ? '🟡 Good work!' : avg >= 50 ? '🟠 Keep practicing!' : '🔴 Keep at it!'}
              </div>
            </div>
          )}

          {/* Highlights */}
          {best && worst && best.word !== worst.word && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', justifyContent: 'center' }}>
              <div style={{
                flex: 1, minWidth: 130, padding: '12px 14px', borderRadius: 14,
                background: 'var(--success-bg)', border: '1.5px solid var(--success-b)',
              }}>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 800, color: 'var(--success)', marginBottom: 4 }}>
                  ⭐ Best word
                </div>
                <div style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--heading)' }}>{best.word}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)' }}>{best.meaning}</div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--success)', marginTop: 4 }}>{best.score}%</div>
              </div>
              <div style={{
                flex: 1, minWidth: 130, padding: '12px 14px', borderRadius: 14,
                background: '#fef2f2', border: '1.5px solid #fecaca',
              }}>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 800, color: 'var(--error)', marginBottom: 4 }}>
                  📚 Needs work
                </div>
                <div style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--heading)' }}>{worst.word}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)' }}>{worst.meaning}</div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--error)', marginTop: 4 }}>{worst.score}%</div>
              </div>
            </div>
          )}

          {/* Per-word breakdown */}
          {scored.length > 0 && (
            <div style={{
              background: 'var(--card)', borderRadius: 14, border: '1.5px solid var(--card-b)',
              overflow: 'hidden', marginBottom: 20, textAlign: 'left',
            }}>
              <div style={{
                padding: '10px 16px', background: 'var(--bar-bg)',
                fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--heading)',
                borderBottom: '1px solid var(--card-b)',
              }}>
                Word-by-word breakdown
              </div>
              {scored.map((ws, idx) => {
                const colors = scoreBadgeColor(ws.score);
                return (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 16px',
                    borderBottom: idx < scored.length - 1 ? '1px solid var(--card-b)' : 'none',
                  }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                      background: colors.bg, border: `2px solid ${colors.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 900, color: colors.text,
                    }}>{ws.score}%</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 'var(--text-base)', color: 'var(--heading)' }}>{ws.word}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)' }}>{ws.meaning}</div>
                    </div>
                    <div style={{
                      fontSize: 'var(--text-xs)', fontWeight: 800, color: colors.text,
                      background: colors.bg, border: `1px solid ${colors.border}`,
                      borderRadius: 8, padding: '3px 8px', whiteSpace: 'nowrap',
                    }}>
                      {scoreBadgeLabel(ws.score)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* No scores — all self-assessed */}
          {scored.length === 0 && (
            <div style={{
              fontSize: 'var(--text-sm)', color: 'var(--subtext)', marginBottom: 20,
              padding: '14px', background: 'var(--bar-bg)', borderRadius: 12,
              border: '1.5px solid var(--card-b)',
            }}>
              No pronunciation scores recorded. Use "Test My Pronunciation" on the next session to see your accuracy!
            </div>
          )}

          <button className="b bp" onClick={() => goBack()}>
            Done ✓
          </button>
        </div>
      </div>
    );
  }

  // ── Main speaking screen ───────────────────────────────────────────────────
  return (
    <div className="scr-wrap">
      {H('🎤 Pronunciation Practice')}
      <Bar v={sx + 1} mx={si.length} color="var(--success)" h={6} />
      <div className="c" style={{textAlign:'center', marginTop:16}}>
        {/* Tutor portrait — Maja guides the session */}
        <div style={{display:'flex', alignItems:'center', gap:12, justifyContent:'center', marginBottom:18}}>
          <div style={{
            width:52, height:52, borderRadius:'50%', overflow:'hidden', flexShrink:0,
            border: listening ? '3px solid var(--success)' : '2.5px solid #e0f2fe',
            boxShadow: listening ? '0 0 0 5px rgba(14,116,144,.18)' : '0 0 0 2px rgba(14,116,144,.1)',
            transition:'border-color .3s ease, box-shadow .3s ease',
            background:'linear-gradient(135deg,#0e7490,#0c4a6e)',
          }}>
            <img src="/images/portraits/tutor-hero.webp" alt="Maja"
              loading="lazy"
              style={{width:'100%', height:'100%', objectFit:'cover'}}
              onError={e => { e.currentTarget.style.display='none'; }} />
          </div>
          <div style={{textAlign:'left'}}>
            <div style={{fontSize:'var(--text-sm)', fontWeight:800, color:'var(--heading)', lineHeight:1.2}}>Maja</div>
            <div style={{fontSize:'var(--text-xs)', color:'var(--subtext)'}}>Croatian tutor</div>
            {listening && <div style={{fontSize:'var(--text-xs)', color:'var(--success)', fontWeight:700, marginTop:2}}>listening…</div>}
          </div>
        </div>

        {/* Waveform visualizer */}
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: 3, height: 52,
          justifyContent: 'center', marginBottom: 12,
          padding: '0 16px',
        }}>
          {waveform.map((h, i) => (
            <div key={i} style={{
              width: 6, borderRadius: 3,
              height: Math.max(4, listening ? h * 0.52 : 4) + 'px',
              background: listening
                ? `hsl(${160 + h * 0.5}, 70%, ${40 + h * 0.2}%)`
                : 'var(--card-b)',
              transition: 'height 0.05s ease',
              flexShrink: 0,
            }} />
          ))}
        </div>

        <p style={{fontSize:'var(--text-4xl)', fontWeight:800, fontFamily:"'Playfair Display',serif"}}>{sw[0]}</p>
        {sw[2] && <p style={{fontSize:'var(--text-base)', color:'var(--subtext)', marginBottom:4}}>/{sw[2]}/</p>}
        <p style={{fontSize:'var(--text-lg)', color:'var(--body)', marginBottom:16}}>{sw[1]}</p>
        <div style={{display:'flex', gap:8, justifyContent:'center', marginBottom:16, flexWrap:'wrap'}}>
          <Spk text={sw[0]} label="Normal" />
          <button
            onClick={() => speakSlow(sw[0])}
            style={{background:'var(--success-bg)', border:'1px solid var(--success-b)', borderRadius:10, padding:'7px 12px', cursor:'pointer', fontSize:'var(--text-sm)', color:'var(--success)', fontWeight:700}}>
            🐢 Slow
          </button>
        </div>

        {/* Pronunciation scorer with onScore wired to session tracking */}
        {SRSupported ? (
          <PronunciationScorer targetText={sw[0]} onScore={handleScorerResult} />
        ) : (
          <div style={{fontSize:'var(--text-sm)', color:'var(--subtext)', marginBottom:8, padding:'10px 14px', background:'var(--bar-bg)', borderRadius:12, border:'1.5px solid var(--card-b)'}}>
            💡 Tap ✓ if you said it correctly
          </div>
        )}

        {/* Per-word score badge shown after PronunciationScorer fires */}
        {currentWordScore !== null && (
          <div style={{
            marginTop: 10, padding: '10px 16px', borderRadius: 12,
            background: scoreBadgeColor(currentWordScore.score).bg,
            border: `1.5px solid ${scoreBadgeColor(currentWordScore.score).border}`,
            fontWeight: 800, fontSize: 'var(--text-base)',
            color: scoreBadgeColor(currentWordScore.score).text,
          }}>
            {scoreBadgeLabel(currentWordScore.score)}
          </div>
        )}

        {SRSupported ? (
          <div style={{marginBottom:16, marginTop:16}}>
            <button
              onClick={listening ? stopMic : startMic}
              style={{
                background: listening ? 'var(--error)' : 'var(--success-bg)',
                border: `1.5px solid ${listening ? 'var(--error)' : 'var(--success-b)'}`,
                borderRadius: 12, padding: '10px 20px', cursor: 'pointer', fontSize: 'var(--text-base)',
                color: listening ? '#fff' : 'var(--success)', fontWeight: 800,
                animation: listening ? 'pulse 1s infinite' : undefined,
                boxShadow: listening ? '0 0 0 4px rgba(239,68,68,.2)' : undefined,
              }}>
              {listening ? '🔴 Listening… (tap to stop)' : '🎙️ Tap to Speak'}
            </button>
            {listening && (
              <div style={{fontSize:'var(--text-sm)', color:'var(--subtext)', marginTop:6, animation:'pulse 1.5s infinite'}}>
                Speak "{sw[0]}" into your mic…
              </div>
            )}
            {recResult === 'match' && (
              <div style={{color:'var(--success)', fontSize:'var(--text-md)', fontWeight:800, marginTop:10, padding:'10px', background:'var(--success-bg)', borderRadius:12, border:'1.5px solid var(--success-b)'}}>
                🎯 Great pronunciation match!
              </div>
            )}
            {recResult === 'nomatch' && (
              <div style={{color:'var(--warning)', fontSize:'var(--text-base)', fontWeight:600, marginTop:10, padding:'10px', background:'var(--warning-bg)', borderRadius:12, border:'1.5px solid var(--warning-b)'}}>
                Close! Try again or use self-assessment below.
              </div>
            )}
            {(recResult === 'error' || recResult === 'timeout') && recMsg && (
              <div style={{color:'var(--subtext)', fontSize:'var(--text-sm)', marginTop:10, padding:'10px 14px', background:'var(--bar-bg)', borderRadius:12, border:'1.5px solid var(--card-b)', textAlign:'left', lineHeight:1.5}}>
                ⚠️ {recMsg}
              </div>
            )}
            {langIdx > 0 && (
              <div style={{fontSize:'var(--text-xs)', color:'var(--subtext)', marginTop:6}}>
                Using {currentLang} recognition
              </div>
            )}

            {/* AI pronunciation score loading indicator */}
            {recResult && recResult !== 'error' && recResult !== 'timeout' && !pronScore && (
              <AIProgressBar phase="processing" messages={['Analyzing your pronunciation…', 'Comparing with native Croatian…', 'Almost done…']} />
            )}

            {/* AI pronunciation score */}
            {pronScore && (
              <div className="c" style={{
                padding: '12px 16px', marginTop: 8,
                borderLeft: `4px solid ${pronScore.score >= 80 ? 'var(--success)' : pronScore.score >= 60 ? 'var(--info)' : 'var(--error)'}`,
                animation: 'fadeIn .3s ease',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                    background: pronScore.score >= 80 ? 'var(--success-bg)' : pronScore.score >= 60 ? 'var(--info-bg)' : 'var(--error-bg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22,
                  }}>
                    {pronScore.score >= 80 ? '🌟' : pronScore.score >= 60 ? '👍' : '🎯'}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--heading)' }}>
                      Pronunciation: {pronScore.score}/100
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--subtext)' }}>
                      {pronScore.match_quality === 'exact' ? 'Perfect match!'
                       : pronScore.match_quality === 'close' ? 'Very close!'
                       : pronScore.match_quality === 'partial' ? 'Getting there'
                       : 'Keep practicing'}
                    </div>
                  </div>
                </div>
                {pronScore.phonetic_tips?.length > 0 && (
                  <div style={{ fontSize: 13, color: 'var(--subtext)', lineHeight: 1.6 }}>
                    💡 {pronScore.phonetic_tips[0]}
                  </div>
                )}
                {pronScore.encouragement && (
                  <div style={{ fontSize: 13, color: 'var(--success)', fontWeight: 600, marginTop: 6 }}>
                    {pronScore.encouragement}
                  </div>
                )}
              </div>
            )}

            {recordingURL && (
              <div style={{
                marginTop:16, padding:'14px 16px',
                background:'var(--card)', borderRadius:14,
                border:'1.5px solid var(--inp-b)',
              }}>
                <div style={{fontSize:'var(--text-sm)', fontWeight:800, color:'var(--heading)', marginBottom:10}}>
                  🎧 Compare your pronunciation:
                </div>
                <div style={{marginBottom:8}}>
                  <div style={{fontSize:'var(--text-xs)', color:'var(--subtext)', fontWeight:700, marginBottom:4}}>You:</div>
                  <audio src={recordingURL} controls style={{width:'100%', height:36}} />
                </div>
                <div style={{marginBottom:12}}>
                  <div style={{fontSize:'var(--text-xs)', color:'var(--subtext)', fontWeight:700, marginBottom:4}}>Native speaker:</div>
                  <Spk text={sw[0]} label="▶ Play native" />
                </div>
                <button
                  onClick={() => {
                    setRecordingURL(null);
                    setRecResult(null);
                    setRecMsg('');
                    setListening(false);
                  }}
                  style={{
                    width:'100%', padding:'8px', borderRadius:10, border:'1.5px solid var(--inp-b)',
                    background:'none', cursor:'pointer', fontSize:'var(--text-sm)', fontWeight:700,
                    color:'var(--subtext)', fontFamily:"'Outfit',sans-serif",
                  }}
                >
                  🔄 Record again
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{fontSize:'var(--text-sm)', color:'var(--subtext)', marginBottom:16, padding:'10px 14px', background:'var(--bar-bg)', borderRadius:12, border:'1.5px solid var(--card-b)'}}>
            Speech recognition is not supported in this browser. Use the self-assessment button below, or try Chrome on desktop/Android.
          </div>
        )}

        <button className="b bs" onClick={() => { sSr('ok'); sSsc(s => s + 1); }}>
          👍 I Said It Correctly!
        </button>
        {sr === 'ok' && <div style={{color:'var(--success)', fontSize:'var(--text-xl)', fontWeight:800, marginTop:12}}>✓ Great pronunciation!</div>}
        {sr === 'ok' && (
          <button
            className="b bp"
            style={{marginTop:16}}
            onClick={advanceWord}>
            {sx < si.length - 1 ? 'Next →' : 'Finish'}
          </button>
        )}
      </div>
    </div>
  );
}
