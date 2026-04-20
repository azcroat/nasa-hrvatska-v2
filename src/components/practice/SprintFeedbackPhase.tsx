import React from 'react';

function computeFeedback(userSaid, modelResponse) {
  const clean = (s) =>
    s
      .toLowerCase()
      .replace(/[.,?!;:'"—–-]/g, '')
      .split(/\s+/)
      .filter(Boolean);
  const userWords = new Set(clean(userSaid));
  const modelWords = clean(modelResponse);
  if (modelWords.length === 0) return { grade: 'skip', overlap: 0, missing: [] };
  const shared = modelWords.filter((w) => userWords.has(w));
  const overlap = shared.length / modelWords.length;
  const missing = modelWords.filter((w) => !userWords.has(w)).slice(0, 3);
  let grade = 'low';
  if (overlap > 0.6) grade = 'high';
  else if (overlap > 0.3) grade = 'mid';
  return { grade, overlap, missing };
}

export default function SprintFeedbackPhase({
  currentPrompt,
  userTranscript,
  rounds,
  onNextRound,
  onDone,
}) {
  const { grade, missing } = computeFeedback(userTranscript, currentPrompt.model_response);
  const keyPhrase = currentPrompt.model_response.split(/\s+/).slice(0, 5).join(' ');

  const gradeConfig = {
    high: {
      emoji: '🌟',
      title: 'Izvrsno!',
      sub: 'Your response covered the key content.',
      color: '#16a34a',
      bg: 'rgba(22,163,74,.07)',
      border: 'rgba(22,163,74,.2)',
    },
    mid: {
      emoji: '👍',
      title: 'Dobro!',
      sub: 'You got the main idea across.',
      color: '#d97706',
      bg: 'rgba(217,119,6,.07)',
      border: 'rgba(217,119,6,.2)',
    },
    low: {
      emoji: '💪',
      title: 'Pokušaj ponovo!',
      sub: `Try to use more of these key words: ${missing.join(', ') || '—'}`,
      color: '#dc2626',
      bg: 'rgba(220,38,38,.07)',
      border: 'rgba(220,38,38,.2)',
    },
    skip: {
      emoji: '⏭️',
      title: 'Skipped',
      sub: 'No response recorded — listen and try next time!',
      color: 'var(--subtext)',
      bg: 'var(--card-bg)',
      border: 'var(--border)',
    },
  };
  const cfg = gradeConfig[grade] || gradeConfig.skip;

  return (
    <div className="scr-wrap" style={{ padding: '0 16px 32px', maxWidth: 600, margin: '0 auto' }}>
      {/* Grade banner */}
      <div
        style={{
          background: cfg.bg,
          border: `1px solid ${cfg.border}`,
          borderRadius: 16,
          padding: '20px 24px',
          marginBottom: 20,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 8 }}>{cfg.emoji}</div>
        <p style={{ fontSize: 22, fontWeight: 800, color: cfg.color, margin: '0 0 6px' }}>
          {cfg.title}
        </p>
        <p style={{ fontSize: 14, color: 'var(--subtext)', margin: 0 }}>{cfg.sub}</p>
      </div>

      {/* XP badge */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <span
          style={{
            display: 'inline-block',
            padding: '6px 18px',
            borderRadius: 20,
            background: 'rgba(124,58,237,.1)',
            border: '1px solid rgba(124,58,237,.25)',
            color: '#7c3aed',
            fontSize: 15,
            fontWeight: 800,
          }}
        >
          +5 XP earned
        </span>
      </div>

      {/* Model response */}
      <div
        style={{
          background: 'rgba(22,163,74,.07)',
          border: '1px solid rgba(22,163,74,.2)',
          borderRadius: 12,
          padding: '14px 18px',
          marginBottom: 14,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: '#16a34a',
            display: 'block',
            marginBottom: 6,
          }}
        >
          NATIVE RESPONSE
        </span>
        <p style={{ margin: 0, fontSize: 15, color: 'var(--text)', lineHeight: 1.5 }}>
          {currentPrompt.model_response}
        </p>
      </div>

      {/* User's response */}
      {userTranscript ? (
        <div
          style={{
            background: 'rgba(14,116,144,.07)',
            border: '1px solid rgba(14,116,144,.2)',
            borderRadius: 12,
            padding: '14px 18px',
            marginBottom: 14,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#0e7490',
              display: 'block',
              marginBottom: 6,
            }}
          >
            YOU SAID
          </span>
          <p
            style={{
              margin: 0,
              fontSize: 15,
              color: 'var(--text)',
              fontStyle: 'italic',
              lineHeight: 1.5,
            }}
          >
            {userTranscript}
          </p>
        </div>
      ) : (
        <div
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '14px 18px',
            marginBottom: 14,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--subtext)',
              display: 'block',
              marginBottom: 4,
            }}
          >
            YOU SAID
          </span>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--subtext)', fontStyle: 'italic' }}>
            No response recorded
          </p>
        </div>
      )}

      {/* Key phrase takeaway */}
      <div
        style={{
          background: 'rgba(124,58,237,.07)',
          border: '1px solid rgba(124,58,237,.2)',
          borderRadius: 12,
          padding: '14px 18px',
          marginBottom: 24,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: '#7c3aed',
            display: 'block',
            marginBottom: 6,
          }}
        >
          KEY PHRASE TO REMEMBER
        </span>
        <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
          "{keyPhrase}…"
        </p>
      </div>

      {/* Rounds counter */}
      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--subtext)', marginBottom: 20 }}>
        Rounds completed: {rounds + 1} · Total XP this session: {(rounds + 1) * 5}
      </p>

      {/* Navigation */}
      <button
        onClick={onNextRound}
        style={{
          display: 'block',
          width: '100%',
          padding: '14px 0',
          background: 'linear-gradient(135deg, #d4002d, #e63946)',
          color: '#fff',
          border: 'none',
          borderRadius: 12,
          fontSize: 16,
          fontWeight: 700,
          cursor: 'pointer',
          marginBottom: 10,
        }}
      >
        🔁 Next Round
      </button>

      <button
        onClick={onDone}
        style={{
          display: 'block',
          width: '100%',
          padding: '12px 0',
          background: 'transparent',
          border: '1px solid var(--border)',
          borderRadius: 12,
          color: 'var(--subtext)',
          fontSize: 15,
          cursor: 'pointer',
        }}
      >
        ← Done
      </button>
    </div>
  );
}
