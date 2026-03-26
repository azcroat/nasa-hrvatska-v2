import React, { useState, useRef } from 'react';
import { H } from '../../data.jsx';
import { useOnlineStatus } from '../../hooks/useOnlineStatus.js';
import { rnd } from '../../lib/random.js';
import { useApp } from '../../context/AppContext.jsx';

const PROMPTS = [
  // A2 — simple present, basic vocabulary
  {en:"Describe your morning routine",hr:"Opiši svoju jutarnju rutinu",level:"A2",focus:"Present tense + daily verbs"},
  {en:"Write about your family",hr:"Napiši o svojoj obitelji",level:"A2",focus:"Verb 'biti' + nominative"},
  {en:"Describe the weather today",hr:"Opiši današnje vrijeme",level:"A2",focus:"Adjective agreement"},
  {en:"Write about where you live",hr:"Napiši o tome gdje živiš",level:"A2",focus:"Locative case (u/na + place)"},
  // B1 — past tense, accusative, broader vocabulary
  {en:"Describe a typical day in Croatia",hr:"Opiši tipičan dan u Hrvatskoj",level:"B1",focus:"Past tense (perfective/imperfective)"},
  {en:"Write about your hobby",hr:"Opiši svoj hobi",level:"B1",focus:"Accusative case"},
  {en:"Write a short text about Croatia",hr:"Napiši kratki tekst o Hrvatskoj",level:"B1",focus:"Culture vocabulary"},
  {en:"Describe a Croatian city you know",hr:"Opiši hrvatski grad koji poznaješ",level:"B1",focus:"Genitive + prepositions"},
  {en:"Write about your favorite Croatian food",hr:"Napiši o svojoj omiljenoj hrvatskoj hrani",level:"B1",focus:"Adjective-noun agreement"},
  {en:"Write about a recent trip or outing",hr:"Napiši o nedavnom putovanju ili izletu",level:"B1",focus:"Past tense + travel vocabulary"},
  // B2 — conditional, complex sentences
  {en:"If you could live in Croatia, where would you choose?",hr:"Kad bi mogao/mogla živjeti u Hrvatskoj, gdje bi odabrao/la?",level:"B2",focus:"Conditional mood (bih/bi)"},
  {en:"Describe a conversation you had recently",hr:"Opiši razgovor koji si nedavno imao/imala",level:"B2",focus:"Reported speech + past tense"},
  {en:"Write about Croatian culture or customs you admire",hr:"Napiši o hrvatskoj kulturi ili običajima koji ti se sviđaju",level:"B2",focus:"Relative clauses"},
  {en:"Why do you learn Croatian? Write a short letter.",hr:"Zašto učiš hrvatski? Napiši kratko pismo.",level:"B2",focus:"Modal verbs + dative"},
  {en:"Compare life in Croatia with your home country",hr:"Usporedi život u Hrvatskoj s tvojom domovinom",level:"B2",focus:"Comparatives + contrast conjunctions"},
  // C1 — subjunctive-like structures, all 7 cases, complex syntax
  {en:"Describe what would need to change for you to speak Croatian fluently",hr:"Opiši što bi trebalo promijeniti da govoriš tečno hrvatski",level:"C1",focus:"da + present tense (subjunctive pattern)"},
  {en:"Write a persuasive paragraph: why is Croatian worth learning?",hr:"Napiši uvjerljiv odlomak: zašto je vrijedno učiti hrvatski?",level:"C1",focus:"Complex clauses + formal register"},
  {en:"Describe a family tradition in Croatian",hr:"Opiši obiteljsku tradiciju na hrvatskom",level:"C1",focus:"All 7 cases in natural context"},
  {en:"Write about something you wish had been different",hr:"Napiši o nečemu što bi željeo/željela promijeniti",level:"C1",focus:"Conditional + past tense contrast"},
  {en:"Write about why you learn Croatian",hr:"Napiši zašto učiš hrvatski",level:"A2",focus:"Basic sentence structure"},
];

export default function WritingScreen({ goBack, award }) {
  const finishFired = useRef(false);
  const isOnline = useOnlineStatus();
  const { level: userLevel } = useApp();
  const [promptIdx, setPromptIdx] = useState(() => Math.floor(rnd() * PROMPTS.length));
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const prompt = PROMPTS[promptIdx];

  async function checkWithAI() {
    if (!text.trim() || text.trim().length < 10) {
      setError("Please write at least a sentence or two in Croatian.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/correct", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
          mode: "writeeval",
          prompt: prompt.en,
          text: text.trim(),
          params: { level: userLevel, writingPrompt: prompt.en },
        }),
      });
      if (!res.ok) throw new Error("API error " + res.status);
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError("Could not connect to AI correction service. Check your connection.");
    }
    setLoading(false);
  }

  function newPrompt() {
    finishFired.current = false;
    setText("");
    setResult(null);
    setError("");
    setPromptIdx(function(cur) {
      const next = Math.floor(rnd() * (PROMPTS.length - 1));
      return next >= cur ? next + 1 : next;
    });
  }

  return (
    <div className="scr-wrap">
      {H("✍️ Free Writing")}
      <div className="c" style={{padding:"20px",marginBottom:16}}>
        <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:4}}>
          <span style={{fontSize:20}}>📝</span>
          <div style={{flex:1}}>
            <div style={{display:"flex",gap:6,marginBottom:6,flexWrap:"wrap"}}>
              {prompt.level && <span style={{fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:20,background:prompt.level==="A2"?"#dcfce7":prompt.level==="B1"?"#fef9c3":prompt.level==="B2"?"#fef3c7":"#ede9fe",color:prompt.level==="A2"?"#16a34a":prompt.level==="B1"?"#a16207":prompt.level==="B2"?"#b45309":"#7c3aed"}}>{prompt.level}</span>}
              {prompt.focus && <span style={{fontSize:11,color:"var(--subtext)",fontStyle:"italic",padding:"2px 0"}}>📌 {prompt.focus}</span>}
            </div>
            <p style={{fontWeight:800,fontSize:15,color:"var(--heading)",margin:0}}>{prompt.en}</p>
            <p style={{fontSize:13,color:"var(--subtext)",marginTop:2,fontStyle:"italic"}}>{prompt.hr}</p>
          </div>
        </div>
      </div>
      <div className="c" style={{padding:"16px"}}>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Write in Croatian here... (Piši na hrvatskom...)"
          style={{
            width:"100%",minHeight:140,padding:"12px",fontSize:15,
            border:"1.5px solid var(--card-b)",borderRadius:10,
            fontFamily:"'Outfit',sans-serif",resize:"vertical",
            background:"var(--card)",color:"var(--heading)",
            boxSizing:"border-box",
          }}
        />
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:4}}>
          <span style={{fontSize:12,color:"var(--subtext)"}}>{text.length} characters</span>
          <button style={{background:"none",border:"none",cursor:"pointer",fontSize:12,color:"#7c3aed",fontWeight:600}} onClick={newPrompt}>
            🔄 New Prompt
          </button>
        </div>
        {error && <p style={{color:"var(--error)",fontSize:13,marginTop:8}}>{error}</p>}
        <div style={{fontSize:11,color:"var(--subtext)",marginTop:10,lineHeight:1.5}}>
          🔒 Your text is sent to an AI for grammar feedback. It is not stored or used for training.
        </div>
        <button
          className="b bp"
          style={{width:"100%",marginTop:8,transition:'transform .15s ease,box-shadow .15s ease'}}
          onClick={checkWithAI}
          disabled={loading || !isOnline}>
          {!isOnline ? "📶 Offline — AI check unavailable" : loading ? (
            <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,fontSize:'var(--text-sm)',color:'inherit'}}>
              <span style={{animation:'spin .8s linear infinite',display:'inline-block',lineHeight:1}}>⟳</span> Checking your Croatian...
            </span>
          ) : "🤖 Check with AI"}
        </button>
      </div>
      {result && (
        <div className="c" style={{padding:"20px",marginTop:0,animation:'fadeIn .3s ease'}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
            <div style={{fontSize:40}}>{result.score>=80?"🌟":result.score>=60?"🎉":"💪"}</div>
            <div>
              <p style={{fontWeight:800,fontSize:18,color:"var(--heading)",margin:0}}>Score: {result.score}/100</p>
              <p style={{fontSize:13,color:"var(--subtext)",margin:"2px 0 0"}}>{result.level}</p>
            </div>
          </div>
          {result.corrected && (
            <div style={{marginBottom:16}}>
              <p style={{fontWeight:700,fontSize:13,color:"var(--info)",marginBottom:8}}>✅ Suggested version:</p>
              <div style={{background:"var(--info-bg)",border:"1.5px solid var(--info-b)",borderRadius:10,padding:"12px 14px",fontSize:14,lineHeight:1.7,color:"var(--heading)"}}>
                {result.corrected}
              </div>
            </div>
          )}
          {result.errors && result.errors.length > 0 && (
            <div style={{marginBottom:16}}>
              <p style={{fontWeight:700,fontSize:13,color:"var(--error)",marginBottom:8}}>📌 Corrections:</p>
              {result.errors.map((e, i) => (
                <div key={i} style={{background:"var(--error-bg)",border:"1px solid var(--error-b)",borderRadius:8,padding:"10px 12px",marginBottom:8}}>
                  <span style={{color:"var(--error)",fontWeight:700,textDecoration:"line-through",marginRight:8}}>{e.original}</span>
                  <span style={{color:"var(--success)",fontWeight:700,marginRight:8}}>→ {e.correct}</span>
                  <span style={{fontSize:12,color:"var(--subtext)",fontStyle:"italic"}}>{e.rule}</span>
                </div>
              ))}
            </div>
          )}
          {result.encouragement && (
            <div style={{background:"var(--success-bg)",border:"1.5px solid var(--success-b)",borderRadius:10,padding:"12px 14px",fontSize:13,color:"var(--success)",fontWeight:600}}>
              💬 {result.encouragement}
            </div>
          )}
          <button className="b bp" style={{width:"100%",marginTop:16}} onClick={()=>{if(finishFired.current)return;finishFired.current=true;award(result.score>0?Math.round(result.score/10)+5:5);setText("");setResult(null);}}>
            ✨ New Prompt
          </button>
        </div>
      )}
    </div>
  );
}
