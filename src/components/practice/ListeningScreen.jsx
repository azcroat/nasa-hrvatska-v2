import React, { useState, useRef } from 'react';
import { H, Bar, speak, speakSlow, sh } from '../../data.jsx';

export default function ListeningScreen({ questions, goBack, award }) {
  const finishFired = useRef(false);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState(-1);
  const [options, setOptions] = useState(() => questions.length > 0 ? sh(questions[0].opts) : []);

  const total = questions.length;

  if (idx >= total) return (
    <div className="scr-wrap">
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:64}}>{score>=total*0.7?"🏆":"👍"}</div>
        <h2 style={{fontFamily:"'Playfair Display',serif",color:"#164e63"}}>Listening Complete!</h2>
        <div style={{fontSize:32,fontWeight:800,color:"#0e7490"}}>{score} / {total}</div>
        <div style={{fontSize:24,fontWeight:900,color:"#d97706",margin:"8px 0 16px"}}>+{score*4+10} XP</div>
        <button className="b bp" style={{marginTop:0}} onClick={()=>{if(finishFired.current)return;finishFired.current=true;award(score*4+10);goBack();}}>Finish!</button>
      </div>
    </div>
  );

  const q = questions[idx];
  if (!q) return null;
  const correct = q.en;

  return (
    <div className="scr-wrap">
      {H("🎧 Listening Comprehension","Listen, then pick what you heard")}
      <Bar v={idx+1} mx={total} h={6} />
      <div className="c" style={{marginTop:16,textAlign:"center"}}>
        <div style={{fontSize:14,color:"#78716c",marginBottom:12}}>Listen carefully, then choose what the sentence means:</div>
        <button aria-label="Play sentence audio" className="b bp" style={{fontSize:16,padding:"14px 32px"}} onClick={()=>speak(q.hr)}>🔊 Play Sentence</button>
        <button aria-label="Play sentence slowly" className="b bg" style={{fontSize:13,marginLeft:8,padding:"14px 16px"}} onClick={()=>speakSlow(q.hr)}>🐢 Slow</button>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:16}}>
        {options.map((o,oi)=>(
          <button key={oi} className={"ob "+(answered?(o===correct?"ok":selected===oi?"no":""):"")}
            onClick={()=>{if(!answered){setSelected(oi);setAnswered(true);if(o===correct)setScore(s=>s+1);}}}>
            {o}
          </button>
        ))}
      </div>
      {answered&&<button className="b bp" style={{width:"100%",marginTop:16}} onClick={()=>{
        if(idx<total-1){const n=questions[idx+1];setOptions(sh(n.opts));setIdx(i=>i+1);setAnswered(false);setSelected(-1);}
        else setIdx(total);
      }}>{idx<total-1?"Next →":"See Results"}</button>}
    </div>
  );
}
