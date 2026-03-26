import React, { useState, useEffect, useCallback, useRef } from 'react';
import { H, Bar, V, srMark } from '../../data.jsx';
import { rnd } from '../../lib/random.js';

const ROUND_TIME = 30;
const QUESTIONS_PER_ROUND = 15;

function buildPool(cats, sh) {
  const all = cats.flatMap(c => (V[c] || []).map(w => ({ hr: w[0], en: w[1], cat: c })));
  return sh(all);
}

function makeQuestion(word, allWords, sh) {
  const wrong = sh(allWords.filter(w => w.en !== word.en)).slice(0, 3);
  if (wrong.length < 3) return null;
  const dir = rnd() < 0.5;
  if (dir) {
    return { prompt: word.hr, answer: word.en, opts: sh([word.en, wrong[0].en, wrong[1].en, wrong[2].en]), word };
  } else {
    return { prompt: word.en, answer: word.hr, opts: sh([word.hr, wrong[0].hr, wrong[1].hr, wrong[2].hr]), word };
  }
}

const catIcons = {
  greetings:"👋",numbers:"🔢",family:"👨‍👩‍👧‍👦",food:"🍕",animals:"🐾","body & face":"🦴",
  colors:"🎨","home & rooms":"🏠",clothing:"👔","weather & seasons":"☀️",places:"📍",
  transport:"🚗",verbs:"💬",adjectives:"📏","time & calendar":"📅",months:"🗓️",
  directions:"🧭",emotions:"💭",professions:"💼",restaurant:"🍽️",shopping:"🛍️",
  travel:"✈️",health:"🏥",questions:"❓",conjunctions:"🔗",culture:"🏛️",
  "daily routine":"🌅","in the classroom":"📖",hobbies:"🎯",zagreb:"🏙️",
  opposites:"🔄",comparatives:"📊",fruits:"🍎",vegetables:"🥦",sports:"⚽",
  holidays:"🎄",personality:"😊","fairy tales":"📜","commands at home":"🏡"
};

export default function WordSprint({ sh, award, goBack }) {
  const catList = Object.keys(V);
  const [phase, setPhase] = useState('menu');
  const [selectedCats, setSelectedCats] = useState(['greetings', 'food', 'animals']);
  const [questions, setQuestions] = useState([]);
  const [qi, setQi] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [chosen, setChosen] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [results, setResults] = useState([]);
  const timerRef = useRef(null);
  const feedbackRef = useRef(null);
  const pausedRef = useRef(false);

  const startGame = useCallback(() => {
    const cats = selectedCats.length > 0 ? selectedCats : catList.slice(0, 5);
    const pool = buildPool(cats, sh);
    if (pool.length < 4) return;
    const qs = [];
    const shuffled = sh(pool);
    for (let i = 0; i < QUESTIONS_PER_ROUND && i < shuffled.length; i++) {
      const q = makeQuestion(shuffled[i], pool, sh);
      if (q) qs.push(q);
    }
    setQuestions(qs);
    setQi(0); setScore(0); setStreak(0); setBestStreak(0);
    setTimeLeft(ROUND_TIME); setChosen(null); setFeedback(null); setResults([]);
    setPhase('playing');
  }, [selectedCats, sh, catList]);

  useEffect(() => {
    if (phase !== 'playing') return undefined;
    timerRef.current = setInterval(() => {
      if (pausedRef.current) return; // paused during answer feedback
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); setPhase('result'); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  useEffect(() => {
    if (feedback === null) return undefined;
    feedbackRef.current = setTimeout(() => {
      pausedRef.current = false; // resume timer
      setChosen(null); setFeedback(null);
      if (qi + 1 >= questions.length) {
        clearInterval(timerRef.current); setPhase('result');
      } else {
        setQi(q => q + 1);
      }
    }, 600);
    return () => clearTimeout(feedbackRef.current);
  }, [feedback, qi, questions.length]);

  function answer(opt) {
    if (chosen !== null || phase !== 'playing') return;
    const q = questions[qi];
    pausedRef.current = true; // pause timer during feedback
    setChosen(opt);
    const correct = opt === q.answer;
    if (q && q.word) {
      const word = q.word.hr || '';
      if (word) srMark(word, correct);
    }
    setFeedback(correct ? 'correct' : 'wrong');
    setResults(r => [...r, { q, chosen: opt, correct }]);
    if (correct) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setBestStreak(b => Math.max(b, newStreak));
      const pts = newStreak >= 5 ? 3 : newStreak >= 3 ? 2 : 1;
      setScore(s => s + pts);
      if (newStreak % 5 === 0) award(15);
    } else {
      setStreak(0);
    }
  }

  useEffect(() => {
    if (phase === 'result' && score > 0) award(Math.min(score * 2, 50));
  }, [phase]); // eslint-disable-line

  const toggleCat = (c) =>
    setSelectedCats(prev =>
      prev.includes(c) ? (prev.length > 1 ? prev.filter(x => x !== c) : prev) : [...prev, c]
    );

  const timerColor = timeLeft > 15 ? '#16a34a' : timeLeft > 8 ? '#b45309' : '#dc2626';

  // ── MENU ──
  if (phase === 'menu') return (
    <div className="scr-wrap">
      {H("⚡ Word Sprint", "Race the clock — 30 seconds, 15 words. Streaks earn bonus points!")}

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:20}}>
        {[{i:'⏱️',l:'30 sec',d:'Per round'},{i:'🔥',l:'Streaks',d:'+2/+3 pts'},{i:'🎯',l:'15 words',d:'Per game'}].map((s,i)=>(
          <div key={i} className="c" style={{textAlign:'center',padding:'12px 8px'}}>
            <div style={{fontSize:24}}>{s.i}</div>
            <div style={{fontSize:13,fontWeight:800,color:'var(--heading)'}}>{s.l}</div>
            <div style={{fontSize:11,color:'var(--subtext)'}}>{s.d}</div>
          </div>
        ))}
      </div>

      <div className="c" style={{marginBottom:20}}>
        <div className="sh" style={{marginTop:0}}>Choose Categories ({selectedCats.length} selected)</div>
        <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:10}}>
          {catList.map(c => (
            <button key={c} onClick={() => toggleCat(c)}
              style={{padding:'6px 12px',borderRadius:20,border:'2px solid',
                borderColor:selectedCats.includes(c)?'#0e7490':'#e7e5e4',
                background:selectedCats.includes(c)?'rgba(14,116,144,.1)':'transparent',
                fontSize:12,fontWeight:700,cursor:'pointer',
                color:selectedCats.includes(c)?'#0e7490':'var(--subtext)',
                fontFamily:"'Outfit',sans-serif",transition:'all .15s'}}>
              {catIcons[c]||'📝'} {c}
            </button>
          ))}
        </div>
      </div>

      <button className="b bp" style={{width:'100%'}} onClick={startGame}>Start Sprint ⚡</button>
      <button className="b bg" style={{width:'100%',marginTop:10}} onClick={goBack}>← Back</button>
    </div>
  );

  // ── PLAYING ──
  if (phase === 'playing') {
    const q = questions[qi];
    if (!q) return null;
    return (
      <div className="scr-wrap">
        {H("⚡ Word Sprint", null)}

        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
          <div style={{fontSize:13,fontWeight:700,color:'var(--subtext)'}}>{qi+1} / {questions.length}</div>
          <div style={{fontSize:22,fontWeight:900,color:timerColor,fontVariantNumeric:'tabular-nums',minWidth:36,textAlign:'center'}}>{timeLeft}s</div>
          <div style={{fontSize:13,fontWeight:700,color:'#0e7490'}}>⭐ {score} pts</div>
        </div>

        <Bar v={timeLeft} mx={ROUND_TIME} color={timerColor} h={6} />

        {streak >= 3 && (
          <div className="c" style={{marginTop:12,textAlign:'center',padding:'8px 12px',borderLeft:'4px solid #b45309',background:'rgba(180,83,9,.06)'}}>
            <span style={{fontSize:13,fontWeight:800,color:'#b45309'}}>🔥 {streak} streak! +{streak>=5?3:2} pts per answer</span>
          </div>
        )}

        <div className="c" style={{marginTop:12,textAlign:'center',padding:'24px 20px',borderLeft:'4px solid #0e7490'}}>
          <div style={{fontSize:12,color:'var(--subtext)',fontWeight:600,marginBottom:8,textTransform:'uppercase',letterSpacing:1}}>
            {q.prompt === q.word.hr ? 'What does this mean?' : 'How do you say this in Croatian?'}
          </div>
          <div style={{fontSize:30,fontWeight:900,color:'var(--heading)',fontFamily:"'Playfair Display',serif"}}>{q.prompt}</div>
        </div>

        <div style={{marginTop:16}}>
          {q.opts.map((opt, oi) => (
            <button key={oi}
              className={"ob " + (chosen !== null ? (opt === q.answer ? "ok" : opt === chosen ? "no" : "") : "")}
              onClick={() => answer(opt)}>
              {opt}
            </button>
          ))}
        </div>

        {feedback === 'correct' && (
          <div className="c" style={{marginTop:4,textAlign:'center',padding:'8px',background:'#f0fdf4',borderLeft:'4px solid #16a34a'}}>
            <span style={{fontSize:14,fontWeight:800,color:'#16a34a'}}>✓ Correct! +{streak>=5?3:streak>=3?2:1} pt{streak>=3?'s':''}</span>
          </div>
        )}
        {feedback === 'wrong' && (
          <div className="c" style={{marginTop:4,textAlign:'center',padding:'8px',background:'#fef2f2',borderLeft:'4px solid #dc2626'}}>
            <span style={{fontSize:14,fontWeight:700,color:'#dc2626'}}>✗ Answer: {q.answer}</span>
          </div>
        )}
      </div>
    );
  }

  // ── RESULT ──
  const correct = results.filter(r => r.correct).length;
  const pct = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
  const grade = pct >= 90 ? {e:'🏆',l:'Excellent!'} : pct >= 70 ? {e:'⭐',l:'Great job!'} : pct >= 50 ? {e:'👍',l:'Good effort!'} : {e:'💪',l:'Keep practicing!'};

  return (
    <div className="scr-wrap">
      <div style={{textAlign:'center',marginBottom:24}}>
        <div style={{fontSize:64}}>{grade.e}</div>
        <h2 style={{fontFamily:"'Playfair Display',serif",color:'var(--heading)',fontWeight:800}}>{grade.l}</h2>
        <div style={{fontSize:32,fontWeight:800,color:'#0e7490'}}>{score} pts</div>
        <div style={{fontSize:14,color:'var(--subtext)',marginTop:4}}>{correct} / {questions.length} correct · Best streak: {bestStreak} 🔥</div>
      </div>

      {results.filter(r=>!r.correct).length > 0 && (
        <div className="c" style={{marginBottom:20}}>
          <div className="sh" style={{marginTop:0}}>Review Missed Words</div>
          {results.filter(r=>!r.correct).map((r,i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid rgba(0,0,0,.06)',fontSize:13}}>
              <span style={{fontWeight:700,color:'var(--heading)'}}>{r.q.word.hr}</span>
              <span style={{color:'var(--subtext)'}}>→</span>
              <span style={{color:'#16a34a',fontWeight:600}}>{r.q.word.en}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{display:'flex',gap:10}}>
        <button className="b bp" style={{flex:1}} onClick={startGame}>🔄 Play Again</button>
        <button className="b bg" style={{flex:1}} onClick={() => setPhase('menu')}>📋 Menu</button>
        <button className="b bg" style={{flex:1}} onClick={goBack}>🏠 Done</button>
      </div>
    </div>
  );
}
