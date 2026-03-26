import React, { useState, useMemo } from 'react';
import { H, V, LISTEN, UNJUMBLE, PREPDRILL, NUMTIME, getSR, getDueReviews } from '../../data.jsx';

function Section({ title, icon, count, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
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
        <span style={{ flex:1, fontSize:14, fontWeight:800, color:'var(--heading)', textAlign:'left' }}>{title}</span>
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
      ? { icon:'🧠', title:'Fix Weak Words', desc:`${weakCount} words need attention`, color:'#fff1f2', border:'#fca5a5', fn: () => { setWeakMsg(""); startWeakWords(); } }
      : { icon:'🎯', title:'Quick Quiz',      desc:'Test your vocabulary',             color:'#fff7ed', border:'#fed7aa', fn: startQuiz },
    h < 12
      ? { icon:'🃏', title:'Flashcards',   desc:'Start the day strong',     color:'#f5f3ff', border:'#ddd6fe', fn: startFlashcards }
      : h < 18
      ? { icon:'🎧', title:'Listening',    desc:'Train your ear',            color:'#fff1f2', border:'#fecaca', fn: startListening }
      : { icon:'⚡', title:'Word Sprint',  desc:'End the day with speed',    color:'#fffbeb', border:'#fde68a', fn: () => { setScr("wordsprint"); sCurEx("wordsprint"); } },
    { icon:'🔗', title:'Match Pairs', desc:'Quick memory game', color:'#f0fdf4', border:'#bbf7d0', fn: startMatch },
  ];

  // Goal-based recommendations — shown when nh_goal is set, giving the
  // personalisation we promised during onboarding
  const goalRecMap = {
    heritage: [
      { icon:'🏛️', title:'Croatian History',   desc:'Explore your roots',              color:'#fff7ed', border:'#fed7aa', fn:()=>{setScr("history");sCurEx("history");} },
      { icon:'🌟', title:'Proverbs',            desc:'Wisdom through generations',      color:'#faf5ff', border:'#ddd6fe', fn:()=>{setScr("proverbs");sCurEx("proverbs");} },
      { icon:'📖', title:'Reading',             desc:'Stories from Croatia',            color:'#f0fdf4', border:'#bbf7d0', fn:()=>{setScr("readlist");sCurEx("readlist");} },
    ],
    family: [
      { icon:'🃏', title:'Family Words',        desc:'People & relationships',          color:'#fff7ed', border:'#fed7aa', fn:()=>{ const p=V['family']||[]; onLaunchFlash(sh(p).slice(0,20)); } },
      { icon:'🎤', title:'Speaking',            desc:'Say it out loud',                 color:'#f0f9ff', border:'#bae6fd', fn:startSpeaking },
      { icon:'💬', title:'Dialogue Sim',        desc:'Real-life conversations',         color:'#faf5ff', border:'#ddd6fe', fn:()=>{setScr("dialogue");sCurEx("dialogue");} },
    ],
    travel: [
      { icon:'🍽️', title:'Restaurant',         desc:'Order like a local',              color:'#fff7ed', border:'#fed7aa', fn:()=>{setScr("restaurant");sCurEx("restaurant");} },
      { icon:'🚗', title:'Transport',           desc:'Get around Croatia',              color:'#f0fdf4', border:'#bbf7d0', fn:()=>{setScr("transport");sCurEx("transport");} },
      { icon:'🚨', title:'Emergency',           desc:'Phrases that matter most',        color:'#fff1f2', border:'#fecaca', fn:()=>{setScr("emergency");sCurEx("emergency");} },
    ],
    culture: [
      { icon:'🌊', title:'Immersion Hub',       desc:'Full Croatian immersion',         color:'#f0f9ff', border:'#bae6fd', fn:()=>{setScr("immersion");sCurEx("immersion");} },
      { icon:'🤖', title:'AI Conversation',     desc:'Chat in Croatian',                color:'#faf5ff', border:'#ddd6fe', fn:()=>{setScr("aiconvo");sCurEx("aiconvo");} },
      { icon:'🎵', title:'Song Lyrics',         desc:'Learn through music',             color:'#fff7ed', border:'#fed7aa', fn:()=>{setScr("lyrics");sCurEx("lyrics");} },
    ],
    fluent: [
      { icon:'🎓', title:'CEFR Test',           desc:'Check your level A1→B2',          color:'#f0f9ff', border:'#bae6fd', fn:()=>{setScr("cefrtest");sCurEx("cefrtest");} },
      { icon:'💬', title:'Dialogue Sim',        desc:'Real turn-based conversations',   color:'#faf5ff', border:'#ddd6fe', fn:()=>{setScr("dialogue");sCurEx("dialogue");} },
      { icon:'🗣️', title:'Shadowing',           desc:'Native-speed listen & repeat',    color:'#f0fdf4', border:'#bbf7d0', fn:()=>{setScr("shadowing");sCurEx("shadowing");} },
    ],
    partner: [
      { icon:'💑', title:'In-Law Words',    desc:'Svekrva, punac, šogor...',    color:'#fff7ed', border:'#fed7aa', fn:()=>{ const p=V['inlaws']||[]; onLaunchFlash(sh(p||[]).slice(0,20)); } },
      { icon:'🍽️', title:'Survival Dinner', desc:'Navigate family gatherings',   color:'#f0fdf4', border:'#bbf7d0', fn:()=>{setScr("survival_dinner");sCurEx("survival_dinner");} },
      { icon:'🎤', title:'Speaking',         desc:'Impress them out loud',        color:'#f0f9ff', border:'#bae6fd', fn:startSpeaking },
    ],
  };
  const goalItems = userGoal ? goalRecMap[userGoal] : null;
  const goalLabels = { heritage:'Your Heritage', family:'Speaking with Family', travel:'Traveling to Croatia', culture:'Croatian Culture', fluent:'Becoming Fluent', partner:'Your Partner\'s Language' };

  function ExRow({ items }) {
    return (
      <div className="g2">
        {items.map(([icon,label,screen,desc]) => (
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
            </div>
          </button>
        ))}
      </div>
    );
  }

  const grammarDrills = [
    ["⭐","Case Constellation", "grammarmap", "Explore all 7 cases visually"],
    ["🧩","Sentence Cloze","cloze","Fill the blank — cases in context"],
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
    ["🔗","Clitic Drill",    "clitic",     "The #1 hardest rule in Croatian"],
    ["🔢","Numbers+Cases",   "numcases",   "1/2-4/5+ — never wrong again"],
    ["⚡","Imperative",      "imperative", "Commands — essential production"],
    ["❌","Negation+Genitive","neggen",    "Negate correctly — case shifts!"],
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
    ["🔀","Collocations",   "collocations",  "Which words belong together"],
    ["🌱","Word Families",  "wordfamilies",  "One root, a hundred words"],
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

  const culturalExtras = [
    [() => { setScr("proverbs"); sCurEx("proverbs"); }, "🌟","Proverbs","Croatian wisdom & sayings"],
    [() => { setScr("idioms"); sCurEx("idioms"); },     "🗣️","Idioms",  "Phrases locals actually use"],
    [() => { setScr("events"); sCurEx("events"); },     "📅","Events",  "Festivals & holidays"],
  ];

  return (
    <React.Fragment>
      {H("🎮 Practice", "Games, exercises & daily review")}

      {/* ── SRS DUE BANNER ──────────────────────────────────────────────── */}
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
      <h3 className="sh">✨ Recommended for You</h3>
      {isNewUser ? (
        <div style={{ background:"var(--bar-bg)", border:"1.5px solid var(--card-b)", borderRadius:14, padding:"20px", marginBottom:24, textAlign:"center" }}>
          <div style={{ fontSize:40, marginBottom:8 }}>🗺️</div>
          <div style={{ fontSize:15, fontWeight:800, color:"var(--heading)", marginBottom:6 }}>Start your first lesson</div>
          <div style={{ fontSize:'var(--text-sm)', color:"var(--subtext)", marginBottom:16, lineHeight:1.5 }}>
            Complete a lesson in the Learn tab to unlock personalized practice recommendations.
          </div>
          <button className="b bp" style={{ fontSize:14, padding:"12px 24px" }} onClick={() => setScr("learnpath")}>
            Go to Learning Path →
          </button>
        </div>
      ) : (
        <>
          <p style={{ fontSize:'var(--text-sm)', color:"var(--subtext)", marginTop:-6, marginBottom:'var(--space-md)', fontWeight:500 }}>
            Picked based on your progress today
          </p>
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
      <h3 className="sh">⚡ Quick Games</h3>
      <p style={{ fontSize:'var(--text-sm)', color:"var(--subtext)", marginTop:-6, marginBottom:'var(--space-md)', fontWeight:500 }}>Tap any to start instantly</p>
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
      <div style={{ fontSize:'var(--text-xs)', fontWeight:800, color:'var(--subtext)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:'var(--space-md)' }}>
        All Exercises
      </div>

      <Section title="Grammar Drills" icon="📝" count={`${grammarDrills.length} exercises`} defaultOpen={false}>
        <p style={{ fontSize:'var(--text-sm)', color:"var(--subtext)", marginBottom:'var(--space-sm)', fontWeight:500 }}>Master Croatian structure step by step</p>
        <ExRow items={grammarDrills} />
      </Section>

      <Section title="Vocabulary" icon="🔤" count={`${vocabularyDrills.length} exercises`} defaultOpen={false}>
        <p style={{ fontSize:'var(--text-sm)', color:"var(--subtext)", marginBottom:'var(--space-sm)', fontWeight:500 }}>Build and reinforce your word bank</p>
        <ExRow items={vocabularyDrills} />
      </Section>

      <Section title="Practical Croatian" icon="🌍" count={`${practicalCroatian.length} exercises`} defaultOpen={false}>
        <p style={{ fontSize:'var(--text-sm)', color:"var(--subtext)", marginBottom:'var(--space-sm)', fontWeight:500 }}>Real situations, real language</p>
        <ExRow items={practicalCroatian} />
      </Section>

      <Section title="Reading & Fun" icon="📖" count={`${readingFun.length} exercises`} defaultOpen={false}>
        <p style={{ fontSize:'var(--text-sm)', color:"var(--subtext)", marginBottom:'var(--space-sm)', fontWeight:500 }}>Stories, riddles, and challenges</p>
        <ExRow items={readingFun} />
      </Section>

      <Section title="Slang & Expressions" icon="🗣️" count="12 modules · 150+ phrases" defaultOpen={false}>
        <p style={{ fontSize:'var(--text-sm)', color:"var(--subtext)", marginBottom:'var(--space-sm)', fontWeight:500 }}>Authentic slang, psovanje & street language with cultural context</p>
        <ExRow items={[
          ['🔥', 'The Classics',      'slang:classics',   'Foundation expletives — built on one root verb'],
          ['😤', 'Svaki Dan',          'slang:everyday',   'Mild-to-medium — usable around most adults'],
          ['😎', 'Ulični Sleng',       'slang:slang',      'General everyday slang — sound like a local'],
          ['👥', 'Ljudi i Adrese',     'slang:people',     'How Croatians address each other'],
          ['☀️', 'Dalmatinski',       'slang:dalmatian',  'Split, Dalmatia & coast dialect'],
          ['🏙️', 'Zagrebački',       'slang:zagreb',     'Capital city slang — German meets Slavic'],
          ['🔄', 'Šatrovački',        'slang:satrovski',  'Croatian pig latin — reverse syllable slang'],
          ['📱', 'Gen Z & Internet',   'slang:genz',       'Digital generation slang & memes'],
          ['🍺', 'Pijani & Mamurani', 'slang:pijani',     'Drinking culture & hangover vocabulary'],
          ['⚽', 'Nogomet',            'slang:football',   'Football supporter slang'],
          ['🗺️', 'Zagreb vs Split',  'slang:regional',   'Regional rivalries & dialect wars'],
          ['🎨', 'Psovanje kao Kunst', 'slang:art',        'Swearing elevated to an art form'],
        ]} />
      </Section>

      <Section title="Advanced Tools" icon="⚡" count="9 tools" defaultOpen={false}>
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

      {/* ── CULTURAL EXTRAS FOOTER ──────────────────────────────────────── */}
      <div style={{ marginTop:8, marginBottom:16 }}>
        <div style={{ fontSize:'var(--text-xs)', fontWeight:800, color:'var(--subtext)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:'var(--space-sm)' }}>
          Cultural Extras
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
