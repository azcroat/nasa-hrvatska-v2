import React, { useState, useEffect } from 'react';
import Dexie from 'dexie';
import { H, speak, srMark, getSR } from '../../data.jsx';

// ── Dexie (IndexedDB) — unlimited offline storage, syncs seamlessly ──────────
const db = /** @type {any} */ (new Dexie('NasaHrvatska'));
db.version(1).stores({ journal: '++id,date' });

// Migrate existing localStorage words on first load
async function migrateFromLocalStorage() {
  try {
    const raw = localStorage.getItem('uJournal');
    if (!raw) return;
    const existing = await db.journal.count();
    if (existing > 0) { localStorage.removeItem('uJournal'); return; }
    const words = JSON.parse(raw);
    if (Array.isArray(words) && words.length > 0) {
      await db.journal.bulkAdd(words.map(w => ({ hr: w.hr, en: w.en, date: w.date || Date.now() })));
    }
    localStorage.removeItem('uJournal');
  } catch (_) {}
}

export default function VocabJournal({ goBack }) {
  const [words, setWords] = useState([]);
  const [jIn, setJIn] = useState('');
  const [jEn, setJEn] = useState('');
  const [inSRS, setInSRS] = useState({});

  useEffect(() => {
    migrateFromLocalStorage().then(loadWords);
  }, []);

  async function loadWords() {
    const all = await db.journal.orderBy('date').reverse().toArray();
    setWords(all);
    const srData = getSR();
    const srsMap = {};
    all.forEach(w => { srsMap[w.hr] = !!srData[w.hr]; });
    setInSRS(srsMap);
  }

  function addToSRS(word) {
    // srMark(word, correct) — false initializes as "needs review"
    srMark(word.hr, false);
    setInSRS(prev => ({ ...prev, [word.hr]: true }));
  }

  async function addWord() {
    if (!jIn.trim() || !jEn.trim()) return;
    await db.journal.add({ hr: jIn.trim(), en: jEn.trim(), date: Date.now() });
    setJIn(''); setJEn('');
    loadWords();
  }

  async function deleteWord(id) {
    await db.journal.delete(id);
    loadWords();
  }

  return (
    <div className="scr-wrap">
      {H("📓 My Vocabulary Journal", "Save words you discover in real life")}
      <div className="c" style={{ marginBottom: 16, padding: 16 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input type="text" value={jIn} onChange={e => setJIn(e.target.value)} placeholder="Croatian word..."
            onKeyDown={e => e.key === 'Enter' && addWord()} style={{ flex: 1 }} />
          <input type="text" value={jEn} onChange={e => setJEn(e.target.value)} placeholder="English meaning..."
            onKeyDown={e => e.key === 'Enter' && addWord()} style={{ flex: 1 }} />
        </div>
        <button className="b bp" style={{ width: '100%' }} onClick={addWord}>➕ Add Word</button>
      </div>
      {words.length > 0 && words.some(w => !inSRS[w.hr]) && (
        <button
          className="b bg"
          style={{ width: '100%', marginBottom: 12, fontSize: 13 }}
          onClick={() => {
            words.filter(w => !inSRS[w.hr]).forEach(w => srMark(w.hr, false));
            const newMap = { ...inSRS };
            words.forEach(w => { newMap[w.hr] = true; });
            setInSRS(newMap);
          }}
        >
          📚 Add All to SRS Study ({words.filter(w => !inSRS[w.hr]).length} words)
        </button>
      )}
      <div style={{ fontSize: 14, fontWeight: 700, color: '#78716c', marginBottom: 8 }}>{words.length} words saved</div>
      {words.map((w) => (
        <div key={w.id} className="c" style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px' }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0, fontFamily: "'Outfit',sans-serif" }} onClick={() => speak(w.hr)}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--heading)' }}>{w.hr} 🔊</div>
            <div style={{ fontSize: 13, color: 'var(--subtext)' }}>{w.en}</div>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {inSRS[w.hr] ? (
              <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 700, padding: '4px 8px', background: 'rgba(22,163,74,0.1)', borderRadius: 20 }}>
                ✓ In SRS
              </span>
            ) : (
              <button
                style={{ background: 'rgba(14,116,144,0.1)', border: 'none', borderRadius: 20, fontSize: 11, fontWeight: 700, color: '#0e7490', padding: '4px 10px', cursor: 'pointer', marginRight: 4 }}
                onClick={() => addToSRS(w)}
                title="Add to spaced repetition review"
              >
                📚 Study
              </button>
            )}
            <button style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: '#dc2626', padding: 4 }}
              onClick={() => deleteWord(w.id)}>✖</button>
          </div>
        </div>
      ))}
    </div>
  );
}
