import React, { useState } from 'react';
import { H, Bar, Spk, srMark } from '../../data.jsx';

export default function McGame({ questions, onComplete, goBack, award }) {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState(-1);

  const q = questions[idx];
  if (!q) return null;

  return (
    <div className="scr-wrap">
      {H("🎯 Multiple Choice")}
      <Bar v={idx+1} mx={questions.length} h={6} color="#f59e0b" />
      <div className="c" style={{marginTop:16}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
          <Spk text={q.hr} />
          <p style={{fontSize:24,fontWeight:800,fontFamily:"'Playfair Display',serif"}}>{q.hr}</p>
        </div>
        <p style={{fontSize:14,color:"#78716c",marginBottom:16}}>What does this mean?</p>
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {answered && (q.opts[selected]===q.correct ? "Correct! " : `Incorrect. The answer is ${q.correct}. `) + `Score: ${score} of ${questions.length}.`}
        </div>
        {q.opts.map((o,i)=>(
          <button key={i} className={"ob "+(answered?(o===q.correct?"ok":selected===i?"no":""):"")}
            onClick={()=>{if(!answered){setSelected(i);setAnswered(true);const ok=o===q.correct;if(ok)setScore(s=>s+1);if(q.hr)srMark(q.hr,ok);}}}>
            {o}
          </button>
        ))}
        {answered&&<button className="b bp" style={{width:"100%",marginTop:16}} onClick={()=>{
          if(idx<questions.length-1){setIdx(i=>i+1);setAnswered(false);setSelected(-1);}
          else{award(score*3+5);onComplete(questions,score);}
        }}>{idx<questions.length-1?"Next →":"Results"}</button>}
        <p style={{textAlign:"center",color:"#78716c",marginTop:12,fontSize:13}}>Score: {score}/{questions.length}</p>
      </div>
    </div>
  );
}
