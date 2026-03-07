import React, { useState, useEffect, useRef } from 'react';
import { speak } from '../../data.jsx';

// ── Scenarios ───────────────────────────────────────────────────────────────
const SCENARIOS = [
  { id:"cafe",      icon:"☕", title:"At a Café",         hr:"U kafiću",            desc:"Order coffee, chat with the barista",          levels:["A1","A2","B1"], color:"#92400e", bg:"#fffbeb",
    aiName:"Marija",             aiRole:"barista at a Zagreb café",
    context:"You are Marija, a friendly and chatty barista at a popular Zagreb café. A customer is trying to order and chat in Croatian." },
  { id:"market",   icon:"🛒", title:"At the Market",     hr:"Na tržnici",          desc:"Buy fresh produce, haggle on prices",          levels:["A1","A2","B1"], color:"#166534", bg:"#f0fdf4",
    aiName:"Ivan",               aiRole:"market vendor at a Split open-air market",
    context:"You are Ivan, a proud Dalmatian market vendor selling the freshest fruits and vegetables in Split." },
  { id:"neighbor", icon:"🏠", title:"Meet Your Neighbor", hr:"Upoznavanje susjeda", desc:"Small talk, local tips, neighborhood life",    levels:["A2","B1","B2"], color:"#0369a1", bg:"#f0f9ff",
    aiName:"Ana",                aiRole:"friendly Croatian neighbor",
    context:"You are Ana, a warm and curious neighbor in Labin, Istria, eager to welcome the new family who just moved in." },
  { id:"school",   icon:"🏫", title:"School Meeting",     hr:"Susret s učiteljicom", desc:"Talk with your child's classroom teacher",   levels:["B1","B2"],       color:"#7c3aed", bg:"#faf5ff",
    aiName:"Učiteljica Petra",   aiRole:"primary school teacher",
    context:"You are Učiteljica Petra, a warm and patient Croatian primary school teacher meeting a parent for a routine check-in." },
  { id:"doctor",   icon:"🏥", title:"At the Doctor",      hr:"Kod liječnika",       desc:"Describe symptoms, understand medical advice", levels:["B1","B2"],       color:"#dc2626", bg:"#fef2f2",
    aiName:"Dr. Kovač",          aiRole:"Croatian general practitioner",
    context:"You are Dr. Kovač, a patient and helpful Croatian GP at a local clinic. The patient is a foreigner still learning the language." },
  { id:"party",    icon:"🎉", title:"Social Gathering",   hr:"Druženje",            desc:"Meet new people, discuss life in Croatia",    levels:["B2","C1","C2"],  color:"#0e7490", bg:"#f0f9ff",
    aiName:"Tomislav",           aiRole:"well-traveled Croatian professional at a dinner party",
    context:"You are Tomislav, a curious and well-spoken Croatian at a dinner party. You are genuinely interested in this foreign family moving to Croatia." },
  { id:"directions",icon:"🗺️",title:"Asking Directions",  hr:"Traženje puta",       desc:"Navigate the city — streets, buses, trams", levels:["A2","B1"],       color:"#0284c7", bg:"#f0f9ff",
    aiName:"Stjepan",            aiRole:"helpful local",
    context:"You are Stjepan, a helpful local man who knows the city well and is happy to give clear directions." },
  { id:"restaurant",icon:"🍽️",title:"Restaurant Dinner",  hr:"Večera u restoranu",  desc:"Order, ask about dishes, compliment the food",levels:["A2","B1","B2"], color:"#d97706", bg:"#fffbeb",
    aiName:"Konobar Luka",       aiRole:"attentive waiter at a mid-range Croatian restaurant",
    context:"You are Luka, an experienced and friendly waiter at a respected Croatian restaurant." },
];

const LEVELS = ["A1","A2","B1","B2","C1","C2"];

// Maps exercise keys → display labels (used in evaluation focus areas)
const EXERCISE_MAP = {
  akudrill:"🍽️ Accusative Case",  tenseflip:"⏳ Tense Flip",     verbdrill:"💪 Verb Drill",
  negation:"❌ Negation",          possess:"👤 Possessives",       ordinals:"🏢 Ordinals",
  relpron:"🔗 Koji/Koja/Koje",    emogender:"😀 Emotion Gender",  comparatives:"📈 Comparatives",
  future:"🚀 Future Tense",        sibil:"🔄 k→c/g→z",            prepdrill:"📍 Prepositions",
  numtime:"🔢 Numbers & Time",     profgender:"👨‍⚖️ Job Genders", reflexive:"🧲 SE Verbs",
  sentbuild:"🏗️ Sentence Builder", genderdrill:"♂️♀️ Gender Drill",
};

// ── System prompts ────────────────────────────────────────────────────────────
function buildConvoPrompt(scenario, level) {
  const complexity = {
    A1: "Use ONLY simple present tense. Maximum 1-2 very short sentences. Very basic, high-frequency vocabulary only.",
    A2: "Use present tense primarily. 2 short sentences. Common everyday vocabulary.",
    B1: "Use present, past (perfective), and near-future naturally. 2-3 sentences. Conversational vocabulary.",
    B2: "Speak naturally and fluently. 3-4 sentences. You may use idioms, participles, and varied tenses.",
    C1: "Speak exactly as you would to a native speaker. Rich vocabulary, idioms, subordinate clauses, all tenses.",
    C2: "Full native speaker register. Regional expressions, idiomatic speech, cultural references are welcome.",
  };
  return `You are ${scenario.aiName}, a native Croatian speaker. Role: ${scenario.aiRole}.
${scenario.context}

THE LEARNER IS AT LEVEL: ${level}
Language rules for YOU:
- ${complexity[level] || complexity["B1"]}
- ALWAYS respond entirely in Croatian. Never switch to English in your replies.
- If the learner writes in English, respond in Croatian and gently add: (Pokušaj na hrvatskom! — Try in Croatian!)
- If the learner makes a grammar error, seamlessly use the correct form in your next sentence without commenting on the error.
- Be warm, in-character, and always end with a natural follow-up question to keep the conversation flowing.
- Stay completely in character. Do not explain grammar or break the fourth wall.`;
}

function buildEvalPrompt(scenario, level) {
  return `You are an expert Croatian language teacher and applied linguist. Analyze the conversation below between a ${level} learner and an AI partner in the scenario: "${scenario.title}".

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation, just JSON):
{
  "score": <integer 0-100>,
  "level_demonstrated": "<A1|A2|B1|B2|C1|C2>",
  "strengths": ["<specific positive observation>", "<another strength>"],
  "mistakes": [
    {"original": "<exact learner phrase with error>", "correction": "<corrected form>", "rule": "<brief grammar rule, e.g. 'Accusative of masculine nouns drops -ić'>" }
  ],
  "focus_areas": [
    {"topic": "<grammar or vocab topic>", "explanation": "<1 sentence on why this is the priority>", "exercise": "<one key from: akudrill,tenseflip,verbdrill,negation,possess,ordinals,relpron,emogender,comparatives,future,sibil,prepdrill,numtime,profgender,reflexive,sentbuild,genderdrill>"}
  ],
  "vocabulary_feedback": "<1-2 sentences on vocabulary range and variety>",
  "encouragement": "<warm, specific encouraging message in Croatian — 1-2 sentences>"
}

Scoring guide: 90-100=near-native fluency, 75-89=confident learner, 60-74=communicative with errors, 40-59=basic communication, below 40=significant barriers.
Rules: max 4 mistakes, 2-3 focus areas, score honestly. If fewer than 3 user messages, note brevity in vocabulary_feedback.`;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AIConversation({ goBack, setScr, sCurEx }) {
  const [phase, setPhase] = useState("setup"); // setup | chat | evaluating | result
  const [scenario, setScenario] = useState(null);
  const [level, setLevel] = useState("B1");
  const [messages, setMessages] = useState([]); // [{role:"user"|"assistant"|"hint", content:string}]
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [evalError, setEvalError] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  async function callAI(msgs, systemPrompt, mode = "chat") {
    const res = await fetch("/.netlify/functions/ai-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: msgs, systemPrompt, mode })
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || "AI unavailable");
    return data.text;
  }

  async function startConversation() {
    if (!scenario) return;
    setPhase("chat");
    setLoading(true);
    try {
      const opener = await callAI(
        [{ role: "user", content: "Pozdrav! Možemo li početi?" }],
        buildConvoPrompt(scenario, level)
      );
      setMessages([{ role: "assistant", content: opener }]);
    } catch(e) {
      setMessages([{ role: "assistant", content: "Hm, nema veze... (Connection error — please try again.)" }]);
    }
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 200);
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const reply = await callAI(next, buildConvoPrompt(scenario, level));
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch(e) {
      setMessages(prev => [...prev, { role: "assistant", content: "(Mreža — pokušaj ponovo / Network error — try again)" }]);
    }
    setLoading(false);
  }

  async function requestHint() {
    if (loading) return;
    setLoading(true);
    const hintSysPrompt = `You are a Croatian language tutor. The student needs a quick hint to continue their conversation.
Give 2-3 sentences in English explaining what to say next. Include 1-2 example Croatian phrases they could use with a translation. Be concise and encouraging.`;
    try {
      const hint = await callAI(
        [...messages.filter(m => m.role !== "hint"), { role: "user", content: "I need a hint to continue this conversation." }],
        hintSysPrompt
      );
      setMessages(prev => [...prev, { role: "hint", content: hint }]);
    } catch(e) {
      setMessages(prev => [...prev, { role: "hint", content: "Hint unavailable — try writing anything, even imperfectly!" }]);
    }
    setLoading(false);
  }

  async function endAndEvaluate() {
    const userMsgs = messages.filter(m => m.role === "user");
    if (userMsgs.length < 2) { alert("Have at least 2 exchanges before evaluating!"); return; }
    setPhase("evaluating");
    const convoText = messages
      .filter(m => m.role !== "hint")
      .map(m => `${m.role === "user" ? "LEARNER" : "AI ("+scenario.aiName+")"}: ${m.content}`)
      .join("\n\n");
    try {
      const raw = await callAI(
        [{ role: "user", content: convoText }],
        buildEvalPrompt(scenario, level),
        "evaluate"
      );
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Could not parse evaluation");
      setEvaluation(JSON.parse(match[0]));
      setPhase("result");
    } catch(e) {
      setEvalError("Evaluation failed: " + e.message);
      setPhase("result");
    }
  }

  function resetAll() { setPhase("setup"); setMessages([]); setEvaluation(null); setEvalError(""); setScenario(null); }

  const userCount = messages.filter(m => m.role === "user").length;

  // ── SETUP ──────────────────────────────────────────────────────────────────
  if (phase === "setup") return (
    <div className="scr-wrap">
      {/* Hero */}
      <div style={{background:"linear-gradient(145deg,#0c4a6e,#0e7490)",borderRadius:22,padding:"22px 20px",marginBottom:22,color:"white",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",right:-30,top:-30,width:130,height:130,background:"rgba(255,255,255,.06)",borderRadius:"50%",pointerEvents:"none"}}/>
        <div style={{fontSize:38,marginBottom:8}}>🤖</div>
        <div style={{fontSize:20,fontWeight:900,marginBottom:5,fontFamily:"'Playfair Display',serif",letterSpacing:"-.02em"}}>AI Conversation Partner</div>
        <div style={{fontSize:13,opacity:.85,lineHeight:1.65}}>
          Practice real Croatian conversations with a native-speaker AI. Get instant grammar corrections, vocabulary tips, and a personalised feedback report at the end.
        </div>
        <div style={{marginTop:12,display:"flex",gap:6,flexWrap:"wrap"}}>
          {["Real dialogue","Instant hints","Full evaluation","Free"].map(t=>(
            <span key={t} style={{background:"rgba(255,255,255,.15)",borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:700}}>{t}</span>
          ))}
        </div>
      </div>

      {/* Level picker */}
      <div className="sh">Your Level</div>
      <div style={{display:"flex",gap:8,marginBottom:22,flexWrap:"wrap"}}>
        {LEVELS.map(l => (
          <button key={l} onClick={() => setLevel(l)}
            style={{padding:"8px 18px",borderRadius:20,border:"2px solid",fontWeight:800,fontSize:13,cursor:"pointer",
              fontFamily:"'Outfit',sans-serif",transition:"all .15s",
              borderColor:level===l?"#0e7490":"#e2e8f0",
              background:level===l?"#0e7490":"white",
              color:level===l?"white":"#64748b"}}>
            {l}
          </button>
        ))}
      </div>

      {/* Scenario picker */}
      <div className="sh">Choose a Scenario</div>
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:24}}>
        {SCENARIOS.map(s => {
          const selected = scenario?.id === s.id;
          return (
            <div key={s.id} onClick={() => setScenario(s)}
              style={{padding:"15px",borderRadius:16,border:`2px solid ${selected ? s.color : "#e2e8f0"}`,
                background:selected ? s.bg : "white",cursor:"pointer",transition:"all .15s",
                boxShadow:selected ? `0 4px 18px ${s.color}25` : "none"}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{fontSize:26,flexShrink:0,width:40,textAlign:"center"}}>{s.icon}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:800,color:"#0f172a"}}>{s.title}</div>
                  <div style={{fontSize:12,color:"#64748b",marginTop:2}}>{s.desc}</div>
                  <div style={{display:"flex",gap:4,marginTop:6,flexWrap:"wrap"}}>
                    {s.levels.map(l => (
                      <span key={l} style={{fontSize:10,fontWeight:800,padding:"2px 7px",borderRadius:10,
                        background:l===level ? s.color : "#f1f5f9",
                        color:l===level ? "white" : "#94a3b8"}}>
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
                {selected && <div style={{fontSize:18,color:s.color,flexShrink:0}}>✓</div>}
              </div>
            </div>
          );
        })}
      </div>

      <button className="b bp" style={{width:"100%",fontSize:16,padding:"15px",borderRadius:14}}
        onClick={startConversation} disabled={!scenario}>
        {scenario ? `Start — ${scenario.title} (${level})` : "Select a scenario above"}
      </button>
      <div style={{fontSize:11,color:"#94a3b8",textAlign:"center",marginTop:10}}>
        Powered by Google Gemini · Free tier · No data stored
      </div>
    </div>
  );

  // ── EVALUATING ─────────────────────────────────────────────────────────────
  if (phase === "evaluating") return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      minHeight:"80vh",textAlign:"center",padding:"24px"}}>
      <div style={{fontSize:56,marginBottom:16,animation:"pulse 1.4s ease-in-out infinite"}}>🧠</div>
      <div style={{fontSize:20,fontWeight:800,color:"#0f172a",marginBottom:8}}>Analysing your conversation…</div>
      <div style={{fontSize:14,color:"#64748b",maxWidth:280,lineHeight:1.6}}>
        Reviewing grammar, vocabulary range, and fluency across your {userCount} exchanges
      </div>
    </div>
  );

  // ── RESULT ─────────────────────────────────────────────────────────────────
  if (phase === "result") {
    if (evalError || !evaluation) return (
      <div className="scr-wrap" style={{textAlign:"center",paddingTop:40}}>
        <div style={{fontSize:40,marginBottom:12}}>⚠️</div>
        <div style={{fontSize:15,fontWeight:700,color:"#dc2626",marginBottom:20}}>{evalError || "Could not load evaluation"}</div>
        <div style={{display:"flex",gap:10,justifyContent:"center"}}>
          <button className="b bg" onClick={() => setPhase("chat")}>Back to Chat</button>
          <button className="b bp" onClick={resetAll}>Start Over</button>
        </div>
      </div>
    );

    const ev = evaluation;
    const scoreColor = ev.score >= 80 ? "#16a34a" : ev.score >= 55 ? "#d97706" : "#dc2626";
    const scoreEmoji = ev.score >= 80 ? "🏆" : ev.score >= 55 ? "👏" : "📚";
    const scoreLabel = ev.score >= 80 ? "Excellent!" : ev.score >= 55 ? "Good Progress" : "Keep Practicing";

    return (
      <div className="scr-wrap">
        {/* Score hero */}
        <div style={{background:"linear-gradient(145deg,#0c4a6e,#0e7490)",borderRadius:22,padding:"24px 20px",
          marginBottom:20,color:"white",textAlign:"center"}}>
          <div style={{fontSize:48,marginBottom:6}}>{scoreEmoji}</div>
          <div style={{fontSize:11,fontWeight:700,opacity:.7,letterSpacing:".1em",textTransform:"uppercase",marginBottom:4}}>Conversation Score</div>
          <div style={{fontSize:72,fontWeight:900,lineHeight:1,marginBottom:4}}>{ev.score}</div>
          <div style={{fontSize:16,fontWeight:700,opacity:.9,marginBottom:6}}>{scoreLabel}</div>
          <div style={{fontSize:13,opacity:.7}}>
            Level demonstrated: <strong style={{opacity:1}}>{ev.level_demonstrated}</strong>
            {ev.level_demonstrated !== level && <span style={{opacity:.6}}> (target: {level})</span>}
          </div>
        </div>

        {/* Encouragement — tap to hear */}
        {ev.encouragement && (
          <div onClick={() => speak(ev.encouragement)}
            style={{background:"#f0fdf4",border:"1.5px solid #bbf7d0",borderRadius:16,padding:"16px 18px",
              marginBottom:16,cursor:"pointer",display:"flex",gap:12,alignItems:"flex-start"}}>
            <span style={{fontSize:22,flexShrink:0}}>💬</span>
            <div>
              <div style={{fontSize:14,fontWeight:700,color:"#166534",fontFamily:"'Playfair Display',serif",
                fontStyle:"italic",lineHeight:1.55,marginBottom:4}}>
                "{ev.encouragement}"
              </div>
              <div style={{fontSize:11,color:"#16a34a",fontWeight:600}}>Tap to hear 🔊</div>
            </div>
          </div>
        )}

        {/* Strengths */}
        {ev.strengths?.length > 0 && (
          <div style={{background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:18,padding:"18px",marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:800,color:"#16a34a",letterSpacing:".08em",textTransform:"uppercase",marginBottom:12}}>
              ✅ What You Did Well
            </div>
            {ev.strengths.map((s,i) => (
              <div key={i} style={{display:"flex",gap:10,marginBottom:8,alignItems:"flex-start"}}>
                <span style={{color:"#16a34a",fontWeight:900,flexShrink:0,marginTop:1}}>•</span>
                <span style={{fontSize:14,color:"#1e293b",lineHeight:1.55}}>{s}</span>
              </div>
            ))}
          </div>
        )}

        {/* Corrections */}
        {ev.mistakes?.length > 0 && (
          <div style={{background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:18,padding:"18px",marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:800,color:"#dc2626",letterSpacing:".08em",textTransform:"uppercase",marginBottom:12}}>
              📝 Corrections
            </div>
            {ev.mistakes.map((m,i) => (
              <div key={i} style={{marginBottom:i<ev.mistakes.length-1?14:0,paddingBottom:i<ev.mistakes.length-1?14:0,
                borderBottom:i<ev.mistakes.length-1?"1px solid #f1f5f9":"none"}}>
                <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:4}}>
                  <span style={{fontSize:13,color:"#dc2626",textDecoration:"line-through",fontWeight:600}}>{m.original}</span>
                  <span style={{fontSize:13,color:"#94a3b8"}}>→</span>
                  <span style={{fontSize:13,color:"#16a34a",fontWeight:800}}>{m.correction}</span>
                </div>
                <div style={{fontSize:12,color:"#64748b",lineHeight:1.45}}>{m.rule}</div>
              </div>
            ))}
          </div>
        )}

        {/* Focus areas */}
        {ev.focus_areas?.length > 0 && (
          <div style={{background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:18,padding:"18px",marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:800,color:"#7c3aed",letterSpacing:".08em",textTransform:"uppercase",marginBottom:14}}>
              🎯 Focus for the Next Few Days
            </div>
            {ev.focus_areas.map((f,i) => (
              <div key={i} style={{display:"flex",gap:12,marginBottom:i<ev.focus_areas.length-1?16:0,
                paddingBottom:i<ev.focus_areas.length-1?16:0,
                borderBottom:i<ev.focus_areas.length-1?"1px solid #f1f5f9":"none"}}>
                <div style={{width:34,height:34,borderRadius:10,background:"#f5f3ff",border:"1.5px solid #e0d9f5",
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,
                  color:"#7c3aed",flexShrink:0}}>
                  {i+1}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:800,color:"#0f172a",marginBottom:3}}>{f.topic}</div>
                  <div style={{fontSize:12,color:"#64748b",lineHeight:1.5,marginBottom:8}}>{f.explanation}</div>
                  {f.exercise && EXERCISE_MAP[f.exercise] && (
                    <button onClick={() => { setScr(f.exercise); sCurEx && sCurEx(f.exercise); }}
                      style={{fontSize:12,fontWeight:700,padding:"6px 13px",borderRadius:10,
                        border:"1.5px solid #0e7490",background:"#f0f9ff",color:"#0e7490",
                        cursor:"pointer",fontFamily:"'Outfit',sans-serif",transition:"all .15s"}}>
                      Practice now: {EXERCISE_MAP[f.exercise]} →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Vocabulary feedback */}
        {ev.vocabulary_feedback && (
          <div style={{background:"#fffbeb",border:"1.5px solid #fde68a",borderRadius:14,padding:"15px",marginBottom:20}}>
            <div style={{fontSize:11,fontWeight:800,color:"#a16207",textTransform:"uppercase",letterSpacing:".08em",marginBottom:6}}>📚 Vocabulary</div>
            <div style={{fontSize:13,color:"#78350f",lineHeight:1.6}}>{ev.vocabulary_feedback}</div>
          </div>
        )}

        {/* Actions */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:32}}>
          <button className="b bg" onClick={() => setPhase("chat")}>← Back to Chat</button>
          <button className="b bp" onClick={resetAll}>New Conversation</button>
        </div>
      </div>
    );
  }

  // ── CHAT ───────────────────────────────────────────────────────────────────
  // Full-screen overlay so the chat input stays pinned above everything
  return (
    <div style={{position:"fixed",inset:0,zIndex:9100,background:"#f8fafc",
      display:"flex",flexDirection:"column",fontFamily:"'Outfit',sans-serif"}}>

      {/* Header */}
      <div style={{background:"white",borderBottom:"1px solid #e2e8f0",padding:"10px 16px",
        display:"flex",alignItems:"center",gap:10,flexShrink:0,
        boxShadow:"0 1px 4px rgba(0,0,0,.06)"}}>
        <button onClick={goBack}
          style={{background:"none",border:"none",fontSize:22,cursor:"pointer",padding:"4px 6px",
            color:"#64748b",lineHeight:1,borderRadius:8,transition:"background .15s"}}
          onMouseOver={e=>e.currentTarget.style.background="#f1f5f9"}
          onMouseOut={e=>e.currentTarget.style.background="none"}>
          ←
        </button>
        <div style={{width:38,height:38,borderRadius:"50%",flexShrink:0,
          background:`linear-gradient(135deg,${scenario.color},${scenario.color}bb)`,
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>
          {scenario.icon}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:14,fontWeight:800,color:"#0f172a",lineHeight:1.2}}>{scenario.aiName}</div>
          <div style={{fontSize:11,color:"#64748b"}}>{scenario.title} · Level {level}</div>
        </div>
        <button onClick={endAndEvaluate} disabled={loading || userCount < 2}
          style={{padding:"7px 13px",borderRadius:10,border:"1.5px solid",fontWeight:700,fontSize:12,
            cursor:userCount < 2 ? "not-allowed" : "pointer",fontFamily:"'Outfit',sans-serif",
            transition:"all .15s",whiteSpace:"nowrap",
            borderColor:userCount >= 2 ? "#0e7490" : "#e2e8f0",
            background:userCount >= 2 ? "#f0f9ff" : "#f8fafc",
            color:userCount >= 2 ? "#0e7490" : "#cbd5e1",
            opacity: loading ? 0.5 : 1}}>
          End & Evaluate
        </button>
      </div>

      {/* Messages */}
      <div style={{flex:1,overflowY:"auto",padding:"16px 14px",display:"flex",flexDirection:"column",gap:12}}>
        {/* Context pill */}
        <div style={{textAlign:"center",marginBottom:4}}>
          <span style={{fontSize:11,fontWeight:600,color:"#94a3b8",background:"#f1f5f9",
            padding:"4px 12px",borderRadius:20}}>
            {scenario.hr} · {level}
          </span>
        </div>

        {messages.map((m, i) => {
          if (m.role === "hint") return (
            <div key={i} style={{background:"#fffbeb",border:"1.5px solid #fde68a",borderRadius:14,
              padding:"12px 14px",fontSize:13,color:"#78350f",lineHeight:1.6}}>
              💡 <strong>Hint:</strong> {m.content}
            </div>
          );
          const isUser = m.role === "user";
          return (
            <div key={i} style={{display:"flex",justifyContent:isUser?"flex-end":"flex-start",gap:8,alignItems:"flex-end"}}>
              {!isUser && (
                <div style={{width:30,height:30,borderRadius:"50%",flexShrink:0,
                  background:`linear-gradient(135deg,${scenario.color},${scenario.color}99)`,
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>
                  {scenario.icon}
                </div>
              )}
              <div onClick={() => { if (!isUser) speak(m.content); }}
                style={{maxWidth:"78%",padding:"11px 14px",lineHeight:1.55,fontSize:15,fontWeight:500,
                  background:isUser ? "linear-gradient(135deg,#0e7490,#0c4a6e)" : "white",
                  color:isUser ? "white" : "#1e293b",
                  borderRadius:isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  border:isUser ? "none" : "1px solid #e2e8f0",
                  boxShadow:"0 1px 4px rgba(0,0,0,.07)",
                  cursor:!isUser ? "pointer" : "default"}}>
                {m.content}
                {!isUser && <span style={{fontSize:11,opacity:.4,marginLeft:5}}>🔊</span>}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {loading && (
          <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
            <div style={{width:30,height:30,borderRadius:"50%",
              background:`linear-gradient(135deg,${scenario.color},${scenario.color}99)`,
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>
              {scenario.icon}
            </div>
            <div style={{padding:"12px 16px",background:"white",borderRadius:"18px 18px 18px 4px",
              border:"1px solid #e2e8f0",display:"flex",gap:4,alignItems:"center",
              boxShadow:"0 1px 4px rgba(0,0,0,.06)"}}>
              {[0,1,2].map(j => (
                <div key={j} style={{width:7,height:7,borderRadius:"50%",background:"#cbd5e1",
                  animation:`pulse 1.2s ease-in-out ${j*0.22}s infinite`}}/>
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef}/>
      </div>

      {/* Input bar */}
      <div style={{background:"white",borderTop:"1px solid #e2e8f0",padding:"10px 14px 14px",flexShrink:0,
        paddingBottom:`max(14px,env(safe-area-inset-bottom))`}}>
        <div style={{display:"flex",gap:8,marginBottom:8}}>
          <input ref={inputRef}
            type="text" value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Piši na hrvatskom…"
            disabled={loading}
            style={{flex:1,padding:"11px 14px",fontSize:15,borderRadius:12,
              border:"1.5px solid #e2e8f0",background:"#f8fafc",outline:"none",
              fontFamily:"'Outfit',sans-serif",transition:"border-color .2s",
              color:"#1e293b"}} />
          <button onClick={sendMessage} disabled={loading || !input.trim()}
            style={{width:44,height:44,borderRadius:12,border:"none",flexShrink:0,fontSize:18,
              cursor:input.trim() && !loading ? "pointer" : "not-allowed",transition:"all .15s",
              background:input.trim() && !loading ? "linear-gradient(135deg,#0e7490,#0c4a6e)" : "#e2e8f0",
              color:input.trim() && !loading ? "white" : "#94a3b8"}}>
            ➤
          </button>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <button onClick={requestHint} disabled={loading || messages.length === 0}
            style={{background:"none",border:"none",fontSize:12,color:"#64748b",cursor:"pointer",
              fontFamily:"'Outfit',sans-serif",fontWeight:600,padding:"2px 0",opacity:loading?0.4:1}}>
            💡 Need a hint?
          </button>
          <span style={{fontSize:11,color:"#94a3b8",fontWeight:500}}>
            {userCount} {userCount === 1 ? "exchange" : "exchanges"}
            {userCount < 2 && " · needs 2 to evaluate"}
          </span>
        </div>
      </div>
    </div>
  );
}
