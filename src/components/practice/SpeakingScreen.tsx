import React, { useState, useRef, useEffect } from 'react';
import { useStats } from '../../context/StatsContext.tsx';
import { H, Bar } from '../../data';
import { markQuest } from '../../lib/quests.js';
import SpeakingSummaryScreen from './SpeakingSummaryScreen';
import SpeakingPracticePanel from './SpeakingPracticePanel';
import MicPermissionDeniedExplainer from '../shared/MicPermissionDeniedExplainer';
import { knightSpeak } from '../../lib/knightSpeak.js';
import { useAndroidMicPermission } from '../../hooks/useAndroidMicPermission';
import { isNative } from '../../lib/platform.js';
import { apiFetch } from '../../lib/apiFetch.js';
import { recordTopicResult } from '../../lib/adaptive.js';
import { charOverlapPct } from '../../lib/text/similarity';

// ── Open-ended speaking prompt pools ──────────────────────────────────────────
// Format: [Croatian text, English instruction, type, ?imageKey]
export const QUESTION_RESPONSE_PROMPTS: string[][] = [
  ['Što si radio/radila prošlog vikenda?', 'What did you do last weekend?', 'question-response'],
  ['Kako provodiš slobodno vrijeme?', 'How do you spend your free time?', 'question-response'],
  [
    'Koji je tvoj omiljeni godišnji odmor i zašto?',
    'What is your favorite holiday and why?',
    'question-response',
  ],
  ['Opiši svoju idealnu karijeru.', 'Describe your ideal career.', 'question-response'],
  [
    'Što misliš o klimatskim promjenama?',
    'What do you think about climate change?',
    'question-response',
  ],
  ['Opišite grad u kojemu živite.', 'Describe the city where you live.', 'question-response'],
  [
    'Koja je tvoja najdraža knjiga i zašto?',
    'What is your favorite book and why?',
    'question-response',
  ],
  [
    'Kako bi opisao/opisala svog najboljeg prijatelja?',
    'How would you describe your best friend?',
    'question-response',
  ],
];

export const PICTURE_DESCRIPTION_PROMPTS: string[][] = [
  [
    'Opišite ovu sliku na hrvatskom. Što vidite?',
    'Describe this image in Croatian. What do you see?',
    'picture-description',
    'dubrovnik-ai',
  ],
  [
    'Što se događa na ovoj slici? Opišite detaljno.',
    'What is happening in this image? Describe in detail.',
    'picture-description',
    'dalmatian-coast',
  ],
  [
    'Opišite prirodu na ovoj fotografiji.',
    'Describe the nature in this photograph.',
    'picture-description',
    'plitvice',
  ],
  [
    'Što vidite u ovom gradu? Koji detalji vam privlače pažnju?',
    'What do you see in this city? What details catch your attention?',
    'picture-description',
    'zagreb',
  ],
  [
    'Opišite hranu na ovoj slici. Što prepoznajete?',
    'Describe the food in this image. What do you recognize?',
    'picture-description',
    'croatian-food',
  ],
];

export const DIALOGUE_COMPLETION_PROMPTS: string[][] = [
  [
    'A: "Hej, kako si?"\nB: "Super, hvala. A ti?"',
    'Continue: A asks "Hey, how are you?" B responds "Great, thanks. And you?"',
    'dialogue-completion',
  ],
  [
    'A: "Što ćeš raditi ovog vikenda?"\nB: "Idem na more. A ti?"',
    'Continue: A asks about weekend plans, B says going to the sea.',
    'dialogue-completion',
  ],
  [
    'A: "Jesi li gledao/gledala taj film?"\nB: "Da, bio je odličan! Što ti misliš?"',
    'Continue: A asks about a film, B says it was great.',
    'dialogue-completion',
  ],
  [
    'A: "Gdje si bio/bila na odmoru?"\nB: "U Splitu. Predivno je tamo!"',
    'Continue: A asks about vacation, B says Split was wonderful.',
    'dialogue-completion',
  ],
  [
    'A: "Kako ti se sviđa ovaj restoran?"\nB: "Hrana je izvrsna, ali malo skupo."',
    'Continue: A asks about the restaurant, B says food is great but expensive.',
    'dialogue-completion',
  ],
];

// All open-ended prompt type identifiers
const OPEN_ENDED_TYPES = ['question-response', 'picture-description', 'dialogue-completion'];

const SPEAKING_TIPS = [
  {
    mood: 'encouraging',
    text: "Your accent doesn't need to be perfect — it needs to be understood. Speak boldly. 🎙️",
  },
  { mood: 'happy', text: "Every Croatian will appreciate you trying. Speak, don't overthink. ⚔️" },
  {
    mood: 'ready',
    text: 'Croats speak with passion. Match that energy — say each phrase like you mean it. 🇭🇷',
  },
  {
    mood: 'thinking',
    text: 'Speaking tip: exhale slightly before each phrase. Relaxed breath, cleaner sound. 🌊',
  },
];

// Language codes to try in order — hr-HR is most accurate but least supported
const LANG_FALLBACKS = ['hr-HR', 'hr', 'en-US'];

// Browser speech recognition globals
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    webkitAudioContext: typeof AudioContext;
  }
}

interface PronScore {
  // null = no acoustic score available (legacy path has no Azure measurement).
  // We keep qualitative feedback (match_quality + encouragement) but never a fabricated number.
  score: number | null;
  match_quality: string;
  phonetic_tips: string[];
  encouragement: string;
}

// Text-similarity ratio (0-100) between a transcript and the target word.
// This is a RECOGNITION/text signal, NOT an acoustic pronunciation measurement — it is only
// ever sent to /api/pronunciation-coach (which labels it "text-similarity, not acoustic"),
// never displayed as a pronunciation %.
// Implemented via charOverlapPct from ../../lib/text/similarity (char-overlap, no diacritic normalization).

// Map SpeechRecognition error codes to user-friendly messages
function srError(code: string) {
  switch (code) {
    case 'not-allowed':
    case 'permission-denied':
      return isNative()
        ? 'Microphone access denied. Go to Settings → Apps → Naša Hrvatska → Permissions, enable Microphone, then force-close and reopen the app.'
        : 'Microphone permission denied. Please allow microphone access in your browser settings and try again.';
    case 'no-speech':
      return 'No speech detected. Please speak louder and closer to the mic.';
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

interface SpeakingScreenProps {
  sw: any;
  si: any[];
  sx: number;
  sr: string | null;
  ssc: number;
  sSr: (v: string | null) => void;
  sSx: (v: number) => void;
  sSw: (v: any) => void;
  sSsc: (fn: (s: number) => number) => void;
  goBack: () => void;
  award: (n: number, celebrate?: boolean, activityType?: string) => void;
  setSt: (fn: (s: any) => any) => void;
}
export default function SpeakingScreen({
  sw,
  si,
  sx,
  sr,
  ssc,
  sSr,
  sSx,
  sSw,
  sSsc,
  goBack,
  award,
  setSt,
}: SpeakingScreenProps) {
  const { stats, setStats, writeDelta } = useStats();
  const { needsRationale, dismissRationale } = useAndroidMicPermission();
  const [listening, setListening] = useState(false);
  const [recResult, setRecResult] = useState<string | null>(null);
  const [recMsg, setRecMsg] = useState('');
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [langIdx, setLangIdx] = useState(0);
  const recRef = useRef<any>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishFired = useRef(false);

  // Voice recording state
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordStreamRef = useRef<MediaStream | null>(null); // keep track of stream to stop on unmount
  const recordingURLRef = useRef<string | null>(null); // keep URL for revoke on unmount
  const [recordingURL, setRecordingURL] = useState<string | null>(null);
  const [_isRecording, setIsRecording] = useState(false);

  // Waveform visualization state
  const [waveform, setWaveform] = useState<number[]>(new Array(30).fill(0));
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // AI pronunciation feedback state
  const [pronScore, setPronScore] = useState<PronScore | null>(null);

  // Per-word accuracy from PronunciationScorer.
  // score is a real Azure acoustic % when available, or null when the word was only
  // recognized (translation-only) / the prompt was open-ended (participation, not acoustic).
  const [currentWordScore, setCurrentWordScore] = useState<{
    spoken: string;
    score: number | null;
  } | null>(null);

  // Session scores. score: number = real Azure acoustic %, null = recognized/participated but
  // not acoustically scored. The summary computes averages over the scored-only subset.
  const [wordScores, setWordScores] = useState<
    { word: string; meaning: string; score: number | null }[]
  >([]);

  // Results summary screen (shown before goBack after all words done)
  const [showSummary, setShowSummary] = useState(false);

  // Knight coaching — entry tip on mount
  useEffect(() => {
    const tip = SPEAKING_TIPS[Math.floor(Math.random() * SPEAKING_TIPS.length)];
    if (tip) knightSpeak(tip.mood, tip.text, 1000);
  }, []);

  // Cleanup on unmount — must be before early return to satisfy Rules of Hooks

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
      if (recRef.current) {
        try {
          recRef.current.onresult = null;
          recRef.current.onerror = null;
          recRef.current.onend = null;
          recRef.current.abort();
        } catch (_) {}
        recRef.current = null;
      }
      stopWaveform();
      if (recordStreamRef.current) {
        recordStreamRef.current.getTracks().forEach((t) => t.stop());
        recordStreamRef.current = null;
      }
      if (recordingURLRef.current) {
        URL.revokeObjectURL(recordingURLRef.current);
        recordingURLRef.current = null;
      }
    };
  }, []);

  if (!sw || !sw[0]) return null;

  // Reset per-word score when word changes (called on Next)
  function advanceWord() {
    recordTopicResult('speaking', sr === 'ok');
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
      if (typeof award === 'function') award(ssc * 5 + 5, false, 'speaking');
      markQuest('speak');
      setSt((s) => ({ ...s, sp: s.sp + 1 }));
      if (!stats.vs?.includes('speaking')) {
        setStats((prev) => {
          if (prev.vs?.includes('speaking')) return prev;
          return { ...prev, vs: [...(prev.vs || []), 'speaking'] };
        });
        writeDelta({ sp: 1, vs: ['speaking'] });
      } else {
        writeDelta({ sp: 1 });
      }
      setShowSummary(true);
    }
  }

  // Called by PronunciationScorer when it gets a result.
  // If score >= 60, auto-mark the word as done so "Next →" appears immediately —
  // previously users had to also tap "I Said It Correctly!" as a second step.
  // score is null when recognized only via English translation (no acoustic score).
  function handleScorerResult({ spoken, score }: { spoken: string; score: number | null }) {
    const promptType = sw[2] as string | undefined;
    const isOE = OPEN_ENDED_TYPES.includes(promptType ?? '');

    // ── Genuine DISPLAYED value ──────────────────────────────────────────────
    // The only legitimate pronunciation % is a real Azure acoustic number. Everything else
    // (translation-only recognition, open-ended completion) is stored as null — recognized /
    // participated, but NOT acoustically scored. We never fabricate a number for display.
    const displayScore: number | null = isOE ? null : score;

    // ── Internal flow-control decision (NOT a displayed score) ───────────────
    // Advance when: real Azure score is good enough (>=60), OR recognized via translation
    // (score === null on a word prompt), OR an open-ended prompt was completed (>=5 words).
    const oeCompleted = isOE && spoken.split(/\s+/).filter(Boolean).length >= 5;
    const recognizedViaTranslation = !isOE && score === null;
    const acousticPass = typeof score === 'number' && score >= 60;
    const shouldAdvance = oeCompleted || recognizedViaTranslation || acousticPass;

    setCurrentWordScore({ spoken, score: displayScore });
    setWordScores((prev) => {
      const existing = prev.find((ws) => ws.word === sw[0]);
      if (existing) {
        // Keep the best genuine acoustic number; never let null clobber a real score,
        // and never let a real score regress.
        const mergedScore =
          existing.score === null
            ? displayScore
            : displayScore === null
              ? existing.score
              : Math.max(existing.score, displayScore);
        return prev.map((ws) => (ws.word === sw[0] ? { ...ws, score: mergedScore } : ws));
      }
      return [...prev, { word: sw[0] as string, meaning: sw[1] as string, score: displayScore }];
    });

    if (shouldAdvance && sr !== 'ok') {
      sSr('ok');
      sSsc((s: number) => s + 1);
    }
  }

  function stopRecording() {
    if (mediaRecRef.current && mediaRecRef.current.state === 'recording') {
      try {
        mediaRecRef.current.stop();
      } catch (_) {}
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
          const idx = Math.floor((i * dataArray.length) / 30);
          return Math.round(((dataArray[idx] ?? 0) / 255) * 100);
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
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setWaveform(new Array(30).fill(0));
  }

  async function analyzePronunciation(transcript: string, targetWord: string) {
    // This legacy Web-Speech path has NO acoustic measurement — Web Speech only tells us
    // WHAT was recognized, never how well it was pronounced. So score is ALWAYS null here
    // (no fabricated number). We keep a qualitative match_quality + the coach's text feedback.
    // pronScore must ALWAYS be set to a non-null OBJECT — leaving the object null keeps the
    // AIProgressBar spinning forever — but its .score field is null (unscored).
    const isClose = transcript.toLowerCase().includes(targetWord.toLowerCase().slice(0, 3));
    const fallback: PronScore = {
      score: null,
      match_quality: isClose ? 'close' : 'off',
      phonetic_tips: [],
      encouragement: isClose ? 'Blizu! / Close!' : 'Pokušaj još jednom! / Try again!',
    };

    if (!navigator.onLine) {
      setPronScore({
        ...fallback,
        encouragement: 'Offline — pronunciation analysis needs a connection.',
      });
      return;
    }

    // Real text-similarity ratio (recognition signal, not acoustic). The endpoint labels this
    // as "text-similarity, not acoustic", so sending a genuine ratio is honest.
    const similarity = charOverlapPct(transcript, targetWord);

    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 7000); // 7s max — never block UI

    try {
      const res = await apiFetch('/api/pronunciation-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: targetWord,
          spoken: transcript,
          score: similarity,
          level: 'B1',
        }),
        signal: controller.signal,
      });
      clearTimeout(tid);
      if (!res.ok) {
        setPronScore(fallback);
        return;
      }
      const data = await res.json();
      if (data && data.feedback) {
        setPronScore({
          score: null, // no acoustic score on this path — keep the coach feedback, drop the number
          match_quality: isClose ? 'close' : 'partial',
          phonetic_tips: (data.drills || []).map((d: any) => d.tip).filter(Boolean),
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

  function startRecognition(lIdx: number) {
    if (recRef.current) {
      try {
        recRef.current.abort();
      } catch (_) {}
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
        try {
          recRef.current.stop();
        } catch (_) {}
      }
      stopRecording();
      stopWaveform();
      setListening(false);
      setRecResult('timeout');
      setRecMsg('No speech detected within 12 seconds. Try again or use self-assessment.');
    }, 12000);

    rec.onresult = (e: any) => {
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
      stopRecording();
      stopWaveform();
      if (!e.results || !e.results.length) return;
      const alts = Array.from(e.results[0]).map((r: any) => r.transcript.toLowerCase().trim());
      const isOpenEnded = OPEN_ENDED_TYPES.includes(sw[2] as string);
      if (isOpenEnded) {
        // Open-ended prompts: any response of 5+ words counts as success
        const wordCount = (alts[0] ?? '').split(/\s+/).filter(Boolean).length;
        const matched = wordCount >= 5;
        setRecResult(matched ? 'match' : 'nomatch');
        setListening(false);
        if (matched) {
          sSr('ok');
          sSsc((s: number) => s + 1);
        }
        // Open-ended prompts are a PARTICIPATION signal, not an acoustic measurement —
        // never a pronunciation %. score: null = recognized/responded but not scored.
        setPronScore({
          score: null,
          match_quality: matched ? 'close' : 'off',
          phonetic_tips: [],
          encouragement: matched
            ? 'Odlično! Great response! / Izvrsno!'
            : 'Try to say more — at least a full sentence.',
        });
        return;
      }
      const target = (sw[0] as string).toLowerCase().trim();
      // Generous matching: exact, contains, or at least 60% character overlap
      // (charOverlapPct returns 0..100; >= 60 reproduces the old levenshteinClose threshold)
      const matched = alts.some(
        (a: string) =>
          a === target ||
          a.includes(target) ||
          target.includes(a) ||
          charOverlapPct(a, target) >= 60,
      );
      setRecResult(matched ? 'match' : 'nomatch');
      setListening(false);
      if (matched) {
        sSr('ok');
        sSsc((s: number) => s + 1);
      }
      // Analyze pronunciation with AI using the best transcript
      analyzePronunciation(alts[0] ?? '', sw[0] as string);
    };

    rec.onerror = (e: any) => {
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
      stopRecording();
      stopWaveform();
      const code = e.error || '';
      if (code === 'not-allowed' || code === 'permission-denied') {
        setPermissionDenied(true);
        setListening(false);
        return; // Suppress generic recMsg banner — explainer above handles UX.
      }
      // If language not supported, try next fallback
      if (
        (code === 'language-not-supported' || code === 'service-not-allowed') &&
        lIdx < LANG_FALLBACKS.length - 1
      ) {
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
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
      stopRecording();
      stopWaveform();
      setListening(false);
    };

    try {
      rec.start();
    } catch (_e) {
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
      stopRecording();
      setListening(false);
      setRecResult('error');
      setRecMsg('Could not start microphone. Try refreshing the page.');
    }
  }

  async function startMic() {
    // Guard: this legacy path requires Web Speech API — PronunciationScorer handles Android/MediaRecorder.
    const hasSR = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!hasSR) return;
    setRecordingURL(null);
    setPronScore(null);
    chunksRef.current = [];

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop()); // permission check only - stop immediately
    } catch (e) {
      const errName = e instanceof Error ? e.name : '';
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        // Render the dedicated explainer instead of the generic recMsg banner.
        setPermissionDenied(true);
        return;
      }
      setRecResult('error');
      setRecMsg(
        isNative()
          ? 'Microphone access denied. Go to Settings → Apps → Naša Hrvatska → Permissions, enable Microphone, then force-close and reopen the app.'
          : 'Microphone permission denied. Please allow microphone access in your browser settings and try again.',
      );
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
      const mediaRec = new MediaRecorder(
        recordStream,
        recMimeType ? { mimeType: recMimeType } : {},
      );
      mediaRecRef.current = mediaRec;
      setIsRecording(true);

      mediaRec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mediaRec.mimeType || 'audio/webm' });
        setIsRecording(false);
        recordStreamRef.current = null;
        recordStream.getTracks().forEach((t) => t.stop());
        // Use base64 data URL — blob: URLs fail silently on some Android OEM WebViews
        const reader = new FileReader();
        reader.onload = () => {
          recordingURLRef.current = reader.result as string;
          setRecordingURL(reader.result as string);
        };
        reader.readAsDataURL(blob);
      };

      mediaRec.start();
    } catch (_) {
      // If MediaRecorder fails, continue without recording (speech recognition still works)
    }

    startWaveform();
    startRecognition(langIdx);
  }

  function stopMic() {
    if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
    if (recRef.current) {
      try {
        recRef.current.stop();
      } catch (_) {}
    }
    stopRecording();
    stopWaveform();
    setListening(false);
  }

  const currentLang = LANG_FALLBACKS[langIdx] ?? 'hr-HR';

  // ── Summary screen ────────────────────────────────────────────────────────
  if (showSummary) {
    return <SpeakingSummaryScreen wordScores={wordScores} onDone={() => goBack()} />;
  }

  // ── Android mic rationale gate ─────────────────────────────────────────────
  // On Android, show an explanation before the OS mic permission dialog fires.
  // Only shown once — dismissRationale() marks it as seen in localStorage.
  if (needsRationale) {
    return (
      <div
        className="scr-wrap"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '70vh',
          padding: '24px 20px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 56, marginBottom: 16 }}>🎤</div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--heading)', marginBottom: 12 }}>
          Microphone Access
        </h2>
        <p style={{ fontSize: 15, color: 'var(--subtext)', lineHeight: 1.6, marginBottom: 8 }}>
          Pronunciation Practice uses your microphone to visualise your speech and record your
          answers for self-comparison.
        </p>
        <p style={{ fontSize: 14, color: 'var(--subtext)', lineHeight: 1.6, marginBottom: 28 }}>
          Your audio is <strong>never uploaded or stored</strong> — everything stays on your device.
        </p>
        <button
          onClick={dismissRationale}
          className="b bp"
          style={{ width: '100%', maxWidth: 320, marginBottom: 12 }}
        >
          Got it — allow microphone
        </button>
        <button
          onClick={goBack}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--subtext)',
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          Not now
        </button>
      </div>
    );
  }

  // ── Prompt-type context card ───────────────────────────────────────────────
  const promptType = sw[2] as string | undefined;
  const isOpenEnded = OPEN_ENDED_TYPES.includes(promptType ?? '');

  function renderPromptContext() {
    if (!isOpenEnded) return null;

    if (promptType === 'question-response') {
      return (
        <div
          style={{
            background: 'var(--card)',
            border: '1.5px solid var(--inp-b)',
            borderRadius: 14,
            padding: '14px 16px',
            marginBottom: 16,
            textAlign: 'left',
          }}
        >
          <div
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 800,
              color: 'var(--subtext)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 6,
            }}
          >
            💬 Answer this question:
          </div>
          <div
            style={{
              fontSize: 'var(--text-xl)',
              fontWeight: 800,
              color: 'var(--heading)',
              fontFamily: "'Playfair Display',serif",
              lineHeight: 1.4,
              marginBottom: 6,
            }}
          >
            {sw[0]}
          </div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--subtext)' }}>{sw[1]}</div>
        </div>
      );
    }

    if (promptType === 'picture-description') {
      const imageKey = sw[3] as string | undefined;
      const imageSrc = imageKey ? `/images/scenes/${imageKey}.webp` : null;
      return (
        <div
          style={{
            background: 'var(--card)',
            border: '1.5px solid var(--inp-b)',
            borderRadius: 14,
            padding: '14px 16px',
            marginBottom: 16,
            textAlign: 'left',
          }}
        >
          <div
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 800,
              color: 'var(--subtext)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 8,
            }}
          >
            🖼️ Describe this picture:
          </div>
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={imageKey ?? 'scene'}
              loading="lazy"
              style={{
                width: '100%',
                maxHeight: 200,
                objectFit: 'cover',
                borderRadius: 10,
                marginBottom: 8,
                display: 'block',
              }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                if (fallback) fallback.style.display = 'block';
              }}
            />
          ) : null}
          <div
            style={{
              display: 'none',
              fontSize: 'var(--text-sm)',
              color: 'var(--subtext)',
              fontStyle: 'italic',
              marginBottom: 8,
            }}
          >
            Scene: {imageKey ?? 'Croatia'}
          </div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--subtext)' }}>{sw[1]}</div>
        </div>
      );
    }

    if (promptType === 'dialogue-completion') {
      const lines = (sw[0] as string).split('\n');
      return (
        <div
          style={{
            background: 'var(--card)',
            border: '1.5px solid var(--inp-b)',
            borderRadius: 14,
            padding: '14px 16px',
            marginBottom: 16,
            textAlign: 'left',
          }}
        >
          <div
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 800,
              color: 'var(--subtext)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 8,
            }}
          >
            🗣️ Complete this dialogue:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
            {lines.map((line, i) => (
              <div
                key={i}
                style={{
                  fontSize: 'var(--text-base)',
                  fontWeight: 700,
                  color: 'var(--heading)',
                  fontFamily: "'Playfair Display',serif",
                  lineHeight: 1.5,
                }}
              >
                {line}
              </div>
            ))}
          </div>
          <div
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--info)',
              fontWeight: 700,
              borderTop: '1px solid var(--card-b)',
              paddingTop: 8,
              marginTop: 4,
            }}
          >
            Your turn → speak the next line in Croatian
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)', marginTop: 4 }}>
            {sw[1]}
          </div>
        </div>
      );
    }

    return null;
  }

  // ── Main speaking screen ───────────────────────────────────────────────────
  return (
    <div className="scr-wrap">
      {H(isOpenEnded ? '🗣️ Speaking Practice' : '🎤 Pronunciation Practice', '', goBack)}
      <Bar v={sx + 1} mx={si.length} color="var(--success)" h={6} />
      {renderPromptContext()}
      {permissionDenied && (
        <MicPermissionDeniedExplainer
          onRetry={() => {
            setPermissionDenied(false);
            setRecResult(null);
            setRecMsg('');
          }}
        />
      )}
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
        onSelfAssess={() => {
          sSr('ok');
          sSsc((s: number) => s + 1);
        }}
        onAdvanceWord={advanceWord}
        onClearRecording={() => {
          if (recordingURLRef.current) {
            URL.revokeObjectURL(recordingURLRef.current);
            recordingURLRef.current = null;
          }
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
