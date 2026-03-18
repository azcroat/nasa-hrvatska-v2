/**
 * usePreferences — user preferences state (dark mode, favourites)
 *
 * Extracted from App.jsx so the 4 related state vars and their
 * business logic live in one place. App.jsx imports and spreads
 * the returned values into its render and context.
 */
import { useState } from 'react';

export function usePreferences() {
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('darkMode') === 'true'
  );

  const [favs, setFavs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('uFavs') || '[]'); }
    catch { return []; }
  });

  function toggleFav(item) {
    const key = item.hr || item.name;
    const exists = favs.some(f => (f.hr || f.name) === key);
    const next = exists
      ? favs.filter(f => (f.hr || f.name) !== key)
      : [{ hr: item.hr, en: item.en, type: item.type || 'custom', go: item.go }, ...favs];
    setFavs(next);
    localStorage.setItem('uFavs', JSON.stringify(next));
  }

  function isFav(key) {
    return favs.some(f => (f.hr || f.name) === key);
  }

  return { darkMode, setDarkMode, favs, setFavs, toggleFav, isFav };
}
