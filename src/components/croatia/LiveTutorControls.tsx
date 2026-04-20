// @ts-nocheck
import React from 'react';

export default function LiveTutorControls({
  turnCount,
  breakdownCount,
  messages,
  summaryLoading,
  showGloss,
  setShowGloss,
  showMic,
  isRecording,
  playing,
  thinking,
  micBusy,
  phase,
  textInput,
  setTextInput,
  canType,
  onStartRecording,
  onStopRecording,
  onEndSession,
  onTextSubmit,
}) {
  return (
    <div
      style={{
        padding: '10px 16px 16px',
        borderTop: '1px solid var(--card-b)',
        background: 'var(--card)',
        flexShrink: 0,
      }}
    >
      {/* Gloss toggle + End Session */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)' }}>
            Turn {turnCount} · Breakdown {breakdownCount}/3
          </div>
          {messages.length >= 2 && (
            <button
              onClick={onEndSession}
              disabled={summaryLoading}
              style={{
                padding: '4px 10px',
                borderRadius: 20,
                background: 'rgba(212,0,45,.08)',
                border: '1px solid rgba(212,0,45,.25)',
                color: '#D4002D',
                fontSize: 10,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              End Session
            </button>
          )}
        </div>
        <button
          onClick={() => setShowGloss((v) => !v)}
          style={{
            padding: '4px 10px',
            borderRadius: 20,
            background: showGloss ? 'rgba(99,102,241,.1)' : 'transparent',
            border: '1px solid ' + (showGloss ? 'rgba(99,102,241,.25)' : 'var(--card-b)'),
            color: showGloss ? '#6366f1' : 'var(--subtext)',
            fontSize: 10,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {showGloss ? '👁️ Gloss ON' : '👁️ Gloss OFF'}
        </button>
      </div>

      {showMic ? (
        /* ── Mic button (push-to-talk via Deepgram) ── */
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <button
            onPointerDown={onStartRecording}
            onPointerUp={onStopRecording}
            onPointerLeave={onStopRecording}
            disabled={micBusy}
            style={{
              flex: 1,
              padding: '14px 20px',
              borderRadius: 14,
              border: 'none',
              background: isRecording
                ? 'var(--error, #D4002D)'
                : playing
                  ? 'var(--subtext, #9ca3af)'
                  : micBusy
                    ? 'rgba(0,0,0,.08)'
                    : 'var(--info, #3b82f6)',
              color: isRecording || playing || !micBusy ? 'white' : 'var(--subtext)',
              fontSize: 'var(--text-sm)',
              fontWeight: 800,
              cursor: micBusy ? 'not-allowed' : 'pointer',
              transition: 'all .15s',
              animation: isRecording ? 'lt-mic-glow 0.8s ease-in-out infinite' : 'none',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              touchAction: 'none',
            }}
          >
            {playing ? (
              <>
                <span aria-hidden="true">🔊</span>
                {' Listening...'}
              </>
            ) : isRecording ? (
              <>
                <span aria-hidden="true">🔴</span>
                {' Recording...'}
              </>
            ) : thinking || phase === 'thinking' ? (
              <span aria-hidden="true">⏳</span>
            ) : (
              <>
                <span aria-hidden="true">🎙️</span>
                {' Hold to speak'}
              </>
            )}
          </button>
        </div>
      ) : null}

      {/* Text input fallback / supplement */}
      <form onSubmit={onTextSubmit} style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder={showMic ? 'Or type your Croatian here…' : 'Type your Croatian here…'}
          disabled={!canType}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 12,
            border: '1.5px solid var(--card-b)',
            background: 'var(--card)',
            color: 'var(--heading)',
            fontSize: 'var(--text-sm)',
            opacity: canType ? 1 : 0.5,
          }}
        />
        <button
          type="submit"
          disabled={!canType || !textInput.trim()}
          className="b bg"
          style={{
            padding: '10px 16px',
            borderRadius: 12,
            fontSize: 'var(--text-sm)',
            fontWeight: 800,
            opacity: canType && textInput.trim() ? 1 : 0.4,
            cursor: canType && textInput.trim() ? 'pointer' : 'not-allowed',
            flexShrink: 0,
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
