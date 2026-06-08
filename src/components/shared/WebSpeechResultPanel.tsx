import React from 'react';
import { scoreColor, scoreEmoji, scoreLabel } from './pronunciationUtils.js';

// ── Web Speech API scored result panel ───────────────────────────────────────
interface WebSpeechDrill {
  word: string;
  tip?: string;
}
interface WebSpeechCoaching {
  feedback?: string;
  phonetic_guide?: string;
  drills?: WebSpeechDrill[];
}
interface WebSpeechResult {
  /** null when the word was recognised only via English translation — no acoustic score available. */
  score: number | null;
  spoken?: string;
  recognizedViaTranslation?: boolean;
}
export default function WebSpeechResultPanel({
  result,
  coaching,
  onRetry,
  onGetCoaching,
}: {
  result: WebSpeechResult;
  coaching?: WebSpeechCoaching | 'loading' | null;
  onRetry?: () => void;
  onGetCoaching?: () => void;
}) {
  // When score is null the word was only matched via English translation — no numeric score.
  const isUnscored = result.score === null;
  // Safe colour/emoji/label helpers — only called when score is a real number.
  const scoreNum = result.score ?? 0;

  return (
    <div
      style={{
        background: 'var(--card)',
        borderRadius: 12,
        padding: '14px 16px',
        border: isUnscored ? '2px solid #16a34a44' : `2px solid ${scoreColor(scoreNum)}22`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        {isUnscored ? (
          /* Translation-only result: qualitative badge, no number */
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              flexShrink: 0,
              background: '#16a34a20',
              border: '3px solid #16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
            }}
          >
            ✓
          </div>
        ) : (
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              flexShrink: 0,
              background: `${scoreColor(scoreNum)}20`,
              border: `3px solid ${scoreColor(scoreNum)}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 17,
              fontWeight: 900,
              color: scoreColor(scoreNum),
            }}
          >
            {scoreNum}%
          </div>
        )}
        <div>
          {isUnscored ? (
            <>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#16a34a' }}>
                Recognized ✓ (accent not scored)
              </div>
              <div style={{ fontSize: 12, color: 'var(--subtext)' }}>
                Browser matched the meaning — pronunciation was understood
              </div>
            </>
          ) : (
            <>
              <div style={{ fontWeight: 800, fontSize: 15, color: scoreColor(scoreNum) }}>
                {scoreEmoji(scoreNum)} {scoreLabel(scoreNum)} {scoreNum}%
              </div>
              <div style={{ fontSize: 12, color: 'var(--subtext)' }}>
                You said: &ldquo;{result.spoken}&rdquo;
              </div>
            </>
          )}
        </div>
      </div>

      {/* AI Coaching button — only when a real numeric score is available and < 90 */}
      {!isUnscored && scoreNum < 90 && !coaching && (
        <button
          onClick={onGetCoaching}
          style={{
            display: 'block',
            width: '100%',
            marginBottom: 8,
            padding: '8px',
            borderRadius: 9,
            border: '1.5px solid #c4b5fd',
            background: '#f5f3ff',
            color: '#6d28d9',
            fontWeight: 700,
            fontSize: 12,
            cursor: 'pointer',
            fontFamily: "'Outfit',sans-serif",
          }}
        >
          🎓 Get AI Coaching
        </button>
      )}

      {coaching === 'loading' && (
        <div
          style={{
            padding: '8px 12px',
            borderRadius: 9,
            background: '#f5f3ff',
            border: '1.5px solid #c4b5fd',
            fontSize: 12,
            color: '#6d28d9',
            fontWeight: 600,
            marginBottom: 8,
          }}
        >
          Analyzing your pronunciation…
        </div>
      )}

      {coaching && coaching !== 'loading' && (
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 10,
            background: '#f5f3ff',
            border: '1.5px solid #c4b5fd',
            marginBottom: 8,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: '#6d28d9',
              marginBottom: 4,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            🎓 AI Coaching
          </div>
          <div
            style={{
              fontSize: 13,
              color: 'var(--heading)',
              lineHeight: 1.6,
              marginBottom: coaching.phonetic_guide ? 6 : 0,
            }}
          >
            {coaching.feedback}
          </div>
          {coaching.phonetic_guide && (
            <div
              style={{
                fontSize: 12,
                color: '#6d28d9',
                fontFamily: 'monospace',
                background: '#ede9fe',
                padding: '4px 8px',
                borderRadius: 6,
                marginBottom: coaching.drills?.length ? 8 : 0,
              }}
            >
              {coaching.phonetic_guide}
            </div>
          )}
          {coaching.drills && coaching.drills.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6d28d9', marginBottom: 4 }}>
                Practice these:
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {coaching.drills.map((d: WebSpeechDrill, i: number) => (
                  <span
                    key={i}
                    title={d.tip}
                    style={{
                      padding: '3px 10px',
                      borderRadius: 20,
                      background: '#ede9fe',
                      color: '#5b21b6',
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: 'default',
                    }}
                  >
                    {d.word}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onRetry}
          style={{
            background: 'none',
            border: '1px solid var(--border,#e2e8f0)',
            borderRadius: 8,
            padding: '6px 14px',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 700,
            fontFamily: "'Outfit',sans-serif",
            color: 'var(--subtext)',
          }}
        >
          🔄 Try Again
        </button>
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--subtext,#94a3b8)', marginTop: 8 }}>
        {isUnscored
          ? 'Browser speech recognition — accent not professionally scored'
          : 'Score based on Web Speech API recognition — not a professional pronunciation evaluator.'}
      </div>
    </div>
  );
}
