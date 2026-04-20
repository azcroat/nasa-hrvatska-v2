/**
 * usePreferences — user preferences state (dark mode, favourites)
 *
 * Extracted from App.jsx so the 4 related state vars and their
 * business logic live in one place. App.jsx imports and spreads
 * the returned values into its render and context.
 */
import { useState, useEffect } from 'react';
import type { MutableRefObject } from 'react';
import { fbToggleFavorite } from '../lib/firebase.js';

export interface FavItem {
  hr?: string;
  en?: string;
  name?: string;
  type?: string;
  go?: string;
}

export function usePreferences(uidRef?: MutableRefObject<string | null | undefined>): {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  favs: FavItem[];
  setFavs: React.Dispatch<React.SetStateAction<FavItem[]>>;
  toggleFav: (item: FavItem) => void;
  isFav: (key: string) => boolean;
} {
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('darkMode');
    // If the user has never set a preference, auto-detect from system
    if (stored === null) {
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    }
    return stored === 'true';
  });

  // Follow system preference changes in real-time, but only when the user
  // has never explicitly set a preference (localStorage key absent)
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return undefined;
    const handler = (e: MediaQueryListEvent): void => {
      if (localStorage.getItem('nh_dm_explicit') !== '1') {
        setDarkMode(e.matches);
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('darkMode', darkMode ? 'true' : 'false');
  }, [darkMode]);

  // Wrap setDarkMode to record that the user explicitly made a choice
  const setDarkModeExplicit = (val: boolean): void => {
    localStorage.setItem('nh_dm_explicit', '1');
    setDarkMode(val);
  };

  // Initialise font-size and reduce-motion accessibility settings on app load
  useEffect(() => {
    const fs = localStorage.getItem('nh_font_size') || 'medium';
    if (fs === 'medium') {
      document.documentElement.removeAttribute('data-font');
    } else {
      document.documentElement.setAttribute('data-font', fs);
    }
    const rm = localStorage.getItem('nh_reduce_motion') === 'true';
    document.documentElement.classList.toggle('reduce-motion', rm);
  }, []);

  const [favs, setFavs] = useState<FavItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('uFavs') || '[]') as FavItem[];
    } catch {
      return [];
    }
  });

  function toggleFav(item: FavItem): void {
    const key = item.hr || item.name;
    const exists = favs.some((f) => (f.hr || f.name) === key);
    const next = exists
      ? favs.filter((f) => (f.hr || f.name) !== key)
      : [{ hr: item.hr, en: item.en, type: item.type || 'custom', go: item.go }, ...favs];
    setFavs(next);
    localStorage.setItem('uFavs', JSON.stringify(next));
    // Immediate Firestore write so this toggle isn't lost if the user closes the app before autosave.
    const uid = uidRef?.current;
    if (uid) fbToggleFavorite(uid, next).catch(() => {});
  }

  function isFav(key: string): boolean {
    return favs.some((f) => (f.hr || f.name) === key);
  }

  return { darkMode, setDarkMode: setDarkModeExplicit, favs, setFavs, toggleFav, isFav };
}
