import React, { useState } from 'react';
import { H, speak, shMemo } from '../../data.jsx';
import { ASPECT, FALSEFR, DECL, BRZALICE, DIALECTS, DIMWORDS, WORDFORM, COLORQUIRK, SVOJMOJ } from '../../data.jsx';

export function AspectScreen({ goBack }) {
  return (
    <div className="scr-wrap">
      
      {H("🔄 Verb Aspect","Perfective vs Imperfective",goBack)}
      {ASPECT.pairs.map(function(p,i){return (
        <div key={i} className="c" style={{marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            <button style={{fontWeight:700,color:"#dc2626",background:"none",border:"none",cursor:"pointer",fontFamily:"'Outfit',sans-serif",padding:0}} onClick={function(){speak(p.imp)}}>{p.imp}{" 🔊"}</button>
            <button style={{fontWeight:700,color:"#16a34a",background:"none",border:"none",cursor:"pointer",fontFamily:"'Outfit',sans-serif",padding:0}} onClick={function(){speak(p.perf)}}>{p.perf}{" 🔊"}</button>
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
      
      {H("⚠️ False Friends","Croatian words that trick English speakers",goBack)}
      {FALSEFR.map(function(f,i){return (
        <button key={i} className="c" style={{marginBottom:10}} onClick={function(){speak(f.hr)}}>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            <span style={{fontSize:16,fontWeight:800,color:"#dc2626"}}>{f.hr}{" 🔊"}</span>
            <span style={{fontSize:14,color:"#78716c"}}>{"Looks like: "}{f.looks}</span>
          </div>
          <div style={{fontSize:14,fontWeight:600,color:"#16a34a",marginTop:4}}>{"Actually means: "}{f.means}</div>
          {f.ex&&<div style={{fontSize:12,color:"var(--subtext)",fontStyle:"italic",marginTop:2}}>{f.ex}</div>}
        </button>
      );})}
    </div>
  );
}

export function DeclensionScreen({ goBack }) {
  const [dcNoun, sDcNoun] = useState(0);
  const n = DECL.nouns[dcNoun];
  return (
    <div className="scr-wrap">
      
      {H("📝 Noun Declension Trainer","All 7 cases for key nouns",goBack)}
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
        {DECL.nouns.map(function(noun,i){return (
          <button key={i} className={"b "+(dcNoun===i?"bp":"bg")} style={{fontSize:13}} onClick={function(){sDcNoun(i)}}>
            {noun.nom}{" ("}{noun.en})
          </button>
        );})}
      </div>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <tbody>
          {DECL.caseNames.map(function(cs,ci){return (
            <tr key={ci} style={{borderBottom:"1px solid #f3f4f6"}} onClick={function(){speak(n.cases[ci])}} role="button" tabIndex={0} onKeyDown={function(e){if(e.key==="Enter"||e.key===" ")speak(n.cases[ci])}}>
              <td style={{padding:"10px",fontWeight:700,color:"#0e7490"}}>{(ci+1)+". "}{cs}</td>
              <td style={{padding:"10px",fontWeight:600,fontSize:16}}>{n.cases[ci]}{" 🔊"}</td>
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
      
      {H("😝 Brzalice","Croatian Tongue Twisters",goBack)}
      {shMemo("bz",BRZALICE).map(function(b,i){return (
        <div key={i} className="c" style={{marginBottom:12}}>
          <button style={{fontSize:16,fontWeight:700,color:"var(--heading)",background:"none",border:"none",cursor:"pointer",fontFamily:"'Outfit',sans-serif",padding:0,textAlign:"left"}} onClick={function(){speak(b.hr)}}>{b.hr}{" 🔊"}</button>
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
      
      {H("🗺️ Regional Dialects","Štokavski, Kajkavski, Čakavski",goBack)}
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
      
      {H("🐣 Umanjenice","Diminutives — making things small & cute",goBack)}
      {DIMWORDS.map(function(d,i){return (
        <button key={i} className="c" style={{marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}} onClick={function(){speak(d.dim)}}>
          <div>
            <span style={{fontSize:15,fontWeight:700}}>{d.base}</span>
            <span style={{color:"#78716c"}}>{" → "}</span>
            <span style={{fontSize:15,fontWeight:700,color:"#16a34a"}}>{d.dim}{" 🔊"}</span>
          </div>
          <div style={{fontSize:12,color:"var(--subtext)"}}>{d.suffix}</div>
        </button>
      );})}
    </div>
  );
}

export function WordFormScreen({ goBack }) {
  return (
    <div className="scr-wrap">
      
      {H("🧩 Word Formation","How prefixes build Croatian vocabulary",goBack)}
      {WORDFORM.bases.map(function(b,bi){return (
        <div key={bi} className="c" style={{marginBottom:16}}>
          <div style={{fontSize:16,fontWeight:800,color:"#164e63",marginBottom:10}}>{"Base: "}{b.verb}{" ("}{b.en})</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
            {b.derived.map(function(d,di){return (
              <button key={di} style={{padding:"6px 0",fontSize:14,background:"none",border:"none",cursor:"pointer",textAlign:"left",fontFamily:"'Outfit',sans-serif"}} onClick={function(){speak(d[0])}}>
                <span style={{fontWeight:700,color:"#0e7490"}}>{d[0]}{" 🔊"}</span>{" — "}<span style={{color:"var(--subtext)",fontSize:12}}>{d[1]}</span>
              </button>
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

      {H("🎨 Color Quirks","Colors mean different things in Croatian!",goBack)}
      {COLORQUIRK.map(function(q,i){return (
        <button key={i} className="c" style={{marginBottom:10}} onClick={function(){speak(q.hr)}}>
          <div style={{fontSize:16,fontWeight:700,color:"var(--heading)"}}>{q.hr}{" 🔊"}</div>
          <div style={{fontSize:14,color:"#0e7490",marginTop:2}}>{"Literal: "}{q.literal}</div>
          <div style={{fontSize:14,fontWeight:600,color:"#16a34a",marginTop:2}}>{"Means: "}{q.means}</div>
        </button>
      );})}
    </div>
  );
}

export function SvojMojScreen({ goBack, award }) {
  const [quizAnswers, setQuizAnswers] = useState({});

  function handleQuiz(qi, o, correct, note) {
    if(quizAnswers[qi]!==undefined) return;
    setQuizAnswers(prev=>({...prev,[qi]:{chosen:o,note}}));
    if(o===correct && award) award(5);
  }

  return (
    <div className="scr-wrap">
      {H("🪞 "+SVOJMOJ.title,"Reflexive possessive — the native-speaker tell",goBack)}

      <div style={{marginBottom:16,padding:"14px 16px",background:"rgba(124,58,237,.06)",borderRadius:12,borderLeft:"3px solid #7c3aed"}}>
        <div style={{fontSize:13,color:"#4c1d95",lineHeight:1.7}}>{SVOJMOJ.intro}</div>
      </div>

      {/* The Core Rule */}
      <div style={{marginBottom:20,padding:"16px",background:"linear-gradient(135deg,#7c3aed,#5b21b6)",borderRadius:14,color:"white"}}>
        <div style={{fontSize:11,fontWeight:800,opacity:.8,marginBottom:6,letterSpacing:"0.08em"}}>THE RULE</div>
        <div style={{fontSize:13,lineHeight:1.7}}>{SVOJMOJ.rule}</div>
      </div>

      {/* Wrong vs Right pairs */}
      <h3 className="sh">Common Mistakes — Fixed</h3>
      {SVOJMOJ.pairs.map(function(p,pi){return (
        <div key={pi} style={{marginBottom:12,background:"white",borderRadius:14,border:"1px solid rgba(0,0,0,.07)",overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,.04)"}}>
          <div style={{display:"flex",gap:8,padding:"12px 14px"}}>
            <div style={{flex:1,padding:"8px 12px",background:"#fee2e2",borderRadius:10,fontSize:13}}>
              <div style={{fontSize:10,fontWeight:700,color:"#dc2626",marginBottom:4}}>✗ SOUNDS FOREIGN</div>
              <div style={{color:"#7f1d1d",fontStyle:"italic"}}>{p.wrong}</div>
            </div>
            <button style={{flex:1,padding:"8px 12px",background:"#dcfce7",borderRadius:10,fontSize:13,cursor:"pointer",textAlign:"left",fontFamily:"'Outfit',sans-serif",border:"none"}} onClick={function(){speak(p.right)}}>
              <div style={{fontSize:10,fontWeight:700,color:"#16a34a",marginBottom:4}}>✓ NATIVE 🔊</div>
              <div style={{color:"#14532d",fontWeight:700}}>{p.right}</div>
            </button>
          </div>
          <div style={{padding:"0 14px 12px",fontSize:11,color:"#78716c",lineHeight:1.5}}>{p.note}</div>
        </div>
      );})}

      {/* Declension table */}
      <h3 className="sh" style={{marginTop:4}}>Svoj — All Forms</h3>
      <div style={{overflowX:"auto",marginBottom:16}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead>
            <tr style={{background:"#f1f5f9"}}>
              {["Case","Masc","Fem","Neut","Plural"].map(function(h){return (
                <th key={h} style={{padding:"6px 8px",textAlign:"left",fontWeight:700,color:"#44403c",fontSize:11}}>{h}</th>
              );})}
            </tr>
          </thead>
          <tbody>
            {SVOJMOJ.forms.map(function(row,ri){return (
              <tr key={ri} style={{borderBottom:"1px solid #f3f4f6",background:ri%2===0?"white":"#fafaf9"}}>
                <td style={{padding:"6px 8px",fontWeight:700,color:"#7c3aed",fontSize:11}}>{row.case}</td>
                <td style={{padding:"6px 8px",color:"#1c1917"}}>{row.m}</td>
                <td style={{padding:"6px 8px",color:"#1c1917"}}>{row.f}</td>
                <td style={{padding:"6px 8px",color:"#1c1917"}}>{row.n}</td>
                <td style={{padding:"6px 8px",color:"#1c1917"}}>{row.pl}</td>
              </tr>
            );})}
          </tbody>
        </table>
      </div>

      {/* Exceptions */}
      <h3 className="sh">Good to Know</h3>
      {SVOJMOJ.exceptions.map(function(e,ei){return (
        <div key={ei} style={{marginBottom:8,padding:"10px 14px",background:"#fef3c7",borderRadius:10,borderLeft:"3px solid #ca8a04",fontSize:12,color:"#92400e",lineHeight:1.6,display:"flex",gap:8}}>
          <span>{e.icon}</span><span>{e.text}</span>
        </div>
      );})}

      {/* Quiz */}
      <h3 className="sh" style={{marginTop:4}}>🎯 Quick Quiz</h3>
      <div style={{marginBottom:8,padding:"10px 14px",background:"rgba(124,58,237,.06)",borderRadius:10,fontSize:12,color:"#4c1d95"}}>
        Choose <strong>svoj/svoja/svoje/svoje</strong> or the possessive that fits the sentence.
      </div>
      {SVOJMOJ.quiz.map(function(q,qi){return (
        <div key={qi} className="c" style={{marginBottom:12}}>
          <div style={{fontSize:14,fontWeight:700,marginBottom:8,color:"#1c1917"}}>{"🇬🇧 "}{q.q}</div>
          {q.opts.map(function(o,oi){
            const ans = quizAnswers[qi];
            let bg="white",bc="#e7e5e4",col="#1c1917";
            if(ans){
              if(o===q.a){bg="#dcfce7";bc="#16a34a";col="#14532d";}
              else if(o===ans.chosen){bg="#fee2e2";bc="#dc2626";col="#7f1d1d";}
            }
            return (
              <button key={oi} onClick={function(){handleQuiz(qi,o,q.a,q.note)}}
                style={{display:"block",width:"100%",marginBottom:6,textAlign:"left",padding:"10px 14px",borderRadius:10,border:"2px solid "+bc,background:bg,color:col,fontSize:13,fontWeight:600,cursor:"pointer",transition:"all .2s"}}>
                {o}
              </button>
            );
          })}
          {quizAnswers[qi] && (
            <div style={{fontSize:11,lineHeight:1.5,marginTop:4,padding:"6px 10px",background:"rgba(124,58,237,.05)",borderRadius:8,color:"#4c1d95"}}>
              {quizAnswers[qi].chosen===q.a ? "✓ Correct! " : "✗ Answer: "+q.a+" — "}{q.note}
            </div>
          )}
        </div>
      );})}
    </div>
  );
}
