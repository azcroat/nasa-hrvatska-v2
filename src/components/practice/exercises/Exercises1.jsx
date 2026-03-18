import React, { useState } from 'react';
import { H, speak, shMemo } from '../../../data.jsx';
import { REFLEXIVE, FILL_STORIES, CONVMATCH, SCENES, PRONOUNCASE, GENDERDRILL, SENTBUILD, VERBDRILL, VBPERSONS } from '../../../data.jsx';

export function ReflexiveScreen({ goBack, award }) {
  const [tab, setTab] = useState("rules");
  const [qIdx] = useState(()=>Math.floor(Math.random()*REFLEXIVE.quiz.length));
  const [answers, setAnswers] = useState({});
  const tabs = [{id:"rules",label:"SE Rules"},{id:"tenses",label:"All Tenses"},{id:"verbs",label:"Verbs"},{id:"quiz",label:"Quiz"}];
  const TENSE_COLORS = {present:"#0e7490",past:"#7c3aed",future:"#16a34a",negative:"#dc2626"};

  function handleQuiz(qi, o, a) {
    if(answers[qi]!==undefined) return;
    setAnswers(prev=>({...prev,[qi]:o}));
    if(o===a) award(5);
  }

  return (
    <div className="scr-wrap">
      {H("🧲 "+REFLEXIVE.title,"SE verbs — essential for daily Croatian")}
      <div style={{marginBottom:16,padding:"12px 16px",background:"rgba(14,116,144,.06)",borderRadius:12,borderLeft:"3px solid #0e7490"}}>
        <div style={{fontSize:13,color:"#164e63",lineHeight:1.6}}>{REFLEXIVE.intro}</div>
      </div>

      {/* Tab bar */}
      <div style={{display:"flex",gap:6,marginBottom:20,overflowX:"auto",paddingBottom:4}}>
        {tabs.map(function(t){return (
          <button key={t.id} onClick={function(){setTab(t.id)}}
            style={{flex:"0 0 auto",padding:"8px 14px",borderRadius:20,border:"none",fontSize:12,fontWeight:700,cursor:"pointer",
              background:tab===t.id?"#0e7490":"#f1f5f9",color:tab===t.id?"white":"#44403c",transition:"all .2s"}}>
            {t.label}
          </button>
        );})}
      </div>

      {/* Rules Tab */}
      {tab==="rules" && (
        <div>
          <div style={{marginBottom:12,padding:"10px 14px",background:"#fef3c7",borderRadius:10,borderLeft:"3px solid #ca8a04",fontSize:12,color:"#92400e",lineHeight:1.6}}>
            <strong>Key rule:</strong> SE is a <em>clitic</em> — it can never be the first word in a sentence and must follow strict ordering with other short words (sam/si/je/smo/ste/su).
          </div>
          {REFLEXIVE.rules.map(function(r,ri){return (
            <div key={ri} style={{marginBottom:12,background:"white",borderRadius:14,border:"1px solid rgba(0,0,0,.07)",overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,.04)"}}>
              <div style={{padding:"12px 16px",background:"rgba(14,116,144,.04)",borderBottom:"1px solid rgba(14,116,144,.08)",display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:18}}>{r.icon}</span>
                <span style={{fontSize:13,fontWeight:800,color:"#164e63"}}>{r.rule}</span>
              </div>
              <div style={{padding:"12px 16px"}}>
                <div style={{display:"flex",gap:8,marginBottom:8,flexWrap:"wrap"}}>
                  <div style={{flex:1,minWidth:140,padding:"8px 12px",background:"#fee2e2",borderRadius:10,fontSize:12}}>
                    <div style={{fontSize:10,fontWeight:700,color:"#dc2626",marginBottom:3}}>✗ WRONG</div>
                    <div style={{fontStyle:"italic",color:"#7f1d1d"}}>{r.bad}</div>
                  </div>
                  <button style={{flex:1,minWidth:140,padding:"8px 12px",background:"#dcfce7",borderRadius:10,fontSize:12,border:"none",cursor:"pointer",textAlign:"left",fontFamily:"'Outfit',sans-serif"}} onClick={function(){speak(r.good)}}>
                    <div style={{fontSize:10,fontWeight:700,color:"#16a34a",marginBottom:3}}>✓ CORRECT 🔊</div>
                    <div style={{fontWeight:700,color:"#14532d"}}>{r.good}</div>
                  </button>
                </div>
                <div style={{fontSize:11,color:"#78716c",lineHeight:1.5}}>{r.note}</div>
              </div>
            </div>
          );})}
        </div>
      )}

      {/* Tense Structure Tab */}
      {tab==="tenses" && (
        <div>
          <div style={{marginBottom:12,padding:"10px 14px",background:"rgba(14,116,144,.06)",borderRadius:10,fontSize:12,color:"#164e63",lineHeight:1.6}}>
            See how SE moves in <strong>present</strong>, <strong>past</strong>, <strong>future</strong> and <strong>negative</strong> sentences. Tap any sentence to hear it.
          </div>
          {REFLEXIVE.tenseExamples.map(function(ex,ei){return (
            <div key={ei} style={{marginBottom:16,background:"white",borderRadius:14,border:"1px solid rgba(0,0,0,.07)",overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,.04)"}}>
              <div style={{padding:"10px 16px",background:"rgba(14,116,144,.05)",borderBottom:"1px solid rgba(14,116,144,.08)"}}>
                <span style={{fontSize:14,fontWeight:800,color:"#164e63"}}>{ex.verb}</span>
                <span style={{fontSize:12,color:"#78716c",marginLeft:8}}>— {ex.en}</span>
              </div>
              <div style={{padding:"12px 16px",display:"flex",flexDirection:"column",gap:8}}>
                {[
                  {key:"present",label:"PRESENT",data:ex.present},
                  {key:"past",label:"PAST",data:ex.past},
                  {key:"future",label:"FUTURE",data:ex.future},
                  {key:"negative",label:"NEGATIVE",data:ex.negative}
                ].map(function(row){
                  const c=TENSE_COLORS[row.key];
                  return (
                    <div key={row.key} style={{display:"flex",gap:8,alignItems:"flex-start",cursor:"pointer"}} onClick={function(){speak(row.data.hr)}}>
                      <span style={{background:c+"20",color:c,fontSize:9,fontWeight:800,padding:"3px 6px",borderRadius:6,flexShrink:0,marginTop:2}}>{row.label}</span>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:700,color:"#1c1917"}}>{row.data.hr} <span style={{fontSize:12,opacity:.6}}>🔊</span></div>
                        <div style={{fontSize:11,color:"#78716c"}}>{row.data.en}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );})}
        </div>
      )}

      {/* Verbs Tab */}
      {tab==="verbs" && (
        <div>
          {REFLEXIVE.verbs.map(function(v,vi){return (
            <div key={vi} className="c" style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div>
                  <span style={{fontSize:16,fontWeight:800,color:"#164e63"}}>{v.inf}</span>
                  <span style={{fontSize:13,color:"#78716c",marginLeft:8}}>{v.en}</span>
                </div>
                <button style={{background:"none",border:"none",fontSize:16,cursor:"pointer"}} onClick={function(){speak(v.inf)}}>🔊</button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:4,fontSize:12}}>
                {Object.keys(v.forms).map(function(p,pi){return (
                  <div key={pi} style={{padding:"4px 8px",background:"rgba(14,116,144,.04)",borderRadius:10,cursor:"pointer"}} onClick={function(){speak(v.forms[p])}}>
                    <span style={{fontWeight:700,color:"#0e7490"}}>{p}{": "}</span>{v.forms[p]}
                  </div>
                );})}
              </div>
              <div style={{display:"flex",gap:8,marginTop:6,fontSize:12}}>
                <div style={{padding:"4px 8px",background:"#fef3c7",borderRadius:10,cursor:"pointer"}} onClick={function(){speak(v.past.m)}}>{"👨 "}{v.past.m}</div>
                <div style={{padding:"4px 8px",background:"#fce7f3",borderRadius:10,cursor:"pointer"}} onClick={function(){speak(v.past.f)}}>{"👩 "}{v.past.f}</div>
              </div>
            </div>
          );})}
        </div>
      )}

      {/* Quiz Tab */}
      {tab==="quiz" && (
        <div>
          <div style={{marginBottom:12,padding:"10px 14px",background:"rgba(14,116,144,.06)",borderRadius:10,fontSize:12,color:"#164e63"}}>
            Choose the correct Croatian sentence. Pay attention to SE placement!
          </div>
          {REFLEXIVE.quiz.map(function(q,qi){return (
            <div key={qi} className="c" style={{marginBottom:12}}>
              <div style={{fontSize:14,fontWeight:700,marginBottom:10,color:"#1c1917"}}>{"🇬🇧 "}{q.q}</div>
              {q.opts.map(function(o,oi){
                const chosen = answers[qi];
                let bg="white",bc="#e7e5e4",col="#1c1917";
                if(chosen!==undefined){
                  if(o===q.a){bg="#dcfce7";bc="#16a34a";col="#14532d";}
                  else if(o===chosen){bg="#fee2e2";bc="#dc2626";col="#7f1d1d";}
                }
                return (
                  <button key={oi} onClick={function(){handleQuiz(qi,o,q.a)}}
                    style={{display:"block",width:"100%",marginBottom:6,textAlign:"left",padding:"10px 14px",borderRadius:10,border:"2px solid "+bc,background:bg,color:col,fontSize:12,fontWeight:600,cursor:"pointer",transition:"all .2s"}}>
                    {o}
                  </button>
                );
              })}
              {answers[qi]!==undefined && (
                <div style={{fontSize:11,color:"#16a34a",marginTop:4,fontWeight:700}}>
                  {answers[qi]===q.a ? "✓ Correct! +5 XP" : "✗ Correct: "+q.a}
                </div>
              )}
            </div>
          );})}
        </div>
      )}
    </div>
  );
}

export function FillStoryScreen({ goBack, award }) {
  return (
    <div className="scr-wrap">
      
      {H("📝 Story Builder","Read and fill the blanks")}
      {FILL_STORIES.map(function(story,si){return (
        <div key={si} className="c" style={{marginBottom:20}}>
          <div style={{fontSize:16,fontWeight:800,color:"#164e63",marginBottom:10}}>{"📖 "}{story.title}</div>
          {story.story.map(function(s,qi){return (
            <div key={qi} style={{marginBottom:10}}>
              <div style={{fontSize:13,color:"#44403c",marginBottom:4}}>{s.text.replace("_____","______")}</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {s.opts.map(function(o,oi){return (
                  <button key={oi} style={{padding:"6px 12px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:12,fontWeight:600,cursor:"pointer"}}
                    onClick={function(e){const btns=e.target.parentNode.children;for(let i=0;i<btns.length;i++){btns[i].style.background="white";btns[i].style.borderColor="#d6d3d1"}e.target.style.background=o===s.blank?"#dcfce7":"#fee2e2";e.target.style.borderColor=o===s.blank?"#16a34a":"#dc2626";if(o===s.blank)award(3);e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}>
                    {o}
                  </button>
                );})}
              </div>
              <div style={{fontSize:11,color:"#a8a29e",marginTop:2}}>{s.en}</div>
            </div>
          );})}
        </div>
      );})}
    </div>
  );
}

export function ConvMatchScreen({ goBack, award }) {
  return (
    <div className="scr-wrap">
      
      {H("💬 Conversation Match","Pick the right response")}
      {CONVMATCH.map(function(conv,ci){return (
        <div key={ci} className="c" style={{marginBottom:20}}>
          <div style={{fontSize:16,fontWeight:800,color:"#164e63",marginBottom:10}}>{"🗣️ "}{conv.title}</div>
          {conv.pairs.map(function(p,pi){return (
            <div key={pi} style={{marginBottom:12,paddingBottom:12,borderBottom:pi<conv.pairs.length-1?"1px solid #f3f4f6":"none"}}>
              <div style={{fontSize:13,fontWeight:700,color:"#164e63",marginBottom:6,cursor:"pointer"}} onClick={function(){speak(p.q)}}>{"🗣️ "}{p.q}</div>
              {[p.a,p.wrong].sort(function(){return Math.random()-0.5}).map(function(o,oi){return (
                <button key={oi} style={{display:"block",width:"100%",padding:"8px 12px",marginBottom:4,border:"2px solid #e7e5e4",borderRadius:10,background:"white",fontSize:12,textAlign:"left",cursor:"pointer"}}
                  onClick={function(e){e.target.style.background=o===p.a?"#dcfce7":"#fee2e2";e.target.style.borderColor=o===p.a?"#16a34a":"#dc2626";if(o===p.a){award(5);speak(p.a);}e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}>{o}</button>
              );})}
            </div>
          );})}
        </div>
      );})}
    </div>
  );
}

export function ScenesScreen({ goBack }) {
  return (
    <div className="scr-wrap">
      
      {H("🖼️ Describe the Scene","Answer questions about everyday situations")}
      {SCENES.map(function(scene,si){return (
        <div key={si} className="c" style={{marginBottom:16}}>
          <div style={{fontSize:16,fontWeight:800,color:"#164e63",marginBottom:4}}>{scene.title}</div>
          <div style={{fontSize:12,color:"#78716c",marginBottom:10}}>{scene.desc}</div>
          {scene.qs.map(function(q,qi){return (
            <div key={qi} style={{marginBottom:10}}>
              <div style={{fontSize:13,fontWeight:600,color:"#164e63",cursor:"pointer",marginBottom:4}} onClick={function(){speak(q.q)}}>{"🔊 "}{q.q}{q.hint?" ("+q.hint+" ...):":""}</div>
              <div style={{fontSize:12,color:"#78716c"}}>{"🇬🇧 "}{q.en}</div>
            </div>
          );})}
        </div>
      );})}
    </div>
  );
}

export function PronounsScreen({ goBack, award }) {
  return (
    <div className="scr-wrap">
      
      {H("🎯 Pronoun Cases","How ja/ti/on/ona change with prepositions")}
      <div className="c" style={{marginBottom:16,padding:"12px",fontSize:12,background:"rgba(14,116,144,.06)"}}>{PRONOUNCASE.intro}</div>
      <div style={{overflowX:"auto",marginBottom:20}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
          <thead><tr>{["NOM","GEN","DAT","AKU","INST","LOK"].map(function(h,i){return (<th key={i} style={{padding:"6px 4px",background:"#0e7490",color:"white",fontWeight:700}}>{h}</th>);})}</tr></thead>
          <tbody>
            {PRONOUNCASE.table.map(function(r,ri){return (
              <tr key={ri} style={{background:ri%2?"#f0fdfa":"white"}}>
                {[r.nom,r.gen,r.dat,r.aku,r.inst,r.lok].map(function(v,vi){return (
                  <td key={vi} style={{padding:"6px 4px",borderBottom:"1px solid #e7e5e4",cursor:"pointer",fontWeight:vi===0?700:400,color:vi===0?"#0e7490":"#44403c"}} onClick={function(){speak(v)}}>{v}</td>
                );})}
              </tr>
            );})}
          </tbody>
        </table>
      </div>
      <h3 className="sh">🧠 Fill the Blank</h3>
      {shMemo("pc",PRONOUNCASE.quiz,10).map(function(q,qi){return (
        <div key={qi} className="c" style={{marginBottom:10,padding:"10px 14px"}}>
          <div style={{fontSize:13,fontWeight:600,marginBottom:6,cursor:"pointer"}} onClick={function(){speak(q.q.replace("_____",q.a))}}>{"🔊 "}{q.q}</div>
          <div style={{display:"flex",gap:6}}>
            {q.opts.map(function(o,oi){return (
              <button key={oi} style={{padding:"6px 14px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:12,fontWeight:600,cursor:"pointer"}}
                onClick={function(e){e.target.style.background=o===q.a?"#dcfce7":"#fee2e2";e.target.style.borderColor=o===q.a?"#16a34a":"#dc2626";if(o===q.a)award(3);e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}>
                {o}
              </button>
            );})}
          </div>
        </div>
      );})}
    </div>
  );
}

export function GenderDrillScreen({ goBack, award }) {
  const [revealedGenders, setRevealedGenders] = useState({});
  const [revealedPlurals, setRevealedPlurals] = useState({});
  const words = React.useMemo(() => GENDERDRILL.sort.slice().sort(function(){return Math.random()-0.5}).slice(0,12), []);
  return (
    <div className="scr-wrap">

      {H("♂️♀️ Gender, Plurals & Adjectives","Master noun genders and endings")}
      <h3 className="sh">📦 Sort by Gender — tap a word, then tap M / F / N</h3>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:20,pointerEvents:Object.keys(revealedGenders).length===words.length?"none":"auto"}}>
        {words.map(function(w,i){
          const revealed = revealedGenders[i];
          const bg = revealed ? (w.g==="m"?"#dbeafe":w.g==="f"?"#fce7f3":"#dcfce7") : "white";
          const bc = revealed ? (w.g==="m"?"#1e40af":w.g==="f"?"#db2777":"#16a34a") : "#d6d3d1";
          const label = revealed ? w.word+" ("+(w.g==="m"?"♂ M":w.g==="f"?"♀ F":"⚧ N")+")" : w.word;
          return (
            <button key={i} style={{padding:"8px 14px",border:"2px solid "+bc,borderRadius:10,background:bg,fontSize:13,fontWeight:600,cursor:revealed?"default":"pointer"}}
              onClick={function(){if(!revealed){setRevealedGenders(function(prev){return{...prev,[i]:true}});award(2);}}}
            >{label}</button>
          );
        })}
      </div>
      <h3 className="sh">📐 Make it Plural</h3>
      {GENDERDRILL.plurals.slice(0,10).map(function(p,i){return (
        <div key={i} className="c" style={{marginBottom:8,padding:"8px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:14}}><span style={{fontWeight:700,color:"#164e63"}}>{p.s}</span>{" → ?"}</div>
          {revealedPlurals[i]
            ? <span style={{padding:"6px 12px",border:"2px solid #16a34a",borderRadius:10,background:"#dcfce7",fontSize:12,fontWeight:600}}>{p.p}</span>
            : <button style={{padding:"6px 12px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:12,cursor:"pointer"}}
                onClick={function(){setRevealedPlurals(function(prev){return{...prev,[i]:true}});speak(p.p);award(2);}}>Show</button>}
        </div>
      );})}
      <h3 className="sh" style={{marginTop:16}}>🎨 Pick the Right Adjective</h3>
      {GENDERDRILL.adjectives.map(function(a,i){return (
        <div key={i} className="c" style={{marginBottom:8,padding:"10px 14px"}}>
          <div style={{fontSize:13,marginBottom:6}}><span style={{fontWeight:700,color:"#164e63"}}>{a.noun}</span>{" = "}{a.en}{" → _____ "}{a.noun}</div>
          <div style={{display:"flex",gap:6}}>
            {a.opts.map(function(o,oi){return (
              <button key={oi} style={{padding:"6px 14px",border:"2px solid #d6d3d1",borderRadius:10,background:"white",fontSize:12,fontWeight:600,cursor:"pointer"}}
                onClick={function(e){e.target.style.background=o===a.adj?"#dcfce7":"#fee2e2";e.target.style.borderColor=o===a.adj?"#16a34a":"#dc2626";if(o===a.adj){award(3);speak(a.adj+" "+a.noun);}e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}>
                {o}
              </button>
            );})}
          </div>
        </div>
      );})}
    </div>
  );
}

export function SentenceBuilderScreen({ goBack, award }) {
  return (
    <div className="scr-wrap">
      
      {H("🏗️ Build the Sentence","Translate English to Croatian")}
      <div className="c" style={{marginBottom:12,padding:"10px 14px",background:"rgba(14,116,144,.06)",fontSize:12,color:"#164e63"}}>🇬🇧 Read the English sentence, then pick the correct Croatian translation.</div>
      {shMemo("sb",SENTBUILD,15).map(function(s,i){return (
        <div key={i} className="c" style={{marginBottom:10,padding:"10px 14px"}}>
          <div style={{fontSize:14,fontWeight:700,color:"#164e63",marginBottom:6}}>{"🇬🇧 "}{s.en}</div>
          {s.opts.map(function(o,oi){return (
            <button key={oi} style={{display:"block",width:"100%",padding:"8px 12px",marginBottom:4,border:"2px solid #e7e5e4",borderRadius:10,background:"white",fontSize:13,textAlign:"left",cursor:"pointer"}}
              onClick={function(e){e.target.style.background=o===s.hr?"#dcfce7":"#fee2e2";e.target.style.borderColor=o===s.hr?"#16a34a":"#dc2626";if(o===s.hr){award(5);speak(s.hr);}e.target.closest&&e.target.closest("div")&&(e.target.closest("div").style.pointerEvents="none")}}>
              {"🇭🇷 "}{o}
            </button>
          );})}
        </div>
      );})}
    </div>
  );
}

export function VerbDrillScreen({ goBack }) {
  return (
    <div className="scr-wrap">
      
      {H("💪 20 Essential Verbs","Full present tense conjugation")}
      <div className="c" style={{marginBottom:12,padding:"10px 14px",background:"rgba(14,116,144,.06)",fontSize:12}}>💡 Tap any form to hear it. Learn all 6 persons for each verb.</div>
      {shMemo("vd",VERBDRILL).map(function(v,vi){return (
        <div key={vi} className="c" style={{marginBottom:10,padding:0,overflow:"hidden"}}>
          <div style={{padding:"8px 14px",background:"linear-gradient(135deg,#0e7490,#164e63)",color:"white",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}} onClick={function(){speak(v.inf)}}>
            <span style={{fontWeight:800}}>{v.inf}</span>
            <span style={{fontSize:12,opacity:.7}}>{v.en}</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0}}>
            {v.forms.map(function(f,fi){return (
              <div key={fi} style={{padding:"6px 12px",borderBottom:"1px solid #f0fdfa",borderRight:fi%2===0?"1px solid #f0fdfa":"none",fontSize:12,cursor:"pointer",display:"flex",gap:6}} onClick={function(){speak(f)}}>
                <span style={{fontWeight:700,color:"#0e7490",minWidth:50}}>{VBPERSONS[fi]}</span>
                <span>{f}</span>
              </div>
            );})}
          </div>
        </div>
      );})}
    </div>
  );
}
