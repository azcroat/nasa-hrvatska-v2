/**
 * useTranslator — inline Croatian ↔ English translation state and handler.
 * Proxies through /api/translate (Cloudflare Worker) to avoid CSP issues.
 */
import { useState, useRef } from 'react';

export function useTranslator() {
  const [tDir, setTDir] = useState('en-hr');   // translation direction
  const [tIn, setTIn] = useState('');           // input text
  const [tOut, setTOut] = useState('');         // translated output
  const [tL, setTL] = useState(false);          // loading flag
  const abortRef = useRef(null);

  async function doTr() {
    const t = tIn.trim();
    if (!t) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setTL(true); setTOut('');
    const [from, to] = tDir === 'en-hr' ? ['en', 'hr'] : ['hr', 'en'];
    try {
      const r = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: t, from, to }),
        signal: controller.signal,
      });
      const d = await r.json();
      if (d.translation) {
        setTOut(d.translation);
      } else if (d.error === 'rate_limit' || r.status === 429) {
        setTOut('Daily translation limit reached. Try again tomorrow or visit translate.google.com');
      } else {
        setTOut('Translation unavailable. Try translate.google.com');
      }
    } catch (e) {
      if (e.name === 'AbortError') return;
      setTOut('Translation unavailable. Try translate.google.com');
    }
    setTL(false);
  }

  return { tDir, setTDir, tIn, setTIn, tOut, setTOut, tL, doTr };
}
