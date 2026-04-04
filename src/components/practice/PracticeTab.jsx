import React, { useState, useMemo } from 'react';
import { H, V, LISTEN, getSR, getDueReviews } from '../../data.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { useStats } from '../../context/StatsContext.jsx';

// ── Recently-played tracking ─────────────────────────────────────────────────
// Saved as a JSON array of exercise IDs in localStorage (max 6 entries, newest first).
const RECENT_KEY = 'nh_recent_exercises';
function getRecentExercises() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
}
function recordRecentExercise(id) {
  try {
    const prev = getRecentExercises().filter(x => x !== id);
    localStorage.setItem(RECENT_KEY, JSON.stringify([id, ...prev].slice(0, 6)));
  } catch {}
}

// Q-4: PracticeTab now receives callbacks instead of raw App.jsx state setters.
// Screens manage their own state; App.jsx only keeps state needed by screen props.
export default function PracticeTab({
  allCats, sh, sCurEx,
  onLaunchQuiz, onLaunchFlash, onLaunchListen, onLaunchMatch, onLaunchSpeaking,
}) {
  const { setScr } = useApp();
  const { stats: st } = useStats();
  const lc = st?.lc ?? 0;
  const [weakMsg, setWeakMsg] = useState("");
  // openCat: which category tile is expanded in the browse grid ('grammar'|'vocab'|'practical'|'advanced'|null)
  const [openCat, setOpenCat] = useState(null);

  const pool = () => allCats.flatMap(cc => V[cc]);

  function startQuiz() {
    const p = pool();
    const items = sh(p).slice(0,20).map(w => { const wr=sh(p.filter(x=>x[1]!==w[1])).slice(0,3).map(x=>x[1]); return{hr:w[0],en:w[1],ph:w[2],opts:sh([w[1]].concat(wr)),correct:w[1]}; });
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
  function _startWeakWords() {
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
  function startSpeakingSprint() {
    setScr("speaking_sprint"); sCurEx("speaking_sprint");
  }
  function startAIListening() {
    setScr("ai_listening"); sCurEx("ai_listening");
  }
  function startVideoLesson() {
    setScr("video_lesson"); sCurEx("video_lesson");
  }
  function startGrammarDiagnosis() {
    setScr("grammar_diagnosis"); sCurEx("grammar_diagnosis");
  }

  // Q-4: Screens (ZnamGame, Unjumble, PrepDrill, NumTime) all manage their own state internally.
  // These launch functions only navigate — no App.jsx state setters needed.
  const specialInit = {
    znam:      () => { setScr("znam"); sCurEx("znam"); },
    unjumble:  () => { setScr("unjumble"); sCurEx("unjumble"); },
    prepdrill: () => { setScr("prepdrill"); sCurEx("prepdrill"); },
    numtime:   () => { setScr("numtime"); sCurEx("numtime"); },
  };
  const go = (screen, id) => {
    const exerciseId = id || screen;
    if (screen.startsWith('slang:')) {
      const section = screen.slice(6);
      return () => { recordRecentExercise(exerciseId); localStorage.setItem('slangInitSection', section); setScr('slang'); sCurEx('slang'); };
    }
    const base = specialInit[screen] || (() => { setScr(screen); sCurEx(screen); });
    return () => { recordRecentExercise(exerciseId); base(); };
  };

  // ── SMART RECOMMENDATIONS ─────────────────────────────────────────────
  const dueReviews = getDueReviews(); // intentionally not memoised — reads localStorage on every render so count stays current after completing reviews
  const sr = getSR();
  const weakWords = Object.values(sr).filter(v => v.w > 0);
  const weakCount = weakWords.length;
  const _avgAcc = weakCount > 0
    ? Math.round(weakWords.reduce((s, v) => s + (v.r || 0) / ((v.r || 0) + v.w), 0) / weakCount * 100)
    : 0;
  const _h = new Date().getHours();
  const placementDone = !!localStorage.getItem('nh_placement_done');
  const isNewUser = lc === 0 && !placementDone;
  const userGoal = localStorage.getItem('nh_goal');
  const goalSetDate = localStorage.getItem('nh_goal_set_date');
  const daysSinceGoalSet = goalSetDate ? Math.floor((Date.now() - parseInt(goalSetDate)) / 86400000) : 0;
  const showGoalReminder = userGoal && daysSinceGoalSet > 30 && !isNewUser;

  const recommendations = [
    { icon:'🃏', title:'Flashcards',  desc:'Spaced repetition review',  color:'rgba(124,58,237,.08)', border:'rgba(124,58,237,.25)', fn: startFlashcards },
    { icon:'🔗', title:'Match Pairs', desc:'Quick memory game',          color:'rgba(22,163,74,.08)',  border:'rgba(22,163,74,.25)',  fn: startMatch },
  ];

  // Goal-based recommendations — shown when nh_goal is set, giving the
  // personalisation we promised during onboarding
  const goalRecMap = {
    heritage: [
      { icon:'🏛️', title:'Croatian History',   desc:'Explore your roots',              color:'rgba(234,88,12,.08)', border:'rgba(234,88,12,.25)', fn:()=>{setScr("history");sCurEx("history");} },
      { icon:'🗣️', title:'Idioms',             desc:'Phrases locals actually use',     color:'rgba(234,88,12,.08)', border:'rgba(234,88,12,.25)', fn:()=>{setScr("idioms");sCurEx("idioms");} },
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
      { icon:'🧑‍🤝‍🧑', title:'Conversation Partners', desc:'Maja, Marko, Ana, Baka',         color:'rgba(245,158,11,.08)', border:'rgba(245,158,11,.25)', fn:()=>{setScr("personas");sCurEx("personas");} },
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
    { id:'sentencetiles', label:'Tile Assembly',       icon:'🧱', desc:'Tap tiles to assemble Croatian sentences', category:'grammar', cefr:'A2',  duration:'~8 min',  action: go('sentencetiles') },
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
    { id:'speaking_sprint', label:'Speaking Sprint',   icon:'🎤', desc:'Hear · Speak · Compare with native',  category:'advanced', cefr:'A1+', duration:'~15 min', action: startSpeakingSprint },
    { id:'dialogue',     label:'Dialogue Sim',         icon:'💬', desc:'Real turn-based conversations',       category:'practical', cefr:'A1+', duration:'~10 min', action: () => { setScr("dialogue"); sCurEx("dialogue"); } },
    { id:'dictation',    label:'Dictation',            icon:'🎧', desc:'Listen and type Croatian',            category:'advanced', cefr:'B1',  duration:'~10 min', action: () => { setScr("dictation"); sCurEx("dictation"); } },
    { id:'proncontrast', label:'Sound Contrast',       icon:'🔤', desc:'č/ć, š/ž, đ/dž mastery',            category:'advanced', cefr:'A2+', duration:'~8 min',  action: () => { setScr("proncontrast"); sCurEx("proncontrast"); } },
    { id:'ai_listening',      label:'AI Listening',        icon:'🎧', desc:'AI-generated dialogues + comprehension',  category:'advanced', cefr:'A2+', duration:'~10 min', action: startAIListening },
    { id:'ai_story',          label:'AI Story',            icon:'📖', desc:'Story built from your weak words',        category:'advanced', cefr:'A2+', duration:'~8 min',  action: () => { setScr('ai_story'); sCurEx('ai_story'); } },
    { id:'video_lesson',      label:'Video Lesson',        icon:'🎬', desc:'Watch a Croatian scene · follow the dialogue · answer questions', category:'advanced', cefr:'A2+', duration:'~12 min', action: startVideoLesson },
    { id:'grammar_diagnosis', label:'Grammar Blind Spots',  icon:'🔬', desc:'Weekly AI analysis of your weak points',  category:'advanced', cefr:'A1+', duration:'weekly',   action: startGrammarDiagnosis },
    { id:'translate_drills', label:'Translate Production', icon:'✍️', desc:'English → Croatian — produce full sentences', category:'grammar', cefr:'A2', duration:'~10 min', action: () => { setScr('translate_drills'); sCurEx('translate_drills'); } },
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

  const CATEGORY_COLORS = {
    grammar:   '#7c3aed',
    vocab:     '#0e7490',
    practical: '#059669',
    advanced:  '#d97706',
  };

  const CEFR_COLORS = {
    'A1': 'rgba(22,163,74,.15)',  'A2': 'rgba(22,163,74,.15)',
    'B1': 'rgba(217,119,6,.15)', 'B2': 'rgba(217,119,6,.15)',
    'C1': 'rgba(124,58,237,.15)', 'C2': 'rgba(124,58,237,.15)',
  };

  const CEFR_TEXT = {
    'A1': 'var(--success, #16a34a)', 'A2': 'var(--success, #16a34a)',
    'B1': 'var(--warning, #d97706)', 'B2': 'var(--warning, #d97706)',
    'C1': 'var(--purple,  #7c3aed)', 'C2': 'var(--purple,  #7c3aed)',
  };

  // Today's Pick — show recently played first (max 2), then time-based defaults.
  // This means returning users see exercises they actually use, not static picks.
  const todaysPicks = useMemo(() => {
    const recent = getRecentExercises().slice(0, 2);
    const hr = new Date().getHours();
    const defaults = hr < 12
      ? ['znam', 'srsreview', 'genderdrill']
      : hr < 18
        ? ['cloze', 'verbdrill', 'srsreview']
        : ['verbdrill', 'prepdrill', 'znam'];
    // recent exercises first, then fill up to 3 with defaults (no duplicates)
    const merged = [...recent];
    for (const d of defaults) {
      if (merged.length >= 3) break;
      if (!merged.includes(d)) merged.push(d);
    }
    return merged.slice(0, 3);
  }, []);

  function ExerciseCard({ id, label, icon, desc, cefr, duration, action, category }) {
    const isPick = todaysPicks.includes(id);
    const catColor = CATEGORY_COLORS[category] || 'var(--bar-bg)';
    const cefrClass = cefr ? `cefr cefr-${cefr.toLowerCase().replace(/[^a-z]/g, '')}` : '';
    return (
      <button
        onClick={action}
        className={'exercise-card' + (isPick ? ' exercise-card--today' : '')}
        style={{ borderLeftColor: isPick ? 'var(--info)' : catColor }}
      >
        {isPick && <div className="exercise-card-today-badge">⭐ Today</div>}
        <div className="exercise-card-icon">{icon}</div>
        <div style={{ minWidth:0, flex:1 }}>
          <div className="exercise-card-label">{label}</div>
          <div className="exercise-card-desc">{desc}</div>
          <div className="exercise-card-meta">
            {cefr && <span className={cefrClass}>{cefr}</span>}
            {duration && <span style={{ fontSize:10, color:'var(--subtext)', fontWeight:600 }}>⏱ {duration}</span>}
          </div>
        </div>
      </button>
    );
  }

  const culturalExtras = [
    [() => { setScr("idioms"); sCurEx("idioms"); },  "🗣️", "Idioms",  "Phrases locals actually use", "rgba(234,88,12,.08)",  "rgba(234,88,12,.3)"],
    [() => { setScr("events"); sCurEx("events"); },  "📅", "Events",  "Festivals & holidays",        "rgba(22,163,74,.08)",  "rgba(22,163,74,.3)"],
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
    <div>
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
        marginBottom:12, padding:'10px 14px',
        background:'var(--card)', border:'1px solid var(--card-b)', borderRadius:14,
        boxShadow:'var(--card-shadow)',
      }}>
        <div style={{display:'flex', alignItems:'center', marginBottom:8}}>
          <span style={{fontSize:11, fontWeight:800, color:'var(--subtext)', textTransform:'uppercase', letterSpacing:'.08em', flex:1}}>Daily Quests</span>
          <span style={{
            fontSize:11, fontWeight:800,
            color: practiceQuestsDone.done === 4 ? 'var(--success)' : 'var(--info)',
            background: practiceQuestsDone.done === 4 ? 'var(--success-bg)' : 'var(--info-bg)',
            border: `1px solid ${practiceQuestsDone.done === 4 ? 'var(--success-b)' : 'var(--info-b)'}`,
            borderRadius:20, padding:'2px 8px',
          }}>{practiceQuestsDone.done}/4 done</span>
        </div>
        <div style={{display:'flex', gap:6}}>
          {[
            { key:'speak',   icon:'🎤', label:'Speak'   },
            { key:'grammar', icon:'📝', label:'Grammar' },
            { key:'master',  icon:'🃏', label:'Words'   },
            { key:'reading', icon:'📖', label:'Read'    },
          ].map(q => (
            <div key={q.key}
              className={'quest-tile ' + (practiceQuestsDone[q.key] ? 'quest-tile--done' : 'quest-tile--pending')}
            >
              <span className="quest-tile-icon">{practiceQuestsDone[q.key] ? '✅' : q.icon}</span>
              <span className="quest-tile-label">{q.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── SRS DUE BANNER ──────────────────────────────────────────────── */}
      {Object.keys(sr).length > 0 && dueReviews.length === 0 && (
        <div className="tip-box-success" style={{ marginBottom:14, display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize: 22 }}>✅</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--success)' }}>
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
          className="milestone-card"
          style={{
            width:"100%", display:"flex", alignItems:"center", gap:14,
            padding:"16px 18px", marginBottom:16, border:"none", cursor:"pointer",
            fontFamily:"'Outfit',sans-serif", textAlign:'left',
          }}
        >
          <div style={{
            width:46, height:46, borderRadius:14, flexShrink:0,
            background:"rgba(255,255,255,.18)", border:"2px solid rgba(255,255,255,.35)",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:24,
          }}>📅</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:11, fontWeight:800, color:"rgba(255,255,255,.65)", textTransform:'uppercase', letterSpacing:'.1em', marginBottom:2 }}>
              SRS REVIEW DUE
            </div>
            <div style={{ fontSize:16, fontWeight:900, color:"#fff" }}>
              {dueReviews.length} word{dueReviews.length !== 1 ? "s" : ""} waiting
            </div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,.7)", marginTop:1 }}>
              Tap to review — spaced repetition keeps words in memory
            </div>
          </div>
          <div style={{ fontSize:22, color:"rgba(255,255,255,.85)", fontWeight:300 }}>›</div>
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

      {/* ── LISTENING COMPREHENSION TRACK ───────────────────────────────── */}
      <button
        onClick={() => { setScr('listening_comprehension'); sCurEx('listening_comprehension'); }}
        className="tc"
        style={{
          width:'100%', display:'flex', alignItems:'center', gap:14,
          padding:'16px 18px', marginBottom:12,
          border:'1.5px solid rgba(124,58,237,.25)',
          background:'linear-gradient(135deg,rgba(124,58,237,.07),rgba(91,33,182,.04))',
          cursor:'pointer', textAlign:'left', fontFamily:"'Outfit',sans-serif",
        }}
      >
        <div style={{
          width:48, height:48, borderRadius:14, flexShrink:0,
          background:'linear-gradient(135deg,#7c3aed,#5b21b6)',
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:24,
          boxShadow:'0 4px 12px rgba(124,58,237,.3)',
        }}>🎧</div>
        <div style={{flex:1}}>
          <div style={{fontSize:11, fontWeight:800, color:'var(--lavender)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:2}}>A1 → B2 Curriculum</div>
          <div style={{fontSize:14, fontWeight:800, color:'var(--heading)'}}>Listening Comprehension</div>
          <div style={{fontSize:12, color:'var(--subtext)', marginTop:1, lineHeight:1.4}}>Read Croatian · choose the meaning · track your progress</div>
        </div>
        <div style={{fontSize:18, color:'var(--lavender)', fontWeight:300}}>›</div>
      </button>

      {/* ── TODAY'S PICK ─────────────────────────────────────────────────── */}
      <div className="section-hdr">
        <div className="section-hdr-icon" style={{background:'rgba(99,102,241,.12)'}}>⭐</div>
        <div className="section-hdr-text">
          <div className="section-hdr-title">Today's Pick</div>
          <div className="section-hdr-sub">3 exercises chosen for right now</div>
        </div>
      </div>
      <div className="todays-picks-grid">
        {EXERCISES.filter(e => todaysPicks.includes(e.id)).map(e => <ExerciseCard key={e.id} {...e} />)}
      </div>

      {/* ── BROWSE BY CATEGORY (always visible) ─────────────────────────── */}
      <div className="section-hdr" style={{ marginTop:12 }}>
        <div className="section-hdr-icon" style={{background:'rgba(99,102,241,.12)'}}>📚</div>
        <div className="section-hdr-text">
          <div className="section-hdr-title">Browse Exercises</div>
          <div className="section-hdr-sub">{EXERCISES.length} exercises across 4 categories</div>
        </div>
      </div>
      {[
        { id:'grammar',   label:'Grammar',    emoji:'📝', color:'#7c3aed', bg:'rgba(124,58,237,.08)',  border:'rgba(124,58,237,.25)' },
        { id:'vocab',     label:'Vocabulary', emoji:'🇭🇷', color:'#0e7490', bg:'rgba(14,116,144,.08)',  border:'rgba(14,116,144,.25)' },
        { id:'practical', label:'Practical',  emoji:'🌍', color:'#059669', bg:'rgba(5,150,105,.08)',   border:'rgba(5,150,105,.25)'  },
        { id:'advanced',  label:'Advanced',   emoji:'🎓', color:'#d97706', bg:'rgba(217,119,6,.08)',   border:'rgba(217,119,6,.25)'  },
      ].map(cat => {
        const catExercises = EXERCISES.filter(e => e.category === cat.id);
        const isOpen = openCat === cat.id;
        return (
          <div key={cat.id} style={{ marginBottom:8 }}>
            {/* Category tile header */}
            <button
              onClick={() => setOpenCat(isOpen ? null : cat.id)}
              aria-expanded={isOpen}
              className="cat-tile"
              style={{
                borderRadius: isOpen ? '14px 14px 0 0' : 14,
                background: isOpen ? cat.color : cat.bg,
                border: `1.5px solid ${cat.border}`,
                borderBottom: isOpen ? 'none' : `1.5px solid ${cat.border}`,
              }}
            >
              <div
                className="cat-tile-icon"
                style={{
                  background: isOpen ? 'rgba(255,255,255,.18)' : 'var(--card)',
                  border: `1px solid ${isOpen ? 'rgba(255,255,255,.3)' : cat.border}`,
                }}
              >{cat.emoji}</div>
              <div style={{ flex:1, textAlign:'left' }}>
                <div className="cat-tile-title" style={{ color: isOpen ? '#fff' : 'var(--heading)' }}>{cat.label}</div>
                <div className="cat-tile-count" style={{ color: isOpen ? 'rgba(255,255,255,.75)' : 'var(--subtext)' }}>{catExercises.length} exercises</div>
              </div>
              <div
                className={'cat-tile-chevron' + (isOpen ? ' cat-tile-chevron--open' : '')}
                style={{ color: isOpen ? 'rgba(255,255,255,.85)' : cat.color }}
              >▼</div>
            </button>
            {/* Expanded exercise list with stagger animation */}
            {isOpen && (
              <div
                className="cat-panel"
                style={{
                  border: `1.5px solid ${cat.border}`, borderTop:'none',
                  borderRadius:'0 0 14px 14px', overflow:'hidden',
                  background:'var(--card)',
                }}
              >
                <div
                  className="exercise-grid-stagger"
                  style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, padding:10 }}
                >
                  {catExercises.map(e => <ExerciseCard key={e.id} {...e} />)}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* ── QUICK GAMES ─────────────────────────────────────────────────── */}
      <div className="section-hdr">
        <div className="section-hdr-icon" style={{background:'rgba(245,158,11,.12)'}}>⚡</div>
        <div className="section-hdr-text">
          <div className="section-hdr-title">Quick Games</div>
          <div className="section-hdr-sub">Tap any to start instantly</div>
        </div>
      </div>
      <div
        className="anim-stagger-sm"
        style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:24 }}
      >
        {[
          [startQuiz,       "🎯","Quiz",        "Vocabulary","linear-gradient(155deg,#071828 0%,#0a3d52 60%,#0e7490 100%)"],
          [startFlashcards, "🃏","Flashcards",  "Spaced rep","linear-gradient(155deg,#120830 0%,#2d1260 60%,#7c3aed 100%)"],
          [startMatch,      "🔗","Match Pairs", "Memory",    "linear-gradient(155deg,#041410 0%,#0d3820 60%,#16a34a 100%)"],
          [startTyping,     "⌨️","Typing",      "Accuracy",  "linear-gradient(155deg,#1a0c00 0%,#3d1e00 60%,#d97706 100%)"],
          [startListening,  "🎧","Listening",   "Train ear", "linear-gradient(155deg,#1a0008 0%,#4a0015 60%,#D40030 100%)"],
          [startSpeaking,   "🎤","Speaking",    "Pronunc.",  "linear-gradient(155deg,#031020 0%,#083050 60%,#0284c7 100%)"],
          [() => { setScr("wordsprint"); sCurEx("wordsprint"); },"⚡","Word Sprint","Speed","linear-gradient(155deg,#1a0e00 0%,#3d2200 60%,#f59e0b 100%)"],
        ].map((/** @type {any[]} */ [fn,icon,label,sub,bg], i) => (
          <button key={i}
            className="practice-card-dark"
            style={{ textAlign:"center", padding:"16px 10px", background:bg }}
            onClick={fn}
          >
            <div className="pc-icon">{icon}</div>
            <div className="pc-label">{label}</div>
            <div className="pc-desc">{sub}</div>
          </button>
        ))}
      </div>

      {/* ── RECOMMENDED FOR YOU (moved below exercises) ──────────────────── */}
      <div className="section-hdr">
        <div className="section-hdr-icon" style={{background:'linear-gradient(135deg,rgba(245,158,11,.2),rgba(234,88,12,.15))'}}>✨</div>
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
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                <span style={{ fontSize:11, fontWeight:800, color:'var(--info)', textTransform:'uppercase', letterSpacing:'.08em' }}>🎯 For your goal</span>
                <span style={{
                  fontSize:11, fontWeight:700, color:'var(--info)',
                  background:'var(--info-bg)', border:'1px solid var(--info-b)',
                  borderRadius:20, padding:'2px 10px',
                }}>{goalLabels[userGoal]}</span>
              </div>
              <div className="g3" style={{ marginBottom:16 }}>
                {goalItems.map((r, i) => (
                  <button key={i} className="tc"
                    style={{ textAlign:"center", padding:"18px 10px", border:`1.5px solid ${r.border}`, background:r.color }}
                    onClick={r.fn}>
                    <div style={{
                      width:44, height:44, borderRadius:13, margin:'0 auto 8px',
                      background:'var(--card)', border:`1px solid ${r.border}`,
                      display:'flex', alignItems:'center', justifyContent:'center', fontSize:22,
                    }}>{r.icon}</div>
                    <div style={{ fontSize:'var(--text-sm)', fontWeight:800, color:"var(--heading)", lineHeight:1.2 }}>{r.title}</div>
                    <div style={{ fontSize:10, color:"var(--subtext)", marginTop:4, lineHeight:1.3 }}>{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:24 }}>
            {recommendations.map((r, i) => (
              <button key={i} onClick={r.fn} className="tc" style={{
                display:'flex', alignItems:'center', gap:14,
                padding:'16px 18px', border:`1.5px solid ${r.border}`,
                background:r.color, cursor:'pointer', fontFamily:"'Outfit',sans-serif",
                textAlign:'left', width:'100%',
              }}>
                <div style={{
                  width:50, height:50, borderRadius:14, flexShrink:0,
                  background:'var(--card)', border:`1.5px solid ${r.border}`,
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:26,
                  boxShadow:'0 2px 8px rgba(0,0,0,.06)',
                }}>{r.icon}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:15, fontWeight:800, color:'var(--heading)', marginBottom:2 }}>{r.title}</div>
                  <div style={{ fontSize:12, color:'var(--subtext)', lineHeight:1.4 }}>{r.desc}</div>
                </div>
                <div style={{ fontSize:20, color:'var(--subtext)', opacity:.6, fontWeight:300 }}>›</div>
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
          <div className="section-hdr-icon" style={{background:'rgba(124,58,237,.12)'}}>🇭🇷</div>
          <div className="section-hdr-text">
            <div className="section-hdr-title">Cultural Extras</div>
            <div className="section-hdr-sub">Idioms & traditions locals actually use</div>
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {culturalExtras.map((/** @type {any} */ [fn,icon,label,desc,bg,border], i) => (
            <button key={i} onClick={fn} className="tc" style={{
              display:'flex', alignItems:'center', gap:14,
              padding:'16px 18px', border:`1.5px solid ${border}`,
              background:bg, cursor:'pointer', fontFamily:"'Outfit',sans-serif",
              textAlign:'left', width:'100%',
            }}>
              <div style={{
                width:50, height:50, borderRadius:14, flexShrink:0,
                background:'var(--card)', border:`1.5px solid ${border}`,
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:26,
                boxShadow:'0 2px 8px rgba(0,0,0,.06)',
              }}>{icon}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:15, fontWeight:800, color:'var(--heading)', marginBottom:2 }}>{label}</div>
                <div style={{ fontSize:12, color:'var(--subtext)', lineHeight:1.4 }}>{desc}</div>
              </div>
              <div style={{ fontSize:20, color:'var(--subtext)', opacity:.6, fontWeight:300 }}>›</div>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
