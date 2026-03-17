import React, { useState, useMemo } from 'react';
import { H, Bar, Spk, srMark, getDueReviews, getSR } from '../../data.jsx';

export default function ReviewScreen({ goBack, award, allCats, V }) {
  const pool = useMemo(() => allCats.flatMap(t => V[t]), [allCats]);

  const dueWords = useMemo(() => {
    const due = getDueReviews();
    return due.map(w => pool.find(x => x[0] === w)).filter(Boolean);
  }, [pool]);

  const [idx, setIdx] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState(-1);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const questions = useMemo(() => {
    if (dueWords.length === 0) return [];
    return dueWords.slice(0, 20).map(w => {
      const wrong = pool.filter(x => x[1] !== w[1]);
      const distractors = wrong.sort(() => Math.random() - 0.5).slice(0, 3).map(x => x[1]);
      const opts = [w[1], ...distractors].sort(() => Math.random() - 0.5);
      return { word: w, opts, correct: w[1] };
    });
  }, [dueWords, pool]);

  if (dueWords.length === 0) {
    return (
      <div className="scr-wrap">
        {H("🔁 Review Due")}
        <div style={{textAlign:"center",paddingTop:40}}>
          <div style={{fontSize:64}}>✅</div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:24,color:"#164e63",marginTop:12}}>All caught up!</h2>
          <p style={{color:"#78716c",marginTop:8,lineHeight:1.6}}>
            No reviews due right now.<br/>
            Words you've practiced will appear here when it's time to review them.
          </p>
          <div style={{background:"#f0fdf4",border:"1.5px solid #bbf7d0",borderRadius:14,padding:"16px",marginTop:24,textAlign:"left"}}>
            <p style={{fontWeight:700,fontSize:13,color:"#166534",marginBottom:6}}>💡 How spaced repetition works:</p>
            <p style={{fontSize:13,color:"#374151",lineHeight:1.6}}>
              Words you practice are scheduled for review at increasing intervals: 1 day → 3 days → 7 days → 14 days → 30 days. Come back tomorrow to review today's words!
            </p>
          </div>
          <button className="b bp" style={{marginTop:24}} onClick={goBack}>Go Back</button>
        </div>
      </div>
    );
  }

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="scr-wrap">
        {H("🔁 Review Due")}
        <div style={{textAlign:"center",paddingTop:32}}>
          <div style={{fontSize:64}}>{pct>=80?"🌟":"🎉"}</div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:28,color:"#164e63",marginTop:8}}>Review Complete!</h2>
          <p style={{color:"#78716c",marginTop:8}}>{score}/{questions.length} correct</p>
          <p style={{fontSize:13,color:"#64748b",marginTop:8}}>Your spaced repetition intervals have been updated</p>
          <button className="b bp" style={{marginTop:24}} onClick={()=>{award(score*5+5);goBack();}}>Continue</button>
        </div>
      </div>
    );
  }

  const q = questions[idx];
  if (!q) return null;

  return (
    <div className="scr-wrap">
      {H("🔁 Review Due")}
      <p style={{fontSize:12,color:"#78716c",marginBottom:8,fontWeight:500}}>{dueWords.length} words due for review</p>
      <Bar v={idx+1} mx={questions.length} color="#7c3aed" h={6} />
      <div className="c" style={{marginTop:16,padding:"20px"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
          <Spk text={q.word[0]} />
          <p style={{fontSize:28,fontWeight:800,fontFamily:"'Playfair Display',serif",margin:0}}>{q.word[0]}</p>
        </div>
        <p style={{fontSize:13,color:"#78716c",marginBottom:16}}>What does this mean?</p>
        {q.opts.map((opt, i) => {
          let cls = "ob";
          if (answered) {
            if (opt === q.correct) cls += " ok";
            else if (i === selected) cls += " no";
          }
          return (
            <button key={i} className={cls} onClick={() => {
              if (answered) return;
              setSelected(i);
              setAnswered(true);
              const ok = opt === q.correct;
              if (ok) setScore(s => s + 1);
              srMark(q.word[0], ok);
            }}>
              {opt}
            </button>
          );
        })}
        {answered && (
          <button className="b bp" style={{width:"100%",marginTop:16}} onClick={() => {
            if (idx < questions.length - 1) {
              setIdx(i => i + 1);
              setAnswered(false);
              setSelected(-1);
            } else {
              setDone(true);
            }
          }}>
            {idx < questions.length - 1 ? "Next →" : "Results"}
          </button>
        )}
      </div>
    </div>
  );
}
