import React, { useState, useRef, useEffect } from 'react';
import { H, Bar, srMark } from '../../data.jsx';

const XP_PER_KNOWN = 2;
const XP_COMPLETION_BONUS = 5;

export default function Flashcards({ pool, goBack, award }) {
  const finishFired = useRef(false);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const cardRef = useRef(null);
  const knowBtnRef = useRef(null);

  // When buttons appear (card flipped), focus "I Know It" so keyboard users can act
  useEffect(() => {
    if (flipped && knowBtnRef.current) knowBtnRef.current.focus();
  }, [flipped]);

  // When a new card loads, return focus to the card
  useEffect(() => {
    if (!flipped && cardRef.current) cardRef.current.focus();
  }, [idx, flipped]);

  if (!pool[idx]) return (
    <div className="scr-wrap">
      <div style={{textAlign:"center",padding:40}}>
        <div style={{fontSize:64}}>🌟</div>
        <h3>Done! Known: {known}/{pool.length}</h3>
        <button className="b bp" style={{marginTop:16}} onClick={goBack}>Continue</button>
      </div>
    </div>
  );
  return (
    <div className="scr-wrap">
      {H("🃏 Flashcards","Tap card to flip. Swipe through words.")}
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
        <div style={{fontSize:14,fontWeight:700}}>{idx+1} / {pool.length}</div>
        <div style={{fontSize:14,fontWeight:700,color:"#16a34a"}}>✅ Know: {known}</div>
      </div>
      <Bar v={idx+1} mx={pool.length} h={6} color="#f59e0b" />
      <div className="fc-scene">
        <div
          ref={cardRef}
          className={`fc-card${flipped?" flipped":""}`}
          onClick={()=>setFlipped(f=>!f)}
          onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setFlipped(f=>!f);}}}
          role="button"
          tabIndex={0}
          aria-label={flipped ? `${pool[idx][1]} — tap to flip back` : `${pool[idx][0]} — tap to see English`}
        >
          <div className="fc-face fc-front">
            <div style={{fontSize:32,fontWeight:800,color:"#1e40af",fontFamily:"'Playfair Display',serif",textAlign:"center",lineHeight:1.3}}>
              {pool[idx][0]}
            </div>
            {pool[idx][2]&&<div style={{fontSize:14,color:"#6b7280",marginTop:8}}>/{pool[idx][2]}/</div>}
            <div style={{fontSize:12,color:"#9ca3af",marginTop:12}}>tap to see English</div>
          </div>
          <div className="fc-face fc-back">
            <div style={{fontSize:22,fontWeight:800,color:"#16a34a",fontFamily:"'Playfair Display',serif",textAlign:"center",lineHeight:1.3}}>
              {pool[idx][1]}
            </div>
            <div style={{fontSize:12,color:"#9ca3af",marginTop:12}}>tap to flip back</div>
          </div>
        </div>
      </div>
      {flipped&&<div style={{display:"flex",gap:12,marginTop:20,justifyContent:"center"}}>
        <button aria-label="Mark word for further study" className="b bd" style={{flex:1,fontSize:15}} onClick={()=>{
          srMark(pool[idx][0],false);setFlipped(false);
          if(idx<pool.length-1)setIdx(i=>i+1);
          else{if(finishFired.current)return;finishFired.current=true;award(known*XP_PER_KNOWN+XP_COMPLETION_BONUS);goBack();}
        }}>❌ Study Again</button>
        <button ref={knowBtnRef} aria-label="Mark word as known" className="b bs" style={{flex:1,fontSize:15}} onClick={()=>{
          srMark(pool[idx][0],true);setKnown(k=>k+1);setFlipped(false);
          if(idx<pool.length-1)setIdx(i=>i+1);
          else{if(finishFired.current)return;finishFired.current=true;award((known+1)*XP_PER_KNOWN+XP_COMPLETION_BONUS);goBack();}
        }}>✅ I Know It</button>
      </div>}
    </div>
  );
}
