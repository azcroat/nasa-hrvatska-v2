import React from 'react';

interface CefrSoftHintProps {
  level: string;
}

export function CefrSoftHint({ level }: CefrSoftHintProps) {
  return (
    <div
      className="cefr-soft-hint"
      style={{
        background: 'linear-gradient(135deg,rgba(14,116,144,.07),rgba(6,182,212,.04))',
        border: '1px solid rgba(14,116,144,.2)',
        borderRadius: 10,
        padding: '8px 12px',
        marginBottom: 12,
        fontSize: 12,
        color: 'var(--subtext)',
        fontWeight: 500,
        lineHeight: 1.5,
      }}
    >
      💡 Most rewarding once you reach{' '}
      <strong style={{ color: 'var(--info,#0284c7)' }}>{level}</strong> — but dive in anytime, it's
      good practice.
    </div>
  );
}
