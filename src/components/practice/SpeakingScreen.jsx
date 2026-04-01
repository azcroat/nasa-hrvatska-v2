import React, { useState, useRef, useEffect } from 'react';
import { H, Bar } from '../../data.jsx';
import { markQuest } from '../../lib/quests.js';
import SpeakingSummaryScreen from './SpeakingSummaryScreen.jsx';
import SpeakingPracticePanel from './SpeakingPracticePanel.jsx';
import { knightSpeak } from '../../lib/knightSpeak.js';

const SRSupported = typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

const SPEAKING_TIPS = [
  { mood: 'encouraging', text: 'Your accent doesn\'t need to be perfect — it needs to be understood. Speak boldly. 🎙️' },
  { mood: 'happy',       text: 'Every Croatian will appreciate you trying. Speak, don\'t overthink. ⚔️' },
  { mood: 'ready',       text: 'Croats speak with passion. Match that energy — say each phrase like you mean it. 🇭🇷' },
  { mood: 'thinking',    text: 'Speaking tip: exhale slightly before each phrase. Relaxed breath, cleaner sound. 🌊' },
];

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
  const recordStreamRef = useRef(null); // keep track of stream to stop on unmount
  const recordingURLRef = useRef(null); // keep URL for revoke on unmount
  const [recordingURL, setRecordingURL] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  // Waveform visualization state
  const [waveform, setWaveform] = useState(new Array(30).fill(0));
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);

  // AI pronunciation feedback state
  const [pronScore, setPronScore] = useState(null);

  // Per-word accuracy score from PronunciationScorer
  const [currentWordScore, setCurrentWordScore] = useState(null);

  // Session scores: array of { word: string, score: number }
  const [wordScores, setWordScores] = useState([]);

  // Results summary screen (shown before goBack after all words done)
  const [showSummary, setShowSummary] = useState(false);

  // Knight coaching — entry tip on mount
  useEffect(() => {
    const tip = SPEAKING_TIPS[Math.floor(Math.random() * SPEAKING_TIPS.length)];
    knightSpeak(tip.mood, tip.text, 1000);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount — must be before early return to satisfy Rules of Hooks
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { return () => {
    clearTimeout(timeoutRef.current);
    if (recRef.current) {
      try { recRef.current.onresult = null; recRef.current.onerror = null; recRef.current.onend = null; recRef.current.abort(); } catch (_) {}
      recRef.current = null;
    }
    stopWaveform();
    if (recordStreamRef.current) { recordStreamRef.current.getTracks().forEach(t => t.stop()); recordStreamRef.current = null; }
    if (recordingURLRef.current) { URL.revokeObjectURL(recordingURLRef.current); recordingURLRef.current = null; }
  }; }, []);

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
      if (typeof award === 'function') award(ssc * 5 + 5);
      markQuest('speak');
      setSt(s => ({ ...s, sp: s.sp + 1 }));
      setShowSummary(true);
    }
  }

  // Called by PronunciationScorer when it gets a result.
  // If score >= 60, auto-mark the word as done so "Next →" appears immediately —
  // previously users had to also tap "I Said It Correctly!" as a second step.
  function handleScorerResult({ spoken, score }) {
    setCurrentWordScore({ spoken, score });
    setWordScores(prev => {
      const existing = prev.find(ws => ws.word === sw[0]);
      if (existing) {
        return prev.map(ws => ws.word === sw[0] ? { ...ws, score: Math.max(ws.score, score) } : ws);
      }
      return [...prev, { word: sw[0], meaning: sw[1], score }];
    });
    // Auto-advance sr state when pronunciation is good enough (≥60 = close enough)
    if (score >= 60 && sr !== 'ok') {
      sSr('ok');
      sSsc(s => s + 1);
    }
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
      audioCtxRef.current = audioCtx;
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
    if (audioCtxRef.current) { audioCtxRef.current.close().catch(() => {}); audioCtxRef.current = null; }
    setWaveform(new Array(30).fill(0));
  }

  async function analyzePronunciation(transcript, targetWord) {
    // Fallback score used whenever API is unavailable or returns garbage.
    // pronScore must ALWAYS be set to a non-null value — leaving it null
    // keeps the AIProgressBar visible forever.
    const isClose = transcript.toLowerCase().includes(targetWord.toLowerCase().slice(0, 3));
    const fallback = {
      score: isClose ? 68 : 38,
      match_quality: isClose ? 'close' : 'off',
      phonetic_tips: [],
      encouragement: isClose ? 'Blizu! / Close!' : 'Pokušaj još jednom! / Try again!',
    };

    if (!navigator.onLine) {
      setPronScore({ ...fallback, encouragement: "Offline — pronunciation analysis needs a connection." });
      return;
    }

    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 7000); // 7s max — never block UI

    try {
      const res = await fetch("/api/pronunciation-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: targetWord, spoken: transcript, score: 50, level: "B1" }),
        signal: controller.signal,
      });
      clearTimeout(tid);
      if (!res.ok) { setPronScore(fallback); return; }
      const data = await res.json();
      if (data && data.feedback) {
        setPronScore({
          score: 70,
          match_quality: 'close',
          phonetic_tips: (data.drills || []).map(d => d.tip).filter(Boolean),
          encouragement: data.feedback,
        });
      } else {
        setPronScore(fallback);
      }
    } catch {
      clearTimeout(tid);
      setPronScore(fallback); // network/timeout/abort → always resolve, never hang
    }
  }

  function startRecognition(lIdx) {
    if (recRef.current) {
      try { recRef.current.abort(); } catch (_) {}
      recRef.current.onresult = null;
      recRef.current.onerror = null;
      recRef.current.onend = null;
      recRef.current = null;
    }
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
      recordStreamRef.current = recordStream;
      const recMimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';
      const mediaRec = new MediaRecorder(recordStream, recMimeType ? { mimeType: recMimeType } : {});
      mediaRecRef.current = mediaRec;
      setIsRecording(true);

      mediaRec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mediaRec.mimeType || 'audio/webm' });
        // Revoke any previous recording URL before creating a new one
        if (recordingURLRef.current) { URL.revokeObjectURL(recordingURLRef.current); }
        const url = URL.createObjectURL(blob);
        recordingURLRef.current = url;
        setRecordingURL(url);
        setIsRecording(false);
        recordStreamRef.current = null;
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
    return <SpeakingSummaryScreen wordScores={wordScores} onDone={() => goBack()} />;
  }

  // ── Main speaking screen ───────────────────────────────────────────────────
  return (
    <div className="scr-wrap">
      {H('🎤 Pronunciation Practice', '', goBack)}
      <Bar v={sx + 1} mx={si.length} color="var(--success)" h={6} />
      <SpeakingPracticePanel
        sw={sw}
        si={si}
        sx={sx}
        sr={sr}
        listening={listening}
        recResult={recResult}
        recMsg={recMsg}
        langIdx={langIdx}
        currentLang={currentLang}
        waveform={waveform}
        pronScore={pronScore}
        currentWordScore={currentWordScore}
        recordingURL={recordingURL}
        onStartMic={startMic}
        onStopMic={stopMic}
        onSelfAssess={() => { sSr('ok'); sSsc(s => s + 1); }}
        onAdvanceWord={advanceWord}
        onClearRecording={() => {
          if (recordingURLRef.current) { URL.revokeObjectURL(recordingURLRef.current); recordingURLRef.current = null; }
          setRecordingURL(null);
          setRecResult(null);
          setRecMsg('');
          setListening(false);
        }}
        onScore={handleScorerResult}
      />
    </div>
  );
}
