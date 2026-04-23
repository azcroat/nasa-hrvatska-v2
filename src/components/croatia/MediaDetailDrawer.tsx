/**
 * MediaDetailDrawer — bottom-sheet player for media items.
 *
 * Renders differently based on the media item type:
 *   • stream  → inline RadioPlayer (live audio)
 *   • ytId    → embedded YouTube iframe player
 *   • web     → description card + "Open in Browser" via @capacitor/browser
 *   • scr     → handled by caller (internal navigation), drawer not shown
 */
import React, { useEffect, useRef, useCallback } from 'react';
import RadioPlayer from './RadioPlayer';

interface MediaItem {
  ytId?: string;
  stream?: string;
  web?: string;
  icon?: string;
  color: string;
  name: string;
  level?: string;
  tip?: string;
  desc?: string;
}

import { openUrl } from '../../lib/platform.ts';

// ── YouTube iframe embed ──────────────────────────────────────────────────────

function YouTubeEmbed({ ytId, color }: { ytId: string; color: string }) {
  const src = `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        paddingBottom: '56.25%', // 16:9
        borderRadius: 12,
        overflow: 'hidden',
        background: '#000',
        boxShadow: `0 4px 24px ${color}40`,
      }}
    >
      <iframe
        src={src}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          border: 'none',
        }}
      />
    </div>
  );
}

// ── External link card ────────────────────────────────────────────────────────

function ExternalCard({
  m,
  activeStream,
  setActiveStream,
}: {
  m: MediaItem;
  activeStream: string | null;
  setActiveStream: (id: string | null) => void;
}) {
  const handleOpen = useCallback(() => {
    if (m.web) openUrl(m.web);
  }, [m.web]);

  // Items with a stream but no ytId still show RadioPlayer here
  if (m.stream) {
    return (
      <div
        style={{
          background: 'var(--card)',
          borderRadius: 14,
          border: '1px solid var(--card-b)',
          padding: '16px',
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: 'var(--subtext)',
            letterSpacing: '.08em',
            textTransform: 'uppercase',
            marginBottom: 12,
          }}
        >
          LIVE STREAM
        </div>
        <RadioPlayer
          src={m.stream}
          color={m.color}
          streamId={m.name}
          activeStream={activeStream}
          setActiveStream={setActiveStream}
        />
        {m.web && (
          <button
            onClick={handleOpen}
            style={{
              marginTop: 14,
              width: '100%',
              padding: '10px 0',
              borderRadius: 10,
              border: `1.5px solid ${m.color}50`,
              background: 'transparent',
              color: m.color,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Open website →
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'var(--card)',
        borderRadius: 14,
        border: '1px solid var(--card-b)',
        padding: '20px 16px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 48, marginBottom: 12 }}>{m.icon}</div>
      <div
        style={{
          fontSize: 13,
          color: 'var(--text)',
          lineHeight: 1.5,
          marginBottom: 20,
        }}
      >
        {m.desc}
      </div>
      {m.web ? (
        <button
          onClick={handleOpen}
          style={{
            width: '100%',
            padding: '14px 0',
            borderRadius: 12,
            border: 'none',
            background: m.color,
            color: '#fff',
            fontSize: 15,
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: `0 4px 16px ${m.color}50`,
            letterSpacing: '.02em',
          }}
        >
          Open in Browser
        </button>
      ) : (
        <div style={{ fontSize: 12, color: 'var(--subtext)' }}>No external link available</div>
      )}
    </div>
  );
}

// ── Main drawer ───────────────────────────────────────────────────────────────

export default function MediaDetailDrawer({
  item,
  onClose,
  activeStream,
  setActiveStream,
}: {
  item: MediaItem | null;
  onClose: () => void;
  activeStream: string | null;
  setActiveStream: (id: string | null) => void;
}) {
  const overlayRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Prevent body scroll while drawer is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  if (!item) return null;

  const hasYT = !!item.ytId;

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === overlayRef.current) onClose();
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,.55)',
        display: 'flex',
        alignItems: 'flex-end',
        animation: 'nh-fade-in .15s ease-out',
      }}
    >
      <div
        style={{
          width: '100%',
          maxHeight: '92dvh',
          background: 'var(--bg)',
          borderRadius: '20px 20px 0 0',
          overflowY: 'auto',
          padding: '0 0 env(safe-area-inset-bottom,0px)',
          animation: 'nh-slide-up .22s cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--card-b)' }} />
        </div>

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '8px 20px 16px',
            borderBottom: '1px solid var(--card-b)',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              flexShrink: 0,
              background: `linear-gradient(135deg, ${item.color}cc, ${item.color})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
            }}
          >
            {item.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{ fontSize: 15, fontWeight: 800, color: 'var(--heading)', lineHeight: 1.2 }}
            >
              {item.name}
            </div>
            {item.level && (
              <div
                style={{
                  display: 'inline-block',
                  marginTop: 3,
                  fontSize: 9,
                  fontWeight: 900,
                  letterSpacing: '.08em',
                  color: item.color,
                  background: `${item.color}18`,
                  padding: '2px 7px',
                  borderRadius: 6,
                }}
              >
                {item.level}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: 'none',
              background: 'var(--card)',
              color: 'var(--subtext)',
              fontSize: 18,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '16px 16px 24px' }}>
          {/* YouTube embed takes priority */}
          {hasYT && (
            <div style={{ marginBottom: 16 }}>
              <YouTubeEmbed ytId={item.ytId!} color={item.color} />
              {item.web && (
                <button
                  onClick={() => openUrl(item.web!)}
                  style={{
                    marginTop: 10,
                    width: '100%',
                    padding: '10px 0',
                    borderRadius: 10,
                    border: `1.5px solid ${item.color}50`,
                    background: 'transparent',
                    color: item.color,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Open on YouTube →
                </button>
              )}
            </div>
          )}

          {/* Radio player or external card (only if no YouTube) */}
          {!hasYT && (
            <div style={{ marginBottom: 16 }}>
              <ExternalCard
                m={item}
                activeStream={activeStream}
                setActiveStream={setActiveStream}
              />
            </div>
          )}

          {/* Learning tip */}
          {item.tip && (
            <div
              style={{
                background: `${item.color}10`,
                border: `1px solid ${item.color}25`,
                borderRadius: 12,
                padding: '12px 14px',
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: item.color,
                  letterSpacing: '.08em',
                  textTransform: 'uppercase',
                  marginBottom: 6,
                }}
              >
                Learning Tip
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--text)',
                  lineHeight: 1.55,
                }}
              >
                {item.tip}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
