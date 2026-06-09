import React, { useState, useRef, useCallback, useEffect } from 'react';
import AzureResultPanel from './AzureResultPanel';
import WebSpeechResultPanel from './WebSpeechResultPanel';
import MicPermissionDeniedExplainer from './MicPermissionDeniedExplainer';
import { apiFetch } from '../../lib/apiFetch.js';
import { _nativePost } from '../../lib/nativePost.js';
import { isNative } from '../../lib/platform.js';
import { similarityPct } from '../../lib/text/similarity';

interface PronunciationScorerProps {
  targetText: string;
  targetEnglish?: string;
  level?: string;
  onScore?: (r: { spoken: string; score: number | null }) => void;
}

interface ScoredResult {
  spoken: string;
  /** null when the word was recognised only via its English translation (Web Speech fallback).
   *  In that case pronunciation quality cannot be assessed — no fabricated number is emitted. */
  score: number | null;
  recognizedViaTranslation?: boolean;
}
interface CoachingResult {
  feedback?: string;
  issue?: string;
  phonetic_guide?: string;
  drills?: Array<{ word: string; tip?: string }>;
}

export default function PronunciationScorer({
  targetText,
  targetEnglish,
  level = 'B1',
  onScore,
}: PronunciationScorerProps) {
  // ── Shared state ─────────────────────────────────────────────────────────────
  const [state, setState] = useState<
    'idle' | 'listening' | 'recording' | 'processing' | 'scored' | 'unsupported'
  >('idle');
  const [result, setResult] = useState<ScoredResult | null>(null);
  const [coaching, setCoaching] = useState<CoachingResult | 'loading' | null>(null);
  const [srErrorMsg, setSrErrorMsg] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [azureResult, setAzureResult] = useState<Record<string, unknown> | null>(null);
  const [mode, setMode] = useState<'auto' | 'webspeech' | 'azure'>('auto');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef = useRef<any>(null); // SpeechRecognition — not in lib.dom.d.ts until TS 6
  const mediaRecRef = useRef<MediaRecorder | null>(null); // MediaRecorder ref
  const chunksRef = useRef<Blob[]>([]); // recorded audio chunks

  // ── Browser capability checks ─────────────────────────────────────────────
  const webSpeechSupported = !!(
    typeof window !== 'undefined' &&
    /** @type {any} */ (window.SpeechRecognition ||
      /** @type {any} */ window.webkitSpeechRecognition)
  );
  const mediaRecorderSupported = !!(
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    navigator.mediaDevices &&
    typeof MediaRecorder !== 'undefined'
  );

  // ── Stream ref for cleanup ────────────────────────────────────────────────
  const streamRef = useRef<MediaStream | null>(null);

  // ── Unmount cleanup — stop mic, abort recognition ─────────────────────────
  useEffect(() => {
    return () => {
      if (recRef.current) {
        try {
          recRef.current.abort();
        } catch (_) {}
        recRef.current = null;
      }
      if (mediaRecRef.current && mediaRecRef.current.state !== 'inactive') {
        try {
          mediaRecRef.current.stop();
        } catch (_) {}
        mediaRecRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      chunksRef.current = [];
    };
  }, []);

  // ── Reset helper ──────────────────────────────────────────────────────────
  function resetAll() {
    setResult(null);
    setCoaching(null);
    setSrErrorMsg(null);
    setAzureResult(null);
    setState('idle');
    chunksRef.current = [];
  }

  // ── Web Speech API mode ───────────────────────────────────────────────────
  function startWebSpeech() {
    if (!webSpeechSupported) {
      setState('unsupported');
      return;
    }
    setCoaching(null);
    setSrErrorMsg(null);
    setAzureResult(null);
    const SR =
      /** @type {any} */ window.SpeechRecognition ||
      /** @type {any} */ window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = 'hr-HR';
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 3;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      if (!e.results?.[0]) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transcripts = Array.from(e.results[0]).map((r: any) => r.transcript as string);
      if (!transcripts.length) return;

      // English-translation detection: when hr-HR recognition falls back to en-US (or the browser's
      // English model wins), the Croatian word's English meaning is returned instead of the Croatian
      // phonemes. e.g. user says "četiri" → browser returns "four". This proves the pronunciation
      // was correct — the English ASR correctly decoded Croatian phonemes to their English meaning.
      if (targetEnglish) {
        const engNorm = targetEnglish.toLowerCase().trim();
        const translationMatch = transcripts.some((t) => {
          const tn = t.toLowerCase().trim();
          return tn === engNorm || tn.includes(engNorm) || engNorm.includes(tn);
        });
        if (translationMatch) {
          // The browser decoded the Croatian word via its English meaning — pronunciation was
          // correct enough to be understood, but we cannot produce an acoustic quality score
          // from a meaning-match alone. Emit a qualitative result with no fabricated number.
          const r: ScoredResult = {
            spoken: targetText,
            score: null,
            recognizedViaTranslation: true,
          };
          setResult(r);
          setState('scored');
          if (onScore) onScore(r);
          // No coaching fetch for translation-only path: there is no numeric score to coach on.
          return;
        }
      }

      const best = (transcripts as string[]).reduce(
        (best: { text: string; score: number }, t: string) => {
          const s = similarityPct(t, targetText);
          return s > best.score ? { text: t, score: s } : best;
        },
        { text: (transcripts as string[])[0] ?? '', score: 0 },
      );
      const r = { spoken: best.text, score: best.score };
      setResult(r);
      setState('scored');
      if (onScore) onScore(r);
      fetchCoaching(r.spoken, r.score);
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onerror = (e: any) => {
      const code = e?.error || '';
      if (code === 'not-allowed' || code === 'permission-denied') setPermissionDenied(true);
      const msg =
        code === 'not-allowed' || code === 'permission-denied'
          ? isNative()
            ? 'Microphone access denied. Go to Settings → Apps → Naša Hrvatska → Permissions, enable Microphone, then force-close and reopen the app.'
            : 'Microphone permission denied. Please allow mic access in your browser settings.'
          : code === 'no-speech'
            ? 'No speech detected. Please speak louder and closer to the mic.'
            : code === 'audio-capture'
              ? 'No microphone found. Check that your mic is connected.'
              : code === 'network'
                ? 'Network error during recognition. Check your connection.'
                : code === 'aborted'
                  ? null
                  : 'Microphone error — please try again.';
      if (msg) setSrErrorMsg(msg);
      setState('idle');
    };
    rec.onend = () => {
      if (recRef.current === rec)
        setState((s) => (s === 'listening' || s === 'processing' ? 'idle' : s));
    };
    recRef.current = rec;
    rec.start();
    setState('listening');
  }

  // ── Azure mode: record → assess ───────────────────────────────────────────
  async function startAzureRecording() {
    if (!mediaRecorderSupported) {
      setSrErrorMsg('Audio recording not supported in this browser.');
      return;
    }
    setSrErrorMsg(null);
    setAzureResult(null);
    setResult(null);

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;
    } catch (e) {
      const errName = e instanceof Error ? e.name : '';
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        setPermissionDenied(true);
      }
      const msg =
        errName === 'NotAllowedError' || errName === 'PermissionDeniedError'
          ? isNative()
            ? 'Microphone access denied. Go to Settings → Apps → Naša Hrvatska → Permissions, enable Microphone, then force-close and reopen the app.'
            : 'Microphone permission denied. Please allow mic access in your browser settings.'
          : 'Could not access microphone. Please check your device settings.';
      setSrErrorMsg(msg);
      return;
    }

    // Prefer audio/ogg;codecs=opus (Azure-supported), then audio/wav, then WebM fallback.
    // Chrome does NOT support audio/wav or audio/ogg via MediaRecorder — it always uses WebM.
    // We pass the actual mimeType to the server so it can set the correct Content-Type for Azure.
    // Azure explicitly supports: audio/wav, audio/ogg;codecs=opus. WebM is sent as-is and Azure
    // handles it in practice (same Opus codec, different container).
    const preferredMime =
      [
        'audio/ogg;codecs=opus',
        'audio/wav',
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg',
      ].find((t) => MediaRecorder.isTypeSupported(t)) || '';

    let recorder;
    try {
      recorder = new MediaRecorder(stream, preferredMime ? { mimeType: preferredMime } : {});
    } catch (e) {
      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setSrErrorMsg('Audio recording initialization failed. Please try again.');
      return;
    }
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onerror = () => {
      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setState('idle');
      setSrErrorMsg('Recording error — please try again.');
    };

    recorder.onstop = async () => {
      // Stop all tracks so the mic indicator light goes off.
      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;

      const mimeType = recorder.mimeType || 'audio/webm';
      const blob = new Blob(chunksRef.current, { type: mimeType });
      chunksRef.current = [];
      setState('processing');
      await submitToAzure(blob, mimeType);
    };

    mediaRecRef.current = recorder;
    recorder.start();
    setState('recording');
  }

  function stopAzureRecording() {
    if (mediaRecRef.current && mediaRecRef.current.state === 'recording') {
      mediaRecRef.current.stop();
    }
  }

  async function submitToAzure(blob: Blob, mimeType = 'audio/webm') {
    // Convert Blob → base64 using chunked approach (avoids O(n²) concatenation and apply stack overflow)
    let audioBase64;
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const CHUNK = 8192;
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i += CHUNK) {
        binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CHUNK)));
      }
      audioBase64 = btoa(binary);
    } catch {
      setSrErrorMsg('Could not process audio. Please try again.');
      setState('idle');
      return;
    }

    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 12000); // 12s client timeout — server has 20s Azure timeout

    try {
      const res = await _nativePost(
        '/api/pronunciation-assess',
        { audioBase64, referenceText: targetText, locale: 'hr-HR', audioMimeType: mimeType },
        { signal: controller.signal },
      );
      if (!res) throw new Error('assess_transport_failed');
      clearTimeout(tid);
      const data = (await res.json()) as Record<string, unknown>;

      if (!res.ok || !data['ok']) {
        // Azure not configured or unavailable — fall back to Web Speech API mode.
        setMode('webspeech');
        startWebSpeech();
        return;
      }

      setAzureResult(data);
      setState('scored');
      // A "successful" Azure response missing a numeric `overall` is NOT a real acoustic
      // score — emit null (recognized but not scored) rather than a fabricated 0. This is
      // distinct from the translation-only path: a missing-overall is not a translation match,
      // so we do NOT set recognizedViaTranslation here.
      const overallScore = typeof data['overall'] === 'number' ? data['overall'] : null;
      if (onScore) onScore({ spoken: targetText, score: overallScore });
      // No numeric score → nothing to coach on (mirrors the translation-only null path).
      if (overallScore !== null) fetchCoaching(targetText, overallScore);
    } catch (fetchErr) {
      clearTimeout(tid);
      console.warn(
        'PronunciationScorer: Azure assess failed, falling back to Web Speech:',
        fetchErr instanceof Error ? fetchErr.message : String(fetchErr),
      );
      // Graceful fallback: try Web Speech API. If unsupported, show error and reset.
      if (webSpeechSupported) {
        setMode('webspeech');
        startWebSpeech();
      } else {
        setSrErrorMsg('Pronunciation assessment unavailable. Please try again.');
        setState('idle');
      }
    }
  }

  // ── Mode selection & unified start ───────────────────────────────────────
  // 'auto': try Azure first; if not available, fall back to Web Speech.
  // The mode state is updated inside submitToAzure() when a fallback occurs.
  function start() {
    resetAll();
    const useAzure = (mode === 'auto' || mode === 'azure') && mediaRecorderSupported;
    if (useAzure) {
      startAzureRecording();
    } else {
      startWebSpeech();
    }
  }

  // ── AI Coaching fetch ─────────────────────────────────────────────────────
  const fetchCoaching = useCallback(
    async (spoken: string, score: number) => {
      setCoaching('loading');
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 12000); // 12s max
      try {
        const res = await apiFetch('/api/pronunciation-coach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ word: targetText, spoken, score, level }),
          signal: controller.signal,
        });
        clearTimeout(tid);
        if (!res.ok) throw new Error('API error');
        const data = (await res.json()) as CoachingResult;
        setCoaching(data);
      } catch {
        clearTimeout(tid);
        setCoaching({
          feedback: 'Could not load coaching. Try again later.',
          issue: '',
          phonetic_guide: '',
          drills: [],
        });
      }
    },
    [targetText, level],
  );

  // ── Unsupported fallback ──────────────────────────────────────────────────
  if (!webSpeechSupported && !mediaRecorderSupported)
    return (
      <div style={{ fontSize: 12, color: 'var(--subtext)', fontStyle: 'italic', marginTop: 8 }}>
        Pronunciation scoring requires Chrome or Edge browser.
      </div>
    );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ marginTop: 12 }}>
      {/* ── IDLE ── */}
      {state === 'idle' && (
        <>
          <button
            onClick={start}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'linear-gradient(135deg,#0e7490,#164e63)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '10px 18px',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "'Outfit',sans-serif",
            }}
          >
            🎙️ Test My Pronunciation
          </button>
          {permissionDenied ? (
            <MicPermissionDeniedExplainer
              onRetry={() => {
                setPermissionDenied(false);
                setSrErrorMsg(null);
              }}
            />
          ) : (
            srErrorMsg && (
              <div
                style={{
                  marginTop: 6,
                  fontSize: 12,
                  color: '#dc2626',
                  background: '#fee2e2',
                  borderRadius: 8,
                  padding: '6px 10px',
                }}
              >
                ⚠️ {srErrorMsg}
              </div>
            )
          )}
        </>
      )}

      {/* ── WEB SPEECH: listening ── */}
      {state === 'listening' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: '#fef3c7',
            borderRadius: 10,
            padding: '10px 16px',
            fontSize: 13,
            fontWeight: 700,
            color: '#92400e',
          }}
        >
          <span style={{ fontSize: 18, animation: 'pulse 1s infinite' }}>🎙️</span>
          Listening… say: <em>{targetText}</em>
        </div>
      )}

      {/* ── AZURE: actively recording ── */}
      {state === 'recording' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: '#fef3c7',
              borderRadius: 10,
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: 700,
              color: '#92400e',
            }}
          >
            <span style={{ fontSize: 18, animation: 'pulse 1s infinite' }}>🎙️</span>
            Recording… say: <em>{targetText}</em>
          </div>
          <button
            onClick={stopAzureRecording}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#dc2626',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "'Outfit',sans-serif",
              alignSelf: 'flex-start',
            }}
          >
            ⏹ Stop Recording
          </button>
        </div>
      )}

      {/* ── AZURE: processing ── */}
      {state === 'processing' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: '#f0f9ff',
            borderRadius: 10,
            padding: '10px 16px',
            fontSize: 13,
            fontWeight: 700,
            color: '#0369a1',
          }}
        >
          <span style={{ fontSize: 16 }}>⏳</span>
          Analyzing your pronunciation…
        </div>
      )}

      {/* ── SCORED: Azure result ── */}
      {state === 'scored' && azureResult && (
        <AzureResultPanel azureResult={azureResult} onRetry={resetAll} />
      )}

      {/* ── SCORED: Web Speech result ── */}
      {state === 'scored' && result && !azureResult && (
        <WebSpeechResultPanel
          result={result}
          coaching={coaching}
          onRetry={resetAll}
          onGetCoaching={
            result.score !== null
              ? () => fetchCoaching(result.spoken, result.score as number)
              : undefined
          }
        />
      )}
    </div>
  );
}
