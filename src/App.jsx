import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from "react";
import { _fbReady, H, Bar, Spk, V, PADEZI, PROVERBS, HIST_FACTS, MEDIA, MAPPLACES, BADGES, LEARN_PATH, REFLEXIVE, SCENES, FILL_STORIES, PRONOUNCASE, GENDERDRILL, SENTBUILD, VERBDRILL, VBPERSONS, TENSEFLIP, RIDDLES, LOGICQUIZ, ORDINALS, ORDQUIZ, RELPRON, EMOGENDER, QWORDS, NEGATION, COLORAGREE, SIBIL, PROFGENDER, COMPARE, COMPQUIZ, FUTURE, RESTCONV, POSSESS, ADJOPPOSITES, CITYLOC, AKUFOOD, AKUCLOTHES, CONVMATCH, TOP100, HISTORY, EVENTS, MODAL, GRAM, PLACE, READ, ALPHA, ZNAM, BOJE, CONJ, UNJUMBLE, IDIOMS, PREPS, KINGS, LISTEN, STORIES, NUMTIME, ASPECT, FALSEFR, PREPDRILL, DECL, BRZALICE, DIALECTS, DIMWORDS, WORDFORM, COLORQUIRK, PADEZI_FULL, SCHOOL, TEXTING, FRIENDS, FOODORDER, TRANSPORT, EMERGENCY, FOOTBALL, POPCULTURE, PRACTICAL, REGIONS, TENSES, GROCERY, RECIPES, ROLEPLAY, CSS, BG_LIGHT, BG_DARK, initFirebase, hp, gA, sA, gP, sP, gS, sS, cS, touchSession, isSessionExpired, isValidEmail, fbSaveProgress, fbLoadProgress, fbRegister, fbLogin, fbLogout, fbResetPassword, friendlyError, generateFamilyCode, getLocalFamily, saveLocalFamily, fbCreateFamily, fbJoinFamily, fbGetFamilyMembers, fbLeaveFamily, fbLoadUserFamily, fbGetLeaderboard, fbOnAuthStateChanged, fbSetUserSecurity, fbGetUserSecurity, fbCreateAccount, loadVoices, getBestVoice, stopAudio, speakAzure, speakGoogle, speakSynth, speak, speakSlow, speakEN, sh, lvl, lXP, nXP, getSR, saveSR, srMark, getStreak, updateStreak, getProverbOfDay, getDailyChallenge, getHistFact, shMemo, shuffleArr, buildSearchIndex } from "./data.jsx";
// Always-needed: auth + core UI (eager)
import LoginScreen from "./components/auth/LoginScreen.jsx";
import ResetPassword from "./components/auth/ResetPassword.jsx";
import XPPopup from "./components/shared/XPPopup.jsx";
import BadgeToast from "./components/shared/BadgeToast.jsx";
import TabBar from "./components/shared/TabBar.jsx";
import WelcomeScreen from "./components/home/WelcomeScreen.jsx";
import PlacementTest from "./components/home/PlacementTest.jsx";
// Tabs + screens — lazy-loaded on first use
const HomeTab = lazy(() => import("./components/home/HomeTab.jsx"));
const LearnTab = lazy(() => import("./components/learn/LearnTab.jsx"));
const CroatiaTab = lazy(() => import("./components/croatia/CroatiaTab.jsx"));
const ImmersionHub = lazy(() => import("./components/croatia/ImmersionHub.jsx"));
const AIConversation = lazy(() => import("./components/croatia/AIConversation.jsx"));
const ProfileTab = lazy(() => import("./components/profile/ProfileTab.jsx"));
const PracticeTab = lazy(() => import("./components/practice/PracticeTab.jsx"));
const LessonScreen = lazy(() => import("./components/learn/LessonScreen.jsx"));
const GrammarScreen = lazy(() => import("./components/learn/GrammarScreen.jsx"));
const AlphabetScreen = lazy(() => import("./components/learn/AlphabetScreen.jsx"));
const ReadingList = lazy(() => import("./components/learn/ReadingList.jsx"));
const ReadingScreen = lazy(() => import("./components/learn/ReadingScreen.jsx"));
const BadgesScreen = lazy(() => import("./components/profile/BadgesScreen.jsx"));
const ProfileScreen = lazy(() => import("./components/profile/ProfileScreen.jsx"));
const VocabJournal = lazy(() => import("./components/profile/VocabJournal.jsx"));
const FavoritesScreen = lazy(() => import("./components/profile/FavoritesScreen.jsx"));
const LearnPath = lazy(() => import("./components/profile/LearnPath.jsx"));
const ProverbsScreen = lazy(() => import("./components/croatia/ProverbsScreen.jsx"));
const Flashcards = lazy(() => import("./components/practice/Flashcards.jsx"));
const ListeningScreen = lazy(() => import("./components/practice/ListeningScreen.jsx"));
const McGame = lazy(() => import("./components/practice/McGame.jsx"));
const IdiomsScreen = lazy(() => import("./components/croatia/IdiomsScreen.jsx"));
const PrivacyScreen = lazy(() => import("./components/shared/PrivacyScreen.jsx"));
const TextingScreen = lazy(() => import("./components/croatia/CroatiaCulture.jsx").then(m => ({default: m.TextingScreen})));
const FriendsScreen = lazy(() => import("./components/croatia/CroatiaCulture.jsx").then(m => ({default: m.FriendsScreen})));
const FoodOrderScreen = lazy(() => import("./components/croatia/CroatiaCulture.jsx").then(m => ({default: m.FoodOrderScreen})));
const TransportScreen = lazy(() => import("./components/croatia/CroatiaCulture.jsx").then(m => ({default: m.TransportScreen})));
const EmergencyScreen = lazy(() => import("./components/croatia/CroatiaCulture.jsx").then(m => ({default: m.EmergencyScreen})));
const PopCultureScreen = lazy(() => import("./components/croatia/CroatiaCulture.jsx").then(m => ({default: m.PopCultureScreen})));
const PracticalScreen = lazy(() => import("./components/croatia/CroatiaCulture.jsx").then(m => ({default: m.PracticalScreen})));
const SchoolScreen = lazy(() => import("./components/croatia/CroatiaCulture.jsx").then(m => ({default: m.SchoolScreen})));
const GroceryScreen = lazy(() => import("./components/croatia/CroatiaCulture.jsx").then(m => ({default: m.GroceryScreen})));
const CroatiaHistoryScreen = lazy(() => import("./components/croatia/CroatiaCulture.jsx").then(m => ({default: m.HistoryScreen})));
const BasketballScreen = lazy(() => import("./components/croatia/CroatiaCulture.jsx").then(m => ({default: m.BasketballScreen})));
const GymScreen = lazy(() => import("./components/croatia/CroatiaCulture.jsx").then(m => ({default: m.GymScreen})));
const HNLScreen = lazy(() => import("./components/croatia/HNLScreen.jsx"));
const CroatiaAthletes = lazy(() => import("./components/croatia/CroatiaAthletes.jsx"));
const RegionScreen = lazy(() => import("./components/croatia/RegionScreens.jsx").then(m => ({default: m.RegionScreen})));
const RoleplayScreen = lazy(() => import("./components/croatia/RegionScreens.jsx").then(m => ({default: m.RoleplayScreen})));
const RecipesScreen = lazy(() => import("./components/croatia/RegionScreens.jsx").then(m => ({default: m.RecipesScreen})));
const CityOfDayScreen = lazy(() => import("./components/croatia/RegionScreens.jsx").then(m => ({default: m.CityOfDayScreen})));
const EventsCalendar = lazy(() => import("./components/croatia/EventsTop100.jsx").then(m => ({default: m.EventsCalendar})));
const Top100Screen = lazy(() => import("./components/croatia/EventsTop100.jsx").then(m => ({default: m.Top100Screen})));
const KingsScreen = lazy(() => import("./components/croatia/KingsScreen.jsx"));
const CrMap = lazy(() => import("./components/croatia/CrMap.jsx"));
const AspectScreen = lazy(() => import("./components/learn/GrammarRef.jsx").then(m => ({default: m.AspectScreen})));
const FalseFriendsScreen = lazy(() => import("./components/learn/GrammarRef.jsx").then(m => ({default: m.FalseFriendsScreen})));
const DeclensionScreen = lazy(() => import("./components/learn/GrammarRef.jsx").then(m => ({default: m.DeclensionScreen})));
const BrzaliceScreen = lazy(() => import("./components/learn/GrammarRef.jsx").then(m => ({default: m.BrzaliceScreen})));
const DialectsScreen = lazy(() => import("./components/learn/GrammarRef.jsx").then(m => ({default: m.DialectsScreen})));
const DiminutivesScreen = lazy(() => import("./components/learn/GrammarRef.jsx").then(m => ({default: m.DiminutivesScreen})));
const WordFormScreen = lazy(() => import("./components/learn/GrammarRef.jsx").then(m => ({default: m.WordFormScreen})));
const ColorQuirkScreen = lazy(() => import("./components/learn/GrammarRef.jsx").then(m => ({default: m.ColorQuirkScreen})));
const SvojMojScreen = lazy(() => import("./components/learn/GrammarRef.jsx").then(m => ({default: m.SvojMojScreen})));
const CountriesScreen = lazy(() => import("./components/learn/VocabScreens.jsx").then(m => ({default: m.CountriesScreen})));
const ProfessionsScreen = lazy(() => import("./components/learn/VocabScreens.jsx").then(m => ({default: m.ProfessionsScreen})));
const WeatherScreen = lazy(() => import("./components/learn/VocabScreens.jsx").then(m => ({default: m.WeatherScreen})));
const ClothesScreen = lazy(() => import("./components/learn/VocabScreens.jsx").then(m => ({default: m.ClothesScreen})));
const BodyDescScreen = lazy(() => import("./components/learn/VocabScreens.jsx").then(m => ({default: m.BodyDescScreen})));
const PhonologyScreen = lazy(() => import("./components/learn/VocabScreens.jsx").then(m => ({default: m.PhonologyScreen})));
const ModalScreen = lazy(() => import("./components/learn/ModalScreen.jsx"));
const PadeziScreen = lazy(() => import("./components/learn/PadeziScreen.jsx"));
const PadezifullScreen = lazy(() => import("./components/learn/PadezifullScreen.jsx"));
const TensesScreen = lazy(() => import("./components/learn/TensesScreen.jsx"));
const ReflexiveScreen = lazy(() => import("./components/practice/exercises/Exercises1.jsx").then(m => ({default: m.ReflexiveScreen})));
const FillStoryScreen = lazy(() => import("./components/practice/exercises/Exercises1.jsx").then(m => ({default: m.FillStoryScreen})));
const ConvMatchScreen = lazy(() => import("./components/practice/exercises/Exercises1.jsx").then(m => ({default: m.ConvMatchScreen})));
const ScenesScreen = lazy(() => import("./components/practice/exercises/Exercises1.jsx").then(m => ({default: m.ScenesScreen})));
const PronounsScreen = lazy(() => import("./components/practice/exercises/Exercises1.jsx").then(m => ({default: m.PronounsScreen})));
const GenderDrillScreen = lazy(() => import("./components/practice/exercises/Exercises1.jsx").then(m => ({default: m.GenderDrillScreen})));
const SentenceBuilderScreen = lazy(() => import("./components/practice/exercises/Exercises1.jsx").then(m => ({default: m.SentenceBuilderScreen})));
const VerbDrillScreen = lazy(() => import("./components/practice/exercises/Exercises1.jsx").then(m => ({default: m.VerbDrillScreen})));
const TenseFlipScreen = lazy(() => import("./components/practice/exercises/Exercises2.jsx").then(m => ({default: m.TenseFlipScreen})));
const RiddlesScreen = lazy(() => import("./components/practice/exercises/Exercises2.jsx").then(m => ({default: m.RiddlesScreen})));
const LogicQuizScreen = lazy(() => import("./components/practice/exercises/Exercises2.jsx").then(m => ({default: m.LogicQuizScreen})));
const OrdinalsScreen = lazy(() => import("./components/practice/exercises/Exercises2.jsx").then(m => ({default: m.OrdinalsScreen})));
const RelativePronounsScreen = lazy(() => import("./components/practice/exercises/Exercises2.jsx").then(m => ({default: m.RelativePronounsScreen})));
const EmotionGenderScreen = lazy(() => import("./components/practice/exercises/Exercises2.jsx").then(m => ({default: m.EmotionGenderScreen})));
const OppositesScreen = lazy(() => import("./components/practice/exercises/Exercises2.jsx").then(m => ({default: m.OppositesScreen})));
const CityLocativeScreen = lazy(() => import("./components/practice/exercises/Exercises2.jsx").then(m => ({default: m.CityLocativeScreen})));
const AccusativeDrillScreen = lazy(() => import("./components/practice/exercises/Exercises2.jsx").then(m => ({default: m.AccusativeDrillScreen})));
const ColorAgreementScreen = lazy(() => import("./components/practice/exercises/Exercises3.jsx").then(m => ({default: m.ColorAgreementScreen})));
const PossessivesScreen = lazy(() => import("./components/practice/exercises/Exercises3.jsx").then(m => ({default: m.PossessivesScreen})));
const QuestionWordsScreen = lazy(() => import("./components/practice/exercises/Exercises3.jsx").then(m => ({default: m.QuestionWordsScreen})));
const NegationScreen = lazy(() => import("./components/practice/exercises/Exercises3.jsx").then(m => ({default: m.NegationScreen})));
const SibilarizationScreen = lazy(() => import("./components/practice/exercises/Exercises3.jsx").then(m => ({default: m.SibilarizationScreen})));
const RestaurantScreen = lazy(() => import("./components/practice/exercises/Exercises3.jsx").then(m => ({default: m.RestaurantScreen})));
const ProfessionGenderScreen = lazy(() => import("./components/practice/exercises/Exercises3.jsx").then(m => ({default: m.ProfessionGenderScreen})));
const ComparativesScreen = lazy(() => import("./components/practice/exercises/Exercises3.jsx").then(m => ({default: m.ComparativesScreen})));
const FutureTenseScreen = lazy(() => import("./components/practice/exercises/Exercises3.jsx").then(m => ({default: m.FutureTenseScreen})));
const McResult = lazy(() => import("./components/practice/McResult.jsx"));
const StoryScreens = lazy(() => import("./components/practice/StoryScreens.jsx"));
const NumTime = lazy(() => import("./components/practice/NumTime.jsx"));
const Unjumble = lazy(() => import("./components/practice/Unjumble.jsx"));
const PrepDrill = lazy(() => import("./components/practice/PrepDrill.jsx"));
const TypingScreen = lazy(() => import("./components/practice/TypingScreen.jsx"));
const ConjugationDrill = lazy(() => import("./components/practice/ConjugationDrill.jsx"));
const ZnamGame = lazy(() => import("./components/practice/ZnamGame.jsx"));
const BojeGame = lazy(() => import("./components/practice/BojeGame.jsx"));
const MatchGame = lazy(() => import("./components/practice/MatchGame.jsx"));
const WordSprint = lazy(() => import("./components/practice/WordSprint.jsx"));
const SpeakingScreen = lazy(() => import("./components/practice/SpeakingScreen.jsx"));
const Leaderboard = lazy(() => import("./components/profile/Leaderboard.jsx"));

// Module-level constants — defined once, not recreated on every render
const DS={xp:0,str:1,diff:"beginner",lc:0,pf:0,gc:0,sp:0,de:0,rc:0,al:0,mv:0,hi:0,rs:[],ct:[],badges:[]};
const ICONS={greetings:"👋",numbers:"🔢",family:"👨‍👩‍👧‍👦",food:"🍕",animals:"🐾",body:"🦴","body & face":"🦴",colors:"🎨",home:"🏠","home & rooms":"🏠",clothing:"👔",weather:"☀️","weather & seasons":"☀️",places:"📍",transport:"🚗",verbs:"💬",adjectives:"📏",time:"📅","time & calendar":"📅",months:"🗓️",directions:"🧭",emotions:"💭",professions:"💼",restaurant:"🍽️",shopping:"🛍️",travel:"✈️",health:"🏥",questions:"❓",conjunctions:"🔗",culture:"🏛️","daily routine":"🌅","in the classroom":"📖","commands at home":"🏡","fairy tales":"📜",hobbies:"🎯",zagreb:"🏙️",opposites:"🔄",comparatives:"📊",fruits:"🍎",vegetables:"🥦",sports:"⚽",holidays:"🎄",personality:"😊"};

var _appNavDepth=0;
function pushUrl(path){try{if(window.location.pathname!==path){_appNavDepth++;window.history.pushState({_ad:_appNavDepth},"",path)}}catch(e){}}

function App(){
  const[as,setAs]=useState("loading"); // auth screen
  const[au,setAu]=useState(null); // auth user
  const[em,setEm]=useState("");const[pw,setPw]=useState("");const[pc,setPc]=useState("");const[dn,setDn]=useState("");
  const[sq,setSq]=useState("");const[sa,setSa]=useState("");const[rpEm,setRpEm]=useState("");const[rpSa,setRpSa]=useState("");const[rpPw,setRpPw]=useState("");const[rpPc,setRpPc]=useState("");const[rpStep,setRpStep]=useState(1);const[rpQ,setRpQ]=useState("");
  const[ae,setAe]=useState("");const[al,setAl]=useState(false);const[sp,setSp2]=useState(false);
  const ds=DS;
  const[scr,_setScr]=useState("welcome");
  const setScr=useCallback(function(s){
    _setScr(s);
    if(s==="welcome"||s==="placement")return;
    pushUrl(s==="dashboard"?"/":`/${s}`);
  },[]);
  const[name,setName]=useState("");
  const[st,setSt]=useState(ds);
  const[pi,sPi]=useState(0);const[ps,sPs]=useState(0);const[pa,sPa]=useState(false);const[px,sPx]=useState(-1);const[pq,sPq]=useState([]);
  const[lt,sLt]=useState(null);const[li,sLi]=useState([]);const[lx,sLx]=useState(0);const[ls,sLs]=useState(0);const[lp,sLp]=useState("learn");const[la,sLa]=useState(false);const[lsl,sLsl]=useState(-1);const[qi,sQi]=useState([]);
  const[gl,sGl]=useState(null);const[gx,sGx]=useState(0);const[gp,sGp]=useState("learn");const[gs,sGs]=useState(0);const[ga,sGa]=useState(false);const[gsl,sGsl]=useState(-1);
  const[gt,sGt]=useState(null);const[gsc,sGsc]=useState(0);const[gph,sGph]=useState("play");const[mp,sMp]=useState([]);const[msl,sMsl]=useState([]);const[mm,sMm]=useState([]);
  const[mcQ,sMcQ]=useState([]);const[mcI,sMcI]=useState(0);const[mcS,sMcS]=useState(0);const[mcA,sMcA]=useState(false);const[mcSl,sMcSl]=useState(-1);
  const[rp,sRp]=useState(null);const[rph,sRph]=useState("read");const[rqi,sRqi]=useState(0);const[rsc,sRsc]=useState(0);const[ra,sRa]=useState(false);const[rsl,sRsl]=useState(-1);const[hw,sHw]=useState(null);
  const[sw,sSw]=useState(null);const[sr,sSr]=useState(null);const[sx,sSx]=useState(0);const[si,sSi]=useState([]);const[ssc,sSsc]=useState(0);
  const[m7,sM7]=useState("menu");const[m7i,sM7i]=useState(0);const[m7s,sM7s]=useState(0);const[m7a,sM7a]=useState(false);const[m7sl,sM7sl]=useState(-1);const[m7o,sM7o]=useState([]);const[m7q,sM7q]=useState([]);const[m7v,sM7v]=useState(0);
  const[znSec,sZnSec]=useState(0);const[znIdx,sZnIdx]=useState(0);const[znSc,sZnSc]=useState(0);const[znAns,sZnAns]=useState(false);const[znSel,sZnSel]=useState(-1);const[znOpts,sZnOpts]=useState([]);const[znMode,sZnMode]=useState("menu");
  const[bjMode,sBjMode]=useState("learn");const[bjIdx,sBjIdx]=useState(0);const[bjSc,sBjSc]=useState(0);const[bjAns,sBjAns]=useState(false);const[bjSel,sBjSel]=useState(-1);const[bjOpts,sBjOpts]=useState([]);const[bjQ,sBjQ]=useState([]);
  const[cjMode,sCjMode]=useState("menu");const[cjQ,sCjQ]=useState([]);const[cjI,sCjI]=useState(0);const[cjS,sCjS]=useState(0);const[cjA,sCjA]=useState(false);const[cjSl,sCjSl]=useState(-1);const[cjO,sCjO]=useState([]);
  const[czMode,sCzMode]=useState("learn");const[kgTab,sKgTab]=useState("timeline");
  const[fcPool,sFcPool]=useState([]);const[fcI,sFcI]=useState(0);const[fcFlip,sFcFlip]=useState(false);const[fcKnow,sFcKnow]=useState(0);
  const[lsQ,sLsQ]=useState([]);const[lsI,sLsI]=useState(0);const[lsS,sLsS]=useState(0);const[lsA,sLsA]=useState(false);const[lsSl,sLsSl]=useState(-1);const[lsO,sLsO]=useState([]);
  const[stSt,sStSt]=useState(null);const[stSc,sStSc]=useState(0);
  const[ntQ,sNtQ]=useState([]);const[ntI,sNtI]=useState(0);const[ntS,sNtS]=useState(0);const[ntA,sNtA]=useState(false);const[ntSl,sNtSl]=useState(-1);const[ntO,sNtO]=useState([]);const[czI,sCzI]=useState(0);const[czS,sCzS]=useState(0);const[czA,sCzA]=useState(false);const[czSl,sCzSl]=useState(-1);const[czO,sCzO]=useState([]);const[czQ,sCzQ]=useState([]);
  const[ujQ,sUjQ]=useState([]);const[ujI,sUjI]=useState(0);const[ujS,sUjS]=useState(0);const[ujIn,sUjIn]=useState("");const[ujA,sUjA]=useState(false);
  const[asQ,sAsQ]=useState([]);const[asI,sAsI]=useState(0);const[asS,sAsS]=useState(0);const[asA,sAsA]=useState(false);const[asSl,sAsSl]=useState(-1);const[asO,sAsO]=useState([]);const[asMode,sAsMode]=useState("learn");
  const[ppQ,sPpQ]=useState([]);const[ppI,sPpI]=useState(0);const[ppS,sPpS]=useState(0);const[ppA,sPpA]=useState(false);const[ppSl,sPpSl]=useState(-1);
  const[dcNoun,sDcNoun]=useState(0);const[dcMode,sDcMode]=useState("learn");const[dcI,sDcI]=useState(0);const[dcS,sDcS]=useState(0);const[dcA,sDcA]=useState(false);const[dcSl,sDcSl]=useState(-1);const[dcO,sDcO]=useState([]);const[dcQ,sDcQ]=useState([]);
  const[tyW,sTyW]=useState(null);const[tyIn,sTyIn]=useState("");const[tyI,sTyI]=useState(0);const[tyS,sTyS]=useState(0);const[tyA,sTyA]=useState(false);const[tyPool,sTyPool]=useState([]);
  const[curEx,sCurEx]=useState("");
  const[dchlA,sDchlA]=useState(function(){var n=new Date();var k=n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0');var saved=localStorage.getItem("dcDay3");if(saved){try{var p=JSON.parse(saved);if(p.day===k)return p.answered;}catch(e){}}return[false,false,false];}());const[dchlSl,sDchlSl]=useState(function(){var n=new Date();var k=n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0');var saved=localStorage.getItem("dcDay3");if(saved){try{var p=JSON.parse(saved);if(p.day===k)return p.selected;}catch(e){}}return[-1,-1,-1];}());
  const[pfTab,sPfTab]=useState("sing");const[pfGender,sPfGender]=useState("f");const[pfMode,sPfMode]=useState("learn");
  const[pfQ,sPfQ]=useState([]);const[pfI,sPfI]=useState(0);const[pfS,sPfS]=useState(0);const[pfA,sPfA]=useState(false);const[pfSl,sPfSl]=useState(-1);const[pfO,sPfO]=useState([]);const[pfCase,sPfCase]=useState("");const[pfCaseA,sPfCaseA]=useState(false);const[pfCaseSl,sPfCaseSl]=useState(-1);
  const[famData,setFamData]=useState(null);const[famMembers,setFamMembers]=useState([]);const[famLoading,setFamLoading]=useState(false);
  const[famName,setFamName]=useState("");const[famCode,setFamCode]=useState("");const[famErr,setFamErr]=useState("");const[famTab,setFamTab]=useState("main");
  const[tab,_setTab]=useState("home");
  const TAB_PATHS={home:"/",learn:"/learn",practice:"/practice",croatia:"/croatia",profile:"/profile"};
  const setTab=useCallback(function(t){_setTab(t);pushUrl(TAB_PATHS[t]||"/");},[]);
  const[tnVerb,setTnVerb]=useState(0);const[tnTense,setTnTense]=useState("present");const[tnGender,setTnGender]=useState("m");const[tnMode,setTnMode]=useState("learn");const[tnQ,setTnQ]=useState([]);const[tnI,setTnI]=useState(0);const[tnS,setTnS]=useState(0);const[tnA,setTnA]=useState(false);const[tnSl,setTnSl]=useState(-1);const[tnO,setTnO]=useState([]);
  const[mapCat,setMapCat]=useState("all");const[mapSel,setMapSel]=useState(null);
  const[rpIdx,setRpIdx]=useState(0);const[rpLine,setRpLine]=useState(0);const[rpShow,setRpShow]=useState(false);
  const[rcIdx,setRcIdx]=useState(0);const[rcServ,setRcServ]=useState(4);const[rcTimer,setRcTimer]=useState(null);const[rcTimerVal,setRcTimerVal]=useState(0);
  const[jWords,setJWords]=useState(function(){try{return JSON.parse(localStorage.getItem("uJournal")||"[]")}catch{return[]}});const[jIn,setJIn]=useState("");const[jEn,setJEn]=useState("");
  const[darkMode,setDarkMode]=useState(function(){return localStorage.getItem("darkMode")==="true"});
  const[favs,setFavs]=useState(function(){try{return JSON.parse(localStorage.getItem("uFavs")||"[]")}catch{return[]}});
  const[srchQ,setSrchQ]=useState("");const[srchR,setSrchR]=useState([]);const[srchOpen,setSrchOpen]=useState(false);
  var toggleFav=function(item){var key=item.hr||item.name;var exists=favs.some(function(f){return(f.hr||f.name)===key});var nf=exists?favs.filter(function(f){return(f.hr||f.name)!==key}):[{hr:item.hr,en:item.en,type:item.type||"custom",go:item.go}].concat(favs);setFavs(nf);localStorage.setItem("uFavs",JSON.stringify(nf))};
  var isFav=function(key){return favs.some(function(f){return(f.hr||f.name)===key})};
  var doSearch=function(q){if(!q.trim()){setSrchR([]);return}var idx=buildSearchIndex();var lq=q.toLowerCase();setSrchR(idx.filter(function(i){return(i.hr&&i.hr.toLowerCase().indexOf(lq)>=0)||(i.en&&i.en.toLowerCase().indexOf(lq)>=0)}).slice(0,15))};
  var getWeekStats=function(){var sr=getSR();var weak=Object.values(sr).filter(function(v){return v.w>v.r}).length;var strong=Object.values(sr).filter(function(v){return v.r>v.w}).length;return{lessons:st.lc,grammar:st.gc,streak:getStreak().count,weak:weak,strong:strong}};
  const[tDir,sTDir]=useState("en-hr");const[tIn,sTIn]=useState("");const[tOut,sTOut]=useState("");const[tL,sTL]=useState(false);
  const[t1k,sT1k]=useState(null);
  const[hIdx,sHIdx]=useState(0);
  const[evM,sEvM]=useState(new Date().getMonth()+1);
  const[showXP,setShowXP]=useState(false);const[xpA,setXpA]=useState(0);const[nB,setNB]=useState(null);const[sB,setSB]=useState(false);
  const _initialPath=useRef(window.location.pathname);
  useEffect(()=>{initFirebase();
    const s=gS();if(s&&s.u){if(isSessionExpired()){cS();setAs("login");setTimeout(function(){setAe("\u2705 Your session expired. Your account is safe \u2014 just sign in again.")},200);return}const a=gA();if(a[s.u]){const p=gP(s.u);setAu({u:s.u,d:a[s.u].d,e:a[s.u].e||s.u});touchSession();updateStreak();var lf=getLocalFamily();if(lf)setFamData(lf);if(p){setName(p.name||a[s.u].d);setSt(p.st||ds);_goPostAuth(p.cp||(p.st&&(p.st.xp>0||p.st.lc>0)))}else setName(a[s.u].d);setAs("app");fbLoadProgress(s.u).then(function(fp){if(!fp)return;var lp=gP(s.u);var fpXP=(fp.st&&fp.st.xp)||0;var lpXP=(lp&&lp.st&&lp.st.xp)||0;if(fpXP>=lpXP){sP(s.u,fp);setSt(fp.st||ds);if(fp.name)setName(fp.name);if(fp.sr)saveSR(fp.sr);if(fp.streak)localStorage.setItem("uStreak",JSON.stringify(fp.streak));if(fp.favs){localStorage.setItem("uFavs",JSON.stringify(fp.favs));setFavs(fp.favs);}if(fp.journal){localStorage.setItem("uJournal",JSON.stringify(fp.journal));setJWords(fp.journal);}var _dcT=new Date().toISOString().slice(0,10);if(fp.dc&&fp.dc.day===_dcT){sDchlA(fp.dc.answered||[false,false,false]);sDchlSl(fp.dc.selected||[-1,-1,-1]);localStorage.setItem("dcDay3",JSON.stringify(fp.dc));}}});}else{
      if(_fbReady){
        fbOnAuthStateChanged(function(user){
          if(user){var dn=user.displayName||user.email;var k=user.email;
            var a=gA();var ex=a[k]||{};ex.d=dn;ex.e=k;a[k]=ex;sA(a);
            fbLoadProgress(k).then(function(fp){if(fp)sP(k,fp);
              setAu({u:k,d:dn,e:k});sS({u:k});touchSession();updateStreak();
              fbLoadUserFamily(k).then(function(f){if(f)setFamData(f)});
              var p=fp||gP(k);if(p){setName(p.name||dn);setSt(p.st||ds);_goPostAuth(p.cp||(p.st&&(p.st.xp>0||p.st.lc>0)));if(p.sr)saveSR(p.sr);if(p.streak)localStorage.setItem("uStreak",JSON.stringify(p.streak));if(p.favs){localStorage.setItem("uFavs",JSON.stringify(p.favs));setFavs(p.favs);}if(p.journal){localStorage.setItem("uJournal",JSON.stringify(p.journal));setJWords(p.journal);}var _dcT2=new Date().toISOString().slice(0,10);if(p.dc&&p.dc.day===_dcT2){sDchlA(p.dc.answered||[false,false,false]);sDchlSl(p.dc.selected||[-1,-1,-1]);localStorage.setItem("dcDay3",JSON.stringify(p.dc));}}else setName(dn);
              setAs("app")})
          }else{
            // Firebase has no user — only clear session if there is no local account to fall back to
            var _s=gS();var _a=gA();
            if(_s&&_s.u&&_a[_s.u]){setAs("login")}else{cS();setAs("login")}}})
      }else{setAs("login")}}}else setAs("login")
  },[]);
  useEffect(()=>{if(au&&as==="app"){var _dcDay=new Date().toISOString().slice(0,10);sP(au.u,{name,st,cp:scr!=="welcome"&&scr!=="placement",sr:getSR(),streak:getStreak(),favs,journal:jWords,dc:{day:_dcDay,answered:dchlA,selected:dchlSl}});touchSession()}},[st,scr,name,au,as,jWords,favs,dchlA,dchlSl]);
  useEffect(()=>{if(as!=="app")return;const iv=setInterval(()=>{if(isSessionExpired()){cS();setAu(null);setSt(ds);setScr("welcome");setName("");setAs("login")}},5*60*1000);return()=>clearInterval(iv)},[as]);
  useEffect(()=>{if(as!=="app")return;const h=()=>touchSession();window.addEventListener("click",h);window.addEventListener("touchstart",h);window.addEventListener("keydown",h);return()=>{window.removeEventListener("click",h);window.removeEventListener("touchstart",h);window.removeEventListener("keydown",h)}},[as]);
  async function doReg(){
    setAe("");if(!em.trim()||!isValidEmail(em.trim())){setAe("Please enter a valid email address.");return}if(!pw||pw.length<6){setAe("Password must be at least 6 characters.");return}if(pw!==pc){setAe("Passwords do not match.");return}if(!dn.trim()){setAe("Please enter your display name.");return}
    if(!sq.trim()){setAe("Please select a security question.");return}if(!sa.trim()||sa.trim().length<2){setAe("Please enter a security answer (2+ characters).");return}
    setAl(true);try{initFirebase();const k=em.trim().toLowerCase();
    // Block re-registration of existing local account
    var existingAccts=gA();if(existingAccts[k]){setAe("An account with this email already exists. Please sign in instead.");setAl(false);return}
    if(_fbReady){var fb=await fbRegister(k,pw,dn.trim());
    // fb.err is already friendly-fied — match against friendly message substrings
    if(!fb.ok&&fb.err.indexOf("already")>=0){setAe("An account with this email already exists. Please sign in instead.");setAl(false);return}
    if(!fb.ok&&(fb.err.indexOf("least 6")>=0||fb.err.indexOf("weak")>=0)){setAe("Password is too weak. Use at least 6 characters.");setAl(false);return}
    if(!fb.ok&&fb.err.indexOf("valid email")>=0){setAe("Please enter a valid email address.");setAl(false);return}
    // Other Firebase errors (network, etc.) — fall through and create local account anyway
    if(fb.ok){try{await fbSetUserSecurity(k,sq.trim(),await hp(sa.trim().toLowerCase()))}catch(e){}}}
    const a=gA();const h=await hp(pw);const sah=await hp(sa.trim().toLowerCase());a[k]={p:h,d:dn.trim(),e:k,sq:sq.trim(),sa:sah,created:Date.now()};sA(a);
    setAu({u:k,d:dn.trim(),e:k});sS({u:k});setName(dn.trim());setSt(ds);setScr("welcome");setAs("app");setEm("");setPw("");setPc("");setDn("");setSq("");setSa("")}catch(e){setAe("Registration failed. Please try again.")}setAl(false)
  }
  async function doReset(){
    setAe("");initFirebase();
    if(rpStep===1){
      if(!rpEm.trim()||!isValidEmail(rpEm.trim())){setAe("Please enter your email address.");return}
      var k=rpEm.trim().toLowerCase();var sqFound="";var saFound="";
      var a=gA();if(a[k]&&a[k].sq){sqFound=a[k].sq;saFound=a[k].sa}
      if(!sqFound&&_fbReady){
        try{var sec=await fbGetUserSecurity(k);
        if(sec&&sec.sq){sqFound=sec.sq;saFound=sec.sa}
        else if(sec&&!sec.sq){
          var fb=await fbResetPassword(k);
          if(fb.ok){setAs("login");setTimeout(function(){setAe("\u2705 Password reset email sent! Check your inbox.")},100);return}
          else{setAe(fb.err);return}}
        }catch(e){}}
      if(!sqFound){
        if(_fbReady){var fb2=await fbResetPassword(k);
          if(fb2.ok){setAs("login");setTimeout(function(){setAe("\u2705 Password reset email sent! Check your inbox.")},100);return}}
        setAe("No account found with this email.");return}
      localStorage.setItem("_rpSaHash",saFound);localStorage.setItem("_rpEmail",k);
      setRpQ(sqFound);setRpStep(2)}
    else if(rpStep===2){
      if(!rpSa.trim()){setAe("Please enter your security answer.");return}
      var sah=await hp(rpSa.trim().toLowerCase());
      var stored=localStorage.getItem("_rpSaHash");
      if(sah!==stored){setAe("Incorrect security answer. Please try again.");return}
      setRpStep(3)}
    else if(rpStep===3){
      if(!rpPw||rpPw.length<6){setAe("New password must be at least 6 characters.");return}
      if(rpPw!==rpPc){setAe("Passwords do not match.");return}
      var k=localStorage.getItem("_rpEmail");
      var a=gA();if(a[k]){a[k].p=await hp(rpPw);sA(a)}
      if(_fbReady){
        const acct=await fbCreateAccount(k,rpPw);
        if(!acct.ok){try{await fbResetPassword(k)}catch(e2){}}
      }
      localStorage.removeItem("_rpSaHash");localStorage.removeItem("_rpEmail");
      setAe("");setRpEm("");setRpSa("");setRpPw("");setRpPc("");setRpStep(1);setRpQ("");
      setAs("login");setTimeout(function(){setAe("\u2705 Password reset! Sign in with your new password.")},100)}
  }
  async function doLog(){
    setAe("");if(!em.trim()||!isValidEmail(em.trim())){setAe("Please enter a valid email address.");return}if(!pw){setAe("Please enter your password.");return}setAl(true);
    try{
    initFirebase();const k=em.trim().toLowerCase();var fbResult=null;
    // Try Firebase first
    if(_fbReady){try{fbResult=await fbLogin(k,pw);}catch(e){fbResult=null;}}
    if(fbResult&&fbResult.ok){
      // Firebase success — log in and sync local hash for future offline use
      var fbProgress=await fbLoadProgress(k);var fdn=fbResult.user.displayName||k;
      var fa=gA();var fex=fa[k]||{};fex.d=fdn;fex.e=k;
      try{fex.p=await hp(pw);}catch(e){}  // sync hash — critical so local fallback always works
      fa[k]=fex;sA(fa);if(fbProgress)sP(k,fbProgress);
      setAu({u:k,d:fdn,e:k});sS({u:k});
      var fp=fbProgress||gP(k);if(fp){setName(fp.name||fdn);setSt(fp.st||ds);_goPostAuth(fp.cp||(fp.st&&(fp.st.xp>0||fp.st.lc>0)));if(fp.sr)saveSR(fp.sr);if(fp.streak)localStorage.setItem("uStreak",JSON.stringify(fp.streak));if(fp.favs){localStorage.setItem("uFavs",JSON.stringify(fp.favs));setFavs(fp.favs);}if(fp.journal){localStorage.setItem("uJournal",JSON.stringify(fp.journal));setJWords(fp.journal);}var _dcT3=new Date().toISOString().slice(0,10);if(fp.dc&&fp.dc.day===_dcT3){sDchlA(fp.dc.answered||[false,false,false]);sDchlSl(fp.dc.selected||[-1,-1,-1]);localStorage.setItem("dcDay3",JSON.stringify(fp.dc));}}else setName(fdn);
      setAs("app");setEm("");setPw("");fbLoadUserFamily(k).then(function(f){if(f)setFamData(f)});setAl(false);return;}
    // Hard-stop only on rate limiting
    if(fbResult&&fbResult.err&&fbResult.err.indexOf("Too many attempts")>=0){setAe(fbResult.err);setAl(false);return;}
    // Local account fallback
    var la=gA();
    if(!la[k]){setAe("No account found with this email. Please check your email or create a new account.");setAl(false);return;}
    if(la[k].p){
      var lh=await hp(pw);
      if(la[k].p===lh){
        setAu({u:k,d:la[k].d,e:k});sS({u:k});var lp=gP(k);
        if(lp){setName(lp.name||la[k].d);setSt(lp.st||ds);_goPostAuth(lp.cp||(lp.st&&(lp.st.xp>0||lp.st.lc>0)))}else setName(la[k].d);
        setAs("app");setEm("");setPw("");setAl(false);return;}
      // Account exists but password wrong — always this message, never Firebase's "no account found"
      setAe("Incorrect password. Try again or use Forgot Password.");setAl(false);return;}
    // Account record exists but has no password hash — guide to reset
    setAe("Please use 'Forgot Password' to restore access to your account.");
    }catch(e){setAe("Login failed. Please try again.")}setAl(false)
  }
  function doOut(){fbLogout();cS();setAu(null);setSt(ds);setScr("welcome");setName("");setFamData(null);setFamMembers([]);setAs("login")}
  const doTr=async()=>{
    const t=tIn.trim();if(!t)return;sTL(true);sTOut("");
    const[s,g]=tDir==="en-hr"?["en","hr"]:["hr","en"];
    try{const r=await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(t)}&langpair=${s}|${g}`);const d=await r.json();if(d.responseStatus===200&&d.responseData?.translatedText)sTOut(d.responseData.translatedText);else if(d.responseStatus===429||String(d.responseDetails||"").toLowerCase().includes("limit"))sTOut("Daily translation limit reached. Try again tomorrow or visit translate.google.com");else sTOut("Translation unavailable. Try translate.google.com")}catch(e){sTOut("Network error — check your connection.")}sTL(false)
  };
// ═══ ANTI-GAMING: XP COOLDOWN SYSTEM ═══
function canEarnXP(exerciseId){
  try{
    var cd=JSON.parse(localStorage.getItem("xpCooldown")||"{}");
    var today=new Date().toISOString().slice(0,10);
    if(cd[exerciseId]===today)return false;
    return true;
  }catch(e){return true}
}
function markExerciseDone(exerciseId){
  try{
    var cd=JSON.parse(localStorage.getItem("xpCooldown")||"{}");
    var today=new Date().toISOString().slice(0,10);
    cd[exerciseId]=today;
    var clean={};
    for(var k in cd){if(cd[k]===today)clean[k]=cd[k]}
    localStorage.setItem("xpCooldown",JSON.stringify(clean));
  }catch(e){}
}
  // ═══ BROWSER BACK BUTTON SUPPORT (popstate) ═══
  useEffect(function(){
    // Mark baseline so we can detect when back would exit the app
    window.history.replaceState({_ad:0},"",window.location.pathname);
    var tabByPath={"/":"home","/learn":"learn","/practice":"practice","/croatia":"croatia","/profile":"profile"};
    // Maps every screen name to its parent tab so nav bar stays in sync
    var screenTab={
      lesson:"learn",grammar:"learn",padezi:"learn",padezifull:"learn",modal:"learn",tenses:"learn",
      alphabet:"learn",reading:"learn",read:"learn",readinglist:"learn",readlist:"learn",aspect:"learn",falsefr:"learn",
      declension:"learn",brzalice:"learn",dialects:"learn",diminutives:"learn",wordform:"learn",colorquirk:"learn",svojmoj:"learn",
      countries:"learn",professions:"learn",weather:"learn",clothes:"learn",bodydesc:"learn",phonology:"learn",
      mcgame:"practice",mcresult:"practice",flashcards:"practice",match:"practice",typing:"practice",
      listening:"practice",speaking:"practice",znam:"practice",boje:"practice",conj:"practice",conjdrill:"practice",
      unjumble:"practice",prepdrill:"practice",numtime:"practice",wordsprint:"practice",
      profgender:"practice",comparatives:"practice",future:"practice",sibil:"practice",restaurant:"practice",
      qwords:"practice",negation:"practice",possess:"practice",coloragree:"practice",opposites:"practice",
      cityloc:"practice",akudrill:"practice",ordinals:"practice",relpron:"practice",emogender:"practice",
      verbdrill:"practice",tenseflip:"practice",riddles:"practice",logicquiz:"practice",pronouns:"practice",
      genderdrill:"practice",sentbuild:"practice",reflexive:"practice",fillstory:"practice",
      convmatch:"practice",scenes:"practice",storyselect:"practice",story:"practice",
      proverbs:"practice",idioms:"practice",
      region_labin:"croatia",region_bibinje:"croatia",region_hercegovina:"croatia",
      region_vukovar:"croatia",region_vinkovci:"croatia",region_zagreb:"croatia",
      region_split:"croatia",region_mostar:"croatia",region_tomislavgrad:"croatia",region_knin:"croatia",
      cityofday:"croatia",immersion:"croatia",aiconvo:"croatia",crmap:"croatia",
      history:"croatia",kings:"croatia",grocery:"croatia",recipes:"croatia",roleplay:"croatia",
      texting:"croatia",friends:"croatia",foodorder:"croatia",transport:"croatia",emergency:"croatia",
      football:"croatia",popculture:"croatia",practical:"croatia",school:"croatia",basketball:"croatia",gym:"croatia",
      top100:"croatia",events:"croatia",croatiaathletes:"croatia",
      badges:"profile",leaderboard:"profile",journal:"profile",favorites:"profile",learnpath:"profile",
    };
    function onPopState(e){
      var p=window.location.pathname;
      // Tab-root paths → restore dashboard + correct tab
      if(tabByPath[p]!==undefined){_setScr("dashboard");_setTab(tabByPath[p]);return;}
      var s=p.slice(1);
      // Unknown or auth paths → safe fallback to home dashboard
      if(!s||s==="welcome"||s==="placement"){_setScr("dashboard");_setTab("home");window.history.replaceState({_ad:0},"","/");return;}
      // Restore screen + sync nav tab
      _setScr(s);
      if(screenTab[s])_setTab(screenTab[s]);
    }
    window.addEventListener("popstate",onPopState);
    return function(){window.removeEventListener("popstate",onPopState)};
  },[]);// eslint-disable-line
  const award=useCallback((amt)=>{
    if(curEx&&!canEarnXP(curEx)){setXpA(0);setShowXP(true);setTimeout(()=>setShowXP(false),2000);return}
    setXpA(amt);setShowXP(true);
    setSt(s=>{const n={...s,xp:s.xp+amt};const nb=BADGES.filter(b=>!s.badges.includes(b.id)&&b.r(n));if(nb.length){n.badges=[...s.badges,...nb.map(b=>b.id)];setTimeout(()=>{setNB(nb[0]);setSB(true);setTimeout(()=>setSB(false),3000)},600)}return n});
    setTimeout(()=>setShowXP(false),1500)
  },[curEx]);
  function _goPostAuth(hasProgress){
    if(!hasProgress){setScr("welcome");return}
    const ip=_initialPath.current;
    _initialPath.current='/';
    const tabByPath={'/learn':'learn','/practice':'practice','/croatia':'croatia','/profile':'profile'};
    if(tabByPath[ip]){_setTab(tabByPath[ip]);_setScr("dashboard");return}
    setScr("dashboard");
  }
  function goBack(){
    if(curEx)markExerciseDone(curEx);
    sCurEx("");
    // Only use browser back if we have an in-app history entry to return to.
    // history.state._ad === 0 means we're at the app baseline — going back
    // would exit the SPA entirely. Instead, fall back to the home dashboard.
    var depth=(window.history.state&&window.history.state._ad)||0;
    if(depth>0){window.history.back();}
    else{_setScr("dashboard");_setTab("home");window.history.replaceState({_ad:0},"","/");}
  }
  const level=lvl(st.xp);
  const allCats=Object.keys(V);
  const icons=ICONS;
  // ═══ AUTH SCREENS ═══
  if(as==="loading")return (
    <div
      className={darkMode?"dark":""}
      style={{...(darkMode?BG_DARK:BG_LIGHT),display:"flex",alignItems:"center",justifyContent:"center"}}>
      <style>
        {CSS}
      </style>
      <div style={{textAlign:"center",animation:"rise .6s"}}>
        <div style={{fontSize:64,animation:"boat 3s ease-in-out infinite"}}>
          ⛵
        </div>
        <p style={{color:"var(--subtext)",marginTop:16,fontWeight:600}}>
          Loading...
        </p>
      </div>
    </div>
  );
  if(as==="login"||as==="register"){
    return <LoginScreen as={as} ae={ae} al={al} em={em} pw={pw} pc={pc} dn={dn} sp={sp} sq={sq} sa={sa} setAs={setAs} setAe={setAe} setEm={setEm} setPw={setPw} setPc={setPc} setDn={setDn} setSp2={setSp2} setSq={setSq} setSa={setSa} setRpEm={setRpEm} setRpSa={setRpSa} setRpPw={setRpPw} setRpPc={setRpPc} setRpStep={setRpStep} setRpQ={setRpQ} doLog={doLog} doReg={doReg} />;
  }
  // ═══ RESET PASSWORD SCREEN ═══
  if(as==="reset"){
    return <ResetPassword ae={ae} rpEm={rpEm} rpSa={rpSa} rpPw={rpPw} rpPc={rpPc} rpStep={rpStep} rpQ={rpQ} setAs={setAs} setAe={setAe} setRpEm={setRpEm} setRpSa={setRpSa} setRpPw={setRpPw} setRpPc={setRpPc} setRpStep={setRpStep} setRpQ={setRpQ} doReset={doReset} />;
  }
    // ═══ MAIN APP RENDER ═══
  return (
    <div className={darkMode?"dark":""} style={darkMode?BG_DARK:BG_LIGHT}>
      <style>
        {CSS}
      </style>
      <Suspense fallback={<div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"50vh"}}><div style={{textAlign:"center"}}><div style={{fontSize:40,animation:"boat 2s ease-in-out infinite"}}>⛵</div><p style={{color:"var(--subtext)",marginTop:8,fontSize:14,fontWeight:600}}>Loading...</p></div></div>}>
      <XPPopup showXP={showXP} xpA={xpA} />
      <BadgeToast show={sB} badge={nB} />
      {scr==="welcome" && <WelcomeScreen name={name} au={au} st={st} setScr={setScr} setName={setName} sPq={sPq} sPi={sPi} sPs={sPs} sPa={sPa} sPx={sPx} />}
      {scr==="placement" && <PlacementTest pq={pq} pi={pi} ps={ps} pa={pa} px={px} sPi={sPi} sPs={sPs} sPa={sPa} sPx={sPx} setScr={setScr} setSt={setSt} />}
      {// ═══ DASHBOARD ═══
      scr==="dashboard"&&<div className="dash" id="main-content" role="main">
        <div style={{position:"relative",marginBottom:20}}>
          <div style={{position:"relative"}} role="search">
            <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:16,pointerEvents:"none",opacity:.4}} aria-hidden="true">🔍</span>
            <input
              type="search"
              id="app-search"
              value={srchQ}
              onChange={function(e){setSrchQ(e.target.value);doSearch(e.target.value);setSrchOpen(true)}}
              onFocus={function(){if(srchQ)setSrchOpen(true)}}
              onKeyDown={function(e){if(e.key==="Escape"){setSrchOpen(false);setSrchQ("")}}}
              placeholder="Search words, phrases, screens…"
              aria-label="Search vocabulary, phrases, and screens"
              aria-expanded={srchOpen&&srchQ.length>0}
              aria-controls="search-results"
              aria-autocomplete="list"
              autoComplete="off"
              style={{width:"100%",padding:"12px 16px 12px 44px",fontSize:14,borderRadius:14,boxShadow:"0 1px 3px rgba(0,0,0,.05)"}} />
          </div>
          {srchOpen&&srchQ&&srchR.length===0&&(
            <div style={{position:"absolute",top:"calc(100% + 6px)",left:0,right:0,background:"var(--card)",borderRadius:16,
              boxShadow:"0 12px 40px rgba(0,0,0,.14)",zIndex:100,border:"1.5px solid var(--card-b)",
              padding:"20px 16px",textAlign:"center"}}>
              <div style={{fontSize:32,marginBottom:8}}>🔍</div>
              <div style={{fontSize:14,color:"var(--subtext)",fontWeight:600}}>No results for "{srchQ}"</div>
            </div>
          )}
          {srchOpen&&srchR.length>0&&<div
            id="search-results"
            role="listbox"
            aria-label="Search results"
            style={{position:"absolute",top:"calc(100% + 6px)",left:0,right:0,background:"var(--card)",borderRadius:16,
              boxShadow:"0 12px 40px rgba(0,0,0,.14)",zIndex:100,maxHeight:320,overflow:"auto",
              border:"1.5px solid var(--card-b)"}}>
            {srchR.map(function(r,i){return (
              <div
                key={i}
                className="sr-item"
                role="option"
                onClick={function(){setSrchOpen(false);setSrchQ("");setScr(r.go)}}>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:"var(--heading)"}}>{r.hr}</div>
                  <div style={{fontSize:12,color:"var(--subtext)",marginTop:1}}>{r.en}</div>
                </div>
                <span style={{fontSize:10,padding:"3px 9px",borderRadius:20,fontWeight:700,
                  background:r.type==="vocab"?"#dbeafe":r.type==="screen"?"#dcfce7":"#fef9c3",
                  color:r.type==="vocab"?"#1d4ed8":r.type==="screen"?"#166534":"#a16207"}}>
                  {r.type}
                </span>
              </div>
            );})}
            <div className="sr-close" onClick={function(){setSrchOpen(false)}}>
              Close
            </div>
          </div>}
        </div>
        {// ═══ TAB: HOME ═══
        tab==="home"&&<HomeTab
          name={name} level={level} st={st}
          tDir={tDir} sTDir={sTDir} tIn={tIn} sTIn={sTIn} tOut={tOut} tL={tL} doTr={doTr}
          dchlA={dchlA} sDchlA={sDchlA} dchlSl={dchlSl} sDchlSl={sDchlSl}
          getWeekStats={getWeekStats}
          award={award}
          setTab={setTab} setScr={setScr} sCurEx={sCurEx}
          allCats={allCats} sh={sh}
          sMcQ={sMcQ} sMcI={sMcI} sMcS={sMcS} sMcA={sMcA} sMcSl={sMcSl}
          sFcPool={sFcPool} sFcI={sFcI} sFcFlip={sFcFlip} sFcKnow={sFcKnow}
        />}
        {// ═══ TAB: LEARN ═══
        tab==="learn"&&<LearnTab
          allCats={allCats} icons={icons} setScr={setScr} sCurEx={sCurEx}
          sh={sh} sLt={sLt} sLi={sLi} sLx={sLx} sLs={sLs} sLp={sLp} sLa={sLa} sLsl={sLsl}
          setTnVerb={setTnVerb} setTnTense={setTnTense} setTnGender={setTnGender} setTnMode={setTnMode}
          sCzMode={sCzMode} sPfTab={sPfTab} sPfGender={sPfGender} sPfMode={sPfMode}
          sDcMode={sDcMode} sAsMode={sAsMode} sCjMode={sCjMode} sM7={sM7} sBjMode={sBjMode}
          sGl={sGl} sGp={sGp} sGx={sGx} sGs={sGs} sGa={sGa} sGsl={sGsl}
        />}
        {// ═══ TAB: PRACTICE ═══
        tab==="practice"&&<PracticeTab
          allCats={allCats} sh={sh} setScr={setScr} sCurEx={sCurEx}
          sMcQ={sMcQ} sMcI={sMcI} sMcS={sMcS} sMcA={sMcA} sMcSl={sMcSl}
          sFcPool={sFcPool} sFcI={sFcI} sFcFlip={sFcFlip} sFcKnow={sFcKnow}
          sMp={sMp} sMsl={sMsl} sMm={sMm} sGsc={sGsc} sGph={sGph}
          sTyPool={sTyPool} sTyI={sTyI} sTyS={sTyS} sTyIn={sTyIn} sTyA={sTyA} sTyW={sTyW}
          sLsQ={sLsQ} sLsI={sLsI} sLsS={sLsS} sLsA={sLsA} sLsSl={sLsSl} sLsO={sLsO}
          sSi={sSi} sSx={sSx} sSw={sSw} sSr={sSr} sSsc={sSsc}
          sZnMode={sZnMode}
          sUjQ={sUjQ} sUjI={sUjI} sUjS={sUjS} sUjIn={sUjIn} sUjA={sUjA}
          sPpQ={sPpQ} sPpI={sPpI} sPpS={sPpS} sPpA={sPpA} sPpSl={sPpSl}
          sNtQ={sNtQ} sNtI={sNtI} sNtS={sNtS} sNtA={sNtA} sNtSl={sNtSl} sNtO={sNtO}
          sEvM={sEvM}
        />}
        {// ═══ TAB: CROATIA ═══
        tab==="croatia"&&<CroatiaTab
          setScr={setScr} sHIdx={sHIdx} sKgTab={sKgTab} sCurEx={sCurEx}
          setRcIdx={setRcIdx} setRcServ={setRcServ}
          setRpIdx={setRpIdx} setRpLine={setRpLine} setRpShow={setRpShow}
          setMapCat={setMapCat} setMapSel={setMapSel}
        />}
        {// ═══ TAB: PROFILE ═══
        tab==="profile"&&<ProfileTab
          name={name} au={au} level={level} st={st} favs={favs}
          darkMode={darkMode} setDarkMode={setDarkMode}
          setScr={setScr} doOut={doOut}
        />}
      </div>}
      {// ═══ MODAL VERBS ═══
      scr==="modal"&&<ModalScreen goBack={goBack} award={award} setSt={setSt} />}
      {// ═══ HISTORY ═══
      scr==="history"&&<CroatiaHistoryScreen goBack={goBack} />}
      {// ═══ EVENTS CALENDAR ═══
      scr==="events"&&<EventsCalendar goBack={goBack} />}
      {// ═══ TRANSLATOR ═══
      scr==="top100"&&<Top100Screen goBack={goBack} />}
      {// ═══ MULTIPLE CHOICE GAME ═══
      scr==="mcgame"&&<McGame
        mcQ={mcQ} mcI={mcI} mcS={mcS} mcA={mcA} mcSl={mcSl}
        sMcI={sMcI} sMcS={sMcS} sMcA={sMcA} sMcSl={sMcSl}
        setScr={setScr} goBack={goBack} award={award}
      />}
      {scr==="mcresult"&&<McResult mcQ={mcQ} mcS={mcS} setScr={setScr} goBack={goBack} award={award} sMcQ={sMcQ} sMcI={sMcI} sMcS={sMcS} sMcA={sMcA} sMcSl={sMcSl} />}
      {// ═══ CROATIAN CASES ═══
      scr==="padezi"&&<PadeziScreen goBack={goBack} award={award} setSt={setSt} />}
      {// ═══ UNJUMBLE / WORD ORDER ═══
      scr==="unjumble"&&<Unjumble goBack={goBack} award={award} />}
      {// ═══ IDIOMS & SLANG ═══
      scr==="idioms"&&<IdiomsScreen goBack={goBack} />}
      {scr==="privacy"&&<PrivacyScreen goBack={goBack} />}
      {// ═══ FLASHCARDS ═══
      scr==="flashcards"&&<Flashcards
        fcPool={fcPool} fcI={fcI} fcFlip={fcFlip} fcKnow={fcKnow}
        sFcFlip={sFcFlip} sFcI={sFcI} sFcKnow={sFcKnow}
        goBack={goBack} award={award}
      />}
      {// ═══ LISTENING COMPREHENSION ═══
      scr==="listening"&&<ListeningScreen
        lsQ={lsQ} lsI={lsI} lsS={lsS} lsA={lsA} lsSl={lsSl} lsO={lsO}
        sLsQ={sLsQ} sLsI={sLsI} sLsS={sLsS} sLsA={sLsA} sLsSl={sLsSl} sLsO={sLsO}
        goBack={goBack} award={award} sh={sh}
      />}
      {// ═══ STORY SELECT ═══
      scr==="storyselect"&&<StoryScreens goBack={goBack} award={award} sCurEx={sCurEx} />}
      {// ═══ NUMBER & TIME DRILLS ═══
      scr==="numtime"&&<NumTime goBack={goBack} award={award} />}
      {// ═══ ALL PROVERBS ═══
      scr==="proverbs"&&<ProverbsScreen goBack={goBack} />}
      {// ═══ LEADERBOARD ═══
      scr==="leaderboard"&&<Leaderboard goBack={goBack} au={au} name={name} famData={famData} setFamData={setFamData} famMembers={famMembers} setFamMembers={setFamMembers} famLoading={famLoading} setFamLoading={setFamLoading} famName={famName} setFamName={setFamName} famCode={famCode} setFamCode={setFamCode} famErr={famErr} setFamErr={setFamErr} famTab={famTab} setFamTab={setFamTab} />}
      {// ═══ SCHOOL KIT ═══
      scr==="school"&&<SchoolScreen goBack={goBack} />}
      {scr==="texting"&&<TextingScreen goBack={goBack} />}
      {scr==="friends"&&<FriendsScreen goBack={goBack} />}
      {scr==="foodorder"&&<FoodOrderScreen goBack={goBack} />}
      {scr==="transport"&&<TransportScreen goBack={goBack} />}
      {scr==="emergency"&&<EmergencyScreen goBack={goBack} />}
      {scr==="football"&&<HNLScreen goBack={goBack} />}
      {scr==="croatiaathletes"&&<CroatiaAthletes goBack={goBack} />}
      {scr==="immersion"&&<ImmersionHub goBack={goBack} setScr={setScr} />}
      {scr==="aiconvo"&&<AIConversation goBack={goBack} setScr={setScr} sCurEx={sCurEx} />}
      {scr==="popculture"&&<PopCultureScreen goBack={goBack} />}
      {scr==="basketball"&&<BasketballScreen goBack={goBack} />}
      {scr==="gym"&&<GymScreen goBack={goBack} />}
      {scr==="practical"&&<PracticalScreen goBack={goBack} />}
      {scr==="region_labin"&&<RegionScreen regionKey="labin" goBack={goBack} />}
      {scr==="region_bibinje"&&<RegionScreen regionKey="bibinje" goBack={goBack} />}
      {scr==="region_hercegovina"&&<RegionScreen regionKey="hercegovina" goBack={goBack} />}
      {scr==="region_vukovar"&&<RegionScreen regionKey="vukovar" goBack={goBack} />}
      {scr==="region_zagreb"&&<RegionScreen regionKey="zagreb" goBack={goBack} />}
      {scr==="region_split"&&<RegionScreen regionKey="split" goBack={goBack} />}
      {scr==="region_mostar"&&<RegionScreen regionKey="mostar" goBack={goBack} />}
      {scr==="region_tomislavgrad"&&<RegionScreen regionKey="tomislavgrad" goBack={goBack} />}
      {scr==="region_knin"&&<RegionScreen regionKey="knin" goBack={goBack} />}
      {scr==="cityofday"&&<CityOfDayScreen goBack={goBack} />}
      {scr==="region_vinkovci"&&<RegionScreen regionKey="vinkovci" goBack={goBack} />}
      {// ═══ PADEŽI FULL (SINGULAR & PLURAL) ═══
      scr==="padezifull"&&<PadezifullScreen goBack={goBack} award={award} />}
      {// ═══ VERB ASPECT ═══
      scr==="aspect"&&<AspectScreen goBack={goBack} />}
      {// ═══ FALSE FRIENDS ═══
      scr==="falsefr"&&<FalseFriendsScreen goBack={goBack} />}
      {// ═══ PREPOSITION DRILLS ═══
      scr==="prepdrill"&&<PrepDrill goBack={goBack} award={award} />}
      {// ═══ DECLENSION TRAINER ═══
      scr==="declension"&&<DeclensionScreen goBack={goBack} />}
      {// ═══ TONGUE TWISTERS ═══
      scr==="brzalice"&&<BrzaliceScreen goBack={goBack} />}
      {// ═══ DIALECTS ═══
      scr==="dialects"&&<DialectsScreen goBack={goBack} />}
      {// ═══ DIMINUTIVES ═══
      scr==="diminutives"&&<DiminutivesScreen goBack={goBack} />}
      {// ═══ WORD FORMATION ═══
      scr==="wordform"&&<WordFormScreen goBack={goBack} />}
      {// ═══ COLOR QUIRKS ═══
      scr==="colorquirk"&&<ColorQuirkScreen goBack={goBack} />}
      {scr==="svojmoj"&&<SvojMojScreen goBack={goBack} award={award} />}
      {scr==="countries"&&<CountriesScreen goBack={goBack} />}
      {scr==="professions"&&<ProfessionsScreen goBack={goBack} />}
      {scr==="weather"&&<WeatherScreen goBack={goBack} />}
      {scr==="clothes"&&<ClothesScreen goBack={goBack} />}
      {scr==="bodydesc"&&<BodyDescScreen goBack={goBack} />}
      {scr==="phonology"&&<PhonologyScreen goBack={goBack} />}
      {// ═══ TYPING PRACTICE ═══
      scr==="typing"&&<TypingScreen goBack={goBack} award={award} />}
      {// ═══ TENSES & GENDER CONJUGATION ═══
      scr==="tenses"&&<TensesScreen goBack={goBack} award={award} />}
      {// ═══ INTERACTIVE MAP ═══
      scr==="crmap"&&<CrMap goBack={goBack} />}
      {// ═══ GROCERY SHOPPING ═══
      scr==="grocery"&&<GroceryScreen goBack={goBack} />}
      {// ═══ RECIPES ═══
      scr==="recipes"&&<RecipesScreen goBack={goBack} />}
      {// ═══ CONVERSATION ROLE-PLAY ═══
      scr==="roleplay"&&<RoleplayScreen goBack={goBack} />}
      {// ═══ VOCABULARY JOURNAL ═══
      scr==="journal"&&<VocabJournal
        jWords={jWords} setJWords={setJWords} jIn={jIn} setJIn={setJIn}
        jEn={jEn} setJEn={setJEn} goBack={goBack}
      />}
      {// ═══ LEARNING PATH ═══
      scr==="learnpath"&&<LearnPath st={st} setScr={setScr} goBack={goBack} />}
      {// ═══ FAVORITES ═══
      scr==="favorites"&&<FavoritesScreen
        favs={favs} toggleFav={toggleFav} setScr={setScr} goBack={goBack}
      />}
      {// ═══ REFLEXIVE VERBS ═══
      scr==="reflexive"&&<ReflexiveScreen goBack={goBack} award={award} />}
      {// ═══ FILL-IN STORIES ═══
      scr==="fillstory"&&<FillStoryScreen goBack={goBack} award={award} />}
      {// ═══ CONVERSATION MATCH ═══
      scr==="convmatch"&&<ConvMatchScreen goBack={goBack} award={award} />}
      {// ═══ SCENE DESCRIPTION ═══
      scr==="scenes"&&<ScenesScreen goBack={goBack} />}
      {// ═══ PRONOUN CASES ═══
      scr==="pronouns"&&<PronounsScreen goBack={goBack} award={award} />}
      {// ═══ GENDER & PLURALS ═══
      scr==="genderdrill"&&<GenderDrillScreen goBack={goBack} award={award} />}
      {// ═══ SENTENCE BUILDER ═══
      scr==="sentbuild"&&<SentenceBuilderScreen goBack={goBack} award={award} />}
      {// ═══ VERB DRILL ═══
      scr==="verbdrill"&&<VerbDrillScreen goBack={goBack} />}
      {// ═══ TENSE TRANSFORMER ═══
      scr==="tenseflip"&&<TenseFlipScreen goBack={goBack} award={award} />}
      {// ═══ RIDDLES ═══
      scr==="riddles"&&<RiddlesScreen goBack={goBack} award={award} />}
      {// ═══ LOGIC QUIZ ═══
      scr==="logicquiz"&&<LogicQuizScreen goBack={goBack} award={award} />}
      {// ═══ ORDINALS & FLOORS ═══
      scr==="ordinals"&&<OrdinalsScreen goBack={goBack} award={award} />}
      {// ═══ RELATIVE PRONOUNS ═══
      scr==="relpron"&&<RelativePronounsScreen goBack={goBack} award={award} />}
      {// ═══ EMOTIONS & GENDER ═══
      scr==="emogender"&&<EmotionGenderScreen goBack={goBack} award={award} />}
      {// ═══ ADJECTIVE OPPOSITES ═══
      scr==="opposites"&&<OppositesScreen goBack={goBack} award={award} />}
      {// ═══ CITY & COUNTRY LOCATIVE ═══
      scr==="cityloc"&&<CityLocativeScreen goBack={goBack} award={award} />}
      {// ═══ ACCUSATIVE DRILL ═══
      scr==="akudrill"&&<AccusativeDrillScreen goBack={goBack} award={award} />}
      {// ═══ COLOR AGREEMENT ═══
      scr==="coloragree"&&<ColorAgreementScreen goBack={goBack} award={award} />}
      {// ═══ POSSESSIVE PRONOUNS ═══
      scr==="possess"&&<PossessivesScreen goBack={goBack} award={award} />}
      {// ═══ QUESTION WORDS ═══
      scr==="qwords"&&<QuestionWordsScreen goBack={goBack} award={award} />}
      {// ═══ NEGATION ═══
      scr==="negation"&&<NegationScreen goBack={goBack} />}
      {// ═══ SIBILARIZACIJA ═══
      scr==="sibil"&&<SibilarizationScreen goBack={goBack} award={award} />}
      {// ═══ RESTAURANT PRACTICE ═══
      scr==="restaurant"&&<RestaurantScreen goBack={goBack} />}
      {// ═══ PROFESSION GENDERS ═══
      scr==="profgender"&&<ProfessionGenderScreen goBack={goBack} award={award} />}
      {// ═══ COMPARATIVES ═══
      scr==="comparatives"&&<ComparativesScreen goBack={goBack} award={award} />}
      {// ═══ FUTURE TENSE ═══
      scr==="future"&&<FutureTenseScreen goBack={goBack} award={award} />}
      {// ═══ CROATIAN KINGS ═══
      scr==="kings"&&<KingsScreen goBack={goBack} award={award} setSt={setSt} />}
      {// ═══ CONJUGATION DRILL ═══
      scr==="conjdrill"&&<ConjugationDrill goBack={goBack} award={award} setSt={setSt} />}
      {// ═══ ZNAM - NE ZNAM ═══
      scr==="znam"&&<ZnamGame goBack={goBack} award={award} />}
      {// ═══ COLORS & GENDER ═══
      scr==="boje"&&<BojeGame goBack={goBack} award={award} />}
      {// ═══ MATCH GAME ═══
      scr==="match"&&<MatchGame mp={mp} mm={mm} msl={msl} gph={gph} gsc={gsc} sMm={sMm} sMsl={sMsl} sGsc={sGsc} sGph={sGph} goBack={goBack} award={award} />}
      {// ═══ WORD SPRINT ═══
      scr==="wordsprint"&&<WordSprint sh={sh} award={award} goBack={goBack} />}
      {// ═══ SPEAKING / PRONUNCIATION ═══
      scr==="speaking"&&<SpeakingScreen sw={sw} si={si} sx={sx} sr={sr} ssc={ssc} sSr={sSr} sSx={sSx} sSw={sSw} sSsc={sSsc} goBack={goBack} award={award} setSt={setSt} />}
      {// ═══ VOCABULARY LESSON ═══
      scr==="lesson"&&<LessonScreen
        lt={lt} li={li} lx={lx} ls={ls} lp={lp} la={la} lsl={lsl} qi={qi} icons={icons}
        sLi={sLi} sLx={sLx} sLs={sLs} sLp={sLp} sLa={sLa} sLsl={sLsl} sQi={sQi}
        goBack={goBack} award={award} setSt={setSt}
      />}
      {// ═══ GRAMMAR ═══
      scr==="grammar"&&<GrammarScreen
        gl={gl} gp={gp} gx={gx} gs={gs} ga={ga} gsl={gsl}
        sGp={sGp} sGx={sGx} sGs={sGs} sGa={sGa} sGsl={sGsl}
        goBack={goBack} award={award} setSt={setSt}
      />}
      {// ═══ ALPHABET ═══
      scr==="alphabet"&&<AlphabetScreen goBack={goBack} />}
      {// ═══ READING LIST ═══
      scr==="readlist"&&<ReadingList
        setScr={setScr} sRp={sRp} sRph={sRph} sRqi={sRqi} sRsc={sRsc}
        sRa={sRa} sRsl={sRsl} sHw={sHw} sCurEx={sCurEx} goBack={goBack}
      />}
      {// ═══ READING ═══
      scr==="reading"&&<ReadingScreen
        rp={rp} rph={rph} rqi={rqi} rsc={rsc} ra={ra} rsl={rsl} hw={hw}
        sRph={sRph} sRqi={sRqi} sRsc={sRsc} sRa={sRa} sRsl={sRsl} sHw={sHw}
        goBack={goBack} setScr={setScr} award={award} setSt={setSt}
      />}
      {// ═══ BADGES ═══
      scr==="badges"&&<BadgesScreen badges={st.badges} goBack={goBack} />}
      {// ═══ PROFILE ═══
      scr==="profile"&&<ProfileScreen
        name={name} level={level} st={st} au={au}
        goBack={goBack} doOut={doOut}
      />}
      {(as==="app"&&scr!=="welcome"&&scr!=="placement") && <TabBar tab={tab} setTab={setTab} setScr={setScr} />}
      </Suspense>
    </div>
  );
}
export default App;
