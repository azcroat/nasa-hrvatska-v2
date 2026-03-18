import React, { useState, useRef } from 'react';
import { H, Bar, Spk, speakSlow } from '../../data.jsx';

const SRSupported = typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

export default function SpeakingScreen({ sw, si, sx, sr, ssc, sSr, sSx, sSw, sSsc, goBack, award, setSt }) {
  // Hooks must be called unconditionally — before any early return
  const [listening, setListening] = useState(false);
  const [recResult, setRecResult] = useState(null);
  const recRef = useRef(null);

  if (!sw) return null;

  function startMic() {
    if (!SRSupported) return;
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SpeechRec();
    rec.lang = "hr-HR";
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 3;
    recRef.current = rec;
    setListening(true);
    setRecResult(null);
    rec.onresult = (e) => {
      const alts = Array.from(e.results[0]).map(r => r.transcript.toLowerCase().trim());
      const target = sw[0].toLowerCase().trim();
      const matched = alts.some(a => a === target || a.includes(target) || target.includes(a));
      setRecResult(matched ? "match" : "nomatch");
      setListening(false);
      if (matched) { sSr("ok"); sSsc(s => s + 1); }
    };
    rec.onerror = () => { setListening(false); setRecResult("error"); };
    rec.onend = () => setListening(false);
    rec.start();
  }

  function stopMic() {
    if (recRef.current) { try { recRef.current.stop(); } catch(e){} } // NOSONAR - intentional empty catch, optional browser API or safe fallback
    setListening(false);
  }

  return (
    <div className="scr-wrap">
      {H("🎤 Pronunciation Practice")}
      <Bar v={sx + 1} mx={si.length} color="#4d7c0f" h={6} />
      <div className="c" style={{textAlign:"center",marginTop:16}}>
        <p style={{fontSize:36,fontWeight:800,fontFamily:"'Playfair Display',serif"}}>{sw[0]}</p>
        {sw[2]&&<p style={{fontSize:14,color:"#78716c",marginBottom:4}}>/{sw[2]}/</p>}
        <p style={{fontSize:16,color:"#44403c",marginBottom:16}}>{sw[1]}</p>
        <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:16,flexWrap:"wrap"}}>
          <Spk text={sw[0]} label="Normal" />
          <button
            onClick={() => speakSlow(sw[0])}
            style={{background:"rgba(77,124,15,.1)",border:"1px solid rgba(77,124,15,.2)",borderRadius:10,padding:"7px 12px",cursor:"pointer",fontSize:12,color:"#4d7c0f",fontWeight:700}}>
            🐢 Slow
          </button>
        </div>

        {SRSupported ? (
          <div style={{marginBottom:16}}>
            <button
              onClick={listening ? stopMic : startMic}
              style={{
                background:listening?"#ef4444":"rgba(77,124,15,.15)",
                border:`1.5px solid ${listening?"#ef4444":"rgba(77,124,15,.4)"}`,
                borderRadius:12,padding:"10px 20px",cursor:"pointer",fontSize:14,
                color:listening?"#fff":"#4d7c0f",fontWeight:800,
                animation:listening?"pulse 1s infinite":undefined,
              }}>
              {listening?"🔴 Listening... (tap to stop)":"🎙️ Try Speaking"}
            </button>
            {recResult==="match"&&<div style={{color:"#4d7c0f",fontSize:15,fontWeight:800,marginTop:8}}>🎯 Great pronunciation match!</div>}
            {recResult==="nomatch"&&<div style={{color:"#ea580c",fontSize:14,fontWeight:600,marginTop:8}}>Close! Try again or self-assess below.</div>}
            {recResult==="error"&&<div style={{color:"#78716c",fontSize:13,marginTop:8}}>Mic not available. Use self-assessment.</div>}
          </div>
        ) : null}

        <button className="b bs" onClick={() => { sSr("ok"); sSsc(s => s + 1); }}>
          👍 I Said It Correctly!
        </button>
        {sr === "ok" && <div style={{color:"#4d7c0f",fontSize:20,fontWeight:800,marginTop:12}}>✓ Great pronunciation!</div>}
        {sr === "ok" && (
          <button
            className="b bp"
            style={{marginTop:16}}
            onClick={() => {
              setRecResult(null);
              if (sx < si.length - 1) {
                const n = sx + 1; sSx(n); sSw(si[n]); sSr(null);
              } else {
                award(ssc * 5 + 5); setSt(s => ({...s, sp: s.sp + 1})); goBack();
              }
            }}>
            {sx < si.length - 1 ? "Next →" : "Finish"}
          </button>
        )}
      </div>
    </div>
  );
}
