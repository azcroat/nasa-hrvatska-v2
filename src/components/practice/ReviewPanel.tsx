import React from 'react';
import type { Recommendations } from '../../hooks/useSmartRecommendations';

/**
 * Review intent panel — SRS-due card, flashcards/listening-comprehension entry
 * points, weak-word drill, and the Smart Review (adaptive) CTA. Extracted from
 * PracticeTab as part of the 1d decomposition. Takes the recs bundle + the review
 * handlers + weak-message state. Behavior-identical to the prior block.
 */
export default function ReviewPanel({
  recs,
  startReview,
  startFlashcards,
  startWeakWords,
  weakMsg,
  setWeakMsg,
  setScr,
  sCurEx,
}: {
  recs: Recommendations;
  startReview: () => void;
  startFlashcards: () => void;
  startWeakWords: () => void;
  weakMsg: string;
  setWeakMsg: (m: string) => void;
  setScr: (id: string) => void;
  sCurEx: (id: string) => void;
}) {
  const { dueReviews, weakCount } = recs;
  return (
    <div>
      {dueReviews.length > 0 ? (
        <button
          onClick={startReview}
          className="milestone-card"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '16px 18px',
            marginBottom: 12,
            border: 'none',
            cursor: 'pointer',
            fontFamily: "'Outfit',sans-serif",
            textAlign: 'left',
          }}
        >
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 14,
              flexShrink: 0,
              background: 'rgba(255,255,255,.18)',
              border: '2px solid rgba(255,255,255,.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
            }}
          >
            📅
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: 'rgba(255,255,255,.65)',
                textTransform: 'uppercase',
                letterSpacing: '.1em',
                marginBottom: 2,
              }}
            >
              SRS REVIEW DUE
            </div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>
              {dueReviews.length} word{dueReviews.length !== 1 ? 's' : ''} waiting
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', marginTop: 1 }}>
              Spaced repetition keeps words in long-term memory
            </div>
          </div>
          <div style={{ fontSize: 22, color: 'rgba(255,255,255,.85)', fontWeight: 300 }}>›</div>
        </button>
      ) : (
        <div
          className="tip-box-success"
          style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}
        >
          <span style={{ fontSize: 22 }}>✅</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--success)' }}>
              All caught up!
            </div>
            <div style={{ fontSize: 12, color: 'var(--subtext)', marginTop: 2 }}>
              No reviews due. Keep practicing to grow your queue.
            </div>
          </div>
        </div>
      )}
      {[
        {
          icon: '🃏',
          label: 'Flashcards',
          desc: 'Spaced repetition review',
          color: 'rgba(124,58,237,.07)',
          border: 'rgba(124,58,237,.25)',
          grad: 'linear-gradient(135deg,#7c3aed,#5b21b6)',
          shadow: 'rgba(124,58,237,.3)',
          fn: startFlashcards,
        },
        {
          icon: '🎧',
          label: 'Listening Comprehension',
          desc: 'Read Croatian · choose the meaning · A1→B2',
          color: 'rgba(14,116,144,.07)',
          border: 'rgba(14,116,144,.25)',
          grad: 'linear-gradient(135deg,#0e7490,#0c4a6e)',
          shadow: 'rgba(14,116,144,.3)',
          fn: () => {
            setScr('listening_comprehension');
            sCurEx('listening_comprehension');
          },
        },
      ].map((r, i) => (
        <button
          key={i}
          onClick={r.fn}
          className="tc"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '14px 18px',
            marginBottom: 10,
            border: `1.5px solid ${r.border}`,
            background: r.color,
            cursor: 'pointer',
            textAlign: 'left',
            fontFamily: "'Outfit',sans-serif",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 13,
              flexShrink: 0,
              background: r.grad,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              boxShadow: `0 4px 12px ${r.shadow}`,
            }}
          >
            {r.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--heading)' }}>{r.label}</div>
            <div style={{ fontSize: 12, color: 'var(--subtext)', marginTop: 1 }}>{r.desc}</div>
          </div>
          <div style={{ fontSize: 18, fontWeight: 300, opacity: 0.6, color: 'var(--subtext)' }}>
            ›
          </div>
        </button>
      ))}
      {weakCount >= 3 && (
        <button
          onClick={startWeakWords}
          className="tc"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '14px 18px',
            marginBottom: 10,
            border: '1.5px solid rgba(239,68,68,.25)',
            background: 'rgba(239,68,68,.07)',
            cursor: 'pointer',
            textAlign: 'left',
            fontFamily: "'Outfit',sans-serif",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 13,
              flexShrink: 0,
              background: 'linear-gradient(135deg,#dc2626,#991b1b)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              boxShadow: '0 4px 12px rgba(220,38,38,.3)',
            }}
          >
            🎯
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--heading)' }}>
              Weak Word Drill
            </div>
            <div style={{ fontSize: 12, color: 'var(--subtext)', marginTop: 1 }}>
              {weakCount} words that need more practice
            </div>
          </div>
          <div style={{ fontSize: 18, fontWeight: 300, opacity: 0.6, color: 'var(--subtext)' }}>
            ›
          </div>
        </button>
      )}
      {weakMsg && (
        <div
          className="empty-state"
          style={{
            background: '#fffbeb',
            border: '1.5px solid #fde68a',
            borderRadius: 16,
            marginBottom: 12,
            position: 'relative',
          }}
        >
          <div className="es-icon">🧠</div>
          <div className="es-title">Not enough weak words yet</div>
          <div className="es-desc">{weakMsg}</div>
          <button
            onClick={() => setWeakMsg('')}
            style={{
              position: 'absolute',
              top: 10,
              right: 12,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 18,
              color: '#92400e',
              lineHeight: 1,
              opacity: 0.6,
            }}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}
      {/* ── SMART REVIEW — featured at bottom of review panel ───── */}
      <button
        onClick={() => {
          setScr('adaptive_review');
          sCurEx('adaptive_review');
        }}
        className="tc"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '14px 18px',
          marginBottom: 10,
          border: '1.5px solid rgba(16,185,129,.3)',
          background: 'linear-gradient(135deg,rgba(16,185,129,.08),rgba(5,150,105,.04))',
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: "'Outfit',sans-serif",
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 13,
            flexShrink: 0,
            background: 'linear-gradient(135deg,#059669,#047857)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            boxShadow: '0 4px 12px rgba(5,150,105,.3)',
          }}
        >
          🧠
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--heading)' }}>
              Smart Review
            </div>
            <span
              style={{
                fontSize: 9,
                fontWeight: 900,
                letterSpacing: '.05em',
                background: 'linear-gradient(135deg,#059669,#047857)',
                color: '#fff',
                borderRadius: 5,
                padding: '2px 6px',
              }}
            >
              AI
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--subtext)', marginTop: 1 }}>
            Personalized session from your weak spots, mistakes &amp; overdue cards
          </div>
        </div>
        <div style={{ fontSize: 18, fontWeight: 300, opacity: 0.6, color: 'var(--subtext)' }}>
          ›
        </div>
      </button>
    </div>
  );
}
