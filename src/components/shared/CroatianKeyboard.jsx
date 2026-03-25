import React from 'react';

const CHARS = ['Č','č','Ć','ć','Đ','đ','Š','š','Ž','ž'];

/**
 * @param {{ onChar: (c: string) => void, style?: React.CSSProperties }} props
 */
export default function CroatianKeyboard({ onChar, style }) {
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8,
      ...style,
    }} role="toolbar" aria-label="Croatian special characters">
      {CHARS.map(c => (
        <button
          key={c}
          onClick={() => onChar(c)}
          type="button"
          style={{
            width: 38, height: 38, borderRadius: 8,
            border: '1.5px solid var(--border,#e2e8f0)',
            background: 'var(--bg2,#f8fafc)', color: 'var(--text,#1c1917)',
            cursor: 'pointer', fontSize: 16, fontWeight: 700,
            fontFamily: "'Outfit',sans-serif",
            transition: 'background .15s',
          }}
          aria-label={`Insert ${c}`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
