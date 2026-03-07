import React, { useState, useEffect, useCallback, useRef } from 'react';
import { V } from '../../data.jsx';

const ROUND_TIME = 30; // seconds per round
const QUESTIONS_PER_ROUND = 15;

function buildPool(cats, sh) {
  const all = cats.flatMap(c => (V[c] || []).map(w => ({ hr: w[0], en: w[1], cat: c })));
  return sh(all);
}

function makeQuestion(word, allWords, sh) {
  const wrong = sh(allWords.filter(w => w.en !== word.en)).slice(0, 3);
  if (wrong.length < 3) return null;
  const dir = Math.random() < 0.5;
  if (dir) {
    return { prompt: word.hr, answer: word.en, opts: sh([word.en, wrong[0].en, wrong[1].en, wrong[2].en]), word };
  } else {
    return { prompt: word.en, answer: word.hr, opts: sh([word.hr, wrong[0].hr, wrong[1].hr, wrong[2].hr]), word };
  }
}

export default function WordSprint({ sh, allCats, award, goBack }) {
  const [phase, setPhase] = useState('menu'); // menu | playing | result
  const [selectedCats, setSelectedCats] = useState(['greetings', 'food', 'animals']);
  const [questions, setQuestions] = useState([]);
  const [qi, setQi] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [chosen, setChosen] = useState(null);
  const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong'
  const [results, setResults] = useState([]);
  const timerRef = useRef(null);
  const feedbackRef = useRef(null);

  const catList = Object.keys(V);

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
    setQi(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setTimeLeft(ROUND_TIME);
    setChosen(null);
    setFeedback(null);
    setResults([]);
    setPhase('playing');
  }, [selectedCats, sh, catList]);

  // Timer
  useEffect(() => {
    if (phase !== 'playing') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setPhase('result');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  // Advance after feedback
  useEffect(() => {
    if (feedback === null) return;
    feedbackRef.current = setTimeout(() => {
      setChosen(null);
      setFeedback(null);
      if (qi + 1 >= questions.length) {
        clearInterval(timerRef.current);
        setPhase('result');
      } else {
        setQi(q => q + 1);
      }
    }, 600);
    return () => clearTimeout(feedbackRef.current);
  }, [feedback, qi, questions.length]);

  function answer(opt) {
    if (chosen !== null || phase !== 'playing') return;
    const q = questions[qi];
    setChosen(opt);
    const correct = opt === q.answer;
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

  // Award XP on finish
  useEffect(() => {
    if (phase === 'result' && score > 0) {
      award(Math.min(score * 2, 50));
    }
  }, [phase]); // eslint-disable-line

  const toggleCat = (c) => {
    setSelectedCats(prev =>
      prev.includes(c) ? (prev.length > 1 ? prev.filter(x => x !== c) : prev) : [...prev, c]
    );
  };

  const catIcons = {greetings:"👋",numbers:"🔢",family:"👨‍👩‍👧‍👦",food:"🍕",animals:"🐾","body & face":"🦴",colors:"🎨","home & rooms":"🏠",clothing:"👔","weather & seasons":"☀️",places:"📍",transport:"🚗",verbs:"💬",adjectives:"📏","time & calendar":"📅",months:"🗓️",directions:"🧭",emotions:"💭",professions:"💼",restaurant:"🍽️",shopping:"🛍️",travel:"✈️",health:"🏥",questions:"❓",conjunctions:"🔗",culture:"🏛️","daily routine":"🌅","in the classroom":"📖",hobbies:"🎯",zagreb:"🏙️",opposites:"🔄",comparatives:"📊",fruits:"🍎",vegetables:"🥦",sports:"⚽",holidays:"🎄",personality:"😊","fairy tales":"📜","commands at home":"🏡"};
  const icon = c => catIcons[c] || '📝';

  const timerPct = (timeLeft / ROUND_TIME) * 100;
  const timerColor = timeLeft > 15 ? '#16a34a' : timeLeft > 8 ? '#b45309' : '#dc2626';

  if (phase === 'menu') return (
    <div className="scr-wrap">
      <button className="b bg" style={{marginBottom:16,fontSize:13}} onClick={goBack}>← Back</button>
      <div style={{textAlign:'center',marginBottom:24}}>
        <div style={{fontSize:48,marginBottom:8}}>⚡</div>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,color:'#164e63',fontWeight:800}}>Word Sprint</h2>
        <p style={{color:'#78716c',fontSize:14,marginTop:4}}>Race the clock — 30 seconds, 15 words. Streaks earn bonus points!</p>
      </div>
      <div className="c" style={{marginBottom:20,padding:20}}>
        <div style={{fontSize:13,fontWeight:800,color:'#0e7490',marginBottom:12}}>CHOOSE CATEGORIES ({selectedCats.length} selected)</div>
        <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
          {catList.map(c => (
            <button key={c} onClick={() => toggleCat(c)}
              style={{padding:'6px 12px',borderRadius:20,border:'2px solid',borderColor:selectedCats.includes(c)?'#0e7490':'#e7e5e4',background:selectedCats.includes(c)?'rgba(14,116,144,.1)':'white',fontSize:12,fontWeight:700,cursor:'pointer',color:selectedCats.includes(c)?'#0e7490':'#78716c',transition:'all .2s'}}>
              {icon(c)} {c}
            </button>
          ))}
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:20}}>
        {[{i:'⏱️',l:'30 sec',d:'Per round'},{i:'⚡',l:'Streaks',d:'+2/+3 pts'},{i:'🎯',l:'15 words',d:'Per game'}].map((s,i)=>(
          <div key={i} className="c" style={{textAlign:'center',padding:'12px 8px'}}>
            <div style={{fontSize:24}}>{s.i}</div>
            <div style={{fontSize:13,fontWeight:800,color:'#164e63'}}>{s.l}</div>
            <div style={{fontSize:11,color:'#78716c'}}>{s.d}</div>
          </div>
        ))}
      </div>
      <button className="b bp" style={{width:'100%',fontSize:16,padding:'16px'}} onClick={startGame}>Start Sprint ⚡</button>
    </div>
  );

  if (phase === 'playing') {
    const q = questions[qi];
    if (!q) return null;
    return (
      <div className="scr-wrap">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div style={{fontSize:13,fontWeight:700,color:'#78716c'}}>{qi+1} / {questions.length}</div>
          <div style={{fontSize:20,fontWeight:900,color:timerColor,fontVariantNumeric:'tabular-nums',minWidth:40,textAlign:'center'}}>{timeLeft}s</div>
          <div style={{fontSize:13,fontWeight:700,color:'#0e7490'}}>⭐ {score} pts</div>
        </div>
        {/* Timer bar */}
        <div style={{height:6,borderRadius:3,background:'#e7e5e4',marginBottom:20,overflow:'hidden'}}>
          <div style={{height:'100%',width:timerPct+'%',background:timerColor,borderRadius:3,transition:'width 1s linear'}} />
        </div>
        {streak >= 3 && (
          <div style={{textAlign:'center',fontSize:13,fontWeight:800,color:'#b45309',marginBottom:12,animation:'rise .3s'}}>
            🔥 {streak} streak! +{streak>=5?3:2} pts per answer
          </div>
        )}
        <div className="c" style={{textAlign:'center',padding:'28px 20px',marginBottom:20,borderLeft:'4px solid #0e7490',background:'linear-gradient(135deg,rgba(14,116,144,.04),rgba(14,116,144,.08))'}}>
          <div style={{fontSize:13,color:'#78716c',fontWeight:600,marginBottom:8,textTransform:'uppercase',letterSpacing:1}}>
            {q.prompt === q.word.hr ? 'What does this mean?' : 'How do you say this in Croatian?'}
          </div>
          <div style={{fontSize:32,fontWeight:900,color:'#164e63',fontFamily:"'Playfair Display',serif"}}>{q.prompt}</div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          {q.opts.map((opt,oi) => {
            let bg = 'white', border = '#d6d3d1', color = '#1c1917';
            if (chosen !== null) {
              if (opt === q.answer) { bg = '#dcfce7'; border = '#16a34a'; color = '#166534'; }
              else if (opt === chosen) { bg = '#fee2e2'; border = '#dc2626'; color = '#991b1b'; }
            }
            return (
              <button key={oi} onClick={() => answer(opt)}
                style={{padding:'14px 12px',border:'2px solid '+border,borderRadius:14,background:bg,fontSize:14,fontWeight:700,cursor:chosen?'default':'pointer',color,transition:'all .15s',textAlign:'center',minHeight:56}}>
                {opt}
              </button>
            );
          })}
        </div>
        {feedback === 'correct' && <div style={{textAlign:'center',marginTop:12,fontSize:16,fontWeight:800,color:'#16a34a',animation:'rise .2s'}}>✓ Correct! {streak>=5?'+3':streak>=3?'+2':'+1'} pt{streak>=3&&'s'}</div>}
        {feedback === 'wrong' && <div style={{textAlign:'center',marginTop:12,fontSize:14,fontWeight:700,color:'#dc2626',animation:'rise .2s'}}>✗ {q.answer}</div>}
      </div>
    );
  }

  // Result screen
  const correct = results.filter(r => r.correct).length;
  const pct = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
  const grade = pct >= 90 ? {e:'🏆',l:'Excellent!',c:'#16a34a'} : pct >= 70 ? {e:'⭐',l:'Great job!',c:'#0e7490'} : pct >= 50 ? {e:'👍',l:'Good effort!',c:'#b45309'} : {e:'💪',l:'Keep practicing!',c:'#dc2626'};
  return (
    <div className="scr-wrap">
      <div style={{textAlign:'center',marginBottom:24}}>
        <div style={{fontSize:56,marginBottom:8}}>{grade.e}</div>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,color:'#164e63',fontWeight:800}}>{grade.l}</h2>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:20}}>
        {[{v:score,l:'Points',i:'⭐'},{v:correct+'/'+questions.length,l:'Correct',i:'✓'},{v:bestStreak,l:'Best Streak',i:'🔥'}].map((s,i)=>(
          <div key={i} className="c" style={{textAlign:'center',padding:'16px 8px'}}>
            <div style={{fontSize:24}}>{s.i}</div>
            <div style={{fontSize:22,fontWeight:900,color:'#164e63'}}>{s.v}</div>
            <div style={{fontSize:11,color:'#78716c'}}>{s.l}</div>
          </div>
        ))}
      </div>
      {results.filter(r=>!r.correct).length > 0 && (
        <div className="c" style={{marginBottom:20,padding:16}}>
          <div style={{fontSize:13,fontWeight:800,color:'#b45309',marginBottom:10}}>REVIEW MISSED WORDS</div>
          {results.filter(r=>!r.correct).map((r,i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #f3f4f6',fontSize:13}}>
              <span style={{fontWeight:700,color:'#164e63'}}>{r.q.word.hr}</span>
              <span style={{color:'#78716c'}}>→</span>
              <span style={{color:'#16a34a',fontWeight:600}}>{r.q.word.en}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{display:'flex',gap:10}}>
        <button className="b bp" style={{flex:1,padding:'14px'}} onClick={startGame}>Play Again ⚡</button>
        <button className="b bg" style={{flex:1,padding:'14px'}} onClick={goBack}>Back</button>
      </div>
    </div>
  );
}
