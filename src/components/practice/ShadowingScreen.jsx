import React, { useState } from 'react';
import { H, Bar, Spk, speakSlow } from '../../data.jsx';

export default function ShadowingScreen({ goBack, award, SHADOWING }) {
  const [idx, setIdx] = useState(0);
  const [said, setSaid] = useState(false);
  const [plays, setPlays] = useState(0);
  const [done, setDone] = useState(false);
  const [reps, setReps] = useState(0);

  if (!SHADOWING || SHADOWING.length === 0) return null;
  const items = SHADOWING;

  if (done) {
    return (
      <div className="scr-wrap">
        {H("🗣️ Shadowing")}
        <div style={{textAlign:"center",paddingTop:32}}>
          <div style={{fontSize:64}}>🎤</div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:28,color:"#164e63",marginTop:8}}>Session Complete!</h2>
          <p style={{color:"#78716c",marginTop:8}}>You shadowed {items.length} Croatian sentences</p>
          <p style={{color:"#78716c",fontSize:14,marginTop:4}}>Total repetitions: {reps}</p>
          <div style={{marginTop:24,background:"#f0fdf4",border:"1.5px solid #bbf7d0",borderRadius:14,padding:"16px 20px",textAlign:"left"}}>
            <p style={{fontWeight:700,fontSize:13,color:"#166534",marginBottom:6}}>💡 Shadowing Tips:</p>
            <p style={{fontSize:13,color:"#374151",lineHeight:1.6}}>
              • Listen first, then speak simultaneously with the audio<br/>
              • Focus on rhythm and melody, not perfect pronunciation<br/>
              • Repeat each sentence 3-5 times for best results<br/>
              • Record yourself to hear your progress
            </p>
          </div>
          <div style={{display:"flex",gap:12,justifyContent:"center",marginTop:24}}>
            <button className="b bg" onClick={()=>{setIdx(0);setSaid(false);setPlays(0);setDone(false);setReps(0);}}>Retry</button>
            <button className="b bp" onClick={()=>{award(items.length*3+5);goBack();}}>Finish</button>
          </div>
        </div>
      </div>
    );
  }

  const item = items[idx];

  return (
    <div className="scr-wrap">
      {H("🗣️ Shadowing Practice")}
      <Bar v={idx+1} mx={items.length} color="#0891b2" h={6} />
      <div className="c" style={{textAlign:"center",marginTop:16,padding:"24px 20px"}}>
        <div style={{background:"#f0f9ff",border:"1.5px solid #bae6fd",borderRadius:12,padding:"12px 16px",marginBottom:16,fontSize:12,color:"#0369a1",fontWeight:600}}>
          🎯 {item.tip}
        </div>
        <p style={{fontSize:28,fontWeight:800,fontFamily:"'Playfair Display',serif",lineHeight:1.4,marginBottom:8}}>{item.hr}</p>
        <p style={{fontSize:15,color:"#78716c",marginBottom:20,fontStyle:"italic"}}>{item.en}</p>
        <div style={{display:"flex",gap:10,justifyContent:"center",marginBottom:20,flexWrap:"wrap"}}>
          <Spk text={item.hr} label="Listen Normal" />
          <button
            onClick={()=>{speakSlow(item.hr);setPlays(p=>p+1);}}
            style={{background:"rgba(8,145,178,.1)",border:"1px solid rgba(8,145,178,.3)",borderRadius:10,padding:"7px 14px",cursor:"pointer",fontSize:12,color:"#0891b2",fontWeight:700}}>
            🐢 Listen Slow
          </button>
        </div>
        {plays > 0 && (
          <div style={{marginBottom:16,fontSize:13,color:"#64748b"}}>
            Listened {plays} time{plays!==1?"s":""}
          </div>
        )}
        <button
          className="b bs"
          style={{marginBottom:12}}
          onClick={()=>{setSaid(true);setReps(r=>r+1);}}>
          🎤 I Said It!
        </button>
        {said && (
          <div style={{color:"#166534",fontSize:16,fontWeight:800,marginBottom:12}}>
            ✓ Keep going — repetition builds fluency!
          </div>
        )}
        {said && (
          <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
            <button
              style={{background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"8px 16px",cursor:"pointer",fontSize:13,color:"#475569",fontWeight:600}}
              onClick={()=>{setSaid(false);setPlays(0);}}>
              🔁 Say Again
            </button>
            <button className="b bp" onClick={()=>{
              if(idx<items.length-1){setIdx(i=>i+1);setSaid(false);setPlays(0);}
              else setDone(true);
            }}>
              {idx<items.length-1?"Next →":"Finish"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
