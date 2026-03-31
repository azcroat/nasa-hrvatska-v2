import React, { useState, useRef, useCallback, useEffect } from 'react';
import AzureResultPanel from './AzureResultPanel.jsx';
import WebSpeechResultPanel from './WebSpeechResultPanel.jsx';

/**
 * @param {{ targetText: string, level?: string, onScore?: (r: {spoken: string, score: number}) => void }} props
 */
export default function PronunciationScorer({ targetText, level = 'B1', onScore }) {
  // ── Shared state ─────────────────────────────────────────────────────────────
  const [state, setState] = useState('idle'); // idle | listening | recording | processing | scored | unsupported
  const [result, setResult] = useState(/** @type {{spoken:string,score:number}|null} */ (null));
  const [coaching, setCoaching] = useState(null); // null | 'loading' | {feedback,issue,phonetic_guide,drills}
  const [srErrorMsg, setSrErrorMsg] = useState(null);
  const [azureResult, setAzureResult] = useState(null); // null | AzureAssessmentResult
  const [mode, setMode] = useState('auto'); // 'auto' | 'webspeech' | 'azure'

  const recRef = useRef(/** @type {any} */ (null));          // SpeechRecognition ref
  const mediaRecRef = useRef(/** @type {MediaRecorder|null} */ (null));  // MediaRecorder ref
  const chunksRef = useRef(/** @type {Blob[]} */ ([]));      // recorded audio chunks

  // ── Browser capability checks ─────────────────────────────────────────────
  const webSpeechSupported = !!(
    typeof window !== 'undefined' &&
    (/** @type {any} */ (window).SpeechRecognition || /** @type {any} */ (window).webkitSpeechRecognition)
  );
  const mediaRecorderSupported = !!(
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    navigator.mediaDevices &&
    typeof MediaRecorder !== 'undefined'
  );

  // ── Levenshtein / similarity ──────────────────────────────────────────────
  function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, (_, i) =>
      Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0)
    );
    for (let i = 1; i <= m; i++)
      for (let j = 1; j <= n; j++)
        dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    return dp[m][n];
  }

  function similarity(a, b) {
    const norm = (/** @type {string} */ s) => s.toLowerCase()
      .replace(/[čć]/g, 'c').replace(/[šš]/g, 's')
      .replace(/[žž]/g, 'z').replace(/đ/g, 'd')
      .replace(/[.,!?;:'"]/g, '').trim();
    const na = norm(a), nb = norm(b);
    if (na === nb) return 100;
    const maxLen = Math.max(na.length, nb.length);
    if (maxLen === 0) return 100;
    const dist = levenshtein(na, nb);
    return Math.round((1 - dist / maxLen) * 100);
  }

  // ── Stream ref for cleanup ────────────────────────────────────────────────
  const streamRef = useRef(/** @type {MediaStream|null} */ (null));

  // ── Unmount cleanup — stop mic, abort recognition ─────────────────────────
  useEffect(() => {
    return () => {
      if (recRef.current) {
        try { recRef.current.abort(); } catch (_) {}
        recRef.current = null;
      }
      if (mediaRecRef.current && mediaRecRef.current.state !== 'inactive') {
        try { mediaRecRef.current.stop(); } catch (_) {}
        mediaRecRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
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
    if (!webSpeechSupported) { setState('unsupported'); return; }
    setCoaching(null);
    setSrErrorMsg(null);
    setAzureResult(null);
    const SR = /** @type {any} */ (window).SpeechRecognition || /** @type {any} */ (window).webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = 'hr-HR';
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 3;
    rec.onresult = (/** @type {any} */ e) => {
      const transcripts = Array.from(e.results[0]).map((/** @type {any} */ r) => r.transcript);
      const best = /** @type {string[]} */ (transcripts).reduce((/** @type {{text:string,score:number}} */ best, t) => {
        const s = similarity(t, targetText);
        return s > best.score ? { text: t, score: s } : best;
      }, { text: /** @type {string[]} */ (transcripts)[0], score: 0 });
      const r = { spoken: best.text, score: best.score };
      setResult(r);
      setState('scored');
      if (onScore) onScore(r);
      fetchCoaching(r.spoken, r.score);
    };
    rec.onerror = (/** @type {any} */ e) => {
      const code = e?.error || '';
      const msg = code === 'not-allowed' || code === 'permission-denied'
        ? 'Microphone permission denied. Please allow mic access in your browser settings.'
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
      if (recRef.current === rec) setState(s => (s === 'listening' || s === 'processing') ? 'idle' : s);
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
      const msg = (e?.name === 'NotAllowedError' || e?.name === 'PermissionDeniedError')
        ? 'Microphone permission denied. Please allow mic access in your browser settings.'
        : 'Could not access microphone. Please check your device settings.';
      setSrErrorMsg(msg);
      return;
    }

    // Prefer audio/wav; fall back to whatever the browser supports.
    // Azure Pronunciation Assessment REST API accepts audio/wav and audio/ogg;codecs=opus.
    const preferredMime = ['audio/wav', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus']
      .find(t => MediaRecorder.isTypeSupported(t)) || '';

    let recorder;
    try {
      recorder = new MediaRecorder(stream, preferredMime ? { mimeType: preferredMime } : {});
    } catch (e) {
      stream.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      setSrErrorMsg('Audio recording initialization failed. Please try again.');
      return;
    }
    chunksRef.current = [];

    recorder.ondataavailable = e => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onerror = () => {
      stream.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      setState('idle');
      setSrErrorMsg('Recording error — please try again.');
    };

    recorder.onstop = async () => {
      // Stop all tracks so the mic indicator light goes off.
      stream.getTracks().forEach(t => t.stop());
      streamRef.current = null;

      const mimeType = recorder.mimeType || 'audio/webm';
      const blob = new Blob(chunksRef.current, { type: mimeType });
      chunksRef.current = [];
      setState('processing');
      await submitToAzure(blob);
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

  async function submitToAzure(blob) {
    // Convert Blob → base64 using chunked approach (avoids O(n²) concatenation and apply stack overflow)
    let audioBase64;
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const CHUNK = 8192;
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i += CHUNK) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
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
      const res = await fetch('/api/pronunciation-assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64,
          referenceText: targetText,
          locale: 'hr-HR',
        }),
        signal: controller.signal,
      });
      clearTimeout(tid);
      const data = await res.json();

      if (!res.ok || !data.ok) {
        // Azure not configured or unavailable — fall back to Web Speech API mode.
        setMode('webspeech');
        startWebSpeech();
        return;
      }

      setAzureResult(data);
      setState('scored');
      if (onScore) onScore({ spoken: targetText, score: data.overall ?? 0 });
      fetchCoaching(targetText, data.overall ?? 0);
    } catch (fetchErr) {
      clearTimeout(tid);
      console.warn('PronunciationScorer: Azure assess failed, falling back to Web Speech:', fetchErr?.message);
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
  const fetchCoaching = useCallback(async (spoken, score) => {
    setCoaching('loading');
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 12000); // 12s max
    try {
      const res = await fetch('/api/pronunciation-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: targetText, spoken, score, level }),
        signal: controller.signal,
      });
      clearTimeout(tid);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setCoaching(data);
    } catch {
      clearTimeout(tid);
      setCoaching({ feedback: 'Could not load coaching. Try again later.', issue: '', phonetic_guide: '', drills: [] });
    }
  }, [targetText, level]);

  // ── Unsupported fallback ──────────────────────────────────────────────────
  if (!webSpeechSupported && !mediaRecorderSupported) return (
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
          <button onClick={start} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'linear-gradient(135deg,#0e7490,#164e63)',
            color: '#fff', border: 'none', borderRadius: 10,
            padding: '10px 18px', cursor: 'pointer',
            fontSize: 13, fontWeight: 700, fontFamily: "'Outfit',sans-serif",
          }}>
            🎙️ Test My Pronunciation
          </button>
          {srErrorMsg && (
            <div style={{ marginTop: 6, fontSize: 12, color: '#dc2626', background: '#fee2e2', borderRadius: 8, padding: '6px 10px' }}>
              ⚠️ {srErrorMsg}
            </div>
          )}
        </>
      )}

      {/* ── WEB SPEECH: listening ── */}
      {state === 'listening' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#fef3c7', borderRadius: 10, padding: '10px 16px',
          fontSize: 13, fontWeight: 700, color: '#92400e',
        }}>
          <span style={{ fontSize: 18, animation: 'pulse 1s infinite' }}>🎙️</span>
          Listening… say: <em>{targetText}</em>
        </div>
      )}

      {/* ── AZURE: actively recording ── */}
      {state === 'recording' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: '#fef3c7', borderRadius: 10, padding: '10px 16px',
            fontSize: 13, fontWeight: 700, color: '#92400e',
          }}>
            <span style={{ fontSize: 18, animation: 'pulse 1s infinite' }}>🎙️</span>
            Recording… say: <em>{targetText}</em>
          </div>
          <button
            onClick={stopAzureRecording}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#dc2626', color: '#fff',
              border: 'none', borderRadius: 10,
              padding: '8px 16px', cursor: 'pointer',
              fontSize: 13, fontWeight: 700, fontFamily: "'Outfit',sans-serif",
              alignSelf: 'flex-start',
            }}
          >
            ⏹ Stop Recording
          </button>
        </div>
      )}

      {/* ── AZURE: processing ── */}
      {state === 'processing' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#f0f9ff', borderRadius: 10, padding: '10px 16px',
          fontSize: 13, fontWeight: 700, color: '#0369a1',
        }}>
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
          onGetCoaching={() => fetchCoaching(result.spoken, result.score)}
        />
      )}
    </div>
  );
}
