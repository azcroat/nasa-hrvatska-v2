import React, { lazy } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { V, GRAM, PITCH_ACCENT, SHADOWING, ASPECT_PAIRS, sh } from "../data.jsx";
import { LESSONS as ANIM_LESSONS } from "../data/lessons.js";
import ScreenErrorBoundary from "./shared/ScreenErrorBoundary.jsx";
import WelcomeScreen from "./home/WelcomeScreen.jsx";
import PlacementTest from "../components/auth/PlacementTest.jsx";
import PaywallScreen from "./shared/PaywallScreen.jsx";

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

/**
 * AppRouter — renders the correct screen component for `currentScreen`.
 * All screen-level lazy imports live here; App.jsx just passes props and renders <AppRouter />.
 */
export default function AppRouter(props) {
  const {
    // Core navigation
    currentScreen, goBack, setScr, setTab,
    // Auth / user
    authUser, authScreen, name, setName, level, stats, setStats,
    // Award function
    award,
    // Subscription
    isPremium, refreshSub,
    // Search
    srchQ, setSrchQ, srchR, srchOpen, setSrchOpen, doSearch,
    // Translator
    tDir, sTDir, tIn, sTIn, tOut, tL, doTr,
    // Tabs
    tab,
    // Family
    famData, setFamData, famMembers, setFamMembers, famLoading, setFamLoading,
    famName, setFamName, famCode, setFamCode, famErr, setFamErr, famTab, setFamTab,
    // Daily challenge
    dchlA, sDchlA, dchlSl, sDchlSl,
    // Journal
    setJWords,
    // Favs
    favs, toggleFav,
    // Misc
    icons, allCats, getWeekStats, isNewUserWindow, daysSinceJoin, comebackBonus,
    resumeLesson, launchPathItem, launchAnimLesson,
    launchMcGame, mcGameComplete, launchFlashcards, launchListening, launchMatch, launchSpeaking,
    _syncReady, doSyncNow,
    // Placement
    setPlacementQ, setPlacementIdx, setPlacementScore, setPlacementAnswers, setPlacementXp,
    getPlacementCt, setShowFirstWords,
    // Weekly XP (pre-computed in App.jsx)
    _weeklyXP,
    // Screen state (from useAppScreenState)
    lt, li, lx, ls, lp, la, lsl, qi,
    sLt, sLi, sLx, sLs, sLp, sLa, sLsl, sQi,
    gl, gx, gp, gs, ga, gsl,
    sGl, sGp, sGx, sGs, sGa, sGsl,
    matchInitPool,
    mcInitQ, mcResultQ, mcResultScore, mcMistakes,
    rp, rph, rqi, rsc, ra, rsl, hw,
    sRph, sRqi, sRsc, sRa, sRsl, sHw, sRp,
    sw, si, sx, sr, ssc, sSr, sSx, sSw, sSsc,
    animLesson,
    fcInitPool, lsInitQ,
    curEx, sCurEx,
    doOut,
  } = props;

  const _transKey = currentScreen === "dashboard" ? "dashboard-" + tab : currentScreen;

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
      {currentScreen==="placement" && <PlacementTest onComplete={function(level){localStorage.setItem("placement_done","1");setStats(function(prev){return{...prev,ct:getPlacementCt(level),lc:Math.max(prev.lc,getPlacementCt(level).length)};});award(25);setShowFirstWords(true);setTimeout(()=>setTab('learn'),300);}} />}
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
          tDir={tDir} sTDir={sTDir} tIn={tIn} sTIn={sTIn} tOut={tOut} tL={tL} doTr={doTr}
          dchlA={dchlA} sDchlA={sDchlA} dchlSl={dchlSl} sDchlSl={sDchlSl}
          getWeekStats={getWeekStats}
          setTab={(id)=>{const VALID_TABS={home:1,learn:1,practice:1,croatia:1,profile:1};if(VALID_TABS[id])setTab(id);else setScr(id);}} sCurEx={sCurEx}
          allCats={allCats} sh={sh}
          launchPathItem={launchPathItem}
          syncReady={_syncReady} onSyncNow={doSyncNow} authUser={authUser}
          comebackBonus={comebackBonus}
          goal={localStorage.getItem('nh_goal')||'fluent'}
          isNewUserWindow={isNewUserWindow}
          daysSinceJoin={daysSinceJoin}
          resumeLesson={resumeLesson}
        /></ScreenErrorBoundary></div>}
        {// ═══ TAB: LEARN ═══
        tab==="learn"&&<div key="tab-learn" className="screen-enter"><ScreenErrorBoundary name="LearnTab"><LearnTab
          allCats={allCats} icons={icons} sCurEx={sCurEx}
          sh={sh} sLt={sLt} sLi={sLi} sLx={sLx} sLs={sLs} sLp={sLp} sLa={sLa} sLsl={sLsl}
          sGl={sGl} sGp={sGp} sGx={sGx} sGs={sGs} sGa={sGa} sGsl={sGsl}
          launchPathItem={launchPathItem}
          launchAnimLesson={launchAnimLesson}
        /></ScreenErrorBoundary></div>}
        {// ═══ TAB: PRACTICE ═══
        tab==="practice"&&<div key="tab-practice" className="screen-enter"><ScreenErrorBoundary name="PracticeTab"><PracticeTab
          allCats={allCats} sh={sh} sCurEx={sCurEx}
          onLaunchQuiz={launchMcGame} onLaunchFlash={launchFlashcards}
          onLaunchListen={launchListening} onLaunchMatch={launchMatch}
          onLaunchSpeaking={launchSpeaking}
        /></ScreenErrorBoundary></div>}
        {// ═══ TAB: CROATIA ═══
        tab==="croatia"&&<div key="tab-croatia" className="screen-enter"><ScreenErrorBoundary name="CroatiaTab"><CroatiaTab
          sCurEx={sCurEx}
        /></ScreenErrorBoundary></div>}
        {// ═══ TAB: PROFILE ═══
        tab==="profile"&&<div key="tab-profile" className="screen-enter"><ScreenErrorBoundary name="ProfileTab"><ProfileTab
          syncReady={_syncReady} onSyncNow={doSyncNow}
          onOpenLeaderboard={() => setScr('leaderboard_weekly')}
          onOpenFriends={() => setScr('family_group')}
        /></ScreenErrorBoundary></div>}
      </div>}
      {currentScreen==="modal"&&<ScreenErrorBoundary key="modal" screenName="modal"><ModalScreen goBack={goBack} award={award} setSt={setStats} /></ScreenErrorBoundary>}
      {currentScreen==="history"&&<ScreenErrorBoundary key="history" screenName="history"><CroatiaHistoryScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="events"&&<ScreenErrorBoundary key="events" screenName="events"><EventsCalendar goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="top100"&&<ScreenErrorBoundary key="top100" screenName="top100"><Top100Screen goBack={goBack} /></ScreenErrorBoundary>}
      {// ═══ MULTIPLE CHOICE GAME ═══
      currentScreen==="mcgame"&&<ScreenErrorBoundary key="mcgame" screenName="mcgame"><McGame
        questions={mcInitQ} onComplete={mcGameComplete} goBack={goBack} award={award}
      /></ScreenErrorBoundary>}
      {currentScreen==="mcresult"&&<ScreenErrorBoundary key="mcresult" screenName="mcresult"><McResult questions={mcResultQ} score={mcResultScore} mistakes={mcMistakes} setScr={setScr} goBack={goBack} onNewGame={launchMcGame} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="padezi"&&<ScreenErrorBoundary key="padezi" screenName="padezi"><PadeziScreen goBack={goBack} award={award} setSt={setStats} /></ScreenErrorBoundary>}
      {currentScreen==="unjumble"&&<ScreenErrorBoundary key="unjumble" screenName="unjumble"><Unjumble goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="idioms"&&<ScreenErrorBoundary key="idioms" screenName="idioms"><IdiomsScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="privacy"&&<ScreenErrorBoundary key="privacy" screenName="privacy"><PrivacyScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="terms"&&<ScreenErrorBoundary key="terms" screenName="terms"><TermsOfService goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="admin"&&<ScreenErrorBoundary key="admin" screenName="admin"><AdminDashboard authUser={authUser} goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="flashcards"&&<ScreenErrorBoundary key="flashcards" screenName="flashcards"><Flashcards pool={fcInitPool} goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="listening"&&<ScreenErrorBoundary key="listening" screenName="listening"><ListeningScreen questions={lsInitQ} goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="storyselect"&&<ScreenErrorBoundary key="storyselect" screenName="storyselect"><StoryScreens goBack={goBack} award={award} sCurEx={sCurEx} /></ScreenErrorBoundary>}
      {currentScreen==="numtime"&&<ScreenErrorBoundary key="numtime" screenName="numtime"><NumTime goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="proverbs"&&<ScreenErrorBoundary key="proverbs" screenName="proverbs"><ProverbsScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="contact"&&<ScreenErrorBoundary key="contact" screenName="contact"><ContactScreen goBack={goBack} authUser={authUser} name={name} level={level} stats={stats} /></ScreenErrorBoundary>}
      {currentScreen==="leaderboard"&&<ScreenErrorBoundary key="leaderboard" screenName="leaderboard"><Leaderboard goBack={goBack} authUser={authUser} name={name} stats={stats} famData={famData} setFamData={setFamData} famMembers={famMembers} setFamMembers={setFamMembers} famLoading={famLoading} setFamLoading={setFamLoading} famName={famName} setFamName={setFamName} famCode={famCode} setFamCode={setFamCode} famErr={famErr} setFamErr={setFamErr} famTab={famTab} setFamTab={setFamTab} /></ScreenErrorBoundary>}
      {currentScreen==="leaderboard_weekly"&&<ScreenErrorBoundary key="leaderboard_weekly" screenName="leaderboard_weekly"><LeaderboardScreen db={null} user={authUser} weekXP={_weeklyXP} goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="family_group"&&<ScreenErrorBoundary key="family_group" screenName="family_group"><ProfileFriendsScreen user={authUser} goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="school"&&<ScreenErrorBoundary key="school" screenName="school"><SchoolScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="texting"&&<ScreenErrorBoundary key="texting" screenName="texting"><TextingScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="friends"&&<ScreenErrorBoundary key="friends" screenName="friends"><FriendsScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="foodorder"&&<ScreenErrorBoundary key="foodorder" screenName="foodorder"><FoodOrderScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="transport"&&<ScreenErrorBoundary key="transport" screenName="transport"><TransportScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="emergency"&&<ScreenErrorBoundary key="emergency" screenName="emergency"><EmergencyScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="football"&&<ScreenErrorBoundary key="football" screenName="football"><HNLScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="croatiaathletes"&&<ScreenErrorBoundary key="croatiaathletes" screenName="croatiaathletes"><CroatiaAthletes goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="immersion"&&<ScreenErrorBoundary key="immersion" screenName="immersion"><ImmersionHub goBack={goBack} setScr={setScr} /></ScreenErrorBoundary>}
      {currentScreen==="lyrics"&&<ScreenErrorBoundary key="lyrics" screenName="lyrics"><LyricsScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="aiconvo"&&<ScreenErrorBoundary key="aiconvo" screenName="aiconvo">{isPremium?<AIConversation goBack={goBack} setScr={setScr} sCurEx={sCurEx} setJWords={setJWords} />:<PaywallScreen featureName="AI Conversation" onClose={goBack} onSubscribed={()=>{refreshSub();}} />}</ScreenErrorBoundary>}
      {currentScreen==="popculture"&&<ScreenErrorBoundary key="popculture" screenName="popculture"><PopCultureScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="basketball"&&<ScreenErrorBoundary key="basketball" screenName="basketball"><BasketballScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="gym"&&<ScreenErrorBoundary key="gym" screenName="gym"><GymScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="practical"&&<ScreenErrorBoundary key="practical" screenName="practical"><PracticalScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="region_labin"&&<ScreenErrorBoundary key="region_labin" screenName="region_labin"><RegionScreen regionKey="labin" goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="region_bibinje"&&<ScreenErrorBoundary key="region_bibinje" screenName="region_bibinje"><RegionScreen regionKey="bibinje" goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="region_hercegovina"&&<ScreenErrorBoundary key="region_hercegovina" screenName="region_hercegovina"><RegionScreen regionKey="hercegovina" goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="region_vukovar"&&<ScreenErrorBoundary key="region_vukovar" screenName="region_vukovar"><RegionScreen regionKey="vukovar" goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="region_zagreb"&&<ScreenErrorBoundary key="region_zagreb" screenName="region_zagreb"><RegionScreen regionKey="zagreb" goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="region_split"&&<ScreenErrorBoundary key="region_split" screenName="region_split"><RegionScreen regionKey="split" goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="region_mostar"&&<ScreenErrorBoundary key="region_mostar" screenName="region_mostar"><RegionScreen regionKey="mostar" goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="region_tomislavgrad"&&<ScreenErrorBoundary key="region_tomislavgrad" screenName="region_tomislavgrad"><RegionScreen regionKey="tomislavgrad" goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="region_knin"&&<ScreenErrorBoundary key="region_knin" screenName="region_knin"><RegionScreen regionKey="knin" goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="cityofday"&&<ScreenErrorBoundary key="cityofday" screenName="cityofday"><CityOfDayScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="region_vinkovci"&&<ScreenErrorBoundary key="region_vinkovci" screenName="region_vinkovci"><RegionScreen regionKey="vinkovci" goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="padezifull"&&<ScreenErrorBoundary key="padezifull" screenName="padezifull"><PadezifullScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="aspect"&&<ScreenErrorBoundary key="aspect" screenName="aspect"><AspectScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="grammarvideos"&&<ScreenErrorBoundary key="grammarvideos" screenName="grammarvideos"><GrammarVideos goBack={goBack} setScr={setScr} /></ScreenErrorBoundary>}
      {currentScreen==="grammarexplainer"&&<ScreenErrorBoundary key="grammarexplainer" screenName="grammarexplainer"><GrammarExplainer goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="casetransformer"&&<ScreenErrorBoundary key="casetransformer" screenName="casetransformer"><CaseTransformer goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="vocabscenes"&&<ScreenErrorBoundary key="vocabscenes" screenName="vocabscenes"><VocabScenes goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {// ═══ ANIMATED LESSON ═══
      currentScreen==="animlesson"&&animLesson&&<ScreenErrorBoundary key="animlesson" screenName="animlesson"><AnimatedLesson lesson={animLesson} goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="grammarreader"&&<ScreenErrorBoundary key="grammarreader" screenName="grammarreader"><GrammarReader goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="falsefr"&&<ScreenErrorBoundary key="falsefr" screenName="falsefr"><FalseFriendsScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="prepdrill"&&<ScreenErrorBoundary key="prepdrill" screenName="prepdrill"><PrepDrill goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="declension"&&<ScreenErrorBoundary key="declension" screenName="declension"><DeclensionScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="brzalice"&&<ScreenErrorBoundary key="brzalice" screenName="brzalice"><BrzaliceScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="dialects"&&<ScreenErrorBoundary key="dialects" screenName="dialects"><DialectsScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="diminutives"&&<ScreenErrorBoundary key="diminutives" screenName="diminutives"><DiminutivesScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="wordform"&&<ScreenErrorBoundary key="wordform" screenName="wordform"><WordFormScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="colorquirk"&&<ScreenErrorBoundary key="colorquirk" screenName="colorquirk"><ColorQuirkScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="svojmoj"&&<ScreenErrorBoundary key="svojmoj" screenName="svojmoj"><SvojMojScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="conditional"&&<ScreenErrorBoundary key="conditional" screenName="conditional"><ConditionalScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="formalregister"&&<ScreenErrorBoundary key="formalregister" screenName="formalregister"><FormalRegisterScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="impersonal"&&<ScreenErrorBoundary key="impersonal" screenName="impersonal"><ImpersonalScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="techvoc"&&<ScreenErrorBoundary key="techvoc" screenName="techvoc"><TechVocScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="bureaucratic"&&<ScreenErrorBoundary key="bureaucratic" screenName="bureaucratic"><BureaucraticScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="countries"&&<ScreenErrorBoundary key="countries" screenName="countries"><CountriesScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="professions"&&<ScreenErrorBoundary key="professions" screenName="professions"><ProfessionsScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="weather"&&<ScreenErrorBoundary key="weather" screenName="weather"><WeatherScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="clothes"&&<ScreenErrorBoundary key="clothes" screenName="clothes"><ClothesScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="bodydesc"&&<ScreenErrorBoundary key="bodydesc" screenName="bodydesc"><BodyDescScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="phonology"&&<ScreenErrorBoundary key="phonology" screenName="phonology"><PhonologyScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="typing"&&<ScreenErrorBoundary key="typing" screenName="typing"><TypingScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="tenses"&&<ScreenErrorBoundary key="tenses" screenName="tenses"><TensesScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="crmap"&&<ScreenErrorBoundary key="crmap" screenName="crmap"><CrMap goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="grocery"&&<ScreenErrorBoundary key="grocery" screenName="grocery"><GroceryScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="recipes"&&<ScreenErrorBoundary key="recipes" screenName="recipes"><RecipesScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="roleplay"&&<ScreenErrorBoundary key="roleplay" screenName="roleplay"><RoleplayScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="journal"&&<ScreenErrorBoundary key="journal" screenName="journal"><VocabJournal goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="learnpath"&&<ScreenErrorBoundary key="learnpath" screenName="learnpath"><LearnPath st={stats} setScr={setScr} goBack={goBack} /></ScreenErrorBoundary>}
      {// ═══ FAVORITES ═══
      currentScreen==="favorites"&&<ScreenErrorBoundary key="favorites" screenName="favorites"><FavoritesScreen
        favs={favs} toggleFav={toggleFav} setScr={setScr} goBack={goBack}
      /></ScreenErrorBoundary>}
      {currentScreen==="reflexive"&&<ScreenErrorBoundary key="reflexive" screenName="reflexive"><ReflexiveScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="fillstory"&&<ScreenErrorBoundary key="fillstory" screenName="fillstory"><FillStoryScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="convmatch"&&<ScreenErrorBoundary key="convmatch" screenName="convmatch"><ConvMatchScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="scenes"&&<ScreenErrorBoundary key="scenes" screenName="scenes"><ScenesScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="pronouns"&&<ScreenErrorBoundary key="pronouns" screenName="pronouns"><PronounsScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="genderdrill"&&<ScreenErrorBoundary key="genderdrill" screenName="genderdrill"><GenderDrillScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="sentbuild"&&<ScreenErrorBoundary key="sentbuild" screenName="sentbuild"><SentenceBuilderScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="verbdrill"&&<ScreenErrorBoundary key="verbdrill" screenName="verbdrill"><VerbDrillScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="tenseflip"&&<ScreenErrorBoundary key="tenseflip" screenName="tenseflip"><TenseFlipScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="riddles"&&<ScreenErrorBoundary key="riddles" screenName="riddles"><RiddlesScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="logicquiz"&&<ScreenErrorBoundary key="logicquiz" screenName="logicquiz"><LogicQuizScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="ordinals"&&<ScreenErrorBoundary key="ordinals" screenName="ordinals"><OrdinalsScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="relpron"&&<ScreenErrorBoundary key="relpron" screenName="relpron"><RelativePronounsScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="emogender"&&<ScreenErrorBoundary key="emogender" screenName="emogender"><EmotionGenderScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="opposites"&&<ScreenErrorBoundary key="opposites" screenName="opposites"><OppositesScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="cityloc"&&<ScreenErrorBoundary key="cityloc" screenName="cityloc"><CityLocativeScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="akudrill"&&<ScreenErrorBoundary key="akudrill" screenName="akudrill"><AccusativeDrillScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="coloragree"&&<ScreenErrorBoundary key="coloragree" screenName="coloragree"><ColorAgreementScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="possess"&&<ScreenErrorBoundary key="possess" screenName="possess"><PossessivesScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="qwords"&&<ScreenErrorBoundary key="qwords" screenName="qwords"><QuestionWordsScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="negation"&&<ScreenErrorBoundary key="negation" screenName="negation"><NegationScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="sibil"&&<ScreenErrorBoundary key="sibil" screenName="sibil"><SibilarizationScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="restaurant"&&<ScreenErrorBoundary key="restaurant" screenName="restaurant"><RestaurantScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="profgender"&&<ScreenErrorBoundary key="profgender" screenName="profgender"><ProfessionGenderScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="comparatives"&&<ScreenErrorBoundary key="comparatives" screenName="comparatives"><ComparativesScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="future"&&<ScreenErrorBoundary key="future" screenName="future"><FutureTenseScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="kings"&&<ScreenErrorBoundary key="kings" screenName="kings"><KingsScreen goBack={goBack} award={award} setSt={setStats} /></ScreenErrorBoundary>}
      {currentScreen==="conjdrill"&&<ScreenErrorBoundary key="conjdrill" screenName="conjdrill"><ConjugationDrill goBack={goBack} award={award} setSt={setStats} /></ScreenErrorBoundary>}
      {currentScreen==="znam"&&<ScreenErrorBoundary key="znam" screenName="znam"><ZnamGame goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="boje"&&<ScreenErrorBoundary key="boje" screenName="boje"><BojeGame goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="match"&&<ScreenErrorBoundary key="match" screenName="match"><MatchGame initPool={matchInitPool} goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="wordsprint"&&<ScreenErrorBoundary key="wordsprint" screenName="wordsprint"><WordSprint sh={sh} award={award} goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="speaking"&&<ScreenErrorBoundary key="speaking" screenName="speaking"><SpeakingScreen sw={sw} si={si} sx={sx} sr={sr} ssc={ssc} sSr={sSr} sSx={sSx} sSw={sSw} sSsc={sSsc} goBack={goBack} award={award} setSt={setStats} /></ScreenErrorBoundary>}
      {currentScreen==="speaking_sprint"&&<ScreenErrorBoundary key="speaking_sprint" screenName="speaking_sprint"><SpeakingSprintScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="pitchaccent"&&<ScreenErrorBoundary key="pitchaccent" screenName="pitchaccent"><PitchAccentScreen goBack={goBack} award={award} PITCH_ACCENT={PITCH_ACCENT} /></ScreenErrorBoundary>}
      {currentScreen==="shadowing"&&<ScreenErrorBoundary key="shadowing" screenName="shadowing"><ShadowingScreen goBack={goBack} award={award} SHADOWING={SHADOWING} /></ScreenErrorBoundary>}
      {currentScreen==="review"&&<ScreenErrorBoundary key="review" screenName="review"><ReviewScreen goBack={goBack} award={award} allCats={allCats} V={V} /></ScreenErrorBoundary>}
      {currentScreen==="writing"&&<ScreenErrorBoundary key="writing" screenName="writing"><WritingScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="listeningpath"&&<ScreenErrorBoundary key="listeningpath" screenName="listeningpath"><ListeningPath goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="aspectdrill"&&<ScreenErrorBoundary key="aspectdrill" screenName="aspectdrill"><AspectDrillScreen goBack={goBack} award={award} ASPECT_PAIRS={ASPECT_PAIRS} /></ScreenErrorBoundary>}
      {currentScreen==="clitic"&&<ScreenErrorBoundary key="clitic" screenName="clitic"><CliticDrill goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="numcases"&&<ScreenErrorBoundary key="numcases" screenName="numcases"><NumbersCasesDrill goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="imperative"&&<ScreenErrorBoundary key="imperative" screenName="imperative"><ImperativeDrill goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="neggen"&&<ScreenErrorBoundary key="neggen" screenName="neggen"><NegationGenDrill goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="collocations"&&<ScreenErrorBoundary key="collocations" screenName="collocations"><CollocationsGame goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="wordfamilies"&&<ScreenErrorBoundary key="wordfamilies" screenName="wordfamilies"><WordFamilies goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="dictation"&&<ScreenErrorBoundary key="dictation" screenName="dictation"><DictationScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="proncontrast"&&<ScreenErrorBoundary key="proncontrast" screenName="proncontrast"><PronunciationContrast goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="dialogue"&&<ScreenErrorBoundary key="dialogue" screenName="dialogue"><DialogueSim goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="cefrtest"&&<ScreenErrorBoundary key="cefrtest" screenName="cefrtest"><CefrTest goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="slang"&&<ScreenErrorBoundary key="slang" screenName="slang"><SlangScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="baka_summer"&&<ScreenErrorBoundary key="baka_summer" screenName="baka_summer"><BakaSummer goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="croatia_today"&&<ScreenErrorBoundary key="croatia_today" screenName="croatia_today"><CroatiaToday goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="survival_dinner"&&<ScreenErrorBoundary key="survival_dinner" screenName="survival_dinner"><SurvivalDinner goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="kafic"&&<ScreenErrorBoundary key="kafic" screenName="kafic"><KaficScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="diaspora"&&<ScreenErrorBoundary key="diaspora" screenName="diaspora"><DiasporaNote goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="tivicompare"&&<ScreenErrorBoundary key="tivicompare" screenName="tivicompare"><TiViScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="lifeevents"&&<ScreenErrorBoundary key="lifeevents" screenName="lifeevents"><LifeEventsScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="civic"&&<ScreenErrorBoundary key="civic" screenName="civic"><CivicScreen goBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="easter"&&<ScreenErrorBoundary key="easter" screenName="easter"><EasterScreen onBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="postcard"&&<ScreenErrorBoundary key="postcard" screenName="postcard"><PostcardScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="storymode"&&<ScreenErrorBoundary key="storymode" screenName="storymode"><StoryModeScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="personas"&&<ScreenErrorBoundary key="personas" screenName="personas"><PersonaScreen goBack={goBack} setScr={setScr} /></ScreenErrorBoundary>}
      {currentScreen==="maja"&&<ScreenErrorBoundary key="maja" screenName="maja">{isPremium?<MajaScreen goBack={goBack} award={award} />:<PaywallScreen featureName="Maja AI Tutor" onClose={goBack} onSubscribed={()=>{refreshSub();}} />}</ScreenErrorBoundary>}
      {currentScreen==="live_tutor"&&<ScreenErrorBoundary key="live_tutor" screenName="live_tutor">{isPremium?<LiveTutorScreen goBack={goBack} award={award} />:<PaywallScreen featureName="Live Tutor" onClose={goBack} onSubscribed={()=>{refreshSub();}} />}</ScreenErrorBoundary>}
      {currentScreen==="photo_vocab"&&<ScreenErrorBoundary key="photo_vocab" screenName="photo_vocab"><PhotoVocabScanner goBack={goBack} level={level} onSaveWords={(words)=>{words.forEach(w=>{if(w.hr&&w.en)setJWords(prev=>[...(prev||[]),{hr:w.hr,en:w.en}]);});}} /></ScreenErrorBoundary>}
      {currentScreen==="ai_listening"&&<ScreenErrorBoundary key="ai_listening" screenName="ai_listening"><AIListeningScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="ai_story"&&<ScreenErrorBoundary key="ai_story" screenName="ai_story"><AIStoryScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="video_lesson"&&<ScreenErrorBoundary key="video_lesson" screenName="video_lesson"><VideoLessonScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="grammar_diagnosis"&&<ScreenErrorBoundary key="grammar_diagnosis" screenName="grammar_diagnosis"><GrammarDiagnosisScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="micro_lesson"&&<ScreenErrorBoundary key="micro_lesson" screenName="micro_lesson"><MicroLessonScreen goBack={goBack} award={award} goFlashcards={()=>{launchFlashcards([]);}} /></ScreenErrorBoundary>}
      {currentScreen==="heritage"&&<ScreenErrorBoundary key="heritage" screenName="heritage"><HeritageStoryScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="croatianews"&&<ScreenErrorBoundary key="croatianews" screenName="croatianews"><CroatianNewsScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="phraseofday"&&<ScreenErrorBoundary key="phraseofday" screenName="phraseofday"><PhraseOfDayScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="cloze"&&<ScreenErrorBoundary key="cloze" screenName="cloze"><ClozeEngine goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="grammarmap"&&<ScreenErrorBoundary key="grammarmap" screenName="grammarmap"><GrammarConstellation goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="my_words"&&<ScreenErrorBoundary key="my_words" screenName="my_words"><MyWordsScreen onBack={goBack} /></ScreenErrorBoundary>}
      {currentScreen==="mistakes"&&<ScreenErrorBoundary key="mistakes" screenName="mistakes"><MistakesScreen goBack={goBack} award={award} /></ScreenErrorBoundary>}
      {currentScreen==="analytics"&&<ScreenErrorBoundary key="analytics" screenName="analytics"><AnalyticsScreen goBack={goBack} stats={stats} name={name} /></ScreenErrorBoundary>}
      {// ═══ GRAMMAR REFERENCE ═══
      currentScreen==="grammar-ref"&&<ScreenErrorBoundary key="grammar-ref" screenName="grammar-ref"><GrammarReference onClose={()=>setScr("dashboard")} /></ScreenErrorBoundary>}
      {// ═══ NEW PLACEMENT TEST (first-time users) ═══
      currentScreen==="new-placement"&&<ScreenErrorBoundary key="new-placement" screenName="new-placement"><PlacementTest onComplete={function(level){localStorage.setItem("placement_done","1");setStats(function(prev){return{...prev,ct:getPlacementCt(level),lc:Math.max(prev.lc,getPlacementCt(level).length)};});award(25);setShowFirstWords(true);setTimeout(()=>setTab('learn'),300);}} /></ScreenErrorBoundary>}
      {// ═══ VOCABULARY LESSON ═══
      currentScreen==="lesson"&&<ScreenErrorBoundary key="lesson" screenName="lesson"><LessonScreen
        lt={lt} li={li} lx={lx} ls={ls} lp={lp} la={la} lsl={lsl} qi={qi} icons={icons}
        sLi={sLi} sLx={sLx} sLs={sLs} sLp={sLp} sLa={sLa} sLsl={sLsl} sQi={sQi}
        goBack={goBack} award={award} setSt={setStats} setScr={setScr}
        goToPractice={() => { goBack(); setTimeout(() => setTab('practice'), 50); }}
      /></ScreenErrorBoundary>}
      {// ═══ GRAMMAR ═══
      currentScreen==="grammar"&&<ScreenErrorBoundary key="grammar" screenName="grammar"><GrammarScreen
        gl={gl||GRAM.beginner[0]} gp={gp} gx={gx} gs={gs} ga={ga} gsl={gsl}
        sGp={sGp} sGx={sGx} sGs={sGs} sGa={sGa} sGsl={sGsl}
        goBack={goBack} award={award} setSt={setStats}
      /></ScreenErrorBoundary>}
      {currentScreen==="alphabet"&&<ScreenErrorBoundary key="alphabet" screenName="alphabet"><AlphabetScreen goBack={goBack} /></ScreenErrorBoundary>}
      {// ═══ READING LIST ═══
      currentScreen==="readlist"&&<ScreenErrorBoundary key="readlist" screenName="readlist"><ReadingList
        setScr={setScr} sRp={sRp} sRph={sRph} sRqi={sRqi} sRsc={sRsc}
        sRa={sRa} sRsl={sRsl} sHw={sHw} sCurEx={sCurEx} goBack={goBack}
      /></ScreenErrorBoundary>}
      {// ═══ READING ═══
      currentScreen==="reading"&&<ScreenErrorBoundary key="reading" screenName="reading"><ReadingScreen
        rp={rp} rph={rph} rqi={rqi} rsc={rsc} ra={ra} rsl={rsl} hw={hw}
        sRph={sRph} sRqi={sRqi} sRsc={sRsc} sRa={sRa} sRsl={sRsl} sHw={sHw}
        goBack={goBack} setScr={setScr} award={award} setSt={setStats}
      /></ScreenErrorBoundary>}
      {currentScreen==="badges"&&<ScreenErrorBoundary key="badges" screenName="badges"><BadgesScreen badges={stats.badges} stats={stats} goBack={goBack} /></ScreenErrorBoundary>}
      {// ═══ PROFILE ═══
      currentScreen==="profile"&&<ScreenErrorBoundary key="profile" screenName="profile"><ProfileScreen
        name={name} level={level} st={stats} authUser={authUser}
        goBack={goBack} doOut={doOut} setScr={setScr}
      /></ScreenErrorBoundary>}
      {currentScreen==="certificate"&&<ScreenErrorBoundary key="certificate" screenName="certificate"><CertificateScreen name={name} level={level} st={stats} goBack={goBack} /></ScreenErrorBoundary>}
      </motion.div>
    </AnimatePresence>
  );
}
