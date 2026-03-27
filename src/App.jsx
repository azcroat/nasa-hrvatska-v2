import React, { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from "react";
// Q-6: React Router — useNavigate replaces pushUrl(), useLocation drives tab sync
import { useNavigate, useLocation } from "react-router-dom";
import { _fbReady, H, Bar, Spk, V, PADEZI, PROVERBS, HIST_FACTS, MEDIA, MAPPLACES, BADGES, LEARN_PATH, REFLEXIVE, SCENES, FILL_STORIES, PRONOUNCASE, GENDERDRILL, SENTBUILD, VERBDRILL, VBPERSONS, TENSEFLIP, RIDDLES, LOGICQUIZ, ORDINALS, ORDQUIZ, RELPRON, EMOGENDER, QWORDS, NEGATION, COLORAGREE, SIBIL, PROFGENDER, COMPARE, COMPQUIZ, FUTURE, RESTCONV, POSSESS, ADJOPPOSITES, CITYLOC, AKUFOOD, AKUCLOTHES, CONVMATCH, TOP100, HISTORY, EVENTS, MODAL, GRAM, PLACE, READ, ALPHA, ZNAM, BOJE, CONJ, UNJUMBLE, IDIOMS, PREPS, KINGS, LISTEN, STORIES, NUMTIME, ASPECT, FALSEFR, PREPDRILL, DECL, BRZALICE, DIALECTS, DIMWORDS, WORDFORM, COLORQUIRK, PADEZI_FULL, SCHOOL, TEXTING, FRIENDS, FOODORDER, TRANSPORT, EMERGENCY, FOOTBALL, POPCULTURE, PRACTICAL, REGIONS, TENSES, GROCERY, RECIPES, ROLEPLAY, BG_LIGHT, BG_DARK, CONDITIONAL, FORMAL_REGISTER, IMPERSONAL, TECH_VOC, BUREAUCRATIC, initFirebase, gP, sP, lP, gS, sS, cS, touchSession, isSessionExpired, isValidEmail, fbSaveProgress, fbWatchProgress, fbRegister, fbLogin, fbLogout, fbResetPassword, friendlyError, generateFamilyCode, getLocalFamily, saveLocalFamily, fbCreateFamily, fbJoinFamily, fbGetFamilyMembers, fbLeaveFamily, fbLoadUserFamily, fbOnAuthStateChanged, loadVoices, getBestVoice, stopAudio, speakAzure, speakSynth, speak, speakSlow, speakEN, sh, lvl, lXP, lXPgain, nXP, getSR, saveSR, srMark, getStreak, updateStreak, getStreakFreezes, earnFreeze, spendFreeze, getProverbOfDay, getDailyChallenge, getHistFact, PITCH_ACCENT, SHADOWING, ASPECT_PAIRS, getDueReviews, shMemo, shuffleArr, buildSearchIndex, bootstrapMistakesFromSRS, recordJourneyMilestone } from "./data.jsx";
import AppContext from "./context/AppContext.jsx";
import ScreenErrorBoundary from "./components/shared/ScreenErrorBoundary.jsx";
import { usePreferences } from "./hooks/usePreferences.js";
import { useSearch } from "./hooks/useSearch.js";
import { useAuth } from "./hooks/useAuth.js";
import { useFamily } from "./hooks/useFamily.js";
import { useJournal } from "./hooks/useJournal.js";
import { useDaily } from "./hooks/useDaily.js";
import { useTranslator } from "./hooks/useTranslator.js";
import { useNotifications, checkNameDay, scheduleStreakReminder } from "./hooks/useNotifications.js";
// Always-needed: auth + core UI (eager)
import LoginScreen from "./components/auth/LoginScreen.jsx";
import ResetPassword from "./components/auth/ResetPassword.jsx";
import XPPopup from "./components/shared/XPPopup.jsx";
import BadgeToast from "./components/shared/BadgeToast.jsx";
import TabBar from "./components/shared/TabBar.jsx";
import Sidebar from "./components/shared/Sidebar.jsx";
import CelebrationModal from "./components/shared/CelebrationModal.jsx";
import StreakMilestoneModal from "./components/shared/StreakMilestoneModal.jsx";
import CeremonyModal from "./components/shared/CeremonyModal.jsx";
import OnboardingTour from "./components/shared/OnboardingTour.jsx";
import OfflineBanner from "./components/shared/OfflineBanner.jsx";
import WelcomeScreen from "./components/home/WelcomeScreen.jsx";
import CroatianGrb from "./components/shared/CroatianGrb.jsx";
import CookieConsent from "./components/shared/CookieConsent.jsx";
import TermsOfService from "./components/shared/TermsOfService.jsx";
import AdminDashboard from "./components/admin/AdminDashboard.jsx";
import PlacementTest from "./components/home/PlacementTest.jsx";
import NewPlacementTest from "./components/auth/PlacementTest.jsx";
import { LESSONS as ANIM_LESSONS } from "./data/lessons.js";
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
const ContactScreen = lazyWithReload(() => import("./components/profile/ContactScreen.jsx"));
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
const ListeningPath = lazyWithReload(() => import("./components/practice/ListeningPath.jsx"));
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
const MyWordsScreen = lazyWithReload(() => import("./components/practice/MyWordsScreen.jsx"));
const Leaderboard = lazyWithReload(() => import("./components/profile/Leaderboard.jsx"));
const LeaderboardScreen = lazyWithReload(() => import("./components/shared/LeaderboardScreen.jsx"));
const ProfileFriendsScreen = lazyWithReload(() => import("./components/profile/FriendsScreen.jsx"));
const CertificateScreen = lazyWithReload(() => import("./components/profile/CertificateScreen.jsx"));
const MistakesScreen = lazyWithReload(() => import("./components/practice/MistakesScreen.jsx"));
const AnalyticsScreen = lazyWithReload(() => import("./components/profile/AnalyticsScreen.jsx"));
const GrammarReference = lazyWithReload(() => import("./components/shared/GrammarReference.jsx"));
const BakaSummer = lazyWithReload(() => import("./components/croatia/BakaSummer.jsx"));
const CroatiaToday = lazyWithReload(() => import("./components/croatia/CroatiaToday.jsx"));
const SurvivalDinner = lazyWithReload(() => import("./components/croatia/SurvivalDinner.jsx"));
const ClozeEngine = lazyWithReload(() => import("./components/practice/ClozeEngine.jsx"));
const GrammarConstellation = lazyWithReload(() => import("./components/learn/GrammarConstellation.jsx"));
const GrammarExplainer = lazyWithReload(() => import("./components/learn/GrammarExplainer.jsx"));
const CaseTransformer = lazyWithReload(() => import("./components/learn/CaseTransformer.jsx"));
const VocabScenes = lazyWithReload(() => import("./components/learn/VocabScenes.jsx"));
const AnimatedLesson = lazyWithReload(() => import("./components/learn/AnimatedLesson.jsx"));
const GrammarReader = lazyWithReload(() => import("./components/learn/GrammarReader.jsx"));
const KaficScreen = lazyWithReload(() => import("./components/croatia/KaficScreen.jsx"));
const DiasporaNote = lazyWithReload(() => import("./components/croatia/DiasporaNote.jsx"));
const TiViScreen = lazyWithReload(() => import("./components/learn/TiViScreen.jsx"));
const GrammarVideos = lazyWithReload(() => import("./components/learn/GrammarVideos.jsx"));
const LifeEventsScreen = lazyWithReload(() => import("./components/croatia/LifeEventsScreen.jsx"));
const CivicScreen = lazyWithReload(() => import("./components/croatia/CivicScreen.jsx"));
const EasterScreen = lazyWithReload(() => import("./components/croatia/EasterScreen.jsx"));
const PostcardScreen = lazyWithReload(() => import("./components/croatia/PostcardScreen.jsx"));
const StoryModeScreen = lazyWithReload(() => import("./components/croatia/StoryModeScreen.jsx"));
const HeritageStoryScreen = lazyWithReload(() => import("./components/croatia/HeritageStoryScreen.jsx"));
const CroatianNewsScreen = lazyWithReload(() => import("./components/croatia/CroatianNewsScreen.jsx"));
const PhraseOfDayScreen = lazyWithReload(() => import("./components/croatia/PhraseOfDayScreen.jsx"));

// Module-level constants — defined once, not recreated on every render
const DS={xp:0,str:1,diff:"beginner",lc:0,pf:0,gc:0,sp:0,de:0,rc:0,authLoading:0,mv:0,hi:0,rs:[],ct:[],badges:[]};
// Fix 4: computed once at module level — Object.keys(V) is deterministic and expensive to repeat
const ALL_CATS=Object.keys(V);
const ICONS={greetings:"👋",numbers:"🔢",family:"👨‍👩‍👧‍👦",food:"🍕",animals:"🐾",body:"🦴","body & face":"🦴",colors:"🎨",home:"🏠","home & rooms":"🏠",clothing:"👔",weather:"☀️","weather & seasons":"☀️",places:"📍",transport:"🚗",verbs:"💬",adjectives:"📏",time:"📅","time & calendar":"📅",months:"🗓️",directions:"🧭",emotions:"💭",professions:"💼",restaurant:"🍽️",shopping:"🛍️",travel:"✈️",health:"🏥",questions:"❓",conjunctions:"🔗",culture:"🏛️","daily routine":"🌅","in the classroom":"📖","commands at home":"🏡","fairy tales":"📜",hobbies:"🎯",zagreb:"🏙️",opposites:"🔄",comparatives:"📊",fruits:"🍎",vegetables:"🥦",sports:"⚽",holidays:"🎄",personality:"😊"};

// Q-6: TAB_PATHS still used for URL construction — kept at module level
const TAB_PATHS={home:"/",learn:"/learn",practice:"/practice",croatia:"/croatia",profile:"/profile"};
const PATH_TO_TAB={"/":"home","/learn":"learn","/practice":"practice","/croatia":"croatia","/profile":"profile"};
// XP cooldown helpers — pure localStorage functions, defined outside component
// so they never cause stale-closure issues in useCallback
function localDateStr(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function canEarnXP(exerciseId){
  try{const cd=JSON.parse(localStorage.getItem("xpCooldown")||"{}");return cd[exerciseId]!==localDateStr()}catch{return true}
}
function markExerciseDone(exerciseId){
  try{const cd=JSON.parse(localStorage.getItem("xpCooldown")||"{}");const today=localDateStr();cd[exerciseId]=today;const clean={};for(const k in cd){if(cd[k]===today)clean[k]=cd[k]}localStorage.setItem("xpCooldown",JSON.stringify(clean))}catch(e){}
}

function App(){
  useNotifications();
  // Q-6: React Router hooks — replace custom pushUrl + popstate with navigate + useLocation
  const navigate = useNavigate();
  const location = useLocation();
  // One-time silent bootstrap: imports historical SRS wrong-answer data into
  // the mistakes store so existing users see their trouble words immediately.
  // Runs 500ms after mount (never blocks render), guarded by localStorage flag.
  useEffect(function(){
    const t=setTimeout(bootstrapMistakesFromSRS,500);
    return function(){clearTimeout(t);};
  },[]);
  const ds=DS;
  const[currentScreen,_setCurrentScreen]=useState("welcome");
  const setScr=useCallback(function(s){
    _setCurrentScreen(s);
    if(s==="welcome"||s==="placement"||s==="new-placement")return;
    // Q-6: use React Router navigate instead of pushState
    navigate(s==="dashboard"?"/":`/${s}`,{replace:false});
  },[navigate]);
  const[name,setName]=useState("");
  const[stats,setStats]=useState(ds);
  // ── Placement test state (shared between WelcomeScreen and PlacementTest) ──
  const[pi,sPi]=useState(0);const[ps,sPs]=useState(0);const[pa,sPa]=useState(false);const[px,sPx]=useState(-1);const[pq,sPq]=useState([]);
  // ── Lesson screen state (bidirectional: LearnTab sets, LessonScreen reads+writes) ──
  const[lt,sLt]=useState(null);const[li,sLi]=useState([]);const[lx,sLx]=useState(0);const[ls,sLs]=useState(0);const[lp,sLp]=useState("learn");const[la,sLa]=useState(false);const[lsl,sLsl]=useState(-1);const[qi,sQi]=useState([]);
  // ── Grammar screen state ──
  const[gl,sGl]=useState(null);const[gx,sGx]=useState(0);const[gp,sGp]=useState("learn");const[gs,sGs]=useState(0);const[ga,sGa]=useState(false);const[gsl,sGsl]=useState(-1);
  // ── Match game: only initPool needed — MatchGame owns mm/msl/gsc/gph internally ──
  const[matchInitPool,setMatchInitPool]=useState([]);
  // ── Multiple choice game ──
  const[mcInitQ,setMcInitQ]=useState([]);const[mcResultQ,setMcResultQ]=useState([]);const[mcResultScore,setMcResultScore]=useState(0);const[mcMistakes,setMcMistakes]=useState([]);
  // ── Reading screen state ──
  const[rp,sRp]=useState(null);const[rph,sRph]=useState("read");const[rqi,sRqi]=useState(0);const[rsc,sRsc]=useState(0);const[ra,sRa]=useState(false);const[rsl,sRsl]=useState(-1);const[hw,sHw]=useState(null);
  // ── Speaking screen state ──
  const[sw,sSw]=useState(null);const[sr,sSr]=useState(null);const[sx,sSx]=useState(0);const[si,sSi]=useState([]);const[ssc,sSsc]=useState(0);
  // ── Animated lesson ──
  const[animLesson,setAnimLesson]=useState(null);
  // ── Flashcards / Listening init pools ──
  const[fcInitPool,setFcInitPool]=useState([]);
  const[lsInitQ,setLsInitQ]=useState([]);
  // ── Current exercise ID (used by XP cooldown) ──
  const[curEx,sCurEx]=useState("");
  const { dchlA, sDchlA, dchlSl, sDchlSl } = useDaily();
  const { famData, setFamData, famMembers, setFamMembers, famLoading, setFamLoading, famName, setFamName, famCode, setFamCode, famErr, setFamErr, famTab, setFamTab } = useFamily();
  const[tab,_setTab]=useState(()=>{
    // Q-6: initialise tab from URL on first load
    return PATH_TO_TAB[window.location.pathname]||"home";
  });
  const setTab=useCallback(function(t){_setTab(t);navigate(TAB_PATHS[t]||"/",{replace:false});},[navigate]);
  const { jWords, setJWords, jIn, setJIn, jEn, setJEn } = useJournal();
  const{darkMode,setDarkMode,favs,setFavs,toggleFav,isFav}=usePreferences();
  const{srchQ,setSrchQ,srchR,srchOpen,setSrchOpen,doSearch}=useSearch();
  const[onboarded,setOnboarded]=useState(function(){return localStorage.getItem("onboarded")==="true"});
  const[showCelebration,setShowCelebration]=useState(false);const[celebXP,setCelebXP]=useState(0);const[showFirstWords,setShowFirstWords]=useState(false);
  const[comebackBonus,setComebackBonus]=useState(false);
  const[streakMilestone,setStreakMilestone]=useState(null); // number (7/30/50/100/365) or null
  const[ceremonyType,setCeremonyType]=useState(null);
  const[freezeUsedToast,setFreezeUsedToast]=useState(false);
  const[pendingJoinCode,setPendingJoinCode]=useState(()=>{try{const c=new URLSearchParams(window.location.search).get('join')||null;return c&&/^[A-Z2-9]{6}$/.test(c)?c:null;}catch{return null;}});
  // Q-6: Sync tab and currentScreen when React Router location changes (browser back/forward)
  useEffect(function(){
    const p=location.pathname;
    const tabForPath=PATH_TO_TAB[p];
    if(tabForPath){
      // Tab-root path → restore dashboard + correct tab
      _setTab(tabForPath);
      _setCurrentScreen("dashboard");
    } else if(p&&p!=="/"&&p!=="/welcome"&&p!=="/placement"){
      // Screen path → restore screen + sync nav tab
      const scr=p.slice(1);
      const screenTabMap={
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
        baka_summer:"croatia", croatia_today:"croatia",
        survival_dinner:"croatia",
        kafic:"croatia",
        diaspora:"croatia",
        postcard:"croatia", storymode:"croatia", heritage:"croatia", croatianews:"croatia", phraseofday:"croatia",
        tivicompare:"learn",
        grammarvideos:"learn",
        grammarexplainer:"learn",
        casetransformer:"learn",
        vocabscenes:"learn",
        animlesson:"learn",
        grammarreader:"learn",
        lifeevents:"croatia",
        civic:"croatia",
        easter:"croatia",midsummer:"croatia",domovina:"croatia",bozic:"croatia",
        cloze:"practice",
        badges:"profile",leaderboard:"profile",leaderboard_weekly:"profile",family_group:"profile",journal:"profile",favorites:"profile",learnpath:"profile",contact:"profile",
        certificate:"profile",analytics:"profile",profile:"profile",admin:"profile",
        privacy:"profile",terms:"profile","grammar-ref":"learn",
        mistakes:"practice",listeningpath:"practice",grammarmap:"practice",my_words:"practice",
      };
      _setCurrentScreen(scr);
      if(screenTabMap[scr])_setTab(screenTabMap[scr]);
    }
  },[location.pathname]);
  // toggleFav, isFav → usePreferences hook | doSearch → useSearch hook
  // Fix 3: stable reference — prevents HomeTab useMemo from re-running every render
  const getWeekStats=useCallback(function(){const sr=getSR();const weak=Object.values(sr).filter(function(v){return v.w>v.r}).length;const strong=Object.values(sr).filter(function(v){return v.r>v.w}).length;return{lessons:stats.lc,grammar:stats.gc,streak:getStreak().count,weak:weak,strong:strong}},[stats]);
  // Fix 2: single helper replaces 4 copy-pasted data-hydration blocks across auth flows
  const applyRemoteProgress=useCallback(function(fp){
    if(!fp)return;
    // Set onboarded for any returning user with prior app usage.
    // Older Firestore docs lack an explicit "onboarded" field — derive it from
    // cp (completed placement) or any earned XP so the onboarding tour never
    // shows for established users on fresh devices.
    const _apSt = fp.stats || fp.st || {};
    if(fp.onboarded || fp.cp || _apSt.xp > 0){localStorage.setItem("onboarded","true");setOnboarded(true);}
    if(fp.sr)saveSR(fp.sr);
    if(fp.streak)localStorage.setItem("uStreak",JSON.stringify(fp.streak));
    if(fp.freezes!==undefined)localStorage.setItem("uFreeze",String(Math.max(0,parseInt(fp.freezes,10)||0)));
    if(fp.favs){localStorage.setItem("uFavs",JSON.stringify(fp.favs));setFavs(fp.favs);}
    if(fp.journal){localStorage.setItem("uJournal",JSON.stringify(fp.journal));setJWords(fp.journal);}
    const _arNd=new Date();const _arDay=_arNd.getFullYear()+'-'+String(_arNd.getMonth()+1).padStart(2,'0')+'-'+String(_arNd.getDate()).padStart(2,'0');
    if(fp.dc&&fp.dc.day===_arDay){const _arAns=fp.dc.answered||[false,false,false];const _arSel=Array.isArray(fp.dc.selected)&&typeof fp.dc.selected[0]==="string"?fp.dc.selected:["","",""];// Merge with local progress — once a question is answered locally it stays answered.
    // The Firestore watcher can fire with startup state (all false) AFTER the user
    // has already answered, resetting dchlA and showing badge=3 incorrectly.
    let _localAns=[false,false,false];try{const _ld=JSON.parse(localStorage.getItem("dcDay3")||"{}");if(_ld.day===_arDay)_localAns=_ld.answered||_localAns;}catch(_){}
    const _mergedAns=_arAns.map(function(a,i){return a||_localAns[i]||false;});
    sDchlA(_mergedAns);sDchlSl(_arSel);localStorage.setItem("dcDay3",JSON.stringify({day:_arDay,answered:_mergedAns,selected:_arSel}));}
    if(fp.cooldown){const _arT=new Date().toISOString().slice(0,10);let _arCd={};try{_arCd=JSON.parse(localStorage.getItem("xpCooldown")||"{}")}catch(e){}for(const _arCk in fp.cooldown){if(fp.cooldown[_arCk]===_arT)_arCd[_arCk]=fp.cooldown[_arCk];}localStorage.setItem("xpCooldown",JSON.stringify(_arCd));}
  },[setFavs,setJWords,sDchlA,sDchlSl]);
  const { tDir, setTDir: sTDir, tIn, setTIn: sTIn, tOut, tL, doTr } = useTranslator();
  // t1k, hIdx, evM removed — screens manage these internally (Q-4 cleanup)
  const[showXP,setShowXP]=useState(false);const[xpA,setXpA]=useState(0);const[nB,setNB]=useState(null);const[sB,setSB]=useState(false);
  const _initialPath=useRef(window.location.pathname);
  const _unloadRef=useRef(/** @type {any} */ ({}));
  // Ref keeps onBeforeSignOut pointing at the latest doSyncNow without a TDZ issue.
  // doSyncNow is defined after useAuth (it depends on authUser from useAuth's return),
  // so passing it directly causes "Cannot access before initialization" in production builds.
  const _syncNowRef=useRef(null);
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
    emailUnverified, setEmailUnverified,
    resendVerification,
    doReg, doLog, doOut, doReset, doGoogleLogin,
  } = useAuth({
    onSignedIn({ user, progress, isNew, isHydrate }) {
      if (isHydrate) {
        if (progress) {
          const _hSt=progress.stats||progress.st||{};
          // Merge ct (completed topics) — never overwrite with fewer topics than current.
          // Remote ct may be stale (e.g. Firestore doc written before ct existed,
          // or written during a rules outage with empty ct). Take the union so progress
          // is never lost from a less-complete remote snapshot.
          setStats(prev=>({...ds,..._hSt,ct:[...new Set([...(prev.ct||[]),...(_hSt.ct||[])])],lc:Math.max(prev.lc||0,_hSt.lc||0),gc:Math.max(prev.gc||0,_hSt.gc||0),xp:Math.max(prev.xp||0,_hSt.xp||0)}));
          if (progress.name) setName(progress.name);
        }
        return;
      }
      if (progress) {
        setName(progress.name || user.d);
        const _pStats = progress.stats || progress.st || {};
        setStats(prev=>({...ds,..._pStats,ct:[...new Set([...(prev.ct||[]),...(_pStats.ct||[])])],lc:Math.max(prev.lc||0,_pStats.lc||0),gc:Math.max(prev.gc||0,_pStats.gc||0),xp:Math.max(prev.xp||0,_pStats.xp||0)}));
        // Mark as onboarded for any returning user with prior usage.
        // Many older Firestore docs lack the "onboarded" field — derive it from cp or xp.
        if (!isNew && (progress.onboarded || progress.cp || _pStats.xp > 0)) {
          localStorage.setItem("onboarded", "true"); setOnboarded(true);
        }
      } else { setName(user.d); }
      // New registrations go to the welcome/placement flow.
      // ANY returning user (existing account) always lands on the dashboard —
      // never the welcome screen, regardless of XP or completion state.
      if (isNew) setScr('welcome');
      else _goPostAuth(true);
    },
    onSignedOut() { setStats(ds); setScr('welcome'); setName(''); setFamData(null); setFamMembers([]); },
    onBeforeSignOut: async function(){ if(_syncNowRef.current) return _syncNowRef.current(); },
    applyRemoteProgress,
    setFamData,
    setSyncReady: _setSyncReady,
    // @ts-ignore — ds is an extra convenience prop not declared in JSDoc
    ds,
  });
  // Keep _unloadRef current on every render so beforeunload always flushes latest state
  _unloadRef.current={authUser,stats,name,authScreen,favs,jWords,dchlA,dchlSl};
  useEffect(()=>{
    if(authScreen!=="app")return;
    const lastSeen=localStorage.getItem("lastSeen");const now=Date.now();
    if(lastSeen&&stats.xp>0){const diff=now-parseInt(lastSeen,10);if(diff>86400000&&diff<7*86400000){setComebackBonus(true);setTimeout(()=>setComebackBonus(false),4000);}}
    localStorage.setItem("lastSeen",String(now));
    // Weekly streak-freeze recharge: grant 1 free freeze on new week if user was active last week
    (function(){
      const _wkFn=function(){const d=new Date();const day=d.getDay()||7;d.setDate(d.getDate()+4-day);const yr=d.getFullYear();const wk=Math.ceil(((d.getTime()-new Date(yr,0,1).getTime())/86400000+1)/7);return `${yr}-W${String(wk).padStart(2,'0')}`;};
      const _thisWk=_wkFn();
      const _lastRechargeWk=localStorage.getItem('nh_freeze_recharge_wk')||'';
      if(_lastRechargeWk!==_thisWk){
        // Check if user earned any XP the previous week
        const _prevD=new Date();_prevD.setDate(_prevD.getDate()-7);
        const _pd=_prevD.getDay()||7;_prevD.setDate(_prevD.getDate()+4-_pd);const _py=_prevD.getFullYear();const _pw=Math.ceil(((_prevD.getTime()-new Date(_py,0,1).getTime())/86400000+1)/7);const _prevWk=`${_py}-W${String(_pw).padStart(2,'0')}`;
        const _prevXP=parseInt(localStorage.getItem('nh_week_xp_'+_prevWk)||'0',10);
        if(_prevXP>0){earnFreeze();localStorage.setItem('nh_freeze_recharge_wk',_thisWk);}
        else{localStorage.setItem('nh_freeze_recharge_wk',_thisWk);}
      }
    })();
    if(pendingJoinCode){
      try{const u=new URL(window.location.href);u.searchParams.delete('join');window.history.replaceState({},'',u.pathname);}catch(_){}
      setFamCode(pendingJoinCode);setFamTab("join");
      setTimeout(()=>setScr("leaderboard"),600);
      setPendingJoinCode(null);
    }
    checkNameDay(name);
    scheduleStreakReminder(stats.str || getStreak().count);
  },[authScreen]);// eslint-disable-line
  // Show new placement test for brand-new users with zero progress who haven't taken it
  useEffect(()=>{
    if(authScreen!=="app")return undefined;
    if(currentScreen==="welcome"||currentScreen==="placement"||currentScreen==="new-placement")return undefined;
    if(stats.lc===0&&stats.xp===0&&!localStorage.getItem("placement_done")&&!localStorage.getItem("nh_placement_done")&&!localStorage.getItem("onboarded")){
      // Only trigger after a short delay to ensure auth state has settled
      const t=setTimeout(()=>setScr("new-placement"),1200);
      return()=>clearTimeout(t);
    }
    return undefined;
  },[authScreen,stats.lc,stats.xp,currentScreen]);// eslint-disable-line react-hooks/exhaustive-deps
  // localStorage-only auto-save on any state change. Firebase writes are handled by:
  //  1. doSyncNow() — fires on lesson/grammar/ct completion (line below)
  //  2. saveSnapshot(true) — fires on pagehide/visibilitychange hidden (tab close/switch)
  // This prevents one Firebase write per XP award (15+ per lesson) from exhausting quota.
  useEffect(()=>{if(!authUser||authScreen!=="app")return;const _nd=new Date();const _dcDay=_nd.getFullYear()+'-'+String(_nd.getMonth()+1).padStart(2,'0')+'-'+String(_nd.getDate()).padStart(2,'0');const _saveData={name,stats,cp:currentScreen!=="welcome"&&currentScreen!=="placement",onboarded:localStorage.getItem("onboarded")==="true",savedAt:Date.now(),sr:getSR(),streak:getStreak(),freezes:getStreakFreezes(),favs,journal:jWords,dc:{day:_dcDay,answered:dchlA,selected:dchlSl},cooldown:(function(){try{return JSON.parse(localStorage.getItem("xpCooldown")||"{}")}catch{return{}}})()};try{localStorage.setItem("uP_"+authUser.u,JSON.stringify(_saveData));}catch(e){console.warn("localStorage quota exceeded — progress not saved locally",e);}touchSession();},[stats,currentScreen,name,authUser,authScreen,jWords,favs,dchlA,dchlSl]);
  useEffect(()=>{if(authScreen!=="app")return undefined;const iv=setInterval(()=>{if(isSessionExpired()){doOut();}},5*60*1000);return()=>clearInterval(iv)},[authScreen]);// eslint-disable-line
  useEffect(()=>{if(authScreen!=="app")return undefined;const h=()=>touchSession();window.addEventListener("click",h);window.addEventListener("touchstart",h);window.addEventListener("keydown",h);return()=>{window.removeEventListener("click",h);window.removeEventListener("touchstart",h);window.removeEventListener("keydown",h)}},[authScreen]);
  useEffect(()=>{if(!_syncReady||authScreen!=="app"||!authUser)return;// Only show backup banner once per device. Skip for returning users with prior
// progress — they've already seen it on their first device and don't need the
// reminder on every new browser/device they sign in from.
if(!localStorage.getItem("fbBackupConfirmed")&&!onboarded){setShowBackupBanner(true);}},[_syncReady,authScreen,authUser]);
  // Real-time Firestore listener — replaces 3-minute polling + focus/visibility reads.
  // onSnapshot fires immediately on subscribe (initial data load) then on every remote write.
  // Cross-device lesson completion now syncs in <2 seconds instead of up to 3 minutes.
  // savedAt is bumped to fpTs after each merge so repeated snapshots of unchanged data
  // are cleanly skipped on the next compare (fpTs === lpTs → no-op).
  useEffect(()=>{if(authScreen!=="app"||!authUser)return undefined;const _unsub=fbWatchProgress(authUser.u,function(fp,fpTs){const lp=gP(authUser.u);const lpTs=(lp&&lp.savedAt)||0;if(fpTs>lpTs){lP(authUser.u,{...fp,savedAt:fpTs});const _pllSt=fp.stats||fp.st||{};setStats(prev=>({...ds,..._pllSt,ct:[...new Set([...(prev.ct||[]),...(_pllSt.ct||[])])],lc:Math.max(prev.lc||0,_pllSt.lc||0),gc:Math.max(prev.gc||0,_pllSt.gc||0),xp:Math.max(prev.xp||0,_pllSt.xp||0)}));if(fp.name)setName(fp.name);applyRemoteProgress(fp);}});return()=>_unsub();},[authScreen,authUser,applyRemoteProgress,ds]);
  // Auto-save on every lesson completion (stats.lc or stats.ct length changes).
  // Lesson components only call setStats — they never write to localStorage or Firebase.
  // This effect fires immediately (no debounce) so progress is persisted even if the
  // user closes the browser right after finishing a lesson.
  useEffect(()=>{if(!authUser||authScreen!=="app"||stats.lc===0)return;doSyncNow();scheduleStreakReminder(getStreak().count);},[stats.lc,stats.ct?.length,stats.gc]);// eslint-disable-line react-hooks/exhaustive-deps
  // Self-healing: if the user has completed lessons (lc > 0) but ct is empty,
  // the completed-topics array was lost (Firestore rules outage, stale remote doc,
  // or pre-ct data format). Reconstruct ct from LEARN_PATH lesson order as a best
  // approximation — this triggers doSyncNow and permanently fixes the Firestore doc.
  useEffect(()=>{
    if(!authUser||authScreen!=="app"||stats.lc===0||stats.ct.length>0)return;
    const recovered=[];
    for(const lv of LEARN_PATH){for(const it of lv.items){if(it.topic&&recovered.length<stats.lc)recovered.push(it.topic);}}
    if(recovered.length>0)setStats(prev=>({...prev,ct:[...new Set([...prev.ct,...recovered])]}));
  },[authScreen,authUser,stats.lc,stats.ct.length]);// eslint-disable-line react-hooks/exhaustive-deps
  // Synchronous localStorage flush on browser close / tab kill.
  // Firebase is async so this is the only way to guarantee no data loss on close.
  useEffect(()=>{
    // Shared save: localStorage (always sync) + Firebase (when switching away)
    const saveSnapshot=(pushToFirebase)=>{
      const{authUser:u,stats:st,name:nm,authScreen:as,favs:fv,jWords:jw,dchlA:da,dchlSl:ds}=_unloadRef.current;
      if(!u||as!=="app")return;
      const _nd=new Date();const _dcDay=_nd.getFullYear()+'-'+String(_nd.getMonth()+1).padStart(2,'0')+'-'+String(_nd.getDate()).padStart(2,'0');
      try{
        const _dcLocalAns2=(function(){try{const p=JSON.parse(localStorage.getItem("dcDay3")||"{}");if(p.day===_dcDay&&Array.isArray(p.answered))return p.answered;}catch(_){}return[false,false,false];})();
        const _daBest=(da||[false,false,false]).map(function(a,i){return a||_dcLocalAns2[i]||false;});
        const _dsBest=(ds&&ds.some(function(s){return s;}))?ds:(function(){try{const p=JSON.parse(localStorage.getItem("dcDay3")||"{}");if(p.day===_dcDay&&Array.isArray(p.selected)&&typeof p.selected[0]==="string")return p.selected;}catch(_){}return["","",""];})();
        const _d={name:nm,stats:st,cp:true,onboarded:localStorage.getItem("onboarded")==="true",savedAt:Date.now(),sr:getSR(),streak:getStreak(),freezes:getStreakFreezes(),favs:fv||[],journal:jw||[],dc:{day:_dcDay,answered:_daBest,selected:_dsBest},cooldown:(function(){try{return JSON.parse(localStorage.getItem("xpCooldown")||"{}")}catch{return{}}})()};
        localStorage.setItem("uP_"+u.u,JSON.stringify(_d));
        // Best-effort Firebase push so the next device sees latest data immediately.
        // Fire-and-forget — browser keeps async ops alive briefly after hide/unload.
        if(pushToFirebase)fbSaveProgress(u.u,_d).catch(function(){});
      }catch(_){}
    };
    // beforeunload: localStorage only (must be synchronous)
    const onUnload=()=>saveSnapshot(false);
    // pagehide: fires on iOS Safari tab close and bfcache entry — push to Firebase
    const onPageHide=()=>saveSnapshot(true);
    // visibilitychange hidden: user switches apps/tabs on mobile — most reliable cross-platform event
    const onVisHide=()=>{if(document.visibilityState==="hidden")saveSnapshot(true);};
    window.addEventListener("beforeunload",onUnload);
    window.addEventListener("pagehide",onPageHide);
    document.addEventListener("visibilitychange",onVisHide);
    return()=>{
      window.removeEventListener("beforeunload",onUnload);
      window.removeEventListener("pagehide",onPageHide);
      document.removeEventListener("visibilitychange",onVisHide);
    };
  },[]);
  // Q-6: popstate replaced by location.pathname useEffect above (React Router owns back/forward)
  const award=useCallback((amt,celebrate)=>{
    if(curEx&&!canEarnXP(curEx)){setXpA(0);setShowXP(false);return}
    if(curEx)markExerciseDone(curEx);
    let totalAmt=lXPgain(amt);
    const _today=new Date().toISOString().slice(0,10);
    if(comebackBonus&&amt>0&&!localStorage.getItem('nh_comeback_used_'+_today)){localStorage.setItem('nh_comeback_used_'+_today,'1');totalAmt=lXPgain(amt+50);}
    setXpA(totalAmt);setShowXP(true);
    setStats(s=>{
      const oldLevel=lvl(s.xp);
      const n={...s,xp:s.xp+totalAmt,streak:getStreak().count};
      const newLevel=lvl(n.xp);
      const nb=BADGES.filter(b=>!s.badges.includes(b.id)&&b.r(n));
      if(nb.length){n.badges=[...s.badges,...nb.map(b=>b.id)];setTimeout(()=>{setNB(nb[0]);setSB(true);setTimeout(()=>setSB(false),3000)},600)}
      if(newLevel>oldLevel){setTimeout(()=>{setNB({id:'levelup',name:`Level ${newLevel}`,emoji:'⬆️'});setSB(true);setTimeout(()=>setSB(false),3500);},800);}
      return n;
    });
    setTimeout(()=>setShowXP(false),1500);
    if(celebrate&&totalAmt>0){setCelebXP(totalAmt);setTimeout(()=>setShowCelebration(true),400)}
    const sr=updateStreak();
    if(sr.milestone)setTimeout(()=>setStreakMilestone(sr.milestone),800);
    if(sr.milestone) recordJourneyMilestone('streak_'+sr.milestone, {count: sr.milestone, allowRepeat: false});
    // Streak ceremonies (30, 50, 100) — only once each, guarded by localStorage
    if(sr.count>=30&&!localStorage.getItem('nh_ceremony_streak_30')){localStorage.setItem('nh_ceremony_streak_30','1');setCeremonyType('streak_30');}
    if(sr.count>=50&&!localStorage.getItem('nh_ceremony_streak_50')){localStorage.setItem('nh_ceremony_streak_50','1');setCeremonyType('streak_50');}
    if(sr.count>=100&&!localStorage.getItem('nh_ceremony_streak_100')){localStorage.setItem('nh_ceremony_streak_100','1');setCeremonyType('streak_100');}
    // Award 1 freeze at every 7-day milestone (7, 14, 21, 28 …), max 2
    if(sr.count>0&&sr.count%7===0)earnFreeze();
    // Show toast if a freeze was consumed to save the streak
    if(sr.freezeUsed){setFreezeUsedToast(true);setTimeout(()=>setFreezeUsedToast(false),4500);}
    // Stage completion ceremonies — check if lesson count just crossed a stage gate
    const _stageGates=[5,11,22,34,45];
    setStats(function(s){
      for(let _si=1;_si<_stageGates.length;_si++){
        const _sk='nh_stage'+(_si+1)+'_ceremony';
        if(s.lc>=_stageGates[_si]&&!localStorage.getItem(_sk)){localStorage.setItem(_sk,'1');setTimeout(()=>setCeremonyType('stage_'+(_si+1)),100);break;}
      }
      return s;
    });
    // Track weekly XP
    const _wk=(function(){const d=new Date();const day=d.getDay()||7;d.setDate(d.getDate()+4-day);const yr=d.getFullYear();const wk=Math.ceil(((d.getTime()-new Date(yr,0,1).getTime())/86400000+1)/7);return `${yr}-W${String(wk).padStart(2,'0')}`;})();
    const _wkKey='nh_week_xp_'+_wk;
    localStorage.setItem(_wkKey,String((parseInt(localStorage.getItem(_wkKey)||'0',10))+totalAmt));
    if(!localStorage.getItem('nh_journey_first_lesson') && totalAmt > 0) {
      localStorage.setItem('nh_journey_first_lesson','1');
      recordJourneyMilestone('first_lesson', {});
    }
  },[curEx,comebackBonus]);
  // Persist last exercise to localStorage so Home tab can show a Resume button
  useEffect(function(){
    if(!curEx) return;
    const LABELS = {
      mcgame:'Quiz', flashcards:'Flashcards', match:'Match Pairs', typing:'Typing',
      listening:'Listening', speaking:'Speaking', wordsprint:'Word Sprint', review:'SRS Review',
      writing:'Free Writing', znam:'Translate', unjumble:'Word Order', prepdrill:'Prepositions',
      numtime:'Numbers & Time', grammar:'Grammar', tenses:'Tenses', padezi:'Cases',
      padezifull:'Padeži Master', conjdrill:'Conjugation', aspect:'Verb Aspect',
      modal:'Modal Verbs', declension:'Declension', dialogue:'Dialogue Sim',
      shadowing:'Shadowing', cefrtest:'CEFR Test', dictation:'Dictation',
      roleplay:'Role-Play', readlist:'Reading', idioms:'Idioms', proverbs:'Proverbs',
    };
    const label = LABELS[curEx] || (curEx.startsWith('vocab_') ? curEx.replace('vocab_','').replace(/_/g,' ') + ' vocab' : curEx);
    localStorage.setItem('nh_last_ex', curEx);
    localStorage.setItem('nh_last_ex_label', label);
    if((curEx === 'speaking') && !localStorage.getItem('nh_journey_first_speaking')) {
      localStorage.setItem('nh_journey_first_speaking','1');
      recordJourneyMilestone('first_speaking', {});
    }
  },[curEx]);
  function _goPostAuth(hasProgress){
    if(!hasProgress){setScr("welcome");return}
    const ip=_initialPath.current;
    _initialPath.current='/';
    const tabByPath={'/learn':'learn','/practice':'practice','/croatia':'croatia','/profile':'profile'};
    if(tabByPath[ip]){_setTab(tabByPath[ip]);_setCurrentScreen("dashboard");return}
    setScr("dashboard");
  }
  const doSyncNow=useCallback(async function(){if(!authUser)return false;const _nd=new Date();const _dcDay=_nd.getFullYear()+'-'+String(_nd.getMonth()+1).padStart(2,'0')+'-'+String(_nd.getDate()).padStart(2,'0');// Merge React state with dcDay3 localStorage — whichever source has more answers wins.
  // Prevents a corrupted dchlA=[false,false,false] React state from overwriting good
  // answers stored in dcDay3 (e.g. after applyRemoteProgress race on login).
  const _dcLocalAns=(function(){try{const p=JSON.parse(localStorage.getItem("dcDay3")||"{}");if(p.day===_dcDay&&Array.isArray(p.answered))return p.answered;}catch(_){}return[false,false,false];})();
  const _dcBestAns=dchlA.map(function(a,i){return a||_dcLocalAns[i]||false;});
  const _dcBestSel=dchlSl.some(function(s){return s;})?dchlSl:(function(){try{const p=JSON.parse(localStorage.getItem("dcDay3")||"{}");if(p.day===_dcDay&&Array.isArray(p.selected)&&typeof p.selected[0]==="string")return p.selected;}catch(_){}return["","",""];})();
  const _wkD=new Date();const _wkDay=_wkD.getDay()||7;_wkD.setDate(_wkD.getDate()+4-_wkDay);const _wkYr=_wkD.getFullYear();const _wkNum=Math.ceil(((_wkD.getTime()-new Date(_wkYr,0,1).getTime())/86400000+1)/7);const _wkKey2=_wkYr+'-W'+String(_wkNum).padStart(2,'0');const _weekXP=parseInt(localStorage.getItem('nh_week_xp_'+_wkKey2)||'0',10);
  const _data={name,stats,cp:true,onboarded:localStorage.getItem("onboarded")==="true",savedAt:Date.now(),sr:getSR(),streak:getStreak(),freezes:getStreakFreezes(),favs,journal:jWords,dc:{day:_dcDay,answered:_dcBestAns,selected:_dcBestSel},cooldown:(function(){try{return JSON.parse(localStorage.getItem("xpCooldown")||"{}")}catch{return{}}})(),weekXP:_weekXP};localStorage.setItem("uP_"+authUser.u,JSON.stringify(_data));const result=await fbSaveProgress(authUser.u,_data).catch(function(){return{ok:false}});return result&&result.ok!==false;},[authUser,name,stats,favs,jWords,dchlA,dchlSl]);
  // Keep the ref current so onBeforeSignOut always calls the latest version
  _syncNowRef.current=doSyncNow;
  // Daily snapshot for progress charts
  useEffect(()=>{
    if(!authUser||authScreen!=="app"||stats.xp===0)return;
    const today=new Date().toISOString().slice(0,10);
    const key='progress_history';
    try{
      const history=JSON.parse(localStorage.getItem(key)||'[]');
      const idx=history.findIndex(function(h){return h.date===today});
      const snap={date:today,xp:stats.xp,lc:stats.lc,gc:stats.gc};
      if(idx>=0)history[idx]=snap;else history.push(snap);
      localStorage.setItem(key,JSON.stringify(history.slice(-90)));
    }catch(_){}
  },[stats.xp,authUser,authScreen]);// eslint-disable-line react-hooks/exhaustive-deps
  function getPlacementCt(level){
    const ct=[];
    const targets=[0,0,5,10,15,20];
    const max=targets[level]||0;
    for(const lv of LEARN_PATH){for(const it of lv.items){if(it.topic&&ct.length<max)ct.push(it.topic);}}
    return ct;
  }
  function goBack(){
    if(curEx)markExerciseDone(curEx);
    sCurEx("");
    // H2: guard against navigating out of the SPA when history is empty
    if(window.history.length <= 1){ setScr("dashboard"); } else { navigate(-1); }
  }
  const level=useMemo(()=>lvl(stats.xp),[stats.xp]);
  // Fix 1: these hooks must live above all early returns (Rules of Hooks)
  const badges=useMemo(()=>({home:0,learn:0,practice:getDueReviews().length,croatia:0,profile:0}),[]);
  const onCloseCelebration=useCallback(()=>setShowCelebration(false),[]);
  const allCats=ALL_CATS;
  const icons=ICONS;
  // ═══ SCREEN LAUNCH FUNCTIONS ═══
  function launchAnimLesson(lessonId){const l=ANIM_LESSONS.find(x=>x.id===lessonId);if(l){setAnimLesson(l);sCurEx("animlesson");setScr("animlesson");}}
  function launchMcGame(questions){setMcInitQ(questions);sCurEx("mcgame");setScr("mcgame");}
  function mcGameComplete(questions,score,mistakes){setMcResultQ(questions);setMcResultScore(score);setMcMistakes(mistakes||[]);setScr("mcresult");}
  function launchFlashcards(pool){setFcInitPool(pool);sCurEx("flashcards");setScr("flashcards");}
  function launchListening(questions){setLsInitQ(questions);sCurEx("listening");setScr("listening");}
  // Q-4: MatchGame now manages its own state; App only stores the init pool
  function launchMatch(pool){setMatchInitPool(pool);sCurEx("match");setScr("match");}
  // Q-4: Speaking launch — App owns the speaking init state (used by SpeakingScreen props)
  function launchSpeaking(items){sSi(items);sSx(0);sSw(items[0]);sSr(null);sSsc(0);sCurEx("speaking");setScr("speaking");}

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
    <div className={darkMode?"dark":""} style={{
      minHeight:"100vh",
      background:"linear-gradient(160deg,#030c1a 0%,#071830 30%,#0a2848 60%,#0c3562 100%)",
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      fontFamily:"'Outfit',sans-serif",position:"relative",overflow:"hidden",
    }}>
      {/* Šahovnica pattern */}
      <div style={{position:"absolute",inset:0,backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Crect width='16' height='16' fill='rgba(212,0,48,0.045)'/%3E%3Crect x='16' y='16' width='16' height='16' fill='rgba(212,0,48,0.045)'/%3E%3C/svg%3E")`,pointerEvents:"none"}}/>
      {/* Radial glow */}
      <div style={{position:"absolute",top:"-30%",left:"50%",transform:"translateX(-50%)",width:"80vw",height:"60vh",background:"radial-gradient(ellipse at center,rgba(14,116,144,.22) 0%,transparent 70%)",pointerEvents:"none"}}/>
      {/* Content */}
      <div style={{textAlign:"center",animation:"rise .55s ease",position:"relative",zIndex:1}}>
        <div style={{display:"flex",justifyContent:"center",marginBottom:28,animation:"grb-glow 2.5s ease-in-out infinite",filter:"drop-shadow(0 0 20px rgba(14,116,144,.5))"}}>
          <CroatianGrb size={108} />
        </div>
        <div style={{fontSize:13,fontWeight:800,color:"rgba(255,255,255,.55)",letterSpacing:".35em",textTransform:"uppercase",marginBottom:5}}>Naša Hrvatska</div>
        <div style={{fontSize:12,fontWeight:500,color:"rgba(255,255,255,.35)",letterSpacing:".18em",textTransform:"uppercase",marginBottom:36}}>Learn Croatian</div>
        <div style={{display:"flex",gap:9,justifyContent:"center"}}>
          {[0,1,2].map(i=>(
            <div key={i} style={{width:8,height:8,borderRadius:"50%",background:"rgba(14,116,144,.85)",animation:`dot-bounce 1.4s ease-in-out ${i*0.18}s infinite`}}/>
          ))}
        </div>
      </div>
      {/* Croatian flag stripe */}
      <div style={{position:"absolute",bottom:0,left:0,right:0,height:4,display:"flex",animation:"stripe-slide .9s ease .3s both"}}>
        <div style={{flex:1,background:"#D40030"}}/><div style={{flex:1,background:"rgba(255,255,255,.9)"}}/><div style={{flex:1,background:"#003DA5"}}/>
      </div>
    </div>
  );
  if(authScreen==="login"||authScreen==="register"){
    return <LoginScreen authScreen={authScreen} authError={authError} authLoading={authLoading} authEmail={authEmail} pw={pw} pc={pc} displayName={displayName} sp={sp} setAuthScreen={setAuthScreen} setAuthError={setAuthError} setAuthEmail={setAuthEmail} setPw={setPw} setPc={setPc} setDisplayName={setDisplayName} setSp2={setSp2} setRpEm={setRpEm} doLog={doLog} doReg={doReg} doGoogleLogin={doGoogleLogin} />;
  }
  // ═══ RESET PASSWORD SCREEN ═══
  if(authScreen==="reset"){
    return <ResetPassword authError={authError} authLoading={authLoading} rpEm={rpEm} setAuthScreen={setAuthScreen} setAuthError={setAuthError} setRpEm={setRpEm} doReset={doReset} />;
  }
    // ═══ MAIN APP RENDER ═══
  const doSidebarSearch=useCallback(()=>{if(srchQ.trim()){doSearch(srchQ);setSrchOpen(true);}},[srchQ,doSearch,setSrchOpen]);
  const ctxValue=useMemo(()=>({authScreen,authUser,name,setName,doOut,stats,setStats,level,award,darkMode,setDarkMode,favs,toggleFav,isFav,setScr,goBack,tab,setTab,jWords,setJWords,famData,setFamData,sCurEx}),[authScreen,authUser,name,setName,doOut,stats,setStats,level,award,darkMode,setDarkMode,favs,toggleFav,isFav,setScr,goBack,tab,setTab,jWords,setJWords,famData,setFamData,sCurEx]);
  return (
    <AppContext.Provider value={ctxValue}>
    <div className={darkMode?"dark":""} style={darkMode?BG_DARK:BG_LIGHT}>
      {/* Q-5 WCAG: skip-to-main link — visible only on keyboard focus */}
      <a href="#main-content" className="skip-link">Skip to main content</a>
      {authScreen==="app"&&currentScreen!=="welcome"&&currentScreen!=="placement"&&<Sidebar tab={tab} setTab={setTab} setScr={setScr} name={name} level={level} st={stats} darkMode={darkMode} setDarkMode={setDarkMode} badges={badges} srchQ={srchQ} setSrchQ={setSrchQ} onSearch={doSidebarSearch} doOut={doOut} />}
      <div className="app-content" id="main-content" role="main">
      <Suspense fallback={<div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh"}}><div style={{textAlign:"center"}}><div style={{display:"flex",justifyContent:"center",gap:0,marginBottom:16,borderRadius:3,overflow:"hidden",width:54,margin:"0 auto 16px"}}><div style={{height:6,flex:1,background:"#D4002D"}}/><div style={{height:6,flex:1,background:"#F5F5F5"}}/><div style={{height:6,flex:1,background:"#003DA5"}}/></div><div style={{fontSize:13,fontWeight:800,color:"var(--subtext)",letterSpacing:".1em",textTransform:"uppercase",opacity:.6}}>Naša Hrvatska</div></div></div>}>
      <XPPopup showXP={showXP} xpA={xpA} />
      <BadgeToast show={sB} badge={nB} />
      {showCelebration&&<CelebrationModal xp={celebXP} onClose={onCloseCelebration} />}
      {streakMilestone&&<StreakMilestoneModal days={streakMilestone} onClose={()=>setStreakMilestone(null)} />}
      {ceremonyType&&<CeremonyModal type={ceremonyType} stats={stats} name={name} onClose={()=>setCeremonyType(null)} />}
      {showFirstWords&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:999,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
          <div style={{background:'var(--card)',borderRadius:24,padding:'32px 24px',maxWidth:400,width:'100%',textAlign:'center',animation:'rise .4s'}}>
            <div style={{fontSize:48,marginBottom:12}}>🇭🇷</div>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:'var(--heading)',marginBottom:8}}>Your First Croatian Words</h2>
            <p style={{fontSize:13,color:'var(--subtext)',marginBottom:20}}>Tap any word to hear it</p>
            <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:24}}>
              {[['Bog','Hello / Hi'],['Hvala','Thank you'],['Molim','Please'],['Da','Yes'],['Dobar dan','Good day']].map(([hr,en])=>(
                <button key={hr} onClick={()=>speak(hr)} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 16px',borderRadius:12,border:'1.5px solid var(--card-b)',background:'var(--bar-bg)',cursor:'pointer',fontFamily:"'Outfit',sans-serif"}}>
                  <span style={{fontSize:16,fontWeight:800,color:'#0e7490'}}>{hr}</span>
                  <span style={{fontSize:14,color:'var(--subtext)'}}>{en}</span>
                  <span style={{fontSize:18}}>🔊</span>
                </button>
              ))}
            </div>
            <button className="b bp" style={{width:'100%',fontSize:15,padding:'14px'}} onClick={()=>{setShowFirstWords(false);setScr('dashboard');}}>
              Start Learning →
            </button>
          </div>
        </div>
      )}
      {!onboarded&&_syncReady&&authScreen==="app"&&currentScreen!=="welcome"&&currentScreen!=="placement"&&<OnboardingTour onDone={()=>setOnboarded(true)} />}
      {comebackBonus&&<div style={{position:"fixed",top:80,left:"50%",transform:"translateX(-50%)",zIndex:9500,background:"linear-gradient(135deg,#f59e0b,#d97706)",color:"#fff",borderRadius:16,padding:"14px 24px",boxShadow:"0 8px 32px rgba(0,0,0,.2)",fontSize:14,fontWeight:800,display:"flex",alignItems:"center",gap:10,animation:"slideUp .4s ease"}}>🔥 Welcome back! Keep your streak alive!</div>}
      {freezeUsedToast&&<div style={{position:"fixed",top:80,left:"50%",transform:"translateX(-50%)",zIndex:9500,background:"linear-gradient(135deg,#1e40af,#3b82f6)",color:"#fff",borderRadius:16,padding:"14px 24px",boxShadow:"0 8px 32px rgba(0,0,0,.25)",fontSize:14,fontWeight:800,display:"flex",alignItems:"center",gap:10,animation:"slideUp .4s ease",whiteSpace:"nowrap"}}>🛡️ Zaštita niza aktivirana! Tvoj niz je sačuvan.</div>}
      {emailUnverified && (
        <div style={{
          background: '#fef3c7', borderBottom: '2px solid #f59e0b',
          padding: '10px 20px', display: 'flex', alignItems: 'center',
          gap: 12, fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600,
          position: 'relative', zIndex: 900,
        }}>
          <span>⚠️ Please verify your email to secure your account.</span>
          <button onClick={resendVerification} style={{
            background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 6,
            padding: '4px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700,
            fontFamily: "'Outfit', sans-serif",
          }}>Resend Email</button>
          <button onClick={() => setEmailUnverified(false)} style={{
            marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 16, color: '#92400e',
          }} aria-label="Dismiss">×</button>
        </div>
      )}
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
      currentScreen==="dashboard"&&<div className="dash">
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
        tab==="home"&&<div key="tab-home" className="screen-enter"><ScreenErrorBoundary name="HomeTab"><HomeTab
          name={name} level={level} st={stats}
          tDir={tDir} sTDir={sTDir} tIn={tIn} sTIn={sTIn} tOut={tOut} tL={tL} doTr={doTr}
          dchlA={dchlA} sDchlA={sDchlA} dchlSl={dchlSl} sDchlSl={sDchlSl}
          getWeekStats={getWeekStats}
          award={award}
          setTab={(id)=>{const VALID_TABS={home:1,learn:1,practice:1,croatia:1,profile:1};if(VALID_TABS[id])setTab(id);else setScr(id);}} setScr={setScr} sCurEx={sCurEx}
          allCats={allCats} sh={sh}
          launchPathItem={launchPathItem}
          syncReady={_syncReady} onSyncNow={doSyncNow} authUser={authUser}
          comebackBonus={comebackBonus}
          goal={localStorage.getItem('nh_goal')||'fluent'}
        /></ScreenErrorBoundary></div>}
        {// ═══ TAB: LEARN ═══
        tab==="learn"&&<div key="tab-learn" className="screen-enter"><ScreenErrorBoundary name="LearnTab"><LearnTab
          allCats={allCats} icons={icons} setScr={setScr} sCurEx={sCurEx} st={stats}
          sh={sh} sLt={sLt} sLi={sLi} sLx={sLx} sLs={sLs} sLp={sLp} sLa={sLa} sLsl={sLsl}
          sGl={sGl} sGp={sGp} sGx={sGx} sGs={sGs} sGa={sGa} sGsl={sGsl}
          launchPathItem={launchPathItem} setTab={setTab}
          launchAnimLesson={launchAnimLesson}
        /></ScreenErrorBoundary></div>}
        {// ═══ TAB: PRACTICE ═══
        tab==="practice"&&<div key="tab-practice" className="screen-enter"><ScreenErrorBoundary name="PracticeTab"><PracticeTab
          allCats={allCats} sh={sh} setScr={setScr} sCurEx={sCurEx}
          onLaunchQuiz={launchMcGame} onLaunchFlash={launchFlashcards}
          onLaunchListen={launchListening} onLaunchMatch={launchMatch}
          onLaunchSpeaking={launchSpeaking}
          lc={stats.lc}
        /></ScreenErrorBoundary></div>}
        {// ═══ TAB: CROATIA ═══
        tab==="croatia"&&<div key="tab-croatia" className="screen-enter"><ScreenErrorBoundary name="CroatiaTab"><CroatiaTab
          setScr={setScr} sCurEx={sCurEx} award={award}
        /></ScreenErrorBoundary></div>}
        {// ═══ TAB: PROFILE ═══
        tab==="profile"&&<div key="tab-profile" className="screen-enter"><ScreenErrorBoundary name="ProfileTab"><ProfileTab
          name={name} au={authUser} level={level} st={stats} favs={favs}
          darkMode={darkMode} setDarkMode={setDarkMode}
          setScr={setScr} onNavigate={setScr} doOut={doOut}
          syncReady={_syncReady} onSyncNow={doSyncNow}
          jWords={jWords}
          onOpenLeaderboard={() => setScr('leaderboard_weekly')}
          onOpenFriends={() => setScr('family_group')}
        /></ScreenErrorBoundary></div>}
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
      {currentScreen==="mcresult"&&<McResult questions={mcResultQ} score={mcResultScore} mistakes={mcMistakes} setScr={setScr} goBack={goBack} onNewGame={launchMcGame} award={award} />}
      {// ═══ CROATIAN CASES ═══
      currentScreen==="padezi"&&<PadeziScreen goBack={goBack} award={award} setSt={setStats} />}
      {// ═══ UNJUMBLE / WORD ORDER ═══
      currentScreen==="unjumble"&&<Unjumble goBack={goBack} award={award} />}
      {// ═══ IDIOMS & SLANG ═══
      currentScreen==="idioms"&&<IdiomsScreen goBack={goBack} />}
      {currentScreen==="privacy"&&<PrivacyScreen goBack={goBack} />}
      {currentScreen==="terms"&&<TermsOfService goBack={goBack} />}
      {currentScreen==="admin"&&<AdminDashboard authUser={authUser} goBack={goBack} />}
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
      {// ═══ CONTACT / SUPPORT ═══
      currentScreen==="contact"&&<ContactScreen goBack={goBack} authUser={authUser} name={name} level={level} stats={stats} />}
      {// ═══ LEADERBOARD ═══
      currentScreen==="leaderboard"&&<Leaderboard goBack={goBack} authUser={authUser} name={name} stats={stats} famData={famData} setFamData={setFamData} famMembers={famMembers} setFamMembers={setFamMembers} famLoading={famLoading} setFamLoading={setFamLoading} famName={famName} setFamName={setFamName} famCode={famCode} setFamCode={setFamCode} famErr={famErr} setFamErr={setFamErr} famTab={famTab} setFamTab={setFamTab} />}
      {// ═══ WEEKLY LEADERBOARD SCREEN ═══
      currentScreen==="leaderboard_weekly"&&(()=>{const _wk=(function(){const d=new Date();const day=d.getDay()||7;d.setDate(d.getDate()+4-day);const yr=d.getFullYear();const wk=Math.ceil(((d.getTime()-new Date(yr,0,1).getTime())/86400000+1)/7);return`${yr}-W${String(wk).padStart(2,'0')}`;})();const _weekXP=parseInt(localStorage.getItem('nh_week_xp_'+_wk)||'0',10);return <LeaderboardScreen db={null} user={authUser} weekXP={_weekXP} goBack={goBack} />;})()}
      {// ═══ FRIENDS & FAMILY GROUP SCREEN ═══
      currentScreen==="family_group"&&<ProfileFriendsScreen user={authUser} goBack={goBack} />}
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
      {// ═══ GRAMMAR VIDEOS ═══
      currentScreen==="grammarvideos"&&<GrammarVideos goBack={goBack} setScr={setScr} />}
      {// ═══ GRAMMAR EXPLAINER ═══
      currentScreen==="grammarexplainer"&&<GrammarExplainer goBack={goBack} award={award} />}
      {// ═══ CASE TRANSFORMER ═══
      currentScreen==="casetransformer"&&<CaseTransformer goBack={goBack} award={award} />}
      {// ═══ VOCAB SCENES ═══
      currentScreen==="vocabscenes"&&<VocabScenes goBack={goBack} award={award} />}
      {// ═══ ANIMATED LESSON ═══
      currentScreen==="animlesson"&&animLesson&&<AnimatedLesson lesson={animLesson} goBack={goBack} award={award} />}
      {// ═══ GRAMMAR READER (X-RAY) ═══
      currentScreen==="grammarreader"&&<GrammarReader goBack={goBack} />}
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
      currentScreen==="match"&&<MatchGame initPool={matchInitPool} goBack={goBack} award={award} />}
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
      {// ═══ LISTENING PATH ═══
      currentScreen==="listeningpath"&&<ListeningPath goBack={goBack} />}
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
      {currentScreen==="baka_summer"&&<BakaSummer goBack={goBack} award={award} />}
      {currentScreen==="croatia_today"&&<CroatiaToday goBack={goBack} />}
      {currentScreen==="survival_dinner"&&<SurvivalDinner goBack={goBack} />}
      {currentScreen==="kafic"&&<KaficScreen goBack={goBack} />}
      {currentScreen==="diaspora"&&<DiasporaNote goBack={goBack} />}
      {currentScreen==="tivicompare"&&<TiViScreen goBack={goBack} />}
      {currentScreen==="lifeevents"&&<LifeEventsScreen goBack={goBack} />}
      {currentScreen==="civic"&&<CivicScreen goBack={goBack} />}
      {currentScreen==="easter"&&<EasterScreen onBack={goBack} />}
      {currentScreen==="postcard"&&<PostcardScreen goBack={goBack} award={award} />}
      {currentScreen==="storymode"&&<StoryModeScreen goBack={goBack} award={award} />}
      {currentScreen==="heritage"&&<HeritageStoryScreen goBack={goBack} award={award} />}
      {currentScreen==="croatianews"&&<CroatianNewsScreen goBack={goBack} award={award} />}
      {currentScreen==="phraseofday"&&<PhraseOfDayScreen goBack={goBack} award={award} />}
      {currentScreen==="cloze"&&<ClozeEngine goBack={goBack} award={award} />}
      {currentScreen==="grammarmap"&&<GrammarConstellation goBack={goBack} award={award} />}
      {currentScreen==="my_words"&&<MyWordsScreen onBack={goBack} />}
      {// ═══ MISTAKE REVIEW ═══
      currentScreen==="mistakes"&&<MistakesScreen goBack={goBack} award={award} />}
      {// ═══ ANALYTICS ═══
      currentScreen==="analytics"&&<AnalyticsScreen goBack={goBack} stats={stats} name={name} />}
      {// ═══ GRAMMAR REFERENCE ═══
      currentScreen==="grammar-ref"&&<GrammarReference onClose={()=>setScr("dashboard")} />}
      {// ═══ NEW PLACEMENT TEST (first-time users) ═══
      currentScreen==="new-placement"&&<NewPlacementTest onComplete={function(level){localStorage.setItem("placement_done","1");setStats(function(prev){return{...prev,ct:getPlacementCt(level),lc:Math.max(prev.lc,getPlacementCt(level).length)};});setShowFirstWords(true);}} />}
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
      currentScreen==="badges"&&<BadgesScreen badges={stats.badges} stats={stats} goBack={goBack} />}
      {// ═══ PROFILE ═══
      currentScreen==="profile"&&<ProfileScreen
        name={name} level={level} st={stats} authUser={authUser}
        goBack={goBack} doOut={doOut} setScr={setScr}
      />}
      {currentScreen==="certificate"&&<CertificateScreen name={name} level={level} st={stats} goBack={goBack} />}
      {(authScreen==="app"&&currentScreen!=="welcome"&&currentScreen!=="placement") && <TabBar tab={tab} setTab={setTab} setScr={setScr} badges={badges} />}
      <OfflineBanner />
      <CookieConsent />
      </Suspense>
      </div>
    </div>
    </AppContext.Provider>
  );
}
export default App;
