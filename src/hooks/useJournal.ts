/**
 * useJournal — vocabulary journal state.
 * Initialised from localStorage on mount. Extracted from App.jsx.
 */
import { useState } from 'react';

export interface JournalWord {
  hr: string;
  en: string;
}

export function useJournal(): {
  jWords: JournalWord[];
  setJWords: React.Dispatch<React.SetStateAction<JournalWord[]>>;
  jIn: string;
  setJIn: React.Dispatch<React.SetStateAction<string>>;
  jEn: string;
  setJEn: React.Dispatch<React.SetStateAction<string>>;
} {
  const [jWords, setJWords] = useState<JournalWord[]>(() => {
    try { return JSON.parse(localStorage.getItem('uJournal') || '[]') as JournalWord[]; }
    catch { return []; }
  });
  const [jIn, setJIn] = useState('');   // Croatian input
  const [jEn, setJEn] = useState('');   // English input

  return { jWords, setJWords, jIn, setJIn, jEn, setJEn };
}
