import React, { useState, useRef, useCallback } from 'react';

// ── Croatian phoneme guides — IPA, English approx, articulation, example ──────
const PHONEME_GUIDES = {
  'ć': {
    ipa: '/tɕ/',
    approx: 'Like "ch" in "cheer" but softer — palatal affricate',
    articulate: 'Tongue tip rests behind lower teeth. Blade of tongue touches the hard palate just behind the gum ridge. Lips slightly spread.',
    example: 'ćevap, noć, peć',
    contrast: 'Softer than č — tongue is further back, lips spread not pursed',
    lips: 'spread', tongue: 'palatal',
  },
  'č': {
    ipa: '/tʃ/',
    approx: 'Like "ch" in "church" — alveo-palatal affricate',
    articulate: 'Tongue tip curls slightly up toward the ridge behind upper teeth. Lips rounded/neutral. Harder, more forward than ć.',
    example: 'čaj, čovjek, noč',
    contrast: 'Harder than ć — tongue tip is forward, lips more rounded',
    lips: 'neutral', tongue: 'alveolar',
  },
  'š': {
    ipa: '/ʃ/',
    approx: 'Like "sh" in "shoe" — alveo-palatal fricative',
    articulate: 'Tongue raised toward the ridge behind upper teeth but not touching. Air flows over the tongue with friction. Lips slightly rounded.',
    example: 'šuma, škola, miš',
    contrast: 'Voiceless partner of ž',
    lips: 'rounded', tongue: 'alveolar-raised',
  },
  'ž': {
    ipa: '/ʒ/',
    approx: 'Like "s" in "measure" or French "j" in "jour" — voiced fricative',
    articulate: 'Same position as š but with vocal cords vibrating. Tongue raised near the ridge, air flows with friction.',
    example: 'žena, život, već',
    contrast: 'Voiced partner of š — add vibration to your throat',
    lips: 'rounded', tongue: 'alveolar-raised',
  },
  'đ': {
    ipa: '/dʑ/',
    approx: 'Like "j" in "judge" but softer — voiced palatal affricate',
    articulate: 'Voiced version of ć. Tongue blade touches hard palate, lips spread. Start with a "d" then release into the soft ć sound.',
    example: 'đak, đon, nađi',
    contrast: 'Voiced ć — same position but with vocal cords on',
    lips: 'spread', tongue: 'palatal',
  },
  'lj': {
    ipa: '/ʎ/',
    approx: 'Like "lli" in "million" as one sound — palatal lateral',
    articulate: 'Tongue body presses against the hard palate. Do not separate the l and j — it is one single liquid sound, not two.',
    example: 'ljubav, ljeto, polje',
    contrast: 'One sound, not "l" + "j" — the tongue is flat against the palate',
    lips: 'neutral', tongue: 'flat-palatal',
  },
  'nj': {
    ipa: '/ɲ/',
    approx: 'Like "ñ" in Spanish "mañana" — palatal nasal',
    articulate: 'Tongue body presses against the hard palate while air flows through the nose. One nasal sound, not "n" + "j".',
    example: 'njega, knjiga, konj',
    contrast: 'One nasal sound — tongue to palate, air through nose',
    lips: 'neutral', tongue: 'flat-palatal',
  },
  'r': {
    ipa: '/r̩/ (syllabic) or /r/',
    approx: 'Rolled/trilled "r" — alveolar trill',
    articulate: 'Tongue tip vibrates against the ridge just behind the upper front teeth. Relax the tongue completely, then let air flutter the tip. Can be syllabic in words like "krk", "trg", "vrh".',
    example: 'ruka, more, srce, krk',
    contrast: 'Not the English "r" — tongue tip must vibrate, not curl back',
    lips: 'neutral', tongue: 'tip-alveolar',
  },
};

// ── Croatian phoneme hints shown when a specific phoneme scores poorly ─────────
const PHONEME_HINTS = {
  'ć': 'Like English "ch" but softer — place tongue behind upper teeth',
  'č': 'Like English "ch" in "church" — harder than ć',
  'š': 'Like English "sh" in "shoe"',
  'ž': 'Like French "j" in "jour" or English "s" in "measure"',
  'đ': 'Like English "j" in "judge" but softer — voiced ć',
  'lj': 'Like Spanish "ll" in "llama" — one liquid sound',
  'nj': 'Like Spanish "ñ" in "mañana"',
  'r': 'Rolled "r" — vibrate the tongue tip against the ridge behind upper teeth',
};

// ── Full phoneme guide card (shown for Croatian-specific sounds) ──────────────
function PhonemeGuideCard({ phoneme }) {
  const [open, setOpen] = React.useState(false);
  const guide = PHONEME_GUIDES[phoneme] || PHONEME_GUIDES[phoneme?.toLowerCase()];
  if (!guide) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: '3px 0',
          fontSize: 11, color: '#0e7490', fontWeight: 700, fontFamily: "'Outfit',sans-serif",
          display: 'flex', alignItems: 'center', gap: 4,
        }}
      >
        <span>{open ? '▲' : '▼'}</span>
        {open ? 'Hide articulation guide' : `How to pronounce "${phoneme}"`}
      </button>
      {open && (
        <div style={{
          marginTop: 6, padding: '12px 14px', borderRadius: 10,
          background: 'linear-gradient(135deg,#f0f9ff,#e0f2fe)',
          border: '1.5px solid #bae6fd', fontSize: 12, lineHeight: 1.55,
        }}>
          {/* IPA + approximation */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: 'monospace', fontSize: 15, fontWeight: 900,
              color: '#0c4a6e', background: '#e0f2fe', borderRadius: 6,
              padding: '2px 8px', border: '1px solid #7dd3fc',
            }}>{guide.ipa}</span>
            <span style={{ color: '#0369a1', fontWeight: 700 }}>{guide.approx}</span>
          </div>
          {/* Articulation */}
          <div style={{ marginBottom: 6 }}>
            <span style={{ fontWeight: 800, color: '#0c4a6e' }}>Articulation: </span>
            <span style={{ color: '#1e293b' }}>{guide.articulate}</span>
          </div>
          {/* Contrast note */}
          {guide.contrast && (
            <div style={{ marginBottom: 6 }}>
              <span style={{ fontWeight: 800, color: '#7c3aed' }}>vs. similar sounds: </span>
              <span style={{ color: '#3730a3' }}>{guide.contrast}</span>
            </div>
          )}
          {/* Example words */}
          <div style={{ marginTop: 4 }}>
            <span style={{ fontWeight: 800, color: '#065f46' }}>Examples: </span>
            <span style={{
              fontFamily: 'serif', fontSize: 13, fontWeight: 700, color: '#064e3b',
              fontStyle: 'italic',
            }}>{guide.example}</span>
          </div>
          {/* Lip/tongue position indicator */}
          <div style={{
            marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap',
          }}>
            {[
              { label: 'Lips', value: guide.lips },
              { label: 'Tongue', value: guide.tongue },
            ].map(({ label, value }) => value && (
              <span key={label} style={{
                fontSize: 10, fontWeight: 700, padding: '2px 8px',
                borderRadius: 20, background: '#f0fdf4', border: '1px solid #86efac',
                color: '#166534',
              }}>{label}: {value}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Score threshold colours used throughout both modes
function scoreColor(s) {
  if (s >= 90) return '#16a34a';
  if (s >= 70) return '#d97706';
  return '#dc2626';
}
function scoreEmoji(s) {
  if (s >= 90) return '🟢';
  if (s >= 70) return '🟡';
  return '🔴';
}
function scoreLabel(s) {
  if (s >= 90) return 'Excellent!';
  if (s >= 70) return 'Good!';
  if (s >= 50) return 'Keep practicing';
  return 'Try again';
}

// ── Phoneme breakdown panel (Azure-mode only) ─────────────────────────────────
function PhonemeBreakdown({ phonemes }) {
  const [open, setOpen] = useState(false);
  if (!phonemes || phonemes.length === 0) return null;
  return (
    <div style={{ marginTop: 4 }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-label={open ? 'Hide phoneme breakdown' : 'Show phoneme breakdown'}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 10, color: 'var(--subtext,#94a3b8)', fontWeight: 600,
          padding: '2px 0', fontFamily: "'Outfit',sans-serif",
        }}
      >
        {open ? '▲ hide phonemes' : '▼ show phonemes'}
      </button>
      {open && (
        <div style={{ marginTop: 4 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
            {phonemes.map((p, i) => {
              const hint = PHONEME_HINTS[p.phoneme.toLowerCase()] || PHONEME_HINTS[p.phoneme] || null;
              return (
                <span
                  key={i}
                  title={hint || undefined}
                  style={{
                    display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
                    background: `${scoreColor(p.score)}18`,
                    border: `1.5px solid ${scoreColor(p.score)}55`,
                    borderRadius: 6, padding: '2px 7px',
                    cursor: hint ? 'help' : 'default',
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 700, color: scoreColor(p.score) }}>{p.phoneme}</span>
                  <span style={{ fontSize: 10, color: 'var(--subtext,#94a3b8)' }}>{p.score}%</span>
                </span>
              );
            })}
          </div>
          {/* Show articulation guide for any low-scoring Croatian-specific phoneme */}
          {phonemes.filter(p => p.score < 70 && PHONEME_GUIDES[p.phoneme.toLowerCase()]).slice(0, 1).map(p => (
            <PhonemeGuideCard key={p.phoneme} phoneme={p.phoneme.toLowerCase()} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Azure Assessment results panel ────────────────────────────────────────────
function AzureResultPanel({ azureResult, onRetry }) {
  // Find the single lowest-scoring phoneme across all words for a targeted tip.
  let worstPhoneme = null;
  let worstScore = Infinity;
  for (const w of azureResult.word_scores || []) {
    for (const p of w.phonemes || []) {
      if (p.score < worstScore) { worstScore = p.score; worstPhoneme = p.phoneme; }
    }
  }
  const worstHint = worstPhoneme
    ? (PHONEME_HINTS[worstPhoneme.toLowerCase()] || PHONEME_HINTS[worstPhoneme] || null)
    : null;

  const overall = azureResult.overall ?? 0;

  return (
    <div style={{
      background: '#f8fafc', borderRadius: 12, padding: '14px 16px',
      border: `2px solid ${scoreColor(overall)}22`,
    }}>
      {/* Header scores row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
          background: `${scoreColor(overall)}20`,
          border: `3px solid ${scoreColor(overall)}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 15, fontWeight: 900, color: scoreColor(overall),
        }}>{overall}%</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: scoreColor(overall) }}>
            {scoreEmoji(overall)} {scoreLabel(overall)} — {overall}%
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
            {[
              ['Accuracy', azureResult.accuracy],
              ['Fluency',  azureResult.fluency],
              ['Complete', azureResult.completeness],
            ].map(([label, val]) => (
              <span key={label} style={{
                fontSize: 11, fontWeight: 700,
                color: scoreColor(val ?? 0),
                background: `${scoreColor(val ?? 0)}15`,
                borderRadius: 6, padding: '2px 7px',
              }}>{label} {val ?? 0}%</span>
            ))}
          </div>
        </div>
      </div>

      {/* Word-by-word breakdown */}
      {azureResult.word_scores && azureResult.word_scores.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
            Word Scores
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {azureResult.word_scores.map((w, i) => (
              <div key={i} style={{
                background: '#fff', borderRadius: 10,
                border: `2px solid ${scoreColor(w.score)}40`,
                padding: '6px 10px', minWidth: 60,
              }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: scoreColor(w.score) }}>
                  {w.word}
                </div>
                <div style={{ fontSize: 11, color: 'var(--subtext,#94a3b8)' }}>{w.score}%</div>
                <PhonemeBreakdown phonemes={w.phonemes} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Targeted tip for worst phoneme + full articulation guide */}
      {worstPhoneme && worstScore < 90 && (
        <div style={{ marginBottom: 10 }}>
          {worstHint && (
            <div style={{
              padding: '8px 12px', borderRadius: 9,
              background: '#fefce8', border: '1.5px solid #fde047',
              fontSize: 12, color: '#713f12', marginBottom: 6,
            }}>
              <span style={{ fontWeight: 800 }}>💡 Tip for &quot;{worstPhoneme}&quot;:</span> {worstHint}
            </div>
          )}
          <PhonemeGuideCard phoneme={worstPhoneme} />
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={onRetry} aria-label="Try pronunciation again" style={{
          background: 'none', border: '1px solid var(--border,#e2e8f0)',
          borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
          fontSize: 12, fontWeight: 700, fontFamily: "'Outfit',sans-serif",
          color: 'var(--subtext)',
        }}><span aria-hidden="true">🔄</span> Try Again</button>
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--subtext,#94a3b8)', marginTop: 8 }}>
        Powered by Azure Pronunciation Assessment — phoneme-level accuracy.
      </div>
    </div>
  );
}

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

  // ── Levenshtein / similarity (existing, unchanged) ────────────────────────
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

  // ── Reset helper ──────────────────────────────────────────────────────────
  function resetAll() {
    setResult(null);
    setCoaching(null);
    setSrErrorMsg(null);
    setAzureResult(null);
    setState('idle');
    chunksRef.current = [];
  }

  // ── Web Speech API mode (existing, unchanged) ─────────────────────────────
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
      if (recRef.current === rec) setState(s => s === 'listening' ? 'idle' : s);
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

    const recorder = new MediaRecorder(stream, preferredMime ? { mimeType: preferredMime } : {});
    chunksRef.current = [];

    recorder.ondataavailable = e => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      // Stop all tracks so the mic indicator light goes off.
      stream.getTracks().forEach(t => t.stop());

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
    // Convert Blob → base64
    let audioBase64;
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
      audioBase64 = btoa(binary);
    } catch {
      setSrErrorMsg('Could not process audio. Please try again.');
      setState('idle');
      return;
    }

    try {
      const res = await fetch('/api/pronunciation-assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64,
          referenceText: targetText,
          locale: 'hr-HR',
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        // Azure not configured or unavailable — fall back to Web Speech API mode.
        if (data?.error === 'not_configured' || !res.ok) {
          setMode('webspeech');
          startWebSpeech();
          return;
        }
        throw new Error(data?.error || 'API error');
      }

      setAzureResult(data);
      setState('scored');
      // Emit a synthetic onScore event so parent components still get feedback.
      if (onScore) onScore({ spoken: targetText, score: data.overall ?? 0 });
    } catch (fetchErr) {
      console.warn('PronunciationScorer: Azure assess failed, falling back to Web Speech:', fetchErr?.message);
      // Graceful fallback: try Web Speech API.
      if (webSpeechSupported) {
        setMode('webspeech');
        startWebSpeech();
      } else {
        setSrErrorMsg('Pronunciation assessment unavailable. Please try again later.');
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

  // ── AI Coaching fetch (existing, unchanged) ───────────────────────────────
  const fetchCoaching = useCallback(async (spoken, score) => {
    setCoaching('loading');
    try {
      const res = await fetch('/api/pronunciation-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: targetText, spoken, score, level }),
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setCoaching(data);
    } catch {
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

      {/* ── SCORED: Web Speech result (existing UI, unchanged) ── */}
      {state === 'scored' && result && !azureResult && (
        <div style={{
          background: '#f8fafc', borderRadius: 12, padding: '14px 16px',
          border: `2px solid ${scoreColor(result.score)}22`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
              background: `${scoreColor(result.score)}20`,
              border: `3px solid ${scoreColor(result.score)}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 17, fontWeight: 900, color: scoreColor(result.score),
            }}>{result.score}%</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: scoreColor(result.score) }}>
                {scoreEmoji(result.score)} {scoreLabel(result.score)} {result.score}%
              </div>
              <div style={{ fontSize: 12, color: 'var(--subtext)' }}>You said: "{result.spoken}"</div>
            </div>
          </div>

          {/* AI Coaching button — only if score < 90 and no coaching yet */}
          {result.score < 90 && !coaching && (
            <button
              onClick={() => fetchCoaching(result.spoken, result.score)}
              style={{
                display: 'block', width: '100%', marginBottom: 8,
                padding: '8px', borderRadius: 9, border: '1.5px solid #c4b5fd',
                background: '#f5f3ff', color: '#6d28d9', fontWeight: 700, fontSize: 12,
                cursor: 'pointer', fontFamily: "'Outfit',sans-serif",
              }}
            >
              🎓 Get AI Coaching
            </button>
          )}

          {coaching === 'loading' && (
            <div style={{ padding: '8px 12px', borderRadius: 9, background: '#f5f3ff', border: '1.5px solid #c4b5fd', fontSize: 12, color: '#6d28d9', fontWeight: 600, marginBottom: 8 }}>
              Analyzing your pronunciation…
            </div>
          )}

          {coaching && coaching !== 'loading' && (
            <div style={{ padding: '12px 14px', borderRadius: 10, background: '#f5f3ff', border: '1.5px solid #c4b5fd', marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#6d28d9', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                🎓 AI Coaching
              </div>
              <div style={{ fontSize: 13, color: 'var(--heading)', lineHeight: 1.6, marginBottom: coaching.phonetic_guide ? 6 : 0 }}>
                {coaching.feedback}
              </div>
              {coaching.phonetic_guide && (
                <div style={{ fontSize: 12, color: '#6d28d9', fontFamily: 'monospace', background: '#ede9fe', padding: '4px 8px', borderRadius: 6, marginBottom: coaching.drills?.length ? 8 : 0 }}>
                  {coaching.phonetic_guide}
                </div>
              )}
              {coaching.drills && coaching.drills.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#6d28d9', marginBottom: 4 }}>Practice these:</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {coaching.drills.map((d, i) => (
                      <span key={i} title={d.tip} style={{
                        padding: '3px 10px', borderRadius: 20, background: '#ede9fe',
                        color: '#5b21b6', fontWeight: 700, fontSize: 13, cursor: 'default',
                      }}>{d.word}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={resetAll} style={{
              background: 'none', border: '1px solid var(--border,#e2e8f0)',
              borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
              fontSize: 12, fontWeight: 700, fontFamily: "'Outfit',sans-serif",
              color: 'var(--subtext)',
            }}>🔄 Try Again</button>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--subtext,#94a3b8)', marginTop: 8 }}>
            Score based on Web Speech API recognition — not a professional pronunciation evaluator.
          </div>
        </div>
      )}
    </div>
  );
}
