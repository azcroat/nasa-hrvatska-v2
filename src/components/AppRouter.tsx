import React, { lazy, useRef, useEffect, useState } from 'react';
import { AnimatePresence, motion, type TargetAndTransition } from 'framer-motion';
import { useSwipeBack } from '../hooks/useSwipeBack.js';
import { isChunkLoadError, reloadWithCachePurge } from '../lib/chunkErrors';
import { getUserCefr } from '../lib/cefr.js';
// On Android WebView (Capacitor), Framer Motion entry animations can stall
// leaving elements permanently at opacity:0. Skip entry animation on native.
// Capacitor Android: https://localhost with NO port. Dev server always has a port.
const _isNative =
  typeof window !== 'undefined' &&
  window.location.hostname === 'localhost' &&
  !window.location.port;
// Local Fisher-Yates shuffle — keeps chunk-data out of AppRouter's startup import.
// Screens that need data (V, SHADOWING) import it directly. Grammar moved
// to /api/content/grammar (SP11b); use useGrammar() hook for those.
function _sh<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j]!, b[i]!];
  }
  return b;
}
import ScreenErrorBoundary from './shared/ScreenErrorBoundary';
import { addWordToSRS } from '../lib/srs.js';
const WelcomeScreen = lazyWithReload(() => import('./home/WelcomeScreen'));
const PlacementTest = lazyWithReload(() => import('../components/auth/PlacementTest'));
const PaywallScreen = lazyWithReload(() => import('./shared/PaywallScreen'));
const EquivalencyTestScreen = lazyWithReload(() => import('./profile/EquivalencyTestScreen'));
import { useApp } from '../context/AppContext';
import { useStats } from '../context/StatsContext';

// Wraps React.lazy() to detect stale-chunk errors and self-heal with a
// cache-purge reload. Capped at 2 attempts via sessionStorage.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function lazyWithReload(fn: () => Promise<any>) {
  return lazy(() =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fn().catch((e: any) => {
      const msg = (((e?.message as string) || '') + ((e?.name as string) || '')).toLowerCase();
      if (isChunkLoadError(msg) && reloadWithCachePurge('nh_reload_attempt')) {
        return new Promise(() => {}); // keep pending so React doesn't render an error state
      }
      throw e;
    }),
  );
}

// Tabs + screens — lazy-loaded on first use
const HomeTab = lazyWithReload(() => import('./home/HomeTab'));
const LearnTab = lazyWithReload(() => import('./learn/LearnTab'));
const HrvatskaTab = lazyWithReload(() => import('./hrvatska/HrvatskaTab'));
const RazgovorTab = lazyWithReload(() => import('./razgovor/RazgovorTab'));
const ImmersionHub = lazyWithReload(() => import('./croatia/ImmersionHub'));
const AIConversation = lazyWithReload(() => import('./croatia/AIConversation'));
const MajaScreen = lazyWithReload(() => import('./croatia/MajaScreen'));
const PersonaScreen = lazyWithReload(() => import('./croatia/PersonaScreen'));
const ProfileTab = lazyWithReload(() => import('./profile/ProfileTab'));
const ContactScreen = lazyWithReload(() => import('./profile/ContactScreen'));
const GradTab = lazyWithReload(() => import('./grad/GradTab'));
const LessonScreen = lazyWithReload(() => import('./learn/LessonScreen'));
const GrammarScreen = lazyWithReload(() => import('./learn/GrammarScreen'));
const AlphabetScreen = lazyWithReload(() => import('./learn/AlphabetScreen'));
const ReadingList = lazyWithReload(() => import('./learn/ReadingList'));
const ReadingScreen = lazyWithReload(() => import('./learn/ReadingScreen'));
const BadgesScreen = lazyWithReload(() => import('./profile/BadgesScreen'));
const ProfileScreen = lazyWithReload(() => import('./profile/ProfileScreen'));
const VocabJournal = lazyWithReload(() => import('./profile/VocabJournal'));
const FavoritesScreen = lazyWithReload(() => import('./profile/FavoritesScreen'));
const LearnPath = lazyWithReload(() => import('./profile/LearnPath'));
const LevelQuiz = lazyWithReload(() => import('./learn/LevelQuiz'));
const SentenceTileScreen = lazyWithReload(() => import('./practice/SentenceTileScreen'));
const ProverbsScreen = lazyWithReload(() => import('./croatia/ProverbsScreen'));
const Flashcards = lazyWithReload(() => import('./practice/Flashcards'));
const ListeningScreen = lazyWithReload(() => import('./practice/ListeningScreen'));
const McGame = lazyWithReload(() => import('./practice/McGame'));
const IdiomsScreen = lazyWithReload(() => import('./croatia/IdiomsScreen'));
const PrivacyScreen = lazyWithReload(() => import('./shared/PrivacyScreen'));
const TextingScreen = lazyWithReload(() => import('./croatia/TextingScreen'));
const FriendsScreen = lazyWithReload(() => import('./croatia/FriendsScreen'));
const FoodOrderScreen = lazyWithReload(() => import('./croatia/FoodOrderScreen'));
const TransportScreen = lazyWithReload(() => import('./croatia/TransportScreen'));
const EmergencyScreen = lazyWithReload(() => import('./croatia/EmergencyScreen'));
const PopCultureScreen = lazyWithReload(() => import('./croatia/PopCultureScreen'));
const PracticalScreen = lazyWithReload(() => import('./croatia/PracticalScreen'));
const SchoolScreen = lazyWithReload(() => import('./croatia/SchoolScreen'));
const GroceryScreen = lazyWithReload(() => import('./croatia/GroceryScreen'));
const CroatiaHistoryScreen = lazyWithReload(() => import('./croatia/CroatiaHistoryScreen'));
const BasketballScreen = lazyWithReload(() => import('./croatia/BasketballScreen'));
const GymScreen = lazyWithReload(() => import('./croatia/GymScreen'));
const HNLScreen = lazyWithReload(() => import('./croatia/HNLScreen'));
const CroatiaAthletes = lazyWithReload(() => import('./croatia/CroatiaAthletes'));
const RegionScreen = lazyWithReload(() => import('./croatia/RegionScreen'));
const RoleplayScreen = lazyWithReload(() => import('./croatia/RoleplayScreen'));
const RecipesScreen = lazyWithReload(() => import('./croatia/RecipesScreen'));
const CityOfDayScreen = lazyWithReload(() => import('./croatia/CityOfDayScreen'));
const EventsCalendar = lazyWithReload(() => import('./croatia/EventsCalendar'));
const Top100Screen = lazyWithReload(() => import('./croatia/Top100Screen'));
const KingsScreen = lazyWithReload(() => import('./croatia/KingsScreen'));
const CrMap = lazyWithReload(() => import('./croatia/CrMap'));
const AspectScreen = lazyWithReload(() => import('./learn/AspectScreen'));
const FalseFriendsScreen = lazyWithReload(() => import('./learn/FalseFriendsScreen'));
const DeclensionScreen = lazyWithReload(() => import('./learn/DeclensionScreen'));
const BrzaliceScreen = lazyWithReload(() => import('./learn/BrzaliceScreen'));
const DialectsScreen = lazyWithReload(() => import('./learn/DialectsScreen'));
const DiminutivesScreen = lazyWithReload(() => import('./learn/DiminutivesScreen'));
const WordFormScreen = lazyWithReload(() => import('./learn/WordFormScreen'));
const ColorQuirkScreen = lazyWithReload(() => import('./learn/ColorQuirkScreen'));
const SvojMojScreen = lazyWithReload(() => import('./learn/SvojMojScreen'));
const ConditionalScreen = lazyWithReload(() => import('./learn/ConditionalScreen'));
const FormalRegisterScreen = lazyWithReload(() => import('./learn/FormalRegisterScreen'));
const ImpersonalScreen = lazyWithReload(() => import('./learn/ImpersonalScreen'));
const TechVocScreen = lazyWithReload(() => import('./learn/TechVocScreen'));
const BureaucraticScreen = lazyWithReload(() => import('./learn/BureaucraticScreen'));
const CountriesScreen = lazyWithReload(() => import('./learn/CountriesScreen'));
const ProfessionsScreen = lazyWithReload(() => import('./learn/ProfessionsScreen'));
const WeatherScreen = lazyWithReload(() => import('./learn/WeatherScreen'));
const ClothesScreen = lazyWithReload(() => import('./learn/ClothesScreen'));
const BodyDescScreen = lazyWithReload(() => import('./learn/BodyDescScreen'));
const PhonologyScreen = lazyWithReload(() => import('./learn/PhonologyScreen'));
const ModalScreen = lazyWithReload(() => import('./learn/ModalScreen'));
const PadeziScreen = lazyWithReload(() => import('./learn/PadeziScreen'));
const PadezifullScreen = lazyWithReload(() => import('./learn/PadezifullScreen'));
const TensesScreen = lazyWithReload(() => import('./learn/TensesScreen'));
const ReflexiveScreen = lazyWithReload(() => import('./practice/exercises/ReflexiveScreen'));
const FillStoryScreen = lazyWithReload(() => import('./practice/exercises/FillStoryScreen'));
const ConvMatchScreen = lazyWithReload(() => import('./practice/exercises/ConvMatchScreen'));
const ScenesScreen = lazyWithReload(() => import('./practice/exercises/ScenesScreen'));
const PronounsScreen = lazyWithReload(() => import('./practice/exercises/PronounsScreen'));
const GenderDrillScreen = lazyWithReload(() => import('./practice/exercises/GenderDrillScreen'));
const SentenceBuilderScreen = lazyWithReload(
  () => import('./practice/exercises/SentenceBuilderScreen'),
);
const VerbDrillScreen = lazyWithReload(() => import('./practice/exercises/VerbDrillScreen'));
const TenseFlipScreen = lazyWithReload(() => import('./practice/exercises/TenseFlipScreen'));
const RiddlesScreen = lazyWithReload(() => import('./practice/exercises/RiddlesScreen'));
const LogicQuizScreen = lazyWithReload(() => import('./practice/exercises/LogicQuizScreen'));
const OrdinalsScreen = lazyWithReload(() => import('./practice/exercises/OrdinalsScreen'));
const RelativePronounsScreen = lazyWithReload(
  () => import('./practice/exercises/RelativePronounsScreen'),
);
const EmotionGenderScreen = lazyWithReload(
  () => import('./practice/exercises/EmotionGenderScreen'),
);
const OppositesScreen = lazyWithReload(() => import('./practice/exercises/OppositesScreen'));
const CityLocativeScreen = lazyWithReload(() => import('./practice/exercises/CityLocativeScreen'));
const AccusativeDrill = lazyWithReload(() => import('./practice/AccusativeDrill'));
const ColorAgreementScreen = lazyWithReload(
  () => import('./practice/exercises/ColorAgreementScreen'),
);
const PossessivesScreen = lazyWithReload(() => import('./practice/exercises/PossessivesScreen'));
const QuestionWordsScreen = lazyWithReload(
  () => import('./practice/exercises/QuestionWordsScreen'),
);
const NegationScreen = lazyWithReload(() => import('./practice/exercises/NegationScreen'));
const SibilarizationScreen = lazyWithReload(
  () => import('./practice/exercises/SibilarizationScreen'),
);
const RestaurantScreen = lazyWithReload(() => import('./practice/exercises/RestaurantScreen'));
const ProfessionGenderScreen = lazyWithReload(
  () => import('./practice/exercises/ProfessionGenderScreen'),
);
const ComparativesScreen = lazyWithReload(() => import('./practice/exercises/ComparativesScreen'));
const FutureTenseScreen = lazyWithReload(() => import('./practice/exercises/FutureTenseScreen'));
const McResult = lazyWithReload(() => import('./practice/McResult'));
const StoryScreens = lazyWithReload(() => import('./practice/StoryScreens'));
const NumTime = lazyWithReload(() => import('./practice/NumTime'));
const Unjumble = lazyWithReload(() => import('./practice/Unjumble'));
const PrepDrill = lazyWithReload(() => import('./practice/PrepDrill'));
const TypingScreen = lazyWithReload(() => import('./practice/TypingScreen'));
const ConjugationDrill = lazyWithReload(() => import('./practice/ConjugationDrill'));
const ConjugationLab = lazyWithReload(() => import('./practice/ConjugationLab'));
const ConjugationSessionDrill = lazyWithReload(() => import('./practice/ConjugationSessionDrill'));
const ZnamGame = lazyWithReload(() => import('./practice/ZnamGame'));
const BojeGame = lazyWithReload(() => import('./practice/BojeGame'));
const MatchGame = lazyWithReload(() => import('./practice/MatchGame'));
const WordSprint = lazyWithReload(() => import('./practice/WordSprint'));
const SpeakingScreen = lazyWithReload(() => import('./practice/SpeakingScreen'));
const SpeakingSprintScreen = lazyWithReload(() => import('./practice/SpeakingSprintScreen'));
const PitchAccentScreen = lazyWithReload(() => import('./practice/PitchAccentScreen'));
const ShadowingScreen = lazyWithReload(() => import('./practice/ShadowingScreen'));
const ReviewScreen = lazyWithReload(() => import('./practice/ReviewScreen'));
const WritingScreen = lazyWithReload(() => import('./practice/WritingScreen'));
const ListeningPath = lazyWithReload(() => import('./practice/ListeningPath'));
const AspectDrillScreen = lazyWithReload(() => import('./practice/AspectDrillScreen'));
const TranslateDrillsScreen = lazyWithReload(() => import('./practice/TranslateDrillsScreen'));
const CliticDrill = lazyWithReload(() => import('./practice/CliticDrill'));
const AnimateAccDrill = lazyWithReload(() => import('./practice/AnimateAccDrill'));
const PassiveDrill = lazyWithReload(() => import('./practice/PassiveDrill'));
const InstrumentalDrill = lazyWithReload(() => import('./practice/InstrumentalDrill'));
const DativeDrill = lazyWithReload(() => import('./practice/DativeDrill'));
const GenitiveDrill = lazyWithReload(() => import('./practice/GenitiveDrill'));
const NominativeDrill = lazyWithReload(() => import('./practice/NominativeDrill'));
const LocativeDrill = lazyWithReload(() => import('./practice/LocativeDrill'));
const FleetingADrill = lazyWithReload(() => import('./practice/FleetingADrill'));
const SlangScreen = lazyWithReload(() => import('./practice/SlangScreen'));
const NumbersCasesDrill = lazyWithReload(() => import('./practice/NumbersCasesDrill'));
const ImperativeDrill = lazyWithReload(() => import('./practice/ImperativeDrill'));
const NegationGenDrill = lazyWithReload(() => import('./practice/NegationGenDrill'));
const VocativeScreen = lazyWithReload(() => import('./practice/VocativeScreen'));
const CollocationsGame = lazyWithReload(() => import('./practice/CollocationsGame'));
const WordFamilies = lazyWithReload(() => import('./practice/WordFamilies'));
const DictationScreen = lazyWithReload(() => import('./practice/DictationScreen'));
const PronunciationContrast = lazyWithReload(() => import('./practice/PronunciationContrast'));
const DialogueSim = lazyWithReload(() => import('./practice/DialogueSim'));
const CefrTest = lazyWithReload(() => import('./practice/CefrTest'));
const MyWordsScreen = lazyWithReload(() => import('./practice/MyWordsScreen'));
const CertificateScreen = lazyWithReload(() => import('./profile/CertificateScreen'));
const MistakesScreen = lazyWithReload(() => import('./practice/MistakesScreen'));
const AnalyticsScreen = lazyWithReload(() => import('./profile/AnalyticsScreen'));
const GrammarReference = lazyWithReload(() => import('./shared/GrammarReference'));
const BakaSummer = lazyWithReload(() => import('./croatia/BakaSummer'));
const CroatiaToday = lazyWithReload(() => import('./croatia/CroatiaToday'));
const SurvivalDinner = lazyWithReload(() => import('./croatia/SurvivalDinner'));
const ClozeEngine = lazyWithReload(() => import('./practice/ClozeEngine'));
const GrammarConstellation = lazyWithReload(() => import('./learn/GrammarConstellation'));
const GrammarExplainer = lazyWithReload(() => import('./learn/GrammarExplainer'));
const CaseTransformer = lazyWithReload(() => import('./learn/CaseTransformer'));
const VocabScenes = lazyWithReload(() => import('./learn/VocabScenes'));
const AnimatedLesson = lazyWithReload(() => import('./learn/AnimatedLesson'));
const GrammarReader = lazyWithReload(() => import('./learn/GrammarReader'));
const KaficScreen = lazyWithReload(() => import('./croatia/KaficScreen'));
const DiasporaNote = lazyWithReload(() => import('./croatia/DiasporaNote'));
const TiViScreen = lazyWithReload(() => import('./learn/TiViScreen'));
const GrammarVideos = lazyWithReload(() => import('./learn/GrammarVideos'));
const LifeEventsScreen = lazyWithReload(() => import('./croatia/LifeEventsScreen'));
const CivicScreen = lazyWithReload(() => import('./croatia/CivicScreen'));
const EasterScreen = lazyWithReload(() => import('./croatia/EasterScreen'));
const PostcardScreen = lazyWithReload(() => import('./croatia/PostcardScreen'));
const StoryModeScreen = lazyWithReload(() => import('./croatia/StoryModeScreen'));
const HeritageStoryScreen = lazyWithReload(() => import('./croatia/HeritageStoryScreen'));
const CroatianNewsScreen = lazyWithReload(() => import('./croatia/CroatianNewsScreen'));
const PhraseOfDayScreen = lazyWithReload(() => import('./croatia/PhraseOfDayScreen'));
const AIListeningScreen = lazyWithReload(() => import('./practice/AIListeningScreen'));
const AIStoryScreen = lazyWithReload(() => import('./practice/AIStoryScreen'));
const VideoLessonScreen = lazyWithReload(() => import('./practice/VideoLessonScreen'));
const GrammarDiagnosisScreen = lazyWithReload(() => import('./home/GrammarDiagnosisScreen'));
const MicroLessonScreen = lazyWithReload(() => import('./learn/MicroLessonScreen'));
const LiveTutorScreen = lazyWithReload(() => import('./croatia/LiveTutorScreen'));
const PhotoVocabScanner = lazyWithReload(() => import('./shared/PhotoVocabScanner'));
const AdminDashboard = lazyWithReload(() => import('./admin/AdminDashboard'));
const TermsOfService = lazyWithReload(() => import('./shared/TermsOfService'));
const GradedInputScreen = lazyWithReload(() => import('./learn/GradedInputScreen'));
const PronunciationCourse = lazyWithReload(() => import('./learn/PronunciationCourse'));
const AdvancedVocabScreen = lazyWithReload(() => import('./learn/AdvancedVocabScreen'));
const PitchAccentMastery = lazyWithReload(() => import('./learn/PitchAccentMastery'));
const HeritagePathScreen = lazyWithReload(() => import('./croatia/HeritagePathScreen'));
const DialectAwarenessScreen = lazyWithReload(() => import('./croatia/DialectAwarenessScreen'));
const HeritageModeScreen = lazyWithReload(() => import('./learn/HeritageModeScreen'));
const PhonemePracticeScreen = lazyWithReload(() => import('./learn/PhonemePracticeScreen'));
const PracticalCroatianScreen = lazyWithReload(() => import('./learn/PracticalCroatianScreen'));
const FrequencyTrackScreen = lazyWithReload(() => import('./learn/FrequencyTrackScreen'));
const GrammarTrackScreen = lazyWithReload(() => import('./learn/GrammarTrackScreen'));
const GrammarUnitDetail = lazyWithReload(() => import('./learn/GrammarUnitDetail'));
const ListeningComprehensionScreen = lazyWithReload(
  () => import('./practice/ListeningComprehensionScreen'),
);
const PronunciationAssessScreen = lazyWithReload(
  () => import('./practice/PronunciationAssessScreen'),
);
const ProductionDrillScreen = lazyWithReload(() => import('./practice/ProductionDrillScreen'));
const AdaptiveReviewScreen = lazyWithReload(() => import('./practice/AdaptiveReviewScreen'));
const PastTenseLessonScreen = lazyWithReload(() => import('./learn/PastTenseLessonScreen'));
const FutureTenseLessonScreen = lazyWithReload(() => import('./learn/FutureTenseLessonScreen'));
const ArcadeHub = lazyWithReload(() => import('./practice/ArcadeHub'));
const AlkaScreen = lazyWithReload(() => import('./practice/alka/AlkaScreen'));
const MapScreen = lazyWithReload(() => import('./practice/MapScreen'));

// Tab order used for slide direction. Defined at module scope so it's not
// recreated on every render.
const TAB_ORDER = ['home', 'learn', 'practice', 'croatia', 'profile'];

/**
 * ScreenGuard — shown when a stateful exercise screen loads after a hard refresh
 * and its required launch-time data is missing. Provides a clear path back rather
 * than rendering an empty or broken exercise screen.
 */
function ScreenGuard({ goBack, label = 'exercise' }: { goBack: () => void; label?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: 32,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 56, marginBottom: 16 }}>🔄</div>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--heading)', marginBottom: 8 }}>
        Session refreshed
      </h2>
      <p
        style={{
          fontSize: 14,
          color: 'var(--subtext)',
          marginBottom: 28,
          maxWidth: 280,
          lineHeight: 1.5,
        }}
      >
        This {label} needs to be started from the Practice tab — your previous session data couldn't
        be restored.
      </p>
      <button
        onClick={goBack}
        style={{
          background: 'var(--info)',
          color: '#fff',
          border: 'none',
          borderRadius: 12,
          padding: '14px 32px',
          fontSize: 15,
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: "'Outfit',sans-serif",
        }}
      >
        Back to Practice
      </button>
    </div>
  );
}

/**
 * AppRouter — renders the correct screen component for `currentScreen`.
 * All screen-level lazy imports live here; App.jsx just passes props and renders <AppRouter />.
 *
 * Shared app state is pulled from AppContext via useApp().
 * Only high-frequency lesson/exercise state remains as direct props.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function AppRouter(props: Record<string, any>) {
  // Pull shared state from context
  const ctx = useApp();
  const { stats, setStats, level, award } = useStats();
  const {
    currentScreen,
    authUser,
    authScreen: _authScreen,
    name,
    setName,
    doOut,
    favs,
    toggleFav,
    setScr,
    goBack,
    tab,
    setTab,
    sCurEx,
    jWords: _jWords,
    setJWords,
    isPremium,
    refreshSub,
    requirePremium: _requirePremium,
    srchQ,
    setSrchQ,
    srchR,
    srchOpen,
    setSrchOpen,
    doSearch,

    dchlA,
    sDchlA,
    dchlSl,
    sDchlSl,
    resumeLesson,
    launchPathItem,
    launchAnimLesson,
    launchMcGame,
    launchLegendary,
    launchCheckpoint,
    mcGameComplete,
    launchFlashcards,
    launchListening,
    launchMatch,
    launchSpeaking,
    launchSessionActivity,
    _syncReady,
    doSyncNow,
    lastSyncedAt,
    icons,
    allCats,
    getWeekStats,
    isNewUserWindow,
    daysSinceJoin,
    comebackBonus,
    weeklyXP: _weeklyXP,
  } = ctx;

  // Direct props: high-frequency lesson/exercise screen state
  const {
    // Placement
    setPlacementQ,
    setPlacementIdx,
    setPlacementScore,
    setPlacementAnswers,
    setPlacementXp,
    getPlacementCt,
    setShowFirstWords,
    // Lesson screen state
    lt,
    li,
    lx,
    ls,
    lp,
    la,
    lsl,
    qi,
    sLt,
    sLi,
    sLx,
    sLs,
    sLp,
    sLa,
    sLsl,
    sQi,
    // Grammar screen state
    gl,
    gx,
    gp,
    gs,
    ga,
    gsl,
    sGl,
    sGp,
    sGx,
    sGs,
    sGa,
    sGsl,
    // Match / MC state
    matchInitPool,
    mcInitQ,
    mcResultQ,
    mcResultScore,
    mcMistakes,
    // Reading state
    rp,
    rph,
    rqi,
    rsc,
    ra,
    rsl,
    hw,
    sRph,
    sRqi,
    sRsc,
    sRa,
    sRsl,
    sHw,
    sRp,
    // Speaking state
    sw,
    si,
    sx,
    sr,
    ssc,
    sSr,
    sSx,
    sSw,
    sSsc,
    // Misc exercise state
    animLesson,
    fcInitPool,
    lsInitQ,
    curEx: _curEx,
  } = props;

  const _transKey = currentScreen === 'dashboard' ? 'dashboard-' + tab : currentScreen;

  // ── Tab scroll-position save / restore ───────────────────────────────────
  // Saves window.scrollY when the user leaves a tab, restores it when they return.
  // This means a user who was halfway through the Practice exercise list gets
  // placed back there after switching to Croatia tab and back.
  const tabScrollRef = useRef<Record<string, number>>({});
  useEffect(() => {
    const savedY = tabScrollRef.current[tab] || 0;
    const id = requestAnimationFrame(() => {
      window.scrollTo({ top: savedY, behavior: 'instant' });
    });
    const saveScroll = () => {
      tabScrollRef.current[tab] = window.scrollY;
    };
    window.addEventListener('scroll', saveScroll, { passive: true });
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('scroll', saveScroll);
    };
  }, [tab]);

  // Tab directional transitions — computed synchronously during render so the
  // className is correct on the same frame the animation plays.
  // MUST NOT use useEffect here: effects run after paint, making tabDirection
  // always one render late (the animation would fire before direction is updated).
  const prevTabRef = useRef(tab);
  let tabSlideClass = 'tab-enter'; // default for first render
  if (prevTabRef.current !== tab) {
    const prevIdx = TAB_ORDER.indexOf(prevTabRef.current);
    const nextIdx = TAB_ORDER.indexOf(tab);
    tabSlideClass = nextIdx > prevIdx ? 'slide-in-right' : 'slide-in-left';
    prevTabRef.current = tab; // update synchronously — safe inside render when the value derives from props
  }

  // Swipe-back: disabled on flashcards (has its own swipe handling)
  const swipeEnabled = currentScreen !== 'flashcards';
  useSwipeBack(goBack, swipeEnabled);

  // SP7: deep-link target story for GradedInputScreen (e.g. from Story of the Day card).
  // Cleared on goBack so future entries via the Practice tab start on the catalog.
  const [pendingStoryId, setPendingStoryId] = useState<string | null>(null);
  // SP9: deep-link target grammar unit for GrammarUnitDetail (set by GrammarTrackScreen).
  const [pendingGrammarUnitId, setPendingGrammarUnitId] = useState<string | null>(null);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={_transKey}
        initial={_isNative ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={(_isNative ? false : { opacity: 0, y: -8 }) as TargetAndTransition | undefined}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        style={{ height: '100%' }}
      >
        {currentScreen === 'welcome' && (
          <WelcomeScreen
            name={name}
            au={authUser}
            st={stats}
            setScr={setScr}
            setName={setName}
            setPlacementQ={setPlacementQ}
            setPlacementIdx={setPlacementIdx}
            setPlacementScore={setPlacementScore}
            setPlacementAnswers={setPlacementAnswers}
            setPlacementXp={setPlacementXp}
          />
        )}
        {currentScreen === 'placement' && (
          <PlacementTest
            onComplete={function (level: number) {
              localStorage.setItem('placement_done', '1');
              // ALSO flag user as onboarded so Firebase sync persists this
              // across devices. buildProgressSnapshot reads `onboarded` and
              // `nh_placement_done` from localStorage and writes them into
              // the Firebase profile; applyRemoteProgress on a new device
              // sets localStorage from those fields, which short-circuits
              // the App.tsx:1303 placement-trigger check. Without these two
              // writes, a user who completed placement on device A would be
              // re-prompted on device B until Firebase MERGE_REMOTE happened
              // to land xp > 0 before the 1200ms placement timer fired.
              localStorage.setItem('nh_placement_done', 'true');
              localStorage.setItem('onboarded', 'true');
              setStats(function (prev) {
                return {
                  ...prev,
                  ct: getPlacementCt(level),
                  lc: Math.max(prev.lc, getPlacementCt(level).length),
                };
              });
              if (typeof award === 'function') award(25);
              setShowFirstWords(true);
              setTab('learn');
            }}
            onCancel={function () {
              setTab('learn');
            }}
          />
        )}
        {currentScreen === 'equivalency' && (
          <EquivalencyTestScreen
            userEligible={getUserCefr(stats.xp || 0, stats.lc || 0, stats.gc || 0)}
            userLessonCount={stats.lc || 0}
            setScr={setScr}
          />
        )}
        {
          // ═══ DASHBOARD ═══
          currentScreen === 'dashboard' && (
            <div className="dash">
              <div style={{ position: 'relative', marginBottom: 20 }}>
                <div style={{ position: 'relative' }} role="search">
                  <span
                    style={{
                      position: 'absolute',
                      left: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: 16,
                      pointerEvents: 'none',
                      opacity: 0.4,
                    }}
                    aria-hidden="true"
                  >
                    🔍
                  </span>
                  <input
                    type="search"
                    role="combobox"
                    id="app-search"
                    value={srchQ}
                    onChange={function (e) {
                      setSrchQ(e.target.value);
                      doSearch(e.target.value);
                      setSrchOpen(true);
                    }}
                    onFocus={function () {
                      if (srchQ) setSrchOpen(true);
                    }}
                    onKeyDown={function (e) {
                      if (e.key === 'Escape') {
                        setSrchOpen(false);
                        setSrchQ('');
                      }
                    }}
                    placeholder="Search words, phrases, screens…"
                    aria-label="Search vocabulary, phrases, and screens"
                    aria-expanded={srchOpen && srchQ.length > 0}
                    aria-controls="search-results"
                    aria-autocomplete="list"
                    autoComplete="off"
                    style={{
                      width: '100%',
                      padding: '12px 16px 12px 44px',
                      fontSize: 14,
                      borderRadius: 14,
                      boxShadow: '0 1px 3px rgba(0,0,0,.05)',
                    }}
                  />
                </div>
                {srchOpen && srchQ && srchR.length === 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 6px)',
                      left: 0,
                      right: 0,
                      background: 'var(--card)',
                      borderRadius: 16,
                      boxShadow: '0 12px 40px rgba(0,0,0,.14)',
                      zIndex: 100,
                      border: '1.5px solid var(--card-b)',
                      padding: '20px 16px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                    <div style={{ fontSize: 14, color: 'var(--subtext)', fontWeight: 600 }}>
                      No results for "{srchQ}"
                    </div>
                  </div>
                )}
                {srchOpen && srchR.length > 0 && (
                  <div
                    id="search-results"
                    role="listbox"
                    aria-label="Search results"
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 6px)',
                      left: 0,
                      right: 0,
                      background: 'var(--card)',
                      borderRadius: 16,
                      boxShadow: '0 12px 40px rgba(0,0,0,.14)',
                      zIndex: 100,
                      maxHeight: 320,
                      overflow: 'auto',
                      border: '1.5px solid var(--card-b)',
                    }}
                  >
                    {srchR.map(function (
                      r: { hr: string; en: string; type: string; cat?: string; go: string },
                      i: number,
                    ) {
                      return (
                        <div
                          key={r.hr + ':' + r.type + ':' + i}
                          className="sr-item"
                          role="option"
                          onClick={function () {
                            setSrchOpen(false);
                            setSrchQ('');
                            if (r.type === 'vocab' && r.cat) {
                              launchPathItem({ go: 'lesson', topic: r.cat });
                            } else {
                              setScr(r.go);
                            }
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--heading)' }}>
                              {r.hr}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--subtext)', marginTop: 1 }}>
                              {r.en}
                            </div>
                          </div>
                          <span
                            style={{
                              fontSize: 10,
                              padding: '3px 9px',
                              borderRadius: 20,
                              fontWeight: 700,
                              background:
                                r.type === 'vocab'
                                  ? '#dbeafe'
                                  : r.type === 'screen'
                                    ? '#dcfce7'
                                    : '#fef9c3',
                              color:
                                r.type === 'vocab'
                                  ? '#1d4ed8'
                                  : r.type === 'screen'
                                    ? '#166534'
                                    : '#a16207',
                            }}
                          >
                            {r.type}
                          </span>
                        </div>
                      );
                    })}
                    <button
                      className="sr-close"
                      onClick={function () {
                        setSrchOpen(false);
                      }}
                      aria-label="Close search"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
              {
                // ═══ TAB: HOME ═══
                tab === 'home' && (
                  <div key="tab-home" className={tabSlideClass}>
                    <React.Suspense fallback={null}>
                      <ScreenErrorBoundary name="HomeTab">
                        <HomeTab
                          dchlA={dchlA}
                          sDchlA={sDchlA}
                          dchlSl={dchlSl}
                          sDchlSl={sDchlSl}
                          getWeekStats={getWeekStats}
                          setTab={(id: string) => {
                            const VALID_TABS: Record<string, number> = {
                              home: 1,
                              learn: 1,
                              practice: 1,
                              croatia: 1,
                              profile: 1,
                            };
                            if (VALID_TABS[id]) setTab(id);
                            else setScr(id);
                          }}
                          sCurEx={sCurEx}
                          allCats={allCats}
                          sh={_sh}
                          launchPathItem={launchPathItem}
                          launchActivity={launchSessionActivity}
                          syncReady={_syncReady}
                          onSyncNow={doSyncNow}
                          authUser={authUser}
                          comebackBonus={comebackBonus}
                          goal={localStorage.getItem('nh_goal') || 'fluent'}
                          isNewUserWindow={isNewUserWindow}
                          daysSinceJoin={daysSinceJoin}
                          resumeLesson={resumeLesson}
                          launchStory={(storyId: string) => {
                            setPendingStoryId(storyId);
                            setScr('graded_input');
                          }}
                        />
                      </ScreenErrorBoundary>
                    </React.Suspense>
                  </div>
                )
              }
              {
                // ═══ TAB: LEARN ═══
                tab === 'learn' && (
                  <div key="tab-learn" className={tabSlideClass}>
                    <React.Suspense fallback={null}>
                      <ScreenErrorBoundary name="LearnTab">
                        <LearnTab
                          allCats={allCats}
                          icons={icons}
                          sCurEx={sCurEx}
                          sh={_sh}
                          sLt={sLt}
                          sLi={sLi}
                          sLx={sLx}
                          sLs={sLs}
                          sLp={sLp}
                          sLa={sLa}
                          sLsl={sLsl}
                          sGl={sGl}
                          sGp={sGp}
                          sGx={sGx}
                          sGs={sGs}
                          sGa={sGa}
                          sGsl={sGsl}
                          launchPathItem={launchPathItem}
                          launchAnimLesson={launchAnimLesson}
                        />
                      </ScreenErrorBoundary>
                    </React.Suspense>
                  </div>
                )
              }
              {
                // ═══ TAB: PRACTICE ═══
                tab === 'practice' && (
                  <div key="tab-practice" className={tabSlideClass}>
                    <React.Suspense fallback={null}>
                      <ScreenErrorBoundary name="GradTab">
                        <GradTab
                          allCats={allCats}
                          sh={_sh}
                          sCurEx={sCurEx}
                          onLaunchQuiz={launchMcGame}
                          onLaunchFlash={launchFlashcards}
                          onLaunchListen={launchListening}
                          onLaunchMatch={launchMatch}
                          onLaunchSpeaking={launchSpeaking}
                        />
                      </ScreenErrorBoundary>
                    </React.Suspense>
                  </div>
                )
              }
              {
                // ═══ TAB: AI TUTOR ═══
                tab === 'ai' && (
                  <div key="tab-ai" className={tabSlideClass}>
                    <React.Suspense fallback={null}>
                      <ScreenErrorBoundary name="RazgovorTab">
                        <RazgovorTab setScr={setScr} sCurEx={sCurEx} />
                      </ScreenErrorBoundary>
                    </React.Suspense>
                  </div>
                )
              }
              {
                // ═══ TAB: CROATIA (Hrvatska — Phase 7b doors redesign) ═══
                tab === 'croatia' && (
                  <div key="tab-croatia" className={tabSlideClass}>
                    <React.Suspense fallback={null}>
                      <ScreenErrorBoundary name="HrvatskaTab">
                        <HrvatskaTab setScr={setScr} sCurEx={sCurEx} />
                      </ScreenErrorBoundary>
                    </React.Suspense>
                  </div>
                )
              }
              {
                // ═══ TAB: PROFILE ═══
                tab === 'profile' && (
                  <div key="tab-profile" className={tabSlideClass}>
                    <React.Suspense fallback={null}>
                      <ScreenErrorBoundary name="ProfileTab">
                        <ProfileTab
                          syncReady={_syncReady}
                          onSyncNow={doSyncNow}
                          lastSyncedAt={lastSyncedAt as number}
                          onTakeEquivalencyTest={() => setScr('equivalency')}
                          userEligible={getUserCefr(stats.xp || 0, stats.lc || 0, stats.gc || 0)}
                        />
                      </ScreenErrorBoundary>
                    </React.Suspense>
                  </div>
                )
              }
            </div>
          )
        }
        {currentScreen === 'modal' && (
          <ScreenErrorBoundary key="modal" name="modal">
            <ModalScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'history' && (
          <ScreenErrorBoundary key="history" name="history">
            <CroatiaHistoryScreen goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'events' && (
          <ScreenErrorBoundary key="events" name="events">
            <EventsCalendar goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'top100' && (
          <ScreenErrorBoundary key="top100" name="top100">
            <Top100Screen goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {
          // ═══ MULTIPLE CHOICE GAME — guard: requires mcInitQ from launch ═══
          currentScreen === 'mcgame' &&
            (mcInitQ?.length > 0 ? (
              <ScreenErrorBoundary key="mcgame" name="mcgame">
                <McGame
                  questions={mcInitQ}
                  onComplete={mcGameComplete}
                  goBack={goBack}
                  award={award}
                />
              </ScreenErrorBoundary>
            ) : (
              <ScreenGuard goBack={goBack} label="quiz" />
            ))
        }
        {currentScreen === 'mcresult' &&
          (mcResultQ?.length > 0 ? (
            <ScreenErrorBoundary key="mcresult" name="mcresult">
              <McResult
                questions={mcResultQ}
                score={mcResultScore}
                mistakes={mcMistakes}
                setScr={setScr}
                goBack={goBack}
                onNewGame={launchMcGame}
                award={award}
              />
            </ScreenErrorBoundary>
          ) : (
            <ScreenGuard goBack={goBack} label="quiz result" />
          ))}
        {currentScreen === 'padezi' && (
          <ScreenErrorBoundary key="padezi" name="padezi">
            <PadeziScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'unjumble' && (
          <ScreenErrorBoundary key="unjumble" name="unjumble">
            <Unjumble goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'idioms' && (
          <ScreenErrorBoundary key="idioms" name="idioms">
            <IdiomsScreen goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'privacy' && (
          <ScreenErrorBoundary key="privacy" name="privacy">
            <PrivacyScreen goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'terms' && (
          <ScreenErrorBoundary key="terms" name="terms">
            <TermsOfService goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'admin' && (
          <ScreenErrorBoundary key="admin" name="admin">
            <AdminDashboard authUser={authUser} goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'flashcards' &&
          (fcInitPool?.length > 0 ? (
            <ScreenErrorBoundary key="flashcards" name="flashcards">
              <Flashcards pool={fcInitPool} goBack={goBack} award={award} />
            </ScreenErrorBoundary>
          ) : (
            <ScreenGuard goBack={goBack} label="flashcard session" />
          ))}
        {currentScreen === 'listening' &&
          (lsInitQ?.length > 0 ? (
            <ScreenErrorBoundary key="listening" name="listening">
              <ListeningScreen questions={lsInitQ} goBack={goBack} award={award} />
            </ScreenErrorBoundary>
          ) : (
            <ScreenGuard goBack={goBack} label="listening exercise" />
          ))}
        {currentScreen === 'storyselect' && (
          <ScreenErrorBoundary key="storyselect" name="storyselect">
            <StoryScreens goBack={goBack} award={award} sCurEx={sCurEx} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'numtime' && (
          <ScreenErrorBoundary key="numtime" name="numtime">
            <NumTime goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'proverbs' && (
          <ScreenErrorBoundary key="proverbs" name="proverbs">
            <ProverbsScreen goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'contact' && (
          <ScreenErrorBoundary key="contact" name="contact">
            <ContactScreen
              goBack={goBack}
              authUser={authUser}
              name={name}
              level={level}
              stats={stats}
            />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'school' && (
          <ScreenErrorBoundary key="school" name="school">
            <SchoolScreen goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'texting' && (
          <ScreenErrorBoundary key="texting" name="texting">
            <TextingScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'friends' && (
          <ScreenErrorBoundary key="friends" name="friends">
            <FriendsScreen goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'foodorder' && (
          <ScreenErrorBoundary key="foodorder" name="foodorder">
            <FoodOrderScreen goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'transport' && (
          <ScreenErrorBoundary key="transport" name="transport">
            <TransportScreen goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'emergency' && (
          <ScreenErrorBoundary key="emergency" name="emergency">
            <EmergencyScreen goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'football' && (
          <ScreenErrorBoundary key="football" name="football">
            <HNLScreen goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'croatiaathletes' && (
          <ScreenErrorBoundary key="croatiaathletes" name="croatiaathletes">
            <CroatiaAthletes goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'immersion' && (
          <ScreenErrorBoundary key="immersion" name="immersion">
            <ImmersionHub goBack={goBack} setScr={setScr} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'aiconvo' && (
          <ScreenErrorBoundary key="aiconvo" name="aiconvo">
            <AIConversation goBack={goBack} setScr={setScr} sCurEx={sCurEx} setJWords={setJWords} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'popculture' && (
          <ScreenErrorBoundary key="popculture" name="popculture">
            <PopCultureScreen goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'basketball' && (
          <ScreenErrorBoundary key="basketball" name="basketball">
            <BasketballScreen goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'gym' && (
          <ScreenErrorBoundary key="gym" name="gym">
            <GymScreen goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'practical' && (
          <ScreenErrorBoundary key="practical" name="practical">
            <PracticalScreen goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'region_labin' && (
          <ScreenErrorBoundary key="region_labin" name="region_labin">
            <RegionScreen regionKey="labin" goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'region_bibinje' && (
          <ScreenErrorBoundary key="region_bibinje" name="region_bibinje">
            <RegionScreen regionKey="bibinje" goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'region_hercegovina' && (
          <ScreenErrorBoundary key="region_hercegovina" name="region_hercegovina">
            <RegionScreen regionKey="hercegovina" goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'region_vukovar' && (
          <ScreenErrorBoundary key="region_vukovar" name="region_vukovar">
            <RegionScreen regionKey="vukovar" goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'region_zagreb' && (
          <ScreenErrorBoundary key="region_zagreb" name="region_zagreb">
            <RegionScreen regionKey="zagreb" goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'region_split' && (
          <ScreenErrorBoundary key="region_split" name="region_split">
            <RegionScreen regionKey="split" goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'region_mostar' && (
          <ScreenErrorBoundary key="region_mostar" name="region_mostar">
            <RegionScreen regionKey="mostar" goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'region_tomislavgrad' && (
          <ScreenErrorBoundary key="region_tomislavgrad" name="region_tomislavgrad">
            <RegionScreen regionKey="tomislavgrad" goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'region_knin' && (
          <ScreenErrorBoundary key="region_knin" name="region_knin">
            <RegionScreen regionKey="knin" goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'cityofday' && (
          <ScreenErrorBoundary key="cityofday" name="cityofday">
            <CityOfDayScreen goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'region_vinkovci' && (
          <ScreenErrorBoundary key="region_vinkovci" name="region_vinkovci">
            <RegionScreen regionKey="vinkovci" goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'padezifull' && (
          <ScreenErrorBoundary key="padezifull" name="padezifull">
            <PadezifullScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'aspect' && (
          <ScreenErrorBoundary key="aspect" name="aspect">
            <AspectScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'grammarvideos' && (
          <ScreenErrorBoundary key="grammarvideos" name="grammarvideos">
            <GrammarVideos goBack={goBack} setScr={setScr} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'grammarexplainer' && (
          <ScreenErrorBoundary key="grammarexplainer" name="grammarexplainer">
            <GrammarExplainer goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'casetransformer' && (
          <ScreenErrorBoundary key="casetransformer" name="casetransformer">
            <CaseTransformer goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'vocabscenes' && (
          <ScreenErrorBoundary key="vocabscenes" name="vocabscenes">
            <VocabScenes goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {
          // ═══ ANIMATED LESSON ═══
          currentScreen === 'animlesson' && animLesson && (
            <ScreenErrorBoundary key="animlesson" name="animlesson">
              <AnimatedLesson lesson={animLesson} goBack={goBack} award={award} />
            </ScreenErrorBoundary>
          )
        }
        {currentScreen === 'grammarreader' && (
          <ScreenErrorBoundary key="grammarreader" name="grammarreader">
            <GrammarReader goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'falsefr' && (
          <ScreenErrorBoundary key="falsefr" name="falsefr">
            <FalseFriendsScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'prepdrill' && (
          <ScreenErrorBoundary key="prepdrill" name="prepdrill">
            <PrepDrill goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'declension' && (
          <ScreenErrorBoundary key="declension" name="declension">
            <DeclensionScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'brzalice' && (
          <ScreenErrorBoundary key="brzalice" name="brzalice">
            <BrzaliceScreen goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'dialects' && (
          <ScreenErrorBoundary key="dialects" name="dialects">
            <DialectsScreen goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'diminutives' && (
          <ScreenErrorBoundary key="diminutives" name="diminutives">
            <DiminutivesScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'wordform' && (
          <ScreenErrorBoundary key="wordform" name="wordform">
            <WordFormScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'colorquirk' && (
          <ScreenErrorBoundary key="colorquirk" name="colorquirk">
            <ColorQuirkScreen goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'svojmoj' && (
          <ScreenErrorBoundary key="svojmoj" name="svojmoj">
            <SvojMojScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'conditional' && (
          <ScreenErrorBoundary key="conditional" name="conditional">
            <ConditionalScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'formalregister' && (
          <ScreenErrorBoundary key="formalregister" name="formalregister">
            <FormalRegisterScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'impersonal' && (
          <ScreenErrorBoundary key="impersonal" name="impersonal">
            <ImpersonalScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'techvoc' && (
          <ScreenErrorBoundary key="techvoc" name="techvoc">
            <TechVocScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'bureaucratic' && (
          <ScreenErrorBoundary key="bureaucratic" name="bureaucratic">
            <BureaucraticScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'countries' && (
          <ScreenErrorBoundary key="countries" name="countries">
            <CountriesScreen goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'professions' && (
          <ScreenErrorBoundary key="professions" name="professions">
            <ProfessionsScreen goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'weather' && (
          <ScreenErrorBoundary key="weather" name="weather">
            <WeatherScreen goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'clothes' && (
          <ScreenErrorBoundary key="clothes" name="clothes">
            <ClothesScreen goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'bodydesc' && (
          <ScreenErrorBoundary key="bodydesc" name="bodydesc">
            <BodyDescScreen goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'phonology' && (
          <ScreenErrorBoundary key="phonology" name="phonology">
            <PhonologyScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'typing' && (
          <ScreenErrorBoundary key="typing" name="typing">
            <TypingScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'tenses' && (
          <ScreenErrorBoundary key="tenses" name="tenses">
            <TensesScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'crmap' && (
          <ScreenErrorBoundary key="crmap" name="crmap">
            <CrMap goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'grocery' && (
          <ScreenErrorBoundary key="grocery" name="grocery">
            <GroceryScreen goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'recipes' && (
          <ScreenErrorBoundary key="recipes" name="recipes">
            <RecipesScreen goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'roleplay' && (
          <ScreenErrorBoundary key="roleplay" name="roleplay">
            <RoleplayScreen goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'journal' && (
          <ScreenErrorBoundary key="journal" name="journal">
            <VocabJournal goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'learnpath' && (
          <ScreenErrorBoundary key="learnpath" name="learnpath">
            <LearnPath
              st={stats}
              setScr={setScr}
              goBack={goBack}
              onLaunchItem={launchPathItem}
              onLaunchLegendary={launchLegendary}
              onLaunchCheckpoint={launchCheckpoint}
            />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'levelquiz' && (
          <ScreenErrorBoundary key="levelquiz" name="levelquiz">
            <LevelQuiz
              levelNumber={(() => {
                try {
                  return (
                    JSON.parse(sessionStorage.getItem('nh_level_quiz') || '{}').levelNumber ?? 1
                  );
                } catch {
                  return 1;
                }
              })()}
              questions={(() => {
                try {
                  return (
                    JSON.parse(sessionStorage.getItem('nh_level_quiz') || '{}').questions ?? []
                  );
                } catch {
                  return [];
                }
              })()}
              goBack={goBack}
              award={award}
            />
          </ScreenErrorBoundary>
        )}
        {
          // ═══ FAVORITES ═══
          currentScreen === 'favorites' && (
            <ScreenErrorBoundary key="favorites" name="favorites">
              <FavoritesScreen favs={favs} toggleFav={toggleFav} setScr={setScr} goBack={goBack} />
            </ScreenErrorBoundary>
          )
        }
        {currentScreen === 'reflexive' && (
          <ScreenErrorBoundary key="reflexive" name="reflexive">
            <ReflexiveScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'fillstory' && (
          <ScreenErrorBoundary key="fillstory" name="fillstory">
            <FillStoryScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'convmatch' && (
          <ScreenErrorBoundary key="convmatch" name="convmatch">
            <ConvMatchScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'scenes' && (
          <ScreenErrorBoundary key="scenes" name="scenes">
            <ScenesScreen goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'pronouns' && (
          <ScreenErrorBoundary key="pronouns" name="pronouns">
            <PronounsScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'genderdrill' && (
          <ScreenErrorBoundary key="genderdrill" name="genderdrill">
            <GenderDrillScreen goBack={goBack} award={award} setSt={setStats} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'sentbuild' && (
          <ScreenErrorBoundary key="sentbuild" name="sentbuild">
            <SentenceBuilderScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'sentencetiles' && (
          <ScreenErrorBoundary key="sentencetiles" name="sentencetiles">
            <SentenceTileScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'verbdrill' && (
          <ScreenErrorBoundary key="verbdrill" name="verbdrill">
            <VerbDrillScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'tenseflip' && (
          <ScreenErrorBoundary key="tenseflip" name="tenseflip">
            <TenseFlipScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'riddles' && (
          <ScreenErrorBoundary key="riddles" name="riddles">
            <RiddlesScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'logicquiz' && (
          <ScreenErrorBoundary key="logicquiz" name="logicquiz">
            <LogicQuizScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'ordinals' && (
          <ScreenErrorBoundary key="ordinals" name="ordinals">
            <OrdinalsScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'relpron' && (
          <ScreenErrorBoundary key="relpron" name="relpron">
            <RelativePronounsScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'emogender' && (
          <ScreenErrorBoundary key="emogender" name="emogender">
            <EmotionGenderScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'opposites' && (
          <ScreenErrorBoundary key="opposites" name="opposites">
            <OppositesScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'cityloc' && (
          <ScreenErrorBoundary key="cityloc" name="cityloc">
            <CityLocativeScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'accusativedrill' && (
          <ScreenErrorBoundary key="accusativedrill" name="accusativedrill">
            <AccusativeDrill goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'coloragree' && (
          <ScreenErrorBoundary key="coloragree" name="coloragree">
            <ColorAgreementScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'possess' && (
          <ScreenErrorBoundary key="possess" name="possess">
            <PossessivesScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'qwords' && (
          <ScreenErrorBoundary key="qwords" name="qwords">
            <QuestionWordsScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'negation' && (
          <ScreenErrorBoundary key="negation" name="negation">
            <NegationScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'sibil' && (
          <ScreenErrorBoundary key="sibil" name="sibil">
            <SibilarizationScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'restaurant' && (
          <ScreenErrorBoundary key="restaurant" name="restaurant">
            <RestaurantScreen goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'profgender' && (
          <ScreenErrorBoundary key="profgender" name="profgender">
            <ProfessionGenderScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'comparatives' && (
          <ScreenErrorBoundary key="comparatives" name="comparatives">
            <ComparativesScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'future' && (
          <ScreenErrorBoundary key="future" name="future">
            <FutureTenseScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'kings' && (
          <ScreenErrorBoundary key="kings" name="kings">
            <KingsScreen goBack={goBack} award={award} setSt={setStats} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'conjdrill' && (
          <ScreenErrorBoundary key="conjdrill" name="conjdrill">
            <ConjugationDrill goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'conjlab' && (
          <ScreenErrorBoundary key="conjlab" name="conjlab">
            <ConjugationLab goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'conjpractice' && (
          <ScreenErrorBoundary key="conjpractice" name="conjpractice">
            <ConjugationSessionDrill
              category={
                (typeof _curEx === 'string' && _curEx.startsWith('conjpractice:')
                  ? _curEx.slice('conjpractice:'.length)
                  : 'present-tense') as React.ComponentProps<
                  typeof ConjugationSessionDrill
                >['category']
              }
              cefr={
                getUserCefr(stats.xp || 0, stats.lc || 0, stats.gc || 0) as
                  | 'A1'
                  | 'A2'
                  | 'B1'
                  | 'B2'
              }
              goBack={goBack}
              award={award}
            />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'znam' && (
          <ScreenErrorBoundary key="znam" name="znam">
            <ZnamGame goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'boje' && (
          <ScreenErrorBoundary key="boje" name="boje">
            <BojeGame goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'match' &&
          (matchInitPool?.length > 0 ? (
            <ScreenErrorBoundary key="match" name="match">
              <MatchGame initPool={matchInitPool} goBack={goBack} award={award} />
            </ScreenErrorBoundary>
          ) : (
            <ScreenGuard goBack={goBack} label="match game" />
          ))}
        {currentScreen === 'wordsprint' && (
          <ScreenErrorBoundary key="wordsprint" name="wordsprint">
            <WordSprint sh={_sh} award={award} goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'speaking' && (
          <ScreenErrorBoundary key="speaking" name="speaking">
            <SpeakingScreen
              sw={sw}
              si={si}
              sx={sx}
              sr={sr}
              ssc={ssc}
              sSr={sSr}
              sSx={sSx}
              sSw={sSw}
              sSsc={sSsc}
              goBack={goBack}
              award={award}
              setSt={setStats}
            />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'speaking_sprint' && (
          <ScreenErrorBoundary key="speaking_sprint" name="speaking_sprint">
            <SpeakingSprintScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'pitchaccent' && (
          <ScreenErrorBoundary key="pitchaccent" name="pitchaccent">
            <PitchAccentScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'shadowing' && (
          <ScreenErrorBoundary key="shadowing" name="shadowing">
            <ShadowingScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'review' && (
          <ScreenErrorBoundary key="review" name="review">
            <ReviewScreen goBack={goBack} award={award} allCats={allCats} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'writing' && (
          <ScreenErrorBoundary key="writing" name="writing">
            <WritingScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'listeningpath' && (
          <ScreenErrorBoundary key="listeningpath" name="listeningpath">
            <ListeningPath goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'aspectdrill' && (
          <ScreenErrorBoundary key="aspectdrill" name="aspectdrill">
            <AspectDrillScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'translate_drills' && (
          <ScreenErrorBoundary key="translate_drills" name="translate_drills">
            <TranslateDrillsScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'clitic' && (
          <ScreenErrorBoundary key="clitic" name="clitic">
            <CliticDrill goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'numcases' && (
          <ScreenErrorBoundary key="numcases" name="numcases">
            <NumbersCasesDrill goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'imperative' && (
          <ScreenErrorBoundary key="imperative" name="imperative">
            <ImperativeDrill goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'neggen' && (
          <ScreenErrorBoundary key="neggen" name="neggen">
            <NegationGenDrill goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'animateacc' && (
          <ScreenErrorBoundary key="animateacc" name="animateacc">
            <AnimateAccDrill goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'passive' && (
          <ScreenErrorBoundary key="passive" name="passive">
            <PassiveDrill goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'instrumental' && (
          <ScreenErrorBoundary key="instrumental" name="instrumental">
            <InstrumentalDrill goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'dative' && (
          <ScreenErrorBoundary key="dative" name="dative">
            <DativeDrill goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'nomdrill' && (
          <ScreenErrorBoundary key="nomdrill" name="nomdrill">
            <NominativeDrill goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'genitivedrill' && (
          <ScreenErrorBoundary key="genitivedrill" name="genitivedrill">
            <GenitiveDrill goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'locdrill' && (
          <ScreenErrorBoundary key="locdrill" name="locdrill">
            <LocativeDrill goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'fleetinga' && (
          <ScreenErrorBoundary key="fleetinga" name="fleetinga">
            <FleetingADrill goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'collocations' && (
          <ScreenErrorBoundary key="collocations" name="collocations">
            <CollocationsGame goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'wordfamilies' && (
          <ScreenErrorBoundary key="wordfamilies" name="wordfamilies">
            <WordFamilies goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'dictation' && (
          <ScreenErrorBoundary key="dictation" name="dictation">
            <DictationScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'proncontrast' && (
          <ScreenErrorBoundary key="proncontrast" name="proncontrast">
            <PronunciationContrast goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'dialogue' && (
          <ScreenErrorBoundary key="dialogue" name="dialogue">
            <DialogueSim goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'cefrtest' && (
          <ScreenErrorBoundary key="cefrtest" name="cefrtest">
            <CefrTest goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'slang' && (
          <ScreenErrorBoundary key="slang" name="slang">
            <SlangScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'baka_summer' && (
          <ScreenErrorBoundary key="baka_summer" name="baka_summer">
            <BakaSummer goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'croatia_today' && (
          <ScreenErrorBoundary key="croatia_today" name="croatia_today">
            <CroatiaToday goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'survival_dinner' && (
          <ScreenErrorBoundary key="survival_dinner" name="survival_dinner">
            <SurvivalDinner goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'kafic' && (
          <ScreenErrorBoundary key="kafic" name="kafic">
            <KaficScreen goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'diaspora' && (
          <ScreenErrorBoundary key="diaspora" name="diaspora">
            <DiasporaNote goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'tivicompare' && (
          <ScreenErrorBoundary key="tivicompare" name="tivicompare">
            <TiViScreen goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'lifeevents' && (
          <ScreenErrorBoundary key="lifeevents" name="lifeevents">
            <LifeEventsScreen goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'civic' && (
          <ScreenErrorBoundary key="civic" name="civic">
            <CivicScreen goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'easter' && (
          <ScreenErrorBoundary key="easter" name="easter">
            <EasterScreen onBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'postcard' && (
          <ScreenErrorBoundary key="postcard" name="postcard">
            <PostcardScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'storymode' && (
          <ScreenErrorBoundary key="storymode" name="storymode">
            <StoryModeScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'personas' && (
          <ScreenErrorBoundary key="personas" name="personas">
            <PersonaScreen goBack={goBack} setScr={setScr} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'maja' && (
          <ScreenErrorBoundary key="maja" name="maja">
            {isPremium ? (
              <MajaScreen goBack={goBack} award={award} />
            ) : (
              <PaywallScreen
                featureName="Maja AI Tutor"
                onClose={goBack}
                onSubscribed={() => {
                  refreshSub();
                }}
              />
            )}
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'live_tutor' && (
          <ScreenErrorBoundary key="live_tutor" name="live_tutor">
            {isPremium ? (
              <LiveTutorScreen goBack={goBack} award={award} />
            ) : (
              <PaywallScreen
                featureName="Live Tutor"
                onClose={goBack}
                onSubscribed={() => {
                  refreshSub();
                }}
              />
            )}
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'photo_vocab' && (
          <ScreenErrorBoundary key="photo_vocab" name="photo_vocab">
            <PhotoVocabScanner
              goBack={goBack}
              level={level}
              onSaveWords={(words: Array<{ hr: string; en: string }>) => {
                words.forEach((w: { hr: string; en: string }) => {
                  if (w.hr && w.en) {
                    setJWords((prev: Array<{ hr: string; en: string }> | null) => [
                      ...(prev || []),
                      { hr: w.hr, en: w.en },
                    ]);
                    addWordToSRS(w.hr);
                  }
                });
              }}
            />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'ai_listening' && (
          <ScreenErrorBoundary key="ai_listening" name="ai_listening">
            <AIListeningScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'ai_story' && (
          <ScreenErrorBoundary key="ai_story" name="ai_story">
            <AIStoryScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'video_lesson' && (
          <ScreenErrorBoundary key="video_lesson" name="video_lesson">
            <VideoLessonScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'grammar_diagnosis' && (
          <ScreenErrorBoundary key="grammar_diagnosis" name="grammar_diagnosis">
            <GrammarDiagnosisScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'micro_lesson' && (
          <ScreenErrorBoundary key="micro_lesson" name="micro_lesson">
            <MicroLessonScreen
              goBack={goBack}
              award={award}
              goFlashcards={() => {
                setTab('practice');
                setScr('dashboard');
              }}
            />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'heritage' && (
          <ScreenErrorBoundary key="heritage" name="heritage">
            <HeritageStoryScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'croatianews' && (
          <ScreenErrorBoundary key="croatianews" name="croatianews">
            <CroatianNewsScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'phraseofday' && (
          <ScreenErrorBoundary key="phraseofday" name="phraseofday">
            <PhraseOfDayScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'cloze' && (
          <ScreenErrorBoundary key="cloze" name="cloze">
            <ClozeEngine goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'graded_input' && (
          <ScreenErrorBoundary key="graded_input" name="graded_input">
            <GradedInputScreen
              goBack={() => {
                setPendingStoryId(null);
                goBack();
              }}
              award={award}
              initialStoryId={pendingStoryId ?? undefined}
            />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'pronunciation_course' && (
          <ScreenErrorBoundary key="pronunciation_course" name="pronunciation_course">
            <PronunciationCourse goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'past_tense_lesson' && (
          <ScreenErrorBoundary key="past_tense_lesson" name="past_tense_lesson">
            <PastTenseLessonScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'future_tense_lesson' && (
          <ScreenErrorBoundary key="future_tense_lesson" name="future_tense_lesson">
            <FutureTenseLessonScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'advanced_vocab' && (
          <ScreenErrorBoundary key="advanced_vocab" name="advanced_vocab">
            <AdvancedVocabScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'pronunciation_assess' && (
          <ScreenErrorBoundary key="pronunciation_assess" name="pronunciation_assess">
            <PronunciationAssessScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'production_drill' && (
          <ScreenErrorBoundary key="production_drill" name="production_drill">
            <ProductionDrillScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'adaptive_review' && (
          <ScreenErrorBoundary key="adaptive_review" name="adaptive_review">
            <AdaptiveReviewScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'pitch_accent' && (
          <ScreenErrorBoundary key="pitch_accent" name="pitch_accent">
            <PitchAccentMastery goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'vocative' && (
          <ScreenErrorBoundary key="vocative" name="vocative">
            <VocativeScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'heritage_path' && (
          <ScreenErrorBoundary key="heritage_path" name="heritage_path">
            <HeritagePathScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'dialect_awareness' && (
          <ScreenErrorBoundary key="dialect_awareness" name="dialect_awareness">
            <DialectAwarenessScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'heritage_mode' && (
          <ScreenErrorBoundary key="heritage_mode" name="heritage_mode">
            <HeritageModeScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'phoneme_practice' && (
          <ScreenErrorBoundary key="phoneme_practice" name="phoneme_practice">
            <PhonemePracticeScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'frequency_track' && (
          <ScreenErrorBoundary key="frequency_track" name="frequency_track">
            <FrequencyTrackScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'practical_croatian' && (
          <ScreenErrorBoundary key="practical_croatian" name="practical_croatian">
            <PracticalCroatianScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'grammarmap' && (
          <ScreenErrorBoundary key="grammarmap" name="grammarmap">
            <GrammarConstellation goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'grammar_track' && (
          <ScreenErrorBoundary key="grammar_track" name="grammar_track">
            <GrammarTrackScreen
              goBack={goBack}
              launchGrammarUnit={(unitId: string) => {
                setPendingGrammarUnitId(unitId);
                setScr('grammar_unit_detail');
              }}
            />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'grammar_unit_detail' && pendingGrammarUnitId && (
          <ScreenErrorBoundary key="grammar_unit_detail" name="grammar_unit_detail">
            <GrammarUnitDetail
              unitId={pendingGrammarUnitId}
              goBack={() => {
                setPendingGrammarUnitId(null);
                goBack();
              }}
            />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'listening_comprehension' && (
          <ScreenErrorBoundary key="listening_comprehension" name="listening_comprehension">
            <ListeningComprehensionScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'my_words' && (
          <ScreenErrorBoundary key="my_words" name="my_words">
            <MyWordsScreen
              onBack={goBack}
              award={typeof award === 'function' ? award : undefined}
            />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'mistakes' && (
          <ScreenErrorBoundary key="mistakes" name="mistakes">
            <MistakesScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'analytics' && (
          <ScreenErrorBoundary key="analytics" name="analytics">
            <AnalyticsScreen goBack={goBack} stats={stats} name={name} />
          </ScreenErrorBoundary>
        )}
        {
          // ═══ GRAMMAR REFERENCE ═══
          currentScreen === 'grammar-ref' && (
            <ScreenErrorBoundary key="grammar-ref" name="grammar-ref">
              <GrammarReference onClose={() => setScr('dashboard')} />
            </ScreenErrorBoundary>
          )
        }
        {
          // ═══ NEW PLACEMENT TEST (first-time users) ═══
          currentScreen === 'new-placement' && (
            <ScreenErrorBoundary key="new-placement" name="new-placement">
              <PlacementTest
                onComplete={function (level: number) {
                  localStorage.setItem('placement_done', '1');
                  // ALSO flag user as onboarded so Firebase sync persists this
                  // across devices. buildProgressSnapshot reads `onboarded` and
                  // `nh_placement_done` from localStorage and writes them into
                  // the Firebase profile; applyRemoteProgress on a new device
                  // sets localStorage from those fields, which short-circuits
                  // the App.tsx:1303 placement-trigger check. Without these two
                  // writes, a user who completed placement on device A would be
                  // re-prompted on device B until Firebase MERGE_REMOTE happened
                  // to land xp > 0 before the 1200ms placement timer fired.
                  localStorage.setItem('nh_placement_done', 'true');
                  localStorage.setItem('onboarded', 'true');
                  setStats(function (prev) {
                    return {
                      ...prev,
                      ct: getPlacementCt(level),
                      lc: Math.max(prev.lc, getPlacementCt(level).length),
                    };
                  });
                  if (typeof award === 'function') award(25);
                  setShowFirstWords(true);
                  setTimeout(() => setTab('learn'), 300);
                }}
                onCancel={function () {
                  setScr('dashboard');
                }}
              />
            </ScreenErrorBoundary>
          )
        }
        {
          // ═══ VOCABULARY LESSON ═══
          currentScreen === 'lesson' && (
            <ScreenErrorBoundary key="lesson" name="lesson">
              <LessonScreen
                lt={lt}
                li={li}
                lx={lx}
                ls={ls}
                lp={lp}
                la={la}
                lsl={lsl}
                qi={qi}
                icons={icons}
                sLi={sLi}
                sLx={sLx}
                sLs={sLs}
                sLp={sLp}
                sLa={sLa}
                sLsl={sLsl}
                sQi={sQi}
                goBack={goBack}
                award={award}
                setSt={setStats}
                setScr={setScr}
                goToPractice={() => {
                  goBack();
                  setTimeout(() => setTab('practice'), 50);
                }}
              />
            </ScreenErrorBoundary>
          )
        }
        {
          // ═══ GRAMMAR ═══
          currentScreen === 'grammar' && (
            <ScreenErrorBoundary key="grammar" name="grammar">
              <GrammarScreen
                gl={gl}
                gp={gp}
                gx={gx}
                gs={gs}
                ga={ga}
                gsl={gsl}
                sGp={sGp}
                sGx={sGx}
                sGs={sGs}
                sGa={sGa}
                sGsl={sGsl}
                goBack={goBack}
                award={award}
                setSt={setStats}
              />
            </ScreenErrorBoundary>
          )
        }
        {currentScreen === 'alphabet' && (
          <ScreenErrorBoundary key="alphabet" name="alphabet">
            <AlphabetScreen goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {
          // ═══ READING LIST ═══
          currentScreen === 'readlist' && (
            <ScreenErrorBoundary key="readlist" name="readlist">
              <ReadingList
                setScr={setScr}
                sRp={sRp}
                sRph={sRph}
                sRqi={sRqi}
                sRsc={sRsc}
                sRa={sRa}
                sRsl={sRsl}
                sHw={sHw}
                sCurEx={sCurEx}
                goBack={goBack}
              />
            </ScreenErrorBoundary>
          )
        }
        {
          // ═══ READING ═══
          currentScreen === 'reading' && (
            <ScreenErrorBoundary key="reading" name="reading">
              <ReadingScreen
                rp={rp}
                rph={rph}
                rqi={rqi}
                rsc={rsc}
                ra={ra}
                rsl={rsl}
                hw={hw}
                sRph={sRph}
                sRqi={sRqi}
                sRsc={sRsc}
                sRa={sRa}
                sRsl={sRsl}
                sHw={sHw}
                goBack={goBack}
                setScr={setScr}
                award={award}
                setSt={setStats}
              />
            </ScreenErrorBoundary>
          )
        }
        {currentScreen === 'badges' && (
          <ScreenErrorBoundary key="badges" name="badges">
            <BadgesScreen badges={stats.badges} stats={stats} goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {
          // ═══ PROFILE ═══
          currentScreen === 'profile' && (
            <ScreenErrorBoundary key="profile" name="profile">
              <ProfileScreen
                name={name}
                level={level}
                st={stats}
                authUser={authUser}
                goBack={goBack}
                doOut={doOut}
                setScr={setScr}
              />
            </ScreenErrorBoundary>
          )
        }
        {currentScreen === 'certificate' && (
          <ScreenErrorBoundary key="certificate" name="certificate">
            <CertificateScreen name={name} level={level} st={stats} goBack={goBack} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'arcade' && (
          <ScreenErrorBoundary key="arcade" name="arcade">
            <ArcadeHub
              goBack={goBack}
              onLaunch={(modeId: string) => {
                // Set curEx to the mode id so award() keys its once-per-day XP
                // cooldown on the game itself — not a stale exercise id, which
                // would drop the ride's XP or poison another exercise's cooldown.
                sCurEx(modeId);
                setScr(modeId);
              }}
            />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'alka' && (
          <ScreenErrorBoundary key="alka" name="alka">
            <AlkaScreen goBack={goBack} award={award} />
          </ScreenErrorBoundary>
        )}
        {currentScreen === 'map' && (
          <ScreenErrorBoundary key="map" name="map">
            <MapScreen goBack={goBack} />
          </ScreenErrorBoundary>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
