/**
 * useConversationMemory — Persistent conversation history for Maja.
 *
 * Stores compact session summaries in Firestore:
 *   users/{uid}/conversationMemory/{timestamp}
 *
 * Each session document contains:
 *   ts        — Unix timestamp (ms), used for ordering + doc ID
 *   level     — CEFR level (A1/A2/B1/B2)
 *   scenario  — Scenario title (e.g. "Naručivanje kave")
 *   score     — Evaluation score 0–100
 *   struggles — String array of grammar weakness types (max 4)
 *   vocab     — Croatian words encountered this session (max 6)
 *   turns     — Number of conversation turns
 *
 * buildMemorySummary() formats these into a block that is injected into
 * Maja's system prompt so she can reference past sessions naturally.
 */

import { useRef, useCallback } from 'react';
import { collection, query, orderBy, limit, getDocs, doc, setDoc } from 'firebase/firestore';
import { getDb } from '../lib/firebase.ts';

const MAX_MEMORIES = 5; // sessions to load per conversation
const MAX_MEMORY_AGE_MS = 30 * 24 * 60 * 60 * 1000; // ignore sessions older than 30 days

// ── Formatting helpers ────────────────────────────────────────────────────────

function relativeTime(ts) {
  const diff = Date.now() - ts;
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return '1 week ago';
  if (weeks < 5) return `${weeks} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

/**
 * Format an array of memory objects into a string for Maja's system prompt.
 * Returns null when there are no memories (skipped in prompt injection).
 */
export function buildMemorySummary(memories) {
  if (!memories || memories.length === 0) return null;

  const lines = memories.map((m) => {
    const when = relativeTime(m.ts);
    const struggles = m.struggles?.length
      ? `Struggles: ${m.struggles.slice(0, 3).join(', ')}.`
      : 'No major errors.';
    const vocab = m.vocab?.length ? ` Vocab practiced: ${m.vocab.slice(0, 5).join(', ')}.` : '';
    return `[${when}] "${m.scenario}" · ${m.level} · Score ${m.score}/100 · ${struggles}${vocab}`;
  });

  return [
    "MAJA'S MEMORY — This learner's previous sessions (newest first):",
    ...lines,
    '',
    'Use this memory naturally: warmly reference past sessions when relevant ' +
      '("Prošli put smo vježbali..."), build on vocabulary they already know, ' +
      'and find organic moments to practise their documented weak areas within ' +
      "this scenario. Don't lecture — weave it into the conversation.",
  ].join('\n');
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export default function useConversationMemory() {
  const memoriesRef = useRef([]); // in-memory cache of loaded sessions
  const loadedRef = useRef(false); // true after first successful Firestore read

  /**
   * loadMemories(uid) — fetch the last MAX_MEMORIES sessions from Firestore.
   * Safe to call multiple times; returns cached result on subsequent calls.
   * Returns { memories: Array, summary: string|null }.
   * Guest users (uid === null/undefined) receive empty result silently.
   */
  const loadMemories = useCallback(async (uid) => {
    if (!uid) return { memories: [], summary: null };

    // Return cached result if we already loaded this session
    if (loadedRef.current) {
      return {
        memories: memoriesRef.current,
        summary: buildMemorySummary(memoriesRef.current),
      };
    }

    try {
      const db = getDb();
      if (!db) return { memories: [], summary: null };

      const col = collection(db, 'users', uid, 'conversationMemory');
      const q = query(col, orderBy('ts', 'desc'), limit(MAX_MEMORIES));
      const snap = await getDocs(q);

      const cutoff = Date.now() - MAX_MEMORY_AGE_MS;
      const mems = snap.docs
        .map((d) => d.data())
        .filter((m) => typeof m.ts === 'number' && m.ts > cutoff);

      memoriesRef.current = mems;
      loadedRef.current = true;

      return { memories: mems, summary: buildMemorySummary(mems) };
    } catch (e) {
      // Firestore unavailable (e.g. offline at session start) — proceed without memory
      console.warn('[Memory] load failed:', e?.message || e);
      return { memories: [], summary: null };
    }
  }, []);

  /**
   * saveMemory(uid, sessionData) — write a session summary to Firestore.
   * Fire-and-forget: never throws, never blocks the UI.
   *
   * sessionData: { level, scenario, score, struggles[], vocab[], turns }
   */
  const saveMemory = useCallback(async (uid, sessionData) => {
    if (!uid) return;
    try {
      const db = getDb();
      if (!db) return;

      const { level, scenario, score, struggles, vocab, turns } = sessionData;
      const ts = Date.now();

      const memory = {
        ts,
        level: typeof level === 'string' ? level.slice(0, 4) : 'B1',
        scenario: typeof scenario === 'string' ? scenario.slice(0, 80) : 'Free conversation',
        score: typeof score === 'number' ? Math.round(Math.max(0, Math.min(100, score))) : 0,
        struggles: Array.isArray(struggles)
          ? struggles.slice(0, 4).map((s) => String(s).slice(0, 50))
          : [],
        vocab: Array.isArray(vocab) ? vocab.slice(0, 6).map((v) => String(v).slice(0, 30)) : [],
        turns: typeof turns === 'number' ? Math.max(0, turns) : 0,
      };

      // Use timestamp string as doc ID: simple, unique per user, sortable
      const docRef = doc(collection(db, 'users', uid, 'conversationMemory'), String(ts));
      await setDoc(docRef, memory);

      // Update in-memory cache so subsequent loadMemories() calls see the new entry
      memoriesRef.current = [memory, ...memoriesRef.current].slice(0, MAX_MEMORIES);
    } catch (e) {
      // Never surface memory save errors to the user — they're completely non-critical
      console.warn('[Memory] save failed:', e?.message || e);
    }
  }, []);

  /**
   * reset() — clears the cache, forcing a fresh Firestore read on next loadMemories().
   * Call this when the user signs out.
   */
  const reset = useCallback(() => {
    memoriesRef.current = [];
    loadedRef.current = false;
  }, []);

  return { loadMemories, saveMemory, reset };
}
