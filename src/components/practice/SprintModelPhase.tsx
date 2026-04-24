import React from 'react';

interface SprintPrompt {
  hr: string;
  en: string;
  model_response: string;
}

interface Props {
  currentPrompt: SprintPrompt;
  ttsLoading: boolean;
  ttsError: string | null;
  audioUrl: string | null;
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
  userTranscript: string;
  onGetFeedback: () => void;
}

export default function SprintModelPhase({
  currentPrompt,
  ttsLoading,
  ttsError,
  audioUrl,
  audioRef,
  userTranscript,
  onGetFeedback,
}: Props) {
  return (
    <div className="scr-wrap" style={{ padding: '0 16px 32px', maxWidth: 600, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <p style={{ fontSize: 13, color: 'var(--subtext)', fontWeight: 600, marginBottom: 4 }}>
          NOW HEAR A NATIVE RESPONSE
        </p>
        <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
          {currentPrompt.hr}
        </p>
      </div>

      {/* Model response text */}
      <div
        style={{
          background: 'rgba(22,163,74,.07)',
          border: '1px solid rgba(22,163,74,.2)',
          borderRadius: 14,
          padding: '20px 20px',
          marginBottom: 20,
          textAlign: 'center',
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: '#16a34a',
            display: 'block',
            marginBottom: 8,
          }}
        >
          NATIVE RESPONSE
        </span>
        <p
          style={{
            fontSize: 17,
            fontWeight: 600,
            color: 'var(--text)',
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {currentPrompt.model_response}
        </p>
      </div>

      {/* Audio controls */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        {ttsLoading ? (
          <p style={{ color: 'var(--subtext)', fontSize: 14 }}>Loading audio…</p>
        ) : ttsError ? (
          <p style={{ color: '#dc2626', fontSize: 13 }}>{ttsError}</p>
        ) : audioUrl ? (
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.currentTime = 0;
                  audioRef.current.play().catch(() => {});
                } else {
                  const a = new Audio(audioUrl);
                  audioRef.current = a;
                  a.play().catch(() => {});
                }
              }}
              style={{
                padding: '10px 22px',
                borderRadius: 10,
                border: '1px solid rgba(22,163,74,.3)',
                background: 'rgba(22,163,74,.1)',
                color: '#16a34a',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ▶ Play again
            </button>
            <button
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.pause();
                }
              }}
              style={{
                padding: '10px 18px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--card-bg)',
                color: 'var(--subtext)',
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              ⏸ Pause
            </button>
          </div>
        ) : null}
      </div>

      {/* User's response */}
      {userTranscript && (
        <div
          style={{
            background: 'rgba(14,116,144,.07)',
            border: '1px solid rgba(14,116,144,.2)',
            borderRadius: 14,
            padding: '16px 20px',
            marginBottom: 20,
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
            YOU SAID:
          </span>
          <p style={{ fontSize: 15, margin: 0, color: 'var(--text)', fontStyle: 'italic' }}>
            {userTranscript}
          </p>
        </div>
      )}

      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--subtext)', marginBottom: 20 }}>
        Compare your response with the native speaker above, then get AI feedback below.
      </p>

      <button
        onClick={onGetFeedback}
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
        }}
      >
        Get AI Feedback →
      </button>
    </div>
  );
}
