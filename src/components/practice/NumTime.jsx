import React, { useState } from 'react';
import { H, Bar, sh, NUMTIME } from '../../data.jsx';

export default function NumTime({ goBack, award }) {
  const [[ntQ, firstOpts]] = useState(() => {
    const q = sh([...NUMTIME.numbers, ...NUMTIME.time]).slice(0, 10);
    return [q, sh([q[0].a].concat(q[0].al))];
  });
  const [ntI, sNtI] = useState(0);
  const [ntS, sNtS] = useState(0);
  const [ntA, sNtA] = useState(false);
  const [ntSl, sNtSl] = useState(-1);
  const [ntO, sNtO] = useState(firstOpts);

  const total = ntQ.length;

  if (!ntQ[ntI]) {
    return (
      <div style={{maxWidth:560,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
        
        {H("🔢 Numbers & Time","Practice numbers, time, and currency in Croatian")}
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:64}}>{ntS >= total * 0.7 ? "🏆" : "👍"}</div>
          <h2 style={{fontFamily:"'Playfair Display',serif",color:"#164e63"}}>Numbers Complete!</h2>
          <div style={{fontSize:32,fontWeight:800,color:"#0e7490"}}>{ntS} / {total}</div>
          <button className="b bp" style={{marginTop:16}} onClick={() => { award(ntS * 3 + 10); goBack(); }}>
            Finish!
          </button>
        </div>
      </div>
    );
  }

  const q = ntQ[ntI];
  const ci = ntO.indexOf(q.a);

  return (
    <div style={{maxWidth:560,margin:"0 auto",padding:"24px 16px",paddingBottom:80,position:"relative",zIndex:1}}>
      
      {H("🔢 Numbers & Time","Practice numbers, time, and currency in Croatian")}
      <React.Fragment>
        <Bar v={ntI + 1} mx={total} h={6} />
        <div className="c" style={{marginTop:16}}>
          <p style={{fontSize:18,fontWeight:700}}>{q.q}</p>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:16}}>
          {ntO.map((o, oi) => (
            <button
              key={oi}
              className={"ob " + (ntA ? (oi === ci ? "ok" : ntSl === oi ? "no" : "") : "")}
              onClick={() => { if (!ntA) { sNtSl(oi); sNtA(true); if (oi === ci) sNtS(s => s + 1); } }}>
              {o}
            </button>
          ))}
        </div>
        {ntA && (
          <button
            className="b bp"
            style={{width:"100%",marginTop:16}}
            onClick={() => {
              if (ntI < total - 1) {
                const n = ntQ[ntI + 1];
                sNtO(sh([n.a].concat(n.al)));
                sNtI(i => i + 1);
                sNtA(false);
                sNtSl(-1);
              } else {
                sNtI(total);
              }
            }}>
            {ntI < total - 1 ? "Next →" : "See Results"}
          </button>
        )}
      </React.Fragment>
    </div>
  );
}
