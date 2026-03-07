import React from 'react';
import { H, READ } from '../../data.jsx';

export default function ReadingList({ setScr, sRp, sRph, sRqi, sRsc, sRa, sRsl, sHw, sCurEx, goBack }) {
  return (
    <div className="scr-wrap">
      
      {H("📖 Reading Passages")}
      {Object.entries(READ).map(([level,passages])=>(
        <React.Fragment key={level}>
          <h3 className="sh">{level.charAt(0).toUpperCase()+level.slice(1)}</h3>
          {passages.map((p,i)=>(
            <div key={i} className="tc"
              onClick={()=>{sRp(p);sRph("read");sRqi(0);sRsc(0);sRa(false);sRsl(-1);sHw(null);setScr("reading");sCurEx("reading");}}
              style={{display:"flex",alignItems:"center",gap:16,marginBottom:10}}>
              <div style={{fontSize:28}}>📄</div>
              <div>
                <div style={{fontSize:15,fontWeight:700}}>{p.title}</div>
                <div style={{fontSize:12,color:"#78716c"}}>{p.tEn}</div>
              </div>
            </div>
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}
