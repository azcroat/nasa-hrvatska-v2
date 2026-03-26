import React, { useState, useMemo } from 'react';
import { H, V, LISTEN, UNJUMBLE, PREPDRILL, NUMTIME, getSR, getDueReviews } from '../../data.jsx';

function Section({ title, icon, count, description, defaultOpen = false, open: controlledOpen, onToggle, children }) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onToggle !== undefined ? onToggle : setInternalOpen;
  return (
    <div style={{ marginBottom:'var(--space-sm)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display:'flex', alignItems:'center', gap:'var(--space-sm)', width:'100%',
          padding:'13px 16px', borderRadius:14,
          background:'var(--card)', border:'1px solid var(--card-b)',
          cursor:'pointer', fontFamily:"'Outfit',sans-serif",
          boxShadow:'0 1px 3px rgba(0,0,0,.06)',
          marginBottom: open ? 10 : 0,
        }}
      >
        <span style={{ fontSize:18 }}>{icon}</span>
        <div style={{ flex:1, textAlign:'left' }}>
          <span style={{ fontSize:14, fontWeight:800, color:'var(--heading)' }}>{title}</span>
          {description && (
            <div style={{fontSize:11, color:'var(--subtext)', marginTop:2, fontWeight:500}}>{description}</div>
          )}
        </div>
        <span style={{ fontSize:'var(--text-xs)', color:'var(--subtext)', fontWeight:600, background:'var(--bar-bg)', borderRadius:8, padding:'2px 8px' }}>{count}</span>
        <span style={{ fontSize:'var(--text-xs)', color:'var(--subtext)', opacity:.5, marginLeft:4 }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && <div style={{ marginBottom:16 }}>{children}</div>}
    </div>
  );
}

// Q-4: PracticeTab now receives callbacks instead of raw App.jsx state setters.
// Screens manage their own state; App.jsx only keeps state needed by screen props.
export default function PracticeTab({
  allCats, sh, setScr, sCurEx,
  onLaunchQuiz, onLaunchFlash, onLaunchListen, onLaunchMatch, onLaunchSpeaking,
  lc = 0,
}) {
  const [weakMsg, setWeakMsg] = useState("");
  const [levelFilter, setLevelFilter] = useState('All');
  const [secGrammar, setSecGrammar] = useState(false);
  const [secVocab, setSecVocab] = useState(false);
  const [secPractical, setSecPractical] = useState(false);
  const [secReading, setSecReading] = useState(false);
  const [secSlang, setSecSlang] = useState(false);
  const [secAdvanced, setSecAdvanced] = useState(false);
  const allOpen = secGrammar && secVocab && secPractical && secReading && secSlang && secAdvanced;
  function openAllSections() {
    setSecGrammar(true); setSecVocab(true); setSecPractical(true);
    setSecReading(true); setSecSlang(true); setSecAdvanced(true);
  }
  function closeAllSections() {
    setSecGrammar(false); setSecVocab(false); setSecPractical(false);
    setSecReading(false); setSecSlang(false); setSecAdvanced(false);
  }
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
    const initPool = sh(sel.map((w,i)=>({id:"h"+i,t:w[0],p:i,tp:"hr"})).concat(sel.map((w,i)=>({id:"e"+i,t:w[1],p:i,tp:"en"}))));
    onLaunchMatch(initPool);
  }
  function startTyping() {
    // TypingScreen manages its own state internally
    setScr("typing"); sCurEx("typing");
  }
  function startListening() {
    onLaunchListen(sh(LISTEN).slice(0,8));
  }
  function startSpeaking() {
    const p = pool();
    const items = sh(p).slice(0,6);
    onLaunchSpeaking(items);
  }
  function startWeakWords() {
    const d = getSR();
    const p = pool();
    const weak = Object.entries(d).filter(e=>e[1].w>0).sort((a,b)=>(b[1].w/(b[1].r+1))-(a[1].w/(a[1].r+1)));
    if (weak.length < 3) { setWeakMsg("Words you miss 3+ times show up here for focused review. Make some mistakes — it's how you learn!"); return; }
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

  // Q-4: Screens (ZnamGame, Unjumble, PrepDrill, NumTime) all manage their own state internally.
  // These launch functions only navigate — no App.jsx state setters needed.
  const specialInit = {
    znam:      () => { setScr("znam"); sCurEx("znam"); },
    unjumble:  () => { setScr("unjumble"); sCurEx("unjumble"); },
    prepdrill: () => { setScr("prepdrill"); sCurEx("prepdrill"); },
    numtime:   () => { setScr("numtime"); sCurEx("numtime"); },
  };
  const go = screen => {
    if (screen.startsWith('slang:')) {
      const section = screen.slice(6);
      return () => { localStorage.setItem('slangInitSection', section); setScr('slang'); sCurEx('slang'); };
    }
    return specialInit[screen] || (() => { setScr(screen); sCurEx(screen); });
  };

  // ── SMART RECOMMENDATIONS ─────────────────────────────────────────────
  const dueReviews = useMemo(getDueReviews, []);
  const sr = getSR();
  const weakCount = Object.values(sr).filter(v => v.w > 0).length;
  const h = new Date().getHours();
  const placementDone = !!localStorage.getItem('nh_placement_done');
  const isNewUser = lc === 0 && !placementDone;
  const userGoal = localStorage.getItem('nh_goal');
  const goalSetDate = localStorage.getItem('nh_goal_set_date');
  const daysSinceGoalSet = goalSetDate ? Math.floor((Date.now() - parseInt(goalSetDate)) / 86400000) : 0;
  const showGoalReminder = userGoal && daysSinceGoalSet > 30 && !isNewUser;

  const recommendations = [
    weakCount >= 3
      ? { icon:'🧠', title:'Fix Weak Words', desc:`${weakCount} words need attention`, color:'rgba(220,38,38,.08)', border:'rgba(220,38,38,.25)', fn: () => { setWeakMsg(""); startWeakWords(); } }
      : { icon:'🎯', title:'Quick Quiz',      desc:'Test your vocabulary',             color:'rgba(234,88,12,.08)', border:'rgba(234,88,12,.25)', fn: startQuiz },
    h < 12
      ? { icon:'🃏', title:'Flashcards',   desc:'Start the day strong',     color:'rgba(124,58,237,.08)', border:'rgba(124,58,237,.25)', fn: startFlashcards }
      : h < 18
      ? { icon:'🎧', title:'Listening',    desc:'Train your ear',            color:'rgba(220,38,38,.08)', border:'rgba(220,38,38,.25)', fn: startListening }
      : { icon:'⚡', title:'Word Sprint',  desc:'End the day with speed',    color:'rgba(245,158,11,.08)', border:'rgba(245,158,11,.25)', fn: () => { setScr("wordsprint"); sCurEx("wordsprint"); } },
    { icon:'🔗', title:'Match Pairs', desc:'Quick memory game', color:'rgba(22,163,74,.08)', border:'rgba(22,163,74,.25)', fn: startMatch },
  ];

  // Goal-based recommendations — shown when nh_goal is set, giving the
  // personalisation we promised during onboarding
  const goalRecMap = {
    heritage: [
      { icon:'🏛️', title:'Croatian History',   desc:'Explore your roots',              color:'rgba(234,88,12,.08)', border:'rgba(234,88,12,.25)', fn:()=>{setScr("history");sCurEx("history");} },
      { icon:'🌟', title:'Proverbs',            desc:'Wisdom through generations',      color:'rgba(124,58,237,.08)', border:'rgba(124,58,237,.25)', fn:()=>{setScr("proverbs");sCurEx("proverbs");} },
      { icon:'📖', title:'Reading',             desc:'Stories from Croatia',            color:'rgba(22,163,74,.08)', border:'rgba(22,163,74,.25)', fn:()=>{setScr("readlist");sCurEx("readlist");} },
    ],
    family: [
      { icon:'🃏', title:'Family Words',        desc:'People & relationships',          color:'rgba(234,88,12,.08)', border:'rgba(234,88,12,.25)', fn:()=>{ const p=V['family']||[]; onLaunchFlash(sh(p).slice(0,20)); } },
      { icon:'🎤', title:'Speaking',            desc:'Say it out loud',                 color:'rgba(14,116,144,.08)', border:'rgba(14,116,144,.25)', fn:startSpeaking },
      { icon:'💬', title:'Dialogue Sim',        desc:'Real-life conversations',         color:'rgba(124,58,237,.08)', border:'rgba(124,58,237,.25)', fn:()=>{setScr("dialogue");sCurEx("dialogue");} },
    ],
    travel: [
      { icon:'🍽️', title:'Restaurant',         desc:'Order like a local',              color:'rgba(234,88,12,.08)', border:'rgba(234,88,12,.25)', fn:()=>{setScr("restaurant");sCurEx("restaurant");} },
      { icon:'🚗', title:'Transport',           desc:'Get around Croatia',              color:'rgba(22,163,74,.08)', border:'rgba(22,163,74,.25)', fn:()=>{setScr("transport");sCurEx("transport");} },
      { icon:'🚨', title:'Emergency',           desc:'Phrases that matter most',        color:'rgba(220,38,38,.08)', border:'rgba(220,38,38,.25)', fn:()=>{setScr("emergency");sCurEx("emergency");} },
    ],
    culture: [
      { icon:'🌊', title:'Immersion Hub',       desc:'Full Croatian immersion',         color:'rgba(14,116,144,.08)', border:'rgba(14,116,144,.25)', fn:()=>{setScr("immersion");sCurEx("immersion");} },
      { icon:'🤖', title:'AI Conversation',     desc:'Chat in Croatian',                color:'rgba(124,58,237,.08)', border:'rgba(124,58,237,.25)', fn:()=>{setScr("aiconvo");sCurEx("aiconvo");} },
      { icon:'🎵', title:'Song Lyrics',         desc:'Learn through music',             color:'rgba(234,88,12,.08)', border:'rgba(234,88,12,.25)', fn:()=>{setScr("lyrics");sCurEx("lyrics");} },
    ],
    fluent: [
      { icon:'🎓', title:'CEFR Test',           desc:'Check your level A1→B2',          color:'rgba(14,116,144,.08)', border:'rgba(14,116,144,.25)', fn:()=>{setScr("cefrtest");sCurEx("cefrtest");} },
      { icon:'💬', title:'Dialogue Sim',        desc:'Real turn-based conversations',   color:'rgba(124,58,237,.08)', border:'rgba(124,58,237,.25)', fn:()=>{setScr("dialogue");sCurEx("dialogue");} },
      { icon:'🗣️', title:'Shadowing',           desc:'Native-speed listen & repeat',    color:'rgba(22,163,74,.08)', border:'rgba(22,163,74,.25)', fn:()=>{setScr("shadowing");sCurEx("shadowing");} },
    ],
    partner: [
      { icon:'💑', title:'In-Law Words',    desc:'Svekrva, punac, šogor...',    color:'rgba(234,88,12,.08)', border:'rgba(234,88,12,.25)', fn:()=>{ const p=V['inlaws']||[]; onLaunchFlash(sh(p||[]).slice(0,20)); } },
      { icon:'🍽️', title:'Survival Dinner', desc:'Navigate family gatherings',   color:'rgba(22,163,74,.08)', border:'rgba(22,163,74,.25)', fn:()=>{setScr("survival_dinner");sCurEx("survival_dinner");} },
      { icon:'🎤', title:'Speaking',         desc:'Impress them out loud',        color:'rgba(14,116,144,.08)', border:'rgba(14,116,144,.25)', fn:startSpeaking },
    ],
  };
  const goalItems = userGoal ? goalRecMap[userGoal] : null;
  const goalLabels = { heritage:'Your Heritage', family:'Speaking with Family', travel:'Traveling to Croatia', culture:'Croatian Culture', fluent:'Becoming Fluent', partner:'Your Partner\'s Language' };

  function ExRow({ items }) {
    return (
      <div className="g2">
        {items.map(([icon,label,screen,desc,meta]) => (
          <button key={screen} className="tc"
            style={{ display:"flex", alignItems:"center", gap:12, padding:"14px", textAlign:"left" }}
            onClick={go(screen)}>
            <div style={{ width:40, height:40, borderRadius:12, background:"var(--bar-bg)", border:"1px solid var(--card-b)",
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>
              {icon}
            </div>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:'var(--text-sm)', fontWeight:800, color:"var(--heading)", lineHeight:1.2 }}>{label}</div>
              <div style={{ fontSize:10, color:"var(--subtext)", marginTop:2, lineHeight:1.3 }}>{desc}</div>
              {meta && (
                <div style={{display:'flex', gap:6, flexWrap:'wrap', marginTop:4, alignItems:'center'}}>
                  {meta.level && (
                    <span style={{
                      fontSize:10, fontWeight:800, padding:'2px 7px',
                      borderRadius:4, background:'var(--info-bg, #f0f9ff)', color:'var(--info, #0e7490)',
                      border:'1px solid var(--info-b, #bae6fd)'
                    }}>
                      {meta.level}
                    </span>
                  )}
                  {meta.duration && (
                    <span style={{fontSize:10, color:'var(--subtext)', fontWeight:600}}>
                      ⏱ {meta.duration}
                    </span>
                  )}
                  {meta.format && (
                    <span style={{fontSize:10, color:'var(--subtext)'}}>· {meta.format}</span>
                  )}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    );
  }

  const grammarDrills = [
    ["⭐","Case Constellation", "grammarmap", "Explore all 7 cases visually",       {level:'B1', duration:'~10 min', format:'Grammar drill'}],
    ["🧩","Sentence Cloze","cloze","Fill the blank — cases in context",             {level:'A2', duration:'~8 min',  format:'Fill in blank'}],
    ["🧩","Word Order",    "unjumble",    "Put words in the right order",            {level:'A2', duration:'~8 min',  format:'Fill in blank'}],
    ["📍","Prepositions",  "prepdrill",   "u, na, od, do — which one?",             {level:'A2', duration:'~8 min',  format:'Grammar drill'}],
    ["❓","Questions",     "qwords",      "Tko, Što, Gdje, Zašto...",               {level:'A1+', duration:'~5 min', format:'Multiple choice'}],
    ["❌","Negation",      "negation",    "Ne, nije, nisam...",                      {level:'A2', duration:'~8 min',  format:'Grammar drill'}],
    ["♂️♀️","Gender",     "genderdrill", "Masculine, feminine, neuter",             {level:'A1+', duration:'~5 min', format:'Multiple choice'}],
    ["👨‍⚖️","M/F Jobs",  "profgender",  "Učitelj vs učiteljica",                  {level:'A2', duration:'~5 min',  format:'Multiple choice'}],
    ["📈","Compare",       "comparatives","Bigger, faster, better",                  {level:'B1', duration:'~10 min', format:'Grammar drill'}],
    ["🚀","Future Tense",  "future",      "ću, ćeš, će...",                         {level:'B1', duration:'~10 min', format:'Grammar drill'}],
    ["🔄","Sibilization",  "sibil",       "k→c, g→z sound changes",                 {level:'B1', duration:'~8 min',  format:'Grammar drill'}],
    ["🎨","Color Agreement","coloragree", "Colors match noun gender",                {level:'A2', duration:'~5 min',  format:'Multiple choice'}],
    ["🍽️","Accusative",   "akudrill",    "Direct objects change form",              {level:'B1', duration:'~10 min', format:'Grammar drill'}],
    ["🔗","Koji/Koja",     "relpron",     "Relative pronouns",                       {level:'B1', duration:'~8 min',  format:'Grammar drill'}],
    ["🧲","SE Verbs",      "reflexive",   "Reflexive verbs with se/si",              {level:'B1', duration:'~10 min', format:'Grammar drill'}],
    ["🏗️","Build Sentences","sentbuild",  "Arrange the building blocks",            {level:'A2', duration:'~8 min',  format:'Fill in blank'}],
    ["🔗","Clitic Drill",    "clitic",     "The #1 hardest rule in Croatian",        {level:'B1+', duration:'~10 min', format:'Grammar drill'}],
    ["🔢","Numbers+Cases",   "numcases",   "1/2-4/5+ — never wrong again",           {level:'B1', duration:'~10 min', format:'Grammar drill'}],
    ["⚡","Imperative",      "imperative", "Commands — essential production",         {level:'B1', duration:'~8 min',  format:'Grammar drill'}],
    ["❌","Negation+Genitive","neggen",    "Negate correctly — case shifts!",         {level:'B1', duration:'~10 min', format:'Grammar drill'}],
  ];

  const vocabularyDrills = [
    ["🇭🇷","Translate",    "znam",       "English ↔ Croatian",                      {level:'A1+', duration:'~5 min', format:'Multiple choice'}],
    ["👤","My/Your",        "possess",    "Moj, tvoj, njegov, njezin",               {level:'A1+', duration:'~5 min', format:'Multiple choice'}],
    ["↔️","Opposites",      "opposites",  "Hot/cold, big/small...",                  {level:'A1+', duration:'~5 min', format:'Card flip'}],
    ["🏢","Ordinals",       "ordinals",   "First, second, third...",                 {level:'A2', duration:'~5 min',  format:'Multiple choice'}],
    ["😀","Emotions",       "emogender",  "Sretan, sretna — feel it",                {level:'A2', duration:'~5 min',  format:'Multiple choice'}],
    ["💪","20 Core Verbs",  "verbdrill",  "The most-used Croatian verbs",            {level:'A2', duration:'~8 min',  format:'Grammar drill'}],
    ["🎯","Pronouns",       "pronouns",   "Ja, ti, on, ona, mi...",                  {level:'A1+', duration:'~5 min', format:'Multiple choice'}],
    ["🏙️","City Locations","cityloc",    "Where is it in Croatia?",                 {level:'A2+', duration:'~5 min', format:'Game'}],
    ["🔀","Collocations",   "collocations",  "Which words belong together",          {level:'B1', duration:'~8 min',  format:'Multiple choice'}],
    ["🌱","Word Families",  "wordfamilies",  "One root, a hundred words",            {level:'B1', duration:'~8 min',  format:'Multiple choice'}],
  ];

  const practicalCroatian = [
    ["🍽️","Restaurant",   "restaurant",  "Order food like a local",                 {level:'A2', duration:'~8 min',  format:'Fill in blank'}],
    ["🔢","Numbers & Time","numtime",     "Tell time, count anything",               {level:'A2', duration:'~5 min',  format:'Multiple choice'}],
    ["💬","Conversations", "convmatch",   "Match real-world dialogues",              {level:'A2+', duration:'~8 min', format:'Multiple choice'}],
    ["🖼️","Describe",     "scenes",      "Describe what you see",                   {level:'B1', duration:'~8 min',  format:'Grammar drill'}],
    ["⏳","Tense Flip",    "tenseflip",   "Switch tense on the fly",                 {level:'B1', duration:'~8 min',  format:'Grammar drill'}],
  ];

  const readingFun = [
    ["📝","Story Fill",    "fillstory",  "Fill in the blanks",                       {level:'B1', duration:'~15 min', format:'Reading'}],
    ["📖","Stories",       "storyselect","Read short Croatian tales",                {level:'B1', duration:'~15 min', format:'Reading'}],
    ["🧩","Riddles",       "riddles",    "Can you guess the answer?",                {level:'A2+', duration:'~5 min', format:'Game'}],
    ["🧠","Think Croatian","logicquiz",  "Logic puzzles in Croatian",                {level:'B1', duration:'~10 min', format:'Multiple choice'}],
    ["😝","Tongue Twisters","brzalice",  "Brzalice — dare yourself",                 {level:'A2+', duration:'~5 min', format:'Game'}],
  ];

  const culturalExtras = [
    [() => { setScr("proverbs"); sCurEx("proverbs"); }, "🌟","Proverbs","Croatian wisdom & sayings"],
    [() => { setScr("idioms"); sCurEx("idioms"); },     "🗣️","Idioms",  "Phrases locals actually use"],
    [() => { setScr("events"); sCurEx("events"); },     "📅","Events",  "Festivals & holidays"],
  ];

  return (
    <React.Fragment>
      {H("🎮 Practice", "Games, exercises & daily review")}

      {/* ── TODAY'S FOCUS BANNER ────────────────────────────────────────── */}
      <div style={{
        background:'linear-gradient(135deg,var(--info),#0c4a6e)',
        borderRadius:18, padding:'18px 20px', marginBottom:16,
        display:'flex', alignItems:'center', gap:14,
        boxShadow:'0 4px 20px rgba(14,116,144,.25)',
        animation:'rise .4s ease',
      }}>
        <div style={{fontSize:36}}>🎯</div>
        <div style={{flex:1}}>
          <div style={{fontSize:11, fontWeight:800, color:'rgba(255,255,255,.65)', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:4}}>TODAY'S FOCUS</div>
          <div style={{fontSize:17, fontWeight:900, color:'white', marginBottom:4}}>Practice makes perfect</div>
          <div style={{fontSize:12, color:'rgba(255,255,255,.7)'}}>Pick any exercise below to earn XP</div>
        </div>
      </div>

      {/* ── SRS DUE BANNER ──────────────────────────────────────────────── */}
      {Object.keys(sr).length > 0 && dueReviews.length === 0 && (
        <div style={{
          background: 'var(--success-bg)',
          border: '1.5px solid var(--success-b, rgba(22,163,74,0.3))',
          borderRadius: 14,
          padding: '12px 16px',
          marginBottom: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <span style={{ fontSize: 22 }}>✅</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--success)' }}>
              All caught up!
            </div>
            <div style={{ fontSize: 12, color: 'var(--subtext)', marginTop: 2 }}>
              No reviews due. Keep practicing to grow your vocabulary queue.
            </div>
          </div>
        </div>
      )}
      {dueReviews.length > 0 && (
        <button
          onClick={startReview}
          style={{
            width:"100%", display:"flex", alignItems:"center", gap:14,
            padding:"14px 16px", borderRadius:14, marginBottom:16, border:"none", cursor:"pointer",
            background:"linear-gradient(135deg,#312e81,#4338ca)",
            boxShadow:"0 4px 16px rgba(67,56,202,.35)",
            fontFamily:"'Outfit',sans-serif",
          }}
        >
          <div style={{
            width:42, height:42, borderRadius:12, flexShrink:0,
            background:"rgba(255,255,255,.15)", border:"1.5px solid rgba(255,255,255,.3)",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:22,
          }}>📅</div>
          <div style={{ flex:1, textAlign:"left" }}>
            <div style={{ fontSize:'var(--text-base)', fontWeight:900, color:"#fff" }}>
              {dueReviews.length} word{dueReviews.length !== 1 ? "s" : ""} due for review
            </div>
            <div style={{ fontSize:'var(--text-xs)', color:"rgba(255,255,255,.75)", marginTop:1, fontWeight:600 }}>
              Tap to review now — spaced repetition keeps words in memory
            </div>
          </div>
          <div style={{ fontSize:18, color:"rgba(255,255,255,.8)", fontWeight:300 }}>›</div>
        </button>
      )}

      {/* ── RECOMMENDED FOR YOU ─────────────────────────────────────────── */}
      <div className="section-hdr">
        <div className="section-hdr-icon" style={{background:'rgba(245,158,11,.12)'}}>✨</div>
        <div className="section-hdr-text">
          <div className="section-hdr-title">Recommended for You</div>
          <div className="section-hdr-sub">Picked based on your progress today</div>
        </div>
      </div>
      {isNewUser ? (
        <div style={{ background:"var(--bar-bg)", border:"1.5px solid var(--card-b)", borderRadius:14, padding:"20px", marginBottom:24 }}>
          <div style={{ textAlign: 'center', padding: '20px 16px 8px' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🎯</div>
            <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--heading)', marginBottom: 6 }}>
              Ready to practice?
            </div>
            <div style={{ fontSize: 13, color: 'var(--subtext)', lineHeight: 1.6 }}>
              Jump into a Quick Game below, or complete your first lesson in <strong>Learn</strong> to unlock personalized recommendations.
            </div>
          </div>
          <button className="b bp" style={{ fontSize:14, padding:"12px 24px", width:'100%', marginTop:8 }} onClick={() => setScr("learnpath")}>
            Go to Learning Path →
          </button>
        </div>
      ) : (
        <>
          {goalItems && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:'var(--text-xs)', fontWeight:800, color:'var(--subtext)', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:'var(--space-sm)' }}>
                🎯 For your goal: {goalLabels[userGoal]}
              </div>
              <div className="g3" style={{ marginBottom:16 }}>
                {goalItems.map((r, i) => (
                  <button key={i} className="tc"
                    style={{ textAlign:"center", padding:"16px 10px", background:r.color, border:`1.5px solid ${r.border}` }}
                    onClick={r.fn}>
                    <div style={{ fontSize:28, marginBottom:6 }}>{r.icon}</div>
                    <div style={{ fontSize:'var(--text-sm)', fontWeight:800, color:"var(--heading)", lineHeight:1.2 }}>{r.title}</div>
                    <div style={{ fontSize:10, color:"var(--subtext)", marginTop:4, lineHeight:1.3 }}>{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="g3" style={{ marginBottom:24 }}>
            {recommendations.map((r, i) => (
              <button key={i} className="tc"
                style={{ textAlign:"center", padding:"16px 10px", background:r.color, border:`1.5px solid ${r.border}` }}
                onClick={r.fn}>
                <div style={{ fontSize:28, marginBottom:6 }}>{r.icon}</div>
                <div style={{ fontSize:'var(--text-sm)', fontWeight:800, color:"var(--heading)", lineHeight:1.2 }}>{r.title}</div>
                <div style={{ fontSize:10, color:"var(--subtext)", marginTop:4, lineHeight:1.3 }}>{r.desc}</div>
              </button>
            ))}
          </div>
        </>
      )}
      {showGoalReminder && (
        <div style={{
          background:'var(--bar-bg)', border:'1.5px solid var(--card-b)',
          borderRadius:12, padding:'12px 14px', marginBottom:16,
          display:'flex', alignItems:'center', gap:'var(--space-sm)',
        }}>
          <span style={{fontSize:18}}>🎯</span>
          <div style={{flex:1}}>
            <div style={{fontSize:'var(--text-sm)',fontWeight:700,color:'var(--heading)'}}>Still working toward your goal?</div>
            <div style={{fontSize:'var(--text-xs)',color:'var(--subtext)',marginTop:2}}>Your goal is set to "{goalLabels[userGoal]}". Update it in Profile → Settings if needed.</div>
          </div>
        </div>
      )}
      {weakMsg && (
        <div className="empty-state" style={{ background:"#fffbeb", border:"1.5px solid #fde68a", borderRadius:16, marginBottom:16, position:"relative" }}>
          <div className="es-icon">🧠</div>
          <div className="es-title">Not enough weak words yet</div>
          <div className="es-desc">{weakMsg}</div>
          <button onClick={() => setWeakMsg("")} style={{ position:"absolute", top:10, right:12, background:"none", border:"none", cursor:"pointer", fontSize:18, color:"#92400e", lineHeight:1, opacity:.6 }} aria-label="Dismiss">×</button>
        </div>
      )}

      {/* ── QUICK GAMES ─────────────────────────────────────────────────── */}
      <div className="section-hdr">
        <div className="section-hdr-icon" style={{background:'rgba(245,158,11,.12)'}}>⚡</div>
        <div className="section-hdr-text">
          <div className="section-hdr-title">Quick Games</div>
          <div className="section-hdr-sub">Tap any to start instantly</div>
        </div>
      </div>
      <div className="g3" style={{ marginBottom:24 }}>
        {[
          [startQuiz,       "🎯","Quiz",         "#fff7ed","#fed7aa"],
          [startFlashcards, "🃏","Flashcards",   "#f5f3ff","#ddd6fe"],
          [startMatch,      "🔗","Match Pairs",  "#f0fdf4","#bbf7d0"],
          [startTyping,     "⌨️","Typing",       "#fef9c3","#fde047"],
          [startListening,  "🎧","Listening",    "#fff1f2","#fecaca"],
          [startSpeaking,   "🎤","Pronunciation","#f0f9ff","#bae6fd"],
          [() => { setScr("wordsprint"); sCurEx("wordsprint"); },"⚡","Word Sprint","#fffbeb","#fde68a"],
        ].map((/** @type {any} */ [fn,icon,label,bg,border], i) => (
          <button key={i} className="tc"
            style={{ textAlign:"center", padding:"14px 8px", background:bg, border:`1.5px solid ${border}` }}
            onClick={fn}>
            <div style={{ fontSize:28 }}>{icon}</div>
            <div style={{ fontSize:'var(--text-xs)', fontWeight:800, marginTop:5, color:"var(--heading)" }}>{label}</div>
          </button>
        ))}
      </div>

      {/* ── COLLAPSIBLE DRILL SECTIONS ──────────────────────────────────── */}
      <div className="section-hdr">
        <div className="section-hdr-icon" style={{background:'rgba(99,102,241,.12)'}}>📚</div>
        <div className="section-hdr-text">
          <div className="section-hdr-title">All Exercises</div>
          <div className="section-hdr-sub">Grammar, vocabulary, and more — sorted by category</div>
        </div>
      </div>
      <div style={{display:'flex', gap:6, marginBottom:16, flexWrap:'wrap'}}>
        {['All', 'A1', 'A2', 'B1', 'B2'].map(l => (
          <button
            key={l}
            onClick={() => setLevelFilter(l)}
            style={{
              padding:'6px 14px', borderRadius:20, fontSize:12, fontWeight:700,
              border: levelFilter === l ? 'none' : '1.5px solid var(--card-b)',
              background: levelFilter === l ? 'var(--info, #0e7490)' : 'var(--card)',
              color: levelFilter === l ? 'white' : 'var(--subtext)',
              cursor:'pointer', transition:'all .15s',
              fontFamily:"'Outfit',sans-serif",
            }}
          >
            {l === 'All' ? 'All Levels' : l}
          </button>
        ))}
      </div>

      <Section title="Grammar Drills" icon="📝" count={`${grammarDrills.length} exercises`} description="Targeted practice for Croatian cases, verbs, and sentence structure" open={secGrammar} onToggle={() => setSecGrammar(o => !o)}>
        <p style={{ fontSize:'var(--text-sm)', color:"var(--subtext)", marginBottom:'var(--space-sm)', fontWeight:500 }}>Master Croatian structure step by step</p>
        <ExRow items={grammarDrills} />
      </Section>

      <Section title="Vocabulary" icon="🔤" count={`${vocabularyDrills.length} exercises`} description="Fast 5-minute vocabulary games — great for daily practice" open={secVocab} onToggle={() => setSecVocab(o => !o)}>
        <p style={{ fontSize:'var(--text-sm)', color:"var(--subtext)", marginBottom:'var(--space-sm)', fontWeight:500 }}>Build and reinforce your word bank</p>
        <ExRow items={vocabularyDrills} />
      </Section>

      <Section title="Practical Croatian" icon="🌍" count={`${practicalCroatian.length} exercises`} open={secPractical} onToggle={() => setSecPractical(o => !o)}>
        <p style={{ fontSize:'var(--text-sm)', color:"var(--subtext)", marginBottom:'var(--space-sm)', fontWeight:500 }}>Real situations, real language</p>
        <ExRow items={practicalCroatian} />
      </Section>

      <Section title="Reading & Fun" icon="📖" count={`${readingFun.length} exercises`} open={secReading} onToggle={() => setSecReading(o => !o)}>
        <p style={{ fontSize:'var(--text-sm)', color:"var(--subtext)", marginBottom:'var(--space-sm)', fontWeight:500 }}>Stories, riddles, and challenges</p>
        <ExRow items={readingFun} />
      </Section>

      <Section title="Slang & Expressions" icon="🗣️" count="12 modules · 150+ phrases" description="Listening, shadowing, and conversation practice for fluency" open={secSlang} onToggle={() => setSecSlang(o => !o)}>
        <p style={{ fontSize:'var(--text-sm)', color:"var(--subtext)", marginBottom:'var(--space-sm)', fontWeight:500 }}>Authentic slang, psovanje & street language with cultural context</p>
        <ExRow items={[
          ['🔥', 'The Classics',      'slang:classics',   'Foundation expletives — built on one root verb', {level:'B1+', duration:'~10 min', format:'Immersion'}],
          ['😤', 'Svaki Dan',          'slang:everyday',   'Mild-to-medium — usable around most adults',    {level:'A2+', duration:'~8 min',  format:'Immersion'}],
          ['😎', 'Ulični Sleng',       'slang:slang',      'General everyday slang — sound like a local',   {level:'A2+', duration:'~8 min',  format:'Immersion'}],
          ['👥', 'Ljudi i Adrese',     'slang:people',     'How Croatians address each other',              {level:'A2', duration:'~5 min',   format:'Immersion'}],
          ['☀️', 'Dalmatinski',       'slang:dalmatian',  'Split, Dalmatia & coast dialect',               {level:'B1', duration:'~10 min',  format:'Immersion'}],
          ['🏙️', 'Zagrebački',       'slang:zagreb',     'Capital city slang — German meets Slavic',      {level:'B1', duration:'~10 min',  format:'Immersion'}],
          ['🔄', 'Šatrovački',        'slang:satrovski',  'Croatian pig latin — reverse syllable slang',   {level:'B1+', duration:'~10 min', format:'Immersion'}],
          ['📱', 'Gen Z & Internet',   'slang:genz',       'Digital generation slang & memes',              {level:'A2+', duration:'~8 min',  format:'Immersion'}],
          ['🍺', 'Pijani & Mamurani', 'slang:pijani',     'Drinking culture & hangover vocabulary',         {level:'B1', duration:'~8 min',   format:'Immersion'}],
          ['⚽', 'Nogomet',            'slang:football',   'Football supporter slang',                      {level:'A2+', duration:'~8 min',  format:'Immersion'}],
          ['🗺️', 'Zagreb vs Split',  'slang:regional',   'Regional rivalries & dialect wars',             {level:'B1', duration:'~10 min',  format:'Immersion'}],
          ['🎨', 'Psovanje kao Kunst', 'slang:art',        'Swearing elevated to an art form',              {level:'B2', duration:'~10 min',  format:'Immersion'}],
        ]} />
      </Section>

      <Section title="Advanced Tools" icon="⚡" count="9 tools" description="Listening, shadowing, and conversation practice for fluency" open={secAdvanced} onToggle={() => setSecAdvanced(o => !o)}>
        <p style={{ fontSize:'var(--text-sm)', color:"var(--subtext)", marginBottom:'var(--space-sm)', fontWeight:500 }}>
          Advanced exercises to reach native-level fluency — close the gap from B1 to C1
        </p>
        <div className="g2">
          {[
            [startPitchAccent,                                              "🎵", "Pitch Accent",   "Master Croatian tonal stress"],
            [startShadowing,                                                "🗣️", "Shadowing",      "Native-speed listen & repeat"],
            [startReview,                                                   "🔁", "SRS Review",     "Smart spaced repetition"],
            [startWriting,                                                  "✍️", "Free Writing",   "Write & get AI feedback"],
            [startAspectDrill,                                              "🔄", "Aspect Drill",   "Imperfective vs perfective"],
            [() => { setScr("dialogue"); sCurEx("dialogue"); },            "💬", "Dialogue Sim",   "Real turn-based conversations"],
            [() => { setScr("dictation"); sCurEx("dictation"); },          "🎧", "Dictation",      "Listen and type Croatian"],
            [() => { setScr("proncontrast"); sCurEx("proncontrast"); },    "🔤", "Sound Contrast", "č/ć, š/ž, đ/dž mastery"],
            [() => { setScr("cefrtest"); sCurEx("cefrtest"); },            "🎓", "CEFR Test",      "A1→B2 proficiency check"],
          ].map((/** @type {any} */ [fn,icon,label,desc], i) => (
            <button key={i} className="tc"
              style={{ display:"flex", alignItems:"center", gap:12, padding:"14px", textAlign:"left" }}
              onClick={fn}>
              <div style={{ width:40, height:40, borderRadius:12, background:"var(--bar-bg)", border:"1px solid var(--card-b)",
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>
                {icon}
              </div>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:'var(--text-sm)', fontWeight:800, color:"var(--heading)", lineHeight:1.2 }}>{label}</div>
                <div style={{ fontSize:10, color:"var(--subtext)", marginTop:2, lineHeight:1.3 }}>{desc}</div>
              </div>
            </button>
          ))}
        </div>
      </Section>

      {/* ── BROWSE ALL TOGGLE ───────────────────────────────────────────── */}
      <button
        onClick={() => { allOpen ? closeAllSections() : openAllSections(); }}
        style={{
          width:'100%', padding:'14px', borderRadius:14, marginTop:8, marginBottom:8,
          background:'none', border:'1.5px solid var(--card-b)',
          color:'var(--subtext)', fontSize:13, fontWeight:700,
          cursor:'pointer', fontFamily:"'Outfit',sans-serif",
          display:'flex', alignItems:'center', justifyContent:'center', gap:6,
        }}
      >
        <span>📚</span>
        <span>{allOpen ? 'Hide All Exercises' : 'Browse All Exercises'}</span>
      </button>

      {/* ── CULTURAL EXTRAS FOOTER ──────────────────────────────────────── */}
      <div style={{ marginTop:8, marginBottom:16 }}>
        <div className="section-hdr">
          <div className="section-hdr-icon" style={{background:'rgba(124,58,237,.12)'}}>🌟</div>
          <div className="section-hdr-text">
            <div className="section-hdr-title">Cultural Extras</div>
            <div className="section-hdr-sub">Proverbs, idioms & Croatian traditions</div>
          </div>
        </div>
        <div className="g3">
          {culturalExtras.map((/** @type {any} */ [fn,icon,label,desc], i) => (
            <button key={i} className="tc"
              style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6, padding:"14px 8px", textAlign:"center" }}
              onClick={fn}>
              <div style={{ width:36, height:36, borderRadius:10, background:"var(--bar-bg)", border:"1px solid var(--card-b)",
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>
                {icon}
              </div>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:'var(--text-xs)', fontWeight:800, color:"var(--heading)", lineHeight:1.2 }}>{label}</div>
                <div style={{ fontSize:9, color:"var(--subtext)", marginTop:2, lineHeight:1.3 }}>{desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

    </React.Fragment>
  );
}
