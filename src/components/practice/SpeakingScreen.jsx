import React from 'react';
import { H, Bar, Spk, speakSlow } from '../../data.jsx';

export default function SpeakingScreen({ sw, si, sx, sr, ssc, sSr, sSx, sSw, sSsc, goBack, award, setSt }) {
  if (!sw) return null;

  return (
    <div className="scr-wrap">
      
      {H("🎤 Pronunciation Practice")}
      <Bar v={sx + 1} mx={si.length} color="#4d7c0f" h={6} />
      <div className="c" style={{textAlign:"center",marginTop:16}}>
        <p style={{fontSize:36,fontWeight:800,fontFamily:"'Playfair Display',serif"}}>{sw[0]}</p>
        <p style={{fontSize:14,color:"#78716c",marginBottom:4}}>/{sw[2]}/</p>
        <p style={{fontSize:16,color:"#44403c",marginBottom:16}}>{sw[1]}</p>
        <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:16}}>
          <Spk text={sw[0]} label="Normal" />
          <button
            onClick={() => speakSlow(sw[0])}
            style={{background:"rgba(77,124,15,.1)",border:"1px solid rgba(77,124,15,.2)",borderRadius:10,padding:"7px 12px",cursor:"pointer",fontSize:12,color:"#4d7c0f",fontWeight:700}}>
            🐢 Slow
          </button>
        </div>
        <button className="b bs" onClick={() => { sSr("ok"); sSsc(s => s + 1); }}>
          👍 I Said It Correctly!
        </button>
        {sr === "ok" && <div style={{color:"#4d7c0f",fontSize:20,fontWeight:800,marginTop:12}}>✓ Great pronunciation!</div>}
        {sr === "ok" && (
          <button
            className="b bp"
            style={{marginTop:16}}
            onClick={() => {
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
