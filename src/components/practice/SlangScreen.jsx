/**
 * SlangScreen — Croatian Slang, Psovanje & Street Language
 * Orchestrator: state management + layout composition only.
 * Sub-components: SlangAgeGate, SlangEntryCard, SlangQuizPanel
 * Data: slangData.js
 */
import React, { useState } from 'react';
import { sh } from '../../data.jsx';
import { SECTIONS } from './slangData.js';
import SlangAgeGate from './SlangAgeGate.jsx';
import SlangEntryCard from './SlangEntryCard.jsx';
import SlangQuizPanel from './SlangQuizPanel.jsx';

export default function SlangScreen({ goBack, award }) {
  const [gated, setGated]   = useState(() => localStorage.getItem('slangAgeConfirmed') !== 'true');
  const [activeSection, setActiveSection] = useState(() => {
    const init = localStorage.getItem('slangInitSection');
    if (init) { localStorage.removeItem('slangInitSection'); return init; }
    return 'classics';
  });
  const [expanded, setExpanded] = useState(null);
  const [xpAwarded, setXpAwarded] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searching, setSearching] = useState(false);

  // ── Section XP tracking ────────────────────────────────────────────────────
  const [visitedSections, setVisitedSections] = useState(() => {
    try { return JSON.parse(localStorage.getItem('slangVisited') || '[]'); } catch { return []; }
  });

  // ── Quiz state ─────────────────────────────────────────────────────────────
  const [quizMode, setQuizMode] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizSelected, setQuizSelected] = useState(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const [quizXpGiven, setQuizXpGiven] = useState(false);

  function handleUnlock() {
    localStorage.setItem('slangAgeConfirmed', 'true');
    setGated(false);
    if (award && !xpAwarded) { award(15); setXpAwarded(true); }
  }

  function switchSection(id) {
    setActiveSection(id);
    setExpanded(null);
    setQuizMode(false);
    if (!visitedSections.includes(id)) {
      const next = [...visitedSections, id];
      setVisitedSections(next);
      localStorage.setItem('slangVisited', JSON.stringify(next));
      if (award) award(5);
    }
  }

  function startQuiz(sec) {
    const allEntries = SECTIONS.flatMap(s => s.entries);
    const pool = sh(sec.entries
      .filter(e => e.en && e.en.length < 60 && e.ph !== '—'))
      .slice(0, Math.min(6, sec.entries.length));
    if (pool.length < 2) return;
    const qs = pool.map(entry => {
      const wrong = sh(allEntries
        .filter(e => e !== entry && e.en && e.en.length < 60))
        .slice(0, 3);
      const opts = sh([...wrong.map(e => e.en), entry.en]);
      return { hr: entry.hr, correct: entry.en, opts };
    });
    setQuizQuestions(qs);
    setQuizIdx(0);
    setQuizSelected(null);
    setQuizScore(0);
    setQuizDone(false);
    setQuizXpGiven(false);
    setQuizMode(true);
  }

  function handleQuizAnswer(opt) {
    if (quizSelected !== null) return;
    setQuizSelected(opt);
    const correct = opt === quizQuestions[quizIdx].correct;
    if (correct) setQuizScore(s => s + 1);
    setTimeout(() => {
      if (quizIdx + 1 >= quizQuestions.length) {
        setQuizDone(true);
      } else {
        setQuizIdx(i => i + 1);
        setQuizSelected(null);
      }
    }, 1100);
  }

  function finishQuiz() {
    const xp = quizScore * 3;
    if (award && !quizXpGiven && xp > 0) { award(xp); setQuizXpGiven(true); }
  }

  // ── Age Gate ──────────────────────────────────────────────────────────────
  if (gated) {
    return <SlangAgeGate onUnlock={handleUnlock} onBack={goBack} />;
  }

  // ── Search mode ───────────────────────────────────────────────────────────
  const q = searchQ.toLowerCase().trim();
  const searchResults = q.length >= 2 ? SECTIONS.flatMap(s =>
    s.entries
      .filter(e =>
        e.hr.toLowerCase().includes(q) ||
        e.en.toLowerCase().includes(q) ||
        e.note.toLowerCase().includes(q) ||
        e.variants.some(v => v.hr.toLowerCase().includes(q) || v.en.toLowerCase().includes(q))
      )
      .map(e => ({ ...e, sectionColor: s.color, sectionLight: s.light, sectionBorder: s.border, sectionIcon: s.icon, sectionTitle: s.title }))
  ) : [];

  const section = SECTIONS.find(s => s.id === activeSection) || SECTIONS[0];

  return (
    <div className="scr-wrap" style={{ paddingBottom: 100 }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg,#1a1a2e,#0f3460)',
        borderRadius: 20, padding: '18px 20px', marginBottom: 14,
        color: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 36 }}>🤬</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 900, fontFamily: "'Playfair Display',serif" }}>Slang & Psovanje</div>
            <div style={{ fontSize: 11, opacity: .65, marginTop: 2 }}>12 sections · 150+ expressions · all with pronunciation</div>
          </div>
        </div>
        {/* Search */}
        <div style={{ marginTop: 14, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: .5, fontSize: 14 }}>🔍</span>
          <input
            type="search"
            placeholder="Search any word or phrase…"
            value={searchQ}
            onChange={e => { setSearchQ(e.target.value); setSearching(e.target.value.length >= 2); }}
            onFocus={() => setSearching(searchQ.length >= 2)}
            onBlur={() => setTimeout(() => setSearching(false), 200)}
            style={{
              width: '100%', padding: '10px 12px 10px 36px', borderRadius: 12,
              border: '1.5px solid rgba(255,255,255,.2)',
              background: 'rgba(255,255,255,.1)', color: '#fff',
              fontSize: 13, fontFamily: "'Outfit',sans-serif",
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* Search results */}
      {searching && searchQ.length >= 2 && (
        <div style={{ marginBottom: 14 }}>
          {searchResults.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--subtext)', fontSize: 13 }}>
              No matches for "{searchQ}"
            </div>
          ) : (
            searchResults.map((e, i) => (
              <SlangEntryCard
                key={i}
                entry={e}
                color={e.sectionColor}
                light={e.sectionLight}
                border={e.sectionBorder}
                keyId={`s${i}`}
                expanded={expanded}
                setExpanded={setExpanded}
              />
            ))
          )}
        </div>
      )}

      {/* Section tabs + content */}
      {!searching && (
        <>
          <div style={{ display: 'flex', gap: 7, marginBottom: 12, overflowX: 'auto', paddingBottom: 4 }}>
            {SECTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => switchSection(s.id)}
                style={{
                  flexShrink: 0, padding: '7px 12px', borderRadius: 20,
                  border: `1.5px solid ${activeSection === s.id ? s.color : 'var(--card-b)'}`,
                  background: activeSection === s.id ? s.light : 'var(--card)',
                  color: activeSection === s.id ? s.color : 'var(--subtext)',
                  fontSize: 12, fontWeight: 800, cursor: 'pointer',
                  fontFamily: "'Outfit',sans-serif", transition: 'all .2s',
                  position: 'relative',
                }}>
                {s.icon} {s.title}
                {visitedSections.includes(s.id) && <span style={{ position: 'absolute', top: -4, right: -4, width: 8, height: 8, borderRadius: '50%', background: '#16a34a', border: '1.5px solid var(--card)' }} />}
              </button>
            ))}
          </div>

          {/* Section header with subtitle + Quick Quiz button */}
          <div style={{
            background: section.light, border: `1.5px solid ${section.border}`,
            borderRadius: 12, padding: '9px 14px', marginBottom: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
          }}>
            <div style={{ fontSize: 12, color: section.color, fontWeight: 700, flex: 1 }}>
              {section.subtitle}
            </div>
            {!quizMode && (
              <button
                onClick={() => startQuiz(section)}
                style={{
                  padding: '5px 11px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: section.color, color: '#fff',
                  fontSize: 11, fontWeight: 800, flexShrink: 0,
                  fontFamily: "'Outfit',sans-serif",
                }}>
                🎯 Quiz
              </button>
            )}
            {quizMode && (
              <button
                onClick={() => setQuizMode(false)}
                style={{
                  padding: '5px 11px', borderRadius: 10, border: `1px solid ${section.border}`,
                  cursor: 'pointer', background: 'var(--card)', color: section.color,
                  fontSize: 11, fontWeight: 800, flexShrink: 0,
                  fontFamily: "'Outfit',sans-serif",
                }}>
                ✕ Exit Quiz
              </button>
            )}
          </div>

          {/* Quiz panel */}
          <SlangQuizPanel
            section={section}
            quizMode={quizMode}
            quizDone={quizDone}
            quizQuestions={quizQuestions}
            quizIdx={quizIdx}
            quizSelected={quizSelected}
            quizScore={quizScore}
            onAnswer={handleQuizAnswer}
            onTryAgain={() => { finishQuiz(); startQuiz(section); }}
            onDone={() => { finishQuiz(); setQuizMode(false); }}
          />

          {/* Entries (hidden during quiz) */}
          {!quizMode && section.entries.map((entry, i) => (
            <SlangEntryCard
              key={i}
              entry={entry}
              color={section.color}
              light={section.light}
              border={section.border}
              keyId={i}
              expanded={expanded}
              setExpanded={setExpanded}
            />
          ))}
        </>
      )}

      {/* Progress + Footer note */}
      {!searching && (
        <>
          <div style={{
            background: 'var(--card)', border: '1.5px solid var(--card-b)',
            borderRadius: 16, padding: '14px 16px', marginTop: 8, marginBottom: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--heading)' }}>📊 Your Progress</div>
              <div style={{ fontSize: 11, color: 'var(--subtext)', marginTop: 2 }}>
                {visitedSections.length} of {SECTIONS.length} sections explored · +5 XP each
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#16a34a' }}>{visitedSections.length}/{SECTIONS.length}</div>
              <div style={{ height: 4, width: 72, background: 'var(--bar-bg)', borderRadius: 4, marginTop: 4 }}>
                <div style={{ height: '100%', width: `${(visitedSections.length / SECTIONS.length) * 100}%`, background: '#16a34a', borderRadius: 4, transition: 'width .5s' }} />
              </div>
            </div>
          </div>
          <div style={{
            background: 'linear-gradient(135deg,#1a1a2e,#0f3460)',
            borderRadius: 16, padding: '16px 20px', marginBottom: 16,
            color: '#fff', fontSize: 12, lineHeight: 1.7,
          }}>
            <div style={{ fontWeight: 900, fontSize: 13, marginBottom: 6 }}>🇭🇷 Cultural Note</div>
            Croatian swearing is deeply social and tone-dependent. The same phrase can be a declaration of love between friends or a serious insult between strangers. Tone, relationship, and setting determine meaning entirely. When in doubt, listen first.
          </div>
        </>
      )}

      <button onClick={goBack} style={{
        width: '100%', padding: 14, background: 'none',
        border: '1.5px solid var(--card-b)', borderRadius: 14,
        color: 'var(--subtext)', fontSize: 14, fontWeight: 700,
        cursor: 'pointer', fontFamily: "'Outfit',sans-serif",
      }}>← Back to Practice</button>
    </div>
  );
}
