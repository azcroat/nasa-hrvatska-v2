import React, { useState, useRef, useCallback } from 'react';

/**
 * @param {{ targetText: string, level?: string, onScore?: (r: {spoken: string, score: number}) => void }} props
 */
export default function PronunciationScorer({ targetText, level = 'B1', onScore }) {
  const [state, setState] = useState('idle'); // idle | listening | scored | unsupported
  const [result, setResult] = useState(/** @type {{spoken:string,score:number}|null} */ (null));
  const [coaching, setCoaching] = useState(null); // null | 'loading' | {feedback,issue,phonetic_guide,drills}
  const recRef = useRef(/** @type {any} */ (null));

  const supported = !!(
    (typeof window !== 'undefined') &&
    (/** @type {any} */ (window).SpeechRecognition || /** @type {any} */ (window).webkitSpeechRecognition)
  );

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

  function start() {
    if (!supported) { setState('unsupported'); return; }
    setCoaching(null);
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
    rec.onerror = () => setState('idle');
    rec.onend = () => {
      if (recRef.current === rec) setState(s => s === 'listening' ? 'idle' : s);
    };
    recRef.current = rec;
    rec.start();
    setState('listening');
  }

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

  function scoreColor(s) {
    if (s >= 90) return '#16a34a';
    if (s >= 70) return '#d97706';
    if (s >= 50) return '#ea580c';
    return '#dc2626';
  }
  function scoreEmoji(s) {
    if (s >= 90) return '🟢';
    if (s >= 70) return '🟡';
    if (s >= 50) return '🟠';
    return '🔴';
  }
  function scoreLabel(s) {
    if (s >= 90) return 'Excellent!';
    if (s >= 70) return 'Good!';
    if (s >= 50) return 'Keep practicing';
    return 'Try again';
  }

  if (!supported) return (
    <div style={{ fontSize: 12, color: 'var(--subtext)', fontStyle: 'italic', marginTop: 8 }}>
      Pronunciation scoring requires Chrome or Edge browser.
    </div>
  );

  return (
    <div style={{ marginTop: 12 }}>
      {state === 'idle' && (
        <button onClick={start} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'linear-gradient(135deg,#0e7490,#164e63)',
          color: '#fff', border: 'none', borderRadius: 10,
          padding: '10px 18px', cursor: 'pointer',
          fontSize: 13, fontWeight: 700, fontFamily: "'Outfit',sans-serif",
        }}>
          🎙️ Test My Pronunciation
        </button>
      )}
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
      {state === 'scored' && result && (
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
            <button onClick={start} style={{
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
