import React, { useState, useMemo, useCallback } from 'react';
import { H, Bar, speak } from '../../data.jsx';

// ── Croatian song lyrics fill-in-the-blank ──────────────────────────────────
// Classic and popular Croatian songs. Each line has "blanks" that the learner fills in.
const SONGS = [
  {
    id: 'lijepa_li_si',
    title: 'Lijepa li si',
    artist: 'Thompson',
    level: 'A2',
    lines: [
      { text: 'Lijepa li si, domovino moja', blanks: ['Lijepa', 'domovino'] },
      { text: 'Što te ljubi srce i duša moja', blanks: ['ljubi', 'duša'] },
      { text: 'Lijepa li si u proljeće i ljetu', blanks: ['proljeće', 'ljetu'] },
      { text: 'I u jesen, zimi, svuda po svijetu', blanks: ['jesen', 'zimi'] },
    ],
    vocab: [
      { hr: 'lijepa', en: 'beautiful' }, { hr: 'domovina', en: 'homeland' },
      { hr: 'srce', en: 'heart' }, { hr: 'duša', en: 'soul' },
      { hr: 'proljeće', en: 'spring' }, { hr: 'ljeto', en: 'summer' },
      { hr: 'jesen', en: 'autumn' }, { hr: 'zima', en: 'winter' },
    ],
  },
  {
    id: 'moja_hrvatska',
    title: 'Moja Hrvatska',
    artist: 'Narodna',
    level: 'A1',
    lines: [
      { text: 'Hrvatska je zemlja moja', blanks: ['Hrvatska', 'zemlja'] },
      { text: 'Tu sam rođen, tu je grob moj', blanks: ['rođen', 'grob'] },
      { text: 'Volim more, volim gore', blanks: ['more', 'gore'] },
      { text: 'Sve je to Hrvatska moja', blanks: ['Hrvatska'] },
    ],
    vocab: [
      { hr: 'zemlja', en: 'land / country' }, { hr: 'rođen', en: 'born' },
      { hr: 'grob', en: 'grave' }, { hr: 'more', en: 'sea' },
      { hr: 'gora', en: 'mountain' }, { hr: 'volim', en: 'I love' },
    ],
  },
  {
    id: 'dalmatinska',
    title: 'Dalmacijo, Dalmacijo',
    artist: 'Klapa Šufit',
    level: 'B1',
    lines: [
      { text: 'Dalmacijo, Dalmacijo', blanks: ['Dalmacijo'] },
      { text: 'Zemlja sunca i mora', blanks: ['sunca', 'mora'] },
      { text: 'Gdje cvjeta moja ljubav', blanks: ['cvjeta', 'ljubav'] },
      { text: 'I pjeva moja pjesma', blanks: ['pjeva', 'pjesma'] },
    ],
    vocab: [
      { hr: 'sunce', en: 'sun' }, { hr: 'more', en: 'sea' },
      { hr: 'cvjetati', en: 'to bloom' }, { hr: 'ljubav', en: 'love' },
      { hr: 'pjevati', en: 'to sing' }, { hr: 'pjesma', en: 'song' },
    ],
  },
  {
    id: 'zagreb_grad',
    title: 'Zagreb, grad moj',
    artist: 'Klapa Intrade',
    level: 'A2',
    lines: [
      { text: 'Zagreb, grad moj dragi', blanks: ['grad', 'dragi'] },
      { text: 'U tebi sam odrastao', blanks: ['odrastao'] },
      { text: 'Tvoje ulice i parkovi', blanks: ['ulice', 'parkovi'] },
      { text: 'U srcu su mi ostali', blanks: ['srcu', 'ostali'] },
    ],
    vocab: [
      { hr: 'grad', en: 'city' }, { hr: 'dragi', en: 'dear' },
      { hr: 'odrastao', en: 'grew up' }, { hr: 'ulica', en: 'street' },
      { hr: 'park', en: 'park' }, { hr: 'srce', en: 'heart' },
    ],
  },
];

function buildQuiz(song) {
  const allBlanks = song.lines.flatMap(l => l.blanks);
  return song.lines.map(line => {
    const words = line.text.split(' ');
    return words.map(word => {
      const clean = word.replace(/[,!.?]/g, '');
      if (line.blanks.includes(clean)) return { word: clean, blank: true, punctuation: word.slice(clean.length) };
      return { word, blank: false };
    });
  });
}

export default function LyricsScreen({ goBack, award }) {
  const [songIdx, setSongIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(null);

  const song = SONGS[songIdx];
  const quiz = useMemo(() => buildQuiz(song), [song]);
  const allBlanks = useMemo(() => song.lines.flatMap(l => l.blanks), [song]);

  const blankKey = useCallback((lineIdx, wordIdx) => `${lineIdx}-${wordIdx}`, []);

  function checkAnswers() {
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
  }

  function nextSong() {
    setSongIdx(i => (i + 1) % SONGS.length);
    reset();
  }

  return (
    <div className="scr-wrap">
      {H('🎵 Song Lyrics', 'Fill in the missing words')}

      {/* Song selector */}
      <div style={{ display:'flex', gap:6, marginBottom:16, overflowX:'auto' }}>
        {SONGS.map((s, i) => (
          <button key={s.id} onClick={() => { setSongIdx(i); reset(); }}
            className={'b ' + (i === songIdx ? 'bp' : 'bg')}
            style={{ fontSize:11, padding:'6px 12px', whiteSpace:'nowrap', flexShrink:0 }}>
            {s.title}
          </button>
        ))}
      </div>

      {/* Song header */}
      <div className="c" style={{ marginBottom:16, background:'linear-gradient(135deg,#0e7490,#164e63)', color:'#fff', padding:16 }}>
        <div style={{ fontSize:18, fontWeight:900 }}>{song.title}</div>
        <div style={{ fontSize:13, opacity:.8 }}>{song.artist} · {song.level}</div>
        <div style={{ fontSize:11, opacity:.65, marginTop:4 }}>Fill in the blank words as you listen</div>
      </div>

      {/* Lyrics with blanks */}
      <div style={{ marginBottom:20 }}>
        {quiz.map((line, li) => (
          <div key={li} style={{ marginBottom:12, lineHeight:2.2, fontSize:16, fontFamily:"'Playfair Display',serif" }}>
            {line.map((token, wi) => {
              if (!token.blank) return <span key={wi}>{token.word} </span>;
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
                    style={{ width: Math.max(60, token.word.length * 11), background:bg, border, borderRadius:8,
                      padding:'2px 6px', fontSize:15, fontFamily:"'Playfair Display',serif",
                      textAlign:'center', outline:'none' }}
                  />
                  {checked && ans.trim().toLowerCase() !== token.word.toLowerCase() && (
                    <span style={{ fontSize:12, color:'#10b981', fontWeight:700 }}>{token.word}</span>
                  )}
                  <span>{token.punctuation} </span>
                  <button onClick={() => speak(token.word, 'hr')} style={{ background:'none', border:'none', cursor:'pointer', fontSize:14, padding:0 }}>🔊</button>
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
            <button key={v.hr} onClick={() => speak(v.hr)} style={{
              background:'#f0f9ff', border:'1px solid #bae6fd', borderRadius:20,
              padding:'4px 10px', fontSize:12, cursor:'pointer', fontFamily:"'Outfit',sans-serif",
            }}>
              <strong>{v.hr}</strong> · {v.en} 🔊
            </button>
          ))}
        </div>
      </div>

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
    </div>
  );
}
