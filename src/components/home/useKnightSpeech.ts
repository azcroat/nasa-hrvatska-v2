import { useState, useEffect, useRef } from 'react';
import type { Stats } from '../../types';
import { useTranslator } from '../../hooks/useTranslator';
import { getKnightGreeting } from './heroHelpers';
import { CONTEXTUAL_POOL } from './heroData';

/**
 * Knight-speech state for HeroSection — extracted as part of the 1c decomposition.
 * Owns the greeting bubble (initialised from getKnightGreeting + reacting to the
 * global `knight:celebrate` event), the translate panel + translator, and the
 * quick-reply pool pickers. Behavior-identical to the prior inline block; the
 * greeting init keeps the exact lazy-useState form so its inferred type is
 * unchanged.
 */
type LastPickCategory = 'grammar' | 'culture' | 'motivate';

export function useKnightSpeech(init: {
  st: Stats;
  streakCount: number;
  level: number;
  practicedToday: boolean;
}) {
  const [greeting, setGreeting] = useState(() =>
    getKnightGreeting(init.st, init.streakCount, init.level, init.practicedToday),
  );
  const [showTranslate, setShowTranslate] = useState(false);
  const { tDir, setTDir, tIn, setTIn, tOut, setTOut, tL, doTr } = useTranslator();
  const poolIdxRef = useRef(-1);
  const lastPickRef = useRef<Record<LastPickCategory, number>>({
    grammar: -1,
    culture: -1,
    motivate: -1,
  });

  // Listen for knight:celebrate events (big XP awards from anywhere in the app)
  useEffect(() => {
    const onCelebrate = (e: Event) => {
      const d = (e as CustomEvent<{ mood?: string; text?: string }>).detail || {};
      if (d.text) setGreeting({ mood: d.mood || 'celebrating', text: d.text });
    };
    window.addEventListener('knight:celebrate', onCelebrate);
    return () => window.removeEventListener('knight:celebrate', onCelebrate);
  }, []);

  function pickPool<T>(pool: T[], category: LastPickCategory): T {
    let idx: number;
    do {
      idx = Math.floor(Math.random() * pool.length);
    } while (idx === lastPickRef.current[category] && pool.length > 1);
    lastPickRef.current[category] = idx;
    return pool[idx]!;
  }

  const cycleBubble = () => {
    poolIdxRef.current = (poolIdxRef.current + 1) % CONTEXTUAL_POOL.length;
    if (CONTEXTUAL_POOL[poolIdxRef.current]) setGreeting(CONTEXTUAL_POOL[poolIdxRef.current]!);
  };

  return {
    greeting,
    setGreeting,
    showTranslate,
    setShowTranslate,
    tDir,
    setTDir,
    tIn,
    setTIn,
    tOut,
    setTOut,
    tL,
    doTr,
    pickPool,
    cycleBubble,
  };
}

export type KnightSpeech = ReturnType<typeof useKnightSpeech>;
