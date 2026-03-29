// Naša Hrvatska — Data Layer (vocabulary, exercises, content)
// This file is the single source of truth for all app data.
// data.jsx re-exports everything from here for backward compatibility.
// Firebase + auth + storage: src/lib/firebase.js
// Audio engine: src/lib/audio.js

import React from 'react';
import { _fbReady, initFirebase, gP, sP, lP, gS, sS, cS, touchSession, isSessionExpired, isValidEmail, fbSaveProgress, fbLoadProgress, fbWatchProgress, fbRegister, fbLogin, fbLogout, fbLoginGoogle, fbResetPassword, friendlyError, generateFamilyCode, getLocalFamily, saveLocalFamily, fbCreateFamily, fbJoinFamily, fbGetFamilyMembers, fbWatchFamilyMembers, fbLeaveFamily, fbLoadUserFamily, fbOnAuthStateChanged, fbDeleteAccount, fbToggleFavorite, fbGetIdToken } from '../lib/firebase.js';
import { loadVoices, getBestVoice, stopAudio, speakAzure, speakSynth, speak, speakSlow, speakEN, preloadAudio } from '../lib/audio.js';
import { getSR, saveSR, getDueReviews, getSRScore } from '../lib/srs.js';
import { rnd } from '../lib/random.js';
import * as _vocab from './vocabulary.js';
import * as _grammar from './grammar.js';
import * as _cultural from './cultural.js';
import * as _exercises from './exercises.js';
import * as _scenarios from './scenarios.js';
// ═══ RE-EXPORTS FROM DOMAIN MODULES ═══
const { V, TOP100, BOJE, ALPHA, ZNAM, COUNTRIES, PROFESSIONS, WEATHER, CLOTHES, BODYDESC, TECH_VOC, BUREAUCRATIC } = _vocab;
const { PADEZI, PADEZI_FULL, GRAM, CONJ, MODAL, TENSES, ASPECT, ASPECT_PAIRS, CONDITIONAL, FORMAL_REGISTER, IMPERSONAL, PHONOLOGY, PITCH_ACCENT } = _grammar;
const { HISTORY, EVENTS, PROVERBS, KINGS, HIST_FACTS, REGIONS, MAPPLACES, MEDIA, POPCULTURE, DIALECTS, SHADOWING, CROATIAN_CITIES } = _cultural;
const { PLACE, READ, UNJUMBLE, IDIOMS, PREPS, LISTEN, NUMTIME, NUMCOUNT, FALSEFR, VOCATIVE, PREPDRILL, DECL, BRZALICE, DIMWORDS, WORDFORM, COLORQUIRK, RIDDLES, LOGICQUIZ, ORDINALS, ORDQUIZ, RELPRON, EMOGENDER, QWORDS, NEGATION, COLORAGREE, SIBIL, PROFGENDER, COMPARE, COMPQUIZ, FUTURE, POSSESS, ADJOPPOSITES, PRONOUNCASE, GENDERDRILL, SENTBUILD, VERBDRILL, VBPERSONS, TENSEFLIP } = _exercises;
const { SCHOOL, TEXTING, FRIENDS, FOODORDER, TRANSPORT, EMERGENCY, FOOTBALL, PRACTICAL, RESTCONV, GROCERY, RECIPES, ROLEPLAY, BASKETBALL, GYM, STORIES, CITYLOC, AKUFOOD, AKUCLOTHES, CONVMATCH } = _scenarios;

function sh(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b}
function lvl(x){const t=[0,50,150,300,500,800,1200,1800,2500,3500];for(let i=t.length-1;i>=0;i--)if(x>=t[i])return i+1;return 1}
function lXP(l){return[0,0,50,150,300,500,800,1200,1800,2500,3500][l]??3500}
function nXP(l){return[0,50,150,300,500,800,1200,1800,2500,3500,5000][l]??5000}
function lXPgain(xp){const campaign=getActiveCampaign();if(campaign&&campaign.multiplier&&campaign.multiplier>1){return Math.round(xp*campaign.multiplier);}return xp;}
// ═══════════════════════════════════════
// ═══════════════════════════════════════
// ═══ TOP 100 WORDS BY SITUATION ═══
// Make all TOP100 situational topics available as quizzable vocabulary
Object.keys(TOP100).forEach(function(k){V[k]=TOP100[k];});
// ═══ CROATIAN HISTORY — DOMOVINSKI RAT ═══
// ═══ CROATIAN EVENTS CALENDAR ═══
// ═══ MODAL VERBS ═══
// ═══ GRAMMAR DATA ═══
// ═══ PLACEMENT TEST ═══
// ═══ BADGES ═══
const BADGES=[
  // XP milestones
  {id:"first",n:"First Steps",i:"🌱",d:"Complete 1 lesson",r:s=>s.lc>=1},
  {id:"x100",n:"Rising Star",i:"⭐",d:"Earn 100 XP",r:s=>s.xp>=100},
  {id:"x500",n:"Scholar",i:"📚",d:"Earn 500 XP",r:s=>s.xp>=500},
  {id:"x1k",n:"Master",i:"🏆",d:"Earn 1,000 XP",r:s=>s.xp>=1000},
  {id:"x2k",n:"Expert",i:"🎓",d:"Earn 2,000 XP",r:s=>s.xp>=2000},
  {id:"x5k",n:"Champion",i:"🥇",d:"Earn 5,000 XP",r:s=>s.xp>=5000},
  {id:"x10k",n:"Legend",i:"👑",d:"Earn 10,000 XP",r:s=>s.xp>=10000},
  // Lesson count
  {id:"ded",n:"Dedicated",i:"🔥",d:"Complete 5 lessons",r:s=>s.lc>=5},
  {id:"lc20",n:"Go-Getter",i:"🚀",d:"Complete 20 lessons",r:s=>s.lc>=20},
  {id:"lc50",n:"Marathoner",i:"🏃",d:"Complete 50 lessons",r:s=>s.lc>=50},
  {id:"lc100",n:"Centurion",i:"💯",d:"Complete 100 lessons",r:s=>s.lc>=100},
  // Perfection
  {id:"perf",n:"Perfectionist",i:"💎",d:"Get 100% on a lesson",r:s=>s.pf>=1},
  {id:"perf5",n:"Flawless",i:"✨",d:"Get 100% on 5 lessons",r:s=>s.pf>=5},
  // Skill categories
  {id:"gram",n:"Grammar Guru",i:"📝",d:"Complete a grammar lesson",r:s=>s.gc>=1},
  {id:"spk",n:"Voice of Croatia",i:"🎤",d:"Complete a speaking lesson",r:s=>s.sp>=1},
  {id:"mod",n:"Modal Master",i:"🔮",d:"Complete modal verbs",r:s=>s.mv>=1},
  {id:"hist",n:"Historian",i:"🏛️",d:"Read a history passage",r:s=>s.hi>=1},
  // SRS / vocabulary
  {id:"srs10",n:"Word Collector",i:"📖",d:"Review 10 SRS words",r:s=>(s.srsTotal||0)>=10},
  {id:"srs50",n:"Polyglot",i:"🌍",d:"Review 50 SRS words",r:s=>(s.srsTotal||0)>=50},
  // Streak
  {id:"str3",n:"On a Roll",i:"🔥",d:"3-day streak",r:s=>(s.streak||0)>=3},
  {id:"str7",n:"Week Warrior",i:"📅",d:"7-day streak",r:s=>(s.streak||0)>=7},
  {id:"str30",n:"Unstoppable",i:"⚡",d:"30-day streak",r:s=>(s.streak||0)>=30},
  // Mistakes mastered
  {id:"fix5",n:"Mistake Crusher",i:"🛠️",d:"Master 5 mistake words",r:s=>(s.mistakesMastered||0)>=5},
  // Reading
  {id:"read3",n:"Reading Pro",i:"📰",d:"Complete 3 reading passages",r:s=>(s.readingDone||0)>=3},
  // Cultural
  {id:"amb",n:"Cultural Ambassador",i:"🇭🇷",d:"Explore HRT & media",r:s=>(s.mediaVisits||0)>=1},
  // Cultural content badges
  {id:"baka1",  n:"Baka's Listener",   i:"💌", d:"Opened your first letter from Baka",       r:()=>(getCultureStats().bakaCnt||0)>=1},
  {id:"baka5",  n:"Baka's Devotee",    i:"👵", d:"Read 5 letters from Baka",                 r:()=>(getCultureStats().bakaCnt||0)>=5},
  {id:"city5",  n:"City Explorer",     i:"🏙️",d:"Explored 5 Croatian cities",               r:()=>(getCultureStats().cityCnt||0)>=5},
  {id:"city15", n:"Wanderer",          i:"🗺️",d:"Discovered 15 Croatian cities",            r:()=>(getCultureStats().cityCnt||0)>=15},
  {id:"media5", n:"Culture Seeker",    i:"🎵", d:"Explored 5 Croatian media items",          r:()=>(getCultureStats().mediaCnt||0)>=5},
  {id:"media20",n:"Culture Master",    i:"🇭🇷",d:"Experienced 20 Croatian media items",     r:()=>(getCultureStats().mediaCnt||0)>=20},
  {id:"region5",n:"Regional Explorer", i:"🏔️",d:"Explored 5 Croatian regions",             r:()=>(getCultureStats().regionCnt||0)>=5},
  {id:"proverb",n:"Wisdom Seeker",     i:"📜", d:"Read 3 Croatian proverbs",                 r:()=>(getCultureStats().proverbCnt||0)>=3},
  // Additional streak tiers
  {id:"str14",n:"Two Weeks Strong",  i:"🔥", d:"14-day streak",                              r:s=>(s.streak||0)>=14},
  {id:"str21",n:"Three Week Hero",   i:"💪", d:"21-day streak",                              r:s=>(s.streak||0)>=21},
  {id:"str60",n:"Two Month Titan",   i:"⚡", d:"60-day streak",                              r:s=>(s.streak||0)>=60},
  {id:"str100",n:"Century Streak",   i:"🏆", d:"100-day streak",                             r:s=>(s.streak||0)>=100},
  // Additional lesson counts
  {id:"lc10",n:"Ten Strong",         i:"🎯", d:"Complete 10 lessons",                        r:s=>s.lc>=10},
  {id:"lc30",n:"Committed",          i:"📘", d:"Complete 30 lessons",                        r:s=>s.lc>=30},
  {id:"lc75",n:"Dedicated Learner",  i:"🎓", d:"Complete 75 lessons",                        r:s=>s.lc>=75},
  // Accuracy / performance
  {id:"sharp3",n:"Sharp Shooter",    i:"🎯", d:"Score 100% on 3 different exercises",        r:s=>(s.pf||0)>=3},
  {id:"perf10",n:"Perfectionist Pro",i:"💎", d:"Score 100% on 10 exercises total",           r:s=>(s.pf||0)>=10},
  {id:"nomistake",n:"No Mistakes",   i:"✅", d:"Complete any exercise without a wrong answer",r:s=>(s.pf||0)>=1},
  // Vocabulary mastery (SRS)
  {id:"srs25",n:"Word Collector",    i:"📖", d:"Review 25 SRS words",                        r:s=>(s.srsTotal||0)>=25},
  {id:"srs100",n:"Vocabulary Builder",i:"📚",d:"Review 100 SRS words",                       r:s=>(s.srsTotal||0)>=100},
  {id:"srs250",n:"Lexicon Master",   i:"🌐", d:"Review 250 SRS words",                       r:s=>(s.srsTotal||0)>=250},
  // Practice diversity
  {id:"extype5",n:"Explorer",        i:"🔍", d:"Complete 5 different exercise types",        r:()=>{try{return JSON.parse(localStorage.getItem('nh_ex_types_done')||'[]').length>=5}catch(_){return false}}},
  {id:"extype10",n:"Polyglot Practice",i:"🗣️",d:"Complete 10 different exercise types",     r:()=>{try{return JSON.parse(localStorage.getItem('nh_ex_types_done')||'[]').length>=10}catch(_){return false}}},
  {id:"extype15",n:"All-Rounder",    i:"🌟", d:"Complete 15 different exercise types",       r:()=>{try{return JSON.parse(localStorage.getItem('nh_ex_types_done')||'[]').length>=15}catch(_){return false}}},
  // Time-based
  {id:"earlybird",n:"Early Bird",    i:"🌅", d:"Practice before 8am",                        r:()=>new Date().getHours()<8},
  {id:"nightowl",n:"Night Owl",      i:"🦉", d:"Practice after 10pm",                        r:()=>new Date().getHours()>=22},
  {id:"weekend",n:"Weekend Warrior", i:"🏖️", d:"Practice on both Saturday and Sunday in same weekend", r:()=>{try{const w=JSON.parse(localStorage.getItem('nh_weekend_days')||'{}');return !!(w.sat&&w.sun)}catch(_){return false}}},
  // Goal-specific
  {id:"heritage5",n:"Heritage Seeker",i:"🧬",d:"Set heritage goal and complete 5 lessons",  r:s=>{try{const g=localStorage.getItem('nh_goal');return g==='heritage'&&s.lc>=5}catch(_){return false}}},
  {id:"family5",n:"Family First",    i:"👨‍👩‍👧", d:"Set family goal and complete 5 lessons",     r:s=>{try{const g=localStorage.getItem('nh_goal');return g==='family'&&s.lc>=5}catch(_){return false}}},
  {id:"travel5",n:"World Traveler",  i:"✈️", d:"Set travel goal and complete 5 lessons",    r:s=>{try{const g=localStorage.getItem('nh_goal');return g==='travel'&&s.lc>=5}catch(_){return false}}},
  // Cultural
  {id:"hajduk",n:"Hajduk Fan",       i:"⚽", d:"Complete the football slang exercise",       r:s=>(s.footballDone||0)>=1},
  {id:"dalmatian",n:"Dalmatian Soul",i:"🌊", d:"Complete the Dalmatian dialect exercise",    r:s=>(s.dialectDone||0)>=1},
  {id:"zagreb",n:"Zagrepčanin",      i:"🏙️", d:"Complete the Zagreb slang exercise",        r:s=>(s.textingDone||0)>=1},
];
const DAILY_QUESTS = [
  { id: 'speak',        tier: 1, icon: '🎤', name: 'Speak Quest',        desc: 'Complete 1 speaking exercise',   xp: 25 },
  { id: 'speak2',       tier: 2, icon: '🎤', name: 'Speak Twice',        desc: '2 speaking exercises',           xp: 50 },
  { id: 'grammar',      tier: 1, icon: '📝', name: 'Grammar Quest',      desc: 'Complete 1 grammar lesson',      xp: 25 },
  { id: 'grammar2',     tier: 2, icon: '📝', name: 'Grammar Double',     desc: '2 grammar exercises',            xp: 45 },
  { id: 'master',       tier: 1, icon: '✨', name: 'Master Quest',       desc: 'Review 5+ SRS words',            xp: 30 },
  { id: 'master2',      tier: 2, icon: '✨', name: 'Master Pro',         desc: 'Review 15+ SRS words',           xp: 55 },
  { id: 'reading',      tier: 1, icon: '📖', name: 'Reading Quest',      desc: 'Complete 1 reading passage',     xp: 20 },
  { id: 'reading2',     tier: 2, icon: '📖', name: 'Reading Double',     desc: '2 reading passages',             xp: 40 },
  { id: 'streak',       tier: 1, icon: '🔥', name: 'Streak Quest',       desc: 'Keep your daily streak alive',   xp: 10 },
  { id: 'streak_alive', tier: 1, icon: '🔥', name: 'Keep Streak',        desc: 'Practice anything today',        xp: 10 },
  { id: 'perfect',      tier: 2, icon: '🎯', name: 'Perfect Score',      desc: 'Score 100% on any exercise',     xp: 60 },
];
// ═══ READING PASSAGES ═══
// ═══ ALPHABET ═══
// ═══ ZNAM - NE ZNAM (Translation Exercises) ═══
// ═══ COLORS & GENDER AGREEMENT ═══
// ═══ VERB CONJUGATION DRILLS ═══
// ═══ SPACED REPETITION ═══
// getSR / saveSR / getDueReviews are imported from ./lib/srs.js (FSRS-4.5).
// Re-exported at the bottom of this file so all existing imports keep working.
// Cultural content tracking
function getCultureStats() {
  try { return JSON.parse(localStorage.getItem('nh_culture') || '{}'); } catch { return {}; }
}
function incrementCulture(key) {
  const c = getCultureStats();
  c[key] = (c[key] || 0) + 1;
  localStorage.setItem('nh_culture', JSON.stringify(c));
  return c[key];
}
// srMark — delegates to FSRS-4.5 getSRScore() imported from ./lib/srs.js.
// Signature preserved: srMark(word, correct) — timeMs defaults to 4000 ms
// (treated as a "medium" response giving grade 4 when correct).
function srMark(word, correct, timeMs) {
  getSRScore(word, correct, timeMs != null ? timeMs : 4000);
}
// ═══ MISTAKE TRACKER ═══
function getMistakes(){try{return JSON.parse(localStorage.getItem("uMistakes")||"[]");}catch{return[];}}
function recordMistake(hr,en,q,category,initialCount){
  try{
    const list=getMistakes();
    const existing=list.findIndex(function(m){return m.hr===hr;});
    if(existing!==-1){list[existing].count=(list[existing].count||1)+1;list[existing].t=Date.now();list[existing].q=q||list[existing].q;}
    else{list.push({hr,en:en||"",q:q||"",category:category||"",count:initialCount||1,t:Date.now()});}
    if(list.length>200)list.splice(0,list.length-200);
    localStorage.setItem("uMistakes",JSON.stringify(list));
  }catch{}
}
function clearMistake(hr){try{const list=getMistakes().filter(function(m){return m.hr!==hr;});localStorage.setItem("uMistakes",JSON.stringify(list));}catch{}}
function clearAllMistakes(){try{localStorage.removeItem("uMistakes");}catch{}}
// Silently backfills mistakes from historical SRS wrong-answer data.
// Runs once per device (guards with localStorage flag). Safe to call early —
// only reads/writes localStorage, never blocks the UI.
function bootstrapMistakesFromSRS(){
  try{
    if(localStorage.getItem("uMistakesBootstrapped"))return;
    const sr=getSR();
    const existing=new Set(getMistakes().map(function(m){return m.hr;}));
    // Build a flat hr→{en,category} lookup from V
    const lookup={};
    for(const cat in V){
      const items=V[cat];
      if(!Array.isArray(items))continue;
      for(const item of items){
        if(Array.isArray(item)&&item.length>=2){
          const hr=String(item[0]).trim();
          const en=String(item[1]).trim();
          if(hr&&en&&!lookup[hr.toLowerCase()])lookup[hr.toLowerCase()]={en,category:cat};
        }
      }
    }
    // Import words missed 2+ times (threshold filters misclicks vs. real gaps)
    for(const word in sr){
      const card=sr[word];
      if((card.w||0)<2)continue;
      if(existing.has(word))continue;
      const found=lookup[word.toLowerCase()];
      recordMistake(word,found?found.en:"","",found?found.category:"",card.w);
    }
    localStorage.setItem("uMistakesBootstrapped","1");
  }catch{}
}
// ═══ HRT & CROATIAN MEDIA ═══
// ═══ CROATIAN CASES (PADE\u017dI) ═══
// ═══ WORD ORDER & UNJUMBLE ═══
// ═══ CROATIAN IDIOMS & SLANG ═══
// ═══ PREPOSITIONS WITH CASES ═══
// ═══ CROATIAN KINGS & MEDIEVAL KINGDOM ═══
// ═══ DAILY STREAK ═══
function getStreak(){try{return JSON.parse(localStorage.getItem("uStreak")||'{"count":0,"last":""}');} catch{return{count:0,last:""}}}
function getStreakFreezes(){try{return parseInt(localStorage.getItem('uFreeze')||'0',10);}catch{return 0}}
function earnFreeze(){const f=getStreakFreezes();localStorage.setItem('uFreeze',String(Math.min(f+1,2)));}
function spendFreeze(){const f=getStreakFreezes();if(f<=0)return false;localStorage.setItem('uFreeze',String(f-1));return true;}
const STREAK_MILESTONES=[7,14,21,30,50,100,365];
function localDateStr(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function updateStreak(){
  const s=getStreak();const today=localDateStr();
  if(s.last===today){
    // Same day: increment earn-back lesson count if active
    try{const eb=JSON.parse(localStorage.getItem('nh_earn_back')||'null');if(eb&&eb.date===today){eb.lc=(eb.lc||1)+1;localStorage.setItem('nh_earn_back',JSON.stringify(eb));}}catch{}
    return{...s,milestone:null};
  }
  const yd=new Date();yd.setDate(yd.getDate()-1);const yesterday=yd.getFullYear()+'-'+String(yd.getMonth()+1).padStart(2,'0')+'-'+String(yd.getDate()).padStart(2,'0');
  let milestone=null;
  let freezeUsed=false;
  if(s.last===yesterday){s.count++;s.last=today;if(STREAK_MILESTONES.includes(s.count))milestone=s.count;}
  else if(s.last!==today){
    if(spendFreeze()){s.last=today;s.frozeOn=today;freezeUsed=true;}
    else{
      // Streak broken — save earn-back opportunity if they had ≥2 streak
      if(s.count>=2){try{localStorage.setItem('nh_earn_back',JSON.stringify({prev:s.count,date:today,lc:1}));}catch{}}
      // Clear ceremony flags so re-achieving milestones shows the celebration again
      const _prevCount=s.count;
      [30,50,100].forEach(m=>{if(_prevCount>=m)localStorage.removeItem('nh_ceremony_streak_'+m);});
      s.count=1;s.last=today;
    }
  }
  localStorage.setItem("uStreak",JSON.stringify(s));
  return{...s,milestone,freezeUsed};
}
// Returns {prev, date, lc} if an earn-back opportunity exists for today, else null
function getStreakEarnBack(){
  try{const eb=JSON.parse(localStorage.getItem('nh_earn_back')||'null');if(!eb)return null;if(eb.date!==localDateStr())return null;return eb;}catch{return null;}
}
// Restores streak to earned-back count; clears the earn-back token. Returns restored count or 0.
function applyStreakEarnBack(){
  const eb=getStreakEarnBack();
  if(!eb||eb.lc<2)return 0;
  const s=getStreak();s.count=eb.prev;localStorage.setItem("uStreak",JSON.stringify(s));
  try{localStorage.removeItem('nh_earn_back');}catch{}
  return eb.prev;
}
// ═══ CROATIAN PROVERBS ═══
function getProverbOfDay(){
  const n=new Date();
  const dk=n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0');
  // Seed with date + a salt so proverb and fact never land on the same index
  let h=5381;const s='prov:'+dk;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;h=h>>>0;
  return PROVERBS[h%PROVERBS.length];
}
// ═══ LISTENING COMPREHENSION ═══
// ═══ MINI STORIES (BRANCHING) ═══
// ═══ NUMBER & TIME DRILLS ═══
// ═══ NUMBER–NOUN AGREEMENT ═══
// Croatian number-noun agreement rule:
//   1 (jedan/jedna/jedno) → Nominative singular
//   2, 3, 4 (dva/dvije, tri, četiri) → Genitive singular
//   5+ (pet, šest … tisuća …) → Genitive plural
// The numeral must also agree in gender with the noun.
// ═══ VERB ASPECT (PERFECTIVE/IMPERFECTIVE) ═══
// Acquisition note (Novak Milić 2010):
//   A2 — recognition only: learners see aspect pairs, understand the concept
//   B1 — production begins: learners choose correct aspect in context (negation rule, frequency adverbs)
//   B2 — mastery: narrative aspect, imperative aspect, complex contexts
// The quiz/production sections below should be gated to B1+ in UI components.
// ═══ FALSE FRIENDS (LA\u017dNI PRIJATELJI) ═══
// ═══ VOCATIVE DRILLS ═══
// Vocative is #5 most common error for English speakers (avoidance — using nominative for address)
// Rules:
//   Feminine -a nouns: drop -a, add -o (Marija→Marijo, mama→mamo, sestra→sestro)
//   Masculine consonant-stem: add -e (drug→druže, profesor→profesore, brat→brate)
//   Masculine -ar/-ar: add -u or -e (doktor→doktore, prijatelj→prijatelju)
//   Neuter: Vocative = Nominative (dijete→dijete)
//   Some irregulars: gospodin→gospodine, gospođa→gospođo, Bog→Bože
// ═══ PREPOSITION DRILLS ═══
// ═══ NOUN DECLENSION TRAINER ═══
// ═══ TONGUE TWISTERS (BRZALICE) ═══
// ═══ REGIONAL DIALECTS ═══
// ═══ DIMINUTIVES & AUGMENTATIVES ═══
// ═══ WORD FORMATION (PREFIX PATTERNS) ═══
// ═══ COLOR QUIRKS ═══
// ═══ DAILY CHALLENGE ═══
let _dcCache=null;
function getDailyChallenge(){
  // Return cached result if same day — prevents non-determinism from multiple calls
  const now=new Date();
  const _dk=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
  if(_dcCache&&_dcCache.dateKey===_dk)return _dcCache;

  const dateKey=_dk;
  // Seeded PRNG (LCG) — fully deterministic per date, different every day
  function hashStr(s){let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return h>>>0}
  let _seed=hashStr(dateKey);
  function rand(){_seed=(_seed*1664525+1013904223)>>>0;return _seed/4294967296}
  function ri(n){return Math.floor(rand()*n)}
  function shuf(arr){const a=arr.slice();for(let i=a.length-1;i>0;i--){const j=ri(i+1);const t=a[i];a[i]=a[j];a[j]=t}return a}
  // Large hardcoded grammar/culture/translation pool (50+ questions)
  const hard=[
    {q:"Translate: 'I want to learn Croatian.'",a:"Želim učiti hrvatski.",opts:["Želim učiti hrvatski.","Moram učiti hrvatski.","Mogu učiti hrvatski.","Učim hrvatski."]},
    {q:"Translate: 'Where is the pharmacy?'",a:"Gdje je ljekarna?",opts:["Gdje je ljekarna?","Gdje je bolnica?","Gdje je pošta?","Što je ljekarna?"]},
    {q:"Translate: 'I like Croatia.'",a:"Sviđa mi se Hrvatska.",opts:["Sviđa mi se Hrvatska.","Volim Hrvatsku.","Idem u Hrvatsku.","Iz Hrvatske sam."]},
    {q:"Translate: 'Can you help me?'",a:"Možete li mi pomoći?",opts:["Možete li mi pomoći?","Trebam pomoć.","Gdje je pomoć?","Moramo pomoći."]},
    {q:"Translate: 'My children speak Croatian.'",a:"Moja djeca govore hrvatski.",opts:["Moja djeca govore hrvatski.","Moja djeca uče hrvatski.","Moji djeca govori hrvatski.","Moja djeca znaju hrvatski."]},
    {q:"Translate: 'Good morning!'",a:"Dobro jutro!",opts:["Dobro jutro!","Dobar dan!","Dobra večer!","Laku noć!"]},
    {q:"Translate: 'How much does this cost?'",a:"Koliko ovo košta?",opts:["Koliko ovo košta?","Gdje to kupiti?","Što ovo znači?","Kada to dolazi?"]},
    {q:"Translate: 'I am from America.'",a:"Ja sam iz Amerike.",opts:["Ja sam iz Amerike.","Ja idem u Ameriku.","Ja živim u Americi.","Ja volim Ameriku."]},
    {q:"Translate: 'Do you speak English?'",a:"Govorite li engleski?",opts:["Govorite li engleski?","Znate li engleski?","Učite li engleski?","Razumijete li engleski?"]},
    {q:"Translate: 'I don't understand.'",a:"Ne razumijem.",opts:["Ne razumijem.","Ne znam.","Ne mogu.","Ne slušam."]},
    {q:"Translate: 'The sea is beautiful.'",a:"More je lijepo.",opts:["More je lijepo.","Nebo je lijepo.","Grad je lijep.","Sunce je lijepo."]},
    {q:"Translate: 'We are going to Dubrovnik.'",a:"Idemo u Dubrovnik.",opts:["Idemo u Dubrovnik.","Smo u Dubrovniku.","Dolazimo iz Dubrovnika.","Volimo Dubrovnik."]},
    {q:"Translate: 'I am hungry.'",a:"Gladan/Gladna sam.",opts:["Gladan/Gladna sam.","Žedan/Žedna sam.","Umoran/Umorna sam.","Sretan/Sretna sam."]},
    {q:"Translate: 'The train leaves at eight.'",a:"Vlak odlazi u osam.",opts:["Vlak odlazi u osam.","Vlak dolazi u osam.","Bus odlazi u osam.","Vlak staje u osam."]},
    {q:"Translate: 'I love you.'",a:"Volim te.",opts:["Volim te.","Sviđaš mi se.","Trebam te.","Poznajem te."]},
    {q:"Translate: 'See you tomorrow!'",a:"Vidimo se sutra!",opts:["Vidimo se sutra!","Do sutra!","Sutra dolazim.","Sutra idemo."]},
    {q:"Translate: 'The coffee is hot.'",a:"Kava je vruća.",opts:["Kava je vruća.","Kava je hladna.","Kava je dobra.","Kava je slatka."]},
    {q:"Translate: 'Happy birthday!'",a:"Sretan rođendan!",opts:["Sretan rođendan!","Sretan Božić!","Sretna Nova godina!","Čestitam!"]},
    {q:"Conjugate: ja + pisati (present)",a:"pišem",opts:["pišem","pisam","pišim","pisem"]},
    {q:"Conjugate: oni + ići (present)",a:"idu",opts:["idu","iću","idem","idaju"]},
    {q:"Conjugate: mi + voljeti (present)",a:"volimo",opts:["volimo","volimu","volemo","voljemo"]},
    {q:"Conjugate: ona + jesti (past)",a:"jela je",opts:["jela je","jeo je","jelo je","jeli je"]},
    {q:"Conjugate: ja + čitati (future)",a:"čitat ću",opts:["čitat ću","čitam ću","čitati ću","čitaću"]},
    {q:"Conjugate: ti + gledati (present)",a:"gledaš",opts:["gledaš","gledate","gleda","gledamo"]},
    {q:"Conjugate: vi + raditi (present)",a:"radite",opts:["radite","radimo","rade","radiste"]},
    {q:"Conjugate: on + htjeti (present)",a:"hoće",opts:["hoće","hoći","hoćem","hoćeš"]},
    {q:"Conjugate: ja + moći (present)",a:"mogu",opts:["mogu","moći","možem","mognjem"]},
    {q:"Conjugate: mi + znati (present)",a:"znamo",opts:["znamo","znademo","znate","znaju"]},
    {q:"Conjugate: ona + doći (past)",a:"došla je",opts:["došla je","došao je","došlo je","dolazi"]},
    {q:"Conjugate: ja + biti (present)",a:"jesam / sam",opts:["jesam / sam","jeste","jest","smo"]},
    {q:"Put 'knjiga' in Accusative:",a:"knjigu",opts:["knjigu","knjige","knjizi","knjigo"]},
    {q:"Put 'grad' in Locative (u ___):",a:"gradu",opts:["gradu","grada","grade","gradom"]},
    {q:"Put 'prijatelj' in Instrumental (s ___):",a:"prijateljem",opts:["prijateljem","prijatelja","prijatelju","prijatelje"]},
    {q:"Put 'žena' in Dative:",a:"ženi",opts:["ženi","ženu","žene","ženom"]},
    {q:"Put 'more' in Genitive:",a:"mora",opts:["mora","moru","morom","more"]},
    {q:"Put 'kuća' in Accusative:",a:"kuću",opts:["kuću","kuće","kući","kućom"]},
    {q:"Put 'auto' in Locative (u ___):",a:"autu",opts:["autu","auta","autom","autima"]},
    {q:"Put 'dijete' in Genitive:",a:"djeteta",opts:["djeteta","djetetu","dijete","djetetom"]},
    {q:"Put 'sin' in Dative:",a:"sinu",opts:["sinu","sina","sinom","sini"]},
    {q:"Put 'ruka' in Instrumental (s ___):",a:"rukom",opts:["rukom","ruku","ruke","ruci"]},
    {q:"'Nemam' means:",a:"I don't have",opts:["I don't have","I'm not","I can't","I don't want"]},
    {q:"'Trebam' means:",a:"I need",opts:["I need","I have","I want","I must"]},
    {q:"'Mogu' means:",a:"I can",opts:["I can","I want","I go","I know"]},
    {q:"'Idem kući' means:",a:"I'm going home",opts:["I'm going home","I'm at home","I came home","My house"]},
    {q:"'Kako si?' means:",a:"How are you? (informal)",opts:["How are you? (informal)","What is your name?","Where are you?","Who are you?"]},
    {q:"'Odakle si?' means:",a:"Where are you from?",opts:["Where are you from?","Where are you going?","Where do you live?","Where were you?"]},
    {q:"What gender is 'more' (sea)?",a:"Neuter",opts:["Neuter","Masculine","Feminine","Both"]},
    {q:"What gender is 'prijatelj' (male friend)?",a:"Masculine",opts:["Masculine","Feminine","Neuter","Variable"]},
    {q:"What gender is 'knjiga' (book)?",a:"Feminine",opts:["Feminine","Masculine","Neuter","Variable"]},
    {q:"What gender is 'selo' (village)?",a:"Neuter",opts:["Neuter","Masculine","Feminine","Variable"]},
    {q:"Croatian has how many grammatical cases?",a:"7",opts:["7","6","5","8"]},
    {q:"Which pronoun means 'we'?",a:"mi",opts:["mi","vi","oni","ono"]},
    {q:"Which pronoun means 'they' (mixed/masc)?",a:"oni",opts:["oni","one","ona","ono"]},
    {q:"'Doviđenja' means:",a:"Goodbye",opts:["Goodbye","Hello","Thank you","Please"]},
    {q:"'Hvala' means:",a:"Thank you",opts:["Thank you","Please","Sorry","Welcome"]},
    {q:"'Molim' means:",a:"Please / You're welcome",opts:["Please / You're welcome","Thank you","Sorry","Excuse me"]},
    {q:"'Oprosti' means:",a:"Sorry (informal)",opts:["Sorry (informal)","Thank you","Please","Goodbye"]},
    {q:"The Croatian word for 'island' is:",a:"otok",opts:["otok","rijeka","jezero","more"]},
    {q:"'Lijepa naša' is the Croatian:",a:"National anthem",opts:["National anthem","National dish","Currency","Flag design"]},
    {q:"Which case follows the preposition 'u' (location)?",a:"Locative",opts:["Locative","Accusative","Genitive","Dative"]},
    {q:"Which case follows the preposition 'u' (movement)?",a:"Accusative",opts:["Accusative","Locative","Genitive","Instrumental"]},
    {q:"The aspect 'svršeni' (perfective) expresses:",a:"Completed action",opts:["Completed action","Ongoing action","Habitual action","Future wish"]},
    {q:"'Što' means:",a:"What",opts:["What","Who","Where","When"]},
    {q:"'Tko' means:",a:"Who",opts:["Who","What","Where","Which"]},
    {q:"'Kada' means:",a:"When",opts:["When","Where","Why","How"]},
    {q:"'Zašto' means:",a:"Why",opts:["Why","When","How","Where"]},
    {q:"'Koliko' means:",a:"How many / How much",opts:["How many / How much","How long","How far","How often"]},
    {q:"The diminutive suffix '-ica' makes a word:",a:"Smaller / more endearing",opts:["Smaller / more endearing","Larger","Plural","Negative"]},
    {q:"'Baka' means:",a:"Grandmother",opts:["Grandmother","Grandfather","Aunt","Mother"]},
    {q:"'Djed' means:",a:"Grandfather",opts:["Grandfather","Grandmother","Uncle","Father"]},
    {q:"Capital city of Croatia:",a:"Zagreb",opts:["Zagreb","Split","Rijeka","Osijek"]},
    {q:"The Adriatic coast of Croatia is in which region?",a:"Dalmatia & Istria",opts:["Dalmatia & Istria","Slavonia","Zagorje","Baranja"]},
    {q:"Croatian currency is:",a:"Euro (EUR)",opts:["Euro (EUR)","Kuna","Dinar","Kruna"]},
  ];
  // Generate vocab questions dynamically from vocabulary data V (seeded per day)
  const allWords=[];
  Object.keys(V).forEach(function(cat){V[cat].forEach(function(w){if(w[0]&&w[1])allWords.push(w)})});
  const vocabQs=[];
  if(allWords.length>10){
    const used=new Set();
    for(let attempt=0;attempt<30&&vocabQs.length<30;attempt++){
      const vi=ri(allWords.length);
      if(used.has(vi))continue;
      used.add(vi);
      const word=allWords[vi];
      const wrongs=[];let wAttempts=0;const wUsed=new Set([vi]);
      while(wrongs.length<3&&wAttempts<120){
        const wi=ri(allWords.length);wAttempts++;
        if(!wUsed.has(wi)&&allWords[wi][1]!==word[1]){wUsed.add(wi);wrongs.push(allWords[wi])}
      }
      if(wrongs.length<3)continue;
      const dir=rand()<0.5;
      if(dir){
        vocabQs.push({q:"What does '"+word[0]+"' mean?",a:word[1],opts:shuf([word[1],wrongs[0][1],wrongs[1][1],wrongs[2][1]])});
      } else {
        vocabQs.push({q:"How do you say '"+word[1]+"' in Croatian?",a:word[0],opts:shuf([word[0],wrongs[0][0],wrongs[1][0],wrongs[2][0]])});
      }
    }
  }
  // Shuffle opts for hard items using seeded RNG (correct answer is always first in hard pool — fix that)
  const hardShuffled=hard.map(function(item){return{q:item.q,a:item.a,opts:shuf(item.opts.slice())};});
  // Combine pools and pick THREE distinct challenges using the seeded RNG
  const pool=hardShuffled.concat(vocabQs);
  const challenges=[];const usedIdx=new Set();
  for(let tries=0;tries<pool.length*3&&challenges.length<3;tries++){
    const idx=ri(pool.length);
    if(!usedIdx.has(idx)){usedIdx.add(idx);challenges.push(pool[idx]);}
  }
  // Fallback: fill if pool too small
  while(challenges.length<3)challenges.push(pool[ri(pool.length)]);
  // SRS weak-word integration: replace last challenge with a due-review question if any words are due
  try {
    const dueWords=getDueReviews();
    if(dueWords.length>0){
      let srsQ=null;
      const vCats=Object.values(V);
      for(let di=0;di<dueWords.length&&!srsQ;di++){
        const dueWord=dueWords[di];
        for(let ci=0;ci<vCats.length&&!srsQ;ci++){
          const found=vCats[ci].find(function(pair){return pair[0]===dueWord;});
          if(found){
            const wrongs=[];let wA=0;
            while(wrongs.length<3&&wA<200){
              const rc=vCats[ri(vCats.length)];wA++;
              if(!rc||!rc.length)continue;
              const rp=rc[ri(rc.length)];
              if(rp&&rp[1]&&rp[1]!==found[1]&&!wrongs.some(function(w){return w===rp[1];}))wrongs.push(rp[1]);
            }
            if(wrongs.length===3){
              srsQ={q:"🔁 Review: What does '"+found[0]+"' mean?",a:found[1],opts:shuf([found[1],wrongs[0],wrongs[1],wrongs[2]]),isSRS:true};
            }
          }
        }
      }
      if(srsQ)challenges[2]=srsQ;
    }
  } catch(_){}
  _dcCache={dateKey:dateKey,challenges:challenges};
  return _dcCache;
}
// ═══ PADEŽI JEDNINA & MNOŽINA (SINGULAR & PLURAL CASES) ═══
// ═══ SCHOOL SURVIVAL KIT ═══
// ═══ REGIONAL HISTORY ═══
// ═══ CITY OF THE DAY ═══
function getCityOfDay(){
  const n=new Date();
  const year=n.getFullYear();
  const dayOfYear=Math.floor((Number(n)-Number(new Date(year,0,1)))/86400000);
  // Fisher-Yates shuffle seeded by year — every city appears once before any repeats
  const idx=CROATIAN_CITIES.map(function(_,i){return i});
  let seed=(year*2654435761)>>>0;
  function rng(){seed=((seed*1664525+1013904223)>>>0);return seed/4294967296}
  for(let i=idx.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));const t=idx[i];idx[i]=idx[j];idx[j]=t}
  return CROATIAN_CITIES[idx[dayOfYear%idx.length]];
}
// ═══ TENSE & GENDER CONJUGATION SYSTEM ═══
// ═══ INTERACTIVE MAP DATA ═══
// ═══ GROCERY SHOPPING ═══
// ═══ LEARNING PATH: wire specialized content into V for lesson+quiz support ═══
V["Order Food"]=[].concat(
  FOODORDER.bakery.items,
  FOODORDER.fastfood.items,
  FOODORDER.icecream.items,
  FOODORDER.restaurant.phrases
);
V["Getting Around"]=TRANSPORT.map(function(t){return[t.hr,t.en];});
V["School Kit"]=[].concat(SCHOOL.classroom,SCHOOL.phrases);
V["Making Friends"]=FRIENDS.map(function(f){return[f.hr,f.en];});
V["Grocery Shopping"]=[].concat(GROCERY.vocab,GROCERY.phrases);
V["Alphabet"]=ALPHA.map(function(a){return[a[0],a[1]+" — "+a[2]+" ("+a[3]+")"];});
V["Emergency"]=[].concat(EMERGENCY.phrases,EMERGENCY.bodyParts);
// ═══ CROATIAN RECIPES ═══
// ═══ CONVERSATION ROLE-PLAY ═══
// ═══ POVIJESNE ČINJENICE ═══
function getHistFact(){
  const n=new Date();
  const dk=n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0');
  // Different salt from proverb so the two never share the same pick
  let h=5381;const s='fact:'+dk;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;h=h>>>0;
  return HIST_FACTS[h%HIST_FACTS.length];
}
// ═══ LEARNING PATH ═══
const LEARN_PATH = [
  {level:1,title:"Survivor",desc:"First 48 hours",items:[
    {id:"lp1",name:"Basic Greetings",diff:1,dur:"~5 min",ck:function(s){return (s.ct&&s.ct.includes("greetings"))||s.lc>=1},go:"lesson",topic:"greetings"},{id:"lp2",name:"Numbers",diff:1,dur:"~5 min",ck:function(s){return (s.ct&&s.ct.includes("numbers"))||s.lc>=2},go:"lesson",topic:"numbers"},{id:"lp_listen_basics",name:"Hear Croatian",cat:"listening",icon:"🎧",desc:"Train your ear — listen to basic Croatian phrases",dur:"~5 min",diff:1,go:"listening",ck:function(s){return s&&(s.lc>=2)}},{id:"lp3",name:"Emergency Phrases",diff:1,dur:"~6 min",ck:function(s){return (s.ct&&s.ct.includes("health"))||s.lc>=3},go:"lesson",topic:"health"},{id:"lp4",name:"Order Food",diff:1,dur:"~6 min",ck:function(s){return (s.ct&&s.ct.includes("restaurant"))||s.lc>=4},go:"lesson",topic:"restaurant"},{id:"lp5",name:"Get Around",diff:1,dur:"~8 min",ck:function(s){return (s.ct&&s.ct.includes("transport"))||s.lc>=5},go:"lesson",topic:"transport"}]},
  {level:2,title:"Settler",desc:"First week",items:[
    {id:"lp6",name:"Family Words",diff:1,dur:"~8 min",ck:function(s){return (s.ct&&s.ct.includes("family"))||s.lc>=6},go:"lesson",topic:"family"},{id:"lp7",name:"School Kit",diff:1,dur:"~8 min",ck:function(s){return (s.ct&&s.ct.includes("in the classroom"))||s.lc>=7},go:"lesson",topic:"in the classroom"},{id:"lp8",name:"Making Friends",diff:2,dur:"~8 min",ck:function(s){return (s.ct&&s.ct.includes("personality"))||s.lc>=8},go:"lesson",topic:"personality"},{id:"lp9",name:"Grocery Shopping",diff:1,dur:"~8 min",ck:function(s){return (s.ct&&s.ct.includes("shopping"))||s.lc>=9},go:"lesson",topic:"shopping"},{id:"lp10",name:"Alphabet",diff:2,dur:"~10 min",ck:function(s){return s.lc>=3},go:"alphabet",topic:"alphabet"},{id:"lp11",name:"First Quiz",diff:1,dur:"~5 min",ck:function(s){return s.xp>=50},go:"mcgame"}]},
  {level:3,title:"Communicator",desc:"First month",items:[
    {id:"lp12",name:"Grammar Intro",diff:2,dur:"~10 min",ck:function(s){return s.gc>=1},go:"grammar"},{id:"lp13",name:"Texting/Slang",diff:2,dur:"~10 min",ck:function(s){return s.lc>=10},go:"texting"},{id:"lp14",name:"Role-Play",diff:2,dur:"~10 min",ck:function(s){return s.lc>=10},go:"roleplay"},{id:"lp15",name:"Read a Story",diff:2,dur:"~12 min",ck:function(s){return s.lc>=12},go:"readlist"},{id:"lp16",name:"Conjugation",diff:3,dur:"~12 min",ck:function(s){return s.gc>=2},go:"conjdrill"},{id:"lp17",name:"Listening",diff:2,dur:"~10 min",ck:function(s){return s.lc>=12},go:"listening"},{id:"lp18",name:"Tenses & Gender",diff:3,dur:"~12 min",ck:function(s){return s.gc>=3},go:"tenses"},{id:"lp34",name:"Vi ili ti?",diff:2,dur:"~10 min",ck:function(s){return s.gc>=3},go:"formalregister"},{id:"lp35",name:"Tech & Digital",diff:2,dur:"~10 min",ck:function(s){return s.lc>=12},go:"techvoc"},{id:"lp42",name:"Work & Career",diff:2,dur:"~10 min",ck:function(s){return (s.ct&&s.ct.includes("work"))||s.lc>=14},go:"lesson",topic:"work"},{id:"lp43",name:"Opinions & Debate",diff:2,dur:"~12 min",ck:function(s){return (s.ct&&s.ct.includes("opinions"))||s.lc>=15},go:"lesson",topic:"opinions"}]},
  {level:4,title:"Explorer",desc:"Months 2-3",items:[
    {id:"lp19",name:"7 Cases",diff:3,dur:"~12 min",ck:function(s){return s.gc>=4},go:"padezi"},{id:"lp20",name:"Padeži Master",diff:3,dur:"~15 min",ck:function(s){return s.gc>=5},go:"padezifull"},{id:"lp21",name:"Verb Aspect",diff:3,dur:"~12 min",ck:function(s){return s.gc>=5},go:"aspect"},{id:"lp22",name:"Modal Verbs",diff:2,dur:"~10 min",ck:function(s){return s.gc>=6},go:"modal"},{id:"lp23",name:"Declension",diff:3,dur:"~15 min",ck:function(s){return s.gc>=6},go:"declension"},{id:"lp24",name:"False Friends",diff:2,dur:"~10 min",ck:function(s){return s.lc>=20},go:"falsefr"},{id:"lp25",name:"Dialects",diff:2,dur:"~12 min",ck:function(s){return s.lc>=20},go:"dialects"},{id:"lp36",name:"Conditional Mood",diff:3,dur:"~12 min",ck:function(s){return s.gc>=5},go:"conditional"},{id:"lp37",name:"Impersonal",diff:3,dur:"~12 min",ck:function(s){return s.gc>=6},go:"impersonal"},{id:"lp39",name:"Clitic Pronouns",diff:3,dur:"~12 min",ck:function(s){return s.gc>=6},go:"clitic"},{id:"lp44",name:"Environment",diff:2,dur:"~10 min",ck:function(s){return (s.ct&&s.ct.includes("environment"))||s.lc>=22},go:"lesson",topic:"environment"},{id:"lp45",name:"Society & Community",diff:2,dur:"~12 min",ck:function(s){return (s.ct&&s.ct.includes("society"))||s.lc>=23},go:"lesson",topic:"society"}]},
  {level:5,title:"Hrvat",desc:"Months 4-6",items:[
    {id:"lp26",name:"Idioms",diff:3,dur:"~12 min",ck:function(s){return s.lc>=25},go:"idioms"},{id:"lp27",name:"Tongue Twisters",diff:3,dur:"~12 min",ck:function(s){return s.lc>=25},go:"brzalice"},{id:"lp28",name:"Word Formation",diff:3,dur:"~15 min",ck:function(s){return s.lc>=25},go:"wordform"},{id:"lp29",name:"Diminutives",diff:3,dur:"~12 min",ck:function(s){return s.lc>=28},go:"diminutives"},{id:"lp30",name:"Advanced Reading",diff:3,dur:"~15 min",ck:function(s){return s.lc>=30},go:"readlist"},{id:"lp31",name:"Domovinski Rat",diff:3,dur:"~15 min",ck:function(s){return s.lc>=30},go:"history"},{id:"lp32",name:"Cook Croatian!",diff:2,dur:"~12 min",ck:function(s){return s.lc>=30},go:"recipes"},{id:"lp33",name:"200 XP!",diff:3,dur:"~5 min",ck:function(s){return s.xp>=200},go:"dashboard"},{id:"lp38",name:"Admin Life",diff:3,dur:"~15 min",ck:function(s){return s.lc>=28},go:"bureaucratic"},{id:"lp40",name:"Subjunctive (da + Verb)",diff:3,dur:"~12 min",ck:function(s){return s.gc>=6},go:"grammar"},{id:"lp41",name:"Listening Path",diff:3,dur:"~15 min",ck:function(s){return s.lc>=25},go:"listeningpath"}]},
  {level:6,title:"Virtuoz",desc:"Months 7-12",items:[
    {id:"lp50",name:"Pitch Accent",diff:3,dur:"~15 min",ck:function(s){return s.lc>=35},go:"pitchaccent"},
    {id:"lp51",name:"Shadowing",diff:3,dur:"~15 min",ck:function(s){return s.lc>=35},go:"shadowing"},
    {id:"lp52",name:"Aspect Drill",diff:3,dur:"~15 min",ck:function(s){return s.lc>=35},go:"aspectdrill"},
    {id:"lp53",name:"Clitic Pronouns",diff:3,dur:"~15 min",ck:function(s){return s.lc>=36},go:"clitic"},
    {id:"lp54",name:"Grammar Constellation",diff:3,dur:"~15 min",ck:function(s){return s.gc>=7},go:"grammarmap"},
    {id:"lp55",name:"Impersonal Constructions",diff:3,dur:"~15 min",ck:function(s){return s.gc>=7},go:"impersonal"},
    {id:"lp56",name:"Conditional Mood",diff:3,dur:"~15 min",ck:function(s){return s.gc>=7},go:"conditional"},
    {id:"lp57",name:"Word Formation",diff:3,dur:"~15 min",ck:function(s){return s.lc>=38},go:"wordform"},
    {id:"lp58",name:"Politics Vocabulary",diff:3,dur:"~15 min",ck:function(s){return s.lc>=38},go:"lesson",topic:"politics"},
    {id:"lp59",name:"Arts & Culture",diff:3,dur:"~15 min",ck:function(s){return s.lc>=38},go:"lesson",topic:"arts"},
    {id:"lp60",name:"B2 Reading",diff:3,dur:"~20 min",ck:function(s){return s.lc>=40},go:"readlist"},
    {id:"lp61",name:"Croatian History",diff:3,dur:"~20 min",ck:function(s){return s.lc>=40},go:"history"},
    {id:"lp62",name:"Listening Mastery",diff:3,dur:"~20 min",ck:function(s){return s.lc>=40},go:"listeningpath"}
  ]},
  {level:7,title:"Majstor",desc:"Year 1+",items:[
    {id:"lp63",name:"Croatian Dialects",diff:3,dur:"~20 min",ck:function(s){return s.lc>=45},go:"dialects"},
    {id:"lp64",name:"Croatian Literature",diff:3,dur:"~20 min",ck:function(s){return s.lc>=45},go:"lesson",topic:"literature"},
    {id:"lp65",name:"Proverbs Deep Dive",diff:3,dur:"~20 min",ck:function(s){return s.lc>=45},go:"proverbs"},
    {id:"lp66",name:"Advanced Idioms",diff:3,dur:"~20 min",ck:function(s){return s.xp>=2000},go:"idioms"},
    {id:"lp67",name:"Abstract Language",diff:3,dur:"~20 min",ck:function(s){return s.xp>=2000},go:"lesson",topic:"philosophy"},
    {id:"lp68",name:"Media Language",diff:3,dur:"~20 min",ck:function(s){return s.xp>=2000},go:"lesson",topic:"journalism"},
    {id:"lp69",name:"Legal Croatian",diff:3,dur:"~20 min",ck:function(s){return s.xp>=2500},go:"lesson",topic:"law"},
    {id:"lp70",name:"Tongue Twisters Master",diff:3,dur:"~15 min",ck:function(s){return s.xp>=2500},go:"brzalice"}
  ]}
];
// ═══ REFLEXIVE VERBS ═══
const REFLEXIVE = {
  title:"Povratni Glagoli",
  intro:"Reflexive verbs use SE (oneself). In Croatian, SE moves around in the sentence but never starts it.",
  verbs:[
    {inf:"tuširati se",en:"to shower",forms:{ja:"tuširam se",ti:"tuširaš se",on:"tušira se",mi:"tuširamo se",vi:"tuširate se",oni:"tuširaju se"},past:{m:"tuširao sam se",f:"tuširala sam se"}},
    {inf:"obući se",en:"to get dressed",forms:{ja:"obučem se",ti:"obučeš se",on:"obuče se",mi:"obučemo se",vi:"obučete se",oni:"obuku se"},past:{m:"obukao sam se",f:"obukla sam se"}},
    {inf:"obuti se",en:"to put on shoes",forms:{ja:"obujem se",ti:"obuješ se",on:"obuje se",mi:"obujemo se",vi:"obujete se",oni:"obuju se"},past:{m:"obuo sam se",f:"obula sam se"}},
    {inf:"obrijati se",en:"to shave",forms:{ja:"obrijem se",ti:"obriješ se",on:"obrije se",mi:"obrijemo se",vi:"obrijete se",oni:"obriju se"},past:{m:"obrijao sam se",f:"obrijala sam se"}},
    {inf:"počešljati se",en:"to comb hair",forms:{ja:"počešljam se",ti:"počešljaš se",on:"počešlja se",mi:"počešljamo se",vi:"počešljate se",oni:"počešljaju se"},past:{m:"počešljao sam se",f:"počešljala sam se"}},
    {inf:"vratiti se",en:"to return",forms:{ja:"vratim se",ti:"vratiš se",on:"vrati se",mi:"vratimo se",vi:"vratite se",oni:"vrate se"},past:{m:"vratio sam se",f:"vratila sam se"}},
    {inf:"koncentrirati se",en:"to concentrate",forms:{ja:"koncentriram se",ti:"koncentriraš se",on:"koncentrira se",mi:"koncentriramo se",vi:"koncentrirate se",oni:"koncentriraju se"},past:{m:"koncentrirao sam se",f:"koncentrirala sam se"}},
    {inf:"probuditi se",en:"to wake up",forms:{ja:"probudim se",ti:"probudiš se",on:"probudi se",mi:"probudimo se",vi:"probudite se",oni:"probude se"},past:{m:"probudio sam se",f:"probudila sam se"}}
  ],
  rules:[
    {rule:"SE never opens a sentence",icon:"🚫",bad:"Se tuširam svaki dan.",good:"Tuširam se svaki dan.",note:"SE is a clitic — it must attach after the first stressed word or phrase."},
    {rule:"Present tense: SE follows the verb",icon:"✅",bad:"Ja se vraćam kući.",good:"Vraćam se kući.",note:"The subject pronoun (ja/ti/on) is usually dropped. SE attaches right after the verb."},
    {rule:"Past tense: auxiliary comes before SE",icon:"📌",bad:"Tuširali se su.",good:"Tuširali su se.",note:"Clitics stack in order: [aux] [se] — never swap them. 'Sam/si/je/smo/ste/su' always beats SE."},
    {rule:"Future tense: SE follows ću/ćeš/će...",icon:"🔮",bad:"Se tuširaću.",good:"Tuširat ću se.",note:"In future, the ću-form comes second, SE comes after: 'Tuširat ću se', 'Obući ćeš se'."},
    {rule:"Negative: NE attaches to the verb",icon:"✅",bad:"Se ne mogu koncentrirati.",good:"Ne mogu se koncentrirati.",note:"NE fuses with the verb. SE stays in its normal position after the conjugated verb. 'Ne mogu se koncentrirati' is more common in everyday speech; 'Ne se mogu koncentrirati' is also standard and found in literature."},
    {rule:"Questions work the same way",icon:"❓",bad:"Se jesi umorio?",good:"Jesi li se umorio?",note:"LI follows the auxiliary. SE stays after the auxiliary: 'Jesi li se tuširao?'"}
  ],
  tenseExamples:[
    {verb:"tuširati se",en:"to shower",
      present:{hr:"Tuširam se svako jutro.",en:"I shower every morning."},
      past:{hr:"Tuširao sam se prije treninga.",en:"I showered before training."},
      future:{hr:"Tuširat ću se poslije.",en:"I will shower afterwards."},
      negative:{hr:"Ne tuširam se hladnom vodom.",en:"I don't shower in cold water."}},
    {verb:"obući se",en:"to get dressed",
      present:{hr:"Obučem se za deset minuta.",en:"I get dressed in ten minutes."},
      past:{hr:"Obukla se i otišla.",en:"She got dressed and left."},
      future:{hr:"Obući ćeš se toplo.",en:"You will dress warmly."},
      negative:{hr:"Nije se još obukao.",en:"He hasn't gotten dressed yet."}},
    {verb:"vratiti se",en:"to return",
      present:{hr:"Vraćamo se kući u pet.",en:"We return home at five."},
      past:{hr:"Vratio sam se kasno.",en:"I returned late."},
      future:{hr:"Vratit će se sutra.",en:"He will return tomorrow."},
      negative:{hr:"Nismo se još vratili.",en:"We haven't returned yet."}},
    {verb:"probuditi se",en:"to wake up",
      present:{hr:"Probudim se u sedam.",en:"I wake up at seven."},
      past:{hr:"Probudila se rano.",en:"She woke up early."},
      future:{hr:"Probudit ćemo se zajedno.",en:"We will wake up together."},
      negative:{hr:"Nije se probudio na alarm.",en:"He didn't wake up to the alarm."}},
    {verb:"koncentrirati se",en:"to concentrate",
      present:{hr:"Ne mogu se koncentrirati.",en:"I can't concentrate."},
      past:{hr:"Koncentrirali su se na zadatak.",en:"They concentrated on the task."},
      future:{hr:"Koncentrirat ćeš se bolje.",en:"You will concentrate better."},
      negative:{hr:"Djeca se ne mogu koncentrirati.",en:"Children can't concentrate."}}
  ],
  quiz:[
    {q:"I woke up at seven.",a:"Probudio sam se u sedam.",opts:["Probudio sam se u sedam.","Probudim sam se u sedam.","Se probudio sam u sedam."]},
    {q:"She got dressed quickly.",a:"Brzo se obukla.",opts:["Brzo se obukla.","Brzo obukla se.","Se brzo obukla."]},
    {q:"We returned home.",a:"Vratili smo se kući.",opts:["Vratili smo se kući.","Se vratili smo kući.","Vratili se smo kući."]},
    {q:"He shaved this morning.",a:"Obrijao se jutros.",opts:["Obrijao se jutros.","Se obrijao jutros.","Jutros obrijao se."]},
    {q:"I can't concentrate.",a:"Ne mogu se koncentrirati.",opts:["Ne mogu se koncentrirati.","Se ne mogu koncentrirati.","Mogu se ne koncentrirati."]},
    {q:"They showered after the gym.",a:"Tuširali su se nakon teretane.",opts:["Tuširali su se nakon teretane.","Se tuširali su nakon teretane.","Tuširali će su nakon teretane."]},
    {q:"She combs her hair every morning.",a:"Počešlja se svako jutro.",opts:["Počešlja se svako jutro.","Se počešlja svako jutro.","Počešlja svako jutro se."]},
    {q:"Will you get dressed now? (ti)",a:"Obući ćeš se sada?",opts:["Obući ćeš se sada?","Se obući ćeš sada?","Obući se ćeš sada?"]},
    {q:"We will return soon.",a:"Vratit ćemo se uskoro.",opts:["Vratit ćemo se uskoro.","Se vratit ćemo uskoro.","Vratit se ćemo uskoro."]},
    {q:"Did you shower? (ti)",a:"Jesi li se tuširao?",opts:["Jesi li se tuširao?","Se jesi li tuširao?","Jesi se li tuširao?"]}
  ]
};
// ═══ SVOJ vs MOJ ═══
const SVOJMOJ = {
  title:"Svoj vs Moj",
  intro:"In Croatian, 'svoj' (reflexive possessive) always refers back to the subject of the sentence. Using 'moj/tvoj/njegov' when 'svoj' is correct sounds unnatural — native speakers notice immediately.",
  rule:"Use SVOJ when the possessor IS the subject of the sentence. Use MOJ/TVOJ/NJEGOV when referring to someone ELSE's item.",
  pairs:[
    {wrong:"Uzeo je njegov kaput.",right:"Uzeo je svoj kaput.",note:"Subject 'he' took HIS OWN coat → svoj. 'Njegov' would mean he took someone else's coat."},
    {wrong:"Ona voli njezin pas.",right:"Ona voli svojeg psa.",note:"She loves HER OWN dog → svojeg. 'Njezin' implies the dog belongs to someone else."},
    {wrong:"Idemo u naš stan.",right:"Idemo u svoj stan.",note:"We are going to OUR OWN apartment → svoj. 'Naš' could work too but 'svoj' is more natural."},
    {wrong:"Zaboravila sam moj ključ.",right:"Zaboravila sam svoj ključ.",note:"I forgot MY OWN key → svoj. 'Moj' here is technically wrong in standard Croatian."},
    {wrong:"Kupit će tvoj auto.",right:"Kupit će svoj auto.",note:"He will buy HIS OWN car → svoj. 'Tvoj' means he's buying YOUR car."},
    {wrong:"Pišeš li tvoj zadatak?",right:"Pišeš li svoj zadatak?",note:"Are you writing YOUR OWN homework? → svoj. 'Tvoj' is redundant when you're the subject."}
  ],
  forms:[
    {case:"Nominative",m:"svoj",f:"svoja",n:"svoje",pl:"svoji/svoje"},
    {case:"Genitive",m:"svojeg/svog",f:"svoje",n:"svojeg/svog",pl:"svojih"},
    {case:"Dative",m:"svojem/svom",f:"svojoj",n:"svojem/svom",pl:"svojim"},
    {case:"Accusative (animate)",m:"svojeg/svog",f:"svoju",n:"svoje",pl:"svoje/svoja"},
    {case:"Instrumental",m:"svojim",f:"svojom",n:"svojim",pl:"svojim"},
    {case:"Locative",m:"svojem/svom",f:"svojoj",n:"svojem/svom",pl:"svojim"}
  ],
  exceptions:[
    {text:"When the subject IS 'ja' and the sentence is simple present, both 'moj' and 'svoj' sound natural: 'Imam moj/svoj bicikl.'",icon:"💡"},
    {text:"In questions where the subject is unclear, 'moj/tvoj' may be used for clarity: 'Je li to tvoj ili njegov?'",icon:"💡"},
    {text:"After prepositions in set phrases: 'u svojoj koži' (in one's skin), 'biti svoj čovjek' (to be one's own person).",icon:"📌"}
  ],
  quiz:[
    {q:"She forgot _____ keys. (her own)",a:"svoje",opts:["njezine","svoje","moje"],note:"Subject 'she' → svoje"},
    {q:"He is washing _____ car. (his own)",a:"svoj",opts:["njegov","tvoj","svoj"],note:"Subject 'he' → svoj"},
    {q:"We love _____ city. (our own)",a:"svoj",opts:["naš","njihov","svoj"],note:"Subject 'we' → svoj"},
    {q:"Are you doing _____ homework? (your own)",a:"svoj",opts:["tvoj","njegov","svoj"],note:"Subject 'you' → svoj"},
    {q:"They packed _____ bags. (their own)",a:"svoje",opts:["njihove","naše","svoje"],note:"Subject 'they' → svoje"},
    {q:"I left _____ phone at home. (my own)",a:"svoj",opts:["moj","tvoj","svoj"],note:"Subject 'I' → svoj"}
  ]
};
// ═══ BASKETBALL PRACTICE ═══
// ═══ AT THE GYM ═══
// ═══ SCENE DESCRIPTION EXERCISES ═══
const SCENES = [
  {title:"U kuhinji",desc:"A family scene in the kitchen",qs:[
    {q:"Gdje su ljudi?",hint:"u",a:"kuhinji",en:"Where are the people? In the kitchen."},
    {q:"Što mama radi?",hint:"",a:"pere suđe",en:"What is mom doing? Washing dishes."},
    {q:"Što djeca rade?",hint:"",a:"igraju se",en:"What are the children doing? Playing."}
  ]},
  {title:"U parku",desc:"A sunny day at the park",qs:[
    {q:"Kakvo je vrijeme?",hint:"",a:"sunčano",en:"What's the weather like? Sunny."},
    {q:"Što dječak vozi?",hint:"",a:"bicikl",en:"What is the boy riding? A bicycle."},
    {q:"Gdje je pas?",hint:"u",a:"vodi",en:"Where is the dog? In the water."}
  ]},
  {title:"U školi",desc:"A classroom during a lesson",qs:[
    {q:"Tko stoji ispred ploče?",hint:"",a:"učiteljica",en:"Who stands in front of the board? The teacher."},
    {q:"Što djeca rade?",hint:"",a:"pišu",en:"What are the children doing? Writing."},
    {q:"Je li učionica velika ili mala?",hint:"",a:"velika",en:"Is the classroom big or small? Big."}
  ]},
  {title:"Na plaži",desc:"Summer vacation at the beach",qs:[
    {q:"Što radi djevojčica?",hint:"",a:"pliva",en:"What is the girl doing? Swimming."},
    {q:"Gdje je suncobran?",hint:"na",a:"pijesku",en:"Where is the umbrella? On the sand."},
    {q:"Je li more mirno ili nemirno?",hint:"",a:"mirno",en:"Is the sea calm or rough? Calm."}
  ]}
];
// ═══ FILL-IN STORIES ═══
const FILL_STORIES = [
  {title:"Markov dan",story:[
    {text:"Marko se probudio u _____ ujutro.",blank:"sedam",opts:["sedam","tri","ponoć"],en:"Marko woke up at seven in the morning."},
    {text:"Najprije se _____ i oprao zube.",blank:"istuširao",opts:["istuširao","najeo","zaigrao"],en:"First he showered and brushed his teeth."},
    {text:"Za doručak je pojeo _____ s džemom.",blank:"palačinke",opts:["palačinke","juhu","salatu"],en:"For breakfast he ate pancakes with jam."},
    {text:"Na posao je išao _____.",blank:"pješice",opts:["pješice","zrakoplovom","brodom"],en:"He went to work on foot."},
    {text:"Putem je kupio _____ za čitanje.",blank:"novine",opts:["novine","cipele","cvijeće"],en:"On the way he bought a newspaper to read."},
    {text:"Na poslu je primijetio da nema _____.",blank:"mobitela",opts:["mobitela","ručak","kapu"],en:"At work he noticed he didn't have his phone."}
  ]},
  {title:"Izlet na otok",story:[
    {text:"Obitelj je išla na izlet na _____ Hvar.",blank:"otok",opts:["otok","planinu","rijeku"],en:"The family went on a trip to the island of Hvar."},
    {text:"Bili su u _____.",blank:"hotelu",opts:["hotelu","šatoru","zrakoplovu"],en:"They were in a hotel."},
    {text:"Kuhar je otišao _____ u Split.",blank:"brodom",opts:["brodom","biciklom","pješice"],en:"The cook went by boat to Split."},
    {text:"Počeo je jako puhati _____.",blank:"vjetar",opts:["vjetar","snijeg","kiša"],en:"A strong wind started blowing."},
    {text:"_____ nije bio zatvoren.",blank:"Restoran",opts:["Restoran","Hotel","Otok"],en:"The restaurant was closed."},
    {text:"Tata je napravio _____ za večeru.",blank:"pizzu",opts:["pizzu","juhu","salatu"],en:"Dad made pizza for dinner."}
  ]},
  {title:"Kod zubara",story:[
    {text:"Mama je rekla djeci da moraju _____ zube.",blank:"prati",opts:["prati","bojiti","brojiti"],en:"Mom told the children they must brush their teeth."},
    {text:"Djeca su jako voljela _____ i bombone.",blank:"čokoladu",opts:["čokoladu","povrće","ribu"],en:"The children loved chocolate and candy."},
    {text:"Mama im je obećala _____.",blank:"poklon",opts:["poklon","kaznu","zadaću"],en:"Mom promised them a gift."},
    {text:"Zubar je rekao da su zubi _____.",blank:"zdravi",opts:["zdravi","bolesni","mali"],en:"The dentist said the teeth were healthy."},
    {text:"Poklon su bile nove _____ za zube.",blank:"četkice",opts:["četkice","paste","čokolade"],en:"The gift was new toothbrushes."},
    {text:"Djeca su bila jako _____.",blank:"razočarana",opts:["razočarana","sretna","umorna"],en:"The children were very disappointed."}
  ]}
,
  {title:"Dan na farmi",story:[
    {text:"Vjeverica _____ čita knjigu u parku.",blank:"ponekad",opts:["ponekad","nikad","kuha"],en:"The squirrel sometimes reads a book in the park."},
    {text:"Pas _____ trči u vrtu.",blank:"uvijek",opts:["uvijek","rijetko","spava"],en:"The dog always runs in the garden."},
    {text:"Mačka _____ spava na krevetu.",blank:"često",opts:["često","vozi","pjeva"],en:"The cat often sleeps on the bed."},
    {text:"Konj _____ trči po polju.",blank:"svaki dan",opts:["svaki dan","nikad","kuha"],en:"The horse runs through the field every day."},
    {text:"Krava _____ mlijeko.",blank:"daje",opts:["daje","pije","vozi"],en:"The cow gives milk."},
    {text:"Ptica _____ pjeva ujutro.",blank:"uvijek",opts:["uvijek","vozi","kuha"],en:"The bird always sings in the morning."}
  ]}];
// ═══ SHUFFLE HELPER ═══
const _shCache={};
function shMemo(key,arr,n){if(!_shCache[key])_shCache[key]=shuffleArr(arr);return n?_shCache[key].slice(0,n):_shCache[key]}
function shuffleArr(arr){const a=arr.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));const t=a[i];a[i]=a[j];a[j]=t}return a}
// ═══ PRONOUN CASES ═══
// ═══ GENDER & PLURALS ═══
// ═══ SENTENCE BUILDER ═══
// ═══ VERB CONJUGATION DRILL ═══
// ═══ TENSE TRANSFORMER ═══
// ═══ RIDDLES ═══
// ═══ LOGIC QUIZ (Pitalica style) ═══
// ═══ ORDINAL NUMBERS ═══
// ═══ RELATIVE PRONOUNS ═══
// ═══ EMOTION GENDER DRILL ═══
// ═══ QUESTION WORDS DRILL ═══
// ═══ NEGATION DRILL ═══
// ═══ COLOR AGREEMENT ═══
// ═══ SIBILARIZACIJA ═══
// ═══ PROFESSION GENDER PAIRS ═══
// ═══ COMPARATIVES & SUPERLATIVES ═══
// ═══ FUTURE TENSE ═══
// ═══ RESTAURANT CONVERSATION ═══
// ═══ POSSESSIVE PRONOUNS ═══
// ═══ ADJECTIVE OPPOSITES ═══
// ═══ CITY & COUNTRY LOCATIVE ═══
// ═══ ACCUSATIVE FOOD & CLOTHES ═══
// ═══ CONVERSATION MATCH ═══
let _searchIdx=null;
function buildSearchIndex(){if(_searchIdx)return _searchIdx;const idx=[];Object.keys(V).forEach(function(cat){V[cat].forEach(function(w){idx.push({hr:w[0],en:w[1],type:"vocab",go:"lesson"})})});
[{n:"School Kit",s:"school"},{n:"Texting",s:"texting"},{n:"Friends",s:"friends"},{n:"Food",s:"foodorder"},{n:"Transport",s:"transport"},{n:"Emergency",s:"emergency"},{n:"Football",s:"football"},{n:"Pop Culture",s:"popculture"},{n:"Practical Life",s:"practical"},{n:"Grocery",s:"grocery"},{n:"Recipes",s:"recipes"},{n:"Role-Play",s:"roleplay"},{n:"Map",s:"crmap"},{n:"Grammar",s:"grammar"},{n:"Cases",s:"padezi"},{n:"Padeži Master",s:"padezifull"},{n:"Aspect",s:"aspect"},{n:"Conjugation",s:"conjdrill"},{n:"Modal Verbs",s:"modal"},{n:"Declension",s:"declension"},{n:"Tenses Gender",s:"tenses"},{n:"Colors Gender",s:"boje"},{n:"Alphabet",s:"alphabet"},{n:"False Friends",s:"falsefr"},{n:"Dialects",s:"dialects"},{n:"Diminutives",s:"diminutives"},{n:"Word Formation",s:"wordform"},{n:"Tongue Twisters",s:"brzalice"},{n:"Flashcards",s:"flashcards"},{n:"Typing",s:"typing"},{n:"Idioms",s:"idioms"},{n:"Proverbs",s:"proverbs"},{n:"Leaderboard",s:"leaderboard"},{n:"Badges",s:"badges"},{n:"Domovinski Rat",s:"history"},{n:"Kings",s:"kings"},{n:"Labin Rabac",s:"region_labin"},{n:"Bibinje Zadar",s:"region_bibinje"},{n:"Hercegovina",s:"region_hercegovina"},{n:"Vukovar",s:"region_vukovar"},{n:"Vinkovci",s:"region_vinkovci"},{n:"Learning Path",s:"learnpath"},{n:"Favorites",s:"favorites"},{n:"Journal",s:"journal"},{n:"Conditional Mood",s:"conditional"},{n:"Vi ili ti? Formal",s:"formalregister"},{n:"Impersonal",s:"impersonal"},{n:"Tech & Digital",s:"techvoc"},{n:"Admin Life",s:"bureaucratic"}].forEach(function(x){idx.push({hr:x.n,en:x.n,type:"screen",go:x.s})});
GROCERY.phrases.forEach(function(p){idx.push({hr:p[0],en:p[1],type:"phrase",go:"grocery"})});SCHOOL.phrases.forEach(function(p){idx.push({hr:p[0],en:p[1],type:"phrase",go:"school"})});TRANSPORT.forEach(function(t){idx.push({hr:t.hr,en:t.en,type:"phrase",go:"transport"})});EMERGENCY.phrases.forEach(function(p){idx.push({hr:p[0],en:p[1],type:"phrase",go:"emergency"})});
// Screen name entries for discoverability
const screenEntries = [
  { hr: 'Šatrovački Slang', en: 'slang urban street language', type: 'screen', go: 'slang' },
  { hr: 'Poslovice', en: 'proverbs Croatian sayings', type: 'screen', go: 'proverbs' },
  { hr: 'Sjenovni govor', en: 'shadowing speaking practice', type: 'screen', go: 'shadowing' },
  { hr: 'Diktat', en: 'dictation listen and type', type: 'screen', go: 'dictation' },
  { hr: 'Dijalog', en: 'dialogue conversation simulation', type: 'screen', go: 'dialogue' },
  { hr: 'Dopuni rečenicu', en: 'cloze sentence fill blank grammar', type: 'screen', go: 'cloze' },
  { hr: 'Glagolski vid', en: 'aspect drill verb aspect perfective imperfective', type: 'screen', go: 'aspectdrill' },
  { hr: 'Povijest', en: 'history Croatia historical', type: 'screen', go: 'history' },
  { hr: 'Baka', en: 'baka grandmother letters stories', type: 'screen', go: 'baka_summer' },
  { hr: 'Izgovor', en: 'pronunciation contrast sounds phoneme', type: 'screen', go: 'proncontrast' },
  { hr: 'Spajanje parova', en: 'match pairs matching game', type: 'screen', go: 'match' },
  { hr: 'Naglasak', en: 'pitch accent intonation tone', type: 'screen', go: 'pitchaccent' },
  { hr: 'Interaktivna karta', en: 'interactive map Croatia regions', type: 'screen', go: 'crmap' },
  { hr: 'U kafiću', en: 'kafic cafe coffee culture', type: 'screen', go: 'kafic' },
  { hr: 'Građanski rječnik', en: 'civic vocabulary government politics EU', type: 'screen', go: 'civic' },
  { hr: 'Životni događaji', en: 'life events wedding funeral baptism', type: 'screen', go: 'lifeevents' },
  { hr: 'Ti i Vi', en: 'ti vi formal informal address', type: 'screen', go: 'tivicompare' },
  { hr: 'Dijaspora', en: 'diaspora heritage code switching', type: 'screen', go: 'diaspora' },
  { hr: 'Uskrs u Hrvatskoj', en: 'Easter Croatian traditions pisanice lamb', type: 'screen', go: 'easter' },
  { hr: 'Restoran', en: 'restaurant ordering food dining', type: 'screen', go: 'restaurant' },
  { hr: 'Prijevoz', en: 'transport bus tram travel', type: 'screen', go: 'transport' },
  { hr: 'Hitni slučajevi', en: 'emergency phrases help police hospital', type: 'screen', go: 'emergency' },
  { hr: 'Slobodno pisanje', en: 'free writing AI correction essay', type: 'screen', go: 'writing' },
  { hr: 'Konjugacija', en: 'conjugation verb forms present past', type: 'screen', go: 'conjdrill' },
  { hr: 'Padeži', en: 'cases padezi grammar nominative accusative', type: 'screen', go: 'padezi' },
];
screenEntries.forEach(e => idx.push(e));
_searchIdx=idx;return idx}
// ═══ THEME OBJECTS (background/color tokens for inline root styles) ═══
// Global CSS classes are in src/index.css (imported in main.jsx)
const BG_LIGHT=/** @type {React.CSSProperties} */({minHeight:"100vh",background:"radial-gradient(ellipse 100% 55% at 60% -10%, rgba(14,116,144,.09) 0%, transparent 60%), radial-gradient(ellipse 70% 45% at 0% 100%, rgba(212,0,48,.05) 0%, transparent 55%), radial-gradient(ellipse 60% 40% at 100% 50%, rgba(0,61,165,.04) 0%, transparent 50%), #eef2f7",color:"#1c1917",fontFamily:"'Outfit',sans-serif",position:"relative",overflowX:"hidden"});
const BG_DARK=/** @type {React.CSSProperties} */({minHeight:"100vh",background:"radial-gradient(ellipse 100% 55% at 50% -10%, rgba(14,116,144,.18) 0%, transparent 55%), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(212,0,48,.1) 0%, transparent 50%), linear-gradient(170deg,#080f1e 0%,#0d1b35 40%,#101828 70%,#0c1520 100%)",color:"#e2e8f0",fontFamily:"'Outfit',sans-serif",position:"relative",overflowX:"hidden"});
const BG=BG_LIGHT;
const H=(t,s,back)=><div style={{marginBottom:20,paddingBottom:16,borderBottom:"1px solid rgba(0,0,0,.06)"}}>
  {back&&<button onClick={back} style={{display:"flex",alignItems:"center",gap:4,background:"none",border:"none",cursor:"pointer",fontSize:13,fontWeight:700,color:"var(--subtext)",marginBottom:8,padding:"4px 0",fontFamily:"'Outfit',sans-serif"}}>‹ Back</button>}
  <h2
    style={{fontFamily:"'Playfair Display',serif",fontSize:24,color:"var(--heading)",fontWeight:800,letterSpacing:"-.02em",lineHeight:1.2}}>
    {t}
  </h2>
  {s&&<p style={{color:"var(--subtext)",fontSize:13,marginTop:5,fontWeight:500}}>
    {s}
  </p>}
</div>;
const Bar=({v,mx,color="#0e7490",h=8})=><div
  style={{background:"var(--bar-bg)",borderRadius:h/2,height:h,overflow:"hidden"}}>
  <div
    style={{width:Math.min((v/mx)*100,100)+"%",height:"100%",background:color,borderRadius:h/2,transition:"width 0.7s cubic-bezier(.4,0,.2,1)"}} />
</div>;
const Spk=({text,label})=><button
  onClick={e=>{e.stopPropagation();speak(text)}}
  style={{background:"rgba(14,116,144,.1)",border:"1px solid rgba(14,116,144,.2)",borderRadius:10,padding:"7px 12px",cursor:"pointer",color:"#0e7490",display:"inline-flex",alignItems:"center",gap:6,fontWeight:700,fontSize:14}}>
  🔊
  {label&&<span style={{fontSize:12}}>
    {label}
  </span>}
</button>;
// ═══ MAIN APP ═══
// ═══ ERROR BOUNDARY — Prevents white screen of death ═══
class ErrorBoundary extends React.Component{
  constructor(props){super(props);this.state={hasError:false,error:null}}
  static getDerivedStateFromError(error){return{hasError:true,error:error}}
  componentDidCatch(error,info){console.error("App crash caught:",error,info)}
  render(){
    if(this.state.hasError){
      return (
        <div
          style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,#fef3c7,#fff7ed)",padding:24,textAlign:"center"}}>
          <div>
            <div style={{fontSize:64,marginBottom:16}}>
              ⚠️
            </div>
            <h2
              style={{fontFamily:"'Playfair Display',serif",fontSize:24,color:"#164e63",marginBottom:8}}>
              Something went wrong
            </h2>
            <p style={{color:"#78716c",marginBottom:20,fontSize:14}}>
              The app hit an unexpected error. Your progress is saved.
            </p>
            <button
              onClick={function(){window.location.reload()}}
              style={{padding:"12px 32px",background:"linear-gradient(135deg,#0e7490,#164e63)",color:"white",border:"none",borderRadius:14,fontSize:15,fontWeight:700,cursor:"pointer"}}>
              Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children
  }
}







// ═══ CONDITIONAL MOOD ═══

// ═══ FORMAL vs INFORMAL REGISTER ═══

// ═══ IMPERSONAL CONSTRUCTIONS ═══

// ═══ TECHNOLOGY VOCABULARY ═══

// ═══ BUREAUCRATIC / ADMINISTRATIVE LANGUAGE ═══

// ─── PITCH ACCENT DATA ────────────────────────────────────────────────────

// ─── SHADOWING SENTENCES ──────────────────────────────────────────────────

// ─── EXPANDED ASPECT PAIRS ────────────────────────────────────────────────

// ─── SPACED REPETITION: GET DUE REVIEWS ──────────────────────────────────
// Delegates to the FSRS-4.5 implementation imported from ./lib/srs.js.
// getDueReviews is already imported above — this comment block keeps the
// section heading visible for orientation while reading this file.

const SEASONAL_CAMPAIGNS = [
  { id: 'easter', name: 'Uskrs u Hrvatskoj', icon: '🥚', color: '#16a34a', bg: '#f0fdf4', border: '#86efac',
    start: [3, 20], end: [4, 30], multiplier: 1.5,
    blurb: 'Learn Easter traditions — pisanice, lamb, holiday greetings',
    quests: [
      { id: 'uskrs_q1', label: 'Learn 5 Easter words', desc: 'Complete the greetings lesson', xp: 30, screen: 'lesson' },
      { id: 'uskrs_q2', label: 'Practice family vocab', desc: 'Family flashcards', xp: 25, screen: 'flashcards' },
      { id: 'uskrs_q3', label: 'Easter challenge', desc: 'Score 80%+ on any quiz', xp: 50, screen: 'mcgame' },
    ] },
  { id: 'midsummer', name: 'Ivanjdan', icon: '🔥', color: '#ea580c', bg: '#fff7ed', border: '#fed7aa',
    start: [6, 20], end: [6, 28], multiplier: 1.5,
    blurb: 'Celebrate Midsummer with bonfire traditions and Croatian folklore',
    quests: [
      { id: 'ivanjdan_q1', label: 'Learn bonfire words', desc: 'Complete the culture lesson', xp: 30, screen: 'lesson' },
      { id: 'ivanjdan_q2', label: 'Explore Croatian folklore', desc: 'Read a Croatian story', xp: 25, screen: 'readlist' },
      { id: 'ivanjdan_q3', label: 'Midsummer quiz', desc: 'Score 80%+ on any quiz', xp: 50, screen: 'mcgame' },
    ] },
  { id: 'domovina', name: 'Dan domovine', icon: '🇭🇷', color: '#b61800', bg: '#fff1f0', border: '#fca5a5',
    start: [7, 25], end: [8, 10], multiplier: 2.0,
    blurb: "Honor Croatia's liberation — learn history, heroes, and homeland pride",
    quests: [
      { id: 'domovina_q1', label: 'Learn 5 history words', desc: 'Complete the Domovinski Rat lesson', xp: 40, screen: 'history' },
      { id: 'domovina_q2', label: 'Read about Operation Storm', desc: 'Complete a history reading passage', xp: 35, screen: 'readlist' },
      { id: 'domovina_q3', label: 'Homeland pride quiz', desc: 'Score 80%+ on the history quiz', xp: 60, screen: 'mcgame' },
    ] },
  { id: 'bozic', name: 'Božić', icon: '🎄', color: '#0e7490', bg: '#f0f9ff', border: '#bae6fd',
    start: [12, 1], end: [12, 31], multiplier: 2.0,
    blurb: 'Croatian Christmas — fritule, pokloni, carols, and family traditions',
    quests: [
      { id: 'bozic_q1', label: 'Learn Christmas vocab', desc: 'Complete the greetings lesson', xp: 30, screen: 'lesson' },
      { id: 'bozic_q2', label: 'Practice holiday phrases', desc: 'Complete a speaking exercise', xp: 25, screen: 'speaking' },
      { id: 'bozic_q3', label: 'Christmas challenge', desc: 'Score 80%+ on any quiz', xp: 50, screen: 'mcgame' },
    ] },
];

function getActiveCampaign() {
  const now = new Date();
  const m = now.getMonth() + 1, d = now.getDate();
  return SEASONAL_CAMPAIGNS.find(c => {
    const [sm, sd] = c.start, [em, ed] = c.end;
    if (sm === em) return m === sm && d >= sd && d <= ed;
    if (m === sm) return d >= sd;
    if (m === em) return d <= ed;
    return m > sm && m < em;
  }) || null;
}

const LEVEL_NARRATIVE = {
  heritage: ['First Words', 'Finding Your Voice', 'Reconnecting', 'Bridging Worlds', 'Coming Home', 'Naš Čovjek', 'Naš Čovjek'],
  family:   ['Hello Family', 'Family Stories', 'Conversations', 'Deep Talks', 'Native Flow', 'Naš Čovjek', 'Naš Čovjek'],
  travel:   ['Survival Mode', 'Getting Around', "Local's Path", 'Off the Map', 'Croatian Soul', 'Naš Čovjek', 'Naš Čovjek'],
  culture:  ['First Steps', 'Culture Seeker', 'Insider', 'Deep Diver', 'Living Croatia', 'Naš Čovjek', 'Naš Čovjek'],
  fluent:   ['Beginner', 'Elementary', 'Intermediate', 'Upper-Int', 'Advanced', 'Fluent', 'Fluent'],
  partner:  ['Curious Spouse', 'Family Observer', 'Dinner Table Survivor', 'Welcome Addition', 'Part of the Family'],
};

function recordJourneyMilestone(type, meta) {
  try {
    const existing = JSON.parse(localStorage.getItem('nh_journey') || '[]');
    const allowRepeat = meta && meta.allowRepeat;
    if (!allowRepeat && existing.some(function(m) { return m.type === type; })) return;
    existing.push(Object.assign({ type, date: new Date().toISOString() }, meta || {}));
    localStorage.setItem('nh_journey', JSON.stringify(existing.slice(-200)));
  } catch (_) {}
}
function getJourneyMilestones() {
  try { return JSON.parse(localStorage.getItem('nh_journey') || '[]'); } catch (_) { return []; }
}

export { V, PADEZI, PROVERBS, HIST_FACTS, MEDIA, MAPPLACES, BADGES, DAILY_QUESTS, LEARN_PATH, REFLEXIVE, SVOJMOJ, BASKETBALL, GYM, CROATIAN_CITIES, COUNTRIES, PROFESSIONS, WEATHER, CLOTHES, BODYDESC, PHONOLOGY, SCENES, FILL_STORIES, PRONOUNCASE, GENDERDRILL, SENTBUILD, VERBDRILL, VBPERSONS, TENSEFLIP, RIDDLES, LOGICQUIZ, ORDINALS, ORDQUIZ, RELPRON, EMOGENDER, QWORDS, NEGATION, COLORAGREE, SIBIL, PROFGENDER, COMPARE, COMPQUIZ, FUTURE, RESTCONV, POSSESS, ADJOPPOSITES, CITYLOC, AKUFOOD, AKUCLOTHES, CONVMATCH, TOP100, HISTORY, EVENTS, MODAL, GRAM, PLACE, READ, ALPHA, ZNAM, BOJE, CONJ, UNJUMBLE, IDIOMS, PREPS, KINGS, LISTEN, STORIES, NUMTIME, NUMCOUNT, ASPECT, FALSEFR, VOCATIVE, PREPDRILL, DECL, BRZALICE, DIALECTS, DIMWORDS, WORDFORM, COLORQUIRK, PADEZI_FULL, SCHOOL, TEXTING, FRIENDS, FOODORDER, TRANSPORT, EMERGENCY, FOOTBALL, POPCULTURE, PRACTICAL, REGIONS, TENSES, GROCERY, RECIPES, ROLEPLAY, BG_LIGHT, BG_DARK, CONDITIONAL, FORMAL_REGISTER, IMPERSONAL, TECH_VOC, BUREAUCRATIC, PITCH_ACCENT, SHADOWING, ASPECT_PAIRS, SEASONAL_CAMPAIGNS, LEVEL_NARRATIVE };
export { _fbReady };
export { H, Bar, Spk };
export { initFirebase, gP, sP, lP, gS, sS, cS, touchSession, isSessionExpired, isValidEmail, fbSaveProgress, fbLoadProgress, fbWatchProgress, fbToggleFavorite, fbGetIdToken, fbRegister, fbLogin, fbLogout, fbLoginGoogle, fbResetPassword, friendlyError, generateFamilyCode, getLocalFamily, saveLocalFamily, fbCreateFamily, fbJoinFamily, fbGetFamilyMembers, fbWatchFamilyMembers, fbLeaveFamily, fbLoadUserFamily, fbOnAuthStateChanged, fbDeleteAccount, loadVoices, getBestVoice, stopAudio, speakAzure, speakSynth, speak, speakSlow, speakEN, preloadAudio, sh, lvl, lXP, nXP, lXPgain, getSR, saveSR, srMark, getSRScore, getStreak, updateStreak, getStreakFreezes, earnFreeze, spendFreeze, getStreakEarnBack, applyStreakEarnBack, getProverbOfDay, getDailyChallenge, getHistFact, getCityOfDay, shMemo, shuffleArr, buildSearchIndex, getDueReviews, getMistakes, recordMistake, clearMistake, clearAllMistakes, bootstrapMistakesFromSRS, getActiveCampaign, recordJourneyMilestone, getJourneyMilestones, getCultureStats, incrementCulture };
