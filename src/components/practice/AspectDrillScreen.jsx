import React, { useState, useMemo } from 'react';
import { H, Bar, Spk } from '../../data.jsx';

export default function AspectDrillScreen({ goBack, award, ASPECT_PAIRS }) {
  const items = useMemo(() => {
    if (!ASPECT_PAIRS) return [];
    return [...ASPECT_PAIRS].sort(() => Math.random() - 0.5).slice(0, 15);
  }, [ASPECT_PAIRS]);

  const [idx, setIdx] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [mode, setMode] = useState("identify"); // "identify" or "choose"

  if (!items.length) return null;

  if (done) {
    const pct = Math.round((score / items.length) * 100);
    return (
      <div className="scr-wrap">
        {H("🔄 Verb Aspects")}
        <div style={{textAlign:"center",paddingTop:32}}>
          <div style={{fontSize:64}}>{pct>=80?"🌟":"🎉"}</div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:28,color:"#164e63",marginTop:8}}>
            {pct>=80?"Excellent!":"Good Work!"}
          </h2>
          <p style={{color:"#78716c",marginTop:8}}>{score}/{items.length} correct</p>
          <div style={{background:"#fffbeb",border:"1.5px solid #fde68a",borderRadius:14,padding:"16px 20px",textAlign:"left",marginTop:24}}>
            <p style={{fontWeight:700,fontSize:13,color:"#92400e",marginBottom:8}}>🔑 Key Rule:</p>
            <p style={{fontSize:13,color:"#78350f",lineHeight:1.6}}>
              <strong>Imperfective</strong> = ongoing, repeated, or habitual actions<br/>
              <strong>Perfective</strong> = completed, one-time, or result-focused actions<br/>
              After <em>početi, završiti, nastaviti</em> → always imperfective<br/>
              With <em>odmah, jednom</em> → usually perfective
            </p>
          </div>
          <div style={{display:"flex",gap:12,justifyContent:"center",marginTop:24}}>
            <button className="b bg" onClick={()=>{setIdx(0);setAnswered(false);setSelected(null);setScore(0);setDone(false);}}>Retry</button>
            <button className="b bp" onClick={()=>{award(score*5+5);goBack();}}>Finish</button>
          </div>
        </div>
      </div>
    );
  }

  const item = items[idx];
  // Question: show English + context, ask which form fills in the blank
  // Use a simple impf/perf identification question
  const q = Math.random() > 0.5 || idx === 0
    ? {
        question: `Which is the IMPERFECTIVE (ongoing/repeated) form of "${item.en}"?`,
        correct: item.impf,
        wrong: item.pf,
        explain: `${item.impf} = ongoing/habitual. ${item.rule}.`
      }
    : {
        question: `Which is the PERFECTIVE (completed/one-time) form of "${item.en}"?`,
        correct: item.pf,
        wrong: item.impf,
        explain: `${item.pf} = completed. ${item.rule}.`
      };

  const opts = [q.correct, q.wrong].sort(() => Math.random() - 0.5);

  return (
    <div className="scr-wrap">
      {H("🔄 Verb Aspect Drill")}
      <Bar v={idx+1} mx={items.length} color="#d97706" h={6} />
      <div className="c" style={{padding:"20px",marginTop:16}}>
        <p style={{fontSize:14,color:"#92400e",fontWeight:700,background:"#fffbeb",borderRadius:8,padding:"8px 12px",marginBottom:16}}>
          {q.question}
        </p>
        <div style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:10,padding:"12px 14px",marginBottom:20,fontSize:13,color:"#475569"}}>
          <strong>Context:</strong> <em>{item.ctx}</em>
        </div>
        {opts.map((opt, i) => {
          let cls = "ob";
          if (answered) {
            if (opt === q.correct) cls += " ok";
            else if (opt === selected) cls += " no";
          }
          return (
            <button key={i} className={cls} style={{fontSize:18,fontWeight:800}}
              onClick={() => {
                if (answered) return;
                setSelected(opt);
                setAnswered(true);
                if (opt === q.correct) setScore(s => s + 1);
              }}>
              {opt}
            </button>
          );
        })}
        {answered && (
          <div style={{marginTop:12,background:"#f0f9ff",border:"1.5px solid #bae6fd",borderRadius:10,padding:"12px 14px"}}>
            <p style={{fontWeight:700,fontSize:13,color:selected===q.correct?"#166534":"#dc2626",margin:"0 0 6px"}}>
              {selected===q.correct?"✓ Correct!":"✗ Incorrect"}
            </p>
            <p style={{fontSize:13,color:"#475569",margin:0}}>{q.explain}</p>
          </div>
        )}
        {answered && (
          <button className="b bp" style={{width:"100%",marginTop:16}} onClick={() => {
            if (idx < items.length - 1) {
              setIdx(i => i + 1);
              setAnswered(false);
              setSelected(null);
            } else {
              setDone(true);
            }
          }}>
            {idx < items.length - 1 ? "Next →" : "Results"}
          </button>
        )}
      </div>
    </div>
  );
}
