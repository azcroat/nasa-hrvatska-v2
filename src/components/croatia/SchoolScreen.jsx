import React from 'react';
import { H, speak } from '../../data.jsx';
import { SCHOOL } from '../../data.jsx';

function SchoolScreen({ goBack }) {
  return (
    <div className="scr-wrap">

      {H("🏫 School Survival Kit","Everything for Croatian school",goBack)}
      <div className="c" style={{marginBottom:16,borderLeft:"4px solid #dc2626",background:"#fef2f2"}}>
        <div style={{fontSize:15,fontWeight:800,color:"#dc2626"}}>{SCHOOL.grading.title}</div>
        <div style={{fontSize:14,marginTop:4}}>{SCHOOL.grading.desc}</div>
      </div>
      <div className="c" style={{marginBottom:12,borderLeft:"4px solid #f59e0b",background:"#fffbeb"}}>
        <div style={{fontSize:13,fontWeight:700,color:"#b45309"}}>⚠️ Formal Rules</div>
        <div style={{fontSize:13,marginTop:4}}>{SCHOOL.formal}</div>
      </div>
      <h3 className="sh">📚 Classroom Vocabulary</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
        {SCHOOL.classroom.map(function(w,i){return (
          <button key={i} className="c" style={{padding:"8px 12px"}} onClick={function(){speak(w[0])}}>
            <div style={{fontSize:13,fontWeight:700,color:"var(--heading)"}}>{w[0]}{" 🔊"}</div>
            <div style={{fontSize:11,color:"var(--subtext)"}}>{w[1]}</div>
          </button>
        );})}
      </div>
      <h3 className="sh" style={{marginTop:16}}>📝 Subjects</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
        {SCHOOL.subjects.map(function(w,i){return (
          <button key={i} className="c" style={{padding:"8px 12px"}} onClick={function(){speak(w[0])}}>
            <div style={{fontSize:13,fontWeight:700,color:"#7c3aed"}}>{w[0]}{" 🔊"}</div>
            <div style={{fontSize:11,color:"var(--subtext)"}}>{w[1]}</div>
          </button>
        );})}
      </div>
      <h3 className="sh" style={{marginTop:16}}>🗣️ Essential Phrases</h3>
      {SCHOOL.phrases.map(function(p,i){return (
        <button key={i} className="c" style={{marginBottom:6,display:"flex",justifyContent:"space-between",padding:"10px 14px"}} onClick={function(){speak(p[0])}}>
          <span style={{fontWeight:700,fontSize:14}}>{p[0]}{" 🔊"}</span>
          <span style={{color:"var(--subtext)",fontSize:13}}>{p[1]}</span>
        </button>
      );})}
    </div>
  );
}

export default SchoolScreen;
