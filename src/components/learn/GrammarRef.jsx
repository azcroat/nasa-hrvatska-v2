import React, { useState } from 'react';
import { H, speak, shMemo } from '../../data.jsx';
import { ASPECT, FALSEFR, DECL, BRZALICE, DIALECTS, DIMWORDS, WORDFORM, COLORQUIRK } from '../../data.jsx';

export function AspectScreen({ goBack }) {
  return (
    <div className="scr-wrap">
      
      {H("🔄 Verb Aspect","Perfective vs Imperfective")}
      {ASPECT.pairs.map(function(p,i){return (
        <div key={i} className="c" style={{marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            <span style={{fontWeight:700,color:"#dc2626",cursor:"pointer"}} onClick={function(){speak(p.imp)}}>{p.imp}{" 🔊"}</span>
            <span style={{fontWeight:700,color:"#16a34a",cursor:"pointer"}} onClick={function(){speak(p.perf)}}>{p.perf}{" 🔊"}</span>
          </div>
          <div style={{fontSize:13,color:"#78716c"}}>{p.en}</div>
        </div>
      );})}
    </div>
  );
}

export function FalseFriendsScreen({ goBack }) {
  return (
    <div className="scr-wrap">
      
      {H("⚠️ False Friends","Croatian words that trick English speakers")}
      {FALSEFR.map(function(f,i){return (
        <div key={i} className="c" style={{marginBottom:10,cursor:"pointer"}} onClick={function(){speak(f.hr)}}>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            <span style={{fontSize:16,fontWeight:800,color:"#dc2626"}}>{f.hr}{" 🔊"}</span>
            <span style={{fontSize:14,color:"#78716c"}}>{"Looks like: "}{f.looks}</span>
          </div>
          <div style={{fontSize:14,fontWeight:600,color:"#16a34a",marginTop:4}}>{"Actually means: "}{f.means}</div>
          {f.ex&&<div style={{fontSize:12,color:"#78716c",fontStyle:"italic",marginTop:2}}>{f.ex}</div>}
        </div>
      );})}
    </div>
  );
}

export function DeclensionScreen({ goBack }) {
  const [dcNoun, sDcNoun] = useState(0);
  const n = DECL.nouns[dcNoun];
  return (
    <div className="scr-wrap">
      
      {H("📝 Noun Declension Trainer","All 7 cases for key nouns")}
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
        {DECL.nouns.map(function(noun,i){return (
          <button key={i} className={"b "+(dcNoun===i?"bp":"bg")} style={{fontSize:13}} onClick={function(){sDcNoun(i)}}>
            {noun.nom}{" ("}{noun.en})
          </button>
        );})}
      </div>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <tbody>
          {DECL.cases.map(function(cs,ci){return (
            <tr key={ci} style={{borderBottom:"1px solid #f3f4f6",cursor:"pointer"}} onClick={function(){speak(n.forms[ci])}}>
              <td style={{padding:"10px",fontWeight:700,color:"#0e7490"}}>{(ci+1)+". "}{cs}</td>
              <td style={{padding:"10px",fontWeight:600,fontSize:16}}>{n.forms[ci]}{" 🔊"}</td>
            </tr>
          );})}
        </tbody>
      </table>
    </div>
  );
}

export function BrzaliceScreen({ goBack }) {
  return (
    <div className="scr-wrap">
      
      {H("😝 Brzalice","Croatian Tongue Twisters")}
      {shMemo("bz",BRZALICE).map(function(b,i){return (
        <div key={i} className="c" style={{marginBottom:12}}>
          <div style={{fontSize:16,fontWeight:700,color:"#164e63",cursor:"pointer"}} onClick={function(){speak(b.hr)}}>{b.hr}{" 🔊"}</div>
          <div style={{fontSize:13,color:"#78716c",marginTop:4}}>{b.en}</div>
          <div style={{fontSize:12,color:"#b45309",marginTop:2}}>{"Target: "}{b.target}</div>
        </div>
      );})}
    </div>
  );
}

export function DialectsScreen({ goBack }) {
  return (
    <div className="scr-wrap">
      
      {H("🗺️ Regional Dialects","Štokavski, Kajkavski, Čakavski")}
      {DIALECTS.info.map(function(d,i){return (
        <div key={i} className="c" style={{marginBottom:12,borderLeft:"4px solid "+["#0e7490","#7c3aed","#dc2626"][i]}}>
          <div style={{fontSize:16,fontWeight:800}}>{d.name}</div>
          <div style={{fontSize:13,color:"#78716c",marginTop:4}}>{d.region}</div>
          <div style={{fontSize:13,marginTop:4}}>{d.desc}</div>
        </div>
      );})}
      <h3 className="sh" style={{marginTop:16}}>Comparison Table</h3>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
        <thead>
          <tr>{["English","Što","Kaj","Ča"].map(function(h,i){return (<th key={i} style={{padding:"8px",borderBottom:"2px solid #e7e5e4",textAlign:"left"}}>{h}</th>);})}</tr>
        </thead>
        <tbody>
          {DIALECTS.compare.map(function(r,i){return (
            <tr key={i} style={{borderBottom:"1px solid #f3f4f6"}}>
              <td style={{padding:"8px",color:"#78716c"}}>{r.en}</td>
              <td style={{padding:"8px",fontWeight:600}}>{r.sto}</td>
              <td style={{padding:"8px",fontWeight:600}}>{r.kaj}</td>
              <td style={{padding:"8px",fontWeight:600}}>{r.ca}</td>
            </tr>
          );})}
        </tbody>
      </table>
    </div>
  );
}

export function DiminutivesScreen({ goBack }) {
  return (
    <div className="scr-wrap">
      
      {H("🐣 Umanjenice","Diminutives — making things small & cute")}
      {DIMWORDS.map(function(d,i){return (
        <div key={i} className="c" style={{marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}} onClick={function(){speak(d.dim)}}>
          <div>
            <span style={{fontSize:15,fontWeight:700}}>{d.base}</span>
            <span style={{color:"#78716c"}}>{" → "}</span>
            <span style={{fontSize:15,fontWeight:700,color:"#16a34a"}}>{d.dim}{" 🔊"}</span>
          </div>
          <div style={{fontSize:12,color:"#78716c"}}>{d.suffix}</div>
        </div>
      );})}
    </div>
  );
}

export function WordFormScreen({ goBack }) {
  return (
    <div className="scr-wrap">
      
      {H("🧩 Word Formation","How prefixes build Croatian vocabulary")}
      {WORDFORM.bases.map(function(b,bi){return (
        <div key={bi} className="c" style={{marginBottom:16}}>
          <div style={{fontSize:16,fontWeight:800,color:"#164e63",marginBottom:10}}>{"Base: "}{b.verb}{" ("}{b.en})</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
            {b.derived.map(function(d,di){return (
              <div key={di} style={{padding:"6px 0",cursor:"pointer",fontSize:14}} onClick={function(){speak(d[0])}}>
                <span style={{fontWeight:700,color:"#0e7490"}}>{d[0]}{" 🔊"}</span>{" — "}<span style={{color:"#78716c",fontSize:12}}>{d[1]}</span>
              </div>
            );})}
          </div>
        </div>
      );})}
    </div>
  );
}

export function ColorQuirkScreen({ goBack }) {
  return (
    <div className="scr-wrap">
      
      {H("🎨 Color Quirks","Colors mean different things in Croatian!")}
      {COLORQUIRK.map(function(q,i){return (
        <div key={i} className="c" style={{marginBottom:10,cursor:"pointer"}} onClick={function(){speak(q.hr)}}>
          <div style={{fontSize:16,fontWeight:700,color:"#164e63"}}>{q.hr}{" 🔊"}</div>
          <div style={{fontSize:14,color:"#0e7490",marginTop:2}}>{"Literal: "}{q.literal}</div>
          <div style={{fontSize:14,fontWeight:600,color:"#16a34a",marginTop:2}}>{"Means: "}{q.means}</div>
        </div>
      );})}
    </div>
  );
}
