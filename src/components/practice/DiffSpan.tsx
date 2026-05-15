// src/components/practice/DiffSpan.tsx
// SP6: tappable correction span. Renders <del>{original}</del> + <ins>{corrected}</ins>.
// When `note` is present, becomes a keyboard-accessible button that toggles a popover.
import React, { useState, useRef, useEffect } from 'react';

export interface DiffSpanProps {
  original: string;
  corrected: string;
  note?: string;
  index: number;
}

const STYLES = {
  span: {
    position: 'relative' as const,
    cursor: 'pointer',
    display: 'inline-block',
    minHeight: 24,
    minWidth: 44, // WCAG 2.5.5 — 44x44 px tap target
    padding: '2px 4px',
    borderRadius: 4,
  },
  spanNoNote: {
    position: 'relative' as const,
    cursor: 'default',
    display: 'inline-block',
    padding: '2px 4px',
  },
  original: {
    color: '#c0392b',
    textDecoration: 'line-through' as const,
    opacity: 0.85,
    marginRight: 4,
  },
  corrected: {
    color: '#1e7e34',
    fontWeight: 600,
  },
  popover: {
    position: 'absolute' as const,
    top: '100%',
    left: 0,
    marginTop: 4,
    background: '#fff8e1',
    border: '1px solid #f1c40f',
    borderRadius: 6,
    padding: '8px 12px',
    maxWidth: 280,
    fontSize: 13,
    lineHeight: 1.4,
    color: '#333',
    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
    zIndex: 10,
    whiteSpace: 'normal' as const,
  },
};

export function DiffSpan({ original, corrected, note, index }: DiffSpanProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement | null>(null);

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

  if (!note) {
    return (
      <span ref={ref} style={STYLES.spanNoNote} data-diff-span-index={index}>
        <del style={STYLES.original}>{original}</del>
        <ins style={STYLES.corrected}>{corrected}</ins>
      </span>
    );
  }

  return (
    <span
      ref={ref}
      role="button"
      tabIndex={0}
      aria-describedby={`diff-note-${index}`}
      aria-expanded={open}
      data-diff-span-index={index}
      style={STYLES.span}
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
      <del style={STYLES.original}>{original}</del>
      <ins style={STYLES.corrected}>{corrected}</ins>
      {open ? (
        <span id={`diff-note-${index}`} role="tooltip" style={STYLES.popover}>
          {note}
        </span>
      ) : null}
    </span>
  );
}
