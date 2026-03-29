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
      currentScreen==="leaderboard_weekly"&&<LeaderboardScreen db={null} user={authUser} weekXP={_weeklyXP} goBack={goBack} />}
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
      {currentScreen==="aiconvo"&&(isPremium?<AIConversation goBack={goBack} setScr={setScr} sCurEx={sCurEx} setJWords={setJWords} />:<PaywallScreen featureName="AI Conversation" onClose={goBack} onSubscribed={()=>{refreshSub();}} />)}
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
      {// ═══ SPEAKING SPRINT ═══
      currentScreen==="speaking_sprint"&&<SpeakingSprintScreen goBack={goBack} award={award} />}
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
      {currentScreen==="personas"&&<PersonaScreen goBack={goBack} setScr={setScr} />}
      {currentScreen==="maja"&&(isPremium?<MajaScreen goBack={goBack} award={award} />:<PaywallScreen featureName="Maja AI Tutor" onClose={goBack} onSubscribed={()=>{refreshSub();}} />)}
      {currentScreen==="live_tutor"&&(isPremium?<LiveTutorScreen goBack={goBack} award={award} />:<PaywallScreen featureName="Live Tutor" onClose={goBack} onSubscribed={()=>{refreshSub();}} />)}
      {currentScreen==="photo_vocab"&&<PhotoVocabScanner goBack={goBack} level={level} onSaveWords={(words)=>{words.forEach(w=>{if(w.hr&&w.en)setJWords(prev=>[...(prev||[]),{hr:w.hr,en:w.en}]);});}} />}
      {currentScreen==="ai_listening"&&<AIListeningScreen goBack={goBack} award={award} />}
      {currentScreen==="ai_story"&&<AIStoryScreen goBack={goBack} award={award} />}
      {currentScreen==="video_lesson"&&<VideoLessonScreen goBack={goBack} award={award} />}
      {currentScreen==="grammar_diagnosis"&&<GrammarDiagnosisScreen goBack={goBack} award={award} />}
      {currentScreen==="micro_lesson"&&<MicroLessonScreen goBack={goBack} award={award} goFlashcards={()=>{launchFlashcards([]);}} />}
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
      currentScreen==="new-placement"&&<PlacementTest onComplete={function(level){localStorage.setItem("placement_done","1");setStats(function(prev){return{...prev,ct:getPlacementCt(level),lc:Math.max(prev.lc,getPlacementCt(level).length)};});award(25);setShowFirstWords(true);setTimeout(()=>setTab('learn'),300);}} />}
      {// ═══ VOCABULARY LESSON ═══
      currentScreen==="lesson"&&<LessonScreen
        lt={lt} li={li} lx={lx} ls={ls} lp={lp} la={la} lsl={lsl} qi={qi} icons={icons}
        sLi={sLi} sLx={sLx} sLs={sLs} sLp={sLp} sLa={sLa} sLsl={sLsl} sQi={sQi}
        goBack={goBack} award={award} setSt={setStats} setScr={setScr}
        goToPractice={() => { goBack(); setTimeout(() => setTab('practice'), 50); }}
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
      </motion.div>
    </AnimatePresence>
  );
}
