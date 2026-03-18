/**
 * useJournal — vocabulary journal state.
 * Initialised from localStorage on mount. Extracted from App.jsx.
 */
import { useState } from 'react';

export function useJournal() {
  const [jWords, setJWords] = useState(() => {
    try { return JSON.parse(localStorage.getItem('uJournal') || '[]'); }
    catch { return []; }
  });
  const [jIn, setJIn] = useState('');   // Croatian input
  const [jEn, setJEn] = useState('');   // English input

  return { jWords, setJWords, jIn, setJIn, jEn, setJEn };
}
