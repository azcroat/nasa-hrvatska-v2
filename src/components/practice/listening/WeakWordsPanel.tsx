import React, { useState } from 'react';

export default function WeakWordsPanel({
  missedQuestions,
  accentColor,
  onAddToFlashcards,
}: {
  missedQuestions: any[];
  accentColor: string;
  onAddToFlashcards: (words: any[]) => void;
}) {
  const [added, setAdded] = useState(false);
  if (missedQuestions.length === 0) return null;

  function handleAdd() {
    onAddToFlashcards(missedQuestions);
    setAdded(true);
  }

  return (
    <div
      style={{
        marginTop: 20,
        padding: '16px 18px',
        background: 'rgba(239,68,68,.05)',
        border: '1.5px solid rgba(239,68,68,.2)',
        borderRadius: 14,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 800, color: '#b91c1c', marginBottom: 12 }}>
        📌 Words to review ({missedQuestions.length} missed)
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        {missedQuestions.map((q, i) => (
          <div
            key={i}
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              background: 'var(--card)',
              border: '1px solid var(--card-b)',
              fontSize: 13,
            }}
          >
            <div
              style={{
                fontWeight: 700,
                color: 'var(--heading)',
                fontFamily: "'Playfair Display',serif",
                marginBottom: 3,
              }}
            >
              &ldquo;{q.hr}&rdquo;
            </div>
            <div style={{ color: 'var(--subtext)', fontSize: 12 }}>{q.en}</div>
          </div>
        ))}
      </div>
      <button
        onClick={handleAdd}
        disabled={added}
        style={{
          width: '100%',
          padding: '11px',
          borderRadius: 12,
          border: 'none',
          background: added ? '#dcfce7' : '#b91c1c',
          color: added ? '#166534' : 'white',
          fontSize: 14,
          fontWeight: 800,
          cursor: added ? 'default' : 'pointer',
          fontFamily: "'Outfit',sans-serif",
          transition: 'background .3s',
        }}
      >
        {added ? '✓ Added to flashcard review' : '+ Add to flashcard review'}
      </button>
    </div>
  );
}
