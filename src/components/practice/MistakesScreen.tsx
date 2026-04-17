// @ts-nocheck
import React, { useState, useCallback } from 'react';
import { H, getMistakes, clearMistake, clearAllMistakes, speak } from '../../data';
import { markQuest } from '../../lib/quests.js';

// ── Flip card ──────────────────────────────────────────────────────────────────
function FlipCard({ mistake, onGotIt, onStudyAgain }) {
  const [flipped, setFlipped] = useState(false);

  function handleFlip() { setFlipped(f => !f); }

  return (
    <div style={{ perspective: 1000, marginBottom: 24 }}>
      <div
        onClick={handleFlip}
        style={{
          position: 'relative',
          width: '100%',
          minHeight: 180,
          transition: 'transform 0.5s',
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          cursor: 'pointer',
        }}
      >
        {/* Front — Croatian */}
        <div style={{
          position: 'absolute', width: '100%', minHeight: 180,
          backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
          background: 'linear-gradient(135deg,#eff6ff,#dbeafe)',
          borderRadius: 20, border: '2px solid #bfdbfe',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '24px 20px', boxSizing: 'border-box',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', letterSpacing: 1, marginBottom: 8 }}>CROATIAN</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#1e40af', marginBottom: 12, textAlign: 'center' }}>{mistake.hr}</div>
          {mistake.q && <div style={{ fontSize: 13, color: '#4b5563', textAlign: 'center', marginBottom: 8 }}>"{mistake.q}"</div>}
          <button
            aria-label={`Play audio for ${mistake.hr}`}
            onClick={e => { e.stopPropagation(); speak(mistake.hr); }}
            style={{ background: '#3b82f6', border: 'none', borderRadius: 50, width: 36, height: 36, color: '#fff', fontSize: 16, cursor: 'pointer', marginTop: 4 }}>
            <span aria-hidden="true">🔊</span>
          </button>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 12 }}>Tap to reveal</div>
        </div>

        {/* Back — English */}
        <div style={{
          position: 'absolute', width: '100%', minHeight: 180,
          backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)',
          borderRadius: 20, border: '2px solid #bbf7d0',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '24px 20px', boxSizing: 'border-box',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', letterSpacing: 1, marginBottom: 8 }}>ENGLISH</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#15803d', marginBottom: 16, textAlign: 'center' }}>{mistake.en || '—'}</div>
          {mistake.category && <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>Category: {mistake.category}</div>}
          <div style={{ display: 'flex', gap: 12, width: '100%' }}>
            <button
              onClick={e => { e.stopPropagation(); onStudyAgain(); }}
              style={{ flex: 1, padding: '12px', background: 'rgba(239,68,68,.1)', border: '2px solid rgba(239,68,68,.25)', borderRadius: 14, color: '#dc2626', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              📚 Study Again
            </button>
            <button
              onClick={e => { e.stopPropagation(); onGotIt(); }}
              style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg,#16a34a,#15803d)', border: 'none', borderRadius: 14, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              ✅ Got It!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── List item ──────────────────────────────────────────────────────────────────
function MistakeListItem({ mistake, onClear }) {
  return (
    <div className="c" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
      <button onClick={() => speak(mistake.hr)} aria-label={`Play audio for ${mistake.hr}`} style={{ background: '#eff6ff', border: 'none', borderRadius: 50, width: 36, height: 36, fontSize: 16, cursor: 'pointer', flexShrink: 0 }}><span aria-hidden="true">🔊</span></button>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1e40af' }}>{mistake.hr}</div>
        <div style={{ fontSize: 13, color: '#6b7280' }}>{mistake.en}</div>
      </div>
      {(() => {
        const conf = Math.max(10, 100 - mistake.count * 12);
        const bg = conf > 70
          ? 'linear-gradient(135deg,#0e7490,#0891b2)'
          : conf > 45
          ? 'linear-gradient(135deg,#d97706,#b45309)'
          : 'linear-gradient(135deg,#dc2626,#b91c1c)';
        return (
          <div style={{ fontSize: 10, fontWeight: 800, color: '#fff', background: bg, borderRadius: 20, padding: '3px 9px', flexShrink: 0, letterSpacing: 0.2, whiteSpace: 'nowrap' }}>
            ✦ {conf}% ready
          </div>
        );
      })()}
      <button onClick={() => onClear(mistake.hr)} aria-label={`Remove ${mistake.hr} from mistakes`} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#9ca3af', flexShrink: 0 }}>×</button>
    </div>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────
export default function MistakesScreen({ goBack, award }) {
  const [mistakes, setMistakes] = useState(() => getMistakes().sort((a, b) => b.count - a.count));
  const [mode, setMode] = useState('list'); // 'list' | 'review'
  const [reviewIdx, setReviewIdx] = useState(0);
  const [mastered, setMastered] = useState(0);
  const [reviewDeck, setReviewDeck] = useState([]);

  function startReview() {
    const arr = [...mistakes];
    for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
    const deck = arr;
    setReviewDeck(deck);
    setReviewIdx(0);
    setMastered(0);
    setMode('review');
  }

  const handleGotIt = useCallback(() => {
    const word = reviewDeck[reviewIdx];
    clearMistake(word.hr);
    setMistakes(getMistakes().sort((a, b) => b.count - a.count));
    const newMastered = mastered + 1;
    setMastered(newMastered);
    if (reviewIdx + 1 >= reviewDeck.length) {
      // Session complete
      if (award && newMastered > 0) { award(newMastered * 5, newMastered >= 3); markQuest('master'); }
      setMode('done');
    } else {
      setReviewIdx(i => i + 1);
    }
  }, [reviewDeck, reviewIdx, mastered, award]);

  const handleStudyAgain = useCallback(() => {
    if (reviewIdx + 1 >= reviewDeck.length) {
      setMode('done');
    } else {
      setReviewIdx(i => i + 1);
    }
  }, [reviewDeck, reviewIdx]);

  function clearAll() {
    if (!confirm('Clear all mistake records? This cannot be undone.')) return;
    clearAllMistakes();
    setMistakes([]);
  }

  function clearOne(hr) {
    clearMistake(hr);
    setMistakes(getMistakes().sort((a, b) => b.count - a.count));
  }

  // ── REVIEW MODE ──────────────────────────────────────────────────────────────
  if (mode === 'review') {
    const current = reviewDeck[reviewIdx];
    if (!current) return null;
    const progress = ((reviewIdx) / reviewDeck.length) * 100;
    return (
      <div className="scr-wrap">
        {H('📚 Review Mistakes', `Card ${reviewIdx + 1} of ${reviewDeck.length}`, goBack)}
        {/* Progress bar */}
        <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, marginBottom: 20, overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg,#3b82f6,#6366f1)', borderRadius: 3, transition: 'width .3s' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280', marginBottom: 16 }}>
          <span>✅ Mastered: {mastered}</span>
          <span>Remaining: {reviewDeck.length - reviewIdx}</span>
        </div>
        <FlipCard
          key={reviewIdx}
          mistake={current}
          onGotIt={handleGotIt}
          onStudyAgain={handleStudyAgain}
        />
        <button onClick={() => setMode('list')} style={{ width: '100%', padding: 12, background: 'none', border: '1.5px solid #e2e8f0', borderRadius: 14, color: '#6b7280', fontSize: 13, cursor: 'pointer', marginTop: 8 }}>
          ← Back to List
        </button>
      </div>
    );
  }

  // ── DONE MODE ────────────────────────────────────────────────────────────────
  if (mode === 'done') {
    return (
      <div className="scr-wrap">
        {H('📚 Review Complete!', 'Great work!', goBack)}
        <div className="c" style={{ textAlign: 'center', padding: '32px 20px' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
          <h3 style={{ color: '#15803d', marginBottom: 8 }}>Session Complete!</h3>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#1e40af', marginBottom: 8 }}>+{mastered * 5} XP</div>
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>
            You mastered <strong>{mastered}</strong> word{mastered !== 1 ? 's' : ''} this session.
            {getMistakes().length > 0 && ` ${getMistakes().length} word${getMistakes().length !== 1 ? 's' : ''} remaining to review.`}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            {getMistakes().length > 0 && (
              <button className="b bp" onClick={() => { setMistakes(getMistakes().sort((a, b) => b.count - a.count)); setMode('list'); }}>
                📋 Back to List
              </button>
            )}
            <button className="b bg" onClick={goBack}>← Home</button>
          </div>
        </div>
      </div>
    );
  }

  // ── LIST MODE ────────────────────────────────────────────────────────────────
  return (
    <div className="scr-wrap">
      {H('📚 Mistake Review', 'Words you got wrong — let\'s master them!', goBack)}

      {mistakes.length === 0 ? (
        <div className="c" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>
          <h3 style={{ color: '#15803d', marginBottom: 8 }}>No Mistakes!</h3>
          <p style={{ color: '#6b7280', fontSize: 14 }}>
            You haven't made any mistakes yet — or you've mastered them all. Keep practicing to build your vocabulary!
          </p>
          <button className="b bp" style={{ marginTop: 16 }} onClick={goBack}>← Back</button>
        </div>
      ) : (
        <>
          {/* Summary card */}
          <div className="c" style={{ background: 'linear-gradient(135deg,#fff7ed,#fed7aa)', borderLeft: '4px solid #f97316', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#9a3412' }}>🔁 {mistakes.length} Word{mistakes.length !== 1 ? 's' : ''} to Review</div>
                <div style={{ fontSize: 12, color: '#78716c' }}>Tap a card to flip and reveal the meaning</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="b bp"
                style={{ flex: 1, fontSize: 14 }}
                onClick={startReview}>
                🃏 Start Flashcard Review
              </button>
            </div>
          </div>

          {/* Word list */}
          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', letterSpacing: 0.5 }}>ALL MISTAKES (most frequent first)</div>
            <button onClick={clearAll} style={{ fontSize: 11, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Clear All</button>
          </div>
          {mistakes.map(m => (
            <MistakeListItem key={m.hr} mistake={m} onClear={clearOne} />
          ))}
        </>
      )}
    </div>
  );
}
