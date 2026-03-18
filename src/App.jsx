import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from "react";
import { _fbReady, H, Bar, Spk, V, PADEZI, PROVERBS, HIST_FACTS, MEDIA, MAPPLACES, BADGES, LEARN_PATH, REFLEXIVE, SCENES, FILL_STORIES, PRONOUNCASE, GENDERDRILL, SENTBUILD, VERBDRILL, VBPERSONS, TENSEFLIP, RIDDLES, LOGICQUIZ, ORDINALS, ORDQUIZ, RELPRON, EMOGENDER, QWORDS, NEGATION, COLORAGREE, SIBIL, PROFGENDER, COMPARE, COMPQUIZ, FUTURE, RESTCONV, POSSESS, ADJOPPOSITES, CITYLOC, AKUFOOD, AKUCLOTHES, CONVMATCH, TOP100, HISTORY, EVENTS, MODAL, GRAM, PLACE, READ, ALPHA, ZNAM, BOJE, CONJ, UNJUMBLE, IDIOMS, PREPS, KINGS, LISTEN, STORIES, NUMTIME, ASPECT, FALSEFR, PREPDRILL, DECL, BRZALICE, DIALECTS, DIMWORDS, WORDFORM, COLORQUIRK, PADEZI_FULL, SCHOOL, TEXTING, FRIENDS, FOODORDER, TRANSPORT, EMERGENCY, FOOTBALL, POPCULTURE, PRACTICAL, REGIONS, TENSES, GROCERY, RECIPES, ROLEPLAY, BG_LIGHT, BG_DARK, CONDITIONAL, FORMAL_REGISTER, IMPERSONAL, TECH_VOC, BUREAUCRATIC, initFirebase, hp, gA, sA, gP, sP, gS, sS, cS, touchSession, isSessionExpired, isValidEmail, fbSaveProgress, fbLoadProgress, fbRegister, fbLogin, fbLogout, fbResetPassword, friendlyError, generateFamilyCode, getLocalFamily, saveLocalFamily, fbCreateFamily, fbJoinFamily, fbGetFamilyMembers, fbLeaveFamily, fbLoadUserFamily, fbGetLeaderboard, fbOnAuthStateChanged, fbSetUserSecurity, fbGetUserSecurity, fbCreateAccount, loadVoices, getBestVoice, stopAudio, speakAzure, speakSynth, speak, speakSlow, speakEN, sh, lvl, lXP, nXP, getSR, saveSR, srMark, getStreak, updateStreak, getProverbOfDay, getDailyChallenge, getHistFact, PITCH_ACCENT, SHADOWING, ASPECT_PAIRS, getDueReviews, shMemo, shuffleArr, buildSearchIndex } from "./data.jsx";
import AppContext from "./context/AppContext.jsx";
import ScreenErrorBoundary from "./components/shared/ScreenErrorBoundary.jsx";
// Always-needed: auth + core UI (eager)
import LoginScreen from "./components/auth/LoginScreen.jsx";
import ResetPassword from "./components/auth/ResetPassword.jsx";
import XPPopup from "./components/shared/XPPopup.jsx";
import BadgeToast from "./components/shared/BadgeToast.jsx";
import TabBar from "./components/shared/TabBar.jsx";
import Sidebar from "./components/shared/Sidebar.jsx";
import CelebrationModal from "./components/shared/CelebrationModal.jsx";
import OnboardingTour from "./components/shared/OnboardingTour.jsx";
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
const ConditionalScreen = lazy(() => import("./components/learn/NewLessons.jsx").then(m => ({default: m.ConditionalScreen})));
const FormalRegisterScreen = lazy(() => import("./components/learn/NewLessons.jsx").then(m => ({default: m.FormalRegisterScreen})));
const ImpersonalScreen = lazy(() => import("./components/learn/NewLessons.jsx").then(m => ({default: m.ImpersonalScreen})));
const TechVocScreen = lazy(() => import("./components/learn/NewLessons.jsx").then(m => ({default: m.TechVocScreen})));
const BureaucraticScreen = lazy(() => import("./components/learn/NewLessons.jsx").then(m => ({default: m.BureaucraticScreen})));
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
const PitchAccentScreen = lazy(() => import("./components/practice/PitchAccentScreen.jsx"));
const ShadowingScreen = lazy(() => import("./components/practice/ShadowingScreen.jsx"));
const ReviewScreen = lazy(() => import("./components/practice/ReviewScreen.jsx"));
const WritingScreen = lazy(() => import("./components/practice/WritingScreen.jsx"));
const AspectDrillScreen = lazy(() => import("./components/practice/AspectDrillScreen.jsx"));
const Leaderboard = lazy(() => import("./components/profile/Leaderboard.jsx"));
const CertificateScreen = lazy(() => import("./components/profile/CertificateScreen.jsx"));

// Module-level constants — defined once, not recreated on every render
const DS={xp:0,str:1,diff:"beginner",lc:0,pf:0,gc:0,sp:0,de:0,rc:0,authLoading:0,mv:0,hi:0,rs:[],ct:[],badges:[]};
const ICONS={greetings:"👋",numbers:"🔢",family:"👨‍👩‍👧‍👦",food:"🍕",animals:"🐾",body:"🦴","body & face":"🦴",colors:"🎨",home:"🏠","home & rooms":"🏠",clothing:"👔",weather:"☀️","weather & seasons":"☀️",places:"📍",transport:"🚗",verbs:"💬",adjectives:"📏",time:"📅","time & calendar":"📅",months:"🗓️",directions:"🧭",emotions:"💭",professions:"💼",restaurant:"🍽️",shopping:"🛍️",travel:"✈️",health:"🏥",questions:"❓",conjunctions:"🔗",culture:"🏛️","daily routine":"🌅","in the classroom":"📖","commands at home":"🏡","fairy tales":"📜",hobbies:"🎯",zagreb:"🏙️",opposites:"🔄",comparatives:"📊",fruits:"🍎",vegetables:"🥦",sports:"⚽",holidays:"🎄",personality:"😊"};

var _appNavDepth=0;
function pushUrl(path){try{if(window.location.pathname!==path){_appNavDepth++;window.history.pushState({_ad:_appNavDepth},"",path)}}catch(e){}}
// XP cooldown helpers — pure localStorage functions, defined outside component
// so they never cause stale-closure issues in useCallback
function canEarnXP(exerciseId){
  try{var cd=JSON.parse(localStorage.getItem("xpCooldown")||"{}");return cd[exerciseId]!==new Date().toISOString().slice(0,10)}catch{return true}
}
function markExerciseDone(exerciseId){
  try{var cd=JSON.parse(localStorage.getItem("xpCooldown")||"{}");var today=new Date().toISOString().slice(0,10);cd[exerciseId]=today;var clean={};for(var k in cd){if(cd[k]===today)clean[k]=cd[k]}localStorage.setItem("xpCooldown",JSON.stringify(clean))}catch(e){}
}

function App(){
  const[authScreen,setAuthScreen]=useState("loading"); // auth screen
  const[au,setAu]=useState(null); // auth user
  const[authEmail,setAuthEmail]=useState("");const[pw,setPw]=useState("");const[pc,setPc]=useState("");const[displayName,setDisplayName]=useState("");
  const[sq,setSq]=useState("");const[sa,setSa]=useState("");const[rpEm,setRpEm]=useState("");const[rpSa,setRpSa]=useState("");const[rpPw,setRpPw]=useState("");const[rpPc,setRpPc]=useState("");const[rpStep,setRpStep]=useState(1);const[rpQ,setRpQ]=useState("");const[_rpSaHash,_setRpSaHash]=useState("");const[_rpStoredEmail,_setRpStoredEmail]=useState("");
  const[authError,setAuthError]=useState("");const[authLoading,setAuthLoading]=useState(false);const[sp,setSp2]=useState(false);
  const ds=DS;
  const[currentScreen,_setCurrentScreen]=useState("welcome");
  const setScr=useCallback(function(s){
    _setCurrentScreen(s);
    if(s==="welcome"||s==="placement")return;
    pushUrl(s==="dashboard"?"/":`/${s}`);
  },[]);
  const[name,setName]=useState("");
  const[st,setSt]=useState(ds);
  const[pi,sPi]=useState(0);const[ps,sPs]=useState(0);const[pa,sPa]=useState(false);const[px,sPx]=useState(-1);const[pq,sPq]=useState([]);
  const[lt,sLt]=useState(null);const[li,sLi]=useState([]);const[lx,sLx]=useState(0);const[ls,sLs]=useState(0);const[lp,sLp]=useState("learn");const[la,sLa]=useState(false);const[lsl,sLsl]=useState(-1);const[qi,sQi]=useState([]);
  const[gl,sGl]=useState(null);const[gx,sGx]=useState(0);const[gp,sGp]=useState("learn");const[gs,sGs]=useState(0);const[ga,sGa]=useState(false);const[gsl,sGsl]=useState(-1);
  const[gt,sGt]=useState(null);const[gsc,sGsc]=useState(0);const[gph,sGph]=useState("play");const[mp,sMp]=useState([]);const[msl,sMsl]=useState([]);const[mm,sMm]=useState([]);
  const[mcInitQ,setMcInitQ]=useState([]);const[mcResultQ,setMcResultQ]=useState([]);const[mcResultScore,setMcResultScore]=useState(0);
  const[rp,sRp]=useState(null);const[rph,sRph]=useState("read");const[rqi,sRqi]=useState(0);const[rsc,sRsc]=useState(0);const[ra,sRa]=useState(false);const[rsl,sRsl]=useState(-1);const[hw,sHw]=useState(null);
  const[sw,sSw]=useState(null);const[sr,sSr]=useState(null);const[sx,sSx]=useState(0);const[si,sSi]=useState([]);const[ssc,sSsc]=useState(0);
  const[m7,sM7]=useState("menu");const[m7i,sM7i]=useState(0);const[m7s,sM7s]=useState(0);const[m7a,sM7a]=useState(false);const[m7sl,sM7sl]=useState(-1);const[m7o,sM7o]=useState([]);const[m7q,sM7q]=useState([]);const[m7v,sM7v]=useState(0);
  const[znSec,sZnSec]=useState(0);const[znIdx,sZnIdx]=useState(0);const[znSc,sZnSc]=useState(0);const[znAns,sZnAns]=useState(false);const[znSel,sZnSel]=useState(-1);const[znOpts,sZnOpts]=useState([]);const[znMode,sZnMode]=useState("menu");
  const[bjMode,sBjMode]=useState("learn");const[bjIdx,sBjIdx]=useState(0);const[bjSc,sBjSc]=useState(0);const[bjAns,sBjAns]=useState(false);const[bjSel,sBjSel]=useState(-1);const[bjOpts,sBjOpts]=useState([]);const[bjQ,sBjQ]=useState([]);
  const[cjMode,sCjMode]=useState("menu");const[cjQ,sCjQ]=useState([]);const[cjI,sCjI]=useState(0);const[cjS,sCjS]=useState(0);const[cjA,sCjA]=useState(false);const[cjSl,sCjSl]=useState(-1);const[cjO,sCjO]=useState([]);
  const[czMode,sCzMode]=useState("learn");const[kgTab,sKgTab]=useState("timeline");
  const[fcInitPool,setFcInitPool]=useState([]);
  const[lsInitQ,setLsInitQ]=useState([]);
  const[stSt,sStSt]=useState(null);const[stSc,sStSc]=useState(0);
  const[ntQ,sNtQ]=useState([]);const[ntI,sNtI]=useState(0);const[ntS,sNtS]=useState(0);const[ntA,sNtA]=useState(false);const[ntSl,sNtSl]=useState(-1);const[ntO,sNtO]=useState([]);const[czI,sCzI]=useState(0);const[czS,sCzS]=useState(0);const[czA,sCzA]=useState(false);const[czSl,sCzSl]=useState(-1);const[czO,sCzO]=useState([]);const[czQ,sCzQ]=useState([]);
  const[ujQ,sUjQ]=useState([]);const[ujI,sUjI]=useState(0);const[ujS,sUjS]=useState(0);const[ujIn,sUjIn]=useState("");const[ujA,sUjA]=useState(false);
  const[asQ,sAsQ]=useState([]);const[asI,sAsI]=useState(0);const[asS,sAsS]=useState(0);const[asA,sAsA]=useState(false);const[asSl,sAsSl]=useState(-1);const[asO,sAsO]=useState([]);const[asMode,sAsMode]=useState("learn");
  const[ppQ,sPpQ]=useState([]);const[ppI,sPpI]=useState(0);const[ppS,sPpS]=useState(0);const[ppA,sPpA]=useState(false);const[ppSl,sPpSl]=useState(-1);
  const[dcNoun,sDcNoun]=useState(0);const[dcMode,sDcMode]=useState("learn");const[dcI,sDcI]=useState(0);const[dcS,sDcS]=useState(0);const[dcA,sDcA]=useState(false);const[dcSl,sDcSl]=useState(-1);const[dcO,sDcO]=useState([]);const[dcQ,sDcQ]=useState([]);
  const[tyW,sTyW]=useState(null);const[tyIn,sTyIn]=useState("");const[tyI,sTyI]=useState(0);const[tyS,sTyS]=useState(0);const[tyA,sTyA]=useState(false);const[tyPool,sTyPool]=useState([]);
  const[curEx,sCurEx]=useState("");
  const[dchlA,sDchlA]=useState(function(){var n=new Date();var k=n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0');var saved=localStorage.getItem("dcDay3");if(saved){try{var p=JSON.parse(saved);if(p.day===k)return p.answered;}catch(e){}}return[false,false,false];}());const[dchlSl,sDchlSl]=useState(function(){var n=new Date();var k=n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0');var saved=localStorage.getItem("dcDay3");if(saved){try{var p=JSON.parse(saved);if(p.day===k&&Array.isArray(p.selected)&&typeof p.selected[0]==="string")return p.selected;}catch(e){}}return["","",""];}());
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
  const[onboarded,setOnboarded]=useState(function(){return localStorage.getItem("onboarded")==="true"});
  const[showCelebration,setShowCelebration]=useState(false);const[celebXP,setCelebXP]=useState(0);
  const[comebackBonus,setComebackBonus]=useState(false);
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
  const[_syncReady,_setSyncReady]=useState(false);
  useEffect(()=>{initFirebase();
    const s=gS();if(s&&s.u){if(isSessionExpired()){cS();setAuthScreen("login");setTimeout(function(){setAuthError("\u2705 Your session expired. Your account is safe \u2014 just sign in again.")},200);return}const a=gA();if(a[s.u]){const p=gP(s.u);setAu({u:s.u,d:a[s.u].d,e:a[s.u].e||s.u});touchSession();updateStreak();var lf=getLocalFamily();if(lf)setFamData(lf);if(p){setName(p.name||a[s.u].d);setSt(p.st||ds);_goPostAuth(p.cp||(p.st&&(p.st.xp>0||p.st.lc>0)))}else setName(a[s.u].d);setAuthScreen("app");var _fbT1=setTimeout(function(){_setSyncReady(true)},5000);fbLoadProgress(s.u).then(function(fp){clearTimeout(_fbT1);if(fp){var lp=gP(s.u);var fpTs=fp._fbUpdated||fp.savedAt||0;var lpTs=(lp&&lp.savedAt)||0;var fpXP=(fp.st&&fp.st.xp)||0;var lpXP=(lp&&lp.st&&lp.st.xp)||0;if(fpTs>lpTs||(!fpTs&&!lpTs&&fpXP>=lpXP)){sP(s.u,fp);setSt(fp.st||ds);if(fp.name)setName(fp.name);if(fp.onboarded){localStorage.setItem("onboarded","true");setOnboarded(true);}if(fp.sr)saveSR(fp.sr);if(fp.streak)localStorage.setItem("uStreak",JSON.stringify(fp.streak));if(fp.favs){localStorage.setItem("uFavs",JSON.stringify(fp.favs));setFavs(fp.favs);}if(fp.journal){localStorage.setItem("uJournal",JSON.stringify(fp.journal));setJWords(fp.journal);}var _n1=new Date();var _dcT=_n1.getFullYear()+'-'+String(_n1.getMonth()+1).padStart(2,'0')+'-'+String(_n1.getDate()).padStart(2,'0');if(fp.dc&&fp.dc.day===_dcT){sDchlA(fp.dc.answered||[false,false,false]);sDchlSl(Array.isArray(fp.dc.selected)&&typeof fp.dc.selected[0]==="string"?fp.dc.selected:["","",""]);localStorage.setItem("dcDay3",JSON.stringify({day:_dcT,answered:fp.dc.answered||[false,false,false],selected:Array.isArray(fp.dc.selected)&&typeof fp.dc.selected[0]==="string"?fp.dc.selected:["","",""]}))}if(fp.cooldown){var _t=new Date().toISOString().slice(0,10);var _cd={};try{_cd=JSON.parse(localStorage.getItem("xpCooldown")||"{}")}catch(e){}for(var _ck in fp.cooldown){if(fp.cooldown[_ck]===_t)_cd[_ck]=fp.cooldown[_ck];}localStorage.setItem("xpCooldown",JSON.stringify(_cd));}}}_setSyncReady(true)});}else{
      if(_fbReady){
        fbOnAuthStateChanged(function(user){
          if(user){var displayName=user.displayName||user.email;var k=user.email;
            var a=gA();var ex=a[k]||{};ex.d=displayName;ex.e=k;a[k]=ex;sA(a);
            fbLoadProgress(k).then(function(fp){if(fp)sP(k,fp);
              setAu({u:k,d:displayName,e:k});sS({u:k});touchSession();updateStreak();
              fbLoadUserFamily(k).then(function(f){if(f)setFamData(f)});
              var p=fp||gP(k);if(p){setName(p.name||displayName);setSt(p.st||ds);_goPostAuth(p.cp||(p.st&&(p.st.xp>0||p.st.lc>0)));if(p.onboarded){localStorage.setItem("onboarded","true");setOnboarded(true);}if(p.sr)saveSR(p.sr);if(p.streak)localStorage.setItem("uStreak",JSON.stringify(p.streak));if(p.favs){localStorage.setItem("uFavs",JSON.stringify(p.favs));setFavs(p.favs);}if(p.journal){localStorage.setItem("uJournal",JSON.stringify(p.journal));setJWords(p.journal);}var _n2=new Date();var _dcT2=_n2.getFullYear()+'-'+String(_n2.getMonth()+1).padStart(2,'0')+'-'+String(_n2.getDate()).padStart(2,'0');if(p.dc&&p.dc.day===_dcT2){sDchlA(p.dc.answered||[false,false,false]);sDchlSl(Array.isArray(p.dc.selected)&&typeof p.dc.selected[0]==="string"?p.dc.selected:["","",""]);localStorage.setItem("dcDay3",JSON.stringify({day:_dcT2,answered:p.dc.answered||[false,false,false],selected:Array.isArray(p.dc.selected)&&typeof p.dc.selected[0]==="string"?p.dc.selected:["","",""]}))}if(p.cooldown){var _t2=new Date().toISOString().slice(0,10);var _cd2={};try{_cd2=JSON.parse(localStorage.getItem("xpCooldown")||"{}")}catch(e){}for(var _ck2 in p.cooldown){if(p.cooldown[_ck2]===_t2)_cd2[_ck2]=p.cooldown[_ck2];}localStorage.setItem("xpCooldown",JSON.stringify(_cd2));};}else setName(displayName);
              _setSyncReady(true);setAuthScreen("app")})
          }else{
            // Firebase has no user — only clear session if there is no local account to fall back to
            var _s=gS();var _a=gA();
            if(_s&&_s.u&&_a[_s.u]){setAuthScreen("login")}else{cS();setAuthScreen("login")}}})
      }else{setAuthScreen("login")}}}else setAuthScreen("login")
  },[]);
  useEffect(()=>{
    if(authScreen!=="app")return;
    var lastSeen=localStorage.getItem("lastSeen");var now=Date.now();
    if(lastSeen&&st.xp>0){var diff=now-parseInt(lastSeen,10);if(diff>86400000&&diff<7*86400000){setComebackBonus(true);setTimeout(()=>setComebackBonus(false),4000);}}
    localStorage.setItem("lastSeen",String(now));
  },[authScreen]);// eslint-disable-line
  useEffect(()=>{if(!_syncReady||!au||authScreen!=="app")return;var _nd=new Date();var _dcDay=_nd.getFullYear()+'-'+String(_nd.getMonth()+1).padStart(2,'0')+'-'+String(_nd.getDate()).padStart(2,'0');sP(au.u,{name,st,cp:currentScreen!=="welcome"&&currentScreen!=="placement",onboarded:localStorage.getItem("onboarded")==="true",savedAt:Date.now(),sr:getSR(),streak:getStreak(),favs,journal:jWords,dc:{day:_dcDay,answered:dchlA,selected:dchlSl},cooldown:(function(){try{return JSON.parse(localStorage.getItem("xpCooldown")||"{}")}catch{return{}}})()});touchSession()},[st,currentScreen,name,au,authScreen,jWords,favs,dchlA,dchlSl,_syncReady]);
  useEffect(()=>{if(authScreen!=="app")return;const iv=setInterval(()=>{if(isSessionExpired()){cS();setAu(null);setSt(ds);setScr("welcome");setName("");setAuthScreen("login")}},5*60*1000);return()=>clearInterval(iv)},[authScreen]);
  useEffect(()=>{if(authScreen!=="app")return;const h=()=>touchSession();window.addEventListener("click",h);window.addEventListener("touchstart",h);window.addEventListener("keydown",h);return()=>{window.removeEventListener("click",h);window.removeEventListener("touchstart",h);window.removeEventListener("keydown",h)}},[authScreen]);
  useEffect(()=>{if(authScreen!=="app"||!au)return;function onVisible(){if(document.visibilityState!=="visible")return;fbLoadProgress(au.u).then(function(fp){if(!fp)return;var lp=gP(au.u);var fpTs=fp._fbUpdated||fp.savedAt||0;var lpTs=(lp&&lp.savedAt)||0;if(fpTs>lpTs){sP(au.u,fp);setSt(fp.st||ds);if(fp.name)setName(fp.name);if(fp.onboarded){localStorage.setItem("onboarded","true");setOnboarded(true);}if(fp.sr)saveSR(fp.sr);if(fp.streak)localStorage.setItem("uStreak",JSON.stringify(fp.streak));if(fp.favs){localStorage.setItem("uFavs",JSON.stringify(fp.favs));setFavs(fp.favs);}if(fp.journal){localStorage.setItem("uJournal",JSON.stringify(fp.journal));setJWords(fp.journal);}var _vnd=new Date();var _vdcT=_vnd.getFullYear()+'-'+String(_vnd.getMonth()+1).padStart(2,'0')+'-'+String(_vnd.getDate()).padStart(2,'0');if(fp.dc&&fp.dc.day===_vdcT){sDchlA(fp.dc.answered||[false,false,false]);sDchlSl(Array.isArray(fp.dc.selected)&&typeof fp.dc.selected[0]==="string"?fp.dc.selected:["","",""]);localStorage.setItem("dcDay3",JSON.stringify({day:_vdcT,answered:fp.dc.answered||[false,false,false],selected:Array.isArray(fp.dc.selected)&&typeof fp.dc.selected[0]==="string"?fp.dc.selected:["","",""]}))}if(fp.cooldown){var _vt=new Date().toISOString().slice(0,10);var _vcd={};try{_vcd=JSON.parse(localStorage.getItem("xpCooldown")||"{}")}catch(e){}for(var _vck in fp.cooldown){if(fp.cooldown[_vck]===_vt)_vcd[_vck]=fp.cooldown[_vck];}localStorage.setItem("xpCooldown",JSON.stringify(_vcd));}}})}document.addEventListener("visibilitychange",onVisible);return()=>document.removeEventListener("visibilitychange",onVisible)},[authScreen,au]);
  async function doReg(){
    setAuthError("");if(!authEmail.trim()||!isValidEmail(authEmail.trim())){setAuthError("Please enter a valid email address.");return}if(!pw||pw.length<6){setAuthError("Password must be at least 6 characters.");return}if(pw!==pc){setAuthError("Passwords do not match.");return}if(!displayName.trim()){setAuthError("Please enter your display name.");return}
    if(!sq.trim()){setAuthError("Please select a security question.");return}if(!sa.trim()||sa.trim().length<2){setAuthError("Please enter a security answer (2+ characters).");return}
    setAuthLoading(true);try{initFirebase();const k=authEmail.trim().toLowerCase();
    // Block re-registration of existing local account
    var existingAccts=gA();if(existingAccts[k]){setAuthError("An account with this email already exists. Please sign in instead.");setAuthLoading(false);return}
    if(_fbReady){var fb=await fbRegister(k,pw,displayName.trim());
    // fb.err is already friendly-fied — match against friendly message substrings
    if(!fb.ok&&fb.err.indexOf("already")>=0){setAuthError("An account with this email already exists. Please sign in instead.");setAuthLoading(false);return}
    if(!fb.ok&&(fb.err.indexOf("least 6")>=0||fb.err.indexOf("weak")>=0)){setAuthError("Password is too weak. Use at least 6 characters.");setAuthLoading(false);return}
    if(!fb.ok&&fb.err.indexOf("valid email")>=0){setAuthError("Please enter a valid email address.");setAuthLoading(false);return}
    // Other Firebase errors (network, etc.) — fall through and create local account anyway
    if(fb.ok){try{await fbSetUserSecurity(k,sq.trim(),await hp(sa.trim().toLowerCase()))}catch(e){}}}
    const a=gA();const h=await hp(pw);const sah=await hp(sa.trim().toLowerCase());a[k]={p:h,d:displayName.trim(),e:k,sq:sq.trim(),sa:sah,created:Date.now()};sA(a);
    setAu({u:k,d:displayName.trim(),e:k});sS({u:k});setName(displayName.trim());setSt(ds);setScr("welcome");setAuthScreen("app");setAuthEmail("");setPw("");setPc("");setDisplayName("");setSq("");setSa("")}catch(e){setAuthError("Registration failed. Please try again.")}setAuthLoading(false)
  }
  async function doReset(){
    setAuthError("");initFirebase();
    if(rpStep===1){
      if(!rpEm.trim()||!isValidEmail(rpEm.trim())){setAuthError("Please enter your email address.");return}
      var k=rpEm.trim().toLowerCase();var sqFound="";var saFound="";
      var a=gA();if(a[k]&&a[k].sq){sqFound=a[k].sq;saFound=a[k].sa}
      if(!sqFound&&_fbReady){
        try{var sec=await fbGetUserSecurity(k);
        if(sec&&sec.sq){sqFound=sec.sq;saFound=sec.sa}
        else if(sec&&!sec.sq){
          var fb=await fbResetPassword(k);
          if(fb.ok){setAuthScreen("login");setTimeout(function(){setAuthError("\u2705 Password reset email sent! Check your inbox.")},100);return}
          else{setAuthError(fb.err);return}}
        }catch(e){}}
      if(!sqFound){
        if(_fbReady){var fb2=await fbResetPassword(k);
          if(fb2.ok){setAuthScreen("login");setTimeout(function(){setAuthError("\u2705 Password reset email sent! Check your inbox.")},100);return}}
        setAuthError("No account found with this email.");return}
      _setRpSaHash(saFound);_setRpStoredEmail(k);
      setRpQ(sqFound);setRpStep(2)}
    else if(rpStep===2){
      if(!rpSa.trim()){setAuthError("Please enter your security answer.");return}
      var sah=await hp(rpSa.trim().toLowerCase());
      if(sah!==_rpSaHash){setAuthError("Incorrect security answer. Please try again.");return}
      setRpStep(3)}
    else if(rpStep===3){
      if(!rpPw||rpPw.length<6){setAuthError("New password must be at least 6 characters.");return}
      if(rpPw!==rpPc){setAuthError("Passwords do not match.");return}
      var k=_rpStoredEmail;
      var a=gA();if(a[k]){a[k].p=await hp(rpPw);sA(a)}
      if(_fbReady){
        const acct=await fbCreateAccount(k,rpPw);
        if(!acct.ok){try{await fbResetPassword(k)}catch(e2){}}
      }
      _setRpSaHash("");_setRpStoredEmail("");
      setAuthError("");setRpEm("");setRpSa("");setRpPw("");setRpPc("");setRpStep(1);setRpQ("");
      setAuthScreen("login");setTimeout(function(){setAuthError("\u2705 Password reset! Sign in with your new password.")},100)}
  }
  async function doLog(){
    setAuthError("");if(!authEmail.trim()||!isValidEmail(authEmail.trim())){setAuthError("Please enter a valid email address.");return}if(!pw){setAuthError("Please enter your password.");return}setAuthLoading(true);
    try{
    initFirebase();const k=authEmail.trim().toLowerCase();var fbResult=null;
    // Try Firebase first
    if(_fbReady){try{fbResult=await fbLogin(k,pw);}catch(e){fbResult=null;}}
    if(fbResult&&fbResult.ok){
      // Firebase success — log in and sync local hash for future offline use
      var fbProgress=await fbLoadProgress(k);var fdn=fbResult.user.displayName||k;
      var fa=gA();var fex=fa[k]||{};fex.d=fdn;fex.e=k;
      try{fex.p=await hp(pw);}catch(e){}  // sync hash — critical so local fallback always works
      fa[k]=fex;sA(fa);if(fbProgress)sP(k,fbProgress);
      setAu({u:k,d:fdn,e:k});sS({u:k});
      var fp=fbProgress||gP(k);if(fp){setName(fp.name||fdn);setSt(fp.st||ds);_goPostAuth(fp.cp||(fp.st&&(fp.st.xp>0||fp.st.lc>0)));if(fp.sr)saveSR(fp.sr);if(fp.streak)localStorage.setItem("uStreak",JSON.stringify(fp.streak));if(fp.favs){localStorage.setItem("uFavs",JSON.stringify(fp.favs));setFavs(fp.favs);}if(fp.journal){localStorage.setItem("uJournal",JSON.stringify(fp.journal));setJWords(fp.journal);}var _n3=new Date();var _dcT3=_n3.getFullYear()+'-'+String(_n3.getMonth()+1).padStart(2,'0')+'-'+String(_n3.getDate()).padStart(2,'0');if(fp.dc&&fp.dc.day===_dcT3){sDchlA(fp.dc.answered||[false,false,false]);sDchlSl(Array.isArray(fp.dc.selected)&&typeof fp.dc.selected[0]==="string"?fp.dc.selected:["","",""]);localStorage.setItem("dcDay3",JSON.stringify({day:_dcT3,answered:fp.dc.answered||[false,false,false],selected:Array.isArray(fp.dc.selected)&&typeof fp.dc.selected[0]==="string"?fp.dc.selected:["","",""]}))}if(fp.cooldown){var _t3=new Date().toISOString().slice(0,10);var _cd3={};try{_cd3=JSON.parse(localStorage.getItem("xpCooldown")||"{}")}catch(e){}for(var _ck3 in fp.cooldown){if(fp.cooldown[_ck3]===_t3)_cd3[_ck3]=fp.cooldown[_ck3];}localStorage.setItem("xpCooldown",JSON.stringify(_cd3));};}else setName(fdn);
      setAuthScreen("app");setAuthEmail("");setPw("");fbLoadUserFamily(k).then(function(f){if(f)setFamData(f)});setAuthLoading(false);return;}
    // Hard-stop only on rate limiting
    if(fbResult&&fbResult.err&&fbResult.err.indexOf("Too many attempts")>=0){setAuthError(fbResult.err);setAuthLoading(false);return;}
    // Local account fallback
    var la=gA();
    if(!la[k]){setAuthError("No account found with this email. Please check your email or create a new account.");setAuthLoading(false);return;}
    if(la[k].p){
      var lh=await hp(pw);
      if(la[k].p===lh){
        setAu({u:k,d:la[k].d,e:k});sS({u:k});var lp=gP(k);
        if(lp){setName(lp.name||la[k].d);setSt(lp.st||ds);_goPostAuth(lp.cp||(lp.st&&(lp.st.xp>0||lp.st.lc>0)))}else setName(la[k].d);
        setAuthScreen("app");setAuthEmail("");setPw("");
        fbLoadProgress(k).then(function(fp4){if(!fp4)return;var lp4=gP(k);var fpTs4=fp4._fbUpdated||fp4.savedAt||0;var lpTs4=(lp4&&lp4.savedAt)||0;var fpXP4=(fp4.st&&fp4.st.xp)||0;var lpXP4=(lp4&&lp4.st&&lp4.st.xp)||0;if(fp4.sr)saveSR(fp4.sr);if(fp4.streak)localStorage.setItem("uStreak",JSON.stringify(fp4.streak));if(fpTs4>lpTs4||(!fpTs4&&!lpTs4&&fpXP4>lpXP4)){sP(k,fp4);setSt(fp4.st||ds);if(fp4.name)setName(fp4.name);if(fp4.onboarded){localStorage.setItem("onboarded","true");setOnboarded(true);}if(fp4.favs){localStorage.setItem("uFavs",JSON.stringify(fp4.favs));setFavs(fp4.favs);}if(fp4.journal){localStorage.setItem("uJournal",JSON.stringify(fp4.journal));setJWords(fp4.journal);}var _n4=new Date();var _dcT4=_n4.getFullYear()+'-'+String(_n4.getMonth()+1).padStart(2,'0')+'-'+String(_n4.getDate()).padStart(2,'0');if(fp4.dc&&fp4.dc.day===_dcT4){sDchlA(fp4.dc.answered||[false,false,false]);sDchlSl(Array.isArray(fp4.dc.selected)&&typeof fp4.dc.selected[0]==="string"?fp4.dc.selected:["","",""]);localStorage.setItem("dcDay3",JSON.stringify({day:_dcT4,answered:fp4.dc.answered||[false,false,false],selected:Array.isArray(fp4.dc.selected)&&typeof fp4.dc.selected[0]==="string"?fp4.dc.selected:["","",""]}))}if(fp4.cooldown){var _t4=new Date().toISOString().slice(0,10);var _cd4={};try{_cd4=JSON.parse(localStorage.getItem("xpCooldown")||"{}")}catch(e){}for(var _ck4 in fp4.cooldown){if(fp4.cooldown[_ck4]===_t4)_cd4[_ck4]=fp4.cooldown[_ck4];}localStorage.setItem("xpCooldown",JSON.stringify(_cd4));}}});
        setAuthLoading(false);return;}
      // Account exists but password wrong — always this message, never Firebase's "no account found"
      setAuthError("Incorrect password. Try again or use Forgot Password.");setAuthLoading(false);return;}
    // Account record exists but has no password hash — guide to reset
    setAuthError("Please use 'Forgot Password' to restore access to your account.");
    }catch(e){setAuthError("Login failed. Please try again.")}setAuthLoading(false)
  }
  function doOut(){fbLogout();cS();setAu(null);setSt(ds);setScr("welcome");setName("");setFamData(null);setFamMembers([]);setAuthScreen("login")}
  const doTr=async()=>{
    const t=tIn.trim();if(!t)return;sTL(true);sTOut("");
    const[s,g]=tDir==="en-hr"?["en","hr"]:["hr","en"];
    try{const r=await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(t)}&langpair=${s}|${g}`);const d=await r.json();if(d.responseStatus===200&&d.responseData?.translatedText)sTOut(d.responseData.translatedText);else if(d.responseStatus===429||String(d.responseDetails||"").toLowerCase().includes("limit"))sTOut("Daily translation limit reached. Try again tomorrow or visit translate.google.com");else sTOut("Translation unavailable. Try translate.google.com")}catch(e){sTOut("Network error — check your connection.")}sTL(false)
  };
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
      pitchaccent:"practice",shadowing:"practice",review:"practice",writing:"practice",aspectdrill:"practice",
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
      if(tabByPath[p]!==undefined){_setCurrentScreen("dashboard");_setTab(tabByPath[p]);return;}
      var s=p.slice(1);
      // Unknown or auth paths → safe fallback to home dashboard
      if(!s||s==="welcome"||s==="placement"){_setCurrentScreen("dashboard");_setTab("home");window.history.replaceState({_ad:0},"","/");return;}
      // Restore screen + sync nav tab
      _setCurrentScreen(s);
      if(screenTab[s])_setTab(screenTab[s]);
    }
    window.addEventListener("popstate",onPopState);
    return function(){window.removeEventListener("popstate",onPopState)};
  },[]);// eslint-disable-line
  const award=useCallback((amt,celebrate)=>{
    if(curEx&&!canEarnXP(curEx)){setXpA(0);setShowXP(true);setTimeout(()=>setShowXP(false),2000);return}
    setXpA(amt);setShowXP(true);
    setSt(s=>{const n={...s,xp:s.xp+amt};const nb=BADGES.filter(b=>!s.badges.includes(b.id)&&b.r(n));if(nb.length){n.badges=[...s.badges,...nb.map(b=>b.id)];setTimeout(()=>{setNB(nb[0]);setSB(true);setTimeout(()=>setSB(false),3000)},600)}return n});
    setTimeout(()=>setShowXP(false),1500);
    if(celebrate&&amt>0){setCelebXP(amt);setTimeout(()=>setShowCelebration(true),400)}
  },[curEx]);
  function _goPostAuth(hasProgress){
    if(!hasProgress){setScr("welcome");return}
    const ip=_initialPath.current;
    _initialPath.current='/';
    const tabByPath={'/learn':'learn','/practice':'practice','/croatia':'croatia','/profile':'profile'};
    if(tabByPath[ip]){_setTab(tabByPath[ip]);_setCurrentScreen("dashboard");return}
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
    else{_setCurrentScreen("dashboard");_setTab("home");window.history.replaceState({_ad:0},"","/");}
  }
  const level=useMemo(()=>lvl(st.xp),[st.xp]);
  const allCats=Object.keys(V);
  const icons=ICONS;
  // ═══ SCREEN LAUNCH FUNCTIONS (S1-3) ═══
  function launchMcGame(questions){setMcInitQ(questions);sCurEx("mcgame");setScr("mcgame");}
  function mcGameComplete(questions,score){setMcResultQ(questions);setMcResultScore(score);setScr("mcresult");}
  function launchFlashcards(pool){setFcInitPool(pool);sCurEx("flashcards");setScr("flashcards");}
  function launchListening(questions){setLsInitQ(questions);sCurEx("listening");setScr("listening");}

  function launchPathItem(item){
    if(!item)return;
    if(item.go==="lesson"&&item.topic){
      const items=sh(V[item.topic]);
      sLt(item.topic);sLi(items);sLx(0);sLs(0);sLp("learn");sLa(false);sLsl(-1);
      setScr("lesson");sCurEx("vocab_"+item.topic);
    }else if(item.go==="grammar"){
      sGl(GRAM.beginner[0]);sGp("learn");sGx(0);sGs(0);sGa(false);sGsl(-1);
      setScr("grammar");sCurEx("grammar");
    }else if(item.go==="mcgame"){
      const pool=allCats.flatMap(t=>V[t]);
      const qs=sh(pool).slice(0,10).map(w=>{const wr=sh(pool.filter(x=>x[1]!==w[1])).slice(0,3).map(x=>x[1]);return{hr:w[0],en:w[1],ph:w[2],opts:sh([w[1]].concat(wr)),correct:w[1]};});
      launchMcGame(qs);
    }else{
      setScr(item.go);sCurEx(item.go);
    }
  }
  // ═══ AUTH SCREENS ═══
  if(authScreen==="loading")return (
    <div
      className={darkMode?"dark":""}
      style={{...(darkMode?BG_DARK:BG_LIGHT),display:"flex",alignItems:"center",justifyContent:"center"}}>
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
  if(authScreen==="login"||authScreen==="register"){
    return <LoginScreen authScreen={authScreen} authError={authError} authLoading={authLoading} authEmail={authEmail} pw={pw} pc={pc} displayName={displayName} sp={sp} sq={sq} sa={sa} setAuthScreen={setAuthScreen} setAuthError={setAuthError} setAuthEmail={setAuthEmail} setPw={setPw} setPc={setPc} setDisplayName={setDisplayName} setSp2={setSp2} setSq={setSq} setSa={setSa} setRpEm={setRpEm} setRpSa={setRpSa} setRpPw={setRpPw} setRpPc={setRpPc} setRpStep={setRpStep} setRpQ={setRpQ} doLog={doLog} doReg={doReg} />;
  }
  // ═══ RESET PASSWORD SCREEN ═══
  if(authScreen==="reset"){
    return <ResetPassword authError={authError} rpEm={rpEm} rpSa={rpSa} rpPw={rpPw} rpPc={rpPc} rpStep={rpStep} rpQ={rpQ} setAuthScreen={setAuthScreen} setAuthError={setAuthError} setRpEm={setRpEm} setRpSa={setRpSa} setRpPw={setRpPw} setRpPc={setRpPc} setRpStep={setRpStep} setRpQ={setRpQ} doReset={doReset} />;
  }
    // ═══ MAIN APP RENDER ═══
  const badges=useMemo(()=>({home:dchlA.filter(v=>!v).length,learn:0,practice:0,croatia:0,profile:0}),[dchlA]);
  const onCloseCelebration=useCallback(()=>setShowCelebration(false),[]);
  function doSidebarSearch(){if(srchQ.trim()){doSearch(srchQ);setSrchOpen(true);}}
  const ctxValue={authScreen,au,name,setName,doOut,st,setSt,level,award,darkMode,setDarkMode,favs,toggleFav,isFav,setScr,goBack,tab,setTab,jWords,setJWords,famData,setFamData,sCurEx};
  return (
    <AppContext.Provider value={ctxValue}>
    <div className={darkMode?"dark":""} style={darkMode?BG_DARK:BG_LIGHT}>
      {authScreen==="app"&&currentScreen!=="welcome"&&currentScreen!=="placement"&&<Sidebar tab={tab} setTab={setTab} setScr={setScr} name={name} level={level} st={st} darkMode={darkMode} setDarkMode={setDarkMode} badges={badges} srchQ={srchQ} setSrchQ={setSrchQ} onSearch={doSidebarSearch} />}
      <div className="app-content">
      <Suspense fallback={<div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"50vh"}}><div style={{textAlign:"center"}}><div style={{fontSize:40,animation:"boat 2s ease-in-out infinite"}}>⛵</div><p style={{color:"var(--subtext)",marginTop:8,fontSize:14,fontWeight:600}}>Loading...</p></div></div>}>
      <XPPopup showXP={showXP} xpA={xpA} />
      <BadgeToast show={sB} badge={nB} />
      {showCelebration&&<CelebrationModal xp={celebXP} onClose={onCloseCelebration} />}
      {!onboarded&&authScreen==="app"&&currentScreen!=="welcome"&&currentScreen!=="placement"&&<OnboardingTour onDone={()=>setOnboarded(true)} />}
      {comebackBonus&&<div style={{position:"fixed",top:80,left:"50%",transform:"translateX(-50%)",zIndex:9500,background:"linear-gradient(135deg,#f59e0b,#d97706)",color:"#fff",borderRadius:16,padding:"14px 24px",boxShadow:"0 8px 32px rgba(0,0,0,.2)",fontSize:14,fontWeight:800,display:"flex",alignItems:"center",gap:10,animation:"slideUp .4s ease"}}>🔥 Welcome back! Keep your streak alive!</div>}
      {currentScreen==="welcome" && <WelcomeScreen name={name} au={au} st={st} setScr={setScr} setName={setName} sPq={sPq} sPi={sPi} sPs={sPs} sPa={sPa} sPx={sPx} />}
      {currentScreen==="placement" && <PlacementTest pq={pq} pi={pi} ps={ps} pa={pa} px={px} sPi={sPi} sPs={sPs} sPa={sPa} sPx={sPx} setScr={setScr} setSt={setSt} />}
      {// ═══ DASHBOARD ═══
      currentScreen==="dashboard"&&<div className="dash" id="main-content" role="main">
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
                key={r.hr+":"+r.type+":"+i}
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
        tab==="home"&&<ScreenErrorBoundary name="HomeTab"><HomeTab
          name={name} level={level} st={st}
          tDir={tDir} sTDir={sTDir} tIn={tIn} sTIn={sTIn} tOut={tOut} tL={tL} doTr={doTr}
          dchlA={dchlA} sDchlA={sDchlA} dchlSl={dchlSl} sDchlSl={sDchlSl}
          getWeekStats={getWeekStats}
          award={award}
          setTab={setTab} setScr={setScr} sCurEx={sCurEx}
          allCats={allCats} sh={sh}
          launchPathItem={launchPathItem}
        /></ScreenErrorBoundary>}
        {// ═══ TAB: LEARN ═══
        tab==="learn"&&<ScreenErrorBoundary name="LearnTab"><LearnTab
          allCats={allCats} icons={icons} setScr={setScr} sCurEx={sCurEx} st={st}
          sh={sh} sLt={sLt} sLi={sLi} sLx={sLx} sLs={sLs} sLp={sLp} sLa={sLa} sLsl={sLsl}
          setTnVerb={setTnVerb} setTnTense={setTnTense} setTnGender={setTnGender} setTnMode={setTnMode}
          sCzMode={sCzMode} sPfTab={sPfTab} sPfGender={sPfGender} sPfMode={sPfMode}
          sDcMode={sDcMode} sAsMode={sAsMode} sCjMode={sCjMode} sM7={sM7} sBjMode={sBjMode}
          sGl={sGl} sGp={sGp} sGx={sGx} sGs={sGs} sGa={sGa} sGsl={sGsl}
          launchPathItem={launchPathItem}
        /></ScreenErrorBoundary>}
        {// ═══ TAB: PRACTICE ═══
        tab==="practice"&&<ScreenErrorBoundary name="PracticeTab"><PracticeTab
          allCats={allCats} sh={sh} setScr={setScr} sCurEx={sCurEx}
          onLaunchQuiz={launchMcGame} onLaunchFlash={launchFlashcards} onLaunchListen={launchListening}
          sMp={sMp} sMsl={sMsl} sMm={sMm} sGsc={sGsc} sGph={sGph}
          sTyPool={sTyPool} sTyI={sTyI} sTyS={sTyS} sTyIn={sTyIn} sTyA={sTyA} sTyW={sTyW}
          sSi={sSi} sSx={sSx} sSw={sSw} sSr={sSr} sSsc={sSsc}
          sZnMode={sZnMode}
          sUjQ={sUjQ} sUjI={sUjI} sUjS={sUjS} sUjIn={sUjIn} sUjA={sUjA}
          sPpQ={sPpQ} sPpI={sPpI} sPpS={sPpS} sPpA={sPpA} sPpSl={sPpSl}
          sNtQ={sNtQ} sNtI={sNtI} sNtS={sNtS} sNtA={sNtA} sNtSl={sNtSl} sNtO={sNtO}
          sEvM={sEvM}
        /></ScreenErrorBoundary>}
        {// ═══ TAB: CROATIA ═══
        tab==="croatia"&&<ScreenErrorBoundary name="CroatiaTab"><CroatiaTab
          setScr={setScr} sHIdx={sHIdx} sKgTab={sKgTab} sCurEx={sCurEx}
          setRcIdx={setRcIdx} setRcServ={setRcServ}
          setRpIdx={setRpIdx} setRpLine={setRpLine} setRpShow={setRpShow}
          setMapCat={setMapCat} setMapSel={setMapSel}
        /></ScreenErrorBoundary>}
        {// ═══ TAB: PROFILE ═══
        tab==="profile"&&<ScreenErrorBoundary name="ProfileTab"><ProfileTab
          name={name} au={au} level={level} st={st} favs={favs}
          darkMode={darkMode} setDarkMode={setDarkMode}
          setScr={setScr} doOut={doOut}
        /></ScreenErrorBoundary>}
      </div>}
      {// ═══ MODAL VERBS ═══
      currentScreen==="modal"&&<ModalScreen goBack={goBack} award={award} setSt={setSt} />}
      {// ═══ HISTORY ═══
      currentScreen==="history"&&<CroatiaHistoryScreen goBack={goBack} />}
      {// ═══ EVENTS CALENDAR ═══
      currentScreen==="events"&&<EventsCalendar goBack={goBack} />}
      {// ═══ TRANSLATOR ═══
      currentScreen==="top100"&&<Top100Screen goBack={goBack} />}
      {// ═══ MULTIPLE CHOICE GAME ═══
      currentScreen==="mcgame"&&<McGame
        questions={mcInitQ} onComplete={mcGameComplete} goBack={goBack} award={award}
      />}
      {currentScreen==="mcresult"&&<McResult questions={mcResultQ} score={mcResultScore} setScr={setScr} goBack={goBack} onNewGame={launchMcGame} />}
      {// ═══ CROATIAN CASES ═══
      currentScreen==="padezi"&&<PadeziScreen goBack={goBack} award={award} setSt={setSt} />}
      {// ═══ UNJUMBLE / WORD ORDER ═══
      currentScreen==="unjumble"&&<Unjumble goBack={goBack} award={award} />}
      {// ═══ IDIOMS & SLANG ═══
      currentScreen==="idioms"&&<IdiomsScreen goBack={goBack} />}
      {currentScreen==="privacy"&&<PrivacyScreen goBack={goBack} />}
      {// ═══ FLASHCARDS ═══
      currentScreen==="flashcards"&&<Flashcards pool={fcInitPool} goBack={goBack} award={award} />}
      {// ═══ LISTENING COMPREHENSION ═══
      currentScreen==="listening"&&<ListeningScreen questions={lsInitQ} goBack={goBack} award={award} />}
      {// ═══ STORY SELECT ═══
      currentScreen==="storyselect"&&<StoryScreens goBack={goBack} award={award} sCurEx={sCurEx} />}
      {// ═══ NUMBER & TIME DRILLS ═══
      currentScreen==="numtime"&&<NumTime goBack={goBack} award={award} />}
      {// ═══ ALL PROVERBS ═══
      currentScreen==="proverbs"&&<ProverbsScreen goBack={goBack} />}
      {// ═══ LEADERBOARD ═══
      currentScreen==="leaderboard"&&<Leaderboard goBack={goBack} au={au} name={name} famData={famData} setFamData={setFamData} famMembers={famMembers} setFamMembers={setFamMembers} famLoading={famLoading} setFamLoading={setFamLoading} famName={famName} setFamName={setFamName} famCode={famCode} setFamCode={setFamCode} famErr={famErr} setFamErr={setFamErr} famTab={famTab} setFamTab={setFamTab} />}
      {// ═══ SCHOOL KIT ═══
      currentScreen==="school"&&<SchoolScreen goBack={goBack} />}
      {currentScreen==="texting"&&<TextingScreen goBack={goBack} />}
      {currentScreen==="friends"&&<FriendsScreen goBack={goBack} />}
      {currentScreen==="foodorder"&&<FoodOrderScreen goBack={goBack} />}
      {currentScreen==="transport"&&<TransportScreen goBack={goBack} />}
      {currentScreen==="emergency"&&<EmergencyScreen goBack={goBack} />}
      {currentScreen==="football"&&<HNLScreen goBack={goBack} />}
      {currentScreen==="croatiaathletes"&&<CroatiaAthletes goBack={goBack} />}
      {currentScreen==="immersion"&&<ImmersionHub goBack={goBack} setScr={setScr} />}
      {currentScreen==="aiconvo"&&<AIConversation goBack={goBack} setScr={setScr} sCurEx={sCurEx} />}
      {currentScreen==="popculture"&&<PopCultureScreen goBack={goBack} />}
      {currentScreen==="basketball"&&<BasketballScreen goBack={goBack} />}
      {currentScreen==="gym"&&<GymScreen goBack={goBack} />}
      {currentScreen==="practical"&&<PracticalScreen goBack={goBack} />}
      {currentScreen==="region_labin"&&<RegionScreen regionKey="labin" goBack={goBack} />}
      {currentScreen==="region_bibinje"&&<RegionScreen regionKey="bibinje" goBack={goBack} />}
      {currentScreen==="region_hercegovina"&&<RegionScreen regionKey="hercegovina" goBack={goBack} />}
      {currentScreen==="region_vukovar"&&<RegionScreen regionKey="vukovar" goBack={goBack} />}
      {currentScreen==="region_zagreb"&&<RegionScreen regionKey="zagreb" goBack={goBack} />}
      {currentScreen==="region_split"&&<RegionScreen regionKey="split" goBack={goBack} />}
      {currentScreen==="region_mostar"&&<RegionScreen regionKey="mostar" goBack={goBack} />}
      {currentScreen==="region_tomislavgrad"&&<RegionScreen regionKey="tomislavgrad" goBack={goBack} />}
      {currentScreen==="region_knin"&&<RegionScreen regionKey="knin" goBack={goBack} />}
      {currentScreen==="cityofday"&&<CityOfDayScreen goBack={goBack} />}
      {currentScreen==="region_vinkovci"&&<RegionScreen regionKey="vinkovci" goBack={goBack} />}
      {// ═══ PADEŽI FULL (SINGULAR & PLURAL) ═══
      currentScreen==="padezifull"&&<PadezifullScreen goBack={goBack} award={award} />}
      {// ═══ VERB ASPECT ═══
      currentScreen==="aspect"&&<AspectScreen goBack={goBack} />}
      {// ═══ FALSE FRIENDS ═══
      currentScreen==="falsefr"&&<FalseFriendsScreen goBack={goBack} />}
      {// ═══ PREPOSITION DRILLS ═══
      currentScreen==="prepdrill"&&<PrepDrill goBack={goBack} award={award} />}
      {// ═══ DECLENSION TRAINER ═══
      currentScreen==="declension"&&<DeclensionScreen goBack={goBack} />}
      {// ═══ TONGUE TWISTERS ═══
      currentScreen==="brzalice"&&<BrzaliceScreen goBack={goBack} />}
      {// ═══ DIALECTS ═══
      currentScreen==="dialects"&&<DialectsScreen goBack={goBack} />}
      {// ═══ DIMINUTIVES ═══
      currentScreen==="diminutives"&&<DiminutivesScreen goBack={goBack} />}
      {// ═══ WORD FORMATION ═══
      currentScreen==="wordform"&&<WordFormScreen goBack={goBack} />}
      {// ═══ COLOR QUIRKS ═══
      currentScreen==="colorquirk"&&<ColorQuirkScreen goBack={goBack} />}
      {currentScreen==="svojmoj"&&<SvojMojScreen goBack={goBack} award={award} />}
      {// ═══ CONDITIONAL MOOD ═══
      currentScreen==="conditional"&&<ConditionalScreen goBack={goBack} award={award} />}
      {// ═══ FORMAL vs INFORMAL REGISTER ═══
      currentScreen==="formalregister"&&<FormalRegisterScreen goBack={goBack} award={award} />}
      {// ═══ IMPERSONAL CONSTRUCTIONS ═══
      currentScreen==="impersonal"&&<ImpersonalScreen goBack={goBack} award={award} />}
      {// ═══ TECHNOLOGY VOCABULARY ═══
      currentScreen==="techvoc"&&<TechVocScreen goBack={goBack} award={award} />}
      {// ═══ BUREAUCRATIC / ADMINISTRATIVE ═══
      currentScreen==="bureaucratic"&&<BureaucraticScreen goBack={goBack} award={award} />}
      {currentScreen==="countries"&&<CountriesScreen goBack={goBack} />}
      {currentScreen==="professions"&&<ProfessionsScreen goBack={goBack} />}
      {currentScreen==="weather"&&<WeatherScreen goBack={goBack} />}
      {currentScreen==="clothes"&&<ClothesScreen goBack={goBack} />}
      {currentScreen==="bodydesc"&&<BodyDescScreen goBack={goBack} />}
      {currentScreen==="phonology"&&<PhonologyScreen goBack={goBack} />}
      {// ═══ TYPING PRACTICE ═══
      currentScreen==="typing"&&<TypingScreen goBack={goBack} award={award} />}
      {// ═══ TENSES & GENDER CONJUGATION ═══
      currentScreen==="tenses"&&<TensesScreen goBack={goBack} award={award} />}
      {// ═══ INTERACTIVE MAP ═══
      currentScreen==="crmap"&&<CrMap goBack={goBack} />}
      {// ═══ GROCERY SHOPPING ═══
      currentScreen==="grocery"&&<GroceryScreen goBack={goBack} />}
      {// ═══ RECIPES ═══
      currentScreen==="recipes"&&<RecipesScreen goBack={goBack} />}
      {// ═══ CONVERSATION ROLE-PLAY ═══
      currentScreen==="roleplay"&&<RoleplayScreen goBack={goBack} />}
      {// ═══ VOCABULARY JOURNAL ═══
      currentScreen==="journal"&&<VocabJournal
        jWords={jWords} setJWords={setJWords} jIn={jIn} setJIn={setJIn}
        jEn={jEn} setJEn={setJEn} goBack={goBack}
      />}
      {// ═══ LEARNING PATH ═══
      currentScreen==="learnpath"&&<LearnPath st={st} setScr={setScr} goBack={goBack} />}
      {// ═══ FAVORITES ═══
      currentScreen==="favorites"&&<FavoritesScreen
        favs={favs} toggleFav={toggleFav} setScr={setScr} goBack={goBack}
      />}
      {// ═══ REFLEXIVE VERBS ═══
      currentScreen==="reflexive"&&<ReflexiveScreen goBack={goBack} award={award} />}
      {// ═══ FILL-IN STORIES ═══
      currentScreen==="fillstory"&&<FillStoryScreen goBack={goBack} award={award} />}
      {// ═══ CONVERSATION MATCH ═══
      currentScreen==="convmatch"&&<ConvMatchScreen goBack={goBack} award={award} />}
      {// ═══ SCENE DESCRIPTION ═══
      currentScreen==="scenes"&&<ScenesScreen goBack={goBack} />}
      {// ═══ PRONOUN CASES ═══
      currentScreen==="pronouns"&&<PronounsScreen goBack={goBack} award={award} />}
      {// ═══ GENDER & PLURALS ═══
      currentScreen==="genderdrill"&&<GenderDrillScreen goBack={goBack} award={award} />}
      {// ═══ SENTENCE BUILDER ═══
      currentScreen==="sentbuild"&&<SentenceBuilderScreen goBack={goBack} award={award} />}
      {// ═══ VERB DRILL ═══
      currentScreen==="verbdrill"&&<VerbDrillScreen goBack={goBack} />}
      {// ═══ TENSE TRANSFORMER ═══
      currentScreen==="tenseflip"&&<TenseFlipScreen goBack={goBack} award={award} />}
      {// ═══ RIDDLES ═══
      currentScreen==="riddles"&&<RiddlesScreen goBack={goBack} award={award} />}
      {// ═══ LOGIC QUIZ ═══
      currentScreen==="logicquiz"&&<LogicQuizScreen goBack={goBack} award={award} />}
      {// ═══ ORDINALS & FLOORS ═══
      currentScreen==="ordinals"&&<OrdinalsScreen goBack={goBack} award={award} />}
      {// ═══ RELATIVE PRONOUNS ═══
      currentScreen==="relpron"&&<RelativePronounsScreen goBack={goBack} award={award} />}
      {// ═══ EMOTIONS & GENDER ═══
      currentScreen==="emogender"&&<EmotionGenderScreen goBack={goBack} award={award} />}
      {// ═══ ADJECTIVE OPPOSITES ═══
      currentScreen==="opposites"&&<OppositesScreen goBack={goBack} award={award} />}
      {// ═══ CITY & COUNTRY LOCATIVE ═══
      currentScreen==="cityloc"&&<CityLocativeScreen goBack={goBack} award={award} />}
      {// ═══ ACCUSATIVE DRILL ═══
      currentScreen==="akudrill"&&<AccusativeDrillScreen goBack={goBack} award={award} />}
      {// ═══ COLOR AGREEMENT ═══
      currentScreen==="coloragree"&&<ColorAgreementScreen goBack={goBack} award={award} />}
      {// ═══ POSSESSIVE PRONOUNS ═══
      currentScreen==="possess"&&<PossessivesScreen goBack={goBack} award={award} />}
      {// ═══ QUESTION WORDS ═══
      currentScreen==="qwords"&&<QuestionWordsScreen goBack={goBack} award={award} />}
      {// ═══ NEGATION ═══
      currentScreen==="negation"&&<NegationScreen goBack={goBack} />}
      {// ═══ SIBILARIZACIJA ═══
      currentScreen==="sibil"&&<SibilarizationScreen goBack={goBack} award={award} />}
      {// ═══ RESTAURANT PRACTICE ═══
      currentScreen==="restaurant"&&<RestaurantScreen goBack={goBack} />}
      {// ═══ PROFESSION GENDERS ═══
      currentScreen==="profgender"&&<ProfessionGenderScreen goBack={goBack} award={award} />}
      {// ═══ COMPARATIVES ═══
      currentScreen==="comparatives"&&<ComparativesScreen goBack={goBack} award={award} />}
      {// ═══ FUTURE TENSE ═══
      currentScreen==="future"&&<FutureTenseScreen goBack={goBack} award={award} />}
      {// ═══ CROATIAN KINGS ═══
      currentScreen==="kings"&&<KingsScreen goBack={goBack} award={award} setSt={setSt} />}
      {// ═══ CONJUGATION DRILL ═══
      currentScreen==="conjdrill"&&<ConjugationDrill goBack={goBack} award={award} setSt={setSt} />}
      {// ═══ ZNAM - NE ZNAM ═══
      currentScreen==="znam"&&<ZnamGame goBack={goBack} award={award} />}
      {// ═══ COLORS & GENDER ═══
      currentScreen==="boje"&&<BojeGame goBack={goBack} award={award} />}
      {// ═══ MATCH GAME ═══
      currentScreen==="match"&&<MatchGame mp={mp} mm={mm} msl={msl} gph={gph} gsc={gsc} sMm={sMm} sMsl={sMsl} sGsc={sGsc} sGph={sGph} goBack={goBack} award={award} />}
      {// ═══ WORD SPRINT ═══
      currentScreen==="wordsprint"&&<WordSprint sh={sh} award={award} goBack={goBack} />}
      {// ═══ SPEAKING / PRONUNCIATION ═══
      currentScreen==="speaking"&&<SpeakingScreen sw={sw} si={si} sx={sx} sr={sr} ssc={ssc} sSr={sSr} sSx={sSx} sSw={sSw} sSsc={sSsc} goBack={goBack} award={award} setSt={setSt} />}
      {// ═══ PITCH ACCENT ═══
      currentScreen==="pitchaccent"&&<PitchAccentScreen goBack={goBack} award={award} PITCH_ACCENT={PITCH_ACCENT} />}
      {// ═══ SHADOWING ═══
      currentScreen==="shadowing"&&<ShadowingScreen goBack={goBack} award={award} SHADOWING={SHADOWING} />}
      {// ═══ SPACED REPETITION REVIEW ═══
      currentScreen==="review"&&<ReviewScreen goBack={goBack} award={award} allCats={allCats} V={V} />}
      {// ═══ FREE WRITING + AI CORRECTION ═══
      currentScreen==="writing"&&<WritingScreen goBack={goBack} award={award} />}
      {// ═══ VERB ASPECT DRILL ═══
      currentScreen==="aspectdrill"&&<AspectDrillScreen goBack={goBack} award={award} ASPECT_PAIRS={ASPECT_PAIRS} />}
      {// ═══ VOCABULARY LESSON ═══
      currentScreen==="lesson"&&<LessonScreen
        lt={lt} li={li} lx={lx} ls={ls} lp={lp} la={la} lsl={lsl} qi={qi} icons={icons}
        sLi={sLi} sLx={sLx} sLs={sLs} sLp={sLp} sLa={sLa} sLsl={sLsl} sQi={sQi}
        goBack={goBack} award={award} setSt={setSt}
      />}
      {// ═══ GRAMMAR ═══
      currentScreen==="grammar"&&<GrammarScreen
        gl={gl||GRAM.beginner[0]} gp={gp} gx={gx} gs={gs} ga={ga} gsl={gsl}
        sGp={sGp} sGx={sGx} sGs={sGs} sGa={sGa} sGsl={sGsl}
        goBack={goBack} award={award} setSt={setSt}
      />}
      {// ═══ ALPHABET ═══
      currentScreen==="alphabet"&&<AlphabetScreen goBack={goBack} />}
      {// ═══ READING LIST ═══
      currentScreen==="readlist"&&<ReadingList
        setScr={setScr} sRp={sRp} sRph={sRph} sRqi={sRqi} sRsc={sRsc}
        sRa={sRa} sRsl={sRsl} sHw={sHw} sCurEx={sCurEx} goBack={goBack}
      />}
      {// ═══ READING ═══
      currentScreen==="reading"&&<ReadingScreen
        rp={rp} rph={rph} rqi={rqi} rsc={rsc} ra={ra} rsl={rsl} hw={hw}
        sRph={sRph} sRqi={sRqi} sRsc={sRsc} sRa={sRa} sRsl={sRsl} sHw={sHw}
        goBack={goBack} setScr={setScr} award={award} setSt={setSt}
      />}
      {// ═══ BADGES ═══
      currentScreen==="badges"&&<BadgesScreen badges={st.badges} goBack={goBack} />}
      {// ═══ PROFILE ═══
      currentScreen==="profile"&&<ProfileScreen
        name={name} level={level} st={st} au={au}
        goBack={goBack} doOut={doOut}
      />}
      {currentScreen==="certificate"&&<CertificateScreen name={name} level={level} st={st} goBack={goBack} />}
      {(authScreen==="app"&&currentScreen!=="welcome"&&currentScreen!=="placement") && <TabBar tab={tab} setTab={setTab} setScr={setScr} badges={badges} />}
      </Suspense>
      </div>
    </div>
    </AppContext.Provider>
  );
}
export default App;
