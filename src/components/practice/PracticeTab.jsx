import React, { useState } from 'react';
import { H, V, LISTEN, UNJUMBLE, PREPDRILL, NUMTIME, getSR } from '../../data.jsx';

function Section({ title, icon, count, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom:8 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display:'flex', alignItems:'center', gap:10, width:'100%',
          padding:'13px 16px', borderRadius:14,
          background:'var(--card)', border:'1px solid var(--card-b)',
          cursor:'pointer', fontFamily:"'Outfit',sans-serif",
          boxShadow:'0 1px 3px rgba(0,0,0,.06)',
          marginBottom: open ? 10 : 0,
        }}
      >
        <span style={{ fontSize:18 }}>{icon}</span>
        <span style={{ flex:1, fontSize:14, fontWeight:800, color:'var(--heading)', textAlign:'left' }}>{title}</span>
        <span style={{ fontSize:11, color:'var(--subtext)', fontWeight:600, background:'var(--bar-bg)', borderRadius:8, padding:'2px 8px' }}>{count}</span>
        <span style={{ fontSize:11, color:'var(--subtext)', opacity:.5, marginLeft:4 }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && <div style={{ marginBottom:16 }}>{children}</div>}
    </div>
  );
}

export default function PracticeTab({
  allCats, sh, setScr, sCurEx,
  onLaunchQuiz, onLaunchFlash, onLaunchListen,
  sMp, sMsl, sMm, sGsc, sGph,
  sTyPool, sTyI, sTyS, sTyIn, sTyA, sTyW,
  sSi, sSx, sSw, sSr, sSsc,
  sZnMode,
  sUjQ, sUjI, sUjS, sUjIn, sUjA,
  sPpQ, sPpI, sPpS, sPpA, sPpSl,
  sNtQ, sNtI, sNtS, sNtA, sNtSl, sNtO,
  sEvM,
}) {
  const [weakMsg, setWeakMsg] = useState("");
  const pool = () => allCats.flatMap(cc => V[cc]);

  function startQuiz() {
    const p = pool();
    const items = sh(p).slice(0,10).map(w => { const wr=sh(p.filter(x=>x[1]!==w[1])).slice(0,3).map(x=>x[1]); return{hr:w[0],en:w[1],ph:w[2],opts:sh([w[1]].concat(wr)),correct:w[1]}; });
    onLaunchQuiz(items);
  }
  function startFlashcards() {
    const p = pool();
    onLaunchFlash(sh(p).slice(0,20));
  }
  function startMatch() {
    const p = pool();
    const sel = sh(p).slice(0,6);
    sMp(sh(sel.map((w,i)=>({id:"h"+i,t:w[0],p:i,tp:"hr"})).concat(sel.map((w,i)=>({id:"e"+i,t:w[1],p:i,tp:"en"})))));
    sMsl([]); sMm([]); sGsc(0); sGph("play"); setScr("match"); sCurEx("match");
  }
  function startTyping() {
    const p = pool();
    const items = sh(p).slice(0,10);
    sTyPool(items); sTyI(0); sTyS(0); sTyIn(""); sTyA(false); sTyW(items[0]); setScr("typing"); sCurEx("typing");
  }
  function startListening() {
    onLaunchListen(sh(LISTEN).slice(0,8));
  }
  function startSpeaking() {
    const p = pool();
    const items = sh(p).slice(0,6);
    sSi(items); sSx(0); sSw(items[0]); sSr(null); sSsc(0); setScr("speaking"); sCurEx("speaking");
  }
  function startWeakWords() {
    const d = getSR();
    const p = pool();
    const weak = Object.entries(d).filter(e=>e[1].w>0).sort((a,b)=>(b[1].w/(b[1].r+1))-(a[1].w/(a[1].r+1)));
    if (weak.length < 3) { setWeakMsg("Keep practicing! Words you get wrong will appear here."); return; }
    const weakWords = weak.slice(0,15).map(e=>p.find(w=>w[0]===e[0])).filter(Boolean);
    if (weakWords.length < 3) { setWeakMsg("Not enough weak words yet — keep practicing!"); return; }
    const items = weakWords.map(w => { const wr=sh(p.filter(x=>x[1]!==w[1])).slice(0,3).map(x=>x[1]); return{hr:w[0],en:w[1],ph:w[2],opts:sh([w[1]].concat(wr)),correct:w[1]}; });
    onLaunchQuiz(items);
  }
  function startReview() {
    setScr("review"); sCurEx("review");
  }
  function startWriting() {
    setScr("writing"); sCurEx("writing");
  }
  function startPitchAccent() {
    setScr("pitchaccent"); sCurEx("pitchaccent");
  }
  function startShadowing() {
    setScr("shadowing"); sCurEx("shadowing");
  }
  function startAspectDrill() {
    setScr("aspectdrill"); sCurEx("aspectdrill");
  }

  const specialInit = {
    znam:      () => { sZnMode("menu"); setScr("znam"); sCurEx("znam"); },
    unjumble:  () => { const q=sh(UNJUMBLE).slice(0,10); sUjQ(q); sUjI(0); sUjS(0); sUjIn(""); sUjA(false); setScr("unjumble"); sCurEx("unjumble"); },
    prepdrill: () => { const q=sh(PREPDRILL); sPpQ(q); sPpI(0); sPpS(0); sPpA(false); sPpSl(-1); setScr("prepdrill"); sCurEx("prepdrill"); },
    numtime:   () => { const q=sh([...NUMTIME.numbers,...NUMTIME.time]).slice(0,10); sNtQ(q); sNtI(0); sNtS(0); sNtA(false); sNtSl(-1); sNtO(sh([q[0].a].concat(q[0].al))); setScr("numtime"); sCurEx("numtime"); },
  };
  const go = screen => specialInit[screen] || (() => { setScr(screen); sCurEx(screen); });

  // ── SMART RECOMMENDATIONS ─────────────────────────────────────────────
  const sr = getSR();
  const weakCount = Object.values(sr).filter(v => v.w > 0).length;
  const h = new Date().getHours();

  const recommendations = [
    weakCount >= 3
      ? { icon:'🧠', title:'Fix Weak Words', desc:`${weakCount} words need attention`, color:'#fff1f2', border:'#fca5a5', fn: () => { setWeakMsg(""); startWeakWords(); } }
      : { icon:'🎯', title:'Quick Quiz',      desc:'Test your vocabulary',             color:'#fff7ed', border:'#fed7aa', fn: startQuiz },
    h < 12
      ? { icon:'🃏', title:'Flashcards',   desc:'Start the day strong',     color:'#f5f3ff', border:'#ddd6fe', fn: startFlashcards }
      : h < 18
      ? { icon:'🎧', title:'Listening',    desc:'Train your ear',            color:'#fff1f2', border:'#fecaca', fn: startListening }
      : { icon:'⚡', title:'Word Sprint',  desc:'End the day with speed',    color:'#fffbeb', border:'#fde68a', fn: () => { setScr("wordsprint"); sCurEx("wordsprint"); } },
    { icon:'🔗', title:'Match Pairs', desc:'Quick memory game', color:'#f0fdf4', border:'#bbf7d0', fn: startMatch },
  ];

  function ExRow({ items }) {
    return (
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        {items.map(([icon,label,screen,desc]) => (
          <button key={screen} className="tc"
            style={{ display:"flex", alignItems:"center", gap:12, padding:"14px", textAlign:"left" }}
            onClick={go(screen)}>
            <div style={{ width:40, height:40, borderRadius:12, background:"var(--bar-bg)", border:"1px solid var(--card-b)",
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>
              {icon}
            </div>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:800, color:"var(--heading)", lineHeight:1.2 }}>{label}</div>
              <div style={{ fontSize:10, color:"var(--subtext)", marginTop:2, lineHeight:1.3 }}>{desc}</div>
            </div>
          </button>
        ))}
      </div>
    );
  }

  const grammarDrills = [
    ["🧩","Word Order",    "unjumble",    "Put words in the right order"],
    ["📍","Prepositions",  "prepdrill",   "u, na, od, do — which one?"],
    ["❓","Questions",     "qwords",      "Tko, Što, Gdje, Zašto..."],
    ["❌","Negation",      "negation",    "Ne, nije, nisam..."],
    ["♂️♀️","Gender",     "genderdrill", "Masculine, feminine, neuter"],
    ["👨‍⚖️","M/F Jobs",  "profgender",  "Učitelj vs učiteljica"],
    ["📈","Compare",       "comparatives","Bigger, faster, better"],
    ["🚀","Future Tense",  "future",      "ću, ćeš, će..."],
    ["🔄","Sibilization",  "sibil",       "k→c, g→z sound changes"],
    ["🎨","Color Agreement","coloragree", "Colors match noun gender"],
    ["🍽️","Accusative",   "akudrill",    "Direct objects change form"],
    ["🔗","Koji/Koja",     "relpron",     "Relative pronouns"],
    ["🧲","SE Verbs",      "reflexive",   "Reflexive verbs with se/si"],
    ["🏗️","Build Sentences","sentbuild",  "Arrange the building blocks"],
  ];

  const vocabularyDrills = [
    ["🇭🇷","Translate",    "znam",       "English ↔ Croatian"],
    ["👤","My/Your",        "possess",    "Moj, tvoj, njegov, njezin"],
    ["↔️","Opposites",      "opposites",  "Hot/cold, big/small..."],
    ["🏢","Ordinals",       "ordinals",   "First, second, third..."],
    ["😀","Emotions",       "emogender",  "Sretan, sretna — feel it"],
    ["💪","20 Core Verbs",  "verbdrill",  "The most-used Croatian verbs"],
    ["🎯","Pronouns",       "pronouns",   "Ja, ti, on, ona, mi..."],
    ["🏙️","City Locations","cityloc",    "Where is it in Croatia?"],
  ];

  const practicalCroatian = [
    ["🍽️","Restaurant",   "restaurant",  "Order food like a local"],
    ["🔢","Numbers & Time","numtime",     "Tell time, count anything"],
    ["💬","Conversations", "convmatch",   "Match real-world dialogues"],
    ["🖼️","Describe",     "scenes",      "Describe what you see"],
    ["⏳","Tense Flip",    "tenseflip",   "Switch tense on the fly"],
  ];

  const readingFun = [
    ["📝","Story Fill",    "fillstory",  "Fill in the blanks"],
    ["📖","Stories",       "storyselect","Read short Croatian tales"],
    ["🧩","Riddles",       "riddles",    "Can you guess the answer?"],
    ["🧠","Think Croatian","logicquiz",  "Logic puzzles in Croatian"],
    ["😝","Tongue Twisters","brzalice",  "Brzalice — dare yourself"],
  ];

  const reviewItems = [
    [() => { setWeakMsg(""); startWeakWords(); }, "🧠","Weak Words",   "Words you've struggled with"],
    [() => { setScr("proverbs"); sCurEx("proverbs"); }, "🌟","Proverbs","Croatian wisdom & sayings"],
    [() => { setScr("idioms"); sCurEx("idioms"); },     "🗣️","Idioms",  "Phrases locals actually use"],
    [() => { sEvM(new Date().getMonth()+1); setScr("events"); sCurEx("events"); },"📅","Croatian Events","Festivals & holidays"],
  ];

  return (
    <React.Fragment>
      {H("🎮 Practice", "Games, exercises & daily review")}

      {/* ── RECOMMENDED FOR YOU ─────────────────────────────────────────── */}
      <h3 className="sh">✨ Recommended for You</h3>
      <p style={{ fontSize:12, color:"var(--subtext)", marginTop:-6, marginBottom:12, fontWeight:500 }}>
        Picked based on your progress today
      </p>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:24 }}>
        {recommendations.map((r, i) => (
          <button key={i} className="tc"
            style={{ textAlign:"center", padding:"16px 10px", background:r.color, border:`1.5px solid ${r.border}` }}
            onClick={r.fn}>
            <div style={{ fontSize:28, marginBottom:6 }}>{r.icon}</div>
            <div style={{ fontSize:12, fontWeight:800, color:"var(--heading)", lineHeight:1.2 }}>{r.title}</div>
            <div style={{ fontSize:10, color:"var(--subtext)", marginTop:4, lineHeight:1.3 }}>{r.desc}</div>
          </button>
        ))}
      </div>
      {weakMsg && (
        <div style={{ background:"#fffbeb", border:"1.5px solid #fde68a", borderRadius:12, padding:"12px 16px", marginBottom:16,
          fontSize:13, fontWeight:600, color:"#92400e", display:"flex", alignItems:"center", gap:8 }}>
          <span>💡</span>
          <span style={{ flex:1 }}>{weakMsg}</span>
          <button onClick={() => setWeakMsg("")} style={{ background:"none", border:"none", cursor:"pointer", fontSize:16, color:"#92400e", lineHeight:1 }}>×</button>
        </div>
      )}

      {/* ── QUICK GAMES ─────────────────────────────────────────────────── */}
      <h3 className="sh">⚡ Quick Games</h3>
      <p style={{ fontSize:12, color:"var(--subtext)", marginTop:-6, marginBottom:12, fontWeight:500 }}>Tap any to start instantly</p>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:24 }}>
        {[
          [startQuiz,       "🎯","Quiz",         "#fff7ed","#fed7aa"],
          [startFlashcards, "🃏","Flashcards",   "#f5f3ff","#ddd6fe"],
          [startMatch,      "🔗","Match Pairs",  "#f0fdf4","#bbf7d0"],
          [startTyping,     "⌨️","Typing",       "#fef9c3","#fde047"],
          [startListening,  "🎧","Listening",    "#fff1f2","#fecaca"],
          [startSpeaking,   "🎤","Pronunciation","#f0f9ff","#bae6fd"],
          [() => { setScr("wordsprint"); sCurEx("wordsprint"); },"⚡","Word Sprint","#fffbeb","#fde68a"],
          [startReview,"🔁","SRS Review","#f5f3ff","#ddd6fe"],
          [startWriting,"✍️","Free Writing","#fdf4ff","#e9d5ff"],
        ].map(([fn,icon,label,bg,border], i) => (
          <button key={i} className="tc"
            style={{ textAlign:"center", padding:"14px 8px", background:bg, border:`1.5px solid ${border}` }}
            onClick={fn}>
            <div style={{ fontSize:28 }}>{icon}</div>
            <div style={{ fontSize:11, fontWeight:800, marginTop:5, color:"var(--heading)" }}>{label}</div>
          </button>
        ))}
      </div>

      {/* ── COLLAPSIBLE DRILL SECTIONS ──────────────────────────────────── */}
      <div style={{ fontSize:11, fontWeight:800, color:'var(--subtext)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:12 }}>
        All Exercises
      </div>

      <Section title="Grammar Drills" icon="📝" count={`${grammarDrills.length} exercises`} defaultOpen={false}>
        <p style={{ fontSize:12, color:"var(--subtext)", marginBottom:10, fontWeight:500 }}>Master Croatian structure step by step</p>
        <ExRow items={grammarDrills} />
      </Section>

      <Section title="Vocabulary" icon="🔤" count={`${vocabularyDrills.length} exercises`} defaultOpen={false}>
        <p style={{ fontSize:12, color:"var(--subtext)", marginBottom:10, fontWeight:500 }}>Build and reinforce your word bank</p>
        <ExRow items={vocabularyDrills} />
      </Section>

      <Section title="Practical Croatian" icon="🌍" count={`${practicalCroatian.length} exercises`} defaultOpen={false}>
        <p style={{ fontSize:12, color:"var(--subtext)", marginBottom:10, fontWeight:500 }}>Real situations, real language</p>
        <ExRow items={practicalCroatian} />
      </Section>

      <Section title="Reading & Fun" icon="📖" count={`${readingFun.length} exercises`} defaultOpen={false}>
        <p style={{ fontSize:12, color:"var(--subtext)", marginBottom:10, fontWeight:500 }}>Stories, riddles, and challenges</p>
        <ExRow items={readingFun} />
      </Section>

      <Section title="Review & Culture" icon="🧠" count={`${reviewItems.length} activities`} defaultOpen={false}>
        <p style={{ fontSize:12, color:"var(--subtext)", marginBottom:10, fontWeight:500 }}>Deep dives and cultural immersion</p>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {reviewItems.map(([fn,icon,label,desc], i) => (
            <button key={i} className="tc"
              style={{ display:"flex", alignItems:"center", gap:12, padding:"14px", textAlign:"left" }}
              onClick={fn}>
              <div style={{ width:40, height:40, borderRadius:12, background:"var(--bar-bg)", border:"1px solid var(--card-b)",
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>
                {icon}
              </div>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:800, color:"var(--heading)", lineHeight:1.2 }}>{label}</div>
                <div style={{ fontSize:10, color:"var(--subtext)", marginTop:2, lineHeight:1.3 }}>{desc}</div>
              </div>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Native Speaker Skills" icon="🌟" count="5 tools" defaultOpen={true}>
        <p style={{ fontSize:12, color:"var(--subtext)", marginBottom:10, fontWeight:500 }}>Advanced tools to reach native-level fluency</p>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {[
            [startPitchAccent, "🎵", "Pitch Accent", "Master Croatian tonal stress"],
            [startShadowing,   "🗣️", "Shadowing",    "Native-speed listen & repeat"],
            [startReview,      "🔁", "SRS Review",   "Smart spaced repetition"],
            [startWriting,     "✍️", "Free Writing",  "Write & get AI feedback"],
            [startAspectDrill, "🔄", "Aspect Drill",  "Imperfective vs perfective"],
          ].map(([fn,icon,label,desc], i) => (
            <button key={i} className="tc"
              style={{ display:"flex", alignItems:"center", gap:12, padding:"14px", textAlign:"left" }}
              onClick={fn}>
              <div style={{ width:40, height:40, borderRadius:12, background:"var(--bar-bg)", border:"1px solid var(--card-b)",
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>
                {icon}
              </div>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:800, color:"var(--heading)", lineHeight:1.2 }}>{label}</div>
                <div style={{ fontSize:10, color:"var(--subtext)", marginTop:2, lineHeight:1.3 }}>{desc}</div>
              </div>
            </button>
          ))}
        </div>
      </Section>

    </React.Fragment>
  );
}
