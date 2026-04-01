import React, { useState, useRef } from 'react';
import { H, Bar, V, sh, srMark, speak } from '../../data.jsx';
import CroatianKeyboard from '../shared/CroatianKeyboard.jsx';

export default function TypingScreen({ goBack, award }) {
  const finishFired = useRef(false);
  const inputRef = useRef(/** @type {HTMLInputElement|null} */ (null));
  const [tyPoolData] = useState(() => {
    const allWords = Object.values(V).flat();
    const items = sh(allWords).slice(0, 10);
    return [items, items[0]];
  });
  const [tyPool, firstWord] = tyPoolData;
  const [tyI, sTyI] = useState(0);
  const [tyS, sTyS] = useState(0);
  const [tyIn, sTyIn] = useState("");
  const [tyA, sTyA] = useState(false);
  const [tyW, sTyW] = useState(firstWord);

  if (!tyPool.length || !tyW) return null;

  if (tyI >= tyPool.length) {
    return (
      <div className="scr-wrap">
        
        {H("⌨️ Typing Practice","Type Croatian words with special characters", goBack)}
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:64}}>{tyS >= tyPool.length * 0.8 ? "🏆" : "📚"}</div>
          <h2>{tyS} / {tyPool.length}</h2>
          <div style={{fontSize:24,fontWeight:900,color:"#d97706",margin:"8px 0 16px"}}>+{tyS * 5} XP</div>
          <button className="b bp" onClick={() => { if(finishFired.current)return; finishFired.current=true; if (typeof award === 'function') award(tyS * 5); goBack(); }}>🏠 Done</button>
        </div>
      </div>
    );
  }

  const isCorrect = tyIn.trim().toLowerCase() === tyW[0].toLowerCase();

  function insertChar(char) {
    const el = inputRef.current;
    if (!el) { sTyIn(v => v + char); return; }
    const start = el.selectionStart || 0, end = el.selectionEnd || 0;
    const newVal = tyIn.slice(0, start) + char + tyIn.slice(end);
    sTyIn(newVal);
    setTimeout(() => { el.focus(); el.setSelectionRange(start + 1, start + 1); }, 0);
  }

  return (
    <div className="scr-wrap">
      
      {H("⌨️ Typing Practice","Type Croatian words with special characters", goBack)}
      <Bar v={tyI + 1} mx={tyPool.length} />
      <div className="c" style={{textAlign:"center",marginTop:16}}>
        <div style={{fontSize:13,color:"#78716c"}}>Type this word in Croatian:</div>
        <div style={{fontSize:24,fontWeight:800,color:"#164e63",marginTop:8}}>{tyW[1]}</div>
      </div>
      <input
        ref={inputRef}
        type="text"
        value={tyIn}
        onChange={e => sTyIn(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" && !tyA) { sTyA(true); srMark(tyW[0], isCorrect); if (isCorrect) sTyS(tyS + 1); speak(tyW[0]); } }}
        placeholder="Type Croatian..."
        style={{marginTop:16,textAlign:"center",fontSize:18}} />
      <CroatianKeyboard onChar={insertChar} />
      {tyA && (
        <div style={{textAlign:"center",marginTop:16}}>
          <div style={{fontSize:18,fontWeight:700,color:isCorrect?"#16a34a":"#dc2626"}}>
            {isCorrect ? "✅ Correct!" : "❌ " + tyW[0]}
          </div>
          <button
            className="b bp"
            style={{marginTop:12}}
            onClick={() => {
              const next = tyI + 1;
              sTyI(next);
              sTyA(false);
              sTyIn("");
              if (next < tyPool.length) sTyW(tyPool[next]);
            }}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
