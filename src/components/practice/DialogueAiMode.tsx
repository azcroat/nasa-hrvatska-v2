import React from 'react';
import DialogueAvatar from './DialogueAvatar';

export default function DialogueAiMode({
  scenario,
  aiHistory,
  aiLoading,
  aiCoaching,
  aiError,
  aiInput,
  aiDone,
  aiTurns,
  onInputChange,
  onSend,
  onFinish,
  onBack,
  finishFired,
  award,
}) {
  return (
    <div>
      {/* Character intro */}
      {aiHistory.length === 0 && (
        <div
          style={{
            background: 'var(--card)',
            border: '1.5px solid var(--card-b)',
            borderRadius: 14,
            padding: '14px 16px',
            marginBottom: 16,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 13, color: 'var(--subtext)', marginBottom: 6 }}>
            You're now in a free conversation with
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--heading)' }}>
            {scenario.turns[0]?.speaker || 'Your conversation partner'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--subtext)', marginTop: 4 }}>
            Type anything in Croatian — they'll respond naturally. Don't worry about mistakes!
          </div>
        </div>
      )}

      {/* Conversation history */}
      <div style={{ marginBottom: 12 }}>
        {aiHistory.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              gap: 8,
              marginBottom: 10,
              alignItems: 'flex-end',
            }}
          >
            {msg.role === 'assistant' && <DialogueAvatar scenarioId={scenario.id} />}
            <div
              style={{
                maxWidth: '80%',
                background: msg.role === 'user' ? '#0e7490' : 'var(--card)',
                color: msg.role === 'user' ? '#fff' : 'var(--heading)',
                border: msg.role === 'assistant' ? '1.5px solid var(--card-b)' : 'none',
                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                padding: '10px 14px',
                fontSize: 14,
                fontWeight: 500,
                lineHeight: 1.5,
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {aiLoading && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'flex-end' }}>
            <DialogueAvatar scenarioId={scenario.id} />
            <div
              style={{
                background: 'var(--card)',
                border: '1.5px solid var(--card-b)',
                borderRadius: '18px 18px 18px 4px',
                padding: '12px 16px',
              }}
            >
              <div style={{ display: 'flex', gap: 4 }}>
                {[0, 0.2, 0.4].map((d, i) => (
                  <div
                    key={i}
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: 'var(--subtext)',
                      opacity: 0.5,
                      animation: `maja-dot 1.2s ease-in-out ${d}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Coaching note */}
      {aiCoaching && (
        <div
          style={{
            background: '#fef3c7',
            border: '1.5px solid #fcd34d',
            borderRadius: 10,
            padding: '8px 12px',
            marginBottom: 10,
            fontSize: 12,
            fontWeight: 600,
            color: '#92400e',
          }}
        >
          💡 {aiCoaching}
        </div>
      )}

      {/* Error */}
      {aiError && (
        <div
          style={{
            fontSize: 12,
            color: '#dc2626',
            marginBottom: 8,
            padding: '8px 12px',
            background: '#fee2e2',
            borderRadius: 8,
          }}
        >
          {aiError}
        </div>
      )}

      {/* Input */}
      {!aiDone && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input
              type="text"
              value={aiInput}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSend();
              }}
              disabled={aiLoading}
              placeholder="Upiši na hrvatskom..."
              style={{
                flex: 1,
                padding: '11px 14px',
                borderRadius: 12,
                border: '1.5px solid var(--card-b)',
                background: 'var(--card)',
                color: 'var(--heading)',
                fontSize: 14,
                fontWeight: 500,
                fontFamily: "'Outfit',sans-serif",
                outline: 'none',
                opacity: aiLoading ? 0.6 : 1,
              }}
            />
            <button
              onClick={onSend}
              disabled={aiLoading || !aiInput.trim()}
              aria-label={aiLoading ? 'Sending message' : 'Send message'}
              style={{
                background: '#7c3aed',
                border: 'none',
                borderRadius: 12,
                padding: '11px 16px',
                color: '#fff',
                fontSize: 16,
                cursor: aiLoading || !aiInput.trim() ? 'default' : 'pointer',
                opacity: aiLoading || !aiInput.trim() ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 44,
              }}
            >
              {aiLoading ? (
                <span
                  style={{
                    width: 13,
                    height: 13,
                    borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.35)',
                    borderTopColor: '#fff',
                    display: 'inline-block',
                    animation: 'spin 0.65s linear infinite',
                  }}
                />
              ) : (
                '→'
              )}
            </button>
          </div>
          {aiTurns >= 4 && (
            <button
              onClick={onFinish}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 12,
                border: 'none',
                background: 'var(--card)',
                color: 'var(--subtext)',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: "'Outfit',sans-serif",
                marginBottom: 8,
              }}
            >
              Finish Conversation →
            </button>
          )}
        </>
      )}

      {/* AI results */}
      {aiDone && (
        <div
          style={{
            background: 'var(--card)',
            border: '1.5px solid var(--card-b)',
            borderRadius: 16,
            padding: '24px 20px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--heading)', marginBottom: 4 }}>
            Great conversation!
          </div>
          <div style={{ fontSize: 13, color: 'var(--subtext)', marginBottom: 16 }}>
            {aiTurns} exchange{aiTurns !== 1 ? 's' : ''} · +{aiTurns * 5} XP earned
          </div>
          <button
            className="tc"
            onClick={onBack}
            style={{
              width: '100%',
              padding: '13px',
              fontWeight: 800,
              fontSize: 14,
              color: 'var(--heading)',
            }}
          >
            ← Back to Scenarios
          </button>
        </div>
      )}

      {/* Back button when in ai mode */}
      {!aiDone && (
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--subtext)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            padding: '8px 0',
            fontFamily: "'Outfit',sans-serif",
          }}
        >
          ← Back to scenarios
        </button>
      )}
    </div>
  );
}
