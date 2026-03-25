import React, { useState } from 'react';
import { H } from '../../data.jsx';

// Q-4: State moved into component — App.jsx no longer owns mp/mm/msl/gph/gsc.
// PracticeTab passes initPool (the shuffled card array) as the only init prop.
export default function MatchGame({ initPool, goBack, award }) {
  const [mp] = useState(initPool || []);
  const [mm, sMm] = useState([]);
  const [msl, sMsl] = useState([]);
  const [gph, sGph] = useState("play");
  const [gsc, sGsc] = useState(0);

  return (
    <div className="scr-wrap">

      {H("🃏 Match Pairs")}
      {gph === "play" && (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
          {mp.map(c => (
            <div
              key={c.id}
              role="button"
              tabIndex={0}
              aria-pressed={msl.some(s => s.id === c.id)}
              style={{
                padding:"14px 12px",
                border: mm.includes(c.p) ? "2px solid #22c55e" : msl.some(s => s.id === c.id) ? "2px solid #0e7490" : "2px solid #e7e5e4",
                borderRadius:14,
                background: mm.includes(c.p) ? "rgba(77,124,15,.1)" : msl.some(s => s.id === c.id) ? "rgba(14,116,144,.1)" : "white",
                textAlign:"center",fontWeight:600,fontSize:14,cursor:"pointer",
                opacity: mm.includes(c.p) ? 0.6 : 1
              }}
              onClick={() => {
                if (mm.includes(c.p)) return;
                if (msl.length === 0) { sMsl([c]); return; }
                const f = msl[0];
                if (f.id === c.id) { sMsl([]); return; }
                if (f.p === c.p && f.tp !== c.tp) {
                  sMm(m => [...m, c.p]); sGsc(s => s + 1); sMsl([]);
                  if (mm.length + 1 === mp.length / 2) setTimeout(() => { award(20); sGph("done"); }, 500);
                } else {
                  sMsl([f, c]); setTimeout(() => sMsl([]), 800);
                }
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (mm.includes(c.p)) return;
                  if (msl.length === 0) { sMsl([c]); return; }
                  const f = msl[0];
                  if (f.id === c.id) { sMsl([]); return; }
                  if (f.p === c.p && f.tp !== c.tp) {
                    sMm(m => [...m, c.p]); sGsc(s => s + 1); sMsl([]);
                    if (mm.length + 1 === mp.length / 2) setTimeout(() => { award(20); sGph("done"); }, 500);
                  } else {
                    sMsl([f, c]); setTimeout(() => sMsl([]), 800);
                  }
                }
              }}>
              {c.t}
            </div>
          ))}
        </div>
      )}
      {gph === "done" && (
        <div style={{textAlign:"center",paddingTop:40}}>
          <div style={{fontSize:64}}>🎉</div>
          <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:24,color:"#164e63",marginTop:12}}>All Matched!</h3>
          <p style={{color:"#78716c",marginTop:4}}>{gsc} pairs matched!</p>
          <button className="b bp" style={{marginTop:24}} onClick={goBack}>Continue →</button>
        </div>
      )}
    </div>
  );
}
