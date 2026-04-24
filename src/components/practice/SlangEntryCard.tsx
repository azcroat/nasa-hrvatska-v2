import React from 'react';
import { speak } from '../../data';

interface SlangVariant {
  hr: string;
  en: string;
}
interface SlangEntry {
  hr: string;
  en: string;
  ph: string;
  note: string;
  variants: SlangVariant[];
}
interface SlangEntryCardProps {
  entry: SlangEntry;
  color: string;
  light: string;
  border: string;
  keyId: string;
  expanded: string | null;
  setExpanded: (id: string | null) => void;
}

export default function SlangEntryCard({
  entry,
  color,
  light,
  border,
  keyId,
  expanded,
  setExpanded,
}: SlangEntryCardProps) {
  const isOpen = expanded === keyId;
  return (
    <div
      style={{
        background: 'var(--card)',
        border: `1.5px solid ${isOpen ? color : 'var(--card-b)'}`,
        borderRadius: 16,
        marginBottom: 10,
        overflow: 'hidden',
        boxShadow: isOpen ? `0 4px 20px ${color}22` : '0 1px 4px rgba(0,0,0,.06)',
        transition: 'border-color .2s',
      }}
    >
      <button
        onClick={() => setExpanded(isOpen ? null : keyId)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 16px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: "'Outfit',sans-serif",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 17,
              fontWeight: 900,
              color: 'var(--heading)',
              fontFamily: "'Playfair Display',serif",
              lineHeight: 1.2,
            }}
          >
            {entry.hr}
          </div>
          <div style={{ fontSize: 13, color: 'var(--subtext)', marginTop: 2, fontWeight: 600 }}>
            {entry.en}
          </div>
        </div>
        {entry.ph !== '—' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              speak(entry.hr);
            }}
            aria-label={`Hear ${entry.hr}`}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: 'none',
              background: `linear-gradient(135deg,${color},${color}cc)`,
              color: '#fff',
              fontSize: 16,
              cursor: 'pointer',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span aria-hidden="true">🔊</span>
          </button>
        )}
        <div style={{ fontSize: 14, color: 'var(--subtext)', opacity: 0.4, flexShrink: 0 }}>
          {isOpen ? '▲' : '▼'}
        </div>
      </button>

      {isOpen && (
        <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${border}` }}>
          {entry.ph !== '—' && (
            <div
              style={{
                background: light,
                borderRadius: 10,
                padding: '8px 12px',
                marginTop: 12,
                marginBottom: 12,
                fontSize: 13,
                color: color,
                fontWeight: 700,
                fontFamily: 'monospace',
              }}
            >
              🗣 /{entry.ph}/
            </div>
          )}
          <div
            style={{
              fontSize: 13,
              color: 'var(--rt-c)',
              lineHeight: 1.7,
              background: 'var(--bar-bg)',
              borderRadius: 10,
              padding: '12px 14px',
              marginBottom: entry.variants.length ? 12 : 0,
            }}
          >
            {entry.note}
          </div>
          {entry.variants.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: 'var(--subtext)',
                  textTransform: 'uppercase',
                  letterSpacing: '.06em',
                  marginBottom: 8,
                }}
              >
                Variations & Examples
              </div>
              {entry.variants.map((v: SlangVariant, vi: number) => (
                <div
                  key={vi}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '8px 10px',
                    borderRadius: 10,
                    background: light,
                    border: `1px solid ${border}`,
                    marginBottom: vi < entry.variants.length - 1 ? 6 : 0,
                  }}
                >
                  <button
                    onClick={() => speak(v.hr)}
                    aria-label={`Hear ${v.hr}`}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      border: 'none',
                      background: color,
                      color: '#fff',
                      fontSize: 12,
                      cursor: 'pointer',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span aria-hidden="true">🔊</span>
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: color,
                        fontFamily: "'Playfair Display',serif",
                      }}
                    >
                      {v.hr}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--subtext)',
                        marginTop: 2,
                        fontWeight: 500,
                      }}
                    >
                      {v.en}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
