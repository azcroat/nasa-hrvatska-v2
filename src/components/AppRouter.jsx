import React, { lazy, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSwipeBack } from "../hooks/useSwipeBack.js";
// Local Fisher-Yates shuffle — keeps chunk-data out of AppRouter's startup import.
// Screens that need data (V, GRAM, PITCH_ACCENT, SHADOWING, ASPECT_PAIRS) import it directly.
function _sh(a) { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }
import ScreenErrorBoundary from "./shared/ScreenErrorBoundary.jsx";
const WelcomeScreen = lazyWithReload(() => import("./home/WelcomeScreen.jsx"));
const PlacementTest = lazyWithReload(() => import("../components/auth/PlacementTest.jsx"));
const PaywallScreen = lazyWithReload(() => import("./shared/PaywallScreen.jsx"));
import { useApp } from "../context/AppContext.jsx";
import { useStats } from "../context/StatsContext.jsx";

// Reload on stale-chunk errors (happens after deploy when old index.html tries to
// load chunk files that no longer exist at their old hashed paths, and the SW
// returns the SPA fallback index.html causing a MIME-type or fetch failure).
//
// Error patterns covered:
//   Chrome:       "Expected a JavaScript module script but the server responded with a MIME type of 'text/html'"
//   Chrome:       "Failed to fetch"
//   Safari/WebKit:"importing a module script failed"
//   Firefox:      "error loading dynamically imported module"
//   WebKit iOS:   "Importing binding name 'X' is not found." ← stale cached chunk has
//                 a named import that no longer exists after redeployment / minification
//                 rename (e.g. 'g' was renamed in the new build).
//
// Uses sessionStorage to cap at 2 attempts — prevents infinite loops when the
// SW is stuck (e.g. offline, or Cloudflare down). After 2 attempts, lets
// ScreenErrorBoundary show a stable error rather than looping forever.
function lazyWithReload(fn) {
  return lazy(() => fn().catch((e) => {
    const msg = (e?.message || '') + (e?.name || '');
    const isChunkError =
      msg.includes('Failed to fetch') ||
      msg.includes('importing a module script failed') ||
      msg.includes('dynamically imported module') ||
      msg.includes('Expected a JavaScript module script') ||
      msg.includes('MIME type') ||
      msg.includes('Loading chunk') ||
      msg.includes('Importing binding name');   // WebKit: stale cross-chunk binding mismatch
    if (isChunkError) {
      try {
        const key = 'nh_reload_attempt';
        const n = parseInt(sessionStorage.getItem(key) || '0', 10);
        if (n < 2) {
          sessionStorage.setItem(key, String(n + 1));
          // Purge the JS runtime cache so the reload fetches fresh chunks from network.
          // Without this, StaleWhileRevalidate serves the same stale chunk again.
          if ('caches' in window) {
            caches.keys().then(names => {
              names.forEach(name => { if (name.includes('nasa-hrvatska') && name.includes('-js')) caches.delete(name); });
            }).catch(() => {}).finally(() => window.location.reload());
          } else {
            window.location.reload();
          }
          return new Promise(() => {}); // keep the promise pending so React doesn't render an error state
        }
      } catch (_) {}
    }
    throw e;
  }));
}

// Tabs + screens — lazy-loaded on first use
const HomeTab = lazyWithReload(() => import("./home/HomeTab.jsx"));
const LearnTab = lazyWithReload(() => import("./learn/LearnTab.jsx"));
const CroatiaTab = lazyWithReload(() => import("./croatia/CroatiaTab.jsx"));
const ImmersionHub = lazyWithReload(() => import("./croatia/ImmersionHub.jsx"));
const LyricsScreen = lazyWithReload(() => import("./croatia/LyricsScreen.jsx"));
const AIConversation = lazyWithReload(() => import("./croatia/AIConversation.jsx"));
const MajaScreen = lazyWithReload(() => import("./croatia/MajaScreen.jsx"));
const PersonaScreen = lazyWithReload(() => import("./croatia/PersonaScreen.jsx"));
const ProfileTab = lazyWithReload(() => import("./profile/ProfileTab.jsx"));
const ContactScreen = lazyWithReload(() => import("./profile/ContactScreen.jsx"));
const PracticeTab = lazyWithReload(() => import("./practice/PracticeTab.jsx"));
const LessonScreen = lazyWithReload(() => import("./learn/LessonScreen.jsx"));
const GrammarScreen = lazyWithReload(() => import("./learn/GrammarScreen.jsx"));
const AlphabetScreen = lazyWithReload(() => import("./learn/AlphabetScreen.jsx"));
const ReadingList = lazyWithReload(() => import("./learn/ReadingList.jsx"));
const ReadingScreen = lazyWithReload(() => import("./learn/ReadingScreen.jsx"));
const BadgesScreen = lazyWithReload(() => import("./profile/BadgesScreen.jsx"));
const ProfileScreen = lazyWithReload(() => import("./profile/ProfileScreen.jsx"));
const VocabJournal = lazyWithReload(() => import("./profile/VocabJournal.jsx"));
const FavoritesScreen = lazyWithReload(() => import("./profile/FavoritesScreen.jsx"));
const LearnPath = lazyWithReload(() => import("./profile/LearnPath.jsx"));
const SentenceTileScreen = lazyWithReload(() => import("./practice/SentenceTileScreen.jsx"));
const ProverbsScreen = lazyWithReload(() => import("./croatia/ProverbsScreen.jsx"));
const Flashcards = lazyWithReload(() => import("./practice/Flashcards.jsx"));
const ListeningScreen = lazyWithReload(() => import("./practice/ListeningScreen.jsx"));
const McGame = lazyWithReload(() => import("./practice/McGame.jsx"));
const IdiomsScreen = lazyWithReload(() => import("./croatia/IdiomsScreen.jsx"));
const PrivacyScreen = lazyWithReload(() => import("./shared/PrivacyScreen.jsx"));
const TextingScreen = lazyWithReload(() => import("./croatia/TextingScreen.jsx"));
const FriendsScreen = lazyWithReload(() => import("./croatia/FriendsScreen.jsx"));
const FoodOrderScreen = lazyWithReload(() => import("./croatia/FoodOrderScreen.jsx"));
const TransportScreen = lazyWithReload(() => import("./croatia/TransportScreen.jsx"));
const EmergencyScreen = lazyWithReload(() => import("./croatia/EmergencyScreen.jsx"));
const PopCultureScreen = lazyWithReload(() => import("./croatia/PopCultureScreen.jsx"));
const PracticalScreen = lazyWithReload(() => import("./croatia/PracticalScreen.jsx"));
const SchoolScreen = lazyWithReload(() => import("./croatia/SchoolScreen.jsx"));
const GroceryScreen = lazyWithReload(() => import("./croatia/GroceryScreen.jsx"));
const CroatiaHistoryScreen = lazyWithReload(() => import("./croatia/CroatiaHistoryScreen.jsx"));
const BasketballScreen = lazyWithReload(() => import("./croatia/BasketballScreen.jsx"));
const GymScreen = lazyWithReload(() => import("./croatia/GymScreen.jsx"));
const HNLScreen = lazyWithReload(() => import("./croatia/HNLScreen.jsx"));
const CroatiaAthletes = lazyWithReload(() => import("./croatia/CroatiaAthletes.jsx"));
const RegionScreen = lazyWithReload(() => import("./croatia/RegionScreen.jsx"));
const RoleplayScreen = lazyWithReload(() => import("./croatia/RoleplayScreen.jsx"));
const RecipesScreen = lazyWithReload(() => import("./croatia/RecipesScreen.jsx"));
const CityOfDayScreen = lazyWithReload(() => import("./croatia/CityOfDayScreen.jsx"));
const EventsCalendar = lazyWithReload(() => import("./croatia/EventsCalendar.jsx"));
const Top100Screen = lazyWithReload(() => import("./croatia/Top100Screen.jsx"));
const KingsScreen = lazyWithReload(() => import("./croatia/KingsScreen.jsx"));
const CrMap = lazyWithReload(() => import("./croatia/CrMap.jsx"));
const AspectScreen = lazyWithReload(() => import("./learn/AspectScreen.jsx"));
const FalseFriendsScreen = lazyWithReload(() => import("./learn/FalseFriendsScreen.jsx"));
const DeclensionScreen = lazyWithReload(() => import("./learn/DeclensionScreen.jsx"));
const BrzaliceScreen = lazyWithReload(() => import("./learn/BrzaliceScreen.jsx"));
const DialectsScreen = lazyWithReload(() => import("./learn/DialectsScreen.jsx"));
const DiminutivesScreen = lazyWithReload(() => import("./learn/DiminutivesScreen.jsx"));
const WordFormScreen = lazyWithReload(() => import("./learn/WordFormScreen.jsx"));
const ColorQuirkScreen = lazyWithReload(() => import("./learn/ColorQuirkScreen.jsx"));
const SvojMojScreen = lazyWithReload(() => import("./learn/SvojMojScreen.jsx"));
const ConditionalScreen = lazyWithReload(() => import("./learn/ConditionalScreen.jsx"));
const FormalRegisterScreen = lazyWithReload(() => import("./learn/FormalRegisterScreen.jsx"));
const ImpersonalScreen = lazyWithReload(() => import("./learn/ImpersonalScreen.jsx"));
const TechVocScreen = lazyWithReload(() => import("./learn/TechVocScreen.jsx"));
const BureaucraticScreen = lazyWithReload(() => import("./learn/BureaucraticScreen.jsx"));
const CountriesScreen = lazyWithReload(() => import("./learn/CountriesScreen.jsx"));
const ProfessionsScreen = lazyWithReload(() => import("./learn/ProfessionsScreen.jsx"));
const WeatherScreen = lazyWithReload(() => import("./learn/WeatherScreen.jsx"));
const ClothesScreen = lazyWithReload(() => import("./learn/ClothesScreen.jsx"));
const BodyDescScreen = lazyWithReload(() => import("./learn/BodyDescScreen.jsx"));
const PhonologyScreen = lazyWithReload(() => import("./learn/PhonologyScreen.jsx"));
const ModalScreen = lazyWithReload(() => import("./learn/ModalScreen.jsx"));
const PadeziScreen = lazyWithReload(() => import("./learn/PadeziScreen.jsx"));
const PadezifullScreen = lazyWithReload(() => import("./learn/PadezifullScreen.jsx"));
const TensesScreen = lazyWithReload(() => import("./learn/TensesScreen.jsx"));
const ReflexiveScreen = lazyWithReload(() => import("./practice/exercises/ReflexiveScreen.jsx"));
const FillStoryScreen = lazyWithReload(() => import("./practice/exercises/FillStoryScreen.jsx"));
const ConvMatchScreen = lazyWithReload(() => import("./practice/exercises/ConvMatchScreen.jsx"));
const ScenesScreen = lazyWithReload(() => import("./practice/exercises/ScenesScreen.jsx"));
const PronounsScreen = lazyWithReload(() => import("./practice/exercises/PronounsScreen.jsx"));
const GenderDrillScreen = lazyWithReload(() => import("./practice/exercises/GenderDrillScreen.jsx"));
const SentenceBuilderScreen = lazyWithReload(() => import("./practice/exercises/SentenceBuilderScreen.jsx"));
const VerbDrillScreen = lazyWithReload(() => import("./practice/exercises/VerbDrillScreen.jsx"));
const TenseFlipScreen = lazyWithReload(() => import("./practice/exercises/TenseFlipScreen.jsx"));
const RiddlesScreen = lazyWithReload(() => import("./practice/exercises/RiddlesScreen.jsx"));
const LogicQuizScreen = lazyWithReload(() => import("./practice/exercises/LogicQuizScreen.jsx"));
const OrdinalsScreen = lazyWithReload(() => import("./practice/exercises/OrdinalsScreen.jsx"));
const RelativePronounsScreen = lazyWithReload(() => import("./practice/exercises/RelativePronounsScreen.jsx"));
const EmotionGenderScreen = lazyWithReload(() => import("./practice/exercises/EmotionGenderScreen.jsx"));
const OppositesScreen = lazyWithReload(() => import("./practice/exercises/OppositesScreen.jsx"));
const CityLocativeScreen = lazyWithReload(() => import("./practice/exercises/CityLocativeScreen.jsx"));
const AccusativeDrillScreen = lazyWithReload(() => import("./practice/exercises/AccusativeDrillScreen.jsx"));
const ColorAgreementScreen = lazyWithReload(() => import("./practice/exercises/ColorAgreementScreen.jsx"));
const PossessivesScreen = lazyWithReload(() => import("./practice/exercises/PossessivesScreen.jsx"));
const QuestionWordsScreen = lazyWithReload(() => import("./practice/exercises/QuestionWordsScreen.jsx"));
const NegationScreen = lazyWithReload(() => import("./practice/exercises/NegationScreen.jsx"));
const SibilarizationScreen = lazyWithReload(() => import("./practice/exercises/SibilarizationScreen.jsx"));
const RestaurantScreen = lazyWithReload(() => import("./practice/exercises/RestaurantScreen.jsx"));
const ProfessionGenderScreen = lazyWithReload(() => import("./practice/exercises/ProfessionGenderScreen.jsx"));
const ComparativesScreen = lazyWithReload(() => import("./practice/exercises/ComparativesScreen.jsx"));
const FutureTenseScreen = lazyWithReload(() => import("./practice/exercises/FutureTenseScreen.jsx"));
const McResult = lazyWithReload(() => import("./practice/McResult.jsx"));
const StoryScreens = lazyWithReload(() => import("./practice/StoryScreens.jsx"));
const NumTime = lazyWithReload(() => import("./practice/NumTime.jsx"));
const Unjumble = lazyWithReload(() => import("./practice/Unjumble.jsx"));
const PrepDrill = lazyWithReload(() => import("./practice/PrepDrill.jsx"));
const TypingScreen = lazyWithReload(() => import("./practice/TypingScreen.jsx"));
const ConjugationDrill = lazyWithReload(() => import("./practice/ConjugationDrill.jsx"));
const ZnamGame = lazyWithReload(() => import("./practice/ZnamGame.jsx"));
const BojeGame = lazyWithReload(() => import("./practice/BojeGame.jsx"));
const MatchGame = lazyWithReload(() => import("./practice/MatchGame.jsx"));
const WordSprint = lazyWithReload(() => import("./practice/WordSprint.jsx"));
const SpeakingScreen = lazyWithReload(() => import("./practice/SpeakingScreen.jsx"));
const SpeakingSprintScreen = lazyWithReload(() => import("./practice/SpeakingSprintScreen.jsx"));
const PitchAccentScreen = lazyWithReload(() => import("./practice/PitchAccentScreen.jsx"));
const ShadowingScreen = lazyWithReload(() => import("./practice/ShadowingScreen.jsx"));
const ReviewScreen = lazyWithReload(() => import("./practice/ReviewScreen.jsx"));
const WritingScreen = lazyWithReload(() => import("./practice/WritingScreen.jsx"));
const ListeningPath = lazyWithReload(() => import("./practice/ListeningPath.jsx"));
const AspectDrillScreen = lazyWithReload(() => import("./practice/AspectDrillScreen.jsx"));
const CliticDrill = lazyWithReload(() => import("./practice/CliticDrill.jsx"));
const SlangScreen = lazyWithReload(() => import("./practice/SlangScreen.jsx"));
const NumbersCasesDrill = lazyWithReload(() => import("./practice/NumbersCasesDrill.jsx"));
const ImperativeDrill = lazyWithReload(() => import("./practice/ImperativeDrill.jsx"));
const NegationGenDrill = lazyWithReload(() => import("./practice/NegationGenDrill.jsx"));
const CollocationsGame = lazyWithReload(() => import("./practice/CollocationsGame.jsx"));
const WordFamilies = lazyWithReload(() => import("./practice/WordFamilies.jsx"));
const DictationScreen = lazyWithReload(() => import("./practice/DictationScreen.jsx"));
const PronunciationContrast = lazyWithReload(() => import("./practice/PronunciationContrast.jsx"));
const DialogueSim = lazyWithReload(() => import("./practice/DialogueSim.jsx"));
const CefrTest = lazyWithReload(() => import("./practice/CefrTest.jsx"));
const MyWordsScreen = lazyWithReload(() => import("./practice/MyWordsScreen.jsx"));
const Leaderboard = lazyWithReload(() => import("./profile/Leaderboard.jsx"));
const LeaderboardScreen = lazyWithReload(() => import("./shared/LeaderboardScreen.jsx"));
const ProfileFriendsScreen = lazyWithReload(() => import("./profile/FriendsScreen.jsx"));
const CertificateScreen = lazyWithReload(() => import("./profile/CertificateScreen.jsx"));
const MistakesScreen = lazyWithReload(() => import("./practice/MistakesScreen.jsx"));
const AnalyticsScreen = lazyWithReload(() => import("./profile/AnalyticsScreen.jsx"));
const GrammarReference = lazyWithReload(() => import("./shared/GrammarReference.jsx"));
const BakaSummer = lazyWithReload(() => import("./croatia/BakaSummer.jsx"));
const CroatiaToday = lazyWithReload(() => import("./croatia/CroatiaToday.jsx"));
const SurvivalDinner = lazyWithReload(() => import("./croatia/SurvivalDinner.jsx"));
const ClozeEngine = lazyWithReload(() => import("./practice/ClozeEngine.jsx"));
const GrammarConstellation = lazyWithReload(() => import("./learn/GrammarConstellation.jsx"));
const GrammarExplainer = lazyWithReload(() => import("./learn/GrammarExplainer.jsx"));
const CaseTransformer = lazyWithReload(() => import("./learn/CaseTransformer.jsx"));
const VocabScenes = lazyWithReload(() => import("./learn/VocabScenes.jsx"));
const AnimatedLesson = lazyWithReload(() => import("./learn/AnimatedLesson.jsx"));
const GrammarReader = lazyWithReload(() => import("./learn/GrammarReader.jsx"));
const KaficScreen = lazyWithReload(() => import("./croatia/KaficScreen.jsx"));
const DiasporaNote = lazyWithReload(() => import("./croatia/DiasporaNote.jsx"));
const TiViScreen = lazyWithReload(() => import("./learn/TiViScreen.jsx"));
const GrammarVideos = lazyWithReload(() => import("./learn/GrammarVideos.jsx"));
const LifeEventsScreen = lazyWithReload(() => import("./croatia/LifeEventsScreen.jsx"));
const CivicScreen = lazyWithReload(() => import("./croatia/CivicScreen.jsx"));
const EasterScreen = lazyWithReload(() => import("./croatia/EasterScreen.jsx"));
const PostcardScreen = lazyWithReload(() => import("./croatia/PostcardScreen.jsx"));
const StoryModeScreen = lazyWithReload(() => import("./croatia/StoryModeScreen.jsx"));
const HeritageStoryScreen = lazyWithReload(() => import("./croatia/HeritageStoryScreen.jsx"));
const CroatianNewsScreen = lazyWithReload(() => import("./croatia/CroatianNewsScreen.jsx"));
const PhraseOfDayScreen = lazyWithReload(() => import("./croatia/PhraseOfDayScreen.jsx"));
const AIListeningScreen = lazyWithReload(() => import("./practice/AIListeningScreen.jsx"));
const AIStoryScreen = lazyWithReload(() => import("./practice/AIStoryScreen.jsx"));
const VideoLessonScreen = lazyWithReload(() => import("./practice/VideoLessonScreen.jsx"));
const GrammarDiagnosisScreen = lazyWithReload(() => import("./home/GrammarDiagnosisScreen.jsx"));
const MicroLessonScreen = lazyWithReload(() => import("./learn/MicroLessonScreen.jsx"));
const LiveTutorScreen = lazyWithReload(() => import("./croatia/LiveTutorScreen.jsx"));
const PhotoVocabScanner = lazyWithReload(() => import("./shared/PhotoVocabScanner.jsx"));
const AdminDashboard = lazyWithReload(() => import("./admin/AdminDashboard.jsx"));
const TermsOfService = lazyWithReload(() => import("./shared/TermsOfService.jsx"));
const GradedInputScreen = lazyWithReload(() => import("./learn/GradedInputScreen.jsx"));
const PronunciationCourse = lazyWithReload(() => import("./learn/PronunciationCourse.jsx"));
const PitchAccentMastery = lazyWithReload(() => import("./learn/PitchAccentMastery.jsx"));
const HeritagePathScreen = lazyWithReload(() => import("./croatia/HeritagePathScreen.jsx"));
const DialectAwarenessScreen = lazyWithReload(() => import("./croatia/DialectAwarenessScreen.jsx"));
const HeritageModeScreen = lazyWithReload(() => import("./learn/HeritageModeScreen.jsx"));
const PhonemePracticeScreen = lazyWithReload(() => import("./learn/PhonemePracticeScreen.jsx"));
const PracticalCroatianScreen = lazyWithReload(() => import("./learn/PracticalCroatianScreen.jsx"));
const FrequencyTrackScreen = lazyWithReload(() => import("./learn/FrequencyTrackScreen.jsx"));
const GrammarTrackScreen = lazyWithReload(() => import("./learn/GrammarTrackScreen.jsx"));
const ListeningComprehensionScreen = lazyWithReload(() => import("./practice/ListeningComprehensionScreen.jsx"));

/**
 * AppRouter — renders the correct screen component for `currentScreen`.
 * All screen-level lazy imports live here; App.jsx just passes props and renders <AppRouter />.
 *
 * Shared app state is pulled from AppContext via useApp().
 * Only high-frequency lesson/exercise state remains as direct props.
 */
export default function AppRouter(props) {
  // Pull shared state from context
  const ctx = useApp();
  const { stats, setStats, level, award } = useStats();
  const {
    currentScreen,
    authUser, authScreen: _authScreen, name, setName, doOut,
    favs, toggleFav,
    setScr, goBack, tab, setTab,
    sCurEx,
    jWords: _jWords, setJWords, famData, setFamData,
    isPremium, refreshSub, requirePremium: _requirePremium,
    srchQ, setSrchQ, srchR, srchOpen, setSrchOpen, doSearch,

    famMembers, setFamMembers, famLoading, setFamLoading,
    famName, setFamName, famCode, setFamCode,
    famErr, setFamErr, famTab, setFamTab,
    dchlA, sDchlA, dchlSl, sDchlSl,
    resumeLesson, launchPathItem, launchAnimLesson,
    launchMcGame, launchLegendary, launchCheckpoint, mcGameComplete, launchFlashcards, launchListening, launchMatch, launchSpeaking,
    _syncReady, doSyncNow,
    icons, allCats, getWeekStats,
    isNewUserWindow, daysSinceJoin, comebackBonus,
    weeklyXP: _weeklyXP,
  } = ctx;

  // Direct props: high-frequency lesson/exercise screen state
  const {
    // Placement
    setPlacementQ, setPlacementIdx, setPlacementScore, setPlacementAnswers, setPlacementXp,
    getPlacementCt, setShowFirstWords,
    // Lesson screen state
    lt, li, lx, ls, lp, la, lsl, qi,
    sLt, sLi, sLx, sLs, sLp, sLa, sLsl, sQi,
    // Grammar screen state
    gl, gx, gp, gs, ga, gsl,
    sGl, sGp, sGx, sGs, sGa, sGsl,
    // Match / MC state
    matchInitPool,
    mcInitQ, mcResultQ, mcResultScore, mcMistakes,
    // Reading state
    rp, rph, rqi, rsc, ra, rsl, hw,
    sRph, sRqi, sRsc, sRa, sRsl, sHw, sRp,
    // Speaking state
    sw, si, sx, sr, ssc, sSr, sSx, sSw, sSsc,
    // Misc exercise state
    animLesson,
    fcInitPool, lsInitQ,
    curEx: _curEx,
  } = props;

  const _transKey = currentScreen === "dashboard" ? "dashboard-" + tab : currentScreen;

  // Tab directional transitions — slide direction based on tab order
  const TAB_ORDER = ['home', 'learn', 'practice', 'croatia', 'profile'];
  const prevTabRef = useRef(tab);
  const tabDirection = useRef(0); // -1 = left (going back), 1 = right (going forward)
  useEffect(() => {
    const prev = prevTabRef.current;
    if (prev !== tab) {
      const prevIdx = TAB_ORDER.indexOf(prev);
      const nextIdx = TAB_ORDER.indexOf(tab);
      tabDirection.current = nextIdx > prevIdx ? 1 : -1;
      prevTabRef.current = tab;
    }
  }, [tab]);

  // Swipe-back: disabled on flashcards (has its own swipe handling)
  const swipeEnabled = currentScreen !== 'flashcards';
  useSwipeBack(goBack, swipeEnabled);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={_transKey}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        style={{ height: "100%" }}
      >
      {currentScreen==="welcome" && <WelcomeScreen name={name} au={authUser} st={stats} setScr={setScr} setName={setName} setPlacementQ={setPlacementQ} setPlacementIdx={setPlacementIdx} setPlacementScore={setPlacementScore} setPlacementAnswers={setPlacementAnswers} setPlacementXp={setPlacementXp} />}
      {currentScreen==="placement" && <PlacementTest onComplete={function(level){localStorage.setItem("placement_done","1");setStats(function(prev){return{...prev,ct:getPlacementCt(level),lc:Math.max(prev.lc,getPlacementCt(level).length)};});if(typeof award==='function')award(25);setShowFirstWords(true);setTab('learn');}} />}
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
        tab==="home"&&<div key="tab-home" className={tabDirection.current > 0 ? "slide-in-left" : "slide-in-right"}><ScreenErrorBoundary name="HomeTab"><HomeTab
          dchlA={dchlA} sDchlA={sDchlA} dchlSl={dchlSl} sDchlSl={sDchlSl}
          getWeekStats={getWeekStats}
          setTab={(id)=>{const VALID_TABS={home:1,learn:1,practice:1,croatia:1,profile:1};if(VALID_TABS[id])setTab(id);else setScr(id);}} sCurEx={sCurEx}
          allCats={allCats} sh={_sh}
          launchPathItem={launchPathItem}
          syncReady={_syncReady} onSyncNow={doSyncNow} authUser={authUser}
          comebackBonus={comebackBonus}
          goal={localStorage.getItem('nh_goal')||'fluent'}
          isNewUserWindow={isNewUserWindow}
          daysSinceJoin={daysSinceJoin}
          resumeLesson={resumeLesson}
        /></ScreenErrorBoundary></div>}
        {// ═══ TAB: LEARN ═══
        tab==="learn"&&<div key="tab-learn" className={tabDirection.current > 0 ? "slide-in-right" : "slide-in-left"}><ScreenErrorBoundary name="LearnTab"><LearnTab
          allCats={allCats} icons={icons} sCurEx={sCurEx}
          sh={_sh} sLt={sLt} sLi={sLi} sLx={sLx} sLs={sLs} sLp={sLp} sLa={sLa} sLsl={sLsl}
          sGl={sGl} sGp={sGp} sGx={sGx} sGs={sGs} sGa={sGa} sGsl={sGsl}
          launchPathItem={launchPathItem}
          launchAnimLesson={launchAnimLesson}
        /></ScreenErrorBoundary></div>}
        {// ═══ TAB: PRACTICE ═══
        tab==="practice"&&<div key="tab-practice" className={tabDirection.current > 0 ? "slide-in-right" : "slide-in-left"}><ScreenErrorBoundary name="PracticeTab"><PracticeTab
          allCats={allCats} sh={_sh} sCurEx={sCurEx}
          onLaunchQuiz={launchMcGame} onLaunchFlash={launchFlashcards}
          onLaunchListen={launchListening} onLaunchMatch={launchMatch}
          onLaunchSpeaking={launchSpeaking}
        /></ScreenErrorBoundary></div>}
        {// ═══ TAB: CROATIA ═══
        tab==="croatia"&&<div key="tab-croatia" className={tabDirection.current > 0 ? "slide-in-right" : "slide-in-left"}><ScreenErrorBoundary name="CroatiaTab"><CroatiaTab
          sCurEx={sCurEx}
        /></ScreenErrorBoundary></div>}
        {// ═══ TAB: PROFILE ═══
        tab==="profile"&&<div key="tab-profile" className={tabDirection.current > 0 ? "slide-in-right" : "slide-in-left"}><ScreenErrorBoundary name="ProfileTab"><ProfileTab
          syncReady={_syncReady} onSyncNow={doSyncNow}
          onOpenLeaderboard={() => setScr('leaderboard_weekly')}
          onOpenFriends={() => setScr('family_group')}
        /></ScreenErrorBoundary></div>}
      </div>}
      {currentScreen==="modal"&&<ScreenErrorBoundary key="modal" name="modal"><ModalScreen goBack={goBack} award={award} setSt={setStats} /></ScreenErrorBoundary>}
      {currentScreen==="history"&&<ScreenErrorBoundary key="history" name="history"><CroatiaHistoryScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="events"&&<ScreenErrorBoundary key="events" name="events"><EventsCalendar goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="top100"&&<ScreenErrorBoundary key="top100" name="top100"><Top100Screen goBack={goBack} /></ScreenErrorBoundary>}
      {// ═══ MULTIPLE CHOICE GAME ═══
      currentScreen==="mcgame"&&<ScreenErrorBoundary key="mcgame" name="mcgame"><McGame
        questions={mcInitQ} onComplete={mcGameComplete} goBack={goBack} award={award}
      /></ScreenErrorBoundary>}
      {currentScreen==="mcresult"&&<ScreenErrorBoundary key="mcresult" name="mcresult"><McResult questions={mcResultQ} score={mcResultScore} mistakes={mcMistakes} setScr={setScr} goBack={goBack} onNewGame={launchMcGame} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="padezi"&&<ScreenErrorBoundary key="padezi" name="padezi"><PadeziScreen goBack={goBack} award={award} setSt={setStats} /></ScreenErrorBoundary>}
      {currentScreen==="unjumble"&&<ScreenErrorBoundary key="unjumble" name="unjumble"><Unjumble goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="idioms"&&<ScreenErrorBoundary key="idioms" name="idioms"><IdiomsScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="privacy"&&<ScreenErrorBoundary key="privacy" name="privacy"><PrivacyScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="terms"&&<ScreenErrorBoundary key="terms" name="terms"><TermsOfService goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="admin"&&<ScreenErrorBoundary key="admin" name="admin"><AdminDashboard authUser={authUser} goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="flashcards"&&<ScreenErrorBoundary key="flashcards" name="flashcards"><Flashcards pool={fcInitPool} goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="listening"&&<ScreenErrorBoundary key="listening" name="listening"><ListeningScreen questions={lsInitQ} goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="storyselect"&&<ScreenErrorBoundary key="storyselect" name="storyselect"><StoryScreens goBack={goBack} award={award} sCurEx={sCurEx} /></ScreenErrorBoundary>}
      {currentScreen==="numtime"&&<ScreenErrorBoundary key="numtime" name="numtime"><NumTime goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="proverbs"&&<ScreenErrorBoundary key="proverbs" name="proverbs"><ProverbsScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="contact"&&<ScreenErrorBoundary key="contact" name="contact"><ContactScreen goBack={goBack} authUser={authUser} name={name} level={level} stats={stats} /></ScreenErrorBoundary>}
      {currentScreen==="leaderboard"&&<ScreenErrorBoundary key="leaderboard" name="leaderboard"><Leaderboard goBack={goBack} authUser={authUser} name={name} stats={stats} famData={famData} setFamData={setFamData} famMembers={famMembers} setFamMembers={setFamMembers} famLoading={famLoading} setFamLoading={setFamLoading} famName={famName} setFamName={setFamName} famCode={famCode} setFamCode={setFamCode} famErr={famErr} setFamErr={setFamErr} famTab={famTab} setFamTab={setFamTab} /></ScreenErrorBoundary>}
      {currentScreen==="leaderboard_weekly"&&<ScreenErrorBoundary key="leaderboard_weekly" name="leaderboard_weekly"><LeaderboardScreen db={null} user={authUser} weekXP={_weeklyXP} goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="family_group"&&<ScreenErrorBoundary key="family_group" name="family_group"><ProfileFriendsScreen user={authUser} goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="school"&&<ScreenErrorBoundary key="school" name="school"><SchoolScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="texting"&&<ScreenErrorBoundary key="texting" name="texting"><TextingScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="friends"&&<ScreenErrorBoundary key="friends" name="friends"><FriendsScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="foodorder"&&<ScreenErrorBoundary key="foodorder" name="foodorder"><FoodOrderScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="transport"&&<ScreenErrorBoundary key="transport" name="transport"><TransportScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="emergency"&&<ScreenErrorBoundary key="emergency" name="emergency"><EmergencyScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="football"&&<ScreenErrorBoundary key="football" name="football"><HNLScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="croatiaathletes"&&<ScreenErrorBoundary key="croatiaathletes" name="croatiaathletes"><CroatiaAthletes goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="immersion"&&<ScreenErrorBoundary key="immersion" name="immersion"><ImmersionHub goBack={goBack} setScr={setScr} /></ScreenErrorBoundary>}
      {currentScreen==="lyrics"&&<ScreenErrorBoundary key="lyrics" name="lyrics"><LyricsScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="aiconvo"&&<ScreenErrorBoundary key="aiconvo" name="aiconvo"><AIConversation goBack={goBack} setScr={setScr} sCurEx={sCurEx} setJWords={setJWords} /></ScreenErrorBoundary>}
      {currentScreen==="popculture"&&<ScreenErrorBoundary key="popculture" name="popculture"><PopCultureScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="basketball"&&<ScreenErrorBoundary key="basketball" name="basketball"><BasketballScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="gym"&&<ScreenErrorBoundary key="gym" name="gym"><GymScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="practical"&&<ScreenErrorBoundary key="practical" name="practical"><PracticalScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="region_labin"&&<ScreenErrorBoundary key="region_labin" name="region_labin"><RegionScreen regionKey="labin" goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="region_bibinje"&&<ScreenErrorBoundary key="region_bibinje" name="region_bibinje"><RegionScreen regionKey="bibinje" goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="region_hercegovina"&&<ScreenErrorBoundary key="region_hercegovina" name="region_hercegovina"><RegionScreen regionKey="hercegovina" goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="region_vukovar"&&<ScreenErrorBoundary key="region_vukovar" name="region_vukovar"><RegionScreen regionKey="vukovar" goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="region_zagreb"&&<ScreenErrorBoundary key="region_zagreb" name="region_zagreb"><RegionScreen regionKey="zagreb" goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="region_split"&&<ScreenErrorBoundary key="region_split" name="region_split"><RegionScreen regionKey="split" goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="region_mostar"&&<ScreenErrorBoundary key="region_mostar" name="region_mostar"><RegionScreen regionKey="mostar" goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="region_tomislavgrad"&&<ScreenErrorBoundary key="region_tomislavgrad" name="region_tomislavgrad"><RegionScreen regionKey="tomislavgrad" goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="region_knin"&&<ScreenErrorBoundary key="region_knin" name="region_knin"><RegionScreen regionKey="knin" goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="cityofday"&&<ScreenErrorBoundary key="cityofday" name="cityofday"><CityOfDayScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="region_vinkovci"&&<ScreenErrorBoundary key="region_vinkovci" name="region_vinkovci"><RegionScreen regionKey="vinkovci" goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="padezifull"&&<ScreenErrorBoundary key="padezifull" name="padezifull"><PadezifullScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="aspect"&&<ScreenErrorBoundary key="aspect" name="aspect"><AspectScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="grammarvideos"&&<ScreenErrorBoundary key="grammarvideos" name="grammarvideos"><GrammarVideos goBack={goBack} setScr={setScr} /></ScreenErrorBoundary>}
      {currentScreen==="grammarexplainer"&&<ScreenErrorBoundary key="grammarexplainer" name="grammarexplainer"><GrammarExplainer goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="casetransformer"&&<ScreenErrorBoundary key="casetransformer" name="casetransformer"><CaseTransformer goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="vocabscenes"&&<ScreenErrorBoundary key="vocabscenes" name="vocabscenes"><VocabScenes goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {// ═══ ANIMATED LESSON ═══
      currentScreen==="animlesson"&&animLesson&&<ScreenErrorBoundary key="animlesson" name="animlesson"><AnimatedLesson lesson={animLesson} goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="grammarreader"&&<ScreenErrorBoundary key="grammarreader" name="grammarreader"><GrammarReader goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="falsefr"&&<ScreenErrorBoundary key="falsefr" name="falsefr"><FalseFriendsScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="prepdrill"&&<ScreenErrorBoundary key="prepdrill" name="prepdrill"><PrepDrill goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="declension"&&<ScreenErrorBoundary key="declension" name="declension"><DeclensionScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="brzalice"&&<ScreenErrorBoundary key="brzalice" name="brzalice"><BrzaliceScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="dialects"&&<ScreenErrorBoundary key="dialects" name="dialects"><DialectsScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="diminutives"&&<ScreenErrorBoundary key="diminutives" name="diminutives"><DiminutivesScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="wordform"&&<ScreenErrorBoundary key="wordform" name="wordform"><WordFormScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="colorquirk"&&<ScreenErrorBoundary key="colorquirk" name="colorquirk"><ColorQuirkScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="svojmoj"&&<ScreenErrorBoundary key="svojmoj" name="svojmoj"><SvojMojScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="conditional"&&<ScreenErrorBoundary key="conditional" name="conditional"><ConditionalScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="formalregister"&&<ScreenErrorBoundary key="formalregister" name="formalregister"><FormalRegisterScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="impersonal"&&<ScreenErrorBoundary key="impersonal" name="impersonal"><ImpersonalScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="techvoc"&&<ScreenErrorBoundary key="techvoc" name="techvoc"><TechVocScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="bureaucratic"&&<ScreenErrorBoundary key="bureaucratic" name="bureaucratic"><BureaucraticScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="countries"&&<ScreenErrorBoundary key="countries" name="countries"><CountriesScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="professions"&&<ScreenErrorBoundary key="professions" name="professions"><ProfessionsScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="weather"&&<ScreenErrorBoundary key="weather" name="weather"><WeatherScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="clothes"&&<ScreenErrorBoundary key="clothes" name="clothes"><ClothesScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="bodydesc"&&<ScreenErrorBoundary key="bodydesc" name="bodydesc"><BodyDescScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="phonology"&&<ScreenErrorBoundary key="phonology" name="phonology"><PhonologyScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="typing"&&<ScreenErrorBoundary key="typing" name="typing"><TypingScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="tenses"&&<ScreenErrorBoundary key="tenses" name="tenses"><TensesScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="crmap"&&<ScreenErrorBoundary key="crmap" name="crmap"><CrMap goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="grocery"&&<ScreenErrorBoundary key="grocery" name="grocery"><GroceryScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="recipes"&&<ScreenErrorBoundary key="recipes" name="recipes"><RecipesScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="roleplay"&&<ScreenErrorBoundary key="roleplay" name="roleplay"><RoleplayScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="journal"&&<ScreenErrorBoundary key="journal" name="journal"><VocabJournal goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="learnpath"&&<ScreenErrorBoundary key="learnpath" name="learnpath"><LearnPath st={stats} setScr={setScr} goBack={goBack} onLaunchLegendary={launchLegendary} onLaunchCheckpoint={launchCheckpoint} /></ScreenErrorBoundary>}
      {// ═══ FAVORITES ═══
      currentScreen==="favorites"&&<ScreenErrorBoundary key="favorites" name="favorites"><FavoritesScreen
        favs={favs} toggleFav={toggleFav} setScr={setScr} goBack={goBack}
      /></ScreenErrorBoundary>}
      {currentScreen==="reflexive"&&<ScreenErrorBoundary key="reflexive" name="reflexive"><ReflexiveScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="fillstory"&&<ScreenErrorBoundary key="fillstory" name="fillstory"><FillStoryScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="convmatch"&&<ScreenErrorBoundary key="convmatch" name="convmatch"><ConvMatchScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="scenes"&&<ScreenErrorBoundary key="scenes" name="scenes"><ScenesScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="pronouns"&&<ScreenErrorBoundary key="pronouns" name="pronouns"><PronounsScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="genderdrill"&&<ScreenErrorBoundary key="genderdrill" name="genderdrill"><GenderDrillScreen goBack={goBack} award={award} setSt={setStats} /></ScreenErrorBoundary>}
      {currentScreen==="sentbuild"&&<ScreenErrorBoundary key="sentbuild" name="sentbuild"><SentenceBuilderScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="sentencetiles"&&<ScreenErrorBoundary key="sentencetiles" name="sentencetiles"><SentenceTileScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="verbdrill"&&<ScreenErrorBoundary key="verbdrill" name="verbdrill"><VerbDrillScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="tenseflip"&&<ScreenErrorBoundary key="tenseflip" name="tenseflip"><TenseFlipScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="riddles"&&<ScreenErrorBoundary key="riddles" name="riddles"><RiddlesScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="logicquiz"&&<ScreenErrorBoundary key="logicquiz" name="logicquiz"><LogicQuizScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="ordinals"&&<ScreenErrorBoundary key="ordinals" name="ordinals"><OrdinalsScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="relpron"&&<ScreenErrorBoundary key="relpron" name="relpron"><RelativePronounsScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="emogender"&&<ScreenErrorBoundary key="emogender" name="emogender"><EmotionGenderScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="opposites"&&<ScreenErrorBoundary key="opposites" name="opposites"><OppositesScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="cityloc"&&<ScreenErrorBoundary key="cityloc" name="cityloc"><CityLocativeScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="akudrill"&&<ScreenErrorBoundary key="akudrill" name="akudrill"><AccusativeDrillScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="coloragree"&&<ScreenErrorBoundary key="coloragree" name="coloragree"><ColorAgreementScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="possess"&&<ScreenErrorBoundary key="possess" name="possess"><PossessivesScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="qwords"&&<ScreenErrorBoundary key="qwords" name="qwords"><QuestionWordsScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="negation"&&<ScreenErrorBoundary key="negation" name="negation"><NegationScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="sibil"&&<ScreenErrorBoundary key="sibil" name="sibil"><SibilarizationScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="restaurant"&&<ScreenErrorBoundary key="restaurant" name="restaurant"><RestaurantScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="profgender"&&<ScreenErrorBoundary key="profgender" name="profgender"><ProfessionGenderScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="comparatives"&&<ScreenErrorBoundary key="comparatives" name="comparatives"><ComparativesScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="future"&&<ScreenErrorBoundary key="future" name="future"><FutureTenseScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="kings"&&<ScreenErrorBoundary key="kings" name="kings"><KingsScreen goBack={goBack} award={award} setSt={setStats} /></ScreenErrorBoundary>}
      {currentScreen==="conjdrill"&&<ScreenErrorBoundary key="conjdrill" name="conjdrill"><ConjugationDrill goBack={goBack} award={award} setSt={setStats} /></ScreenErrorBoundary>}
      {currentScreen==="znam"&&<ScreenErrorBoundary key="znam" name="znam"><ZnamGame goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="boje"&&<ScreenErrorBoundary key="boje" name="boje"><BojeGame goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="match"&&<ScreenErrorBoundary key="match" name="match"><MatchGame initPool={matchInitPool} goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="wordsprint"&&<ScreenErrorBoundary key="wordsprint" name="wordsprint"><WordSprint sh={_sh} award={award} goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="speaking"&&<ScreenErrorBoundary key="speaking" name="speaking"><SpeakingScreen sw={sw} si={si} sx={sx} sr={sr} ssc={ssc} sSr={sSr} sSx={sSx} sSw={sSw} sSsc={sSsc} goBack={goBack} award={award} setSt={setStats} /></ScreenErrorBoundary>}
      {currentScreen==="speaking_sprint"&&<ScreenErrorBoundary key="speaking_sprint" name="speaking_sprint"><SpeakingSprintScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="pitchaccent"&&<ScreenErrorBoundary key="pitchaccent" name="pitchaccent"><PitchAccentScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="shadowing"&&<ScreenErrorBoundary key="shadowing" name="shadowing"><ShadowingScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="review"&&<ScreenErrorBoundary key="review" name="review"><ReviewScreen goBack={goBack} award={award} allCats={allCats} /></ScreenErrorBoundary>}
      {currentScreen==="writing"&&<ScreenErrorBoundary key="writing" name="writing"><WritingScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="listeningpath"&&<ScreenErrorBoundary key="listeningpath" name="listeningpath"><ListeningPath goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="aspectdrill"&&<ScreenErrorBoundary key="aspectdrill" name="aspectdrill"><AspectDrillScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="clitic"&&<ScreenErrorBoundary key="clitic" name="clitic"><CliticDrill goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="numcases"&&<ScreenErrorBoundary key="numcases" name="numcases"><NumbersCasesDrill goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="imperative"&&<ScreenErrorBoundary key="imperative" name="imperative"><ImperativeDrill goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="neggen"&&<ScreenErrorBoundary key="neggen" name="neggen"><NegationGenDrill goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="collocations"&&<ScreenErrorBoundary key="collocations" name="collocations"><CollocationsGame goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="wordfamilies"&&<ScreenErrorBoundary key="wordfamilies" name="wordfamilies"><WordFamilies goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="dictation"&&<ScreenErrorBoundary key="dictation" name="dictation"><DictationScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="proncontrast"&&<ScreenErrorBoundary key="proncontrast" name="proncontrast"><PronunciationContrast goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="dialogue"&&<ScreenErrorBoundary key="dialogue" name="dialogue"><DialogueSim goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="cefrtest"&&<ScreenErrorBoundary key="cefrtest" name="cefrtest"><CefrTest goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="slang"&&<ScreenErrorBoundary key="slang" name="slang"><SlangScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="baka_summer"&&<ScreenErrorBoundary key="baka_summer" name="baka_summer"><BakaSummer goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="croatia_today"&&<ScreenErrorBoundary key="croatia_today" name="croatia_today"><CroatiaToday goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="survival_dinner"&&<ScreenErrorBoundary key="survival_dinner" name="survival_dinner"><SurvivalDinner goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="kafic"&&<ScreenErrorBoundary key="kafic" name="kafic"><KaficScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="diaspora"&&<ScreenErrorBoundary key="diaspora" name="diaspora"><DiasporaNote goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="tivicompare"&&<ScreenErrorBoundary key="tivicompare" name="tivicompare"><TiViScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="lifeevents"&&<ScreenErrorBoundary key="lifeevents" name="lifeevents"><LifeEventsScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="civic"&&<ScreenErrorBoundary key="civic" name="civic"><CivicScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="easter"&&<ScreenErrorBoundary key="easter" name="easter"><EasterScreen onBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="postcard"&&<ScreenErrorBoundary key="postcard" name="postcard"><PostcardScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="storymode"&&<ScreenErrorBoundary key="storymode" name="storymode"><StoryModeScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="personas"&&<ScreenErrorBoundary key="personas" name="personas"><PersonaScreen goBack={goBack} setScr={setScr} /></ScreenErrorBoundary>}
      {currentScreen==="maja"&&<ScreenErrorBoundary key="maja" name="maja">{isPremium?<MajaScreen goBack={goBack} award={award} />:<PaywallScreen featureName="Maja AI Tutor" onClose={goBack} onSubscribed={()=>{refreshSub();}} />}</ScreenErrorBoundary>}
      {currentScreen==="live_tutor"&&<ScreenErrorBoundary key="live_tutor" name="live_tutor">{isPremium?<LiveTutorScreen goBack={goBack} award={award} />:<PaywallScreen featureName="Live Tutor" onClose={goBack} onSubscribed={()=>{refreshSub();}} />}</ScreenErrorBoundary>}
      {currentScreen==="photo_vocab"&&<ScreenErrorBoundary key="photo_vocab" name="photo_vocab"><PhotoVocabScanner goBack={goBack} level={level} onSaveWords={(words)=>{words.forEach(w=>{if(w.hr&&w.en)setJWords(prev=>[...(prev||[]),{hr:w.hr,en:w.en}]);});}} /></ScreenErrorBoundary>}
      {currentScreen==="ai_listening"&&<ScreenErrorBoundary key="ai_listening" name="ai_listening"><AIListeningScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="ai_story"&&<ScreenErrorBoundary key="ai_story" name="ai_story"><AIStoryScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="video_lesson"&&<ScreenErrorBoundary key="video_lesson" name="video_lesson"><VideoLessonScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="grammar_diagnosis"&&<ScreenErrorBoundary key="grammar_diagnosis" name="grammar_diagnosis"><GrammarDiagnosisScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="micro_lesson"&&<ScreenErrorBoundary key="micro_lesson" name="micro_lesson"><MicroLessonScreen goBack={goBack} award={award} goFlashcards={()=>{launchFlashcards([]);}} /></ScreenErrorBoundary>}
      {currentScreen==="heritage"&&<ScreenErrorBoundary key="heritage" name="heritage"><HeritageStoryScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="croatianews"&&<ScreenErrorBoundary key="croatianews" name="croatianews"><CroatianNewsScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="phraseofday"&&<ScreenErrorBoundary key="phraseofday" name="phraseofday"><PhraseOfDayScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="cloze"&&<ScreenErrorBoundary key="cloze" name="cloze"><ClozeEngine goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="graded_input"&&<ScreenErrorBoundary key="graded_input" name="graded_input"><GradedInputScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="pronunciation_course"&&<ScreenErrorBoundary key="pronunciation_course" name="pronunciation_course"><PronunciationCourse goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="pitch_accent"&&<ScreenErrorBoundary key="pitch_accent" name="pitch_accent"><PitchAccentMastery goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="heritage_path"&&<ScreenErrorBoundary key="heritage_path" name="heritage_path"><HeritagePathScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="dialect_awareness"&&<ScreenErrorBoundary key="dialect_awareness" name="dialect_awareness"><DialectAwarenessScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="heritage_mode"&&<ScreenErrorBoundary key="heritage_mode" name="heritage_mode"><HeritageModeScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="phoneme_practice"&&<ScreenErrorBoundary key="phoneme_practice" name="phoneme_practice"><PhonemePracticeScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="frequency_track"&&<ScreenErrorBoundary key="frequency_track" name="frequency_track"><FrequencyTrackScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="practical_croatian"&&<ScreenErrorBoundary key="practical_croatian" name="practical_croatian"><PracticalCroatianScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="grammarmap"&&<ScreenErrorBoundary key="grammarmap" name="grammarmap"><GrammarConstellation goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="grammar_track"&&<ScreenErrorBoundary key="grammar_track" name="grammar_track"><GrammarTrackScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="listening_comprehension"&&<ScreenErrorBoundary key="listening_comprehension" name="listening_comprehension"><ListeningComprehensionScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="my_words"&&<ScreenErrorBoundary key="my_words" name="my_words"><MyWordsScreen onBack={goBack} award={typeof award==='function'?award:undefined} /></ScreenErrorBoundary>}
      {currentScreen==="mistakes"&&<ScreenErrorBoundary key="mistakes" name="mistakes"><MistakesScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="analytics"&&<ScreenErrorBoundary key="analytics" name="analytics"><AnalyticsScreen goBack={goBack} stats={stats} name={name} /></ScreenErrorBoundary>}
      {// ═══ GRAMMAR REFERENCE ═══
      currentScreen==="grammar-ref"&&<ScreenErrorBoundary key="grammar-ref" name="grammar-ref"><GrammarReference onClose={()=>setScr("dashboard")} /></ScreenErrorBoundary>}
      {// ═══ NEW PLACEMENT TEST (first-time users) ═══
      currentScreen==="new-placement"&&<ScreenErrorBoundary key="new-placement" name="new-placement"><PlacementTest onComplete={function(level){localStorage.setItem("placement_done","1");setStats(function(prev){return{...prev,ct:getPlacementCt(level),lc:Math.max(prev.lc,getPlacementCt(level).length)};});if(typeof award==='function')award(25);setShowFirstWords(true);setTimeout(()=>setTab('learn'),300);}} /></ScreenErrorBoundary>}
      {// ═══ VOCABULARY LESSON ═══
      currentScreen==="lesson"&&<ScreenErrorBoundary key="lesson" name="lesson"><LessonScreen
        lt={lt} li={li} lx={lx} ls={ls} lp={lp} la={la} lsl={lsl} qi={qi} icons={icons}
        sLi={sLi} sLx={sLx} sLs={sLs} sLp={sLp} sLa={sLa} sLsl={sLsl} sQi={sQi}
        goBack={goBack} award={award} setSt={setStats} setScr={setScr}
        goToPractice={() => { goBack(); setTimeout(() => setTab('practice'), 50); }}
      /></ScreenErrorBoundary>}
      {// ═══ GRAMMAR ═══
      currentScreen==="grammar"&&<ScreenErrorBoundary key="grammar" name="grammar"><GrammarScreen
        gl={gl} gp={gp} gx={gx} gs={gs} ga={ga} gsl={gsl}
        sGp={sGp} sGx={sGx} sGs={sGs} sGa={sGa} sGsl={sGsl}
        goBack={goBack} award={award} setSt={setStats}
      /></ScreenErrorBoundary>}
      {currentScreen==="alphabet"&&<ScreenErrorBoundary key="alphabet" name="alphabet"><AlphabetScreen goBack={goBack} /></ScreenErrorBoundary>}
      {// ═══ READING LIST ═══
      currentScreen==="readlist"&&<ScreenErrorBoundary key="readlist" name="readlist"><ReadingList
        setScr={setScr} sRp={sRp} sRph={sRph} sRqi={sRqi} sRsc={sRsc}
        sRa={sRa} sRsl={sRsl} sHw={sHw} sCurEx={sCurEx} goBack={goBack}
      /></ScreenErrorBoundary>}
      {// ═══ READING ═══
      currentScreen==="reading"&&<ScreenErrorBoundary key="reading" name="reading"><ReadingScreen
        rp={rp} rph={rph} rqi={rqi} rsc={rsc} ra={ra} rsl={rsl} hw={hw}
        sRph={sRph} sRqi={sRqi} sRsc={sRsc} sRa={sRa} sRsl={sRsl} sHw={sHw}
        goBack={goBack} setScr={setScr} award={award} setSt={setStats}
      /></ScreenErrorBoundary>}
      {currentScreen==="badges"&&<ScreenErrorBoundary key="badges" name="badges"><BadgesScreen badges={stats.badges} stats={stats} goBack={goBack} /></ScreenErrorBoundary>}
      {// ═══ PROFILE ═══
      currentScreen==="profile"&&<ScreenErrorBoundary key="profile" name="profile"><ProfileScreen
        name={name} level={level} st={stats} authUser={authUser}
        goBack={goBack} doOut={doOut} setScr={setScr}
      /></ScreenErrorBoundary>}
      {currentScreen==="certificate"&&<ScreenErrorBoundary key="certificate" name="certificate"><CertificateScreen name={name} level={level} st={stats} goBack={goBack} /></ScreenErrorBoundary>}
      </motion.div>
    </AnimatePresence>
  );
}
