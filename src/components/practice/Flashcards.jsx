import React, { useState, useRef, useEffect } from 'react';
import { H, Bar, srMark } from '../../data.jsx';

const XP_PER_KNOWN = 2;
const XP_COMPLETION_BONUS = 5;

export default function Flashcards({ pool, goBack, award }) {
  const finishFired = useRef(false);
  const [activePool, setActivePool] = useState(pool);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [missed, setMissed] = useState([]);
  const [done, setDone] = useState(false);
  const [correctAnim, setCorrectAnim] = useState(false);
  const [wrongAnim, setWrongAnim] = useState(false);
  const cardRef = useRef(null);
  const knowBtnRef = useRef(null);

  // When buttons appear (card flipped), focus "I Know It" so keyboard users can act
  useEffect(() => {
    if (flipped && knowBtnRef.current) knowBtnRef.current.focus();
  }, [flipped]);

  // When a new card loads, return focus to the card
  useEffect(() => {
    if (!flipped && !done && cardRef.current) cardRef.current.focus();
  }, [idx, flipped, done]);

  function finish(finalKnown) {
    if (finishFired.current) return;
    finishFired.current = true;
    award(finalKnown * XP_PER_KNOWN + XP_COMPLETION_BONUS);
    setDone(true);
  }

  function studyMissedAgain(missedCards) {
    finishFired.current = false;
    setActivePool(missedCards);
    setIdx(0);
    setFlipped(false);
    setKnown(0);
    setMissed([]);
    setDone(false);
  }

  // ── RESULT SCREEN ──
  if (done) {
    const knownCount = activePool.length - missed.length;
    return (
      <div className="scr-wrap">
        <div style={{textAlign:"center",padding:"40px 20px 20px"}}>
          <div style={{fontSize:64}}>{missed.length === 0 ? "🌟" : "🎉"}</div>
          <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:"var(--heading)",marginTop:12}}>
            {missed.length === 0 ? "Perfect round!" : "Round complete!"}
          </h3>
          <p style={{color:"var(--subtext)",marginTop:6,fontSize:14}}>
            Known: <strong style={{color:"#16a34a"}}>{knownCount}</strong>
            {missed.length > 0 && <> · Still learning: <strong style={{color:"#f59e0b"}}>{missed.length}</strong></>}
            {' '}/ {activePool.length}
          </p>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10,padding:"0 0 20px"}}>
          {missed.length > 0 && (
            <button className="b bp" style={{width:"100%"}} onClick={() => studyMissedAgain(missed)}>
              📖 Study {missed.length} missed {missed.length === 1 ? "card" : "cards"} again
            </button>
          )}
          <button className={missed.length > 0 ? "b bg" : "b bp"} style={{width:"100%"}} onClick={goBack}>
            {missed.length === 0 ? "Continue →" : "← Done for now"}
          </button>
        </div>
      </div>
    );
  }

  // Empty pool (or exhausted) — show a minimal done state
  if (!activePool[idx]) return (
    <div className="scr-wrap">
      <div style={{textAlign:"center",padding:40}}>
        <div style={{fontSize:64}}>🌟</div>
        <h3>Done!</h3>
        <button className="b bp" style={{marginTop:16}} onClick={goBack}>Continue</button>
      </div>
    </div>
  );

  return (
    <div className="scr-wrap">
      {H("🃏 Flashcards","Tap card to flip, then choose below.")}
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
        <span key={idx} className="anim-fade-up" style={{fontSize:14,fontWeight:700}}>{idx+1} / {activePool.length}</span>
        <div style={{fontSize:14,fontWeight:700,color:"#16a34a"}}>✅ Know: {known}</div>
      </div>
      <Bar v={idx+1} mx={activePool.length} h={6} color="#f59e0b" />
      <div className={`fc-scene${correctAnim ? ' anim-bounce-in' : ''}${wrongAnim ? ' anim-wrong' : ''}`}>
        <div
          ref={cardRef}
          className={`fc-card${flipped?" flipped":""}`}
          onClick={()=>setFlipped(f=>!f)}
          onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setFlipped(f=>!f);}}}
          role="button"
          tabIndex={0}
          aria-label={flipped ? `${activePool[idx][1]} — tap to flip back` : `${activePool[idx][0]} — tap to see English`}
        >
          <div className="fc-face fc-front">
            {(() => {
              const word = activePool[idx][0];
              const example = activePool[idx][3];
              const blankedExample = example ? example.replace(new RegExp(word, 'gi'), '___') : null;
              return blankedExample ? (
                <div style={{textAlign:'center'}}>
                  <div style={{fontSize:11, color:'var(--subtext)', marginBottom:8, fontWeight:600}}>Fill in the blank:</div>
                  <div style={{fontSize:17, fontWeight:700, color:'var(--heading)', lineHeight:1.5}}>{blankedExample}</div>
                </div>
              ) : (
                <>
                  <div style={{fontSize:32,fontWeight:800,color:"#1e40af",fontFamily:"'Playfair Display',serif",textAlign:"center",lineHeight:1.3}}>
                    {word}
                  </div>
                  {activePool[idx][2]&&<div style={{fontSize:14,color:"#6b7280",marginTop:8}}>/{activePool[idx][2]}/</div>}
                </>
              );
            })()}
            <div style={{fontSize:12,color:"#9ca3af",marginTop:12}}>tap to see English</div>
          </div>
          <div className="fc-face fc-back">
            <div style={{fontSize:22,fontWeight:800,color:"#16a34a",fontFamily:"'Playfair Display',serif",textAlign:"center",lineHeight:1.3}}>
              {activePool[idx][0]}
            </div>
            <div style={{fontSize:14,color:"#6b7280",marginTop:4,textAlign:"center"}}>{activePool[idx][1]}</div>
            {activePool[idx][3] && (
              <p style={{fontSize:12, color:'var(--subtext)', fontStyle:'italic', marginTop:8, lineHeight:1.5, borderTop:'1px solid var(--bar-bg)', paddingTop:8}}>
                "{activePool[idx][3]}"
              </p>
            )}
            <div style={{fontSize:12,color:"#9ca3af",marginTop:12}}>tap to flip back</div>
          </div>
        </div>
      </div>
      {flipped&&(
        <div style={{display:'flex', flexDirection:'column', gap:8, marginTop:16}}>
          <div style={{fontSize:11, color:'var(--subtext)', textAlign:'center', fontWeight:600, marginBottom:4}}>How well did you know it?</div>
          <div style={{display:'flex', gap:6}}>
            {[
              {q:1, label:'Blank', color:'#dc2626', bg:'#fef2f2'},
              {q:2, label:'Vague', color:'#f59e0b', bg:'#fffbeb'},
              {q:3, label:'Slow', color:'#d97706', bg:'#fef3c7'},
              {q:4, label:'Good', color:'#16a34a', bg:'#f0fdf4'},
              {q:5, label:'Perfect', color:'#15803d', bg:'#dcfce7'},
            ].map(({q, label, color, bg}) => (
              <button
                key={q}
                ref={q === 4 ? knowBtnRef : null}
                onClick={() => {
                  const correct = q >= 3;
                  srMark(activePool[idx][0], correct);
                  if (correct) {
                    setCorrectAnim(true);
                    setTimeout(() => setCorrectAnim(false), 500);
                    const newKnown = known + 1;
                    setKnown(newKnown);
                    setFlipped(false);
                    if (idx < activePool.length - 1) { setIdx(i => i + 1); }
                    else { finish(newKnown); }
                  } else {
                    setWrongAnim(true);
                    setTimeout(() => setWrongAnim(false), 400);
                    setMissed(m => [...m, activePool[idx]]);
                    setFlipped(false);
                    if (idx < activePool.length - 1) { setIdx(i => i + 1); }
                    else { finish(known); }
                  }
                }}
                style={{
                  flex:1, padding:'8px 2px', borderRadius:10, border:`1.5px solid ${color}`,
                  background:bg, cursor:'pointer', fontFamily:"'Outfit',sans-serif",
                  fontSize:10, fontWeight:800, color,
                }}
              >
                {q}<br/><span style={{fontWeight:600}}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
