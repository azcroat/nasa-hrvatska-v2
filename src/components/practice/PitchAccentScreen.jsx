import React, { useState, useRef } from 'react';
import { H, Bar, Spk } from '../../data.jsx';

const ACCENT_TYPES = [
  {id:"kratkosilazni", label:"Short Falling", symbol:"◌̀", color:"#ef4444", desc:"Pitch drops on a short vowel"},
  {id:"kratkouzlazni", label:"Short Rising",  symbol:"◌́", color:"#3b82f6", desc:"Pitch rises on a short vowel"},
  {id:"dugosilazni",   label:"Long Falling",  symbol:"◌̂", color:"#f97316", desc:"Pitch drops on a long vowel"},
  {id:"dugouzlazni",   label:"Long Rising",   symbol:"◌̋", color:"#22c55e", desc:"Pitch rises on a long vowel"},
];

export default function PitchAccentScreen({ goBack, award, PITCH_ACCENT }) {
  const finishFired = useRef(false);
  const [idx, setIdx] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  if (!PITCH_ACCENT || PITCH_ACCENT.length === 0) return null;
  const items = PITCH_ACCENT;

  if (done) {
    const pct = Math.round((score / items.length) * 100);
    return (
      <div className="scr-wrap">
        {H("🎵 Pitch Accent")}
        <div style={{textAlign:"center",paddingTop:32}}>
          <div style={{fontSize:64}}>{pct===100?"🌟":pct>=70?"🎉":"💪"}</div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:28,color:"#164e63",marginTop:8}}>
            {pct===100?"Perfect!":pct>=70?"Great Job!":"Keep Practicing!"}
          </h2>
          <p style={{color:"#78716c",marginTop:8,fontSize:16}}>{score}/{items.length} correct</p>
          <div style={{marginTop:24,background:"#f0f9ff",border:"1.5px solid #bae6fd",borderRadius:14,padding:"16px 20px",textAlign:"left"}}>
            <p style={{fontWeight:700,fontSize:14,color:"#0369a1",marginBottom:8}}>The 4 Croatian Accents:</p>
            {ACCENT_TYPES.map(a=>(
              <div key={a.id} style={{display:"flex",gap:10,alignItems:"center",marginBottom:6}}>
                <span style={{fontWeight:800,color:a.color,fontSize:16,minWidth:24}}>{a.symbol}</span>
                <span style={{fontSize:13,fontWeight:700,color:"#1e293b"}}>{a.label}</span>
                <span style={{fontSize:12,color:"#64748b"}}>— {a.desc}</span>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:12,justifyContent:"center",marginTop:24}}>
            <button className="b bg" onClick={()=>{setIdx(0);setAnswered(false);setSelected(null);setScore(0);setDone(false);}}>Retry</button>
            <button className="b bp" onClick={()=>{if(finishFired.current)return;finishFired.current=true;award(score*5+5);goBack();}}>Finish</button>
          </div>
        </div>
      </div>
    );
  }

  const item = items[idx];
  const correct = item.type;
  const accentInfo = ACCENT_TYPES.find(a=>a.id===correct);

  return (
    <div className="scr-wrap">
      {H("🎵 Pitch Accent Practice")}
      <Bar v={idx+1} mx={items.length} color="#7c3aed" h={6} />
      <div className="c" style={{textAlign:"center",marginTop:16,padding:"24px 20px"}}>
        <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:12,marginBottom:8}}>
          <Spk text={item.hr} label={item.hr} />
          <p style={{fontSize:40,fontWeight:800,fontFamily:"'Playfair Display',serif",margin:0}}>{item.hr}</p>
        </div>
        <p style={{fontSize:14,color:"#78716c",marginBottom:4,fontStyle:"italic"}}>{item.en}</p>
        {answered && (
          <p style={{fontSize:22,fontWeight:700,color:"#7c3aed",marginBottom:4}}>{item.mark}</p>
        )}
        <p style={{fontSize:13,color:"#92400e",background:"#fffbeb",borderRadius:8,padding:"6px 12px",display:"inline-block",marginBottom:20}}>
          What accent type does this word have?
        </p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
          {ACCENT_TYPES.map(a=>{
            let bg="var(--card)";let border="var(--card-b)";let color="var(--heading)";
            if(answered){
              if(a.id===correct){bg="#f0fdf4";border="#86efac";color="#166534";}
              else if(a.id===selected){bg="#fff1f2";border="#fca5a5";color="#991b1b";}
            }else if(selected===a.id){bg="#f5f3ff";border="#c4b5fd";}
            return (
              <button key={a.id}
                style={{background:bg,border:`1.5px solid ${border}`,borderRadius:12,padding:"14px 10px",cursor:"pointer",textAlign:"center"}}
                onClick={()=>{
                  if(answered)return;
                  setSelected(a.id);setAnswered(true);
                  if(a.id===correct)setScore(s=>s+1);
                }}>
                <div style={{fontSize:20,marginBottom:4,color:a.color}}>{a.symbol}</div>
                <div style={{fontSize:13,fontWeight:700,color}}>{a.label}</div>
                <div style={{fontSize:11,color:"#64748b",marginTop:2}}>{a.desc}</div>
              </button>
            );
          })}
        </div>
        {answered && (
          <div style={{marginBottom:16}}>
            <div style={{color:selected===correct?"#166534":"#991b1b",fontWeight:800,fontSize:16,marginBottom:6}}>
              {selected===correct?"✓ Correct!":"✗ "+accentInfo.label}
            </div>
            <div style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#475569",textAlign:"left"}}>
              <strong>{item.mark}</strong> — {item.tip}
            </div>
          </div>
        )}
        {answered && (
          <button className="b bp" onClick={()=>{
            if(idx<items.length-1){setIdx(i=>i+1);setAnswered(false);setSelected(null);}
            else setDone(true);
          }}>
            {idx<items.length-1?"Next →":"See Results"}
          </button>
        )}
      </div>
    </div>
  );
}
