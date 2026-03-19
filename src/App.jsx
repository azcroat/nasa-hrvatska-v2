import React, { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from "react";
import { _fbReady, H, Bar, Spk, V, PADEZI, PROVERBS, HIST_FACTS, MEDIA, MAPPLACES, BADGES, LEARN_PATH, REFLEXIVE, SCENES, FILL_STORIES, PRONOUNCASE, GENDERDRILL, SENTBUILD, VERBDRILL, VBPERSONS, TENSEFLIP, RIDDLES, LOGICQUIZ, ORDINALS, ORDQUIZ, RELPRON, EMOGENDER, QWORDS, NEGATION, COLORAGREE, SIBIL, PROFGENDER, COMPARE, COMPQUIZ, FUTURE, RESTCONV, POSSESS, ADJOPPOSITES, CITYLOC, AKUFOOD, AKUCLOTHES, CONVMATCH, TOP100, HISTORY, EVENTS, MODAL, GRAM, PLACE, READ, ALPHA, ZNAM, BOJE, CONJ, UNJUMBLE, IDIOMS, PREPS, KINGS, LISTEN, STORIES, NUMTIME, ASPECT, FALSEFR, PREPDRILL, DECL, BRZALICE, DIALECTS, DIMWORDS, WORDFORM, COLORQUIRK, PADEZI_FULL, SCHOOL, TEXTING, FRIENDS, FOODORDER, TRANSPORT, EMERGENCY, FOOTBALL, POPCULTURE, PRACTICAL, REGIONS, TENSES, GROCERY, RECIPES, ROLEPLAY, BG_LIGHT, BG_DARK, CONDITIONAL, FORMAL_REGISTER, IMPERSONAL, TECH_VOC, BUREAUCRATIC, initFirebase, gP, sP, gS, sS, cS, touchSession, isSessionExpired, isValidEmail, fbSaveProgress, fbLoadProgress, fbRegister, fbLogin, fbLogout, fbResetPassword, friendlyError, generateFamilyCode, getLocalFamily, saveLocalFamily, fbCreateFamily, fbJoinFamily, fbGetFamilyMembers, fbLeaveFamily, fbLoadUserFamily, fbGetLeaderboard, fbOnAuthStateChanged, loadVoices, getBestVoice, stopAudio, speakAzure, speakSynth, speak, speakSlow, speakEN, sh, lvl, lXP, nXP, getSR, saveSR, srMark, getStreak, updateStreak, getStreakFreezes, earnFreeze, spendFreeze, getProverbOfDay, getDailyChallenge, getHistFact, PITCH_ACCENT, SHADOWING, ASPECT_PAIRS, getDueReviews, shMemo, shuffleArr, buildSearchIndex } from "./data.jsx";
import AppContext from "./context/AppContext.jsx";
import ScreenErrorBoundary from "./components/shared/ScreenErrorBoundary.jsx";
import { usePreferences } from "./hooks/usePreferences.js";
import { useSearch } from "./hooks/useSearch.js";
import { useAuth } from "./hooks/useAuth.js";
import { useFamily } from "./hooks/useFamily.js";
import { useJournal } from "./hooks/useJournal.js";
import { useDaily } from "./hooks/useDaily.js";
import { useTranslator } from "./hooks/useTranslator.js";
import { useNotifications, checkNameDay } from "./hooks/useNotifications.js";
// Always-needed: auth + core UI (eager)
import LoginScreen from "./components/auth/LoginScreen.jsx";
import ResetPassword from "./components/auth/ResetPassword.jsx";
import XPPopup from "./components/shared/XPPopup.jsx";
import BadgeToast from "./components/shared/BadgeToast.jsx";
import TabBar from "./components/shared/TabBar.jsx";
import Sidebar from "./components/shared/Sidebar.jsx";
import CelebrationModal from "./components/shared/CelebrationModal.jsx";
import StreakMilestoneModal from "./components/shared/StreakMilestoneModal.jsx";
import OnboardingTour from "./components/shared/OnboardingTour.jsx";
import OfflineBanner from "./components/shared/OfflineBanner.jsx";
import WelcomeScreen from "./components/home/WelcomeScreen.jsx";
import PlacementTest from "./components/home/PlacementTest.jsx";
// Reload once on stale-chunk errors (happens after deploy when old index.html
// tries to load chunk files that no longer exist at their old hashed paths).
function lazyWithReload(fn) {
  return lazy(() => fn().catch((e) => {
    const msg = e?.message || '';
    if (msg.includes('importing a module script failed') || msg.includes('Failed to fetch')) {
      window.location.reload();
    }
    throw e;
  }));
}

// Tabs + screens — lazy-loaded on first use
const HomeTab = lazyWithReload(() => import("./components/home/HomeTab.jsx"));
const LearnTab = lazyWithReload(() => import("./components/learn/LearnTab.jsx"));
const CroatiaTab = lazyWithReload(() => import("./components/croatia/CroatiaTab.jsx"));
const ImmersionHub = lazyWithReload(() => import("./components/croatia/ImmersionHub.jsx"));
const LyricsScreen = lazyWithReload(() => import("./components/croatia/LyricsScreen.jsx"));
const AIConversation = lazyWithReload(() => import("./components/croatia/AIConversation.jsx"));
const ProfileTab = lazyWithReload(() => import("./components/profile/ProfileTab.jsx"));
const PracticeTab = lazyWithReload(() => import("./components/practice/PracticeTab.jsx"));
const LessonScreen = lazyWithReload(() => import("./components/learn/LessonScreen.jsx"));
const GrammarScreen = lazyWithReload(() => import("./components/learn/GrammarScreen.jsx"));
const AlphabetScreen = lazyWithReload(() => import("./components/learn/AlphabetScreen.jsx"));
const ReadingList = lazyWithReload(() => import("./components/learn/ReadingList.jsx"));
const ReadingScreen = lazyWithReload(() => import("./components/learn/ReadingScreen.jsx"));
const BadgesScreen = lazyWithReload(() => import("./components/profile/BadgesScreen.jsx"));
const ProfileScreen = lazyWithReload(() => import("./components/profile/ProfileScreen.jsx"));
const VocabJournal = lazyWithReload(() => import("./components/profile/VocabJournal.jsx"));
const FavoritesScreen = lazyWithReload(() => import("./components/profile/FavoritesScreen.jsx"));
const LearnPath = lazyWithReload(() => import("./components/profile/LearnPath.jsx"));
const ProverbsScreen = lazyWithReload(() => import("./components/croatia/ProverbsScreen.jsx"));
const Flashcards = lazyWithReload(() => import("./components/practice/Flashcards.jsx"));
const ListeningScreen = lazyWithReload(() => import("./components/practice/ListeningScreen.jsx"));
const McGame = lazyWithReload(() => import("./components/practice/McGame.jsx"));
const IdiomsScreen = lazyWithReload(() => import("./components/croatia/IdiomsScreen.jsx"));
const PrivacyScreen = lazyWithReload(() => import("./components/shared/PrivacyScreen.jsx"));
const TextingScreen = lazyWithReload(() => import("./components/croatia/CroatiaCulture.jsx").then(m => ({default: m.TextingScreen})));
const FriendsScreen = lazyWithReload(() => import("./components/croatia/CroatiaCulture.jsx").then(m => ({default: m.FriendsScreen})));
const FoodOrderScreen = lazyWithReload(() => import("./components/croatia/CroatiaCulture.jsx").then(m => ({default: m.FoodOrderScreen})));
const TransportScreen = lazyWithReload(() => import("./components/croatia/CroatiaCulture.jsx").then(m => ({default: m.TransportScreen})));
const EmergencyScreen = lazyWithReload(() => import("./components/croatia/CroatiaCulture.jsx").then(m => ({default: m.EmergencyScreen})));
const PopCultureScreen = lazyWithReload(() => import("./components/croatia/CroatiaCulture.jsx").then(m => ({default: m.PopCultureScreen})));
const PracticalScreen = lazyWithReload(() => import("./components/croatia/CroatiaCulture.jsx").then(m => ({default: m.PracticalScreen})));
const SchoolScreen = lazyWithReload(() => import("./components/croatia/CroatiaCulture.jsx").then(m => ({default: m.SchoolScreen})));
const GroceryScreen = lazyWithReload(() => import("./components/croatia/CroatiaCulture.jsx").then(m => ({default: m.GroceryScreen})));
const CroatiaHistoryScreen = lazyWithReload(() => import("./components/croatia/CroatiaCulture.jsx").then(m => ({default: m.HistoryScreen})));
const BasketballScreen = lazyWithReload(() => import("./components/croatia/CroatiaCulture.jsx").then(m => ({default: m.BasketballScreen})));
const GymScreen = lazyWithReload(() => import("./components/croatia/CroatiaCulture.jsx").then(m => ({default: m.GymScreen})));
const HNLScreen = lazyWithReload(() => import("./components/croatia/HNLScreen.jsx"));
const CroatiaAthletes = lazyWithReload(() => import("./components/croatia/CroatiaAthletes.jsx"));
const RegionScreen = lazyWithReload(() => import("./components/croatia/RegionScreens.jsx").then(m => ({default: m.RegionScreen})));
const RoleplayScreen = lazyWithReload(() => import("./components/croatia/RegionScreens.jsx").then(m => ({default: m.RoleplayScreen})));
const RecipesScreen = lazyWithReload(() => import("./components/croatia/RegionScreens.jsx").then(m => ({default: m.RecipesScreen})));
const CityOfDayScreen = lazyWithReload(() => import("./components/croatia/RegionScreens.jsx").then(m => ({default: m.CityOfDayScreen})));
const EventsCalendar = lazyWithReload(() => import("./components/croatia/EventsTop100.jsx").then(m => ({default: m.EventsCalendar})));
const Top100Screen = lazyWithReload(() => import("./components/croatia/EventsTop100.jsx").then(m => ({default: m.Top100Screen})));
const KingsScreen = lazyWithReload(() => import("./components/croatia/KingsScreen.jsx"));
const CrMap = lazyWithReload(() => import("./components/croatia/CrMap.jsx"));
const AspectScreen = lazyWithReload(() => import("./components/learn/GrammarRef.jsx").then(m => ({default: m.AspectScreen})));
const FalseFriendsScreen = lazyWithReload(() => import("./components/learn/GrammarRef.jsx").then(m => ({default: m.FalseFriendsScreen})));
const DeclensionScreen = lazyWithReload(() => import("./components/learn/GrammarRef.jsx").then(m => ({default: m.DeclensionScreen})));
const BrzaliceScreen = lazyWithReload(() => import("./components/learn/GrammarRef.jsx").then(m => ({default: m.BrzaliceScreen})));
const DialectsScreen = lazyWithReload(() => import("./components/learn/GrammarRef.jsx").then(m => ({default: m.DialectsScreen})));
const DiminutivesScreen = lazyWithReload(() => import("./components/learn/GrammarRef.jsx").then(m => ({default: m.DiminutivesScreen})));
const WordFormScreen = lazyWithReload(() => import("./components/learn/GrammarRef.jsx").then(m => ({default: m.WordFormScreen})));
const ColorQuirkScreen = lazyWithReload(() => import("./components/learn/GrammarRef.jsx").then(m => ({default: m.ColorQuirkScreen})));
const SvojMojScreen = lazyWithReload(() => import("./components/learn/GrammarRef.jsx").then(m => ({default: m.SvojMojScreen})));
const ConditionalScreen = lazyWithReload(() => import("./components/learn/NewLessons.jsx").then(m => ({default: m.ConditionalScreen})));
const FormalRegisterScreen = lazyWithReload(() => import("./components/learn/NewLessons.jsx").then(m => ({default: m.FormalRegisterScreen})));
const ImpersonalScreen = lazyWithReload(() => import("./components/learn/NewLessons.jsx").then(m => ({default: m.ImpersonalScreen})));
const TechVocScreen = lazyWithReload(() => import("./components/learn/NewLessons.jsx").then(m => ({default: m.TechVocScreen})));
const BureaucraticScreen = lazyWithReload(() => import("./components/learn/NewLessons.jsx").then(m => ({default: m.BureaucraticScreen})));
const CountriesScreen = lazyWithReload(() => import("./components/learn/VocabScreens.jsx").then(m => ({default: m.CountriesScreen})));
const ProfessionsScreen = lazyWithReload(() => import("./components/learn/VocabScreens.jsx").then(m => ({default: m.ProfessionsScreen})));
const WeatherScreen = lazyWithReload(() => import("./components/learn/VocabScreens.jsx").then(m => ({default: m.WeatherScreen})));
const ClothesScreen = lazyWithReload(() => import("./components/learn/VocabScreens.jsx").then(m => ({default: m.ClothesScreen})));
const BodyDescScreen = lazyWithReload(() => import("./components/learn/VocabScreens.jsx").then(m => ({default: m.BodyDescScreen})));
const PhonologyScreen = lazyWithReload(() => import("./components/learn/VocabScreens.jsx").then(m => ({default: m.PhonologyScreen})));
const ModalScreen = lazyWithReload(() => import("./components/learn/ModalScreen.jsx"));
const PadeziScreen = lazyWithReload(() => import("./components/learn/PadeziScreen.jsx"));
const PadezifullScreen = lazyWithReload(() => import("./components/learn/PadezifullScreen.jsx"));
const TensesScreen = lazyWithReload(() => import("./components/learn/TensesScreen.jsx"));
const ReflexiveScreen = lazyWithReload(() => import("./components/practice/exercises/Exercises1.jsx").then(m => ({default: m.ReflexiveScreen})));
const FillStoryScreen = lazyWithReload(() => import("./components/practice/exercises/Exercises1.jsx").then(m => ({default: m.FillStoryScreen})));
const ConvMatchScreen = lazyWithReload(() => import("./components/practice/exercises/Exercises1.jsx").then(m => ({default: m.ConvMatchScreen})));
const ScenesScreen = lazyWithReload(() => import("./components/practice/exercises/Exercises1.jsx").then(m => ({default: m.ScenesScreen})));
const PronounsScreen = lazyWithReload(() => import("./components/practice/exercises/Exercises1.jsx").then(m => ({default: m.PronounsScreen})));
const GenderDrillScreen = lazyWithReload(() => import("./components/practice/exercises/Exercises1.jsx").then(m => ({default: m.GenderDrillScreen})));
const SentenceBuilderScreen = lazyWithReload(() => import("./components/practice/exercises/Exercises1.jsx").then(m => ({default: m.SentenceBuilderScreen})));
const VerbDrillScreen = lazyWithReload(() => import("./components/practice/exercises/Exercises1.jsx").then(m => ({default: m.VerbDrillScreen})));
const TenseFlipScreen = lazyWithReload(() => import("./components/practice/exercises/Exercises2.jsx").then(m => ({default: m.TenseFlipScreen})));
const RiddlesScreen = lazyWithReload(() => import("./components/practice/exercises/Exercises2.jsx").then(m => ({default: m.RiddlesScreen})));
const LogicQuizScreen = lazyWithReload(() => import("./components/practice/exercises/Exercises2.jsx").then(m => ({default: m.LogicQuizScreen})));
const OrdinalsScreen = lazyWithReload(() => import("./components/practice/exercises/Exercises2.jsx").then(m => ({default: m.OrdinalsScreen})));
const RelativePronounsScreen = lazyWithReload(() => import("./components/practice/exercises/Exercises2.jsx").then(m => ({default: m.RelativePronounsScreen})));
const EmotionGenderScreen = lazyWithReload(() => import("./components/practice/exercises/Exercises2.jsx").then(m => ({default: m.EmotionGenderScreen})));
const OppositesScreen = lazyWithReload(() => import("./components/practice/exercises/Exercises2.jsx").then(m => ({default: m.OppositesScreen})));
const CityLocativeScreen = lazyWithReload(() => import("./components/practice/exercises/Exercises2.jsx").then(m => ({default: m.CityLocativeScreen})));
const AccusativeDrillScreen = lazyWithReload(() => import("./components/practice/exercises/Exercises2.jsx").then(m => ({default: m.AccusativeDrillScreen})));
const ColorAgreementScreen = lazyWithReload(() => import("./components/practice/exercises/Exercises3.jsx").then(m => ({default: m.ColorAgreementScreen})));
const PossessivesScreen = lazyWithReload(() => import("./components/practice/exercises/Exercises3.jsx").then(m => ({default: m.PossessivesScreen})));
const QuestionWordsScreen = lazyWithReload(() => import("./components/practice/exercises/Exercises3.jsx").then(m => ({default: m.QuestionWordsScreen})));
const NegationScreen = lazyWithReload(() => import("./components/practice/exercises/Exercises3.jsx").then(m => ({default: m.NegationScreen})));
const SibilarizationScreen = lazyWithReload(() => import("./components/practice/exercises/Exercises3.jsx").then(m => ({default: m.SibilarizationScreen})));
const RestaurantScreen = lazyWithReload(() => import("./components/practice/exercises/Exercises3.jsx").then(m => ({default: m.RestaurantScreen})));
const ProfessionGenderScreen = lazyWithReload(() => import("./components/practice/exercises/Exercises3.jsx").then(m => ({default: m.ProfessionGenderScreen})));
const ComparativesScreen = lazyWithReload(() => import("./components/practice/exercises/Exercises3.jsx").then(m => ({default: m.ComparativesScreen})));
const FutureTenseScreen = lazyWithReload(() => import("./components/practice/exercises/Exercises3.jsx").then(m => ({default: m.FutureTenseScreen})));
const McResult = lazyWithReload(() => import("./components/practice/McResult.jsx"));
const StoryScreens = lazyWithReload(() => import("./components/practice/StoryScreens.jsx"));
const NumTime = lazyWithReload(() => import("./components/practice/NumTime.jsx"));
const Unjumble = lazyWithReload(() => import("./components/practice/Unjumble.jsx"));
const PrepDrill = lazyWithReload(() => import("./components/practice/PrepDrill.jsx"));
const TypingScreen = lazyWithReload(() => import("./components/practice/TypingScreen.jsx"));
const ConjugationDrill = lazyWithReload(() => import("./components/practice/ConjugationDrill.jsx"));
const ZnamGame = lazyWithReload(() => import("./components/practice/ZnamGame.jsx"));
const BojeGame = lazyWithReload(() => import("./components/practice/BojeGame.jsx"));
const MatchGame = lazyWithReload(() => import("./components/practice/MatchGame.jsx"));
const WordSprint = lazyWithReload(() => import("./components/practice/WordSprint.jsx"));
const SpeakingScreen = lazyWithReload(() => import("./components/practice/SpeakingScreen.jsx"));
const PitchAccentScreen = lazyWithReload(() => import("./components/practice/PitchAccentScreen.jsx"));
const ShadowingScreen = lazyWithReload(() => import("./components/practice/ShadowingScreen.jsx"));
const ReviewScreen = lazyWithReload(() => import("./components/practice/ReviewScreen.jsx"));
const WritingScreen = lazyWithReload(() => import("./components/practice/WritingScreen.jsx"));
const AspectDrillScreen = lazyWithReload(() => import("./components/practice/AspectDrillScreen.jsx"));
const CliticDrill = lazyWithReload(() => import("./components/practice/CliticDrill.jsx"));
const SlangScreen = lazyWithReload(() => import("./components/practice/SlangScreen.jsx"));
const NumbersCasesDrill = lazyWithReload(() => import("./components/practice/NumbersCasesDrill.jsx"));
const ImperativeDrill = lazyWithReload(() => import("./components/practice/ImperativeDrill.jsx"));
const NegationGenDrill = lazyWithReload(() => import("./components/practice/NegationGenDrill.jsx"));
const CollocationsGame = lazyWithReload(() => import("./components/practice/CollocationsGame.jsx"));
const WordFamilies = lazyWithReload(() => import("./components/practice/WordFamilies.jsx"));
const DictationScreen = lazyWithReload(() => import("./components/practice/DictationScreen.jsx"));
const PronunciationContrast = lazyWithReload(() => import("./components/practice/PronunciationContrast.jsx"));
const DialogueSim = lazyWithReload(() => import("./components/practice/DialogueSim.jsx"));
const CefrTest = lazyWithReload(() => import("./components/practice/CefrTest.jsx"));
const Leaderboard = lazyWithReload(() => import("./components/profile/Leaderboard.jsx"));
const CertificateScreen = lazyWithReload(() => import("./components/profile/CertificateScreen.jsx"));

// Module-level constants — defined once, not recreated on every render
const DS={xp:0,str:1,diff:"beginner",lc:0,pf:0,gc:0,sp:0,de:0,rc:0,authLoading:0,mv:0,hi:0,rs:[],ct:[],badges:[]};
// Fix 4: computed once at module level — Object.keys(V) is deterministic and expensive to repeat
const ALL_CATS=Object.keys(V);
const ICONS={greetings:"👋",numbers:"🔢",family:"👨‍👩‍👧‍👦",food:"🍕",animals:"🐾",body:"🦴","body & face":"🦴",colors:"🎨",home:"🏠","home & rooms":"🏠",clothing:"👔",weather:"☀️","weather & seasons":"☀️",places:"📍",transport:"🚗",verbs:"💬",adjectives:"📏",time:"📅","time & calendar":"📅",months:"🗓️",directions:"🧭",emotions:"💭",professions:"💼",restaurant:"🍽️",shopping:"🛍️",travel:"✈️",health:"🏥",questions:"❓",conjunctions:"🔗",culture:"🏛️","daily routine":"🌅","in the classroom":"📖","commands at home":"🏡","fairy tales":"📜",hobbies:"🎯",zagreb:"🏙️",opposites:"🔄",comparatives:"📊",fruits:"🍎",vegetables:"🥦",sports:"⚽",holidays:"🎄",personality:"😊"};

let _appNavDepth=0;
function pushUrl(path){try{if(window.location.pathname!==path){_appNavDepth++;window.history.pushState({_ad:_appNavDepth},"",path)}}catch(e){}}
// XP cooldown helpers — pure localStorage functions, defined outside component
// so they never cause stale-closure issues in useCallback
function canEarnXP(exerciseId){
  try{const cd=JSON.parse(localStorage.getItem("xpCooldown")||"{}");return cd[exerciseId]!==new Date().toISOString().slice(0,10)}catch{return true}
}
function markExerciseDone(exerciseId){
  try{const cd=JSON.parse(localStorage.getItem("xpCooldown")||"{}");const today=new Date().toISOString().slice(0,10);cd[exerciseId]=today;const clean={};for(const k in cd){if(cd[k]===today)clean[k]=cd[k]}localStorage.setItem("xpCooldown",JSON.stringify(clean))}catch(e){}
}

function App(){
  useNotifications();
  const ds=DS;
  const[currentScreen,_setCurrentScreen]=useState("welcome");
  const setScr=useCallback(function(s){
    _setCurrentScreen(s);
    if(s==="welcome"||s==="placement")return;
    pushUrl(s==="dashboard"?"/":`/${s}`);
  },[]);
  const[name,setName]=useState("");
  const[stats,setStats]=useState(ds);
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
  const { dchlA, sDchlA, dchlSl, sDchlSl } = useDaily();
  const[pfTab,sPfTab]=useState("sing");const[pfGender,sPfGender]=useState("f");const[pfMode,sPfMode]=useState("learn");
  const[pfQ,sPfQ]=useState([]);const[pfI,sPfI]=useState(0);const[pfS,sPfS]=useState(0);const[pfA,sPfA]=useState(false);const[pfSl,sPfSl]=useState(-1);const[pfO,sPfO]=useState([]);const[pfCase,sPfCase]=useState("");const[pfCaseA,sPfCaseA]=useState(false);const[pfCaseSl,sPfCaseSl]=useState(-1);
  const { famData, setFamData, famMembers, setFamMembers, famLoading, setFamLoading, famName, setFamName, famCode, setFamCode, famErr, setFamErr, famTab, setFamTab } = useFamily();
  const[tab,_setTab]=useState("home");
  const TAB_PATHS={home:"/",learn:"/learn",practice:"/practice",croatia:"/croatia",profile:"/profile"};
  const setTab=useCallback(function(t){_setTab(t);pushUrl(TAB_PATHS[t]||"/");},[]);
  const[tnVerb,setTnVerb]=useState(0);const[tnTense,setTnTense]=useState("present");const[tnGender,setTnGender]=useState("m");const[tnMode,setTnMode]=useState("learn");const[tnQ,setTnQ]=useState([]);const[tnI,setTnI]=useState(0);const[tnS,setTnS]=useState(0);const[tnA,setTnA]=useState(false);const[tnSl,setTnSl]=useState(-1);const[tnO,setTnO]=useState([]);
  const[mapCat,setMapCat]=useState("all");const[mapSel,setMapSel]=useState(null);
  const[rpIdx,setRpIdx]=useState(0);const[rpLine,setRpLine]=useState(0);const[rpShow,setRpShow]=useState(false);
  const[rcIdx,setRcIdx]=useState(0);const[rcServ,setRcServ]=useState(4);const[rcTimer,setRcTimer]=useState(null);const[rcTimerVal,setRcTimerVal]=useState(0);
  const { jWords, setJWords, jIn, setJIn, jEn, setJEn } = useJournal();
  const{darkMode,setDarkMode,favs,setFavs,toggleFav,isFav}=usePreferences();
  const{srchQ,setSrchQ,srchR,srchOpen,setSrchOpen,doSearch}=useSearch();
  const[onboarded,setOnboarded]=useState(function(){return localStorage.getItem("onboarded")==="true"});
  const[showCelebration,setShowCelebration]=useState(false);const[celebXP,setCelebXP]=useState(0);
  const[comebackBonus,setComebackBonus]=useState(false);
  const[streakMilestone,setStreakMilestone]=useState(null); // number (7/30/50/100/365) or null
  const[pendingJoinCode,setPendingJoinCode]=useState(()=>{try{return new URLSearchParams(window.location.search).get('join')||null;}catch{return null;}});
  // toggleFav, isFav → usePreferences hook | doSearch → useSearch hook
  // Fix 3: stable reference — prevents HomeTab useMemo from re-running every render
  const getWeekStats=useCallback(function(){const sr=getSR();const weak=Object.values(sr).filter(function(v){return v.w>v.r}).length;const strong=Object.values(sr).filter(function(v){return v.r>v.w}).length;return{lessons:stats.lc,grammar:stats.gc,streak:getStreak().count,weak:weak,strong:strong}},[stats]);
  // Fix 2: single helper replaces 4 copy-pasted data-hydration blocks across auth flows
  const applyRemoteProgress=useCallback(function(fp){
    if(!fp)return;
    if(fp.onboarded){localStorage.setItem("onboarded","true");setOnboarded(true);}
    if(fp.sr)saveSR(fp.sr);
    if(fp.streak)localStorage.setItem("uStreak",JSON.stringify(fp.streak));
    if(fp.favs){localStorage.setItem("uFavs",JSON.stringify(fp.favs));setFavs(fp.favs);}
    if(fp.journal){localStorage.setItem("uJournal",JSON.stringify(fp.journal));setJWords(fp.journal);}
    const _arDay=new Date().toISOString().slice(0,10);
    if(fp.dc&&fp.dc.day===_arDay){const _arAns=fp.dc.answered||[false,false,false];const _arSel=Array.isArray(fp.dc.selected)&&typeof fp.dc.selected[0]==="string"?fp.dc.selected:["","",""];sDchlA(_arAns);sDchlSl(_arSel);localStorage.setItem("dcDay3",JSON.stringify({day:_arDay,answered:_arAns,selected:_arSel}));}
    if(fp.cooldown){const _arT=new Date().toISOString().slice(0,10);let _arCd={};try{_arCd=JSON.parse(localStorage.getItem("xpCooldown")||"{}")}catch(e){}for(const _arCk in fp.cooldown){if(fp.cooldown[_arCk]===_arT)_arCd[_arCk]=fp.cooldown[_arCk];}localStorage.setItem("xpCooldown",JSON.stringify(_arCd));}
  },[setFavs,setJWords]);
  const { tDir, setTDir: sTDir, tIn, setTIn: sTIn, tOut, tL, doTr } = useTranslator();
  const[t1k,sT1k]=useState(null);
  const[hIdx,sHIdx]=useState(0);
  const[evM,sEvM]=useState(new Date().getMonth()+1);
  const[showXP,setShowXP]=useState(false);const[xpA,setXpA]=useState(0);const[nB,setNB]=useState(null);const[sB,setSB]=useState(false);
  const _initialPath=useRef(window.location.pathname);
  const _unloadRef=useRef({});
  const[_syncReady,_setSyncReady]=useState(false);
  const[showBackupBanner,setShowBackupBanner]=useState(false);
  // ── useAuth — must be declared BEFORE the useEffects that reference
  // authScreen/authUser in their dependency arrays, to avoid TDZ errors
  // in the minified production bundle.
  const {
    authScreen, setAuthScreen,
    authUser,
    authEmail, setAuthEmail,
    pw, setPw, pc, setPc,
    displayName, setDisplayName,
    sp, setSp2,
    rpEm, setRpEm,
    authError, setAuthError,
    authLoading,
    doReg, doLog, doOut, doReset,
  } = useAuth({
    onSignedIn({ user, progress, isNew, isHydrate }) {
      if (isHydrate) {
        if (progress) { setStats({...ds,...(progress.stats||{})}); if (progress.name) setName(progress.name); }
        return;
      }
      if (progress) {
        setName(progress.name || user.d);
        setStats({...ds,...(progress.stats||{})});
        if (!isNew) _goPostAuth(progress.cp || (progress.stats && (progress.stats.xp > 0 || progress.stats.lc > 0)));
      } else { setName(user.d); }
      if (isNew) setScr('welcome');
    },
    onSignedOut() { setStats(ds); setScr('welcome'); setName(''); setFamData(null); setFamMembers([]); },
    applyRemoteProgress,
    setFamData,
    setSyncReady: _setSyncReady,
    ds,
  });
  // Keep _unloadRef current on every render so beforeunload always flushes latest state
  _unloadRef.current={authUser,stats,name,authScreen,favs,jWords};
  useEffect(()=>{
    if(authScreen!=="app")return;
    const lastSeen=localStorage.getItem("lastSeen");const now=Date.now();
    if(lastSeen&&stats.xp>0){const diff=now-parseInt(lastSeen,10);if(diff>86400000&&diff<7*86400000){setComebackBonus(true);setTimeout(()=>setComebackBonus(false),4000);}}
    localStorage.setItem("lastSeen",String(now));
    if(pendingJoinCode){
      try{const u=new URL(window.location.href);u.searchParams.delete('join');window.history.replaceState({},'',u.pathname);}catch(_){}
      setFamCode(pendingJoinCode);setFamTab("join");
      setTimeout(()=>setScr("leaderboard"),600);
      setPendingJoinCode(null);
    }
    checkNameDay(name);
  },[authScreen]);// eslint-disable-line
  useEffect(()=>{if(!authUser||authScreen!=="app")return;const _nd=new Date();const _dcDay=_nd.getFullYear()+'-'+String(_nd.getMonth()+1).padStart(2,'0')+'-'+String(_nd.getDate()).padStart(2,'0');const _saveData={name,stats,cp:currentScreen!=="welcome"&&currentScreen!=="placement",onboarded:localStorage.getItem("onboarded")==="true",savedAt:Date.now(),sr:getSR(),streak:getStreak(),favs,journal:jWords,dc:{day:_dcDay,answered:dchlA,selected:dchlSl},cooldown:(function(){try{return JSON.parse(localStorage.getItem("xpCooldown")||"{}")}catch{return{}}})()};localStorage.setItem("uP_"+authUser.u,JSON.stringify(_saveData));touchSession();if(_syncReady)fbSaveProgress(authUser.u,_saveData);},[stats,currentScreen,name,authUser,authScreen,jWords,favs,dchlA,dchlSl,_syncReady]);
  useEffect(()=>{if(authScreen!=="app")return;const iv=setInterval(()=>{if(isSessionExpired()){doOut();}},5*60*1000);return()=>clearInterval(iv)},[authScreen]);// eslint-disable-line
  useEffect(()=>{if(authScreen!=="app")return;const h=()=>touchSession();window.addEventListener("click",h);window.addEventListener("touchstart",h);window.addEventListener("keydown",h);return()=>{window.removeEventListener("click",h);window.removeEventListener("touchstart",h);window.removeEventListener("keydown",h)}},[authScreen]);
  useEffect(()=>{if(!_syncReady||authScreen!=="app"||!authUser)return;if(!localStorage.getItem("fbBackupConfirmed")){setShowBackupBanner(true);}},[_syncReady,authScreen,authUser]);
  useEffect(()=>{if(authScreen!=="app"||!authUser)return;function fetchIfNewer(){fbLoadProgress(authUser.u).then(function(fp){if(!fp)return;const lp=gP(authUser.u);const fpTs=fp._fbUpdated||fp.savedAt||0;const lpTs=(lp&&lp.savedAt)||0;if(fpTs>lpTs){sP(authUser.u,fp);setStats({...ds,...(fp.stats||{})});if(fp.name)setName(fp.name);applyRemoteProgress(fp);}}).catch(function(){/* network error — keep local state */})}// Fetch immediately on app load so returning users always get the latest Firebase data
  fetchIfNewer();function onVisible(){if(document.visibilityState==="visible")fetchIfNewer();}function onFocus(){fetchIfNewer();}document.addEventListener("visibilitychange",onVisible);window.addEventListener("focus",onFocus);const pollId=setInterval(function(){if(document.visibilityState==="visible")fetchIfNewer();},180000);return()=>{document.removeEventListener("visibilitychange",onVisible);window.removeEventListener("focus",onFocus);clearInterval(pollId);}},[authScreen,authUser]);
  // Auto-save on every lesson completion (stats.lc or stats.ct length changes).
  // Lesson components only call setStats — they never write to localStorage or Firebase.
  // This effect fires immediately (no debounce) so progress is persisted even if the
  // user closes the browser right after finishing a lesson.
  useEffect(()=>{if(!authUser||authScreen!=="app"||stats.lc===0)return;doSyncNow();},[stats.lc,stats.ct?.length,stats.gc]);// eslint-disable-line react-hooks/exhaustive-deps
  // Synchronous localStorage flush on browser close / tab kill.
  // Firebase is async so this is the only way to guarantee no data loss on close.
  useEffect(()=>{
    const onUnload=()=>{
      const{authUser:u,stats:st,name:nm,authScreen:as}=_unloadRef.current;
      if(!u||as!=="app")return;
      const _nd=new Date();const _dcDay=_nd.getFullYear()+'-'+String(_nd.getMonth()+1).padStart(2,'0')+'-'+String(_nd.getDate()).padStart(2,'0');
      try{const _d={name:nm,stats:st,cp:true,onboarded:localStorage.getItem("onboarded")==="true",savedAt:Date.now(),sr:getSR(),streak:getStreak(),favs:_unloadRef.current.favs||[],journal:_unloadRef.current.jWords||[],dc:{day:_dcDay},cooldown:(function(){try{return JSON.parse(localStorage.getItem("xpCooldown")||"{}")}catch{return{}}})()};localStorage.setItem("uP_"+u.u,JSON.stringify(_d));}catch(_){}
    };
    window.addEventListener("beforeunload",onUnload);
    return()=>window.removeEventListener("beforeunload",onUnload);
  },[]);// eslint-disable-line react-hooks/exhaustive-deps
  // ═══ BROWSER BACK BUTTON SUPPORT (popstate) ═══
  useEffect(function(){
    // Mark baseline so we can detect when back would exit the app
    window.history.replaceState({_ad:0},"",window.location.pathname);
    const tabByPath={"/":"home","/learn":"learn","/practice":"practice","/croatia":"croatia","/profile":"profile"};
    // Maps every screen name to its parent tab so nav bar stays in sync
    const screenTab={
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
      clitic:"practice",numcases:"practice",imperative:"practice",neggen:"practice",
      collocations:"practice",wordfamilies:"practice",dictation:"practice",
      proncontrast:"practice",dialogue:"practice",cefrtest:"practice",slang:"practice",
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
      const p=window.location.pathname;
      // Tab-root paths → restore dashboard + correct tab
      if(tabByPath[p]!==undefined){_setCurrentScreen("dashboard");_setTab(tabByPath[p]);return;}
      const s=p.slice(1);
      // Unknown or auth paths → safe fallback to home dashboard
      if(!s||s==="welcome"||s==="placement"){_setCurrentScreen("dashboard");_setTab("home");window.history.replaceState({_ad:0},"","/");return;}
      // Restore screen + sync nav tab
      _setCurrentScreen(s);
      if(screenTab[s])_setTab(screenTab[s]);
    }
    window.addEventListener("popstate",onPopState);
    return function(){window.removeEventListener("popstate",onPopState)};
  },[]); 
  const award=useCallback((amt,celebrate)=>{
    if(curEx&&!canEarnXP(curEx)){setXpA(0);setShowXP(true);setTimeout(()=>setShowXP(false),2000);return}
    if(curEx)markExerciseDone(curEx);
    setXpA(amt);setShowXP(true);
    setStats(s=>{const n={...s,xp:s.xp+amt};const nb=BADGES.filter(b=>!s.badges.includes(b.id)&&b.r(n));if(nb.length){n.badges=[...s.badges,...nb.map(b=>b.id)];setTimeout(()=>{setNB(nb[0]);setSB(true);setTimeout(()=>setSB(false),3000)},600)}return n});
    setTimeout(()=>setShowXP(false),1500);
    if(celebrate&&amt>0){setCelebXP(amt);setTimeout(()=>setShowCelebration(true),400)}
    const sr=updateStreak();
    if(sr.milestone)setTimeout(()=>setStreakMilestone(sr.milestone),800);
    earnFreeze();
  },[curEx]);
  function _goPostAuth(hasProgress){
    if(!hasProgress){setScr("welcome");return}
    const ip=_initialPath.current;
    _initialPath.current='/';
    const tabByPath={'/learn':'learn','/practice':'practice','/croatia':'croatia','/profile':'profile'};
    if(tabByPath[ip]){_setTab(tabByPath[ip]);_setCurrentScreen("dashboard");return}
    setScr("dashboard");
  }
  const doSyncNow=useCallback(async function(){if(!authUser)return false;const _nd=new Date();const _dcDay=_nd.getFullYear()+'-'+String(_nd.getMonth()+1).padStart(2,'0')+'-'+String(_nd.getDate()).padStart(2,'0');const _data={name,stats,cp:true,onboarded:localStorage.getItem("onboarded")==="true",savedAt:Date.now(),sr:getSR(),streak:getStreak(),favs,journal:jWords,dc:{day:_dcDay,answered:dchlA,selected:dchlSl},cooldown:(function(){try{return JSON.parse(localStorage.getItem("xpCooldown")||"{}")}catch{return{}}})()};localStorage.setItem("uP_"+authUser.u,JSON.stringify(_data));const result=await fbSaveProgress(authUser.u,_data).catch(function(){return{ok:false}});return result&&result.ok!==false;},[authUser,name,stats,favs,jWords,dchlA,dchlSl]);
  function goBack(){
    if(curEx)markExerciseDone(curEx);
    sCurEx("");
    // Only use browser back if we have an in-app history entry to return to.
    // history.state._ad === 0 means we're at the app baseline — going back
    // would exit the SPA entirely. Instead, fall back to the home dashboard.
    const depth=(window.history.state&&window.history.state._ad)||0;
    if(depth>0){window.history.back();}
    else{_setCurrentScreen("dashboard");_setTab("home");window.history.replaceState({_ad:0},"","/");}
  }
  const level=useMemo(()=>lvl(stats.xp),[stats.xp]);
  // Fix 1: these hooks must live above all early returns (Rules of Hooks)
  const badges=useMemo(()=>({home:dchlA.filter(v=>!v).length,learn:0,practice:0,croatia:0,profile:0}),[dchlA]);
  const onCloseCelebration=useCallback(()=>setShowCelebration(false),[]);
  const allCats=ALL_CATS;
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
    return <LoginScreen authScreen={authScreen} authError={authError} authLoading={authLoading} authEmail={authEmail} pw={pw} pc={pc} displayName={displayName} sp={sp} setAuthScreen={setAuthScreen} setAuthError={setAuthError} setAuthEmail={setAuthEmail} setPw={setPw} setPc={setPc} setDisplayName={setDisplayName} setSp2={setSp2} setRpEm={setRpEm} doLog={doLog} doReg={doReg} />;
  }
  // ═══ RESET PASSWORD SCREEN ═══
  if(authScreen==="reset"){
    return <ResetPassword authError={authError} authLoading={authLoading} rpEm={rpEm} setAuthScreen={setAuthScreen} setAuthError={setAuthError} setRpEm={setRpEm} doReset={doReset} />;
  }
    // ═══ MAIN APP RENDER ═══
  function doSidebarSearch(){if(srchQ.trim()){doSearch(srchQ);setSrchOpen(true);}}
  const ctxValue={authScreen,authUser,name,setName,doOut,stats,setStats,level,award,darkMode,setDarkMode,favs,toggleFav,isFav,setScr,goBack,tab,setTab,jWords,setJWords,famData,setFamData,sCurEx};
  return (
    <AppContext.Provider value={ctxValue}>
    <div className={darkMode?"dark":""} style={darkMode?BG_DARK:BG_LIGHT}>
      {authScreen==="app"&&currentScreen!=="welcome"&&currentScreen!=="placement"&&<Sidebar tab={tab} setTab={setTab} setScr={setScr} name={name} level={level} st={stats} darkMode={darkMode} setDarkMode={setDarkMode} badges={badges} srchQ={srchQ} setSrchQ={setSrchQ} onSearch={doSidebarSearch} />}
      <div className="app-content">
      <Suspense fallback={<div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh"}}><div style={{textAlign:"center"}}><div style={{display:"flex",justifyContent:"center",gap:0,marginBottom:16,borderRadius:3,overflow:"hidden",width:54,margin:"0 auto 16px"}}><div style={{height:6,flex:1,background:"#D4002D"}}/><div style={{height:6,flex:1,background:"#F5F5F5"}}/><div style={{height:6,flex:1,background:"#003DA5"}}/></div><div style={{fontSize:13,fontWeight:800,color:"var(--subtext)",letterSpacing:".1em",textTransform:"uppercase",opacity:.6}}>Naša Hrvatska</div></div></div>}>
      <XPPopup showXP={showXP} xpA={xpA} />
      <BadgeToast show={sB} badge={nB} />
      {showCelebration&&<CelebrationModal xp={celebXP} onClose={onCloseCelebration} />}
      {streakMilestone&&<StreakMilestoneModal days={streakMilestone} onClose={()=>setStreakMilestone(null)} />}
      {!onboarded&&authScreen==="app"&&currentScreen!=="welcome"&&currentScreen!=="placement"&&<OnboardingTour onDone={()=>setOnboarded(true)} />}
      {comebackBonus&&<div style={{position:"fixed",top:80,left:"50%",transform:"translateX(-50%)",zIndex:9500,background:"linear-gradient(135deg,#f59e0b,#d97706)",color:"#fff",borderRadius:16,padding:"14px 24px",boxShadow:"0 8px 32px rgba(0,0,0,.2)",fontSize:14,fontWeight:800,display:"flex",alignItems:"center",gap:10,animation:"slideUp .4s ease"}}>🔥 Welcome back! Keep your streak alive!</div>}
      {showBackupBanner&&<div role="status" aria-live="polite" style={{position:"fixed",bottom:90,left:"50%",transform:"translateX(-50%)",zIndex:9600,width:"calc(100% - 32px)",maxWidth:420,background:"linear-gradient(135deg,#0e7490,#164e63)",color:"#fff",borderRadius:20,padding:"18px 20px 18px 20px",boxShadow:"0 8px 40px rgba(14,116,144,.45)",animation:"slideUp .4s cubic-bezier(.34,1.56,.64,1)"}}>
        <div style={{display:"flex",alignItems:"flex-start",gap:14}}>
          <div style={{fontSize:36,flexShrink:0,lineHeight:1}}>🛡️</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:16,fontWeight:900,marginBottom:4,lineHeight:1.2}}>Your progress is now protected!</div>
            <div style={{fontSize:13,opacity:.88,lineHeight:1.5,fontWeight:500}}>Everything you learn is now automatically backed up to the cloud. You will never lose your progress again — on any device, any browser, ever.</div>
          </div>
          <button onClick={()=>{localStorage.setItem("fbBackupConfirmed","true");setShowBackupBanner(false);}} aria-label="Dismiss" style={{background:"rgba(255,255,255,.2)",border:"none",color:"#fff",borderRadius:10,width:32,height:32,fontSize:18,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>✕</button>
        </div>
        <div style={{marginTop:12,display:"flex",alignItems:"center",gap:8}}>
          <div style={{flex:1,height:3,borderRadius:3,background:"rgba(255,255,255,.2)",overflow:"hidden"}}><div style={{height:"100%",width:"100%",background:"rgba(255,255,255,.7)",borderRadius:3,animation:"pulse 2s ease-in-out infinite"}}/></div>
          <div style={{fontSize:11,opacity:.75,fontWeight:700,whiteSpace:"nowrap"}}>✓ Cloud sync active</div>
        </div>
      </div>}
      {currentScreen==="welcome" && <WelcomeScreen name={name} au={authUser} st={stats} setScr={setScr} setName={setName} sPq={sPq} sPi={sPi} sPs={sPs} sPa={sPa} sPx={sPx} />}
      {currentScreen==="placement" && <PlacementTest pq={pq} pi={pi} ps={ps} pa={pa} px={px} sPi={sPi} sPs={sPs} sPa={sPa} sPx={sPx} setScr={setScr} setSt={setStats} />}
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
          name={name} level={level} st={stats}
          tDir={tDir} sTDir={sTDir} tIn={tIn} sTIn={sTIn} tOut={tOut} tL={tL} doTr={doTr}
          dchlA={dchlA} sDchlA={sDchlA} dchlSl={dchlSl} sDchlSl={sDchlSl}
          getWeekStats={getWeekStats}
          award={award}
          setTab={setTab} setScr={setScr} sCurEx={sCurEx}
          allCats={allCats} sh={sh}
          launchPathItem={launchPathItem}
          syncReady={_syncReady} onSyncNow={doSyncNow} authUser={authUser}
        /></ScreenErrorBoundary>}
        {// ═══ TAB: LEARN ═══
        tab==="learn"&&<ScreenErrorBoundary name="LearnTab"><LearnTab
          allCats={allCats} icons={icons} setScr={setScr} sCurEx={sCurEx} st={stats}
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
          name={name} au={authUser} level={level} st={stats} favs={favs}
          darkMode={darkMode} setDarkMode={setDarkMode}
          setScr={setScr} doOut={doOut}
          syncReady={_syncReady} onSyncNow={doSyncNow}
        /></ScreenErrorBoundary>}
      </div>}
      {// ═══ MODAL VERBS ═══
      currentScreen==="modal"&&<ModalScreen goBack={goBack} award={award} setSt={setStats} />}
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
      currentScreen==="padezi"&&<PadeziScreen goBack={goBack} award={award} setSt={setStats} />}
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
      currentScreen==="leaderboard"&&<Leaderboard goBack={goBack} authUser={authUser} name={name} stats={stats} famData={famData} setFamData={setFamData} famMembers={famMembers} setFamMembers={setFamMembers} famLoading={famLoading} setFamLoading={setFamLoading} famName={famName} setFamName={setFamName} famCode={famCode} setFamCode={setFamCode} famErr={famErr} setFamErr={setFamErr} famTab={famTab} setFamTab={setFamTab} />}
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
      {currentScreen==="lyrics"&&<LyricsScreen goBack={goBack} award={award} />}
      {currentScreen==="aiconvo"&&<AIConversation goBack={goBack} setScr={setScr} sCurEx={sCurEx} setJWords={setJWords} />}
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
      currentScreen==="journal"&&<VocabJournal goBack={goBack} />}
      {// ═══ LEARNING PATH ═══
      currentScreen==="learnpath"&&<LearnPath st={stats} setScr={setScr} goBack={goBack} />}
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
      currentScreen==="kings"&&<KingsScreen goBack={goBack} award={award} setSt={setStats} />}
      {// ═══ CONJUGATION DRILL ═══
      currentScreen==="conjdrill"&&<ConjugationDrill goBack={goBack} award={award} setSt={setStats} />}
      {// ═══ ZNAM - NE ZNAM ═══
      currentScreen==="znam"&&<ZnamGame goBack={goBack} award={award} />}
      {// ═══ COLORS & GENDER ═══
      currentScreen==="boje"&&<BojeGame goBack={goBack} award={award} />}
      {// ═══ MATCH GAME ═══
      currentScreen==="match"&&<MatchGame mp={mp} mm={mm} msl={msl} gph={gph} gsc={gsc} sMm={sMm} sMsl={sMsl} sGsc={sGsc} sGph={sGph} goBack={goBack} award={award} />}
      {// ═══ WORD SPRINT ═══
      currentScreen==="wordsprint"&&<WordSprint sh={sh} award={award} goBack={goBack} />}
      {// ═══ SPEAKING / PRONUNCIATION ═══
      currentScreen==="speaking"&&<SpeakingScreen sw={sw} si={si} sx={sx} sr={sr} ssc={ssc} sSr={sSr} sSx={sSx} sSw={sSw} sSsc={sSsc} goBack={goBack} award={award} setSt={setStats} />}
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
      {currentScreen==="clitic"&&<CliticDrill goBack={goBack} award={award} />}
      {currentScreen==="numcases"&&<NumbersCasesDrill goBack={goBack} award={award} />}
      {currentScreen==="imperative"&&<ImperativeDrill goBack={goBack} award={award} />}
      {currentScreen==="neggen"&&<NegationGenDrill goBack={goBack} award={award} />}
      {currentScreen==="collocations"&&<CollocationsGame goBack={goBack} award={award} />}
      {currentScreen==="wordfamilies"&&<WordFamilies goBack={goBack} award={award} />}
      {currentScreen==="dictation"&&<DictationScreen goBack={goBack} award={award} />}
      {currentScreen==="proncontrast"&&<PronunciationContrast goBack={goBack} award={award} />}
      {currentScreen==="dialogue"&&<DialogueSim goBack={goBack} award={award} />}
      {currentScreen==="cefrtest"&&<CefrTest goBack={goBack} award={award} />}
      {currentScreen==="slang"&&<SlangScreen goBack={goBack} award={award} />}
      {// ═══ VOCABULARY LESSON ═══
      currentScreen==="lesson"&&<LessonScreen
        lt={lt} li={li} lx={lx} ls={ls} lp={lp} la={la} lsl={lsl} qi={qi} icons={icons}
        sLi={sLi} sLx={sLx} sLs={sLs} sLp={sLp} sLa={sLa} sLsl={sLsl} sQi={sQi}
        goBack={goBack} award={award} setSt={setStats}
      />}
      {// ═══ GRAMMAR ═══
      currentScreen==="grammar"&&<GrammarScreen
        gl={gl||GRAM.beginner[0]} gp={gp} gx={gx} gs={gs} ga={ga} gsl={gsl}
        sGp={sGp} sGx={sGx} sGs={sGs} sGa={sGa} sGsl={sGsl}
        goBack={goBack} award={award} setSt={setStats}
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
        goBack={goBack} setScr={setScr} award={award} setSt={setStats}
      />}
      {// ═══ BADGES ═══
      currentScreen==="badges"&&<BadgesScreen badges={stats.badges} goBack={goBack} />}
      {// ═══ PROFILE ═══
      currentScreen==="profile"&&<ProfileScreen
        name={name} level={level} st={stats} authUser={authUser}
        goBack={goBack} doOut={doOut}
      />}
      {currentScreen==="certificate"&&<CertificateScreen name={name} level={level} st={stats} goBack={goBack} />}
      {(authScreen==="app"&&currentScreen!=="welcome"&&currentScreen!=="placement") && <TabBar tab={tab} setTab={setTab} setScr={setScr} badges={badges} />}
      <OfflineBanner />
      </Suspense>
      </div>
    </div>
    </AppContext.Provider>
  );
}
export default App;
