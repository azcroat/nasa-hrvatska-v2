/**
 * AppContext — thin context layer (S1-2)
 *
 * App.jsx owns all state. This context makes shared state available
 * via useApp() so future components don't need deep prop drilling.
 *
 * Current components still receive props as before — migration to
 * useApp() can happen incrementally per component.
 */
import { createContext, useContext } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AppContext = createContext<any>(null);

/**
 * useApp() — access shared app state anywhere below AppContext.Provider.
 *
 * Available values (provided by App.jsx):
 *   Navigation    : currentScreen, setScr, goBack, tab, setTab
 *   Auth          : authScreen, au/authUser, name, setName, doOut
 *   Stats         : st/stats, setStats, level, award, sCurEx
 *   Prefs         : darkMode, setDarkMode, favs, toggleFav, isFav
 *   Journal       : jWords, setJWords
 *   Subscription  : isPremium, refreshSub, requirePremium
 *   Search        : srchQ, setSrchQ, srchR, srchOpen, setSrchOpen, doSearch
 *   Translator    : tDir, sTDir, tIn, sTIn, tOut, tL, doTr
 *   Daily         : dchlA, sDchlA, dchlSl, sDchlSl
 *   Launchers     : resumeLesson, launchPathItem, launchAnimLesson,
 *                   launchMcGame, mcGameComplete, launchFlashcards,
 *                   launchListening, launchMatch, launchSpeaking,
 *                   launchLegendary, launchCheckpoint
 *   Sync          : _syncReady, doSyncNow
 *   Misc          : icons, allCats, getWeekStats,
 *                   isNewUserWindow, daysSinceJoin, comebackBonus, weeklyXP
 */
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppContext.Provider (App.jsx render)');
  return ctx;
}

export default AppContext;
