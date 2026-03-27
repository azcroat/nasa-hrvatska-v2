import React from 'react';
import { H, speak } from '../../data.jsx';
import { WORDFORM } from '../../data.jsx';

function WordFormScreen({ goBack }) {
  return (
    <div className="scr-wrap">

      {H("🧩 Word Formation","How prefixes build Croatian vocabulary",goBack)}
      {WORDFORM.bases.map(function(b,bi){return (
        <div key={bi} className="c" style={{marginBottom:16}}>
          <div style={{fontSize:16,fontWeight:800,color:"#164e63",marginBottom:10}}>{"Base: "}{b.verb}{" ("}{b.en})</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
            {b.derived.map(function(d,di){return (
              <button key={di} style={{padding:"6px 0",fontSize:14,background:"none",border:"none",cursor:"pointer",textAlign:"left",fontFamily:"'Outfit',sans-serif"}} onClick={function(){speak(d[0])}}>
                <span style={{fontWeight:700,color:"#0e7490"}}>{d[0]}{" 🔊"}</span>{" — "}<span style={{color:"var(--subtext)",fontSize:12}}>{d[1]}</span>
              </button>
            );})}
          </div>
        </div>
      );})}
    </div>
  );
}

export default WordFormScreen;
