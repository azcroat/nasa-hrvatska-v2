import React, { useState } from 'react';
import { H, speak } from '../../data.jsx';
import { REGIONS, ROLEPLAY, RECIPES, CROATIAN_CITIES, getCityOfDay } from '../../data.jsx';
import { rnd } from '../../lib/random.js';

export function RegionScreen({ regionKey, goBack }) {
  const [tab, setTab] = useState("overview");
  const [quizI, setQuizI] = useState(0);
  const [quizSel, setQuizSel] = useState(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const [expandedPerson, setExpandedPerson] = useState(null);
  const r = REGIONS[regionKey];

  const TABS = [
    {id:"overview", label:"Overview", icon:"📖"},
    {id:"timeline", label:"Timeline", icon:"📅"},
    {id:"people", label:"People", icon:"👥"},
    {id:"language", label:"Language", icon:"💬"},
    {id:"quiz", label:"Quiz", icon:"🎯"},
  ];

  function resetQuiz() {
    setQuizI(0); setQuizSel(null); setQuizScore(0); setQuizDone(false);
  }

  function handleQuizAnswer(opt) {
    if (quizSel !== null) return;
    setQuizSel(opt);
    const correct = opt === r.quiz[quizI].a;
    if (correct) setQuizScore(s => s + 1);
    setTimeout(() => {
      if (quizI < r.quiz.length - 1) { setQuizI(i => i + 1); setQuizSel(null); }
      else setQuizDone(true);
    }, 1400);
  }

  const accentColor = r.color || "#0e7490";
  const bgLight = accentColor + "12";

  return (
    <div className="scr-wrap">
      {/* Header */}
      <div style={{background:`linear-gradient(135deg,${accentColor},${accentColor}cc)`,borderRadius:18,padding:"20px",marginBottom:20,color:"white"}}>
        <div style={{fontSize:36,marginBottom:8}}>{r.icon || "🗺️"}</div>
        <div style={{fontSize:20,fontWeight:900,marginBottom:4}}>{r.title}</div>
        <div style={{fontSize:13,opacity:.85,marginBottom:10}}>{r.sub}</div>
        <div style={{fontSize:13,lineHeight:1.6,opacity:.9}}>{r.intro}</div>
      </div>

      {/* Tab bar */}
      <div style={{display:"flex",gap:6,marginBottom:20,overflowX:"auto",paddingBottom:4}}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{flexShrink:0,padding:"8px 14px",borderRadius:20,border:"none",cursor:"pointer",
              fontWeight:700,fontSize:12,
              background:tab===t.id ? accentColor : "rgba(0,0,0,.06)",
              color:tab===t.id ? "white" : "#44403c"}}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === "overview" && (
        <div>
          {r.sections.map(function(s,i){return (
            <div key={i} className="c" style={{marginBottom:14,borderLeft:`4px solid ${accentColor}`,padding:"14px 16px"}}>
              <div style={{fontSize:14,fontWeight:800,color:accentColor,marginBottom:8}}>{s.h}</div>
              <div style={{fontSize:13,lineHeight:1.8,color:"#44403c"}}>{s.t}</div>
            </div>
          );})}
          {r.facts && r.facts.length > 0 && (
            <div style={{marginTop:20}}>
              <div style={{fontSize:14,fontWeight:800,color:"#164e63",marginBottom:12}}>💡 Did You Know?</div>
              {r.facts.map(function(f,i){return (
                <div key={i} style={{display:"flex",gap:12,padding:"12px 14px",background:bgLight,borderRadius:12,marginBottom:8,alignItems:"flex-start"}}>
                  <div style={{fontSize:18,flexShrink:0}}>⚡</div>
                  <div style={{fontSize:13,lineHeight:1.6,color:"#1c1917"}}>{f}</div>
                </div>
              );})}
            </div>
          )}
        </div>
      )}

      {/* TIMELINE */}
      {tab === "timeline" && r.timeline && (
        <div>
          <div style={{fontSize:13,color:"#78716c",marginBottom:16}}>Swipe through {r.timeline.length} key moments in history</div>
          <div style={{position:"relative",paddingLeft:20}}>
            <div style={{position:"absolute",left:9,top:0,bottom:0,width:2,background:`linear-gradient(${accentColor},${accentColor}40)`}}/>
            {r.timeline.map(function(t,i){return (
              <div key={i} style={{display:"flex",gap:16,marginBottom:20,position:"relative"}}>
                <div style={{width:18,height:18,borderRadius:"50%",background:accentColor,flexShrink:0,marginTop:2,border:"3px solid white",boxShadow:`0 0 0 2px ${accentColor}`}}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:800,color:accentColor,marginBottom:3}}>{t.year}</div>
                  <div style={{fontSize:13,lineHeight:1.6,color:"#1c1917"}}>{t.event}</div>
                </div>
              </div>
            );})}
          </div>
        </div>
      )}

      {/* PEOPLE */}
      {tab === "people" && r.people && (
        <div>
          <div style={{fontSize:13,color:"#78716c",marginBottom:16}}>Notable figures from {r.title}</div>
          {r.people.map(function(p,i){const open = expandedPerson === i; return (
            <div key={i} className="c" style={{marginBottom:12,cursor:"pointer"}} onClick={() => setExpandedPerson(open ? null : i)}>
              <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                <div style={{width:48,height:48,borderRadius:24,background:accentColor+"20",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>
                  👤
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:800,color:"#164e63"}}>{p.name}</div>
                  <div style={{fontSize:12,color:accentColor,fontWeight:700}}>{p.years}</div>
                  <div style={{fontSize:12,color:"#78716c"}}>{p.role}</div>
                </div>
                <div style={{fontSize:16,color:"#78716c"}}>{open ? "▲" : "▼"}</div>
              </div>
              {open && (
                <div style={{marginTop:12,paddingTop:12,borderTop:"1px solid rgba(0,0,0,.08)"}}>
                  <div style={{fontSize:13,lineHeight:1.8,color:"#44403c"}}>{p.story}</div>
                </div>
              )}
            </div>
          );})}
        </div>
      )}

      {/* LANGUAGE */}
      {tab === "language" && r.vocab && (
        <div>
          <div style={{fontSize:13,color:"#78716c",marginBottom:16}}>Local words, dialect terms & cultural vocabulary</div>
          {r.vocab.map(function(v,i){return (
            <div key={i} style={{padding:"14px",background:"white",borderRadius:14,border:"1px solid rgba(0,0,0,.07)",marginBottom:10,
              boxShadow:"0 1px 4px rgba(0,0,0,.05)"}}>
              <div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:4}}>
                <span style={{fontSize:16,fontWeight:900,color:accentColor}}>{v.hr}</span>
                <span style={{fontSize:13,color:"#44403c",fontWeight:600}}>{v.en}</span>
              </div>
              {v.note && <div style={{fontSize:12,color:"#78716c",lineHeight:1.5,fontStyle:"italic"}}>{v.note}</div>}
            </div>
          );})}
        </div>
      )}

      {/* QUIZ */}
      {tab === "quiz" && r.quiz && (
        <div>
          {!quizDone ? (
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div style={{fontSize:13,fontWeight:700,color:"#164e63"}}>Question {quizI + 1} / {r.quiz.length}</div>
                <div style={{fontSize:13,fontWeight:700,color:accentColor}}>Score: {quizScore}</div>
              </div>
              <div style={{background:`linear-gradient(135deg,${bgLight},${accentColor}18)`,borderRadius:16,padding:"20px",marginBottom:20}}>
                <div style={{fontSize:15,fontWeight:800,lineHeight:1.5,color:"#1c1917"}}>{r.quiz[quizI].q}</div>
              </div>
              {[r.quiz[quizI].a, ...r.quiz[quizI].al].sort(() => 0.5 - rnd()).map(function(opt,i){
                const chosen = quizSel === opt;
                const correct = opt === r.quiz[quizI].a;
                const revealed = quizSel !== null;
                let bg = "white", border = "1px solid rgba(0,0,0,.08)", color = "#1c1917";
                if (revealed && correct) { bg = "#dcfce7"; border = "2px solid #16a34a"; color = "#166534"; }
                else if (revealed && chosen && !correct) { bg = "#fee2e2"; border = "2px solid #dc2626"; color = "#991b1b"; }
                return (
                  <div key={i} onClick={() => handleQuizAnswer(opt)}
                    style={{padding:"14px 16px",background:bg,border,borderRadius:12,marginBottom:8,cursor:"pointer",
                      fontSize:14,fontWeight:600,color,transition:"all .2s"}}>
                    {revealed && correct && "✅ "}{revealed && chosen && !correct && "❌ "}{opt}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{textAlign:"center",padding:"32px 20px"}}>
              <div style={{fontSize:48,marginBottom:12}}>{quizScore >= r.quiz.length * 0.8 ? "🏆" : quizScore >= r.quiz.length * 0.5 ? "👏" : "📚"}</div>
              <div style={{fontSize:22,fontWeight:900,color:accentColor,marginBottom:8}}>
                {quizScore} / {r.quiz.length}
              </div>
              <div style={{fontSize:15,color:"#44403c",marginBottom:24}}>
                {quizScore === r.quiz.length ? "Perfect! You know this region well!" :
                 quizScore >= r.quiz.length * 0.8 ? "Excellent knowledge!" :
                 quizScore >= r.quiz.length * 0.5 ? "Good — read the overview again for the rest." :
                 "Review the history sections and try again!"}
              </div>
              <button className="b bp" onClick={resetQuiz}>Try Again</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function RoleplayScreen({ goBack }) {
  const [rpIdx, setRpIdx] = useState(0);
  const [rpLine, setRpLine] = useState(0);
  const [rpShow, setRpShow] = useState(false);
  const r = ROLEPLAY[rpIdx];
  return (
    <div className="scr-wrap">
      
      {H("🎭 Conversation Role-Play","Practice real-life dialogues")}
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
        {ROLEPLAY.map(function(rp,i){return (
          <button key={i} className={"b "+(rpIdx===i?"bp":"bg")} style={{fontSize:12}}
            onClick={function(){setRpIdx(i);setRpLine(0);setRpShow(false)}}>
            {rp.title}
          </button>
        );})}
      </div>
      <div className="c" style={{marginBottom:16,borderLeft:"4px solid #7c3aed",background:"linear-gradient(135deg,#f5f3ff,#ede9fe)"}}>
        <div style={{fontSize:16,fontWeight:800,color:"#7c3aed"}}>{r.title}</div>
        <div style={{fontSize:13,color:"#78716c"}}>{r.en}</div>
      </div>
      {r.lines.slice(0,rpLine+1).map(function(l,i){return (
        <div key={i} style={{display:"flex",justifyContent:l.you?"flex-end":"flex-start",marginBottom:8}}>
          <div style={{maxWidth:"80%",padding:"12px 16px",borderRadius:l.you?"16px 16px 4px 16px":"16px 16px 16px 4px",
            background:l.you?"linear-gradient(135deg,#0e7490,#164e63)":"rgba(255,255,255,.8)",
            color:l.you?"white":"#1c1917",cursor:"pointer",border:l.you?"none":"1px solid #e7e5e4"}}
            onClick={function(){speak(l.text)}}>
            <div style={{fontSize:11,fontWeight:700,marginBottom:4,opacity:.7}}>{l.speaker}</div>
            <div style={{fontSize:15,fontWeight:600}}>{l.text}{" 🔊"}</div>
            {rpShow&&<div style={{fontSize:12,marginTop:4,opacity:.7,fontStyle:"italic"}}>{l.en}</div>}
          </div>
        </div>
      );})}
      <div style={{display:"flex",gap:8,marginTop:16}}>
        {rpLine<r.lines.length-1&&<button className="b bp" style={{flex:1}} onClick={function(){setRpLine(rpLine+1)}}>Next Line →</button>}
        <button className="b bg" onClick={function(){setRpShow(!rpShow)}}>{rpShow?"Hide English":"Show English"}</button>
        {rpLine>=r.lines.length-1&&<button className="b bp" style={{flex:1}} onClick={function(){setRpLine(0);setRpShow(false);if(rpIdx<ROLEPLAY.length-1)setRpIdx(rpIdx+1)}}>↻ Next Scenario</button>}
      </div>
    </div>
  );
}

export function RecipesScreen({ goBack }) {
  const [rcIdx, setRcIdx] = useState(0);
  const [rcServ, setRcServ] = useState(RECIPES[0].servings);
  const r = RECIPES[rcIdx];
  const scale = rcServ / r.servings;
  return (
    <div className="scr-wrap">
      
      {H("🍳 Croatian Recipes","Cook & learn vocabulary")}
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
        {RECIPES.map(function(rec,i){return (
          <button key={i} className={"b "+(rcIdx===i?"bp":"bg")} style={{fontSize:13}}
            onClick={function(){setRcIdx(i);setRcServ(rec.servings)}}>
            {rec.name}
          </button>
        );})}
      </div>
      <div className="c" style={{marginBottom:16,borderLeft:"4px solid #f59e0b"}}>
        <div style={{fontSize:18,fontWeight:800,color:"#164e63"}}>{r.name}</div>
        <div style={{fontSize:14,color:"#78716c"}}>{r.en}{" • "}{r.time}{" min"}</div>
        <div style={{display:"flex",alignItems:"center",gap:10,marginTop:10}}>
          <span style={{fontSize:13,fontWeight:700}}>Servings:</span>
          <button style={{width:32,height:32,borderRadius:"50%",border:"2px solid #0e7490",background:"white",fontWeight:800,fontSize:16,cursor:"pointer"}} onClick={function(){if(rcServ>1)setRcServ(rcServ-1)}}>-</button>
          <span style={{fontSize:20,fontWeight:800,minWidth:30,textAlign:"center"}}>{rcServ}</span>
          <button style={{width:32,height:32,borderRadius:"50%",border:"2px solid #0e7490",background:"white",fontWeight:800,fontSize:16,cursor:"pointer"}} onClick={function(){setRcServ(rcServ+1)}}>+</button>
        </div>
      </div>
      <h3 className="sh">🥚 Ingredients (scaled)</h3>
      {r.ing.map(function(ig,i){const amt=ig[0];const num=parseFloat(amt);const unit=amt.replace(/[0-9./]+/g,"").trim();const scaled=!isNaN(num)?Math.round(num*scale*10)/10+unit:amt;return (
        <div key={i} style={{padding:"6px 0",fontSize:14,borderBottom:"1px solid #f3f4f6",display:"flex",gap:8,cursor:"pointer"}} onClick={function(){speak(ig[1].split("(")[0])}}>
          <span style={{fontWeight:800,color:"#0e7490",minWidth:60}}>{scaled}</span>
          <span>{ig[1]}{" 🔊"}</span>
        </div>
      );})}
      <h3 className="sh" style={{marginTop:16}}>👨‍🍳 Steps</h3>
      {r.steps.map(function(s,i){return (
        <div key={i} className="c" style={{marginBottom:8,display:"flex",gap:12,cursor:"pointer"}} onClick={function(){speak(s.split("(")[0])}}>
          <div style={{width:28,height:28,borderRadius:"50%",background:"#0e7490",color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,flexShrink:0}}>{i+1}</div>
          <div style={{fontSize:14,lineHeight:1.6}}>{s}{" 🔊"}</div>
        </div>
      );})}
    </div>
  );
}

export function CityOfDayScreen({ goBack }) {
  const [tab, setTab] = useState("overview");
  const city = getCityOfDay();
  const tomorrow = (function(){const d=new Date();d.setDate(d.getDate()+1);return d.toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"});})();
  const tabs = [{id:"overview",label:"Overview",icon:"📖"},{id:"history",label:"History",icon:"🏛️"},{id:"vocab",label:"Vocabulary",icon:"💬"},{id:"facts",label:"Fast Facts",icon:"⚡"}];

  return (
    <div className="scr-wrap">
      {/* Hero */}
      <div style={{marginBottom:20,borderRadius:20,overflow:"hidden",boxShadow:"0 8px 32px rgba(0,0,0,.15)"}}>
        <div style={{background:"linear-gradient(145deg,"+city.color+"dd,"+city.color+")",padding:"28px 20px 20px",position:"relative"}}>
          <div style={{position:"absolute",top:16,right:16,background:"rgba(0,0,0,.25)",borderRadius:20,padding:"4px 10px",fontSize:10,fontWeight:800,color:"white",letterSpacing:"0.06em"}}>
            CITY OF THE DAY
          </div>
          <div style={{fontSize:48,marginBottom:8}}>{city.icon}</div>
          <div style={{fontSize:26,fontWeight:900,color:"white",letterSpacing:"-.02em",lineHeight:1.15}}>{city.name}</div>
          <div style={{fontSize:13,color:"rgba(255,255,255,.75)",marginTop:4,fontWeight:600}}>{city.region} · Croatia</div>
          <div style={{marginTop:10,display:"inline-block",background:"rgba(255,255,255,.18)",borderRadius:20,padding:"5px 12px",fontSize:12,fontWeight:700,color:"white",fontStyle:"italic"}}>
            "{city.tagline}"
          </div>
        </div>
        <div style={{background:"rgba(0,0,0,.6)",padding:"10px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:11,color:"rgba(255,255,255,.7)"}}>🔄 New city tomorrow — {tomorrow}</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,.5)",fontWeight:600}}>{CROATIAN_CITIES.length} cities in rotation</div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{display:"flex",gap:0,marginBottom:20,borderBottom:"2px solid #f1f5f9"}}>
        {tabs.map(function(t){
          const active=tab===t.id;
          return (
            <button key={t.id} onClick={function(){setTab(t.id)}}
              style={{flex:1,padding:"10px 6px",border:"none",borderBottom:active?"2.5px solid "+city.color:"2.5px solid transparent",
                background:"transparent",fontSize:11,fontWeight:active?800:500,
                color:active?city.color:"#78716c",cursor:"pointer",transition:"all .18s",
                marginBottom:"-2px",whiteSpace:"nowrap"}}>
              {t.icon} {t.label}
            </button>
          );
        })}
      </div>

      {/* Overview — introduction only */}
      {tab==="overview" && (
        <div>
          <div style={{marginBottom:16,padding:"16px",background:city.color+"0e",borderRadius:14,borderLeft:"4px solid "+city.color,fontSize:14,lineHeight:1.8,color:"#1c1917"}}>
            {city.intro}
          </div>
          <div style={{marginBottom:16,padding:"14px 16px",background:"white",borderRadius:14,border:"1px solid rgba(0,0,0,.07)",boxShadow:"0 1px 4px rgba(0,0,0,.05)"}}>
            <div style={{fontSize:11,fontWeight:800,color:"#78716c",marginBottom:8,letterSpacing:"0.06em",textTransform:"uppercase"}}>At a glance</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              <span style={{background:city.color+"18",color:city.color,fontSize:12,fontWeight:700,padding:"5px 12px",borderRadius:20}}>📍 {city.region}</span>
              <span style={{background:"rgba(14,116,144,.1)",color:"#0e7490",fontSize:12,fontWeight:700,padding:"5px 12px",borderRadius:20}}>📚 {city.vocab.length} vocabulary words</span>
              <span style={{background:"rgba(245,158,11,.1)",color:"#b45309",fontSize:12,fontWeight:700,padding:"5px 12px",borderRadius:20}}>🏛️ {city.facts.length} historical facts</span>
            </div>
          </div>
          <div style={{padding:"14px 16px",background:"linear-gradient(135deg,#f0f9ff,#e0f2fe)",borderRadius:14,borderLeft:"4px solid "+city.color}}>
            <div style={{fontSize:11,fontWeight:800,color:city.color,marginBottom:6,letterSpacing:"0.06em",textTransform:"uppercase"}}>Local saying</div>
            <div style={{fontSize:14,fontStyle:"italic",color:"#1c1917",lineHeight:1.6}}>"{city.tagline}"</div>
          </div>
        </div>
      )}

      {/* History — narrative + first half of facts */}
      {tab==="history" && (function(){
        const half = Math.ceil(city.facts.length / 2);
        const histFacts = city.facts.slice(0, half);
        return (
          <div>
            <div style={{marginBottom:16,padding:"16px",background:"white",borderRadius:14,border:"1px solid rgba(0,0,0,.07)",boxShadow:"0 1px 4px rgba(0,0,0,.05)",fontSize:14,lineHeight:1.8,color:"#44403c"}}>
              {city.history}
            </div>
            <div style={{marginBottom:12,fontSize:13,fontWeight:800,color:"#164e63"}}>
              🏛️ Key Historical Facts
            </div>
            {histFacts.map(function(f,fi){return (
              <div key={fi} style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:10,padding:"12px 14px",background:"white",borderRadius:12,border:"1px solid rgba(0,0,0,.06)",boxShadow:"0 1px 3px rgba(0,0,0,.04)"}}>
                <div style={{width:26,height:26,borderRadius:"50%",background:city.color,color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,flexShrink:0}}>
                  {fi+1}
                </div>
                <div style={{fontSize:13,color:"#1c1917",lineHeight:1.6,flex:1}}>{f}</div>
              </div>
            );})}
          </div>
        );
      })()}

      {/* Vocabulary — tap to hear */}
      {tab==="vocab" && (
        <div>
          <div style={{marginBottom:12,padding:"10px 14px",background:city.color+"0e",borderRadius:10,fontSize:12,color:city.color,fontWeight:700}}>
            Words and phrases connected to {city.name} — tap to hear
          </div>
          {city.vocab.map(function(v,vi){return (
            <div key={vi} style={{marginBottom:10,background:"white",borderRadius:14,border:"1px solid rgba(0,0,0,.06)",overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,.05)",cursor:"pointer"}}
              onClick={function(){speak(v.hr)}}>
              <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px"}}>
                <div style={{width:4,alignSelf:"stretch",background:city.color,borderRadius:2,flexShrink:0}} />
                <div style={{flex:1}}>
                  <div style={{fontSize:17,fontWeight:800,color:city.color,marginBottom:3}}>{v.hr} <span style={{fontSize:14,opacity:.5}}>🔊</span></div>
                  <div style={{fontSize:13,color:"#44403c",fontWeight:600,marginBottom:4}}>{v.en}</div>
                  {v.note && <div style={{fontSize:12,color:"#78716c",lineHeight:1.5}}>{v.note}</div>}
                </div>
              </div>
            </div>
          );})}
        </div>
      )}

      {/* Fast Facts — didYouKnow + second half of facts */}
      {tab==="facts" && (function(){
        const half = Math.ceil(city.facts.length / 2);
        const fastFacts = city.facts.slice(half);
        const allFacts = [city.didYouKnow].concat(fastFacts);
        return (
          <div>
            <div style={{fontSize:15,fontWeight:800,color:"#164e63",marginBottom:14}}>💡 Did You Know?</div>
            {allFacts.map(function(fact, i){
              return (
                <div key={i} style={{marginBottom:10,padding:"14px 16px",background:"white",borderRadius:14,border:"1px solid rgba(0,0,0,.07)",boxShadow:"0 1px 4px rgba(0,0,0,.05)"}}>
                  <div style={{fontSize:13,color:"#1c1917",lineHeight:1.7}}>{fact}</div>
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}
