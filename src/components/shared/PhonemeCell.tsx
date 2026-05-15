// src/components/shared/PhonemeCell.tsx
// SP8: tappable phoneme cell with score color + popover (hint + guide).
// Mirrors SP6's DiffSpan pattern: outside-click + Escape dismiss,
// keyboard-accessible (role=button, tabIndex=0, Enter/Space activate),
// WCAG 2.5.5 minimum 44x44 tap target.
import React, { useState, useRef, useEffect } from 'react';
import { scoreColor, PHONEME_HINTS } from './pronunciationUtils.js';
import PhonemeGuideCard from './PhonemeGuideCard';

export interface PhonemeCellProps {
  phoneme: string;
  score: number;
}

const STYLES = {
  cell: {
    position: 'relative' as const,
    display: 'inline-flex' as const,
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minWidth: 44,
    minHeight: 44,
    padding: '4px 8px',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
    fontFamily: "'Outfit', sans-serif",
  },
  phoneme: {
    fontWeight: 700 as const,
    lineHeight: 1.1,
  },
  scoreText: {
    fontSize: 10,
    fontWeight: 600 as const,
    opacity: 0.85,
    marginTop: 2,
  },
  popover: {
    position: 'absolute' as const,
    top: '100%',
    left: 0,
    marginTop: 6,
    background: 'var(--card)',
    border: '1px solid var(--card-b)',
    borderRadius: 8,
    padding: 12,
    minWidth: 240,
    maxWidth: 320,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: 10,
    fontSize: 13,
    lineHeight: 1.4,
    color: 'var(--heading)',
    whiteSpace: 'normal' as const,
    textAlign: 'left' as const,
  },
};

export function PhonemeCell({ phoneme, score }: PhonemeCellProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement | null>(null);
  const color = scoreColor(score);
  const hints = PHONEME_HINTS as Record<string, string | undefined>;
  const hint = hints[phoneme.toLowerCase()] || hints[phoneme] || null;

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <span
      ref={ref}
      role="button"
      tabIndex={0}
      aria-expanded={open}
      aria-label={`Phoneme ${phoneme}, score ${score} percent`}
      data-testid="phoneme-cell"
      data-phoneme={phoneme}
      style={{
        ...STYLES.cell,
        background: `${color}1f`,
        border: `1.5px solid ${color}66`,
        color,
      }}
      onClick={(e) => {
        e.stopPropagation();
        setOpen((v) => !v);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setOpen((v) => !v);
        }
      }}
    >
      <span style={STYLES.phoneme}>{phoneme}</span>
      <span style={STYLES.scoreText}>{score}%</span>
      {open ? (
        <span role="tooltip" style={STYLES.popover}>
          {hint ? <div style={{ marginBottom: 8 }}>{hint}</div> : null}
          <PhonemeGuideCard phoneme={phoneme} />
        </span>
      ) : null}
    </span>
  );
}
