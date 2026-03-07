import React from 'react';
import { Bar, lXP, nXP } from '../../data.jsx';

export default function ProfileScreen({ name, level, st, au, goBack, doOut }) {
  return (
    <div className="scr-wrap">
      
      <div style={{textAlign:"center",marginBottom:32}}>
        <div style={{width:80,height:80,borderRadius:"50%",background:"linear-gradient(135deg,#0e7490,#164e63)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:36,color:"#fff",fontWeight:800}}>
          {name.charAt(0).toUpperCase()}
        </div>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:26,color:"#164e63"}}>{name}</h2>
        <p style={{color:"#78716c",fontSize:14}}>Level {level} · {st.diff.charAt(0).toUpperCase()+st.diff.slice(1)}</p>
        {au&&au.e&&<p style={{color:"#a8a29e",fontSize:12,marginTop:4}}>{au.e}</p>}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:24}}>
        {[["⭐",st.xp,"XP"],["📚",st.lc,"Lessons"],["📝",st.gc,"Grammar"]].map(([i,v,l],idx)=>(
          <div key={idx} className="c" style={{textAlign:"center"}}>
            <div style={{fontSize:24}}>{i}</div>
            <div style={{fontSize:20,fontWeight:800,marginTop:4}}>{v}</div>
            <div style={{fontSize:11,color:"#78716c"}}>{l}</div>
          </div>
        ))}
      </div>
      <div className="c" style={{marginBottom:16}}>
        <h3 style={{fontSize:14,fontWeight:700,color:"#78716c",marginBottom:12}}>Next Level</h3>
        <Bar v={st.xp-lXP(level)} mx={nXP(level)-lXP(level)} />
        <p style={{fontSize:12,color:"#a8a29e",marginTop:8}}>{nXP(level)-st.xp} XP to Level {level+1}</p>
      </div>
      <button onClick={doOut} style={{width:"100%",padding:"14px",border:"2px solid rgba(194,65,12,.15)",borderRadius:14,background:"rgba(194,65,12,.05)",color:"#c2410c",fontSize:15,fontWeight:700,cursor:"pointer"}}>
        🚪 Sign Out
      </button>
    </div>
  );
}
