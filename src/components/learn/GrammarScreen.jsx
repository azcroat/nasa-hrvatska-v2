import React, { useRef } from 'react';
import { H, Bar, speak } from '../../data.jsx';

export default function GrammarScreen({
  gl, gp, gx, gs, ga, gsl,
  sGp, sGx, sGs, sGa, sGsl,
  goBack, award, setSt,
}) {
  const resultFired = useRef(false);
  if (!gl) return null;
  return (
    <div className="scr-wrap">
      
      {gp==="learn"&&<React.Fragment>
        {H("📐 "+gl.title)}
        <div className="c" style={{marginBottom:16}}>
          <p style={{fontSize:15,color:"#44403c",lineHeight:1.7}}>{gl.desc}</p>
        </div>
        {gl.exs.map((e,i)=>(
          <button key={i} className="c" style={{marginBottom:8,display:"flex",justifyContent:"space-between",padding:"14px 20px"}} onClick={()=>speak(e[0])}>
            <span style={{fontWeight:700}}>{e[0]}</span>
            <span style={{color:"var(--subtext)"}}>{e[1]}</span>
          </button>
        ))}
        <button className="b bp" style={{width:"100%",marginTop:16}} onClick={()=>{sGp("ex");sGx(0);sGa(false);sGsl(-1);}}>Practice →</button>
      </React.Fragment>}
      {gp==="ex"&&gl.qs[gx]&&<React.Fragment>
        <Bar v={gx+1} mx={gl.qs.length} color="#b45309" h={6} />
        <div className="c" style={{marginTop:16}}>
          <p style={{fontSize:20,fontWeight:700,marginBottom:20}}>{gl.qs[gx].q}</p>
          {gl.qs[gx].o.map((o,i)=>(
            <button key={i} className={"ob "+(ga?(i===gl.qs[gx].c?"ok":gsl===i?"no":""):"")}
              onClick={()=>{if(!ga){sGsl(i);sGa(true);if(i===gl.qs[gx].c)sGs(s=>s+1);}}}>
              {o}
            </button>
          ))}
          {ga&&<button className="b bp" style={{width:"100%",marginTop:16}} onClick={()=>{
            if(gx<gl.qs.length-1){sGx(i=>i+1);sGa(false);sGsl(-1);}
            else{if(resultFired.current)return;resultFired.current=true;award(Math.round((gs/gl.qs.length)*25)+10);setSt(s=>({...s,gc:s.gc+1}));sGp("result");}
          }}>{gx<gl.qs.length-1?"Next →":"Results"}</button>}
        </div>
      </React.Fragment>}
      {gp==="result"&&<div style={{textAlign:"center",paddingTop:40}}>
        <div style={{fontSize:64}}>📝</div>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:28,color:"#164e63"}}>Score: {gs}/{gl.qs.length}</h2>
        <button className="b bp" style={{marginTop:24}} onClick={goBack}>Continue →</button>
      </div>}
    </div>
  );
}
