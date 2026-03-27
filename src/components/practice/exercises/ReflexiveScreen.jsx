import React, { useState } from 'react';
import { H, speak, shMemo } from '../../../data.jsx';
import { REFLEXIVE } from '../../../data.jsx';
import { rnd } from '../../../lib/random.js';

function ReflexiveScreen({ goBack, award }) {
  const [tab, setTab] = useState("rules");
  const [qIdx] = useState(()=>Math.floor(rnd()*REFLEXIVE.quiz.length));
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

export default ReflexiveScreen;
