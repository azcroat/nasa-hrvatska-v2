import React from 'react';
import { H, speak } from '../../data.jsx';

export default function VocabJournal({ jWords, setJWords, jIn, setJIn, jEn, setJEn, goBack }) {
  return (
    <div className="scr-wrap">
      
      {H("📓 My Vocabulary Journal","Save words you discover in real life")}
      <div className="c" style={{marginBottom:16,padding:16}}>
        <div style={{display:"flex",gap:8,marginBottom:8}}>
          <input type="text" value={jIn} onChange={e=>setJIn(e.target.value)} placeholder="Croatian word..." style={{flex:1}} />
          <input type="text" value={jEn} onChange={e=>setJEn(e.target.value)} placeholder="English meaning..." style={{flex:1}} />
        </div>
        <button className="b bp" style={{width:"100%"}} onClick={()=>{
          if(!jIn.trim()||!jEn.trim())return;
          const nw=[{hr:jIn.trim(),en:jEn.trim(),date:Date.now()},...jWords];
          setJWords(nw);localStorage.setItem("uJournal",JSON.stringify(nw));setJIn("");setJEn("");
        }}>➕ Add Word</button>
      </div>
      <div style={{fontSize:14,fontWeight:700,color:"#78716c",marginBottom:8}}>{jWords.length} words saved</div>
      {jWords.map((w,i)=>(
        <div key={i} className="c" style={{marginBottom:6,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px"}}>
          <button style={{background:"none",border:"none",cursor:"pointer",textAlign:"left",padding:0,fontFamily:"'Outfit',sans-serif"}} onClick={()=>speak(w.hr)}>
            <div style={{fontSize:15,fontWeight:700,color:"var(--heading)"}}>{w.hr} 🔊</div>
            <div style={{fontSize:13,color:"var(--subtext)"}}>{w.en}</div>
          </button>
          <button style={{background:"none",border:"none",fontSize:16,cursor:"pointer",color:"#dc2626",padding:4}}
            onClick={()=>{const nw=jWords.filter((_,j)=>j!==i);setJWords(nw);localStorage.setItem("uJournal",JSON.stringify(nw));}}>
            ✖
          </button>
        </div>
      ))}
    </div>
  );
}
