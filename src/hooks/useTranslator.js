/**
 * useTranslator — inline Croatian ↔ English translation state and handler.
 * Uses the MyMemory API (free, no key required). Extracted from App.jsx.
 */
import { useState } from 'react';

export function useTranslator() {
  const [tDir, setTDir] = useState('en-hr');   // translation direction
  const [tIn, setTIn] = useState('');           // input text
  const [tOut, setTOut] = useState('');         // translated output
  const [tL, setTL] = useState(false);          // loading flag

  async function doTr() {
    const t = tIn.trim();
    if (!t) return;
    setTL(true); setTOut('');
    const [src, tgt] = tDir === 'en-hr' ? ['en', 'hr'] : ['hr', 'en'];
    try {
      const r = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(t)}&langpair=${src}|${tgt}`
      );
      const d = await r.json();
      if (d.responseStatus === 200 && d.responseData?.translatedText) {
        setTOut(d.responseData.translatedText);
      } else if (d.responseStatus === 429 || String(d.responseDetails || '').toLowerCase().includes('limit')) {
        setTOut('Daily translation limit reached. Try again tomorrow or visit translate.google.com');
      } else {
        setTOut('Translation unavailable. Try translate.google.com');
      }
    } catch (e) { setTOut('Network error — check your connection.'); }
    setTL(false);
  }

  return { tDir, setTDir, tIn, setTIn, tOut, setTOut, tL, doTr };
}
