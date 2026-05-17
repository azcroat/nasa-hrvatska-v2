// src/components/practice/DiffSpan.tsx
// SP6: tappable correction span. Renders <del>{original}</del> + <ins>{corrected}</ins>.
// SP6b: optional colored dot per `errorType` + tag in the popover header.
// When `note` is present, becomes a keyboard-accessible button that toggles a popover.
import React, { useState, useRef, useEffect } from 'react';
import type { ErrorType } from './correctionDiff.utils';

export interface DiffSpanProps {
  original: string;
  corrected: string;
  note?: string;
  errorType?: ErrorType;
  index: number;
}

// SP6b: color + label per error type. Picked for accessibility (all readable
// on white at 3:1+ contrast) and Croatian-grammar fluency (case = the biggest
// learner pain point gets the strongest red signal).
const ERROR_TYPE_META: Record<ErrorType, { color: string; label: string }> = {
  case: { color: '#dc2626', label: 'Case' },
  aspect: { color: '#2563eb', label: 'Aspect' },
  agreement: { color: '#7c3aed', label: 'Agreement' },
  tense: { color: '#ea580c', label: 'Tense' },
  word_order: { color: '#0d9488', label: 'Word order' },
  vocab: { color: '#475569', label: 'Vocabulary' },
  spelling: { color: '#a16207', label: 'Spelling' },
  other: { color: '#6b7280', label: 'Other' },
};

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

export function DiffSpan({
  original,
  corrected,
  note,
  errorType,
  index,
}: DiffSpanProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement | null>(null);
  const meta = errorType ? ERROR_TYPE_META[errorType] : null;
  const dot = meta ? (
    <span
      aria-hidden="true"
      data-testid={`diff-dot-${index}`}
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: meta.color,
        marginRight: 4,
        verticalAlign: 'middle',
      }}
    />
  ) : null;

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
      <span
        ref={ref}
        style={STYLES.spanNoNote}
        data-diff-span-index={index}
        data-diff-error-type={errorType ?? 'unspecified'}
      >
        {dot}
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
      data-diff-error-type={errorType ?? 'unspecified'}
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
      {dot}
      <del style={STYLES.original}>{original}</del>
      <ins style={STYLES.corrected}>{corrected}</ins>
      {open ? (
        <span id={`diff-note-${index}`} role="tooltip" style={STYLES.popover}>
          {meta ? (
            <span
              data-testid={`diff-tag-${index}`}
              style={{
                display: 'inline-block',
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: meta.color,
                background: meta.color + '14', // ~8% alpha tint
                padding: '2px 6px',
                borderRadius: 4,
                marginBottom: 6,
                marginRight: 6,
              }}
            >
              {meta.label}
            </span>
          ) : null}
          {note}
        </span>
      ) : null}
    </span>
  );
}
