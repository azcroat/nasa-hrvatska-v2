// @ts-nocheck
import React, { useState, useEffect } from 'react';
import Dexie from 'dexie';
import { H, speak, srMark, getSR } from '../../data';
import { apiFetch } from '../../lib/apiFetch.js';

// ── Dexie (IndexedDB) — unlimited offline storage, syncs seamlessly ──────────
const db = /** @type {any} */ new Dexie('NasaHrvatska');
db.version(1).stores({ journal: '++id,date' });
// v2 — adds examples column (nullable JSON array of {hr,en,note}).
// upgrade() preserves all existing rows; new column defaults to undefined.
db.version(2)
  .stores({ journal: '++id,date,examples' })
  .upgrade(() => {});

// Migrate existing localStorage words on first load
async function migrateFromLocalStorage() {
  try {
    const raw = localStorage.getItem('uJournal');
    if (!raw) return;
    const existing = await db.journal.count();
    if (existing > 0) {
      localStorage.removeItem('uJournal');
      return;
    }
    const words = JSON.parse(raw);
    if (Array.isArray(words) && words.length > 0) {
      await db.journal.bulkAdd(
        words.map((w) => ({ hr: w.hr, en: w.en, date: w.date || Date.now() })),
      );
    }
    localStorage.removeItem('uJournal');
  } catch (_) {}
}

// Read user's CEFR level from localStorage (set by placement test / profile)
function getUserLevel() {
  try {
    return localStorage.getItem('nh_level') || 'A2';
  } catch {
    return 'A2';
  }
}

export default function VocabJournal({ goBack }) {
  const [words, setWords] = useState([]);
  const [jIn, setJIn] = useState('');
  const [jEn, setJEn] = useState('');
  const [inSRS, setInSRS] = useState({});
  const [expandedWord, setExpandedWord] = useState(null); // word id with examples open
  const [fetchingExamples, setFetchingExamples] = useState({}); // {id: true}

  useEffect(() => {
    migrateFromLocalStorage().then(loadWords);
  }, []);

  async function loadWords() {
    const all = await db.journal.orderBy('date').reverse().toArray();
    setWords(all);
    const srData = getSR();
    const srsMap = {};
    all.forEach((w) => {
      srsMap[w.hr] = !!srData[w.hr];
    });
    setInSRS(srsMap);
  }

  function addToSRS(word) {
    // srMark(word, correct) — false initializes as "needs review"
    srMark(word.hr, false);
    setInSRS((prev) => ({ ...prev, [word.hr]: true }));
  }

  async function addWord() {
    if (!jIn.trim() || !jEn.trim()) return;
    const hr = jIn.trim();
    const en = jEn.trim();
    const id = await db.journal.add({ hr, en, date: Date.now(), examples: null });
    setJIn('');
    setJEn('');
    loadWords();
    // Fire-and-forget: fetch AI examples in background, store in IndexedDB
    fetchAndStoreExamples(id, hr, en);
  }

  async function fetchAndStoreExamples(id, hr, en) {
    setFetchingExamples((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await apiFetch('/api/vocab-expand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: hr, translation: en, level: getUserLevel() }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.examples?.length) {
          await db.journal.update(id, { examples: data.examples });
          loadWords();
        }
      }
    } catch (_) {
    } finally {
      setFetchingExamples((prev) => {
        const n = { ...prev };
        delete n[id];
        return n;
      });
    }
  }

  async function deleteWord(id) {
    await db.journal.delete(id);
    loadWords();
  }

  return (
    <div className="scr-wrap">
      {H('📓 My Vocabulary Journal', 'Save words you discover in real life', goBack)}
      <div className="c" style={{ marginBottom: 16, padding: 16 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input
            type="text"
            value={jIn}
            onChange={(e) => setJIn(e.target.value)}
            placeholder="Croatian word..."
            onKeyDown={(e) => e.key === 'Enter' && addWord()}
            style={{ flex: 1 }}
          />
          <input
            type="text"
            value={jEn}
            onChange={(e) => setJEn(e.target.value)}
            placeholder="English meaning..."
            onKeyDown={(e) => e.key === 'Enter' && addWord()}
            style={{ flex: 1 }}
          />
        </div>
        <button className="b bp" style={{ width: '100%' }} onClick={addWord}>
          ➕ Add Word
        </button>
      </div>
      {words.length > 0 && words.some((w) => !inSRS[w.hr]) && (
        <button
          className="b bg"
          style={{ width: '100%', marginBottom: 12, fontSize: 13 }}
          onClick={() => {
            words.filter((w) => !inSRS[w.hr]).forEach((w) => srMark(w.hr, false));
            const newMap = { ...inSRS };
            words.forEach((w) => {
              newMap[w.hr] = true;
            });
            setInSRS(newMap);
          }}
        >
          📚 Add All to SRS Study ({words.filter((w) => !inSRS[w.hr]).length} words)
        </button>
      )}
      <div style={{ fontSize: 14, fontWeight: 700, color: '#78716c', marginBottom: 8 }}>
        {words.length} words saved
      </div>
      {words.map((w) => (
        <div key={w.id} className="c" style={{ marginBottom: 8 }}>
          {/* Main word row */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 14px',
            }}
          >
            <button
              aria-label={`Play audio for ${w.hr}`}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                padding: 0,
                fontFamily: "'Outfit',sans-serif",
              }}
              onClick={() => speak(w.hr)}
            >
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--heading)' }}>
                {w.hr} <span aria-hidden="true">🔊</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--subtext)' }}>{w.en}</div>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {/* Examples toggle */}
              {w.examples?.length > 0 && (
                <button
                  style={{
                    background: expandedWord === w.id ? 'rgba(212,0,45,.1)' : 'rgba(0,0,0,.05)',
                    border: 'none',
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 700,
                    color: expandedWord === w.id ? '#D4002D' : 'var(--subtext)',
                    padding: '4px 10px',
                    cursor: 'pointer',
                  }}
                  onClick={() => setExpandedWord(expandedWord === w.id ? null : w.id)}
                >
                  {expandedWord === w.id ? 'Hide' : '💡 Examples'}
                </button>
              )}
              {fetchingExamples[w.id] && (
                <span style={{ fontSize: 11, color: 'var(--subtext)', padding: '4px 8px' }}>
                  ✨ Loading…
                </span>
              )}
              {inSRS[w.hr] ? (
                <span
                  style={{
                    fontSize: 11,
                    color: '#16a34a',
                    fontWeight: 700,
                    padding: '4px 8px',
                    background: 'rgba(22,163,74,0.1)',
                    borderRadius: 20,
                  }}
                >
                  ✓ In SRS
                </span>
              ) : (
                <button
                  style={{
                    background: 'rgba(14,116,144,0.1)',
                    border: 'none',
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#0e7490',
                    padding: '4px 10px',
                    cursor: 'pointer',
                  }}
                  onClick={() => addToSRS(w)}
                  title="Add to spaced repetition review"
                >
                  📚 Study
                </button>
              )}
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 16,
                  cursor: 'pointer',
                  color: '#dc2626',
                  padding: 4,
                }}
                onClick={() => deleteWord(w.id)}
              >
                ✖
              </button>
            </div>
          </div>

          {/* Inline AI examples */}
          {expandedWord === w.id && w.examples?.length > 0 && (
            <div
              style={{
                borderTop: '1px solid var(--card-b)',
                padding: '10px 14px',
                background: 'rgba(212,0,45,.03)',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: 'var(--subtext)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 8,
                }}
              >
                Example Sentences
              </div>
              {w.examples.map((ex, i) => (
                <div key={i} style={{ marginBottom: i < w.examples.length - 1 ? 10 : 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#D4002D', lineHeight: 1.4 }}>
                    {ex.hr}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--subtext)', fontStyle: 'italic' }}>
                    {ex.en}
                  </div>
                  {ex.note && (
                    <div style={{ fontSize: 11, color: '#78716c', marginTop: 2 }}>📝 {ex.note}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
