/**
 * useErrorTracking — Persistent grammar/lesson error tracking
 *
 * Stores a rolling log of errors in localStorage keyed by uid.
 * Shape: [{ type, context, ts }] — capped at MAX_ENTRIES (200).
 *
 * Error types:
 *   'case_error'     — Wrong grammatical case used
 *   'aspect_error'   — Wrong verb aspect (perfective vs imperfective)
 *   'vocab_miss'     — Vocabulary item answered incorrectly
 *   'gender_error'   — Wrong noun gender
 *   'pronunciation'  — Low pronunciation score recorded
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

// ── Constants ────────────────────────────────────────────────────────────────
const STORAGE_KEY = (uid) => `nh_errors_${uid}`;
const MAX_ENTRIES = 200;
const RECENT_LIMIT = 50;

// ── Internal helpers ─────────────────────────────────────────────────────────
function _load(uid) {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY(uid)) || '[]') || [];
  } catch {
    return [];
  }
}

function _save(uid, entries) {
  try {
    localStorage.setItem(STORAGE_KEY(uid), JSON.stringify(entries));
  } catch {}
}

// ── Public utilities ─────────────────────────────────────────────────────────

/**
 * Record a new error entry for a user.
 * @param {string} uid
 * @param {'case_error'|'aspect_error'|'vocab_miss'|'gender_error'|'pronunciation'} type
 * @param {string} [context] - optional extra info (e.g. the word, the sentence)
 */
export function recordError(uid, type, context = '') {
  if (!uid || !type) return;
  try {
    const entries = _load(uid);
    const entry = { type, context, ts: new Date().toISOString() };
    const updated = [entry, ...entries].slice(0, MAX_ENTRIES);
    _save(uid, updated);
    // Notify any active hooks
    window.dispatchEvent(new CustomEvent('nh:error-recorded', { detail: { uid } }));
  } catch {}
}

/**
 * Returns the last RECENT_LIMIT (50) error entries, newest first.
 * @param {string} uid
 * @returns {{ type: string, context: string, ts: string }[]}
 */
export function getErrorLog(uid) {
  if (!uid) return [];
  try {
    return _load(uid).slice(0, RECENT_LIMIT);
  } catch {
    return [];
  }
}

/**
 * Aggregate errors by type and return sorted by count descending.
 * @param {string} uid
 * @returns {{ type: string, count: number, lastSeen: string }[]}
 */
export function getWeakAreas(uid) {
  if (!uid) return [];
  try {
    const entries = _load(uid);
    if (entries.length === 0) return [];

    const map = {};
    for (const entry of entries) {
      if (!map[entry.type]) {
        map[entry.type] = { type: entry.type, count: 0, lastSeen: entry.ts };
      }
      map[entry.type].count += 1;
      // entries are newest-first, so first occurrence of this type is most recent
      map[entry.type].lastSeen = entry.ts;
    }

    return Object.values(map).sort((a, b) => b.count - a.count);
  } catch {
    return [];
  }
}

/**
 * Wipe all error data for a user.
 * @param {string} uid
 */
export function clearErrorLog(uid) {
  if (!uid) return;
  try {
    localStorage.removeItem(STORAGE_KEY(uid));
    window.dispatchEvent(new CustomEvent('nh:error-recorded', { detail: { uid } }));
  } catch {}
}

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * React hook that subscribes to error log changes for a given uid.
 * Returns live errorCount, memoized weakAreas, and a bound recordError helper.
 *
 * @param {string} uid
 * @returns {{ errorCount: number, weakAreas: { type: string, count: number, lastSeen: string }[], recordError: (type: string, context?: string) => void }}
 */
export function useErrorTracking(uid) {
  const [tick, setTick] = useState(0);

  // Re-render when an error is recorded
  const handleErrorRecorded = useCallback((e) => {
    if (!e.detail || e.detail.uid === uid) {
      setTick(t => t + 1);
    }
  }, [uid]);

  useEffect(() => {
    window.addEventListener('nh:error-recorded', handleErrorRecorded);
    return () => {
      window.removeEventListener('nh:error-recorded', handleErrorRecorded);
    };
  }, [handleErrorRecorded]);

  const errorCount = useMemo(() => {
    if (!uid) return 0;
    try { return _load(uid).length; } catch { return 0; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, tick]);

  const weakAreas = useMemo(() => {
    return getWeakAreas(uid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, tick]);

  const boundRecordError = useCallback((type, context = '') => {
    recordError(uid, type, context);
  }, [uid]);

  return { errorCount, weakAreas, recordError: boundRecordError };
}
