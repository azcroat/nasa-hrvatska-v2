import React from 'react';
import { isSpeechRecognitionSupported } from '../../lib/platform.js';
import MicPermissionDeniedExplainer from '../shared/MicPermissionDeniedExplainer';

// Evaluate once at module load — avoids re-checking on every render.
// Android WebView returns false here; Chrome desktop and Safari return true.
const SR_SUPPORTED = isSpeechRecognitionSupported();

interface SprintPrompt {
  hr: string;
  en: string;
  model_response: string;
}

interface Props {
  rounds: number;
  level: string;
  currentPrompt: SprintPrompt;
  micDenied: boolean;
  isRecording: boolean;
  liveTranscript: string;
  textInput: string;
  onTextInputChange: (v: string) => void;
  onStartListening: () => void;
  onDoneSpeaking: () => void;
  onSkip: () => void;
}

export default function SprintSpeakingPhase({
  rounds,
  level,
  currentPrompt,
  micDenied,
  isRecording,
  liveTranscript,
  textInput,
  onTextInputChange,
  onStartListening,
  onDoneSpeaking,
  onSkip,
}: Props) {
  return (
    <div className="scr-wrap" style={{ padding: '0 16px 32px', maxWidth: 600, margin: '0 auto' }}>
      {/* Round indicator */}
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--subtext)', fontWeight: 600 }}>
          ROUND {rounds + 1} · {level}
        </span>
      </div>

      {/* Croatian prompt */}
      <div
        style={{
          background: 'var(--card-bg, #f8fafc)',
          border: '1px solid var(--border, #e2e8f0)',
          borderRadius: 16,
          padding: '28px 24px',
          marginBottom: 12,
          textAlign: 'center',
        }}
      >
        <p
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: 'var(--text)',
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          {currentPrompt.hr}
        </p>
        <p style={{ fontSize: 14, color: 'var(--subtext)', marginTop: 10, marginBottom: 0 }}>
          {currentPrompt.en}
        </p>
      </div>

      {/* Recording indicator / mic denied fallback / no SR fallback */}
      {micDenied || !SR_SUPPORTED ? (
        <div style={{ marginBottom: 16 }}>
          {micDenied ? (
            <MicPermissionDeniedExplainer onRetry={onStartListening} />
          ) : (
            <p style={{ fontSize: 13, color: '#d97706', marginBottom: 10, textAlign: 'center' }}>
              Speech recognition not available — type your response:
            </p>
          )}
          <textarea
            value={textInput}
            onChange={(e) => onTextInputChange(e.target.value)}
            placeholder="Napišite odgovor ovdje... (Type your Croatian response)"
            rows={3}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '12px 14px',
              borderRadius: 10,
              border: '1px solid var(--border, #e2e8f0)',
              fontSize: 15,
              fontFamily: 'inherit',
              resize: 'vertical',
              background: 'var(--card-bg)',
              color: 'var(--text)',
            }}
          />
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          {/* Pulsing red dot */}
          <div style={{ position: 'relative', width: 64, height: 64, marginBottom: 10 }}>
            {isRecording && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  border: '2px solid rgba(212,0,45,0.5)',
                  animation: 'sprint-pulse 1.4s ease-out infinite',
                }}
              />
            )}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: isRecording ? '#d4002d' : '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: isRecording ? 'sprint-rec-dot 1s ease-in-out infinite' : 'none',
              }}
            >
              <span style={{ fontSize: 16 }}>🎤</span>
            </div>
          </div>
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: isRecording ? '#d4002d' : 'var(--subtext)',
            }}
          >
            {isRecording ? 'Recording… speak now' : 'Tap "Start Recording" to begin'}
          </span>
          {!isRecording && (
            <button
              onClick={onStartListening}
              style={{
                marginTop: 10,
                padding: '10px 24px',
                borderRadius: 10,
                background: '#d4002d',
                color: '#fff',
                border: 'none',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Start Recording
            </button>
          )}
        </div>
      )}

      {/* Live transcript */}
      {liveTranscript && (
        <div
          style={{
            background: 'rgba(14,116,144,.07)',
            border: '1px solid rgba(14,116,144,.2)',
            borderRadius: 10,
            padding: '12px 16px',
            marginBottom: 16,
            fontSize: 15,
            color: 'var(--text)',
            fontStyle: 'italic',
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#0e7490',
              display: 'block',
              marginBottom: 4,
            }}
          >
            YOU'RE SAYING:
          </span>
          {liveTranscript}
        </div>
      )}

      {/* Done button */}
      <button
        onClick={onDoneSpeaking}
        style={{
          display: 'block',
          width: '100%',
          padding: '14px 0',
          background: 'linear-gradient(135deg, #0e7490, #0891b2)',
          color: '#fff',
          border: 'none',
          borderRadius: 12,
          fontSize: 16,
          fontWeight: 700,
          cursor: 'pointer',
          marginBottom: 10,
        }}
      >
        Done speaking →
      </button>

      <button
        onClick={onSkip}
        style={{
          display: 'block',
          width: '100%',
          padding: '10px 0',
          background: 'transparent',
          border: 'none',
          color: 'var(--subtext)',
          fontSize: 14,
          cursor: 'pointer',
        }}
      >
        Skip →
      </button>
    </div>
  );
}
