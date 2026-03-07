import React from 'react';
import { H, Bar, Spk, srMark } from '../../data.jsx';

export default function McGame({
  mcQ, mcI, mcS, mcA, mcSl,
  sMcI, sMcS, sMcA, sMcSl,
  setScr, goBack, award,
}) {
  if (!mcQ[mcI]) return null;
  return (
    <div className="scr-wrap">
      
      {H("🎯 Multiple Choice")}
      <Bar v={mcI+1} mx={mcQ.length} h={6} color="#f59e0b" />
      <div className="c" style={{marginTop:16}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
          <Spk text={mcQ[mcI].hr} />
          <p style={{fontSize:24,fontWeight:800,fontFamily:"'Playfair Display',serif"}}>{mcQ[mcI].hr}</p>
        </div>
        <p style={{fontSize:14,color:"#78716c",marginBottom:16}}>What does this mean?</p>
        {mcQ[mcI].opts.map((o,i)=>(
          <button key={i} className={"ob "+(mcA?(o===mcQ[mcI].correct?"ok":mcSl===i?"no":""):"")}
            onClick={()=>{if(!mcA){sMcSl(i);sMcA(true);const ok=o===mcQ[mcI].correct;if(ok)sMcS(s=>s+1);if(mcQ[mcI].hr)srMark(mcQ[mcI].hr,ok);}}}>
            {o}
          </button>
        ))}
        {mcA&&<button className="b bp" style={{width:"100%",marginTop:16}} onClick={()=>{
          if(mcI<mcQ.length-1){sMcI(i=>i+1);sMcA(false);sMcSl(-1);}
          else{award(mcS*3+5);setScr("mcresult");}
        }}>{mcI<mcQ.length-1?"Next →":"Results"}</button>}
        <p style={{textAlign:"center",color:"#78716c",marginTop:12,fontSize:13}}>Score: {mcS}/{mcQ.length}</p>
      </div>
    </div>
  );
}
