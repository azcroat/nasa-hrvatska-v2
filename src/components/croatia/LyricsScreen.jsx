import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { H, Bar, speak } from '../../data.jsx';
import { apiFetch } from '../../lib/apiFetch.js';
import { SONGS, LINE_TRANSLATIONS } from './LyricsSongData.js';

// ── Vocab localStorage helpers ───────────────────────────────────────────────
const VOCAB_KEY = 'nh_lyrics_vocab';

function loadVocab() {
  try { return JSON.parse(localStorage.getItem(VOCAB_KEY) || '[]'); }
  catch { return []; }
}

function saveVocabWord(word, translation, note) {
  const list = loadVocab();
  if (!list.find(v => v.word === word)) {
    list.push({ word, translation, note, savedAt: Date.now() });
    localStorage.setItem(VOCAB_KEY, JSON.stringify(list));
  }
  return list;
}

function buildQuiz(song) {
  return song.lines.map(line => {
    const words = line.text.split(' ');
    return words.map(word => {
      const clean = word.replace(/[,!.?]/g, '');
      if (line.blanks.includes(clean)) return { word: clean, blank: true, punctuation: word.slice(clean.length) };
      return { word, blank: false };
    });
  });
}

// ── Word annotation tooltip ──────────────────────────────────────────────────
function WordTooltip({ word, data, loading, onClose, onSave, alreadySaved }) {
  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{
        position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)',
        zIndex: 9999, width: 'min(320px, 90vw)',
        background: 'var(--card)', border: '2px solid #0e7490',
        borderRadius: 16, padding: '14px 16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        fontFamily: "'Outfit',sans-serif",
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <span style={{ fontSize: 18, fontWeight: 900, color: '#0e7490', fontFamily: "'Playfair Display',serif" }}>{word}</span>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--subtext)', lineHeight: 1, padding: '8px' }}
          aria-label="Close"
        >×</button>
      </div>

      {loading ? (
        <div style={{ fontSize: 13, color: 'var(--subtext)', padding: '8px 0' }}>Translating...</div>
      ) : data ? (
        <>
          <div style={{ fontSize: 15, color: 'var(--text, #0f172a)', marginBottom: 4 }}>
            {data.translation}
          </div>
          {data.note && (
            <div style={{ fontSize: 12, color: 'var(--subtext)', fontStyle: 'italic', marginBottom: 10 }}>
              {data.note}
            </div>
          )}
          <button
            onClick={onSave}
            disabled={alreadySaved}
            style={{
              width: '100%', padding: '8px 12px', borderRadius: 10, border: 'none',
              background: alreadySaved ? 'var(--bar-bg)' : '#0e7490',
              color: alreadySaved ? 'var(--subtext)' : '#fff',
              fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 13,
              cursor: alreadySaved ? 'default' : 'pointer',
            }}
          >
            {alreadySaved ? '✓ Saved to vocabulary' : '＋ Save word'}
          </button>
        </>
      ) : (
        <div style={{ fontSize: 13, color: '#ef4444' }}>Could not translate. Try again.</div>
      )}
    </div>
  );
}

// ── AnnotatedLine: renders words as tappable spans ───────────────────────────
function AnnotatedLine({ text, translationCache, loadingWord, onWordTap, activeWord }) {
  const words = text.split(' ');
  return (
    <span>
      {words.map((rawWord, i) => {
        const clean = rawWord.replace(/[,!.?""''«»]/g, '');
        const punct = rawWord.slice(clean.length);
        const isLookedUp = clean && translationCache[clean.toLowerCase()];
        const isActive = activeWord && activeWord.toLowerCase() === clean.toLowerCase();
        const isLoading = loadingWord && loadingWord.toLowerCase() === clean.toLowerCase();
        return (
          <span key={i}>
            <span
              onClick={clean ? () => onWordTap(clean, rawWord) : undefined}
              style={{
                cursor: clean ? 'pointer' : 'default',
                borderBottom: isLookedUp ? '2px solid #0e7490' : isActive ? '2px solid #0e7490' : '2px solid transparent',
                color: isActive ? '#0e7490' : isLoading ? '#94a3b8' : 'inherit',
                fontWeight: isActive ? 700 : 'inherit',
                borderRadius: 3,
                padding: '0 1px',
                transition: 'color 0.15s, border-color 0.15s',
              }}
            >
              {clean}
            </span>
            {punct}{i < words.length - 1 ? ' ' : ''}
          </span>
        );
      })}
    </span>
  );
}

export default function LyricsScreen({ goBack, award }) {
  const [songIdx, setSongIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(null);
  const [mode, setMode] = useState('fillin'); // 'fillin' | 'readalong'
  const [openLines, setOpenLines] = useState([]);

  // ── Enhancement 1: Word annotation state ──────────────────────────────────
  const [translationCache, setTranslationCache] = useState({}); // {word_lower: {translation, note}}
  const [activeWord, setActiveWord] = useState(null);      // word string currently shown in tooltip
  const [loadingWord, setLoadingWord] = useState(null);
  const [tooltipData, setTooltipData] = useState(null);
  const [tooltipError, setTooltipError] = useState(false);
  const [vocabList, setVocabList] = useState(() => loadVocab());

  // ── Enhancement 2: Karaoke mode state ────────────────────────────────────
  const [karaokeOn, setKaraokeOn] = useState(false);
  const [karaokePlaying, setKaraokePlaying] = useState(false);
  const [karaokeLineIdx, setKaraokeLineIdx] = useState(0);
  const [karaokeSpeed, setKaraokeSpeed] = useState(4); // seconds per line
  const karaokeIntervalRef = useRef(null);
  const karaokeLineRefs = useRef([]);
  const lyricsScrollRef = useRef(null);

  const song = SONGS[songIdx];
  const quiz = useMemo(() => buildQuiz(song), [song]);
  const allBlanks = useMemo(() => song.lines.flatMap(l => l.blanks), [song]);

  const blankKey = useCallback((lineIdx, wordIdx) => `${lineIdx}-${wordIdx}`, []);

  // Count vocab saved from current song
  const songVocabCount = useMemo(() => {
    const songWords = new Set(
      song.lines.flatMap(l => l.text.split(' ').map(w => w.replace(/[,!.?""''«»]/g, '').toLowerCase()))
    );
    return vocabList.filter(v => songWords.has(v.word.toLowerCase())).length;
  }, [vocabList, song]);

  // ── Karaoke interval management ───────────────────────────────────────────
  useEffect(() => {
    if (karaokePlaying && karaokeOn) {
      karaokeIntervalRef.current = setInterval(() => {
        setKaraokeLineIdx(prev => {
          const next = prev + 1;
          if (next >= song.lines.length) {
            setKaraokePlaying(false);
            return prev;
          }
          return next;
        });
      }, karaokeSpeed * 1000);
    } else {
      clearInterval(karaokeIntervalRef.current);
    }
    return () => clearInterval(karaokeIntervalRef.current);
  }, [karaokePlaying, karaokeOn, karaokeSpeed, song.lines.length]);

  // Auto-scroll karaoke current line into view
  useEffect(() => {
    if (karaokeOn && karaokeLineRefs.current[karaokeLineIdx]) {
      karaokeLineRefs.current[karaokeLineIdx].scrollIntoView({
        behavior: 'smooth', block: 'center',
      });
    }
  }, [karaokeLineIdx, karaokeOn]);

  function resetKaraoke() {
    setKaraokeOn(false);
    setKaraokePlaying(false);
    setKaraokeLineIdx(0);
    clearInterval(karaokeIntervalRef.current);
  }

  function checkAnswers() {
    if (checked) return;
    let correct = 0;
    let total = 0;
    quiz.forEach((line, li) => line.forEach((token, wi) => {
      if (!token.blank) return;
      total++;
      const ans = (answers[blankKey(li, wi)] || '').trim().toLowerCase();
      if (ans === token.word.toLowerCase()) correct++;
    }));
    setChecked(true);
    setScore(correct);
    if (correct === total) award(30, true);
    else if (correct >= total * 0.7) award(15);
  }

  function reset() {
    setAnswers({});
    setChecked(false);
    setScore(null);
    setOpenLines([]);
    resetKaraoke();
  }

  function nextSong() {
    setSongIdx(i => (i + 1) % SONGS.length);
    reset();
  }

  function toggleLine(li) {
    setOpenLines(prev => {
      const next = [...prev];
      next[li] = !next[li];
      return next;
    });
  }

  // ── Word tap handler ───────────────────────────────────────────────────────
  async function handleWordTap(cleanWord) {
    const key = cleanWord.toLowerCase();
    setActiveWord(cleanWord);
    setTooltipError(false);

    if (translationCache[key]) {
      setTooltipData(translationCache[key]);
      return;
    }

    setLoadingWord(cleanWord);
    setTooltipData(null);
    try {
      const res = await apiFetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: cleanWord }],
          mode: 'translate',
          params: {},
        }),
      });
      const raw = await res.json();
      // API wraps JSON in {text: "..."} — parse the inner JSON
      const parsed = JSON.parse(raw.text || '{}');
      const result = { translation: parsed.translation || '', note: parsed.note || null };
      setTranslationCache(prev => ({ ...prev, [key]: result }));
      setTooltipData(result);
    } catch {
      setTooltipError(true);
      setTooltipData(null);
    } finally {
      setLoadingWord(null);
    }
  }

  function closeTooltip() {
    setActiveWord(null);
    setTooltipData(null);
    setTooltipError(false);
  }

  function handleSaveWord() {
    if (!activeWord) return;
    const key = activeWord.toLowerCase();
    const data = translationCache[key];
    if (!data) return;
    const updated = saveVocabWord(activeWord, data.translation, data.note);
    setVocabList(updated);
  }

  const alreadySaved = activeWord
    ? vocabList.some(v => v.word.toLowerCase() === activeWord.toLowerCase())
    : false;

  return (
    <div className="scr-wrap" onClick={activeWord ? closeTooltip : undefined}>
      {H('🎵 Song Lyrics', mode === 'fillin' ? 'Fill in the missing words' : 'Read Along')}

      {/* Enhancement 3: Vocab saved counter */}
      {songVocabCount > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10,
          padding: '6px 12px', borderRadius: 10, background: 'var(--bar-bg)',
          fontSize: 13, color: 'var(--subtext)', fontFamily: "'Outfit',sans-serif",
        }}>
          <span>📝</span>
          <span><strong style={{ color: '#0e7490' }}>{songVocabCount}</strong> word{songVocabCount !== 1 ? 's' : ''} saved from this song</span>
        </div>
      )}

      {/* Mode toggle */}
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        <button onClick={() => setMode('fillin')} style={{ flex:1, padding:'10px', borderRadius:10, border:'none', cursor:'pointer', fontFamily:"'Outfit',sans-serif", fontWeight:700, fontSize:13, background: mode==='fillin' ? '#0e7490' : 'var(--bar-bg)', color: mode==='fillin' ? '#fff' : 'var(--subtext)' }}>✏️ Fill in the Blank</button>
        <button onClick={() => setMode('readalong')} style={{ flex:1, padding:'10px', borderRadius:10, border:'none', cursor:'pointer', fontFamily:"'Outfit',sans-serif", fontWeight:700, fontSize:13, background: mode==='readalong' ? '#0e7490' : 'var(--bar-bg)', color: mode==='readalong' ? '#fff' : 'var(--subtext)' }}>📖 Read Along</button>
      </div>

      {/* Song selector */}
      <div style={{ display:'flex', gap:6, marginBottom:16, overflowX:'auto', scrollbarWidth:'none', WebkitOverflowScrolling:'touch' }}>
        {SONGS.map((s, i) => (
          <button key={s.id} onClick={() => { setSongIdx(i); reset(); }}
            className={'b ' + (i === songIdx ? 'bp' : 'bg')}
            style={{ fontSize:11, padding:'10px 12px', whiteSpace:'nowrap', flexShrink:0 }}>
            {s.title}
          </button>
        ))}
      </div>

      {mode === 'readalong' ? (
        /* ── Read Along mode ─────────────────────────────────────────── */
        <>
          {/* Song header */}
          <div className="c" style={{ marginBottom:16, background:'linear-gradient(135deg,#0e7490,#164e63)', color:'#fff', padding:16 }}>
            <div style={{ fontSize:18, fontWeight:900 }}>{song.title}</div>
            <div style={{ fontSize:13, opacity:.8 }}>{song.artist} · {song.level}</div>
            <div style={{ fontSize:11, opacity:.65, marginTop:4 }}>
              Tap any word to translate · Tap a line to reveal its English translation
            </div>
          </div>

          {/* Listening mode notice */}
          <div style={{
            marginBottom: 12, padding: '8px 12px', borderRadius: 10,
            background: 'var(--bar-bg)', fontSize: 12,
            color: 'var(--subtext)', fontFamily: "'Outfit',sans-serif",
            textAlign: 'center',
          }}>
            🎵 Listening mode — play the song externally and follow along
          </div>

          {/* Enhancement 2: Karaoke mode controls */}
          <div style={{
            marginBottom: 12, padding: '10px 12px', borderRadius: 12,
            background: karaokeOn ? '#f0f9ff' : 'var(--bar-bg)',
            border: karaokeOn ? '1px solid #bae6fd' : '1px solid transparent',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={() => { setKaraokeOn(k => !k); setKaraokePlaying(false); setKaraokeLineIdx(0); }}
                style={{
                  padding: '6px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 13,
                  background: karaokeOn ? '#0e7490' : '#e2e8f0',
                  color: karaokeOn ? '#fff' : '#475569',
                }}
              >
                {karaokeOn ? '🎤 Karaoke ON' : '🎤 Karaoke Mode'}
              </button>

              {karaokeOn && (
                <>
                  <button
                    onClick={() => setKaraokePlaying(p => !p)}
                    style={{
                      padding: '6px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                      fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 13,
                      background: karaokePlaying ? '#ef4444' : '#10b981', color: '#fff',
                    }}
                  >
                    {karaokePlaying ? '⏸ Pause' : '▶ Play'}
                  </button>

                  <button
                    onClick={() => setKaraokeLineIdx(0)}
                    style={{
                      padding: '6px 10px', borderRadius: 10, border: 'none', cursor: 'pointer',
                      fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 12,
                      background: '#e2e8f0', color: '#475569',
                    }}
                  >
                    ↺ Reset
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
                    <span style={{ fontSize: 11, color: 'var(--subtext)' }}>Speed:</span>
                    <button
                      onClick={() => setKaraokeSpeed(s => Math.min(6, s + 1))}
                      style={{ padding: '4px 8px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14, background: '#e2e8f0' }}
                      title="Slower"
                    >🐢</button>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#0e7490', minWidth: 24, textAlign: 'center' }}>{karaokeSpeed}s</span>
                    <button
                      onClick={() => setKaraokeSpeed(s => Math.max(2, s - 1))}
                      style={{ padding: '4px 8px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14, background: '#e2e8f0' }}
                      title="Faster"
                    >🐇</button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Lyrics — tap words to translate, tap lines to reveal translation */}
          <div ref={lyricsScrollRef} style={{ marginBottom:20 }}>
            {song.lines.map((line, li) => {
              const isCurrent = karaokeOn && li === karaokeLineIdx;
              const isPast = karaokeOn && li < karaokeLineIdx;
              const isFuture = karaokeOn && li > karaokeLineIdx;
              return (
                <div
                  key={li}
                  ref={el => { karaokeLineRefs.current[li] = el; }}
                  onClick={() => !karaokeOn && toggleLine(li)}
                  style={{
                    marginBottom: 8, padding: '10px 12px', borderRadius: 10,
                    cursor: karaokeOn ? 'default' : 'pointer',
                    background: isCurrent
                      ? 'rgba(14,116,144,0.12)'
                      : openLines[li]
                        ? '#f0f9ff'
                        : 'var(--bar-bg)',
                    border: isCurrent
                      ? '2px solid #0e7490'
                      : openLines[li]
                        ? '1px solid #bae6fd'
                        : '1px solid transparent',
                    opacity: isPast ? 0.45 : 1,
                    transform: isCurrent ? 'scale(1.01)' : 'scale(1)',
                    transition: 'background 0.3s, border 0.3s, opacity 0.3s, transform 0.2s',
                  }}
                >
                  <div style={{
                    fontSize: isCurrent ? 17 : 15,
                    lineHeight: 2.2,
                    fontFamily: "'Playfair Display',serif",
                    color: 'var(--rt-c)',
                    fontWeight: isCurrent ? 700 : 400,
                    transition: 'font-size 0.2s',
                  }}>
                    <AnnotatedLine
                      text={line.text}
                      translationCache={translationCache}
                      loadingWord={loadingWord}
                      activeWord={activeWord}
                      onWordTap={(clean) => {
                        handleWordTap(clean);
                      }}
                    />
                  </div>
                  {!karaokeOn && openLines[li] && (
                    <div style={{ fontSize:13, color:'#0e7490', fontStyle:'italic', marginTop:2, fontFamily:"'Outfit',sans-serif" }}>
                      {(LINE_TRANSLATIONS[song.id] || [])[li] || ''}
                    </div>
                  )}
                  {karaokeOn && isCurrent && (
                    <div style={{ fontSize: 12, color: '#0e7490', fontStyle: 'italic', marginTop: 2, fontFamily: "'Outfit',sans-serif" }}>
                      {(LINE_TRANSLATIONS[song.id] || [])[li] || ''}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Vocab reference */}
          <div className="c" style={{ marginBottom:16, padding:12 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#78716c', marginBottom:8 }}>Vocabulary</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {song.vocab.map(v => (
                <button key={v.hr} aria-label={`Play audio for ${v.hr} — ${v.en}`} onClick={() => speak(v.hr)} style={{
                  background:'#f0f9ff', border:'1px solid #bae6fd', borderRadius:20,
                  padding:'4px 10px', fontSize:12, cursor:'pointer', fontFamily:"'Outfit',sans-serif",
                }}>
                  <strong>{v.hr}</strong> · {v.en} <span aria-hidden="true">🔊</span>
                </button>
              ))}
            </div>
          </div>

          {/* Cultural note */}
          {song.cultural && (
            <div style={{ marginBottom:16, padding:12, borderRadius:10, background:'#fffbeb', border:'1px solid #fcd34d' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#92400e', marginBottom:4 }}>Cultural Note</div>
              <div style={{ fontSize:13, color:'#78350f', fontFamily:"'Outfit',sans-serif", lineHeight:1.6 }}>{song.cultural}</div>
            </div>
          )}

          <div style={{ display:'flex', gap:8 }}>
            <button className="b bg" style={{ flex:1 }} onClick={() => { reset(); setSongIdx(i => (i + 1) % SONGS.length); }}>Next Song →</button>
          </div>
          <button className="b bg" style={{ width:'100%', marginTop:8 }} onClick={goBack}>← Back</button>
        </>
      ) : (
        /* ── Fill-in-the-blank mode ───────────────────────────────────── */
        <>
          {/* Song header */}
          <div className="c" style={{ marginBottom:16, background:'linear-gradient(135deg,#0e7490,#164e63)', color:'#fff', padding:16 }}>
            <div style={{ fontSize:18, fontWeight:900 }}>{song.title}</div>
            <div style={{ fontSize:13, opacity:.8 }}>{song.artist} · {song.level}</div>
            <div style={{ fontSize:11, opacity:.65, marginTop:4 }}>Fill in the blank words as you listen · Tap any word to translate</div>
          </div>

          {/* Lyrics with blanks — non-blank words are tappable */}
          <div style={{ marginBottom:20 }}>
            {quiz.map((line, li) => (
              <div key={li} style={{ marginBottom:12, lineHeight:2.2, fontSize:16, fontFamily:"'Playfair Display',serif" }}>
                {line.map((token, wi) => {
                  if (!token.blank) {
                    const cleanToken = token.word.replace(/[,!.?""''«»]/g, '');
                    const isLookedUp = cleanToken && translationCache[cleanToken.toLowerCase()];
                    const isActive = activeWord && activeWord.toLowerCase() === cleanToken.toLowerCase();
                    return (
                      <span
                        key={wi}
                        onClick={() => cleanToken && handleWordTap(cleanToken)}
                        style={{
                          cursor: cleanToken ? 'pointer' : 'default',
                          borderBottom: isLookedUp ? '2px solid #0e7490' : isActive ? '2px solid #0e7490' : '2px solid transparent',
                          color: isActive ? '#0e7490' : 'inherit',
                          borderRadius: 3, padding: '0 1px',
                        }}
                      >
                        {token.word}{' '}
                      </span>
                    );
                  }
                  const key = blankKey(li, wi);
                  const ans = answers[key] || '';
                  let bg = '#f0f9ff', border = '2px solid #0e7490';
                  if (checked) {
                    const correct = ans.trim().toLowerCase() === token.word.toLowerCase();
                    bg = correct ? '#f0fdf4' : '#fef2f2';
                    border = correct ? '2px solid #10b981' : '2px solid #ef4444';
                  }
                  return (
                    <span key={wi} style={{ display:'inline-flex', alignItems:'center', gap:2 }}>
                      <input
                        type="text"
                        value={ans}
                        disabled={checked}
                        onChange={e => setAnswers(a => ({ ...a, [key]: e.target.value }))}
                        onKeyDown={e => { if (e.key === 'Enter') checkAnswers(); }}
                        placeholder="___"
                        style={{ width: Math.min(Math.max(56, token.word.length * 9), 140), background:bg, border, borderRadius:8,
                          padding:'2px 6px', fontSize:15, fontFamily:"'Playfair Display',serif",
                          textAlign:'center', outline:'none' }}
                      />
                      {checked && ans.trim().toLowerCase() !== token.word.toLowerCase() && (
                        <span style={{ fontSize:12, color:'#10b981', fontWeight:700 }}>{token.word}</span>
                      )}
                      <span>{token.punctuation} </span>
                      <button onClick={() => speak(token.word)} aria-label={`Play audio for ${token.word}`} style={{ background:'none', border:'none', cursor:'pointer', fontSize:14, padding:0 }}><span aria-hidden="true">🔊</span></button>
                    </span>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Vocab reference */}
          <div className="c" style={{ marginBottom:16, padding:12 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#78716c', marginBottom:8 }}>Vocabulary</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {song.vocab.map(v => (
                <button key={v.hr} aria-label={`Play audio for ${v.hr} — ${v.en}`} onClick={() => speak(v.hr)} style={{
                  background:'#f0f9ff', border:'1px solid #bae6fd', borderRadius:20,
                  padding:'4px 10px', fontSize:12, cursor:'pointer', fontFamily:"'Outfit',sans-serif",
                }}>
                  <strong>{v.hr}</strong> · {v.en} <span aria-hidden="true">🔊</span>
                </button>
              ))}
            </div>
          </div>

          {/* Cultural note */}
          {song.cultural && (
            <div style={{ marginBottom:16, padding:12, borderRadius:10, background:'#fffbeb', border:'1px solid #fcd34d' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#92400e', marginBottom:4 }}>Cultural Note</div>
              <div style={{ fontSize:13, color:'#78350f', fontFamily:"'Outfit',sans-serif", lineHeight:1.6 }}>{song.cultural}</div>
            </div>
          )}

          {/* Progress bar */}
          {checked && score !== null && (
            <div style={{ marginBottom:16 }}>
              <Bar v={score} mx={allBlanks.length} color="#10b981" h={8} />
              <p style={{ textAlign:'center', fontWeight:700, color:'#164e63', marginTop:8 }}>
                {score}/{allBlanks.length} correct
                {score === allBlanks.length ? ' — Perfect! Savršeno! 🌟' : score >= allBlanks.length * 0.7 ? ' — Great job! Bravo! 🎉' : ' — Keep trying!'}
              </p>
            </div>
          )}

          <div style={{ display:'flex', gap:8 }}>
            {!checked
              ? <button className="b bp" style={{ flex:1 }} onClick={checkAnswers}>Check Answers ✓</button>
              : <>
                  <button className="b bg" style={{ flex:1 }} onClick={reset}>Try Again 🔄</button>
                  <button className="b bp" style={{ flex:1 }} onClick={nextSong}>Next Song →</button>
                </>
            }
          </div>
          <button className="b bg" style={{ width:'100%', marginTop:8 }} onClick={goBack}>← Back</button>
        </>
      )}

      {/* Enhancement 1: Word translation tooltip */}
      {activeWord && (
        <WordTooltip
          word={activeWord}
          data={tooltipData}
          loading={loadingWord !== null}
          onClose={closeTooltip}
          onSave={handleSaveWord}
          alreadySaved={alreadySaved}
        />
      )}
    </div>
  );
}
