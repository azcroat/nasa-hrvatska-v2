import React from 'react';
import { H } from '../../data';
import { isAndroid, isSpeechRecognitionSupported } from '../../lib/platform.js';

interface Props {
  level: string;
  onStart: () => void;
  onBack: () => void;
  isOnline?: boolean;
}

export default function SprintSetupScreen({ level, onStart, onBack, isOnline = true }: Props) {
  const srSupported = isSpeechRecognitionSupported();
  return (
    <div className="scr-wrap" style={{ padding: '0 16px 32px', maxWidth: 600, margin: '0 auto' }}>
      {H('🎤 Speaking Sprint', 'Listen · Speak · Compare', undefined)}

      {/* Android WebView — microphone / speech recognition not supported */}
      {isAndroid() && !srSupported && (
        <div
          style={{
            marginBottom: 16,
            padding: '12px 16px',
            background: 'rgba(14,116,144,.08)',
            border: '1.5px solid rgba(14,116,144,.3)',
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 600,
            color: '#0e4f5c',
            display: 'flex',
            gap: 10,
            alignItems: 'center',
          }}
        >
          <span>📝</span>
          <span>
            Speech recognition isn't available in this app view — you can still type your Croatian
            responses to compare with the model answer.
          </span>
        </div>
      )}

      {/* Offline warning */}
      {!isOnline && (
        <div
          style={{
            marginBottom: 16,
            padding: '12px 16px',
            background: 'rgba(245,158,11,.1)',
            border: '1.5px solid rgba(245,158,11,.4)',
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 600,
            color: '#92400e',
            display: 'flex',
            gap: 10,
            alignItems: 'center',
          }}
        >
          <span>📡</span>
          <span>
            You're offline. TTS audio and transcription need an internet connection. You can still
            type your responses.
          </span>
        </div>
      )}

      {/* Level pill */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <span
          style={{
            display: 'inline-block',
            padding: '4px 14px',
            borderRadius: 20,
            background: 'rgba(217,119,6,.12)',
            border: '1px solid rgba(217,119,6,.3)',
            color: '#d97706',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 0.5,
          }}
        >
          Level: {level}
        </span>
      </div>

      {/* How it works */}
      <div
        style={{
          background: 'var(--card-bg, #f8fafc)',
          border: '1px solid var(--border, #e2e8f0)',
          borderRadius: 16,
          padding: '20px 24px',
          marginBottom: 28,
        }}
      >
        <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'var(--subtext)' }}>
          HOW IT WORKS
        </p>
        {[
          {
            num: '1',
            label: 'Hear the prompt',
            sub: 'A Croatian question or topic appears on screen',
          },
          {
            num: '2',
            label: 'Speak your answer',
            sub: 'Respond in Croatian — we transcribe your speech live',
          },
          {
            num: '3',
            label: 'Compare with a native',
            sub: 'Hear an ElevenLabs model response and compare',
          },
        ].map((step) => (
          <div
            key={step.num}
            style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                flexShrink: 0,
                background: 'linear-gradient(135deg, #d4002d, #e63946)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 14,
                fontWeight: 800,
              }}
            >
              {step.num}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{step.label}</div>
              <div style={{ fontSize: 13, color: 'var(--subtext)', marginTop: 2 }}>{step.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* XP note */}
      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--subtext)', marginBottom: 24 }}>
        +5 XP per round completed
      </p>

      <button
        onClick={onStart}
        style={{
          display: 'block',
          width: '100%',
          padding: '16px 0',
          background: 'linear-gradient(135deg, #d4002d, #e63946)',
          color: '#fff',
          border: 'none',
          borderRadius: 14,
          fontSize: 18,
          fontWeight: 800,
          cursor: 'pointer',
          letterSpacing: 0.3,
        }}
      >
        Start Sprint →
      </button>

      <button
        onClick={onBack}
        style={{
          display: 'block',
          width: '100%',
          marginTop: 12,
          padding: '12px 0',
          background: 'transparent',
          border: 'none',
          color: 'var(--subtext)',
          fontSize: 15,
          cursor: 'pointer',
        }}
      >
        ← Back
      </button>
    </div>
  );
}
