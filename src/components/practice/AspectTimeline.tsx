import React from 'react';

interface Props {
  aspect: string;
  dimmed: boolean;
}
export default function AspectTimeline({ aspect, dimmed }: Props) {
  const isPf = aspect === 'pf';
  const color = dimmed ? 'var(--subtext)' : isPf ? 'var(--success,#16a34a)' : 'var(--info,#0284c7)';
  const bgColor = dimmed ? 'var(--bar-bg)' : isPf ? 'rgba(22,163,74,.07)' : 'rgba(2,132,199,.07)';
  const borderColor = dimmed ? 'var(--card-b)' : isPf ? '#bbf7d0' : '#bae6fd';

  return (
    <div
      style={{
        background: bgColor,
        border: `1.5px solid ${borderColor}`,
        borderRadius: 10,
        padding: '10px 14px',
        opacity: dimmed ? 0.45 : 1,
        transition: 'opacity .3s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 14 }}>{isPf ? '✓' : '🔄'}</span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color,
            textTransform: 'uppercase',
            letterSpacing: '.05em',
          }}
        >
          {isPf ? 'Perfective — completed, bounded' : 'Imperfective — ongoing / habitual'}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 22 }}>
        {isPf ? (
          <div
            style={{
              flex: 1,
              height: 3,
              background: dimmed ? 'var(--bar-bg)' : 'var(--success,#16a34a)',
              borderRadius: 2,
              position: 'relative',
            }}
          >
            {!dimmed && (
              <div
                style={{
                  position: 'absolute',
                  right: -6,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: 'var(--success,#16a34a)',
                  animation: 'dotAppear .5s ease forwards',
                  boxShadow: '0 0 0 3px #bbf7d0',
                }}
              />
            )}
          </div>
        ) : (
          <div
            style={{
              flex: 1,
              height: 10,
              background: dimmed ? 'var(--bar-bg)' : '#e0f2fe',
              borderRadius: 6,
              overflow: 'hidden',
            }}
          >
            {!dimmed && (
              <div
                style={{
                  height: '100%',
                  background:
                    'linear-gradient(90deg, var(--info,#0284c7) 0%, #7dd3fc 60%, var(--info,#0284c7) 100%)',
                  backgroundSize: '200% 100%',
                  borderRadius: 6,
                  animation: 'pulseBar 1.2s ease forwards',
                  width: 0,
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
