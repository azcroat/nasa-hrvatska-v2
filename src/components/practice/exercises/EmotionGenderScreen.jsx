import React, { useRef, useState } from 'react';
import { H, speak, sh } from '../../../data.jsx';
import { EMOGENDER } from '../../../data.jsx';
import { markQuest } from '../../../lib/quests.js';

function EmotionGenderScreen({ goBack, award }) {
  const total = EMOGENDER.reduce(function(sum, eg){ return sum + eg.pairs.length; }, 0);
  const answeredRef = useRef(0);
  const correctRef = useRef(0);
  const [done, setDone] = useState(false);

  function handleAnswer(e, isCorrect, spoken) {
    e.target.style.background = isCorrect ? "#dcfce7" : "#fee2e2";
    e.target.style.borderColor = isCorrect ? "#16a34a" : "#dc2626";
    if (isCorrect) { award(2); speak(spoken); }
    if (e.target.closest && e.target.closest("div")) e.target.closest("div").style.pointerEvents = "none";
    if (isCorrect) correctRef.current++;
    answeredRef.current++;
    if (answeredRef.current >= total && !done) {
      markQuest('grammar');
      setDone(true);
    }
  }

  return (
    <div className="scr-wrap">
      {H("😀 How Are You Feeling?","Pick the right gender form for emotions",goBack)}
      <div className="c" style={{marginBottom:12,padding:"10px 14px",background:"rgba(14,116,144,.06)",fontSize:12}}>💡 Croatian adjectives change based on gender. 👨 = masculine ending, 👩 = feminine ending. Tap the correct form!</div>
      {EMOGENDER.map(function(eg,ei){return (
        <div key={ei} className="c" style={{marginBottom:16}}>
          <div style={{fontSize:16,fontWeight:800,color:"#164e63",marginBottom:10}}>{eg.subj}{" ("}{eg.gender==="m"?"👨":"👩"})</div>
          {eg.pairs.map(function(p,pi){const correct=eg.gender==="m"?p.m:p.f;const wrong=eg.gender==="m"?p.f:p.m;return (
            <div key={pi} style={{display:"flex",gap:8,marginBottom:6}}>
              {sh([correct,wrong]).map(function(o,oi){return (
                <button key={oi} style={{flex:1,padding:"8px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:13,fontWeight:600,cursor:"pointer"}}
                  onClick={function(e){handleAnswer(e, o===correct, eg.subj.split("...")[0]+" "+correct);}}>
                  {o}
                </button>
              );})}
            </div>
          );})}
        </div>
      );})}
      {done && (
        <div className="c" style={{marginTop:16,padding:"20px 16px",textAlign:"center"}}>
          <div style={{fontSize:40,marginBottom:8}}>{correctRef.current/total>=0.8?"🏆":correctRef.current/total>=0.6?"⭐":"💪"}</div>
          <div style={{fontSize:18,fontWeight:800,color:"#164e63",marginBottom:4}}>{correctRef.current}/{total} correct</div>
          <button className="b bp" style={{marginTop:12}} onClick={goBack}>✓ Done</button>
        </div>
      )}
    </div>
  );
}

export default EmotionGenderScreen;
