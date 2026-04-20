import React from 'react';
import { LEVEL_COLORS } from './MediaPlayerUtils';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export default function AIConversationWriteSetup({
  Header,
  writeLevel,
  setWriteLevel,
  writePrompt,
  setWritePrompt,
  filteredPrompts,
  isOnline,
  onStart,
}) {
  return (
    <div className="scr-wrap">
      {Header}

      <div className="sh">Your Level</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 22, flexWrap: 'wrap' }}>
        {LEVELS.map((l) => (
          <button
            key={l}
            onClick={() => {
              setWriteLevel(l);
              setWritePrompt(null);
            }}
            style={{
              padding: '8px 18px',
              borderRadius: 20,
              border: '2px solid',
              fontWeight: 800,
              fontSize: 'var(--text-sm)',
              cursor: 'pointer',
              fontFamily: "'Outfit',sans-serif",
              borderColor: writeLevel === l ? 'var(--info)' : 'var(--card-b)',
              background: writeLevel === l ? 'var(--info)' : 'var(--card)',
              color: writeLevel === l ? 'var(--card)' : 'var(--subtext)',
            }}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="sh">Choose a Writing Prompt</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {filteredPrompts.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '24px',
              color: 'var(--subtext)',
              fontSize: 'var(--text-base)',
            }}
          >
            No prompts for this level combination.
          </div>
        ) : (
          filteredPrompts.map((p) => {
            const sel = writePrompt?.id === p.id;
            return (
              <div
                key={p.id}
                onClick={() => setWritePrompt(p)}
                style={{
                  padding: 16,
                  borderRadius: 16,
                  border: `2px solid ${sel ? 'var(--info)' : 'var(--card-b)'}`,
                  background: sel ? 'var(--info-bg)' : 'var(--card)',
                  cursor: 'pointer',
                  transition: 'all .15s',
                  boxShadow: sel ? '0 4px 18px rgba(14,116,144,.15)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <span style={{ fontSize: 24, flexShrink: 0, marginTop: 2 }}>{p.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        flexWrap: 'wrap',
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 'var(--text-base)',
                          fontWeight: 800,
                          color: 'var(--heading)',
                        }}
                      >
                        {p.title}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: '2px 7px',
                          borderRadius: 10,
                          background: LEVEL_COLORS[p.level] + '20',
                          color: LEVEL_COLORS[p.level],
                        }}
                      >
                        {p.level}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 'var(--text-sm)',
                        color: 'var(--subtext)',
                        lineHeight: 1.5,
                      }}
                    >
                      {p.prompt}
                    </div>
                  </div>
                  {sel && (
                    <div style={{ color: 'var(--info)', fontSize: 18, flexShrink: 0 }}>✓</div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {!isOnline && (
        <div
          style={{
            background: 'var(--warning-bg)',
            border: '1px solid var(--warning-b)',
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: 12,
            fontSize: 'var(--text-sm)',
            color: 'var(--warning)',
            fontWeight: 600,
            display: 'flex',
            gap: 10,
            alignItems: 'center',
          }}
        >
          <span>📶</span>
          <span>You're offline — writing evaluation requires an internet connection.</span>
        </div>
      )}
      <button
        className="b bp"
        style={{ width: '100%', fontSize: 16, padding: '15px', borderRadius: 14 }}
        onClick={onStart}
        disabled={!writePrompt || !isOnline}
      >
        {!isOnline
          ? 'Connect to the internet to start'
          : writePrompt
            ? `Start Writing — ${writePrompt.title}`
            : 'Select a prompt above'}
      </button>
    </div>
  );
}
