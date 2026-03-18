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

const AppContext = createContext(null);

/**
 * useApp() — access shared app state anywhere below AppContext.Provider.
 *
 * Available values (provided by App.jsx):
 *   Navigation : setScr, goBack, tab, setTab
 *   Auth       : authScreen, au (authUser), name, setName, doOut
 *   Stats      : st (stats), setSt, level, award
 *   Prefs      : darkMode, setDarkMode, favs, toggleFav, isFav
 *   Journal    : jWords, setJWords
 *   Family     : famData, setFamData
 */
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppContext.Provider (App.jsx render)');
  return ctx;
}

export default AppContext;
