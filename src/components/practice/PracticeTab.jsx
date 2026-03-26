import React, { useState, useMemo } from 'react';
import { H, V, LISTEN, UNJUMBLE, PREPDRILL, NUMTIME, getSR, getDueReviews } from '../../data.jsx';

// Q-4: PracticeTab now receives callbacks instead of raw App.jsx state setters.
// Screens manage their own state; App.jsx only keeps state needed by screen props.
export default function PracticeTab({
  allCats, sh, setScr, sCurEx,
  onLaunchQuiz, onLaunchFlash, onLaunchListen, onLaunchMatch, onLaunchSpeaking,
  lc = 0,
}) {
  const [weakMsg, setWeakMsg] = useState("");
  const [pFilter, setPFilter] = useState('all');

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

  // ── ALL EXERCISES FLAT ARRAY ──────────────────────────────────────────
  // category: 'grammar' | 'vocab' | 'practical' | 'advanced'
  const EXERCISES = [
    // Grammar
    { id:'grammarmap',   label:'Case Constellation', icon:'⭐', desc:'Explore all 7 cases visually',           category:'grammar',  cefr:'B1',   duration:'~10 min', action: go('grammarmap') },
    { id:'cloze',        label:'Sentence Cloze',      icon:'🧩', desc:'Fill the blank — cases in context',      category:'grammar',  cefr:'A2',   duration:'~8 min',  action: go('cloze') },
    { id:'unjumble',     label:'Word Order',           icon:'🧩', desc:'Put words in the right order',           category:'grammar',  cefr:'A2',   duration:'~8 min',  action: go('unjumble') },
    { id:'prepdrill',    label:'Prepositions',         icon:'📍', desc:'u, na, od, do — which one?',             category:'grammar',  cefr:'A2',   duration:'~8 min',  action: go('prepdrill') },
    { id:'qwords',       label:'Questions',            icon:'❓', desc:'Tko, Što, Gdje, Zašto...',              category:'grammar',  cefr:'A1+',  duration:'~5 min',  action: go('qwords') },
    { id:'negation',     label:'Negation',             icon:'❌', desc:'Ne, nije, nisam...',                    category:'grammar',  cefr:'A2',   duration:'~8 min',  action: go('negation') },
    { id:'genderdrill',  label:'Gender',               icon:'♂️♀️', desc:'Masculine, feminine, neuter',         category:'grammar',  cefr:'A1+',  duration:'~5 min',  action: go('genderdrill') },
    { id:'profgender',   label:'M/F Jobs',             icon:'👨‍⚖️', desc:'Učitelj vs učiteljica',             category:'grammar',  cefr:'A2',   duration:'~5 min',  action: go('profgender') },
    { id:'comparatives', label:'Compare',              icon:'📈', desc:'Bigger, faster, better',                category:'grammar',  cefr:'B1',   duration:'~10 min', action: go('comparatives') },
    { id:'future',       label:'Future Tense',         icon:'🚀', desc:'ću, ćeš, će...',                        category:'grammar',  cefr:'B1',   duration:'~10 min', action: go('future') },
    { id:'sibil',        label:'Sibilization',         icon:'🔄', desc:'k→c, g→z sound changes',               category:'grammar',  cefr:'B1',   duration:'~8 min',  action: go('sibil') },
    { id:'coloragree',   label:'Color Agreement',      icon:'🎨', desc:'Colors match noun gender',              category:'grammar',  cefr:'A2',   duration:'~5 min',  action: go('coloragree') },
    { id:'akudrill',     label:'Accusative',           icon:'🍽️', desc:'Direct objects change form',           category:'grammar',  cefr:'B1',   duration:'~10 min', action: go('akudrill') },
    { id:'relpron',      label:'Koji/Koja',            icon:'🔗', desc:'Relative pronouns',                     category:'grammar',  cefr:'B1',   duration:'~8 min',  action: go('relpron') },
    { id:'reflexive',    label:'SE Verbs',             icon:'🧲', desc:'Reflexive verbs with se/si',            category:'grammar',  cefr:'B1',   duration:'~10 min', action: go('reflexive') },
    { id:'sentbuild',    label:'Build Sentences',      icon:'🏗️', desc:'Arrange the building blocks',          category:'grammar',  cefr:'A2',   duration:'~8 min',  action: go('sentbuild') },
    { id:'clitic',       label:'Clitic Drill',         icon:'🔗', desc:'The #1 hardest rule in Croatian',       category:'grammar',  cefr:'B1+',  duration:'~10 min', action: go('clitic') },
    { id:'numcases',     label:'Numbers+Cases',        icon:'🔢', desc:'1/2-4/5+ — never wrong again',          category:'grammar',  cefr:'B1',   duration:'~10 min', action: go('numcases') },
    { id:'imperative',   label:'Imperative',           icon:'⚡', desc:'Commands — essential production',       category:'grammar',  cefr:'B1',   duration:'~8 min',  action: go('imperative') },
    { id:'neggen',       label:'Negation+Genitive',    icon:'❌', desc:'Negate correctly — case shifts!',       category:'grammar',  cefr:'B1',   duration:'~10 min', action: go('neggen') },
    // Vocab
    { id:'znam',         label:'Translate',            icon:'🇭🇷', desc:'English ↔ Croatian',                  category:'vocab',    cefr:'A1+',  duration:'~5 min',  action: go('znam') },
    { id:'possess',      label:'My/Your',              icon:'👤', desc:'Moj, tvoj, njegov, njezin',             category:'vocab',    cefr:'A1+',  duration:'~5 min',  action: go('possess') },
    { id:'opposites',    label:'Opposites',            icon:'↔️', desc:'Hot/cold, big/small...',               category:'vocab',    cefr:'A1+',  duration:'~5 min',  action: go('opposites') },
    { id:'ordinals',     label:'Ordinals',             icon:'🏢', desc:'First, second, third...',              category:'vocab',    cefr:'A2',   duration:'~5 min',  action: go('ordinals') },
    { id:'emogender',    label:'Emotions',             icon:'😀', desc:'Sretan, sretna — feel it',             category:'vocab',    cefr:'A2',   duration:'~5 min',  action: go('emogender') },
    { id:'verbdrill',    label:'20 Core Verbs',        icon:'💪', desc:'The most-used Croatian verbs',          category:'vocab',    cefr:'A2',   duration:'~8 min',  action: go('verbdrill') },
    { id:'pronouns',     label:'Pronouns',             icon:'🎯', desc:'Ja, ti, on, ona, mi...',               category:'vocab',    cefr:'A1+',  duration:'~5 min',  action: go('pronouns') },
    { id:'cityloc',      label:'City Locations',       icon:'🏙️', desc:'Where is it in Croatia?',             category:'vocab',    cefr:'A2+',  duration:'~5 min',  action: go('cityloc') },
    { id:'collocations', label:'Collocations',         icon:'🔀', desc:'Which words belong together',          category:'vocab',    cefr:'B1',   duration:'~8 min',  action: go('collocations') },
    { id:'wordfamilies', label:'Word Families',        icon:'🌱', desc:'One root, a hundred words',            category:'vocab',    cefr:'B1',   duration:'~8 min',  action: go('wordfamilies') },
    // Practical
    { id:'restaurant',   label:'Restaurant',           icon:'🍽️', desc:'Order food like a local',             category:'practical', cefr:'A2',  duration:'~8 min',  action: go('restaurant') },
    { id:'numtime',      label:'Numbers & Time',       icon:'🔢', desc:'Tell time, count anything',            category:'practical', cefr:'A2',  duration:'~5 min',  action: go('numtime') },
    { id:'convmatch',    label:'Conversations',        icon:'💬', desc:'Match real-world dialogues',           category:'practical', cefr:'A2+', duration:'~8 min',  action: go('convmatch') },
    { id:'scenes',       label:'Describe',             icon:'🖼️', desc:'Describe what you see',               category:'practical', cefr:'B1',  duration:'~8 min',  action: go('scenes') },
    { id:'tenseflip',    label:'Tense Flip',           icon:'⏳', desc:'Switch tense on the fly',             category:'practical', cefr:'B1',  duration:'~8 min',  action: go('tenseflip') },
    { id:'fillstory',    label:'Story Fill',           icon:'📝', desc:'Fill in the blanks',                  category:'practical', cefr:'B1',  duration:'~15 min', action: go('fillstory') },
    { id:'storyselect',  label:'Stories',              icon:'📖', desc:'Read short Croatian tales',            category:'practical', cefr:'B1',  duration:'~15 min', action: go('storyselect') },
    { id:'riddles',      label:'Riddles',              icon:'🧩', desc:'Can you guess the answer?',           category:'practical', cefr:'A2+', duration:'~5 min',  action: go('riddles') },
    { id:'logicquiz',    label:'Think Croatian',       icon:'🧠', desc:'Logic puzzles in Croatian',            category:'practical', cefr:'B1',  duration:'~10 min', action: go('logicquiz') },
    { id:'brzalice',     label:'Tongue Twisters',      icon:'😝', desc:'Brzalice — dare yourself',            category:'practical', cefr:'A2+', duration:'~5 min',  action: go('brzalice') },
    // Advanced
    { id:'pitchaccent',  label:'Pitch Accent',         icon:'🎵', desc:'Master Croatian tonal stress',         category:'advanced', cefr:'B1+', duration:'~10 min', action: startPitchAccent },
    { id:'shadowing',    label:'Shadowing',            icon:'🗣️', desc:'Native-speed listen & repeat',        category:'advanced', cefr:'B1+', duration:'~10 min', action: startShadowing },
    { id:'srsreview',    label:'SRS Review',           icon:'🔁', desc:'Smart spaced repetition',             category:'advanced', cefr:'A1+', duration:'self-paced', action: startReview },
    { id:'writing',      label:'Free Writing',         icon:'✍️', desc:'Write & get AI feedback',             category:'advanced', cefr:'B1',  duration:'open-ended', action: startWriting },
    { id:'aspectdrill',  label:'Aspect Drill',         icon:'🔄', desc:'Imperfective vs perfective',          category:'advanced', cefr:'B1+', duration:'~10 min', action: startAspectDrill },
    { id:'dialogue',     label:'Dialogue Sim',         icon:'💬', desc:'Real turn-based conversations',       category:'practical', cefr:'A1+', duration:'~10 min', action: () => { setScr("dialogue"); sCurEx("dialogue"); } },
    { id:'dictation',    label:'Dictation',            icon:'🎧', desc:'Listen and type Croatian',            category:'advanced', cefr:'B1',  duration:'~10 min', action: () => { setScr("dictation"); sCurEx("dictation"); } },
    { id:'proncontrast', label:'Sound Contrast',       icon:'🔤', desc:'č/ć, š/ž, đ/dž mastery',            category:'advanced', cefr:'A2+', duration:'~8 min',  action: () => { setScr("proncontrast"); sCurEx("proncontrast"); } },
    { id:'cefrtest',     label:'CEFR Test',            icon:'🎓', desc:'A1→B2 proficiency check',             category:'advanced', cefr:'A1+', duration:'~15 min', action: () => { setScr("cefrtest"); sCurEx("cefrtest"); } },
    // Slang (advanced)
    { id:'slang_classics',  label:'The Classics',      icon:'🔥', desc:'Foundation expletives — built on one root verb', category:'advanced', cefr:'B1+', duration:'~10 min', action: go('slang:classics') },
    { id:'slang_everyday',  label:'Svaki Dan',         icon:'😤', desc:'Mild-to-medium — usable around most adults',    category:'advanced', cefr:'A2+', duration:'~8 min',  action: go('slang:everyday') },
    { id:'slang_slang',     label:'Ulični Sleng',      icon:'😎', desc:'General everyday slang — sound like a local',   category:'advanced', cefr:'A2+', duration:'~8 min',  action: go('slang:slang') },
    { id:'slang_people',    label:'Ljudi i Adrese',    icon:'👥', desc:'How Croatians address each other',              category:'advanced', cefr:'A2',  duration:'~5 min',  action: go('slang:people') },
    { id:'slang_dalmatian', label:'Dalmatinski',       icon:'☀️', desc:'Split, Dalmatia & coast dialect',               category:'advanced', cefr:'B1',  duration:'~10 min', action: go('slang:dalmatian') },
    { id:'slang_zagreb',    label:'Zagrebački',        icon:'🏙️', desc:'Capital city slang — German meets Slavic',      category:'advanced', cefr:'B1',  duration:'~10 min', action: go('slang:zagreb') },
    { id:'slang_satrovski', label:'Šatrovački',        icon:'🔄', desc:'Croatian pig latin — reverse syllable slang',   category:'advanced', cefr:'B1+', duration:'~10 min', action: go('slang:satrovski') },
    { id:'slang_genz',      label:'Gen Z & Internet',  icon:'📱', desc:'Digital generation slang & memes',              category:'advanced', cefr:'A2+', duration:'~8 min',  action: go('slang:genz') },
    { id:'slang_pijani',    label:'Pijani & Mamurani', icon:'🍺', desc:'Drinking culture & hangover vocabulary',         category:'advanced', cefr:'B1',  duration:'~8 min',  action: go('slang:pijani') },
    { id:'slang_football',  label:'Nogomet',           icon:'⚽', desc:'Football supporter slang',                      category:'advanced', cefr:'A2+', duration:'~8 min',  action: go('slang:football') },
    { id:'slang_regional',  label:'Zagreb vs Split',   icon:'🗺️', desc:'Regional rivalries & dialect wars',             category:'advanced', cefr:'B1',  duration:'~10 min', action: go('slang:regional') },
    { id:'slang_art',       label:'Psovanje kao Kunst',icon:'🎨', desc:'Swearing elevated to an art form',              category:'advanced', cefr:'B2',  duration:'~10 min', action: go('slang:art') },
  ];

  const visible = EXERCISES.filter(e => pFilter === 'all' || e.category === pFilter);
  const visibleCount = pFilter === 'all' ? EXERCISES.length : EXERCISES.filter(e => e.category === pFilter).length;

  const CATEGORY_COLORS = {
    grammar:   '#7c3aed',
    vocab:     '#0e7490',
    practical: '#059669',
    advanced:  '#d97706',
  };

  const CEFR_COLORS = {
    'A1': '#dcfce7', 'A2': '#dcfce7',
    'B1': '#fef3c7', 'B2': '#fef3c7',
    'C1': '#ede9fe', 'C2': '#ede9fe',
  };

  const CEFR_TEXT = {
    'A1': '#166534', 'A2': '#166534',
    'B1': '#92400e', 'B2': '#92400e',
    'C1': '#5b21b6', 'C2': '#5b21b6',
  };

  // Today's Pick — 3 exercise IDs chosen by time of day
  const todaysPicks = (() => {
    const hr = new Date().getHours();
    if (hr < 12) return ['znam', 'srsreview', 'genderdrill'];
    if (hr < 18) return ['cloze', 'verbdrill', 'srsreview'];
    return ['verbdrill', 'prepdrill', 'znam'];
  })();

  function ExerciseCard({ id, label, icon, desc, cefr, duration, action, category }) {
    const isPick = todaysPicks.includes(id);
    return (
      <button
        onClick={action}
        style={{
          display:'flex', alignItems:'center', gap:12, padding:14,
          borderRadius:14,
          background: isPick ? 'var(--info-bg, #f0f9ff)' : 'var(--card)',
          border: isPick ? '1.5px solid var(--info-b, #bae6fd)' : '1px solid var(--card-b)',
          cursor:'pointer', textAlign:'left', fontFamily:"'Outfit',sans-serif",
          boxShadow: isPick ? '0 2px 8px rgba(14,116,144,.12)' : '0 1px 3px rgba(0,0,0,.06)',
          borderLeft: `3px solid ${isPick ? 'var(--info)' : (CATEGORY_COLORS[category] || 'var(--bar-bg)')}`,
          position:'relative',
        }}
      >
        {isPick && (
          <div style={{
            position:'absolute', top:6, right:8,
            fontSize:9, fontWeight:900, color:'var(--info)',
            background:'var(--card)', border:'1px solid var(--info-b)',
            borderRadius:6, padding:'1px 6px', letterSpacing:'.05em',
            textTransform:'uppercase',
          }}>⭐ Today</div>
        )}
        <div style={{
          width:40, height:40, borderRadius:12,
          background:'var(--bar-bg)', border:'1px solid var(--card-b)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:20, flexShrink:0,
        }}>
          {icon}
        </div>
        <div style={{ minWidth:0, flex:1 }}>
          <div style={{ fontSize:'var(--text-sm)', fontWeight:800, color:'var(--heading)', lineHeight:1.2 }}>{label}</div>
          <div style={{ fontSize:12, color:'var(--subtext)', marginTop:2, lineHeight:1.3 }}>{desc}</div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:4, alignItems:'center' }}>
            {cefr && (
              <span style={{
                fontSize:10, fontWeight:800, padding:'2px 7px',
                borderRadius:4,
                background: CEFR_COLORS[cefr] || 'var(--info-bg, #f0f9ff)',
                color: CEFR_TEXT[cefr] || 'var(--info, #0e7490)',
                border:'1px solid var(--info-b, #bae6fd)',
              }}>{cefr}</span>
            )}
            {duration && (
              <span style={{ fontSize:10, color:'var(--subtext)', fontWeight:600 }}>⏱ {duration}</span>
            )}
          </div>
        </div>
      </button>
    );
  }

  const culturalExtras = [
    [() => { setScr("proverbs"); sCurEx("proverbs"); }, "🌟","Proverbs","Croatian wisdom & sayings"],
    [() => { setScr("idioms"); sCurEx("idioms"); },     "🗣️","Idioms",  "Phrases locals actually use"],
    [() => { setScr("events"); sCurEx("events"); },     "📅","Events",  "Festivals & holidays"],
  ];

  // Daily quest progress for Practice tab header
  const practiceQuestsDone = (() => {
    const d = new Date().toISOString().slice(0,10);
    const speak   = localStorage.getItem('nh_quest_speak_'+d) === '1';
    const grammar = localStorage.getItem('nh_quest_grammar_'+d) === '1';
    const master  = localStorage.getItem('nh_quest_master_'+d) === '1';
    const reading = localStorage.getItem('nh_quest_reading_'+d) === '1';
    const done = [speak, grammar, master, reading].filter(Boolean).length;
    return { done, total: 4, speak, grammar, master, reading };
  })();

  return (
    <React.Fragment>
      {H("🎮 Practice", "Games, exercises & daily review")}

      {/* ── QUICK START CTA ─────────────────────────────────────────────── */}
      {!isNewUser ? (
        <button
          onClick={recommendations[0].fn}
          style={{
            width:'100%', display:'flex', alignItems:'center', gap:14,
            padding:'14px 18px', borderRadius:18, marginBottom:8, border:'none', cursor:'pointer',
            background:'linear-gradient(135deg,var(--info),#0c4a6e)',
            boxShadow:'0 4px 20px rgba(14,116,144,.25)',
            animation:'rise .4s ease', fontFamily:"'Outfit',sans-serif",
          }}
        >
          <div style={{
            width:44, height:44, borderRadius:14, flexShrink:0,
            background:'rgba(255,255,255,.15)', border:'1.5px solid rgba(255,255,255,.3)',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:22,
          }}>{recommendations[0].icon}</div>
          <div style={{flex:1, textAlign:'left'}}>
            <div style={{fontSize:11, fontWeight:800, color:'rgba(255,255,255,.65)', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:2}}>START NOW</div>
            <div style={{fontSize:16, fontWeight:900, color:'white'}}>{recommendations[0].title}</div>
            <div style={{fontSize:12, color:'rgba(255,255,255,.75)'}}>{recommendations[0].desc}</div>
          </div>
          <div style={{fontSize:22, color:'rgba(255,255,255,.8)', fontWeight:300}}>›</div>
        </button>
      ) : (
        <div style={{
          background:'linear-gradient(135deg,var(--info),#0c4a6e)',
          borderRadius:18, padding:'18px 20px', marginBottom:8,
          display:'flex', alignItems:'center', gap:14,
          boxShadow:'0 4px 20px rgba(14,116,144,.25)',
          animation:'rise .4s ease',
        }}>
          <div style={{fontSize:36}}>🎯</div>
          <div style={{flex:1}}>
            <div style={{fontSize:11, fontWeight:800, color:'rgba(255,255,255,.65)', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:4}}>WELCOME</div>
            <div style={{fontSize:15, fontWeight:900, color:'white', marginBottom:2}}>Ready to practice?</div>
            <div style={{fontSize:12, color:'rgba(255,255,255,.7)'}}>Complete a lesson first to unlock recommendations</div>
          </div>
        </div>
      )}

      {/* ── DAILY QUEST PROGRESS ────────────────────────────────────────── */}
      <div style={{
        display:'flex', gap:6, marginBottom:12, padding:'8px 12px',
        background:'var(--card)', border:'1px solid var(--card-b)', borderRadius:12,
        alignItems:'center',
      }}>
        <span style={{fontSize:12, fontWeight:700, color:'var(--subtext)', marginRight:2}}>Today:</span>
        {[
          { key:'speak',   icon:'🎤', label:'Speak'   },
          { key:'grammar', icon:'📝', label:'Grammar' },
          { key:'master',  icon:'🃏', label:'Words'   },
          { key:'reading', icon:'📖', label:'Read'    },
        ].map(q => (
          <div key={q.key} style={{
            display:'flex', alignItems:'center', gap:3,
            padding:'3px 8px', borderRadius:8,
            background: practiceQuestsDone[q.key] ? 'var(--success-bg)' : 'var(--bar-bg)',
            border: `1px solid ${practiceQuestsDone[q.key] ? 'var(--success-b)' : 'var(--card-b)'}`,
          }}>
            <span style={{fontSize:12}}>{q.icon}</span>
            <span style={{fontSize:11, fontWeight:700, color: practiceQuestsDone[q.key] ? 'var(--success)' : 'var(--subtext)'}}>
              {practiceQuestsDone[q.key] ? '✓' : q.label}
            </span>
          </div>
        ))}
        <span style={{fontSize:11, color:'var(--subtext)', marginLeft:'auto', fontWeight:600}}>
          {practiceQuestsDone.done}/4
        </span>
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

      {weakMsg && (
        <div className="empty-state" style={{ background:"#fffbeb", border:"1.5px solid #fde68a", borderRadius:16, marginBottom:16, position:"relative" }}>
          <div className="es-icon">🧠</div>
          <div className="es-title">Not enough weak words yet</div>
          <div className="es-desc">{weakMsg}</div>
          <button onClick={() => setWeakMsg("")} style={{ position:"absolute", top:10, right:12, background:"none", border:"none", cursor:"pointer", fontSize:18, color:"#92400e", lineHeight:1, opacity:.6 }} aria-label="Dismiss">×</button>
        </div>
      )}

      {/* ── ALL EXERCISES — FILTER PILLS + FLAT GRID ────────────────────── */}
      <div className="section-hdr">
        <div className="section-hdr-icon" style={{background:'rgba(99,102,241,.12)'}}>📚</div>
        <div className="section-hdr-text">
          <div className="section-hdr-title">All Exercises</div>
          <div className="section-hdr-sub">{visibleCount} exercise{visibleCount !== 1 ? 's' : ''} — grammar, vocabulary, and more</div>
        </div>
      </div>

      {/* Filter pills — sticky so they stay visible while scrolling the grid */}
      <div role="group" aria-label="Filter exercises" style={{ display:'flex', gap:8, overflowX:'auto', scrollbarWidth:'none', position:'sticky', top:0, zIndex:10, background:'var(--bg)', paddingTop:8, paddingBottom:8, marginBottom:0 }}>
        {[
          { id:'all',       label:'All' },
          { id:'grammar',   label:'🧠 Grammar' },
          { id:'vocab',     label:'📚 Vocab' },
          { id:'practical', label:'💬 Practical' },
          { id:'advanced',  label:'⚡ Advanced' },
        ].map(f => (
          <button key={f.id} onClick={() => setPFilter(f.id)} aria-pressed={pFilter === f.id} style={{
            padding:'7px 16px', borderRadius:20, border:'none', flexShrink:0,
            background: pFilter === f.id ? 'var(--info)' : 'var(--bar-bg)',
            color: pFilter === f.id ? '#fff' : 'var(--subtext)',
            fontWeight:700, fontSize:13, cursor:'pointer', whiteSpace:'nowrap',
            transition:'background 0.2s', fontFamily:"'Outfit',sans-serif",
          }}>{f.label}</button>
        ))}
      </div>

      {/* Flat 2-column exercise grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:24, marginTop:12 }}>
        {visible.map(e => <ExerciseCard key={e.id} {...e} />)}
      </div>

      {/* ── QUICK GAMES ─────────────────────────────────────────────────── */}
      <div className="section-hdr">
        <div className="section-hdr-icon" style={{background:'rgba(245,158,11,.12)'}}>⚡</div>
        <div className="section-hdr-text">
          <div className="section-hdr-title">Quick Games</div>
          <div className="section-hdr-sub">Tap any to start instantly</div>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:24 }}>
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
            style={{ textAlign:"center", padding:"14px 8px", background:bg, border:`1.5px solid ${border}`, minHeight:56, cursor:'pointer' }}
            onClick={fn}>
            <div style={{ fontSize:28 }}>{icon}</div>
            <div style={{ fontSize:'var(--text-xs)', fontWeight:800, marginTop:5, color:"var(--heading)" }}>{label}</div>
          </button>
        ))}
      </div>

      {/* ── RECOMMENDED FOR YOU (moved below exercises) ──────────────────── */}
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
              Jump into a Quick Game above, or complete your first lesson in <strong>Learn</strong> to unlock personalized recommendations.
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
