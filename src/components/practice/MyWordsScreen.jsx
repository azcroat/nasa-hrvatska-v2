import React, { useState } from 'react';
import { speak, lXP, srMark } from '../../data.jsx';

const STORAGE_KEY = 'nh_custom_words';

function loadWords() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}

function saveWords(words) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
}

function timeAgo(ts) {
  const secs = Math.floor((Date.now() - ts) / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  const mos = Math.floor(days / 30);
  return `${mos} month${mos === 1 ? '' : 's'} ago`;
}

/* ─── Styles ─────────────────────────────────────────────────────────── */

const S = {
  wrap: {
    minHeight: '100vh',
    background: 'var(--app-bg)',
    fontFamily: 'inherit',
  },
  header: {
    background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2847 100%)',
    color: '#fff',
    padding: '16px 16px 20px',
    position: 'relative',
  },
  headerTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
  },
  backBtn: {
    background: 'rgba(255,255,255,0.15)',
    border: 'none',
    color: '#fff',
    borderRadius: 8,
    padding: '6px 12px',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 700,
    margin: 0,
    flex: 1,
  },
  headerSub: {
    fontSize: 13,
    opacity: 0.8,
    marginLeft: 2,
  },
  body: {
    padding: '16px',
    maxWidth: 560,
    margin: '0 auto',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    flexWrap: 'wrap',
    gap: 8,
  },
  countText: {
    fontSize: 14,
    color: 'var(--subtext)',
    fontWeight: 500,
  },
  btnGroup: {
    display: 'flex',
    gap: 8,
  },
  btnPrimary: {
    background: '#1e3a5f',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '8px 16px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnGreen: {
    background: '#16a34a',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '8px 16px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnRed: {
    background: '#dc2626',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '8px 16px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnGhost: {
    background: 'transparent',
    color: 'var(--heading)',
    border: '1.5px solid var(--card-b)',
    borderRadius: 8,
    padding: '8px 14px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  card: {
    background: 'var(--card)',
    border: '1px solid var(--card-b)',
    borderRadius: 12,
    padding: '14px 16px',
    marginBottom: 10,
    position: 'relative',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    transition: 'box-shadow 0.15s',
  },
  hrWord: {
    fontSize: 20,
    fontWeight: 700,
    color: 'var(--heading)',
    marginBottom: 2,
  },
  enWord: {
    fontSize: 15,
    color: 'var(--subtext)',
    marginBottom: 4,
  },
  phonetic: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 13,
    color: '#1e3a5f',
    background: 'rgba(30,58,95,0.08)',
    borderRadius: 6,
    padding: '2px 8px',
    cursor: 'pointer',
    marginBottom: 4,
    border: 'none',
    fontFamily: 'inherit',
  },
  dateAdded: {
    fontSize: 12,
    color: 'var(--subtext)',
    opacity: 0.7,
    marginTop: 4,
  },
  deleteBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    background: 'rgba(220,38,38,0.1)',
    border: 'none',
    color: '#dc2626',
    borderRadius: 6,
    width: 28,
    height: 28,
    fontSize: 15,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    textAlign: 'center',
    padding: '48px 24px',
    color: 'var(--subtext)',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--heading)',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    lineHeight: 1.6,
    marginBottom: 24,
  },
  /* Add form */
  formCard: {
    background: 'var(--card)',
    border: '1px solid var(--card-b)',
    borderRadius: 14,
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--heading)',
    marginBottom: 18,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--subtext)',
    marginBottom: 5,
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    fontSize: 15,
    borderRadius: 8,
    border: '1.5px solid var(--card-b)',
    background: 'var(--app-bg)',
    color: 'var(--heading)',
    boxSizing: 'border-box',
    outline: 'none',
    fontFamily: 'inherit',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12,
    marginTop: 4,
  },
  formActions: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  cancelLink: {
    background: 'none',
    border: 'none',
    color: 'var(--subtext)',
    fontSize: 14,
    cursor: 'pointer',
    padding: '4px 8px',
    textDecoration: 'underline',
    fontFamily: 'inherit',
  },
  /* Drill */
  drillWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '32px 16px',
    gap: 20,
  },
  drillProgress: {
    fontSize: 13,
    color: 'var(--subtext)',
    fontWeight: 500,
  },
  drillCard: {
    background: 'var(--card)',
    border: '1px solid var(--card-b)',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    minHeight: 200,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 24px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
    cursor: 'pointer',
    userSelect: 'none',
    textAlign: 'center',
  },
  drillHr: {
    fontSize: 36,
    fontWeight: 800,
    color: 'var(--heading)',
    marginBottom: 8,
  },
  drillPhonetic: {
    fontSize: 14,
    color: '#1e3a5f',
    background: 'rgba(30,58,95,0.08)',
    borderRadius: 6,
    padding: '2px 10px',
    marginBottom: 6,
    cursor: 'default',
  },
  drillTapHint: {
    fontSize: 13,
    color: 'var(--subtext)',
    marginTop: 12,
    opacity: 0.7,
  },
  drillEn: {
    fontSize: 22,
    fontWeight: 600,
    color: '#16a34a',
    marginBottom: 6,
  },
  drillBtns: {
    display: 'flex',
    gap: 12,
    width: '100%',
    maxWidth: 400,
  },
  drillBtnFlex: {
    flex: 1,
    padding: '12px',
    fontSize: 16,
    fontWeight: 700,
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer',
  },
  resultWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '48px 24px',
    textAlign: 'center',
    gap: 16,
  },
  resultIcon: { fontSize: 56 },
  resultTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: 'var(--heading)',
  },
  resultScore: {
    fontSize: 16,
    color: 'var(--subtext)',
  },
};

/* ─── Sub-views ───────────────────────────────────────────────────────── */

function WordList({ words, setWords, setView }) {
  function deleteWord(idx) {
    const updated = words.filter((_, i) => i !== idx);
    setWords(updated);
    saveWords(updated);
  }

  if (words.length === 0) {
    return (
      <div style={S.emptyState}>
        <div style={S.emptyIcon}>📚</div>
        <div style={S.emptyTitle}>Your personal vocabulary deck is empty.</div>
        <div style={S.emptyDesc}>
          Add words you encounter in real life — TV, conversations, signs, menus.
        </div>
        <button style={S.btnPrimary} onClick={() => setView('add')}>
          + Add your first word
        </button>
      </div>
    );
  }

  return (
    <>
      <div style={S.topBar}>
        <span style={S.countText}>{words.length} word{words.length === 1 ? '' : 's'} in your deck</span>
        <div style={S.btnGroup}>
          <button style={S.btnGhost} onClick={() => setView('drill')}>
            Drill My Words
          </button>
          <button style={S.btnPrimary} onClick={() => setView('add')}>
            + Add Word
          </button>
        </div>
      </div>
      {words.map((w, i) => (
        <div key={i} style={S.card}>
          <button
            style={S.deleteBtn}
            title="Delete word"
            onClick={() => deleteWord(i)}
          >
            ×
          </button>
          <div style={S.hrWord}>{w.hr}</div>
          <div style={S.enWord}>{w.en}</div>
          {w.phonetic ? (
            <button
              style={S.phonetic}
              onClick={() => speak(w.hr, 'hr-HR')}
              title="Tap to hear pronunciation"
            >
              🔊 {w.phonetic}
            </button>
          ) : null}
          {w.example ? (
            <div style={{ fontSize: 13, color: 'var(--subtext)', fontStyle: 'italic', marginTop: 4 }}>
              "{w.example}"
            </div>
          ) : null}
          <div style={S.dateAdded}>added {timeAgo(w.addedAt)}</div>
        </div>
      ))}
    </>
  );
}

function AddWordForm({ words, setWords, setView }) {
  const [hr, setHr] = useState('');
  const [en, setEn] = useState('');
  const [phonetic, setPhonetic] = useState('');
  const [example, setExample] = useState('');
  const [error, setError] = useState('');

  function handleSave() {
    if (!hr.trim()) { setError('Croatian word is required.'); return; }
    if (!en.trim()) { setError('English meaning is required.'); return; }
    setError('');
    const newWord = {
      hr: hr.trim(),
      en: en.trim(),
      phonetic: phonetic.trim(),
      example: example.trim(),
      addedAt: Date.now(),
    };
    const updated = [...words, newWord];
    setWords(updated);
    saveWords(updated);
    setView('list');
  }

  return (
    <div style={S.formCard}>
      <div style={S.formTitle}>Add a New Word</div>
      <div style={S.fieldGroup}>
        <label style={S.label}>Croatian word <span style={{ color: '#dc2626' }}>*</span></label>
        <input
          style={S.input}
          value={hr}
          onChange={e => setHr(e.target.value)}
          placeholder="e.g. krastavac"
          autoFocus
        />
      </div>
      <div style={S.fieldGroup}>
        <label style={S.label}>English meaning <span style={{ color: '#dc2626' }}>*</span></label>
        <input
          style={S.input}
          value={en}
          onChange={e => setEn(e.target.value)}
          placeholder="e.g. cucumber"
        />
      </div>
      <div style={S.fieldGroup}>
        <label style={S.label}>Phonetic (optional)</label>
        <input
          style={S.input}
          value={phonetic}
          onChange={e => setPhonetic(e.target.value)}
          placeholder="e.g. kra-STAH-vats"
        />
      </div>
      <div style={S.fieldGroup}>
        <label style={S.label}>Example sentence (optional)</label>
        <input
          style={S.input}
          value={example}
          onChange={e => setExample(e.target.value)}
          placeholder="e.g. Volim krastavce u salati."
        />
      </div>
      {error ? <div style={S.errorText}>{error}</div> : null}
      <div style={S.formActions}>
        <button style={S.btnPrimary} onClick={handleSave}>
          Save Word
        </button>
        <button style={S.cancelLink} onClick={() => setView('list')}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function DrillMode({ words, setView }) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);

  if (words.length === 0) {
    return (
      <div style={S.resultWrap}>
        <div style={S.resultIcon}>📭</div>
        <div style={S.resultTitle}>No words to drill yet!</div>
        <div style={S.resultScore}>Add some words first to drill.</div>
        <button style={S.btnPrimary} onClick={() => setView('list')}>Go Back</button>
      </div>
    );
  }

  if (done) {
    return (
      <div style={S.resultWrap}>
        <div style={S.resultIcon}>{correct === words.length ? '🏆' : '📚'}</div>
        <div style={S.resultTitle}>Well done!</div>
        <div style={S.resultScore}>You got {correct} out of {words.length} correct.</div>
        <div style={S.btnGroup}>
          <button style={S.btnPrimary} onClick={() => setView('list')}>Back to List</button>
        </div>
      </div>
    );
  }

  const word = words[idx];

  function handleResult(gotIt) {
    srMark(word.hr, gotIt);
    if (gotIt) setCorrect(c => c + 1);
    setFlipped(false);
    if (idx + 1 >= words.length) {
      setDone(true);
    } else {
      setIdx(i => i + 1);
    }
  }

  return (
    <div style={S.drillWrap}>
      <div style={S.drillProgress}>Card {idx + 1} of {words.length}</div>
      <div
        style={S.drillCard}
        onClick={() => !flipped && setFlipped(true)}
        role="button"
        tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!flipped) setFlipped(true); } }}
        aria-label={flipped ? `Translation: ${word.en}` : `Croatian word: ${word.hr}. Tap to reveal.`}
      >
        <div style={S.drillHr}>{word.hr}</div>
        {word.phonetic ? (
          <div style={S.drillPhonetic}>{word.phonetic}</div>
        ) : null}
        {flipped ? (
          <>
            <div style={S.drillEn}>{word.en}</div>
            {word.example ? (
              <div style={{ fontSize: 13, color: 'var(--subtext)', fontStyle: 'italic', marginTop: 6 }}>
                "{word.example}"
              </div>
            ) : null}
          </>
        ) : (
          <div style={S.drillTapHint}>Tap to reveal</div>
        )}
      </div>
      {flipped ? (
        <div style={S.drillBtns}>
          <button
            style={{ ...S.drillBtnFlex, background: '#dc2626', color: '#fff' }}
            onClick={() => handleResult(false)}
          >
            Try again ✗
          </button>
          <button
            style={{ ...S.drillBtnFlex, background: '#16a34a', color: '#fff' }}
            onClick={() => handleResult(true)}
          >
            Got it ✓
          </button>
        </div>
      ) : null}
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────── */

export default function MyWordsScreen({ onBack }) {
  const [view, setView] = useState('list');
  const [words, setWords] = useState(() => loadWords());

  const viewLabel = view === 'add' ? 'Add Word' : view === 'drill' ? 'Drill Mode' : 'My Words';
  const viewSubtitle =
    view === 'add'
      ? 'Save a new word to your deck'
      : view === 'drill'
      ? 'Test yourself on your words'
      : 'Your personal vocabulary deck';

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <div style={S.headerTop}>
          <button style={S.backBtn} onClick={view === 'list' ? onBack : () => setView('list')}>
            ← Back
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 22 }}>📚</span>
              <h1 style={S.headerTitle}>{viewLabel}</h1>
            </div>
          </div>
        </div>
        <div style={S.headerSub}>{viewSubtitle}</div>
      </div>

      <div style={S.body}>
        {view === 'list' && (
          <WordList words={words} setWords={setWords} setView={setView} />
        )}
        {view === 'add' && (
          <AddWordForm words={words} setWords={setWords} setView={setView} />
        )}
        {view === 'drill' && (
          <DrillMode words={words} setView={setView} />
        )}
      </div>
    </div>
  );
}
