import React, { useState } from 'react';
import { H } from '../../data.jsx';

const PROMPTS = [
  {en:"Describe your morning routine",hr:"Opiši svoju jutarnju rutinu"},
  {en:"Write about your favorite Croatian food",hr:"Napiši o svojoj omiljenoj hrvatskoj hrani"},
  {en:"Describe the weather today",hr:"Opiši današnje vrijeme"},
  {en:"Write about where you live",hr:"Napiši o tome gdje živiš"},
  {en:"Describe a typical day in Croatia",hr:"Opiši tipičan dan u Hrvatskoj"},
  {en:"Write about your family",hr:"Napiši o svojoj obitelji"},
  {en:"Describe your hobby",hr:"Opiši svoj hobi"},
  {en:"Write a short text about Croatia",hr:"Napiši kratki tekst o Hrvatskoj"},
  {en:"Describe a Croatian city you know",hr:"Opiši hrvatski grad koji poznaješ"},
  {en:"Write about why you learn Croatian",hr:"Napiši zašto učiš hrvatski"},
];

export default function WritingScreen({ goBack, award }) {
  const [promptIdx] = useState(() => Math.floor(Math.random() * PROMPTS.length));
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
          prompt: prompt.en,
          text: text.trim(),
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
    setText("");
    setResult(null);
    setError("");
    window.location.reload();
  }

  return (
    <div className="scr-wrap">
      {H("✍️ Free Writing")}
      <div className="c" style={{padding:"20px",marginBottom:16}}>
        <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:4}}>
          <span style={{fontSize:20}}>📝</span>
          <div>
            <p style={{fontWeight:800,fontSize:15,color:"var(--heading)",margin:0}}>{prompt.en}</p>
            <p style={{fontSize:13,color:"#78716c",marginTop:2,fontStyle:"italic"}}>{prompt.hr}</p>
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
          <span style={{fontSize:12,color:"#78716c"}}>{text.length} characters</span>
          <button style={{background:"none",border:"none",cursor:"pointer",fontSize:12,color:"#7c3aed",fontWeight:600}} onClick={newPrompt}>
            🔄 New Prompt
          </button>
        </div>
        {error && <p style={{color:"#ef4444",fontSize:13,marginTop:8}}>{error}</p>}
        <button
          className="b bp"
          style={{width:"100%",marginTop:12}}
          onClick={checkWithAI}
          disabled={loading}>
          {loading ? "🤔 Checking..." : "🤖 Check with AI"}
        </button>
      </div>
      {result && (
        <div className="c" style={{padding:"20px",marginTop:0}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
            <div style={{fontSize:40}}>{result.score>=80?"🌟":result.score>=60?"🎉":"💪"}</div>
            <div>
              <p style={{fontWeight:800,fontSize:18,color:"var(--heading)",margin:0}}>Score: {result.score}/100</p>
              <p style={{fontSize:13,color:"#78716c",margin:"2px 0 0"}}>{result.level}</p>
            </div>
          </div>
          {result.corrected && (
            <div style={{marginBottom:16}}>
              <p style={{fontWeight:700,fontSize:13,color:"#0369a1",marginBottom:8}}>✅ Suggested version:</p>
              <div style={{background:"#f0f9ff",border:"1.5px solid #bae6fd",borderRadius:10,padding:"12px 14px",fontSize:14,lineHeight:1.7,color:"#1e293b"}}>
                {result.corrected}
              </div>
            </div>
          )}
          {result.errors && result.errors.length > 0 && (
            <div style={{marginBottom:16}}>
              <p style={{fontWeight:700,fontSize:13,color:"#dc2626",marginBottom:8}}>📌 Corrections:</p>
              {result.errors.map((e, i) => (
                <div key={i} style={{background:"#fff1f2",border:"1px solid #fecaca",borderRadius:8,padding:"10px 12px",marginBottom:8}}>
                  <span style={{color:"#ef4444",fontWeight:700,textDecoration:"line-through",marginRight:8}}>{e.original}</span>
                  <span style={{color:"#166534",fontWeight:700,marginRight:8}}>→ {e.correct}</span>
                  <span style={{fontSize:12,color:"#78716c",fontStyle:"italic"}}>{e.rule}</span>
                </div>
              ))}
            </div>
          )}
          {result.encouragement && (
            <div style={{background:"#f0fdf4",border:"1.5px solid #bbf7d0",borderRadius:10,padding:"12px 14px",fontSize:13,color:"#166534",fontWeight:600}}>
              💬 {result.encouragement}
            </div>
          )}
          <button className="b bp" style={{width:"100%",marginTop:16}} onClick={()=>{award(result.score>0?Math.round(result.score/10)+5:5);setText("");setResult(null);}}>
            ✨ New Prompt
          </button>
        </div>
      )}
    </div>
  );
}
