import React, { useState, useRef, useEffect } from 'react';
import { H, Bar, srMark } from '../../data.jsx';
import CroatianKnight from '../shared/CroatianKnight';

const STILL_LEARNING_MSG_DURATION = 1200;

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
  const [showStillLearning, setShowStillLearning] = useState(false);
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
    const missedCount = missed.length;
    return (
      <div className="scr-wrap">
        <div style={{textAlign:"center",padding:"40px 20px 20px"}}>
          <CroatianKnight
            size={80}
            mood={missedCount === 0 ? 'celebrating' : 'happy'}
            style={{margin:'0 auto 12px', display:'block'}}
          />
          <div style={{fontSize:64}}>{missedCount === 0 ? "🌟" : "🎉"}</div>
          <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:"var(--heading)",marginTop:12}}>
            {missedCount === 0 ? "Perfect round!" : "Round complete!"}
          </h3>
          <p style={{color:"var(--subtext)",marginTop:6,fontSize:14}}>
            Known: <strong style={{color:"var(--success)"}}>{knownCount}</strong>
            {missedCount > 0 && <> · Still learning: <strong style={{color:"#f59e0b"}}>{missedCount}</strong></>}
            {' '}/ {activePool.length}
          </p>
          <div style={{fontSize:'var(--text-2xl)', fontWeight:900, color:'#fbbf24', marginTop:8}}>
            +{knownCount * 2 + 5} XP
          </div>
          <div style={{fontSize:'var(--text-sm)', color:'var(--subtext)', marginTop:4}}>
            {missedCount === 0 ?
              '🌟 Perfect! Ready for new words.' :
              `${missedCount} card${missedCount !== 1 ? 's' : ''} need review — they'll come back tomorrow`
            }
          </div>
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
        <div style={{fontSize:14,fontWeight:700,color:"var(--success)"}}>✅ Know: {known}</div>
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
                  <div style={{fontSize:32,fontWeight:800,color:"var(--info)",fontFamily:"'Playfair Display',serif",textAlign:"center",lineHeight:1.3}}>
                    {word}
                  </div>
                  {activePool[idx][2]&&<div style={{fontSize:14,color:"var(--subtext)",marginTop:8}}>/{activePool[idx][2]}/</div>}
                </>
              );
            })()}
            <div style={{fontSize:12,color:"var(--subtext)",marginTop:12}}>tap to see English</div>
          </div>
          <div className="fc-face fc-back">
            <div style={{fontSize:14,color:"var(--subtext)",marginTop:4,textAlign:"center",fontWeight:700}}>{activePool[idx][1]}</div>
            {activePool[idx][3] && (
              <p style={{fontSize:12, color:'var(--subtext)', fontStyle:'italic', marginTop:8, lineHeight:1.5, borderTop:'1px solid var(--bar-bg)', paddingTop:8}}>
                "{activePool[idx][3]}"
              </p>
            )}
            <div style={{fontSize:12,color:"var(--subtext)",marginTop:12}}>tap to flip back</div>
          </div>
        </div>
      </div>
      {showStillLearning && (
        <div style={{
          fontSize:11, color:'var(--error)', fontWeight:600,
          textAlign:'center', marginTop:6, animation:'rise .3s'
        }}>
          ↻ This card will reappear for review
        </div>
      )}
      {flipped&&(
        <div style={{marginTop:16}}>
        <div style={{fontSize:12,fontWeight:700,color:"var(--subtext)",textAlign:"center",marginBottom:8}}>How well did you know it?</div>
        <div style={{display:'flex', gap:10}}>
          <button
            onClick={() => {
              const q = 2;
              const correct = q >= 3;
              srMark(activePool[idx][0], correct);
              setWrongAnim(true);
              setTimeout(() => setWrongAnim(false), 400);
              setShowStillLearning(true);
              setTimeout(() => setShowStillLearning(false), STILL_LEARNING_MSG_DURATION);
              setMissed(m => [...m, activePool[idx]]);
              setFlipped(false);
              if (idx < activePool.length - 1) { setIdx(i => i + 1); }
              else { finish(known); }
            }}
            style={{
              flex:1, height:56, borderRadius:16,
              border:'2px solid var(--error-b)',
              background:'var(--error-bg)',
              color:'var(--error)',
              fontFamily:"'Outfit',sans-serif",
              fontSize:15, fontWeight:900,
              display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center',
              cursor:'pointer',
            }}
          >
            🔄 Still Learning
            <span style={{fontSize:10, fontWeight:600, opacity:.7, marginTop:4}}>Review again soon</span>
          </button>
          <button
            ref={knowBtnRef}
            onClick={() => {
              const q = 4;
              const correct = q >= 3;
              srMark(activePool[idx][0], correct);
              setCorrectAnim(true);
              setTimeout(() => setCorrectAnim(false), 500);
              const newKnown = known + 1;
              setKnown(newKnown);
              setFlipped(false);
              if (idx < activePool.length - 1) { setIdx(i => i + 1); }
              else { finish(newKnown); }
            }}
            style={{
              flex:1, height:56, borderRadius:16,
              border:'2px solid var(--success-b)',
              background:'var(--success-bg)',
              color:'var(--success)',
              fontFamily:"'Outfit',sans-serif",
              fontSize:15, fontWeight:900,
              display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center',
              cursor:'pointer',
            }}
          >
            Perfect ✓
            <span style={{fontSize:10, fontWeight:600, opacity:.7, marginTop:4}}>Move to next interval</span>
          </button>
        </div>
        </div>
      )}
    </div>
  );
}
