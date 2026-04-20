// @ts-nocheck
import React from 'react';

export default function ConversationBubble({ msg, personaCfg }) {
  const isUser = msg.role === 'user';
  const cfg = personaCfg || {
    name: 'Maja Kovačević',
    avatar: '/images/portraits/tutor-hero.webp',
    fallbackEmoji: '👩‍🏫',
    accentColor: '#D4002D',
  };

  /** @type {import('react').CSSProperties} */
  const bubbleStyle = isUser
    ? {
        background: 'rgba(212,0,45,0.08)',
        border: '1px solid rgba(212,0,45,0.2)',
        borderRadius: '12px 0 12px 12px',
        padding: '10px 14px',
        maxWidth: '85%',
        textAlign: 'right',
        fontSize: 14,
        lineHeight: 1.5,
        color: 'var(--heading)',
      }
    : {
        background: 'var(--card)',
        border: '1px solid var(--card-b)',
        borderRadius: '0 12px 12px 12px',
        padding: '10px 14px',
        maxWidth: '85%',
        fontSize: 14,
        lineHeight: 1.5,
        color: 'var(--heading)',
      };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        gap: 4,
        marginBottom: 12,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
          flexDirection: isUser ? 'row-reverse' : 'row',
        }}
      >
        {!isUser && (
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <img
              src={cfg.avatar}
              alt={cfg.name}
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                objectFit: 'cover',
                flexShrink: 0,
                border: `2px solid ${cfg.accentColor}`,
                display: 'block',
              }}
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const sib = /** @type {HTMLElement} */ e.currentTarget.nextSibling;
                if (sib) sib.style.display = 'flex';
              }}
            />
            <div
              style={{
                display: 'none',
                width: 30,
                height: 30,
                borderRadius: '50%',
                border: `2px solid ${cfg.accentColor}`,
                background: cfg.accentColor + '22',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
              }}
            >
              {cfg.fallbackEmoji}
            </div>
          </div>
        )}
        <div style={bubbleStyle}>
          {msg.content}
          {msg.streaming && (
            <span
              style={{
                display: 'inline-block',
                width: 2,
                height: '1em',
                background: 'currentColor',
                marginLeft: 2,
                verticalAlign: 'text-bottom',
                animation: 'maja-cursor-blink 0.8s ease-in-out infinite',
              }}
            />
          )}
        </div>
      </div>

      {msg.correction && (
        <div
          style={{
            marginLeft: isUser ? 0 : 38,
            marginRight: isUser ? 0 : 0,
            fontSize: 11,
            padding: '4px 10px',
            borderRadius: 8,
            background: 'rgba(245,158,11,0.12)',
            border: '1px solid rgba(245,158,11,0.35)',
            color: '#92400e',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexWrap: 'wrap',
          }}
        >
          <span>
            ❌ <em>{msg.correction.original}</em>
          </span>
          <span>→</span>
          <span>
            ✅ <strong>{msg.correction.corrected}</strong>
          </span>
          {msg.correction.echo && <span style={{ opacity: 0.7 }}>({msg.correction.echo})</span>}
        </div>
      )}
    </div>
  );
}
