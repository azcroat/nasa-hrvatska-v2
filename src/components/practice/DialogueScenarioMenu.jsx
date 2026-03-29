import React from 'react';
import { H } from '../../data.jsx';

const DIFF_COLORS = { A1:'#dcfce7', A2:'#dbeafe', B1:'#fef3c7', B2:'#fce7f3' };
const DIFF_TEXT   = { A1:'#166534', A2:'#1e40af', B1:'#92400e', B2:'#9d174d' };

export default function DialogueScenarioMenu({ scenarios, onSelect }) {
  return (
    <div className="scr-wrap">
      {H("💬 Dialogue Simulator", "Real conversations, real Croatian")}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        {scenarios.map(s => (
          <button key={s.id} className="tc" onClick={() => onSelect(s)}
            style={{textAlign:"left",padding:"14px",position:"relative"}}>
            <div style={{fontSize:24,marginBottom:6}}>{s.title.split(' ')[0]}</div>
            <div style={{fontSize:13,fontWeight:800,color:"var(--heading)",lineHeight:1.3}}>{s.title.slice(2)}</div>
            <div style={{fontSize:11,color:"var(--subtext)",marginTop:4}}>{s.subtitle}</div>
            {s.difficulty && (
              <div style={{
                display:"inline-block",marginTop:8,
                fontSize:10,fontWeight:800,
                background:DIFF_COLORS[s.difficulty]||'#f3f4f6',
                color:DIFF_TEXT[s.difficulty]||'#374151',
                borderRadius:6,padding:"2px 7px",
                letterSpacing:".04em",
              }}>
                {s.difficulty}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
